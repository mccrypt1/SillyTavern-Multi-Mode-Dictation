/*
 * Multi-Mode Dictation für SillyTavern
 * ------------------------------------
 * Vier Hotkeys, die das vorhandene Whisper-STT von SillyTavern nutzen,
 * das Transkript formatieren (Asterisks / Quotes) und in einem Puffer
 * sammeln, bis eine "Senden"-Taste gedrückt wird.
 *
 * Standardbelegung:
 *   Numpad0 = Asterisk-Modus,  an Puffer anhängen (warten)
 *   Numpad1 = Asterisk-Modus,  an Puffer anhängen + senden
 *   Numpad2 = Quote-Modus,     an Puffer anhängen (warten)
 *   Numpad3 = Quote-Modus,     an Puffer anhängen + senden
 *
 * Trenner zwischen Puffer-Teilen: "..."  (konfigurierbar)
 */

const MODULE_NAME = 'multi_dictation';

const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced, eventSource, event_types } = context;

// ---------- Default-Settings ----------
const defaultSettings = {
    enabled: true,
    language: 'de',
    separator: '...',
    keys: {
        asteriskHold: 'Numpad0',
        asteriskSend: 'Numpad1',
        quoteHold:    'Numpad2',
        quoteSend:    'Numpad3',
    },
    // Whisper-Endpoint des ST-Extras-Servers; wird automatisch erkannt,
    // kann aber überschrieben werden.
    whisperUrl: '',
};

function getSettings() {
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
    }
    // fehlende Felder ergänzen (bei Update)
    for (const k of Object.keys(defaultSettings)) {
        if (extensionSettings[MODULE_NAME][k] === undefined) {
            extensionSettings[MODULE_NAME][k] = structuredClone(defaultSettings[k]);
        }
    }
    if (!extensionSettings[MODULE_NAME].keys) {
        extensionSettings[MODULE_NAME].keys = structuredClone(defaultSettings.keys);
    }
    return extensionSettings[MODULE_NAME];
}

// ---------- Puffer ----------
let buffer = [];          // Array fertig formatierter Teile
let isRecording = false;  // Schutz gegen Doppel-Trigger
let mediaRecorder = null;
let audioChunks = [];
let activeMode = null;     // {wrap:'asterisk'|'quote', send:boolean}

// ---------- Formatierung ----------
function formatPart(text, wrap) {
    let t = (text || '').trim();
    if (!t) return '';
    // doppelte Satzzeichen / Whisper-Artefakte säubern
    t = t.replace(/\s+/g, ' ');
    if (wrap === 'asterisk') return `*${t}*`;
    if (wrap === 'quote')    return `"${t}"`;
    return t;
}

function getTextarea() {
    return document.getElementById('send_textarea');
}

function pushToTextarea(finalText) {
    const ta = getTextarea();
    if (!ta) {
        console.error('[MultiDictation] send_textarea nicht gefunden');
        return;
    }
    ta.value = finalText;
    // ST lauscht auf input/change zum Zähler-Update
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
}

function flushBuffer({ send }) {
    if (buffer.length === 0) return;
    const sep = getSettings().separator;
    const finalText = buffer.join(sep);
    pushToTextarea(finalText);
    buffer = [];
    // Clipboard-Fenster sofort leeren/ausblenden, sobald gesendet/geleert wird
    updateBufferIndicator();

    if (send) {
        // ST-eigenes Senden, identisch zum Enter/Send-Button
        const sendBtn = document.getElementById('send_but');
        // kleiner Delay, damit der input-Event verarbeitet wird
        setTimeout(() => {
            if (sendBtn) {
                sendBtn.click();
            } else {
                // Fallback über Slash-Command
                context.executeSlashCommandsWithOptions(`/send ${finalText.replace(/\|/g, '\\|')}`);
            }
        }, 60);
    }
}

// ---------- Whisper-Aufruf ----------
function detectWhisperUrl() {
    const s = getSettings();
    if (s.whisperUrl) return s.whisperUrl;
    // ST-Extras-Server-URL aus den globalen Settings ableiten
    try {
        const extrasUrl = context.extensionSettings?.apiUrl
            || window?.extension_settings?.apiUrl
            || localStorage.getItem('extras_url')
            || 'http://localhost:5100';
        return `${extrasUrl.replace(/\/$/, '')}/api/speech-recognition/whisper/process-audio`;
    } catch {
        return 'http://localhost:5100/api/speech-recognition/whisper/process-audio';
    }
}

async function transcribe(audioBlob) {
    const url = detectWhisperUrl();
    const form = new FormData();
    form.append('AudioFile', audioBlob, 'record.webm');

    const resp = await fetch(url, { method: 'POST', body: form });
    if (!resp.ok) {
        throw new Error(`Whisper HTTP ${resp.status}`);
    }
    const data = await resp.json();
    // ST-Extras gibt { transcript: "..." } zurück
    return data.transcript ?? data.text ?? '';
}

