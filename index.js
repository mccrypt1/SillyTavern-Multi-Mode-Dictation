/*
 * Multi-Mode Dictation for SillyTavern
 * ------------------------------------
 * Voice input via the local Whisper STT, formats the transcript
 * (asterisks / quotes) and collects the parts in an editable buffer
 * until a "send" action is triggered.
 *
 * Modes:
 *   4-key (default): Asterisk/Quote x Buffer/Send   (Numpad0-3)
 *   3-key:           Quote+Buffer, Asterisk+Buffer, Send  (Numpad0-2)
 * Plus, per mode, a freely assignable key to delete the last recording.
 *
 * The buffered recordings are shown in a movable panel (drag the grip): each
 * row is clickable to edit and deletable via x. The key cells are also
 * clickable with the mouse. Recording activation is switchable between
 * toggle (press/click again to stop) and press-and-hold (keyboard).
 *
 * made by FragThief_1337
 */

const MODULE_NAME = 'multi_dictation';
const CREDITS = 'made by FragThief_1337';

const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced } = context;

// ---------- Translations (UI language) ----------
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
        sttHint: 'Nutzt den lokalen Whisper-STT-Server. Tasten-Kästchen sind auch per Maus klickbar.',
        mode: 'Bedienmodus',
        mode4: '4-Knopf (Asterisk/Quote × Puffer/Senden)',
        mode3: '3-Knopf (Quote, Asterisk, Senden)',
        activation: 'Aktivierung (Tastatur)',
        act_toggle: 'Umschalten (erneut drücken/klicken stoppt)',
        act_hold: 'Gedrückt halten',
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
        gripHint: 'Ziehen zum Verschieben • Doppelklick = zurücksetzen',
        t_recording: 'Aufnahme läuft (%s)…',
        t_transcribing: 'Transkribiere…',
        t_micError: 'Mikrofon nicht verfügbar',
        t_failed: 'Transkription fehlgeschlagen – läuft der STT-Server?',
        t_deletedLast: 'Letzte Aufnahme gelöscht',
    },
    en: {
        enabled: 'Enabled',
        uiLang: 'Menu language',
        sttHint: 'Uses the local Whisper STT server. The key cells are also clickable with the mouse.',
        mode: 'Control mode',
        mode4: '4-key (Asterisk/Quote × Buffer/Send)',
        mode3: '3-key (Quote, Asterisk, Send)',
        activation: 'Activation (keyboard)',
        act_toggle: 'Toggle (press/click again to stop)',
        act_hold: 'Press and hold',
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
        gripHint: 'Drag to move • double-click to reset',
        t_recording: 'Recording (%s)…',
        t_transcribing: 'Transcribing…',
        t_micError: 'Microphone unavailable',
        t_failed: 'Transcription failed – is the STT server running?',
        t_deletedLast: 'Last recording deleted',
    },
    fr: {
        enabled: 'Activé',
        uiLang: 'Langue du menu',
        sttHint: 'Utilise le serveur STT Whisper local. Les cases de touches sont aussi cliquables à la souris.',
        mode: 'Mode de commande',
        mode4: '4 touches (Astérisque/Guillemets × Tampon/Envoi)',
        mode3: '3 touches (Guillemets, Astérisque, Envoi)',
        activation: 'Activation (clavier)',
        act_toggle: 'Bascule (rappuyer/recliquer pour arrêter)',
        act_hold: 'Maintenir enfoncé',
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
        gripHint: 'Glisser pour déplacer • double-clic pour réinitialiser',
        t_recording: 'Enregistrement (%s)…',
        t_transcribing: 'Transcription…',
        t_micError: 'Microphone indisponible',
        t_failed: 'Échec de la transcription – le serveur STT est-il lancé ?',
        t_deletedLast: 'Dernier enregistrement supprimé',
    },
    es: {
        enabled: 'Activado',
        uiLang: 'Idioma del menú',
        sttHint: 'Usa el servidor STT Whisper local. Las casillas de teclas también se pueden pulsar con el ratón.',
        mode: 'Modo de control',
        mode4: '4 teclas (Asterisco/Comillas × Búfer/Enviar)',
        mode3: '3 teclas (Comillas, Asterisco, Enviar)',
        activation: 'Activación (teclado)',
        act_toggle: 'Alternar (pulsar/clic de nuevo para parar)',
        act_hold: 'Mantener pulsado',
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
        gripHint: 'Arrastrar para mover • doble clic para restablecer',
        t_recording: 'Grabando (%s)…',
        t_transcribing: 'Transcribiendo…',
        t_micError: 'Micrófono no disponible',
        t_failed: 'Transcripción fallida: ¿está el servidor STT en marcha?',
        t_deletedLast: 'Última grabación eliminada',
    },
    ru: {
        enabled: 'Включено',
        uiLang: 'Язык меню',
        sttHint: 'Использует локальный STT-сервер Whisper. По клеткам клавиш можно также щёлкать мышью.',
        mode: 'Режим управления',
        mode4: '4 клавиши (Звёздочки/Кавычки × Буфер/Отправка)',
        mode3: '3 клавиши (Кавычки, Звёздочки, Отправка)',
        activation: 'Активация (клавиатура)',
        act_toggle: 'Переключение (нажмите/щёлкните снова)',
        act_hold: 'Удерживать нажатой',
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
        gripHint: 'Перетащите, чтобы переместить • двойной щелчок — сброс',
        t_recording: 'Идёт запись (%s)…',
        t_transcribing: 'Транскрибирование…',
        t_micError: 'Микрофон недоступен',
        t_failed: 'Ошибка транскрипции – запущен ли STT-сервер?',
        t_deletedLast: 'Последняя запись удалена',
    },
    ja: {
        enabled: '有効',
        uiLang: 'メニュー言語',
        sttHint: 'ローカルの Whisper STT サーバーを使用します。キーのマスはマウスでもクリックできます。',
        mode: '操作モード',
        mode4: '4キー（アスタリスク/引用符 × バッファ/送信）',
        mode3: '3キー（引用符、アスタリスク、送信）',
        activation: '起動方式（キーボード）',
        act_toggle: 'トグル（もう一度押す/クリックで停止）',
        act_hold: '押し続ける',
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
        gripHint: 'ドラッグで移動 • ダブルクリックでリセット',
        t_recording: '録音中 (%s)…',
        t_transcribing: '文字起こし中…',
        t_micError: 'マイクを使用できません',
        t_failed: '文字起こしに失敗 – STT サーバーは起動していますか？',
        t_deletedLast: '最後の録音を削除しました',
    },
    zh: {
        enabled: '启用',
        uiLang: '菜单语言',
        sttHint: '使用本地 Whisper STT 服务器。按键方块也可以用鼠标点击。',
        mode: '控制模式',
        mode4: '4 键（星号/引号 × 缓冲/发送）',
        mode3: '3 键（引号、星号、发送）',
        activation: '激活方式（键盘）',
        act_toggle: '切换（再次按下/点击停止）',
        act_hold: '按住不放',
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
        gripHint: '拖动以移动 • 双击重置',
        t_recording: '正在录音 (%s)…',
        t_transcribing: '转录中…',
        t_micError: '麦克风不可用',
        t_failed: '转录失败 – STT 服务器在运行吗？',
        t_deletedLast: '已删除最后一次录音',
    },
};

