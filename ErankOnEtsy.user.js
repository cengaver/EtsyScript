// ==UserScript==
// @name         Erank On Etsy
// @description  Erank overlay with unified menu for configuration and range selection. Sheet entegre
// @version      2.12
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
// @grant        GM_addStyle
// @connect      beta.erank.com
// @connect      sheets.googleapis.com
// @connect      erank.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ErankOnEtsy.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ErankOnEtsy.user.js
// ==/UserScript==

(async function () {
    "use strict";

    const team ="AA"
    const manager =""
    // Tüm ayarları topluca düzenleyecek menü
    GM_registerMenuCommand("Update API Configurations", async () => {
        const currentConfig = {
            apiKey: await GM.getValue('apiKey', ''),
            sheetId: await GM.getValue('sheetId', ''),
            erankUserKey: await GM.getValue('erankUserKey', ''),
            authorization: await GM.getValue('authorization', ''),
            erankKey: await GM.getValue('erankKey', ''),
            range: await GM.getValue('range', 'Liste!E:AD'),
            rangeLink: await GM.getValue('rangeLink', 'Liste!F:F'),
            privateKey: await GM.getValue('privateKey', ''),
            clientEmail: await GM.getValue('clientEmail', ''),
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
            `Range Link: ${currentConfig.rangeLink}\n\n` +
            //`PrivateKey : ${currentConfig.privateKey}\n\n` +
            //`ClientEmail: ${currentConfig.clientEmail}\n\n` +
            `Format: apiKey|sheetId|erankUserKeyauthorization|erankKey|range|rangeLink|privateKey|clientEmail`,
            `${currentConfig.apiKey}|${currentConfig.sheetId}|${currentConfig.erankUserKey}|${currentConfig.authorization}|${currentConfig.erankKey}|${currentConfig.range}|${currentConfig.rangeLink}|${currentConfig.privateKey}|${currentConfig.clientEmail}`
            );

        if (input) {
            const [apiKey, sheetId, erankUserKey, authorization, erankKey, range, rangeLink, privateKey, clientEmail] = input.split('|');
            if (apiKey) await GM.setValue('apiKey', apiKey.trim());
            if (sheetId) await GM.setValue('sheetId', sheetId.trim());
            if (erankUserKey) await GM.setValue('erankUserKey', erankUserKey.trim());
            if (authorization) await GM.setValue('authorization', authorization.trim());
            if (erankKey) await GM.setValue('erankKey', erankKey.trim());
            if (range) await GM.setValue('range', range.trim());
            if (rangeLink) await GM.setValue('rangeLink', rangeLink.trim());
            if (privateKey) await GM.setValue('privateKey', privateKey.trim());
            if (clientEmail) await GM.setValue('clientEmail', clientEmail.trim());
            alert("Configuration updated successfully.");
        } else {
            alert("No changes made.");
        }
    });

    const getApiConfig = async () => {
        const apiKey = await GM.getValue('apiKey', '');
        const sheetId = await GM.getValue('sheetId', '');
        const erankUserKey = await GM.getValue('erankUserKey', '');
        const authorization = await GM.getValue('authorization', '');
        const erankKey = await GM.getValue('erankKey', '');
        const range = await GM.getValue('range', 'Liste!E:AD');
        const rangeLink = await GM.getValue('rangeLink', 'Liste!F:F');
        const privateKey = await GM.getValue('privateKey', '');
        const clientEmail = await GM.getValue('clientEmail', '');

        if (!apiKey || !sheetId || !erankUserKey|| !authorization || !erankKey || !range || !rangeLink || !privateKey || !clientEmail) {
            alert("API Configurations are not set. Please configure it using the menu.");
            return null;
        }

        return { apiKey, sheetId, erankUserKey, authorization, erankKey, range, rangeLink, privateKey, clientEmail };
    };

    //let ids = JSON.parse(localStorage.getItem('cachedData')) || null;
    const config = await getApiConfig();
    if (!config) return;
    const { apiKey, sheetId, erankUserKey, authorization, erankKey, range, rangeLink, privateKey, clientEmail } = config;
    const tokenUri = "https://oauth2.googleapis.com/token";

    // Step 1: Generate JWT Token
    async function createJwtToken(clientEmail, privateKey) {
        const header = {
            alg: "RS256",
            typ: "JWT",
        };

        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iss: clientEmail,
            scope: "https://www.googleapis.com/auth/spreadsheets", // Adjust scope as needed
            aud: tokenUri,
            exp: now + 3600, // 1 hour expiration
            iat: now,
        };

        // Function to base64 encode JSON strings
        function base64Encode(obj) {
            return btoa(JSON.stringify(obj))
                .replace(/=/g, "")
                .replace(/\+/g, "-")
                .replace(/\//g, "_");
        }

        const encodedHeader = base64Encode(header);
        const encodedPayload = base64Encode(payload);

        // Sign the token using the private key
        const toSign = `${encodedHeader}.${encodedPayload}`;
        const signature = await signWithPrivateKey(toSign, privateKey);

        return `${toSign}.${signature}`;
    }

    // Helper: Sign the JWT using the private key (RS256)
    async function signWithPrivateKey(data, privateKey) {
        const crypto = window.crypto.subtle || window.crypto.webkitSubtle;

        // Convert private key into a format compatible with Web Crypto API
        const importKeyPromise = crypto.importKey(
            "pkcs8",
            pemToArrayBuffer(privateKey),
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            false,
            ["sign"]
        );

        return await importKeyPromise
            .then((key) => crypto.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(data)))
            .then((signature) => btoa(String.fromCharCode(...new Uint8Array(signature)))
                  .replace(/=/g, "")
                  .replace(/\+/g, "-")
                  .replace(/\//g, "_"));
    }

    // Helper: Convert PEM private key to ArrayBuffer
    function pemToArrayBuffer(pem) {
        const base64 = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, "")
        .replace(/-----END PRIVATE KEY-----/, "")
        .replace(/\n/g, "");
        //console.log(base64);
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Step 2: Exchange JWT for OAuth Access Token
    async function getAccessToken() {
        let AccToken = JSON.parse(sessionStorage.getItem('AccessToken')) || null;
        if(AccToken){
            return AccToken
        }
        const jwt = await createJwtToken(clientEmail, privateKey);

        const response = await fetch(tokenUri, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: jwt,
            }),
        });

        const data = await response.json();
        sessionStorage.setItem('AccessToken', JSON.stringify(data.access_token));
        return data.access_token;
    }

    // Google Sheets'e link ekle
    async function saveToGoogleSheet(link, title, img, sales, age, tag) {
        //const rangeLink = "Liste!F:F"; // Eklenecek sütun
        const accessToken = await getAccessToken();
        const tags = tag.join(", ");
        // 1. Mevcut son dolu satırı bul
        let linkAlreadyExists = false;
        let lastRow = 0;
        await GM.xmlHttpRequest({
            method: "GET",
            url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${rangeLink}?majorDimension=COLUMNS`,
            headers: {
                "Authorization": `Bearer ${accessToken}`
            },
            onload: function(response) {
                if (response.status === 200) {
                    const data = JSON.parse(response.responseText);
                    if (data.values && data.values[0]) {
                        // Mevcut linklerle karşılaştır
                        if (data.values[0].includes(link)) {
                            linkAlreadyExists = true; // Link zaten mevcut
                        }
                    }
                    if (data.values && data.values.length > 0) {
                        lastRow = data.values[0].length; // En son dolu satır sayısını al
                    }
                } else {
                    console.error("Veri alınırken hata oluştu:", response.responseText);
                }
            },
            onerror: function(error) {
                console.error("GET isteği hatası:", error);
            }
        });

        // Eğer link zaten varsa, işlem yapılmasın ve uyarı verilsin
        if (linkAlreadyExists) {
            alert("Bu link zaten eklenmiş.");
            return; // İşlem sonlanır, link eklenmez
        }

        // 2. Linki en son satırın altına ekle
        const newRow = lastRow + 1;
        const body = {
            range: `Liste!F${newRow}:P${newRow}`,
            majorDimension: "ROWS",
            values: [
                [
                    link,
                    img,
                    title,
                    "",
                    team,
                    manager,
                    tags,
                    "",
                    "",
                    Number(sales),// sales'i sayı olarak gönder
                    Number(age) // age'i sayı olarak gönder
                ]
            ]
        };


        await GM.xmlHttpRequest({
            method: "PUT",
            url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${body.range}?valueInputOption=RAW`,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            data: JSON.stringify(body),
            onload: function(response) {
                if (response.status === 200 || response.status === 201) {
                    console.log("Başarıyla eklendi:", link);

                    // 3. J ve K sütunlarına "SL" ve "AL" ekle
                    /*const body2 = {
                        range: `Liste!J${newRow}:P${newRow}`,
                        majorDimension: "ROWS",
                        values: [["Selim", "", "", "", "", "", ""]] // J sütununa "SL", K sütununa "AL"
                    };

                    GM.xmlHttpRequest({
                        method: "PUT",
                        url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${body2.range}?valueInputOption=RAW`,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${accessToken}`
                        },
                        data: JSON.stringify(body2),
                        onload: function(response2) {
                            if (response2.status === 200 || response2.status === 201) {
                                console.log("SL ve AL başarıyla eklendi.");
                            } else {
                                console.error("SL ve AL ekleme hatası:", response2.responseText);
                            }
                        },
                        onerror: function(error) {
                            console.error("J ve K sütunlarına yazma hatası:", error);
                        }
                    });*/

                } else {
                    console.error("Ekleme hatası:", response.responseText);
                }
            },
            onerror: function(error) {
                console.error("PUT isteği hatası:", error);
            }
        });
    }

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
        if (cachedData) { localStorage.removeItem(cacheKey) }

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

        if (
            cachedData &&
            now - parseInt(cachedData.timestamp) < 24 * 60 * 60 * 1000 &&
            "tags" in cachedData &&
            "title" in cachedData
        ) {
            return cachedData;
        }
        if (cachedData) { localStorage.removeItem(cacheKey) }

        const config = await getApiConfig();
        if (!config) return;

        const { erankUserKey, authorization, erankKey } = config;
        const url = `https://beta.erank.com/api/ext/listing/${id}`;

        try {
            const headers = {
                accept: "application/json, text/plain, */*",
                authorization: `${erankUserKey}|${authorization}`,
                "x-erank-key": erankKey,
                "x-user-agent": "erank-bx/1.0",
            }

            const { response } = await GM.xmlHttpRequest({
                url,
                headers,
                responseType: "json",
            });

            const erankData = {
                sales: response.data.stats.est_sales.label,
                age: response.data.stats.listing_age,
                title : response.data.title,
                timestamp : now.toString(),
                tags: Object.keys(response.data.tags)
            };

            localStorage.setItem(cacheKey, JSON.stringify(erankData));
            return erankData;
        } catch (error) {
            console.error("eRank data fetch error:", error);
        }
    };

    function simplifyEtsyUrl(url) {
        try {
            let urlObj = new URL(url);
            let pathParts = urlObj.pathname.split('/');
            if (pathParts.length > 3) {
                return `https://www.etsy.com/listing/${pathParts[2]}/${pathParts[3]}`;
            }
            return url; // Eğer format beklenmedikse orijinal URL'yi döndür
        } catch (error) {
            console.error('Geçersiz URL:', error);
            return null;
        }
    }

    const keywords = ['Sweatshirt', 'Tshirt', 'Shirt', 'Hoodie', 'Png'];

    function extractFirstParts(text, keywords) {
        for (let keyword of keywords) {
            const position = text.indexOf(keyword);
            if (position !== -1) {
                return text.substring(0, position).trim(); // İlk bulunan anahtar kelimeden önceki kısmı al
            }
        }
        return null; // Hiçbir anahtar kelime bulunmazsa
    }

    const createOverlayOnElement = async (element, id) => {
        const overlay = document.createElement("div");
        overlay.className = "wt-display-flex-xs wt-text-title-01";
        overlay.style.gap = "1rem";
        overlay.style.cursor = "alias";
        element.appendChild(overlay);

        const loadingEl = document.createElement("div");
        loadingEl.textContent = "Erank verileri yükleniyor...";
        overlay.appendChild(loadingEl);

        const { sales, age, title, tags } = await getErankData(id);
        // Etsy ürün linkini al
        const linkEl = element.querySelector("a.listing-link")
        const url = linkEl?.href ?? window.location.href
        const currentUrl = simplifyEtsyUrl(url);//**
        const imgEl = element.querySelector("img")
        const img = imgEl ? imgEl.src : null;
        //console.log(img)
        const dnoValue = findEValueById(id) || ""; // Eğer değer bulunmazsa boş string
        const result = dnoValue ? "❤️" : "🤍";
        const tooltipText = dnoValue ? `Dizayn NO: ${dnoValue}` : `Listeye EKLE!`;

        loadingEl.remove();

        // Kalp sarmalayıcı
        const heartWrapper = document.createElement("div");
        heartWrapper.style.position = "relative"; // Konumlandırma için relative
        heartWrapper.style.display = "inline-block";

        // Kalp elementi
        const resultEl = document.createElement("div");
        resultEl.textContent = result;
        resultEl.title = tooltipText;
        resultEl.style.marginLeft = "5px";
        resultEl.style.fontSize = "1.5rem";
        resultEl.style.color = dnoValue ? "red" : "black";

        if (!dnoValue) {
            resultEl.style.cursor = "cell";
            resultEl.href = "#";
            heartWrapper.addEventListener("click", async function() {
                resultEl.style.backgroundColor = "orange"
                await saveToGoogleSheet(currentUrl, title, img, sales, age, tags);
                resultEl.textContent = "❤️"
                resultEl.style.backgroundColor = null
            });
        }else{
            // Rozet elementi (sadece değer varsa ekle)
            const badgeEl = document.createElement("span");
            badgeEl.textContent = dnoValue;
            badgeEl.style.position = "absolute";
            badgeEl.style.top = "-4px"; // Daha yukarı taşı
            badgeEl.style.left = "-19px"; // Daha sağa taşı
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

        function copyTextToClipboard(text) {
            navigator.clipboard.writeText(text).then(function() {
                console.log('Text successfully copied to clipboard!');
            }).catch(function(error) {
                console.error('Unable to copy text to clipboard', error);
            });
        }


        const buttonEl = document.createElement("button")
        buttonEl.textContent = "S"
        buttonEl.title = "Tag copy erank"
        buttonEl.style = "cursor: grab"
        buttonEl.onclick = () => copyTextToClipboard(tags.join(", "))
        overlay.appendChild(buttonEl);
        let trade = extractFirstParts(title, keywords)
        if (trade) {
            const buttonElTrade = document.createElement("button")
            buttonElTrade.title = "Trade Mark Kontrol et"
            buttonElTrade.style = "cursor: help"
            buttonElTrade.textContent = "T"
            buttonElTrade.onclick = () => window.open(`https://www.trademarkia.com/search/trademarks?q=${trade}&country=us&codes=025&status=registered`, '_blank')
            overlay.appendChild(buttonElTrade);
        }
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
            const infoEl = el.querySelector(".streamline-spacing-pricing-info streamline-spacing-reduce-margin") || el;
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
