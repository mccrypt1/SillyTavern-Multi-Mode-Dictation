# Setup Guide — Multi-Mode Dictation

This guide takes you from zero to talking into SillyTavern. There are two pieces:

1. **The STT Server** — a small program on your PC that turns speech into text
   (offline, no API key).
2. **The extension** — the SillyTavern add-on that records your voice, sends it
   to the server, and writes the result into the chat.

```
   You speak  ──►  Extension (in SillyTavern)  ──►  STT Server (localhost:9000)  ──►  text back into chat
```

> Screenshots referenced as _S1…S10_ and animations as _G1…G4_ live in
> `docs/img/` and `docs/gif/`. If an image is missing it just shows its name —
> it does not break anything.

---

## Prerequisites

- **Windows** (this guide is Windows-first).
- **SillyTavern** already installed and running.
- **Python 3.10+** — check in a terminal: `python --version`
  ![S1](img/S1-python-version.png)
  _S1 — `python --version` showing real Python (not the Windows Store stub)._
  If Python is missing: install it from [python.org](https://www.python.org/downloads/)
  and tick **“Add Python to PATH”** during installation.
- A **microphone**, and permission for the browser to use it.

---

## Part 1 — Install & start the STT Server

### 1.1 Get the files
The server ships **inside this project**, in the `STT_Server` folder. If you
haven't already, download the project (green **Code ▸ Download ZIP** button on
GitHub) and unzip it somewhere permanent, e.g. `C:\AI\STT_Server`.

![S2](img/S2-stt-folder.png)
_S2 — the `STT_Server` folder: `start.bat`, `stt_server.py`, `config.yaml`, …_

### 1.2 Start it
Double-click **`start.bat`**.

- The **first** run creates a virtual environment, installs the dependencies,
  and downloads the Whisper model — this takes a few minutes once.
- Later runs start immediately.

When you see `Server listening on http://127.0.0.1:9000`, it's ready. **Leave
this window open** while you use dictation.

![S3](img/S3-server-running.png)
_S3 — the console after start: “Model loaded … Server listening on 127.0.0.1:9000”._

### 1.3 Verify it works
Open <http://127.0.0.1:9000/health> in your browser. You should see:

```json
{"status":"ok","model":"small","language":"de", ...}
```

![S4](img/S4-health.png)
_S4 — the `/health` page confirming the server runs._

### 1.4 Choose model & language (optional)
Open `STT_Server/config.yaml` in a text editor:

- `model.name` — `tiny` / `base` / `small` / `medium` / `large-v3`. Bigger =
  more accurate but slower and a larger download. `small` is a good start;
  `medium` is noticeably better.
- `model.language` — `de`, `en`, `fr`, `es`, … (your speaking language).

Save and restart `start.bat` after changes.

---

## Part 2 — Install the extension in SillyTavern

No Git needed — SillyTavern installs it from the URL.

### 2.1 Open the installer
In SillyTavern: **Extensions** (the stacked-blocks / plug icon) ▸
**Install extension**.

![S5](img/S5-install-extension.png)
_S5 — the “Install extension” button in the Extensions panel._

### 2.2 Paste the URL
Paste this and confirm:

```
https://github.com/mccrypt1/SillyTavern-Multi-Mode-Dictation
```

![S6](img/S6-install-url.png)
_S6 — pasting the GitHub URL into the install dialog._

### 2.3 Done
“Multi-Mode Dictation” now appears in your extensions list. Reload the page
(**F5**) if it doesn't show up immediately.

![S7](img/S7-extension-installed.png)
_S7 — the extension installed and listed._

---

## Part 3 — Configure the extension

### 3.1 Set the Whisper URL
Open **Extensions ▸ Multi-Mode Dictation**. In the **Whisper URL** field enter:

```
http://127.0.0.1:9000/api/speech-recognition/whisper/process-audio
```

(Leave it empty only if you run the classic ST-Extras server on port 5100.)

![S8](img/S8-settings.png)
_S8 — the settings panel; arrow on the **Whisper URL** field. Here you also pick
language, 4/3-key mode, activation (toggle / hold) and the key bindings._

### 3.2 Avoid the hotkey clash
SillyTavern's built-in **Speech Recognition** may already use a key (often
`Numpad0`). Open that drawer and clear/disable its hotkey so it doesn't fight
this extension.

![S9](img/S9-clear-hotkey.png)
_S9 — clearing the built-in Speech Recognition hotkey._

### 3.3 Know the panel
A small panel sits in the corner. It shows the key cells (function on top, key
below) and your recordings as a list.

![S10](img/S10-panel.png)
_S10 — the panel: **grip** = drag to move, **cells** = click to trigger,
**×** = delete a recording, **row** = click to edit._

---

## Part 4 — First test

1. Make sure the **STT Server window is open** (Part 1).
2. Press **Numpad0** (or click the `*+` cell), say a sentence, press **Numpad0**
   again.
3. A toast shows “Transcribing…”, then your text appears as item 1 in the list.
4. Press **Numpad1** (or `*→`) to append and send — it lands in the chat input
   and sends.

![G1](gif/G1-hero.gif)
_G1 — record ▸ speak ▸ text appears in the list ▸ send._

---

## Part 5 — Everyday use

- **Two modes** (setting *Control mode*):
  - **4-key:** Asterisk/Quote × append/send (Numpad0–3).
  - **3-key:** Quote+buffer, Asterisk+buffer, Send (Numpad0–2).
- **Activation:** *Toggle* (press again to stop) or *Press and hold*. Mouse
  clicks on cells are always toggle.
- **Edit a recording:** click its row, fix the text, **Enter**. The `*`/`"`
  wrapping is kept automatically.
  ![G2](gif/G2-edit.gif)
  _G2 — fixing a mis-heard word, then continuing._
- **Delete:** the **×** on a row deletes that one; the assigned delete key
  (default `Numpad .`) drops the last recording.
- **Move the panel:** drag the grip (⠿); double-click it to reset.
  ![G3](gif/G3-move.gif)
  _G3 — dragging the panel and resetting its position._

---

## Troubleshooting

- **“Transcription failed …”** — the STT Server isn't running or the Whisper URL
  is wrong. Check the server window and `/health` (S4).
- **Nothing happens on key press** — another input field is focused, or the
  built-in Speech Recognition still owns the key (see 3.2). Reload with F5.
- **No microphone** — allow mic access for the SillyTavern tab in the browser.
- **First start is slow** — the Whisper model is downloading; later starts are
  fast. A smaller `model.name` downloads quicker.
- **Bad accuracy** — raise `model.name` to `medium` or `large-v3`, and set the
  right `model.language` in `config.yaml`.

---

## Updating & uninstalling

- **Update the extension:** in SillyTavern's extension manager, update by URL,
  or reinstall. The STT Server updates by replacing the `STT_Server` folder
  (keep your `config.yaml`).
- **Uninstall:** remove the extension in SillyTavern, and delete the
  `STT_Server` folder. Your settings live in SillyTavern's user data.
