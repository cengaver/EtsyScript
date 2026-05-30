// ==UserScript==
// @name         Etsy Review Message
// @version      2.0.0
// @description  Send review message for buyer
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/orders/sold/completed*
// @match        https://www.etsy.com/your/orders/sold/*order_id=*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @grant        GM.addStyle
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewMessage.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewMessage.user.js
// @run-at       document-end
// ==/UserScript==

(async function () {
    'use strict';

    // ─── Constants ────────────────────────────────────────────────────────────

    const MESSAGE_BUTTONS_SELECTOR = `
        section.order-group-list
        .panel-body-row
        clg-tooltip:has(clg-icon[name="message"]) clg-icon-button
    `;

    const SEND_BUTTON_SELECTOR =
        '#dg-tabs-preact__tab-1--default_wt_tab_panel .panel-body .btn.btn-primary.btn-small';

    const TAB_PANEL_SELECTOR =
        '#dg-tabs-preact__tab-1--default_wt_tab_panel';

    const DEFAULT_CONFIG = {
        reviewMessage:   `Hello {{userName}}, 🙏`,
        printMessage:    '',
        cancelMessage:   '',
        noreturnMessage: '',
        uspserrorMessage:'',
        priorityMessage: '',
        resendMessage:   '',
        reptrackMessage: '',
        repfotoMessage:  '',
        wecanMessage:    '',
        doapprowMessage: '',
        shopName:        '',
    };

    const KEY_MAP = {
        Space:    'reviewMessage',
        Digit1:   'printMessage',
        Digit2:   'cancelMessage',
        Digit3:   'noreturnMessage',
        Digit4:   'uspserrorMessage',
        Digit5:   'priorityMessage',
        Digit6:   'resendMessage',
        Digit7:   'reptrackMessage',
        Digit8:   'repfotoMessage',
        Digit9:   'wecanMessage',
        Digit0:   'doapprowMessage',
    };

    const SHORTCUT_LABELS = {
        reviewMessage:   'Review Mesaj',
        printMessage:    'Bu Şekilde Baskıya',
        cancelMessage:   'Sipariş İptali',
        noreturnMessage: 'İade Yerine Kupon',
        uspserrorMessage:'Adres Hatası',
        priorityMessage: 'Hızlı Kargo Seçeneği',
        resendMessage:   'Yanlış Ürün Yeniden(rep) Gönderiyorum',
        reptrackMessage: 'Yeni Ürün Gönderildi',
        repfotoMessage:  'Yanlış Ürün – Fotoğraf İste',
        wecanMessage:    'Kişiselleştirme Mümkün',
        doapprowMessage: 'Onay Bekliyorum',
    };

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    // ─── Styles ───────────────────────────────────────────────────────────────

    GM.addStyle(`
        :root {
            --et-primary:   #4285f4;
            --et-primary-d: #3367d6;
            --et-success:   #34a853;
            --et-success-d: #2e7d32;
            --et-danger:    #ea4335;
            --et-danger-d:  #c62828;
            --et-warning:   #fbbc05;
            --et-warning-d: #f57f17;
            --et-light:     #f8f9fa;
            --et-dark:      #202124;
            --et-gray:      #5f6368;
            --et-radius:    4px;
            --et-shadow:    0 2px 10px rgba(0,0,0,.1);
            --et-transition:all .25s ease;
            --et-font:      'Segoe UI', Roboto, Arial, sans-serif;
        }

        /* ── Toast ─────────────────────────────────────────────── */
        .et-toasts {
            position: fixed; bottom: 20px; right: 20px;
            z-index: 10000; display: flex; flex-direction: column; gap: 8px;
            pointer-events: none;
        }
        .et-toast {
            min-width: 260px; padding: 10px 14px; border-radius: var(--et-radius);
            box-shadow: var(--et-shadow); font: 14px var(--et-font);
            display: flex; align-items: center; justify-content: space-between;
            opacity: 0; transform: translateY(12px);
            transition: var(--et-transition); pointer-events: all;
        }
        .et-toast.show { opacity: 1; transform: translateY(0); }
        .et-toast--success { background: var(--et-success); color: #fff; }
        .et-toast--error   { background: var(--et-danger);  color: #fff; }
        .et-toast--warning { background: var(--et-warning); color: var(--et-dark); }
        .et-toast--info    { background: var(--et-primary); color: #fff; }
        .et-toast__close {
            background: none; border: none; color: inherit;
            cursor: pointer; font-size: 16px; margin-left: 8px; opacity: .7;
        }
        .et-toast__close:hover { opacity: 1; }

        /* ── Modal ─────────────────────────────────────────────── */
        .et-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,.5);
            display: flex; align-items: center; justify-content: center;
            z-index: 10001; opacity: 0; visibility: hidden; transition: var(--et-transition);
        }
        .et-overlay.show { opacity: 1; visibility: visible; }
        .et-modal {
            background: #fff; border-radius: var(--et-radius);
            box-shadow: var(--et-shadow); width: 90%; max-width: 600px;
            max-height: 90vh; overflow: auto;
            transform: translateY(-16px); transition: var(--et-transition);
        }
        .et-overlay.show .et-modal { transform: translateY(0); }
        .et-modal__head {
            padding: 14px 16px; border-bottom: 1px solid #eee;
            display: flex; align-items: center; justify-content: space-between;
            font: 500 18px var(--et-font);
        }
        .et-modal__close {
            background: none; border: none; font-size: 20px;
            cursor: pointer; color: var(--et-gray);
        }
        .et-modal__body  { padding: 16px; }
        .et-modal__foot  {
            padding: 14px 16px; border-top: 1px solid #eee;
            display: flex; justify-content: flex-end; gap: 8px;
        }

        /* ── Buttons ───────────────────────────────────────────── */
        .et-btn {
            padding: 8px 12px; border: none; border-radius: var(--et-radius);
            font: 500 14px var(--et-font); cursor: pointer;
            transition: var(--et-transition); display: inline-flex;
            align-items: center; gap: 6px;
        }
        .et-btn:focus { outline: 2px solid var(--et-primary); outline-offset: 2px; }
        .et-btn--primary  { background: var(--et-primary);  color: #fff; }
        .et-btn--primary:hover { background: var(--et-primary-d); }
        .et-btn--light    { background: var(--et-light); color: var(--et-dark); border: 1px solid #ddd; }
        .et-btn--light:hover { background: #e9ecef; }

        /* ── Inputs ────────────────────────────────────────────── */
        .et-input {
            padding: 6px 8px; border: 1px solid #ddd; border-radius: var(--et-radius);
            font: 14px var(--et-font); width: 100%; box-sizing: border-box;
            transition: var(--et-transition);
        }
        .et-input:focus {
            outline: none; border-color: var(--et-primary);
            box-shadow: 0 0 0 2px rgba(66,133,244,.2);
        }
        textarea.et-input { height: 90px; resize: vertical; }

        /* ── Field group ───────────────────────────────────────── */
        .et-field { margin-bottom: 14px; }
        .et-field label { display: block; margin-bottom: 4px; font-weight: 600; font-size: 13px; }

        /* ── Shortcut table ────────────────────────────────────── */
        .et-shortcut-wrap {
            margin-bottom: 14px; border: 1px solid #ccc; padding: 12px;
            border-radius: 8px; background: #f9f9f9; font-family: sans-serif;
        }
        .et-shortcut-wrap table {
            width: 100%; margin-top: 8px;
            border-collapse: collapse; font-size: 13px;
        }
        .et-shortcut-wrap th, .et-shortcut-wrap td {
            padding: 4px 8px; text-align: left;
        }
    `);

    // ─── Config ───────────────────────────────────────────────────────────────

    let config = { ...DEFAULT_CONFIG };

    async function loadConfig() {
        try {
            const saved = await GM.getValue('Config');
            if (saved) config = { ...DEFAULT_CONFIG, ...saved };
            else await saveConfig();           // first-run: persist defaults
        } catch (e) {
            console.error('[EtsyTool] loadConfig error', e);
        }
    }

    async function saveConfig() {
        await GM.setValue('Config', config);
    }

    // ─── Toast ────────────────────────────────────────────────────────────────

    let _toastWrap = null;

    function getToastContainer() {
        if (!_toastWrap) {
            _toastWrap = Object.assign(document.createElement('div'), { className: 'et-toasts' });
            document.body.appendChild(_toastWrap);
        }
        return _toastWrap;
    }

    function showToast(message, type = 'success', duration = 3000) {
        const wrap  = getToastContainer();
        const toast = document.createElement('div');
        toast.className = `et-toast et-toast--${type}`;

        const span = document.createElement('span');
        span.textContent = message;

        const btn = document.createElement('button');
        btn.className = 'et-toast__close';
        btn.innerHTML = '&times;';
        btn.onclick = () => dismiss(toast);

        toast.append(span, btn);
        wrap.appendChild(toast);

        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));

        if (duration > 0) setTimeout(() => dismiss(toast), duration);

        function dismiss(el) {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 260);
        }
    }

    // ─── Config dialog ────────────────────────────────────────────────────────

    function showConfigMenu() {
        const fields = Object.keys(DEFAULT_CONFIG).map((id) => ({
            id,
            label: SHORTCUT_LABELS[id] ?? id,
        }));

        const overlay = document.createElement('div');
        overlay.className = 'et-overlay';

        overlay.innerHTML = `
            <div class="et-modal" role="dialog" aria-modal="true" aria-labelledby="et-modal-title">
                <div class="et-modal__head">
                    <span id="et-modal-title">Etsy Mesaj Tool Ayarları</span>
                    <button class="et-modal__close" aria-label="Kapat">&times;</button>
                </div>
                <div class="et-modal__body">
                    ${fields.map(f => `
                        <div class="et-field">
                            <label for="et-cfg-${f.id}">${f.label || f.id}</label>
                            <textarea id="et-cfg-${f.id}" class="et-input">${escHtml(config[f.id] ?? '')}</textarea>
                        </div>
                    `).join('')}
                </div>
                <div class="et-modal__foot">
                    <button class="et-btn et-btn--light" data-action="cancel">İptal</button>
                    <button class="et-btn et-btn--primary" data-action="save">Kaydet</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('show')));

        function close() {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 260);
        }

        overlay.querySelector('.et-modal__close').onclick = close;
        overlay.querySelector('[data-action="cancel"]').onclick = close;
        overlay.querySelector('[data-action="save"]').onclick = async () => {
            fields.forEach(({ id }) => {
                config[id] = document.getElementById(`et-cfg-${id}`)?.value ?? '';
            });
            await saveConfig();
            showToast('Ayarlar kaydedildi', 'success');
            close();
        };

        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ─── Core messaging ───────────────────────────────────────────────────────

    function getBuyerFirstName() {
        const raw = document.querySelector('#order-details-header-text > span')?.innerText ?? '';
        const name = raw.replace('Order from ', '').split(' ')[0] ?? '';
        if (!name || name.toLowerCase() === 'sign') return '';
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }

    function getTextArea() {
        return document.querySelector(`${TAB_PANEL_SELECTOR} textarea[name="message"]`);
    }

    function clickIfPresent(selector, text) {
        for (const el of document.querySelectorAll(selector)) {
            if (el.textContent.trim() === text) { el.click(); return true; }
        }
        return false;
    }

    async function insertMessage(messageKey) {
        const template = config[messageKey];
        if (!template) return;

        const userName = getBuyerFirstName();
        const text = '\n' + template.replace('{{userName}}', userName) + '\n';

        let ta = getTextArea();
        if (!ta) {
            const btnSelector = `${TAB_PANEL_SELECTOR} .flag-body button`;
            clickIfPresent(btnSelector, 'Message buyer') ||
            clickIfPresent(btnSelector, 'Reply');

            await delay(500);
            ta = getTextArea();
        }

        if (!ta || ta.value.includes(text)) return;

        ta.value += text;
        ta.setAttribute('value', ta.value);
        ta.dispatchEvent(new Event('input',  { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
        ta.focus();
    }

    async function sendMessage() {
        const btn = document.querySelector(SEND_BUTTON_SELECTOR);
        if (!btn) return;
        await delay(400);
        btn.click();
    }

    async function autoProcess() {
        await insertMessage('reviewMessage');
        await delay(700);
        await sendMessage();
        await delay(1100);
        history.back();
    }

    // ─── Progress bar & UI helpers ────────────────────────────────────────────

    function upsertProgressBar(completed, total) {
        const ul = document.querySelector('nav.wt-tab-container ul.wt-tab');
        if (!ul) return;

        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        let li = document.getElementById('et-progress-bar');
        if (!li) {
            li = document.createElement('li');
            li.id = 'et-progress-bar';
            li.className = 'wt-tab__item';
            li.style.cssText = 'display:flex;align-items:center;gap:5px;padding:4px 8px;';
            ul.appendChild(li);
        }

        li.innerHTML = `
            <span style="background:#e0e0e0;width:100px;height:10px;border-radius:5px;overflow:hidden;display:inline-block;">
                <span style="background:green;width:${pct}%;height:100%;display:block;transition:width .3s;"></span>
            </span>
            <span style="font-size:12px;color:#333;">${pct}% (${completed}/${total}) reviews</span>
        `;
    }

    function upsertRefreshButton(onRefresh) {
        const ul = document.querySelector('nav.wt-tab-container ul.wt-tab');
        if (!ul || document.getElementById('et-refresh-btn')) return;

        const li  = document.createElement('li');
        li.id = 'et-refresh-btn';
        li.className = 'wt-tab__item';

        const btn = document.createElement('button');
        btn.className = 'et-btn et-btn--light';
        btn.textContent = '↺';
        btn.title = 'Refresh message buttons';
        btn.onclick = onRefresh;

        li.appendChild(btn);
        ul.appendChild(li);
    }

    function hideProtectionBanners() {
        ['purchase-protection-seller-onsite-under-250',
         'purchase-protection-seller-onsite-under-500']
            .forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
    }

    // ─── Shortcut table ───────────────────────────────────────────────────────

    function insertShortcutTable() {
        const target = document.querySelector(
            `${TAB_PANEL_SELECTOR} > div > div:nth-child(4) > div`
        );
        if (!target || target.previousElementSibling?.classList?.contains('et-shortcut-wrap')) return;

        const rows = [
            ['Ctrl + Space', 'reviewMessage'],
            ...Object.entries(KEY_MAP)
                .filter(([k]) => k !== 'Space')
                .map(([k, v]) => [`Ctrl + ${k.replace('Digit', '')}`, v]),
            ['Ctrl + &#96;', null, 'Kısayol Haritası'],
        ];

        const wrap = document.createElement('div');
        wrap.className = 'et-shortcut-wrap';
        wrap.innerHTML = `
            <strong>🧷 Message Shortcuts</strong>
            <table>
                <thead><tr><th>Kısayol</th><th>Mesaj Tipi</th><th>Açıklama</th></tr></thead>
                <tbody>
                    ${rows.map(([shortcut, key, override]) => `
                        <tr>
                            <td>${shortcut}</td>
                            <td>${key ?? 'shortcutMap'}</td>
                            <td>${override ?? (SHORTCUT_LABELS[key] ?? '')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        target.parentNode.insertBefore(wrap, target);
        hideProtectionBanners();
    }

    // ─── Tab-index navigation ─────────────────────────────────────────────────

    function isInteractable(el) {
        return el && !el.disabled &&
            !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }

    function waitForElement(predicate, interval = 120, maxAttempts = 50) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const id = setInterval(() => {
                if (predicate())           { clearInterval(id); resolve(); return; }
                if (++attempts >= maxAttempts) { clearInterval(id); reject(new Error('waitForElement timeout')); }
            }, interval);
        });
    }

    function clickNextByTabIndex() {
        const nodes = [...document.querySelectorAll('[tabindex]')]
            .filter(isInteractable)
            .map((el) => ({ el, tab: Number(el.getAttribute('tabindex')) }))
            .filter(({ tab }) => Number.isFinite(tab) && tab > 0)
            .sort((a, b) => a.tab - b.tab)
            .map(({ el }) => el);

        if (!nodes.length) return;

        const active = document.activeElement;
        let idx = nodes.indexOf(active);
        if (idx === -1) {
            const anc = active?.closest?.('[tabindex]');
            idx = anc ? nodes.indexOf(anc) : -1;
        }

        const next = nodes[(idx + 1) % nodes.length];
        next?.focus();
        setTimeout(() => { next?.click(); hideProtectionBanners(); }, 60);
    }

    function initNavigation() {
        if (window.__etNavInitialized) return;
        window.__etNavInitialized = true;

        let navTriggered = false;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Control') { navTriggered = false; return; }
            if (e.ctrlKey && e.key === 'ArrowRight' && !navTriggered && !e.repeat) {
                navTriggered = true;
                e.preventDefault();
                history.back();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control') navTriggered = false;
        });

        window.addEventListener('popstate', () => {
            waitForElement(() => document.querySelectorAll(MESSAGE_BUTTONS_SELECTOR).length > 0)
                .then(clickNextByTabIndex)
                .catch(() => setTimeout(clickNextByTabIndex, 1000));
        });
    }

    // ─── Order list scanning ──────────────────────────────────────────────────

    function scanButtons(buttons) {
        let reviewed = 0;

        buttons.forEach((btn, idx) => {
            const row = btn.closest('.panel-body-row');
            if (row?.querySelector('[data-icon="star"]')) {
                reviewed++;
                return;
            }
            btn.setAttribute('tabindex', String(idx + 1));
            btn.textContent = '...';
        });

        upsertProgressBar(reviewed, buttons.length);
        upsertRefreshButton(runScan);
    }

    // Throttled scan to avoid hammering on every mutation
    let _scanScheduled = false;
    function scheduleScan() {
        if (_scanScheduled) return;
        _scanScheduled = true;
        setTimeout(() => {
            _scanScheduled = false;
            runScan();
        }, 400);
    }

    function runScan() {
        const buttons = document.querySelectorAll(MESSAGE_BUTTONS_SELECTOR);
        if (!buttons.length) return;

        // Stop observing while we mutate the DOM ourselves to avoid feedback loops
        mainObserver.disconnect();
        scanButtons(buttons);
        mainObserver.observe(document.body, OBSERVER_OPTIONS);
    }

    // ─── Unified MutationObserver ─────────────────────────────────────────────

    const OBSERVER_OPTIONS = { childList: true, subtree: true };

    let lastPage = new URL(location.href).searchParams.get('page') ?? '1';
    let _pageChangeTimer = null;

    const mainObserver = new MutationObserver(() => {
        // 1. Detect page change (pagination)
        const currentPage = new URL(location.href).searchParams.get('page') ?? '1';
        if (currentPage !== lastPage) {
            lastPage = currentPage;
            clearTimeout(_pageChangeTimer);
            _pageChangeTimer = setTimeout(runScan, 2500);
            return;
        }

        // 2. Run scan when message buttons appear
        if (document.querySelectorAll(MESSAGE_BUTTONS_SELECTOR).length > 0) {
            scheduleScan();
        }
    });

    // ─── Keyboard shortcuts ───────────────────────────────────────────────────

    document.addEventListener('keydown', async (e) => {
        if (!e.ctrlKey) return;

        if (!e.altKey) {
            const msgKey = KEY_MAP[e.code];
            if (msgKey) { e.preventDefault(); await insertMessage(msgKey); return; }

            if (e.code === 'Backquote') { e.preventDefault(); insertShortcutTable(); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); await autoProcess(); return; }
        }

        if (e.altKey) {
            e.preventDefault();
            await sendMessage();
        }
    });

    // ─── Init ─────────────────────────────────────────────────────────────────

    async function initialize() {
        await loadConfig();
        GM.registerMenuCommand('Ayarlar', showConfigMenu);
        initNavigation();

        // Insert shortcut table if already on an order page
        insertShortcutTable();
        hideProtectionBanners();

        mainObserver.observe(document.body, OBSERVER_OPTIONS);

        showToast('Message Tool Ready — CTRL + ↓ (auto process)', 'info', 4000);
    }

    initialize();
})();
