# Multi-Mode Dictation – SillyTavern Extension

Talk into SillyTavern. Numpad hotkeys record your voice, a local Whisper server
transcribes it, and the text is auto-formatted (asterisks / quotes) and
collected in an **editable buffer** before sending.

![G1](docs/gif/G1-hero.gif)
_Record ▸ speak ▸ the text appears in the list ▸ send._

*made by FragThief_1337*

## Features

- **4-key or 3-key** operation; every key freely assignable.
- **Activation: toggle or press-and-hold** (keyboard); key cells are also
  **clickable with the mouse**.
- **Editable buffer list** — click a recording to fix its text, delete rows with
  ×, or drop the last one with a key.
- **Movable on-screen panel** (drag the grip) showing the key legend + buffer.
- **Multilingual menu** (EN/DE/FR/ES/RU/JA/ZH); recognition language is separate.
- 100% local — uses a small **Whisper STT server** that ships in this repo
  (`STT_Server/`). No cloud, no API key.

## Quick start

You need two things: the **STT server** and the **extension**.

1. **STT server:** open `STT_Server/`, double-click `start.bat`, wait until it
   says *listening on http://127.0.0.1:9000*.
2. **Extension:** in SillyTavern ▸ **Extensions ▸ Install extension**, paste:
   ```
   https://github.com/mccrypt1/SillyTavern-Multi-Mode-Dictation
   ```
   Then open **Extensions ▸ Multi-Mode Dictation** and set the **Whisper URL** to
   `http://127.0.0.1:9000/api/speech-recognition/whisper/process-audio`.

📖 **Full step-by-step guide with screenshots: [docs/SETUP.md](docs/SETUP.md)**

## Default keys

| Key       | 4-key mode              | 3-key mode            |
|-----------|-------------------------|-----------------------|
| Numpad0   | `*+` asterisk, buffer   | `"+` quote, buffer    |
| Numpad1   | `*→` asterisk, send     | `*+` asterisk, buffer |
| Numpad2   | `"+` quote, buffer      | `→` send              |
| Numpad3   | `"→` quote, send        | —                     |
| Numpad .  | `⌫` delete last         | `⌫` delete last       |

`+` = append to buffer, `→` = send, `⌫` = delete last. All remappable in the
settings (press a key in the field; **Esc** clears it).

## Requirements

- SillyTavern (tested 1.13.x – 1.17.x).
- Python 3.10+ for the bundled STT server (faster-whisper, CPU).
- Microphone access in the browser.

## License

MIT – see [LICENSE](LICENSE). Repo: <https://github.com/mccrypt1/SillyTavern-Multi-Mode-Dictation>
