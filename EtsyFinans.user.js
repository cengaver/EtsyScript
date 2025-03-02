// ==UserScript==
// @name         Etsy Finans
// @description  Etsy
// @version      1.6
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/account/payments/monthly-statement*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.xmlHttpRequest
// @connect      www.tcmb.gov.tr
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyFinans.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyFinans.user.js
// ==/UserScript==

; (function () {
    "use strict"

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

    const unformatNumber = (str) => parseFloat(str.replace(/[^0-9.-]+/g, ""))

    const processPage = async () => {
        if (isProcessing) return; // If already processing, exit
        isProcessing = true; // Set flag to true

        const profitElement = document.querySelector('[data-test-id="profit-amount"]')
        const summaryElements = Array.from(document.querySelectorAll('[data-test-id="summary-module"]'))

        if (!profitElement || summaryElements.length === 0) {
            isProcessing = false; // Reset flag if elements are not found
            return;
        }

        const getSummaryTitle = (el) => el.querySelector('button .wt-text-title-01')?.textContent || ""

        const salesSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Sales")
        const feesSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Fees")
        const marketingSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Marketing")

        if (!salesSummaryEl || !feesSummaryEl || !marketingSummaryEl) {
            isProcessing = false; // Reset flag if required elements are not found
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

        const getProfitElValue = () => unformatNumber(profitElement.textContent)
        const getSummaryElValue = (el) => {
            const totalEl = el.querySelector('[data-test-id="accordion-total"]')
            return totalEl ? unformatNumber(totalEl.textContent) : 0
        }

        const addText = (el, eclass, text) => {
            const totalEl = el.querySelector('[data-test-id="accordion-total"]')
            if (!totalEl) return

            // Check if the span with the specified class already exists
            let span = totalEl.querySelector(`span.${eclass}`)
            if (!span) {
                // If it doesn't exist, create a new span
                span = document.createElement("span")
                span.classList.add(eclass)
                span.style.marginLeft = "0.5em"
                totalEl.appendChild(span)
            }
            // Update the text content of the span
            span.textContent = text
        }

        summaryElements.forEach(el => {
            const number = getSummaryElValue(el)
            const usd = number / exchangeRate
            addText(el, "usd-info", ` | ${usd.toFixed(2)}$`)
            console.log("Usd:", usd.toFixed(2))
        })

        const profit = getProfitElValue()
        const profitInUsd = profit / exchangeRate
        addText(profitElement, "usd-info", ` (${profitInUsd.toFixed(2)} USD)`)
        console.log("Profit:", profit)
        console.log("Profit in USD:", profitInUsd.toFixed(2))

        const sales = getSummaryElValue(salesSummaryEl)
        const fees = getSummaryElValue(feesSummaryEl)
        const marketing = getSummaryElValue(marketingSummaryEl)
        console.log("Sales:", sales)
        console.log("Fees:", fees)
        console.log("Marketing:", marketing)

        if (sales !== 0) {
            const feesProfit = Math.abs(((fees / sales) * 100).toFixed(2))
            const marketingProfit = Math.abs(((marketing / sales) * 100).toFixed(2))

            addText(feesSummaryEl, "percent-info", ` | ${feesProfit} %`)
            addText(marketingSummaryEl, "percent-info", ` | ${marketingProfit} %`)
        }

        isProcessing = false; // Reset flag after processing is complete
    }

    // Debounce function to limit how often processPage is called
    const debounce = (func, delay) => {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const debouncedProcessPage = debounce(processPage, 1000); // Debounce with 1-second delay

    // Observe changes in the DOM
    const observer = new MutationObserver(debouncedProcessPage);
    observer.observe(document.body, { childList: true, subtree: true });

    // Run on initial page load
    window.addEventListener("load", debouncedProcessPage);
})();
