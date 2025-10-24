// ==UserScript==
// @name         Etsy Add Drive Search to SKU in Listings
// @namespace    https://github.com/cengaver
// @version      1.52
// @description  Add a Google Drive search link using SKU in Etsy Listings with API Sync and GM Fallback
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/tools/listings/*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AddDriveSearchtoSKUinListings.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AddDriveSearchtoSKUinListings.user.js
// @grant        GM.xmlHttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// ==/UserScript==

(async function() {
    'use strict';

    const defaultJson = { "XHC10266": "clipart-grid" };

    let skuMap = await GM.getValue("skuMap", defaultJson);
    let availableSKUs = await GM.getValue("availableSKUs", {}); // API'den sync edilen aliases objesi
    let configuredSKUs = await GM.getValue("configuredSKUs", {}); // API'den sync edilen aliases objesi
    //console.log("skuMap:", Object.keys(skuMap).length);
    //console.log("availableSKUs:", Object.keys(availableSKUs).length);

    GM.registerMenuCommand("SKU JSON Düzenle (GM)", () => {
        const newJson = prompt("SKU JSON girin:", JSON.stringify(skuMap, null, 2));
        if (newJson) {
            try {
                skuMap = JSON.parse(newJson);
                GM.setValue("skuMap", skuMap);
                alert("SKU verisi güncellendi!");
            } catch (e) {
                alert("Geçersiz JSON!");
            }
        }
    });

    function fetchAvailableSKUs() {
        GM.xmlHttpRequest({
            method: "GET",
            url: "http://localhost:3000/available-recipes",
            timeout: 5000,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);

                    if (data.aliases && typeof data.aliases === "object") {
                        availableSKUs = data.aliases;
                        GM.setValue("availableSKUs", availableSKUs);
                        console.log("aliases alındı:", Object.keys(availableSKUs).length);
                    }

                    if (data.configured && Array.isArray(data.configured)) {
                        configuredSKUs = data.configured;
                        GM.setValue("configuredSKUs", configuredSKUs);
                        console.log("configured alındı:", configuredSKUs.length);
                    }

                    addDriveButton();
                } catch (e) {
                    console.error("API yanıtı parse edilemedi:", e);
                    addDriveButton();
                }

            },
            ontimeout: function() {
                console.warn("API zaman aşımı - GM fallback kullanılacak");
                addDriveButton();
            },
            onerror: function() {
                console.warn("API hatası - GM fallback kullanılacak");
                addDriveButton();
            }
        });
    }

    function addDriveButton() {
        const items = document.querySelectorAll('.wt-block-grid__item');
        items.forEach(item => {
            const skuElement = item.querySelector('.card-meta-row-item.card-meta-row-sku.selected-color.wt-text-gray span');
            const targetElement = item.querySelector("div > div.card-actions.card-actions-3 > div");
            if (skuElement && targetElement && !item.querySelector('[data-button="drive"]')) {
                const sku = skuElement.textContent.trim();
                const driveSearchUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(sku)}`;

                let bgStyle = '';
                let tooltip = '';

                if (availableSKUs[sku]) {
                    bgStyle = 'background-color: yellow; border-radius: 6px; padding: 2px;';
                    tooltip = `<span class="drive-tooltip">${availableSKUs[sku]} (API)</span>`;
                }
                if (skuMap[sku]) {
                    bgStyle = 'background-color: blue; border-radius: 6px; padding: 2px;';
                    tooltip = `<span class="drive-tooltip">${skuMap[sku]} (GM)</span>`;
                }
                if (configuredSKUs?.includes(sku)) {
                    bgStyle = 'background-color: orange; border-radius: 6px; padding: 2px;';
                    tooltip = `<span class="drive-tooltip">${sku} (configured)</span>`;
                }
                if (!sku.startsWith('X')) {
                    bgStyle = 'background-color: limegreen; border-radius: 6px; padding: 2px;';
                }

                const driveButton = document.createElement('div');
                driveButton.className = 'wt-flex-xs-1';
                driveButton.style.marginTop = '1px';
                driveButton.innerHTML = `
                    <div class="wt-display-flex-xs wt-justify-content-center wt-align-items-center" style="position: relative;">
                        <a href="${driveSearchUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; ${bgStyle}">
                            <button type="button" data-button="drive" class="wt-btn wt-btn--transparent wt-z-index-0 wt-btn--small wt-btn--icon">
                                <span class="text-gray-lighter etsy-icon">
                                    <img src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" alt="Google Drive" style="width:24px; height:24px;">
                                </span>
                            </button>
                            ${tooltip}
                        </a>
                    </div>
                `;
                targetElement.append(driveButton);
            }
        });
    }

    const style = document.createElement('style');
    style.textContent = `
        .drive-tooltip {
            visibility: hidden;
            opacity: 0;
            position: absolute;
            bottom: 110%;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: #fff;
            padding: 4px 6px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            transition: opacity 0.3s;
            z-index: 999;
        }
        a:hover .drive-tooltip {
            visibility: visible;
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    const observer = new MutationObserver(() => addDriveButton());
    observer.observe(document.body, { childList: true, subtree: true });

    fetchAvailableSKUs();

})();
