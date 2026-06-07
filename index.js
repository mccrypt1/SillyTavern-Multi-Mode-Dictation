/*
 * Multi-Mode Dictation für SillyTavern
 * ------------------------------------
 * Spracheingabe über das lokale Whisper-STT, formatiert das Transkript
 * (Asterisks / Quotes) und sammelt die Teile in einem editierbaren Puffer,
 * bis eine "Senden"-Aktion ausgelöst wird.
 *
 * Modi:
 *   4-Knopf (Standard): Asterisk/Quote × Puffer/Senden  (Numpad0–3)
 *   3-Knopf:            Quote+Puffer, Asterisk+Puffer, Senden  (Numpad0–2)
 * Zusätzlich pro Modus eine frei belegbare Taste zum Löschen der letzten Aufnahme.
 *
 * Die gepufferten Aufnahmen werden unten rechts als Liste angezeigt: jede Zeile
 * ist anklickbar (Text bearbeiten) und per × einzeln löschbar.
 *
 * made by FragThief_1337
 */

const MODULE_NAME = 'multi_dictation';
const CREDITS = 'made by FragThief_1337';

const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced } = context;

// ---------- Übersetzungen (UI-Sprache) ----------
const LANG_NAMES = {
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
    ru: 'Русский',
    ja: '日本語',
    zh: '中文',
};

