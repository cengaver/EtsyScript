// ==UserScript==
// @name         Etsy Marketplace Insights - Search/Listings Percent
// @version      1.13
// @author       Cengaver
// @namespace    https://github.com/cengaver
// @description  Adds a "Percentes" column to the similar-terms table showing searches/listings % and updates live on mutation.
// @match        https://www.etsy.com/your/shops/me/marketplace-insights/search*
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyMarketplaceInsights.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyMarketplaceInsights.user.js
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const CONTAINER_SELECTOR = '.kr-similar-term-container';
    const HEADER_ROW_SELECTOR = '.kr-similar-term-row.wt-display-flex-xs.wt-text-left-xs';
    const ROW_SELECTOR = '.kr-similar-term-row';
    const HEADER_ROW_MATCH_TEXT = 'Search results';
    const PERCENT_CELL_CLASS = 'kc-percent-cell';

    function parseCompactNumber(str){
        if (!str) return NaN;
        str = String(str).trim().toLowerCase();
        const token = str.split(/\s+/)[0].replace(/,/g, '');
        const m = token.match(/^(-?[\d.,]+)([kmbt]?)$/i);
        if (!m) {
            const n = Number(token.replace(/[^0-9.-]/g,''));
            return isNaN(n) ? NaN : n;
        }
        let value = Number(m[1].replace(/,/g, ''));
        const suf = m[2];
        if (isNaN(value)) return NaN;
        if (suf === 'k') value *= 1e3;
        else if (suf === 'm') value *= 1e6;
        else if (suf === 'b') value *= 1e9;
        else if (suf === 't') value *= 1e12;
        return value;
    }

    function formatPercent(p){
        if (!isFinite(p) || isNaN(p)) return '—';
        return p.toFixed(2) + '%';
    }

    function ensureHeader(container){
        if (!container) return;

        const headerClassName = PERCENT_CELL_CLASS + '-header';

        // Tam olarak verdiğin header satırını seç
        const headerRow = document.querySelector(HEADER_ROW_SELECTOR);
        if (!headerRow) return;

        // Eğer zaten eklendiyse tekrar ekleme
        if (headerRow.querySelector('.' + headerClassName)) return;

        // Yeni hücre oluştur
        const headerCell = document.createElement('div');
        headerCell.className = 'wt-flex-grow-xs-1 wt-pt-xs-3 wt-pb-xs-3 kr-similar-term-row kr-similar-term-row-data wt-text-title-small ' + headerClassName;
        headerCell.textContent = 'Percentes';
        headerRow.appendChild(headerCell);
    }

    function updateRows(container){
        if (!container) return;
        const rows = Array.from(container.querySelectorAll(ROW_SELECTOR));
        for (const row of rows){
            const text = row.textContent || '';
            const isHeader = /\bSearch terms\b|\bSearches\b|\bSearch results\b/.test(text);
            if (isHeader) continue;

            const directDataCols = Array.from(row.children).filter(ch => ch.classList && ch.className.includes('kr-similar-term-row-data'));
            let searchesText = '', listingsText = '';
            if (directDataCols.length >= 2){
                searchesText = directDataCols[0].textContent.trim();
                listingsText = directDataCols[1].textContent.trim();
            } else {
                const spans = Array.from(row.querySelectorAll('span.wt-text-body-small, span.wt-text-title-small'));
                if (spans.length >= 2){
                    searchesText = spans[0].textContent.trim();
                    listingsText = spans[1].textContent.trim();
                } else continue;
            }

            const searches = parseCompactNumber(searchesText);
            const listings = parseCompactNumber(listingsText);
            let percent = NaN;
            if (isFinite(searches) && isFinite(listings) && listings !== 0) percent = (searches / listings) * 100;

            let percentCell = row.querySelector('.' + PERCENT_CELL_CLASS);
            if (!percentCell){
                const newCell = document.createElement('div');
                newCell.className = 'wt-flex-grow-xs-1 wt-pt-xs-3 wt-pb-xs-3 wt-pr-xs-2 kr-similar-term-row kr-similar-term-row-data ' + PERCENT_CELL_CLASS;
                newCell.style.minWidth = '80px';
                row.appendChild(newCell);
                percentCell = newCell;
            }
            percentCell.textContent = formatPercent(percent);

            // Renkleri uygula
            percentCell.style.backgroundColor = '';
            if (!isNaN(percent) && isFinite(percent)) {
                if (percent > 100) {percentCell.style.backgroundColor = 'darkgreen';percentCell.style.color = 'white'}
                else if (percent > 50) percentCell.style.backgroundColor = 'green';
                else if (percent > 20) percentCell.style.backgroundColor = 'lightgreen';
                else if (percent > 10) percentCell.style.backgroundColor = 'yellowgreen';
                else if (percent > 1) percentCell.style.backgroundColor = 'yellow';
            }

        }
    }

    function init(){
        const container = document.querySelector(CONTAINER_SELECTOR);
        if (!container) { setTimeout(init, 500); return; }

        ensureHeader(container);
        updateRows(container);

        const observer = new MutationObserver(() => {
            if (observer._timeout) clearTimeout(observer._timeout);
            observer._timeout = setTimeout(() => {
                ensureHeader(container);
                updateRows(container);
                observer.disconnect(); // İşlem tamamlandı, izlemeyi durdur
            }, 1000);
        });

        observer.observe(container, {childList: true, subtree: true, characterData: true});

    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
