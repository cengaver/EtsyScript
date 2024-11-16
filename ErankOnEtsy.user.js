// ==UserScript==
// @name         Erank On Etsy
// @description  Erank overlay with unified menu for configuration and range selection
// @version      1.6
// @author       Cengaver
// @namespace    https://github.com/cengaver
// @match        https://www.etsy.com/search*
// @match        https://www.etsy.com/shop/*
// @match        https://www.etsy.com/listing/*
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
                authorization: await GM.getValue('authorization', ''),
                erankKey: await GM.getValue('erankKey', ''),
                range: await GM.getValue('range', 'Liste!E:AD'),
            };

            const input = prompt(
                `Update Configuration:\n` +
                `Enter values in the format below (keep empty to retain current values):\n\n` +
                `Google Sheets API Key: ${currentConfig.apiKey}\n` +
                `Google Sheets Sheet ID: ${currentConfig.sheetId}\n` +
                `Authorization Token: ${currentConfig.authorization}\n` +
                `eRank API Key: ${currentConfig.erankKey}\n` +
                `Range (e.g., Liste!E:AD): ${currentConfig.range}\n\n` +
                `Format: apiKey|sheetId|authorization|erankKey|range`,
                `${currentConfig.apiKey}|${currentConfig.sheetId}|${currentConfig.authorization}|${currentConfig.erankKey}|${currentConfig.range}`
            );

            if (input) {
                const [apiKey, sheetId, authorization, erankKey, range] = input.split('|');
                if (apiKey) await GM.setValue('apiKey', apiKey.trim());
                if (sheetId) await GM.setValue('sheetId', sheetId.trim());
                if (authorization) await GM.setValue('authorization', authorization.trim());
                if (erankKey) await GM.setValue('erankKey', erankKey.trim());
                if (range) await GM.setValue('range', range.trim());

                alert("Configuration updated successfully.");
            } else {
                alert("No changes made.");
            }
        });
    };

    const getApiConfig = async () => {
        const apiKey = await GM.getValue('apiKey', '');
        const sheetId = await GM.getValue('sheetId', '');
        const authorization = await GM.getValue('authorization', '');
        const erankKey = await GM.getValue('erankKey', '');
        const range = await GM.getValue('range', 'Liste!E:AD');

        if (!apiKey || !sheetId || !authorization || !erankKey || !range) {
            alert("API Configurations are not set. Please configure it using the menu.");
            return null;
        }

        return { apiKey, sheetId, authorization, erankKey, range };
    };

    // Google Sheets ve eRank işlemleri için aynı kodları kullandım.
    const fetchColumnData = async (config) => {
        const { apiKey, sheetId, range } = config;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch Google Sheets data.");
            const data = await response.json();
            return data.values.map(row => ({
                id: row[row.length - 1],
                dnoValue: row[0],
            }));
        } catch (error) {
            console.error("Google Sheets API error:", error);
        }
    };

    const getErankData = async (id, authorization, erankKey) => {
        const cachedeData = await GM.getValue(`erank_${id}`, null);
        if (cachedeData) return cachedeData;

        const url = `https://beta.erank.com/api/ext/listing/${id}`;
        try {
            const { response } = await GM.xmlHttpRequest({
                url,
                headers: {
                    accept: "application/json, text/plain, */*",
                    authorization,
                    "x-erank-key": erankKey,
                    "x-user-agent": "erank-bx/1.0",
                },
                responseType: "json",
            });

            const erankData = {
                sales: response.data.stats.est_sales.label,
                age: response.data.stats.listing_age,
            };

            await GM.setValue(`erank_${id}`, erankData);
            return erankData;
        } catch (error) {
            console.error("eRank data fetch error:", error);
        }
    };

    const createOverlayOnElement = async (element, id, config) => {
        const { authorization, erankKey } = config;
        const overlay = document.createElement("div");
        overlay.className = "wt-display-flex-xs wt-text-title-01";
        overlay.style.gap = "1rem";
        element.appendChild(overlay);

        const loadingEl = document.createElement("div");
        loadingEl.textContent = "Erank verileri yükleniyor...";
        overlay.appendChild(loadingEl);

        const { sales, age } = await getErankData(id, authorization, erankKey);

        loadingEl.remove();

        const heartWrapper = document.createElement("div");
        heartWrapper.style.position = "relative";
        heartWrapper.style.display = "inline-block";

        const resultEl = document.createElement("div");
        resultEl.textContent = "❤️";
        resultEl.style.cursor = "pointer";
        resultEl.style.marginLeft = "5px";
        resultEl.style.fontSize = "1.5rem";
        resultEl.style.color = "red";

        heartWrapper.appendChild(resultEl);
        overlay.appendChild(heartWrapper);

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
        const config = await getApiConfig();
        if (!config) return;

        const urlParts = window.location.pathname.split('/');
        const id = urlParts[urlParts.indexOf('listing') + 1];
        const titleElement = document.querySelector('#listing-page-cart > div.wt-mb-xs-1 > h1');

        if (titleElement && id) {
            await createOverlayOnElement(titleElement, id, config);
        }
    };

    const initOverlay = async () => {
        const config = await getApiConfig();
        if (!config) return;

        const listingCards = document.querySelectorAll("[data-listing-id][data-listing-card-v2]");
        listingCards.forEach(async (el) => {
            const id = el.dataset.listingId;
            const infoEl = el.querySelector(".search-half-unit-mt") || el;
            await createOverlayOnElement(infoEl, id, config);
        });
    };

    window.addEventListener("load", () => {
        setApiConfigMenu();
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

    observeUrlChanges();
})();