const I18N = {
    de: {
        enabled: 'Aktiviert',
        uiLang: 'Menüsprache',
        sttHint: 'Nutzt den lokalen Whisper-STT-Server. Aufnahme starten/stoppen = gleiche Taste drücken.',
        mode: 'Bedienmodus',
        mode4: '4-Knopf (Asterisk/Quote × Puffer/Senden)',
        mode3: '3-Knopf (Quote, Asterisk, Senden)',
        k_asteriskHold: 'Asterisk – anhängen (warten)',
        k_asteriskSend: 'Asterisk – anhängen + senden',
        k_quoteHold: 'Quote – anhängen (warten)',
        k_quoteSend: 'Quote – anhängen + senden',
        k_send: 'Senden (Puffer abschicken)',
        k_deleteLast: 'Löschen (letzte Aufnahme)',
        separator: 'Trenner zwischen Teilen',
        whisperUrl: 'Whisper-URL (leer = automatisch)',
        clearBuffer: 'Puffer leeren',
        sendBuffer: 'Puffer jetzt senden',
        showLegend: 'Tasten-Übersicht anzeigen',
        bufferEmpty: 'Puffer: leer',
        bufferLabel: 'Puffer',
        t_recording: 'Aufnahme läuft (%s)… Taste erneut drücken zum Stoppen',
        t_transcribing: 'Transkribiere…',
        t_micError: 'Mikrofon nicht verfügbar',
        t_failed: 'Transkription fehlgeschlagen – läuft der STT-Server?',
        t_deletedLast: 'Letzte Aufnahme gelöscht',
    },
    en: {
        enabled: 'Enabled',
        uiLang: 'Menu language',
        sttHint: 'Uses the local Whisper STT server. Start/stop recording = press the same key.',
        mode: 'Control mode',
        mode4: '4-key (Asterisk/Quote × Buffer/Send)',
        mode3: '3-key (Quote, Asterisk, Send)',
        k_asteriskHold: 'Asterisk – append (wait)',
        k_asteriskSend: 'Asterisk – append + send',
        k_quoteHold: 'Quote – append (wait)',
        k_quoteSend: 'Quote – append + send',
        k_send: 'Send (flush buffer)',
        k_deleteLast: 'Delete (last recording)',
        separator: 'Separator between parts',
        whisperUrl: 'Whisper URL (empty = automatic)',
        clearBuffer: 'Clear buffer',
        sendBuffer: 'Send buffer now',
        showLegend: 'Show key overview',
        bufferEmpty: 'Buffer: empty',
        bufferLabel: 'Buffer',
        t_recording: 'Recording (%s)… press the key again to stop',
        t_transcribing: 'Transcribing…',
        t_micError: 'Microphone unavailable',
        t_failed: 'Transcription failed – is the STT server running?',
        t_deletedLast: 'Last recording deleted',
    },
    fr: {
        enabled: 'Activé',
        uiLang: 'Langue du menu',
        sttHint: 'Utilise le serveur STT Whisper local. Démarrer/arrêter l’enregistrement = appuyer sur la même touche.',
        mode: 'Mode de commande',
        mode4: '4 touches (Astérisque/Guillemets × Tampon/Envoi)',
        mode3: '3 touches (Guillemets, Astérisque, Envoi)',
        k_asteriskHold: 'Astérisque – ajouter (attendre)',
        k_asteriskSend: 'Astérisque – ajouter + envoyer',
        k_quoteHold: 'Guillemets – ajouter (attendre)',
        k_quoteSend: 'Guillemets – ajouter + envoyer',
        k_send: 'Envoyer (vider le tampon)',
        k_deleteLast: 'Supprimer (dernier enregistrement)',
        separator: 'Séparateur entre les parties',
        whisperUrl: 'URL Whisper (vide = automatique)',
        clearBuffer: 'Vider le tampon',
        sendBuffer: 'Envoyer le tampon',
        showLegend: 'Afficher l’aperçu des touches',
        bufferEmpty: 'Tampon : vide',
        bufferLabel: 'Tampon',
        t_recording: 'Enregistrement (%s)… appuyez à nouveau pour arrêter',
        t_transcribing: 'Transcription…',
        t_micError: 'Microphone indisponible',
        t_failed: 'Échec de la transcription – le serveur STT est-il lancé ?',
        t_deletedLast: 'Dernier enregistrement supprimé',
    },
    es: {
        enabled: 'Activado',
        uiLang: 'Idioma del menú',
        sttHint: 'Usa el servidor STT Whisper local. Iniciar/detener grabación = pulsa la misma tecla.',
        mode: 'Modo de control',
        mode4: '4 teclas (Asterisco/Comillas × Búfer/Enviar)',
        mode3: '3 teclas (Comillas, Asterisco, Enviar)',
        k_asteriskHold: 'Asterisco – añadir (esperar)',
        k_asteriskSend: 'Asterisco – añadir + enviar',
        k_quoteHold: 'Comillas – añadir (esperar)',
        k_quoteSend: 'Comillas – añadir + enviar',
        k_send: 'Enviar (vaciar búfer)',
        k_deleteLast: 'Eliminar (última grabación)',
        separator: 'Separador entre partes',
        whisperUrl: 'URL de Whisper (vacío = automático)',
        clearBuffer: 'Vaciar búfer',
        sendBuffer: 'Enviar búfer ahora',
        showLegend: 'Mostrar resumen de teclas',
        bufferEmpty: 'Búfer: vacío',
        bufferLabel: 'Búfer',
        t_recording: 'Grabando (%s)… pulsa la tecla de nuevo para detener',
        t_transcribing: 'Transcribiendo…',
        t_micError: 'Micrófono no disponible',
        t_failed: 'Transcripción fallida: ¿está el servidor STT en marcha?',
        t_deletedLast: 'Última grabación eliminada',
    },
    ru: {
        enabled: 'Включено',
        uiLang: 'Язык меню',
        sttHint: 'Использует локальный STT-сервер Whisper. Старт/стоп записи = нажмите ту же клавишу.',
        mode: 'Режим управления',
        mode4: '4 клавиши (Звёздочки/Кавычки × Буфер/Отправка)',
        mode3: '3 клавиши (Кавычки, Звёздочки, Отправка)',
        k_asteriskHold: 'Звёздочки – добавить (ждать)',
        k_asteriskSend: 'Звёздочки – добавить + отправить',
        k_quoteHold: 'Кавычки – добавить (ждать)',
        k_quoteSend: 'Кавычки – добавить + отправить',
        k_send: 'Отправить (очистить буфер)',
        k_deleteLast: 'Удалить (последняя запись)',
        separator: 'Разделитель между частями',
        whisperUrl: 'URL Whisper (пусто = автоматически)',
        clearBuffer: 'Очистить буфер',
        sendBuffer: 'Отправить буфер',
        showLegend: 'Показать обзор клавиш',
        bufferEmpty: 'Буфер: пусто',
        bufferLabel: 'Буфер',
        t_recording: 'Идёт запись (%s)… нажмите клавишу снова для остановки',
        t_transcribing: 'Транскрибирование…',
        t_micError: 'Микрофон недоступен',
        t_failed: 'Ошибка транскрипции – запущен ли STT-сервер?',
        t_deletedLast: 'Последняя запись удалена',
    },
    ja: {
        enabled: '有効',
        uiLang: 'メニュー言語',
        sttHint: 'ローカルの Whisper STT サーバーを使用します。録音の開始/停止 = 同じキーを押す。',
        mode: '操作モード',
        mode4: '4キー（アスタリスク/引用符 × バッファ/送信）',
        mode3: '3キー（引用符、アスタリスク、送信）',
        k_asteriskHold: 'アスタリスク – 追加（待機）',
        k_asteriskSend: 'アスタリスク – 追加＋送信',
        k_quoteHold: '引用符 – 追加（待機）',
        k_quoteSend: '引用符 – 追加＋送信',
        k_send: '送信（バッファを送る）',
        k_deleteLast: '削除（最後の録音）',
        separator: 'パート間の区切り',
        whisperUrl: 'Whisper URL（空欄＝自動）',
        clearBuffer: 'バッファをクリア',
        sendBuffer: 'バッファを今すぐ送信',
        showLegend: 'キー一覧を表示',
        bufferEmpty: 'バッファ：空',
        bufferLabel: 'バッファ',
        t_recording: '録音中 (%s)… もう一度キーを押して停止',
        t_transcribing: '文字起こし中…',
        t_micError: 'マイクを使用できません',
        t_failed: '文字起こしに失敗 – STT サーバーは起動していますか？',
        t_deletedLast: '最後の録音を削除しました',
    },
    zh: {
        enabled: '启用',
        uiLang: '菜单语言',
        sttHint: '使用本地 Whisper STT 服务器。开始/停止录音 = 按同一个键。',
        mode: '控制模式',
        mode4: '4 键（星号/引号 × 缓冲/发送）',
        mode3: '3 键（引号、星号、发送）',
        k_asteriskHold: '星号 – 追加（等待）',
        k_asteriskSend: '星号 – 追加 + 发送',
        k_quoteHold: '引号 – 追加（等待）',
        k_quoteSend: '引号 – 追加 + 发送',
        k_send: '发送（清空缓冲）',
        k_deleteLast: '删除（最后一次录音）',
        separator: '片段分隔符',
        whisperUrl: 'Whisper 网址（留空 = 自动）',
        clearBuffer: '清空缓冲',
        sendBuffer: '立即发送缓冲',
        showLegend: '显示按键概览',
        bufferEmpty: '缓冲：空',
        bufferLabel: '缓冲',
        t_recording: '正在录音 (%s)… 再次按键停止',
        t_transcribing: '转录中…',
        t_micError: '麦克风不可用',
        t_failed: '转录失败 – STT 服务器在运行吗？',
        t_deletedLast: '已删除最后一次录音',
    },
};

