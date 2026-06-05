# Multi-Mode Dictation – SillyTavern Extension

Vier Hotkeys für Spracheingabe mit automatischer Formatierung (Asterisks / Quotes)
und einem Puffer, mit dem du mehrere Aufnahmen zu einer Nachricht kombinierst.

## Voraussetzungen

- SillyTavern (getestete UI-Struktur: aktuelle 1.13.x-Reihe)
- Laufender **ST-Extras-Server** mit aktiviertem `speech-recognition`-Modul
  und Whisper auf der GPU. Bei dir (RTX 3060, 12 GB) läuft das problemlos,
  z.B. mit dem `large-v3`- oder `medium`-Modell.
- Mikrofonzugriff im Browser erlaubt.

## Installation

### Variante A – über die ST-Oberfläche (empfohlen)
1. ZIP irgendwo entpacken (du brauchst den Ordner `multi-dictation`).
2. ST-Ordner öffnen: `SillyTavern/public/scripts/extensions/third-party/`
3. Den kompletten Ordner `multi-dictation` dort hineinkopieren.
4. SillyTavern im Browser neu laden (F5).
5. Unter **Extensions (Steckersymbol) → Multi-Mode Dictation** prüfen,
   ob die Einstellungen erscheinen.

### Variante B – Git
Wenn du den Ordner in ein Git-Repo legst, kannst du ihn auch über
"Install Extension" per URL ziehen. Für lokal reicht Variante A.

## Standard-Tastenbelegung

| Taste     | Modus      | Verhalten                      |
|-----------|------------|--------------------------------|
| Numpad0   | Asterisk   | an Puffer anhängen (warten)    |
| Numpad1   | Asterisk   | an Puffer anhängen + senden    |
| Numpad2   | Quote      | an Puffer anhängen (warten)    |
| Numpad3   | Quote      | an Puffer anhängen + senden    |

Alle vier Tasten sind in den Einstellungen frei belegbar
(ins Feld klicken, gewünschte Taste drücken).

## Bedienung

Aufnahme = **gleiche Taste zweimal**: einmal Start, einmal Stopp.
(Drück Numpad0 → sprich → drück Numpad0 erneut → Aufnahme wird transkribiert.)

### Beispiel: deine Kombination `0 2 1`
1. **Numpad0** → "Er sah sie verlegen an" → Numpad0 → Puffer: `*Er sah sie verlegen an*`
2. **Numpad2** → "komm in meine Arme" → Numpad2 → Puffer: `*…* ... "komm in meine Arme"`
3. **Numpad1** → "es fühlte sich gut an" → Numpad1 → hängt `*es fühlte sich gut an*`
   an und **sendet** sofort:

```
*Er sah sie verlegen an*..."komm in meine Arme"...*es fühlte sich gut an*
```

Der kleine Puffer-Indikator unten in der Mitte zeigt dir jederzeit,
was aktuell gesammelt ist.

## Einstellungen

- **Trenner**: standardmäßig `...` – beliebig änderbar (z.B. ` ` für Leerzeichen).
- **Whisper-URL**: leer lassen für Auto-Erkennung. Falls dein Extras-Server
  auf einem anderen Port/Host läuft, hier die volle URL eintragen:
  `http://localhost:5100/api/speech-recognition/whisper/process-audio`
- **Puffer leeren / Puffer jetzt senden**: manuelle Steuerung.

## Hinweise / Troubleshooting

- **"Transkription fehlgeschlagen"**: Extras-Server läuft nicht oder falsche URL.
  Prüfe, ob das `speech-recognition`-Modul beim Extras-Start geladen wurde.
- Die Hotkeys feuern global, **außer** wenn du gerade in einem *anderen*
  Textfeld tippst (Suchfelder etc.). Im Chat-Eingabefeld funktionieren sie.
- Diese Extension ersetzt **nicht** die eingebaute Speech-Recognition-UI –
  sie läuft parallel. Du kannst die alte Belegung (Numpad0 im ST-Menü)
  leeren, damit sich nichts überschneidet.
- Die alte Regex-/Message-Mapping-Logik aus dem Screenshot brauchst du
  damit nicht mehr; die Formatierung übernimmt komplett diese Extension.
