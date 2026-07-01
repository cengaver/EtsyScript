// ==UserScript==
// @name         Open Links Sequentially for ETSY ad
// @version      3.00
// @description  Open all matching links with delay + ROAS coloring + progress panel (pause/play/stop)
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
    // ─────────────────────────────────────────────
    const _coloredRows = new WeakSet();

    function colorRoas() {
        document.querySelectorAll(SEL_ROWS).forEach(row => {
            if (_coloredRows.has(row)) return;
            _coloredRows.add(row);

            const span = row.querySelector(SEL_ROAS);
            if (!span) return;

            const apply = () => {
                const val = parseFloat(span.textContent.trim()) || 0;
                row.style.backgroundColor = val < 2 ? LOW_ROAS_BG : HIGH_ROAS_BG;
            };

            apply();
            new MutationObserver(apply).observe(span, { childList: true, characterData: true, subtree: true });
        });
    }

    // ─────────────────────────────────────────────
    // SEQUENTIAL LINK OPENER (with pause / stop / progress panel)
    // ─────────────────────────────────────────────
    let links = [];
    let currentIndex = 0;
    let mod = 0;
    let delay = 0;
    let remainingMs = 0;
    let tickInterval = null;
    let running = false;
    let paused = false;

    function fmtSeconds(ms) {
        return Math.max(0, Math.ceil(ms / 1000));
    }

    function openNextLink() {
        if (!running) return;

        if (currentIndex >= links.length) {
            finishOpening();
            return;
        }

        const link = links[currentIndex];
        window.open(`${link.href}&mod=${mod}`, '_blank');
        currentIndex++;
        updatePanel();

        if (currentIndex >= links.length) {
            finishOpening();
            return;
        }

        remainingMs = delay;
        runCountdown();
    }

    function runCountdown() {
        clearInterval(tickInterval);
        tickInterval = setInterval(() => {
            if (!running || paused) return;
            remainingMs -= 250;
            updatePanel();
            if (remainingMs <= 0) {
                clearInterval(tickInterval);
                openNextLink();
            }
        }, 250);
    }

    function startOpening(modArg) {
        const foundLinks = [...document.querySelectorAll(SEL_LINKS)];
        if (!foundLinks.length) return;

        // If already running, stop the previous run first
        if (running) stopOpening();

        links = foundLinks;
        mod = modArg;
        delay = TIMER[mod] ?? 80_000;
        currentIndex = 0;
        remainingMs = 0;
        running = true;
        paused = false;

        createPanel();
        openNextLink();
    }

    function togglePause() {
        if (!running) return;
        paused = !paused;
        updatePanel();
    }

    function forceNext() {
        if (!running) return;
        clearInterval(tickInterval);
        tickInterval = null;
        paused = false;
        openNextLink();
    }

    function stopOpening() {
        running = false;
        paused = false;
        clearInterval(tickInterval);
        tickInterval = null;
        removePanel();
    }

    function finishOpening() {
        running = false;
        paused = false;
        clearInterval(tickInterval);
        tickInterval = null;
        updatePanel(); // show "done" state briefly
        setTimeout(() => {
            removePanel();
            window.close();
        }, 1500);
    }

    // ─────────────────────────────────────────────
    // PROGRESS PANEL UI
    // ─────────────────────────────────────────────
    let panelEl = null;
    let progressText = null;
    let countdownText = null;
    let pauseBtn = null;

    function createPanel() {
        removePanel();

        panelEl = document.createElement('div');
        panelEl.id = 'etsy-seq-panel';
        Object.assign(panelEl.style, {
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: '999999',
            background: 'rgba(20, 20, 20, 0.9)',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            minWidth: '190px',
            userSelect: 'none',
        });

        progressText = document.createElement('div');
        progressText.style.fontWeight = 'bold';
        progressText.style.marginBottom = '4px';

        countdownText = document.createElement('div');
        countdownText.style.opacity = '0.85';
        countdownText.style.marginBottom = '10px';

        const btnRow = document.createElement('div');
        Object.assign(btnRow.style, { display: 'flex', gap: '8px' });

        pauseBtn = document.createElement('button');
        pauseBtn.textContent = '⏸ Pause';
        styleButton(pauseBtn);
        pauseBtn.addEventListener('click', togglePause);

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '⏭ Next';
        styleButton(nextBtn);
        nextBtn.addEventListener('click', forceNext);

        const stopBtn = document.createElement('button');
        stopBtn.textContent = '⏹ Stop';
        styleButton(stopBtn);
        stopBtn.addEventListener('click', stopOpening);

        btnRow.append(pauseBtn, nextBtn, stopBtn);
        panelEl.append(progressText, countdownText, btnRow);
        document.body.appendChild(panelEl);

        updatePanel();
    }

    function styleButton(btn) {
        Object.assign(btn.style, {
            flex: '1',
            cursor: 'pointer',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 0',
            background: '#444',
            color: '#fff',
            fontSize: '13px',
        });
        btn.addEventListener('mouseenter', () => (btn.style.background = '#666'));
        btn.addEventListener('mouseleave', () => (btn.style.background = '#444'));
    }

    function updatePanel() {
        if (!panelEl) return;

        const shown = Math.min(currentIndex, links.length);
        progressText.textContent = `Link ${shown} / ${links.length}`;

        if (!running) {
            countdownText.textContent = shown >= links.length ? '✅ Tamamlandı' : '⏹ Durduruldu';
        } else if (paused) {
            countdownText.textContent = `⏸ Duraklatıldı (${fmtSeconds(remainingMs)}s kaldı)`;
        } else if (currentIndex >= links.length) {
            countdownText.textContent = '✅ Tamamlandı';
        } else {
            countdownText.textContent = `Sonraki: ${fmtSeconds(remainingMs)} sn`;
        }

        if (pauseBtn) pauseBtn.textContent = paused ? '▶ Play' : '⏸ Pause';
    }

    function removePanel() {
        if (panelEl) {
            panelEl.remove();
            panelEl = null;
            progressText = null;
            countdownText = null;
            pauseBtn = null;
        }
    }

    // ─────────────────────────────────────────────
    // KEYBOARD SHORTCUTS
    // ─────────────────────────────────────────────
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.altKey)              startOpening(0);
        if (e.ctrlKey && e.code === 'Space')    startOpening(1);
        if (e.ctrlKey && e.code === 'ArrowRight') forceNext();
    });

    // ─────────────────────────────────────────────
    // OBSERVER — debounced ROAS coloring
    // ─────────────────────────────────────────────
    let _debounce = null;
    new MutationObserver(() => {
        clearTimeout(_debounce);
        _debounce = setTimeout(colorRoas, 200);
    }).observe(document.body, { childList: true, subtree: true });

    colorRoas();

})();