// ---------- Default-Settings ----------
const defaultSettings = {
    enabled: true,
    uiLanguage: 'en',   // Menüsprache (Standard Englisch; unabhängig von der STT-Sprache)
    language: 'de',     // Whisper-Erkennungssprache
    mode: '4',          // '4' = 4-Knopf, '3' = 3-Knopf
    separator: '...',
    showLegend: true,
    keys: {             // 4-Knopf-Modus
        asteriskHold: 'Numpad0',
        asteriskSend: 'Numpad1',
        quoteHold: 'Numpad2',
        quoteSend: 'Numpad3',
        deleteLast: 'NumpadDecimal',
    },
    keys3: {            // 3-Knopf-Modus
        quoteHold: 'Numpad0',     // Taste 1: Quote + Puffer
        asteriskHold: 'Numpad1',  // Taste 2: Asterisk + Puffer
        send: 'Numpad2',          // Taste 3: Senden
        deleteLast: 'NumpadDecimal',
    },
    whisperUrl: '',
};

function getSettings() {
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
    }
    const cur = extensionSettings[MODULE_NAME];
    // fehlende Top-Level-Felder ergänzen (bei Update von älterer Version)
    for (const k of Object.keys(defaultSettings)) {
        if (cur[k] === undefined) cur[k] = structuredClone(defaultSettings[k]);
    }
    // verschachtelte Key-Maps absichern (auch neue Keys wie deleteLast)
    if (!cur.keys) cur.keys = structuredClone(defaultSettings.keys);
    else for (const k of Object.keys(defaultSettings.keys)) {
        if (cur.keys[k] === undefined) cur.keys[k] = defaultSettings.keys[k];
    }
    if (!cur.keys3) cur.keys3 = structuredClone(defaultSettings.keys3);
    else for (const k of Object.keys(defaultSettings.keys3)) {
        if (cur.keys3[k] === undefined) cur.keys3[k] = defaultSettings.keys3[k];
    }
    return cur;
}

