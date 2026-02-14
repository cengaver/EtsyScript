// ==UserScript==
// @name         CustumHub SKU checker
// @description  CustumHub SKU checker for page
// @version      0.03
// @author       Cengaver
// @namespace    https://github.com/cengaver
// @match        https://app.customhub.io/library
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://www.google.com/s2/favicons?domain=customhub.io
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/CustumHubSKU.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/CustumHubSKU.user.js
// ==/UserScript==

(function(){
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
            alert("✅ Kaydedildi.");
        }
    });

    async function getSheetUrl() {
        const url = await GM.getValue("sheet_url", "");
        return url;
    }

    const SENT_KEY="sku_checker_sent_v3";
    const sent=JSON.parse(localStorage.getItem(SENT_KEY)||"{}");

    const seen=new Set()
    //const results=[]

    async function analyze(sku,imgs) {
        const data ={
            sku,
            imgs,
            sheetName: 'sku'
        }
        if(!sent[data.sku]){
            sendToSheets(data);
            //console.log(data)
            sent[data.sku]=Date.now();
            localStorage.setItem(SENT_KEY,JSON.stringify(sent));
        }
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

    function scan(){
       document.querySelectorAll('.mud-card').forEach(card=>{
         if(seen.has(card))return
         const skuEl=card.querySelector('.mud-chip-content')
         if(!skuEl)return
         const sku=skuEl.textContent.trim()
         //if(!/\d+$/i.test(sku))return
         const imgs=[...card.querySelectorAll('img')]
           .map(i=>i.src)
           .filter(src=>src && src.toLowerCase().endsWith('.png'))
         if(!imgs.length)return
         if(!sku||seen.has(sku))return;
         seen.add(sku);
         analyze(sku,imgs);
         //results.push({sku,images:imgs})
       })
       //if(results.length)console.table(results.map(r=>({SKU:r.sku,PNG_Count:r.images.length})))
     }

     const obs=new MutationObserver(scan)
     obs.observe(document.body,{childList:true,subtree:true})
     setTimeout(scan,2000)


    new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
    scan();
})();
