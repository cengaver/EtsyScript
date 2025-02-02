// ==UserScript==
// @name         Etsy Finans
// @description  Etsy
// @version      1.2
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

  const getExchangeRate = () => new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: "GET",
      url: "https://www.tcmb.gov.tr/kurlar/today.xml",
      onload: (response) => {
        if (response.status === 200) {
          const xmlDoc = new DOMParser().parseFromString(response.responseText, "text/xml")
          const rate = xmlDoc.querySelector(`Currency[CurrencyCode="USD"] BanknoteSelling`).textContent
          resolve(Number(rate))
        } else {
          reject(`Error: ${response.statusText}`)
        }
      },
      onerror: (error) => reject(error),
    })
  })

  const processFinances = async () => {
    const unformatNumber = (str) => parseFloat(str.replace(/[^0-9.-]+/g, ""))
    const profitElement = document.querySelector('[data-test-id="profit-amount"]')
    const summaryElements = Array.from(document.querySelectorAll('[data-test-id="summary-module"]'))

    if (!profitElement || summaryElements.length === 0) return

    const getSummaryTitle = (el) => el.querySelector('button .wt-text-title-01')?.textContent || ""
    const profitText = profitElement.textContent
    const salesSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Sales")
    const feesSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Fees")
    const marketingSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Marketing")

    if (!salesSummaryEl || !feesSummaryEl || !marketingSummaryEl) return

    const exchangeRate = await getExchangeRate().catch((error) => {
      console.error("Exchange rate retrieval failed:", error)
      return null
    })

    if (!exchangeRate) return

    const getProfitElValue = () => unformatNumber(profitText)
    const getSummaryElValue = (el) => unformatNumber(el.querySelector('[data-test-id="accordion-total"]')?.textContent || "0")

    const addText = (el, text) => {
      if (!el.querySelector(".usd-conversion")) {
        const span = document.createElement("span")
        span.textContent = text
        span.className = "usd-conversion"
        span.style.marginLeft = "0.5em"
        el.querySelector('[data-test-id="accordion-total"]').appendChild(span)
      }
    }

    summaryElements.forEach(el => {
      const number = getSummaryElValue(el)
      const usd = number / exchangeRate
      addText(el, ` | ${usd.toFixed(2)}$`)
    })

    const profit = getProfitElValue()
    const profitInUsd = profit / exchangeRate
    addText(profitElement, ` (${profitInUsd.toFixed(2)} USD)`)

    const sales = getSummaryElValue(salesSummaryEl)
    const fees = getSummaryElValue(feesSummaryEl)
    const marketing = getSummaryElValue(marketingSummaryEl)

    const feesProfit = Math.abs(((fees / sales) * 100).toFixed(2))
    const marketingProfit = Math.abs(((marketing / sales) * 100).toFixed(2))

    addText(feesSummaryEl, ` | ${feesProfit} %`)
    addText(marketingSummaryEl, ` | ${marketingProfit} %`)
  }

  const observer = new MutationObserver(() => {
    document.querySelectorAll(".usd-conversion").forEach(el => el.remove())
    processFinances()
  })

  window.addEventListener("load", () => {
    processFinances()
    observer.observe(document.body, { childList: true, subtree: true })
  })
})()