function t(key) {
    const lang = I18N[getSettings().uiLanguage] ? getSettings().uiLanguage : 'en';
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}

// ---------- HTML-Escaping ----------
function escapeHtml(str) {
    return String(str).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function escapeAttr(str) {
    return String(str).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ---------- Zustand ----------
let buffer = [];          // Array von { wrap:'asterisk'|'quote', text:'…' }
let isRecording = false;  // Schutz gegen Doppel-Trigger
let mediaRecorder = null;
let audioChunks = [];
let activeMode = null;    // {wrap:'asterisk'|'quote', send:boolean}
let activeSym = null;     // Symbol der gerade aufnehmenden Taste (für Highlight)
let editingIndex = null;  // Index der gerade bearbeiteten Aufnahme (oder null)

// ---------- Symbole / Tastennamen ----------
function symFor(mode) {
    return (mode.wrap === 'quote' ? '"' : '*') + (mode.send ? '→' : '+');
}

function shortKey(code) {
    if (!code) return '—';
    return String(code)
        .replace('Numpad', 'Num')
        .replace('Digit', '')
        .replace('Key', '')
        .replace('Arrow', '');
}

// ---------- Formatierung ----------
function renderPart(item) {
    const tx = (item.text || '').trim();
    if (!tx) return '';
    if (item.wrap === 'asterisk') return `*${tx}*`;
    if (item.wrap === 'quote') return `"${tx}"`;
    return tx;
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
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
}

function flushBuffer({ send }) {
    commitEdit();
    if (buffer.length === 0) return;
    const sep = getSettings().separator;
    const finalText = buffer.map(renderPart).filter(Boolean).join(sep);
    pushToTextarea(finalText);
    buffer = [];
    editingIndex = null;
    // Panel sofort aktualisieren, sobald gesendet/geleert wird
    renderPanel();

    if (send) {
        const sendBtn = document.getElementById('send_but');
        setTimeout(() => {
            if (sendBtn) {
                sendBtn.click();
            } else {
                context.executeSlashCommandsWithOptions(`/send ${finalText.replace(/\|/g, '\\|')}`);
            }
        }, 60);
    }
}

// ---------- Whisper-Aufruf ----------
function detectWhisperUrl() {
    const s = getSettings();
    if (s.whisperUrl) return s.whisperUrl;
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
    return data.transcript ?? data.text ?? '';
}

// ---------- Aufnahme-Steuerung ----------
async function startRecording(mode) {
    if (isRecording) return;
    isRecording = true;
    activeMode = mode;
    activeSym = symFor(mode);
    audioChunks = [];

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(tr => tr.stop());
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            await handleTranscription(blob);
        };
        mediaRecorder.start();
        renderPanel();
        toastr.info(t('t_recording').replace('%s', mode.wrap === 'quote' ? '"' : '*'), 'Multi-Dictation', { timeOut: 1500 });
    } catch (err) {
        isRecording = false;
        activeSym = null;
        renderPanel();
        console.error('[MultiDictation] Mikrofon-Fehler:', err);
        toastr.error(t('t_micError'), 'Multi-Dictation');
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
        toastr.info(t('t_transcribing'), 'Multi-Dictation', { timeOut: 1200 });
        const text = await transcribe(blob);
        const cleaned = (text || '').trim().replace(/\s+/g, ' ');
        if (cleaned) {
            commitEdit(); // evtl. offene Bearbeitung zuerst sichern
            buffer.push({ wrap: mode.wrap, text: cleaned });
        }
        if (mode.send) {
            flushBuffer({ send: true });
        }
    } catch (err) {
        console.error('[MultiDictation] Transkription fehlgeschlagen:', err);
        toastr.error(t('t_failed'), 'Multi-Dictation');
    } finally {
        isRecording = false;
        activeMode = null;
        activeSym = null;
        renderPanel();
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

// ---------- Puffer-Bearbeitung ----------
function commitEdit() {
    if (editingIndex === null) return;
    const panel = document.getElementById('md_panel');
    const inp = panel && panel.querySelector('.md-item-input');
    if (inp && buffer[editingIndex]) {
        const val = inp.value.trim().replace(/\s+/g, ' ');
        if (val) buffer[editingIndex].text = val;
        else buffer.splice(editingIndex, 1); // leer -> Eintrag entfernen
    }
    editingIndex = null;
}

function startEdit(idx) {
    if (idx < 0 || idx >= buffer.length) return;
    if (editingIndex === idx) return;
    commitEdit();
    editingIndex = idx;
    renderPanel();
}

function deleteItem(idx) {
    if (idx < 0 || idx >= buffer.length) return;
    editingIndex = null;
    buffer.splice(idx, 1);
    renderPanel();
}

function deleteLastItem() {
    editingIndex = null;
    if (buffer.length === 0) return;
    buffer.pop();
    renderPanel();
    toastr.info(t('t_deletedLast'), 'Multi-Dictation', { timeOut: 1000 });
}

// ---------- Tasten je Modus (für das Legenden-Panel) ----------
function cellsForMode() {
    const s = getSettings();
    if (s.mode === '3') {
        return [
            { sym: symFor({ wrap: 'quote', send: false }), code: s.keys3.quoteHold },
            { sym: symFor({ wrap: 'asterisk', send: false }), code: s.keys3.asteriskHold },
            { sym: '→', code: s.keys3.send },
            { sym: '⌫', code: s.keys3.deleteLast, kind: 'del' },
        ];
    }
    return [
        { sym: symFor({ wrap: 'asterisk', send: false }), code: s.keys.asteriskHold },
        { sym: symFor({ wrap: 'asterisk', send: true }), code: s.keys.asteriskSend },
        { sym: symFor({ wrap: 'quote', send: false }), code: s.keys.quoteHold },
        { sym: symFor({ wrap: 'quote', send: true }), code: s.keys.quoteSend },
        { sym: '⌫', code: s.keys.deleteLast, kind: 'del' },
    ];
}

// ---------- Legenden-Panel + Aufnahme-Liste (unten rechts) ----------
function updateBufferStatus() {
    const status = document.getElementById('md_buffer_status');
    if (status) {
        status.textContent = buffer.length ? `${t('bufferLabel')} (${buffer.length})` : t('bufferEmpty');
    }
}

function renderPanel() {
    const s = getSettings();
    let panel = document.getElementById('md_panel');

    if (!s.enabled || !s.showLegend) {
        if (panel) panel.style.display = 'none';
        updateBufferStatus();
        return;
    }

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'md_panel';
        // Listener einmalig (Panel-Inhalt wird per innerHTML neu gebaut)
        panel.addEventListener('click', onPanelClick);
        panel.addEventListener('keydown', onPanelKeydown);
        panel.addEventListener('focusout', onPanelFocusOut);
        document.body.appendChild(panel);
    }
    panel.style.display = 'block';

    // Tasten-Kästchen
    const cells = cellsForMode().map(c => `
        <div class="md-cell ${c.kind === 'del' ? 'md-cell-del' : ''} ${activeSym && c.sym === activeSym ? 'md-cell-active' : ''}">
            <div class="md-cell-fn">${escapeHtml(c.sym)}</div>
            <div class="md-cell-key">${escapeHtml(shortKey(c.code))}</div>
        </div>`).join('');

    // Aufnahme-Liste (editierbar)
    let listHtml = '';
    if (buffer.length) {
        const rows = buffer.map((item, i) => {
            const middle = (editingIndex === i)
                ? `<input class="md-item-input" data-idx="${i}" value="${escapeAttr(item.text)}">`
                : `<span class="md-item-text">${escapeHtml(renderPart(item))}</span>`;
            return `
                <div class="md-item" data-idx="${i}" title="${escapeAttr(t('bufferLabel'))} ${i + 1}">
                    <span class="md-item-num">${i + 1}.</span>
                    ${middle}
                    <span class="md-item-del" data-del="${i}" title="Delete">×</span>
                </div>`;
        }).join('');
        listHtml = `
            <div id="md_list_header">📋 ${escapeHtml(t('bufferLabel'))} (${buffer.length})</div>
            <div id="md_list">${rows}</div>`;
    }

    panel.innerHTML = `
        <div id="md_cells">${cells}</div>
        ${listHtml}
        <div id="md_credits">${escapeHtml(CREDITS)}</div>`;

    // Fokus zurück ins Edit-Feld + Cursor ans Ende
    if (editingIndex !== null) {
        const inp = panel.querySelector('.md-item-input');
        if (inp) {
            inp.focus();
            const v = inp.value; inp.value = ''; inp.value = v;
        }
    }

    updateBufferStatus();
}

// Klick im Panel: × löscht Zeile, Klick auf Zeile startet Bearbeitung
function onPanelClick(e) {
    const delEl = e.target.closest('.md-item-del');
    if (delEl) {
        e.stopPropagation();
        deleteItem(parseInt(delEl.dataset.del, 10));
        return;
    }
    if (e.target.classList.contains('md-item-input')) return;
    const item = e.target.closest('.md-item');
    if (item) startEdit(parseInt(item.dataset.idx, 10));
}

// Enter speichert, Escape bricht ab
function onPanelKeydown(e) {
    if (!e.target.classList.contains('md-item-input')) return;
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); renderPanel(); }
    else if (e.key === 'Escape') { e.preventDefault(); editingIndex = null; renderPanel(); }
}

