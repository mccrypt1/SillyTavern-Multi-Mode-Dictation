"""
STT Server
==========
A small local, OpenAI-compatible Speech-to-Text server (CPU-based).
Backend: faster-whisper.

It exposes the SillyTavern-Extras-compatible endpoint used by the
Multi-Mode Dictation extension:
    POST /api/speech-recognition/whisper/process-audio   -> { "transcript": "..." }
plus OpenAI-style /v1/audio/transcriptions and a /health check.

See ../docs/SETUP.md for the full setup guide.
"""

import logging
import os
import tempfile
import time
from logging.handlers import RotatingFileHandler
from pathlib import Path

import uvicorn
import yaml
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from faster_whisper import WhisperModel

# Optional: load a .env if python-dotenv is installed (not required).
try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover
    def load_dotenv(*_a, **_k):
        return False

# -- Global state --------------------------------------------------------------
_server_start_time: float = time.time()
_transcriptions_total: int = 0
_model: WhisperModel | None = None
_config: dict = {}
_logger: logging.Logger | None = None


# -- Configuration -------------------------------------------------------------

def load_config(path: str) -> dict:
    """Load config.yaml; a few ENV vars can override individual values."""
    load_dotenv()
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    if port := os.getenv("STT_PORT"):
        cfg["server"]["port"] = int(port)
    if language := os.getenv("STT_LANGUAGE"):
        cfg["model"]["language"] = language
    if threads := os.getenv("STT_THREADS"):
        cfg["model"]["cpu_threads"] = int(threads)
    if model_name := os.getenv("STT_MODEL"):
        cfg["model"]["name"] = model_name

    return cfg


# -- Logging -------------------------------------------------------------------

def setup_logging(log_dir: Path, level: str, max_bytes: int, backup_count: int) -> logging.Logger:
    """Rotating file + console handler."""
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "stt_server.log"

    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )

    file_handler = RotatingFileHandler(
        log_file, maxBytes=max_bytes, backupCount=backup_count, encoding="utf-8"
    )
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    logger = logging.getLogger("stt_server")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


# -- Model ---------------------------------------------------------------------

def init_model(model_name: str, threads: int, compute_type: str) -> WhisperModel:
    """
    Load faster-whisper on CPU.

    `model_name` can be a size shorthand (tiny, base, small, medium, large-v3)
    that downloads automatically on first run, or a local path / HuggingFace id.
    """
    _logger.info(f"Loading model: {model_name} (downloads on first run if it is a name)")
    load_start = time.time()
    model = WhisperModel(
        model_name,
        device="cpu",
        compute_type=compute_type,
        cpu_threads=threads,
    )
    took = time.time() - load_start
    _logger.info(f"Model loaded in {took:.1f}s | threads: {threads} | compute: {compute_type}")
    return model


