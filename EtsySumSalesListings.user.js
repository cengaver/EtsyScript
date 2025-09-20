// ==UserScript==
// @name         Etsy Sum Sales Listings
// @namespace    https://github.com/cengaver
// @version      0.3
// @description  Etsy Sum Sales Listings
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/tools/listings*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsySumSalesListings.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsySumSalesListings.user.js
// ==/UserScript==

(function() {
    'use strict';

    let isUpdating = false;
    const observer = new MutationObserver(mutations => {
        if (!isUpdating) sumSalesListing();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    function sumSalesListing() {
        isUpdating = true;
        observer.disconnect();
        let sumSales = 0;
        const items = document.querySelectorAll('.wt-block-grid__item');
        items.forEach(item => {
            const salesElements = item.querySelectorAll('.card-meta-row-item.text-gray-lighter.selected-color');
            salesElements.forEach(el => {
                if (el.innerText.includes("sales")) {
                    const match = el.innerText.match(/\d+/);
                    if (match) {
                        const count = Number(match[0]);
                        sumSales += count;
                        if (count > 0 && count <= 10) {
                            el.style.backgroundColor = "yellow";
                            el.style.color = "#000";
                        } else if (count > 10 && count <= 100) {
                            el.style.backgroundColor = "orange";
                            el.style.color = "#fff";
                        } else if (count > 100) {
                            el.style.backgroundColor = "lightgreen";
                            el.style.color = "#000";
                        }
                    }
                }
            });
        });

        const sumSalesElement = document.querySelector("#page-region > div > div > div.wt-width-full.wt-mt-xs-2.wt-mt-lg-0.wt-pl-xs-2.wt-pl-lg-6.wt-pr-xs-2.wt-pr-lg-6 > div > div > div:nth-child(1) > h3");
        if (sumSalesElement) {
            let saleslabel = document.getElementById('etsy-sales-sum');
            if (saleslabel) {
                saleslabel.innerHTML = `<span class="text-gray-lighter">${sumSales} Satış</span>`;
            } else {
                saleslabel = document.createElement('div');
                saleslabel.id = 'etsy-sales-sum';
                saleslabel.innerHTML = `<span class="text-gray-lighter">${sumSales} Satış</span>`;
                sumSalesElement.appendChild(saleslabel);
            }
        }
        console.log("sumSales", sumSales);
        observer.observe(document.body, { childList: true, subtree: true });
        isUpdating = false;
    }

    sumSalesListing();
})();
