// ==UserScript==
// @name         Etsy Order Recent by hub
// @namespace    https://github.com/cengaver
// @version      2.0
// @description  Etsy Order Recent
// @author       Cengaver
// @match        https://*.customhub.io/*
// @grant        GM.addStyle
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @connect      www.tcmb.gov.tr
// @icon         https://dashboard.k8s.customhub.io/Modernize/assets/images/logos/favicon.png
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyOrderRecentbyhub.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyOrderRecentbyhub.user.js
// ==/UserScript==

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
            font-size: 10px;
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

`);
    // Config yapısı
    const DEFAULT_CONFIG = {
        discount: 25, //indirim yüzde
        feePerc: 52, //fee yüzde
        shipHoodie: 8, //hoodie kargo fiyatı
        shipHoodie2: 3, //ikinci hoodie kargo fiyatı
        shipTee: 5, //tişört ve sweatshirt kargo fiyatı
        shipTee2: 2, //ikinci tişört ve sweatshirt kargo fiyatı
    };

    // Global değişkenler
    let config = {...DEFAULT_CONFIG};
    let toastContainer = null;

    const shirtColors = [
        {"name": "Heather Navy", "ischecked": 0, "hex": "#333F48"},
        {"name": "Heather Mauve", "ischecked": 1, "hex": "#C49BA3"},
        {"name": "Charcoal", "ischecked": 0, "hex": "#4D4D4D"},
        {"name": "Comfort Colors Banana", "ischecked": 1, "hex": "#FCE9A6"},
        {"name": "Comfort Colors Blue Jean", "ischecked": 0, "hex": "#566D7E"},
        {"name": "Comfort Colors Butter", "ischecked": 1, "hex": "#F9E38C"},
        {"name": "Comfort Colors Chalky Mint", "ischecked": 1, "hex": "#A8D5BA"},
        {"name": "Comfort Colors Chambray", "ischecked": 1, "hex": "#A3BFD9"},
        {"name": "Comfort Colors Denim", "ischecked": 0, "hex": "#4F728E"},
        {"name": "Caroline Blue", "ischecked": 1, "hex": "#71B2DB"},
        {"name": "Comfort Colors Burnt Orange", "ischecked": 1, "hex": "#CC5500"},
        {"name": "Comfort Colors Granite", "ischecked": 0, "hex": "#5F5F60"},
        {"name": "Comfort Colors Grey", "ischecked": 0, "hex": "#B2B2B2"},
        {"name": "Comfort Colors Hemp", "ischecked": 0, "hex": "#B8A77D"},
        {"name": "Comfort Colors Ice Blue", "ischecked": 0, "hex": "#CFE8F3"},
        {"name": "Comfort Colors Ivory", "ischecked": 1, "hex": "#F3F1DC"},
        {"name": "Comfort Colors Light Green", "ischecked": 1, "hex": "#BFD8B8"},
        {"name": "Comfort Colors Midnight", "ischecked": 0, "hex": "#2E3B4E"},
        {"name": "Comfort Colors Orchid", "ischecked": 1, "hex": "#C3A3BF"},
        {"name": "Comfort Colors Pepper", "ischecked": 0, "hex": "#4B4F52"},
        {"name": "Comfort Colors Seafoam", "ischecked": 1, "hex": "#9FE2BF"},
        {"name": "Comfort Colors Watermelon", "ischecked": 0, "hex": "#FA6C6C"},
        {"name": "Comfort Colors White", "ischecked": 1, "hex": "#FFFFFF"},
        {"name": "Comfort Colors Yam", "ischecked": 0, "hex": "#FF8C42"},
        {"name": "Daisy", "ischecked": 1, "hex": "#FFD300"},
        {"name": "Dark Gray", "ischecked": 0, "hex": "#A9A9A9"},
        {"name": "Evergreen", "ischecked": 0, "hex": "#115740"},
        {"name": "Forest Green", "ischecked": 0, "hex": "#228B22"},
        {"name": "Heather Autumn", "ischecked": 1, "hex": "#C48447"},
        {"name": "Heather Deep Teal", "ischecked": 0, "hex": "#255E69"},
        {"name": "Heather Galapagos Blue", "ischecked": 1, "hex": "#496C8D"},
        {"name": "Heather Maroon", "ischecked": 0, "hex": "#4A1C2A"},
        {"name": "Heather Peach", "ischecked": 1, "hex": "#FFDAB9"},
        {"name": "Heather Prism Lilac", "ischecked": 1, "hex": "#D8B7DD"},
        {"name": "Azalea", "ischecked": 1, "hex": "#F78FA7"},
        {"name": "Irish Green", "ischecked": 1, "hex": "#1CA659"},
        {"name": "Light Pink", "ischecked": 1, "hex": "#FFB6C1"},
        {"name": "Kelly Green", "ischecked": 0, "hex": "#4CBB17"},
        {"name": "Light Blue", "ischecked": 1, "hex": "#ADD8E6"},
        {"name": "Comfort Colors Sage", "ischecked": 0, "hex": "#C1C8B6"},
        {"name": "Dark Grey Heather", "ischecked": 0, "hex": "#555555"},
        {"name": "Heather Indigo Blue", "ischecked": 0, "hex": "#395573"},
        {"name": "White", "ischecked": 1, "hex": "#FFFFFF"},
        {"name": "Tan", "ischecked": 1, "hex": "#D2B48C"},
        {"name": "Sage Green", "ischecked": 1, "hex": "#9CAF88"},
        {"name": "True Royal", "ischecked": 0, "hex": "#4169E1"},
        {"name": "Sport Grey", "ischecked": 1, "hex": "#C0C0C0"},
        {"name": "Navy", "ischecked": 0, "hex": "#000080"},
        {"name": "Military Green", "ischecked": 0, "hex": "#4B5320"},
        {"name": "Heather True Royal", "ischecked": 0, "hex": "#3A5DAE"},
        {"name": "Maroon", "ischecked": 0, "hex": "#800000"},
        {"name": "Mauve", "ischecked": 1, "hex": "#E0B0FF"},
        {"name": "Natural", "ischecked": 1, "hex": "#F5F5DC"},
        {"name": "Orange", "ischecked": 1, "hex": "#FFA500"},
        {"name": "Purple", "ischecked": 0, "hex": "#800080"},
        {"name": "Red", "ischecked": 0, "hex": "#FF0000"},
        {"name": "Sand", "ischecked": 1, "hex": "#ECD9B0"},
        {"name": "Soft Cream", "ischecked": 1, "hex": "#FFFDD0"},
        {"name": "Heliconia", "ischecked": 0, "hex": "#FF69B4"},
        {"name": "Comfort Colors Berry", "ischecked": 0, "hex": "#85394A"},
        {"name": "Comfort Colors Black", "ischecked": 0, "hex": "#1C1C1C"},
        {"name": "Comfort Colors Blue Spruce", "ischecked": 0, "hex": "#49796B"},
        {"name": "Comfort Colors Brick", "ischecked": 0, "hex": "#9C3E2E"},
        {"name": "Comfort Colors Blossom", "ischecked": 1, "hex": "#F4C2C2"},
        {"name": "Comfort Colors Boysenberry", "ischecked": 0, "hex": "#873260"},
        {"name": "Comfort Colors Crimson", "ischecked": 0, "hex": "#A91B0D"},
        {"name": "Comfort Colors Crunchberry", "ischecked": 0, "hex": "#DE5D83"},
        {"name": "Comfort Colors Espresso", "ischecked": 0, "hex": "#3B2F2F"},
        {"name": "Comfort Colors Grape", "ischecked": 0, "hex": "#6F42C1"},
        {"name": "Comfort Colors Lagoon Blue", "ischecked": 0, "hex": "#6DAEDB"},
        {"name": "Comfort Colors Moss", "ischecked": 0, "hex": "#8A9A5B"},
        {"name": "Comfort Colors Neon Red Orange", "ischecked": 0, "hex": "#FF5349"},
        {"name": "Comfort Colors Neon Yellow", "ischecked": 0, "hex": "#FFFF33"},
        {"name": "Comfort Colors Red", "ischecked": 0, "hex": "#C1272D"},
        {"name": "Comfort Colors Rose", "ischecked": 1, "hex": "#E7A2A2"},
        {"name": "Comfort Colors Seafoam Green", "ischecked": 0, "hex": "#9FE2BF"},
        {"name": "Comfort Colors Sunset", "ischecked": 0, "hex": "#FA8072"},
        {"name": "Comfort Colors Violet", "ischecked": 0, "hex": "#8F509D"},
        {"name": "Comfort Colors Washed Denim", "ischecked": 0, "hex": "#5D6D7E"},
        {"name": "Comfort Colors White", "ischecked": 1, "hex": "#FFFFFF"},
        {"name": "Comfort Colors Wine", "ischecked": 0, "hex": "#722F37"},
        {"name": "Black", "ischecked": 0, "hex": "#000000"}
    ]


    // Config yönetimi
    async function loadConfig() {
        try {
            const savedConfig = await GM.getValue('storeConfig');
            if (savedConfig) {
                config = {...DEFAULT_CONFIG, ...savedConfig};
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
            { id: 'shipTee2', label: 'Shirt Kargo 2. ürün:', type: 'number', value: config.shipTee2 }
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
                config[field.id] = field.type=='number' ? parseFloat(document.getElementById(field.id).value) : document.getElementById(field.id).value;
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


    const selector =
          "div.mud-dialog-content div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.pl-1 div.d-flex.flex-row.gap-3.w-100.mb-3.mt-4 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.card-title.mb-0.fs-3.fw-bold";

    const earning =
          "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-6.pl-1.pr-1.m-0.cus-prd-c > div > div.d-flex.flex-row.gap-3";

    const price =
         earning+"> div.mud-alert.mud-alert-text-warning.mud-dense.mud-elevation-0.mt-1 > div > div > p";

    const cost =
         earning+"> div.mud-alert.mud-alert-text-info.mud-dense.mud-elevation-0.mt-1 > div > div > p";

    const ship =
          "div > div.mud-grid-item.mud-grid-item-xs-12.mt-4 > div > div.mud-paper.mud-elevation-0.bg-primary-subtle.badge.mt-4 > p";

    const ship2 =
          "div > div.mud-input.mud-input-text.mud-input-text-with-label.mud-input-adorned-end.mud-input-underline.mud-shrink.mud-disabled.mud-typography-input.mud-select-input > div.mud-input-slot.mud-input-root.mud-input-root-text.mud-input-root-adorned-end.mud-select-input > div > p";

    const creditEl =
          "#main-wrapper > div > div > div > div > div > div > div.mud-card-content.cus-main.overflow-hidden > div > div > dxbl-grid > div.dxbl-grid-toolbar-container > div > div:nth-child(1) > div > div > h3";

    const balanceEl =
          "#main-wrapper > div > div > div > div > div > div > div.mud-card-content.cus-main.overflow-hidden > div > div > dxbl-grid > div.dxbl-grid-toolbar-container > div > div:nth-child(3) > div > div > h3";

    const salesSummary =
          "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div > div > div > div > div > div:nth-child(2) > h6";

    const trCut =
          "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > dxbl-grid > dxbl-scroll-viewer > div > table > tbody > tr";

    const shirtColorCut =
          " td:nth-child(3) > div > div > div:nth-child(5) > div > h6 > p";

    const imgColorCut =
          "td.dxbl-grid-fixed-cell.dxbl-grid-last-fixed-left-cell > div > div > div > section";

    const skuCut =
          "td:nth-child(3) > div > div > div.d-flex.flex-row.gap-3.col-md-12.single-note-item.all-category.note-important > div > p > a";

    const orderCut =
          "td:nth-child(3) > div > div > div.d-flex.flex-row.gap-3.col-md-12.single-note-item.all-category.note-business > div > h6 > a";

    const shirt =
          "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.p-2.m-0.cus-prd-r.mudcard-optionsx > div > div > div.d-flex.flex-row.gap-0 > div > div:nth-child(1) > div.d-flex.flex-column.gap-0.w-100 > div.mud-tooltip-root.mud-tooltip-inline.w-100 > span > p";

    const sku =
          "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-6.pl-1.pr-1.m-0.cus-prd-c > div > div.mud-paper.mud-elevation-0.note-has-grid.row > div > div > p > div";

    const adet =
          "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-paper.mud-elevation-0.absolute.r-0.t-0.p-0.m-0.shades.transparent > div > div.mud-alert.mud-alert-text-success.mud-dense.mud-elevation-0";

    const store =
          "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.pt-0.relative > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.pl-1 > div > div > div.d-flex.flex-row.gap-3.w-100.mb-1.mt-4 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.text-muted.mt-0.fs-2.mud-typography-nowrap";

    const observerOptions = { childList: true, subtree: true };

    function insertEarningContent(earningNode, costText, priceText, shirtText, quantity, miktar, shipText,skuText) {
        const storeNode = document.querySelector(store);
        const RemDiscount = (100 - config.discount) / 100; //indirimden kalan yüzde
        const RemFeePerc = (100 - config.feePerc) / 100; //fee den kalan yüzde
        const remainingDiscount = priceText * RemDiscount;
        const remainingFee = remainingDiscount * RemFeePerc;
        const remaining = remainingFee - costText;
        const shipCross = shirtText.includes("Hoodie") ? (config.shipHoodie + config.shipHoodie2 * (quantity-1))/quantity : (config.shipTee + config.shipTee2 * (quantity-1))/quantity;
        //console.log("config.shipTee: ",config.shipTee);
        //console.log("shipCross: ",shipCross);
        const shipTotal = shipText ? (shipCross - shipText/quantity) : 0;
        const Net = (remaining + shipTotal)*miktar;

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
                copyButton.addEventListener('click', function(e) {
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
            const earningNodes = document.querySelectorAll(earning);
            const adetNodes = document.querySelectorAll(adet);
            const costNodes = document.querySelectorAll(cost);
            const priceNodes = document.querySelectorAll(price);
            const shirtNodes = document.querySelectorAll(shirt);
            const shipNode = document.querySelector(ship);
            const ship2Node = document.querySelector(ship2);
            const skuNodes = document.querySelectorAll(sku);

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
                insertEarningContent(earningNode, costText, priceText, shirtText, quantity, miktar, shipText,skuText);
            });
        }, 100); // 100 ms timeout
    }

    function convertNode(pNode) {
        pNode.classList.add("link", "link-primary");
        pNode.style.cursor = "pointer";
        pNode.dataset.processed = "true";

        pNode.addEventListener("click", (e) => {
            const storeNode = document.querySelector(store);
            if (!storeNode) return;
            //copy order no!!!
            const orderId = pNode.textContent.replace("#", "");
            if ( !storeNode.textContent.trim().includes("Hand") || orderId.includes('_') )
            {
                navigator.clipboard.writeText(orderId).then(() => {
                    //e.target.style.backgroundColor = "red"
                    //alert('orderId kopyalandı: ' + orderId);
                });
                return;
            }
            const targetUrl = `https://www.etsy.com/your/orders/sold/new?order_id=${orderId}`;
            window.open(targetUrl, "_blank");
        });
    }

    async function convertsNode() {
        const sNodes = document.querySelectorAll(trCut);
        const salNode = document.querySelector(salesSummary);

        sNodes.forEach(async (sNode, index) => {
            //console.log("sNodes: ",sNode);
            if (sNode && !sNode.dataset.contentInserted) {

                const shirtColorCuttext = sNode.querySelector(shirtColorCut);
                if ( shirtColorCuttext ) {
                    const shirtColor = shirtColorCuttext.textContent.replace("(","").replace(")","").trim();
                    console.log("shirtColor: ",shirtColor);
                    const oldColorRGB = 'rgb(220, 220, 220)';
                    let newColor;
                    // Get white color's hex
                    newColor = shirtColors.find(c => c.name === shirtColor)?.hex;
                    console.log("newColor: ",newColor);
                    const interval = setInterval(() => {
                        const imgColorCutEl = sNode.querySelector(imgColorCut);
                        if (!imgColorCutEl) return;

                        const descendants = imgColorCutEl.querySelectorAll("*");
                        descendants.forEach(Node => {
                            const style = window.getComputedStyle(Node);
                            if (style.backgroundColor.toLowerCase() === oldColorRGB) {
                                Node.style.backgroundColor = newColor;
                            }
                        });

                        clearInterval(interval); // Bulunca durdur
                    }, 500);
                }

                const orderCutText = sNode.querySelector(orderCut);
                if (orderCutText) {
                    //console.log("orderCutText: ",orderCutText.textContent);
                    const copyOButton = document.createElement('button');
                    copyOButton.textContent = 'Copy';
                    copyOButton.style.marginLeft = '10px'; // Space between SKU and icon
                    copyOButton.className = 'copy-icon'; // Aynı simgenin tekrar eklenmemesi için
                    orderCutText.parentNode.appendChild(copyOButton);
                    copyOButton.addEventListener('click', function(e) {
                        navigator.clipboard.writeText(orderCutText.textContent).then(() => {
                            e.target.style.backgroundColor = "aqua"
                            //alert('orderCutText kopyalandı: ' + orderCutText.textContent);
                        });
                    });
                }

                //const skuCText = sNodes[index].textContent;
                const skuCText = sNode.querySelector(skuCut);
                if (skuCText) {
                    //console.log("skuCText: ",skuCText.textContent);
                    const copyCButton = document.createElement('button');
                    copyCButton.textContent = 'Kopyala';
                    copyCButton.style.marginLeft = '10px'; // Space between SKU and icon
                    copyCButton.className = 'copy-icon'; // Aynı simgenin tekrar eklenmemesi için
                    skuCText.parentNode.appendChild(copyCButton);
                    copyCButton.addEventListener('click', function(e) {
                        navigator.clipboard.writeText(skuCText.textContent).then(() => {
                            e.target.style.backgroundColor = "aqua"
                            //alert('skuCText kopyalandı: ' + skuCText.textContent);
                        });
                    });
                }
                sNode.dataset.contentInserted = "true";
            }
        });

        if (salNode && !salNode.dataset.contentInserted) {
            const subTotal = document.querySelector("div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div > div > div > div > div > div.d-flex.align-items-center.justify-content-between.mb-3.pt-2 > h6").textContent;
            const discount = salNode.textContent;
            console.log("indirim: ",discount);
            console.log("subTotal: ",subTotal);
            const discountSpan = document.createElement('span');
            discountSpan.textContent = `% ${(unformatNumber(discount)*100/unformatNumber(subTotal)).toFixed(2)}`;
            salNode.parentNode.appendChild(discountSpan);
            salNode.dataset.contentInserted = "true";
        }
    }

    let isProcessing = false; // Flag to prevent multiple executions

    const getExchangeRate = () => new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: "GET",
            url: "https://www.tcmb.gov.tr/kurlar/today.xml",
            onload: (response) => {
                if (response.status === 200) {
                    const xmlDoc = new DOMParser().parseFromString(response.responseText, "text/xml")
                    const rateEl = xmlDoc.querySelector(`Currency[CurrencyCode="USD"] BanknoteSelling`)
                    if (rateEl) {
                        resolve(Number(rateEl.textContent))
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
        const creditElement = document.querySelector(creditEl);
        const balanceElement = document.querySelector(balanceEl);

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
        const balanceInTl = balance * exchangeRate
        addText(creditElement, "tl-info", ` (${Math.round(creditInTl)} ₺)`)

        addText(balanceElement, "tl-info", ` (${Math.round(balanceInTl)} ₺)`)

        isProcessing = false; // Reset flag after processing is complete
    }

    // Sayfa yüklendiğinde
    window.addEventListener('load', async function() {
        loadConfig();
        initUI();
    });

    function handleMutation(mutationsList) {
        if (window.location.href.includes('customhub.io/drop-ship/approval-pending')) processPage();
        mutationsList.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const pNode = node.querySelector(selector);
                    const sNode = node.querySelector(trCut);
                    const salNode = node.querySelector(salesSummary);
                    if (pNode && !pNode.dataset.processed) convertNode(pNode);
                    if (sNode && !sNode.dataset.processed) convertsNode();
                    if (salNode && !salNode.dataset.processed) convertsNode();
                    checkAndInsertEarningContent();
                }
            });
        });
    }

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, observerOptions);

})();
