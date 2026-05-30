// ==UserScript==
// @name         Etsy Discount Adjust
// @version      2.00
// @description  Create daily discount — Optimized v2
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/sales-discounts*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.addStyle
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyDiscountAdjust.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyDiscountAdjust.user.js
// @run-at       document-end
// ==/UserScript==

(async function () {
    'use strict';

    // ─────────────────────────────────────────────
    // STYLES — only what's actually used in this script
    // ─────────────────────────────────────────────
    GM.addStyle(`
        :root {
            --pc:#4285f4; --pc-d:#3367d6;
            --sc:#34a853; --sc-d:#2e7d32;
            --dc:#ea4335;
            --wc:#fbbc05; --dk:#202124;
            --gc:#5f6368;
            --br:4px; --bs:0 2px 10px rgba(0,0,0,.1);
            --tr:all .3s ease; --ff:'Segoe UI',Roboto,Arial,sans-serif;
        }
        .eda-toast-wrap { position:fixed; bottom:50px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none; }
        .eda-toast { min-width:280px; padding:12px 16px; border-radius:var(--br); box-shadow:var(--bs); font:14px var(--ff); display:flex; align-items:center; justify-content:space-between; opacity:0; transform:translateY(16px); transition:var(--tr); pointer-events:all; }
        .eda-toast.show { opacity:1; transform:translateY(0); }
        .eda-toast.success { background:var(--sc); color:#fff; }
        .eda-toast.error   { background:var(--dc); color:#fff; }
        .eda-toast.warning { background:var(--wc); color:var(--dk); }
        .eda-toast.info    { background:var(--pc); color:#fff; }
        .eda-toast-x { background:none; border:none; color:inherit; cursor:pointer; font-size:16px; margin-left:10px; opacity:.7; }
        .eda-toast-x:hover { opacity:1; }

        .eda-btn { padding:8px 12px; border:none; border-radius:var(--br); font:500 14px var(--ff); cursor:pointer; transition:var(--tr); display:inline-flex; align-items:center; gap:6px; }
        .eda-btn:focus { outline:none; }
        .eda-btn-primary { background:var(--pc); color:#fff; } .eda-btn-primary:hover { background:var(--pc-d); }
        .eda-btn-light   { background:#f8f9fa; color:var(--dk); border:1px solid #ddd; } .eda-btn-light:hover { background:#e9ecef; }

        .eda-input { padding:6px 8px; border:1px solid #ddd; border-radius:var(--br); font:14px var(--ff); transition:var(--tr); width:100%; box-sizing:border-box; }
        .eda-input:focus { outline:none; border-color:var(--pc); box-shadow:0 0 0 2px rgba(66,133,244,.2); }

        .eda-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:9999; opacity:0; visibility:hidden; transition:var(--tr); }
        .eda-overlay.show { opacity:1; visibility:visible; }
        .eda-modal { background:#fff; border-radius:var(--br); box-shadow:var(--bs); width:90%; max-width:480px; max-height:90vh; overflow:auto; transform:translateY(-20px); transition:var(--tr); }
        .eda-overlay.show .eda-modal { transform:translateY(0); }
        .eda-modal-hd { padding:16px; border-bottom:1px solid #eee; display:flex; align-items:center; justify-content:space-between; }
        .eda-modal-title { font:500 18px var(--ff); margin:0; }
        .eda-modal-close { background:none; border:none; font-size:20px; cursor:pointer; color:var(--gc); }
        .eda-modal-bd { padding:16px; }
        .eda-modal-ft { padding:16px; border-top:1px solid #eee; display:flex; justify-content:flex-end; gap:10px; }
        .eda-field { margin-bottom:14px; }
        .eda-field label { display:block; margin-bottom:4px; font-weight:600; font-size:13px; }
    `);

    // ─────────────────────────────────────────────
    // CONFIG
    // ─────────────────────────────────────────────
    const DEFAULT_CONFIG = { discount:25, discountName:'', mount:1, lastDay:1, fullYear:2025 };
    let config = { ...DEFAULT_CONFIG };

    async function loadConfig() {
        const saved = await GM.getValue('Config').catch(() => null);
        if (saved) config = { ...DEFAULT_CONFIG, ...saved };
    }
    const saveConfig = () => GM.setValue('Config', config);

    // ─────────────────────────────────────────────
    // TOAST
    // ─────────────────────────────────────────────
    let _toastWrap = null;
    function getToastWrap() {
        if (!_toastWrap) {
            _toastWrap = Object.assign(document.createElement('div'), { className:'eda-toast-wrap' });
            document.body.appendChild(_toastWrap);
        }
        return _toastWrap;
    }
    function showToast(message, type = 'success', duration = 3000) {
        const t = document.createElement('div');
        t.className = `eda-toast ${type}`;
        const s = Object.assign(document.createElement('span'), { textContent:message });
        const x = Object.assign(document.createElement('button'), { className:'eda-toast-x', innerHTML:'&times;' });
        x.onclick = () => dismissToast(t);
        t.append(s, x);
        getToastWrap().appendChild(t);
        t.getBoundingClientRect(); // force reflow
        t.classList.add('show');
        if (duration > 0) setTimeout(() => dismissToast(t), duration);
    }
    function dismissToast(t) {
        t.classList.remove('show');
        t.addEventListener('transitionend', () => t.remove(), { once:true });
    }

    // ─────────────────────────────────────────────
    // CONFIG MODAL
    // ─────────────────────────────────────────────
    const FIELDS = [
        { id:'discount',      label:'Discount %',       type:'number' },
        { id:'discountName',  label:'Discount Name',    type:'text'   },
        { id:'mount',         label:'Ay (mount)',        type:'number' },
        { id:'lastDay',       label:'Gün (lastDay)',     type:'number' },
        { id:'fullYear',      label:'Yıl (fullYear)',    type:'number' },
    ];

    function showConfigMenu() {
        const overlay = document.createElement('div');
        overlay.className = 'eda-overlay';

        const bodyHTML = FIELDS.map(f => `
            <div class="eda-field">
                <label for="cfg_${f.id}">${f.label}</label>
                <input id="cfg_${f.id}" type="${f.type}" class="eda-input" value="${config[f.id] ?? ''}">
            </div>`).join('');

        overlay.innerHTML = `
            <div class="eda-modal">
                <div class="eda-modal-hd">
                    <h3 class="eda-modal-title">Discount Tool Ayarları</h3>
                    <button class="eda-modal-close">&times;</button>
                </div>
                <div class="eda-modal-bd">${bodyHTML}</div>
                <div class="eda-modal-ft">
                    <button class="eda-btn eda-btn-light" id="eda_cancel">İptal</button>
                    <button class="eda-btn eda-btn-primary" id="eda_save">Kaydet</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        const close = () => {
            overlay.classList.remove('show');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once:true });
        };

        overlay.querySelector('.eda-modal-close').onclick = close;
        overlay.querySelector('#eda_cancel').onclick      = close;
        overlay.querySelector('#eda_save').onclick = async () => {
            FIELDS.forEach(f => {
                const val = document.getElementById(`cfg_${f.id}`).value;
                config[f.id] = f.type === 'number' ? parseFloat(val) || 0 : val;
            });
            await saveConfig();
            showToast('Ayarlar kaydedildi', 'success');
            close();
        };
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────
    const VALID_DISCOUNTS = new Set([25, 30, 35, 40, 45, 50]);

    /** Fire both input + change events — needed for React/Preact controlled inputs */
    function fireEvents(el) {
        el.dispatchEvent(new Event('input',  { bubbles:true, composed:true }));
        el.dispatchEvent(new Event('change', { bubbles:true, composed:true }));
    }

    function setNativeValue(el, val) {
        // For React-controlled inputs that ignore direct .value assignment
        const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value')?.set;
        if (setter) setter.call(el, val);
        else el.value = val;
        fireEvents(el);
    }

    const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
    const wait = ms => new Promise(r => setTimeout(r, ms));

    // ─────────────────────────────────────────────
    // MAIN — fill form fields
    // ─────────────────────────────────────────────
    async function main() {
        if (config.lastDay > 31) {
            showToast('Yeni aya geç: ' + config.lastDay, 'error');
            return;
        }

        const dd  = String(config.lastDay).padStart(2, '0');
        const mm  = String(config.mount).padStart(2, '0');
        const dateStr = `${config.fullYear}-${mm}-${dd}`;

        // ── Dates ──────────────────────────────────
        const startEl = document.querySelector('#sales-and-coupons--start-date');
        const endEl   = document.querySelector('#sales-and-coupons--end-date');

        if (startEl) { startEl.focus(); setNativeValue(startEl, dateStr); startEl.blur(); }
        if (endEl)   { endEl.focus();   setNativeValue(endEl,   dateStr); endEl.blur(); }

        // ── Discount select ─────────────────────────
        const select = document.querySelector('#reward-percentage');
        if (select) {
            const discount = Number(config.discount);
            if (VALID_DISCOUNTS.has(discount)) {
                const opt = [...select.options].find(o => o.value === String(discount));
                if (opt) {
                    select.value = opt.value;
                    fireEvents(select);
                }
            } else {
                // Use "custom" option (value=1) then fill the number input
                select.value = '1';
                fireEvents(select);
                // Wait for custom input to appear
                await wait(500);
                const custom = document.querySelector(
                    "input[data-discount-input], #wt-modal-container input[type='number']"
                );
                if (custom) setNativeValue(custom, discount);
            }
        }

        // ── Coupon name ─────────────────────────────
        const couponEl = document.querySelector('#name-your-coupon');
        if (couponEl) setNativeValue(couponEl, `${dd}${config.discountName}${config.discount}`);

        // ── Advance day counter ─────────────────────
        config.lastDay += 1;
        await saveConfig();
        showToast('Eklendi. Sonraki gün: ' + config.lastDay);
    }

    // ─────────────────────────────────────────────
    // NEXT STEP — click through modal wizard
    // ─────────────────────────────────────────────
    async function nextStep() {
        const MODAL_SEL = '#wt-modal-container > div.wt-overlay.wt-overlay--will-animate.wt-overlay--full-screen.wt-overlay--no-animation > div > div.wt-overlay__sticky-footer-container.wt-z-index-1.wt-shadow-elevation-3 > div';
        const step = document.querySelector(MODAL_SEL);
        if (!step) { showToast('Modal bulunamadı', 'error'); return; }

        const click = async sel => {
            await wait(rand(1200, 1800));
            const btn = step.querySelector(sel);
            if (btn) { btn.click(); } else { console.warn('[EDA] Button not found:', sel); }
        };

        await click('div.wt-overlay__footer__action > button'); // step 1
        await click('div:nth-child(3) > button');               // step 2
        await click('div:nth-child(3) > button');               // step 3

        await wait(rand(800, 1000));
        window.location.href = 'https://www.etsy.com/your/shops/me/sales-discounts/step/createSale';
    }

    // ─────────────────────────────────────────────
    // KEYBOARD — single listener (was two separate ones)
    // ─────────────────────────────────────────────
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); main(); }
        if (e.ctrlKey && e.altKey)           { nextStep(); }
    });

    // ─────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────
    await loadConfig();
    GM.registerMenuCommand('⚙️ Ayarlar', showConfigMenu);
    showToast('Discount Tool: Ctrl+Space → doldur | Ctrl+Alt → ilerle', 'info', 4000);

})();
