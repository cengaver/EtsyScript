// ==UserScript==
// @name         Etsy Listing Inline Analyzer
// @description  Etsy Listing Inline Analyzer — Optimized v2
// @version      2.00
// @author       Cengaver
// @namespace    https://github.com/cengaver
// @match        https://www.etsy.com/your/shops/me/tools/listings/*
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/etsyListingAnalyzer.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/etsyListingAnalyzer.user.js
// ==/UserScript==

(async function () {
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
        .ela-toast-wrap { position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none; }
        .ela-toast { min-width:260px; padding:10px 14px; border-radius:var(--br); box-shadow:var(--bs); font:14px var(--ff); display:flex; align-items:center; justify-content:space-between; opacity:0; transform:translateY(16px); transition:var(--tr); pointer-events:all; }
        .ela-toast.show { opacity:1; transform:translateY(0); }
        .ela-toast.success { background:var(--sc); color:#fff; }
        .ela-toast.error   { background:var(--dc); color:#fff; }
        .ela-toast.warning { background:var(--wc); color:var(--dk); }
        .ela-toast.info    { background:var(--pc); color:#fff; }
        .ela-toast-x { background:none; border:none; color:inherit; cursor:pointer; font-size:16px; margin-left:8px; opacity:.7; }
        .ela-toast-x:hover { opacity:1; }
        .ela-tip {
            position:fixed; background:#fff; border:1px solid #ddd;
            padding:10px; font-size:12px; font-family:var(--ff);
            box-shadow:0 4px 12px rgba(0,0,0,.15);
            display:none; z-index:9999; width:270px;
            border-radius:var(--br); line-height:1.5;
        }
    `);

    // ─────────────────────────────────────────────
    // TOAST
    // ─────────────────────────────────────────────
    let _toastWrap = null;
    function getToastWrap() {
        if (!_toastWrap) {
            _toastWrap = Object.assign(document.createElement('div'), { className:'ela-toast-wrap' });
            document.body.appendChild(_toastWrap);
        }
        return _toastWrap;
    }
    function showToast(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `ela-toast ${type}`;
        const span = Object.assign(document.createElement('span'), { textContent: message });
        const btn  = Object.assign(document.createElement('button'), { className:'ela-toast-x', innerHTML:'&times;' });
        btn.onclick = () => dismissToast(toast);
        toast.append(span, btn);
        getToastWrap().appendChild(toast);
        toast.getBoundingClientRect(); // force reflow
        toast.classList.add('show');
        if (duration > 0) setTimeout(() => dismissToast(toast), duration);
    }
    function dismissToast(t) {
        t.classList.remove('show');
        t.addEventListener('transitionend', () => t.remove(), { once:true });
    }

    // ─────────────────────────────────────────────
    // SETTINGS — in-memory cache, one GM.getValue each
    // ─────────────────────────────────────────────
    const _cfg = { sheetUrl: null, shopName: null, version: null };

    async function getSheetUrl()  { return _cfg.sheetUrl  ??= await GM.getValue('sheet_url',  ''); }
    async function getShopName()  { return _cfg.shopName  ??= await GM.getValue('shop_name',  ''); }
    async function getVersion()   { return _cfg.version   ??= await GM.getValue('version',    '7'); }

    GM.registerMenuCommand('⚙️ Sheet Url Ayarla', async () => {
        const url = prompt('Sheet URL\'nizi girin:', await getSheetUrl());
        if (url?.trim()) { _cfg.sheetUrl = url.trim(); await GM.setValue('sheet_url', _cfg.sheetUrl); showToast('✅ Kaydedildi', 'info'); }
    });
    GM.registerMenuCommand('⚙️ Mağaza Adı', async () => {
        const shop = prompt('Mağaza adı girin:', await getShopName());
        if (shop?.trim()) { _cfg.shopName = shop.trim(); await GM.setValue('shop_name', _cfg.shopName); showToast('✅ Kaydedildi', 'info'); }
    });
    GM.registerMenuCommand('⚙️ Versiyon', async () => {
        const ver = prompt('Versiyon Numarası:', await getVersion());
        if (ver?.trim()) { _cfg.version = ver.trim(); await GM.setValue('version', _cfg.version); showToast('✅ Kaydedildi', 'info'); }
    });

    // ─────────────────────────────────────────────
    // SENT-KEY / localStorage
    // ─────────────────────────────────────────────
    const VERSION  = await getVersion();
    const SENT_KEY = `etsy_analyzer_sent_v${VERSION}`;

    // Load once; keep in memory; flush to localStorage on write
    const sent = JSON.parse(localStorage.getItem(SENT_KEY) || '{}');

    // Purge stale version keys
    const PREFIX = 'etsy_analyzer_sent_';
    Object.keys(localStorage).forEach(k => {
        if (k.startsWith(PREFIX) && k !== SENT_KEY) localStorage.removeItem(k);
    });

    // ─────────────────────────────────────────────
    // SCAN — debounced to avoid hammering on rapid DOM updates
    // ─────────────────────────────────────────────
    const seen = new Set();
    let _scanTimer = null;

    function scheduleScan() {
        clearTimeout(_scanTimer);
        _scanTimer = setTimeout(scan, 150);
    }

    function scan() {
        document.querySelectorAll('.card-actions.card-actions-3').forEach(actions => {
            const card = findCard(actions);
            if (!card) return;
            const id = getListingId(card);
            if (!id || seen.has(id)) return;
            seen.add(id);
            analyze(card, actions, id);
        });
    }

    // ─────────────────────────────────────────────
    // DOM HELPERS
    // ─────────────────────────────────────────────
    function findCard(el) {
        let cur = el;
        for (let i = 0; i < 10; i++) {
            if (!cur) return null;
            if (/sales|favorites|visits/i.test(cur.innerText)) return cur;
            cur = cur.parentElement;
        }
        return null;
    }

    function getListingId(card) {
        const m = card.querySelector('a[href*="/listing/"]')?.href.match(/\/listing\/(\d+)/);
        return m?.[1] ?? null;
    }

    function getSkuFromRow(card) {
        const span = card.querySelector('.card-meta-row-sku span');
        return span ? (span.getAttribute('title') || span.textContent || '').trim() : '';
    }

    function getImgFromRow(card) {
        return card.querySelector('.card-img-wrap img')?.src?.trim() ?? '';
    }

    function getTitleFromRow(card) {
        const h2 = card.querySelector('h2.card-title');
        return h2 ? (h2.getAttribute('title') || h2.textContent || '').trim() : '';
    }

    // ─────────────────────────────────────────────
    // ANALYSIS
    // ─────────────────────────────────────────────
    const pick = (t, r) => { const m = t.match(r); return m ? +m[1] : 0; };

    function isExpires(t)    { return /\bExpires\b/i.test(t); }
    function parseRenew(t)   { return t.match(/(?:Auto[-\s]?renews?|Expires)\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i)?.[1] ?? null; }
    function parseRenewDate(text) { return text ? new Date(text) : null; }

    function ageFromRenew(d, r, s) {
        if (!d) return 0;
        const MS = 86400000, PERIOD = 120;
        let pub = d.getTime() - PERIOD * MS;
        if (s === 0 && r > 0) pub -= r * PERIOD * MS;
        return Math.max(0, Math.floor((Date.now() - pub) / MS));
    }

    async function analyze(card, actions, id) {
        const t       = card.innerText;
        const sales   = pick(t, /(\d+)\s+sales?/i);
        const favs    = pick(t, /(\d+)\s+favorites?/i);
        const visits  = pick(t, /(\d+)\s+visits?/i);
        const renewal = pick(t, /(\d+)\s+renewal?/i);
        const renewDate = parseRenewDate(parseRenew(t));
        const expires = isExpires(t);
        const age     = ageFromRenew(renewDate, renewal, sales);
        const title   = getTitleFromRow(card);
        const sku     = getSkuFromRow(card);
        const img     = getImgFromRow(card);

        const data = {
            id, title, sku, age, visits, favs, sales, renewal,
            issues:  buildIssues({ age, visits, favs, sales }),
            issues2: decision2({ age, visits, favs, sales }),
            img, expires,
            shopName:  await getShopName(),
            sheetName: 'analiz',
        };

        inject(actions, data);
    }

    // ─────────────────────────────────────────────
    // INJECT badge + tooltip
    // ─────────────────────────────────────────────
    function inject(actions, data) {
        const target = actions.querySelector('.wt-display-flex-xs.wt-align-items-center');
        if (!target) return;

        const level = getLevel(data.age, data.sales, data.expires);

        // Tooltip — shared singleton approach: one per badge
        const tip = document.createElement('div');
        tip.className = 'ela-tip';
        tip.innerHTML = `
            <div style="font-weight:700;font-size:13px;margin-bottom:6px">${level.icon} ${level.label}</div>
            <div style="font-weight:600;margin-bottom:6px">${data.title || 'Untitled'}</div>
            Sales: ${data.sales}<br>
            Favorites: ${data.favs}<br>
            Visits: ${data.visits}<br>
            Age: ${data.age} gün<br>
            Renewal: ${data.renewal || 'N/A'}<br><br>
            <b>Issues</b><br>${data.issues.map(i => '• ' + i).join('<br>')}<br><br>
            <b>Issues 2</b><br>${data.issues2.map(i => '• ' + i).join('<br>')}
        `;
        document.body.appendChild(tip);

        const badge = document.createElement('span');
        badge.textContent = level.icon;
        badge.title = level.label;
        badge.style.cssText = `margin-left:8px;font-size:18px;cursor:pointer;color:${level.color};`;

        badge.addEventListener('mouseenter', e => {
            tip.style.display = 'block';
            const margin = 12, vw = window.innerWidth, vh = window.innerHeight;
            const { width: tw, height: th } = tip.getBoundingClientRect();
            const top  = e.clientY + margin + th > vh ? e.clientY - th - margin : e.clientY + margin;
            const left = e.clientX + margin + tw > vw ? e.clientX - tw - margin : e.clientX + margin;
            tip.style.top  = Math.max(8, top)  + 'px';
            tip.style.left = Math.max(8, left) + 'px';
        });
        badge.addEventListener('mouseleave', () => { tip.style.display = 'none'; });

        const badgeDiv = document.createElement('div');
        badgeDiv.classList.add('wt-flex-xs-1');
        badgeDiv.appendChild(badge);
        target.appendChild(badgeDiv);

        // Send to Sheets only once per listing per session
        if (!sent[data.id]) {
            sendToSheets(data);
            sent[data.id] = Date.now();
            localStorage.setItem(SENT_KEY, JSON.stringify(sent));
        }
    }

    // ─────────────────────────────────────────────
    // LEVEL
    // ─────────────────────────────────────────────
    function getLevel(age, sales, expires) {
        if (sales > 0)  return { icon:'🟢', color:'#2ecc71', label:'Satış Var' };
        if (age <= 14)  return { icon:'🟡', color:'#f1c40f', label:'Yeni – Dokunma' };
        if (age <= 30)  return { icon:'🟠', color:'#e67e22', label:'İzleme Aşaması' };
        if (age <= 60)  return { icon:'🔴', color:'#e74c3c', label:'Güçlü Optimizasyon' };
        if (expires)    return { icon:'🚧', color:'#8e44ad', label:'Başarısız – Kapat/Yenile' };
        return             { icon:'🚨', color:'#8e44ad', label:'Başarısız – Kapat/Yenile' };
    }

    // ─────────────────────────────────────────────
    // ISSUE BUILDERS
    // ─────────────────────────────────────────────
    function buildIssues({ age, visits, favs, sales }) {
        if (sales > 0)  return ['Satış almış – dokunma'];
        if (age <= 14)  return ['Yeni listing (0–14 gün)', 'Öneri: Dokunma, veri birikmesini bekle'];
        if (age <= 30) {
            if (visits >= 50 && favs === 0) return ['İlgi çekmiyor (favori yok)', 'Öneri: Ana görsel / başlık hafif test'];
            return ['15–30 gün – izleme aşaması', 'Öneri: Küçük testler (görsel veya fiyat)'];
        }
        if (age <= 60) {
            if (visits >= 100 && favs === 0) return ['Yüksek trafik var, ilgi yok', 'Öneri: Görsel + başlık köklü değişim'];
            if (favs > 0)                    return ['Favori var, satış yok', 'Öneri: Fiyat / kargo / güven optimizasyonu'];
            if (visits < 30)                 return ['Düşük trafik', 'Öneri: SEO ve yenileme'];
            return ['30–60 gün – satış yok', 'Öneri: Güçlü genel optimizasyon'];
        }
        return ['60+ gün – satış yok (başarısız)', 'Öneri: Yeniden aç, varyasyon değiştir veya kapat'];
    }

    function decision2({ age, visits, favs, sales }) {
        if (sales > 0) return ['Satış almış – dokunma'];
        const out = [];
        if (visits > 3  && favs >= 1) out.push('A. Yüksek trafik ve ilgi var, satış olmaması fiyat,<br> kargo veya güven/teklif kaynaklı bir dönüşüm sorunudur.<br> Eylem: Fiyat/Teklif Optimizasyonu.');
        if (visits > 3  && favs === 0) out.push('B. Yüksek trafik var ancak ürün ilgiyi (favori) çekemiyor.<br> Sorun, listelemenin vitrininde (görsel, başlık) olmalı.<br> Eylem: Görsel/Başlık/Açıklama Optimizasyonu.');
        if (visits >= 1 && visits <= 3 && favs >= 1) out.push('C. Ortalama trafik ve ilgi var.<br> Hem görünürlük (SEO) hem de satışa dönüştürme (Fiyat/Teklif) sorunu.<br> Eylem: Dönüşüm Odaklı SEO ve İyileştirme.');
        if (visits >= 1 && visits <= 3 && favs === 0) out.push('D. Ortalama trafik var ancak ilgi (favori) çekemiyor.<br> Sorun, listelemenin vitrininde (görsel, başlık) olmalı.<br> Eylem: Başlık/Ana Görsel Testi ve SEO İncelemesi.');
        if (visits < 1  && favs >= 1)  out.push('E. Listeleme potansiyel (Fav) gösteriyor ancak trafik alamıyor.<br> Öncelikli sorun görünürlük (SEO/Yenileme).<br> Eylem: Acil SEO ve Yenileme.');
        if (visits < 1  && favs === 0) out.push('F. En düşük öncelikli, hem trafik hem de ilgi yok.<br> Ya temel SEO eksik ya da ürün/pazar uyumu zayıf.<br> Eylem: Temel SEO Kontrolü ve Sil/Değiştir Kararı.');
        return out.length ? out : ['İzlenmeli'];
    }

    // ─────────────────────────────────────────────
    // SHEETS — fire-and-forget, Content-Type düzeltildi
    // ─────────────────────────────────────────────
    async function sendToSheets(payload) {
        const url = await getSheetUrl();
        if (!url) return;
        GM.xmlHttpRequest({
            method:  'POST',
            url,
            headers: { 'Content-Type': 'application/json' },
            data:    JSON.stringify(payload),
            onload(r) {
                try {
                    const d = JSON.parse(r.responseText);
                    if (d.status === 'success') showToast('✅ Analiz edildi', 'success');
                    else showToast('❌ ' + (d.message || 'Hata'), 'error');
                } catch { showToast('❌ Yanıt işlenemedi', 'error'); }
            },
            onerror() { showToast('❌ Gönderilemedi', 'error'); },
        });
    }

    // ─────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────
    new MutationObserver(scheduleScan).observe(document.body, { childList:true, subtree:true });
    setTimeout(scan, 800); // ilk yükleme — biraz bekle, Etsy SPA'sının listelemeleri render etmesi için

})();
