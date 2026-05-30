// ==UserScript==
// @name         Etsy MesssageOrder CounterIndicator
// @namespace    https://github.com/cengaver
// @version      2.0.0
// @description  Message and Order CounterIndicator panel
// @match        https://www.etsy.com/your/shops/*
// @match        https://www.etsy.com/messages*
// @exclude      https://www.etsy.com/your/shops/me/advertising/*
// @exclude      https://www.etsy.com/your/shops/me/listing-editor/*
// @author       Cengaver
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyMessageAndOrderCounter.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyMessageAndOrderCounter.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ─── Styles ───────────────────────────────────────────────────────────────

    GM.addStyle(`
        .emc-toast-wrap {
            position: fixed; bottom: 20px; right: 20px;
            z-index: 10000; display: flex; flex-direction: column; gap: 8px;
            pointer-events: none;
        }
        .emc-toast {
            min-width: 240px; padding: 10px 14px;
            border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,.15);
            font: 14px 'Segoe UI', Roboto, Arial, sans-serif;
            display: flex; align-items: center; justify-content: space-between;
            opacity: 0; transform: translateY(12px);
            transition: opacity .25s ease, transform .25s ease;
            pointer-events: all;
        }
        .emc-toast.show { opacity: 1; transform: translateY(0); }
        .emc-toast--success { background: #34a853; color: #fff; }
        .emc-toast--error   { background: #ea4335; color: #fff; }
        .emc-toast--info    { background: #4285f4; color: #fff; }
        .emc-toast__close {
            background: none; border: none; color: inherit;
            cursor: pointer; font-size: 16px; margin-left: 8px; opacity: .7;
        }
        .emc-toast__close:hover { opacity: 1; }
    `);

    // ─── Toast ────────────────────────────────────────────────────────────────

    let _toastWrap = null;

    function getToastWrap() {
        if (!_toastWrap) {
            _toastWrap = document.createElement('div');
            _toastWrap.className = 'emc-toast-wrap';
            document.body.appendChild(_toastWrap);
        }
        return _toastWrap;
    }

    function showToast(message, type = 'success', duration = 3000) {
        const wrap  = getToastWrap();
        const toast = document.createElement('div');
        toast.className = `emc-toast emc-toast--${type}`;

        const span = document.createElement('span');
        span.textContent = message;

        const btn  = document.createElement('button');
        btn.className = 'emc-toast__close';
        btn.innerHTML = '&times;';
        btn.onclick   = () => dismiss(toast);

        toast.append(span, btn);
        wrap.appendChild(toast);

        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));

        if (duration > 0) setTimeout(() => dismiss(toast), duration);

        function dismiss(el) {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 260);
        }
    }

    // ─── Settings cache ───────────────────────────────────────────────────────

    const cfg = { sheetUrl: '', shopName: '' };

    async function loadSettings() {
        [cfg.sheetUrl, cfg.shopName] = await Promise.all([
            GM.getValue('sheet_url',  ''),
            GM.getValue('shop_name',  ''),
        ]);
    }

    // ─── Menu commands ────────────────────────────────────────────────────────

    GM.registerMenuCommand('⚙️ Sheet Url Ayarla', async () => {
        const url = prompt('Sheet Url\'nizi girin:', cfg.sheetUrl);
        if (!url?.trim()) return;
        cfg.sheetUrl = url.trim();
        await GM.setValue('sheet_url', cfg.sheetUrl);
        showToast('✅ Kaydedildi', 'info');
    });

    GM.registerMenuCommand('⚙️ Mağaza Adı', async () => {
        const shop = prompt('Mağaza adı girin:', cfg.shopName);
        if (!shop?.trim()) return;
        cfg.shopName = shop.trim();
        await GM.setValue('shop_name', cfg.shopName);
        showToast('✅ Kaydedildi', 'info');
    });

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Extract a numeric counter from a clg-counter-indicator shadow root */
    function readCounter(container, appKey) {
        const text = container
            .querySelector(`a[data-app-key="${appKey}"] clg-counter-indicator`)
            ?.shadowRoot
            ?.querySelector('.clg-counter-indicator__value')
            ?.textContent;
        if (!text) return 0;
        const n = parseInt(text.replace(/\D/g, ''), 10);
        return Number.isFinite(n) ? n : 0;
    }

    // ─── Sheet POST ───────────────────────────────────────────────────────────

    function sendToSheets(payload) {
        if (!cfg.sheetUrl) return;
        GM.xmlHttpRequest({
            method:  'POST',
            url:     cfg.sheetUrl,
            headers: { 'Content-Type': 'application/json' },
            data:    JSON.stringify(payload),
            onload: (res) => {
                try {
                    const data = JSON.parse(res.responseText);
                    if (data.status === 'success') {
                        showToast('✅ Güncellendi', 'success');
                    } else {
                        showToast('❌ Hata: ' + (data.message || 'Bilinmeyen'), 'error');
                    }
                } catch {
                    showToast('❌ Yanıt işlenemedi', 'error');
                }
            },
            onerror: (err) => {
                showToast('❌ Güncellenmedi: ' + (err?.message || 'Bilinmeyen hata'), 'error');
            },
        });
    }

    // ─── Core read ────────────────────────────────────────────────────────────

    // Track last sent values to avoid redundant POSTs on identical data
    let _lastMessage = -1;
    let _lastOrder   = -1;

    function readCounts() {
        const container = document.getElementById('shop-manager--tool-links');
        if (!container) return;

        const message = readCounter(container, 'messages');
        const order   = readCounter(container, 'orders');

        if (message === 0 && order === 0) return;
        if (message === _lastMessage && order === _lastOrder) return;   // no change

        _lastMessage = message;
        _lastOrder   = order;

        sendToSheets({
            shopName:  cfg.shopName,
            message,
            order,
            sheetName: 'counter',
        });
    }

    // ─── Throttled MutationObserver ───────────────────────────────────────────

    let _mutationTimer = null;

    function scheduledRead() {
        clearTimeout(_mutationTimer);
        _mutationTimer = setTimeout(readCounts, 500);
    }

    /**
     * Wait for #shop-manager--tool-links to appear before observing.
     * Handles cases where the element isn't in the DOM at script start.
     */
    function attachObserver() {
        const el = document.getElementById('shop-manager--tool-links');
        if (el) {
            new MutationObserver(scheduledRead).observe(el, {
                childList: true, subtree: true, characterData: true,
            });
            readCounts();
            return;
        }

        // Element not ready yet — watch body until it appears
        const bodyWatcher = new MutationObserver(() => {
            if (document.getElementById('shop-manager--tool-links')) {
                bodyWatcher.disconnect();
                attachObserver();   // re-run now that element exists
            }
        });
        bodyWatcher.observe(document.body, { childList: true, subtree: true });
    }

    // ─── Periodic sync (every 5 min) ─────────────────────────────────────────

    setInterval(() => {
        // Reset last-seen so the next readCounts always fires a POST
        _lastMessage = -1;
        _lastOrder   = -1;
        readCounts();
    }, 5 * 60 * 1000);

    // ─── Boot ─────────────────────────────────────────────────────────────────

    loadSettings().then(attachObserver);

})();