def warmup(model: WhisperModel, language: str) -> None:
    """One-off warmup with 1s of silence so the first real request has no extra latency."""
    import wave
    import array
    _logger.info("Running warmup transcription ...")
    tmp_path = None
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name
        with wave.open(tmp_path, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(16000)
            silence = array.array("h", [0] * 16000)
            wf.writeframes(silence.tobytes())
    try:
        segments, _ = model.transcribe(tmp_path, language=language, beam_size=1, vad_filter=False)
        list(segments)
        _logger.info("Warmup done.")
    except Exception as e:
        _logger.warning(f"Warmup failed (not critical): {e}")
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


# -- FastAPI app ---------------------------------------------------------------

app = FastAPI(
    title="STT Server",
    description="Local OpenAI-compatible Speech-to-Text server (faster-whisper, CPU)",
    version="1.0.0",
)

# The server binds to localhost only, so allowing any local origin keeps setup
# simple (SillyTavern may run on various ports).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# -- Endpoints -----------------------------------------------------------------

@app.get("/health")
def health():
    """Status check."""
    uptime = round(time.time() - _server_start_time, 1)
    return {
        "status": "ok",
        "model": _config.get("model", {}).get("name", "unknown"),
        "language": _config.get("model", {}).get("language", "en"),
        "uptime_s": uptime,
        "transcriptions_total": _transcriptions_total,
    }


def _transcribe(audio_bytes: bytes, filename: str, language: str, prompt: str | None) -> str:
    """Blocking function; called via run_in_threadpool()."""
    global _transcriptions_total

    file_kb = len(audio_bytes) / 1024
    t_start = time.time()
    tmp_path = None

    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        vad_cfg = _config.get("vad", {})
        vad_on = vad_cfg.get("enabled", True)
        vad_params = {"min_silence_duration_ms": vad_cfg.get("min_silence_duration_ms", 500)}

        kwargs = dict(
            language=language,
            beam_size=_config.get("model", {}).get("beam_size", 5),
            vad_filter=vad_on,
            vad_parameters=vad_params if vad_on else {},
        )
        if prompt:
            kwargs["initial_prompt"] = prompt

        segments, info = _model.transcribe(tmp_path, **kwargs)
        text = " ".join(seg.text.strip() for seg in segments).strip()

        took = time.time() - t_start
        audio_len = info.duration if info.duration else 0
        rtf = took / audio_len if audio_len > 0 else 0.0

        _transcriptions_total += 1
        _logger.info(
            f"Transcription #{_transcriptions_total} | "
            f"file: {filename} ({file_kb:.1f} KB) | "
            f"audio: {audio_len:.1f}s | inference: {took:.2f}s | RTF: {rtf:.2f}x | "
            f"text: '{text[:80]}{'...' if len(text) > 80 else ''}'"
        )
        return text

    except Exception as e:
        _logger.error(f"Transcription error ({filename}): {e}")
        raise
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


@app.get("/api/modules")
def extras_modules():
    """SillyTavern checks this before using Extras modules. Reports 'whisper' as active."""
    return {"modules": ["whisper"]}


@app.post("/api/whisper")
async def extras_whisper(file: UploadFile = File(...)):
    """SillyTavern-Extras-compatible Whisper endpoint."""
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file received.")

    language = _config.get("model", {}).get("language", "en")
    try:
        text = await run_in_threadpool(_transcribe, audio_bytes, file.filename or "audio.wav", language, None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    return {"transcript": text}


@app.post("/api/transcribe")
async def extras_transcribe(file: UploadFile = File(...)):
    """Alias for /api/whisper (compatibility)."""
    return await extras_whisper(file)


@app.post("/api/speech-recognition/whisper/process-audio")
async def extras_process_audio(request: Request):
    """
    Newer SillyTavern-Extras endpoint (ST 1.12+). This is the one the
    Multi-Mode Dictation extension calls by default. Accepts any field name
    for the audio file.
    """
    form = await request.form()

    audio_upload = None
    for _key, value in form.multi_items():
        if hasattr(value, "read"):
            audio_upload = value
            break

    if audio_upload is None:
        raise HTTPException(status_code=400, detail="No audio upload found.")

    audio_bytes = await audio_upload.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file received.")

    language = _config.get("model", {}).get("language", "en")
    try:
        text = await run_in_threadpool(_transcribe, audio_bytes, audio_upload.filename or "audio.wav", language, None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    return {"transcript": text}


@app.post("/v1/audio/transcriptions")
async def transcriptions(
    file: UploadFile = File(...),
    language: str | None = Form(default=None),
    prompt: str | None = Form(default=None),
    model: str | None = Form(default=None),  # sent by some clients; ignored
):
    """OpenAI-compatible transcription endpoint."""
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file received.")

    language = language or _config.get("model", {}).get("language", "en")
    try:
        text = await run_in_threadpool(_transcribe, audio_bytes, file.filename or "audio.wav", language, prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    return {"text": text}


# -- Entry point ---------------------------------------------------------------

if __name__ == "__main__":
    config_path = Path(__file__).parent / "config.yaml"
    _config = load_config(str(config_path))

    log_cfg = _config.get("logging", {})
    _logger = setup_logging(
        log_dir=Path(__file__).parent / log_cfg.get("dir", "./logs"),
        level=log_cfg.get("level", "INFO"),
        max_bytes=log_cfg.get("max_bytes", 5_242_880),
        backup_count=log_cfg.get("backup_count", 3),
    )

    _logger.info("=" * 60)
    _logger.info("STT Server starting")
    _logger.info("=" * 60)

    _model = init_model(
        model_name=_config["model"]["name"],
        threads=_config["model"].get("cpu_threads", 8),
        compute_type=_config["model"].get("compute_type", "int8"),
    )

    warmup(_model, _config["model"].get("language", "en"))

    host = _config["server"]["host"]
    port = _config["server"]["port"]
    _logger.info(f"Server listening on http://{host}:{port}")
    _logger.info(f"SillyTavern Whisper URL: http://{host}:{port}/api/speech-recognition/whisper/process-audio")

    uvicorn.run(app, host=host, port=port, log_level="info")
