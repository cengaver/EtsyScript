// ==UserScript==
// @name         Etsy MesssageOrder CounterIndicator
// @namespace    https://github.com/cengaver
// @version      0.10
// @description  Message and Order CounterIndicator panel
// @match        https://www.etsy.com/your/shops/*
// @match        https://www.etsy.com/messages*
// @exclude      https://www.etsy.com/your/shops/me/advertising/*
// @exclude      https://www.etsy.com/your/shops/me/listing-editor/*
// @author       Cengaver
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyMessageAndOrderCounter.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyMessageAndOrderCounter.user.js
// ==/UserScript==

(function() {
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
    `);
    let toastContainer = null;
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

    GM.registerMenuCommand("⚙️ Sheet Url Ayarla", async () => {
        const currentUrl = await getSheetUrl();
        const url = prompt(" Sheet Url'nizi girin:" ,currentUrl);
        if (url) {
            await GM.setValue("sheet_url", url.trim());
            showToast('✅ Kaydedildi','info');
        }
    });

    async function getSheetUrl() {
        const url = await GM.getValue("sheet_url", "");
        return url;
    }

    GM.registerMenuCommand("⚙️ Mağaza Adı", async () => {
        const current_shop = await getShopName();
        const shop = prompt(" Mağaza adı girin:" ,current_shop);
        if (shop) {
            await GM.setValue("shop_name", shop.trim());
            showToast('✅ Kaydedildi','info');
        }
    });

    async function getShopName() {
        const shop = await GM.getValue("shop_name", "");
        return shop;
    }

     // Google Sheets log fonksiyonun
    async function sendToSheets(payload) {
        const sheetUrl = await getSheetUrl();
        if (!sheetUrl) return;
        console.log(payload)
        GM.xmlHttpRequest({
            method: "POST",
            url: sheetUrl,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data: JSON.stringify(payload),
            onload: function(response) {
            try {
                const data = JSON.parse(response.responseText);
                if (data.status === 'success') {
                        showToast('✅ Güncellendi','success');
                    } else {
                        showToast('❌ Hata: ' + (data.message || 'Bilinmeyen hata'),'error');
                    }
                } catch (e) {
                   showToast('❌ Yanıt işlenemedi','error');
                }
            },
            onerror: function(error) {
                showToast('❌ Güncellenmedi: ' + (error.message || 'Bilinmeyen hata'),'error');
            }
        });
    }

    function normalizeNumber(str) {
        return str == null?0: parseInt(str.replace(/[^\d]/g, ''), 10);
    }

    async function readCounts() {
        // Dashboard’dan verileri al
        const container = document.getElementById("shop-manager--tool-links");
        if (!container) return;

        const messageEl = container.querySelector('a[data-app-key="messages"] span[data-clg-id="WtCounterIndicator"]');
        const orderEl = container.querySelector('a[data-app-key="orders"] span[data-clg-id="WtCounterIndicator"]');
        //if (!messageEl && !orderEl) return;

        const message = normalizeNumber(messageEl?.textContent);
        const order = normalizeNumber(orderEl?.textContent);
        //if (!message && !order) return;

        // Google Sheet’e gönderilecek veri objesi
        const data = {
            shopName:  await getShopName(),
            message: message || 0,
            order: order || 0,
            sheetName: 'counter'
        };

        console.log(data);
        await sendToSheets(data);
    }

    const observer=new MutationObserver(readCounts)

    observer.observe(
        document.getElementById("shop-manager--tool-links"),
        {childList:true,subtree:true,characterData:true}
    )
    setInterval(()=>{
        readCounts()
        showToast('✅ Okundu','info');
    },5*60*1000)
    readCounts()
})();
