// ==UserScript==
// @name         Etsy MesssageOrder CounterIndicator
// @namespace    https://github.com/cengaver
// @version      0.03
// @description  Message and Order CounterIndicator panel
// @match        https://www.etsy.com/your/shops/*
// @match        https://www.etsy.com/messages*
// @author       Cengaver
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyMessageAndOrderCounter.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyMessageAndOrderCounter.user.js
// ==/UserScript==

(function() {
    'use strict';
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

    GM.registerMenuCommand("⚙️ Mağaza Adı", async () => {
        const current_shop = await getShopName();
        const shop = prompt(" Mağaza adı girin:" ,current_shop);
        if (shop) {
            await GM.setValue("shop_name", shop.trim());
            alert("✅ Kaydedildi.");
        }
    });

    async function getShopName() {
        const shop = await GM.getValue("shop_name", "");
        return shop;
    }

    // Google Sheets log fonksiyonun
    async function logToGoogleSheets(payload) {
        const sheetUrl = await getSheetUrl();
        if (!sheetUrl) return;
        GM.xmlHttpRequest({
            method: "POST",
            url: sheetUrl,
            data: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json"
            },
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.status === 'success') {
                        //toast('✅ Link gönderildi');
                    } else {
                        //toast('❌ Hata: ' + (data.message || 'Bilinmeyen hata'));
                    }
                } catch (e) {
                    // toast('❌ Yanıt işlenemedi');
                }
            },
            onerror: function(error) {
                //toast('❌ Gönderilemedi: ' + (error.message || 'Bilinmeyen hata'));
            }
        });
    }
    function toast(msg) {
        let c = document.querySelector('.tm-send-toast');
        if (!c) {
            c = document.createElement('div');
            c.className = 'tm-send-toast';
            Object.assign(c.style, {
                position:'fixed', right:'12px', bottom:'12px', zIndex: 999999,
                padding:'10px 14px', borderRadius:'12px', boxShadow:'0 4px 14px rgba(0,0,0,.2)',
                background:'#111', color:'#fff', fontSize:'12px', opacity:'0.95'
            });
            document.body.appendChild(c);
        }
        c.textContent = msg;
        setTimeout(() => {
            if (c && c.parentNode) c.parentNode.removeChild(c);
        }, 1800);
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
        if (!messageEl && !orderEl) return;

        const message = normalizeNumber(messageEl?.textContent);
        const order = normalizeNumber(orderEl?.textContent);
        //if (!message && !order) return;


        // Google Sheet’e gönderilecek veri objesi
        const data = {
            shopName:  await getShopName(),
            message: message || "0",
            order: order || "0",
            sheetName: 'counter'
        };

        console.log(data);
        await logToGoogleSheets(data);
    }

    const observer=new MutationObserver(readCounts)

    observer.observe(
        document.getElementById("shop-manager--tool-links"),
        {childList:true,subtree:true,characterData:true}
    )
    setInterval(()=>{
        readCounts()
        console.log("Okundu...")
    },5*60*1000)
    readCounts()
})();
