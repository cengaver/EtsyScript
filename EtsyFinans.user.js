// ==UserScript==
// @name         Etsy Finans
// @description  Etsy monthly statement analyzer — Optimized v2
// @version      2.00
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/account/payments/monthly-statement*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @connect      www.tcmb.gov.tr
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyFinans.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyFinans.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ─────────────────────────────────────────────
    // STYLES
    // ─────────────────────────────────────────────
    GM.addStyle(`
        :root {
            --pc:#4285f4; --sc:#34a853; --dc:#ea4335;
            --wc:#fbbc05; --dk:#202124; --gc:#5f6368;
            --br:4px; --bs:0 2px 10px rgba(0,0,0,.1);
            --tr:all .3s ease; --ff:'Segoe UI',Roboto,Arial,sans-serif;
        }
        .ef-toast-wrap { position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none; }
        .ef-toast { min-width:280px; padding:12px 16px; border-radius:var(--br); box-shadow:var(--bs); font:14px var(--ff); display:flex; align-items:center; justify-content:space-between; opacity:0; transform:translateY(16px); transition:var(--tr); pointer-events:all; }
        .ef-toast.show { opacity:1; transform:translateY(0); }
        .ef-toast.success { background:var(--sc); color:#fff; }
        .ef-toast.error   { background:var(--dc); color:#fff; }
        .ef-toast.warning { background:var(--wc); color:var(--dk); }
        .ef-toast.info    { background:var(--pc); color:#fff; }
        .ef-toast-x { background:none; border:none; color:inherit; cursor:pointer; font-size:16px; margin-left:10px; opacity:.7; }
        .ef-toast-x:hover { opacity:1; }
    `);

    // ─────────────────────────────────────────────
    // SETTINGS — in-memory cache
    // ─────────────────────────────────────────────
    const _cfg = { sheetUrl: null, shopName: null };

    async function getSheetUrl() { return _cfg.sheetUrl ??= await GM.getValue('sheet_url', ''); }
    async function getShopName() { return _cfg.shopName ??= await GM.getValue('shop_name', ''); }

    GM.registerMenuCommand('⚙️ Sheet Url Ayarla', async () => {
        const url = prompt('Sheet URL\'nizi girin:', await getSheetUrl());
        if (url?.trim()) { _cfg.sheetUrl = url.trim(); await GM.setValue('sheet_url', _cfg.sheetUrl); showToast('✅ Kaydedildi', 'info'); }
    });
    GM.registerMenuCommand('⭐ Mağaza Adı', async () => {
        const name = prompt('Mağaza Adını girin:', await getShopName());
        if (name?.trim()) { _cfg.shopName = name.trim(); await GM.setValue('shop_name', _cfg.shopName); showToast('✅ Kaydedildi', 'info'); }
    });
    GM.registerMenuCommand('🔄 Güncelle', () => processPage(true));

    // ─────────────────────────────────────────────
    // TOAST
    // ─────────────────────────────────────────────
    let _toastWrap = null;
    function getToastWrap() {
        if (!_toastWrap) {
            _toastWrap = Object.assign(document.createElement('div'), { className:'ef-toast-wrap' });
            document.body.appendChild(_toastWrap);
        }
        return _toastWrap;
    }
    function showToast(msg, type = 'success', duration = 3000) {
        const t = document.createElement('div');
        t.className = `ef-toast ${type}`;
        const s = Object.assign(document.createElement('span'), { textContent: msg });
        const x = Object.assign(document.createElement('button'), { className:'ef-toast-x', innerHTML:'&times;' });
        x.onclick = () => dismissToast(t);
        t.append(s, x);
        getToastWrap().appendChild(t);
        t.getBoundingClientRect(); // force reflow
        t.classList.add('show');
        if (duration > 0) setTimeout(() => dismissToast(t), duration);
    }
    function dismissToast(t) {
        t.classList.remove('show');
        t.addEventListener('transitionend', () => t.remove(), { once: true });
    }

    // ─────────────────────────────────────────────
    // EXCHANGE RATE — localStorage cache (7h TTL)
    // Cached in-memory after first resolve to avoid repeated LS reads
    // ─────────────────────────────────────────────
    const RATE_KEY  = 'excData';
    const RATE_TS   = 'excData_timestamp';
    const RATE_TTL  = 7 * 60 * 60 * 1000; // 7 hours
    let _ratePromise = null;

    function getExchangeRate() {
        if (_ratePromise) return _ratePromise;

        const cached = Number(localStorage.getItem(RATE_KEY));
        const ts     = Number(localStorage.getItem(RATE_TS));
        if (cached && ts && Date.now() - ts < RATE_TTL) {
            return (_ratePromise = Promise.resolve(cached));
        }

        _ratePromise = new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'GET',
                url: 'https://www.tcmb.gov.tr/kurlar/today.xml',
                onload(r) {
                    if (r.status !== 200) return reject(r.statusText);
                    const xml  = new DOMParser().parseFromString(r.responseText, 'text/xml');
                    const text = xml.querySelector('Currency[CurrencyCode="USD"] BanknoteSelling')?.textContent;
                    const rate = Number(text?.replace(',', '.'));
                    if (!rate) return reject('Kur parse edilemedi');
                    localStorage.setItem(RATE_KEY, rate);
                    localStorage.setItem(RATE_TS,  Date.now());
                    resolve(rate);
                },
                onerror: reject,
            });
        });
        return _ratePromise;
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────
    const parseAmount = str => parseFloat((str ?? '').replace(/[^0-9.-]+/g, '')) || 0;

    /** Append or update a labelled <span> inside an element */
    function addText(el, cls, text) {
        const anchor = el.querySelector?.('[data-test-id="accordion-total"]') ?? el;
        if (!anchor) return;
        let span = anchor.querySelector(`span.${cls}`);
        if (!span) {
            span = Object.assign(document.createElement('span'), { className: cls });
            span.style.marginLeft = '0.5em';
            anchor.appendChild(span);
        }
        span.textContent = text;
    }

    const getSummaryValue = el =>
        parseAmount(el.querySelector('[data-test-id="accordion-total"]')?.textContent);

    const getSummaryTitle = el =>
        el.querySelector('button .wt-text-title-01')?.textContent ?? '';

    // ─────────────────────────────────────────────
    // GOOGLE SHEETS LOG — fire-and-forget
    // ─────────────────────────────────────────────
    async function logToSheets(payload) {
        const url = await getSheetUrl();
        if (!url) return;
        GM.xmlHttpRequest({
            method: 'POST', url,
            data: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            onload(r) {
                try {
                    const d = JSON.parse(r.response);
                    if (d.status === 'success') showToast('Başarıyla hesaplandı', 'success');
                    else console.warn('[EF] Sheet error:', d.message);
                } catch { console.warn('[EF] JSON parse failed:', r.response); }
            },
            onerror: err => console.warn('[EF] Request failed:', err),
        });
    }

    // ─────────────────────────────────────────────
    // PROCESS PAGE
    //
    // sendToSheet=false  → only update UI annotations
    // sendToSheet=true   → UI + send to Google Sheets
    // ─────────────────────────────────────────────
    let _processing = false;

    async function processPage(sendToSheet = false) {
        if (_processing) return;
        _processing = true;
        try {
            await _processPage(sendToSheet);
        } finally {
            _processing = false;
        }
    }

    async function _processPage(sendToSheet) {
        const profitEl      = document.querySelector('[data-test-id="profit-amount"]');
        const summaryEls    = [...document.querySelectorAll('[data-test-id="summary-module"]')];
        if (!profitEl || !summaryEls.length) return;

        const salesEl      = summaryEls.find(el => getSummaryTitle(el) === 'Sales');
        const feesEl       = summaryEls.find(el => getSummaryTitle(el) === 'Fees');
        const marketingEl  = summaryEls.find(el => getSummaryTitle(el) === 'Marketing');
        if (!salesEl || !feesEl || !marketingEl) return;

        let rate;
        try { rate = await getExchangeRate(); }
        catch (e) { console.error('[EF] Kur alınamadı:', e); return; }

        // If values are already in USD (no "TL" text), treat rate as 1
        const divisor = summaryEls[0]?.textContent.includes('TL') ? rate : 1;

        // ── Annotate all summary modules ──────────────
        summaryEls.forEach(el => {
            const usd = getSummaryValue(el) / divisor;
            addText(el, 'ef-usd', ` | ${usd.toFixed(2)} $`);
        });

        // ── Profit ───────────────────────────────────
        const profit    = parseAmount(profitEl.textContent);
        const profitUsd = profit / divisor;
        addText(profitEl, 'ef-usd', ` (${profitUsd.toFixed(2)} USD)`);

        // ── Ratios ───────────────────────────────────
        const sales     = getSummaryValue(salesEl);
        const fees      = getSummaryValue(feesEl);
        const marketing = getSummaryValue(marketingEl);

        if (!sales) return;

        const feesPct      = Math.abs((fees      / sales) * 100);
        const marketingPct = Math.abs((marketing / sales) * 100);

        addText(feesEl,      'ef-pct', ` | ${feesPct.toFixed(2)} %`);
        addText(marketingEl, 'ef-pct', ` | ${marketingPct.toFixed(2)} %`);

        if (!sendToSheet) return;

        const periodText = document.querySelector('span.wt-menu__trigger__label.month-dropdown-item')?.textContent ?? '';
        await logToSheets({
            shopName:        await getShopName(),
            sales:           Math.round(sales      / divisor),
            fees:            Math.abs(Math.round(fees      / divisor)),
            marketing:       Math.abs(Math.round(marketing / divisor)),
            feesProfit:      feesPct.toFixed(2),
            marketingProfit: marketingPct.toFixed(2),
            period:          periodText,
            sheetName:       'finans',
        });
    }

    // ─────────────────────────────────────────────
    // PERIOD CHANGE DETECTION
    //
    // Single MutationObserver on body handles everything:
    //  • UI re-annotation (debounced, no sheet send)
    //  • Period element watcher (no separate smallObserver needed)
    //
    // Using a single observer eliminates the "two observers on body" pattern.
    // ─────────────────────────────────────────────
    let _prevPeriod = '';
    let _debounce   = null;

    const debounced = () => {
        clearTimeout(_debounce);
        _debounce = setTimeout(() => processPage(false), 800);
    };

    new MutationObserver(() => {
        // Check if period changed — if so, send to sheet immediately
        const periodText = document.querySelector('span.wt-menu__trigger__label.month-dropdown-item')?.textContent ?? '';
        if (periodText && periodText !== _prevPeriod) {
            _prevPeriod = periodText;
            processPage(true);
            return; // skip debounce — processPage will re-annotate anyway
        }
        debounced();
    }).observe(document.body, { childList: true, subtree: true });

    // ─────────────────────────────────────────────
    // INIT — run UI pass on load, then send to sheet after short delay
    // ─────────────────────────────────────────────
    processPage(false);
    setTimeout(() => processPage(true), 2000);

})();
