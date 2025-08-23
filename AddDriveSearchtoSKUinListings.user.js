// ==UserScript==
// @name         Etsy Add Drive Search to SKU in Listings
// @namespace    https://github.com/cengaver
// @version      1.1
// @description  Add a Google Drive search link using SKU in Etsy Listings
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/tools/listings/*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AddDriveSearchtoSKUinListings.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AddDriveSearchtoSKUinListings.user.js
// ==/UserScript==

(function() {
    'use strict';
    // Varsayılan JSON
    const defaultJson = {
        "XHC10266": "clipart-grid",
    };

    // JSON verisini al, yoksa varsayılanı kaydet
    let skuMap = GM_getValue("skuMap", defaultJson);

    // GM menüden düzenleme
    GM_registerMenuCommand("SKU JSON Düzenle", () => {
        const newJson = prompt("SKU JSON girin:", JSON.stringify(skuMap, null, 2));
        if (newJson) {
            try {
                skuMap = JSON.parse(newJson);
                GM_setValue("skuMap", skuMap);
                alert("SKU verisi güncellendi!");
            } catch (e) {
                alert("Geçersiz JSON!");
            }
        }
    });

    function addDriveButton() {
        const items = document.querySelectorAll('.wt-block-grid__item');

        items.forEach(item => {
            const skuElement = item.querySelector('.card-meta-row-item.card-meta-row-sku.selected-color.wt-text-gray span');
            const targetElement = item.querySelector("div > div.card-actions.card-actions-3 > div")
            if (skuElement && targetElement && !item.querySelector('[data-button="drive"]')) {
                const sku = skuElement.textContent.trim();
                const driveSearchUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(sku)}`;
                const tag = skuMap[sku] || null;

                let bgStyle = '';
                let tooltip = '';

                if (tag) {
                    bgStyle = 'background-color: yellow; border-radius: 6px; padding: 2px;';
                    tooltip = `<span class="drive-tooltip">${tag}</span>`;
                } else if (!sku.startsWith('X')) {
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

    // Tooltip CSS
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

    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            addDriveButton();
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial call
    addDriveButton();
})();
