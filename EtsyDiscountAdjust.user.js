// ==UserScript==
// @name         Etsy Discount Adjust
// @version      1.24
// @description  Create daily discount
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


(async function() {
    'use strict';

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
            bottom: 50px;
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

        /* Panels */
        .etsy-tool-panel {
            background-color: white;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            overflow: hidden;
        }

        .etsy-tool-panel-header {
            padding: 12px 16px;
            background-color: var(--primary-color);
            color: white;
            font-family: var(--font-family);
            font-size: 16px;
            font-weight: 500;
            display: flex;
            cursor: move;
            align-items: center;
            justify-content: space-between;
        }

        .etsy-tool-panel-body {
            padding: 16px;
        }

        /* Main Toolbar */
        .etsy-tool-toolbar {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            display: flex;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            flex-direction: column;
            gap: 10px;
            width: 300px;
        }

        /* Image Thumbnails */
        .etsy-tool-thumbnails {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
        }

        .etsy-tool-thumbnail {
            position: relative;
            width: 100%;
            padding-top: 100%; /* 1:1 Aspect Ratio */
            border-radius: var(--border-radius);
            overflow: hidden;
            cursor: pointer;
            box-shadow: var(--box-shadow);
            transition: var(--transition);
        }

        .etsy-tool-thumbnail:hover {
            transform: scale(1.05);
        }

        .etsy-tool-thumbnail img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .etsy-tool-thumbnail-actions {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: space-around;
            padding: 5px;
            opacity: 0;
            transition: var(--transition);
        }

        .etsy-tool-thumbnail:hover .etsy-tool-thumbnail-actions {
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

        /* Image Viewer */
        .etsy-tool-image-viewer {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        .etsy-tool-image-viewer img {
            max-width: 100%;
            max-height: 70vh;
            object-fit: contain;
        }

        /* PNG Filter Panel */
        .etsy-tool-png-filter {
            margin-top: 10px;
        }

        .etsy-tool-png-list {
            margin-top: 10px;
            max-height: 300px;
            overflow-y: auto;
        }

        .etsy-tool-png-item {
            display: flex;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: var(--transition);
        }

        .etsy-tool-png-item:hover {
            background-color: #f5f5f5;
        }

        .etsy-tool-png-item.selected {
            background-color: rgba(66, 133, 244, 0.1);
        }

        .etsy-tool-png-item-checkbox {
            margin-right: 10px;
        }

        .etsy-tool-png-item-thumbnail {
            width: 40px;
            height: 40px;
            border-radius: var(--border-radius);
            overflow: hidden;
            margin-right: 10px;
        }

        .etsy-tool-png-item-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .etsy-tool-png-item-info {
            flex: 1;
        }

        .etsy-tool-png-item-title {
            font-weight: 500;
            margin-bottom: 2px;
        }

        .etsy-tool-png-item-sku {
            font-size: 12px;
            color: var(--gray-color);
        }

        /* Loading Spinner */
        .etsy-tool-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .etsy-tool-toolbar {
                width: 250px;
            }

            .etsy-tool-thumbnails {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `);

    // Config yapısı
    const DEFAULT_CONFIG = {
        discount: 25,
        discountName: "",
        mount: 1,
        lastDay: 1,
        fullYear: 2025,
    };

    // Global değişkenler
    let config = {...DEFAULT_CONFIG};
    let toastContainer = null;

    // Config yönetimi
    async function loadConfig() {
        try {
            const savedConfig = await GM.getValue('Config');
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

    async function saveConfig() {
        await GM.setValue('Config', config);
    }

    // Config kontrol fonksiyonu
    async function checkConfig() {
        return await loadConfig();
    }

    // Config doğrulama
    async function validateConfig() {
        if (!await checkConfig()) {
            showToast('Config yüklenemedi', 'error');
            return false;
        }

        if (!config.discount) {
            showToast('Discount missing', 'error');
            return false;
        }
        return true;
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
        title.textContent = 'Etsy Discount Tool Ayarları';

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
        // Form fields
        const fields = [
            { id: 'discount', label: 'discount (25)', type: 'number', value: config.discount },
            { id: 'discountName', label: 'Discount Name(APR)', type: 'text', value: config.discountName },
            { id: 'mount', label: 'mount', type: 'number', value: config.mount },
            { id: 'lastDay', label: 'lastDay (1)', type: 'number', value: config.lastDay },
            { id: 'fullYear', label: 'fullYear (2025)', type: 'number', value: config.fullYear }
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

    async function main(send = false) {
        const lastDayStr = String(config.lastDay).padStart(2, '0');
        if(config.lastDay>31) {
            showToast("Yeni aya geç: "+config.lastDay, 'error');
            return;
        }
        const mountStr = String(config.mount).padStart(2, '0');
        // Inputlara tarih yaz
        const dateInputs = [...document.querySelectorAll('input[data-datepicker-input="true"]')];
        if (dateInputs.length >= 2) {
            const dateStr = `${mountStr}/${lastDayStr}/${config.fullYear}`;

            // İlk input
            dateInputs[0].value = dateStr;
            dateInputs[0].focus();
            dateInputs[0].click();
            dateInputs[0].blur();
            dateInputs[0].dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            dateInputs[0].dispatchEvent(new Event('change', { bubbles: true, composed: true }));

            // İkinci input
            dateInputs[1].value = dateStr;
            dateInputs[1].focus();
            dateInputs[1].click();
            dateInputs[1].blur();
            dateInputs[1].dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            dateInputs[1].dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        }

        // 2. Select'i seçili hale getir
        const select = document.querySelector("#reward-percentage");
        if (select) {
            const discount = Number(config.discount);
            if (discount == 25 || discount == 30 || discount == 35 || discount == 40 || discount == 45 || discount == 50 ){
            const option = [...select.options].find(opt => opt.value === String(discount));
                if (option) option.selected = true;
                select.dispatchEvent(new Event('input', { bubbles: true })); // "input" etkinliğini tetikle
                select.dispatchEvent(new Event('change', { bubbles: true })); // "change" etkinliğini tetikle
            }else{
                select.value = 1;
                select.dispatchEvent(new Event('input', { bubbles: true })); // "input" etkinliğini tetikle
                select.dispatchEvent(new Event('change', { bubbles: true })); // "change" etkinliğini tetikle
                setTimeout(() => {
                    const custom = document.querySelector("input[type='number'], input[data-discount-input]") || document.querySelector("#wt-modal-container input[type='number']");
                    if (custom) {
                        custom.value = discount;
                        custom.dispatchEvent(new Event('input', { bubbles: true })); // "input" etkinliğini tetikle
                        custom.dispatchEvent(new Event('change', { bubbles: true })); // "change" etkinliğini tetikle
                    }
                }, 500); // 500ms bekleyin veya gerektiği gibi ayarlayın
            }
        }
        // 3. Kupon ismini gir: DD + DISC + YY
        const couponInput = document.querySelector('#name-your-coupon');
        if (couponInput) {
            couponInput.value = `${lastDayStr}${config.discountName}${config.discount}`;
            couponInput.dispatchEvent(new Event('input', { bubbles: true })); // "input" etkinliğini tetikle
            couponInput.dispatchEvent(new Event('change', { bubbles: true })); // "change" etkinliğini tetikle
        }

        // 4. lastDay + 1 olarak güncelle
        // Update last lastDay in config
        config.lastDay = config.lastDay + 1;
        await saveConfig();
        showToast("Başarıyla eklendi: "+config.lastDay);
        console.log("Başarıyla eklendi: ",config.lastDay);
    }

    // Ctrl + Space ile sadece doldurma
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.code === "Space") {
            main(false); // Sadece doldur
        }
    });

    // Ctrl + Alt ile ilerle
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.altKey) {
            nextStep();
        }
    });

    const getRandomInt = (start, end) =>
    Math.floor(Math.random() * (end - start + 1)) + start
    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function nextStep() {
        const step = document.querySelector("#wt-modal-container > div.wt-overlay.wt-overlay--will-animate.wt-overlay--full-screen.wt-overlay--no-animation > div > div.wt-overlay__sticky-footer-container.wt-z-index-1.wt-shadow-elevation-3 > div");

        // Step 1
        let delayMs = getRandomInt(1200, 1800)
        await delay(delayMs);
        let next = step.querySelector("div.wt-overlay__footer__action > button");
        if (next) {
            next.click();
            console.log("step 1");
        }

        // Step 2
        delayMs = getRandomInt(1200, 1800)
        await delay(delayMs);
        next = step.querySelector("div:nth-child(3) > button");
        if (next) {
            next.click();
            console.log("step 2");
        }

        // Step 3
        delayMs = getRandomInt(1200, 1800)
        await delay(delayMs);
        next = step.querySelector("div:nth-child(3) > button");
        if (next) {
            next.click();
            console.log("step 3");
        }

        // Close and go forward
        delayMs = getRandomInt(800, 1000)
        await delay(delayMs);
        window.location.href = "https://www.etsy.com/your/shops/me/sales-discounts/step/createSale";
        console.log("bitti");
    }


    // Initialize
    async function initialize() {
        // Load config
        await loadConfig();

        // Register menu commands
        GM.registerMenuCommand("Ayarlar", showConfigMenu);

        // Show welcome message
        showToast('Discount Tool : CTRL + Space ve CTRL + Alt', 'info');
    }

    // Start the script
    initialize();
})();
