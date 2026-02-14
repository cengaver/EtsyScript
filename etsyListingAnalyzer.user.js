// ==UserScript==
// @name         Etsy Listing Inline Analyzer
// @description  Etsy Listing Inline Analyzer
// @version      1.44
// @author       Cengaver
// @namespace    https://github.com/cengaver
// @match        https://www.etsy.com/your/shops/me/tools/listings/*
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/etsyListingAnalyzer.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/etsyListingAnalyzer.user.js
// ==/UserScript==

(async function(){
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

    GM.registerMenuCommand("⚙️ Versiyon", async () => {
        const current_version = await getVersion();
        const ver = prompt(" Versiyon Numarası:" ,current_version);
        if (ver) {
            await GM.setValue("version", ver.trim());
            showToast('✅ Kaydedildi','info');
        }
    });

    async function getVersion() {
        const ver = await GM.getValue("version", "7");
        return ver;
    }

    const version_number = await getVersion();
    const SENT_KEY="etsy_analyzer_sent_v"+version_number;
    const sent=JSON.parse(localStorage.getItem(SENT_KEY)||"{}");

    const seen=new Set();

    const obs=new MutationObserver(scan)
    obs.observe(document.body,{childList:true,subtree:true})
    setTimeout(scan,2000)

    cleanupOldAnalyzerKeys(SENT_KEY);

    function cleanupOldAnalyzerKeys(CURRENT_KEY){

        const PREFIX = "etsy_analyzer_sent_";

        Object.keys(localStorage).forEach(k=>{
            if(k.startsWith(PREFIX) && k!==CURRENT_KEY){
                localStorage.removeItem(k);
            }
        });
    }

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
        const expires=isExpires(t)
        const age=ageFromRenew(renewDate,renewal,sales);
        const title=getTitleFromRow(card,id);
        const sku=getSkuFromRow(card,id);
        const img=getImgFromRow(card,id);

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
            img,
            expires,
            shopName:shop_name,
            sheetName: 'analiz'
        }
        //console.table(data)
        inject(actions,data);
    }

    function inject(actions,data){
        const level=getLevel(data.age,data.sales);
        const badgeDiv=document.createElement('div');
        badgeDiv.classList.add('wt-flex-xs-1');
        const badge=document.createElement('span');
        badge.textContent=level.icon;
        badge.style.cssText=`
            margin-left:8px;
            font-size:18px;
            cursor:pointer;
            color:${level.color};
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
            <div style="font-weight:bold;font-size:13px;margin-bottom:6px;">
                ${level.icon} ${level.label}
            </div>

            <div style="font-weight:bold;margin-bottom:6px;">
                ${data.title||'Untitled'}
            </div>

            Sales: ${data.sales}<br>
            Favorites: ${data.favs}<br>
            Visits: ${data.visits}<br>
            Age: ${data.age} gün<br>
            Renewal: ${data.renewal||'N/A'}<br><br>

            <b>Issues</b><br>
            ${data.issues.map(i=>'• '+i).join('<br>')}<br><br>

            <b>Issues 2</b><br>
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
        if(!sent[data.id]){
            sendToSheets(data);
            //console.log(data)
            sent[data.id]=Date.now();
            localStorage.setItem(SENT_KEY,JSON.stringify(sent));
        }
    }

    function getLevel(age,sales){
        if(sales>0) return {icon:"🟢",color:"#2ecc71",label:"Satış Var"};
        if(age<=14) return {icon:"🟡",color:"#f1c40f",label:"Yeni – Dokunma"};
        if(age<=30) return {icon:"🟠",color:"#e67e22",label:"İzleme Aşaması"};
        if(age<=60) return {icon:"🔴",color:"#e74c3c",label:"Güçlü Optimizasyon"};
        return {icon:"🚨",color:"#8e44ad",label:"Başarısız – Kapat/Yenile"};
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

    function buildIssues({age,visits,favs,sales}) {
        const issues=[];

        // 1️⃣ Satış varsa net bitir
        if(sales>0){
            issues.push("Satış almış – dokunma");
            return issues;
        }

        // 2️⃣ 0–14 gün: satmıyor sayılmaz
        if(age<=14){
            issues.push("Yeni listing (0–14 gün)");
            issues.push("Öneri: Dokunma, veri birikmesini bekle");
            return issues;
        }

        // 3️⃣ 15–30 gün: izleme + hafif sinyal analizi
        if(age<=30){
            if(visits>=50 && favs===0){
                issues.push("İlgi çekmiyor (favori yok)");
                issues.push("Öneri: Ana görsel / başlık hafif test");
            } else {
                issues.push("15–30 gün – izleme aşaması");
                issues.push("Öneri: Küçük testler (görsel veya fiyat)");
            }
            return issues;
        }

        // 4️⃣ 30–60 gün: artık satmıyor sayılır
        if(age<=60){
            if(visits>=100 && favs===0){
                issues.push("Yüksek trafik var, ilgi yok");
                issues.push("Öneri: Görsel + başlık köklü değişim");
            } else if(favs>0){
                issues.push("Favori var, satış yok");
                issues.push("Öneri: Fiyat / kargo / güven optimizasyonu");
            } else if(visits<30){
                issues.push("Düşük trafik");
                issues.push("Öneri: SEO ve yenileme");
            } else {
                issues.push("30–60 gün – satış yok");
                issues.push("Öneri: Güçlü genel optimizasyon");
            }
            return issues;
        }

        // 5️⃣ 60+ gün: başarısız kabul edilir
        issues.push("60+ gün – satış yok (başarısız)");
        issues.push("Öneri: Yeniden aç, varyasyon değiştir veya kapat");
        return issues;
    }

    function pick(t,r){const m=t.match(r);return m?+m[1]:0;}
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

    function isExpires(t){
        return /\bExpires\b/i.test(t);
    }

    function parseRenew(t){
        const m=t.match(/(?:Auto[-\s]?renews?|Expires)\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
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

    function getImgFromRow(card){
        const img=card.querySelector('.card-img-wrap img');
        if(!img)return "";
        return (img.src||"").trim();
    }

    function getTitleFromRow(card){
        const h2=card.querySelector('h2.card-title');
        if(!h2)return "";
        return (h2.getAttribute("title")||h2.textContent||"").trim();
    }

})();