// ---------- Default settings ----------
const defaultSettings = {
    enabled: true,
    uiLanguage: 'en',     // menu language (English by default; independent of the STT language)
    language: 'de',       // Whisper recognition language
    mode: '4',            // '4' = 4-key, '3' = 3-key
    activation: 'toggle', // 'toggle' or 'hold' (keyboard recording keys)
    separator: '...',
    showLegend: true,
    panelPos: null,       // null = default bottom-right, else { left, top } in px
    keys: {               // 4-key mode
        asteriskHold: 'Numpad0',
        asteriskSend: 'Numpad1',
        quoteHold: 'Numpad2',
        quoteSend: 'Numpad3',
        deleteLast: 'NumpadDecimal',
    },
    keys3: {              // 3-key mode
        quoteHold: 'Numpad0',     // key 1: Quote + buffer
        asteriskHold: 'Numpad1',  // key 2: Asterisk + buffer
        send: 'Numpad2',          // key 3: Send
        deleteLast: 'NumpadDecimal',
    },
    whisperUrl: '',
};

function getSettings() {
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
    }
    const cur = extensionSettings[MODULE_NAME];
    // fill in missing top-level fields (when updating from an older version)
    for (const k of Object.keys(defaultSettings)) {
        if (cur[k] === undefined) cur[k] = structuredClone(defaultSettings[k]);
    }
    // ensure nested key maps exist (including new keys like deleteLast)
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

