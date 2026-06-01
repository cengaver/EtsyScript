// ==UserScript==
// @name         Open Links Sequentially for ETSY ad
// @version      2.01
// @description  Open all matching links with delay + ROAS coloring — Optimized v2
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/advertising?ref=seller-platform-mcnav
// @icon         https://www.google.com/s2/favicons?sz=64&domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/openLinksSequentially.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/openLinksSequentially.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ─────────────────────────────────────────────
    // SELECTORS
    // ─────────────────────────────────────────────
    const SEL_ROWS  = '#listings-header > table > tbody > tr';
    const SEL_ROAS  = 'td:nth-child(11) > span';
    const SEL_LINKS = '#listings-header > table > tbody > tr > td.wt-table__row__cell.wt-pr-xs-3.wt-text-left-xs.wt-table__row__cell.wt-display-table-cell.wt-pt-xs-2.wt-pb-xs-2.wt-z-index-1 > div > div > a';

    const TIMER = { 0: 80_000, 1: 200_000 };
    const LOW_ROAS_BG  = '#ffa59e';
    const HIGH_ROAS_BG = '';

    // ─────────────────────────────────────────────
    // COLOR ROAS
    // Row'ları her DOM değişikliğinde re-color etmek için
    // WeakSet ile zaten renklendirilmiş satırları izliyoruz;
    // böylece aynı satıra defalarca setTimeout açılmıyor.
    // ─────────────────────────────────────────────
    const _coloredRows = new WeakSet();

    function colorRoas() {
        document.querySelectorAll(SEL_ROWS).forEach(row => {
            if (_coloredRows.has(row)) return; // already handled this DOM node
            _coloredRows.add(row);

            const span = row.querySelector(SEL_ROAS);
            if (!span) return;

            // Use MutationObserver on the span so we re-color if value updates later
            const apply = () => {
                const val = parseFloat(span.textContent.trim()) || 0;
                row.style.backgroundColor = val < 2 ? LOW_ROAS_BG : HIGH_ROAS_BG;
            };

            apply(); // immediate
            new MutationObserver(apply).observe(span, { childList: true, characterData: true, subtree: true });
        });
    }

    // ─────────────────────────────────────────────
    // OPEN LINKS
    // ─────────────────────────────────────────────
    function openLinks(mod) {
        const links = [...document.querySelectorAll(SEL_LINKS)];
        if (!links.length) return;

        const delay = TIMER[mod] ?? 80_000;

        links.forEach((link, i) => {
            setTimeout(() => {
                window.open(`${link.href}&mod=${mod}`, '_blank');
                if (i === links.length - 1) window.close();
            }, i * delay);
        });
    }

    // ─────────────────────────────────────────────
    // KEYBOARD SHORTCUTS
    // ─────────────────────────────────────────────
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.altKey)              openLinks(0);
        if (e.ctrlKey && e.code === 'Space')    openLinks(1);
    });

    // ─────────────────────────────────────────────
    // OBSERVER — debounced; only re-runs colorRoas on new nodes
    // ─────────────────────────────────────────────
    let _debounce = null;
    new MutationObserver(() => {
        clearTimeout(_debounce);
        _debounce = setTimeout(colorRoas, 200);
    }).observe(document.body, { childList: true, subtree: true });

    // Initial pass (table may already be rendered)
    colorRoas();

})();
