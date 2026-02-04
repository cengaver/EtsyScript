// ==UserScript==
// @name         Etsy on Erank
// @description  Erank overlay with unified menu for configuration and range selection. Sheet entegre
// @version      4.04
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
// @match        https://ehunt.ai/etsy-product-research*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @grant        GM.addElement
// @grant        GM.getResourceText
// @grant        GM.addStyle
// @connect      beta.erank.com
// @connect      ehunt.ai
// @connect      sheets.googleapis.com
// @connect      erank.com
// @connect      script.google.com
// @connect      developer.uspto.gov
// @connect      raw.githubusercontent.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ErankOnEtsy.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ErankOnEtsy.user.js
// ==/UserScript==

(async function () {
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

        #erank-table-modal{
          position:fixed;inset:0;z-index:999999;
          background:rgba(0,0,0,.6);
          display:flex;align-items:center;justify-content:center;
          font-family:Arial,sans-serif
        }
        .erank-box{
          background:#fff;width:95%;max-width:1400px;
          max-height:90vh;overflow:hidden;
          border-radius:12px;display:flex;flex-direction:column
        }
        .erank-header{
          padding:12px 16px;border-bottom:1px solid #ddd;
          display:flex;align-items:center;gap:12px
        }
        .erank-header input{
          padding:6px 10px;width:260px
        }
        .erank-close{margin-left:auto;cursor:pointer;font-size:20px}
        .erank-table-wrap{overflow:auto}
        table{border-collapse:collapse;width:100%}
        thead th{
          position:sticky;top:0;background:#f6f6f6;
          cursor:pointer;border-bottom:1px solid #ccc;
          padding:8px;font-size:14px;white-space:nowrap
        }
        tbody td{
          border-bottom:1px solid #eee;
          padding:8px;font-size:16px;vertical-align:middle
        }
        tbody tr:hover{background:#fafafa}
        #erank-table-modal img{
          width:72px;
          height:72px;
          object-fit:cover;
          border-radius:6px;
        }
        .num{text-align:right}
        .erank-table-wrap img{cursor:pointer}
        .erank-table-wrap a:hover img{opacity:.85}
        .erank-preview{
          position:fixed;
          z-index:1000000;
          pointer-events:none;
          background:#fff;
          border-radius:10px;
          box-shadow:0 10px 30px rgba(0,0,0,.35);
          padding:6px;
          display:none
        }
       .erank-preview img{
         max-width:300px;
         max-height:300px;
         width:auto;
         height:auto;
       }
       .erank-box{
         background:#ffffff;
         color:#222;
       }
       .erank-box thead th{
         background:#f6f6f6;
         color:#222;
       }
       .erank-box tbody tr:hover{
         background:#f2f2f2;
       }
       .erank-dark{
         background:#121212;
         color:#e6e6e6;
       }
       .erank-dark .erank-header{
         background:#181818;
         border-bottom:1px solid #2a2a2a;
       }
       .erank-dark input{
         background:#1f1f1f;
         color:#eee;
         border:1px solid #333;
       }
       .erank-dark table{
         background:#121212;
       }
       .erank-dark thead th{
         background:#1a1a1a;
         color:#ddd;
         border-bottom:1px solid #333;
       }
       .erank-dark tbody td{
         border-bottom:1px solid #242424;
         color:#e0e0e0;
       }
       .erank-dark tbody tr:hover{
         background:#1e1e1e;
       }
       .erank-dark .num{
         color:#bdbdbd;
       }
       .erank-dark .erank-table-wrap img{
         box-shadow:0 0 0 1px #333;
       }
       .erank-dark .erank-close{
         color:#aaa;
       }
       .erank-dark .erank-close:hover{
         color:#fff;
       }
       .erank-dark td[style]{
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.05);
       }
       .erank-dark span[style*="border-radius"]{
         box-shadow:0 0 0 1px rgba(255,255,255,.15);
       }
       /* preview dark uyumu */
       .erank-preview{
         background:#111;
       }
       .erank-filter-row input{
         padding:2px 4px;
         font-size:11px;
       }
       .erank-dark .erank-filter-row input{
         background:#1f1f1f;
         color:#eee;
         border:1px solid #333;
       }
    `);

    // Config yapısı
    const DEFAULT_CONFIG = {
        apiKeyUspto: await GM.getValue('apiKeyUspto', ''),
        sheetId: await GM.getValue('sheetId', ''),
        sheetId2: await GM.getValue('sheetId2', ''),
        //erankUserKey: await GM.getValue('erankUserKey', ''),
        authorization: await GM.getValue('authorization', ''),
        erankKey: await GM.getValue('erankKey', ''),
        range: await GM.getValue('range', ''),
        rangeLink: await GM.getValue('rangeLink', ''),
        privateKey: await GM.getValue('privateKey', ''),
        clientEmail: await GM.getValue('clientEmail', ''),
        team: await GM.getValue('team', 'X'),
        manager: await GM.getValue('manager', ''),
        config_version: await GM.getValue('config_version', '1'),
    };

    // Global değişkenler
    let config = {...DEFAULT_CONFIG};
    let configLoaded = false; // Add a flag to track if config is loaded
    let toastContainer = null;

    // Config kontrol fonksiyonu
    async function checkConfig() {
        if (!configLoaded) {
            await loadConfig();
        }
        return configLoaded;
    }

       // Config yönetimi
    async function loadConfig() {
        try {
            const savedConfig = await GM.getValue('Config');
            if (savedConfig) {
                config = {...DEFAULT_CONFIG, ...savedConfig};
                configLoaded = true;
                return true;
            }else if(DEFAULT_CONFIG.privateKey){
                await migrateConfig()
                configLoaded = true;
                return true;
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

    async function isConfigured() {
        if (!config.erankKey || !config.authorization) {
            //showToast('Erank Account credentials missing', 'error');
            return false;
        }
        return true;
    }

    async function validateConfig() {
        if (!configLoaded) {
            await loadConfig(); // Ensure config is loaded
        }

        if (!config.clientEmail || !config.privateKey) {
            //showToast('Google Service Account credentials missing', 'error');
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
        title.textContent = 'Etsy Erank Tool Ayarları';

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
            { id: 'apiKeyUspto', label: 'KeyUspto', type: 'text', value: config.apiKeyUspto },
            { id: 'authorization', label: 'authorization', type: 'text', value: config.authorization },
            { id: 'erankKey', label: 'erankKey', type: 'text', value: config.erankKey },
            { id: 'clientEmail', label: 'Client Email', type: 'text', value: config.clientEmail },
            { id: 'privateKey', label: 'Private Key', type: 'textarea', value: config.privateKey },
            { id: 'rangeLink', label: 'Range Link', type: 'text', value: config.rangeLink },
            { id: 'sheetId', label: 'Sheet ID', type: 'text', value: config.sheetId },
            { id: 'range', label: 'Range ', type: 'text', value: config.range },
            { id: 'sheetId2', label: 'SheetId2', type: 'text', value: config.sheetId2 },
            { id: 'team', label: 'Team', type: 'text', value: config.team },
            { id: 'manager', label: 'manager', type: 'text', value: config.manager },
            { id: 'config_version', label: 'config_version', type: 'text', value: config.config_version }

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

    // Elementi sürüklenebilir yap
    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // Fare pozisyonunu al
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // Fare hareket ettiğinde çağrılacak fonksiyon
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // Yeni pozisyonu hesapla
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // Elementin pozisyonunu ayarla
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            // Sabit konumdan çıkar
            element.style.bottom = "auto";
            element.style.right = "auto";
        }

        function closeDragElement() {
            // Sürükleme işlemini durdur
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    function observeElements(selector, callback, document) {
        const observedElements = new WeakSet();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.matches(selector) && !observedElements.has(node)) {
                            observedElements.add(node);
                            callback(node);
                        }
                        node.querySelectorAll(selector).forEach((child) => {
                            if (!observedElements.has(child)) {
                                observedElements.add(child);
                                callback(child);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        document.querySelectorAll(selector).forEach((element) => {
            if (!observedElements.has(element)) {
                observedElements.add(element);
                callback(element);
            }
        });
    }

    const CONFIG_URL = "https://raw.githubusercontent.com/cengaver/EtsyScript/refs/heads/main/config.json";
    async function fetchConfig() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: CONFIG_URL + "?t=" + Date.now(),
                onload: r => {
                    if (r.status !== 200) return reject();
                    resolve(JSON.parse(r.responseText));
                },
                onerror: reject
            });
        });
    }

    async function ensureBearer() {
        //showToast('Etsy Erank Authorization Güncelleniyor...', 'info');

        const localVersion = config.config_version ?? null;
        //showToast('Local versiyon: ' + localVersion, 'info');

        try {
            const cfg = await fetchConfig();
            //showToast('Remote versiyon: ' + cfg.version, 'info');

            if (cfg.version !== localVersion) {
                config.authorization = cfg.bearer;
                config.config_version = cfg.version;
                await saveConfig();
                //showToast('Authorization güncellendi', 'success');
            }

            return config.authorization;
        } catch {
            return config.authorization;
        }
    }

    async function doTheThing(window) {
        // Önce config'in yüklendiğinden emin ol
        if (!await checkConfig()) {
            showToast('Config yüklenemedi', 'error');
            return;
        }

        await getErankButtons();
        const sheetName = config.rangeLink.split("!")[0];
        //console.log(sheetName);
        const document = null; // use window.document instead!
        const location = null; // use window.location instead!
        const tokenUri = "https://oauth2.googleapis.com/token";

        // Then call this before attempting to create JWT
        async function createJwtToken() {
            try {
                const header = {
                    alg: "RS256",
                    typ: "JWT",
                };

                const now = Math.floor(Date.now() / 1000);
                const payload = {
                    iss: config.clientEmail,
                    scope: "https://www.googleapis.com/auth/spreadsheets", // Adjust scope as needed
                    aud: tokenUri,
                    exp: now + 3600, // 1 hour expiration
                    iat: now,
                };

                // Function to base64 encode JSON strings
                function base64Encode(obj) {
                    return btoa(JSON.stringify(obj))
                        .replace(/=/g, "")
                        .replace(/\+/g, "-")
                        .replace(/\//g, "_");
                }

                const encodedHeader = base64Encode(header);
                const encodedPayload = base64Encode(payload);

                // Sign the token using the private key
                const toSign = `${encodedHeader}.${encodedPayload}`;
                const signature = await signWithPrivateKey(toSign);
                return `${toSign}.${signature}`;
            } catch (error) {
                console.error('JWT creation failed:', error);
                return null;
            }
        }

        async function signWithPrivateKey(data) {
            try {
                const crypto = window.crypto.subtle || window.crypto.webkitSubtle;

                // Clean and prepare the private key
                const pemContents = config.privateKey
                .replace(/-----BEGIN PRIVATE KEY-----/, '')
                .replace(/-----END PRIVATE KEY-----/, '')
                .replace(/\s+/g, '');

                // Convert from Base64 to ArrayBuffer
                const binaryString = atob(pemContents);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                // Import the key
                const key = await crypto.importKey(
                    'pkcs8',
                    bytes.buffer,
                    { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
                    false,
                    ['sign']
                );

                // Sign the data
                const signature = await crypto.sign(
                    'RSASSA-PKCS1-v1_5',
                    key,
                    new TextEncoder().encode(data)
                );

                // Convert signature to Base64URL
                return btoa(String.fromCharCode(...new Uint8Array(signature)))
                    .replace(/=/g, '')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_');
            } catch (error) {
                console.error('Error in signWithPrivateKey:', error);
                showToast('JWT signing failed. Check private key format.', 'error');
                throw error; // Re-throw to be caught by caller
            }
        }

        // Helper: Convert PEM private key to ArrayBuffer
        function pemToArrayBuffer(pem) {
            const base64 = pem
            .replace(/-----BEGIN PRIVATE KEY-----/, "")
            .replace(/-----END PRIVATE KEY-----/, "")
            .replace(/\n/g, "");
            //console.log(base64);
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }

        // Modify getAccessToken to wait for config
        async function getAccessToken(e) {
            let AccToken = JSON.parse(sessionStorage.getItem('AccessToken')) || null;
            if (AccToken) {
                return AccToken;
            }

            if (!await validateConfig()) return null;

            // Rest of the function remains the same...
            const jwt = await createJwtToken();
            if (!jwt) {
                showToast('Failed to create JWT token', 'error');
                return null;
            }

            const response = await fetch(tokenUri, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    assertion: jwt,
                }),
            });

            const data = await response.json();
            sessionStorage.setItem('AccessToken', JSON.stringify(data.access_token));
            return data.access_token;
        }


        function convertToNumber(age) {
            // Virgülü kaldırıp noktaya çeviriyoruz
            let cleanedAge = age.replace(',', '');
            // Number ile dönüştürüyoruz
            let numericAge = Number(cleanedAge);

            // Sayı değilse bir hata mesajı verebiliriz
            if (isNaN(numericAge)) {
                console.error("Geçerli bir sayı değil:", age);
                return null;
            }

            return numericAge;
        }

        // Google Sheets'e link ekle
        async function saveToGoogleSheet(sheet, link, title, img, sales, age, tag) {
            const accessToken = await getAccessToken();
            if(!accessToken) return;

            const tags = tag.join(", ");
            // 1. Mevcut son dolu satırı bul
            let linkAlreadyExists = false;
            let lastRow = 0;
            await GM.xmlHttpRequest({
                method: "GET",
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${config.rangeLink}?majorDimension=COLUMNS`,
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                },
                onload: function (response) {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        if (data.values && data.values[0]) {
                            // Mevcut linklerle karşılaştır
                            if (data.values[0].includes(link)) {
                                linkAlreadyExists = true; // Link zaten mevcut
                            }
                        }
                        if (data.values && data.values.length > 0) {
                            lastRow = data.values[0].length; // En son dolu satır sayısını al
                        }
                    } else {
                        sessionStorage.removeItem('AccessToken');
                        console.error("Veri alınırken hata oluştu:", response.responseText);
                        showToast('Veri alınırken hata oluştu', 'error');
                    }
                },
                onerror: function (error) {
                    console.error("GET isteği hatası:", error);
                    showToast("GET isteği hatası", 'error');
                }
            });

            // Eğer link zaten varsa, işlem yapılmasın ve uyarı verilsin
            if (linkAlreadyExists) {
                showToast(title + '\n zaten var!', 'error');
                //alert("Bu link zaten eklenmiş.");
                return; // İşlem sonlanır, link eklenmez
            }
            // 2. Linki en son satırın altına ekle
            const newRow = lastRow + 1;

            let body;

            if (config.rangeLink == "Liste!D:D") {
                body = {
                    range: `Liste!D${newRow}:J${newRow}`,
                    majorDimension: "ROWS",
                    values: [
                        [
                            link,
                            img,
                            title,
                            null,
                            tags,
                            sales,
                            age
                        ]
                    ]
                };
            } else {
                const sheetName = config.rangeLink.split("!")[0];
                body = {
                    range: `${sheetName}!F${newRow}:P${newRow}`,
                    majorDimension: "ROWS",
                    values: [
                        [
                            link,
                            img,
                            title,
                            null,
                            config.team,
                            config.manager,
                            tags,
                            null,
                            null,
                            sales,
                            age
                        ]
                    ]
                };
            }

            await GM.xmlHttpRequest({
                method: "PUT",
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${body.range}?valueInputOption=RAW`,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                data: JSON.stringify(body),
                onload: function (response) {
                    if (response.status === 200 || response.status === 201) {
                        console.log("Başarıyla eklendi:", link);
                        console.log("Başarıyla resim eklendi:", img);
                        showToast(title + '\n listeye eklendi!');
                    } else {
                        console.error("Ekleme hatası:", response.responseText);
                    }
                },
                onerror: function (error) {
                    console.error("PUT isteği hatası:", error);
                }
            });
        }

        // Google Sheets ve eRank işlemleri için aynı kodları kullandım.
        const fetchColumnData = async (sID = null) => {
            if (!config.sheetId && !config.sheetId2) return
            let cacheKey;
            let sheet;
            if (sID && config.sheetId2) {
                cacheKey = 'cachedData2';
                sheet = config.sheetId2;
            } else {
                cacheKey = 'cachedData';
                sheet = config.sheetId;
            }
            const cacheTimestampKey = `${cacheKey}_timestamp`;
            const now = Date.now();
            //console.log("cacheKeyFetch",cacheKey);
            const cachedData = JSON.parse(localStorage.getItem(cacheKey));
            const cacheTimestamp = localStorage.getItem(cacheTimestampKey);

            if (cachedData && cacheTimestamp && now - parseInt(cacheTimestamp) < 1 * 60 * 60 * 1000) {
                return cachedData;
            }
            if (cachedData) { localStorage.removeItem(cacheKey) }

            const accessToken = await getAccessToken();
            if(!accessToken) return;

            await GM.xmlHttpRequest({
                method: "GET",
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${config.range}`,
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                },
                onload: function (response) {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        const processedData = data.values
                        .filter(row => row[0] != null && row[0] !== '') // row[0] boş değilse devam et
                        .map(row => ({
                            id: row[row.length - 1], // AD sütunu (son sütun)
                            dnoValue: row[0], // E sütunu (ilk sütun)
                            gDrive: row[row.length - 3], // AB gDrive serach
                            team: row[5], // J sütunu
                        }));
                        localStorage.setItem(cacheKey, JSON.stringify(processedData));
                        localStorage.setItem(cacheTimestampKey, now.toString());
                        return { processedData };
                    } else {
                        sessionStorage.removeItem('AccessToken');
                        console.error("Veri alınırken hata oluştu:", response.responseText);
                    }
                },
                onerror: function (error) {
                    console.error("GET isteği hatası:", error);
                }
            });
        };

        const findEValueById = (id, sID = null) => {
            let cacheKey;
            if (sID) {
                cacheKey = 'cachedData2';
            } else {
                cacheKey = 'cachedData';
            }
            //console.log("cacheKeyFind",cacheKey);
            const cachedData = JSON.parse(localStorage.getItem(cacheKey)) || [];
            const match = cachedData.find(row => row.id === id);
            const dnoValue = match ? match.dnoValue : null;
            const gDrive = match ? match.gDrive : null;
            const teamname = match ? match.team : null;
            return { dnoValue, gDrive, teamname };
        };

        const getErankData = async (id, imgUrl=null, link=null) => {
            const cacheKey = `erank_${id}`;
            const now = Date.now();
            const cachedData = JSON.parse(localStorage.getItem(cacheKey));

            if (
                cachedData &&
                now - parseInt(cachedData.timestamp) < 48 * 60 * 60 * 1000 &&
                "tags" in cachedData &&
                "title" in cachedData
            ) {
                return cachedData;
            }
            if (cachedData) { localStorage.removeItem(cacheKey) }
            if (!await isConfigured()) return;
            console.log("authorization :", config.authorization)
            //console.log("erankKey :", config.erankKey)
            const url = `https://members.erank.com/api/ext/listing/${id}`;

            try {
                const headers = {
                    accept: "application/json, text/plain, */*",
                    authorization: `${config.authorization}`,
                    "x-erank-key": config.erankKey,
                    "x-user-agent": "erank-bx/1.0",
                }

                const { response } = await GM.xmlHttpRequest({
                    url,
                    headers,
                    responseType: "json",
                });

                if (!response.data) {
                    console.error("eRank API error:", response.error.code, response.error.message);
                    return {
                        error: response.error.code == 404 ? "Not found" : "Error",
                    }
                }
                const age = convertToNumber(response.data.stats.listing_age);
                const sales = convertToNumber(response.data.stats.est_sales.label);
                const erankData = {
                    sales: sales,
                    age: age,
                    title: response.data.title,
                    timestamp: now.toString(),
                    tags: Object.keys(response.data.tags),
                    link: link,
                    img: imgUrl,
                    quantity: convertToNumber(response.data.stats.quantity),
                    views: convertToNumber(response.data.stats.views),
                    favorers: convertToNumber(response.data.stats.favorers),
                    est_conversion_rate: response.data.stats.est_conversion_rate.value
                };
                const erankLogData = {
                    id: id,
                    link: link,
                    img: imgUrl,
                    title: response.data.title,
                    tag: Object.keys(response.data.tags),
                    sls: sales,
                    day: age,
                    quantity: convertToNumber(response.data.stats.quantity),
                    views: convertToNumber(response.data.stats.views),
                    favorers: convertToNumber(response.data.stats.favorers),
                    est_conversion_rate: response.data.stats.est_conversion_rate.value
                };
                safeSetItem(cacheKey, JSON.stringify(erankData));
                if ((age >= 1 && age <= 50) && ( sales / 1.5 > age) ){
                    //console.log("age",age);
                    //console.log(response.data);
                    await logToGoogleSheets(erankLogData);
                }
                //console.log(erankLogData);
                return erankData;
            } catch (error) {
               if (!await ensureBearer()) {
                showToast('Erank Authorization Yüklenemedi', 'error');
                }
                //showToast('Erank Login OL', 'error');
                console.error("eRank data fetch error:", error);
            }
        };

        function openErankTableModal(){
            if(window.document.getElementById("erank-table-modal")) return

            let data=getAllErankItems()
            const stats = buildStats(data)
            let filteredData=[...data]
            let sortKey=null, sortDir=1

           const modal=window.document.createElement("div")
           modal.id="erank-table-modal"

           modal.innerHTML=`
           <div class="erank-box">
              <div class="erank-header">
                <strong>eRank Cache</strong>
                <input id="erank-search" placeholder="Title ara…">
                <span id="erank-count"></span>
                <span class="erank-filter-row">Sales:
                  <input id="sales-min" placeholder="min" type="number" style="width:60px">
                  <input id="sales-max" placeholder="max" type="number" style="width:60px">
                </span>
                <span class="erank-filter-row">Age:
                  <input id="age-min" placeholder="min" type="number" style="width:50px">
                  <input id="age-max" placeholder="max" type="number" style="width:50px">
                </span>
                <button id="erank-theme-toggle"
                  style="margin-left:auto;padding:4px 10px;cursor:pointer">
                  🌙 Dark
                </button>

                <span class="erank-close" id="erank-close">✕</span>
              </div>

             <div class="erank-table-wrap">
               <table>
                 <thead>
                   <tr>
                     <th>Img</th>
                     <th data-k="title">Title</th>
                     <th data-k="sales">Sales</th>
                     <th data-k="rank">Rank</th>
                     <th data-k="views">Views</th>
                     <th data-k="favorers">Fav</th>
                     <th data-k="quantity">Qty</th>
                     <th data-k="est_conversion_rate">Conv %</th>
                     <th data-k="age">Age</th>
                   </tr>
                 </thead>
                 <tbody id="erank-body"></tbody>
               </table>
             </div>
           </div>
           `
           window.document.body.appendChild(modal)

           const body=modal.querySelector("#erank-body")
           const count=modal.querySelector("#erank-count")
           const search=modal.querySelector("#erank-search")

           function render(rows,stats){
               body.innerHTML = rows.map(d => {
                   const s=trendScore(d,stats)
                   const b=trendBadge(s,p50,p75,p90)
                   return `
                 <tr>
                   <td>
                     ${d.link
                       ? `<a href="${d.link}" target="_blank" class="erank-img-link">
                            <img src="${toFullImg(d.img||"")}" data-previews="${toFullImg(d.img||"",200)}">
                          </a>`
                       : `<img src="${toFullImg(d.img||"")}" data-previews="${toFullImg(d.img||"",200)}">`
                     }
                   </td>

                   <td>${d.title||"-"}</td>

                   <td class="num"
                     style="background:${salesColor(d.sales||0,salesMin,salesMax)}">
                     ${d.sales??""}
                   </td>
                   <td>
                    <span style="
                      display:inline-flex;
                      align-items:center;
                      gap:4px;
                      padding:2px 8px;
                      border-radius:12px;
                      font-size:11px;
                      font-weight:600;
                      line-height:1;
                      white-space:nowrap;
                      background:${b.c};
                      color:#fff">
                      ${b.t}
                    </span>
                   </td>
                   <td class="num">${d.views??""}</td>
                   <td class="num">${d.favorers??""}</td>
                   <td class="num">${d.quantity??""}</td>

                   <td class="num"
                     style="background:${convColor(d.est_conversion_rate||0,convMin,convMax)}">
                     ${d.est_conversion_rate??""}
                   </td>

                   <td class="num">${d.age??""}</td>
                 </tr>
               `
             }).join("")

             count.textContent = `(${rows.length})`
           }

           const salesVals=data.map(d=>Number(d.sales)||0)
           const convVals=data.map(d=>Number(d.est_conversion_rate)||0)

           const salesMin=Math.min(...salesVals)
           const salesMax=Math.max(...salesVals)
           const convMin=Math.min(...convVals)
           const convMax=Math.max(...convVals)
           const trendScores=data.map(d=>trendScore(d,stats)).sort((a,b)=>a-b)
           const p50=trendScores[Math.floor(trendScores.length*0.50)]
           const p75=trendScores[Math.floor(trendScores.length*0.75)]
           const p90=trendScores[Math.floor(trendScores.length*0.90)]

           render(data,stats)

            modal.querySelectorAll("thead th[data-k]").forEach(th=>{
             th.onclick=()=>{
               const k=th.dataset.k
               sortDir=(sortKey===k)?-sortDir:1
               sortKey=k
               data.sort((a,b)=>(Number(a[k]||0)-Number(b[k]||0))*sortDir)
               render(data,stats)
             }
           })

            search.oninput=()=>{
                const q=search.value.toLowerCase()
                filteredData=data.filter(d=>(d.title||"").toLowerCase().includes(q))
                applyFilters()
            }

           const preview=window.document.createElement("div")
           preview.className="erank-preview"
           preview.innerHTML="<img>"
           window.document.body.appendChild(preview)
           window.document.body.addEventListener("mousemove",e=>{
                const t=e.target
                if(t.tagName==="IMG" && t.dataset.previews){
                    const img=preview.querySelector("img")
                    if(img.src!==t.dataset.previews) img.src=t.dataset.previews

                    preview.style.display="block"

                    const pad=20
                    const pw=preview.offsetWidth
                    const ph=preview.offsetHeight
                    const vw=window.innerWidth
                    const vh=window.innerHeight

                    let x=e.clientX+pad
                    let y=e.clientY+pad

                    if(x+pw>vw) x=e.clientX-pw-pad
                    if(y+ph>vh) y=e.clientY-ph-pad

                    preview.style.left=x+"px"
                    preview.style.top=y+"px"
                }else{
                    preview.style.display="none"
                }
            })
            const box=modal.querySelector(".erank-box")
            const toggle=modal.querySelector("#erank-theme-toggle")

            const savedTheme=localStorage.getItem("erank_theme")||"dark"
            if(savedTheme==="dark"){
                box.classList.add("erank-dark")
                toggle.textContent="☀️ Light"
            }
            toggle.onclick=()=>{
                const dark=box.classList.toggle("erank-dark")
                localStorage.setItem("erank_theme",dark?"dark":"light")
                toggle.textContent=dark?"☀️ Light":"🌙 Dark"
            }
            function applyFilters(){
                const sMin=getNum("sales-min")
                const sMax=getNum("sales-max")
                const aMin=getNum("age-min")
                const aMax=getNum("age-max")

                let rows=data.filter(d=>{
                    const s=Number(d.sales)||0
                    const a=Number(d.age)||0

                    if(!Number.isNaN(sMin) && s<sMin) return false
                    if(!Number.isNaN(sMax) && s>sMax) return false
                    if(!Number.isNaN(aMin) && a<aMin) return false
                    if(!Number.isNaN(aMax) && a>aMax) return false

                    return true
                })
                filteredData=rows
                render(filteredData,stats)
            }

            ["sales-min","sales-max","age-min","age-max"].forEach(id=>{
                const el=window.document.getElementById(id)
                if(el) el.oninput=applyFilters
            })

            modal.querySelector("#erank-close").onclick=()=>modal.remove()
         }

        function buildStats(data){
            const num=(v)=>Number(v)||0
            const arr=f=>data.map(d=>num(f(d)))

            return {
                salesMin:Math.min(...arr(d=>d.sales)),
                salesMax:Math.max(...arr(d=>d.sales)),

                viewsMin:Math.min(...arr(d=>d.views)),
                viewsMax:Math.max(...arr(d=>d.views)),

                favMin:  Math.min(...arr(d=>d.favorers)),
                favMax:  Math.max(...arr(d=>d.favorers)),

                convMin: Math.min(...arr(d=>d.est_conversion_rate)),
                convMax: Math.max(...arr(d=>d.est_conversion_rate)),

                spdMin:  Math.min(...arr(d=>salesPerDay(d))),
                spdMax:  Math.max(...arr(d=>salesPerDay(d)))

            }
        }
        function getNum(id){
            const v=window.document.getElementById(id)?.value
            return v===""||v==null ? NaN : Number(v)
        }

        function logNorm(v,min,max){
            if(v<=0) return 0
            return (Math.log(v)-Math.log(min+1)) /
                (Math.log(max+1)-Math.log(min+1))
        }

        function trendBadge(score,p50,p75,p90){
            //return {t:score,c:"#6b7280"}
            if(score>=p90) return {t:"🔥 Breakout",c:"#15803d"}
            if(score>=p75) return {t:"🚀 Rising",c:"#f44336"}
            if(score>=p50) return {t:"👀 Watch",c:"#ca8a04"}
            return {t:"⏸ Cold",c:"#b91c1c"}
        }

        function trendScore(d,stats){
            if(d.age<3||d.age>60) return 0
            if(d.sales==0) return 0

            const sales = logNorm(d.sales,stats.salesMin,stats.salesMax)
            const spd   = logNorm(d.sales/(d.age||1),stats.spdMin,stats.spdMax)
            const conv  = norm(d.est_conversion_rate,stats.convMin,stats.convMax)
            const views = logNorm(d.views,stats.viewsMin,stats.viewsMax)
            const favScore =norm(d.favorers,stats.favMin,stats.favMax)

            return (
                sales*0.55 +
                spd *0.15 +
                conv *0.15 +
                views*0.05+
                favScore * 0.10
            )
        }

        function salesPerDay(d){
            if(!d.age||d.age<=0) return 0
            return d.sales/d.age
        }

        function norm(v,min,max){
            if(max===min) return 0
            return (v-min)/(max-min)
        }

        function invNorm(v,min,max){
            if(max===min) return 1
            return 1-(v-min)/(max-min)
        }

        function salesColor(v,min,max){
            const t=norm(v,min,max)
            return `rgba(76,175,80,${0.15+0.6*t})`
        }

        function convColor(v,min,max){
            const t=norm(v,min,max)
            return `rgba(${Math.round(33*(1-t))},${Math.round(150+80*t)},243,${0.15+0.6*t})`
        }


        function toFullImg(url,size=120){
            if(!url) return url
            return url.replace(/il_\d+x\d+|il_\d+xN|il_\d+x\d+_|\b\d+x\d+\b/,`il_${size}x${size}`)
        }

        async function getErankButtons(){
            const b=window.document.createElement("button")
            b.textContent="📊 eRank Table"
            b.style.cssText="position:fixed;bottom:20px;right:20px;z-index:999999"
            b.onclick=openErankTableModal
            window.document.body.appendChild(b)
        }

        function getAllErankItems(){
            const rows=[]
            for(let i=0;i<localStorage.length;i++){
                const k=localStorage.key(i)
                if(k.startsWith("erank_")){
                    try{
                        const row = JSON.parse(localStorage.getItem(k));
                        if (row && "img" in row) rows.push(row);
                    }catch(e){}
                }
            }
            return rows
        }

        function simplifyEtsyUrl(url) {
            try {
                let urlObj = new URL(url);
                let pathParts = urlObj.pathname.split('/');
                if (pathParts.length > 3) {
                    return `https://www.etsy.com/listing/${pathParts[2]}/${pathParts[3]}`;
                }
                console.error('format beklenmedik', url);
                return url; // Eğer format beklenmedikse orijinal URL'yi döndür
            } catch (error) {
                console.error('Geçersiz URL:', error);
                return null;
            }
        }

        function handleLocalStorageQuota() {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('erank')) {
                    localStorage.removeItem(key);
                    i--; // Silme sonrası indeks kaymasını önlemek için azalt
                }
            }
            showToast("LocalStorage doldu, 'erank' ile başlayan tüm anahtarlar silindi.", 'error');
            console.log("LocalStorage doldu, 'erank' ile başlayan tüm anahtarlar silindi.");
        }

        function safeSetItem(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    console.warn("LocalStorage dolu! 'erank' anahtarlarını temizliyorum...");
                    handleLocalStorageQuota();
                    try {
                        localStorage.setItem(key, value); // Tekrar dene
                    } catch (error) {
                        console.error("Yeterli alan açılamadı. LocalStorage işlemi başarısız.", error);
                    }
                } else {
                    console.error("LocalStorage hatası:", e);
                }
            }
        }

        function extractFirstParts(text) {
            const keywords = ['Sweatshirt', 'T Shirt', 'T-Shirt', 'Tshirt', 'Shirt', 'Hoodie', 'Png', 'Svg', 'Tee','DTF'].map(k => k.toLowerCase());
            const lowerText = text.toLowerCase();
            let minPosition = Infinity;
            let closestKeyword = '';

            for (let keyword of keywords) {
                const position = lowerText.indexOf(keyword);
                if (position !== -1 && position < minPosition) {
                    minPosition = position;
                    closestKeyword = keyword;
                }
            }

            let result = closestKeyword !== ''
            ? lowerText.substring(0, minPosition).trim().replace(/comfort colors /i, "")
            : lowerText;

            return result
                .replace("&#39;", "'")
                .replace(/'/g, "'")
                .replace(/\b\w/g, char => char.toUpperCase())
        }

        async function checkTrademark(term) {
            const classCode = '025'; // Filtrelenecek sınıf kodu
            const url = `https://developer.uspto.gov/trademark/v1/trademarks?searchText=${encodeURIComponent(term)}&fields=markIdentification,goodsAndServicesClassification`;

            try {
                const response = await fetch(url, {
                    headers: {
                        'X-Api-Key': config.apiKeyUspto, // API anahtarını header'a ekleyin
                    },
                });

                // Yanıtı kontrol et
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
                }

                const data = await response.json();

                // Sınıf kodu ile filtreleme
                const filteredResults = data.results.filter(result => {
                    // goodsAndServicesClassification alanını kontrol et
                    return result.goodsAndServicesClassification && result.goodsAndServicesClassification.includes(classCode);
                });

                if (filteredResults.length > 0) {
                    console.log(`'${term}' kelimesi 025 sınıfında zaten kayıtlı.`);
                    console.log(filteredResults);
                } else {
                    console.log(`'${term}' kelimesi 025 sınıfında kayıtlı değil.`);
                }
            } catch (error) {
                console.error('Hata oluştu:', error);
            }
        }

        async function logToGoogleSheets(data) {
            const sheetUrl = "https://script.google.com/macros/s/AKfycbxuh_lJRDY4ZCVY3js2JVlIdusGmb3RtDd4IlH82hisewmwR13PUogxW9pUuX8h0C-e/exec";
            try {
                const response = await fetch(sheetUrl, {
                    method: "POST",
                    mode: 'no-cors', //KALDIRILDI (CORS sorunu için alternatif çözüm aşağıda)
                    body: JSON.stringify({
                        id: String(data.id), // ID'yi string'e kesin olarak dönüştür
                        link: data.link || "",
                        img: data.img || "",
                        title: data.title || "",
                        tag: data.tag || "",
                        sls: data.sls || "",
                        day: data.day || "",
                        quantity: data.quantity || "",
                        views: data.views || "",
                        favorers: data.favorers || "",
                        est_conversion_rate: data.est_conversion_rate || "",
                        team: config.team || ""
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + getAccessToken() // Opsiyonel güvenlik
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.text();
                console.log("Sunucu yanıtı:", result);
                return result;
            } catch (error) {
                //console.error("İletişim hatası:", error);
                // Fallback mekanizması (localStorage veya başka bir loglama)
                //saveFailedRequest(data, error);
                //throw error;
            }
        }

        function saveFailedRequest(data, error) {
            const failedRequests = JSON.parse(localStorage.getItem('failedSheetRequests') || '[]');
            failedRequests.push({ data, error, timestamp: new Date().toISOString() });
            localStorage.setItem('failedSheetRequests', JSON.stringify(failedRequests));
        }

        const createOverlayOnElement = async ({
            element,
            id,
            imgUrl = null,
            url = null,
        }) => {
            //console.log("Creating overlay on", element);
            //console.log("Creating overlay id : ", id);
            const overlay = window.document.createElement("div");
            overlay.style.display = "flex";
            overlay.style.gap = "0.5rem";
            overlay.style.cursor = "alias";
            overlay.style.color = "black";
            overlay.style.padding = "1px";
            element.appendChild(overlay);

            const loadingEl = window.document.createElement("div");
            loadingEl.textContent = "Erank verileri yükleniyor...";
            overlay.appendChild(loadingEl);

            // Etsy ürün linkini al
            url ??= element.querySelector("a.listing-link")?.href ?? element.querySelector("a.v2-listing-card__img")?.href ?? window.location.href
            const currentUrl = simplifyEtsyUrl(url);//**
            //console.log(currentUrl);
            const img = imgUrl ?? element.querySelector("img")?.src;

            const erankData = await getErankData(id,img,currentUrl);
            if (erankData.error) {
                if (erankData.error === "Not found") {
                    loadingEl.textContent = "Erank verileri bulunamadı.";
                } else {
                    loadingEl.textContent = "Erank'a giriş yapın.";
                }
                return
            }

            const { sales, age, title, tags } = erankData;
            loadingEl.remove();

            //console.log(img)
            if (config.sheetId !== "") {
                let { dnoValue, gDrive, teamname } = findEValueById(id) || ""; // Eğer değer bulunmazsa boş string
                const result = dnoValue ? "❤️" : "🤍";
                const tooltipText = dnoValue ? `Dizayn NO: ${dnoValue} by ${teamname}` : `Listeye EKLE!`;

                // Kalp sarmalayıcı
                const heartWrapper = window.document.createElement("div");
                heartWrapper.style.position = "relative"; // Konumlandırma için relative
                heartWrapper.style.display = "inline-block";

                // Kalp elementi
                const resultEl = window.document.createElement("div");
                resultEl.textContent = result;
                resultEl.title = tooltipText;
                resultEl.style.marginLeft = "1px";
                resultEl.style.fontSize = "1.6rem";
                resultEl.style.color = dnoValue ? "red" : "black";

                if (!dnoValue) {
                    resultEl.style.cursor = "cell";
                    resultEl.href = "#";
                    heartWrapper.addEventListener("click", async function () {
                        resultEl.style.backgroundColor = "orange"
                        await saveToGoogleSheet(config.sheetId, currentUrl, title, img, sales, age, tags);
                        resultEl.textContent = "❤️"
                        resultEl.style.backgroundColor = null
                        //showToast(title + '\n listeye eklendi!');
                    });
                } else {
                    if (gDrive) {
                        heartWrapper.addEventListener("click", async function () {
                            window.open(gDrive, "_blank");
                        });
                    }
                    // Rozet elementi (sadece değer varsa ekle)
                    const badgeEl = window.document.createElement("span");
                    resultEl.style.cursor = "hand";
                    badgeEl.textContent = dnoValue;
                    badgeEl.style.position = "absolute";
                    badgeEl.style.top = "-4px"; // Daha yukarı taşı
                    badgeEl.style.left = "-19px"; // Daha sağa taşı
                    badgeEl.style.backgroundColor = "gold";
                    badgeEl.style.color = "black";
                    badgeEl.style.borderRadius = "50%";
                    badgeEl.style.padding = "2px 5px";
                    badgeEl.style.fontSize = "0.8rem";
                    badgeEl.style.fontWeight = "bold";
                    heartWrapper.appendChild(badgeEl);
                }
                // Kalp ve overlay düzenlemeleri
                heartWrapper.appendChild(resultEl);
                overlay.appendChild(heartWrapper);
            }else{
                showToast('Sheet Id okunamadı', 'error');
            }
            // Satış ve yaş elementleri
            const salesEl = window.document.createElement("div");
            salesEl.textContent = `Satış: ${sales}`;
            if (Number(sales) / 1.3 > Number(age)) salesEl.style.backgroundColor = "green";
            else if (Number(sales) == 0 ) salesEl.style.backgroundColor = "red";
            overlay.appendChild(salesEl);

            const ageEl = window.document.createElement("div");
            ageEl.textContent = `Yaş: ${age}`;
            if (age >= 1 && age <= 50) ageEl.style.backgroundColor = "#73C476";
            else if (age >= 51 && age <= 100) ageEl.style.backgroundColor = "#C5E1A5";
            else if (age >= 101 && age <= 300) ageEl.style.backgroundColor = "#FFD54F";
            else if (age >= 301 && age <= 7000) ageEl.style.backgroundColor = "#EF9A9A";
            overlay.appendChild(ageEl);

            function copyTextToClipboard(text) {
                navigator.clipboard.writeText(text).then(function () {
                    showToast('Text successfully copied to clipboard!');
                    console.log('Text successfully copied to clipboard!');
                }).catch(function (error) {
                    console.error('Unable to copy text to clipboard', error);
                });
            }

            const buttonEl = window.document.createElement("button")
            buttonEl.textContent = "C"
            buttonEl.title = "Tag copy erank"
            buttonEl.style = "cursor: grab"
            buttonEl.onclick = () => copyTextToClipboard(tags.join(", "))
            overlay.appendChild(buttonEl);
            let trade = extractFirstParts(title)
            if (trade) {
                let uspto;
                if (config.apiKeyUspto) {
                    //uspto = checkTrademark(trade);
                }
                if (config.apiKeyUspto && uspto) {
                    const buttonElTrade = window.document.createElement("button")
                    buttonElTrade.title = "Trade Mark Var"
                    buttonElTrade.style = "cursor: no-drop"
                    buttonElTrade.textContent = "🚨"
                    //buttonElTrade.onclick = () => window.open(`https://www.trademarkia.com/search/trademarks?q=${trade}&country=us&codes=025&status=registered`, '_blank')
                    overlay.appendChild(buttonElTrade);
                } else {
                    const buttonElTrade = window.document.createElement("button")
                    buttonElTrade.title = "Trade Mark Kontrol et"
                    buttonElTrade.style = "cursor: help"
                    buttonElTrade.textContent = "T"
                    buttonElTrade.onclick = () => window.open(`https://www.trademarkia.com/search/trademarks?q=${trade}&country=us&codes=025&status=registered`, '_blank')
                    overlay.appendChild(buttonElTrade);
                }
            }

            if (config.sheetId2 !== "") {
                // Kalp2 elementi
                let { dnoValue, gDrive, teamname } = findEValueById(id, 2) || ""; // Eğer değer bulunmazsa boş string
                const result2 = dnoValue ? "✅" : "⭐";
                const tooltipText2 = dnoValue ? `Dizayn NO: ${dnoValue} by ${teamname}` : `İsteğe EKLE! -${id}`;
                const resultEl2 = window.document.createElement("div");
                resultEl2.textContent = result2;
                resultEl2.title = tooltipText2;
                resultEl2.style.marginLeft = "1px";
                resultEl2.style.fontSize = "1.6rem";

                if (!dnoValue) {
                    resultEl2.style.cursor = "cell";
                    resultEl2.href = "#";
                    resultEl2.addEventListener("click", async function () {
                        resultEl2.style.backgroundColor = "orange"
                        await saveToGoogleSheet(config.sheetId2, currentUrl, title, img, sales, age, tags);
                        resultEl2.textContent = "✅"
                        resultEl2.style.backgroundColor = null
                        //showToast(title + '\n listeye eklendi!');
                    });
                } else {
                    if (gDrive) {
                        resultEl2.addEventListener("click", async function () {
                            window.open(gDrive, "_blank");
                        });
                    }
                }
                overlay.appendChild(resultEl2);
            }
        };

        const handleListingPage = async () => {
            const urlParts = window.location.pathname.split('/');
            const id = urlParts[urlParts.indexOf('listing') + 1];
            //const titleElement = window.document.querySelector("#listing-page-cart > div.wt-mt-xs-1.wt-mb-xs-3 > h1")
            const titleElement = window.document.querySelector("#listing-page-cart > div.wt-mt-xs-1.wt-mb-xs-1 > h1")
            const imgElement = window.document.querySelector("#photos > div > div > ul > li > img")
            if (titleElement && id) {
                await createOverlayOnElement({
                    element: titleElement,
                    id,
                    imgUrl: imgElement.src,
                });
            }
        };

        const initOverlay = async () => {
            const addOverlay = async (el) => {
                //console.log(el);
                const id = el.dataset.listingId;
                //const infoEl = el.querySelector(".streamline-spacing-pricing-info streamline-spacing-reduce-margin") || el;
                const infoEl = el.querySelector(".streamline-spacing-pricing-info streamline-spacing-reduce-margin") || el;
                await createOverlayOnElement({
                    element: infoEl,
                    id,
                });
            };

            observeElements("[data-listing-id][data-listing-card-v2]", addOverlay, window.document);
        };

        if (config.sheetId !== "") await fetchColumnData();
        if (config.sheetId2 !== "") await fetchColumnData(2);

        async function waitFor(conditionFn, delay = 500, timeout = 30_000) {
            const startTime = Date.now();

            while (!conditionFn()) {
                if (Date.now() - startTime > timeout) {
                    throw new Error('Timeout reached while waiting for condition');
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            return true;
        }

        function ehuntOverlay() {
            //console.log("ehuntOverlay is working");
            const addOverlay = async (el) => {
                const imgEl = el.querySelector("img");
                await waitFor(() => imgEl.dataset.src); // wait for img tag to load

                const imgUrl = imgEl.dataset.src.replace("/il_120xN","/il_620xN");
                const infoEl = el.querySelector(".src-css-product-productInfoSub-3svU") || el;
                const linkEl = el.querySelector(".cell > div > a:first-child")
                const url = linkEl.href;
                const id = /https:\/\/www\.etsy\.com\/listing\/(\d+)\/.+/.exec(url)[1];

                const titleEl = el.querySelector(".product_title")
                const title = titleEl.textContent;

                await createOverlayOnElement({
                    element: infoEl,
                    id,
                    imgUrl,
                    url,
                });
            };

            observeElements(".el-table__row", addOverlay, window.document);
        }

        function purchasesOverlay() {

            const addOverlay = async (el) => {
                const info = readTransaction(el)
                const imgUrl = info.image.replace("/il_300x300","/il_600x600");
                const infoEl = el.querySelector('.transaction-download.transaction-data') || el.querySelector('.transaction-downloads') || el.querySelector('.transaction-download');
                const url = info.link;
                const id = /https:\/\/www\.etsy\.com\/listing\/(\d+)\/.+/.exec(url)[1];
                const title = info.title;

                await createOverlayOnElement({
                    element: infoEl,
                    id,
                    imgUrl,
                    url,
                });
            };
            observeElements("li.transaction", addOverlay, window.document);
        }

        const ehuntOverlayDetail = async () => {
            //console.log("ehuntOverlay Detail is working");
            const urlParts = window.location.pathname.split('/');
            const id = urlParts[3];
            //console.log("id :",id);
            //console.log("urlParts :",urlParts);
            const addOverlay = async (el) => {
                //console.log("imgEl :",imgEl);
                await waitFor(() => el.querySelector("#indexCarImg")?.src); // wait for img tag to load
                const imgEl = el.querySelector("#indexCarImg")
                const titleElement = el.querySelector('#header_container > div:nth-child(2) > div:nth-child(2)');
                //console.log("Waited imgEl src :",imgEl.src);
                //console.log("titleElement :",titleElement);
                if (titleElement && id) {
                    await createOverlayOnElement({
                        element: titleElement,
                        id,
                        imgUrl: imgEl.src,
                        //url:??
                    });
                }
            }
            observeElements(".etsy-container", addOverlay, window.document);
        }

        async function waitForValidEHuntDocument() {
            //console.log(window.document.location.href);
            while (
                !(window.document.location.href.startsWith('https://ehunt.ai/iframe/etsy-product-research?') ||
                  window.document.location.href.startsWith('https://ehunt.ai/iframe/product-detail'))
                || window.document.readyState !== "complete"
            ) {
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
            //console.log("Document is ready:", window.document.location.href);
        }

        function parsePriceToNumber(s){
            if(!s) return null;
            s = s.toString().trim().replace(/\s+/g,'').replace(/[^0-9\.,-]/g,'');
            if(s.indexOf('.')!==-1 && s.indexOf(',')!==-1){
                const lastComma=s.lastIndexOf(','), lastDot=s.lastIndexOf('.');
                if(lastComma>lastDot){ s = s.replace(/\./g,''); s = s.replace(/,/g,'.'); }
                else { s = s.replace(/,/g,''); }
            } else if(s.indexOf(',')!==-1) s = s.replace(/,/g,'.');
            const v = parseFloat(s); return Number.isFinite(v)? v : null;
        }

        function readTransaction(li){
            const titleEl = li.querySelector('.transaction-title a');
            const imgEl = li.querySelector('.transaction-image img');
            const priceEl = li.querySelector('.currency-value');
            const priceText = priceEl ? priceEl.innerText.trim() : null;
            return {
                transactionId: li.getAttribute('data-transaction-id') || null,
                receiptId: li.getAttribute('data-receipt-id') || null,
                title: titleEl?.innerText?.trim() || null,
                link: titleEl?.href || null,
                image: imgEl?.src || imgEl?.getAttribute('data-src') || null,
                priceText,
                priceNumber: parsePriceToNumber(priceText)
            };
        }

        if (window.location.href.includes("/listing/")) {
            handleListingPage();
            //console.log("handleListingPage");
        } else if (window.location.href.includes("etsy.com/your/purchases")) {
            purchasesOverlay()
        } else if (window.name == "zbaseiframe") {
            //console.log("window.name ? zbaseiframe :", window.name);
            await waitForValidEHuntDocument();
            if(window.location.href.includes("/product-detail/")){
                ehuntOverlayDetail();
                //console.log("ehuntOverlayDetail");
                showToast("Ehunt Detail");
            }else{
                ehuntOverlay();
                //console.log("ehuntOverlay");
                showToast("Ehunt");
            }

        } else {
            //console.log("initOverlay");
            initOverlay();
        }
    }

    function onLoaded(doc, fn) {
        if (doc.readyState == 'loading') {
            doc.addEventListener("DOMContentLoaded", fn);
        } else {
            fn()
        }
    }

    function runInIframe(iframeEl) {
        //console.log("runInIframe:", iframeEl);
        const iframeWin = iframeEl.contentWindow;
        const iframeDoc = iframeEl.contentDocument;

        onLoaded(iframeDoc, () => {
            //console.log("running doTheThing() with iframe", iframeWin);
            doTheThing(iframeWin, iframeDoc);
        });
    }

    const isEtsyHunt = window.location.host == 'ehunt.ai' && (window.location.pathname == '/etsy-product-research' || window.location.href.includes("/product-detail/"));
    if (isEtsyHunt) {
        // Run in iframe
        observeElements("iframe#zbaseiframe", runInIframe, window.document)
    } else { // In etsy
        onLoaded(window.document, () => doTheThing(window, window.document))
        //console.log("In Etsy")
    }

        // Initialize
    async function initialize() {
        // Load config
        await loadConfig();
        // Register menu commands
        GM.registerMenuCommand("Ayarlar", showConfigMenu);
        // Show welcome message
        showToast('Etsy Erank Tool yüklendi', 'info');
    }

    // Start the script
    initialize();

})();
