// ==UserScript==
// @name         CustumHub SKU checker
// @description  CustumHub SKU checker for page
// @version      0.02
// @author       Cengaver
// @namespace    https://github.com/cengaver
// @match        https://app.customhub.io/library
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://www.google.com/s2/favicons?domain=customhub.io
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/CustumHubSKU.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/CustumHubSKU.user.js
// ==/UserScript==

(function(){
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
            console.log(data)
            sent[data.sku]=Date.now();
            localStorage.setItem(SENT_KEY,JSON.stringify(sent));
        }
    }

    // Google Sheets log fonksiyonun
    async function sendToSheets(payload) {
        const sheetUrl = await getSheetUrl();
        if (!sheetUrl) return;
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