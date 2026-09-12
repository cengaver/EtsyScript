// ==UserScript==
// @name         Etsy Ad Wordlist
// @description  Ad Wordlist for T-shirt
// @version      2.3.1
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

    // ─── Constants ────────────────────────────────────────────────────────────

    const WORD_LIST_URL = 'https://raw.githubusercontent.com/cengaver/EtsyScript/refs/heads/main/blackListWord.json';

    // Default Google Apps Script Web App that receives the closed-keyword data.
    // Change with the "Sheet ayarlarını düzenle" menu command (persists in GM storage).
    const DEFAULT_SHEET_CONFIG = {
        sheet_url: '',
        shop_name: '',
        version: GM_info.script.version,
    };

    // Table columns in DOM order (after the <th> keyword cell).
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
=men&#39;s hoodies
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
=women&#39;s sweatshirts
=women hoodies
=graphic hoodies
=graphic hoodie
=hoddies&#39; for women
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

    // ─── Toast (lazy-init) ────────────────────────────────────────────────────

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

    // ─── Helpers ──────────────────────────────────────────────────────────────

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;

    function xmlGet(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload:  (r) => (r.status === 200 ? resolve(r.responseText) : reject(new Error(`HTTP ${r.status}`))),
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
                onload:  (r) => resolve(r),
                onerror: (e) => reject(e),
            });
        });
    }

    // ─── Sheet config (sheet_url / shop_name / version) ──────────────────────

    async function loadSheetConfig() {
        const raw = await GM.getValue('sheetConfig', '');
        if (!raw) {
            await GM.setValue('sheetConfig', JSON.stringify(DEFAULT_SHEET_CONFIG));
            return { ...DEFAULT_SHEET_CONFIG };
        }
        try {
            return { ...DEFAULT_SHEET_CONFIG, ...JSON.parse(raw) };
        } catch {
            return { ...DEFAULT_SHEET_CONFIG };
        }
    }

    async function saveSheetConfig(config) {
        await GM.setValue('sheetConfig', JSON.stringify(config));
    }

    async function editSheetConfig() {
        const config = await loadSheetConfig();

        const newShop = window.prompt('Mağaza adı:', config.shop_name || '');
        if (newShop === null) return; // cancelled
        config.shop_name = newShop.trim();

        const newUrl = window.prompt('Google Sheet (Apps Script) URL:', config.sheet_url || '');
        if (newUrl === null) return;
        config.sheet_url = newUrl.trim();

        await saveSheetConfig(config);
        getToast().success('Sheet ayarları kaydedildi.');
    }

    /**
     * If the running script's @version differs from what we last synced,
     * update the stored config AND push the new version to the sheet so
     * that row (keyed by listing id / shop) gets refreshed rather than
     * duplicated.
     */
    async function syncVersionIfChanged() {
        const config = await loadSheetConfig();
        if (config.version === GM_info.script.version) return;

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
            // Non-fatal — version sync failing shouldn't block the tool.
        }
    }

    function getListingId() {
        const m = location.pathname.match(/listings\/(\d+)/);
        return m ? m[1] : null;
    }

    // ─── Wordlist ─────────────────────────────────────────────────────────────

    /**
     * Load wordlist from storage; seed with defaults on first run.
     * Returns a parsed array — never calls getFilteredRows recursively.
     */
    async function loadWordlist() {
        let raw = await GM.getValue('adWordlist', '');
        if (!raw.trim()) {
            raw = DEFAULT_WORDLIST;
            await GM.setValue('adWordlist', raw);
        }
        return raw
            .split('\n')
            .map((w) => w.replace('\r', '').trim())
            .filter((w) => w.length > 0);
    }

    function wordMatchesRow(word, rowWord) {
        if (!rowWord) return false;
        if (word.startsWith('=')) return rowWord === word.slice(1);
        if (word.startsWith('/') && word.endsWith('/')) {
            try { return new RegExp(word.slice(1, -1)).test(rowWord); }
            catch { return false; }
        }
        return rowWord.includes(word);
    }

    // ─── DOM helpers ──────────────────────────────────────────────────────────

    /** Extract keyword text from a table row */
    function getRowWord(rowEl) {
        const wordEl = rowEl.querySelector('th.wt-table__row__cell');
        return wordEl?.lastChild?.querySelector('p')?.textContent ?? null;
    }

    /** The keyword table's container — everything must be scoped to this,
     *  otherwise unrelated tables elsewhere on the page (order history, etc.)
     *  get swept up by the generic `tr.wt-table__row` selector. */
    function getKeywordsContainer() {
        return document.querySelector('#listing-detail-targeted-keywords-accordion');
    }

    /** All keyword rows currently in the DOM — data rows only, header excluded */
    function getAllRows() {
        const container = getKeywordsContainer();
        if (!container) return [];
        return Array.from(container.querySelectorAll('tr.wt-table__row')).filter(
            (row) => row.querySelector('input[type=checkbox]') // header row has none
        );
    }

    /** Rows whose keyword matches the current wordlist */
    async function getFilteredRows() {
        const wordlist = await loadWordlist();
        return getAllRows().filter((row) => {
            const word = getRowWord(row);
            return wordlist.some((w) => wordMatchesRow(w, word));
        });
    }

    /** Grab a <td>'s real value. Etsy's responsive table repeats the column
     *  header as a hidden mobile label INSIDE each cell (in a
     *  `.wt-table--responsive__title` wrapper), followed by the actual
     *  value — which can be a <p>, a <span>, or even a bare text node
     *  depending on the column. Instead of guessing the tag, take the
     *  cell's full text and strip the known label prefix off the front. */
    function getCellValue(cellEl) {
        if (!cellEl) return '';
        const label = cellEl.querySelector('.wt-table--responsive__title')?.textContent.trim() ?? '';
        let full = cellEl.textContent.trim();
        if (label && full.startsWith(label)) {
            full = full.slice(label.length).trim();
        }
        return full;
    }

    /** Snapshot of a row's stats + current on/off state, keyed for sheet export */
    function getRowSnapshot(row) {
        const cells = Array.from(row.querySelectorAll('td'));
        const checkbox = row.querySelector('input[type=checkbox]');
        const snapshot = {
            keyword: getRowWord(row),
            status: checkbox ? (checkbox.checked ? 'açık' : 'kapalı') : '',
        };
        COLUMN_KEYS.forEach((key, i) => {
            snapshot[key] = getCellValue(cells[i]);
        });
        return snapshot;
    }

    // ─── ROAS colouring ───────────────────────────────────────────────────────

    function colorRoas() {
        const clicksIdx = COLUMN_KEYS.indexOf('clicks');
        const ordersIdx = COLUMN_KEYS.indexOf('orders');
        getAllRows().forEach((row) => {
            const cells = Array.from(row.querySelectorAll('td'));
            const clicks = Number(getCellValue(cells[clicksIdx])) || 0;
            const orders = Number(getCellValue(cells[ordersIdx])) || 0;
            const isHighCpc = (orders > 0 && clicks / orders > 25) || (orders === 0 && clicks > 25);
            if (isHighCpc) row.style.backgroundColor = '#e814b1';
        });
    }

    // ─── Sheet export ─────────────────────────────────────────────────────────

    /**
     * Sends keyword row data (plus listing id, shop name and script
     * version) to the configured Google Sheet Apps Script endpoint.
     * `rows` must be an array of DOM <tr> row elements — this function
     * snapshots them itself. The Apps Script side upserts on
     * listing_id + keyword so re-runs update existing rows instead of
     * duplicating them.
     */
    async function sendKeywordsToSheet(rows) {
        if (!rows.length) return;

        const config = await loadSheetConfig();
        if (!config.sheet_url) {
            //getToast().error('Google Sheet URL ayarlanmamış.');
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
            const r = await xmlPost(config.sheet_url, payload);
            if (r.status === 200) {
                getToast().success(`${rows.length} kelime Google Sheet'e aktarıldı.`);
            } else {
                getToast().error(`Sheet gönderim hatası (${r.status})`);
            }
        } catch {
            getToast().error('Sheet gönderilemedi.');
        }
    }

    // ─── Core actions ─────────────────────────────────────────────────────────

    /**
     * Toggle filtered rows on/off.
     * @param {boolean} targetState  true = enable, false = disable
     * @param {boolean} autoPaginate navigate to next page when done
     */
    async function toggleRows(targetState, autoPaginate = false) {
        const filteredRows = await getFilteredRows();
        const label = targetState ? 'açıldı' : 'kapatıldı';
        let count = 0;

        for (const row of filteredRows) {
            const checkbox = row.querySelector('input[type=checkbox]');
            if (!checkbox || checkbox.checked === targetState) continue;
            checkbox.click();
            getToast().success(`${getRowWord(row)} <br> Kelime ${label}`);
            count++;
            await sleep(randInt(800, 1200));
        }

        getToast().success(`Toplam ${count} kelime ${label}.`);

        // Auto-close mode only: export ALL rows on this page (not just the
        // ones matched/closed) to the sheet, AFTER closing so the status
        // column reflects the real post-close state — and BEFORE
        // checkNextButton below can close the tab on the last page, so
        // nothing is lost when it closes itself.
        if (autoPaginate && !targetState) {
            const allRows = getAllRows();
            if (allRows.length) await sendKeywordsToSheet(allRows);
        }

        if (autoPaginate) await checkNextButton();
    }

    async function checkNextButton() {
        const nav = document.querySelector('#listing-detail-targeted-keywords-accordion nav');
        if (!nav) return;

        const nextBtn = Array.from(nav.querySelectorAll('button')).find(
            (btn) => btn.querySelector('span.wt-screen-reader-only')?.textContent.trim() === 'Next'
        );
        if (!nextBtn) return;

        if (nextBtn.getAttribute('aria-disabled') === 'true') {
            window.close();
        } else {
            nextBtn.click();
            await sleep(randInt(1200, 2500));
            await toggleRows(false, true);
        }
    }

    // ─── Export (review-first, no closing) ───────────────────────────────────

    /**
     * Grabs every keyword row currently on the page (regardless of blacklist
     * match or on/off state) and pushes it to the sheet, then moves to the
     * next page and repeats until pagination ends. This never touches any
     * checkbox — it's purely for building a full picture to decide from
     * later, separate from the actual close/open actions above.
     */
    async function exportAllKeywords(autoPaginate = true) {
        const rows = getAllRows();
        if (rows.length) {
            await sendKeywordsToSheet(rows);
        } else {
            getToast().error('Sayfada kelime bulunamadı.');
        }

        if (autoPaginate) await goToNextPageForExport();
    }

    async function goToNextPageForExport() {
        const nav = document.querySelector('#listing-detail-targeted-keywords-accordion nav');
        if (!nav) return;

        const nextBtn = Array.from(nav.querySelectorAll('button')).find(
            (btn) => btn.querySelector('span.wt-screen-reader-only')?.textContent.trim() === 'Next'
        );
        if (!nextBtn) return;

        if (nextBtn.getAttribute('aria-disabled') === 'true') {
            getToast().success('Tüm sayfalar tarandı ve aktarıldı.');
            return;
        }

        nextBtn.click();
        await sleep(randInt(1200, 2500));
        await exportAllKeywords(true);
    }

    // ─── Remote wordlist update ───────────────────────────────────────────────

    async function ensureWord() {
        try {
            const text = await xmlGet(`${WORD_LIST_URL}?t=${Date.now()}`);
            getToast().success('Kelimeler alınıyor');
            await GM.setValue('adWordlist', text);
            getToast().success('Kelimeler güncellendi');
        } catch {
            getToast().error('Kelimeler alınamadı');
        }
    }

    // ─── Wordlist editor popup ────────────────────────────────────────────────

    async function openWordlistEditor() {
        const popup = window.open('about:blank', 'wordlistEditor', 'width=420,height=620');
        if (!popup) { alert('Popup engellenmiş olabilir.'); return; }

        // Use document.write for reliable about:blank setup
        popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Yasaklı Kelimeleri Düzenle</title>
  <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs/editor/editor.main.css"
        integrity="sha256-BRc+GN/apOv/hPbPAd2cp5FXIrQGkg6TkYgRYHQEmvo=" crossorigin="anonymous">
  <style>
    body { margin:0; font-family:system-ui; }
    #info { padding:8px; font-size:12px; line-height:1.4; background:#f5f5f5; }
    #container { width:100%; height:calc(100vh - 60px); }
  </style>
</head>
<body>
  <p id="info">Her satırdaki kelimeler, metin içinde geçiyorsa işaretlenecektir.
    Tam eşleşme için başına <code>=</code>, regex için başına ve sonuna <code>/</code> koyun.</p>
  <div id="container"></div>
  <script src="https://requirejs.org/docs/release/2.3.7/minified/require.js"></script>
</body>
</html>`);
        popup.document.close();

        window.addEventListener('message', (e) => {
            if (e.source !== popup) return;
            GM.setValue('adWordlist', e.data);
        });

        window.addEventListener('beforeunload', () => popup.close());

        const value = JSON.stringify(await GM.getValue('adWordlist', ''));

        // Inject editor script after require.js is ready
        popup.addEventListener('load', () => {
            const s = popup.document.createElement('script');
            s.textContent = `
                require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' } });
                require(['vs/editor/editor.main'], function () {
                    var editor = monaco.editor.create(document.getElementById('container'), {
                        value: ${value},
                        language: 'plaintext',
                        minimap: { enabled: false },
                    });
                    editor.onDidChangeModelContent(function () {
                        opener.postMessage(editor.getValue(), '*');
                    });
                });
            `;
            popup.document.body.appendChild(s);
        });
    }

    // ─── Menu commands ────────────────────────────────────────────────────────

    GM_registerMenuCommand('Kelimeleri kapat',           () => toggleRows(false));
    GM_registerMenuCommand('Kelimeleri aç',              () => toggleRows(true));
    GM_registerMenuCommand('Kelimeleri Güncelle',        () => ensureWord());
    GM_registerMenuCommand('Yasaklı kelimeleri düzenle', () => openWordlistEditor());
    GM_registerMenuCommand('Sheet ayarlarını düzenle',   () => editSheetConfig());
    GM_registerMenuCommand('Tüm kelimeleri Sheet\'e aktar (tüm sayfalar)', () => exportAllKeywords(true));
    GM_registerMenuCommand('Bu sayfayı Sheet\'e aktar',  () => exportAllKeywords(false));

    // ─── Keyboard shortcuts ───────────────────────────────────────────────────

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey)                     { toggleRows(false, true);   return; }
        if (e.ctrlKey && e.code === 'Space')           { toggleRows(false);         return; }
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyE') { exportAllKeywords(true); return; }
    });

    // ─── Auto-mode (URL ?mod=1) ───────────────────────────────────────────────

    if (new URLSearchParams(location.search).get('mod') === '1') {
        setTimeout(() => toggleRows(false, true), 3000);
    }

    // ─── Page load ────────────────────────────────────────────────────────────

    window.addEventListener('load', async () => {
        // Run independently in parallel
        const [filteredRows] = await Promise.all([
            getFilteredRows(),
            Promise.resolve(colorRoas()),   // sync, wrapped for Promise.all symmetry
            syncVersionIfChanged(),
        ]);

        filteredRows.forEach((row) => { row.style.backgroundColor = '#ffa59e'; });

        getToast().success('Ads Tool : CTRL + Alt');
    });

})();
