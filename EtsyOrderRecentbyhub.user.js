// ==UserScript==
// @name         Etsy Order Recent by hub
// @namespace    https://github.com/cengaver
// @version      1.7
// @description  Etsy Order Recent
// @author       Cengaver
// @match        https://*.customhub.io/*
// @grant        GM_addStyle
// @grant        GM.xmlHttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      www.tcmb.gov.tr
// @icon         https://dashboard.k8s.customhub.io/Modernize/assets/images/logos/favicon.png
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyOrderRecentbyhub.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyOrderRecentbyhub.user.js
// ==/UserScript==

(function () {
    "use strict";
    // Config yapısı
    const DEFAULT_CONFIG = {
        discount: 25, //indirim yüzde
        feePerc: 52, //fee yüzde
        shipHoodie: 8, //hoodie kargo fiyatı
        shipHoodie2: 3, //ikinci hoodie kargo fiyatı
        shipTee: 5, //tişört ve sweatshirt kargo fiyatı
        shipTee2: 2, //ikinci tişört ve sweatshirt kargo fiyatı
    };

    // Global değişkenler
    let config = {...DEFAULT_CONFIG};

    // Config yönetimi
    function loadConfig() {
        const savedConfig = GM_getValue('storeConfig');
        if (savedConfig) {
            config = {...DEFAULT_CONFIG, ...savedConfig};
        }
    }

    function saveConfig() {
        GM_setValue('storeConfig', config);
    }

    function isConfigured() {
        return config.discount;
    }

    function initUI() {
        GM_registerMenuCommand('⚙️ Ayarları Düzenle', showConfigMenu);
    }

    function showConfigMenu() {
        GM_registerMenuCommand('⚙️ Store Ayarları', function() {
            const html = `
                <div style="padding:20px;font-family:Arial,sans-serif;max-width:500px;">
                    <h2 style="margin-top:0;">Store Aracı Ayarları</h2>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">Store Discount:% (25)</label>
                        <input type="number" id="discount" value="${config.discount}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">Fee + Marketing % (48):</label>
                        <input type="number" id="feePerc" value="${config.feePerc}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">Hoodie Kargo:</label>
                        <input type="number" id="shipHoodie" value="${config.shipHoodie}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">Hoodie Kargo 2. ürün:</label>
                        <input type="number" id="shipHoodie2" value="${config.shipHoodie2}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">Shirt Kargo:</label>
                        <input type="number" id="shipTee" value="${config.shipTee}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">Shirt Kargo 2. ürün:</label>
                        <input type="number" id="shipTee2" value="${config.shipTee2}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <button id="saveConfigBtn" style="padding:10px 15px;background:#4285f4;color:white;border:none;border-radius:4px;cursor:pointer;">Kaydet</button>
                </div>
            `;

            const win = window.open("", "StoreConfig", "width=600,height=600");
            win.document.body.innerHTML = html;

            win.document.getElementById('saveConfigBtn').addEventListener('click', function() {
                config.discount = parseFloat(win.document.getElementById('discount').value);
                config.feePerc = parseFloat(win.document.getElementById('feePerc').value);
                config.shipHoodie = parseFloat(win.document.getElementById('shipHoodie').value);
                config.shipHoodie2 = parseFloat(win.document.getElementById('shipHoodie2').value);
                config.shipTee = parseFloat(win.document.getElementById('shipTee').value);
                config.shipTee2 = parseFloat(win.document.getElementById('shipTee2').value);
                saveConfig();
                win.alert("Ayarlar kaydedildi! Sayfayı yenileyin.");
                win.close();
            });
        });
    }

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

    const salesSummary =
           "div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div > div > div > div > div > div:nth-child(2) > h6";

    const observerOptions = { childList: true, subtree: true };

    function insertEarningContent(earningNode, costText, priceText, shirtText, quantity, miktar, shipText,skuText) {
        const storeNode = document.querySelector(store);
        const RemDiscount = (100 - config.discount) / 100; //indirimden kalan yüzde
        const RemFeePerc = (100 - config.feePerc) / 100; //fee den kalan yüzde
        const remainingDiscount = priceText * RemDiscount;
        const remainingFee = remainingDiscount * RemFeePerc;
        const remaining = remainingFee - costText;
        const shipCross = shirtText.includes("Hoodie") ? (config.shipHoodie + config.shipHoodie2 * (quantity-1))/quantity : (config.shipTee + config.shipTee2 * (quantity-1))/quantity;
        const shipTotal = shipText ? (shipCross - shipText/quantity) : 0;
        console.log("shipCross: ",shipCross)
        console.log("shipTotal: ",shipTotal)
        console.log("shipHoodie: ",config.shipHoodie)
        console.log("shipCrossHes: ",(config.shipHoodie + config.shipHoodie2 * (quantity-1))/quantity)
        const Net = (remaining + shipTotal)*miktar;

        if (!earningNode.dataset.contentInserted) {
            const newContent = `
                <div class="mud-alert mud-alert-text-primary mud-dense mud-elevation-0 mt-1" style="cursor: pointer;">
                    <div class="mud-alert-position justify-sm-start">
                        <div class="mud-alert-message">
                            <p class="mud-typography mud-typography-body2" title="%${config.discount} indirim (${remainingDiscount.toFixed(2)}). %${config.feePerc} (${quantity} adet) (${miktar} miktar) fee+ads (${remainingFee.toFixed(2)}) Kargo+(${shipCross.toFixed(2)}) : ${shipTotal.toFixed(2)} Kalan=${remaining.toFixed(2)} ">NET(K:+${shipTotal.toFixed(2)}): $${Net.toFixed(2)}</p>
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
            if ( !storeNode.textContent.trim().includes("Hand") || orderId.includes('_') )
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
        const salNode = document.querySelector(salesSummary);
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

        if (!salNode.dataset.contentInserted) {
            const subTotal = document.querySelector("div.mud-focus-trap.outline-none > div.mud-focus-trap-child-container.outline-none > div > div > div > div > div > div.d-flex.align-items-center.justify-content-between.mb-3.pt-2 > h6").textContent;
            const discount = salNode.textContent;
            console.log("indirim: ",discount);
            console.log("subTotal: ",subTotal);
            const discountSpan = document.createElement('span');
            discountSpan.textContent = `% ${(unformatNumber(discount)*100/unformatNumber(subTotal)).toFixed(2)}`;
            salNode.parentNode.appendChild(discountSpan);
            salNode.dataset.contentInserted = "true";
        }
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

    // Sayfa yüklendiğinde
    window.addEventListener('load', async function() {
        loadConfig();
        //if (isConfigured()) {
            //initUI();
       //} else {
            showConfigMenu();
        //}
    });

    function handleMutation(mutationsList) {
        if (window.location.href.includes('customhub.io/drop-ship/approval-pending')) processPage();
        mutationsList.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const pNode = node.querySelector(selector);
                    const sNode = node.querySelector(skuCut);
                    const salNode = node.querySelector(salesSummary);
                    if (pNode && !pNode.dataset.processed) convertNode(pNode);
                    if (sNode && !sNode.dataset.processed) convertsNode();
                    if (salNode && !salNode.dataset.processed) convertsNode();
                    checkAndInsertEarningContent();
                }
            });
        });
    }

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, observerOptions);

})();