// Verlässt das Feld den Fokus -> speichern (außer es geht direkt in ein anderes Feld)
function onPanelFocusOut(e) {
    if (!e.target.classList.contains('md-item-input')) return;
    const next = e.relatedTarget;
    if (next && next.classList && next.classList.contains('md-item-input')) return;
    if (editingIndex !== null) { commitEdit(); renderPanel(); }
}

// ---------- Hotkey-Listener ----------
function onKeyDown(e) {
    const s = getSettings();
    if (!s.enabled) return;

    const ae = document.activeElement;
    // In fremden Eingabefeldern nicht auslösen (Chat-Eingabefeld ausgenommen).
    const inOtherInput = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && ae.id !== 'send_textarea';
    if (inOtherInput) return;
    // Während eine Taste belegt oder eine Aufnahme bearbeitet wird, nicht auslösen.
    if (ae && ae.classList && (ae.classList.contains('md-key-input') || ae.classList.contains('md-item-input'))) return;

    const code = e.code;

    if (s.mode === '3') {
        const k = s.keys3;
        if (k.deleteLast && code === k.deleteLast) { e.preventDefault(); deleteLastItem(); }
        else if (code === k.quoteHold) { e.preventDefault(); triggerMode({ wrap: 'quote', send: false }); }
        else if (code === k.asteriskHold) { e.preventDefault(); triggerMode({ wrap: 'asterisk', send: false }); }
        else if (code === k.send) {
            e.preventDefault();
            // Läuft gerade eine Aufnahme? Erst stoppen (Teil sichern), sonst Puffer senden.
            if (isRecording) stopRecording();
            else flushBuffer({ send: true });
        }
    } else {
        const k = s.keys;
        if (k.deleteLast && code === k.deleteLast) { e.preventDefault(); deleteLastItem(); }
        else if (code === k.asteriskHold) { e.preventDefault(); triggerMode({ wrap: 'asterisk', send: false }); }
        else if (code === k.asteriskSend) { e.preventDefault(); triggerMode({ wrap: 'asterisk', send: true }); }
        else if (code === k.quoteHold) { e.preventDefault(); triggerMode({ wrap: 'quote', send: false }); }
        else if (code === k.quoteSend) { e.preventDefault(); triggerMode({ wrap: 'quote', send: true }); }
    }
}