// ---------- Aufnahme-Steuerung ----------
async function startRecording(mode) {
    if (isRecording) return;
    isRecording = true;
    activeMode = mode;
    audioChunks = [];

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            await handleTranscription(blob);
        };
        mediaRecorder.start();
        toastr.info(`Aufnahme läuft (${mode.wrap})… Taste erneut drücken zum Stoppen`, 'Multi-Dictation', { timeOut: 1500 });
    } catch (err) {
        isRecording = false;
        console.error('[MultiDictation] Mikrofon-Fehler:', err);
        toastr.error('Mikrofon nicht verfügbar', 'Multi-Dictation');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

async function handleTranscription(blob) {
    const mode = activeMode;
    try {
        toastr.info('Transkribiere…', 'Multi-Dictation', { timeOut: 1200 });
        const text = await transcribe(blob);
        const part = formatPart(text, mode.wrap);
        if (part) {
            buffer.push(part);
            updateBufferIndicator();
        }
        if (mode.send) {
            flushBuffer({ send: true });
        }
    } catch (err) {
        console.error('[MultiDictation] Transkription fehlgeschlagen:', err);
        toastr.error('Transkription fehlgeschlagen – läuft der Extras-Server?', 'Multi-Dictation');
    } finally {
        isRecording = false;
        activeMode = null;
    }
}

// Toggle: gleiche Taste startet/stoppt
function triggerMode(mode) {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording(mode);
    }
}

// ---------- Puffer-Anzeige ----------
function updateBufferIndicator() {
    let el = document.getElementById('md_buffer_indicator');
    if (!el) {
        el = document.createElement('div');
        el.id = 'md_buffer_indicator';
        document.body.appendChild(el);
    }
    if (buffer.length === 0) {
        el.style.display = 'none';
        el.textContent = '';
    } else {
        el.style.display = 'block';
        el.textContent = `📋 Puffer (${buffer.length}): ${buffer.join(getSettings().separator)}`;
    }
}

// ---------- Hotkey-Listener ----------
function onKeyDown(e) {
    const s = getSettings();
    if (!s.enabled) return;

    // Nicht auslösen, während in einem Textfeld getippt wird,
    // ES SEI DENN es ist das Chat-Eingabefeld (dann sind die Numpad-Keys gewollt).
    const ae = document.activeElement;
    const inOtherInput = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && ae.id !== 'send_textarea';
    if (inOtherInput) return;

    const code = e.code; // z.B. "Numpad0"
    const k = s.keys;

    if (code === k.asteriskHold) { e.preventDefault(); triggerMode({ wrap: 'asterisk', send: false }); }
    else if (code === k.asteriskSend) { e.preventDefault(); triggerMode({ wrap: 'asterisk', send: true }); }
    else if (code === k.quoteHold)  { e.preventDefault(); triggerMode({ wrap: 'quote', send: false }); }
    else if (code === k.quoteSend)  { e.preventDefault(); triggerMode({ wrap: 'quote', send: true }); }
}

// ---------- Settings-UI ----------
function buildSettingsUI() {
    const s = getSettings();
    const html = `
    <div class="multi-dictation-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Multi-Mode Dictation</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label">
                    <input id="md_enabled" type="checkbox" ${s.enabled ? 'checked' : ''}>
                    <span>Aktiviert</span>
                </label>

                <small>Nutzt den ST-Extras Whisper-Server. Aufnahme starten/stoppen = gleiche Taste drücken.</small>

                <hr>
                <label>Asterisk – anhängen (warten)</label>
                <input id="md_key_ah" class="text_pole" value="${s.keys.asteriskHold}">
                <label>Asterisk – anhängen + senden</label>
                <input id="md_key_as" class="text_pole" value="${s.keys.asteriskSend}">
                <label>Quote – anhängen (warten)</label>
                <input id="md_key_qh" class="text_pole" value="${s.keys.quoteHold}">
                <label>Quote – anhängen + senden</label>
                <input id="md_key_qs" class="text_pole" value="${s.keys.quoteSend}">

                <hr>
                <label>Trenner zwischen Teilen</label>
                <input id="md_separator" class="text_pole" value="${s.separator}">

                <label>Whisper-URL (leer = automatisch)</label>
                <input id="md_whisper_url" class="text_pole" placeholder="http://localhost:5100/api/speech-recognition/whisper/process-audio" value="${s.whisperUrl}">

                <hr>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <input id="md_clear_buffer" class="menu_button" type="button" value="Puffer leeren">
                    <input id="md_send_buffer" class="menu_button" type="button" value="Puffer jetzt senden">
                </div>
                <small id="md_buffer_status">Puffer: leer</small>
            </div>
        </div>
    </div>`;

    $('#extensions_settings2').append(html);

    // Listener
    const save = () => {
        const st = getSettings();
        st.enabled = $('#md_enabled').prop('checked');
        st.keys.asteriskHold = $('#md_key_ah').val().trim();
        st.keys.asteriskSend = $('#md_key_as').val().trim();
        st.keys.quoteHold = $('#md_key_qh').val().trim();
        st.keys.quoteSend = $('#md_key_qs').val().trim();
        st.separator = $('#md_separator').val();
        st.whisperUrl = $('#md_whisper_url').val().trim();
        saveSettingsDebounced();
    };

    $('#md_enabled, #md_key_ah, #md_key_as, #md_key_qh, #md_key_qs, #md_separator, #md_whisper_url')
        .on('input change', save);

    // Tasten per Tastendruck erfassen (Klick ins Feld, dann Taste drücken)
    ['md_key_ah','md_key_as','md_key_qh','md_key_qs'].forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('keydown', (ev) => {
            ev.preventDefault();
            input.value = ev.code;
            save();
        });
    });

    $('#md_clear_buffer').on('click', () => { buffer = []; updateBufferIndicator(); $('#md_buffer_status').text('Puffer: leer'); });
    $('#md_send_buffer').on('click', () => flushBuffer({ send: true }));
}

// ---------- Init ----------
jQuery(async () => {
    getSettings();
    buildSettingsUI();
    document.addEventListener('keydown', onKeyDown, true);
    updateBufferIndicator();
    console.log('[MultiDictation] geladen');
});
