// ==UserScript==
// @name         Etsy Finans
// @description  Etsy
// @version      1.72
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/account/payments/monthly-statement*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @connect      www.tcmb.gov.tr
// @connect      api.exchangeratesapi.io
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyFinans.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyFinans.user.js
// ==/UserScript==

; (function () {
    "use strict"

    GM.registerMenuCommand("⚙️ Sheet Url Ayarla", async () => {
        const url = prompt(" Sheet Url'nizi girin:");
        if (url) {
            await GM.setValue("sheet_url", url.trim());
            alert("✅ Kaydedildi.");
        }
    });
    async function getSheetUrl() {
        const url = await GM.getValue("sheet_url", "");
        return url;
    }

    GM.registerMenuCommand("✨exchangeratesApi Ayarla", async () => {
        const api = prompt(" Api Keyinizi girin:");
        if (api) {
            await GM.setValue("api_key", api.trim());
            alert("✅ Kaydedildi.");
        }
    });
    async function getApiKey() {
        const api = await GM.getValue("api_key", "");
        return api;
    }

    GM.registerMenuCommand("⭐ Mağaza Adı", async () => {
        const name = prompt(" Mağaza Adını girin:");
        if (name) {
            await GM.setValue("shop_name", name.trim());
            alert("✅ Kaydedildi.");
        }
    });
    async function getShopName() {
        const name = await GM.getValue("shop_name", "");
        return name;
    }
    let isProcessing = false; // Flag to prevent multiple executions

    const getExchangeRate = async () => {

        const getFromTCMB = () => new Promise((res, rej) => {
            GM.xmlHttpRequest({
                method: "GET",
                url: "https://www.tcmb.gov.tr/kurlar/today.xml",
                onload: r => {
                    if (r.status !== 200) return rej("TCMB HTTP hata")
                    const xml = new DOMParser().parseFromString(r.responseText, "text/xml")
                    const el = xml.querySelector(`Currency[CurrencyCode="USD"] BanknoteSelling`)
                    if (!el) return rej("TCMB veri yok")
                    res(Number(el.textContent))
                },
                onerror: () => rej("TCMB bağlantı hatası")
            })
        })

        const getFromExchangeApi = apiKey => new Promise((res, rej) => {
            GM.xmlHttpRequest({
                method: "GET",
                url: `https://api.exchangeratesapi.io/v1/latest?access_key=${apiKey}&symbols=USD,TRY`,
                onload: r => {
                    if (r.status !== 200) return rej("API HTTP hata")
                    let d
                    try { d = JSON.parse(r.responseText) } catch { return rej("API JSON hata") }
                    if (!d.success) return rej(d.error?.info || "API başarısız")
                    res(Number((d.rates.TRY / d.rates.USD).toFixed(4)))
                },
                onerror: () => rej("API bağlantı hatası")
            })
        })

        try {
            return await getFromTCMB()
        } catch {
            const apiKey = await getApiKey()
            if (!apiKey) throw "API key yok"
            return await getFromExchangeApi(apiKey)
        }
    }


    const unformatNumber = (str) => parseFloat(str.replace(/[^0-9.-]+/g, ""))

    // set param: 1 -> Google Sheets'e gönder (bir kez veya period değişince)
    const processPage = async (set = 0) => {
        if (isProcessing) return;
        isProcessing = true;

        const profitElement = document.querySelector('[data-test-id="profit-amount"]')
        const summaryElements = Array.from(document.querySelectorAll('[data-test-id="summary-module"]'))

        if (!profitElement || summaryElements.length === 0) {
            isProcessing = false;
            return;
        }

        const getSummaryTitle = (el) => el.querySelector('button .wt-text-title-01')?.textContent || ""

        const salesSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Sales")
        const feesSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Fees")
        const marketingSummaryEl = summaryElements.find(el => getSummaryTitle(el) === "Marketing")

        if (!salesSummaryEl || !feesSummaryEl || !marketingSummaryEl) {
            isProcessing = false;
            return;
        }

        let exchangeRate = await getExchangeRate().catch((error) => {
            console.error("Kur bilgisi alınamadı:", error)
            isProcessing = false;
            return null
        })

        if (!exchangeRate) {
            isProcessing = false;
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

            let span = totalEl.querySelector(`span.${eclass}`)
            if (!span) {
                span = document.createElement("span")
                span.classList.add(eclass)
                span.style.marginLeft = "0.5em"
                totalEl.appendChild(span)
            }
            span.textContent = text
        }

        if(!salesSummaryEl.textContent.includes("TL")) {
            exchangeRate = 1;
        }
        summaryElements.forEach(el => {
            const number = getSummaryElValue(el)
            const usd = number / exchangeRate
            addText(el, "usd-info", ` | ${usd.toFixed(2)}$`)
        })

        const profit = getProfitElValue()
        const profitInUsd = profit / exchangeRate
        addText(profitElement, "usd-info", ` (${profitInUsd.toFixed(2)} USD)`)

        const sales = getSummaryElValue(salesSummaryEl)
        const fees = getSummaryElValue(feesSummaryEl)
        const marketing = getSummaryElValue(marketingSummaryEl)

        if (sales !== 0) {
            const feesProfit = Math.abs(((fees / sales) * 100).toFixed(2))
            const marketingProfit = Math.abs(((marketing / sales) * 100).toFixed(2))

            addText(feesSummaryEl, "percent-info", ` | ${feesProfit} %`)
            addText(marketingSummaryEl, "percent-info", ` | ${marketingProfit} %`)

            const periodEl = document.querySelector("span.wt-menu__trigger__label.month-dropdown-item")
            const periodText = periodEl ? (periodEl.textContent || "") : ""

            const data = {
                shopName: await getShopName() || "",
                sales: (sales / exchangeRate).toFixed(0) || "",
                fees: (fees / exchangeRate).toFixed(0) || "",
                marketing: (marketing / exchangeRate).toFixed(0) || "",
                feesProfit: feesProfit.toFixed(0) || "",
                marketingProfit: marketingProfit.toFixed() || "",
                period: periodText,
                sheetName: 'finans'
            };

            // Eğer set === 1 ise (bir kez gönder veya period değiştiğinde gönder)
            if (set == 1) await logToGoogleSheets(data);
        }

        isProcessing = false;
    }

    async function logToGoogleSheets(payload) {
        const sheetUrl = await getSheetUrl();
        if (!sheetUrl) return;
        GM.xmlHttpRequest({
            method: "POST",
            url: sheetUrl,
            data: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json"
            },
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.status === 'success') {
                        console.log('✅ Google Sheet gönderildi');
                    } else {
                        console.log('❌ Hata: ' + (data.message || 'Bilinmeyen hata'));
                    }
                } catch (e) {
                    console.log('❌ Yanıt işlenemedi');
                }
            },
            onerror: function(error) {
                console.log('❌ Gönderilemedi: ' + (error.message || 'Bilinmeyen hata'));
            }
        });
    }

    // Debounce
    const debounce = (func, delay) => {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Debounced wrapper that calls processPage without triggering sheet-send (set=0)
    const debouncedProcessPage = debounce(() => processPage(0), 1000);

    // Observe DOM changes generally to update UI (but not to send to sheet)
    const observer = new MutationObserver(() => {
        debouncedProcessPage();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // On initial load: run UI update debounce, and also trigger one-time sheet send shortly after load
    window.addEventListener("load", () => {
        debouncedProcessPage();
        // sayfa yüklendikten kısa süre sonra bir kez Google Sheet'e gönder (ör: 2 saniye)
        setTimeout(() => {
            processPage(1);
        }, 2000);
    });

    // Ayrıca period (ay seçimi) değişimini izle ve değişince Google Sheet'e gönder
    const setupPeriodObserver = () => {
        const periodEl = document.querySelector("span.wt-menu__trigger__label.month-dropdown-item");
        if (!periodEl) return;

        // Eğer element zaten izleniyorsa tekrar eklemeyelim
        if (periodEl.__periodObserverAdded) return;
        periodEl.__periodObserverAdded = true;

        const prev = { text: periodEl.textContent };

        const periodObserver = new MutationObserver((mutations) => {
            const cur = periodEl.textContent;
            if (cur !== prev.text) {
                prev.text = cur;
                // period değişti, Google Sheet'e gönder (set=1)
                processPage(1);
            }
        });

        periodObserver.observe(periodEl, { characterData: true, childList: true, subtree: true });

        // Ayrıca dropdown üzerinden seçildiğinde bazen DOM dışından değişebilir; body değişimlerinde period element yeniden seçilebileceği için
        // periyodik olarak (ör: sayfa değişimleri sonrası) setupPeriodObserver çağıracağız — zaten load ve mutation observer'ımız bunu kapsıyor.
    };

    // İlk kurulum denemesi
    setupPeriodObserver();

    // Period elementi dinamik olarak eklenirse yakalamak için kısa bir observer: (yeni period element eklendiğinde setupPeriodObserver çağrılır)
    const smallObserver = new MutationObserver(() => {
        setupPeriodObserver();
    });
    smallObserver.observe(document.body, { childList: true, subtree: true });

})();
