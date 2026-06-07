# Multi-Mode Dictation – SillyTavern Extension

Hotkeys for voice input with automatic formatting (asterisks / quotes) and a
buffer that lets you combine several recordings into one message. Choose
**4-key** or **3-key** operation, switch the menu language, and see a key
overview in a **movable panel**. The key cells are **clickable with the mouse**,
recording activation is switchable between **toggle** and **press-and-hold**, and
the buffered recordings appear as an **editable list** – click any row to fix its
text, delete rows individually with ×, and there is a freely assignable key to
delete the last recording.

*made by FragThief_1337*

## Requirements

- SillyTavern (tested with 1.13.x – 1.17.x).
- A running local **Whisper STT server** with an endpoint at
  `…/api/speech-recognition/whisper/process-audio` that accepts an audio upload
  and returns `{ "transcript": "…" }` (or `{ "text": "…" }`). This is compatible
  with ST-Extras (the `speech-recognition` module) and with custom
  faster-whisper servers.
- Microphone access allowed in the browser.

## Installation

### Option A – via the ST UI (recommended)
1. Copy the `multi-dictation` folder into
   `SillyTavern/public/scripts/extensions/third-party/`
   (or run `install.bat` – adjust the path at the top of the file if needed).
2. Reload SillyTavern in the browser (F5).
3. Open **Extensions (plug icon) → Multi-Mode Dictation**.

### Option B – via Git URL
In ST, use **Install Extension** with this URL (once the repo is public):

```
https://github.com/mccrypt1/SillyTavern-Multi-Mode-Dictation
```

(`manifest.json` is in the repo root.)

## Control modes

Switchable in the settings under **Control mode**.

### 4-key (default)
| Key       | Function | Symbol | Behavior                            |
|-----------|----------|--------|-------------------------------------|
| Numpad0   | Asterisk | `*+`   | append to buffer (wait)             |
| Numpad1   | Asterisk | `*→`   | append to buffer + send             |
| Numpad2   | Quote    | `"+`   | append to buffer (wait)             |
| Numpad3   | Quote    | `"→`   | append to buffer + send             |
| Numpad .  | Delete   | `⌫`    | delete the last recording from buffer |

### 3-key
| Key       | Function | Symbol | Behavior                            |
|-----------|----------|--------|-------------------------------------|
| Numpad0   | Quote    | `"+`   | append to buffer (wait)             |
| Numpad1   | Asterisk | `*+`   | append to buffer (wait)             |
| Numpad2   | Send     | `→`    | flush the buffer                    |
| Numpad .  | Delete   | `⌫`    | delete the last recording from buffer |

All keys are freely assignable (click the field, press the desired key;
**Esc** in the field clears the assignment). `+` = append to buffer,
`→` = send, `⌫` = delete last recording.

## Usage

Recording activation is set in the settings under **Activation**:

- **Toggle** (default): press the key once to start, press it again to stop.
  (Numpad0 → speak → Numpad0 again → transcribed and appended.)
- **Press and hold**: hold the key down while speaking, release to stop.

You can also **click the key cells with the mouse** instead of using the
keyboard. Mouse clicks are always toggle (click to start, click again to stop),
regardless of the Activation setting.

In 3-key mode the Send key first stops a recording that is still running; a
second press then flushes the buffer.

### Moving the panel

Drag the grip (⠿) at the top of the panel to reposition it anywhere; the
position is saved. **Double-click the grip** to reset it back to the
bottom-right corner.

### Example (4-key): `0 2 1`
1. **Numpad0** → "He looked at her shyly" → Numpad0 → buffer: `*He looked at her shyly*`
2. **Numpad2** → "come into my arms" → Numpad2 → `…"come into my arms"`
3. **Numpad1** → "it felt good" → Numpad1 → appends and **sends**:

```
*He looked at her shyly*..."come into my arms"...*it felt good*
```

The panel in the bottom-right shows the key bindings as cells (function on top,
key below) and – as soon as something is collected – the recordings as a list.

### Editing & deleting recordings

- **Edit:** click a row in the list → you edit only the spoken text (the `*`/`"`
  wrapping is kept automatically). **Enter** saves, **Esc** cancels. Then keep
  recording as usual.
- **Delete one:** the **×** on the right of a row removes exactly that recording.
- **Delete last:** the assigned delete key (default `Numpad .`) drops the last
  recording from the buffer – with no visible button.

## Settings

- **Menu language**: English (default), Deutsch, Français, Español, Русский,
  日本語, 中文. Affects only the UI – the Whisper recognition language is
  independent.
- **Control mode**: 4-key or 3-key.
- **Activation (keyboard)**: toggle (press again to stop) or press-and-hold.
- **Delete key**: freely assignable key that deletes the last recording
  (available in both modes).
- **Separator**: `...` by default – change it to anything.
- **Whisper URL**: empty = auto-detect (`http://localhost:5100/…`). For a
  different port/host enter the full URL, e.g.
  `http://127.0.0.1:9000/api/speech-recognition/whisper/process-audio`.
- **Show key overview**: toggles the panel (cells + list).
- **Panel position**: drag the grip (⠿) to move it; double-click the grip to
  reset. The position is remembered.
- **Clear buffer / Send buffer now**: manual controls.
- **Reset to defaults**: resets all settings (this button is intentionally
  always labeled in English).

## Troubleshooting

- **"Transcription failed"**: the STT server is not running or the URL is wrong.
- The hotkeys fire globally, **except** while you are typing in a *different*
  text field.
- If a built-in ST Speech Recognition binding collides (e.g. Numpad0), clear it
  in the ST menu.

## License

MIT – see [LICENSE](LICENSE).