// ---------- HTML escaping ----------
function escapeHtml(str) {
    return String(str).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function escapeAttr(str) {
    return String(str).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ---------- State ----------
let buffer = [];          // array of { wrap:'asterisk'|'quote', text:'…' }
let isRecording = false;  // guard against double triggers
let mediaRecorder = null;
let audioChunks = [];
let activeMode = null;    // {wrap:'asterisk'|'quote', send:boolean}
let activeSym = null;     // symbol of the currently recording key (for highlight)
let activeCode = null;    // keyboard code that started a hold recording
let editingIndex = null;  // index of the recording being edited (or null)
let dragging = false;     // panel is being dragged
let dragOffset = { x: 0, y: 0 };

// ---------- Symbols / key names ----------
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

// ---------- Formatting ----------
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
        console.error('[MultiDictation] send_textarea not found');
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
    // refresh the panel immediately once sent/cleared
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

// ---------- Whisper call ----------
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

// ---------- Recording control ----------
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
        activeCode = null;
        renderPanel();
        console.error('[MultiDictation] Microphone error:', err);
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
            commitEdit(); // save any open edit first
            buffer.push({ wrap: mode.wrap, text: cleaned });
        }
        if (mode.send) {
            flushBuffer({ send: true });
        }
    } catch (err) {
        console.error('[MultiDictation] Transcription failed:', err);
        toastr.error(t('t_failed'), 'Multi-Dictation');
    } finally {
        isRecording = false;
        activeMode = null;
        activeSym = null;
        activeCode = null;
        renderPanel();
    }
}

// Toggle: the same key/cell starts/stops
function triggerMode(mode) {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording(mode);
    }
}

