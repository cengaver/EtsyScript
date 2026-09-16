// ==UserScript==
// @name         Etsy Ad Wordlist
// @description  Ad Wordlist for T-shirt
// @version      2.3.3
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/advertising/listings/*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addElement
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @connect      raw.githubusercontent.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @require      https://cdn.jsdelivr.net/npm/notyf@3.0.0/notyf.min.js
// @resource     notyf-css https://cdn.jsdelivr.net/npm/notyf@3.0.0/notyf.min.css
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AdWordlist.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AdWordlist.user.js
// ==/UserScript==

(function () {
    'use strict';

    const WORD_LIST_URL = 'https://raw.githubusercontent.com/cengaver/EtsyScript/refs/heads/main/blackListWord.json';

    const DEFAULT_SHEET_CONFIG = {
        sheet_url: '',
        shop_name: '',
        version: GM_info.script.version,
    };

    const COLUMN_KEYS = ['roas', 'orders', 'spend', 'revenue', 'clicks', 'clickRate', 'views'];

    const DEFAULT_WORDLIST = `dtf
svg
png
sticker
zip
hat
cup
slippers
doll
top
design
decal
embroider
transfer
iron on
pants
earrings
jewelry
purse
ornament
headband
bracelet
necklace
decor
patch
cardigan
skirt
mug
bag
tumbler
dxf
vinyl
glitter
cricut
ready to press
jacket
=football
=men's hoodies
=nurse
=shirt
=mens sweatshirt
=gender-neutral adult sweatshirts
=gender-neutral adult hoodies
=baseball
=tshirt
=comfort colors
=graphic tees
socks
=hoody
=hoddy
=hoodie
=womens hoodie
=womens sweatshirts
=women's sweatshirts
=women hoodies
=graphic hoodies
=graphic hoodie
=hoddies' for women
=graphic hoodies for women
=sweatshirt
=sweater
=mens hoodies
=hoodie women
=hoodies for men
=trendy hoodies
=oversized hoodie
=trendy
=graphic sweatshirt
=plus size hoodie
=toddler
=halloween
=basketball`;

    let _notyf = null;

    function getToast() {
        if (!_notyf) {
            GM_addElement('style', {
                type: 'text/css',
                textContent: GM_getResourceText('notyf-css'),
            });
            _notyf = new Notyf.Notyf();
        }
        return _notyf;
    }

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const randInt = (lo, hi) =>
        Math.floor(Math.random() * (hi - lo + 1)) + lo;

    function xmlGet(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: (r) => (
                    r.status === 200
                        ? resolve(r.responseText)
                        : reject(new Error(`HTTP ${r.status}`))
                ),
                onerror: (e) => reject(e),
            });
        });
    }

    function xmlPost(url, jsonBody) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(jsonBody),
                onload: (r) => resolve(r),
                onerror: (e) => reject(e),
            });
        });
    }

    async function loadSheetConfig() {
        const raw = await GM.getValue('sheetConfig', '');

        if (!raw) {
            await GM.setValue(
                'sheetConfig',
                JSON.stringify(DEFAULT_SHEET_CONFIG)
            );
            return { ...DEFAULT_SHEET_CONFIG };
        }

        try {
            return {
                ...DEFAULT_SHEET_CONFIG,
                ...JSON.parse(raw),
            };
        } catch {
            return { ...DEFAULT_SHEET_CONFIG };
        }
    }

    async function saveSheetConfig(config) {
        await GM.setValue(
            'sheetConfig',
            JSON.stringify(config)
        );
    }

    async function editSheetConfig() {
        const config = await loadSheetConfig();

        const newShop = window.prompt(
            'Mağaza adı:',
            config.shop_name || ''
        );

        if (newShop === null) return;

        config.shop_name = newShop.trim();

        const newUrl = window.prompt(
            'Google Sheet (Apps Script) URL:',
            config.sheet_url || ''
        );

        if (newUrl === null) return;

        config.sheet_url = newUrl.trim();

        await saveSheetConfig(config);

        getToast().success('Sheet ayarları kaydedildi.');
    }

    async function syncVersionIfChanged() {
        const config = await loadSheetConfig();

        if (config.version === GM_info.script.version) {
            return;
        }

        config.version = GM_info.script.version;

        await saveSheetConfig(config);

        if (!config.sheet_url) return;

        try {
            await xmlPost(config.sheet_url, {
                sheetName: 'ads',
                action: 'updateVersion',
                shop_name: config.shop_name || 'Bilinmiyor',
                listing_id: getListingId(),
                script_version: config.version,
                timestamp: new Date().toISOString(),
            });
        } catch {
        }
    }

    function getListingId() {
        const m = location.pathname.match(/listings\/(\d+)/);
        return m ? m[1] : null;
    }

    async function loadWordlist() {
        let raw = await GM.getValue('adWordlist', '');

        if (!raw.trim()) {
            raw = DEFAULT_WORDLIST;
            await GM.setValue('adWordlist', raw);
        }

        return raw
            .split('\n')
            .map((w) => w.replace(/\r/g, '').trim())
            .filter((w) => w.length > 0);
    }

    function normalizeText(text) {
        return String(text || '')
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function wordMatchesRow(word, rowWord) {
        if (!rowWord) return false;

        const target = normalizeText(rowWord);
        const pattern = normalizeText(word);

        if (pattern.startsWith('=')) {
            return target === pattern.slice(1).trim();
        }

        if (
            pattern.startsWith('/') &&
            pattern.endsWith('/') &&
            pattern.length > 2
        ) {
            try {
                return new RegExp(
                    pattern.slice(1, -1),
                    'i'
                ).test(rowWord);
            } catch {
                return false;
            }
        }

        return target.includes(pattern);
    }

    function getRowWord(rowEl) {
        if (!rowEl) return null;

        const wordCell = rowEl.querySelector(
            'th.wt-table__row__cell'
        );

        if (!wordCell) return null;

        const selectors = [
            '.wt-content-toggle__body-wrapper p',
            '.wt-content-toggle__body p',
            '.wt-content-toggle__body-wrapper',
            '.wt-content-toggle__body',
            'p',
        ];

        for (const selector of selectors) {
            const elements = wordCell.querySelectorAll(selector);

            for (const el of elements) {
                const text = el.textContent
                    .replace(/\u00a0/g, ' ')
                    .trim();

                if (
                    text &&
                    text.toLowerCase() !== 'targeted keyword'
                ) {
                    return text;
                }
            }
        }

        const clone = wordCell.cloneNode(true);

        clone
            .querySelectorAll(
                '.wt-table--responsive__title,' +
                'button,' +
                'label,' +
                'input,' +
                'svg'
            )
            .forEach((el) => el.remove());

        const fallback = clone.textContent
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return fallback || null;
    }

    function getKeywordsTable() {
        const knownTable = document.querySelector(
            '#listing-detail-targeted-keywords-accordion table'
        );

        if (knownTable) {
            return knownTable;
        }

        const tables = Array.from(
            document.querySelectorAll('table')
        );

        return tables.find((table) => {
            const header = Array.from(
                table.querySelectorAll('thead th')
            ).find((th) =>
                normalizeText(th.textContent)
                    .startsWith('targeted keyword')
            );

            return !!header;
        }) || null;
    }

    function getKeywordsContainer() {
        const byId = document.getElementById(
            'listing-detail-targeted-keywords-accordion'
        );

        if (byId) {
            return byId;
        }

        const table = getKeywordsTable();

        if (!table) {
            return null;
        }

        let el = table;

        for (let i = 0; i < 8 && el; i++) {
            if (el.querySelector('nav')) {
                return el;
            }

            el = el.parentElement;
        }

        return table.parentElement || table;
    }

    function getAllRows() {
        const container = getKeywordsContainer();

        if (!container) {
            return [];
        }

        const rows = Array.from(
            container.querySelectorAll('tbody tr.wt-table__row')
        );

        if (rows.length) {
            return rows.filter((row) => {
                const checkbox = row.querySelector(
                    'input[type="checkbox"]'
                );

                const keyword = getRowWord(row);

                return !!checkbox && !!keyword;
            });
        }

        return Array.from(
            container.querySelectorAll('tr.wt-table__row')
        ).filter((row) => {
            const checkbox = row.querySelector(
                'input[type="checkbox"]'
            );

            const keyword = getRowWord(row);

            return !!checkbox && !!keyword;
        });
    }

    async function waitForKeywordTable(
        timeout = 15000,
        minRows = 1
    ) {
        const started = Date.now();

        while (Date.now() - started < timeout) {
            const table = getKeywordsTable();
            const rows = getAllRows();

            if (table && rows.length >= minRows) {
                return {
                    table,
                    rows,
                };
            }

            await sleep(250);
        }

        return {
            table: getKeywordsTable(),
            rows: getAllRows(),
        };
    }

    async function waitForRowsChange(
        previousSignature,
        timeout = 15000
    ) {
        const started = Date.now();

        while (Date.now() - started < timeout) {
            const rows = getAllRows();

            const signature = rows
                .map((row) => getRowWord(row))
                .filter(Boolean)
                .join('|');

            if (
                rows.length > 0 &&
                signature &&
                signature !== previousSignature
            ) {
                return rows;
            }

            await sleep(250);
        }

        return getAllRows();
    }

    async function getFilteredRows() {
        const wordlist = await loadWordlist();

        return getAllRows().filter((row) => {
            const word = getRowWord(row);

            return wordlist.some((w) =>
                wordMatchesRow(w, word)
            );
        });
    }

    function getCellValue(cellEl) {
        if (!cellEl) return '';

        const labelEl = cellEl.querySelector(
            '.wt-table--responsive__title'
        );

        const label = labelEl
            ? labelEl.textContent.trim()
            : '';

        let full = cellEl.textContent
            .replace(/\u00a0/g, ' ')
            .trim();

        if (label && full.startsWith(label)) {
            full = full
                .slice(label.length)
                .trim();
        }

        return full;
    }

    function parseNumber(value) {
        if (value === null || value === undefined) {
            return 0;
        }

        let text = String(value)
            .replace(/\u00a0/g, ' ')
            .trim();

        if (!text) return 0;

        text = text
            .replace(/[$€£₺]/g, '')
            .replace(/%/g, '')
            .replace(/,/g, '');

        const number = parseFloat(text);

        return Number.isFinite(number)
            ? number
            : 0;
    }

    function getRowSnapshot(row) {
        const cells = Array.from(
            row.querySelectorAll('td')
        );

        const checkbox = row.querySelector(
            'input[type="checkbox"]'
        );

        const snapshot = {
            keyword: getRowWord(row),
            status: checkbox
                ? checkbox.checked
                    ? 'açık'
                    : 'kapalı'
                : '',
        };

        COLUMN_KEYS.forEach((key, i) => {
            snapshot[key] = getCellValue(cells[i]);
        });

        return snapshot;
    }

    function colorRoas() {
        const clicksIdx = COLUMN_KEYS.indexOf('clicks');
        const ordersIdx = COLUMN_KEYS.indexOf('orders');

        getAllRows().forEach((row) => {
            const cells = Array.from(
                row.querySelectorAll('td')
            );

            const clicks = parseNumber(
                getCellValue(cells[clicksIdx])
            );

            const orders = parseNumber(
                getCellValue(cells[ordersIdx])
            );

            const isHighCpc =
                (orders > 0 && clicks / orders > 25) ||
                (orders === 0 && clicks > 25);

            if (isHighCpc) {
                row.style.backgroundColor = '#e814b1';
            }
        });
    }

    async function sendKeywordsToSheet(rows) {
        if (!rows.length) return;

        const config = await loadSheetConfig();

        if (!config.sheet_url) {
            return;
        }

        const payload = {
            sheetName: 'ads',
            action: 'upsert',
            shop_name: config.shop_name || 'Bilinmiyor',
            listing_id: getListingId(),
            script_version: GM_info.script.version,
            timestamp: new Date().toISOString(),
            keywords: rows.map(getRowSnapshot),
        };

        try {
            const r = await xmlPost(
                config.sheet_url,
                payload
            );

            if (r.status === 200) {
                getToast().success(
                    `${rows.length} kelime Google Sheet'e aktarıldı.`
                );
            } else {
                getToast().error(
                    `Sheet gönderim hatası (${r.status})`
                );
            }
        } catch {
            getToast().error(
                'Sheet gönderilemedi.'
            );
        }
    }

    async function toggleRows(
        targetState,
        autoPaginate = false,
        syncToSheet = false
    ) {
        await waitForKeywordTable();

        const wordlist = await loadWordlist();
        const allRows = getAllRows();

        const filteredRows = allRows.filter((row) => {
            const word = getRowWord(row);

            return wordlist.some((w) =>
                wordMatchesRow(w, word)
            );
        });

        console.debug(
            `[Etsy Ad Wordlist] toggleRows: ` +
            `${allRows.length} satır bulundu, ` +
            `${wordlist.length} kelimelik listeye göre ` +
            `${filteredRows.length} eşleşme.`
        );

        const label = targetState
            ? 'açıldı'
            : 'kapatıldı';

        let count = 0;

        for (const row of filteredRows) {
            const checkbox = row.querySelector(
                'input[type="checkbox"]'
            );

            if (
                !checkbox ||
                checkbox.checked === targetState
            ) {
                continue;
            }

            const keyword = getRowWord(row);

            checkbox.click();

            getToast().success(
                `${keyword}<br>Kelime ${label}`
            );

            count++;

            await sleep(
                randInt(800, 1200)
            );
        }

        getToast().success(
            `Toplam ${count} kelime ${label}.`
        );

        if (
            autoPaginate &&
            !targetState &&
            syncToSheet
        ) {
            const currentRows = getAllRows();

            if (currentRows.length) {
                await sendKeywordsToSheet(
                    currentRows
                );
            }
        }

        if (autoPaginate) {
            await checkNextButton(
                syncToSheet
            );
        }
    }

    function getPaginationNav() {
        const exact = document.querySelector(
            'nav[aria-label="Targeted Keywords Pagination"]'
        );

        if (exact) {
            return exact;
        }

        const container = getKeywordsContainer();

        if (!container) {
            return null;
        }

        const nested = container.querySelector(
            'nav[aria-label="Targeted Keywords Pagination"]'
        );

        if (nested) {
            return nested;
        }

        const navs = Array.from(
            container.querySelectorAll('nav')
        );

        if (navs.length === 1) {
            return navs[0];
        }

        const candidate = navs.find((nav) => {
            const text = normalizeText(
                nav.textContent
            );

            return (
                text.includes('next') ||
                nav.querySelector(
                    '.wt-screen-reader-only'
                )
            );
        });

        return candidate || null;
    }

    function getNextButton(nav) {
        if (!nav) return null;

        const buttons = Array.from(
            nav.querySelectorAll('button')
        );

        const exact = buttons.find((btn) => {
            const text = normalizeText(
                btn.querySelector(
                    '.wt-screen-reader-only'
                )?.textContent
            );

            return text === 'next';
        });

        if (exact) {
            return exact;
        }

        const byAria = buttons.find((btn) => {
            const label = normalizeText(
                btn.getAttribute('aria-label')
            );

            return label === 'next';
        });

        if (byAria) {
            return byAria;
        }

        const generic = buttons.find((btn) => {
            const text = normalizeText(
                btn.textContent
            );

            return text === 'next';
        });

        return generic || null;
    }

    function isButtonDisabled(button) {
        if (!button) return true;

        if (
            button.disabled === true ||
            button.hasAttribute('disabled')
        ) {
            return true;
        }

        const ariaDisabled =
            button.getAttribute(
                'aria-disabled'
            );

        return ariaDisabled === 'true';
    }

    async function checkNextButton(
        syncToSheet = false
    ) {
        await waitForKeywordTable();

        const nav = getPaginationNav();

        if (!nav) {
            console.warn(
                '[Etsy Ad Wordlist] ' +
                'Sayfalama bulunamadı.'
            );
            return;
        }

        const nextBtn = getNextButton(nav);

        if (!nextBtn) {
            console.warn(
                '[Etsy Ad Wordlist] ' +
                '"Next" butonu bulunamadı.'
            );
            return;
        }

        console.debug(
            '[Etsy Ad Wordlist] Next bulundu, ' +
            `disabled="${isButtonDisabled(nextBtn)}"`
        );

        if (isButtonDisabled(nextBtn)) {
            getToast().success(
                'Tüm sayfalar tamamlandı.'
            );

            await sleep(500);

            try {
                window.close();
            } catch {
            }

            return;
        }

        const previousSignature = getAllRows()
            .map((row) => getRowWord(row))
            .filter(Boolean)
            .join('|');

        nextBtn.click();

        const newRows =
            await waitForRowsChange(
                previousSignature,
                15000
            );

        if (!newRows.length) {
            console.warn(
                '[Etsy Ad Wordlist] ' +
                'Next tıklandı ancak yeni satırlar ' +
                'yüklenmedi.'
            );
            return;
        }

        await sleep(500);

        await toggleRows(
            false,
            true,
            syncToSheet
        );
    }

    async function exportAllKeywords(
        autoPaginate = true
    ) {
        await waitForKeywordTable();

        const rows = getAllRows();

        if (rows.length) {
            await sendKeywordsToSheet(rows);
        } else {
            getToast().error(
                'Sayfada kelime bulunamadı.'
            );
        }

        if (autoPaginate) {
            await goToNextPageForExport();
        }
    }

    async function goToNextPageForExport() {
        await waitForKeywordTable();

        const nav = getPaginationNav();

        if (!nav) {
            console.warn(
                '[Etsy Ad Wordlist] ' +
                'Sayfalama bulunamadı.'
            );
            return;
        }

        const nextBtn = getNextButton(nav);

        if (!nextBtn) {
            console.warn(
                '[Etsy Ad Wordlist] ' +
                'Next butonu bulunamadı.'
            );
            return;
        }

        if (isButtonDisabled(nextBtn)) {
            getToast().success(
                'Tüm sayfalar tarandı ve aktarıldı.'
            );
            return;
        }

        const previousSignature =
            getAllRows()
                .map((row) => getRowWord(row))
                .filter(Boolean)
                .join('|');

        nextBtn.click();

        const newRows =
            await waitForRowsChange(
                previousSignature,
                15000
            );

        if (!newRows.length) {
            console.warn(
                '[Etsy Ad Wordlist] ' +
                'Yeni sayfa yüklenmedi.'
            );
            return;
        }

        await sleep(500);

        await exportAllKeywords(true);
    }

    async function ensureWord() {
        try {
            const text = await xmlGet(
                `${WORD_LIST_URL}?t=${Date.now()}`
            );

            getToast().success(
                'Kelimeler alınıyor'
            );

            await GM.setValue(
                'adWordlist',
                text
            );

            getToast().success(
                'Kelimeler güncellendi'
            );
        } catch {
            getToast().error(
                'Kelimeler alınamadı'
            );
        }
    }

    async function openWordlistEditor() {
        const popup = window.open(
            'about:blank',
            'wordlistEditor',
            'width=420,height=620'
        );

        if (!popup) {
            alert(
                'Popup engellenmiş olabilir.'
            );
            return;
        }

        popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Yasaklı Kelimeleri Düzenle</title>
  <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs/editor/editor.main.css"
        integrity="sha256-BRc+GN/apOv/hPbPAd2cp5FXIrQGkg6TkYgRYHQEmvo="
        crossorigin="anonymous">
  <style>
    body { margin:0; font-family:system-ui; }
    #info {
        padding:8px;
        font-size:12px;
        line-height:1.4;
        background:#f5f5f5;
    }
    #container {
        width:100%;
        height:calc(100vh - 60px);
    }
  </style>
</head>
<body>
  <p id="info">
    Her satırdaki kelimeler, metin içinde geçiyorsa
    işaretlenecektir.
    Tam eşleşme için başına <code>=</code>,
    regex için başına ve sonuna <code>/</code> koyun.
  </p>
  <div id="container"></div>
  <script src="https://requirejs.org/docs/release/2.3.7/minified/require.js"></script>
</body>
</html>`);

        popup.document.close();

        window.addEventListener(
            'message',
            (e) => {
                if (e.source !== popup) return;

                if (typeof e.data !== 'string') {
                    return;
                }

                GM.setValue(
                    'adWordlist',
                    e.data
                );
            }
        );

        window.addEventListener(
            'beforeunload',
            () => {
                try {
                    popup.close();
                } catch {
                }
            }
        );

        const currentWordlist =
            await GM.getValue(
                'adWordlist',
                ''
            );

        const value =
            JSON.stringify(currentWordlist);

        popup.addEventListener(
            'load',
            () => {
                const s =
                    popup.document.createElement(
                        'script'
                    );

                s.textContent = `
                    require.config({
                        paths: {
                            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs'
                        }
                    });

                    require(
                        ['vs/editor/editor.main'],
                        function () {
                            var editor =
                                monaco.editor.create(
                                    document.getElementById(
                                        'container'
                                    ),
                                    {
                                        value: ${value},
                                        language: 'plaintext',
                                        minimap: {
                                            enabled: false
                                        }
                                    }
                                );

                            editor.onDidChangeModelContent(
                                function () {
                                    opener.postMessage(
                                        editor.getValue(),
                                        '*'
                                    );
                                }
                            );
                        }
                    );
                `;

                popup.document.body.appendChild(s);
            }
        );
    }

    GM_registerMenuCommand(
        'Kelimeleri kapat',
        () => toggleRows(false)
    );

    GM_registerMenuCommand(
        'Kelimeleri aç',
        () => toggleRows(true)
    );

    GM_registerMenuCommand(
        'Kelimeleri Güncelle',
        () => ensureWord()
    );

    GM_registerMenuCommand(
        'Yasaklı kelimeleri düzenle',
        () => openWordlistEditor()
    );

    GM_registerMenuCommand(
        'Sheet ayarlarını düzenle',
        () => editSheetConfig()
    );

    GM_registerMenuCommand(
        'Tüm kelimeleri Sheet\'e aktar (tüm sayfalar)',
        () => exportAllKeywords(true)
    );

    GM_registerMenuCommand(
        'Bu sayfayı Sheet\'e aktar',
        () => exportAllKeywords(false)
    );

    document.addEventListener(
        'keydown',
        (e) => {
            if (
                e.ctrlKey &&
                e.altKey
            ) {
                toggleRows(
                    false,
                    true,
                    true
                );
                return;
            }

            if (
                e.ctrlKey &&
                e.code === 'Space'
            ) {
                toggleRows(false);
                return;
            }

            if (
                e.ctrlKey &&
                e.shiftKey &&
                e.code === 'KeyE'
            ) {
                exportAllKeywords(true);
            }
        }
    );

    const mod =
        new URLSearchParams(
            location.search
        ).get('mod');

    if (mod === '1') {
        setTimeout(
            () => toggleRows(
                false,
                true,
                false
            ),
            3000
        );
    } else if (mod === '2') {
        setTimeout(
            () => exportAllKeywords(true),
            3000
        );
    } else if (mod === '3') {
        setTimeout(
            () => toggleRows(
                false,
                true,
                true
            ),
            3000
        );
    }

    async function initialize() {
        await waitForKeywordTable(
            15000,
            1
        );

        await Promise.all([
            syncVersionIfChanged(),
            Promise.resolve(
                colorRoas()
            ),
        ]);

        const filteredRows =
            await getFilteredRows();

        filteredRows.forEach((row) => {
            row.style.backgroundColor =
                '#ffa59e';
        });

        getToast().success(
            'Ads Tool : CTRL + Alt'
        );
    }

    if (
        document.readyState ===
        'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

    window.addEventListener(
        'load',
        () => {
            setTimeout(
                () => {
                    colorRoas();
                },
                500
            );
        },
        { once: true }
    );

})();