// ---------- Settings-UI ----------
function buildSettingsUI() {
    const html = `
    <div class="multi-dictation-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Multi-Mode Dictation</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content" id="md_settings_body"></div>
        </div>
    </div>`;
    $('#extensions_settings2').append(html);
    renderSettingsBody();
}

function renderSettingsBody() {
    const s = getSettings();
    const body = document.getElementById('md_settings_body');
    if (!body) return;

    const langOptions = Object.keys(LANG_NAMES).map(code =>
        `<option value="${code}" ${s.uiLanguage === code ? 'selected' : ''}>${escapeHtml(LANG_NAMES[code])}</option>`).join('');

    const modeOptions = `
        <option value="4" ${s.mode === '4' ? 'selected' : ''}>${escapeHtml(t('mode4'))}</option>
        <option value="3" ${s.mode === '3' ? 'selected' : ''}>${escapeHtml(t('mode3'))}</option>`;

    let keyFields;
    if (s.mode === '3') {
        keyFields = `
            <label>1. ${escapeHtml(t('k_quoteHold'))}</label>
            <input id="md_k3_quote" class="text_pole md-key-input" value="${escapeAttr(s.keys3.quoteHold)}">
            <label>2. ${escapeHtml(t('k_asteriskHold'))}</label>
            <input id="md_k3_aster" class="text_pole md-key-input" value="${escapeAttr(s.keys3.asteriskHold)}">
            <label>3. ${escapeHtml(t('k_send'))}</label>
            <input id="md_k3_send" class="text_pole md-key-input" value="${escapeAttr(s.keys3.send)}">
            <label>${escapeHtml(t('k_deleteLast'))}</label>
            <input id="md_k3_del" class="text_pole md-key-input" value="${escapeAttr(s.keys3.deleteLast)}">`;
    } else {
        keyFields = `
            <label>${escapeHtml(t('k_asteriskHold'))}</label>
            <input id="md_k4_ah" class="text_pole md-key-input" value="${escapeAttr(s.keys.asteriskHold)}">
            <label>${escapeHtml(t('k_asteriskSend'))}</label>
            <input id="md_k4_as" class="text_pole md-key-input" value="${escapeAttr(s.keys.asteriskSend)}">
            <label>${escapeHtml(t('k_quoteHold'))}</label>
            <input id="md_k4_qh" class="text_pole md-key-input" value="${escapeAttr(s.keys.quoteHold)}">
            <label>${escapeHtml(t('k_quoteSend'))}</label>
            <input id="md_k4_qs" class="text_pole md-key-input" value="${escapeAttr(s.keys.quoteSend)}">
            <label>${escapeHtml(t('k_deleteLast'))}</label>
            <input id="md_k4_del" class="text_pole md-key-input" value="${escapeAttr(s.keys.deleteLast)}">`;
    }

    body.innerHTML = `
        <div class="md-row">
            <div>
                <label class="checkbox_label" style="margin-top:0;">
                    <input id="md_enabled" type="checkbox" ${s.enabled ? 'checked' : ''}>
                    <span>${escapeHtml(t('enabled'))}</span>
                </label>
            </div>
            <div>
                <label>${escapeHtml(t('uiLang'))}</label>
                <select id="md_ui_lang" class="text_pole widthNatural">${langOptions}</select>
            </div>
        </div>

        <small>${escapeHtml(t('sttHint'))}</small>
        <hr>

        <label>${escapeHtml(t('mode'))}</label>
        <select id="md_mode" class="text_pole">${modeOptions}</select>

        <hr>
        ${keyFields}

        <hr>
        <label>${escapeHtml(t('separator'))}</label>
        <input id="md_separator" class="text_pole" value="${escapeAttr(s.separator)}">

        <label>${escapeHtml(t('whisperUrl'))}</label>
        <input id="md_whisper_url" class="text_pole" placeholder="http://localhost:5100/api/speech-recognition/whisper/process-audio" value="${escapeAttr(s.whisperUrl)}">

        <hr>
        <label class="checkbox_label">
            <input id="md_show_legend" type="checkbox" ${s.showLegend ? 'checked' : ''}>
            <span>${escapeHtml(t('showLegend'))}</span>
        </label>

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
            <input id="md_clear_buffer" class="menu_button" type="button" value="${escapeAttr(t('clearBuffer'))}">
            <input id="md_send_buffer" class="menu_button" type="button" value="${escapeAttr(t('sendBuffer'))}">
        </div>
        <small id="md_buffer_status">${escapeHtml(t('bufferEmpty'))}</small>

        <hr>
        <div>
            <input id="md_reset" class="menu_button" type="button" value="Reset to defaults">
        </div>

        <div class="md-credit-line">${escapeHtml(CREDITS)}</div>`;

    bindSettingsEvents();
    renderPanel();
}

