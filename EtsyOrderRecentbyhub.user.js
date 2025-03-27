// ==UserScript==
// @name         Etsy Order Recent by hub
// @namespace    https://github.com/cengaver
// @version      1.4
// @description  Etsy Order Recent
// @author       Cengaver
// @match        https://*.customhub.io/*
// @grant        GM_addStyle
// @grant        GM.xmlHttpRequest
// @connect      www.tcmb.gov.tr
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

    const skuCut =
           "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > dxbl-grid > dxbl-scroll-viewer > div > table > tbody > tr > td:nth-child(3) > div > div > div.d-flex.flex-row.gap-3.col-md-12.single-note-item.all-category.note-important > div > p > a";

    const orderCut =
           "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div.mud-dialog-content.cus-detail-dialog-content.px-3.pt-0 > div > dxbl-grid > dxbl-scroll-viewer > div > table > tbody > tr > td:nth-child(3) > div > div > div.d-flex.flex-row.gap-3.col-md-12.single-note-item.all-category.note-business > div > h6 > a";

    const creditEl =
           "#main-wrapper > div > div > div > div > div > div > div.mud-card-content.cus-main.overflow-hidden > div > div > dxbl-grid > div.dxbl-grid-toolbar-container > div > div:nth-child(1) > div > div > h3";

     const balanceEl =
           "#main-wrapper > div > div > div > div > div > div > div.mud-card-content.cus-main.overflow-hidden > div > div > dxbl-grid > div.dxbl-grid-toolbar-container > div > div:nth-child(3) > div > div > h3";

    const observerOptions = { childList: true, subtree: true };

    function insertEarningContent(earningNode, costText, priceText, shirtText, quantity, miktar, shipText,skuText) {
        const storeNode = document.querySelector(store);
        let Discount = 0.70 ;
        if (storeNode.textContent.trim() === "Tees")
        {
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
            if ( storeNode.textContent.trim().includes("Colections") || orderId.includes('_') )
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

    function convertsNode() {
        const sNodes = document.querySelectorAll(skuCut);
        const oNodes = document.querySelectorAll(orderCut);
         oNodes.forEach((oNode, index) => {
            if (!oNode.dataset.contentInserted) {
                const orderCutText = oNodes[index].textContent;
                const copyOButton = document.createElement('button');
                copyOButton.textContent = 'Kopyala';
                copyOButton.style.marginLeft = '10px'; // Space between SKU and icon
                copyOButton.className = 'copy-icon'; // Aynı simgenin tekrar eklenmemesi için
                oNode.parentNode.appendChild(copyOButton);
                copyOButton.addEventListener('click', function(e) {
                    navigator.clipboard.writeText(orderCutText).then(() => {
                        e.target.style.backgroundColor = "aqua"
                        //alert('skuCText kopyalandı: ' + skuCText);
                    });
                });
                oNode.dataset.contentInserted = "true";
            }
        });

        sNodes.forEach((sNode, index) => {
            if (!sNode.dataset.contentInserted) {
                const skuCText = sNodes[index].textContent;
                const copyCButton = document.createElement('button');
                copyCButton.textContent = 'Kopyala';
                copyCButton.style.marginLeft = '10px'; // Space between SKU and icon
                copyCButton.className = 'copy-icon'; // Aynı simgenin tekrar eklenmemesi için
                sNode.parentNode.appendChild(copyCButton);
                copyCButton.addEventListener('click', function(e) {
                    navigator.clipboard.writeText(skuCText).then(() => {
                        e.target.style.backgroundColor = "aqua"
                        //alert('skuCText kopyalandı: ' + skuCText);
                    });
                });
                sNode.dataset.contentInserted = "true";
            }
        });
    }

    let isProcessing = false; // Flag to prevent multiple executions

    const getExchangeRate = () => new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: "GET",
            url: "https://www.tcmb.gov.tr/kurlar/today.xml",
            onload: (response) => {
                if (response.status === 200) {
                    const xmlDoc = new DOMParser().parseFromString(response.responseText, "text/xml")
                    const rateEl = xmlDoc.querySelector(`Currency[CurrencyCode="USD"] BanknoteSelling`)
                    if (rateEl) {
                        resolve(Number(rateEl.textContent))
                    } else {
                        reject("Kur bilgisi alınamadı")
                    }
                } else {
                    reject(`Hata: ${response.statusText}`)
                }
            },
            onerror: (error) => reject(error),
        })
    })

    const unformatNumber = (str) => parseFloat(str.replace(/[^0-9,-]+/g, ""))

    const processPage = async () => {
        if (isProcessing) return; // If already processing, exit
        isProcessing = true; // Set flag to true
        const creditElement = document.querySelector(creditEl);
        const balanceElement = document.querySelector(balanceEl);

        if (!creditElement || !balanceElement) {
            isProcessing = false; // Reset flag if elements are not found
            return;
        }

        const exchangeRate = await getExchangeRate().catch((error) => {
            console.error("Kur bilgisi alınamadı:", error)
            isProcessing = false; // Reset flag if exchange rate fetch fails
            return null
        })

        if (!exchangeRate) {
            isProcessing = false; // Reset flag if exchange rate is not available
            return;
        }

        const getcreditElValue = () => unformatNumber(creditElement.textContent)
        const getbalanceElValue = () => unformatNumber(balanceElement.textContent)

        const addText = (el, eclass, text) => {
            if (!el) return

            // Check if the span with the specified class already exists
            let span = el.querySelector(`span.${eclass}`)
            if (!span) {
                // If it doesn't exist, create a new span
                span = document.createElement("span")
                span.classList.add(eclass)
                span.style.marginLeft = "0.5em"
                el.appendChild(span)
            }
            // Update the text content of the span
            span.textContent = text
        }

        const credit = getcreditElValue();
        const creditInTl = credit * exchangeRate
        const balance = getbalanceElValue();
        const balanceInTl = balance * exchangeRate
        addText(creditElement, "tl-info", ` (${Math.round(creditInTl)} ₺)`)

        addText(balanceElement, "tl-info", ` (${Math.round(balanceInTl)} ₺)`)

        isProcessing = false; // Reset flag after processing is complete
    }

    function handleMutation(mutationsList) {
        if (window.location.href.includes('customhub.io/drop-ship/approval-pending')) processPage();
        mutationsList.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const pNode = node.querySelector(selector);
                    const sNode = node.querySelector(skuCut);
                    if (pNode && !pNode.dataset.processed) convertNode(pNode);
                    if (sNode && !sNode.dataset.processed) convertsNode();
                    checkAndInsertEarningContent();
                }
            });
        });
    }

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, observerOptions);

})();