// ---------- Buffer editing ----------
function commitEdit() {
    if (editingIndex === null) return;
    const panel = document.getElementById('md_panel');
    const inp = panel && panel.querySelector('.md-item-input');
    if (inp && buffer[editingIndex]) {
        const val = inp.value.trim().replace(/\s+/g, ' ');
        if (val) buffer[editingIndex].text = val;
        else buffer.splice(editingIndex, 1); // empty -> remove entry
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

// ---------- Keys per mode (for the legend panel) ----------
function cellsForMode() {
    const s = getSettings();
    if (s.mode === '3') {
        return [
            { sym: symFor({ wrap: 'quote', send: false }), code: s.keys3.quoteHold, act: { type: 'rec', wrap: 'quote', send: false } },
            { sym: symFor({ wrap: 'asterisk', send: false }), code: s.keys3.asteriskHold, act: { type: 'rec', wrap: 'asterisk', send: false } },
            { sym: '→', code: s.keys3.send, act: { type: 'send' } },
            { sym: '⌫', code: s.keys3.deleteLast, kind: 'del', act: { type: 'del' } },
        ];
    }
    return [
        { sym: symFor({ wrap: 'asterisk', send: false }), code: s.keys.asteriskHold, act: { type: 'rec', wrap: 'asterisk', send: false } },
        { sym: symFor({ wrap: 'asterisk', send: true }), code: s.keys.asteriskSend, act: { type: 'rec', wrap: 'asterisk', send: true } },
        { sym: symFor({ wrap: 'quote', send: false }), code: s.keys.quoteHold, act: { type: 'rec', wrap: 'quote', send: false } },
        { sym: symFor({ wrap: 'quote', send: true }), code: s.keys.quoteSend, act: { type: 'rec', wrap: 'quote', send: true } },
        { sym: '⌫', code: s.keys.deleteLast, kind: 'del', act: { type: 'del' } },
    ];
}

// One action (keyboard or mouse). Mouse is always click-toggle.
function doAction(act) {
    if (!act) return;
    if (act.type === 'rec') triggerMode({ wrap: act.wrap, send: act.send });
    else if (act.type === 'send') { if (isRecording) stopRecording(); else flushBuffer({ send: true }); }
    else if (act.type === 'del') deleteLastItem();
}

// ---------- Legend panel + recording list (movable) ----------
function updateBufferStatus() {
    const status = document.getElementById('md_buffer_status');
    if (status) {
        status.textContent = buffer.length ? `${t('bufferLabel')} (${buffer.length})` : t('bufferEmpty');
    }
}

function applyPanelPos(panel) {
    if (dragging) return;
    const s = getSettings();
    if (s.panelPos && typeof s.panelPos.left === 'number' && typeof s.panelPos.top === 'number') {
        const w = panel.offsetWidth || 200;
        const h = panel.offsetHeight || 80;
        const left = Math.max(0, Math.min(s.panelPos.left, window.innerWidth - w));
        const top = Math.max(0, Math.min(s.panelPos.top, window.innerHeight - h));
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    } else {
        panel.style.left = '';
        panel.style.top = '';
        panel.style.right = '';
        panel.style.bottom = '';
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
        // attach listeners once (panel content is rebuilt via innerHTML)
        panel.addEventListener('click', onPanelClick);
        panel.addEventListener('keydown', onPanelKeydown);
        panel.addEventListener('focusout', onPanelFocusOut);
        panel.addEventListener('mousedown', onPanelMouseDown);
        panel.addEventListener('dblclick', onPanelDblClick);
        document.body.appendChild(panel);
    }
    panel.style.display = 'block';

    // key cells (clickable)
    const cells = cellsForMode().map((c, i) => `
        <div class="md-cell ${c.kind === 'del' ? 'md-cell-del' : ''} ${activeSym && c.sym === activeSym ? 'md-cell-active' : ''}" data-cell="${i}" title="${escapeAttr(shortKey(c.code))}">
            <div class="md-cell-fn">${escapeHtml(c.sym)}</div>
            <div class="md-cell-key">${escapeHtml(shortKey(c.code))}</div>
        </div>`).join('');

    // recording list (editable)
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
        <div id="md_grip" title="${escapeAttr(t('gripHint'))}">⠿</div>
        <div id="md_cells">${cells}</div>
        ${listHtml}
        <div id="md_credits">${escapeHtml(CREDITS)}</div>`;

    // restore focus to the edit field + cursor at the end
    if (editingIndex !== null) {
        const inp = panel.querySelector('.md-item-input');
        if (inp) {
            inp.focus();
            const v = inp.value; inp.value = ''; inp.value = v;
        }
    }

    applyPanelPos(panel);
    updateBufferStatus();
}

// Click in the panel: cell triggers its action, x deletes a row, row click edits
function onPanelClick(e) {
    if (e.target.closest('#md_grip')) return;
    const delEl = e.target.closest('.md-item-del');
    if (delEl) {
        e.stopPropagation();
        deleteItem(parseInt(delEl.dataset.del, 10));
        return;
    }
    const cell = e.target.closest('.md-cell');
    if (cell && cell.dataset.cell !== undefined) {
        const c = cellsForMode()[parseInt(cell.dataset.cell, 10)];
        doAction(c && c.act);
        return;
    }
    if (e.target.classList.contains('md-item-input')) return;
    const item = e.target.closest('.md-item');
    if (item) startEdit(parseInt(item.dataset.idx, 10));
}

// Enter saves, Escape cancels (edit field)
function onPanelKeydown(e) {
    if (!e.target.classList.contains('md-item-input')) return;
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); renderPanel(); }
    else if (e.key === 'Escape') { e.preventDefault(); editingIndex = null; renderPanel(); }
}

// Field loses focus -> save (unless focus moves straight to another field)
function onPanelFocusOut(e) {
    if (!e.target.classList.contains('md-item-input')) return;
    const next = e.relatedTarget;
    if (next && next.classList && next.classList.contains('md-item-input')) return;
    if (editingIndex !== null) { commitEdit(); renderPanel(); }
}

// ---------- Dragging the panel (via the grip) ----------
function onPanelMouseDown(e) {
    if (!e.target.closest('#md_grip')) return;
    e.preventDefault();
    const panel = document.getElementById('md_panel');
    const rect = panel.getBoundingClientRect();
    dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    dragging = true;
    document.addEventListener('mousemove', onDragMove, true);
    document.addEventListener('mouseup', onDragEnd, true);
}

function onDragMove(e) {
    if (!dragging) return;
    const panel = document.getElementById('md_panel');
    if (!panel) return;
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    let left = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - w));
    let top = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - h));
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
}

function onDragEnd() {
    if (!dragging) return;
    dragging = false;
    document.removeEventListener('mousemove', onDragMove, true);
    document.removeEventListener('mouseup', onDragEnd, true);
    const panel = document.getElementById('md_panel');
    if (!panel) return;
    getSettings().panelPos = { left: parseInt(panel.style.left, 10), top: parseInt(panel.style.top, 10) };
    saveSettingsDebounced();
}

// Double-click the grip -> reset position to default
function onPanelDblClick(e) {
    if (!e.target.closest('#md_grip')) return;
    getSettings().panelPos = null;
    saveSettingsDebounced();
    renderPanel();
}

// ---------- Hotkey listeners ----------
function actionForCode(code, s) {
    if (!code) return null;
    if (s.mode === '3') {
        const k = s.keys3;
        if (k.deleteLast && code === k.deleteLast) return { type: 'del' };
        if (code === k.quoteHold) return { type: 'rec', wrap: 'quote', send: false };
        if (code === k.asteriskHold) return { type: 'rec', wrap: 'asterisk', send: false };
        if (code === k.send) return { type: 'send' };
    } else {
        const k = s.keys;
        if (k.deleteLast && code === k.deleteLast) return { type: 'del' };
        if (code === k.asteriskHold) return { type: 'rec', wrap: 'asterisk', send: false };
        if (code === k.asteriskSend) return { type: 'rec', wrap: 'asterisk', send: true };
        if (code === k.quoteHold) return { type: 'rec', wrap: 'quote', send: false };
        if (code === k.quoteSend) return { type: 'rec', wrap: 'quote', send: true };
    }
    return null;
}

function onKeyDown(e) {
    const s = getSettings();
    if (!s.enabled) return;

    const ae = document.activeElement;
    // do not trigger inside other input fields (the chat input is exempt)
    const inOtherInput = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && ae.id !== 'send_textarea';
    if (inOtherInput) return;
    // do not trigger while assigning a key or editing a recording
    if (ae && ae.classList && (ae.classList.contains('md-key-input') || ae.classList.contains('md-item-input'))) return;

    const act = actionForCode(e.code, s);
    if (!act) return;
    e.preventDefault();

    if (act.type === 'del') { deleteLastItem(); return; }
    if (act.type === 'send') {
        if (isRecording) stopRecording();
        else flushBuffer({ send: true });
        return;
    }
    // act.type === 'rec'
    if (s.activation === 'hold') {
        if (e.repeat) return;            // ignore auto-repeat while held
        if (!isRecording) {
            activeCode = e.code;
            startRecording({ wrap: act.wrap, send: act.send });
        }
    } else {
        triggerMode({ wrap: act.wrap, send: act.send });
    }
}

function onKeyUp(e) {
    const s = getSettings();
    if (!s.enabled || s.activation !== 'hold') return;
    if (e.code === activeCode && isRecording) {
        activeCode = null;
        stopRecording();
    }
}

// ---------- Settings UI ----------
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

    const activationOptions = `
        <option value="toggle" ${s.activation === 'toggle' ? 'selected' : ''}>${escapeHtml(t('act_toggle'))}</option>
        <option value="hold" ${s.activation === 'hold' ? 'selected' : ''}>${escapeHtml(t('act_hold'))}</option>`;

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

        <label>${escapeHtml(t('activation'))}</label>
        <select id="md_activation" class="text_pole">${activationOptions}</select>

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

    // menu language -> fully rebuild the panel (translate labels)
    $('#md_ui_lang').off('change').on('change', function () {
        getSettings().uiLanguage = $(this).val();
        saveSettingsDebounced();
        renderSettingsBody();
    });

    // mode -> rebuild the key fields
    $('#md_mode').off('change').on('change', function () {
        getSettings().mode = $(this).val();
        saveSettingsDebounced();
        renderSettingsBody();
    });

    $('#md_activation').off('change').on('change', function () {
        getSettings().activation = $(this).val();
        saveSettingsDebounced();
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

    // capture keys by keypress (click the field, then press the key; Esc clears it)
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

    // Reset (label always English)
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
    document.addEventListener('keyup', onKeyUp, true);
    renderPanel();
    console.log('[MultiDictation] loaded (v0.4)');
});