function bindSettingsEvents() {
    $('#md_enabled').off('change').on('change', function () {
        getSettings().enabled = $(this).prop('checked');
        saveSettingsDebounced();
        renderPanel();
    });

    // Menüsprache -> Panel komplett neu aufbauen (Labels übersetzen)
    $('#md_ui_lang').off('change').on('change', function () {
        getSettings().uiLanguage = $(this).val();
        saveSettingsDebounced();
        renderSettingsBody();
    });

    // Modus -> Tastenfelder neu aufbauen
    $('#md_mode').off('change').on('change', function () {
        getSettings().mode = $(this).val();
        saveSettingsDebounced();
        renderSettingsBody();
    });

    $('#md_separator').off('input change').on('input change', function () {
        getSettings().separator = $(this).val();
        saveSettingsDebounced();
        renderPanel();
    });

    $('#md_whisper_url').off('input change').on('input change', function () {
        getSettings().whisperUrl = $(this).val().trim();
        saveSettingsDebounced();
    });

    $('#md_show_legend').off('change').on('change', function () {
        getSettings().showLegend = $(this).prop('checked');
        saveSettingsDebounced();
        renderPanel();
    });

    // Tasten per Tastendruck erfassen (ins Feld klicken, dann Taste drücken; Esc = leeren)
    const bindKey = (id, setter) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('keydown', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const code = (ev.code === 'Escape') ? '' : ev.code;
            el.value = code;
            setter(code);
            saveSettingsDebounced();
            renderPanel();
        });
    };

    if (getSettings().mode === '3') {
        bindKey('md_k3_quote', c => getSettings().keys3.quoteHold = c);
        bindKey('md_k3_aster', c => getSettings().keys3.asteriskHold = c);
        bindKey('md_k3_send', c => getSettings().keys3.send = c);
        bindKey('md_k3_del', c => getSettings().keys3.deleteLast = c);
    } else {
        bindKey('md_k4_ah', c => getSettings().keys.asteriskHold = c);
        bindKey('md_k4_as', c => getSettings().keys.asteriskSend = c);
        bindKey('md_k4_qh', c => getSettings().keys.quoteHold = c);
        bindKey('md_k4_qs', c => getSettings().keys.quoteSend = c);
        bindKey('md_k4_del', c => getSettings().keys.deleteLast = c);
    }

    $('#md_clear_buffer').off('click').on('click', () => {
        buffer = [];
        editingIndex = null;
        renderPanel();
    });
    $('#md_send_buffer').off('click').on('click', () => flushBuffer({ send: true }));

    // Reset (Label immer Englisch)
    $('#md_reset').off('click').on('click', () => {
        if (!confirm('Reset all Multi-Mode Dictation settings to defaults?')) return;
        extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
        saveSettingsDebounced();
        buffer = [];
        editingIndex = null;
        renderSettingsBody();
        renderPanel();
    });
}

// ---------- Init ----------
jQuery(async () => {
    getSettings();
    buildSettingsUI();
    document.addEventListener('keydown', onKeyDown, true);
    renderPanel();
    console.log('[MultiDictation] geladen (v0.3)');
});
