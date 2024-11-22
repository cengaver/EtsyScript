// ==UserScript==
// @name         Erank On Etsy
// @description  Erank overlay with unified menu for configuration and range selection. Sheet entegre
// @version      1.75
// @author       Cengaver
// @namespace    https://github.com/cengaver
// @match        https://www.etsy.com/search*
// @match        https://www.etsy.com/shop/*
// @match        https://www.etsy.com/listing/*
// @match        https://www.etsy.com/people/*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.xmlHttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addElement
// @grant        GM_getResourceText
// @connect      beta.erank.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ErankOnEtsy.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ErankOnEtsy.user.js
// ==/UserScript==

(async function () {
    "use strict";

    // Tüm ayarları topluca düzenleyecek menü
    const setApiConfigMenu = () => {
        GM_registerMenuCommand("Update API Configurations", async () => {
            const currentConfig = {
                apiKey: await GM.getValue('apiKey', ''),
                sheetId: await GM.getValue('sheetId', ''),
                erankUserKey: await GM.getValue('erankUserKey', ''),
                authorization: await GM.getValue('authorization', ''),
                erankKey: await GM.getValue('erankKey', ''),
                range: await GM.getValue('range', 'Liste!E:AD'),
            };

            const input = prompt(
                `Update Configuration:\n` +
                `Enter values in the format below (keep empty to retain current values):\n\n` +
                `Google Sheets API Key: ${currentConfig.apiKey}\n` +
                `Google Sheets Sheet ID: ${currentConfig.sheetId}\n` +
                `eRank User Key: ${currentConfig.erankUserKey}\n` +
                `Authorization Token: ${currentConfig.authorization}\n` +
                `eRank API Key: ${currentConfig.erankKey}\n` +
                `Range (e.g., Liste!E:AD): ${currentConfig.range}\n\n` +
                `Format: apiKey|sheetId|erankUserKeyauthorization|erankKey|range`,
                `${currentConfig.apiKey}|${currentConfig.sheetId}|${currentConfig.erankUserKey}|${currentConfig.authorization}|${currentConfig.erankKey}|${currentConfig.range}`
            );

            if (input) {
                const [apiKey, sheetId, erankUserKey, authorization, erankKey, range] = input.split('|');
                if (apiKey) await GM.setValue('apiKey', apiKey.trim());
                if (sheetId) await GM.setValue('sheetId', sheetId.trim());
                if (erankUserKey) await GM.setValue('erankUserKey', erankUserKey.trim());
                if (authorization) await GM.setValue('authorization', authorization.trim());
                if (erankKey) await GM.setValue('erankKey', erankKey.trim());
                if (range) await GM.setValue('range', range.trim());

                alert("Configuration updated successfully.");
            } else {
                alert("No changes made.");
            }
        });
    };
    setApiConfigMenu();

    const getApiConfig = async () => {
        const apiKey = await GM.getValue('apiKey', '');
        const sheetId = await GM.getValue('sheetId', '');
        const erankUserKey = await GM.getValue('erankUserKey', '');
        const authorization = await GM.getValue('authorization', '');
        const erankKey = await GM.getValue('erankKey', '');
        const range = await GM.getValue('range', 'Liste!E:AD');

        if (!apiKey || !sheetId || !erankUserKey|| !authorization || !erankKey || !range) {
            alert("API Configurations are not set. Please configure it using the menu.");
            return null;
        }

        return { apiKey, sheetId, erankUserKey, authorization, erankKey, range };
    };

    let ids = JSON.parse(sessionStorage.getItem('cachedData')) || null;
    const config = await getApiConfig();
    if (!config) return;
    const { apiKey, sheetId, erankUserKey, authorization, erankKey, range } = config;

    // Google Sheets ve eRank işlemleri için aynı kodları kullandım.
    const fetchColumnData = async () => {
        const cacheKey = 'cachedData';
        const cacheTimestampKey = `${cacheKey}_timestamp`;
        const now = Date.now();

        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        const cacheTimestamp = localStorage.getItem(cacheTimestampKey);

        if (cachedData && cacheTimestamp && now - parseInt(cacheTimestamp) < 1 * 60 * 60 * 1000) {
            return cachedData;
        }

        const config = await getApiConfig();
        if (!config) return;

        const { apiKey, sheetId, range } = config;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch Google Sheets data.");
            const data = await response.json();
            const values = data.values; // Tüm satırları alıyoruz
            const processedData = data.values.map(row => ({
                id: row[row.length - 1], // AD sütunu (son sütun)
                dnoValue: row[0], // E sütunu (ilk sütun)
            }));
            localStorage.setItem(cacheKey, JSON.stringify(processedData));
            localStorage.setItem(cacheTimestampKey, now.toString());
            return { processedData };
        } catch (error) {
            console.error("Google Sheets API error:", error);
        }
    };

    const findEValueById = (id) => {
        const cachedData = JSON.parse(localStorage.getItem('cachedData')) || [];
        const match = cachedData.find(row => row.id === id);
        return match ? match.dnoValue : null;
    };

    const getErankData = async (id) => {
        const cacheKey = `erank_${id}`;
        const now = Date.now();
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));

        if (cachedData && now - parseInt(cachedData.timestamp) < 24 * 60 * 60 * 1000) {
            return cachedData;
        }

        const config = await getApiConfig();
        if (!config) return;

        const { erankUserKey, authorization, erankKey } = config;
        const url = `https://beta.erank.com/api/ext/listing/${id}`;

        try {
            const { response } = await GM.xmlHttpRequest({
                url,
                headers: {
                    accept: "application/json, text/plain, */*",
                    authorization: `${erankUserKey}|${authorization}`,
                    "x-erank-key": erankKey,
                    "x-user-agent": "erank-bx/1.0",
                },
                responseType: "json",
            });

            const erankData = {
                sales: response.data.stats.est_sales.label,
                age: response.data.stats.listing_age,
                timestamp : now.toString(),
            };

            localStorage.setItem(cacheKey, JSON.stringify(erankData));
            return erankData;
        } catch (error) {
            console.error("eRank data fetch error:", error);
        }
    };

    const createOverlayOnElement = async (element, id) => {
        const overlay = document.createElement("div");
        overlay.className = "wt-display-flex-xs wt-text-title-01";
        overlay.style.gap = "1rem";
        element.appendChild(overlay);

        const loadingEl = document.createElement("div");
        loadingEl.textContent = "Erank verileri yükleniyor...";
        overlay.appendChild(loadingEl);

        const { sales, age } = await getErankData(id); //server hatası
        //const sales ="!";
        //const age ="!";

        const dnoValue = findEValueById(id) || ""; // Eğer değer bulunmazsa boş string
        const result = dnoValue ? "❤️" : "🤍";
        const tooltipText = dnoValue ? `Dizayn NO: ${dnoValue}` : "";

        loadingEl.remove();

        // Kalp sarmalayıcı
        const heartWrapper = document.createElement("div");
        heartWrapper.style.position = "relative"; // Konumlandırma için relative
        heartWrapper.style.display = "inline-block";

        // Kalp elementi
        const resultEl = document.createElement("div");
        resultEl.textContent = result;
        resultEl.title = tooltipText;
        resultEl.style.cursor = "pointer";
        resultEl.style.marginLeft = "5px";
        resultEl.style.fontSize = "1.5rem";
        resultEl.style.color = dnoValue ? "red" : "black";

        // Rozet elementi (sadece değer varsa ekle)
        if (dnoValue) {
            const badgeEl = document.createElement("span");
            badgeEl.textContent = dnoValue;
            badgeEl.style.position = "absolute";
            badgeEl.style.top = "-10px"; // Daha yukarı taşı
            badgeEl.style.right = "-14px"; // Daha sola taşı
            badgeEl.style.backgroundColor = "gold";
            badgeEl.style.color = "black";
            badgeEl.style.borderRadius = "50%";
            badgeEl.style.padding = "2px 5px";
            badgeEl.style.fontSize = "0.8rem";
            badgeEl.style.fontWeight = "bold";
            heartWrapper.appendChild(badgeEl);
        }

        // Kalp ve overlay düzenlemeleri
        heartWrapper.appendChild(resultEl);
        overlay.appendChild(heartWrapper);

        // Satış ve yaş elementleri
        const salesEl = document.createElement("div");
        salesEl.textContent = `Satış: ${sales}`;
        if (Number(sales) / 1.5 > Number(age)) salesEl.style.backgroundColor = "green";
        overlay.appendChild(salesEl);

        const ageEl = document.createElement("div");
        ageEl.textContent = `Yaş: ${age}`;
        if (age >= 1 && age <= 50) ageEl.style.backgroundColor = "#73C476";
        else if (age >= 51 && age <= 100) ageEl.style.backgroundColor = "#C5E1A5";
        else if (age >= 101 && age <= 300) ageEl.style.backgroundColor = "#FFD54F";
        else if (age >= 301 && age <= 7000) ageEl.style.backgroundColor = "#EF9A9A";
        overlay.appendChild(ageEl);
    };

    const handleListingPage = async () => {
        const urlParts = window.location.pathname.split('/');
        const id = urlParts[urlParts.indexOf('listing') + 1];
        const titleElement = document.querySelector('#listing-page-cart > div.wt-mb-xs-1 > h1');

        if (titleElement && id) {
            await createOverlayOnElement(titleElement, id);
        }
    };

    const initOverlay = async () => {
        const listingCards = document.querySelectorAll("[data-listing-id][data-listing-card-v2]");
        await Promise.all([...listingCards].map(async (el) => {
            const id = el.dataset.listingId;
            const infoEl = el.querySelector(".search-half-unit-mt") || el;
            await createOverlayOnElement(infoEl, id);
        }));
    };

    window.addEventListener("load", () => {
        if (window.location.href.includes("/listing/")) {
            handleListingPage();
        } else {
            initOverlay();
        }
    });

    const observeUrlChanges = () => {
        let lastUrl = location.href;
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                if (window.location.href.includes("/listing/")) {
                    handleListingPage();
                } else {
                    initOverlay();
                }
            }
        }).observe(document, { subtree: true, childList: true });
    };

    await fetchColumnData();
    observeUrlChanges();
})();
