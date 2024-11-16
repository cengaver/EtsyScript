// ==UserScript==
// @name         Etsy Finans
// @description  Etsy
// @version      1.1
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/account/payments/monthly-statement*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.xmlHttpRequest
// @connect      www.tcmb.gov.tr
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

  window.addEventListener("load", async () => {
    const unformatNumber = (str) => parseFloat(str.replace(/[^0-9.-]+/g, ""))

    const profitElement = document.querySelector('[data-test-id="profit-amount"]')
    const summaryElements = Array.from(document.querySelectorAll('[data-test-id="summary-module"]'))

    if (!profitElement) throw new Error("Profit element not found")
    if (summaryElements.length === 0) throw new Error("Summary elements not found")

    const getSummaryTitle = (el) => el.querySelector('button .wt-text-title-01')?.textContent || ""

    const profitText = profitElement.textContent
    const salesSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Sales")
    const feesSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Fees")
    const marketingSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Marketing")

    if (!salesSummaryEl) throw new Error("Sales element not found")
    if (!feesSummaryEl) throw new Error("Fees element not found")
    if (!marketingSummaryEl) throw new Error("Marketing element not found")

    const exchangeRate = await getExchangeRate().catch((error) => {
      console.error("Exchange rate retrieval failed:", error)
      return null
    })

    if (!exchangeRate) return

    const getProfitElValue = () => unformatNumber(profitText)
    const getSummaryElValue = (el) => unformatNumber(el.querySelector('[data-test-id="accordion-total"]')?.textContent || "0")

    const addText = (el, text) => {
      const span = document.createElement("span")
      span.textContent = text
      span.style.marginLeft = "0.5em"
      el.querySelector('[data-test-id="accordion-total"]').appendChild(span)
    }

    const addRateInfo = (el) => {
      const number = getSummaryElValue(el)
      const usd = number / exchangeRate
      addText(el, ` | ${usd.toFixed(2)}$`)
    }

    summaryElements.forEach(addRateInfo)

    const profit = getProfitElValue()
    const profitInUsd = profit / exchangeRate
    const profitSpan = document.createElement("span")
    profitSpan.textContent = ` (${profitInUsd.toFixed(2)} USD)`
    profitSpan.style.marginLeft = "0.5em"
    profitElement.appendChild(profitSpan)

    const sales = getSummaryElValue(salesSummaryEl)
    const fees = getSummaryElValue(feesSummaryEl)
    const marketing = getSummaryElValue(marketingSummaryEl)

    const feesProfit = Math.abs(((fees / sales) * 100).toFixed(2))
    const marketingProfit = Math.abs(((marketing / sales) * 100).toFixed(2))

    addText(feesSummaryEl, ` | ${feesProfit} %`)
    addText(marketingSummaryEl, ` | ${marketingProfit} %`)
  })
})()
