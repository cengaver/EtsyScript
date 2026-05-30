// ==UserScript==
// @name         Etsy Review Pie Chart with Badge
// @namespace    https://github.com/cengaver
// @version      2.00
// @description  Reviews yanına pie chart ve badge — Optimized v2
// @match        https://www.etsy.com/your/shops/me/dashboard*
// @author       Cengaver
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewPieChart.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewPieChart.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ─────────────────────────────────────────────
    // SHEET URL — cached in memory to avoid repeated GM.getValue calls
    // ─────────────────────────────────────────────
    let _sheetUrl = null;

    async function getSheetUrl() {
        if (_sheetUrl !== null) return _sheetUrl;
        _sheetUrl = await GM.getValue('sheet_url', '');
        return _sheetUrl;
    }

    GM.registerMenuCommand('⚙️ Sheet Url Ayarla', async () => {
        const current = await getSheetUrl();
        const url = prompt('Sheet URL\'nizi girin:', current);
        if (url && url.trim()) {
            _sheetUrl = url.trim();
            await GM.setValue('sheet_url', _sheetUrl);
            alert('✅ Kaydedildi.');
        }
    });

    // ─────────────────────────────────────────────
    // GOOGLE SHEETS LOG — fire-and-forget, no toast spam
    // ─────────────────────────────────────────────
    async function logToSheets(payload) {
        const url = await getSheetUrl();
        if (!url) return;
        GM.xmlHttpRequest({
            method:  'POST',
            url,
            data:    JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            // Responses silently ignored — no user-facing toasts for background sync
            onerror: err => console.warn('[EtsyPie] Sheet log failed:', err),
        });
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────
    const parseCount = str => parseInt((str ?? '').replace(/\D/g, ''), 10) || 0;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    function svgEl(tag, attrs) {
        const el = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        return el;
    }

    // ─────────────────────────────────────────────
    // MAIN — addReviewPie
    // ─────────────────────────────────────────────
    async function addReviewPie() {
        const container = document.querySelector('.dashboard-header-metadata');
        if (!container || container.querySelector('.review-pie-wrapper')) return;

        const reviewsEl  = container.querySelector('a[href*="#reviews"] div:nth-child(2) > span:nth-child(2)');
        const salesEl    = container.querySelector('a[href*="/your/orders/sold"]');
        if (!reviewsEl || !salesEl) return;

        const reviews = parseCount(reviewsEl.textContent);
        const sales   = parseCount(salesEl.textContent);
        if (!reviews || !sales) return;

        const listingsEl      = container.querySelector('a[href*="tools/listings"]');
        const activeListings  = listingsEl ? parseCount(listingsEl.textContent) : null;

        const shopLinkEl = container.querySelector('a[href*="/shop/"]');
        const shopName   = shopLinkEl ? (shopLinkEl.href.split('/')[4]?.split('?')[0] ?? '') : '';

        const ratio = reviews / sales;
        const color = ratio >= 0.1 ? '#22c55e' : ratio >= 0.05 ? '#f97316' : '#ef4444';

        // ── SVG ring ──────────────────────────────
        const SIZE   = 24;
        const R      = SIZE / 2;
        const SW     = 6;
        const cr     = R - SW / 2;           // circle radius
        const circ   = 2 * Math.PI * cr;
        const offset = circ * (1 - Math.min(ratio, 1));

        const svg = svgEl('svg', { width: SIZE, height: SIZE, 'aria-hidden': 'true' });
        svg.appendChild(svgEl('circle', { cx:R, cy:R, r:cr, fill:'none', stroke:'#e5e7eb', 'stroke-width':SW }));
        svg.appendChild(svgEl('circle', {
            cx: R, cy: R, r: cr, fill: 'none',
            stroke: color, 'stroke-width': SW,
            'stroke-dasharray': circ,
            'stroke-dashoffset': offset,
            'stroke-linecap': 'round',
            transform: `rotate(-90 ${R} ${R})`,
            style: 'transition:stroke-dashoffset .4s ease',
        }));

        // ── Badge ─────────────────────────────────
        const badge = Object.assign(document.createElement('span'), {
            textContent: `${(ratio * 100).toFixed(1)}%`,
        });
        Object.assign(badge.style, {
            position: 'absolute', top: '-12px', right: '-24px',
            background: '#1f2937', color: '#fff',
            fontSize: '10px', padding: '1px 4px',
            borderRadius: '8px', fontWeight: '600', lineHeight: '14px',
            whiteSpace: 'nowrap',
        });

        // ── Wrapper ───────────────────────────────
        const wrapper = Object.assign(document.createElement('div'), { className: 'review-pie-wrapper' });
        Object.assign(wrapper.style, {
            display: 'inline-block', position: 'relative',
            marginLeft: '6px', verticalAlign: 'middle',
            width: `${SIZE}px`, height: `${SIZE}px`,
        });
        wrapper.title = `${reviews} yorum / ${sales} satış = %${(ratio * 100).toFixed(2)}`;
        wrapper.appendChild(svg);
        wrapper.appendChild(badge);

        reviewsEl.parentNode.appendChild(wrapper);

        // ── Log to Sheets ─────────────────────────
        await logToSheets({
            title:           shopName,
            sls:             sales,
            active_listings: activeListings ?? '',
            reviews,
            ratio:           (ratio * 100).toFixed(2),
            sheetName:       'dashboard',
        });
    }

    // ─────────────────────────────────────────────
    // OBSERVER — debounced to avoid hammering on
    // rapid DOM updates (Etsy SPA navigations)
    // ─────────────────────────────────────────────
    let _debounceTimer = null;

    const observer = new MutationObserver(() => {
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(addReviewPie, 300);
    });

    // Run immediately; if container not ready yet, observer will catch it
    addReviewPie();
    observer.observe(document.body, { childList: true, subtree: true });

})();
