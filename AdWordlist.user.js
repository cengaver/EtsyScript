// ==UserScript==
// @name         Etsy Ad Wordlist
// @description  Ad Wordlist for T-shirt
// @version      2.0.0
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
// @connect      raw.githubusercontent.com
// @require      https://cdn.jsdelivr.net/npm/notyf@3.0.0/notyf.min.js
// @resource     notyf-css https://cdn.jsdelivr.net/npm/notyf@3.0.0/notyf.min.css
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AdWordlist.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AdWordlist.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ─── Constants ────────────────────────────────────────────────────────────

    const WORD_LIST_URL = 'https://raw.githubusercontent.com/cengaver/EtsyScript/refs/heads/main/blackListWord.json';

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

    /** All keyword rows currently in the DOM */
    function getAllRows() {
        return Array.from(document.querySelectorAll('tr.wt-table__row'));
    }

    /** Rows whose keyword matches the current wordlist */
    async function getFilteredRows() {
        const wordlist = await loadWordlist();
        return getAllRows().filter((row) => {
            const word = getRowWord(row);
            return wordlist.some((w) => wordMatchesRow(w, word));
        });
    }

    // ─── ROAS colouring ───────────────────────────────────────────────────────

    function colorRoas() {
        getAllRows().forEach((row) => {
            const clicks = Number(row.querySelector('td:nth-child(3) > p')?.textContent.trim() || 0);
            const orders = Number(row.querySelector('td:nth-child(5) > p')?.textContent.trim() || 0);
            const isHighCpc = (orders > 0 && clicks / orders > 25) || (orders === 0 && clicks > 25);
            if (isHighCpc) row.style.backgroundColor = '#e814b1';
        });
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

    GM_registerMenuCommand('Kelimeleri kapat',          () => toggleRows(false));
    GM_registerMenuCommand('Kelimeleri aç',             () => toggleRows(true));
    GM_registerMenuCommand('Kelimeleri Güncelle',       () => ensureWord());
    GM_registerMenuCommand('Yasaklı kelimeleri düzenle',() => openWordlistEditor());

    // ─── Keyboard shortcuts ───────────────────────────────────────────────────

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey)          { toggleRows(false, true); return; }
        if (e.ctrlKey && e.code === 'Space'){ toggleRows(false);       return; }
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
        ]);

        filteredRows.forEach((row) => { row.style.backgroundColor = '#ffa59e'; });

        getToast().success('Ads Tool : CTRL + Alt');
    });

})();
