# STT Server

A small local **Whisper speech-to-text server** (faster-whisper, CPU) that the
**Multi-Mode Dictation** SillyTavern extension uses as its transcription
backend. It runs offline on your machine — no cloud, no API key.

## Quick start (Windows)

1. Make sure **Python 3.10+** is installed (`python --version`).
2. Double-click **`start.bat`**.
   - First run creates a virtual environment, installs the dependencies, and
     downloads the Whisper model (this takes a few minutes once).
3. When you see `Server listening on http://127.0.0.1:9000`, it's ready.
4. In SillyTavern, set the extension's **Whisper URL** to:
   ```
   http://127.0.0.1:9000/api/speech-recognition/whisper/process-audio
   ```

Quick test in a browser: open <http://127.0.0.1:9000/health> → you should see
`{"status":"ok", ...}`.

## Configuration

Edit **`config.yaml`**:

- `model.name` — `tiny` / `base` / `small` / `medium` / `large-v3` (downloads
  automatically), or a local path / HuggingFace id. Bigger = better but slower.
- `model.language` — recognition language (`de`, `en`, `fr`, ...).
- `server.port` — default `9000`.

## Full guide

See **[../docs/SETUP.md](../docs/SETUP.md)** for the complete, illustrated
setup (server + extension + first test).
