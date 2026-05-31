// ==UserScript==
// @name         Etsy on Erank
// @description  Erank overlay with unified menu for configuration and range selection. Sheet entegre
// @version      5.01
// @author       Cengaver
// @namespace    https://github.com/cengaver
// @match        https://www.etsy.com/search*
// @match        https://www.etsy.com/market/*
// @match        https://www.etsy.com/shop/*
// @match        https://www.etsy.com/listing/*
// @match        https://www.etsy.com/people/*
// @match        https://www.etsy.com/c/*
// @match        https://www.etsy.com/your/purchases*
// @match        https://ehunt.ai/product-detail/*
// @match        https://ehunt.ai/etsy-product-research**
// @require      https://cdn.jsdelivr.net/npm/tweetnacl@1.0.3/nacl-fast.min.js
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.xmlHttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.registerMenuCommand
// @grant        GM.addStyle
// @grant        unsafeWindow
// @connect      ehunt.ai
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      developer.uspto.gov
// @connect      ee-ingest.lifecodeof.workers.dev
// @connect      raw.githubusercontent.com
// @connect      members.erank.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ErankOnEtsy.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ErankOnEtsy.user.js
// ==/UserScript==

(async function () {
    "use strict";

    // ─── STYLES ──────────────────────────────────────────────────────────────────
    GM.addStyle(`
        :root {
            --er-primary: #4285f4; --er-primary-d: #3367d6;
            --er-green: #34a853;   --er-green-d: #2e7d32;
            --er-red: #ea4335;     --er-red-d: #c62828;
            --er-yellow: #fbbc05;  --er-yellow-d: #f57f17;
            --er-light: #f8f9fa;   --er-dark: #202124;
            --er-gray: #5f6368;    --er-radius: 4px;
            --er-shadow: 0 2px 10px rgba(0,0,0,.1);
            --er-trans: all .3s ease;
            --er-font: 'Segoe UI', Roboto, Arial, sans-serif;
        }
        .er-toast-wrap { position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px; }
        .er-toast {
            min-width:280px;padding:12px 16px;border-radius:var(--er-radius);
            box-shadow:var(--er-shadow);font-family:var(--er-font);font-size:14px;
            display:flex;align-items:center;justify-content:space-between;
            opacity:0;transform:translateY(20px);transition:var(--er-trans);
        }
        .er-toast.show { opacity:1;transform:translateY(0); }
        .er-toast-success { background:var(--er-green);color:#fff; }
        .er-toast-error   { background:var(--er-red);color:#fff; }
        .er-toast-warning { background:var(--er-yellow);color:var(--er-dark); }
        .er-toast-info    { background:var(--er-primary);color:#fff; }
        .er-toast-x { background:none;border:none;color:inherit;cursor:pointer;font-size:16px;margin-left:10px;opacity:.7; }
        .er-toast-x:hover { opacity:1; }
        .er-btn {
            padding:8px 12px;border:none;border-radius:var(--er-radius);
            font-family:var(--er-font);font-size:14px;font-weight:500;
            cursor:pointer;transition:var(--er-trans);
            display:inline-flex;align-items:center;justify-content:center;gap:6px;
        }
        .er-btn:focus { outline:none; }
        .er-btn-primary   { background:var(--er-primary);color:#fff; } .er-btn-primary:hover   { background:var(--er-primary-d); }
        .er-btn-secondary { background:var(--er-green);color:#fff; }   .er-btn-secondary:hover { background:var(--er-green-d); }
        .er-btn-danger    { background:var(--er-red);color:#fff; }     .er-btn-danger:hover    { background:var(--er-red-d); }
        .er-btn-light     { background:var(--er-light);color:var(--er-dark);border:1px solid #ddd; } .er-btn-light:hover { background:#e9ecef; }
        .er-input {
            padding:4px 8px;border:1px solid #ddd;border-radius:var(--er-radius);
            font-family:var(--er-font);font-size:14px;transition:var(--er-trans);
        }
        .er-input:focus { outline:none;border-color:var(--er-primary);box-shadow:0 0 0 2px rgba(66,133,244,.2); }
        .er-overlay {
            position:fixed;inset:0;background:rgba(0,0,0,.5);
            display:flex;align-items:center;justify-content:center;z-index:9999;
            opacity:0;visibility:hidden;transition:var(--er-trans);
        }
        .er-overlay.show { opacity:1;visibility:visible; }
        .er-modal {
            background:#fff;border-radius:var(--er-radius);box-shadow:var(--er-shadow);
            width:90%;max-width:600px;max-height:90vh;overflow:auto;
            transform:translateY(-20px);transition:var(--er-trans);
        }
        .er-overlay.show .er-modal { transform:translateY(0); }
        .er-modal-hd {
            padding:16px;border-bottom:1px solid #eee;
            display:flex;align-items:center;justify-content:space-between;
        }
        .er-modal-title { font-family:var(--er-font);font-size:18px;font-weight:500;margin:0; }
        .er-modal-x { background:none;border:none;font-size:20px;cursor:pointer;color:var(--er-gray); }
        .er-modal-bd { padding:16px; }
        .er-modal-ft { padding:16px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:10px; }

        /* ── eRank Table Modal ── */
        #er-tbl-modal {
            position:fixed;inset:0;z-index:999999;
            background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;
            font-family:Arial,sans-serif;
        }
        .er-box {
            background:#fff;width:95%;max-width:1400px;max-height:90vh;overflow:hidden;
            border-radius:12px;display:flex;flex-direction:column;color:#222;
        }
        .er-box-hd {
            padding:12px 16px;border-bottom:1px solid #ddd;
            display:flex;align-items:center;gap:12px;flex-wrap:wrap;
        }
        .er-box-hd input { padding:6px 10px;width:220px; }
        .er-close { margin-left:auto;cursor:pointer;font-size:20px; }
        .er-tbl-wrap { overflow:auto; }
        .er-tbl-wrap table { border-collapse:collapse;width:100%; }
        .er-tbl-wrap thead th {
            position:sticky;top:0;background:#f6f6f6;cursor:pointer;
            border-bottom:1px solid #ccc;padding:8px;font-size:13px;white-space:nowrap;
        }
        .er-tbl-wrap tbody td { border-bottom:1px solid #eee;padding:6px 8px;font-size:14px;vertical-align:middle; }
        .er-tbl-wrap tbody tr:hover { background:#fafafa; }
        .er-tbl-wrap img { width:64px;height:64px;object-fit:cover;border-radius:6px;cursor:pointer; }
        .er-tbl-wrap a:hover img { opacity:.85; }
        .er-num { text-align:right; }
        .er-preview {
            position:fixed;z-index:1000000;pointer-events:none;
            background:#fff;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.35);
            padding:6px;display:none;
        }
        .er-preview img { max-width:300px;max-height:300px;width:auto;height:auto; }
        /* Dark mode */
        .er-dark { background:#121212 !important;color:#e6e6e6; }
        .er-dark .er-box-hd { background:#181818;border-bottom:1px solid #2a2a2a; }
        .er-dark input { background:#1f1f1f;color:#eee;border:1px solid #333; }
        .er-dark .er-tbl-wrap table { background:#121212; }
        .er-dark .er-tbl-wrap thead th { background:#1a1a1a;color:#ddd;border-bottom:1px solid #333; }
        .er-dark .er-tbl-wrap tbody td { border-bottom:1px solid #242424;color:#e0e0e0; }
        .er-dark .er-tbl-wrap tbody tr:hover { background:#1e1e1e; }
        .er-dark .er-num { color:#bdbdbd; }
        .er-dark .er-tbl-wrap img { box-shadow:0 0 0 1px #333; }
        .er-dark .er-close { color:#aaa; } .er-dark .er-close:hover { color:#fff; }
        .er-dark .er-preview { background:#111; }
        .er-dark .er-filter-lbl input { background:#1f1f1f;color:#eee;border:1px solid #333; }
        .er-th-sort { background:#2b2b2b;color:#fff; }
        .er-th-sort::after { content:" ▴▾";font-size:10px;opacity:.8; }
        .er-th-sort.asc::after { content:" ▲"; }
        .er-th-sort.desc::after { content:" ▼"; }
        .er-dark .er-th-sort { background:#444; }
        .er-filter-lbl input { padding:2px 4px;font-size:11px; }
    `);

    // ─── CONFIG ───────────────────────────────────────────────────────────────────
    const CONFIG_DEFAULTS = {
        apiKeyUspto: '', sheetId: '', sheetId2: '', range: '',
        rangeLink: '', privateKey: '', clientEmail: '',
        team: 'X', manager: '', authorization: '', config_version: null
    };

    let config = { ...CONFIG_DEFAULTS };
    let configLoaded = false;

    async function loadConfig() {
        if (configLoaded) return true;
        try {
            const saved = await GM.getValue('Config');
            if (saved) {
                config = { ...CONFIG_DEFAULTS, ...saved };
                configLoaded = true;
                return true;
            }
            // Legacy migration: individual keys → single 'Config' object
            const legacy = await GM.getValue('privateKey', '');
            if (legacy) {
                const keys = Object.keys(CONFIG_DEFAULTS);
                const vals = await Promise.all(keys.map(k => GM.getValue(k, CONFIG_DEFAULTS[k])));
                keys.forEach((k, i) => { config[k] = vals[i]; });
                await GM.setValue('Config', config);
                await Promise.all(keys.map(k => GM.deleteValue(k)));
                configLoaded = true;
                return true;
            }
            return false;
        } catch (err) {
            console.error('[ErankOnEtsy] Config load error:', err);
            return false;
        }
    }

    async function saveConfig() {
        await GM.setValue('Config', config);
    }

    function validateConfig() {
        if (!config.clientEmail || !config.privateKey) {
            showToast('Google Service Account credentials missing', 'error');
            return false;
        }
        return true;
    }

    // ─── TOAST ────────────────────────────────────────────────────────────────────
    let _toastWrap = null;
    function getToastWrap() {
        if (!_toastWrap) {
            _toastWrap = document.createElement('div');
            _toastWrap.className = 'er-toast-wrap';
            document.body.appendChild(_toastWrap);
        }
        return _toastWrap;
    }

    function showToast(msg, type = 'success', duration = 3000) {
        const wrap = getToastWrap();
        const t = document.createElement('div');
        t.className = `er-toast er-toast-${type}`;
        const span = document.createElement('span');
        span.textContent = msg;
        const x = document.createElement('button');
        x.className = 'er-toast-x';
        x.innerHTML = '&times;';
        x.onclick = () => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); };
        t.append(span, x);
        wrap.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        if (duration > 0) setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, duration);
    }

    // ─── CONFIG DIALOG ────────────────────────────────────────────────────────────
    function showConfigMenu() {
        const FIELDS = [
            { id: 'apiKeyUspto',  label: 'USPTO API Key',  type: 'text' },
            { id: 'clientEmail',  label: 'Client Email',   type: 'text' },
            { id: 'privateKey',   label: 'Private Key',    type: 'textarea' },
            { id: 'rangeLink',    label: 'Range Link',     type: 'text' },
            { id: 'sheetId',      label: 'Sheet ID',       type: 'text' },
            { id: 'range',        label: 'Range',          type: 'text' },
            { id: 'sheetId2',     label: 'Sheet ID 2',     type: 'text' },
            { id: 'team',         label: 'Team',           type: 'text' },
            { id: 'manager',      label: 'Manager',        type: 'text' },
        ];

        const overlay = document.createElement('div');
        overlay.className = 'er-overlay';

        overlay.innerHTML = `
            <div class="er-modal">
                <div class="er-modal-hd">
                    <h3 class="er-modal-title">Etsy Erank Tool Ayarları</h3>
                    <button class="er-modal-x">&times;</button>
                </div>
                <div class="er-modal-bd">
                    ${FIELDS.map(f => `
                        <div style="margin-bottom:14px">
                            <label style="display:block;margin-bottom:4px;font-weight:bold">${f.label}</label>
                            ${f.type === 'textarea'
                                ? `<textarea id="cfg-${f.id}" class="er-input" style="width:100%;height:90px">${config[f.id] || ''}</textarea>`
                                : `<input id="cfg-${f.id}" type="text" class="er-input" style="width:100%" value="${config[f.id] || ''}">`
                            }
                        </div>`).join('')}
                </div>
                <div class="er-modal-ft">
                    <button class="er-btn er-btn-light" id="cfg-cancel">İptal</button>
                    <button class="er-btn er-btn-primary" id="cfg-save">Kaydet</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 300); };
        overlay.querySelector('.er-modal-x').onclick = close;
        overlay.querySelector('#cfg-cancel').onclick = close;
        overlay.querySelector('#cfg-save').onclick = async () => {
            FIELDS.forEach(f => { config[f.id] = document.getElementById(`cfg-${f.id}`).value; });
            await saveConfig();
            showToast('Ayarlar kaydedildi', 'success');
            close();
        };
    }

    // ─── DOM HELPERS ──────────────────────────────────────────────────────────────
    function observeElements(selector, callback, doc) {
        const seen = new WeakSet();
        const handle = node => {
            if (!seen.has(node)) { seen.add(node); callback(node); }
        };
        new MutationObserver(muts => {
            for (const m of muts) {
                for (const n of m.addedNodes) {
                    if (n.nodeType !== 1) continue;
                    if (n.matches(selector)) handle(n);
                    n.querySelectorAll(selector).forEach(handle);
                }
            }
        }).observe(doc.body, { childList: true, subtree: true });
        doc.querySelectorAll(selector).forEach(handle);
    }

    function onLoaded(doc, fn) {
        if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn);
        else fn();
    }

    async function waitFor(fn, delay = 300, timeout = 20_000) {
        const t0 = Date.now();
        while (!fn()) {
            if (Date.now() - t0 > timeout) throw new Error('waitFor timeout');
            await new Promise(r => setTimeout(r, delay));
        }
    }

    // ─── GM XHR WRAPPER ───────────────────────────────────────────────────────────
    function gmFetch(opts) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                ...opts,
                onload: r => (r.status >= 200 && r.status < 300) ? resolve(r) : reject(r),
                onerror: reject,
                ontimeout: () => reject(new Error('timeout'))
            });
        });
    }

    // ─── REMOTE CONFIG / BEARER ───────────────────────────────────────────────────
    const CONFIG_URL = "https://raw.githubusercontent.com/cengaver/EtsyScript/refs/heads/main/config.json";
    let _bearerFetchPromise = null;

    async function ensureBearer() {
        if (_bearerFetchPromise) return _bearerFetchPromise;
        _bearerFetchPromise = (async () => {
            try {
                const r = await gmFetch({ method: 'GET', url: CONFIG_URL });
                const cfg = JSON.parse(r.responseText);
                if (cfg.version !== config.config_version) {
                    config.authorization = cfg.bearer;
                    config.config_version = cfg.version;
                    await saveConfig();
                    showToast('Authorization güncellendi', 'success');
                }
            } catch { /* keep existing bearer */ }
            return config.authorization;
        })();
        // Reset after completion so next page load re-checks
        _bearerFetchPromise.finally(() => { _bearerFetchPromise = null; });
        return _bearerFetchPromise;
    }

    // ─── JWT / GOOGLE AUTH ────────────────────────────────────────────────────────
    const TOKEN_URI = "https://oauth2.googleapis.com/token";
    let _accessTokenPromise = null;

    async function getAccessToken() {
        const cached = sessionStorage.getItem('er_at');
        if (cached) return cached;
        if (_accessTokenPromise) return _accessTokenPromise;
        if (!validateConfig()) return null;

        _accessTokenPromise = (async () => {
            const jwt = await _createJwt();
            if (!jwt) { showToast('Failed to create JWT', 'error'); return null; }

            const res = await fetch(TOKEN_URI, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: jwt
                })
            });
            const d = await res.json();
            if (d.access_token) {
                sessionStorage.setItem('er_at', d.access_token);
                return d.access_token;
            }
            console.error('[ErankOnEtsy] Token error:', d);
            return null;
        })();
        _accessTokenPromise.finally(() => { _accessTokenPromise = null; });
        return _accessTokenPromise;
    }

    function _b64url(obj) {
        return btoa(JSON.stringify(obj)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    }

    async function _createJwt() {
        try {
            const now = Math.floor(Date.now() / 1000);
            const header  = _b64url({ alg: 'RS256', typ: 'JWT' });
            const payload = _b64url({
                iss: config.clientEmail,
                scope: 'https://www.googleapis.com/auth/spreadsheets',
                aud: TOKEN_URI,
                exp: now + 3600,
                iat: now
            });
            const toSign = `${header}.${payload}`;
            const sig = await _signRsa(toSign);
            return `${toSign}.${sig}`;
        } catch (e) {
            console.error('[ErankOnEtsy] JWT error:', e);
            return null;
        }
    }

    async function _signRsa(data) {
        const pem = config.privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s+/g, '');
        const bin = atob(pem);
        const buf = new Uint8Array(bin.length).map((_, i) => bin.charCodeAt(i)).buffer;
        const key = await crypto.subtle.importKey(
            'pkcs8', buf,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false, ['sign']
        );
        const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(data));
        return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    }

    // ─── EE INGEST ────────────────────────────────────────────────────────────────
    // Fire-and-forget, non-blocking
    function EE_Ingest(id, payload, element) {
        try {
            const lis = document.querySelectorAll('ul[data-results-grid-container] > li');
            const li  = element.closest('li');
            const rank = lis.length && li ? [...lis].indexOf(li) + 1 : null;
            GM.xmlHttpRequest({
                method: 'POST',
                url: 'https://ee-ingest.lifecodeof.workers.dev/ingest?key=trust-me-bro',
                data: JSON.stringify({ id, scraped_at: new Date().toISOString(), page_url: location.href, search_rank: rank, raw_html: element?.outerHTML ?? null, payload, team: config.team }),
                nocache: true,
                redirect: 'follow',
                onerror: e => console.error('[EE ingest]', e)
            });
        } catch (e) {
            console.error('[EE ingest]', e);
        }
    }

    // ─── UTILITIES ────────────────────────────────────────────────────────────────
    function toNum(s) {
        if (s == null) return null;
        const n = Number(String(s).replace(/,/g, ''));
        return Number.isFinite(n) ? n : null;
    }

    function toInt(v) {
        v = String(v).trim().toLowerCase();
        if (v.endsWith('k')) return Math.round(parseFloat(v) * 1000);
        return Math.round(parseFloat(v)) || 0;
    }

    function pastDateFromText(v) {
        const s = String(v).toLowerCase();
        const y = s.match(/(\d+)\s*year/), m = s.match(/(\d+)\s*month/);
        if (!y && !m) return '';
        const d = new Date();
        if (y) d.setFullYear(d.getFullYear() - +y[1]);
        if (m) d.setMonth(d.getMonth() - +m[1]);
        return `${d.getFullYear()}:${String(d.getMonth()+1).padStart(2,'0')}:${String(d.getDate()).padStart(2,'0')}`;
    }

    function parsePriceToNumber(s) {
        if (!s) return null;
        s = String(s).trim().replace(/\s+/g,'').replace(/[^0-9.,\-]/g,'');
        const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
        if (lc > -1 && ld > -1) { s = lc > ld ? s.replace(/\./g,'').replace(',','.') : s.replace(/,/g,''); }
        else if (lc > -1) s = s.replace(',','.');
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : null;
    }

    function simplifyEtsyUrl(url) {
        try {
            const p = new URL(url).pathname.split('/');
            if (p.length > 3) return `https://www.etsy.com/listing/${p[2]}/${p[3]}`;
        } catch {}
        return url;
    }

    function toFullImg(url, size = 120) {
        if (!url) return url;
        return url.replace(/il_\d+x\d+N?_?|il_\d+xN|\b\d+x\d+\b/, `il_${size}x${size}`);
    }

    function extractFirstParts(text) {
        const kws = ['Sweatshirt','T Shirt','T-Shirt','Tshirt','Shirt','Hoodie','Png','Svg','Tee','DTF'];
        const lower = text.toLowerCase();
        let minPos = Infinity, kw = '';
        for (const k of kws) {
            const p = lower.indexOf(k.toLowerCase());
            if (p !== -1 && p < minPos) { minPos = p; kw = k; }
        }
        const raw = kw ? lower.slice(0, minPos).trim().replace(/comfort colors /i, '') : lower;
        return raw.replace(/&#39;|'/g, "'").replace(/\b\w/g, c => c.toUpperCase());
    }

    function norm(v, min, max) {
        if (max <= min) return 0;
        return Math.min(1, Math.max(0, (v - min) / (max - min)));
    }

    function salesColor(v, min, max) { return `rgba(76,175,80,${0.15 + 0.6 * norm(v, min, max)})`; }
    function convColor(v, min, max)  {
        const t = norm(v, min, max);
        return `rgba(${Math.round(33*(1-t))},${Math.round(150+80*t)},243,${0.15+0.6*t})`;
    }

    // ─── LOCAL STORAGE HELPERS ────────────────────────────────────────────────────
    function clearErankCache() {
        const toDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('erank')) toDelete.push(k);
        }
        toDelete.forEach(k => localStorage.removeItem(k));
        showToast(`${toDelete.length} erank cache kaydı silindi.`, 'info');
    }

    function safeSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                clearErankCache();
                try { localStorage.setItem(key, value); } catch {}
            }
        }
    }

    // ─── GOOGLE SHEETS ────────────────────────────────────────────────────────────
    // Cache for column data per sheet (lives for 1h in localStorage)
    async function fetchColumnData(sheetSlot = 1) {
        const sheet = sheetSlot === 2 ? config.sheetId2 : config.sheetId;
        if (!sheet) return;

        const cKey = `er_cd_${sheetSlot}`, tKey = `${cKey}_ts`;
        const now = Date.now();
        const cached = JSON.parse(localStorage.getItem(cKey));
        const ts     = +localStorage.getItem(tKey);

        if (cached && now - ts < 60 * 60 * 1000) return;
        if (cached) localStorage.removeItem(cKey);

        const token = await getAccessToken();
        if (!token) return;

        try {
            const r = await gmFetch({
                method: 'GET',
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${config.range}`,
                headers: { Authorization: `Bearer ${token}` }
            });
            const { values = [] } = JSON.parse(r.responseText);
            const processed = values
                .filter(row => row[0])
                .map(row => ({
                    id:       row[row.length - 1],
                    dnoValue: row[0],
                    gDrive:   row[row.length - 3],
                    team:     row[5]
                }));
            localStorage.setItem(cKey, JSON.stringify(processed));
            localStorage.setItem(tKey, String(now));
        } catch (e) {
            sessionStorage.removeItem('er_at');
            console.error('[ErankOnEtsy] fetchColumnData error:', e);
        }
    }

    function findById(id, slot = 1) {
        const data = JSON.parse(localStorage.getItem(`er_cd_${slot}`)) || [];
        const m = data.find(r => r.id === id);
        return { dnoValue: m?.dnoValue ?? null, gDrive: m?.gDrive ?? null, teamname: m?.team ?? null };
    }

    async function saveToGoogleSheet(sheet, link, title, img, sales, age, tags) {
        const token = await getAccessToken();
        if (!token) return;

        const tagStr = Array.isArray(tags) ? tags.join(', ') : tags;

        // 1. Check existing links
        let lastRow = 0, exists = false;
        try {
            const r = await gmFetch({
                method: 'GET',
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${config.rangeLink}?majorDimension=COLUMNS`,
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = JSON.parse(r.responseText);
            const col = d.values?.[0] ?? [];
            if (col.includes(link)) { exists = true; }
            lastRow = col.length;
        } catch (e) {
            sessionStorage.removeItem('er_at');
            showToast('Sheet okuma hatası', 'error');
            return;
        }

        if (exists) { showToast(`${title}\nzaten var!`, 'error'); return; }

        const newRow = lastRow + 1;
        const isListe = config.rangeLink === 'Liste!D:D';
        const sheetName = isListe ? 'Liste' : config.rangeLink.split('!')[0];
        const range = isListe ? `Liste!D${newRow}:J${newRow}` : `${sheetName}!F${newRow}:P${newRow}`;
        const values = isListe
            ? [[link, img, title, null, tagStr, sales, age]]
            : [[link, img, title, null, config.team, config.manager, tagStr, null, null, sales, age]];

        try {
            await gmFetch({
                method: 'PUT',
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${range}?valueInputOption=RAW`,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                data: JSON.stringify({ range, majorDimension: 'ROWS', values })
            });
            showToast(`${title}\nlisteye eklendi!`);
        } catch (e) {
            showToast('Sheet yazma hatası', 'error');
            console.error('[ErankOnEtsy] saveToSheet error:', e);
        }
    }

    async function logToGoogleSheets(data) {
        const url = "https://script.google.com/macros/s/AKfycbxuh_lJRDY4ZCVY3js2JVlIdusGmb3RtDd4IlH82hisewmwR13PUogxW9pUuX8h0C-e/exec";
        const body = data.sheetName ? data : {
            id: String(data.id), link: data.link||'', img: data.img||'', title: data.title||'',
            tag: data.tag||'', sls: data.sls||'', day: data.day||'',
            quantity: data.quantity||'', views: data.views||'', favorers: data.favorers||'',
            est_conversion_rate: data.est_conversion_rate||'', team: config.team||''
        };
        try {
            await fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
        } catch {}
    }

    // ─── ERANK API ────────────────────────────────────────────────────────────────
    async function getErankData(id, el, imgUrl = null, link = null) {
        const key = `erank_${id}`;
        const cached = JSON.parse(localStorage.getItem(key));
        if (cached && Date.now() - +cached.timestamp < 48 * 60 * 60 * 1000 && cached.tags && cached.title) {
            EE_Ingest(id, { type: 'cached', data: cached }, el);
            return cached;
        }
        if (cached) localStorage.removeItem(key);

        try {
            const res = await eRankNative.extFetch(`ext/listing/${id}`, 'GET');
            if (!res.success) return { error: res.status === 404 ? 'Not found' : 'Error' };

            const d = res.data;
            EE_Ingest(id, { type: 'raw', data: d }, el);

            const age   = toNum(d.stats.listing_age);
            const sales = toNum(d.stats.est_sales.label);
            const erankData = {
                sales, age, title: d.title,
                timestamp: String(Date.now()),
                tags:      Object.keys(d.tags),
                link, img: imgUrl,
                quantity:            toNum(d.stats.quantity),
                views:               toNum(d.stats.views),
                favorers:            toNum(d.stats.favorers),
                est_conversion_rate: d.stats.est_conversion_rate.value
            };
            safeSet(key, JSON.stringify(erankData));

            if (age >= 1 && age <= 50 && sales / 1.3 > age) {
                logToGoogleSheets({ id, link, img: imgUrl, title: d.title, tag: erankData.tags, sls: sales, day: age, quantity: erankData.quantity, views: erankData.views, favorers: erankData.favorers, est_conversion_rate: erankData.est_conversion_rate });
            }
            return erankData;
        } catch (e) {
            console.error('[ErankOnEtsy] getErankData:', e);
            return null;
        }
    }

    // ─── TREND SCORING ────────────────────────────────────────────────────────────
    function buildStats(data) {
        const s = arr => [...arr].sort((a, b) => a - b);
        const p = (arr, x) => arr[Math.floor(arr.length * x)] || 0;
        const sales = s(data.map(d => d.sales || 0));
        const spd   = s(data.map(d => (d.sales || 0) / (d.age || 1)));
        const conv  = s(data.map(d => d.est_conversion_rate || 0));
        const views = s(data.map(d => d.views || 0));
        return {
            salesMedian: p(sales,.5), salesP75: p(sales,.75),
            spdP20: p(spd,.2), spdP30: p(spd,.3), spdP40: p(spd,.4),
            spdP50: p(spd,.5), spdP75: p(spd,.75),
            convP30: p(conv,.3), viewsP75: p(views,.75)
        };
    }

    function convScore(v) {
        if (!v || v <= 0) return .3;
        if (v < .5)  return .5;
        if (v < 1)   return .7;
        if (v < 2)   return .85;
        return 1;
    }

    function trendScore(d, stats) {
        const age = d.age || 1, sales = d.sales || 0, views = d.views || 0, fav = d.favorers || 0, conv = d.est_conversion_rate || 0;
        if (!sales) return age <= 14 ? .15 : .03;
        const spd      = sales / age;
        const velocity = norm(spd, stats.spdP30 || 0, stats.spdP75 || Math.max(spd, 1));
        const favRate  = norm(fav / (views || 1), 0, .2);
        const momentum = velocity * .5 + convScore(conv) * .35 + favRate * .15;
        const ageBias  = age < 7 ? .85 : age <= 30 ? 1 : age <= 120 ? .9 : .75;
        const decay    = age > 240 && velocity < .15 ? .2 : age > 120 && velocity < .25 ? .4 : 1;
        return +Math.min(1, Math.max(0, momentum * ageBias * decay)).toFixed(4);
    }

    function trendDelta(d, stats) {
        const age = d.age || 1, sales = d.sales || 0;
        if (!sales) return 0;
        const v = norm(sales / age, stats.spdP30 || 0, stats.spdP75 || Math.max(sales / age, 1));
        return age <= 14 ? v*.6 : age <= 45 ? v*.8 : age <= 120 ? v*.4 : v*.15;
    }

    function buildRankIndex(data, stats) {
        return [...data].map(d => ({ d, s: trendScore(d, stats) })).sort((a,b) => b.s - a.s).map(x => x.d);
    }

    function rankBucket(d, idx) {
        const i = idx.indexOf(d);
        if (i < 0) return 1;
        const p = i / idx.length;
        return p <= .10 ? .10 : p <= .25 ? .25 : p <= .50 ? .50 : 1;
    }

    function trendBadge(d, stats, idx) {
        const score = trendScore(d, stats), delta = trendDelta(d, stats);
        const age = d.age || 0, sales = d.sales || 0, spd = sales / (age || 1);
        if (!sales && age > 30)             return { t: '❌ DEAD',       c: '#991b1b' };
        if (score >= .75 && delta > .5  && rankBucket(d, idx) <= .10) return { t: '🔥 HOT',        c: '#15803d' };
        if (score >= .6  && delta > .35 && age <= 60)                 return { t: '🚀 RISING',     c: '#f97316' };
        if (score >= .45)                   return { t: '✅ STABLE',     c: '#2563eb' };
        if (age > 180 && spd < .04)         return { t: '⚠️ SATURATED', c: '#a855f7' };
        if (score < .15)                    return { t: '❌ DEAD',       c: '#991b1b' };
        return { t: '🧪 LOW SIGNAL', c: '#6b7280' };
    }

    // ─── ERANK TABLE MODAL ────────────────────────────────────────────────────────
    function getAllErankItems() {
        const rows = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k?.startsWith('erank_')) continue;
            try {
                const row = JSON.parse(localStorage.getItem(k));
                if (row && 'img' in row) {
                    const id = k.slice(6);
                    if (config.sheetId) {
                        const { dnoValue, gDrive, teamname } = findById(id);
                        row.dnoValue = dnoValue; row.gDrive = gDrive; row.teamname = teamname;
                    }
                    rows.push(row);
                }
            } catch {}
        }
        return rows;
    }

    function openErankTableModal(win) {
        const doc = win.document;
        if (doc.getElementById('er-tbl-modal')) return;

        const base = getAllErankItems();
        const stats = buildStats(base);
        const idx   = buildRankIndex(base, stats);
        const salesVals = base.map(d => +d.sales || 0), convVals = base.map(d => +d.est_conversion_rate || 0);
        const [salesMin, salesMax] = [Math.min(...salesVals), Math.max(...salesVals)];
        const [convMin,  convMax]  = [Math.min(...convVals),  Math.max(...convVals)];

        const modal = doc.createElement('div');
        modal.id = 'er-tbl-modal';
        modal.innerHTML = `
            <div class="er-box">
              <div class="er-box-hd">
                <strong>eRank Cache</strong>
                <input id="er-search" placeholder="Title ara…">
                <span id="er-count"></span>
                <span class="er-filter-lbl">Sales:
                  <input id="sf-smin" placeholder="min" type="number" style="width:58px">–
                  <input id="sf-smax" placeholder="max" type="number" style="width:58px">
                </span>
                <span class="er-filter-lbl">Age:
                  <input id="sf-amin" placeholder="min" type="number" style="width:48px">–
                  <input id="sf-amax" placeholder="max" type="number" style="width:48px">
                </span>
                <span class="er-filter-lbl">Title:
                  <select id="sf-title"><option value="all">Hepsi</option><option value="with">PNG/SVG</option><option value="without">Fiziksel</option></select>
                </span>
                <span class="er-filter-lbl">Rank:
                  <select id="sf-rank">
                    <option value="">All</option>
                    <option value="hot">🔥 HOT</option>
                    <option value="rising">🚀 RISING</option>
                    <option value="stable">✅ STABLE</option>
                    <option value="sat">⚠️ SATURATED</option>
                    <option value="dead">❌ DEAD</option>
                  </select>
                </span>
                <button id="er-theme" style="padding:4px 10px;cursor:pointer">🌙 Dark</button>
                <button id="er-clear" style="padding:4px 10px;cursor:pointer">🗑 Clear</button>
                <span class="er-close" id="er-close">✕</span>
              </div>
              <div class="er-tbl-wrap">
                <table>
                  <thead><tr>
                    <th>Img</th>
                    <th data-k="title">Title</th>
                    <th data-k="sales">Sales</th>
                    <th data-k="rank">Rank</th>
                    <th data-k="views">Views</th>
                    <th data-k="favorers">Fav</th>
                    <th data-k="quantity">Qty</th>
                    <th data-k="est_conversion_rate">Conv%</th>
                    <th data-k="age">Age</th>
                  </tr></thead>
                  <tbody id="er-tbody"></tbody>
                </table>
              </div>
            </div>`;
        doc.body.appendChild(modal);

        const state = { q:'', sMin:NaN, sMax:NaN, aMin:NaN, aMax:NaN, rank:'', titleType:'all', sortKey:null, sortDir:1 };
        const tbody = doc.getElementById('er-tbody');
        const count = doc.getElementById('er-count');

        function renderRows(rows) {
            tbody.innerHTML = rows.map(d => {
                const b = trendBadge(d, stats, idx);
                const img = toFullImg(d.img||'');
                const imgPrev = toFullImg(d.img||'', 200);
                const imgTag = d.link
                    ? `<a href="${d.link}" target="_blank"><img src="${img}" data-previews="${imgPrev}"></a>`
                    : `<img src="${img}" data-previews="${imgPrev}">`;

                let heartHtml;
                if (d.gDrive) {
                    heartHtml = `<a href="${d.gDrive}" title="${d.teamname||'-'} – ${d.dnoValue||'-'}" target="_blank" style="text-decoration:none">💖</a>`;
                } else if (d.dnoValue) {
                    heartHtml = `<span title="${d.teamname||'-'} – ${d.dnoValue||'-'}">❤️</span>`;
                } else {
                    heartHtml = `<div class="heartWrapper"
                        data-currenturl="${d.link||''}" data-title="${d.title||''}"
                        data-img="${imgPrev}" data-sales="${d.sales||0}" data-age="${d.age||0}"
                        data-tags="${encodeURIComponent(JSON.stringify(d.tags||[]))}"
                        style="display:inline-block;cursor:cell">🤍</div>`;
                }

                return `<tr>
                  <td>${imgTag}</td>
                  <td>${heartHtml} ${d.title||'-'}</td>
                  <td class="er-num" style="background:${salesColor(d.sales||0,salesMin,salesMax)}">${d.sales??''}</td>
                  <td><span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;background:${b.c};color:#fff">${b.t}</span></td>
                  <td class="er-num">${d.views??''}</td>
                  <td class="er-num">${d.favorers??''}</td>
                  <td class="er-num">${d.quantity??''}</td>
                  <td class="er-num" style="background:${convColor(d.est_conversion_rate||0,convMin,convMax)}">${d.est_conversion_rate??''}</td>
                  <td class="er-num">${d.age??''}</td>
                </tr>`;
            }).join('');
            count.textContent = `(${rows.length})`;
        }

        function applyPipeline() {
            let rows = base;
            if (state.q)         rows = rows.filter(d => (d.title||'').toLowerCase().includes(state.q));
            if (state.rank)      rows = rows.filter(d => { const t = trendBadge(d,stats,idx).t; return state.rank==='hot'?t.includes('HOT'):state.rank==='rising'?t.includes('RISING'):state.rank==='stable'?t.includes('STABLE'):state.rank==='sat'?t.includes('SATURATED'):t.includes('DEAD'); });
            if (!Number.isNaN(state.sMin)) rows = rows.filter(d => (+d.sales||0) >= state.sMin);
            if (!Number.isNaN(state.sMax)) rows = rows.filter(d => (+d.sales||0) <= state.sMax);
            if (!Number.isNaN(state.aMin)) rows = rows.filter(d => (+d.age||0)   >= state.aMin);
            if (!Number.isNaN(state.aMax)) rows = rows.filter(d => (+d.age||0)   <= state.aMax);
            if (state.titleType !== 'all') {
                const DIGITAL = ['png','svg','design','template','dtf','pdf','mockup','digital','pattern','download'];
                rows = rows.filter(d => { const t = (d.title||'').toLowerCase(); const has = DIGITAL.some(w => t.includes(w)); return state.titleType==='with' ? has : !has; });
            }
            if (state.sortKey) {
                rows = [...rows].sort((a, b) => {
                    if (state.sortKey === 'rank')  return (trendScore(a,stats) - trendScore(b,stats)) * state.sortDir;
                    if (state.sortKey === 'title') return (a.title||'').localeCompare(b.title||'') * state.sortDir;
                    return ((+a[state.sortKey]||0) - (+b[state.sortKey]||0)) * state.sortDir;
                });
            }
            renderRows(rows);
            updateSortUI();
        }

        function updateSortUI() {
            modal.querySelectorAll('thead th[data-k]').forEach(th => {
                th.classList.remove('er-th-sort','asc','desc');
                if (th.dataset.k === state.sortKey) th.classList.add('er-th-sort', state.sortDir > 0 ? 'asc' : 'desc');
            });
        }

        const getNum = id => { const v = doc.getElementById(id)?.value; return v == null || v === '' ? NaN : +v; };

        // Event bindings
        doc.getElementById('er-search').oninput = e => { state.q = e.target.value.toLowerCase(); applyPipeline(); };
        doc.getElementById('sf-title').onchange = e => { state.titleType = e.target.value; applyPipeline(); };
        doc.getElementById('sf-rank').onchange  = e => { state.rank = e.target.value; applyPipeline(); };
        ['sf-smin','sf-smax','sf-amin','sf-amax'].forEach(id => {
            doc.getElementById(id).oninput = () => {
                state.sMin = getNum('sf-smin'); state.sMax = getNum('sf-smax');
                state.aMin = getNum('sf-amin'); state.aMax = getNum('sf-amax');
                applyPipeline();
            };
        });
        modal.querySelectorAll('thead th[data-k]').forEach(th => {
            th.onclick = () => { state.sortDir = state.sortKey === th.dataset.k ? -state.sortDir : 1; state.sortKey = th.dataset.k; applyPipeline(); };
        });
        doc.getElementById('er-close').onclick = () => modal.remove();
        doc.getElementById('er-clear').onclick = () => { clearErankCache(); doc.getElementById('er-clear').textContent = 'Deleted'; };

        const box = modal.querySelector('.er-box');
        const toggleBtn = doc.getElementById('er-theme');
        if (localStorage.getItem('er_theme') === 'dark') { box.classList.add('er-dark'); toggleBtn.textContent = '☀️ Light'; }
        toggleBtn.onclick = () => {
            const d = box.classList.toggle('er-dark');
            localStorage.setItem('er_theme', d ? 'dark' : 'light');
            toggleBtn.textContent = d ? '☀️ Light' : '🌙 Dark';
        };

        // Image preview tooltip
        const preview = doc.createElement('div'); preview.className = 'er-preview'; preview.innerHTML = '<img>'; doc.body.appendChild(preview);
        doc.body.addEventListener('mousemove', e => {
            const t = e.target;
            if (t.tagName === 'IMG' && t.dataset.previews) {
                const img = preview.querySelector('img');
                if (img.src !== t.dataset.previews) img.src = t.dataset.previews;
                preview.style.display = 'block';
                const [pw, ph, vw, vh] = [preview.offsetWidth, preview.offsetHeight, win.innerWidth, win.innerHeight];
                let x = e.clientX + 20, y = e.clientY + 20;
                if (x + pw > vw) x = e.clientX - pw - 20;
                if (y + ph > vh) y = e.clientY - ph - 20;
                preview.style.left = x + 'px'; preview.style.top = y + 'px';
            } else { preview.style.display = 'none'; }
        });

        // Heart click delegation
        modal.addEventListener('click', async e => {
            const w = e.target.closest('.heartWrapper');
            if (!w) return;
            e.preventDefault();
            w.textContent = '⏳';
            await saveToGoogleSheet(config.sheetId, w.dataset.currenturl, w.dataset.title, w.dataset.img, +w.dataset.sales, +w.dataset.age, JSON.parse(decodeURIComponent(w.dataset.tags)));
            w.textContent = '❤️';
        });

        applyPipeline();
    }

    // ─── OVERLAY CREATION ────────────────────────────────────────────────────────
    const createOverlay = async ({ element, id, imgUrl = null, url = null, win = window }) => {
        url ??= element.querySelector('a.listing-link')?.href ?? element.querySelector('a.v2-listing-card__img')?.href ?? location.href;
        const currentUrl = simplifyEtsyUrl(url);
        const img   = imgUrl ?? element.querySelector('img')?.src;
        const overlay = win.document.createElement('div');
        overlay.style.cssText = 'display:flex;gap:.5rem;cursor:alias;color:#000;padding:1px;flex-wrap:wrap;align-items:center';
        element.appendChild(overlay);
        let title = element?.querySelector('h1, h3')?.textContent?.trim()?? document.querySelector('h1[data-buy-box-listing-title="true"]')?.textContent?.trim();
        let sales, age, tags;
        const loading = win.document.createElement('div');
        loading.textContent = 'Erank yükleniyor…';
        overlay.appendChild(loading);
        try {
            const erankData = await getErankData(id,element,img,currentUrl);
            if (erankData.error) {
                if (erankData.error === "Not found") {
                    loadingEl.textContent = "Erank verileri bulunamadı.";
                } else {
                    loadingEl.textContent = "Erank'a giriş yapın.";
                }
                return;
            }
            ({ sales, age, title, tags } = erankData);

        } catch (error) {
            console.error(error)
            //showToast('Konfigure YOK', 'info');
            sales = -1;
            age = -1;
            tags = "";
        }

        loading.remove();

        // ── Heart button (sheet 1) ──
        if (config.sheetId) {
            const { dnoValue, gDrive, teamname } = findById(id);
            const hw = win.document.createElement('div');
            hw.style.cssText = 'position:relative;display:inline-block';

            const heart = win.document.createElement('div');
            heart.style.cssText = 'font-size:1.5rem;cursor:cell';

            if (dnoValue) {
                heart.textContent = '❤️';
                heart.title = `Dizayn NO: ${dnoValue} by ${teamname}`;
                heart.style.cursor = 'default';
                const badge = win.document.createElement('span');
                badge.textContent = dnoValue;
                badge.style.cssText = 'position:absolute;top:-4px;left:-19px;background:gold;color:#000;border-radius:50%;padding:2px 5px;font-size:.75rem;font-weight:700';
                hw.appendChild(badge);
                if (gDrive) hw.addEventListener('click', () => win.open(gDrive, '_blank'));
            } else {
                heart.textContent = '🤍';
                heart.title = 'Listeye EKLE!';
                hw.addEventListener('click', async () => {
                    heart.textContent = '⏳';
                    await saveToGoogleSheet(config.sheetId, currentUrl, title, img, sales, age, tags);
                    heart.textContent = '❤️';
                });
            }
            hw.appendChild(heart);
            overlay.appendChild(hw);
        }

        // ── Sales / Age ──
        const mkDiv = (text, bg) => { const d = win.document.createElement('div'); d.textContent = text; if (bg) d.style.backgroundColor = bg; return d; };
        const salesBg = sales === -1 ? '#b00bb3' : +sales / 1.3 > +age ? 'green' : +sales === 0 ? 'red' :'';
        overlay.appendChild(mkDiv(`Satış: ${sales}`, salesBg));

        const ageBg = age === -1 ? '#b00bb3' : age >= 1 && age <= 50 ? '#73C476' : age <= 100 ? '#C5E1A5' : age <= 300 ? '#FFD54F' : '#EF9A9A';
        overlay.appendChild(mkDiv(`Yaş: ${age}`, ageBg));

        // ── Copy tags ──
        const copyBtn = win.document.createElement('button');
        copyBtn.textContent = 'C'; copyBtn.title = 'Tag copy'; copyBtn.style.cursor = 'grab';
        copyBtn.onclick = () => navigator.clipboard.writeText(Array.isArray(tags) ? tags.join(', ') : '').then(() => showToast('Tags kopyalandı!'));
        overlay.appendChild(copyBtn);

        // ── Trademark ──
        const trade = extractFirstParts(title);
        if (trade) {
            const tm = win.document.createElement('button');
            tm.textContent = 'T'; tm.title = 'Trademark kontrol et'; tm.style.cursor = 'help';
            tm.onclick = () => win.open(`https://www.trademarkia.com/search/trademarks?q=${encodeURIComponent(trade)}&country=us&codes=025&status=registered`, '_blank');
            overlay.appendChild(tm);
        }

        // ── Heart button (sheet 2) ──
        if (config.sheetId2) {
            const { dnoValue, gDrive } = findById(id, 2);
            const h2 = win.document.createElement('div');
            h2.style.cssText = 'font-size:1.5rem;cursor:cell';
            h2.textContent = dnoValue ? '✅' : '⭐';
            h2.title = dnoValue ? `Dizayn NO: ${dnoValue}` : `İsteğe EKLE! –${id}`;
            if (!dnoValue) {
                h2.addEventListener('click', async () => {
                    h2.textContent = '⏳';
                    await saveToGoogleSheet(config.sheetId2, currentUrl, title, img, sales, age, tags);
                    h2.textContent = '✅';
                });
            } else if (gDrive) {
                h2.style.cursor = 'pointer';
                h2.addEventListener('click', () => win.open(gDrive, '_blank'));
            }
            overlay.appendChild(h2);
        }
    };

    // ─── PAGE HANDLERS ────────────────────────────────────────────────────────────
    async function handleListingPage(win) {
        const parts = win.location.pathname.split('/');
        const id    = parts[parts.indexOf('listing') + 1];
        const el    = win.document.querySelector('#listing-page-cart > div.wt-mt-xs-1.wt-mb-xs-1 > h1');
        const imgEl = win.document.querySelector('#photos > div > div > ul > li > img');
        if (el && id) await createOverlay({ element: el, id, imgUrl: imgEl?.src, win });
    }

    async function initOverlay(win) {
        observeElements('[data-listing-id][data-listing-card-v2]', el => {
            createOverlay({ element: el, id: el.dataset.listingId, win });
        }, win.document);
    }

    function purchasesOverlay(win) {
        observeElements('li.transaction', async el => {
            const info   = readTransaction(el);
            const imgUrl = info.image?.replace('/il_300x300', '/il_600x600');
            const infoEl = el.querySelector('.transaction-download.transaction-data') || el.querySelector('.transaction-downloads') || el.querySelector('.transaction-download');
            const match  = /etsy\.com\/listing\/(\d+)/.exec(info.link||'');
            if (!match) return;
            await createOverlay({ element: infoEl, id: match[1], imgUrl, url: info.link, win });
        }, win.document);
    }

    function ehuntOverlay(win) {
        observeElements('.el-table__row', async el => {
            const imgEl = el.querySelector('img');
            await waitFor(() => imgEl?.dataset.src);
            const imgUrl = imgEl.dataset.src.replace('/il_120xN', '/il_620xN');
            const linkEl = el.querySelector('.cell > div > a:first-child');
            const url    = linkEl?.href;
            const match  = /etsy\.com\/listing\/(\d+)/.exec(url||'');
            if (!match) return;
            const infoEl = el.querySelector('.src-css-product-productInfoSub-3svU') || el;
            await createOverlay({ element: infoEl, id: match[1], imgUrl, url, win });
        }, win.document);
    }

    async function ehuntOverlayDetail(win) {
        const id = win.location.pathname.split('/')[3];
        observeElements('.etsy-container', async el => {
            await waitFor(() => el.querySelector('#indexCarImg')?.src);
            const imgEl = el.querySelector('#indexCarImg');
            const titleEl = el.querySelector('#header_container > div:nth-child(2) > div:nth-child(2)');
            if (titleEl && id) await createOverlay({ element: titleEl, id, imgUrl: imgEl.src, win });
        }, win.document);
    }

    async function shopOverlay(win) {
        const data = shopDataFetch(win);
        if (data) await logToGoogleSheets(data);
    }

    function shopDataFetch(win) {
        const doc = win.document;
        if (!doc.querySelector('h1.shop-name')) return null;
        return {
            name:             doc.querySelector('h1.shop-name')?.innerText.trim(),
            location:         doc.querySelector('.sb-shop-location')?.innerText.trim(),
            icon:             doc.querySelector('img.shop-icon-external')?.src,
            starSeller:       !!doc.querySelector('.star-seller-badge'),
            rating:           doc.querySelector('[data-review-ratings-count]')?.getAttribute('data-rating'),
            reviews:          toInt(doc.querySelector('.rating-and-reviews-count__reviews-count')?.innerText.replace(/[()]/g,'').trim()),
            sales:            toInt(doc.querySelector('[data-highlight="sales"] .highlight__primary-content')?.innerText.trim()),
            onEtsy:           pastDateFromText(doc.querySelector('[data-highlight="on_etsy"] .highlight__primary-content')?.innerText.trim()),
            latestActivity:   doc.querySelector('[data-latest-activity-date]')?.innerText.replace('Latest activity:','').trim(),
            latestActivityTs: doc.querySelector('[data-latest-activity-date]')?.getAttribute('data-latest-activity-date'),
            link:             'https://www.etsy.com/shop/' + doc.querySelector('h1.shop-name')?.innerText.trim(),
            team:             config.team || '',
            sheetName:        'Shop'
        };
    }

    function readTransaction(li) {
        const titleEl = li.querySelector('.transaction-title a');
        const imgEl   = li.querySelector('.transaction-image img');
        const priceEl = li.querySelector('.currency-value');
        const priceText = priceEl?.innerText.trim() ?? null;
        return {
            transactionId: li.getAttribute('data-transaction-id'),
            receiptId:     li.getAttribute('data-receipt-id'),
            title:         titleEl?.innerText?.trim() ?? null,
            link:          titleEl?.href ?? null,
            image: (imgEl?.src || imgEl?.getAttribute('data-src')) ?? null,
            priceText,
            priceNumber:   parsePriceToNumber(priceText)
        };
    }

    async function waitForValidEHuntDoc(win) {
        while (
            !(win.location.href.startsWith('https://ehunt.ai/iframe/etsy-product-research?') ||
              win.location.href.startsWith('https://ehunt.ai/iframe/product-detail')) ||
            win.document.readyState !== 'complete'
        ) await new Promise(r => requestAnimationFrame(r));
    }

    // ─── MAIN ENTRY ───────────────────────────────────────────────────────────────
    async function doTheThing(win) {
        if (!configLoaded) { showToast('Config yüklenemedi', 'error'); return; }

        // Add floating table button
        const btn = win.document.createElement('button');
        btn.textContent = '📊 eRank Table';
        btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;padding:8px 14px;border-radius:6px;border:none;background:#4285f4;color:#fff;cursor:pointer;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.3)';
        btn.onclick = () => openErankTableModal(win);
        win.document.body.appendChild(btn);

        const href = win.location.href;

        if (href.includes('/listing/')) {
            await handleListingPage(win);
        } else if (href.includes('etsy.com/your/purchases')) {
            purchasesOverlay(win);
        } else if (win.name === 'zbaseiframe') {
            await waitForValidEHuntDoc(win);
            if (href.includes('/product-detail/')) {
                ehuntOverlayDetail(win);
                showToast('Ehunt Detail');
            } else {
                ehuntOverlay(win);
                showToast('Ehunt');
            }
        } else {
            if (href.includes('etsy.com/shop/')) shopOverlay(win);
            // Prefetch sheet data in parallel
            await Promise.all([
                config.sheetId  ? fetchColumnData(1) : Promise.resolve(),
                config.sheetId2 ? fetchColumnData(2) : Promise.resolve()
            ]);
            initOverlay(win);
        }
    }

    function runInIframe(iframe) {
        const iWin = iframe.contentWindow, iDoc = iframe.contentDocument;
        onLoaded(iDoc, () => doTheThing(iWin));
    }

    // ─── BOOTSTRAP ────────────────────────────────────────────────────────────────
    await loadConfig();
    GM.registerMenuCommand('⚙️ Ayarlar', showConfigMenu);
    showToast('Pod Tool Yüklendi.', 'info', 2000);

    await ensureBearer();

    const isEtsyHunt = location.host === 'ehunt.ai' &&
        (location.pathname === '/etsy-product-research' || location.href.includes('/product-detail/'));

    if (isEtsyHunt) {
        observeElements('iframe#zbaseiframe', runInIframe, document);
    } else {
        console.log("doTheThing")
        onLoaded(document, () => doTheThing(window));
    }

})();
