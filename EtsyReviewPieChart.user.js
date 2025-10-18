// ==UserScript==
// @name         Etsy Review Pie Chart with Badge
// @namespace    https://github.com/cengaver
// @version      1.34
// @description  Reviews yanına pie chart ve badge
// @match        https://www.etsy.com/your/shops/me/dashboard*
// @author       Cengaver
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewPieChart.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewPieChart.user.js
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
        return parseInt(str.replace(/[^\d]/g, ''), 10);
    }

    async function addReviewPie() {
        // Dashboard’dan verileri al
        const container = document.querySelector('.dashboard-header-metadata');
        if (!container) return;
        if (container.querySelector('.review-pie-wrapper')) return;

        const reviewsEl = container.querySelector('a[href*="#reviews"] div:nth-child(2) > span:nth-child(2)');
        const salesEl = container.querySelector('a[href*="/your/orders/sold"]');
        if (!reviewsEl || !salesEl) return;

        const reviews = normalizeNumber(reviewsEl.textContent);
        const sales = normalizeNumber(salesEl.textContent);
        if (!reviews || !sales) return;

        // Active listings
        const listingsEl = container.querySelector('a[href*="tools/listings"]');
        const activeListings = listingsEl ? parseInt(listingsEl.textContent.replace(/[^\d]/g, ''), 10) : null;

        // Shop name
        const shopLinkEl = container.querySelector('a[href*="/shop/"]');
        let shopName = "";
        if (shopLinkEl) {
            const urlParts = shopLinkEl.href.split('/');
            shopName = urlParts[4].split('?')[0];
        }

        const ratio = reviews / sales;

        // Wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'review-pie-wrapper';
        wrapper.style.display = 'inline-block';
        wrapper.style.position = 'relative';
        wrapper.style.marginLeft = '6px';
        wrapper.style.verticalAlign = 'middle';
        wrapper.style.width = '24px';
        wrapper.style.height = '24px';

        const size = 24;
        const radius = size / 2;
        const strokeWidth = 6;
        const circumference = 2 * Math.PI * (radius - strokeWidth/2);
        const offset = circumference * (1 - ratio);

        // SVG Pie
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", size);
        svg.setAttribute("height", size);

        // Background circle
        const bg = document.createElementNS(svg.namespaceURI, "circle");
        bg.setAttribute("cx", radius);
        bg.setAttribute("cy", radius);
        bg.setAttribute("r", radius - strokeWidth/2);
        bg.setAttribute("fill", "none");
        bg.setAttribute("stroke", "#eee");
        bg.setAttribute("stroke-width", strokeWidth);
        svg.appendChild(bg);

        // Foreground circle
        const fg = document.createElementNS(svg.namespaceURI, "circle");
        fg.setAttribute("cx", radius);
        fg.setAttribute("cy", radius);
        fg.setAttribute("r", radius - strokeWidth/2);
        fg.setAttribute("fill", "none");
        fg.setAttribute("stroke", ratio >= 0.1 ? "green" : ratio >= 0.05 ? "orange" : "red");
        fg.setAttribute("stroke-width", strokeWidth);
        fg.setAttribute("stroke-dasharray", circumference);
        fg.setAttribute("stroke-dashoffset", offset);
        fg.setAttribute("transform", `rotate(-90 ${radius} ${radius})`);
        svg.appendChild(fg);

        wrapper.appendChild(svg);

        // Badge
        const badge = document.createElement('span');
        badge.textContent = `${(ratio*100).toFixed(1)}%`;
        badge.style.position = 'absolute';
        badge.style.top = '-12px';
        badge.style.right = '-24px';
        badge.style.background = '#333';
        badge.style.color = 'white';
        badge.style.fontSize = '10px';
        badge.style.padding = '1px 4px';
        badge.style.borderRadius = '8px';
        badge.style.fontWeight = '600';
        badge.style.lineHeight = '10px';

        wrapper.appendChild(badge);

        // ReviewsEl'in yanına ekle
        reviewsEl.parentNode.appendChild(wrapper);
        // Google Sheet’e gönderilecek veri objesi
        const data = {
            title: shopName,
            sls: sales || "",
            active_listings: activeListings || "",
            reviews: reviews || "",
            ratio: Math.floor(ratio*100) || "",
            sheetName: 'dashboard'
        };

        console.log(data);
        await logToGoogleSheets(data);
    }

    addReviewPie();
    const observer = new MutationObserver(addReviewPie);
    observer.observe(document.body, { childList: true, subtree: true });
})();
