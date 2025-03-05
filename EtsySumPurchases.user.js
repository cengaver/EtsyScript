// ==UserScript==
// @name         Etsy Sum Purchases
// @namespace    https://github.com/cengaver
// @version      0.1
// @description  Etsy Sum Sales Purchases
// @author       Cengaver
// @match        https://www.etsy.com/your/purchases*
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsySumPurchases.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsySumPurchases.user.js
// ==/UserScript==

(function() {
    'use strict';
    let isUpdating = false;

    function sumPurchases() {
        if (isUpdating) return;
        isUpdating = true;

        const items = document.querySelectorAll('li > div > div.wt-mr-xs-2.wt-width-full > div > div > div.order-details-header.section-header.wt-bg-white > div.order-details-header.section-header-right > span.currency-value');
        let sumPurchases = 0;
        items.forEach(item => {
            sumPurchases += Number(item.textContent);
            console.log("item", item.textContent);
        });

        const sumPurchasesElement = document.querySelector("#header_menu > div:nth-child(1) > h1");
        if (sumPurchasesElement) {
            let purchaseslabel = document.getElementById('etsy-sales-sum');
            if (purchaseslabel) {
                purchaseslabel.innerHTML = `<span class="text-gray-lighter">${sumPurchases} $</span>`;
            } else {
                purchaseslabel = document.createElement('div');
                purchaseslabel.id = 'etsy-sales-sum';
                purchaseslabel.innerHTML = `<span class="text-gray-lighter">${sumPurchases} $</span>`;
                sumPurchasesElement.appendChild(purchaseslabel);
            }
        }

        console.log("purchases", sumPurchases);
        isUpdating = false;
    }

    // Debounce function to limit how often sumPurchases is called
    const debounce = (func, delay) => {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const debouncedSumPurchases = debounce(sumPurchases, 2000); // Debounce with 1-second delay

    // Run on initial page load
    window.addEventListener("load", debouncedSumPurchases);

    // Observe changes in the DOM to handle lazy loading
    const observer = new MutationObserver(debouncedSumPurchases);
    observer.observe(document.body, { childList: true, subtree: true });
})();
