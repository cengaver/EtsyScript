// ==UserScript==
// @name         Etsy Order Recent by hub
// @namespace    https://github.com/cengaver
// @version      1.1
// @description  Etsy Order Recent
// @author       Cengaver
// @match        https://*.customhub.io/*
// @grant        GM_addStyle
// @icon         https://dashboard.k8s.customhub.io/Modernize/assets/images/logos/favicon.png
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyOrderRecentbyhub.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyOrderRecentbyhub.user.js
// ==/UserScript==

(function () {
    "use strict";

    const selector =
          "div.mud-dialog-content div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.pl-1 div.d-flex.flex-row.gap-3.w-100.mb-3.mt-4 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.card-title.mb-0.fs-3.fw-bold";

    const store =
          "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.pt-0.relative > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.pl-1 > div > div > div.d-flex.flex-row.gap-3.w-100.mb-1.mt-4 > div.d-flex.flex-column.gap-0 > p.mud-typography.mud-typography-body1.text-muted.mt-0.fs-2.mud-typography-nowrap";

    const earning =
          "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-6.pl-1.pr-1.m-0.cus-prd-c > div > div.d-flex.flex-row.gap-3";

    const price =
         earning+"> div.mud-alert.mud-alert-text-warning.mud-dense.mud-elevation-0.mt-1 > div > div > p";

    const cost =
         earning+"> div.mud-alert.mud-alert-text-info.mud-dense.mud-elevation-0.mt-1 > div > div > p";

    const shirt =
         "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-4.p-2.m-0.cus-prd-r.mudcard-optionsx > div > div > div.d-flex.flex-row.gap-0 > div > div:nth-child(1) > div.d-flex.flex-column.gap-0.w-100 > div.mud-tooltip-root.mud-tooltip-inline.w-100 > span > p";

    const adet =
          "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-paper.mud-elevation-0.absolute.r-0.t-0.p-0.m-0.shades.transparent > div > div.mud-alert.mud-alert-text-success.mud-dense.mud-elevation-0";

    const ship =
           "div > div.mud-grid-item.mud-grid-item-xs-12.mt-4 > div > div.mud-paper.mud-elevation-0.bg-primary-subtle.badge.mt-4 > p";

    const ship2 =
            "div > div.mud-input.mud-input-text.mud-input-text-with-label.mud-input-adorned-end.mud-input-underline.mud-shrink.mud-disabled.mud-typography-input.mud-select-input > div.mud-input-slot.mud-input-root.mud-input-root-text.mud-input-root-adorned-end.mud-select-input > div > p";

    const sku =
           "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > div > div.mud-paper.mud-elevation-0.p-1.relative.card > div.mud-tabs.mud-tabs-rounded > div.mud-tabs-panels.p-0 > div > div > div > div > div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-6.pl-1.pr-1.m-0.cus-prd-c > div > div.mud-paper.mud-elevation-0.note-has-grid.row > div > div > p > div";

    const observerOptions = { childList: true, subtree: true };

    function insertEarningContent(earningNode, costText, priceText, shirtText, quantity, miktar, shipText,skuText) {
        const storeNode = document.querySelector(store);
        let Discount = 0.65 ;
        if (storeNode.textContent.trim() === "XX")
        {
            Discount = 0.70 ;
        }else{
            Discount = 0.65 ;
        }
        const DiscountPuan = (1-Discount) * 100;
        const remainingDiscount = priceText * Discount;
        const remainingFee = remainingDiscount * 0.56;
        const remaining = remainingFee - costText;
        const shipCross = shirtText.includes("Hoodie") ? (8+3*(quantity-1))/quantity : (5+2*(quantity-1))/quantity;
        const shipTotal = shipText ? (shipCross - shipText/quantity) : 0;
        const Net = (remaining + shipTotal)*miktar;

        if (!earningNode.dataset.contentInserted) {
            const newContent = `
                <div class="mud-alert mud-alert-text-primary mud-dense mud-elevation-0 mt-1" style="cursor: pointer;">
                    <div class="mud-alert-position justify-sm-start">
                        <div class="mud-alert-message">
                            <p class="mud-typography mud-typography-body2" title="%${DiscountPuan.toFixed(0)} indirim (${remainingDiscount.toFixed(2)}). %44 (${quantity} adet) (${miktar} miktar) fee+ads (${remainingFee.toFixed(2)}) Kargo+(${shipCross.toFixed(2)}) : ${shipTotal.toFixed(2)} Kalan=${remaining.toFixed(2)} ">NET(K:+${shipTotal.toFixed(2)}): $${Net.toFixed(2)}</p>
                        </div>
                    </div>
                </div>`;
            earningNode.insertAdjacentHTML('beforeend', newContent);

            if (skuText && !document.querySelector('.copy-icon')) {
                const copyButton = document.createElement('button');
                copyButton.textContent = 'Kopyala';
                copyButton.className = 'copy-icon'; // Aynı simgenin tekrar eklenmemesi için
                copyButton.addEventListener('click', function(e) {
                    navigator.clipboard.writeText(skuText).then(() => {
                        e.target.style.backgroundColor = "red"
                        //alert('skuText kopyalandı: ' + skuText);
                    });
                });
                earningNode.parentNode.insertBefore(copyButton, newContent.nextSibling);
            }

            earningNode.dataset.contentInserted = "true";

        }
    }

    function checkAndInsertEarningContent() {
        setTimeout(() => {
            const earningNodes = document.querySelectorAll(earning);
            const adetNodes = document.querySelectorAll(adet);
            const costNodes = document.querySelectorAll(cost);
            const priceNodes = document.querySelectorAll(price);
            const shirtNodes = document.querySelectorAll(shirt);
            const shipNode = document.querySelector(ship);
            const ship2Node = document.querySelector(ship2);
            const skuNodes = document.querySelectorAll(sku);

            const shipText = shipNode && shipNode.textContent.match(/\d+/)
            ? shipNode.textContent.match(/\d+/)[0]
            : (ship2Node && ship2Node.textContent.match(/\d+/)
               ? ship2Node.textContent.match(/\d+/)[0]
               : 0);

            //console.log("shipNode: ", shipNode ? shipNode.textContent : "shipNode yok");
            //console.log("ship2Node: ", ship2Node ? ship2Node.textContent : "ship2Node yok");
            //console.log("shipText: ", shipText);

            earningNodes.forEach((earningNode, index) => {
                const costText = costNodes[index] ? costNodes[index].textContent.match(/\d+/)[0] : "Bilinmiyor";
                const priceText = priceNodes[index] ? priceNodes[index].textContent.match(/\d+/)[0] : "Bilinmiyor";
                const shirtText = shirtNodes[index] ? shirtNodes[index].textContent.trim() : "Bilinmiyor";
                const quantityText = adetNodes[0] ? adetNodes[0].textContent.match(/\d+/)[0] : "1";
                const miktar = earningNodes[index] ? earningNodes[index].textContent.match(/\d+/)[0] : "1";
                const quantity = parseInt(quantityText, 10);
                const skuText = skuNodes[index] ? skuNodes[index].textContent.trim() : "Bilinmiyor";
                insertEarningContent(earningNode, costText, priceText, shirtText, quantity, miktar, shipText,skuText);
            });
        }, 100); // 100 ms timeout
    }

    function convertNode(pNode) {
        pNode.classList.add("link", "link-primary");
        pNode.style.cursor = "pointer";
        pNode.dataset.processed = "true";

        pNode.addEventListener("click", (e) => {
            const storeNode = document.querySelector(store);
            if (!storeNode) return;
            //copy order no!!!
            const orderId = pNode.textContent.replace("#", "");
            if (storeNode.textContent.trim() !== "XX")
            {
                navigator.clipboard.writeText(orderId).then(() => {
                    //e.target.style.backgroundColor = "red"
                    //alert('orderId kopyalandı: ' + orderId);
                });
                return;
            }
            const targetUrl = `https://www.etsy.com/your/orders/sold/new?order_id=${orderId}`;
            window.open(targetUrl, "_blank");
        });
    }

    function handleMutation(mutationsList) {
        mutationsList.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const pNode = node.querySelector(selector);
                    if (pNode && !pNode.dataset.processed) convertNode(pNode);
                    checkAndInsertEarningContent();
                }
            });
        });
    }

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, observerOptions);

})();
