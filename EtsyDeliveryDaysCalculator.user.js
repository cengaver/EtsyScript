// ==UserScript==
// @name         Etsy Delivery Days Calculator
// @version      1.5
// @description  Calculate the number of days between order and delivery
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/orders/sold/completed*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        none
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyDeliveryDaysCalculator.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyDeliveryDaysCalculator.user.js
// ==/UserScript==

(function () {
    let lastOrderId = null; // Global variable to track the last processed order_id

    function parseOrderDate(dateString) {
        const regex = /Ordered\s+(\d{1,2}:\d{2}[apm]+),\s+(\w+),\s+(\w+\s\d{1,2},\s+\d{4})/;
        //console.log("Order date text:", dateString); // Debugging: Show order date text
        const match = regex.exec(dateString);
        if (match) {
            const date = match[3]; // "Nov 2, 2024"
            const formattedDate = date.split(',')[0] + ',' + date.split(',')[1]; // "Nov 2, 2024"
            return new Date(formattedDate); // Return the date object
        }
        return null;
    }

    function parseDeliveryDate(dateString) {
        const regex = /^(\w+\s\d{1,2},\s\d{4})/;
        //console.log("Delivery date text:", dateString); // Debugging: Show delivery date text
        const match = regex.exec(dateString);
        if (match) {
            const formattedDeliveryDate = match[1];
            return new Date(formattedDeliveryDate); // Parse the delivery date string
        }
        return null;
    }

     function labelDeliveryDate(dateString) {
        const regex = /^(\w+\s\d{1,2},\s\d{4})/;
        //console.log("Delivery date text:", dateString); // Debugging: Show delivery date text
        const match = regex.exec(dateString);
        if (match) {
            const formattedDeliveryDate = match[1];
            return formattedDeliveryDate; // Parse the delivery date string
        }
        return null;
    }

    function calculateDaysBetweenDates(startDate, endDate) {
        const diffTime = Math.abs(endDate - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Calculate the number of days between two dates
    }

    // Function to get the current order_id from the URL
    function getCurrentOrderId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('order_id');
    }

    function formatDate(date) {
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Function to process the dates if they're available
    function processOrderDates() {
        const orderId = getCurrentOrderId(); // Get the order_id from the current URL
        //console.log("CorderId : " + orderId);
        //console.log("lastOrderId : " + lastOrderId);
        // Check if the order_id has changed or is null
        if (orderId && orderId !== lastOrderId) {
            lastOrderId = orderId; // Update the last processed order_id
            //console.log("lastOrderId2 : " + lastOrderId);
            let orderDateText =document.querySelector("#dg-tabs-preact__tab-1--default_wt_tab_panel > div > div.mt-xs-1 > div:nth-child(3)")
            if (orderDateText && orderDateText.innerText.includes("Ordered")) {
                console.log("Ordered kelimesi bulundu.");
            } else {
                orderDateText = document.querySelector("#dg-tabs-preact__tab-1--default_wt_tab_panel > div > div.mt-xs-1 > div:nth-child(2)")
                console.log("orderDateText : " + orderDateText?.innerText);
            }
            console.log("orderDateText2 : " + orderDateText?.innerText);
            //const orderDateText = document.querySelector('#order-detail-container > div.col-group.mt-xs-4.mb-xs-2 > div.col-xs-12.mb-xs-2 > div > div.flag-img.flag-img-right.text-right.vertical-align-top.hide-xs.hide-sm > div.text-body-smaller.mt-xs-1'); // Locate the element for order date
            //const deliveryDateText = document.querySelector('#dg-tabs-preact__tab-2--default_wt_tab_panel > div > div:nth-child(2) > div > div > div > div > div:nth-child(1) > div:nth-child(2) > div > div > div > div:nth-child(1) > div.col-group.col-flush.mt-xs-2.text-body-smaller > div.col-xs-9.wt-wrap > div > ol > div:nth-child(1) > div > div > div.col-xs-5.text-gray-lightest.text-right');
            //const deliveryDateText = document.querySelector('#order-detail-container > div.col-group.pb-xs-2 > div > div > div > div > div > div:nth-child(1) > div:nth-child(2) > div > div > div > div:nth-child(1) > div.col-group.col-flush.mt-xs-2.text-body-smaller > div.col-xs-9.wt-wrap > div > ol > div:nth-child(1) > div > div > div.col-xs-5.text-gray-lightest.text-right'); // Locate the element for delivery date
            const deliveryDateText = document.querySelector("#dg-tabs-preact__tab-1--default_wt_tab_panel > div > div:nth-child(6) > div > div > div > div > div:nth-child(1) > div:nth-child(2) > div > div > div > div:nth-child(1) > div.col-group.col-flush.mt-xs-2.text-body-smaller > div.col-xs-9.wt-wrap > div > ol > div:nth-child(1) > div > div > div.col-xs-5.text-gray-lightest.text-right");
            console.log("deliveryDateText : " + deliveryDateText?.innerText);
            //const resultElement = document.querySelector("#order-detail-container > div.col-group.mt-xs-4.mb-xs-2 > div:nth-child(2) > span > span.wt-pl-xs-0.wt-pr-xs-0.order-states-dropdown > span > span:nth-child(2) > h4");
            //const resultElement = document.querySelector("#dg-tabs-preact__tab-1--default_wt_tab_panel > div > div:nth-child(3) > div > div:nth-child(1)")
            const resultElement = document.querySelector("#dg-tabs-preact__tab-1--default_wt_tab_panel > div > div:nth-child(2) > div > div.panel.mb-xs-0 > div > div > div.flag-body.icon-t-2.text-body-smaller.text-gray-darker > div:nth-child(2)")
            console.log("resultElement : " + resultElement?.innerText);

            if (orderDateText && deliveryDateText) {
                const orderDate = parseOrderDate(orderDateText.innerText);
                const deliveryDate = parseDeliveryDate(deliveryDateText.innerText);

                if (orderDate && deliveryDate) {
                    let daysDifference = calculateDaysBetweenDates(orderDate, deliveryDate);
                    console.log(`Geçen gün sayısı: ${daysDifference}`);

                    // Get the element where you want to insert the result
                    //const resultElement = document.querySelector('#order-detail-container > div:nth-child(6) > div > div > h4 > span > h2');
                    if (resultElement) {
                        const protection = document.getElementById("purchase-protection-seller-onsite-under-250")
                        if(protection){
                            protection.style.display = "none";
                        }
                        if(daysDifference<7){
                            daysDifference+="✅";
                        }else{
                            daysDifference+="❌";
                        }
                        let orderDateValue = formatDate(orderDate);
                        console.log(formatDate(orderDate)); // "Jan 15"
                        resultElement.innerText = `${daysDifference} gün : (${labelDeliveryDate(deliveryDateText.innerText)}) - (${orderDateValue})`;
                    }
                } else {
                    console.log("Tarihler geçerli değil.");
                }
            } else {
                console.log("orderDateText : " + orderDateText + " ,deliveryDateText : " + deliveryDateText);
            }
        }
    }

    // Create a MutationObserver to detect changes in the URL
    const observer = new MutationObserver(() => {
        const orderId = getCurrentOrderId();
        //console.log("orderId : " + orderId);
        if (orderId) {
             // Check every 1 second if the order_id is set in the URL
            const interval = setInterval(() => {
                processOrderDates(); // Process the order dates when order_id is available
                clearInterval(interval); // Stop checking after the order_id is found
            }, 1000);
        }
    });

    // Start observing the changes in the URL
    observer.observe(document, { childList: true, subtree: true });

})();
