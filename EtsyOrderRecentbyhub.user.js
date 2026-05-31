// ==UserScript==
// @name         Etsy Order Recent by hub
// @namespace    https://github.com/cengaver
// @version      6.01
// @description  Etsy Order Recent - Optimized v6 (Blazor/WS compatible)
// @author       Cengaver
// @match        https://*.customhub.io/*
// @grant        GM.addStyle
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.listValues
// @grant        GM.deleteValue
// @connect      www.tcmb.gov.tr
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://dashboard.k8s.customhub.io/Modernize/assets/images/logos/favicon.png
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyOrderRecentbyhub.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyOrderRecentbyhub.user.js
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    // ─────────────────────────────────────────────
    // STYLES
    // ─────────────────────────────────────────────
    GM.addStyle(`
        :root {
            --pc: #4285f4; --pc-d: #3367d6;
            --sc: #34a853; --sc-d: #2e7d32;
            --dc: #ea4335; --dc-d: #c62828;
            --wc: #fbbc05; --wc-d: #f57f17;
            --lc: #f8f9fa; --dk: #202124;
            --gc: #5f6368;
            --br: 4px;
            --bs: 0 2px 10px rgba(0,0,0,.1);
            --tr: all .3s ease;
            --ff: 'Segoe UI', Roboto, Arial, sans-serif;
        }
        .toast-container { position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none; }
        .toast { min-width:280px; padding:12px 16px; border-radius:var(--br); box-shadow:var(--bs); font-family:var(--ff); font-size:14px; display:flex; align-items:center; justify-content:space-between; opacity:0; transform:translateY(20px); transition:var(--tr); pointer-events:all; }
        .toast.show { opacity:1; transform:translateY(0); }
        .toast-success { background:var(--sc); color:#fff; }
        .toast-error   { background:var(--dc); color:#fff; }
        .toast-warning { background:var(--wc); color:var(--dk); }
        .toast-info    { background:var(--pc); color:#fff; }
        .toast-close { background:none; border:none; color:inherit; cursor:pointer; font-size:16px; margin-left:10px; opacity:.7; }
        .toast-close:hover { opacity:1; }
        .color-modal { position:absolute; background:#fff; border:1px solid #ccc; padding:10px; z-index:9999; box-shadow:0 4px 8px rgba(0,0,0,.15); max-height:200px; overflow-y:auto; }
        .etsy-tool-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:9999; opacity:0; visibility:hidden; transition:var(--tr); }
        .etsy-tool-modal-overlay.show { opacity:1; visibility:visible; }
        .etsy-tool-modal { background:#fff; border-radius:var(--br); box-shadow:var(--bs); width:90%; max-width:600px; max-height:90vh; overflow:auto; transform:translateY(-20px); transition:var(--tr); }
        .etsy-tool-modal-overlay.show .etsy-tool-modal { transform:translateY(0); }
        .etsy-tool-modal-header { padding:16px; border-bottom:1px solid #eee; display:flex; align-items:center; justify-content:space-between; }
        .etsy-tool-modal-title { font-family:var(--ff); font-size:18px; font-weight:500; margin:0; }
        .etsy-tool-modal-close { background:none; border:none; font-size:20px; cursor:pointer; color:var(--gc); }
        .etsy-tool-modal-body { padding:16px; }
        .etsy-tool-modal-footer { padding:16px; border-top:1px solid #eee; display:flex; justify-content:flex-end; gap:10px; }
        .etsy-tool-btn { padding:8px 12px; border:none; border-radius:var(--br); font-family:var(--ff); font-size:14px; font-weight:500; cursor:pointer; transition:var(--tr); display:inline-flex; align-items:center; justify-content:center; gap:6px; }
        .etsy-tool-btn:focus { outline:none; }
        .etsy-tool-btn-primary   { background:var(--pc);  color:#fff; } .etsy-tool-btn-primary:hover   { background:var(--pc-d); }
        .etsy-tool-btn-secondary { background:var(--sc);  color:#fff; } .etsy-tool-btn-secondary:hover { background:var(--sc-d); }
        .etsy-tool-btn-danger    { background:var(--dc);  color:#fff; } .etsy-tool-btn-danger:hover    { background:var(--dc-d); }
        .etsy-tool-btn-warning   { background:var(--wc);  color:var(--dk); } .etsy-tool-btn-warning:hover { background:var(--wc-d); }
        .etsy-tool-btn-light     { background:var(--lc);  color:var(--dk); border:1px solid #ddd; } .etsy-tool-btn-light:hover { background:#e9ecef; }
        .etsy-tool-input { padding:2px 4px; border:1px solid #ddd; border-radius:var(--br); font-family:var(--ff); font-size:16px; transition:var(--tr); }
        .etsy-tool-input:focus { outline:none; border-color:var(--pc); box-shadow:0 0 0 2px rgba(66,133,244,.2); }
        .tl-info { white-space:pre-wrap; }
        .tab-button { flex:1; padding:12px; background:none; border:none; cursor:pointer; font-weight:500; color:#666; transition:all .2s; }
        .tab-button:hover { background:#f5f5f5; color:#333; }
        .tab-button.active { color:#5EE2E9; border-bottom:2px solid #5EE2E9; }
        #tab-content input, #tab-content select, #tab-content button { width:100%; padding:10px; margin:8px 0; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; }
        #tab-content button { background:#5EE2E9; color:#000; border:none; font-weight:bold; cursor:pointer; }
        #tab-content button:hover { background:#4acfd6; }
        .status-message { margin:10px 0; padding:8px; border-radius:4px; text-align:center; }
        .success { background:#e6ffed; color:#28a745; }
        .error   { background:#ffeef0; color:#cb2431; }
        #charPreviewContainer { display:flex; flex-wrap:wrap; gap:10px; }
        #charPreviewContainer img { max-height:50px; object-fit:contain; }
    `);

    // ─────────────────────────────────────────────
    // CONFIG
    // ─────────────────────────────────────────────
    const DEFAULT_CONFIG = { discount:25, feePerc:48, shipHoodie:8, shipHoodie2:3, shipTee:5, shipTee2:2, credit:0 };
    let config = { ...DEFAULT_CONFIG };

    async function loadConfig() {
        const saved = await GM.getValue('storeConfig').catch(() => null);
        if (saved) config = { ...DEFAULT_CONFIG, ...saved };
    }
    const saveConfig = () => GM.setValue('storeConfig', config);

    // ─────────────────────────────────────────────
    // SHIRT COLORS
    // ─────────────────────────────────────────────
    const SHIRT_COLORS_LIST = [
        { name:"Comfort Colors Lagoon",        ischecked:0, hex:"#5ec2df" },
        { name:"Heather Navy",                 ischecked:0, hex:"#333F48" },
        { name:"Heather Mauve",                ischecked:1, hex:"#C49BA3" },
        { name:"Charcoal",                     ischecked:0, hex:"#4D4D4D" },
        { name:"Carolina Blue",                ischecked:1, hex:"#71B2DB" },
        { name:"Comfort Colors Banana",        ischecked:1, hex:"#FCE9A6" },
        { name:"Comfort Colors Blue Jean",     ischecked:0, hex:"#5C7FA4" },
        { name:"Blue Jean",                    ischecked:0, hex:"#5C7FA4" },
        { name:"Comfort Colors Butter",        ischecked:1, hex:"#F6E39A" },
        { name:"Comfort Colors Chalky Mint",   ischecked:1, hex:"#A8D5BA" },
        { name:"Comfort Colors Chambray",      ischecked:1, hex:"#A6C8DD" },
        { name:"Comfort Colors Denim",         ischecked:0, hex:"#4F728E" },
        { name:"Comfort Colors Burnt Orange",  ischecked:1, hex:"#CC5500" },
        { name:"Comfort Colors Granite",       ischecked:0, hex:"#706C66" },
        { name:"Comfort Colors Grey",          ischecked:0, hex:"#B2B3B5" },
        { name:"Comfort Colors Hemp",          ischecked:0, hex:"#D5C8A6" },
        { name:"Comfort Colors Ice Blue",      ischecked:0, hex:"#7ba2bb" },
        { name:"Comfort Colors Ivory",         ischecked:1, hex:"#EFE8D2" },
        { name:"Comfort Colors Light Green",   ischecked:1, hex:"#BFD8B8" },
        { name:"Comfort Colors Midnight",      ischecked:0, hex:"#2E3B4E" },
        { name:"Comfort Colors Orchid",        ischecked:1, hex:"#C3A3BF" },
        { name:"Comfort Colors Pepper",        ischecked:0, hex:"#4D4D4F" },
        { name:"Comfort Colors Seafoam",       ischecked:1, hex:"#9FD7C1" },
        { name:"Comfort Colors Watermelon",    ischecked:0, hex:"#FA6C6C" },
        { name:"Comfort Colors White",         ischecked:1, hex:"#FFFFFF" },
        { name:"Comfort Colors Yam",           ischecked:0, hex:"#FF8C42" },
        { name:"Comfort Colors Terracotta",    ischecked:0, hex:"#C66A4C" },
        { name:"Comfort Colors Berry",         ischecked:0, hex:"#A43E64" },
        { name:"Comfort Colors Black",         ischecked:0, hex:"#000000" },
        { name:"Comfort Colors Blue Spruce",   ischecked:0, hex:"#2F4D40" },
        { name:"Comfort Colors Brick",         ischecked:0, hex:"#9C3E2E" },
        { name:"Comfort Colors Blossom",       ischecked:1, hex:"#F4C2C2" },
        { name:"Comfort Colors Boysenberry",   ischecked:0, hex:"#873260" },
        { name:"Comfort Colors Crimson",       ischecked:0, hex:"#8B1C2D" },
        { name:"Comfort Colors Crunchberry",   ischecked:0, hex:"#D96A82" },
        { name:"Comfort Colors Espresso",      ischecked:0, hex:"#3B2F2F" },
        { name:"Comfort Colors Grape",         ischecked:0, hex:"#6A3E80" },
        { name:"Comfort Colors Lagoon Blue",   ischecked:0, hex:"#0098A4" },
        { name:"Comfort Colors Moss",          ischecked:0, hex:"#8A9A5B" },
        { name:"Comfort Colors Neon Red Orange",ischecked:0,hex:"#FF533F" },
        { name:"Comfort Colors Neon Yellow",   ischecked:0, hex:"#FFFF33" },
        { name:"Comfort Colors Red",           ischecked:0, hex:"#C1272D" },
        { name:"Comfort Colors Rose",          ischecked:1, hex:"#E7A2A2" },
        { name:"Comfort Colors Sunset",        ischecked:0, hex:"#FA8072" },
        { name:"Comfort Colors Violet",        ischecked:0, hex:"#8F509D" },
        { name:"Comfort Colors Washed Denim",  ischecked:0, hex:"#4A647E" },
        { name:"Comfort Colors Wine",          ischecked:0, hex:"#722F37" },
        { name:"Comfort Colors Sage",          ischecked:0, hex:"#C3C7B4" },
        { name:"Comfort Colors Mustard",       ischecked:1, hex:"#E2BC75" },
        { name:"Blossom",                      ischecked:1, hex:"#F4C2C2" },
        { name:"Daisy",                        ischecked:1, hex:"#FFE462" },
        { name:"Dark Gray",                    ischecked:0, hex:"#A9A9A9" },
        { name:"Evergreen",                    ischecked:0, hex:"#115740" },
        { name:"Forest Green",                 ischecked:0, hex:"#214631" },
        { name:"Heather Autumn",               ischecked:1, hex:"#C48447" },
        { name:"Heather Deep Teal",            ischecked:0, hex:"#255E69" },
        { name:"Heather Galapagos Blue",       ischecked:1, hex:"#496C8D" },
        { name:"Heather Maroon",               ischecked:0, hex:"#4A1C2A" },
        { name:"Heather Peach",                ischecked:1, hex:"#FFDAB9" },
        { name:"Heather Prism Lilac",          ischecked:1, hex:"#D8B7DD" },
        { name:"Azalea",                       ischecked:1, hex:"#F78FA7" },
        { name:"Irish Green",                  ischecked:1, hex:"#009A44" },
        { name:"Light Pink",                   ischecked:1, hex:"#FFB6C1" },
        { name:"Kelly Green",                  ischecked:0, hex:"#4CBB17" },
        { name:"Light Blue",                   ischecked:1, hex:"#ADD8E6" },
        { name:"Dark Grey Heather",            ischecked:0, hex:"#555555" },
        { name:"Heather Indigo Blue",          ischecked:0, hex:"#395573" },
        { name:"White",                        ischecked:1, hex:"#FFFFFF" },
        { name:"Tan",                          ischecked:1, hex:"#D2B48C" },
        { name:"Sage Green",                   ischecked:1, hex:"#9CAF88" },
        { name:"True Royal",                   ischecked:0, hex:"#4169E1" },
        { name:"True Navy",                    ischecked:0, hex:"#223452" },
        { name:"True Royal (Royal Blue)",      ischecked:0, hex:"#4169E1" },
        { name:"Sport Grey",                   ischecked:1, hex:"#B3B5B6" },
        { name:"Navy",                         ischecked:0, hex:"#0C1E33" },
        { name:"Military Green",               ischecked:0, hex:"#545941" },
        { name:"Heather True Royal",           ischecked:0, hex:"#3A5DAE" },
        { name:"Maroon",                       ischecked:0, hex:"#800000" },
        { name:"Mauve",                        ischecked:1, hex:"#E0B0FF" },
        { name:"Natural",                      ischecked:1, hex:"#F0E7D4" },
        { name:"Orange",                       ischecked:1, hex:"#F46A1E" },
        { name:"Purple",                       ischecked:0, hex:"#4F2C82" },
        { name:"Red",                          ischecked:0, hex:"#C62536" },
        { name:"Sand",                         ischecked:1, hex:"#D8C7A0" },
        { name:"Soft Cream",                   ischecked:1, hex:"#FFFDD0" },
        { name:"Heliconia",                    ischecked:0, hex:"#E10078" },
        { name:"Black",                        ischecked:0, hex:"#000000" },
        { name:"Sapphire",                     ischecked:0, hex:"#0099CC" },
        { name:"Heather Berry",                ischecked:0, hex:"#DB689D" },
    ];
    const SHIRT_COLOR_MAP = new Map(SHIRT_COLORS_LIST.map(c => [c.name, c]));

    // ─────────────────────────────────────────────
    // SELECTORS
    // ─────────────────────────────────────────────
    const BASE = "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card.ch-n-od-tab > div > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-6.pl-1.pr-1.m-0.cus-prd-c > div > div.d-flex.flex-row.gap-3";

    const SEL = {
        selector:    "div.mud-dialog-content div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.pl-1 div.d-flex.flex-row.gap-3.w-100.mb-3.mt-4 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.card-title.mb-0.fs-3.fw-bold",
        earning:     BASE,
        price:       `${BASE}> div.mud-alert.mud-alert-text-warning.mud-dense.mud-elevation-0.mt-1 > div > div > p`,
        cost:        `${BASE}> div.mud-alert.mud-alert-text-info.mud-dense.mud-elevation-0.mt-1 > div > div > p`,
        ship:        "div > div.mud-grid-item.mud-grid-item-xs-12.mt-4 > div > div.mud-paper.mud-elevation-0.bg-primary-subtle.badge.mt-4 > p",
        ship2:       "div > div.mud-input.mud-input-text.mud-input-text-with-label.mud-input-adorned-end.mud-input-underline.mud-shrink.mud-disabled.mud-typography-input.mud-select-input > div.mud-input-slot.mud-input-root.mud-input-root-text.mud-input-root-adorned-end.mud-select-input > div > p",
        creditEl:    "#main-wrapper > div > div > div > div > div > div > div.mud-card-content.cus-main.overflow-hidden > div > div > dxbl-grid > div.dxbl-grid-toolbar-container > div > div:nth-child(1) > div > div > h3",
        balanceEl:   "#main-wrapper > div > div > div > div > div > div > div.mud-card-content.cus-main.overflow-hidden > div > div > dxbl-grid > div.dxbl-grid-toolbar-container > div > div:nth-child(3) > div > div > h3",
        salesSummary:"div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div > div > div > div > div > div:nth-child(2) > h6",
        trCut:       "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > dxbl-grid > dxbl-scroll-viewer > div > table > tbody > tr",
        imgCut:      "td.dxbl-grid-fixed-cell.dxbl-grid-last-fixed-left-cell > div > div > div:nth-child(1) > section > div.mud-carousel-swipe > div > div > div > div.mud-grid-item.mud-grid-item-xs-8.h-100.position-relative.image-menu",
        personaCut:  "td:nth-child(3) > div > div > div:nth-child(6) > div > h6 > div > b",
        shirtColorCut:"td:nth-child(3) > div > div > div:nth-child(5) > div > h6 > p",
        imgColorCut: "td.dxbl-grid-fixed-cell.dxbl-grid-last-fixed-left-cell > div > div > div",
        skuCut:      "td:nth-child(3) > div > div > div.d-flex.flex-row.gap-3.col-md-12.single-note-item.all-category.note-important > div > p > a",
        orderCut:    "td:nth-child(3) > div > div > div.d-flex.flex-row.gap-3.col-md-12.single-note-item.all-category.note-business > div > h6 > a",
        shirt:       "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.p-2.m-0.cus-prd-r.mudcard-optionsx > div > div > div.d-flex.flex-row.gap-0 > div > div:nth-child(1) > div.d-flex.flex-column.gap-0.w-100 > div.mud-tooltip-root.mud-tooltip-inline.w-100 > span > p",
        sku:         "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-6.pl-1.pr-1.m-0.cus-prd-c > div > div.mud-paper.mud-elevation-0.note-has-grid.row > div > div > p > div",
        adet:        "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-paper.mud-elevation-0.absolute.r-0.t-0.p-0.m-0.shades.transparent > div > div.mud-alert.mud-alert-text-success.mud-dense.mud-elevation-0",
        store:       "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.pt-0.relative > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.pl-1 > div > div > div.d-flex.flex-row.gap-3.w-100.mb-1.mt-4 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.text-muted.mt-0.fs-2.mud-typography-nowrap",
        mapAdress:   "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.pt-0.relative.ch-n-od-shipinfos > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-8.pl-0.pr-3.pt-2 > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-8.p-0.overflow-hidden > div.d-flex.flex-row.gap-3.w-100.mb-0.mt-3 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.text-muted.mt-0.fs-2",
        subTotalSel: "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div > div > div > div > div > div.d-flex.align-items-center.justify-content-between.mb-3.pt-2 > h6",
        popupCart:   "div.d-flex.flex-row.gap-0.cus-action-buttons.position-absolute.z-3.pl-3.ch-n-od-header.w-100 > div.mud-paper.mud-elevation-0.pt-2.shades.transparent.ch-n-od-buttons > div",
        popupOrderId:"div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.pt-0.relative.ch-n-od-shipinfos > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.pl-1.pt-2 > div > div > div.d-flex.flex-row.gap-3.w-100.mb-3.mt-4 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.card-title.mb-0.fs-3.fw-bold.link.link-primary",
    };

    // ─────────────────────────────────────────────
    // UTILS
    // ─────────────────────────────────────────────
    const getText = (sel, doc = document) => doc.querySelector(sel)?.textContent.trim() ?? null;
    const unformatNumber = (str) => parseFloat(str.replace(/[^0-9,-]+/g, ""))
    const parseNumFromEl = el => { const m = el?.textContent.match(/[\d.]+/); return m ? parseFloat(m[0]) : 0; };

    const safeClick = el => {
        if (!el) return false;
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles:true }));
        el.dispatchEvent(new MouseEvent('mouseup',   { bubbles:true }));
        el.click();
        return true;
    };

    const setInputValue = (el, val) => {
        if (!el) return;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(val));
        el.dispatchEvent(new Event('input',  { bubbles:true }));
        el.dispatchEvent(new Event('change', { bubbles:true }));
    };

    /**
     * waitFor — MutationObserver-based, no polling.
     * Returns existing element immediately if found.
     */
    function waitFor(selector, root = document, timeout = 10000) {
        const el = root.querySelector(selector);
        if (el) return Promise.resolve(el);
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => { obs.disconnect(); reject(new Error('Timeout: ' + selector)); }, timeout);
            const obs = new MutationObserver(() => {
                const found = root.querySelector(selector);
                if (!found) return;
                clearTimeout(timer);
                obs.disconnect();
                resolve(found);
            });
            obs.observe(root === document ? document.documentElement : root, { childList:true, subtree:true });
        });
    }

    function generateUniqueId() {
        return 'p-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    }

    // ─────────────────────────────────────────────
    // TOAST  (lightweight singleton container)
    // ─────────────────────────────────────────────
    let _toastContainer = null;
    function getToastContainer() {
        if (!_toastContainer) {
            _toastContainer = Object.assign(document.createElement('div'), { className:'toast-container' });
            document.body.appendChild(_toastContainer);
        }
        return _toastContainer;
    }
    function showToast(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const msg = document.createElement('span');
        msg.textContent = message;
        const close = document.createElement('button');
        close.className = 'toast-close'; close.innerHTML = '&times;';
        close.onclick = () => removeToast(toast);
        toast.append(msg, close);
        getToastContainer().appendChild(toast);
        // Force reflow for transition
        toast.getBoundingClientRect();
        toast.classList.add('show');
        if (duration > 0) setTimeout(() => removeToast(toast), duration);
        return toast;
    }
    function removeToast(toast) {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), { once:true });
    }

    window.addEventListener('autopea_done', e => {
        const { isSuccess } = e.detail;
        showToast(isSuccess ? '✅ Order Yapıldı' : '❌ Order Hata verdi', isSuccess ? 'success' : 'error');
    });

    // ─────────────────────────────────────────────
    // CONFIG DIALOG
    // ─────────────────────────────────────────────
    function initUI() {
        GM.registerMenuCommand('⚙️ Ayarları Düzenle', showConfigMenu);
        GM.registerMenuCommand('⚙️ Verileri Düzenle', createUniversalDataManager);
    }

    async function showConfigMenu() {
        const overlay = document.createElement('div');
        overlay.className = 'etsy-tool-modal-overlay';
        const fields = [
            { id:'discount',    label:'Store Discount % (25)' },
            { id:'feePerc',     label:'Fee + Marketing % (48)' },
            { id:'shipHoodie',  label:'Hoodie Kargo' },
            { id:'shipHoodie2', label:'Hoodie Kargo 2. ürün' },
            { id:'shipTee',     label:'Shirt Kargo' },
            { id:'shipTee2',    label:'Shirt Kargo 2. ürün' },
            { id:'credit',      label:'Kredi' },
        ];
        const bodyHTML = fields.map(f => `
            <div style="margin-bottom:15px">
                <label style="display:block;margin-bottom:5px;font-weight:bold">${f.label}</label>
                <input id="cfg_${f.id}" type="number" class="etsy-tool-input" value="${config[f.id] ?? ''}" style="width:100%">
            </div>`).join('');

        overlay.innerHTML = `
            <div class="etsy-tool-modal">
                <div class="etsy-tool-modal-header">
                    <h3 class="etsy-tool-modal-title">Etsy Tool Ayarları</h3>
                    <button class="etsy-tool-modal-close">&times;</button>
                </div>
                <div class="etsy-tool-modal-body">${bodyHTML}</div>
                <div class="etsy-tool-modal-footer">
                    <button class="etsy-tool-btn etsy-tool-btn-light" id="cfg_cancel">İptal</button>
                    <button class="etsy-tool-btn etsy-tool-btn-primary" id="cfg_save">Kaydet</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        const close = () => {
            overlay.classList.remove('show');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once:true });
        };
        overlay.querySelector('.etsy-tool-modal-close').onclick = close;
        overlay.querySelector('#cfg_cancel').onclick = close;
        overlay.querySelector('#cfg_save').onclick = async () => {
            fields.forEach(f => { config[f.id] = parseFloat(document.getElementById('cfg_' + f.id).value) || 0; });
            await saveConfig();
            showToast('Ayarlar kaydedildi', 'success');
            close();
        };
    }

    // ─────────────────────────────────────────────
    // EXCHANGE RATE  — session-cached + stale guard
    // ─────────────────────────────────────────────
    let _rateCache = null; // { value: number, ts: number }
    const RATE_TTL = 30 * 60 * 1000; // 30 min

    function getExchangeRate() {
        if (_rateCache && Date.now() - _rateCache.ts < RATE_TTL) {
            return Promise.resolve(_rateCache.value);
        }
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method:'GET',
                url:'https://www.tcmb.gov.tr/kurlar/today.xml',
                onload(res) {
                    if (res.status !== 200) return reject('HTTP ' + res.status);
                    const xml  = new DOMParser().parseFromString(res.responseText, 'text/xml');
                    const rate = getText('Currency[CurrencyCode="USD"] BanknoteSelling', xml);
                    if (!rate) return reject('Kur bilgisi alınamadı');
                    const value = Number(rate);
                    _rateCache = { value, ts: Date.now() };
                    resolve(value);
                },
                onerror: reject,
            });
        });
    }

    // ─────────────────────────────────────────────
    // APPROVAL PAGE — processPage
    // ─────────────────────────────────────────────
    // Blazor re-renders may keep hitting this; guard with element identity
    const _processedApprovalNodes = new WeakSet();

    async function processPage() {
        const creditEl  = document.querySelector(SEL.creditEl);
        const balanceEl = document.querySelector(SEL.balanceEl);
        if (!creditEl || !balanceEl) return;
        if (_processedApprovalNodes.has(creditEl)) return;
        _processedApprovalNodes.add(creditEl);

        try {
            const rate = await getExchangeRate();
            const addTl = (el, cls, text) => {
                let span = el.querySelector(`span.${cls}`);
                if (!span) {
                    span = Object.assign(document.createElement('span'), { className:cls });
                    span.style.marginLeft = '0.5em';
                    el.appendChild(span);
                }
                span.textContent = text;
            };
            const credit  = unformatNumber(creditEl.textContent);
            const balance = unformatNumber(balanceEl.textContent);
            const extra   = config.credit || 0;
            console.log(credit,balance,extra,rate);
            addTl(creditEl,  'tl-info', ` (${Math.round(credit * rate)} ₺)`);
            addTl(balanceEl, 'tl-info', ` (${Math.round(balance * rate)} ₺)\n  (${Math.round(balance + extra)} $) (${Math.round((balance + extra) * rate)} ₺)`);
        } catch (err) {
            console.error('[processPage] kur hatası:', err);
        }
    }

    // ─────────────────────────────────────────────
    // EARNING CONTENT
    // ─────────────────────────────────────────────
    function insertEarningContent(earningNode, costVal, priceVal, shirtText, quantity, miktar, shipVal, skuText) {
        if (earningNode.dataset.contentInserted) return;
        earningNode.dataset.contentInserted = 'true';

        const RemDiscount = (100 - config.discount) / 100;
        const RemFeePerc  = (100 - config.feePerc)  / 100;
        const afterDiscount = priceVal * RemDiscount;
        const afterFee      = afterDiscount * RemFeePerc;
        const remaining     = afterFee - costVal;
        const isHoodie      = shirtText.includes('Hoodie');
        const shipCross     = isHoodie
            ? (config.shipHoodie  + config.shipHoodie2 * (quantity - 1)) / quantity
            : (config.shipTee     + config.shipTee2    * (quantity - 1)) / quantity;
        const shipTotal = shipVal ? (shipCross - shipVal / quantity) : 0;
        const net       = (remaining + shipTotal) * miktar;

        const div = document.createElement('div');
        div.className = 'mud-alert mud-alert-text-primary mud-dense mud-elevation-0 mt-1';
        div.style.cursor = 'pointer';
        div.innerHTML = `<div class="mud-alert-position justify-sm-start"><div class="mud-alert-message">
            <p class="mud-typography mud-typography-body2"
               title="%${config.discount} indirim (${afterDiscount.toFixed(2)}). %${config.feePerc} (${quantity} adet)(${miktar} miktar) fee+ads (${afterFee.toFixed(2)}) Kargo+(${shipCross.toFixed(2)}): ${shipTotal.toFixed(2)} Kalan=${remaining.toFixed(2)}">
               NET(K:+${shipTotal.toFixed(2)}): $${net.toFixed(2)}</p>
        </div></div>`;
        earningNode.appendChild(div);

        if (skuText && !earningNode.parentNode.querySelector('.copy-icon')) {
            const btn = document.createElement('button');
            btn.textContent = 'Kopyala';
            btn.className = 'copy-icon';
            btn.onclick = e => navigator.clipboard.writeText(skuText).then(() => { e.target.style.backgroundColor = 'red'; });
            earningNode.parentNode.insertBefore(btn, earningNode.nextSibling);
        }
    }

    // Batched via rAF — coalesces rapid Blazor re-renders into a single paint
    let _earningRafPending = false;
    function checkAndInsertEarningContent() {
        if (_earningRafPending) return;
        _earningRafPending = true;
        requestAnimationFrame(() => {
            _earningRafPending = false;
            const earningNodes = document.querySelectorAll(SEL.earning);
            if (!earningNodes.length) return;

            const costNodes  = document.querySelectorAll(SEL.cost);
            const priceNodes = document.querySelectorAll(SEL.price);
            const shirtNodes = document.querySelectorAll(SEL.shirt);
            const skuNodes   = document.querySelectorAll(SEL.sku);
            const adetNode   = document.querySelector(SEL.adet);
            const shipNode   = document.querySelector(SEL.ship);
            const ship2Node  = document.querySelector(SEL.ship2);

            const shipVal  = parseNumFromEl(shipNode) || parseNumFromEl(ship2Node);
            const quantity = parseInt(adetNode?.textContent.match(/\d+/)?.[0] ?? '1', 10);

            earningNodes.forEach((node, i) => {
                insertEarningContent(
                    node,
                    parseNumFromEl(costNodes[i]),
                    parseNumFromEl(priceNodes[i]),
                    shirtNodes[i]?.textContent.trim() ?? '',
                    quantity,
                    parseNumFromEl(earningNodes[i]) || 1,
                    shipVal,
                    skuNodes[i]?.textContent.trim() ?? ''
                );
            });
        });
    }

    // ─────────────────────────────────────────────
    // ORDER NODE (popup / detail)
    // ─────────────────────────────────────────────
    function convertNode(pNode) {
        if (pNode.dataset.processed) return;
        pNode.dataset.processed = 'true';
        pNode.classList.add('link', 'link-primary');
        pNode.style.cursor = 'pointer';

        pNode.addEventListener('click', () => {
            const storeText = getText(SEL.store);
            if (!storeText) return;
            const orderId = pNode.textContent.replace('#', '');
            if (!storeText.includes('Hand') || orderId.includes('_')) {
                navigator.clipboard.writeText(orderId).then(() => showToast('orderId kopyalandı: ' + orderId));
                return;
            }
            window.open(`https://www.etsy.com/your/orders/sold/new?order_id=${orderId}&search_query=${orderId}&expand_convo=true`, '_blank');
        });

        const mapAdressNode = document.querySelector(SEL.mapAdress);
        if (!mapAdressNode || mapAdressNode.querySelector('.map-btn')) return;

        const mapBtn = document.createElement('button');
        mapBtn.className = 'map-btn';
        mapBtn.style.marginLeft = '0.5em';
        mapBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" aria-label="Google Maps" viewBox="0 0 512 512" width="24" height="24"><rect width="512" height="512" rx="15%" fill="#fff"/><clipPath id="a"><path d="M375 136a133 133 0 00-79-66 136 136 0 00-40-6 133 133 0 00-103 48 133 133 0 00-31 86c0 38 13 64 13 64 15 32 42 61 61 86a399 399 0 0130 45 222 222 0 0117 42c3 10 6 13 13 13s11-5 13-13a228 228 0 0116-41 472 472 0 0145-63c5-6 32-39 45-64 0 0 15-29 15-68 0-37-15-63-15-63z"/></clipPath><g stroke-width="130" clip-path="url(#a)"><path stroke="#fbbc04" d="M104 379l152-181"/><path stroke="#4285f4" d="M256 198L378 53"/><path stroke="#34a853" d="M189 459l243-290"/><path stroke="#1a73e8" d="M255 120l-79-67"/><path stroke="#ea4335" d="M76 232l91-109"/></g><circle cx="256" cy="198" r="51" fill="#fff"/></svg>`;
        mapAdressNode.appendChild(mapBtn);
        mapBtn.addEventListener('click', () => {
            const clone = mapAdressNode.cloneNode(true);
            clone.querySelector('button')?.remove();
            window.open(`https://www.google.com/maps/place/${encodeURIComponent(clone.textContent.trim())}`, '_blank');
        });
    }

    // ─────────────────────────────────────────────
    // CUT (table rows in batch dialog)
    // ─────────────────────────────────────────────

    // Cached localStorage sets — avoid JSON.parse per row
    const _localCache = {
        _data: {},
        get(key) {
            if (!this._data[key]) {
                try { this._data[key] = new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
                catch { this._data[key] = new Set(); }
            }
            return this._data[key];
        },
        add(key, value) {
            const set = this.get(key);
            if (set.has(value)) return;
            set.add(value);
            localStorage.setItem(key, JSON.stringify([...set]));
        },
        remove(key) {
            this._data[key] = new Set();
            localStorage.removeItem(key);
        },
    };

    // Per-row upload observer registry — disconnect on use (no leak)
    const _imgObservers = new WeakMap();

    function convertCutNode() {
        document.querySelectorAll(SEL.trCut).forEach(sNode => {
            if (sNode.dataset.contentInserted) return;
            sNode.dataset.contentInserted = 'true';

            // --- Upload button: use a single row-scoped observer, disconnect when found ---
            if (!_imgObservers.has(sNode)) {
                const obs = new MutationObserver(() => _tryAttachUploadBtn(sNode, obs));
                obs.observe(sNode, { childList:true, subtree:true });
                _imgObservers.set(sNode, obs);
                // Trigger immediately in case already rendered
                _tryAttachUploadBtn(sNode, obs);
            }

            // Order buttons
            const orderEl = sNode.querySelector(SEL.orderCut);
            if (orderEl) _addOrderButtons(sNode, orderEl, orderEl.textContent.trim());

            // SKU buttons
            const skuEl = sNode.querySelector(SEL.skuCut);
            if (skuEl) _addSkuButtons(sNode, skuEl);

            // Proof + hex
            const newColor = reapplyProofLogic(sNode);
            if (newColor) makeHexBox(newColor, sNode.querySelector(SEL.skuCut));

            // Slider listeners
            initSliderListeners(sNode);

            // Persona card
            const personaText = getText(SEL.personaCut, sNode);
            if (skuEl && personaText) _addPersonaCard(sNode, skuEl.textContent.trim(), personaText);
        });
    }

    function _tryAttachUploadBtn(sNode, obs) {
        const menu = sNode.querySelector(SEL.imgCut);
        if (!menu) return;
        const aEl    = menu.querySelector('div > div > div:nth-child(3)');
        const imgUrl = aEl?.querySelector('a')?.href;
        if (!aEl || !imgUrl) return;

        obs.disconnect();
        _imgObservers.delete(sNode);

        if (aEl.parentNode.querySelector('.upload-div')) return;

        const div = document.createElement('div');
        div.className = 'mud-tooltip-root mud-tooltip-inline upload-div';
        const btn = document.createElement('button');
        btn.innerHTML = `<svg class="svg-icon" style="width:1em;height:1em;vertical-align:middle;fill:currentColor;overflow:hidden;" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M653.6 629L517.8 473.2c-1.6-1.6-4.1-1.6-5.7 0L376.4 629l-0.4 0.4c-1.6 2.1 0.1 5.2 2.8 5.2H495v288.7c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V634.6h116.1c2.7 0 4.5-3.1 2.8-5.2-0.1-0.2-0.2-0.3-0.3-0.4z" fill="#5ABE64"/><path d="M907.5 434c-36-42.8-84.9-72.9-138.9-85.8-11-56.4-40.5-107.9-84.1-146.2-47.6-41.8-108.8-64.8-172.2-64.8-63.6 0-124.9 23.2-172.6 65.2-43.7 38.6-73.2 90.4-84 147.2-52.6 13.9-100.2 44.3-135 86.6-38.4 46.6-59.5 105.5-59.5 166 0 69.8 27.2 135.4 76.5 184.7 35.5 35.5 79.4 59.5 127.2 70.2 12.4 2.8 24.2-6.7 24.2-19.5v-0.2c0-9.4-6.6-17.4-15.7-19.5-98.5-22.3-172.3-110.6-172.3-215.7 0-104.4 74.1-195.5 176.2-216.6l13.9-2.9 1.9-14.1C307.7 259.4 402 177.1 512.3 177.1c109.8 0 204 81.9 219 190.5l2 14.3 14.2 2.6c105.1 19.1 181.3 110.6 181.3 217.6 0 106.3-75.4 195.3-175.5 216.4-9.3 2-16 10.1-16 19.5v0.2c0 12.6 11.6 22.1 24 19.5 49.3-10.2 94.6-34.6 131-71 49.3-49.3 76.5-114.9 76.5-184.7 0.1-61.3-21.8-121-61.3-168z" fill="#5ABE64"/></svg>`;
        btn.className = 'mud-button-root mud-icon-button mud-secondary-text hover:mud-secondary-hover mud-ripple mud-ripple-icon';
        div.appendChild(btn);
        aEl.parentNode.insertBefore(div, aEl);

        btn.addEventListener('click', async () => {
            try {
                const res = await fetch(imgUrl);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                await uploadGeneratedImage(await res.blob(), '12345', 'uploaded-image', sNode);
            } catch (err) { console.error('Upload error:', err); }
        });
    }

    function _addOrderButtons(sNode, orderEl, order) {
        if (orderEl.parentNode.querySelector('.copy-icon')) return; // idempotent guard

        const td = orderEl.closest('td');

        // Apply saved highlight classes
        if (td) {
            if (_localCache.get('orderNumbers').has(order))      td.classList.add('toast-success');
            if (_localCache.get('orderNumbersWait').has(order))  td.classList.add('toast-warning');
            if (_localCache.get('orderNumbersDelay').has(order)) td.classList.add('toast-info');
            if (_localCache.get('orderImg').has(order))          td.classList.add('toast-error');
        }

        const mk = (label, cls, onClick) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.className = cls;
            btn.style.marginLeft = '10px';
            btn.addEventListener('click', onClick);
            return btn;
        };

        const copyBtn = mk('Copy', 'copy-icon', e => {
            navigator.clipboard.writeText(order).then(() => { e.target.style.backgroundColor = 'aqua'; });
        });
        const appBtn = mk('Gönder', 'approve-icon', e => {
            _localCache.add('orderNumbers', order);
            td?.classList.add('toast-success');
            e.target.style.backgroundColor = 'green';
        });
        const waitBtn = mk('Beklet', 'wait-icon', e => {
            _localCache.add('orderNumbersWait', order);
            td?.classList.add('toast-warning');
            e.target.style.backgroundColor = 'olive';
        });
        const delBtn = mk('Ertele', 'wait-icon', e => {
            _localCache.add('orderNumbersDelay', order);
            td?.classList.add('toast-info');
            e.target.style.backgroundColor = 'blue';
        });

        const imgBtn = mk('OrderImg', 'wait-icon', async e => {
            if (_localCache.get('orderImg').has(order)) { imgBtn.style.backgroundColor = 'pink'; return; }
            imgBtn.style.backgroundColor = 'orange';
            try {
                const link = await getLinkById(order);
                if (link) {
                    window.open(link, '_blank');
                    _localCache.add('orderImg', order);
                    td?.classList.add('toast-info');
                    imgBtn.style.backgroundColor = 'pink';
                } else {
                    imgBtn.style.backgroundColor = 'red';
                }
            } catch { imgBtn.style.backgroundColor = 'red'; }
        });
        if (_localCache.get('orderImg').has(order)) imgBtn.style.backgroundColor = 'pink';

        orderEl.parentNode.append(copyBtn, appBtn, waitBtn, delBtn, imgBtn);
    }

    async function _addSkuButtons(sNode, skuEl) {
        if (skuEl.parentNode.querySelector('.copy-icon')) return; // idempotent

        const skuNo = skuEl.textContent.trim();

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Kopyala';
        copyBtn.style.marginLeft = '10px';
        copyBtn.className = 'copy-icon';
        copyBtn.onclick = e => navigator.clipboard.writeText(skuNo).then(() => { e.target.style.backgroundColor = 'aqua'; });
        skuEl.parentNode.appendChild(copyBtn);

        if (!skuNo.includes('X')) {
            // GDrive only
            skuEl.parentNode.appendChild(_makeGDriveLink(skuNo));
            return;
        }

        const settings = await getSkuSettings(skuNo);
        const id = settings?.driveId;

        const arbUrl  = `https://arb.tavsiyerobotu.com/editor/${skuNo}`;
        const arbLink = document.createElement('a');
        arbLink.href = arbUrl; arbLink.target = '_blank'; arbLink.className = 'folder3';
        arbLink.innerHTML = `<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAcFBQYFBAcGBQYIBwcIChELCgkJChUPEAwRGBUaGRgVGBcbHichGx0lHRcYIi4iJSgpKywrGiAvMy8qMicqKyr/2wBDAQcICAoJChQLCxQqHBgcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKir/wAARCAAfACADASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAABQYHBAL/xAArEAACAQMDAgUDBQAAAAAAAAABAgMEBQYAETESIRMiQVFhFBVxFiNTsfD/xAAXAQADAQAAAAAAAAAAAAAAAAACAwUB/8QAHBEAAgIDAQEAAAAAAAAAAAAAAQIDEQAEITET/9oADAMBAAIRAxEAPwCS5dl10zK/T3K7VLyF3PhRFvJEvoqjgdtAta7V3vFHv/Mn9jVUqa66y5l9rNuSe0sB1u8O4AK7nzcc6uwa4kW7roHl5B2NkxNVXwn2vMkGi2OZLdcVvENyslW9PPE2+wPlceoYcEaPriNuqKq7VklTKlvpZzGi0yeI59/fsN9K11hoqe4PHa6h6imABWSReluO4I+DpckDILbGRzq7UucW+VILnTSyt0okqsx9gDplynMKypu86We5y/QsqhfD3T0G/oDzvrJnWHVuD5TUWmuKuqnqhkVgRJGeD8Hb30uaxJmVCqnhwngVnDMOjGzEauloYWm/UDW2cyfuQtCZEkUcH88/Oh+X3ChueRzVNsUeCVUFgvT1sOW2/wBxoHo3iWLV+ZZHT2e19AmmPd5G2VFHLH8D0GiacmL51wYK64Ev0vpz/9k=" style="width:24px;height:24px;margin-left:10px" alt="ARB">`;
        skuEl.parentNode.appendChild(arbLink);

        if (!id) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:inline-block;margin-left:10px';
            const input = document.createElement('input');
            input.type = 'text'; input.placeholder = 'Enter ID';
            input.className = 'mud-input-slot mud-input-root mud-input-root-text mud-input-root-adorned-end mud-input-root-margin-normal';
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Kaydet';
            saveBtn.className = 'mud-button mud-button-filled mud-button-filled-primary mud-button-filled-size-small';
            saveBtn.onclick = async () => { const v = input.value.trim(); if (v) await setSkuSettings(skuNo, v); };
            wrap.append(input, saveBtn);
            skuEl.parentNode.appendChild(wrap);
        } else {
            const userId = await GM.getValue('userId', 0);
            const ppUrl  = `https://www.photopea.com/?state={"ids":["${id}"],"action":"open","userId":"${userId}","resourceKeys":{}}`;
            const ppLink = document.createElement('a');
            ppLink.href = ppUrl; ppLink.target = '_blank'; ppLink.className = 'folder2';
            ppLink.innerHTML = `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAYNQTFRFAAAAGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSX0Onc4AAAAIF0Uk5TACOp//6hHHD791xB/Si0kfT23sbc09d8MAVFmvnv62UCGsrxuA8L8pIBFzg/Bxue6eVmXvDjDgqwmNVgyX/W9ZSD2z16Sp0TvCErioE7De4uzybnJG1jsfrLTMOGnLOMWRhUVuzRp4litYhOefy2V4Jdx7qH87uEvTa/KmnASYDOCtc5cgAAAgxJREFUeJx9k21IFHEQxp8H8+S4tEwiLkU8KKEs4SrsRSXksKTsiDxTKpEQLOqD0gtSSH1QVKIQBZUoRaIXtMgLMbUiQkwpISTBPhRlgSRCcPgSkWjN3q67a+05H/Y/O8+PmfnP7BIgCUsT4TeICM5Z62I2/qTjV0hZzE5GzS4HYCVXTy8JREnhGVPNNQwzqTHkhBxOgb5rofUmIJYcW/Rd/Ko6CQbg4kdTssQfgeC5QQc28kPw3Cz5R+RMDowvyeCIVfSkFYqYzHfibx9W4m4N2Ma3wE4OaelSBuWx540pw67XwNZVg3oLcdJj+oABpH6T/sMXxEsj54Tb+xLwvDJKZLwAMiUGD3uBrOfAvm7Y5g1g/1O1ZFaX8pbdDRzohLdLL5H9BDjcCXg7FP0I/XKf9/B16EDMJJD7GMhpB7Yk8SFw9AFwrE0vkX8POCGhQ34kOvslwAjZccF9fZLH7wCFd4G1E/A+k1Xafa3Ayc/9egnHFHCwR6AWoIhsX1A+geJmY5IKcOo24GsztnX6lmmbxU3AmZtKtEGTN3nYaALO1muAM6cuGI60BWD+HlyfNADYvWNy3bC7/s9iJbWH0hvAhVpY2bkgcP6aOoeQQKZcsey6JeBm/PiyQDTzHgEXa2TjfZZACi/NNKKsSt3x/2YvIcqrcbkiBJDmapU//8qYX0Z9tfJfleVfhkbxF6QJhTmGsYn9AAAAAElFTkSuQmCC" style="width:24px;height:24px;margin-left:10px" alt="Photopea">`;
            ppLink.addEventListener('click', e => { e.preventDefault(); navigator.clipboard.writeText(ppUrl).then(() => window.open(ppUrl)); });
            skuEl.parentNode.appendChild(ppLink);
        }

        skuEl.parentNode.appendChild(_makeGDriveLink(skuNo));
    }

    function _makeGDriveLink(skuNo) {
        const a = document.createElement('a');
        a.href = `https://drive.google.com/drive/search?q=${encodeURIComponent(skuNo)}`;
        a.target = '_blank'; a.className = 'gdrive-icon2';
        a.innerHTML = `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAB+klEQVR4AWJwL/ChKx68ForXW7SJN1iswYb5GyxaqGqhycrgR+rTAKzUA2hoURwG8Cn3bL/wbNuIz7Y5p9kOY57NMBvZs23bPtt/dW7b4VR94ep3v6OHaJvFJSoaZldQROB+hDJValcFPBj20vB82AsEAYCVyTT1uUykaWitGAQIB1oy22WoKOhKQMCCMKa0dLypYN9dTs7HcMvg5YCAHQKAzLmwpwpYGbORBHH2LAfMY4G4JdmOaJkvBQnsMQ+DHAl5MTSeqjaMASaarvZ00SB8UATCyp1OVzMWgfBDiwLhY7J2+Nn5LScyVCkUfkoI3nLqWivAcB7j52HYSISMEJz9WIwEyyE/AAtEBJLbRLoNiBxigIcVgDO08AwFwnkpwfx4Sx1aSFrmLwAvRDz+BBtaFB6Gg9txA9sEg6d9NLNO+/5HvFz0sXXardmy567d4CFW4F5V1BuXiUgVNBa5jpdEBdz2vTRy2/cyxMtduyFpTjtMotobD1D75Yvs3LjopYDwh9v/5CNWrtsOSjGc/8bFqP/mHtRx7zyVodP7tisgZMeffB8SO6xfLYeIlllvTSkM2jH34UraQeB5VkvexoeWWsttR7bEaPu9Cz95IEZbAVw8wm461+7uuXrp4Q0L6LxxS/NKQQ+t2HpYKEKQPMhXkpkNqoYwXTEA+kphQitc/vYAAAAASUVORK5CYII=" style="width:24px;height:24px;margin-left:10px" alt="GDrive">`;
        return a;
    }

    async function _addPersonaCard(sNode, sku, personaRaw) {
        const targetCell = sNode.querySelector('td:nth-child(3) > div');
        if (!targetCell || targetCell.querySelector('.persona-card-root')) return;

        const SkuSettings = await getSkuSettings(sku);
        const inputValue  = personaRaw
            .replace('Personalization', '').replaceAll(':', '')
            .replace(/NUMBER/i, '').replace(/NAME/i, '')
            .replaceAll('\n', ' | ').trim().toUpperCase();
        const noteId  = generateUniqueId();
        const btnFont = SkuSettings?.fontName  ? 'warning' : '';
        const btnImag = SkuSettings?.imageSet  ? 'warning' : '';

        const makeCard = (label, inputId, btnId, btnStyl, btnTitle, type) => {
            const extra = type === 'font' ? `
                <button class="mud-button mud-button-outlined mud-button-outlined-primary mud-button-outlined-size-small" id="color-btn-${noteId}">🎨 Renk Seç</button>
                <select id="font-select-${noteId}" class="mud-select mud-select-size-small"><option value="">Font Seç</option></select>
                <input type="hidden" id="selected-color-${noteId}">
                <input type="hidden" id="selected-font-${noteId}">
                <div id="color-modal-${noteId}" class="color-modal" style="display:none;bottom:0;position:absolute;background:#fff;border:1px solid #ccc;padding:10px;z-index:999;">
                    <table id="color-table-${noteId}"></table>
                </div>` : `
                <select id="charset-select-${noteId}" class="mud-select mud-select-size-small"><option value="">Charset Seç</option></select>
                <input type="hidden" id="selected-charset-${noteId}">`;
            return `<div class="card card-body py-0 mb-0 p-1 shadow-none mt-0">
                <span class="side-stick"></span>
                <p class="note-date fs-1 mb-0">${label}</p>
                <div class="personalization-input mb-1">
                    <input type="text" class="mud-input-slot mud-input-root mud-input-root-text mud-input-root-adorned-end mud-input-root-margin-normal"
                           id="${inputId}" value="${inputValue}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                </div>
                <div class="generation-controls">
                    <div class="d-flex gap-1 align-items-center">
                        <button title="${btnTitle}" class="mud-button mud-button-filled mud-button-filled-${btnStyl} mud-button-filled-size-small" id="${btnId}">Oluştur ve Yükle</button>
                        ${extra}
                    </div>
                    <div class="status-message mt-1" id="status-${btnId}"></div>
                </div>
            </div>`;
        };

        const wrapper = document.createElement('div');
        wrapper.className = 'persona-card-root';
        wrapper.setAttribute('role', 'group');
        wrapper.className += ' d-flex flex-row gap-3 col-md-12 single-note-item all-category note-social';
        wrapper.id = noteId;
        wrapper.innerHTML =
            makeCard('Dizayn oluştur Font ile',  `pi1-${noteId}`, `gb1-${noteId}`, btnFont, SkuSettings?.fontName  ?? '', 'font') +
            makeCard('Dizayn oluştur Resim ile', `pi2-${noteId}`, `gb2-${noteId}`, btnImag, SkuSettings?.imageSet ?? '', 'image');
        targetCell.appendChild(wrapper);

        // Color palette
        const COLORS = {
            black:'#000000',white:'#ffffff',red:'#ac110d',royal:'#00237d',columbia:'#74cae3',
            navy:'#192145',sky_blue:'#0397d5',purple:'#6c35aa',neon_orange:'#f3541c',grey:'#646263',
            maroon:'#650d0a',orange:'#ee7a3f',yellow:'#f1ea33',vegas:'#c4b454',gold:'#d3af37',
            teal:'#008081',sand:'#c3ae81',neon_pink:'#ee398d',green:'#008000',neon_green:'#4fb848',
            silver:'#c0c0c0',brown:'#964b00',magenta:'#ff00fe',pink:'#ffbfcd',burgundy:'#811930',
            kelly_green:'#4CBB17',blue:'#0000ff',forest_green:'#00452a',
        };
        const colorBtn    = document.getElementById(`color-btn-${noteId}`);
        const colorModal  = document.getElementById(`color-modal-${noteId}`);
        const colorTable  = document.getElementById(`color-table-${noteId}`);
        const hiddenColor = document.getElementById(`selected-color-${noteId}`);

        if (colorBtn) {
            colorBtn.addEventListener('click', () => {
                colorModal.style.display = colorModal.style.display === 'none' ? 'block' : 'none';
            });
            const frag = document.createDocumentFragment();
            Object.entries(COLORS).forEach(([name, hex]) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="background:${hex};width:30px;height:30px"></td><td>${name}</td>`;
                tr.addEventListener('click', () => {
                    hiddenColor.value = hex;
                    colorModal.style.display = 'none';
                    colorBtn.textContent = `🎨 ${name}`;
                });
                frag.appendChild(tr);
            });
            const customTr = document.createElement('tr');
            const customTd = document.createElement('td'); customTd.colSpan = 2;
            const hexInput = Object.assign(document.createElement('input'), { type:'text', placeholder:'#rrggbb', style:'width:80px' });
            const okBtn    = document.createElement('button');
            okBtn.textContent = 'OK';
            okBtn.addEventListener('click', () => {
                const h = hexInput.value.trim();
                if (/^#[0-9A-Fa-f]{6}$/.test(h)) { hiddenColor.value = h; colorModal.style.display = 'none'; colorBtn.textContent = `🎨 Custom (${h})`; }
                else alert('Geçerli HEX girin (örn: #ff00aa)');
            });
            customTd.append(hexInput, okBtn);
            customTr.appendChild(customTd);
            frag.appendChild(customTr);
            colorTable.appendChild(frag);
        }

        // Dropdowns
        const fontSelect    = document.getElementById(`font-select-${noteId}`);
        const hiddenFont    = document.getElementById(`selected-font-${noteId}`);
        const charSelect    = document.getElementById(`charset-select-${noteId}`);
        const hiddenCharset = document.getElementById(`selected-charset-${noteId}`);

        const allKeys = await GM.listValues();
        if (fontSelect) {
            allKeys.filter(k => k.startsWith('font_')).forEach(k => {
                fontSelect.appendChild(Object.assign(document.createElement('option'), { value:k.slice(5), textContent:k.slice(5) }));
            });
            fontSelect.addEventListener('change', () => { hiddenFont.value = fontSelect.value; });
        }
        if (charSelect) {
            allKeys.filter(k => k.startsWith('charset_')).forEach(k => {
                charSelect.appendChild(Object.assign(document.createElement('option'), { value:k.slice(8), textContent:k.slice(8) }));
            });
            charSelect.addEventListener('change', () => { hiddenCharset.value = charSelect.value; });
        }

        // Generate handlers
        const handleGen = (inputId, btnId, genFn) => {
            document.getElementById(btnId)?.addEventListener('click', async () => {
                const text   = document.getElementById(inputId)?.value.trim();
                const status = document.getElementById(`status-${btnId}`);
                const setS   = (msg, cls) => { if (status) { status.textContent = msg; status.className = `status-message mt-1 ${cls}`; } };
                if (!text) { setS('Metin girin', 'text-error'); return; }
                setS('Oluşturuluyor…', 'text-info');
                try {
                    const settings = await getSkuSettings(sku);
                    if (!settings) throw new Error(`SKU bulunamadı: ${sku}`);
                    const blob = await genFn(sku, text);
                    await uploadGeneratedImage(blob, sku, text, sNode);
                    setS('Başarılı!', 'text-success');
                    setTimeout(() => setS('', ''), 3000);
                } catch (err) {
                    console.error(err);
                    setS(`Hata: ${err.message}`, 'text-error');
                }
            });
        };

        handleGen(`pi1-${noteId}`, `gb1-${noteId}`, (sku, text) =>
            generateImageWithSKUSettings(sku, text,
                document.getElementById(`selected-color-${noteId}`)?.value,
                document.getElementById(`selected-font-${noteId}`)?.value));

        handleGen(`pi2-${noteId}`, `gb2-${noteId}`, (sku, text) =>
            generateImageWithCharacterImages(sku, text,
                document.getElementById(`selected-charset-${noteId}`)?.value));
    }

    // ─────────────────────────────────────────────
    // SALES SUMMARY
    // ─────────────────────────────────────────────
    function convertSalNode(salNode) {
        if (!salNode || salNode.dataset.contentInserted) return;
        salNode.dataset.contentInserted = 'true';
        const subTotal = unformatNumber(getText(SEL.subTotalSel));
        const discount = unformatNumber(salNode.textContent);
        if (subTotal) {
            const span = document.createElement('span');
            span.textContent = `% ${(discount * 100 / subTotal).toFixed(2)}`;
            salNode.parentNode.appendChild(span);
        }
    }

    // ─────────────────────────────────────────────
    // POPUP CART BUTTONS
    // ─────────────────────────────────────────────
    async function convertpopNode(popNode) {
        if (!popNode || popNode.dataset.contentInserted) return;
        popNode.dataset.contentInserted = 'true';

        // Find order ID within the closest dialog scope
        const scope = popNode.closest('.mud-dialog, .mud-focus-trap-child-container, .mud-focus-trap') || document;
        let orderIdNode;
        try { orderIdNode = await waitFor(SEL.popupOrderId, scope); }
        catch { return; }

        const orderId = orderIdNode.textContent.replace('#', '').trim();
        if (!orderId) return;

        const mkBtn = label => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'mud-button-root mud-button mud-button-outlined mud-button-outlined-default mud-button-outlined-size-medium mud-ripple mx-1 menu-buttons';
            const p = Object.assign(document.createElement('p'), { className:'mud-typography mud-typography-subtitle2', textContent:label });
            p.style.fontSize = 'x-small';
            btn.appendChild(p);
            return btn;
        };

        const gonderBtn = mkBtn('Gönder');
        gonderBtn.addEventListener('click', e => {
            e.stopPropagation(); e.preventDefault();
            _localCache.add('orderNumbers', orderId);
            e.currentTarget.style.backgroundColor = 'green';
        });
        const bekletBtn = mkBtn('Beklet');
        bekletBtn.addEventListener('click', e => {
            e.stopPropagation(); e.preventDefault();
            _localCache.add('orderNumbersWait', orderId);
            e.currentTarget.style.backgroundColor = 'olive';
        });
        popNode.append(gonderBtn, bekletBtn);
    }

    // ─────────────────────────────────────────────
    // APPROVE BUTTONS (top bar)
    // ─────────────────────────────────────────────
    function checkCheckboxesFromLocalStorage(key) {
        const saved = _localCache.get(key);
        document.querySelectorAll('tr').forEach(tr => {
            const linkText = tr.querySelector('td a')?.textContent.trim();
            if (!linkText || !saved.has(linkText)) return;
            const cb = tr.querySelector('input[type="checkbox"]');
            if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles:true })); }
            const dx = tr.querySelector('dxbl-check');
            if (dx) { dx.setAttribute('check-state', '1'); dx.dispatchEvent(new Event('click', { bubbles:true })); }
        });
    }

    function createApproveButton(container) {
        if (container.querySelector('.approve-bar-btn')) return; // idempotent

        const mk = (label, onClick) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.className = 'mud-button-root mud-button mud-button-text mud-button-text-default mud-button-text-size-medium mud-ripple approve-bar-btn';
            btn.style.cssText = 'padding:3px 10px;font-size:11px;border-right:1px solid #e0e0e0;border-radius:0;margin-right:8px;';
            btn.addEventListener('click', onClick);
            return btn;
        };

        const btnApp       = mk('App',       () => { checkCheckboxesFromLocalStorage('orderNumbers');     btnApp.style.backgroundColor  = 'green'; });
        const btnWait      = mk('Wait',      () => { checkCheckboxesFromLocalStorage('orderNumbersWait'); btnWait.style.backgroundColor = 'olive'; });
        const btnClearApp  = mk('ClearApp',  () => { _localCache.remove('orderNumbers');     btnClearApp.style.backgroundColor  = 'red'; btnApp.style.backgroundColor  = ''; });
        const btnClearWait = mk('ClearWait', () => { _localCache.remove('orderNumbersWait'); btnClearWait.style.backgroundColor = 'red'; btnWait.style.backgroundColor = ''; });

        [btnApp, btnWait, btnClearApp, btnClearWait].forEach(b => container.insertBefore(b, container.firstChild));
    }

    // shift+click multi-select — delegate to tbody for performance
    let _shiftLastRow = null;
    function checkCheckboxes() {
        if (document.body.dataset.shiftListenerAttached) return;
        document.body.dataset.shiftListenerAttached = 'true';

        document.body.addEventListener('click', e => {
            const target = e.target;
            if (!target.matches('input[type="checkbox"], dxbl-check')) return;
            const tr = target.closest('tr');
            if (!tr) return;

            if (e.shiftKey && _shiftLastRow && _shiftLastRow !== tr) {
                const rows = [...document.querySelectorAll('tr')];
                const a = rows.indexOf(_shiftLastRow), b = rows.indexOf(tr);
                const [lo, hi] = a < b ? [a, b] : [b, a];
                for (let i = lo; i <= hi; i++) {
                    const inp = rows[i].querySelector('input[type="checkbox"]');
                    if (inp) { inp.checked = true; inp.dispatchEvent(new Event('change', { bubbles:true })); }
                    const dx = rows[i].querySelector('dxbl-check');
                    if (dx) { dx.setAttribute('check-state', '1'); dx.dispatchEvent(new Event('click', { bubbles:true })); }
                }
            }
            _shiftLastRow = tr;
        }, true);
    }

    // ─────────────────────────────────────────────
    // HEX BOX
    // ─────────────────────────────────────────────
    function makeHexBox(hex, container) {
        if (!container) return;
        if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return;
        if (!hex.startsWith('#')) hex = '#' + hex;
        const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
        const light = 0.2126 * r + 0.7152 * g + 0.0722 * b > 150;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = 'Tıklayınca kopyalar';
        btn.setAttribute('aria-label', `Renk ${hex} kopyala`);
        Object.assign(btn.style, {
            backgroundColor: hex, border:'1px solid rgba(0,0,0,.15)', borderRadius:'6px',
            minWidth:'24px', height:'24px', display:'inline-flex', cursor:'pointer',
            outline:'none', margin:'0 4px', userSelect:'none', color: light ? '#111' : '#fff',
        });
        btn.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(hex); }
            catch { const t = Object.assign(document.createElement('textarea'), { value:hex }); document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
            btn.style.transition = 'transform .08s ease';
            btn.style.transform  = 'scale(0.98)';
            setTimeout(() => { btn.style.transform = 'scale(1)'; }, 650);
        });
        container.parentNode?.appendChild(btn);
        return btn;
    }

    // ─────────────────────────────────────────────
    // PROOF / SLIDER
    // ─────────────────────────────────────────────
    function addProofButton(imgUrl, bgColor, aElement) {
        if (!aElement || aElement.parentNode.querySelector('.proof-div')) return;
        const div = document.createElement('div');
        div.className = 'mud-tooltip-root mud-tooltip-inline proof-div';
        const btn = document.createElement('button');
        btn.innerHTML = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><defs><image width="14" height="13" id="img1" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAANCAMAAACuAq9NAAAAAXNSR0IB2cksfwAAAPZQTFRFSXieXIufZpWgYpGfTXyeS3mfapGxeJy5cJW0SXeeR3adjr6ioNCkns6kkcGjVIOeSXeepb/S0+Ps1OTs3OnxSnifR3admcmjYpGgSXeeSXeeSXieAAAASXeeWoWo4u71THqga5qgZ4+wSHadf6+iXo2fXIeprcXWSXieUn6jSXieSXieSnifSXieTXqgSnifXICbSnidSXeeXXWZSXieR3advrGPeY+YZHWY0GyBS3ad07uNg5SXaXWY62p8THacoqOTmJ6UjZmVV36cSniehHKRnHCMmXGN8Gp6oKGTw7OOtKuQX4KbSHadoG+Lw22EuW6GSnadfPrvlgAAAFJ0Uk5TB2N4cRUEaHhyEyf7////UBr/////Uir+vWVaCABNnP9VkFsf5XND7UMAFgUCGAEHaCcQahEm+ohR/k/+kFv/VdyupyYIlaXF//P//UkY+P//RUqivaQAAABaSURBVHicY2RgZGQAYkYoxQViQLggQgzG+MPACuZy/WaAALa/GFxlRsbvUC7IGE1Gxo9QrgCQq8/I+BrKBZlqyvj4FMqVAZmsyvgAylXExmVFuOo7o7IaspsBU8cOXt0V6UAAAAAASUVORK5CYII="/></defs><use href="#img1" x="5" y="5"/></svg>`;
        btn.className = 'mud-button-root mud-icon-button mud-secondary-text hover:mud-secondary-hover mud-ripple mud-ripple-icon';
        btn.title = imgUrl;
        btn.onclick = () => createProof(imgUrl, bgColor);
        div.appendChild(btn);
        aElement.parentNode.insertBefore(div, aElement);
    }

    function createProof(imgUrls, bgColor) {
        if (!imgUrls) { alert('Görsel bulunamadı!'); return; }
        if (!Array.isArray(imgUrls)) imgUrls = [imgUrls];
        Promise.all(imgUrls.map(src => new Promise((res, rej) => {
            const img = Object.assign(new Image(), { crossOrigin:'anonymous', src });
            img.onload = () => res(img); img.onerror = rej;
        }))).then(images => {
            const canvas = document.createElement('canvas');
            canvas.width = 1000; canvas.height = 1200;
            const ctx = canvas.getContext('2d');
            const area = { x:50, y:60, w:900, h:1080 };
            ctx.fillStyle = bgColor || '#dcdcdc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            images.forEach(img => {
                const scale = Math.min(area.w / img.width, area.h / img.height);
                const nw = img.width * scale, nh = img.height * scale;
                ctx.drawImage(img, area.x + (area.w - nw) / 2, area.y + (area.h - nh) / 2, nw, nh);
            });
            const w = window.open();
            if (w) w.document.write(`<img src="${canvas.toDataURL('image/png')}" style="max-width:100%">`);
        }).catch(err => alert('Görsel yükleme hatası: ' + err));
    }

    // Single delegated slider listener per sNode
    function initSliderListeners(sNode) {
        if (sNode.dataset.sliderListenerAdded) return;
        sNode.dataset.sliderListenerAdded = 'true';
        sNode.addEventListener('click', e => {
            if (e.target.closest('.mud-carousel [aria-label="Next"], .mud-carousel [aria-label="Previous"]')) {
                setTimeout(() => reapplyProofLogic(sNode), 500);
            }
        });
    }

    function reapplyProofLogic(sNode) {
        const colorText  = getText(SEL.shirtColorCut, sNode);
        if (!colorText) return null;
        const colorEntry  = SHIRT_COLOR_MAP.get(colorText.replace(/[()]/g, '').trim());
        const newColor    = colorEntry?.hex;
        const designColor = colorEntry?.ischecked === 1 ? 'black' : 'white';

        // Proof buttons — single rAF pass
        requestAnimationFrame(() => {
            sNode.querySelectorAll(SEL.imgCut).forEach(menu => {
                const aEl = menu.querySelector('div > div > div:nth-child(4)');
                const url = aEl?.querySelector('a')?.href;
                if (aEl && url) addProofButton(url, newColor, aEl);
            });

            // Color overlay (same frame)
            if (!newColor) return;
            const colorCutEl = sNode.querySelector(SEL.imgColorCut);
            colorCutEl?.querySelectorAll('*').forEach(n => {
                const bg = window.getComputedStyle(n).backgroundColor;
                if (bg === 'rgb(220, 220, 220)' || bg === '#dcdcdc') {
                    n.style.backgroundColor = newColor;
                    n.style.borderColor     = designColor;
                    n.style.borderWidth     = '8px';
                }
            });
        });

        return newColor;
    }

    // ─────────────────────────────────────────────
    // FLOATING PANEL
    // ─────────────────────────────────────────────
    function createFloatingPanelSystem() {
        if (document.getElementById('mainToolButton')) return; // guard re-init

        const btn = document.createElement('button');
        btn.id = 'mainToolButton';
        btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        Object.assign(btn.style, {
            position:'fixed', bottom:'85px', right:'20px', width:'60px', height:'60px',
            borderRadius:'50%', background:'#5EE2E9', color:'#000', display:'flex',
            alignItems:'center', justifyContent:'center', border:'none',
            boxShadow:'0 4px 12px rgba(0,0,0,.2)', cursor:'pointer', zIndex:'10000', transition:'transform .2s ease',
        });
        btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.1)'; });
        btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });

        const panel = document.createElement('div');
        panel.id = 'mainToolPanel';
        Object.assign(panel.style, {
            display:'none', position:'fixed', bottom:'160px', right:'20px', width:'350px',
            maxHeight:'70vh', background:'#fff', borderRadius:'12px',
            boxShadow:'0 8px 24px rgba(0,0,0,.15)', zIndex:'9999', overflow:'hidden',
        });
        panel.innerHTML = `
            <div style="display:flex;border-bottom:1px solid #eee">
                <button class="tab-button active" data-tab="generate">Generate</button>
                <button class="tab-button" data-tab="sku">SKU Settings</button>
                <button class="tab-button" data-tab="font">Font Settings</button>
                <button class="tab-button" data-tab="image-text">Image Text</button>
            </div>
            <div id="tab-content" style="padding:15px;overflow-y:auto;max-height:calc(70vh - 50px)"></div>`;

        btn.addEventListener('click', () => {
            const visible = panel.style.display !== 'none';
            panel.style.display = visible ? 'none' : 'block';
            if (!visible) loadTabContent(panel.querySelector('.tab-button.active').dataset.tab);
        });
        panel.querySelectorAll('.tab-button').forEach(b => b.addEventListener('click', () => {
            panel.querySelectorAll('.tab-button').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            loadTabContent(b.dataset.tab);
        }));

        document.body.append(btn, panel);
    }

    function showStatus(msg, type, id = 'statusMessage') {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = msg; el.className = `status-message ${type}`;
        if (type === 'success') setTimeout(() => { el.textContent = ''; el.className = 'status-message'; }, 3000);
    }

    async function populateFontDropdown(id = 'fontListDropdown') {
        const el = document.getElementById(id);
        if (!el) return;
        const keys = (await GM.listValues()).filter(k => k.startsWith('font_')).map(k => k.slice(5));
        const cur  = el.value;
        el.innerHTML = (id === 'skuFontName' ? '<option value="">Select Font</option>' : '') + keys.map(k => `<option value="${k}">${k}</option>`).join('');
        if (cur && keys.includes(cur)) el.value = cur;
    }

    async function populateSkuDropdown() {
        const dl  = document.getElementById('skuList');
        const inp = document.getElementById('skuSearchInput');
        if (!dl || !inp) return;
        const keys = (await GM.listValues()).filter(k => k.startsWith('sku_')).map(k => k.slice(4));
        dl.innerHTML = keys.map(k => `<option value="${k}">`).join('');
        if (inp.value && !keys.includes(inp.value)) inp.value = '';
    }

    async function populateImageSetDropdown(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const keys = (await GM.listValues()).filter(k => k.startsWith('charset_')).map(k => k.slice(8));
        const cur  = el.value;
        el.innerHTML = (id === 'skuImageSet' ? '<option value="">None (Use Font)</option>' : '') + keys.map(k => `<option value="${k}">${k}</option>`).join('');
        if (cur && keys.includes(cur)) el.value = cur;
    }

    async function loadTabContent(tab) {
        const content = document.getElementById('tab-content');
        if (!content) return;

        switch (tab) {
            case 'generate':
                content.innerHTML = `
                    <div><label>SKU</label><input type="text" id="skuInputX" placeholder="HC1000FB"></div>
                    <div><label>Text</label><input type="text" id="textInput" value="Crush Text"></div>
                    <div><label>Method</label><select id="generationMethod"><option value="font">Font Rendering</option><option value="image">Image Characters</option></select></div>
                    <button id="generateBtn">Generate PNG</button>
                    <div id="resultLink" style="margin-top:10px"></div>`;
                document.getElementById('generateBtn').addEventListener('click', async () => {
                    const sku    = document.getElementById('skuInputX').value.trim();
                    const text   = document.getElementById('textInput').value;
                    const method = document.getElementById('generationMethod').value;
                    if (!sku) return showStatus('SKU girin', 'error', 'resultLink');
                    try {
                        const blob = method === 'font'
                            ? await generateImageWithSKUSettings(sku, text)
                            : await generateImageWithCharacterImages(sku, text);
                        if (blob) {
                            const a = Object.assign(document.createElement('a'), {
                                href:       URL.createObjectURL(blob),
                                download:   `${sku}-${text.replace(/:/g, '-')}.png`,
                                textContent:'Download PNG',
                            });
                            const res = document.getElementById('resultLink');
                            res.innerHTML = ''; res.appendChild(a);
                        }
                    } catch (e) { showStatus('Hata: ' + e.message, 'error', 'resultLink'); }
                });
                break;

            case 'sku':
                content.innerHTML = `
                    <div><label>SKU</label><input type="text" id="skuSetInput"></div>
                    <div><label>Font</label><select id="skuFontName"></select></div>
                    <div><label>Text Color</label><input type="color" id="skuFillColor" value="#5EE2E9"></div>
                    <div><label>Stroke Color</label><input type="color" id="skuStrokeColor" value="#000000"></div>
                    <div><label>Stroke Width</label><input type="number" id="skuStrokeWidth" value="6" min="0"></div>
                    <div><label>Image Set</label><select id="skuImageSet"></select></div>
                    <div><label>Spacing (px)</label><input type="number" id="skuSpacing" value="200" min="0"></div>
                    <div><label>Rotation</label><input type="number" id="skuAngle" value="0" min="0" max="360"></div>
                    <div><label>Drive ID</label><input type="text" id="skuDriveId"></div>
                    <button id="saveSkuBtn">Save SKU Settings</button>
                    <div id="skuSaveStatus" class="status-message"></div>
                    <div style="margin-top:20px;border-top:1px solid #eee;padding-top:15px">
                        <h3 style="margin-top:0">Manage SKUs</h3>
                        <input id="skuSearchInput" list="skuList" style="width:100%" placeholder="Type to search…">
                        <datalist id="skuList"></datalist>
                        <button id="deleteSkuBtn" style="margin-top:10px">Delete Selected SKU</button>
                        <div id="skuDeleteStatus" class="status-message"></div>
                    </div>`;

                await Promise.all([populateFontDropdown('skuFontName'), populateSkuDropdown(), populateImageSetDropdown('skuImageSet')]);

                document.getElementById('skuSearchInput').addEventListener('change', async () => {
                    const sku = document.getElementById('skuSearchInput').value;
                    if (!sku) return;
                    const s = await getSkuSettings(sku);
                    if (!s) return showStatus('Ayar bulunamadı', 'error', 'skuSaveStatus');
                    document.getElementById('skuSetInput').value    = sku;
                    document.getElementById('skuFontName').value    = s.fontName    || '';
                    document.getElementById('skuFillColor').value   = s.fillColor   || '#5EE2E9';
                    document.getElementById('skuStrokeColor').value = s.strokeColor || '#000000';
                    document.getElementById('skuStrokeWidth').value = s.strokeWidth ?? 6;
                    document.getElementById('skuImageSet').value    = s.imageSet    || '';
                    document.getElementById('skuSpacing').value     = s.space       ?? 200;
                    document.getElementById('skuAngle').value       = s.angle       ?? 0;
                    document.getElementById('skuDriveId').value     = s.driveId     || '';
                    showStatus(`${sku} yüklendi`, 'success', 'skuSaveStatus');
                });

                document.getElementById('saveSkuBtn').addEventListener('click', async () => {
                    const sku  = document.getElementById('skuSetInput').value.trim();
                    if (!sku) return showStatus('SKU zorunlu', 'error', 'skuSaveStatus');
                    const font = document.getElementById('skuFontName').value.trim();
                    const img  = document.getElementById('skuImageSet').value;
                    if (!font && !img) return showStatus('Font veya image set gerekli', 'error', 'skuSaveStatus');
                    try {
                        await saveSkuSettings(sku, {
                            fontName:    font,
                            fillColor:   document.getElementById('skuFillColor').value,
                            strokeColor: document.getElementById('skuStrokeColor').value,
                            strokeWidth: parseInt(document.getElementById('skuStrokeWidth').value),
                            imageSet:    img || null,
                            space:       parseInt(document.getElementById('skuSpacing').value),
                            angle:       parseInt(document.getElementById('skuAngle').value),
                            driveId:     document.getElementById('skuDriveId').value,
                        });
                        showStatus(`${sku} kaydedildi`, 'success', 'skuSaveStatus');
                        await populateSkuDropdown();
                    } catch (e) { showStatus('Hata: ' + e.message, 'error', 'skuSaveStatus'); }
                });

                document.getElementById('deleteSkuBtn').addEventListener('click', async () => {
                    const sku = document.getElementById('skuSearchInput').value;
                    if (!sku) return showStatus('SKU seçin', 'error', 'skuDeleteStatus');
                    if (!confirm(`"${sku}" silinsin mi?`)) return;
                    try { await deleteSkuSettings(sku); showStatus(`${sku} silindi`, 'success', 'skuDeleteStatus'); await populateSkuDropdown(); }
                    catch (e) { showStatus('Hata: ' + e.message, 'error', 'skuDeleteStatus'); }
                });
                break;

            case 'font':
                content.innerHTML = `
                    <div><label>Font Adı</label><input type="text" id="fontNameInput" placeholder="BebasNeue"></div>
                    <div><label>Font Dosyası (.woff, .woff2)</label><input type="file" id="fontFileInput" accept=".woff,.woff2"></div>
                    <button id="saveFontBtn">Font Kaydet</button>
                    <div id="fontSaveStatus" class="status-message"></div>
                    <div style="margin-top:20px;border-top:1px solid #eee;padding-top:15px">
                        <h3 style="margin-top:0">Fontları Yönet</h3>
                        <select id="fontListDropdown" style="width:100%"></select>
                        <button id="deleteFontBtn" style="margin-top:10px">Seçili Fontu Sil</button>
                        <div id="fontDeleteStatus" class="status-message"></div>
                    </div>`;
                await populateFontDropdown();
                document.getElementById('saveFontBtn').addEventListener('click', () => {
                    const name = document.getElementById('fontNameInput').value.trim();
                    const file = document.getElementById('fontFileInput').files[0];
                    if (!name || !file) return showStatus('Ad ve dosya zorunlu', 'error', 'fontSaveStatus');
                    const reader = new FileReader();
                    reader.onload = async () => {
                        try { await saveImage(`font_${name}`, JSON.stringify({ base64:reader.result, name })); showStatus(`"${name}" kaydedildi`, 'success', 'fontSaveStatus'); await populateFontDropdown(); }
                        catch (e) { showStatus('Hata: ' + e.message, 'error', 'fontSaveStatus'); }
                    };
                    reader.onerror = () => showStatus('Dosya okunamadı', 'error', 'fontSaveStatus');
                    reader.readAsDataURL(file);
                });
                document.getElementById('deleteFontBtn').addEventListener('click', async () => {
                    const n = document.getElementById('fontListDropdown').value;
                    if (!n) return showStatus('Font seçin', 'error', 'fontDeleteStatus');
                    if (!confirm(`"${n}" silinsin mi?`)) return;
                    try { await deleteImage(`font_${n}`); showStatus(`"${n}" silindi`, 'success', 'fontDeleteStatus'); await populateFontDropdown(); }
                    catch (e) { showStatus('Hata: ' + e.message, 'error', 'fontDeleteStatus'); }
                });
                break;

            case 'image-text':
                content.innerHTML = `
                    <div><label>Karakter Set Adı</label><input type="text" id="charSetName" placeholder="NeonNumbers"></div>
                    <div><label>Karakter Görselleri</label><input type="file" id="charImagesInput" multiple accept="image/*"></div>
                    <div><label>Varsayılan Aralık (px)</label><input type="number" id="charSetSpacing" value="200" min="0"></div>
                    <div id="charPreviewContainer"></div>
                    <button id="saveCharSetBtn">Karakter Setini Kaydet</button>
                    <div id="charSaveStatus" class="status-message"></div>
                    <div style="margin-top:20px;border-top:1px solid #eee;padding-top:15px">
                        <h3 style="margin-top:0">Karakter Setlerini Yönet</h3>
                        <select id="charSetDropdown" style="width:100%"></select>
                        <button id="deleteCharSetBtn" style="margin-top:10px">Seçili Seti Sil</button>
                        <div id="charDeleteStatus" class="status-message"></div>
                    </div>`;
                await populateImageSetDropdown('charSetDropdown');
                document.getElementById('charImagesInput').addEventListener('change', e => {
                    const c = document.getElementById('charPreviewContainer');
                    c.innerHTML = '';
                    [...e.target.files].forEach(f => {
                        const r = new FileReader();
                        r.onload = ev => { const img = document.createElement('img'); img.src = ev.target.result; img.title = f.name.replace(/\.[^/.]+$/, ''); img.style.cssText = 'max-height:50px;margin:5px'; c.appendChild(img); };
                        r.readAsDataURL(f);
                    });
                });
                document.getElementById('saveCharSetBtn').addEventListener('click', async () => {
                    const name    = document.getElementById('charSetName').value.trim();
                    const files   = document.getElementById('charImagesInput').files;
                    const spacing = parseInt(document.getElementById('charSetSpacing').value) || 200;
                    if (!name)         return showStatus('Ad zorunlu', 'error', 'charSaveStatus');
                    if (!files.length) return showStatus('En az bir görsel gerekli', 'error', 'charSaveStatus');
                    const charImages = {};
                    await Promise.all([...files].map(f => new Promise(res => {
                        const r = new FileReader();
                        r.onload = () => { charImages[f.name.replace(/\.[^/.]+$/, '')] = r.result; res(); };
                        r.readAsDataURL(f);
                    })));
                    try {
                        await saveImage(`charset_${name}`, JSON.stringify({ images:charImages, spacing, createdAt:new Date().toISOString() }));
                        showStatus(`"${name}" kaydedildi`, 'success', 'charSaveStatus');
                        await populateImageSetDropdown('charSetDropdown');
                        await populateImageSetDropdown('skuImageSet');
                    } catch (e) { showStatus('Hata: ' + e.message, 'error', 'charSaveStatus'); }
                });
                document.getElementById('deleteCharSetBtn').addEventListener('click', async () => {
                    const n = document.getElementById('charSetDropdown').value;
                    if (!n) return showStatus('Set seçin', 'error', 'charDeleteStatus');
                    if (!confirm(`"${n}" silinsin mi?`)) return;
                    try {
                        await deleteImage(`charset_${n}`);
                        showStatus(`"${n}" silindi`, 'success', 'charDeleteStatus');
                        await populateImageSetDropdown('charSetDropdown');
                        await populateImageSetDropdown('skuImageSet');
                    } catch (e) { showStatus('Hata: ' + e.message, 'error', 'charDeleteStatus'); }
                });
                break;
        }
    }

    // ─────────────────────────────────────────────
    // IMAGE GENERATION
    // ─────────────────────────────────────────────
    // Blob registry: auto-cleanup prevents URL leaks
    const blobRegistry = new Map();
    function trackBlob(url, blob) { blobRegistry.set(url, blob); return url; }
    function releaseBlob(url) { URL.revokeObjectURL(url); blobRegistry.delete(url); }
    window.addEventListener('beforeunload', () => { blobRegistry.forEach((_, url) => URL.revokeObjectURL(url)); blobRegistry.clear(); });

    async function uploadGeneratedImage(blob, sku, text, el) {
        const fileInput = el.querySelector('input[type="file"].mud-width-full');
        if (!fileInput) throw new Error('Dosya alanı bulunamadı');
        const url = URL.createObjectURL(blob);
        trackBlob(url, blob);
        const dt = new DataTransfer();
        dt.items.add(new File([blob], `${sku}-${text.replace(/\s+/g, '-')}-${Date.now()}.png`, { type:'image/png' }));
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles:true }));
        setTimeout(() => releaseBlob(url), 1000);
    }

    // PNG DPI helpers
    function blobWith300DPI(blob) {
        return new Promise(res => {
            const r = new FileReader();
            r.onload = () => { res(new Blob([_insertAfterIHDR(new Uint8Array(r.result), _pngPhysChunk(11811, 11811))], { type:'image/png' })); };
            r.readAsArrayBuffer(blob);
        });
    }
    function _pngPhysChunk(ppux, ppuy) {
        const c = new Uint8Array(21), v = new DataView(c.buffer);
        v.setUint32(0, 9); c.set([112,72,89,115], 4); v.setUint32(8, ppux); v.setUint32(12, ppuy); c[16] = 1;
        v.setUint32(17, _crc32(c.slice(4, 17))); return c;
    }
    function _insertAfterIHDR(png, chunk) {
        let i = 8;
        while (i < png.length) {
            const len = (png[i] << 24 | png[i+1] << 16 | png[i+2] << 8 | png[i+3]) >>> 0;
            if (String.fromCharCode(png[i+4], png[i+5], png[i+6], png[i+7]) === 'IHDR')
                return new Uint8Array([...png.slice(0, i + 12 + len), ...chunk, ...png.slice(i + 12 + len)]);
            i += 12 + len;
        }
        return png;
    }
    function _crc32(buf) {
        const t = new Uint32Array(256).map((_, k) => { let c = k; for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ c >>> 1 : c >>> 1; return c; });
        let c = -1; for (const b of buf) c = c >>> 8 ^ t[(c ^ b) & 0xFF]; return (~c) >>> 0;
    }

    function trimCanvas(canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently:true });
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let top = null, bottom = null, left = null, right = null;
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                if (!data[(y * canvas.width + x) * 4 + 3]) continue;
                if (top  === null) top = y; bottom = y;
                if (left  === null || x < left)  left  = x;
                if (right === null || x > right) right = x;
            }
        }
        if (top === null) return canvas;
        const w = right - left + 1, h = bottom - top + 1;
        const out = document.createElement('canvas'); out.width = w; out.height = h;
        out.getContext('2d').putImageData(ctx.getImageData(left, top, w, h), 0, 0);
        return out;
    }

    // Font cache — avoid re-loading same font within session
    const _loadedFonts = new Map();
    async function injectFontFromStorage(fontData) {
        const { name, base64 } = JSON.parse(fontData);
        if (_loadedFonts.has(name) || document.fonts.check(`12px "${name}"`)) {
            _loadedFonts.set(name, true);
            return;
        }
        const ff = new FontFace(name, `url(${base64})`, { display:'swap' });
        await ff.load();
        document.fonts.add(ff);
        await document.fonts.ready;
        if (!document.fonts.check(`12px "${name}"`)) throw new Error(`Font tanınmadı: ${name}`);
        _loadedFonts.set(name, true);
    }

    async function generateImageWithSKUSettings(sku, text, color, font) {
        const s = await getSkuSettings(sku);
        if (!s) { alert(`"${sku}" için ayar bulunamadı`); return null; }
        const fontName   = font  || s.fontName;
        const fillColor  = color || s.fillColor;
        const { strokeColor = '#000000', strokeWidth = 0 } = s;
        if (!fontName) { alert(`SKU ${sku} için font tanımlı değil`); return null; }
        const fontData = await getImage(`font_${fontName}`);
        if (!fontData) { alert(`Font "${fontName}" bulunamadı`); return null; }
        await injectFontFromStorage(fontData);

        const lines = text.replace(/\\n/g, '\n').split('\n');
        const padding = 40, maxW = 5000 - padding * 2;

        // Use OffscreenCanvas for measurement (no layout impact)
        const tmp = new OffscreenCanvas(1, 1).getContext('2d');
        let fontSize = 3200, widths = [], heights = [];
        do {
            tmp.font = `${fontSize}px "${fontName}"`;
            widths  = lines.map(l => tmp.measureText(l).width);
            heights = lines.map(l => { const m = tmp.measureText(l); return m.actualBoundingBoxAscent + m.actualBoundingBoxDescent; });
            fontSize -= 10;
        } while (Math.max(...widths) > maxW && fontSize > 10);

        const totalH = heights.reduce((a, b) => a + b, 0) * 1.2;
        const canvas = new OffscreenCanvas(Math.max(...widths) + padding * 2, totalH + padding * 2);
        const ctx    = canvas.getContext('2d');
        ctx.font = `${fontSize}px "${fontName}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const sf = fontSize / 3200;
        let y = (canvas.height - totalH) / 2;
        for (let i = 0; i < lines.length; i++) {
            y += heights[i] * 0.6;
            if (strokeWidth > 0) { ctx.lineWidth = strokeWidth * sf; ctx.strokeStyle = strokeColor; ctx.strokeText(lines[i], canvas.width / 2, y); }
            ctx.fillStyle = fillColor; ctx.fillText(lines[i], canvas.width / 2, y);
            y += heights[i] * 0.6;
        }

        // OffscreenCanvas → trimCanvas needs a regular canvas
        const offBlob = await canvas.convertToBlob({ type:'image/png', quality:1 });
        const bmp     = await createImageBitmap(offBlob);
        const tmp2    = document.createElement('canvas'); tmp2.width = canvas.width; tmp2.height = canvas.height;
        tmp2.getContext('2d').drawImage(bmp, 0, 0); bmp.close();
        const trimmed = trimCanvas(tmp2);
        return new Promise(res => trimmed.toBlob(async blob => res(await blobWith300DPI(blob)), 'image/png', 1.0));
    }

    async function generateImageWithCharacterImages(sku, text, charset) {
        let imageSet, space = 200, angle = 0;
        if (charset) {
            imageSet = charset;
        } else {
            const s = await getSkuSettings(sku);
            if (!s) { alert(`"${sku}" için ayar bulunamadı`); return null; }
            ({ imageSet, space = 200, angle = 0 } = s);
            if (!imageSet) { alert(`SKU ${sku} için image set tanımlı değil`); return null; }
        }
        const charSetData = await getImage(`charset_${imageSet}`);
        if (!charSetData) { alert(`Karakter seti "${imageSet}" bulunamadı`); return null; }
        const { images: charImages } = JSON.parse(charSetData);

        const loadImg = src => new Promise((res, rej) => {
            const i = Object.assign(new Image(), { crossOrigin:'Anonymous', src });
            i.onload = () => res(i); i.onerror = () => rej(new Error('Yüklenemedi: ' + src));
        });

        const lines     = text.split(':');
        const linesData = [];
        let maxLineW = 0, maxCharH = 0;

        for (const line of lines) {
            const ld = { chars: [], width:0, height:0 };
            for (const ch of line) {
                const k = ch.toUpperCase();
                if (!charImages[k]) { console.warn('Karakter yok:', k); continue; }
                const img = await loadImg(charImages[k]);
                ld.chars.push({ img, width:img.width, height:img.height });
                ld.height = Math.max(ld.height, img.height);
            }
            if (!ld.chars.length) continue;
            ld.width = ld.chars.reduce((s, c, i) => s + c.width + (i < ld.chars.length - 1 ? space : 0), 0);
            maxLineW  = Math.max(maxLineW, ld.width);
            maxCharH  = Math.max(maxCharH, ld.height);
            linesData.push(ld);
        }
        if (!linesData.length) { alert('Geçerli karakter bulunamadı'); return null; }

        const padding  = space * 2;
        const totalH   = maxCharH * linesData.length + space * 2 * (linesData.length - 1);
        const maxCont  = 3000 - padding * 2;
        const sf       = Math.min(1, maxCont / maxLineW, 3000 / totalH);
        const canvas   = document.createElement('canvas');
        canvas.width   = Math.min(maxLineW * sf, maxCont) + padding * 2;
        canvas.height  = totalH * sf + padding * 2;
        const ctx      = canvas.getContext('2d', { willReadFrequently:true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

        let curY = (canvas.height - totalH * sf) / 2;
        for (const [li, ld] of linesData.entries()) {
            let curX = (canvas.width - ld.width * sf) / 2;
            for (const [ci, cd] of ld.chars.entries()) {
                ctx.drawImage(cd.img, 0, 0, cd.width, cd.height, curX, curY + (maxCharH - cd.height) * sf, cd.width * sf, cd.height * sf);
                curX += cd.width * sf + (ci < ld.chars.length - 1 ? space * sf : 0);
            }
            if (li < linesData.length - 1) curY += (maxCharH + space * 2) * sf;
        }

        let result = canvas;
        if (angle) {
            const rad     = angle * Math.PI / 180;
            const [sin, cos] = [Math.abs(Math.sin(rad)), Math.abs(Math.cos(rad))];
            const rw      = Math.min(3000, Math.ceil(canvas.width * cos + canvas.height * sin));
            const rh      = Math.ceil(canvas.width * sin + canvas.height * cos);
            const rc      = document.createElement('canvas'); rc.width = rw; rc.height = rh;
            const rCtx    = rc.getContext('2d');
            rCtx.translate(rw / 2, rh / 2); rCtx.rotate(rad);
            rCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
            result = rc;
        }
        result = trimCanvas(result);

        const dpiSf = 300 / 96;
        let sw = Math.round(result.width * dpiSf), sh = Math.round(result.height * dpiSf);
        const maxD = 3000;
        if (sw > maxD || sh > maxD) { const f = Math.min(maxD / sw, maxD / sh); sw = Math.round(sw * f); sh = Math.round(sh * f); }
        const out = document.createElement('canvas'); out.width = sw; out.height = sh;
        out.getContext('2d', { willReadFrequently:true }).drawImage(result, 0, 0, sw, sh);
        return new Promise(res => out.toBlob(res, 'image/png', 1.0));
    }

    // ─────────────────────────────────────────────
    // INDEXEDDB STORAGE — lazy singleton
    // ─────────────────────────────────────────────
    let _dbPromise = null;
    function openImageDB() {
        if (_dbPromise) return _dbPromise;
        _dbPromise = new Promise((res, rej) => {
            const req = indexedDB.open('ImageStorageDB', 2);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('images'))
                    db.createObjectStore('images', { keyPath:'id' });
                if (!db.objectStoreNames.contains('skuSettings')) {
                    const s = db.createObjectStore('skuSettings', { keyPath:'id' });
                    s.createIndex('by_fontName', 'fontName', { unique:false });
                    s.createIndex('by_imageSet', 'imageSet', { unique:false });
                }
            };
            req.onsuccess = () => res(req.result);
            req.onerror   = () => rej(req.error);
        });
        return _dbPromise;
    }

    async function saveSkuSettings(sku, settings) {
        const key = `sku_${sku}`;
        try {
            const db = await openImageDB();
            await new Promise((res, rej) => {
                const tx = db.transaction('skuSettings', 'readwrite');
                tx.objectStore('skuSettings').put({ id:key, ...settings, lastUpdated:Date.now(), version:2 });
                tx.oncomplete = res; tx.onerror = () => rej(tx.error);
            });
            await GM.setValue(key, { storageType:'indexedDB', cache:{ fontName:settings.fontName, hasImageSet:!!settings.imageSet, lastUpdated:Date.now() } });
        } catch (e) {
            console.warn('IndexedDB save failed, fallback:', e);
            await GM.setValue(key, { ...settings, storageType:'GM_setValue', lastUpdated:Date.now() });
        }
    }

    async function getSkuSettings(sku) {
        const key = `sku_${sku}`;
        try {
            const cached = await GM.getValue(key);
            if (!cached) return null;
            if (cached.storageType === 'indexedDB') {
                const db = await openImageDB();
                const r  = await new Promise((res, rej) => {
                    const tx  = db.transaction('skuSettings', 'readonly');
                    const req = tx.objectStore('skuSettings').get(key);
                    req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error);
                });
                return r ?? null;
            }
            // Migrate legacy GM_setValue entries to IndexedDB
            if (!cached.storageType) { await saveSkuSettings(sku, cached); return cached; }
            return null;
        } catch (e) { console.error('getSkuSettings:', e); return null; }
    }

    async function setSkuSettings(sku, driveId) {
        const old = await getSkuSettings(sku) || {};
        await saveSkuSettings(sku, { ...old, driveId });
    }

    async function deleteSkuSettings(sku) {
        const key = `sku_${sku}`;
        try {
            const db = await openImageDB();
            await new Promise((res, rej) => {
                const tx = db.transaction('skuSettings', 'readwrite');
                tx.objectStore('skuSettings').delete(key);
                tx.oncomplete = res; tx.onerror = () => rej(tx.error);
            });
        } catch (e) { console.warn(e); }
        await GM.deleteValue(key).catch(() => {});
    }

    async function saveImage(key, data) {
        try {
            const db = await openImageDB();
            await new Promise((res, rej) => {
                const tx = db.transaction('images', 'readwrite');
                tx.objectStore('images').put({ id:key, data, lastUpdated:Date.now() });
                tx.oncomplete = res; tx.onerror = () => rej(tx.error);
            });
            await GM.setValue(key, { storageType:'indexedDB', timestamp:Date.now(), size:data.length });
        } catch (e) {
            console.warn('IndexedDB fallback:', e);
            if (data.length < 500000) { await GM.setValue(key, { storageType:'GM_setValue', data, timestamp:Date.now() }); }
            else throw new Error('Görsel GM_setValue için çok büyük');
        }
    }

    async function getImage(key) {
        const meta = await GM.getValue(key).catch(() => null);
        if (!meta) return null;
        if (meta.storageType === 'indexedDB') {
            const db = await openImageDB();
            return new Promise((res, rej) => {
                const tx  = db.transaction('images', 'readonly');
                const req = tx.objectStore('images').get(key);
                req.onsuccess = () => res(req.result?.data ?? null);
                req.onerror   = () => rej(req.error);
            });
        }
        return meta.data ?? null;
    }

    async function deleteImage(key) {
        try {
            const db = await openImageDB();
            await new Promise((res, rej) => {
                const tx = db.transaction('images', 'readwrite');
                tx.objectStore('images').delete(key);
                tx.oncomplete = res; tx.onerror = () => rej(tx.error);
            });
        } catch (e) { console.warn(e); }
        await GM.deleteValue(key).catch(() => {});
    }

    // ─────────────────────────────────────────────
    // DATA MANAGER
    // ─────────────────────────────────────────────
    function createUniversalDataManager() {
        const existing = document.getElementById('dataManagerModal');
        if (existing) { existing.style.display = 'flex'; return; }

        const modal = document.createElement('div');
        modal.id = 'dataManagerModal';
        Object.assign(modal.style, { display:'none', position:'fixed', inset:'0', backgroundColor:'rgba(0,0,0,.5)', zIndex:'10000', justifyContent:'center', alignItems:'center', flexDirection:'column' });
        modal.innerHTML = `<div style="position:relative;background:#fff;padding:20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.3);width:350px;max-width:90%;font-family:Arial,sans-serif">
            <span id="dmClose" style="position:absolute;top:10px;right:15px;font-size:24px;font-weight:bold;cursor:pointer;color:#aaa">&times;</span>
            <h3 style="margin:0 0 15px;font-size:18px;color:#333">Veri Yönetimi</h3>
            <div style="display:flex;flex-direction:column;gap:10px">
                <button id="exportAllBtn"   style="padding:10px;background:#4CAF50;color:#fff;border:none;border-radius:4px;cursor:pointer">Tüm Verileri Dışa Aktar (GM)</button>
                <button id="exportAllBtndb" style="padding:10px;background:#4CA020;color:#fff;border:none;border-radius:4px;cursor:pointer">Tüm DB Verilerini Dışa Aktar</button>
                <label style="display:block;padding:10px;background:#2196F3;color:#fff;text-align:center;cursor:pointer;border-radius:4px">
                    Tüm Verileri İçe Aktar (GM)<input type="file" id="importAllFile" accept=".json" style="display:none">
                </label>
                <label style="display:block;padding:10px;background:#2195E3;color:#fff;text-align:center;cursor:pointer;border-radius:4px">
                    Tüm DB Verileri İçe Aktar<input type="file" id="importAllFiledb" accept=".json" style="display:none">
                </label>
                <button id="clearAllBtn" style="padding:10px;background:#f44336;color:#fff;border:none;border-radius:4px;cursor:pointer">Tüm Verileri Temizle</button>
            </div>
            <div id="dataManagerStatus" style="margin-top:15px;font-size:13px;min-height:20px"></div>
        </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
        document.getElementById('dmClose').onclick = () => { modal.style.display = 'none'; };

        const triggerBtn = document.createElement('button');
        triggerBtn.textContent = 'Veri Yönetimi';
        Object.assign(triggerBtn.style, { position:'fixed', bottom:'150px', right:'20px', zIndex:'9999', padding:'10px 15px', background:'#333', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', boxShadow:'0 2px 5px rgba(0,0,0,.2)' });
        triggerBtn.onclick = () => { modal.style.display = 'flex'; };
        document.body.appendChild(triggerBtn);

        const setStatus = (msg, ok) => {
            const s = document.getElementById('dataManagerStatus');
            s.textContent = msg; s.style.color = ok ? 'green' : 'red';
            setTimeout(() => { s.textContent = ''; }, 5000);
        };

        document.getElementById('exportAllBtn').onclick   = async () => { try { setStatus(await _exportGM(), true);       } catch (e) { setStatus(e.message, false); } };
        document.getElementById('exportAllBtndb').onclick = async () => { try { setStatus(await _exportDB(), true);       } catch (e) { setStatus(e.message, false); } };
        document.getElementById('importAllFile').onchange   = async e => { if (e.target.files[0]) { try { setStatus(await _importGM(e.target.files[0]),   true); } catch (err) { setStatus(err, false); } e.target.value = ''; } };
        document.getElementById('importAllFiledb').onchange = async e => { if (e.target.files[0]) { try { setStatus(await _importDB(e.target.files[0]),   true); } catch (err) { setStatus(err, false); } e.target.value = ''; } };
        document.getElementById('clearAllBtn').onclick = async () => {
            if (!confirm('TÜM veriler silinecek. Emin misiniz?')) return;
            try { setStatus(await _clearGM(), true); } catch (e) { setStatus(e.message, false); }
        };

        modal.style.display = 'flex';
    }

    async function _exportGM() {
        const keys = await GM.listValues();
        const data = Object.fromEntries(await Promise.all(keys.map(async k => [k, await GM.getValue(k)])));
        _downloadJson(data, `gm_backup_${_today()}.json`);
        return 'GM verileri dışa aktarıldı!';
    }
    async function _exportDB() {
        const db  = await openImageDB();
        const out = {};
        for (const store of ['skuSettings', 'images']) {
            out[store] = await new Promise((res, rej) => {
                const map = {}, cur = db.transaction(store, 'readonly').objectStore(store).openCursor();
                cur.onerror   = () => rej('Cursor hatası');
                cur.onsuccess = e => { const c = e.target.result; if (c) { map[c.key] = c.value; c.continue(); } else res(map); };
            });
        }
        _downloadJson(out, `db_backup_${_today()}.json`);
        return 'DB verileri dışa aktarıldı!';
    }
    async function _importGM(file) {
        const data = JSON.parse(await file.text());
        await _clearGM();
        await Promise.all(Object.entries(data).map(([k, v]) => GM.setValue(k, v)));
        return `Başarılı! ${Object.keys(data).length} öğe yüklendi.`;
    }
    async function _importDB(file) {
        const json = JSON.parse(await file.text());
        const db   = await openImageDB();
        const tx   = db.transaction(['skuSettings', 'images'], 'readwrite');
        const skuS = tx.objectStore('skuSettings');
        const imgS = tx.objectStore('images');
        for (const [k, v] of Object.entries(json.skuSettings || {})) { if (!v.id) v.id = k; skuS.put(v); }
        for (const [k, v] of Object.entries(json.images || {})) {
            const item = { ...v }; if (!item.id) item.id = k;
            if (typeof item.data === 'string' && item.data.startsWith('data:')) {
                const r = await fetch(item.data); item.data = await r.blob();
            }
            imgS.put(item);
        }
        return new Promise((res, rej) => { tx.oncomplete = () => res('DB verileri içe aktarıldı!'); tx.onerror = () => rej(tx.error); });
    }
    async function _clearGM() {
        const keys = await GM.listValues();
        await Promise.all(keys.map(k => GM.deleteValue(k)));
        return `${keys.length} öğe silindi.`;
    }
    function _downloadJson(obj, filename) {
        const url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' }));
        const a   = Object.assign(document.createElement('a'), { href:url, download:filename });
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
    }
    const _today = () => new Date().toISOString().slice(0, 10);

    // ─────────────────────────────────────────────
    // GOOGLE APPS SCRIPT LINK
    // ─────────────────────────────────────────────
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwrgsia2C2-NoxZWGpdA1qrvMPeRn3EUwkzsrpvitNQQzu9VeunN7sPVygSw4dZqBb4/exec';
    function getLinkById(id) {
        return new Promise((res, rej) => {
            GM_xmlhttpRequest({
                method:'POST', url:GAS_URL,
                data:JSON.stringify({ action:'getLink', sheetName:'order', id }),
                headers:{ 'Content-Type':'application/json' },
                onload(r) {
                    try {
                        const d = JSON.parse(r.responseText);
                        if (d.status === 'success') { showToast('✅ Link istendi'); res(d.link); }
                        else { showToast('❌ Hata: ' + (d.message || '?'), 'error'); rej(d.message); }
                    } catch (e) { showToast('❌ Yanıt işlenemedi', 'error'); rej(e); }
                },
                onerror(e) { showToast('❌ Gönderilemedi', 'error'); rej(e); },
            });
        });
    }

    // ─────────────────────────────────────────────
    // MUTATION OBSERVER — Blazor/WebSocket aware
    //
    // Blazor's SignalR channel causes frequent small DOM patches.
    // We batch handling via a microtask queue to avoid re-entrance.
    // ─────────────────────────────────────────────
    const _pendingNodes = new Set();
    let   _processingScheduled = false;

    function scheduleBatch() {
        if (_processingScheduled) return;
        _processingScheduled = true;
        // queueMicrotask fires before rAF — keeps UI snappy
        queueMicrotask(processBatch);
    }

    function processBatch() {
        _processingScheduled = false;

        const isApproval = window.location.href.includes('/drop-ship/approval-pending');
        const isOrders   = window.location.href.includes('/drop-ship/orders');

        if (isApproval) processPage();
        if (isOrders)   checkCheckboxes();

        for (const node of _pendingNodes) {
            if (!node.isConnected) { _pendingNodes.delete(node); continue; }

            // Order detail node
            const pNode = node.matches?.(SEL.selector) ? node : node.querySelector?.(SEL.selector);
            if (pNode && !pNode.dataset.processed) convertNode(pNode);

            // Batch cut rows
            if (node.matches?.(SEL.trCut) || node.querySelector?.(SEL.trCut)) convertCutNode();

            // Sales summary
            const salNode = node.matches?.(SEL.salesSummary) ? node : node.querySelector?.(SEL.salesSummary);
            if (salNode && !salNode.dataset.contentInserted) convertSalNode(salNode);

            // Popup cart
            const popNode = node.matches?.(SEL.popupCart) ? node : node.querySelector?.(SEL.popupCart);
            if (popNode && !popNode.dataset.contentInserted) convertpopNode(popNode);

            _pendingNodes.delete(node);
        }

        checkAndInsertEarningContent();
    }

    const _mainObserver = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) _pendingNodes.add(node);
            }
        }
        if (_pendingNodes.size) scheduleBatch();
    });

    // ─────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────
    async function init() {
        await loadConfig();
        initUI();
        checkCheckboxes();
        createFloatingPanelSystem();

        // Handle elements already in the DOM at load time
        const existingPop = document.querySelector(SEL.popupCart);
        if (existingPop) convertpopNode(existingPop);

        // Navbar approve buttons
        waitFor('div.mud-paper.navbar')
            .then(createApproveButton)
            .catch(() => console.warn('Navbar container bulunamadı.'));

        // Run page-specific logic immediately
        processPage();

        // Start observing
        _mainObserver.observe(document.body, { childList:true, subtree:true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
