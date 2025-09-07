// ==UserScript==
// @name         Etsy Order Recent by hub
// @namespace    https://github.com/cengaver
// @version      4.53
// @description  Etsy Order Recent
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
// At script startup

(function () {
    "use strict";

    // Modern UI Styles
    GM.addStyle(`
        :root {
            --primary-color: #4285f4;
            --primary-dark: #3367d6;
            --secondary-color: #34a853;
            --secondary-dark: #2e7d32;
            --danger-color: #ea4335;
            --danger-dark: #c62828;
            --warning-color: #fbbc05;
            --warning-dark: #f57f17;
            --light-color: #f8f9fa;
            --dark-color: #202124;
            --gray-color: #5f6368;
            --border-radius: 4px;
            --box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            --transition: all 0.3s ease;
            --font-family: 'Segoe UI', Roboto, Arial, sans-serif;
        }

        /* Toast Notifications */
        .toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .toast {
            min-width: 280px;
            padding: 12px 16px;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            font-family: var(--font-family);
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            opacity: 0;
            transform: translateY(20px);
            transition: var(--transition);
        }

        .toast.show {
            opacity: 1;
            transform: translateY(0);
        }

        .toast-success {
            background-color: var(--secondary-color);
            color: white;
        }

        .toast-error {
            background-color: var(--danger-color);
            color: white;
        }

        .toast-warning {
            background-color: var(--warning-color);
            color: var(--dark-color);
        }

        .toast-info {
            background-color: var(--primary-color);
            color: white;
        }

        .toast-close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 16px;
            margin-left: 10px;
            opacity: 0.7;
        }

        .toast-close:hover {
            opacity: 1;
        }

       .generation-controls {
            position: relative;
        }
        .color-modal {
            position: absolute;
            background: #fff;
            border: 1px solid #ccc;
            padding: 10px;
            z-index: 9999;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            max-height: 200px;
            overflow-y: auto;
        }

        /* Modal */
        .etsy-tool-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            visibility: hidden;
            transition: var(--transition);
        }

        .etsy-tool-modal-overlay.show {
            opacity: 1;
            visibility: visible;
        }

        .etsy-tool-modal {
            background-color: white;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow: auto;
            transform: translateY(-20px);
            transition: var(--transition);
        }

        .etsy-tool-modal-overlay.show .etsy-tool-modal {
            transform: translateY(0);
        }

        .etsy-tool-modal-header {
            padding: 16px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .etsy-tool-modal-title {
            font-family: var(--font-family);
            font-size: 18px;
            font-weight: 500;
            margin: 0;
        }

        .etsy-tool-modal-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: var(--gray-color);
        }

        .etsy-tool-modal-body {
            padding: 16px;
        }

        .etsy-tool-modal-footer {
            padding: 16px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
              /* Buttons */
        .etsy-tool-btn {
            padding: 8px 12px;
            border: none;
            border-radius: var(--border-radius);
            font-family: var(--font-family);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .etsy-tool-btn:focus {
            outline: none;
        }

        .etsy-tool-btn-primary {
            background-color: var(--primary-color);
            color: white;
        }

        .etsy-tool-btn-primary:hover {
            background-color: var(--primary-dark);
        }

        .etsy-tool-btn-secondary {
            background-color: var(--secondary-color);
            color: white;
        }

        .etsy-tool-btn-secondary:hover {
            background-color: var(--secondary-dark);
        }

        .etsy-tool-btn-danger {
            background-color: var(--danger-color);
            color: white;
        }

        .etsy-tool-btn-danger:hover {
            background-color: var(--danger-dark);
        }

        .etsy-tool-btn-warning {
            background-color: var(--warning-color);
            color: var(--dark-color);
        }

        .etsy-tool-btn-warning:hover {
            background-color: var(--warning-dark);
        }

        .etsy-tool-btn-light {
            background-color: var(--light-color);
            color: var(--dark-color);
            border: 1px solid #ddd;
        }

        .etsy-tool-btn-light:hover {
            background-color: #e9ecef;
        }

        .etsy-tool-btn-sm {
            padding: 4px 8px;
            font-size: 12px;
        }

        .etsy-tool-btn-lg {
            padding: 10px 16px;
            font-size: 16px;
        }

        .etsy-tool-btn-icon {
            width: 32px;
            height: 32px;
            padding: 0;
            border-radius: 50%;
        }

        /* Inputs */
        .etsy-tool-input {
            padding: 2px 4px;
            border: 1px solid #ddd;
            border-radius: var(--border-radius);
            font-family: var(--font-family);
            font-size: 16px;
            transition: var(--transition);
        }

        .etsy-tool-input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }

        .etsy-tool-select {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: var(--border-radius);
            font-family: var(--font-family);
            font-size: 14px;
            background-color: white;
            cursor: pointer;
            transition: var(--transition);
        }

        .etsy-tool-select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }
        .tl-info {
            white-space: pre-wrap;
        }
`);
    // Config yapısı
    const DEFAULT_CONFIG = {
        discount: 25, //indirim yüzde
        feePerc: 48, //fee yüzde
        shipHoodie: 8, //hoodie kargo fiyatı
        shipHoodie2: 3, //ikinci hoodie kargo fiyatı
        shipTee: 5, //tişört ve sweatshirt kargo fiyatı
        shipTee2: 2, //ikinci tişört ve sweatshirt kargo fiyatı
    };

    // Global değişkenler
    let config = { ...DEFAULT_CONFIG };
    let toastContainer = null;

    var shirtColors = [
        { name: "Heather Navy", ischecked: 0, hex: "#333F48" },
        { name: "Heather Mauve", ischecked: 1, hex: "#C49BA3" },
        { name: "Charcoal", ischecked: 0, hex: "#4D4D4D" },
        { name: "Caroline Blue", ischecked: 1, hex: "#71B2DB" },
        { name: "Comfort Colors Banana", ischecked: 1, hex: "#FCE9A6" },
        { name: "Comfort Colors Blue Jean", ischecked: 0, hex: "#566D7E" },
        { name: "Comfort Colors Butter", ischecked: 1, hex: "#F9E38C" },
        { name: "Comfort Colors Chalky Mint", ischecked: 1, hex: "#A8D5BA" },
        { name: "Comfort Colors Chambray", ischecked: 1, hex: "#A3BFD9" },
        { name: "Comfort Colors Denim", ischecked: 0, hex: "#4F728E" },
        { name: "Comfort Colors Burnt Orange", ischecked: 1, hex: "#CC5500" },
        { name: "Comfort Colors Granite", ischecked: 0, hex: "#5F5F60" },
        { name: "Comfort Colors Grey", ischecked: 0, hex: "#B2B2B2" },
        { name: "Comfort Colors Hemp", ischecked: 0, hex: "#434b36" },
        { name: "Comfort Colors Ice Blue", ischecked: 0, hex: "#85aac4" },
        { name: "Comfort Colors Ivory", ischecked: 1, hex: "#F3F1DC" },
        { name: "Comfort Colors Light Green", ischecked: 1, hex: "#BFD8B8" },
        { name: "Comfort Colors Midnight", ischecked: 0, hex: "#2E3B4E" },
        { name: "Comfort Colors Orchid", ischecked: 1, hex: "#C3A3BF" },
        { name: "Comfort Colors Pepper", ischecked: 0, hex: "#4B4F52" },
        { name: "Comfort Colors Pepper", ischecked: 0, hex: "#4B4F52" },
        { name: "Comfort Colors Seafoam", ischecked: 1, hex: "#9FE2BF" },
        { name: "Comfort Colors Watermelon", ischecked: 0, hex: "#FA6C6C" },
        { name: "Comfort Colors White", ischecked: 1, hex: "#eceaee" },
        { name: "Comfort Colors Yam", ischecked: 0, hex: "#FF8C42" },
        { name: "Comfort Colors Terracotta", ischecked: 0, hex: "#E3775E" },
        { name: "Comfort Colors Berry", ischecked: 0, hex: "#85394A" },
        { name: "Comfort Colors Black", ischecked: 0, hex: "#1f1f1f" },
        { name: "Comfort Colors Blue Spruce", ischecked: 0, hex: "#49796B" },
        { name: "Comfort Colors Brick", ischecked: 0, hex: "#9C3E2E" },
        { name: "Comfort Colors Blossom", ischecked: 1, hex: "#F4C2C2" },
        { name: "Comfort Colors Boysenberry", ischecked: 0, hex: "#873260" },
        { name: "Comfort Colors Crimson", ischecked: 0, hex: "#A91B0D" },
        { name: "Comfort Colors Crunchberry", ischecked: 0, hex: "#DE5D83" },
        { name: "Comfort Colors Espresso", ischecked: 0, hex: "#3B2F2F" },
        { name: "Comfort Colors Grape", ischecked: 0, hex: "#6F42C1" },
        { name: "Comfort Colors Lagoon Blue", ischecked: 0, hex: "#6DAEDB" },
        { name: "Comfort Colors Moss", ischecked: 0, hex: "#8A9A5B" },
        { name: "Comfort Colors Neon Red Orange", ischecked: 0, hex: "#FF5349" },
        { name: "Comfort Colors Neon Yellow", ischecked: 0, hex: "#FFFF33" },
        { name: "Comfort Colors Red", ischecked: 0, hex: "#C1272D" },
        { name: "Comfort Colors Rose", ischecked: 1, hex: "#E7A2A2" },
        { name: "Comfort Colors Seafoam Green", ischecked: 0, hex: "#9FE2BF" },
        { name: "Comfort Colors Sunset", ischecked: 0, hex: "#FA8072" },
        { name: "Comfort Colors Violet", ischecked: 0, hex: "#8F509D" },
        { name: "Comfort Colors Washed Denim", ischecked: 0, hex: "#5D6D7E" },
        { name: "Comfort Colors Wine", ischecked: 0, hex: "#722F37" },
        { name: "Daisy", ischecked: 1, hex: "#FFD300" },
        { name: "Dark Gray", ischecked: 0, hex: "#A9A9A9" },
        { name: "Evergreen", ischecked: 0, hex: "#115740" },
        { name: "Forest Green", ischecked: 0, hex: "#228B22" },
        { name: "Heather Autumn", ischecked: 1, hex: "#C48447" },
        { name: "Heather Deep Teal", ischecked: 0, hex: "#255E69" },
        { name: "Heather Galapagos Blue", ischecked: 1, hex: "#496C8D" },
        { name: "Heather Maroon", ischecked: 0, hex: "#4A1C2A" },
        { name: "Heather Peach", ischecked: 1, hex: "#FFDAB9" },
        { name: "Heather Prism Lilac", ischecked: 1, hex: "#D8B7DD" },
        { name: "Azalea", ischecked: 1, hex: "#F78FA7" },
        { name: "Irish Green", ischecked: 1, hex: "#1CA659" },
        { name: "Light Pink", ischecked: 1, hex: "#FFB6C1" },
        { name: "Kelly Green", ischecked: 0, hex: "#4CBB17" },
        { name: "Light Blue", ischecked: 1, hex: "#ADD8E6" },
        { name: "Comfort Colors Sage", ischecked: 0, hex: "#C1C8B6" },
        { name: "Dark Grey Heather", ischecked: 0, hex: "#555555" },
        { name: "Heather Indigo Blue", ischecked: 0, hex: "#395573" },
        { name: "White", ischecked: 1, hex: "#FFFFFF" },
        { name: "Tan", ischecked: 1, hex: "#D2B48C" },
        { name: "Sage Green", ischecked: 1, hex: "#9CAF88" },
        { name: "True Royal", ischecked: 0, hex: "#4169E1" },
        { name: "Sport Grey", ischecked: 1, hex: "#C0C0C0" },
        { name: "Navy", ischecked: 0, hex: "#000080" },
        { name: "Military Green", ischecked: 0, hex: "#4B5320" },
        { name: "Heather True Royal", ischecked: 0, hex: "#3A5DAE" },
        { name: "Maroon", ischecked: 0, hex: "#800000" },
        { name: "Mauve", ischecked: 1, hex: "#E0B0FF" },
        { name: "Natural", ischecked: 1, hex: "#F5F5DC" },
        { name: "Orange", ischecked: 1, hex: "#FFA500" },
        { name: "Purple", ischecked: 0, hex: "#800080" },
        { name: "Red", ischecked: 0, hex: "#FF0000" },
        { name: "Sand", ischecked: 1, hex: "#ECD9B0" },
        { name: "Soft Cream", ischecked: 1, hex: "#FFFDD0" },
        { name: "Heliconia", ischecked: 0, hex: "#FF69B4" },
        { name: "Black", ischecked: 0, hex: "#000000" },
        { name: "Comfort Colors Mustard", ischecked: 1, hex: "#e2bc75" },
        { name: "Sapphire", ischecked: 0, hex: "#0067A0" },
        { name: "Heather Berry", ischecked: 0, hex: "#db689d" }
    ];


    // Config yönetimi
    async function loadConfig() {
        try {
            const savedConfig = await GM.getValue('storeConfig');
            if (savedConfig) {
                config = { ...DEFAULT_CONFIG, ...savedConfig };
                return true;
            }
            return false;
        } catch (error) {
            console.error('Config yükleme hatası:', error);
            return false;
        }
    }

    function saveConfig() {
        GM.setValue('storeConfig', config);
    }

    function isConfigured() {
        return config.discount;
    }

    function initUI() {
        GM.registerMenuCommand('⚙️ Ayarları Düzenle', showConfigMenu);
        GM.registerMenuCommand('⚙️ Verileri Düzenle', createUniversalDataManager);// Ayarlar backup Kullanım için:
    }

    // Modern Toast Notification System
    function createToastContainer() {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }

    function showToast(message, type = 'success', duration = 3000) {
        const container = createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        });

        toast.appendChild(messageSpan);
        toast.appendChild(closeBtn);
        container.appendChild(toast);

        // Show animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    // Modern Config Dialog
    async function showConfigMenu() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'etsy-tool-modal-overlay';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'etsy-tool-modal';

        // Modal header
        const header = document.createElement('div');
        header.className = 'etsy-tool-modal-header';

        const title = document.createElement('h3');
        title.className = 'etsy-tool-modal-title';
        title.textContent = 'Etsy Tool Ayarları';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'etsy-tool-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Modal body
        const body = document.createElement('div');
        body.className = 'etsy-tool-modal-body';
        const fields = [
            { id: 'discount', label: 'Store Discount %:(25)', type: 'number', value: config.discount },
            { id: 'feePerc', label: 'Fee + Marketing % :(48)', type: 'number', value: config.feePerc },
            { id: 'shipHoodie', label: 'Hoodie Kargo:', type: 'number', value: config.shipHoodie },
            { id: 'shipHoodie2', label: 'Hoodie Kargo 2. ürün:', type: 'number', value: config.shipHoodie2 },
            { id: 'shipTee', label: 'Shirt Kargo:', type: 'number', value: config.shipTee },
            { id: 'shipTee2', label: 'Shirt Kargo 2. ürün:', type: 'number', value: config.shipTee2 },
            { id: 'credit', label: 'Kredi', type: 'number', value: config.credit }
        ];

        fields.forEach(field => {
            const fieldContainer = document.createElement('div');
            fieldContainer.style.marginBottom = '15px';

            const label = document.createElement('label');
            label.textContent = field.label;
            label.style.display = 'block';
            label.style.marginBottom = '5px';
            label.style.fontWeight = 'bold';

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.style.height = '100px';
            } else {
                input = document.createElement('input');
                input.type = field.type;
            }

            input.id = field.id;
            input.className = 'etsy-tool-input';
            input.value = field.value;
            input.style.width = '100%';

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);
            body.appendChild(fieldContainer);
        });

        // Modal footer
        const footer = document.createElement('div');
        footer.className = 'etsy-tool-modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'etsy-tool-btn etsy-tool-btn-light';
        cancelBtn.textContent = 'İptal';
        cancelBtn.addEventListener('click', () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        });

        const saveBtn = document.createElement('button');
        saveBtn.className = 'etsy-tool-btn etsy-tool-btn-primary';
        saveBtn.textContent = 'Kaydet';
        saveBtn.addEventListener('click', async () => {
            // Save config
            fields.forEach(field => {
                config[field.id] = field.type == 'number' ? parseFloat(document.getElementById(field.id).value) : document.getElementById(field.id).value;
            });

            await saveConfig();
            showToast('Ayarlar başarıyla kaydedildi', 'success');

            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        });

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);

        // Add to document
        document.body.appendChild(overlay);

        // Show with animation
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    const waitForElement = (selector, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const interval = 100;
            let waited = 0;
            const timer = setInterval(() => {
                const el = document.querySelector(selector);
                if (el) {
                    clearInterval(timer);
                    resolve(el);
                }
                waited += interval;
                if (waited >= timeout) {
                    clearInterval(timer);
                    reject(new Error("Element not found: " + selector));
                }
            }, interval);
        });
    };

    const base =
          "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card.ch-n-od-tab > div > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-6.pl-1.pr-1.m-0.cus-prd-c > div > div.d-flex.flex-row.gap-3";

    const selectors = {
        selector: "div.mud-dialog-content div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.pl-1 div.d-flex.flex-row.gap-3.w-100.mb-3.mt-4 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.card-title.mb-0.fs-3.fw-bold",
        earning: base,
        price: `${base}> div.mud-alert.mud-alert-text-warning.mud-dense.mud-elevation-0.mt-1 > div > div > p`,
        cost: `${base}> div.mud-alert.mud-alert-text-info.mud-dense.mud-elevation-0.mt-1 > div > div > p`,
        ship: "div > div.mud-grid-item.mud-grid-item-xs-12.mt-4 > div > div.mud-paper.mud-elevation-0.bg-primary-subtle.badge.mt-4 > p",
        ship2: "div > div.mud-input.mud-input-text.mud-input-text-with-label.mud-input-adorned-end.mud-input-underline.mud-shrink.mud-disabled.mud-typography-input.mud-select-input > div.mud-input-slot.mud-input-root.mud-input-root-text.mud-input-root-adorned-end.mud-select-input > div > p",
        creditEl: "#main-wrapper > div > div > div > div > div > div > div.mud-card-content.cus-main.overflow-hidden > div > div > dxbl-grid > div.dxbl-grid-toolbar-container > div > div:nth-child(1) > div > div > h3",
        balanceEl: "#main-wrapper > div > div > div > div > div > div > div.mud-card-content.cus-main.overflow-hidden > div > div > dxbl-grid > div.dxbl-grid-toolbar-container > div > div:nth-child(3) > div > div > h3",
        salesSummary: "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div > div > div > div > div > div:nth-child(2) > h6",
        trCut: "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > dxbl-grid > dxbl-scroll-viewer > div > table > tbody > tr",
        imgCut: "td.dxbl-grid-fixed-cell.dxbl-grid-last-fixed-left-cell > div > div > div:nth-child(1) > section > div.mud-carousel-swipe > div > div > div > div.mud-grid-item.mud-grid-item-xs-8.h-100.position-relative.image-menu",
        personaCut: "td:nth-child(3) > div > div > div:nth-child(6) > div > h6 > div > b",
        shirtColorCut: "td:nth-child(3) > div > div > div:nth-child(5) > div > h6 > p",
        imgColorCut: "td.dxbl-grid-fixed-cell.dxbl-grid-last-fixed-left-cell > div > div > div",
        skuCut: "td:nth-child(3) > div > div > div.d-flex.flex-row.gap-3.col-md-12.single-note-item.all-category.note-important > div > p > a",
        orderCut: "td:nth-child(3) > div > div > div.d-flex.flex-row.gap-3.col-md-12.single-note-item.all-category.note-business > div > h6 > a",
        shirt: "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.p-2.m-0.cus-prd-r.mudcard-optionsx > div > div > div.d-flex.flex-row.gap-0 > div > div:nth-child(1) > div.d-flex.flex-column.gap-0.w-100 > div.mud-tooltip-root.mud-tooltip-inline.w-100 > span > p",
        sku: "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-6.pl-1.pr-1.m-0.cus-prd-c > div > div.mud-paper.mud-elevation-0.note-has-grid.row > div > div > p > div",
        adet: "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-paper.mud-elevation-0.absolute.r-0.t-0.p-0.m-0.shades.transparent > div > div.mud-alert.mud-alert-text-success.mud-dense.mud-elevation-0",
        store: "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.pt-0.relative > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.pl-1 > div > div > div.d-flex.flex-row.gap-3.w-100.mb-1.mt-4 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.text-muted.mt-0.fs-2.mud-typography-nowrap",
        mapAdress: "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.pt-0.relative.ch-n-od-shipinfos > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-8.pl-0.pr-3.pt-2 > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-8.p-0.overflow-hidden > div.d-flex.flex-row.gap-3.w-100.mb-0.mt-3 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.text-muted.mt-0.fs-2",
        subTotalSel: "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div > div > div > div > div > div.d-flex.align-items-center.justify-content-between.mb-3.pt-2 > h6",
        popupCart: "div.d-flex.flex-row.gap-0.cus-action-buttons.position-absolute.z-3.pl-3.ch-n-od-header.w-100 > div.mud-paper.mud-elevation-0.pt-2.shades.transparent.ch-n-od-buttons > div",
        popupOrderId: "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.pt-0.relative.ch-n-od-shipinfos > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.pl-1.pt-2 > div > div > div.d-flex.flex-row.gap-3.w-100.mb-3.mt-4 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.card-title.mb-0.fs-3.fw-bold.link.link-primary"
    };
    function getText(selector,doc = document) {
        const el = doc.querySelector(selector);
        return el?.textContent.trim() || null;
    }

    const createApproveButton = (container) => {
        const btnApprove = document.createElement('button');
        btnApprove.textContent = 'App';
        btnApprove.className = 'mud-button-root mud-button mud-button-text mud-button-text-default mud-button-text-size-medium mud-ripple';
        btnApprove.style.cssText = 'padding: 3px 10px; font-size: 11px; border-right: 1px solid #e0e0e0; border-radius: 0; margin-right: 8px;';
        btnApprove.addEventListener('click', () => {
            checkCheckboxesFromLocalStorage('orderNumbers');
            btnApprove.style.backgroundColor = 'green';
        });

        const btnAwait= document.createElement('button');
        btnAwait.textContent = 'Wait';
        btnAwait.className = btnApprove.className;
        btnAwait.style.cssText = btnApprove.style.cssText + 'border-right: none;';
        btnAwait.addEventListener('click', () => {
            checkCheckboxesFromLocalStorage('orderNumbersWait');
            btnAwait.style.backgroundColor = 'olive';
        });
        const btnDelay= document.createElement('button');
        btnDelay.textContent = 'Delay';
        btnDelay.className = btnApprove.className;
        btnDelay.style.cssText = btnApprove.style.cssText + 'border-right: none;';
        btnDelay.addEventListener('click', () => {
            checkCheckboxesFromLocalStorage('orderNumbersDelay');
            btnDelay.style.backgroundColor = 'blue';
        });
        const btnClear = document.createElement('button');
        btnClear.textContent = 'ClearApp';
        btnClear.className = btnApprove.className;
        btnClear.style.cssText = btnApprove.style.cssText + 'border-right: none;';
        btnClear.addEventListener('click', () => {
            localStorage.removeItem('orderNumbers');// sadece localStorage'ı temizle
            btnClear.style.backgroundColor = 'red';
            btnApprove.style.backgroundColor = '';
        });
        const btnClearwait = document.createElement('button');
        btnClearwait.textContent = 'ClearWait';
        btnClearwait.className = btnApprove.className;
        btnClearwait.style.cssText = btnApprove.style.cssText + 'border-right: none;';
        btnClearwait.addEventListener('click', () => {
            localStorage.removeItem('orderNumbersWait');// sadece localStorage'ı temizle
            btnClearwait.style.backgroundColor = 'red';
            btnAwait.style.backgroundColor = '';
        });
        const btnCleardelay = document.createElement('button');
        btnCleardelay.textContent = 'ClearDelay';
        btnCleardelay.className = btnApprove.className;
        btnCleardelay.style.cssText = btnApprove.style.cssText + 'border-right: none;';
        btnCleardelay.addEventListener('click', () => {
            localStorage.removeItem('orderNumbersDelay');// sadece localStorage'ı temizle
            btnCleardelay.style.backgroundColor = 'red';
            btnAwait.style.backgroundColor = '';
        });
        container.insertBefore(btnCleardelay, container.firstChild);
        container.insertBefore(btnClearwait, container.firstChild);
        container.insertBefore(btnClear, container.firstChild);
        container.insertBefore(btnDelay, container.firstChild);
        container.insertBefore(btnAwait, container.firstChild);
        container.insertBefore(btnApprove, container.firstChild);
    };

    function checkCheckboxes() {
        let lastCheckedRow = null;
        //console.log("checker yüklendi")
        document.querySelectorAll('tr').forEach(tr => {
            //console.log("checker seçildi")
            const checkbox = tr.querySelector('input[type="checkbox"], dxbl-check');
            if (!checkbox) return;

            checkbox.addEventListener('click', e => {
                const rows = Array.from(document.querySelectorAll('tr'));
                const currentRow = tr;

                if (e.shiftKey && lastCheckedRow) {
                    const startIndex = rows.indexOf(lastCheckedRow);
                    const endIndex = rows.indexOf(currentRow);
                    const [minIndex, maxIndex] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];

                    for (let i = minIndex; i <= maxIndex; i++) {
                        const checkboxInput = rows[i].querySelector('input[type="checkbox"]');
                        if (checkboxInput) {
                            checkboxInput.checked = true;
                            checkboxInput.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        const dxblCheck = rows[i].querySelector('dxbl-check');
                        if (dxblCheck) {
                            dxblCheck.setAttribute('check-state', '1');
                            dxblCheck.dispatchEvent(new Event('click', { bubbles: true }));
                        }
                    }
                }

                lastCheckedRow = currentRow;
            });
        });
    }
    function checkCheckboxesFromLocalStorage(orderkeys) {
        const savedOrders = JSON.parse(localStorage.getItem(orderkeys) || '[]');
        document.querySelectorAll('tr').forEach(tr => {
            const orderNoLink = tr.querySelector('td a');
            if (orderNoLink) {
                const orderNo = orderNoLink.textContent.trim();
                if (savedOrders.includes(orderNo)) {
                    const checkboxInput = tr.querySelector('input[type="checkbox"]');
                    if (checkboxInput) {
                        checkboxInput.checked = true;
                        checkboxInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    const dxblCheck = tr.querySelector('dxbl-check');
                    if (dxblCheck) {
                        dxblCheck.setAttribute('check-state', '1');
                        dxblCheck.dispatchEvent(new Event('click', { bubbles: true }));
                    }
                }
            }
        });
    }

    const observerOptions = { childList: true, subtree: true };

    function insertEarningContent(earningNode, costText, priceText, shirtText, quantity, miktar, shipText, skuText) {
        //const storeNode = document.querySelector(selectors.store);
        const RemDiscount = (100 - config.discount) / 100; //indirimden kalan yüzde
        const RemFeePerc = (100 - config.feePerc) / 100; //fee den kalan yüzde
        const remainingDiscount = priceText * RemDiscount;
        const remainingFee = remainingDiscount * RemFeePerc;
        const remaining = remainingFee - costText;
        const shipCross = shirtText.includes("Hoodie") ? (config.shipHoodie + config.shipHoodie2 * (quantity - 1)) / quantity : (config.shipTee + config.shipTee2 * (quantity - 1)) / quantity;
        //console.log("config.shipTee: ",config.shipTee);
        //console.log("shipCross: ",shipCross);
        const shipTotal = shipText ? (shipCross - shipText / quantity) : 0;
        const Net = (remaining + shipTotal) * miktar;

        if (!earningNode.dataset.contentInserted) {
            const newContent = `
                <div class="mud-alert mud-alert-text-primary mud-dense mud-elevation-0 mt-1" style="cursor: pointer;">
                    <div class="mud-alert-position justify-sm-start">
                        <div class="mud-alert-message">
                            <p class="mud-typography mud-typography-body2" title="%${config.discount} indirim (${remainingDiscount.toFixed(2)}). %${config.feePerc} (${quantity} adet) (${miktar} miktar) fee+ads (${remainingFee.toFixed(2)}) Kargo+(${shipCross.toFixed(2)}) : ${shipTotal.toFixed(2)} Kalan=${remaining.toFixed(2)} ">NET(K:+${shipTotal.toFixed(2)}): $${Net.toFixed(2)}</p>
                        </div>
                    </div>
                </div>`;
            earningNode.insertAdjacentHTML('beforeend', newContent);

            if (skuText && !document.querySelector('.copy-icon')) {
                const copyButton = document.createElement('button');
                copyButton.textContent = 'Kopyala';
                copyButton.className = 'copy-icon'; // Aynı simgenin tekrar eklenmemesi için
                copyButton.addEventListener('click', function (e) {
                    navigator.clipboard.writeText(skuText).then(() => {
                        e.target.style.backgroundColor = "red"
                        //alert('skuText kopyalandı: ' + skuText);
                    });
                });
                earningNode.parentNode.insertBefore(copyButton, newContent.nextSibling);
            }

            earningNode.dataset.contentInserted = "true";

        }
    }

    function checkAndInsertEarningContent() {
        setTimeout(() => {
            const earningNodes = document.querySelectorAll(selectors.earning);
            const adetNodes = document.querySelectorAll(selectors.adet);
            const costNodes = document.querySelectorAll(selectors.cost);
            const priceNodes = document.querySelectorAll(selectors.price);
            const shirtNodes = document.querySelectorAll(selectors.shirt);
            const shipNode = document.querySelector(selectors.ship);
            const ship2Node = document.querySelector(selectors.ship2);
            const skuNodes = document.querySelectorAll(selectors.sku);

            const shipText = shipNode && shipNode.textContent.match(/\d+/)
            ? shipNode.textContent.match(/\d+/)[0]
            : (ship2Node && ship2Node.textContent.match(/\d+/)
               ? ship2Node.textContent.match(/\d+/)[0]
               : 0);

            earningNodes.forEach((earningNode, index) => {
                const costText = costNodes[index] ? costNodes[index].textContent.match(/\d+/)[0] : "Bilinmiyor";
                const priceText = priceNodes[index] ? priceNodes[index].textContent.match(/\d+/)[0] : "Bilinmiyor";
                const shirtText = shirtNodes[index] ? shirtNodes[index].textContent.trim() : "Bilinmiyor";
                const quantityText = adetNodes[0] ? adetNodes[0].textContent.match(/\d+/)[0] : "1";
                const miktar = earningNodes[index] ? earningNodes[index].textContent.match(/\d+/)[0] : "1";
                const quantity = parseInt(quantityText, 10);
                const skuText = skuNodes[index] ? skuNodes[index].textContent.trim() : "Bilinmiyor";
                insertEarningContent(earningNode, costText, priceText, shirtText, quantity, miktar, shipText, skuText);
            });
        }, 500); // 100 ms timeout
    }

    // Map to track generated BLOBs and their URLs
    const blobRegistry = new Map();

    function convertNode(pNode) {
        pNode.classList.add("link", "link-primary");
        pNode.style.cursor = "pointer";
        pNode.dataset.processed = "true";
        let storeNode;
        let orderId;
        const mapAdressNode = document.querySelector(selectors.mapAdress);
        pNode.addEventListener("click", (e) => {
            storeNode = getText(selectors.store);
            if (!storeNode) return;
            //copy order no!!!
            orderId = pNode.textContent.replace("#", "");
            if (!storeNode.includes("Hand") || orderId.includes('_')) {
                navigator.clipboard.writeText(orderId).then(() => {
                    //e.target.style.backgroundColor = "red"
                    showToast('orderId kopyalandı: ' + orderId, 'success');
                });
                return;
            }
            const targetUrl = `https://www.etsy.com/your/orders/sold/new?order_id=${orderId}&search_query=${orderId}&expand_convo=true`;
            window.open(targetUrl, "_blank");
        });

        if (!mapAdressNode) return;

        const mapAdressButton = document.createElement('button');
        mapAdressButton.style.marginLeft = "0.5em";
        mapAdressButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" aria-label="Google Maps" role="img" viewBox="0 0 512 512" width="24" height="24"><rect width="512" height="512" rx="15%" fill="#ffffff"/><clipPath id="a"><path d="M375 136a133 133 0 00-79-66 136 136 0 00-40-6 133 133 0 00-103 48 133 133 0 00-31 86c0 38 13 64 13 64 15 32 42 61 61 86a399 399 0 0130 45 222 222 0 0117 42c3 10 6 13 13 13s11-5 13-13a228 228 0 0116-41 472 472 0 0145-63c5-6 32-39 45-64 0 0 15-29 15-68 0-37-15-63-15-63z"/></clipPath><g stroke-width="130" clip-path="url(#a)"><path stroke="#fbbc04" d="M104 379l152-181"/><path stroke="#4285f4" d="M256 198L378 53"/><path stroke="#34a853" d="M189 459l243-290"/><path stroke="#1a73e8" d="M255 120l-79-67"/><path stroke="#ea4335" d="M76 232l91-109"/></g><circle cx="256" cy="198" r="51" fill="#ffffff"/></svg>`;
        mapAdressNode.appendChild(mapAdressButton);

        mapAdressButton.addEventListener('click', () => {
            const addressText = mapAdressNode.cloneNode(true);
            addressText.querySelector('button')?.remove();
            const address = addressText.textContent.trim();
            const targetMapUrl = `https://www.google.com/maps/dir/${encodeURIComponent(address)}`;
            window.open(targetMapUrl, "_blank");
        });
    }

    async function convertCutNode() {
        const sNodes = document.querySelectorAll(selectors.trCut);

        sNodes.forEach(async (sNode, index) => {
            //console.log("sNodes: ",sNode);
            if (sNode && !sNode.dataset.contentInserted) {
                sNode.dataset.contentInserted = "true";
                const interval = setInterval(() => {
                    const imgCutmenu = sNode.querySelector(selectors.imgCut);
                    if (imgCutmenu) {
                        const aElement = imgCutmenu.querySelector("div > div > div:nth-child(3)");
                        if (!aElement) return; // a elementi yoksa hata vermesin
                        const imgCutUrl = aElement.querySelector("a")?.href;
                        if (!imgCutUrl) return; // elementi yoksa hata vermesin
                        const uploadDiv = document.createElement('div');
                        uploadDiv.className = 'mud-tooltip-root mud-tooltip-inline';
                        const uploadButton = document.createElement('button');
                        uploadButton.innerHTML = `<svg class="svg-icon" style="width: 1em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M653.6 629L517.8 473.2c-1.6-1.6-4.1-1.6-5.7 0L376.4 629l-0.4 0.4c-1.6 2.1 0.1 5.2 2.8 5.2H495v288.7c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V634.6h116.1c2.7 0 4.5-3.1 2.8-5.2-0.1-0.2-0.2-0.3-0.3-0.4z" fill="#5ABE64" /><path d="M907.5 434c-36-42.8-84.9-72.9-138.9-85.8-11-56.4-40.5-107.9-84.1-146.2-47.6-41.8-108.8-64.8-172.2-64.8-63.6 0-124.9 23.2-172.6 65.2-43.7 38.6-73.2 90.4-84 147.2-52.6 13.9-100.2 44.3-135 86.6-38.4 46.6-59.5 105.5-59.5 166 0 69.8 27.2 135.4 76.5 184.7 35.5 35.5 79.4 59.5 127.2 70.2 12.4 2.8 24.2-6.7 24.2-19.5v-0.2c0-9.4-6.6-17.4-15.7-19.5-98.5-22.3-172.3-110.6-172.3-215.7 0-104.4 74.1-195.5 176.2-216.6l13.9-2.9 1.9-14.1C307.7 259.4 402 177.1 512.3 177.1c109.8 0 204 81.9 219 190.5l2 14.3 14.2 2.6c105.1 19.1 181.3 110.6 181.3 217.6 0 106.3-75.4 195.3-175.5 216.4-9.3 2-16 10.1-16 19.5v0.2c0 12.6 11.6 22.1 24 19.5 49.3-10.2 94.6-34.6 131-71 49.3-49.3 76.5-114.9 76.5-184.7 0.1-61.3-21.8-121-61.3-168z" fill="#5ABE64" /></svg>`;
                        uploadButton.className = 'mud-button-root mud-icon-button mud-secondary-text hover:mud-secondary-hover mud-ripple mud-ripple-icon';
                        uploadDiv.appendChild(uploadButton); // Doğru elementin parentNode'u
                        aElement.parentNode.insertBefore(uploadDiv, aElement);
                        uploadButton.addEventListener('click', async function () {
                            try {
                                const response = await fetch(imgCutUrl);
                                if (!response.ok) throw new Error(`Görsel alınamadı: ${response.status}`);
                                const blob = await response.blob();
                                const sku = '12345'; // veya dinamik olarak al
                                const text = 'uploaded-image'; // örnek isim veya kullanıcıdan alınan metin
                                await uploadGeneratedImage(blob, sku, text, sNode);
                                console.log('Yükleme tamamlandı');
                            } catch (err) {
                                console.error('Yükleme sırasında hata:', err);
                            }
                        });
                        console.log("imgCutUrl: ", imgCutUrl);
                        clearInterval(interval);
                    }
                }, 1000);

                const orderCutText = sNode.querySelector(selectors.orderCut);
                if (orderCutText) {
                    const currentOrder = orderCutText.textContent.trim();
                    const copyOButton = document.createElement('button');
                    copyOButton.textContent = 'Copy';
                    copyOButton.style.marginLeft = '10px'; // Space between SKU and icon
                    copyOButton.className = 'copy-icon'; // Aynı simgenin tekrar eklenmemesi için
                    orderCutText.parentNode.appendChild(copyOButton);
                    copyOButton.addEventListener('click', function (e) {
                        navigator.clipboard.writeText(currentOrder).then(() => {
                            e.target.style.backgroundColor = "aqua"
                        });
                    });
                    const approveButton = document.createElement('button');
                    approveButton.textContent = 'Gönder';
                    approveButton.style.marginLeft = '10px';
                    approveButton.className = 'approve-icon';
                    let savedOrders = JSON.parse(localStorage.getItem('orderNumbers') || '[]');
                    if (savedOrders.includes(currentOrder)) {
                        const td = orderCutText.closest("td");
                        if (td) td.classList.add("toast-success");
                        //approveButton.closest("td").style.backgroundColor = "lime !important";
                    }
                    orderCutText.parentNode.appendChild(approveButton);

                    approveButton.addEventListener('click', function (e) {
                        savedOrders = JSON.parse(localStorage.getItem('orderNumbers') || '[]');
                        if (!savedOrders.includes(currentOrder)) {
                            savedOrders.push(currentOrder);
                            localStorage.setItem('orderNumbers', JSON.stringify(savedOrders));
                        }
                        //approveButton.classList.add("link", "link-primary");
                        const td = approveButton.closest("td");
                        if (td) td.classList.add("toast-success");
                        e.target.style.backgroundColor = "green"
                        //approveButton.closest("td").style.backgroundColor = "lime";
                    });

                    const waitButton = document.createElement('button');
                    waitButton.textContent = 'Beklet';
                    waitButton.style.marginLeft = '10px';
                    waitButton.className = 'wait-icon';
                    let savedOrdersw = JSON.parse(localStorage.getItem('orderNumbersWait') || '[]');
                    if (savedOrdersw.includes(currentOrder)) {
                        const td = orderCutText.closest("td");
                        if (td) td.classList.add("toast-warning");
                    }
                    orderCutText.parentNode.appendChild(waitButton);
                    waitButton.addEventListener('click', function (e) {
                        savedOrdersw = JSON.parse(localStorage.getItem('orderNumbersWait') || '[]');
                        if (!savedOrdersw.includes(currentOrder)) {
                            savedOrdersw.push(currentOrder);
                            localStorage.setItem('orderNumbersWait', JSON.stringify(savedOrdersw));
                        }
                        const td = orderCutText.closest("td");
                        if (td) td.classList.add("toast-warning");
                        e.target.style.backgroundColor = "olive"
                        //e.target.closest("td").style.backgroundColor = "olive";
                    });
                    const delayButton = document.createElement('button');
                    delayButton.textContent = 'Ertele';
                    delayButton.style.marginLeft = '10px';
                    delayButton.className = 'wait-icon';
                    let savedOrderdl = JSON.parse(localStorage.getItem('orderNumbersDelay') || '[]');
                    if (savedOrderdl.includes(currentOrder)) {
                        const td = orderCutText.closest("td");
                        if (td) td.classList.add("toast-info");
                    }
                    orderCutText.parentNode.appendChild(delayButton);
                    delayButton.addEventListener('click', function (e) {
                        savedOrderdl = JSON.parse(localStorage.getItem('orderNumbersDelay') || '[]');
                        if (!savedOrderdl.includes(currentOrder)) {
                            savedOrderdl.push(currentOrder);
                            localStorage.setItem('orderNumbersDelay', JSON.stringify(savedOrderdl));
                        }
                        const td = orderCutText.closest("td");
                        if (td) td.classList.add("toast-info");
                        e.target.style.backgroundColor = "blue"
                        //e.target.closest("td").style.backgroundColor = "olive";
                    });
                    const orderImageBtn = document.createElement('button');
                    orderImageBtn.textContent = 'OrderImg';
                    orderImageBtn.style.marginLeft = '10px';
                    orderImageBtn.className = 'wait-icon';
                    let orderImage = JSON.parse(localStorage.getItem('orderImg') || '[]');
                    if ( orderImage.includes(currentOrder)) {
                        const td = orderCutText.closest("td");
                        if (td) td.classList.add("toast-error");
                    }
                    orderCutText.parentNode.appendChild(orderImageBtn);
                    orderImageBtn.addEventListener('click',async function (e) {
                        orderImageBtn.style.backgroundColor = "orange"
                        orderImage = JSON.parse(localStorage.getItem('orderImg') || '[]');
                        const orderImagelink = await getLinkById(currentOrder);
                        console.log("Link:", orderImagelink);
                        if(orderImagelink){
                            orderImageBtn.style.backgroundColor = "green"
                            window.open(orderImagelink, "_blank");
                            if (! orderImage.includes(currentOrder)) {
                                orderImage.push(currentOrder);
                                localStorage.setItem('orderImg', JSON.stringify(orderImage));
                            }
                            const td = orderCutText.closest("td");
                            if (td) td.classList.add("toast-info");
                            e.target.style.backgroundColor = "pink"
                        }else{
                            orderImageBtn.style.backgroundColor = "red"
                        }
                    });
                }

                const skuCText = sNode.querySelector(selectors.skuCut);
                if (skuCText) {
                    const skuNo =skuCText.textContent;
                    //console.log("skuCText: ",skuCText.textContent);
                    const copyCButton = document.createElement('button');
                    copyCButton.textContent = 'Kopyala';
                    copyCButton.style.marginLeft = '10px'; // Space between SKU and icon
                    copyCButton.className = 'copy-icon'; // Aynı simgenin tekrar eklenmemesi için
                    skuCText.parentNode.appendChild(copyCButton);
                    copyCButton.addEventListener('click', function (e) {
                        navigator.clipboard.writeText(skuNo).then(() => {
                            e.target.style.backgroundColor = "aqua"
                            //alert('skuCText kopyalandı: ' + skuNoskuNo);
                        });
                    });
                    if (skuNo.includes("X")){
                        let id = (await getSkuSettings(skuNo))?.driveId;
                        if (!id) {
                            const container = document.createElement('div');
                            container.style.display = 'inline-block';
                            container.style.marginLeft = '10px solid';

                            const input = document.createElement('input');
                            input.type = 'text';
                            input.placeholder = 'Enter ID';
                            input.className = 'mud-input-slot mud-input-root mud-input-root-text mud-input-root-adorned-end mud-input-root-margin-normal';
                            //input.className='mud-input-slot';
                            const saveButton = document.createElement('button');
                            saveButton.textContent = 'Kaydet';
                            saveButton.className='mud-button mud-button-filled mud-button-filled-primary mud-button-filled-size-small';

                            saveButton.addEventListener('click', async () => {
                                const newId = input.value.trim();
                                if (newId) {
                                    await setSkuSettings(skuNo, newId);
                                    //location.reload();
                                }
                            });

                            container.appendChild(input);
                            container.appendChild(saveButton);
                            skuCText.parentNode.appendChild(container);
                        } else {
                            const userId = await GM.getValue("userId", 0);
                            const folderUrl = `https://www.photopea.com/?state={\"ids\":[\"${id}\"],\"action\":\"open\",\"userId\":\"${userId}\",\"resourceKeys\":{}}`;
                            const linkElement2 = document.createElement('a');
                            linkElement2.href = folderUrl;
                            linkElement2.target = "_blank";
                            linkElement2.className = 'folder2';
                            const imgElement2 = document.createElement('img');
                            imgElement2.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAYNQTFRFAAAAGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSX0Onc4AAAAIF0Uk5TACOp//6hHHD791xB/Si0kfT23sbc09d8MAVFmvnv62UCGsrxuA8L8pIBFzg/Bxue6eVmXvDjDgqwmNVgyX/W9ZSD2z16Sp0TvCErioE7De4uzybnJG1jsfrLTMOGnLOMWRhUVuzRp4litYhOefy2V4Jdx7qH87uEvTa/KmnASYDOCtc5cgAAAgxJREFUeJx9k21IFHEQxp8H8+S4tEwiLkU8KKEs4SrsRSXksKTsiDxTKpEQLOqD0gtSSH1QVKIQBZUoRaIXtMgLMbUiQkwpISTBPhRlgSRCcPgSkWjN3q67a+05H/Y/O8+PmfnP7BIgCUsT4TeICM5Z62I2/qTjV0hZzE5GzS4HYCVXTy8JREnhGVPNNQwzqTHkhBxOgb5rofUmIJYcW/Rd/Ko6CQbg4kdTssQfgeC5QQc28kPw3Cz5R+RMDowvyeCIVfSkFYqYzHfibx9W4m4N2Ma3wE4OaelSBuWx540pw67XwNZVg3oLcdJj+oABpH6T/sMXxEsj54Tb+xLwvDJKZLwAMiUGD3uBrOfAvm7Y5g1g/1O1ZFaX8pbdDRzohLdLL5H9BDjcCXg7FP0I/XKf9/B16EDMJJD7GMhpB7Yk8SFw9AFwrE0vkX8POCGhQ34kOvslwAjZccF9fZLH7wCFd4G1E/A+k1Xafa3Ayc/9egnHFHCwR6AWoIhsX1A+geJmY5IKcOo24GsztnX6lmmbxU3AmZtKtEGTN3nYaALO1muAM6cuGI60BWD+HlyfNADYvWNy3bC7/s9iJbWH0hvAhVpY2bkgcP6aOoeQQKZcsey6JeBm/PiyQDTzHgEXa2TjfZZACi/NNKKsSt3x/2YvIcqrcbkiBJDmapU//8qYX0Z9tfJfleVfhkbxF6QJhTmGsYn9AAAAAElFTkSuQmCC'; // Folder icon
                            imgElement2.alt = 'Folder';
                            imgElement2.style.width = '24px';
                            imgElement2.style.height = '24px';
                            imgElement2.style.marginLeft = '10px';
                            linkElement2.appendChild(imgElement2);

                            linkElement2.addEventListener('click', function(e) {
                                navigator.clipboard.writeText(folderUrl).then(() => {
                                    window.open(folderUrl);
                                });
                            });

                            skuCText.parentNode.appendChild(linkElement2);
                        }
                    }
                    const gdriveSearchUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(skuNo)}`;
                    const linkElement = document.createElement('a');
                    linkElement.href = gdriveSearchUrl;
                    linkElement.target = "_blank";
                    linkElement.className = 'gdrive-icon2';
                    const imgElement = document.createElement('img');
                    imgElement.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAB+klEQVR4AWJwL/ChKx68ForXW7SJN1iswYb5GyxaqGqhycrgR+rTAKzUA2hoURwG8Cn3bL/wbNuIz7Y5p9kOY57NMBvZs23bPtt/dW7b4VR94ep3v6OHaJvFJSoaZldQROB+hDJValcFPBj20vB82AsEAYCVyTT1uUykaWitGAQIB1oy22WoKOhKQMCCMKa0dLypYN9dTs7HcMvg5YCAHQKAzLmwpwpYGbORBHH2LAfMY4G4JdmOaJkvBQnsMQ+DHAl5MTSeqjaMASaarvZ00SB8UATCyp1OVzMWgfBDiwLhY7J2+Nn5LScyVCkUfkoI3nLqWivAcB7j52HYSISMEJz9WIwEyyE/AAtEBJLbRLoNiBxigIcVgDO08AwFwnkpwfx4Sx1aSFrmLwAvRDz+BBtaFB6Gg9txA9sEg6d9NLNO+/5HvFz0sXXardmy567d4CFW4F5V1BuXiUgVNBa5jpdEBdz2vTRy2/cyxMtduyFpTjtMotobD1D75Yvs3LjopYDwh9v/5CNWrtsOSjGc/8bFqP/mHtRx7zyVodP7tisgZMeffB8SO6xfLYeIlllvTSkM2jH34UraQeB5VkvexoeWWsttR7bEaPu9Cz95IEZbAVw8wm461+7uuXrp4Q0L6LxxS/NKQQ+t2HpYKEKQPMhXkpkNqoYwXTEA+kphQitc/vYAAAAASUVORK5CYII=';
                    imgElement.alt = 'Google Drive';
                    imgElement.style.width = '24px';
                    imgElement.style.height = '24px';
                    imgElement.style.marginLeft = '10px';
                    linkElement.appendChild(imgElement);

                    skuCText.parentNode.appendChild(linkElement);
                    //skuNoElement.parentNode.insertBefore(copyButton, skuNoElement.nextSibling);
                }
                const newColor = reapplyProofLogic(sNode);
                if (newColor) makeHexBox(newColor, sNode.querySelector(selectors.skuCut));

                // İlk yüklemede slider event'leri ekle
                initSliderListeners(sNode);

                const personaCutEl = getText(selectors.personaCut,sNode);
                if (skuCText && personaCutEl) {
                    const sku = skuCText.textContent;
                    let SkuSettings = await getSkuSettings(sku);
                    const personaText = personaCutEl.replace("Personalization ", "").trim();
                    //console.log("personaText: ", personaText);

                    const targetCell = sNode.querySelector('td:nth-child(3) > div');
                    if (!targetCell) {
                        console.log("targetCell yok");
                        return;
                    }

                    const noteId = generateUniqueId();
                    const inputValue = personaText.replaceAll(":", "").replace(/NUMBER/i, "").replace(/NAME/i, "").replaceAll("\n", " | ").toUpperCase();

                    const makeCard = (label, inputId, btnId, btnStyl,btnTitle, noteId, type) => {
                        const extraControls = type === "font"
                        ? `
            <button class="mud-button mud-button-outlined mud-button-outlined-primary mud-button-outlined-size-small" id="color-btn-${noteId}">
                🎨 Renk Seç
            </button>
            <select id="font-select-${noteId}" class="mud-select mud-select-size-small">
                <option value="">Font Seç</option>
            </select>
            <input type="hidden" id="selected-color-${noteId}">
            <input type="hidden" id="selected-font-${noteId}">
            <div id="color-modal-${noteId}" class="color-modal" style="display:none; bottom:0; position:absolute; background:#fff; border:1px solid #ccc; padding:10px; z-index:999;">
                <table id="color-table-${noteId}"></table>
            </div>`
                        : `
            <select id="charset-select-${noteId}" class="mud-select mud-select-size-small">
                <option value="">Charset Seç</option>
            </select>
            <input type="hidden" id="selected-charset-${noteId}">
        `;

                        return `
      <div class="card card-body py-0 mb-0 p-1 shadow-none mt-0">
          <span class="side-stick"></span>
          <p class="note-date fs-1 mb-0">${label}</p>
          <div class="personalization-input mb-1">
              <input type="text"
                     class="mud-input-slot mud-input-root mud-input-root-text mud-input-root-adorned-end mud-input-root-margin-normal"
                     id="${inputId}"
                     value="${inputValue}"
                     style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
          </div>
          <div class="generation-controls">
              <div class="d-flex gap-1 align-items-center">
                  <button title ="${btnTitle}" class="mud-button mud-button-filled mud-button-filled-${btnStyl} mud-button-filled-size-small"
                          id="${btnId}">
                      Oluştur ve Yükle
                  </button>
                  ${extraControls}
              </div>
              <div class="status-message mt-1" id="status-${btnId}"></div>
          </div>
      </div>`;
                    };


                    let btnFont = SkuSettings?.fontName ? 'warning':'';
                    let btnImag = SkuSettings?.imageSet ? 'warning':'';
                    const noteHtml = `
  <div role="group" class="d-flex flex-row gap-3 col-md-12 single-note-item all-category note-social" id="${noteId}">
      ${makeCard("Dizayn oluştur Font ile", `persona-input-1-${noteId}`, `generate-btn-1-${noteId}`, btnFont,SkuSettings?.fontName, noteId, "font")}
      ${makeCard("Dizayn oluştur Resim ile", `persona-input-2-${noteId}`, `generate-btn-2-${noteId}`, btnImag,SkuSettings?.imageSet, noteId, "image")}
  </div>`;



                    targetCell.insertAdjacentHTML('beforeend', noteHtml);
                    // FONT UI SETUP (renk paleti + font select)
                    const colors = {
                        black: "#000000",
                        white: "#ffffff",
                        red: "#ac110d",
                        royal: "#00237d",
                        columbia: "#74cae3",
                        navy: "#192145",
                        sky_blue: "#0397d5",
                        purple: "#6c35aa",
                        neon_orange: "#f3541c",
                        grey: "#646263",
                        maroon: "#800000",
                        orange: "#fea500",
                        yellow: "#fedd04",
                        vegas: "#c4b454",
                        gold: "#d3af37",
                        teal: "#008081",
                        sand: "#c3ae81",
                        neon_pink: "#ed1880",
                        green: "#1e6334",
                        neon_green: "#44b83d",
                        silver: "#c0c0c0",
                        brown: "#974a02",
                        magenta: "#ff00fe",
                        pink: "#ffbfcd",
                        burgundy: "#811930",
                        kelly_green: "#4CBB17"
                    };

                    const colorBtn = document.getElementById(`color-btn-${noteId}`);
                    const colorModal = document.getElementById(`color-modal-${noteId}`);
                    const colorTable = document.getElementById(`color-table-${noteId}`);
                    const hiddenColor = document.getElementById(`selected-color-${noteId}`);

                    if (colorBtn) {
                        colorBtn.addEventListener("click", () => {
                            colorModal.style.display = colorModal.style.display === "none" ? "block" : "none";
                        });

                        Object.entries(colors).forEach(([name, hex]) => {
                            const row = document.createElement("tr");
                            const colorCell = document.createElement("td");
                            colorCell.style.background = hex;
                            colorCell.style.width = "30px";
                            colorCell.style.height = "30px";

                            const nameCell = document.createElement("td");
                            nameCell.textContent = name;

                            row.appendChild(colorCell);
                            row.appendChild(nameCell);

                            row.addEventListener("click", () => {
                                hiddenColor.value = hex;
                                colorModal.style.display = "none";
                                colorBtn.textContent = `🎨 ${name}`;
                            });

                            colorTable.appendChild(row);
                        });
                    }

                    // FONT SELECT GM’den doldur
                    const fontSelect = document.getElementById(`font-select-${noteId}`);
                    const hiddenFont = document.getElementById(`selected-font-${noteId}`);
                    if (fontSelect) {
                        const keys = await GM.listValues();
                        for (const key of keys) {
                            if (key.startsWith("font_")) {
                                const fontName = key.replace("font_", "");
                                const option = document.createElement("option");
                                option.value = fontName;
                                option.textContent = fontName;
                                fontSelect.appendChild(option);
                            }
                        }

                        fontSelect.addEventListener("change", () => {
                            hiddenFont.value = fontSelect.value;
                        });
                    }

                    // CHARSET SELECT GM’den doldur
                    const charsetSelect = document.getElementById(`charset-select-${noteId}`);
                    const hiddenCharset = document.getElementById(`selected-charset-${noteId}`);
                    if (charsetSelect) {
                        const keys = await GM.listValues();
                        for (const key of keys) {
                            if (key.startsWith("charset_")) {
                                const charsetName = key.replace("charset_", "");
                                const option = document.createElement("option");
                                option.value = charsetName;
                                option.textContent = charsetName;
                                charsetSelect.appendChild(option);
                            }
                        }

                        charsetSelect.addEventListener("change", () => {
                            hiddenCharset.value = charsetSelect.value;
                        });
                    }


                    const handleGeneration = (method, inputId, btnId, generateFn) => {
                        document.getElementById(btnId).addEventListener('click', async () => {
                            const input = document.getElementById(inputId);
                            const currentText = input.value.trim();
                            const statusElement = document.getElementById(`status-${btnId}`);

                            if (!currentText) {
                                statusElement.textContent = "Lütfen kişiselleştirme metni girin";
                                statusElement.className = "status-message mt-1 text-error";
                                console.log("Kişiselleştirme metni yok");
                                return;
                            }

                            console.log(`Oluşturuluyor... Sku:${sku} , text:${currentText}`);
                            statusElement.textContent = "Oluşturuluyor...";
                            statusElement.className = "status-message mt-1 text-info";

                            try {
                                const settings = await getSkuSettings(sku);
                                if (!settings) throw new Error(`No settings found for SKU: ${sku}`);
                                const blob = await generateFn(sku, currentText);

                                await uploadGeneratedImage(blob, sku, currentText, sNode);
                                cleanupBlob(blob);
                                //console.log("Başarıyla oluşturuldu ve yüklendi!");

                                statusElement.textContent = "Başarıyla oluşturuldu ve yüklendi!";
                                statusElement.className = "status-message mt-1 text-success";

                                const displayText = getText(`#${noteId} .personalization-text`);
                                if (displayText) displayText = `Personalization ${currentText}`;

                                setTimeout(() => {
                                    statusElement.textContent = "";
                                    statusElement.className = "status-message mt-1";
                                }, 3000);

                            } catch (error) {
                                console.error("Error generating personalization image:", error);
                                statusElement.textContent = `Hata: ${error.message}`;
                                statusElement.className = "status-message mt-1 text-error";
                            }
                        });
                    };

                    //handleGeneration("font", `persona-input-1-${noteId}`, `generate-btn-1-${noteId}`, generateImageWithSKUSettings);
                    //handleGeneration("image", `persona-input-2-${noteId}`, `generate-btn-2-${noteId}`, generateImageWithCharacterImages);
                    handleGeneration("font", `persona-input-1-${noteId}`, `generate-btn-1-${noteId}`, async (sku, currentText) => {
                        const colorValue = document.getElementById(`selected-color-${noteId}`).value;
                        const fontValue = document.getElementById(`selected-font-${noteId}`).value;

                        return await generateImageWithSKUSettings(sku, currentText, colorValue, fontValue);
                    });
                    handleGeneration("image", `persona-input-2-${noteId}`, `generate-btn-2-${noteId}`, async (sku, currentText) => {
                        const charsetValue = document.getElementById(`selected-charset-${noteId}`).value;

                        return await generateImageWithCharacterImages(sku, currentText, charsetValue);
                    });
                }
            };
        });
    };

    async function convertSalNode(salNode) {
        if (salNode && !salNode.dataset.contentInserted) {
            const subTotal = getText(selectors.subTotalSel);
            const discount = salNode.textContent;
            console.log("indirim: ", discount);
            console.log("subTotal: ", subTotal);
            const discountSpan = document.createElement('span');
            discountSpan.textContent = `% ${(unformatNumber(discount) * 100 / unformatNumber(subTotal)).toFixed(2)}`;
            salNode.parentNode.appendChild(discountSpan);
            salNode.dataset.contentInserted = "true";
        };
    };

    let isProcessing = false; // Flag to prevent multiple executions

    const getExchangeRate = () => new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: "GET",
            url: "https://www.tcmb.gov.tr/kurlar/today.xml",
            onload: (response) => {
                if (response.status === 200) {
                    const xmlDoc = new DOMParser().parseFromString(response.responseText, "text/xml")
                    const rateEl = getText(`Currency[CurrencyCode="USD"] BanknoteSelling`,xmlDoc)
                    if (rateEl) {
                        resolve(Number(rateEl))
                    } else {
                        reject("Kur bilgisi alınamadı")
                    }
                } else {
                    reject(`Hata: ${response.statusText}`)
                }
            },
            onerror: (error) => reject(error),
        })
    })

    const unformatNumber = (str) => parseFloat(str.replace(/[^0-9,-]+/g, ""))

    const processPage = async () => {
        if (isProcessing) return; // If already processing, exit
        isProcessing = true; // Set flag to true
        const creditElement = document.querySelector(selectors.creditEl);
        const balanceElement = document.querySelector(selectors.balanceEl);

        if (!creditElement || !balanceElement) {
            isProcessing = false; // Reset flag if elements are not found
            return;
        }

        const exchangeRate = await getExchangeRate().catch((error) => {
            console.error("Kur bilgisi alınamadı:", error)
            isProcessing = false; // Reset flag if exchange rate fetch fails
            return null
        })

        if (!exchangeRate) {
            isProcessing = false; // Reset flag if exchange rate is not available
            return;
        }

        const getcreditElValue = () => unformatNumber(creditElement.textContent)
        const getbalanceElValue = () => unformatNumber(balanceElement.textContent)

        const addText = (el, eclass, text) => {
            if (!el) return

            // Check if the span with the specified class already exists
            let span = el.querySelector(`span.${eclass}`)
            if (!span) {
                // If it doesn't exist, create a new span
                span = document.createElement("span")
                span.classList.add(eclass)
                span.style.marginLeft = "0.5em"
                el.appendChild(span)
            }
            // Update the text content of the span
            span.textContent = text
        }

        const credit = getcreditElValue();
        const creditInTl = credit * exchangeRate
        const balance = getbalanceElValue();
        const balance1 = config.credit;
        const balanceInTl = balance * exchangeRate
        const balanceInT2 = balance1* exchangeRate
        addText(creditElement, "tl-info", ` (${Math.round(creditInTl)} ₺)`)

        addText(balanceElement, "tl-info", ` (${Math.round(balanceInTl)} ₺)\n  (${Math.round(balance + balance1)} \$) (${Math.round(balanceInTl+balanceInT2)} ₺)`)

        isProcessing = false; // Reset flag after processing is complete
    }

    const createFloatingPanelSystem = () => {
        // Main floating button
        const createMainButton = () => {
            const btn = document.createElement('button');
            btn.id = 'mainToolButton';
            btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

            Object.assign(btn.style, {
                position: 'fixed',
                bottom: '85px',
                right: '20px',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#5EE2E9',
                color: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                zIndex: 10000,
                transition: 'transform 0.2s ease'
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1)';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
            });

            btn.addEventListener('click', togglePanelVisibility);
            document.body.appendChild(btn);
        };

        // Main panel container
        const createMainPanel = () => {
            const panel = document.createElement('div');
            panel.id = 'mainToolPanel';

            Object.assign(panel.style, {
                display: 'none',
                position: 'fixed',
                bottom: '90px',
                right: '20px',
                width: '350px',
                maxHeight: '70vh',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                zIndex: 9999,
                overflow: 'hidden',
                transition: 'all 0.3s ease'
            });

            // Tab system
            panel.innerHTML = `
            <div style="display: flex; border-bottom: 1px solid #eee;">
                <button class="tab-button active" data-tab="generate">Generate</button>
                <button class="tab-button" data-tab="sku">SKU Settings</button>
                <button class="tab-button" data-tab="font">Font Settings</button>
                <button class="tab-button" data-tab="image-text">Image Text</button>
            </div>
            <div id="tab-content" style="padding: 15px; overflow-y: auto; max-height: calc(70vh - 50px);">
                <!-- Content will be loaded here -->
            </div>
        `;

            document.body.appendChild(panel);

            // Tab switching
            panel.querySelectorAll('.tab-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    panel.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    loadTabContent(btn.dataset.tab);
                });
            });

            // Style tabs
            const style = document.createElement('style');
            style.textContent = `
            .tab-button {
                flex: 1;
                padding: 12px;
                background: none;
                border: none;
                cursor: pointer;
                font-weight: 500;
                color: #666;
                transition: all 0.2s;
            }
            .tab-button:hover {
                background: #f5f5f5;
                color: #333;
            }
            .tab-button.active {
                color: #5EE2E9;
                border-bottom: 2px solid #5EE2E9;
            }
            #tab-content input, #tab-content select, #tab-content button {
                width: 100%;
                padding: 10px;
                margin: 8px 0;
                border: 1px solid #ddd;
                border-radius: 6px;
                box-sizing: border-box;
            }
            #tab-content button {
                background: #5EE2E9;
                color: black;
                border: none;
                font-weight: bold;
                cursor: pointer;
                transition: background 0.2s;
            }
            #tab-content button:hover {
                background: #4acfd6;
            }
            .status-message {
                margin: 10px 0;
                padding: 8px;
                border-radius: 4px;
                text-align: center;
            }
            .success {
                background: #e6ffed;
                color: #28a745;
            }
            .error {
                background: #ffeef0;
                color: #cb2431;
            }
            .image-preview {
                max-width: 100%;
                max-height: 100px;
                margin: 10px 0;
                border: 1px solid #ddd;
            }
            #charPreviewContainer {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            #charPreviewContainer img {
                max-height: 50px;
                object-fit: contain;
            }
        `;
            document.head.appendChild(style);
        };

        // Tab content loader
        const loadTabContent = async (tabName) => {
            const content = document.getElementById('tab-content');

            switch(tabName) {
                case 'generate':
                    content.innerHTML = `
                    <div>
                        <label>SKU</label>
                        <input type="text" id="skuInputX" placeholder="e.g. HC1000FB" />
                    </div>
                    <div>
                        <label>Text</label>
                        <input type="text" id="textInput" value="Crush Text" />
                    </div>
                    <div>
                        <label>Generation Method</label>
                        <select id="generationMethod">
                            <option value="font">Font Rendering</option>
                            <option value="image">Image Characters</option>
                        </select>
                    </div>
                    <button id="generateBtn">Generate PNG</button>
                    <div id="resultLink" style="margin-top:10px;"></div>
                `;

                    document.getElementById('generateBtn').addEventListener('click', async () => {
                        const sku = document.getElementById('skuInputX').value.trim();
                        const text = document.getElementById('textInput').value;
                        const method = document.getElementById('generationMethod').value;

                        if (!sku) return showStatus('Please enter a SKU', 'error');

                        try {
                            let blob;
                            if (method === 'font') {
                                blob = await generateImageWithSKUSettings(sku, text);
                            } else {
                                blob = await generateImageWithCharacterImages(sku, text);
                            }

                            if (blob) {
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `${sku}-${text.replace(/:/g, '-')}.png`;
                                link.textContent = 'Download PNG';
                                const result = document.getElementById('resultLink');
                                result.innerHTML = '';
                                result.appendChild(link);
                                showStatus('Image generated successfully!', 'success');
                            }
                        } catch (e) {
                            showStatus(`Error: ${e.message}`, 'error');
                        }
                    });
                    break;

                case 'sku':
                    content.innerHTML = `
                    <div>
                        <label>SKU</label>
                        <input type="text" id="skuSetInput" />
                    </div>
                    <div>
                        <label>Font Name</label>
                        <select id="skuFontName">
                            <option value="">Select Font</option>
                        </select>
                    </div>
                    <div>
                        <label>Text Color</label>
                        <input type="color" id="skuFillColor" value="#5EE2E9" />
                    </div>
                    <div>
                        <label>Stroke Color</label>
                        <input type="color" id="skuStrokeColor" value="#000000" />
                    </div>
                    <div>
                        <label>Stroke Width</label>
                        <input type="number" id="skuStrokeWidth" value="6" min="0" />
                    </div>
                    <div>
                        <label>Character Image Set</label>
                        <select id="skuImageSet">
                            <option value="">None (Use Font)</option>
                        </select>
                    </div>
                    <div>
                        <label>Character Spacing (px)</label>
                        <input type="number" id="skuSpacing" value="200" min="0" />
                    </div>
                    <div>
                        <label>Rotation Angle (degrees)</label>
                        <input type="number" id="skuAngle" value="0" min="0" max="360" />
                    </div>
                    <div>
                        <label>Drive ID</label>
                        <input type="text" id="skuDriveId"/>
                    </div>
                    <button id="saveSkuBtn">Save SKU Settings</button>
                    <div id="skuSaveStatus" class="status-message"></div>

                    <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
                        <h3 style="margin-top: 0;">Manage SKUs</h3>
                        <input id="skuSearchInput" list="skuList" style="width: 100%;" placeholder="Type to search...">
                        <datalist id="skuList"></datalist>
                        <button id="deleteSkuBtn" style="margin-top: 10px;">Delete Selected SKU</button>
                        <div id="skuDeleteStatus" class="status-message"></div>
                    </div>
                `;

                    // Populate dropdowns
                    await Promise.all([
                        populateFontDropdown('skuFontName'),
                        populateSkuDropdown(),
                        populateImageSetDropdown('skuImageSet')
                    ]);

                    // Load SKU settings when selected
                    document.getElementById('skuSearchInput').addEventListener('change', async () => {
                        const sku = document.getElementById('skuSearchInput').value;
                        if (!sku) return;

                        const settings = await getSkuSettings(sku);
                        if (!settings) {
                            showStatus('Settings not found for selected SKU', 'error', 'skuSaveStatus');
                            return;
                        }

                        document.getElementById('skuSetInput').value = sku;
                        document.getElementById('skuFontName').value = settings.fontName || '';
                        document.getElementById('skuFillColor').value = settings.fillColor || '#5EE2E9';
                        document.getElementById('skuStrokeColor').value = settings.strokeColor || '#000000';
                        document.getElementById('skuStrokeWidth').value = settings.strokeWidth || 6;
                        document.getElementById('skuImageSet').value = settings.imageSet || '';
                        document.getElementById('skuSpacing').value = settings.space || 200;
                        document.getElementById('skuAngle').value = settings.angle || 0;
                        document.getElementById('skuDriveId').value = settings.driveId || '';

                        showStatus(`${sku} settings loaded`, 'success', 'skuSaveStatus');
                    });

                    // Save SKU settings
                    document.getElementById('saveSkuBtn').addEventListener('click', async () => {
                        const sku = document.getElementById('skuSetInput').value.trim();
                        const fontName = document.getElementById('skuFontName').value.trim();
                        const fillColor = document.getElementById('skuFillColor').value;
                        const strokeColor = document.getElementById('skuStrokeColor').value;
                        const strokeWidth = parseInt(document.getElementById('skuStrokeWidth').value);
                        const imageSet = document.getElementById('skuImageSet').value;
                        const space = parseInt(document.getElementById('skuSpacing').value);
                        const angle = parseInt(document.getElementById('skuAngle').value);
                        const driveId = document.getElementById('skuDriveId').value;
                        if (!sku) {
                            showStatus('SKU is required', 'error', 'skuSaveStatus');
                            return;
                        }

                        if (!fontName && !imageSet) {
                            showStatus('Either font name or image set is required', 'error', 'skuSaveStatus');
                            return;
                        }

                        try {
                            await saveSkuSettings(sku, {
                                fontName,
                                fillColor,
                                strokeColor,
                                strokeWidth,
                                imageSet: imageSet || null,
                                space,
                                angle,
                                driveId
                            });

                            showStatus(`${sku} settings saved successfully`, 'success', 'skuSaveStatus');
                            await populateSkuDropdown();
                        } catch (error) {
                            showStatus(`Error saving settings: ${error.message}`, 'error', 'skuSaveStatus');
                        }
                    });

                    // Delete SKU
                    document.getElementById('deleteSkuBtn').addEventListener('click', async () => {
                        const sku = document.getElementById('skuSearchInput').value;
                        if (!sku) {
                            showStatus('No SKU selected', 'error', 'skuDeleteStatus');
                            return;
                        }

                        if (confirm(`Are you sure you want to delete "${sku}" settings?`)) {
                            try {
                                await deleteSkuSettings(sku);
                                showStatus(`${sku} deleted successfully`, 'success', 'skuDeleteStatus');
                                await populateSkuDropdown();

                                // Clear form
                                document.getElementById('skuSetInput').value = '';
                                document.getElementById('skuFontName').value = '';
                                document.getElementById('skuFillColor').value = '#5EE2E9';
                                document.getElementById('skuStrokeColor').value = '#000000';
                                document.getElementById('skuStrokeWidth').value = 6;
                                document.getElementById('skuImageSet').value = '';
                                document.getElementById('skuSpacing').value = 200;
                                document.getElementById('skuAngle').value = 0;
                                document.getElementById('skuDriveId').value = '';
                            } catch (error) {
                                showStatus(`Error deleting SKU: ${error.message}`, 'error', 'skuDeleteStatus');
                            }
                        }
                    });
                    break;

                case 'font':
                    content.innerHTML = `
                    <div>
                        <label>Font Name</label>
                        <input type="text" id="fontNameInput" placeholder="e.g. BebasNeue" />
                    </div>
                    <div>
                        <label>Font File (.woff, .woff2)</label>
                        <input type="file" id="fontFileInput" accept=".woff,.woff2" />
                    </div>
                    <button id="saveFontBtn">Save Font</button>
                    <div id="fontSaveStatus" class="status-message"></div>

                    <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
                        <h3 style="margin-top: 0;">Manage Fonts</h3>
                        <select id="fontListDropdown" style="width: 100%;"></select>
                        <button id="deleteFontBtn" style="margin-top: 10px;">Delete Selected Font</button>
                        <div id="fontDeleteStatus" class="status-message"></div>
                    </div>
                `;

                    await populateFontDropdown();

                    document.getElementById('saveFontBtn').addEventListener('click', async () => {
                        const name = document.getElementById('fontNameInput').value.trim();
                        const file = document.getElementById('fontFileInput').files[0];

                        if (!name || !file) {
                            showStatus('Font name and file are required', 'error', 'fontSaveStatus');
                            return;
                        }

                        const reader = new FileReader();
                        reader.onload = async () => {
                            try {
                                await saveImage(`font_${name}`, JSON.stringify({
                                    base64: reader.result,
                                    name
                                }));
                                showStatus(`Font "${name}" saved successfully`, 'success', 'fontSaveStatus');
                                await populateFontDropdown();
                                await populateFontDropdown('skuFontName');
                            } catch (error) {
                                showStatus(`Error saving font: ${error.message}`, 'error', 'fontSaveStatus');
                            }
                        };
                        reader.onerror = () => {
                            showStatus('Error reading font file', 'error', 'fontSaveStatus');
                        };
                        reader.readAsDataURL(file);
                    });

                    document.getElementById('deleteFontBtn').addEventListener('click', async () => {
                        const fontName = document.getElementById('fontListDropdown').value;
                        if (!fontName) {
                            showStatus('No font selected', 'error', 'fontDeleteStatus');
                            return;
                        }

                        if (confirm(`Are you sure you want to delete "${fontName}" font?`)) {
                            try {
                                await deleteImage(`font_${fontName}`);
                                showStatus(`Font "${fontName}" deleted`, 'success', 'fontDeleteStatus');
                                await populateFontDropdown();
                                await populateFontDropdown('skuFontName');
                            } catch (error) {
                                showStatus(`Error deleting font: ${error.message}`, 'error', 'fontDeleteStatus');
                            }
                        }
                    });
                    break;

                case 'image-text':
                    content.innerHTML = `
                    <div>
                        <label>Character Set Name</label>
                        <input type="text" id="charSetName" placeholder="e.g. NeonNumbers" />
                    </div>
                    <div>
                        <label>Character Images (PNG, JPG)</label>
                        <input type="file" id="charImagesInput" multiple accept="image/*" />
                    </div>
                    <div>
                        <label>Default Spacing (px)</label>
                        <input type="number" id="charSetSpacing" value="200" min="0" />
                    </div>
                    <div id="charPreviewContainer"></div>
                    <button id="saveCharSetBtn">Save Character Set</button>
                    <div id="charSaveStatus" class="status-message"></div>

                    <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
                        <h3 style="margin-top: 0;">Manage Character Sets</h3>
                        <select id="charSetDropdown" style="width: 100%;"></select>
                        <button id="deleteCharSetBtn" style="margin-top: 10px;">Delete Selected Set</button>
                        <div id="charDeleteStatus" class="status-message"></div>
                    </div>
                `;

                    await populateImageSetDropdown('charSetDropdown');

                    // Character image preview
                    document.getElementById('charImagesInput').addEventListener('change', function(e) {
                        const container = document.getElementById('charPreviewContainer');
                        container.innerHTML = '';

                        Array.from(e.target.files).forEach(file => {
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                const img = document.createElement('img');
                                img.src = e.target.result;
                                img.title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
                                img.style.maxHeight = '50px';
                                img.style.margin = '5px';
                                container.appendChild(img);
                            };
                            reader.readAsDataURL(file);
                        });
                    });

                    // Save character set
                    document.getElementById('saveCharSetBtn').addEventListener('click', async () => {
                        const setName = document.getElementById('charSetName').value.trim();
                        const files = document.getElementById('charImagesInput').files;
                        const spacing = parseInt(document.getElementById('charSetSpacing').value) || 200;

                        if (!setName) {
                            showStatus('Character set name is required', 'error', 'charSaveStatus');
                            return;
                        }

                        if (files.length === 0) {
                            showStatus('At least one character image is required', 'error', 'charSaveStatus');
                            return;
                        }

                        try {
                            const charImages = {};
                            const uploads = Array.from(files).map(file => {
                                return new Promise((resolve) => {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        const charName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
                                        charImages[charName] = reader.result;
                                        resolve();
                                    };
                                    reader.readAsDataURL(file);
                                });
                            });

                            await Promise.all(uploads);

                            await saveImage(`charset_${setName}`, JSON.stringify({
                                images: charImages,
                                spacing: spacing,
                                createdAt: new Date().toISOString()
                            }));

                            showStatus(`Character set "${setName}" saved`, 'success', 'charSaveStatus');
                            await populateImageSetDropdown('charSetDropdown');
                            await populateImageSetDropdown('skuImageSet');
                        } catch (error) {
                            showStatus(`Error saving character set: ${error.message}`, 'error', 'charSaveStatus');
                        }
                    });

                    // Delete character set
                    document.getElementById('deleteCharSetBtn').addEventListener('click', async () => {
                        const setName = document.getElementById('charSetDropdown').value;
                        if (!setName) {
                            showStatus('No character set selected', 'error', 'charDeleteStatus');
                            return;
                        }

                        if (confirm(`Delete character set "${setName}"?`)) {
                            try {
                                await deleteImage(`charset_${setName}`);
                                showStatus(`Character set "${setName}" deleted`, 'success', 'charDeleteStatus');
                                await populateImageSetDropdown('charSetDropdown');
                                await populateImageSetDropdown('skuImageSet');
                            } catch (error) {
                                showStatus(`Error deleting character set: ${error.message}`, 'error', 'charDeleteStatus');
                            }
                        }
                    });
                    break;
            }
        };

        // Helper functions
        const togglePanelVisibility = () => {
            const panel = document.getElementById('mainToolPanel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            if (panel.style.display === 'block') {
                loadTabContent(document.querySelector('.tab-button.active').dataset.tab);
            }
        };

        const showStatus = (message, type, elementId = null) => {
            const element = elementId ? document.getElementById(elementId) : document.getElementById('statusMessage');
            if (!element) return;

            element.textContent = message;
            element.className = `status-message ${type}`;

            if (type === 'success') {
                setTimeout(() => {
                    element.textContent = '';
                    element.className = 'status-message';
                }, 3000);
            }
        };

        const populateFontDropdown = async (dropdownId = 'fontListDropdown') => {
            const keys = await GM.listValues();
            const fontKeys = keys.filter(k => k.startsWith('font_')).map(k => k.replace('font_', ''));
            const select = document.getElementById(dropdownId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = fontKeys.map(k => `<option value="${k}">${k}</option>`).join('');

                if (dropdownId === 'skuFontName') {
                    select.innerHTML = '<option value="">Select Font</option>' + select.innerHTML;
                }

                if (currentValue && fontKeys.includes(currentValue)) {
                    select.value = currentValue;
                }
            }
        };

        const populateSkuDropdown = async () => {
            const keys = await GM.listValues();
            const skuKeys = keys.filter(k => k.startsWith('sku_')).map(k => k.replace('sku_', ''));
            const datalist = document.getElementById('skuList');
            const input = document.getElementById('skuSearchInput');
            if (datalist && input) {
                const currentValue = input.value;
                datalist.innerHTML = skuKeys.map(k => `<option value="${k}">`).join('');
                if (currentValue && skuKeys.includes(currentValue)) {
                    input.value = currentValue;
                }
            }
        };

        const populateImageSetDropdown = async (dropdownId) => {
            const keys = await GM.listValues();
            const setKeys = keys.filter(k => k.startsWith('charset_')).map(k => k.replace('charset_', ''));
            const select = document.getElementById(dropdownId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = setKeys.map(k => `<option value="${k}">${k}</option>`).join('');
                if (dropdownId === 'skuImageSet') {
                    select.innerHTML = '<option value="">None (Use Font)</option>' + select.innerHTML;
                }
                if (currentValue && setKeys.includes(currentValue)) {
                    select.value = currentValue;
                }
            }
        };

        // Initialize the system
        createMainButton();
        createMainPanel();
    };

    function blobWith300DPI(blob) {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
                const byteArray = new Uint8Array(reader.result);
                // pHYs chunk ekle: 11811 px/m = 300 dpi
                const dpiChunk = createPngPhysChunk(11811, 11811);
                const modified = insertAfterIHDR(byteArray, dpiChunk);
                resolve(new Blob([modified], { type: 'image/png' }));
            };
            reader.readAsArrayBuffer(blob);
        });
    }

    function createPngPhysChunk(ppux, ppuy) {
        const chunk = new Uint8Array(21);
        const view = new DataView(chunk.buffer);
        view.setUint32(0, 9); // length
        chunk.set([112, 72, 89, 115], 4); // 'pHYs'
        view.setUint32(8, ppux); // pixels per unit X
        view.setUint32(12, ppuy); // pixels per unit Y
        chunk[16] = 1; // unit is meter
        const crc = crc32(chunk.slice(4, 17));
        view.setUint32(17, crc);
        return chunk;
    }

    function insertAfterIHDR(png, chunk) {
        const signature = 8;
        let i = signature;
        while (i < png.length) {
            const len = (png[i] << 24) | (png[i + 1] << 16) | (png[i + 2] << 8) | png[i + 3];
            const type = String.fromCharCode(png[i + 4], png[i + 5], png[i + 6], png[i + 7]);
            if (type === 'IHDR') {
                const before = png.slice(0, i + 8 + len + 4);
                const after = png.slice(i + 8 + len + 4);
                return new Uint8Array([...before, ...chunk, ...after]);
            }
            i += 8 + len + 4;
        }
        return png;
    }

    // CRC32 helper (minimal)
    function crc32(buf) {
        let table = new Uint32Array(256).map((_, k) => {
            let c = k;
            for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            return c;
        });
        let crc = -1;
        for (let i = 0; i < buf.length; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
        }
        return (~crc) >>> 0;
    }

    const trimCanvas = (canvas) => {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        let top = null, bottom = null, left = null, right = null;

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                if (pixels[idx + 3] !== 0) {
                    if (top === null) top = y;
                    bottom = y;
                    if (left === null || x < left) left = x;
                    if (right === null || x > right) right = x;
                }
            }
        }

        if (top === null) return canvas; // boşsa geri dön

        const w = right - left + 1;
        const h = bottom - top + 1;
        const trimmed = document.createElement('canvas');
        trimmed.width = w;
        trimmed.height = h;
        const tCtx = trimmed.getContext('2d');
        tCtx.putImageData(ctx.getImageData(left, top, w, h), 0, 0);
        return trimmed;
    };

    const trimCanvasWithPadding = (canvas, padding = 40) => {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        let top = null, bottom = null, left = null, right = null;

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                if (pixels[idx + 3] !== 0) {
                    if (top === null) top = y;
                    bottom = y;
                    if (left === null || x < left) left = x;
                    if (right === null || x > right) right = x;
                }
            }
        }

        if (top === null) return canvas;

        const w = right - left + 1;
        const h = bottom - top + 1;
        const trimmed = document.createElement('canvas');
        trimmed.width = w + padding * 2;
        trimmed.height = h + padding * 2;
        const tCtx = trimmed.getContext('2d');

        tCtx.clearRect(0, 0, trimmed.width, trimmed.height);
        tCtx.drawImage(canvas, left, top, w, h, padding, padding, w, h);
        return trimmed;
    };

    const injectFontFromStorage = async (fontData) => {
        const parsedData = JSON.parse(fontData)
        const {name, base64} = parsedData
        const url = `url(${base64})`

        const fontFace = new FontFace(
            name, url,
            { display: 'swap' }
        );

        // 3. Fontu yükle
        await fontFace.load();
        document.fonts.add(fontFace);

        // 4. Yükleme kontrolü
        await document.fonts.ready;
        if (!document.fonts.check(`12px ${name}`)) {
            throw new Error('Font sistem tarafından tanınmadı');
        }

        return fontFace;
    };

    const generateImageWithSKUSettings = async (sku, text, color, font) => {
        let fontName, fillColor = '#000000', strokeColor = '#000000', strokeWidth = 0;

        if (font && color) {
            fontName = font;
            fillColor = color;
        } else {
            const settings = await getSkuSettings(sku);
            if (!settings) {
                alert(`"${sku}" için ayar bulunamadı`);
                return null;
            }
            ({ fontName, fillColor, strokeColor, strokeWidth } = settings);
            if (!fontName) {
                alert(`No font set defined for SKU ${sku}`);
                return null;
            }
        }

        const fontSetData = await getImage(`font_${fontName}`);
        if (!fontSetData) {
            alert(`Font set "${fontName}" not found`);
            return null;
        }

        try {
            const fontface = await injectFontFromStorage(fontSetData);
            if (fontface.family !== fontName) throw new Error(`Font isimleri uyumsuz: ${fontface.family} !== ${fontName}`);
        } catch (error) {
            console.error("injectFontFromStorage:", error);
        }

        const lines = text.replace(/\\n/g, '\n').split('\n');
        const maxCanvasWidth = 3000;
        const padding = 40;
        const maxContentWidth = maxCanvasWidth - padding * 2;

        const tempCanvas = new OffscreenCanvas(1, 1);
        const tempCtx = tempCanvas.getContext('2d');

        const baseFontSize = 600;
        let fontSize = baseFontSize;
        let textWidths = [], textHeights = [];

        do {
            tempCtx.font = `${fontSize}px '${fontName}'`;
            textWidths = lines.map(line => tempCtx.measureText(line).width);
            textHeights = lines.map(line => {
                const m = tempCtx.measureText(line);
                return m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
            });
            fontSize -= 10;
        } while (Math.max(...textWidths) > maxContentWidth && fontSize > 10);

        const totalHeight = textHeights.reduce((a, b) => a + b, 0) * 1.2;
        const canvasWidth = Math.max(...textWidths) + padding * 2;
        const canvasHeight = totalHeight + padding * 2;

        const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.font = `${fontSize}px '${fontName}'`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.imageSmoothingEnabled = true;

        const x = canvas.width / 2;
        let y = (canvas.height - totalHeight) / 2;

        for (let i = 0; i < lines.length; i++) {
            y += textHeights[i] * 1.2 / 2;
            if (strokeWidth > 0) {
                const scaleFactor = fontSize / baseFontSize;
                ctx.lineWidth = strokeWidth * scaleFactor;
                ctx.strokeStyle = strokeColor;
                ctx.strokeText(lines[i], x, y);
            }
            ctx.fillStyle = fillColor;
            ctx.fillText(lines[i], x, y);
            y += textHeights[i] * 0.6;
        }

        const trimmed = trimCanvas(canvas);
        return new Promise(resolve => {
            trimmed.toBlob(async blob => {
                const withDPI = await blobWith300DPI(blob);
                resolve(withDPI);
            }, 'image/png', 1.0);
        });
    };


    const generateImageWithCharacterImages = async (sku, text,charset) => {
        try {
            let imageSet, space = 200, angle = 0 ;

            if (charset) {
               imageSet = charset
            }else{
            // 1. SKU ayarlarını yeni sistemle al
            const settings = await getSkuSettings(sku);

            if (!settings) {
                alert(`"${sku}" için ayar bulunamadı`);
                return null;
            }

            // 2. Gerekli ayarları al
            ; ({ imageSet, space, angle } = settings);
            if (!imageSet) {
                alert(`No image set defined for SKU ${sku}`);
                return null;
            }
            }

            // 3. Karakter setini IndexedDB'den al
            const charSetData = await getImage(`charset_${imageSet}`);
            if (!charSetData) {
                alert(`Character set "${imageSet}" not found`);
                return null;
            }

            // 4. Karakter verilerini parse et
            let charImages;
            try {
                const parsedData = JSON.parse(charSetData);
                charImages = parsedData.images || parsedData; // Eski format desteği
                //const spacing = parsedData.spacing;
            } catch (e) {
                console.error('Character set parse error:', e);
                return null;
            }

            const finalSpacing = space;
            const padding = finalSpacing * 2;

            // 5. Metni satırlara ayır ve karakterleri yükle
            const lines = text.split(':');
            const linesData = [];
            let originalMaxLineWidth = 0;
            let originalTotalHeight = 0;
            let maxCharHeight = 0;

            for (const line of lines) {
                const lineData = {
                    chars: [],
                    width: 0,
                    height: 0
                };

                for (const char of line) {
                    const charKey = char.toUpperCase();
                    if (!charImages[charKey]) {
                        console.warn(`No image found for character: ${charKey}`);
                        continue;
                    }

                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.src = charImages[charKey];
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = () => reject(new Error(`Failed to load ${charKey}`));
                    });

                    lineData.chars.push({
                        img: img,
                        width: img.width,
                        height: img.height,
                        char: charKey
                    });

                    lineData.width += img.width;
                    lineData.height = Math.max(lineData.height, img.height);

                    if (char !== line[line.length - 1]) {
                        lineData.width += finalSpacing;
                    }
                }

                if (lineData.chars.length > 0) {
                    originalMaxLineWidth = Math.max(originalMaxLineWidth, lineData.width);
                    maxCharHeight = Math.max(maxCharHeight, lineData.height);
                    linesData.push(lineData);
                }
            }

            if (linesData.length === 0) {
                alert('No valid characters found for the given text');
                return null;
            }

            // 6. Canvas boyutlarını hesapla
            originalTotalHeight = maxCharHeight * linesData.length +
                (finalSpacing * 2) * (linesData.length - 1);

            const maxContentWidth = 3000 - padding * 2;
            const scaleFactor = Math.min(
                1,
                maxContentWidth / originalMaxLineWidth,
                3000 / originalTotalHeight
            );

            // 7. Ana canvas'ı oluştur
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(originalMaxLineWidth * scaleFactor, maxContentWidth) + padding * 2;
            canvas.height = originalTotalHeight * scaleFactor + padding * 2;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // 8. Karakterleri çiz
            let currentY = (canvas.height - (originalTotalHeight * scaleFactor)) / 2;

            for (const lineData of linesData) {
                const lineHeight = lineData.height * scaleFactor;
                let currentX = (canvas.width - (lineData.width * scaleFactor)) / 2;

                for (const charData of lineData.chars) {
                    const scaledWidth = charData.width * scaleFactor;
                    const scaledHeight = charData.height * scaleFactor;

                    ctx.save();
                    ctx.drawImage(
                        charData.img,
                        0, 0, charData.width, charData.height,
                        currentX, currentY + (maxCharHeight * scaleFactor - scaledHeight),
                        scaledWidth, scaledHeight
                    );
                    ctx.restore();

                    currentX += scaledWidth;
                    if (charData !== lineData.chars[lineData.chars.length - 1]) {
                        currentX += finalSpacing * scaleFactor;
                    }
                }

                if (lineData !== linesData[linesData.length - 1]) {
                    currentY += maxCharHeight * scaleFactor + (finalSpacing * 2) * scaleFactor;
                }
            }

            // 9. Döndürme işlemi
            let resultCanvas = canvas;
            if (angle !== 0) {
                resultCanvas = await rotateCanvas(canvas, angle);
            }

            // 10. Transparan kenarları temizle
            resultCanvas = trimCanvas(resultCanvas);

            // 11. DPI ayarı (300 DPI için)
            const finalCanvas = await scaleForPrintDPI(resultCanvas);

            // 12. Sonucu Blob olarak döndür
            return new Promise(resolve => {
                finalCanvas.toBlob(blob => {
                    resolve(blob);
                }, 'image/png', 1.0);
            });

        } catch (error) {
            console.error('Image generation failed:', error);
            alert(`Error generating image: ${error.message}`);
            return null;
        }
    };

    // Yardımcı fonksiyonlar
    const rotateCanvas = async (canvas, angle) => {
        const radians = angle * Math.PI / 180;
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));

        const rotatedWidth = Math.min(
            3000,
            Math.ceil(canvas.width * cos + canvas.height * sin)
        );
        const rotatedHeight = Math.ceil(canvas.width * sin + canvas.height * cos);

        const rotatedCanvas = document.createElement('canvas');
        rotatedCanvas.width = rotatedWidth;
        rotatedCanvas.height = rotatedHeight;
        const rotatedCtx = rotatedCanvas.getContext('2d');

        rotatedCtx.fillStyle = 'rgba(0,0,0,0)';
        rotatedCtx.fillRect(0, 0, rotatedWidth, rotatedHeight);

        rotatedCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
        rotatedCtx.rotate(radians);
        rotatedCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

        return rotatedCanvas;
    };

    const scaleForPrintDPI = async (canvas) => {
        const dpiScale = 300 / 96;
        let scaledWidth = Math.round(canvas.width * dpiScale);
        let scaledHeight = Math.round(canvas.height * dpiScale);

        const maxDim = 3000;
        if (scaledWidth > maxDim || scaledHeight > maxDim) {
            const scaleFactor = Math.min(maxDim / scaledWidth, maxDim / scaledHeight);
            scaledWidth = Math.round(scaledWidth * scaleFactor);
            scaledHeight = Math.round(scaledHeight * scaleFactor);
        }

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = scaledWidth;
        outputCanvas.height = scaledHeight;
        const outputCtx = outputCanvas.getContext('2d');

        outputCtx.imageSmoothingEnabled = true;
        outputCtx.imageSmoothingQuality = 'high';
        outputCtx.drawImage(
            canvas,
            0, 0, canvas.width, canvas.height,
            0, 0, scaledWidth, scaledHeight
        );

        return outputCanvas;
    };

    async function uploadGeneratedImage(blob, sku, text, el) {
        const fileInput = el.querySelector('input[type="file"].mud-width-full');
        if (!fileInput) throw new Error("Dosya yükleme alanı bulunamadı");

        // Create object URL and register it for cleanup
        const blobUrl = URL.createObjectURL(blob);
        blobRegistry.set(blobUrl, blob);

        const dataTransfer = new DataTransfer();

        // Clear all previous files - this is the key change
        // We're not keeping any previous files, we'll only upload the new one
        // If you want to keep some files, you can modify this logic

        // Add new file with unique name
        const fileName = `${sku}-${text.replace(/\s+/g, '-')}-${Date.now()}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        dataTransfer.items.add(file);

        // Update input and trigger change
        fileInput.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);

        // Schedule cleanup after upload is complete
        setTimeout(() => cleanupBlob(blob), 1000);
    }

    // Improved unique ID generator
    const generateUniqueId = () => {
        return 'personalization-' + crypto.randomUUID(); // Modern browsers
    };

    function cleanupBlob(blob) {
        // Find and revoke any object URLs created for this blob
        blobRegistry.forEach((storedBlob, url) => {
            if (storedBlob === blob) {
                URL.revokeObjectURL(url);
                blobRegistry.delete(url);
            }
        });
    }

    // Cleanup all BLOBs when window unloads
    window.addEventListener('beforeunload', () => {
        blobRegistry.forEach((blob, url) => {
            URL.revokeObjectURL(url);
        });
        blobRegistry.clear();
    });

    // Database bağlantı fonksiyonları
    const openImageDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ImageStorageDB', 2); // Versiyon 2'ye çıkarıldı

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('images')) {
                    db.createObjectStore('images', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('skuSettings')) {
                    const store = db.createObjectStore('skuSettings', { keyPath: 'id' });
                    // Index'ler eklenebilir
                    store.createIndex('by_fontName', 'fontName', { unique: false });
                    store.createIndex('by_imageSet', 'imageSet', { unique: false });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    // SKU Yönetim Fonksiyonları
    const setSkuSettings = async (sku, driveId) => {
        const old = await getSkuSettings(sku);
        await saveSkuSettings(sku, {
            ...old,
            driveId
        });
    }

    // SKU Yönetim Fonksiyonları
    const saveSkuSettings = async (sku, settings) => {
        const key = `sku_${sku}`;
        const db = await openImageDB();

        try {
            // Veriyi hazırla
            const skuRecord = {
                id: key,
                ...settings,
                lastUpdated: Date.now(),
                version: 2 // Data yapısı versiyonu
            };

            // IndexedDB'ye kaydet
            await new Promise((resolve, reject) => {
                const tx = db.transaction('skuSettings', 'readwrite');
                tx.objectStore('skuSettings').put(skuRecord);
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
            });

            // GM_setValue'da önbellek tut
            await GM.setValue(key, {
                storageType: 'indexedDB',
                cache: {
                    fontName: settings.fontName,
                    hasImageSet: !!settings.imageSet,
                    lastUpdated: Date.now()
                }
            });

            return true;
        } catch (error) {
            console.error('IndexedDB save error, falling back to GM_setValue:', error);

            // Fallback: GM_setValue'ya kaydet
            await GM.setValue(key, {
                ...settings,
                storageType: 'GM_setValue',
                lastUpdated: Date.now()
            });

            return false;
        }
    };

    const getSkuSettings = async (sku) => {
        const key = `sku_${sku}`;

        try {
            // Önce GM önbelleğine bak
            const cached = await GM.getValue(key);
            if (cached?.storageType === 'indexedDB') {
                const db = await openImageDB();
                const settings = await new Promise((resolve, reject) => {
                    const tx = db.transaction('skuSettings', 'readonly');
                    const request = tx.objectStore('skuSettings').get(key);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                if (settings) return settings;
            }

            // Eski GM_setValue formatını kontrol et
            if (cached && !cached.storageType) {
                // Eski veriyi yeni sisteme taşı
                await saveSkuSettings(sku, cached);
                return cached;
            }

            return null;
        } catch (error) {
            console.error('Error getting SKU settings:', error);
            return null;
        }
    };

    const deleteSkuSettings = async (sku) => {
        const key = `sku_${sku}`;

        try {
            // IndexedDB'den sil
            try {
                const db = await openImageDB();
                await new Promise((resolve, reject) => {
                    const tx = db.transaction('skuSettings', 'readwrite');
                    const request = tx.objectStore('skuSettings').delete(key);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            } catch (err) {
                console.warn('IndexedDB delete failed for SKU:', err);
            }

            // GM storage'dan sil
            try {
                await GM.deleteValue(key);
            } catch (err) {
                console.warn('GM.deleteValue failed for SKU:', err);
            }

            return true;
        } catch (error) {
            console.error('Error deleting SKU settings:', error);
            return false;
        }
    };

    // Resim Yönetim Fonksiyonları
    const deleteImageFromDB = async (id) => {
        const db = await openImageDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('images', 'readwrite');
            const request = tx.objectStore('images').delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    };

    const saveImageToDB = async (id, imageData) => {
        const db = await openImageDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('images', 'readwrite');
            tx.objectStore('images').put({
                id,
                data: imageData,
                lastUpdated: Date.now()
            });
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    };

    const getImageFromDB = async (id) => {
        const db = await openImageDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('images', 'readonly');
            const request = tx.objectStore('images').get(id);
            request.onsuccess = () => resolve(request.result?.data);
            request.onerror = () => reject(request.error);
        });
    };

    const deleteImage = async (key) => {
        try {
            await deleteImageFromDB(key);
        } catch (e) {
            console.warn('IndexedDB delete failed:', e);
        }

        try {
            await GM.deleteValue(key);
        } catch (e) {
            console.warn('GM delete failed:', e);
        }

        return true;
    };

    const saveImage = async (key, imageData) => {
        try {
            await saveImageToDB(key, imageData);
            await GM.setValue(key, {
                storageType: 'indexedDB',
                timestamp: Date.now(),
                size: imageData.length
            });
            return true;
        } catch (error) {
            console.warn('IndexedDB save failed, falling back:', error);

            if (imageData.length < 500000) {
                await GM.setValue(key, {
                    storageType: 'GM_setValue',
                    data: imageData,
                    timestamp: Date.now()
                });
                return true;
            }

            throw new Error('Image too large for GM_setValue');
        }
    };

    const getImage = async (key) => {
        const meta = await GM.getValue(key);
        if (!meta) return null;

        try {
            if (meta.storageType === 'indexedDB') {
                return await getImageFromDB(key);
            }
            return meta.data;
        } catch (error) {
            console.error('Error loading image:', error);
            return null;
        }
    };

    async function exportAllDatadb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ImageStorageDB');

            request.onerror = () => reject('Veritabanı açılamadı');

            request.onsuccess = async () => {
                const db = request.result;
                const transaction = db.transaction(['skuSettings', 'images'], 'readonly');

                const skuStore = transaction.objectStore('skuSettings');
                const imgStore = transaction.objectStore('images');

                const exportData = {};

                const readStore = (store, isImageStore = false) => new Promise((res, rej) => {
                    const data = {};
                    const cursorReq = store.openCursor();

                    cursorReq.onerror = () => rej(`Cursor hatası: ${store.name}`);
                    cursorReq.onsuccess = e => {
                        const cursor = e.target.result;
                        if (cursor) {
                            // Image verileri için özel işleme
                            if (isImageStore && cursor.value.data instanceof Blob) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                    data[cursor.key] = {
                                        ...cursor.value,
                                        data: reader.result // Blob'u base64'e çevir
                                    };
                                    cursor.continue();
                                };
                                reader.onerror = () => rej('Blob okuma hatası');
                                reader.readAsDataURL(cursor.value.data);
                            } else {
                                data[cursor.key] = cursor.value;
                                cursor.continue();
                            }
                        } else {
                            res(data);
                        }
                    };
                });

                try {
                    exportData.skuSettings = await readStore(skuStore);
                    exportData.images = await readStore(imgStore, true); // images için özel işleme

                    const dataStr = JSON.stringify(exportData, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ImageStorageDB_backup_${new Date().toISOString().slice(0,10)}.json`;
                    document.body.appendChild(a);
                    a.click();

                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);

                    resolve('Veriler başarıyla dışa aktarıldı');
                } catch (err) {
                    reject('Veri okuma hatası: ' + err);
                }
            };
        });
    }


    async function importAllDatadb(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onerror = () => reject('Dosya okunamadı');
            reader.onload = async () => {
                try {
                    const json = JSON.parse(reader.result);
                    const request = indexedDB.open('ImageStorageDB', 1);

                    request.onerror = () => reject('Veritabanı açılamadı');

                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;

                        if (!db.objectStoreNames.contains('skuSettings')) {
                            db.createObjectStore('skuSettings', { keyPath: 'id' });
                        }

                        if (!db.objectStoreNames.contains('images')) {
                            db.createObjectStore('images', { keyPath: 'id' });
                        }
                    };

                    request.onsuccess = () => {
                        const db = request.result;
                        const transaction = db.transaction(['skuSettings', 'images'], 'readwrite');

                        const skuStore = transaction.objectStore('skuSettings');
                        const imgStore = transaction.objectStore('images');

                        // SKU ayarlarını işle
                        for (const [key, value] of Object.entries(json.skuSettings || {})) {
                            if (!value.id) value.id = key;
                            skuStore.put(value);
                        }

                        // Resim verilerini işle
                        const processImageItem = async (key, value) => {
                            const item = { ...value };

                            // Base64 string'ini Blob'a çevir
                            if (typeof item.data === 'string' && item.data.startsWith('data:')) {
                                const response = await fetch(item.data);
                                item.data = await response.blob();
                            }

                            if (!item.id) item.id = key;
                            imgStore.put(item);
                        };

                        // Tüm resim öğelerini işle
                        Promise.all(
                            Object.entries(json.images || {}).map(([key, value]) =>
                                                                  processImageItem(key, value)
                                                                 )
                        ).then(() => {
                            transaction.oncomplete = () => resolve('Veriler başarıyla içe aktarıldı');
                        }).catch(err => {
                            reject('Resim işleme hatası: ' + err);
                        });
                    };
                } catch (err) {
                    reject('JSON parse hatası: ' + err.message);
                }
            };

            reader.readAsText(file);
        });
    }

    /**
    * Tüm GM.setValue verilerini JSON olarak dışa aktarır
    */
    async function exportAllData() {
        try {
            const allKeys = await GM.listValues();
            const allData = {};

            // Tüm verileri topla
            for (const key of allKeys) {
                allData[key] = await GM.getValue(key);
            }

            // JSON'ı dosya olarak indir
            const dataStr = JSON.stringify(allData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `gm_storage_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();

            // Temizlik
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

            return 'Tüm veriler başarıyla dışa aktarıldı!';
        } catch (error) {
            console.error('Dışa aktarma hatası:', error);
            throw new Error('Veriler dışa aktarılırken hata oluştu');
        }
    }

    /**
    * JSON dosyasından tüm verileri geri yükler (tüm eski verileri silerek)
    */
    async function importAllData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const allCurrentKeys = await GM.listValues();

                    // 1. Önce tüm mevcut verileri temizle
                    await clearAllData();

                    // 2. Yeni verileri yükle
                    for (const [key, value] of Object.entries(data)) {
                        await GM.setValue(key, value);
                    }

                    resolve(`Başarıyla yüklendi! ${Object.keys(data).length} öğe eklendi.`);
                } catch (error) {
                    reject(`Yükleme hatası: ${error.message}`);
                }
            };
            reader.onerror = () => reject('Dosya okunamadı');
            reader.readAsText(file);
        });
    }

    /**
    * Tüm GM.setValue verilerini siler
    */
    async function clearAllData() {
        const allKeys = await GM.listValues();
        for (const key of allKeys) {
            await GM.deleteValue(key);
        }
        return `${allKeys.length} öğe silindi.`;
    }

    /**
    * Yükleme/indirme arayüzünü modal olarak oluşturur
    */
    function createUniversalDataManager() {
        // Modal ana container
        const modal = document.createElement('div');
        modal.id = 'dataManagerModal';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.zIndex = '10000';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.flexDirection = 'column';

        // Modal içeriği
        const modalContent = document.createElement('div');
        modalContent.style.position = 'relative';
        modalContent.style.background = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        modalContent.style.width = '350px';
        modalContent.style.maxWidth = '90%';
        modalContent.style.fontFamily = 'Arial, sans-serif';

        // Kapatma butonu
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '15px';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.color = '#aaa';

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Modal içeriği
        modalContent.innerHTML = `
        <h3 style="margin:0 0 15px 0;font-size:18px;color:#333;">Veri Yönetimi</h3>
        <div style="display:flex;flex-direction:column;gap:10px;">
            <button id="exportAllBtn" style="padding:10px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;">
                Tüm Verileri Dışa Aktar
            </button>
            <button id="exportAllBtndb" style="padding:10px;background:#4CA020;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;">
                Tüm db Verileri  Dışa Aktar
            </button>
            <div style="position:relative;">
                <input type="file" id="importAllFile" accept=".json"
                       style="position:absolute;opacity:0;width:0.1px;height:0.1px;">
                <label for="importAllFile"
                       style="display:block;padding:10px;background:#2196F3;color:white;text-align:center;cursor:pointer;border-radius:4px;font-size:14px;">
                    Tüm Verileri İçe Aktar
                </label>
            </div>
            <div style="position:relative;">
                <input type="file" id="importAllFiledb" accept=".json"
                       style="position:absolute;opacity:0;width:0.1px;height:0.1px;">
                <label for="importAllFiledb"
                       style="display:block;padding:10px;background:#2195E3;color:white;text-align:center;cursor:pointer;border-radius:4px;font-size:14px;">
                    Tüm Verileri indexedDb ye aktar
                </label>
            </div>
            <button id="clearAllBtn" style="padding:10px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;">
                Tüm Verileri Temizle
            </button>
        </div>
        <div id="dataManagerStatus" style="margin-top:15px;font-size:13px;min-height:20px;"></div>
    `;

        modalContent.prepend(closeBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Modal dışına tıklayarak kapatma
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Tetikleme butonu (sayfanın sağ alt köşesinde)
        const triggerBtn = document.createElement('button');
        triggerBtn.textContent = 'Veri Yönetimi';
        triggerBtn.style.position = 'fixed';
        triggerBtn.style.bottom = '20px';
        triggerBtn.style.right = '20px';
        triggerBtn.style.zIndex = '9999';
        triggerBtn.style.padding = '10px 15px';
        triggerBtn.style.background = '#333';
        triggerBtn.style.color = 'white';
        triggerBtn.style.border = 'none';
        triggerBtn.style.borderRadius = '4px';
        triggerBtn.style.cursor = 'pointer';
        triggerBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

        triggerBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        document.body.appendChild(triggerBtn);

        // Dışa aktarma butonu
        document.getElementById('exportAllBtn').addEventListener('click', async () => {
            const statusEl = document.getElementById('dataManagerStatus');
            statusEl.textContent = 'Dışa aktarılıyor...';
            statusEl.style.color = '#666';

            try {
                const result = await exportAllData();
                statusEl.textContent = result;
                statusEl.style.color = 'green';
            } catch (error) {
                statusEl.textContent = error.message;
                statusEl.style.color = 'red';
            }

            setTimeout(() => statusEl.textContent = '', 5000);
        });

        // Dışa aktarma butonu
        document.getElementById('exportAllBtndb').addEventListener('click', async () => {
            const statusEl = document.getElementById('dataManagerStatus');
            statusEl.textContent = 'Dışa aktarılıyor...';
            statusEl.style.color = '#666';

            try {
                const result = await exportAllDatadb();
                statusEl.textContent = result;
                statusEl.style.color = 'green';
            } catch (error) {
                statusEl.textContent = error.message;
                statusEl.style.color = 'red';
            }

            setTimeout(() => statusEl.textContent = '', 5000);
        });

        // İçe aktarma işlemi
        document.getElementById('importAllFile').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const statusEl = document.getElementById('dataManagerStatus');
            statusEl.textContent = 'Yükleniyor...';
            statusEl.style.color = '#666';

            try {
                const result = await importAllData(file);
                statusEl.textContent = result;
                statusEl.style.color = 'green';
            } catch (error) {
                statusEl.textContent = error;
                statusEl.style.color = 'red';
            }

            e.target.value = '';
            setTimeout(() => statusEl.textContent = '', 5000);
        });

        // İçe aktarma işlemi db
        document.getElementById('importAllFiledb').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const statusEl = document.getElementById('dataManagerStatus');
            statusEl.textContent = 'Yükleniyor...';
            statusEl.style.color = '#666';

            try {
                const result = await importAllDatadb(file);
                statusEl.textContent = result;
                statusEl.style.color = 'green';
            } catch (error) {
                statusEl.textContent = error;
                statusEl.style.color = 'red';
            }

            e.target.value = '';
            setTimeout(() => statusEl.textContent = '', 5000);
        });

        // Temizleme butonu
        document.getElementById('clearAllBtn').addEventListener('click', async () => {
            if (confirm('TÜM verileriniz kalıcı olarak silinecek. Emin misiniz?')) {
                const statusEl = document.getElementById('dataManagerStatus');
                statusEl.textContent = 'Temizleniyor...';
                statusEl.style.color = '#666';

                try {
                    const result = await clearAllData();
                    statusEl.textContent = result;
                    statusEl.style.color = 'green';
                } catch (error) {
                    statusEl.textContent = error.message;
                    statusEl.style.color = 'red';
                }

                setTimeout(() => statusEl.textContent = '', 3000);
            }
        });
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function last(arr){ return arr && arr.length ? arr[arr.length-1] : null; }

    function safeClick(el){
        if(!el) return false;
        el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));
        el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));
        el.click();
        return true;
    }

    function setInputValue(el, val){
        if(!el) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(el, String(val));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function waitFor(selector, root=document, timeout=10000){
        return new Promise((resolve, reject)=>{
            const found = root.querySelector(selector);
            if(found) return resolve(found);
            const obs = new MutationObserver(()=>{
                const el = root.querySelector(selector);
                if(el){ obs.disconnect(); resolve(el); }
            });
            obs.observe(root === document ? document.documentElement : root, {childList:true, subtree:true});
            setTimeout(()=>{ obs.disconnect(); reject(new Error('Timeout: '+selector)); }, timeout);
        });
    }
    function getScopeFrom(popNode){
        return popNode.closest(".mud-dialog, .mud-dialog-root, .mud-focus-trap-child-container, .mud-focus-trap") || document;
    }

    function getLastOpenDialog(){
        const ds = [...document.querySelectorAll(".mud-dialog, .mud-dialog-root")];
        return last(ds) || document;
    }

    function getFirstPopoverItem(){
        // MudMenu genelde list item’lar açar; birkaç olası seçici deniyoruz
        return document.querySelector(
            ".mud-popover-open .mud-list-item, " +
            ".mud-popover-open [role='menuitem'], " +
            ".mud-popover-open .mud-menu-item, " +
            ".mud-popover-open .mud-list > *"
        );
    }
    function findButtons(popNode) {
        let buttons = popNode.querySelectorAll("div.mudcard-optionsx button");
        let btns
        buttons.forEach(btn => {
            if (btn.querySelector(".mud-icon-root.mud-svg-icon.mud-icon-size-medium.mud-icon-badge")) {
                btns = 5; // Özel ikonu olan
            } else {
                btns = 3; // Diğeri
            }
        });

        return btns;
    }

    // ---- main sequence ----
    async function runSequence(popNode){
        try{
            const scope = getScopeFrom(popNode);

            /*// 1) 3. buton (ilk ayar)
            const btn3 = await waitFor("div.mudcard-optionsx div:nth-child(3) button", scope);
            safeClick(btn3);
            await sleep(1000);

            // 2) Popover - ilk seçenek
            const popItem1 = await waitFor(".mud-popover-open", document);
            const firstItem1 = getFirstPopoverItem();
            if(firstItem1) safeClick(firstItem1);
            await sleep(800);

            // 3) Dialog input = 3, sonra OK
            const dlg1 = getLastOpenDialog();
            const inputs1 = await waitFor("input[id^='mudinput']", dlg1).then(() => dlg1.querySelectorAll("input[id^='mudinput']"));
            const input1 = inputs1[2]; // 0,1,2 -> 3. input
            setInputValue(input1, 3);

            await sleep(400);
            const ok1 = await waitFor("div.mud-dialog-actions button:not([disabled])", dlg1);
            safeClick(ok1);
            await sleep(1000);

            // 4) 5. buton (ikinci ayar)
            //let btn = findButtons(popNode)
            const btn5 = await waitFor("div.mudcard-optionsx div:nth-child(3) button", scope);
            safeClick(btn5);
            await sleep(1000);

            // 5) Popover - ilk seçenek
            const popItem2 = await waitFor(".mud-popover-open", document);
            const firstItem2 = getFirstPopoverItem();
            if(firstItem2) safeClick(firstItem2);
            await sleep(800);

            // 6) Dialog input = 2, sonra OK
            const dlg2 = getLastOpenDialog();
            const inputs2 = await waitFor("input[id^='mudinput']", dlg2).then(() => dlg2.querySelectorAll("input[id^='mudinput']"));
            const input2 = inputs2[2]; // 3. input
            setInputValue(input2, 2);

            await sleep(500);
            const ok2 = await waitFor("div.mud-dialog-actions button:not([disabled])", dlg2);
            safeClick(ok2);*/
            // bitti
        } catch(err){
            console.error("[runSequence] Hata:", err);
        }
    }

    // ---- butonu ekle ----
    async function convertpopNode(popNode){
        if (popNode && !popNode.dataset.contentInserted) {
            popNode.dataset.contentInserted = "true";
            const scope = getScopeFrom(popNode);
            const orderIdNode = await waitFor(selectors.popupOrderId, scope);
            if (!orderIdNode) return;
            const orderId = orderIdNode.textContent.replace("#", "");
            if (orderId) {
                const btnap = document.createElement("button");
                btnap.type = "button";
                const pnap = document.createElement("p");
                pnap.className = "mud-typography mud-typography-subtitle2";
                pnap.style.fontSize = "x-small";
                pnap.textContent = "Gönder";
                btnap.className = "mud-button-root mud-button mud-button-outlined mud-button-outlined-default mud-button-outlined-size-medium mud-ripple mx-1 menu-buttons";
                btnap.addEventListener("click", (e)=>{
                    e.stopPropagation();
                    e.preventDefault();
                    let savedOrders = JSON.parse(localStorage.getItem('orderNumbers') || '[]');
                    if (!savedOrders.includes(orderId)) {
                        savedOrders.push(orderId);
                        localStorage.setItem('orderNumbers', JSON.stringify(savedOrders));
                    }
                    e.target.style.backgroundColor = "green";

                }, { once:false });
                btnap.appendChild(pnap);
                popNode.appendChild(btnap);
                const btn = document.createElement("button");
                btn.type = "button";
                const ptnap = document.createElement("p");
                ptnap.className = "mud-typography mud-typography-subtitle2";
                ptnap.style.fontSize = "x-small";
                ptnap.textContent = "Beklet";
                btn.className = "mud-button-root mud-button mud-button-outlined mud-button-outlined-default mud-button-outlined-size-medium mud-ripple mx-1 menu-buttons";
                btn.addEventListener("click", (e)=>{
                    e.stopPropagation();
                    e.preventDefault();
                    let savedOrdersWait = JSON.parse(localStorage.getItem('orderNumbersWait') || '[]');
                    if (!savedOrdersWait.includes(orderId)) {
                        savedOrdersWait.push(orderId);
                        localStorage.setItem('orderNumbersWait', JSON.stringify(savedOrdersWait));
                    }
                    e.target.style.backgroundColor = "olive";

                }, { once:false });
                btn.appendChild(ptnap);
                popNode.appendChild(btn);
            }else{
                console.log("order no alınamadı")
            }
        }
    }

    // ---- mevcut node varsa hemen ekle ----
    (function initOnce(){
        const existing = document.querySelector(selectors.popupCart);
        if(existing) convertpopNode(existing);
    })();

    function makeHexBox(hex, container=document.body){
        if(!/^#?[0-9a-fA-F]{6}$/.test(hex)) throw new Error("Geçersiz hex");
        if(hex[0] !== '#') hex = '#'+hex;

        const btn = document.createElement('button');
        btn.type = 'button';
        //btn.textContent = hex;
        btn.setAttribute('aria-label', `Renk ${hex} kopyala`);
        btn.title = 'Tıklayınca kopyalar';

        // Stil
        Object.assign(btn.style, {
            backgroundColor: hex,
            border: '1px solid rgba(0,0,0,.15)',
            borderRadius: '6px',
            //padding: '6px 9px',
            minWidth: '24px',
            height: '24px',
            display: 'inline-flex',
            cursor: 'pointer',
            outline: 'none',
            margin: '0px 4px',
            userSelect: 'none'
        });

        // Kontrast için metin rengi
        const r = parseInt(hex.slice(1,3),16),
              g = parseInt(hex.slice(3,5),16),
              b = parseInt(hex.slice(5,7),16);
        const luminance = 0.2126*r + 0.7152*g + 0.0722*b; // 0–255
        btn.style.color = luminance > 150 ? '#111' : '#fff';

        // Tıkla → kopyala
        btn.addEventListener('click', async () => {
            try{
                await navigator.clipboard.writeText(hex);
                const prev = btn.textContent;
                btn.textContent = 'Kopyalandı!';
                btn.style.transition = 'transform .08s ease';
                btn.style.transform = 'scale(0.98)';
                setTimeout(()=>{ btn.style.transform = 'scale(1)'; btn.textContent = prev; }, 650);
            }catch(e){
                // Fallback
                const ta = document.createElement('textarea');
                ta.value = hex; document.body.appendChild(ta); ta.select();
                document.execCommand('copy'); ta.remove();
            }
        });

        container.parentNode.appendChild(btn);
        return btn;
    }

    function addProofButton(imgCutUrl,newColor,aElement) {
        const uploadDiv = document.createElement('div');
        uploadDiv.className = 'mud-tooltip-root mud-tooltip-inline';
        const btn = document.createElement('button');
        btn.innerHTML = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><defs><image  width="14" height="13" id="img1" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAANCAMAAACuAq9NAAAAAXNSR0IB2cksfwAAAPZQTFRFSXieXIufZpWgYpGfTXyeS3mfapGxeJy5cJW0SXeeR3adjr6ioNCkns6kkcGjVIOeSXeepb/S0+Ps1OTs3OnxSnifR3admcmjYpGgSXeeSXeeSXieAAAASXeeWoWo4u71THqga5qgZ4+wSHadf6+iXo2fXIeprcXWSXieUn6jSXieSXieSnifSXieTXqgSnifXICbSnidSXeeXXWZSXieR3advrGPeY+YZHWY0GyBS3ad07uNg5SXaXWY62p8THacoqOTmJ6UjZmVV36cSniehHKRnHCMmXGN8Gp6oKGTw7OOtKuQX4KbSHadoG+Lw22EuW6GSnadfPrvlgAAAFJ0Uk5TB2N4cRUEaHhyEyf7////UBr/////Uir+vWVaCABNnP9VkFsf5XND7UMAFgUCGAEHaCcQahEm+ohR/k/+kFv/VdyupyYIlaXF//P//UkY+P//RUqivaQAAABaSURBVHicY2RgZGQAYkYoxQViQLggQgzG+MPACuZy/WaAALa/GFxlRsbvUC7IGE1Gxo9QrgCQq8/I+BrKBZlqysj4FMqVAZmsyvgAylXExmVFuOo7o7IaspsBU8cOXt0V6UAAAAAASUVORK5CYII="/></defs><style></style><use  href="#img1" x="5" y="5"/></svg>`;
        btn.className = 'mud-button-root mud-icon-button mud-secondary-text hover:mud-secondary-hover mud-ripple mud-ripple-icon';
        btn.title = imgCutUrl;
        uploadDiv.appendChild(btn); // Doğru elementin parentNode'u
        btn.onclick = () => createProof(imgCutUrl,newColor);
        aElement.parentNode.insertBefore(uploadDiv, aElement);
    }

    // HEX kodu buraya örn: #FFFFFF
    function createProof(imgUrls, bgColor) {
        if (!imgUrls) {
            alert('Görseller bulunamadı!');
            return;
        }
        if (!Array.isArray(imgUrls)) imgUrls = [imgUrls];
        const loadImage = src => new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });

        Promise.all(imgUrls.map(loadImage)).then(images => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const canvasWidth = 1000;
            const canvasHeight = 1200; // Tişört alanına göre ayarlanabilir
            const printArea = { x: 50, y: 60, width: 900, height: 1080 }; // Baskı alanı dikdörtgeni

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            images.forEach(img => {
                const scale = Math.min(printArea.width / img.width, printArea.height / img.height);
                const newWidth = img.width * scale;
                const newHeight = img.height * scale;
                const offsetX = printArea.x + (printArea.width - newWidth) / 2;
                const offsetY = printArea.y + (printArea.height - newHeight) / 2;
                ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
            });

            const proofURL = canvas.toDataURL('image/png');
            const w = window.open();
            w.document.write(`<img src="${proofURL}" style="max-width:100%;">`);
        }).catch(err => alert('Görseller yüklenirken hata oluştu: ' + err));
    }


    // Event listener'ları sadece bir kere ekle
    function initSliderListeners(sNode) {
        sNode.querySelectorAll('.mud-carousel [aria-label="Next"], .mud-carousel [aria-label="Previous"]').forEach(btn => {
            if (!btn.dataset.listenerAdded) {
                btn.addEventListener('click', () => {
                    setTimeout(() => reapplyProofLogic(sNode), 500);
                });
                btn.dataset.listenerAdded = "true";
            }
        });
    }

    function reapplyProofLogic(sNode) {
        const shirtColorCuttext = getText(selectors.shirtColorCut, sNode);
        if (!shirtColorCuttext) return;
        console.log("slider");

        const shirtColor = shirtColorCuttext.replace(/[()]/g, "").trim();
        const oldColorRGB = 'rgb(220, 220, 220)';
        const oldColorEmpty = '#dcdcdc';
        const newColor = shirtColors.find(c => c.name === shirtColor)?.hex;
        const designColor = shirtColors.find(c => c.name === shirtColor)?.ischecked == 1 ? "black" : "white";

        const intervalc = setInterval(() => {
            const imgCutmenus = sNode.querySelectorAll(selectors.imgCut);
            if (!imgCutmenus || imgCutmenus.length === 0) return;

            imgCutmenus.forEach(menuNode => {
                const aElement = menuNode.querySelector("div > div > div:nth-child(4)");
                if (!aElement) return;
                const imgCutUrl = aElement.querySelector("a")?.href;
                if (!imgCutUrl) return;
                addProofButton(imgCutUrl, newColor, aElement);
            });

            clearInterval(intervalc);
        }, 300);

        const interval = setInterval(() => {
            const imgColorCutEl = sNode.querySelector(selectors.imgColorCut);
            if (!imgColorCutEl) return;
            imgColorCutEl.querySelectorAll("*").forEach(Node => {
                const style = window.getComputedStyle(Node);
                if (style.backgroundColor.toLowerCase() === oldColorRGB || style.backgroundColor === oldColorEmpty) {
                    Node.style.backgroundColor = newColor;
                    Node.style.borderColor = designColor;
                    Node.style.borderWidth = "8px";
                }
            });
            clearInterval(interval);
        }, 300);

        return newColor;
    }


    window.addEventListener('load', async () => {
        loadConfig();
        initUI();
        checkCheckboxes();
        if (window.location.href.includes("/drop-ship/orders")) {
            createFloatingPanelSystem();
            try {
                const container = await waitForElement('div.mud-paper.navbar', 5000);
                createApproveButton(container);
            } catch {
                console.warn('Container element bulunamadı.');
            }
        }
    });

    function getLinkById(id) {
        const sheetUrl = 'https://script.google.com/macros/s/AKfycbwrgsia2C2-NoxZWGpdA1qrvMPeRn3EUwkzsrpvitNQQzu9VeunN7sPVygSw4dZqBb4/exec';
        const payload = { action: "getLink", sheetName: "order", id: id };

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: sheetUrl,
                data: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
                onload: function(response) {
                    console.log(response.responseText)
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.status === 'success') {
                            showToast('✅ Link istendi');
                            resolve(data.link);
                        } else {
                            showToast('❌ Hata: ' + (data.message || 'Bilinmeyen hata'));
                            reject(data.message);
                        }
                    } catch (e) {
                        showToast('❌ Yanıt işlenemedi');
                        reject(e);
                    }
                },
                onerror: function(error) {
                    showToast('❌ Gönderilemedi: ' + (error.message || 'Bilinmeyen hata'));
                    reject(error);
                }
            });
        });
    }

    function handleMutation(mutationsList) {
        if (window.location.href.includes('customhub.io/drop-ship/approval-pending')) {
            processPage();
        }
        if (window.location.href.includes('customhub.io/drop-ship/orders')) {
            checkCheckboxes();
        }
        mutationsList.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const pNode = node.querySelector(selectors.selector);
                    const cutNode = node.querySelector(selectors.trCut);
                    const salNode = node.querySelector(selectors.salesSummary);
                    if (pNode && !pNode.dataset.processed) convertNode(pNode);
                    if (cutNode && !cutNode.dataset.processed) convertCutNode();
                    if (salNode && !salNode.dataset.processed) convertSalNode(salNode);
                    checkAndInsertEarningContent();

                    const popNode = node.querySelector?.(selectors.popupCart);
                    if (popNode && !popNode.dataset.processed) {
                        convertpopNode(popNode);
                        popNode.dataset.processed = "true";
                    }
                }
            });
        });
    }

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, observerOptions);


})();
