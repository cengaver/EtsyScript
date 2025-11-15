// ==UserScript==
// @name         ShipStation Sales Report Enhanced
// @namespace    https://github.com/cengaver/EtsyScript/
// @version      1.93
// @description  Show sales data by store for Yesterday, Last 7 Days, and Last 30 Days with floating button and improved UI
// @author       cengaver
// @icon         https://www.google.com/s2/favicons?domain=shipstation.com
// @match        *.customhub.io/*
// @match        *.etsy.com/your/shops/me/dashboard*
// @require      https://cdn.jsdelivr.net/npm/chart.js
// @connect      ssapi.shipstation.com
// @grant        GM_xmlhttpRequest
// @grant        GM.addStyle
// @grant        GM.registerMenuCommand
// @grant        GM.getValue
// @grant        GM.setValue
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ShipStationSalesReport.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ShipStationSalesReport.user.js
// ==/UserScript==


(async function() {
    'use strict';

    // Modern UI Styles
    GM.addStyle(`
        #sales-floating-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    }
    #sales-floating-button:hover {
        background-color: #0056b3;
    }
    #sales-report-container {
        position: fixed;
        top: 100px;
        right: 20px;
        width: 450px;
        max-height: 500px;
        background: #ffffff;
        border: 1px solid #ccc;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
        z-index: 9999;
    }
    #sales-report-table {
        width: 100%;
        border-collapse: collapse;
    }
    #sales-report-table th, #sales-report-table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    #sales-report-table th {
        background-color: #007bff;
        color: white;
    }
    #sales-report-table tr:hover {
        background-color: #f1f1f1;
    }
    #sales-dropdown-menu {
        margin: 10px;
    }
    #sales-dropdown-menu select, #sales-dropdown-menu button {
        margin-right: 5px;
        padding: 4px 9px;
        border: 1px solid #ccc;
        border-radius: 5px;
        font-size: 13px;
    }
    #loading-indicator {
        font-size: 16px;
        font-weight: bold;
        color: #333;
    }
    /*:root {
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
    }*/

    /* Toast Notifications */
    .toast-container {
        position: fixed;
        bottom: 20px;
        /*right: 20px;*/
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
        apiKey: "",
        apiSecret: "",
        selectedDateRange: "",
        storeIds: "{}"
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

        if (!config.apiSecret || !config.apiKey) {
            showToast('Ship Stations credentials missing', 'error');
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
                setTimeout(() => toast.remove(), 30000);
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
        title.textContent = 'Ship Stations Tool Ayarları';

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
            { id: 'apiKey', label: 'apiKey', type: 'text', value: config.apiKey },
            { id: 'apiSecret', label: 'apiSecret', type: 'text', value: config.apiSecret },
            { id: 'selectedDateRange', label: 'selectedDateRange', type: 'text', value: config.selectedDateRange },
            { id: 'storeIds', label: 'storeIds', type: 'textarea', value: config.storeIds }
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

    const apiBaseUrl = 'https://ssapi.shipstation.com';
    const authHeader = (apiKey, apiSecret) => btoa(`${apiKey}:${apiSecret}`);

    const waitForElement = (selector, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const interval = 100;
            let elapsedTime = 0;
            const checkExist = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(checkExist);
                    resolve(element);
                }
                elapsedTime += interval;
                if (elapsedTime >= timeout) {
                    clearInterval(checkExist);
                    reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms`));
                }
            }, interval);
        });
    };

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const getShipData = async (pod = null) => {
        let use_storeIds = {};
        const my_storeIds = JSON.parse(config.storeIds);
        if (pod == 1) {
            const stores = await getStores();
            if (Array.isArray(stores) && stores.length > 0) {
                stores.forEach(store => {
                    use_storeIds[store.storeId] = store.storeName.replace("CUSTOMHUB ", "");
                });
            }
        } else if (pod == 0) {
            try {
                use_storeIds = my_storeIds;
            } catch (e) {
                console.error("Invalid JSON in config.storeIds", e);
                use_storeIds = {};
            }
        } else {
            use_storeIds = { [pod]: my_storeIds.pod };
        }

        const store_ids = Object.keys(use_storeIds);
        const results = [];

        for (let i = 0; i < store_ids.length; i++) {
            const store = store_ids[i];
            const status = await refreshStore(store);
            results.push(status);
            if (i < store_ids.length - 1) await delay(2200);
        }

        //console.log("All stores refreshed successfully:", results);
        return results.every(status => status === 200) ? 200 : null;
    }

    function refreshStore(storeId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: `https://ssapi.shipstation.com/stores/refreshstore?storeId=${storeId}`,
                headers: {
                    "Authorization": `Basic ${authHeader(config.apiKey, config.apiSecret)}`,
                    "Content-Type": "application/json"
                },
                onload: response => {
                    if (response.status === 200) resolve(200);
                    else {
                        console.error(`Error refreshing store ${storeId}:`, response.status, response.responseText);
                        resolve(response.status);
                    }
                },
                onerror: err => {
                    console.error(`Request failed for store ${storeId}`, err);
                    resolve(null);
                }
            });
        });
    }

    async function getStores() {
        const response = await fetch(apiBaseUrl + "/stores", {
            method: "GET",
            headers: { 'Authorization': `Basic ${authHeader(config.apiKey, config.apiSecret)}` },
        });

        if (!response.ok) {
            console.error("Error:", response.status, await response.text());
            return;
        }

        const stores = await response.json();

        // stores dizisinin yapısını kontrol et
        //console.log("Original Stores:", stores);

        // 307646 ID'li öğeyi sil (storeId'nin türünü kontrol et)
        const updatedStores = stores.filter(store => {
            // storeId'yi number olarak karşılaştır
            return store.storeId !== 307646;
        });

        return updatedStores;
    }

    const initOverlay = async () => {
        try {
            const selector = await waitForElement("#refresh-area");

            const El = document.createElement("button");
            El.textContent = "Ship";
            El.title = "Ship Stations Senkronize";
            El.style.marginLeft = "1px";
            El.className = "mud-button-root mud-button mud-button-text mud-button-text-default mud-button-text-size-medium mud-ripple";
            El.style.fontSize = "0.8rem";
            El.style.color = "black";

            const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgIcon.setAttribute("aria-hidden", "true");
            svgIcon.setAttribute("focusable", "false");
            svgIcon.setAttribute("data-prefix", "fas");
            svgIcon.setAttribute("data-icon", "rotate-right");
            svgIcon.setAttribute("class", "svg-inline--fa fa-rotate-right icon");
            svgIcon.setAttribute("role", "img");
            svgIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svgIcon.setAttribute("viewBox", "0 0 512 512");
            svgIcon.style.width = "0.7em";
            svgIcon.style.height = "0.7em";
            svgIcon.style.marginLeft = "3px";

            const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            svgPath.setAttribute("fill", "currentColor");
            svgPath.setAttribute(
                "d",
                "M463.5 224l8.5 0c13.3 0 24-10.7 24-24l0-128c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8l119.5 0z"
            );

            svgIcon.appendChild(svgPath);
            El.appendChild(svgIcon);
            selector.appendChild(El);

            El.addEventListener("click", async function() {
                El.style.backgroundColor = "orange";
                const pod = document.getElementById('pod-select').value ;
                const status = await getShipData(pod);
                if (status == 200) {
                    El.textContent = "❤️";
                    showToast('Ship Stattions Order Alındı', 'info');
                } else {
                    El.textContent = "🚨";
                    showToast('Ship Stattions Order Alınamadı', 'error');
                    console.log("status:", status);
                }
                El.style.backgroundColor = null;
            });
        } catch (error) {
            console.error("Overlay initialization error:", error);
        }

    };

    const renderChart = (orders) => {
        const salesData = {};
        orders.forEach(order => {
            const date = order.createDate.split("T")[0];
            const amount = parseFloat(order.amountPaid || 0);
            if (!salesData[date]) salesData[date] = { totalSales: 0, totalOrders: 0 };
            salesData[date].totalSales += amount;
            salesData[date].totalOrders += 1;
        });

        const labels = Object.keys(salesData).sort();
        const salesDataArray = labels.map(date => salesData[date].totalSales);
        const ordersDataArray = labels.map(date => salesData[date].totalOrders);

        const ctx = document.getElementById("salesChart").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Satış Ücreti",
                        data: salesDataArray,
                        borderColor: "blue",
                        backgroundColor: "rgba(0, 0, 255, 0.1)",
                        type: "line",
                        yAxisID: "y-axis-sales"
                    },
                    {
                        label: "Satış Sayısı",
                        data: ordersDataArray,
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 1,
                        yAxisID: "y-axis-orders"
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    yAxes: [
                        {
                            id: "y-axis-sales",
                            type: "linear",
                            position: "left",
                            ticks: {
                                beginAtZero: true
                            }
                        },
                        {
                            id: "y-axis-orders",
                            type: "linear",
                            position: "right",
                            ticks: {
                                beginAtZero: true
                            },
                            gridLines: {
                                drawOnChartArea: false
                            }
                        }
                    ]
                }
            }
        });
    };

    const fetchSales = (startDate, endDate, storeId, storeName, callback) => {
        const url = `${apiBaseUrl}/orders?createDateStart=${startDate}&createDateEnd=${endDate}&storeId=${storeId}`;
        let currentPage = 1;
        let allOrders = [];

        const fetchPage = async () => {
            await GM_xmlhttpRequest({
                method: 'GET',
                url: `${url}&page=${currentPage}`,
                headers: { 'Authorization': `Basic ${authHeader(config.apiKey, config.apiSecret)}` },
                onload: function(response) {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        allOrders = allOrders.concat(data.orders);
                        if (data.orders.length === 100) {
                            currentPage++;
                            fetchPage();
                        } else {
                            callback(allOrders);
                        }
                    } else {
                        console.error(`Error fetching data for store ${storeId}:`, response.statusText);
                    }
                },
                onerror: function(err) {
                    console.error(`Error fetching data for store ${storeId}:`, err);
                }
            });
        };
        fetchPage();
    };

    const getSalesData = async (startDate, endDate, callback, pod) => {
        const salesData = [];
        let use_storeIds = {};
        let processed;

        let my_storeIds = {};
        try {
            my_storeIds = JSON.parse(config.storeIds);
            //console.log("my_storeIds: ",my_storeIds);
        } catch (e) {
            console.error("Invalid JSON in config.storeIds", e);
        }
        //console.log(config.pod)
        if (pod == 1){
            if(config?.pod == 1){
                pod=1;
            }else{
                pod=0;
            }
        }
        //console.log(pod)
        if (pod == 1) {
            const stores = await getStores();
            if (Array.isArray(stores) && stores.length > 0) {
                stores.forEach(store => {
                    use_storeIds[store.storeId] = store.storeName.replace("CUSTOMHUB ", "");
                });
            }
            //console.log("use_storeIdsAll: ",use_storeIds);
        } else if (pod == 0) {
            use_storeIds = my_storeIds;
            //console.log("use_storeIds: ",use_storeIds);
        } else {
            use_storeIds = { [pod]: my_storeIds?.[pod] ?? 'shop' };
            //console.log("use_storeId: ",use_storeIds);
        }

        await Promise.all(Object.entries(use_storeIds).map(([storeId, storeName]) =>
          new Promise(resolve => {
            fetchSales(startDate, endDate, storeId, storeName, data => {
                salesData.push({ storeId, storeName, orders: data });
                //console.log(`storeId: ${storeId} , storeName: ${storeName}`);
                resolve();
            });
          })
        ));

        callback(salesData,startDate, endDate);
    };


    const displaySalesTable = (salesData,startDate, endDate) => {
        // Satış Ücretine göre azalan şekilde sırala
        salesData.sort((a, b) => {
            const totalSalesA = a.orders.reduce((sum, order) => sum + parseFloat(order.amountPaid || 0), 0);
            const totalSalesB = b.orders.reduce((sum, order) => sum + parseFloat(order.amountPaid || 0), 0);
            return totalSalesB - totalSalesA;
        });

        const tableContainer = document.getElementById('sales-report-container');
        tableContainer.innerHTML = '<canvas id="salesChart"></canvas>';

        const table = document.createElement('table');
        table.id = 'sales-report-table';
        table.innerHTML = `
        <tr>
            <th>Mağaza Adı</th>
            <th>Satış Sayısı</th>
            <th>Satış Ücreti</th>
            <th>Satış Oranı</th>
        </tr>
    `;

        let GtotalOrders = 0;
        let GtotalSales = 0;
        let GpercSales =0;

        salesData.forEach(({ storeName, orders }) => {
            const totalOrders = orders.length;
            const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.amountPaid || 0), 0).toFixed(2);
            const percSales = totalOrders > 0 ? Math.ceil(totalSales/totalOrders) : 0 ;
            GtotalOrders += totalOrders;
            GtotalSales += parseFloat(totalSales);

            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${storeName}</td>
            <td>${totalOrders}</td>
            <td>${totalSales}</td>
            <td>${percSales}</td>
        `;
            table.appendChild(row);
        });

        const ms = new Date(endDate) - new Date(startDate);
        const days = ms / (1000 * 60 * 60 * 24);
        //console.log(days); // 30

        const rows = document.createElement('tr');
        rows.innerHTML = `
        <th>Toplam</th>
        <th>${GtotalOrders}</th>
        <th>${GtotalSales.toFixed(2)}</th>
        <th>${Math.ceil(GtotalSales/GtotalOrders)}</th>
    `;
        table.appendChild(rows);
        const rows2 = document.createElement('tr');
        rows2.innerHTML = `
        <th>OrtGün</th>
        <th>${(GtotalOrders/days).toFixed(0)}</th>
        <th>${(GtotalSales/days).toFixed(2)}</th>
        <th>${days} gün</th>
    `;

        table.appendChild(rows2);
        tableContainer.appendChild(table);
        tableContainer.style.display = 'block';

        renderChart(salesData.flatMap(data => data.orders));
        setTimeout(hideLoading, 2000);
        createDropdownMenu();
        initOverlay();
    };

    const createFloatingButton = () => {
        const button = document.createElement('button');
        button.id = 'sales-floating-button';
        button.innerHTML = '📊';
        document.body.appendChild(button);

        const tableContainer = document.createElement('div');
        tableContainer.id = 'sales-report-container';
        tableContainer.style.display = 'none';
        document.body.appendChild(tableContainer);

        button.addEventListener('click', () => {
            tableContainer.style.display = tableContainer.style.display === 'none' ? 'block' : 'none';
        });
        // Sürükleme işlevselliği için başlık çubuğu
        //makeDraggable(document.querySelector('#sales-report-container'), document.querySelector('#sales-dropdown-menu'));
    };

    const createDropdownMenu = () => {
        const menu = document.createElement('div');
        menu.id = 'sales-dropdown-menu';

        const use_storeIds = JSON.parse(config.storeIds); // object
        let pod_select = ''; // Boş string ile başla

        for (const store in use_storeIds) {
            if (use_storeIds.hasOwnProperty(store)) {
                pod_select += `<option value="${store}">${use_storeIds[store]}</option>\n`;
            }
        }

        menu.innerHTML = `
         <select id="pod-select">
           <option value="0">My</option>
           <option value="1">Tümü</option>
           ${pod_select}
         </select>
         <select id="date-range-select">
           <option value="today">Today</option>
           <option value="yesterday">Yesterday</option>
           <option value="otherday">Otherday</option>
           <option value="last7">Last 7 Days</option>
           <option value="last30">Last 30 Days</option>
         </select>
         <button id="fetch-sales-button">Get Sales</button>
         <span id="refresh-area"></span>
         <p id="loading-area"></p>
       `;

        document.getElementById('sales-report-container').appendChild(menu);

        if (config.selectedDateRange) {
            document.getElementById('date-range-select').value = config.selectedDateRange;
        }

        document.getElementById('fetch-sales-button').addEventListener('click', () => {
            const dateRange = document.getElementById('date-range-select').value;
            const pod = document.getElementById('pod-select').value;
            config.selectedDateRange = dateRange;
            saveConfig();
            const today = new Date();
            let startDate, endDate;

            if (dateRange === 'today') {
                startDate = today.toISOString().split('T')[0];
                //today.setDate(today.getDate() + 1);
                endDate = today.toISOString().split('T')[0];
            } else if (dateRange === 'yesterday') {
                endDate = today.toISOString().split('T')[0];
                today.setDate(today.getDate() - 1);
                startDate = today.toISOString().split('T')[0];
            } else if (dateRange === 'otherday') {
                today.setDate(today.getDate() - 1);
                endDate = today.toISOString().split('T')[0];
                today.setDate(today.getDate() - 1);
                startDate = today.toISOString().split('T')[0];
            } else if (dateRange === 'last7') {
                endDate = today.toISOString().split('T')[0];
                today.setDate(today.getDate() - 7);
                startDate = today.toISOString().split('T')[0];
            } else if (dateRange === 'last30') {
                endDate = today.toISOString().split('T')[0];
                today.setDate(today.getDate() - 30);
                startDate = today.toISOString().split('T')[0];
            }
            //console.log("startDate:",startDate)
            //console.log("endDate:",endDate)
            showLoading();
            getSalesData(startDate, endDate, displaySalesTable, pod);
        });
    };

    const showLoading = () => {
        const loaderarea = document.getElementById('loading-area');
        const loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.innerHTML = 'Loading...';
        loader.style.position = 'fixed';
        loader.style.top = '50%';
        loader.style.left = '50%';
        loader.style.transform = 'translate(-50%, -50%)';
        loader.style.backgroundColor = '#fff';
        loader.style.padding = '20px';
        loader.style.borderRadius = '10px';
        loader.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        loaderarea.appendChild(loader);
    };

    const hideLoading = () => {
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.remove();
    };
    // Initialize
    async function initialize() {
        // Load config
        await loadConfig();

        // Register menu commands
        GM.registerMenuCommand("Ayarlar", showConfigMenu);

        createFloatingButton();
        createDropdownMenu();
        initOverlay();

        // Show welcome message
        //showToast('Ship Stattions Tool yüklendi', 'info');
    }

    // Start the script
    initialize();
    //getStores();

})();
