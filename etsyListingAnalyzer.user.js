// ==UserScript==
// @name         Etsy Listing Inline Analyzer
// @description  Etsy Listing Inline Analyzer
// @version      1.30
// @author       Cengaver
// @namespace    https://github.com/cengaver
// @match        https://www.etsy.com/your/shops/me/tools/listings/*
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/etsyListingAnalyzer.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/etsyListingAnalyzer.user.js
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

    const SENT_KEY="etsy_analyzer_sent_v3";
    const sent=JSON.parse(localStorage.getItem(SENT_KEY)||"{}");

    const seen=new Set();
    new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
    scan();

    function scan(){
        document.querySelectorAll('.card-actions.card-actions-3').forEach(actions=>{
            const card=findCard(actions);
            if(!card)return;

            const id=getListingId(card);
            if(!id||seen.has(id))return;
            seen.add(id);
            analyze(card,actions,id);
        });
    }

    function findCard(el){
        let cur=el;
        for(let i=0;i<10;i++){
            if(!cur)return null;
            if(/sales|favorites|visits/i.test(cur.innerText))return cur;
            cur=cur.parentElement;
        }
        return null;
    }

    function getListingId(card){
        const a=card.querySelector('a[href*="/listing/"]');
        if(!a)return null;
        const m=a.href.match(/\/listing\/(\d+)/);
        return m?m[1]:null;
    }

    async function analyze(card,actions,id){
        const t=card.innerText;
        //console.log(actions)
        const sales=pick(t,/(\d+)\s+sales?/i);
        const favs=pick(t,/(\d+)\s+favorites?/i);
        const visits=pick(t,/(\d+)\s+visits?/i);
        const renewal=pick(t,/(\d+)\s+renewal?/i);
        const renewText=parseRenew(t);
        const renewDate=parseRenewDate(renewText);
        const age=ageFromRenew(renewDate,renewal,sales);
        const title=getTitleFromRow(card,id);
        const sku=getSkuFromRow(card,id);

        const issues=buildIssues({age,visits,favs,sales});
        const issues2=decision2({age,visits,favs,sales});
        const shop_name = await getShopName();
        const data ={
            id,
            title,
            sku,
            age,
            visits,
            favs,
            sales,
            renewal,
            issues,
            issues2,
            shopName:shop_name,
            sheetName: 'analiz'
        }
        inject(actions,data);
    }

    function inject(actions,data){
        const badgeDiv = document.createElement('div');
        badgeDiv.classList.add('wt-flex-xs-1');
        const badge=document.createElement('span');
        badge.textContent='●';
        badge.style.cssText=`
            margin-left:8px;
            font-size:30px;
            cursor:pointer;
            color:${data.sales>0?'#2ecc71':data.issues.length>1?'#e67e22':'#f1c40f'};
        `;

        const tip=document.createElement('div');
        tip.style.cssText=`
             position:fixed;
             background:#fff;
             border:1px solid #ccc;
             padding:10px;
             font-size:12px;
             box-shadow:0 4px 12px rgba(0,0,0,.15);
             display:none;
             z-index:9999;
             width:260px;
        `;

        tip.innerHTML=`
            <b>${data.title||'Untitled'}</b><br><br>
            Sales: ${data.sales}<br>
            Favorites: ${data.favs}<br>
            Visits: ${data.visits}<br>
            Age: ${data.age} gün<br>
            Renewal: ${data.renewal||'N/A'}<br><br>
            <b>Issues</b><br>
            ${data.issues.map(i=>'• '+i).join('<br>')}<br>
            <b>Issues2</b><br>
            ${data.issues2.map(i=>'• '+i).join('<br>')}
        `;

        badge.onmouseenter=e=>{
            tip.style.display='block';

            const margin=12;
            const tipRect=tip.getBoundingClientRect();
            const vw=window.innerWidth;
            const vh=window.innerHeight;

            let top=e.clientY+margin;
            let left=e.clientX+margin;

            if(top+tipRect.height>vh)
                top=e.clientY-tipRect.height-margin;

            if(left+tipRect.width>vw)
                left=e.clientX-tipRect.width-margin;

            tip.style.top=Math.max(8,top)+'px';
            tip.style.left=Math.max(8,left)+'px';
        };

        badge.onmouseleave=()=>tip.style.display='none';
        document.body.appendChild(tip);
        badgeDiv.appendChild(badge);
        const target = actions.querySelector('.wt-display-flex-xs.wt-align-items-center');
        target.appendChild(badgeDiv);
        if(data.sales===0 && !sent[data.id]){
            sendToSheets(data);
            console.log(data)
            sent[data.id]=Date.now();
            localStorage.setItem(SENT_KEY,JSON.stringify(sent));
        }
    }

    function decision2({age,visits,favs,sales}){
        const issues2=[];
        if(sales>0){issues2.push("Satış almış – dokunma");return issues2;}
        if(visits>3 && favs>=1)issues2.push("A. Yüksek trafik ve ilgi var, satış olmaması fiyat,<br> kargo veya güven/teklif kaynaklı bir dönüşüm sorunudur.<br> Eylem: Fiyat/Teklif Optimizasyonu.");
        if(visits>3 && favs===0)issues2.push("B. Yüksek trafik var ancak ürün ilgiyi (favori) çekemiyor.<br> Sorun, listelemenin vitrininde (görsel, başlık) olmalı.<br> Eylem: Görsel/Başlık/Açıklama Optimizasyonu.");
        if(visits>=1 && visits<=3 && favs>=1)issues2.push("C. Ortalama trafik ve ilgi var. <br>Hem görünürlük (SEO) hem de satışa dönüştürme (Fiyat/Teklif) sorunu.<br> Eylem: Dönüşüm Odaklı SEO ve İyileştirme.");
        if(visits>=1 && visits<=3 && favs===0)issues2.push("D. Ortalama trafik var ancak ilgi (favori) çekemiyor.<br> Sorun, listelemenin vitrininde (görsel, başlık) olmalı.<br> Eylem: Başlık/Ana Görsel Testi ve SEO İncelemesi.");
        if(visits<1 && favs>=1)issues2.push("E. Listeleme potansiyel (Fav) gösteriyor ancak trafik alamıyor.<br> Öncelikli sorun görünürlük (SEO/Yenileme).<br> Eylem: Acil SEO ve Yenileme.");
        if(visits<1 && favs===0)issues2.push("F. En düşük öncelikli, hem trafik hem de ilgi yok.<br> Ya temel SEO eksik ya da ürün/pazar uyumu zayıf.<br> Eylem: Temel SEO Kontrolü ve Sil/Değiştir Kararı.");
        if(!issues2.length)issues2.push("İzlenmeli");
        return issues2;
    }

    function buildIssues({age,visits,favs,sales}){
        const issues=[];
        if(sales>0){issues.push("Satış almış – dokunma");return issues;}
        if(age>=30&&visits>=100)issues.push("30+ gün / yüksek trafik / satış yok");
        if(age>=14&&visits>=50&&favs===0)issues.push("Favori yok – görsel/title zayıf");
        if(age>=14&&favs>0)issues.push("Favori var satış yok – fiyat/güven");
        if(age>=14&&visits<20)issues.push("Düşük trafik – SEO");
        if(!issues.length)issues.push("İzlenmeli");
        return issues;
    }

    function pick(t,r){const m=t.match(r);return m?+m[1]:0;}
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

    function parseRenew(t){
        const m=t.match(/Auto[-\s]?renews?\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
        return m?m[1]:null;
    }

    function parseRenewDate(text){
        if(!text)return null;
        return new Date(text);
    }

    function ageFromRenew(d,r,s){
        if(!d)return 0;
        const MS=86400000;
        const PERIOD=120;
        const now=Date.now();
        // base publish date (son yenilemeden geriye)
        let publishedAt=d.getTime()-PERIOD*MS;
        // satış yoksa renewal sayısını yaşa ekle
        if(s===0 && r>0){
            publishedAt-=r*PERIOD*MS;
        }
        return Math.max(0,Math.floor((now-publishedAt)/MS));
    }

    function getSkuFromRow(card){
        const span=card.querySelector('.card-meta-row-sku span');
        if(!span)return "";
        return (span.getAttribute("title")||span.textContent||"").trim();
    }

    function getTitleFromRow(card){
        const h2=card.querySelector('h2.card-title');
        if(!h2)return "";
        return (h2.getAttribute("title")||h2.textContent||"").trim();
    }

})();
