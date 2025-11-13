// ==UserScript==
// @name         Etsy Review Message
// @version      1.79
// @description  Send review message for buyer
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/orders/sold/completed*
// @match        https://www.etsy.com/your/orders/sold/*order_id=*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @grant        GM.addStyle
// @grant        GM.xmlHttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.addElement
// @grant        GM.getResourceText
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewMessage.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewMessage.user.js
// @run-at       document-en
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
        reviewMessage: `Hello {{userName}}, 🙏`
    };
    const MESSAGE_BUTTONS_SELECTOR = '#browse-view > div > div.col-lg-9.pl-xs-0.pl-md-4.pr-xs-0.pr-md-4.pr-lg-0.float-left > div > section > div > div.panel-body > div > div > div.flag-img.flag-img-right.pt-xs-2.pt-xl-3.pl-xs-2.pl-xl-3.pr-xs-3.pr-xl-3.vertical-align-top.icon-t-2.hide-xs.hide-sm > div';

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
            }else if(DEFAULT_CONFIG.reviewMessage){
                await migrateConfig()
            }
            return false;
        } catch (error) {
            console.error('Config yükleme hatası:', error);
            return false;
        }
    }

    async function migrateConfig() {
        await saveConfig();
        for (const key of Object.keys(DEFAULT_CONFIG)) await GM.deleteValue(key);
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

        if (!config.reviewMessage) {
            showToast('Mesaj ayarlanmalı', 'error');
            return false;
        }
        return true;
    }

    function insertOrUpdateProgressBar(completed, total) {
        const percent = Math.round((completed / total) * 100);

        const ul = document.querySelector('nav.wt-tab-container ul.wt-tab');
        if (!ul) return;

        let li = document.querySelector('#reviews-progress-bar');

        if (!li) {
            li = document.createElement('li');
            li.id = 'reviews-progress-bar';
            li.className = 'wt-tab__item';
            li.style = 'display:flex;align-items:center;gap:5px;padding:4px 8px;';
            ul.appendChild(li);
        }

        li.innerHTML = `
    <span style="background:#e0e0e0;width:100px;height:10px;border-radius:5px;overflow:hidden;display:inline-block;">
      <span style="background:green;width:${percent}%;height:100%;display:block;"></span>
    </span>
    <span style="font-size:12px;color:#333;">${percent}% (${completed}/${total}) reviews</span>
  `;
    }

    // Modern Toast Notification System
    async function createToastContainer() {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }

    async function showToast(message, type = 'success', duration = 3000) {
        const container = await createToastContainer();

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
        title.textContent = 'Etsy Mesaj Tool Ayarları';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'etsy-tool-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 500);
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Modal body
        const body = document.createElement('div');
        body.className = 'etsy-tool-modal-body';

        // Form fields
        const fields = [
            { id: 'reviewMessage', label: 'Review Message', type: 'textarea', value: config.reviewMessage },
            { id: 'printMessage', label: 'Bu Şekilde Baskıya', type: 'textarea', value: config.printMessage },
            { id: 'cancelMessage', label: 'Sipariş İptali', type: 'textarea', value: config.cancelMessage },
            { id: 'noreturnMessage', label: 'İade Yerine Kupon', type: 'textarea', value: config.noreturnMessage },
            { id: 'uspserrorMessage', label: 'Adres Hatası', type: 'textarea', value: config.uspserrorMessage },
            { id: 'priorityMessage', label: 'Hızlı Kargo Seçeneği', type: 'textarea', value: config.priorityMessage },
            { id: 'resendMessage', label: 'Yanlış Ürün Yeniden(rep) Gönderiyorum', type: 'textarea', value: config.resendMessage },
            { id: 'reptrackMessage', label: 'Yeni Ürün Gönderildi', type: 'textarea', value: config.reptrackMessage },
            { id: 'repfotoMessage', label: 'Yanlış Ürün – Fotoğraf İste', type: 'textarea', value: config.repfotoMessage },
            { id: 'wecanMessage', label: 'Kişiselleştirme Mümkün', type: 'textarea', value: config.wecanMessage },
            { id: 'doapprowMessage', label: 'Onay Bekliyorum', type: 'textarea', value: config.doapprowMessage },
            { id: 'shopName', label: 'Mağaza Adı', type: 'textarea', value: config.shopName }
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

    async function main(messageKey) {
        const orderName = document.querySelector("#order-details-header-text > span")?.innerText;
        if (!orderName) return;
        const userName = orderName.replace("Order from ", "").split(" ")[0];
        const capitalizedUserName = userName[0].toUpperCase() + userName.slice(1).toLowerCase();

        const savedMessage = config[messageKey];
        if (!savedMessage) return;

        const personalizedMessage = `\n${savedMessage.replace("{{userName}}", capitalizedUserName)}\n`;

        const textAreaEl = document.querySelector('textarea[name="message"]');
        const msgBuyerButton =[...document.querySelectorAll("#dg-tabs-preact__tab-1--default_wt_tab_panel .flag-body button")].find(el => el.textContent.trim() === "Message buyer")
        const replyButton =[...document.querySelectorAll("#dg-tabs-preact__tab-1--default_wt_tab_panel .flag-body button")].find(el => el.textContent.trim() === "Reply")

        if (!textAreaEl) {
            console.log("textAreaEl yok")
            if (msgBuyerButton) { console.log("msgBuyerButton var");msgBuyerButton.click()}
            if (replyButton){console.log("replyButton var");replyButton.click()}
        }
        setTimeout(() => {
            if (textAreaEl && !textAreaEl.value.includes(personalizedMessage)) {
                textAreaEl.value += personalizedMessage;
                textAreaEl.setAttribute("value", textAreaEl.value);
                textAreaEl.dispatchEvent(new Event('input', { bubbles: true }));
                textAreaEl.dispatchEvent(new Event('change', { bubbles: true }));
                textAreaEl.focus();
            }
        }, 500);
    }

    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && !event.altKey) {
            switch (event.code) {
                case "Space": event.preventDefault(); main("reviewMessage"); break;
                case "Digit1":event.preventDefault(); main("printMessage"); break;
                case "Digit2":event.preventDefault(); main("cancelMessage"); break;
                case "Digit3":event.preventDefault(); main("noreturnMessage"); break;
                case "Digit4":event.preventDefault(); main("uspserrorMessage"); break;
                case "Digit5":event.preventDefault(); main("priorityMessage"); break;
                case "Digit6":event.preventDefault(); main("resendMessage"); break;
                case "Digit7":event.preventDefault(); main("reptrackMessage"); break;
                case "Digit8":event.preventDefault(); main("repfotoMessage"); break;
                case "Digit9":event.preventDefault(); main("wecanMessage"); break;
                case "Digit0":event.preventDefault(); main("doapprowMessage"); break;
                case "Backquote":event.preventDefault(); insertShortcutTable(); break;
            }
        }
    });



    async function insertShortcutTable() {
        const target = document.querySelector("#dg-tabs-preact__tab-1--default_wt_tab_panel > div > div:nth-child(4) > div");
        if (!target) return;

        const tableHTML = `
        <div style="margin-bottom:16px; border:1px solid #ccc; padding:12px; border-radius:8px; background:#f9f9f9; font-family:sans-serif;">
            <strong>🧷 Message Shortcuts</strong>
            <table style="width:100%; margin-top:8px; border-collapse:collapse; font-size:14px;">
                <thead>
                    <tr style="text-align:left;">
                        <th style="padding:4px 8px;">Shortcut</th>
                        <th style="padding:4px 8px;">Message Type</th>
                        <th style="padding:4px 8px;">Açıklama</th>
                    </tr>
                </thead>
                <tbody>
                <tr><td style="padding:4px 8px;">Ctrl + Space</td><td style="padding:4px 8px;">Review Message</td><td style="padding:4px 8px;">Review Mesaj</td></tr>
                    <tr><td style="padding:4px 8px;">Ctrl + 1</td><td style="padding:4px 8px;">Print Message</td><td style="padding:4px 8px;">Bu Şekilde Baskıya</td></tr>
                    <tr><td style="padding:4px 8px;">Ctrl + 2</td><td style="padding:4px 8px;">Cancel Message</td><td style="padding:4px 8px;">Sipariş İptali</td></tr>
                    <tr><td style="padding:4px 8px;">Ctrl + 3</td><td style="padding:4px 8px;">Noreturn Message</td><td style="padding:4px 8px;">İade Yerine Kupon</td></tr>
                    <tr><td style="padding:4px 8px;">Ctrl + 4</td><td style="padding:4px 8px;">Uspserror Message</td><td style="padding:4px 8px;">Adres Hatası</td></tr>
                    <tr><td style="padding:4px 8px;">Ctrl + 5</td><td style="padding:4px 8px;">Priority Message</td><td style="padding:4px 8px;">Hızlı Kargo Seçeneği</td></tr>
                    <tr><td style="padding:4px 8px;">Ctrl + 6</td><td style="padding:4px 8px;">Resend(rep) Message</td><td style="padding:4px 8px;">Yanlış Ürün Yeniden(rep) Gönderiyorum</td></tr>
                    <tr><td style="padding:4px 8px;">Ctrl + 7</td><td style="padding:4px 8px;">Reptrack Message</td><td style="padding:4px 8px;">Yeni Ürün Gönderildi</td></tr>
                    <tr><td style="padding:4px 8px;">Ctrl + 8</td><td style="padding:4px 8px;">Repfoto Message</td><td style="padding:4px 8px;">Yanlış Ürün – Fotoğraf İste</td></tr>
                    <tr><td style="padding:4px 8px;">Ctrl + 9</td><td style="padding:4px 8px;">Wecan Message</td><td style="padding:4px 8px;">Kişiselleştirme Mümkün</td></tr>
                    <tr><td style="padding:4px 8px;">Ctrl + 0</td><td style="padding:4px 8px;">Doapprow Message</td><td style="padding:4px 8px;">Onay Bekliyorum</td></tr>
                    <tr><td style="padding:4px 8px;">Ctrl + "</td><td style="padding:4px 8px;">Shortcut Map</td><td style="padding:4px 8px;">Kısayol Haritası</td></tr>
                </tbody>
            </table>
        </div>
    `;
        const container = document.createElement("div");
        container.innerHTML = tableHTML;
        target.parentNode.insertBefore(container, target);
        await closedProme();
    }
    await insertShortcutTable();

    async function closedProme(){
        const protection = document.getElementById("purchase-protection-seller-onsite-under-250")
        const protect500 = document.getElementById("purchase-protection-seller-onsite-under-500")
        if(protection){
            protection.style.display = "none";
        }
        if(protect500){
            protect500.style.display = "none";
        }
    }

    // helper: görünür ve tıklanabilir mi?
    function isVisibleAndEnabled(el){ return el && !el.disabled && (!!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)); }

    function waitFor(predicate, interval=150, attempts=40){
        return new Promise((resolve, reject)=>{
            let i=0;
            const t = setInterval(()=>{
                if(predicate()){ clearInterval(t); resolve(); }
                if(++i>=attempts){ clearInterval(t); reject(new Error('waitFor timeout')); }
            }, interval);
        });
    }

    // butonsAll: çağırdığınız fonksiyonun güncellenmiş hali
    async function butonsAll(el){
        let star = 0;
        el.forEach((button, index) => {
            let parentElement = button;
            let skip = false;
            for (let i = 0; i < 5; i++){
                if(!parentElement) break;
                parentElement = parentElement.parentElement;
                if(parentElement && parentElement.querySelector('[data-icon="star"]')){ skip = true; star++; break; }
            }
            if(skip) return;
            button.setAttribute('tabindex', String(index + 1)); // attribute olarak koy -> getAttribute/selector tutarlı olur
            button.innerText = '...';
        });

        await insertOrUpdateProgressBar(star, el.length);
        await insertOrUpdateRefreshButton();

        // bir kere ekle (aynı sayfada ikinci kez çağrılırsa tekrar eklemesin)
        if(!window.__btnNavigatorInitialized){
            window.__btnNavigatorInitialized = true;
            window.__btnNavState = { isTriggered: false };

            document.addEventListener('keydown', function(e){
                if(e.key === 'Control'){ window.__btnNavState.isTriggered = false; return; }
                if(e.ctrlKey && e.key === 'ArrowRight' && !window.__btnNavState.isTriggered && !e.repeat){
                    window.__btnNavState.isTriggered = true;
                    e.preventDefault();
                    window.history.back();
                    // popstate dinleyicisi sonrası click tetiklenir (aşağıda tanımlı)
                }
            });

            document.addEventListener('keyup', function(e){
                if(e.key === 'Control') window.__btnNavState.isTriggered = false;
            });

            window.addEventListener('popstate', function(){
                // Sayfa içeriği SPA olarak güncelleniyorsa DOM'un hazır olmasını bekle
                waitFor(()=> document.querySelectorAll(MESSAGE_BUTTONS_SELECTOR + ' :is(div, div:nth-child(2)) > span > button[data-clg-id="WtButton"]').length > 0, 120, 50)
                    .then(()=> clickNextTabIndex())
                    .catch(()=> {
                    // fallback: 1s sonra dene
                    setTimeout(clickNextTabIndex, 1000);
                });
            });
        }
    }

    function clickNextTabIndex(){
        const nodes = Array.from(document.querySelectorAll('[tabindex]'))
        .filter(isVisibleAndEnabled)
        .map(el => ({el, tab: Number(el.getAttribute('tabindex') ?? el.tabIndex ?? 0)}))
        .filter(o => !Number.isNaN(o.tab))
        .sort((a,b) => a.tab - b.tab)
        .map(o => o.el);

        if(nodes.length === 0){ console.log('No focusable elements found'); return; }

        const active = document.activeElement;
        let currentIndex = nodes.indexOf(active);

        // Eğer activeElement listede yoksa ilk elemanı seç (veya odaklanmış öğeyi bulmaya çalış)
        if(currentIndex === -1){
            // alternatif: active element'in en yakın [tabindex] ancestor'unu bul
            const anc = active ? active.closest && active.closest('[tabindex]') : null;
            currentIndex = anc ? nodes.indexOf(anc) : -1;
        }

        let nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % nodes.length;
        const nextEl = nodes[nextIndex];
        if(nextEl){
            try { nextEl.focus(); } catch(e){}
            setTimeout(()=> { try { nextEl.click(); console.log('Clicked tabindex', nextEl.getAttribute('tabindex')); } catch(e){ console.error(e); } }, 40);
            setTimeout(()=> {closedProme();}, 400);
        }
    }

    // Ctrl + Alt  gönderme
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.altKey) {
            const sendButton = document.querySelector("#dg-tabs-preact__tab-1--default_wt_tab_panel .panel-body .btn.btn-primary.btn-small");
            if (sendButton) {
                setTimeout(() => sendButton.click(), 500); // Gönderim için zamanlama ekle
                //console.log("gömderildi")
            }
        }
    });

    // Ctrl + Alt + Space ile doldurma ve gönderme
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.altKey && event.code === "Space") {
            //main(true); // Doldur ve gönder
        }
    });

    // Ctrl + Shift + Space ile doldurma ve gönderme
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.shiftKey && event.code === "Space") {
            main(true); // Doldur ve gönder
        }
    });
    async function insertOrUpdateRefreshButton() {
        const ul = document.querySelector('nav.wt-tab-container ul.wt-tab');
        if (!ul) return;

        let li = document.querySelector('#refresh-tab-item');
        if (!li) {
            li = document.createElement('li');
            li.id = 'refresh-tab-item';
            li.className = 'wt-tab__item';

            const btn = document.createElement('button');
            btn.className = 'refresh-button';
            btn.innerHTML = '&times;';
            btn.addEventListener('click', () => {
                observeButtons();
            });

            li.appendChild(btn);
            ul.appendChild(li);
        } else {
            // Eğer button varsa, event listener eklenmişse tekrar eklemenin önüne geç
            const btn = li.querySelector('button.refresh-button');
            if (!btn) {
                const newBtn = document.createElement('button');
                newBtn.className = 'refresh-button';
                newBtn.innerHTML = '&times;';
                newBtn.addEventListener('click', () => {
                    observeButtons();
                });
                li.appendChild(newBtn);
            }
        }
    }

    function observeButtons() {
        //const messageButtonsEL = "#browse-view > div > div.col-lg-9.pl-xs-0.pl-md-4.pr-xs-0.pr-md-4.pr-lg-0.float-left > div > section > div > div.panel-body > div > div > div.flag-img.flag-img-right.pt-xs-2.pt-xl-3.pl-xs-2.pl-xl-3.pr-xs-3.pr-xl-3.vertical-align-top.icon-t-2.hide-xs.hide-sm > div";
        const buttons = document.querySelectorAll(
            MESSAGE_BUTTONS_SELECTOR + ' :is(div, div:nth-child(2)) > span > button[data-clg-id="WtButton"]:not([data-test-id="purchase-shipping-label-button"])'
        );
        if (buttons.length > 0 && !window.location.href.includes("https://www.etsy.com/your/orders/sold/new?search_query=")) {
            butonsAll(buttons);
            console.log("Butonlar bulundu:", buttons);
            const nextBtn = document.querySelector('[data-testid="next-page"]');
            if (nextBtn) {
                console.log("nextBtn bulundu");
                nextBtn.addEventListener('click', () => {
                    console.log("nextBtn tıklandı");
                    setTimeout(() => observeButtons(), 3000);
                    setTimeout(() => console.log("nextBtn 3 sn geçti"), 3000);
                });
            }
            observer.disconnect(); // İlk gözlemi durdur
        }
    }

    const observer = new MutationObserver(observeButtons);
    observer.observe(document.body, { childList: true, subtree: true });

    let lastPage = new URL(location.href).searchParams.get("page") || "1";

    new MutationObserver(() => {
        const currentPage = new URL(location.href).searchParams.get("page") || "1";
        if (currentPage !== lastPage) {
            console.log(`Sayfa değişti: ${lastPage} → ${currentPage}`);
            lastPage = currentPage;
            observeButtons();
        }
    }).observe(document.body, { childList: true, subtree: true });


    // Initialize
    async function initialize() {
        // Load config
        await loadConfig();

        // Register menu commands
        GM.registerMenuCommand("Ayarlar", showConfigMenu);

        // Show welcome message
        showToast('Message Tool: Ctrl+Space Ctrl+Alt Ctrl+->', 'info');
    }

    // Start the script
    initialize();
})();
