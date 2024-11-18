// ==UserScript==
// @name         Add Drive Search to SKU in Listings
// @namespace    https://github.com/cengaver
// @version      0.1
// @description  Add a Google Drive search link using SKU in Etsy Listings
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/tools/listings/*
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AddDriveSearchtoSKUinListings.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AddDriveSearchtoSKUinListings.user.js
// ==/UserScript==

(function() {
    'use strict';

    function addDriveButton() {
        const items = document.querySelectorAll('.wt-block-grid__item');

        items.forEach(item => {
            const skuElement = item.querySelector('.card-meta-row-item.card-meta-row-sku.selected-color.wt-text-gray span');
            //const targetElement = item.querySelector('.wt-display-flex-xs.wt-align-items-center:nth-of-type(3)'); // div.card-actions.card-actions-3 > div
            const targetElement = item.querySelectorAll('.wt-display-flex-xs.wt-align-items-center')[1];

            if (skuElement && targetElement && !item.querySelector('[data-button="drive"]')) {
                const sku = skuElement.textContent.trim();
                const driveSearchUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(sku)}`;

                const driveButton = document.createElement('div');
                driveButton.className = 'wt-flex-xs-1';
                driveButton.style.marginTop = '1px';
                driveButton.innerHTML = `
                    <div class="wt-display-flex-xs wt-justify-content-center wt-align-items-center">
                        <a href="${driveSearchUrl}" target="_blank" rel="noopener noreferrer">
                            <button type="button" data-button="drive" class="wt-btn wt-btn--transparent wt-z-index-0 wt-btn--small wt-btn--icon">
                                <span class="text-gray-lighter etsy-icon">
                                    <img src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" alt="Google Drive" style="width:24px; height:24px;">
                                </span>
                            </button>
                        </a>
                    </div>
                `;
                targetElement.parentNode.insertBefore(driveButton, targetElement.nextSibling);
            }
        });
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            addDriveButton();
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial call
    addDriveButton();
})();
