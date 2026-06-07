# Multi-Mode Dictation – SillyTavern Extension

Hotkeys für Spracheingabe mit automatischer Formatierung (Asterisks / Quotes)
und einem Puffer, mit dem du mehrere Aufnahmen zu einer Nachricht kombinierst.
Wahlweise **4-Knopf-** oder **3-Knopf-Bedienung**, mehrsprachiges Menü und eine
Tasten-Übersicht unten rechts. Die gepufferten Aufnahmen erscheinen dort als
**editierbare Liste** – jede Zeile lässt sich anklicken (Text korrigieren) und
einzeln per × löschen; zusätzlich gibt es eine frei belegbare Taste zum Löschen
der letzten Aufnahme.

*made by FragThief_1337*

## Voraussetzungen

- SillyTavern (getestet mit 1.13.x – 1.17.x).
- Laufender lokaler **Whisper-STT-Server** mit einem Endpoint, der unter
  `…/api/speech-recognition/whisper/process-audio` ein Audio entgegennimmt und
  `{ "transcript": "…" }` (oder `{ "text": "…" }`) zurückgibt. Das ist
  kompatibel zu ST-Extras (`speech-recognition`-Modul) und zu eigenen
  faster-whisper-Servern.
- Mikrofonzugriff im Browser erlaubt.

## Installation

### Variante A – über die ST-Oberfläche (empfohlen)
1. Den Ordner `multi-dictation` nach
   `SillyTavern/public/scripts/extensions/third-party/` kopieren
   (oder `install.bat` ausführen – Zielpfad ggf. oben in der Datei anpassen).
2. SillyTavern im Browser neu laden (F5).
3. **Extensions (Steckersymbol) → Multi-Mode Dictation** öffnen.

### Variante B – per Git-URL
In ST über **Install Extension** diese URL eintragen (sobald das Repo öffentlich ist):

```
https://github.com/mccrypt1/SillyTavern-Multi-Mode-Dictation
```

(manifest.json liegt im Repo-Root.)

## Bedienmodi

Umschaltbar in den Einstellungen unter **Bedienmodus**.

### 4-Knopf (Standard)
| Taste   | Funktion | Symbol | Verhalten                   |
|---------|----------|--------|-----------------------------|
| Numpad0   | Asterisk | `*+`   | an Puffer anhängen (warten)        |
| Numpad1   | Asterisk | `*→`   | an Puffer anhängen + senden        |
| Numpad2   | Quote    | `"+`   | an Puffer anhängen (warten)        |
| Numpad3   | Quote    | `"→`   | an Puffer anhängen + senden        |
| Numpad .  | Löschen  | `⌫`    | letzte Aufnahme aus dem Puffer löschen |

### 3-Knopf
| Taste   | Funktion | Symbol | Verhalten                   |
|---------|----------|--------|-----------------------------|
| Numpad0   | Quote    | `"+`   | an Puffer anhängen (warten)        |
| Numpad1   | Asterisk | `*+`   | an Puffer anhängen (warten)        |
| Numpad2   | Senden   | `→`    | Puffer abschicken                  |
| Numpad .  | Löschen  | `⌫`    | letzte Aufnahme aus dem Puffer löschen |

Alle Tasten sind frei belegbar (ins Feld klicken, gewünschte Taste drücken;
**Esc** im Feld löscht die Belegung). `+` = an Puffer anhängen, `→` = senden,
`⌫` = letzte Aufnahme löschen.

## Bedienung

Aufnahme = **gleiche Taste zweimal**: einmal Start, einmal Stopp.
(Numpad0 → sprechen → Numpad0 erneut → wird transkribiert und angehängt.)

Im 3-Knopf-Modus stoppt die Senden-Taste zuerst eine noch laufende Aufnahme;
ein zweiter Druck schickt den Puffer ab.

### Beispiel (4-Knopf): `0 2 1`
1. **Numpad0** → "Er sah sie verlegen an" → Numpad0 → Puffer: `*Er sah sie verlegen an*`
2. **Numpad2** → "komm in meine Arme" → Numpad2 → `…"komm in meine Arme"`
3. **Numpad1** → "es fühlte sich gut an" → Numpad1 → hängt an und **sendet**:

```
*Er sah sie verlegen an*..."komm in meine Arme"...*es fühlte sich gut an*
```

Das Panel unten rechts zeigt die Tastenbelegung als Kästchen (oben Funktion,
unten Taste) und – sobald etwas gesammelt ist – die Aufnahmen als Liste.

### Aufnahmen bearbeiten & löschen

- **Bearbeiten:** Auf eine Zeile in der Liste klicken → du editierst nur den
  gesprochenen Text (die `*`/`"` bleiben automatisch erhalten). **Enter**
  speichert, **Esc** bricht ab. Danach normal weiter aufnehmen.
- **Einzeln löschen:** Das **×** rechts in der Zeile entfernt genau diese Aufnahme.
- **Letzte löschen:** Die belegte Lösch-Taste (Standard `Numpad .`) wirft die
  letzte Aufnahme aus dem Puffer – ohne sichtbaren Button.

## Einstellungen

- **Menüsprache**: English (Standard), Deutsch, Français, Español, Русский,
  日本語, 中文. Betrifft nur die Oberfläche – die Whisper-Erkennungssprache ist
  davon unabhängig.
- **Bedienmodus**: 4-Knopf oder 3-Knopf.
- **Lösch-Taste**: frei belegbare Taste, die die letzte Aufnahme löscht
  (in beiden Modi vorhanden).
- **Trenner**: standardmäßig `...` – beliebig änderbar.
- **Whisper-URL**: leer = Auto-Erkennung (`http://localhost:5100/…`). Bei
  abweichendem Port/Host hier die volle URL eintragen, z.B.
  `http://127.0.0.1:9000/api/speech-recognition/whisper/process-audio`.
- **Tasten-Übersicht anzeigen**: blendet das Panel unten rechts ein/aus.
- **Puffer leeren / Puffer jetzt senden**: manuelle Steuerung.
- **Reset to defaults**: setzt alle Einstellungen auf Standard zurück
  (der Button ist bewusst immer englisch beschriftet).

## Troubleshooting

- **"Transkription fehlgeschlagen"**: STT-Server läuft nicht oder falsche URL.
- Die Hotkeys feuern global, **außer** wenn du in einem *anderen* Textfeld tippst.
- Kollidiert eine eingebaute ST-Speech-Recognition-Belegung (z.B. Numpad0),
  diese im ST-Menü leeren.

## Lizenz

MIT – siehe [LICENSE](LICENSE).
