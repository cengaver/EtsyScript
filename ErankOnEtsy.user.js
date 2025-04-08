// ==UserScript==
// @name         Etsy on Erank
// @description  Erank overlay with unified menu for configuration and range selection. Sheet entegre
// @version      3.22
// @author       Cengaver
// @namespace    https://github.com/cengaver
// @match        https://www.etsy.com/search*
// @match        https://www.etsy.com/market/*
// @match        https://www.etsy.com/shop/*
// @match        https://www.etsy.com/listing/*
// @match        https://www.etsy.com/people/*
// @match        https://www.etsy.com/c/*
// @match        https://ehunt.ai/product-detail/*
// @match        https://ehunt.ai/etsy-product-research*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.xmlHttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addElement
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @connect      beta.erank.com
// @connect      ehunt.ai
// @connect      sheets.googleapis.com
// @connect      erank.com
// @connect      script.google.com
// @connect      developer.uspto.gov
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ErankOnEtsy.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ErankOnEtsy.user.js
// ==/UserScript==

(async function () {
    "use strict";

    GM_addStyle(`
        .toast-error {
           visibility: hidden;
           min-width: 250px;
           background-color: #ff0000;
           color: white;
           text-align: center;
           border-radius: 5px;
           padding: 16px;
           position: fixed;
           z-index: 1001;
           bottom: 100px;
           right: 30px;
           font-size: 14px;
           opacity: 0;
           transition: opacity 0.5s, visibility 0.5s;
       }
       .toast {
           visibility: hidden;
           min-width: 250px;
           background-color: #4CAF50;
           color: white;
           text-align: center;
           border-radius: 5px;
           padding: 16px;
           position: fixed;
           z-index: 1001;
           bottom: 100px;
           right: 30px;
           font-size: 14px;
           opacity: 0;
           transition: opacity 0.5s, visibility 0.5s;
       }
       .toast-error.show {
           visibility: visible;
           opacity: 1;
       }
       .toast.show {
           visibility: visible;
           opacity: 1;
       }`);


    function showToast(message, type = null) {
        const toast = window.document.createElement('div');
        if (type == 'error') {
            toast.className = 'toast-error';
        } else {
            toast.className = 'toast';
        }
        toast.innerText = message;
        window.document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // Config yapısı
    const DEFAULT_CONFIG = {
            apiKeyUspto: "",
            sheetId: "",
            sheetId2: "",
            erankUserKey: "",
            authorization:"",
            erankKey: "",
            range:"",
            rangeLink: "",
            privateKey:"",
            clientEmail: "",
            team: "",
            manager: "",
    };

    // Global değişkenler
    let config = {...DEFAULT_CONFIG};

    // Config yönetimi
    async function loadConfig() {
        const currentConfig = {
            apiKeyUspto: await GM.getValue('apiKeyUspto', ''),
            sheetId: await GM.getValue('sheetId', ''),
            sheetId2: await GM.getValue('sheetId2', ''),
            erankUserKey: await GM.getValue('erankUserKey', ''),
            authorization: await GM.getValue('authorization', ''),
            erankKey: await GM.getValue('erankKey', ''),
            range: await GM.getValue('range', ''),
            rangeLink: await GM.getValue('rangeLink', ''),
            privateKey: await GM.getValue('privateKey', ''),
            clientEmail: await GM.getValue('clientEmail', ''),
            team: await GM.getValue('team', ''),
            manager: await GM.getValue('manager', ''),
        };

        if (currentConfig) {
            config = {...DEFAULT_CONFIG, ...currentConfig};
        }
    }

    async function saveConfig() {
        if (config.apiKeyUspto) await GM.setValue('apiKeyUspto', config.apiKeyUspto.trim());
        if (config.sheetId) await GM.setValue('sheetId', config.sheetId.trim());
        if (config.sheetId2) await GM.setValue('sheetId2', config.sheetId2.trim());
        if (config.erankUserKey) await GM.setValue('erankUserKey', config.erankUserKey.trim());
        if (config.authorization) await GM.setValue('authorization', config.authorization.trim());
        if (config.erankKey) await GM.setValue('erankKey', config.erankKey.trim());
        if (config.range) await GM.setValue('range', config.range.trim());
        if (config.rangeLink) await GM.setValue('rangeLink', config.rangeLink.trim());
        if (config.privateKey) await GM.setValue('privateKey', config.privateKey.trim());
        if (config.clientEmail) await GM.setValue('clientEmail', config.clientEmail.trim());
        if (config.team) await GM.setValue('team', config.team.trim());
        if (config.manager) await GM.setValue('manager', config.manager.trim());
    }

    async function isConfigured() {
        return config.erankUserKey && config.erankKey && config.authorization
    }

    async function validateConfig() {
        if (!config.clientEmail || !config.privateKey) {
            showToast('Google Service Account credentials missing', 'error');
            return false;
        }
        return true;
    }

// Then call this before attempting to create JWT
    async function showConfigMenu() {
        GM_registerMenuCommand('⚙️ Ayarlar', function() {
            const html = `
                <div style="padding:20px;font-family:Arial,sans-serif;max-width:500px;">
                    <h2 style="margin-top:0;">Ayarlar</h2>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">apiKeyUspto</label>
                        <input type="text" id="apiKeyUspto" value="${config.apiKeyUspto}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">sheetId</label>
                        <input type="text" id="sheetId" value="${config.sheetId}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">sheetId2</label>
                        <input type="text" id="sheetId2" value="${config.sheetId2}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">erankUserKey</label>
                        <input type="text" id="erankUserKey" value="${config.erankUserKey}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">authorization</label>
                        <input type="text" id="authorization" value="${config.authorization}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">erankKey</label>
                        <input type="text" id="erankKey" value="${config.erankKey}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">range</label>
                        <input type="text" id="range" value="${config.range}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">rangeLink</label>
                        <input type="text" id="rangeLink" value="${config.rangeLink}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">privateKey</label>
                        <input type="text" id="privateKey" value="${config.privateKey}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">clientEmail</label>
                        <input type="text" id="clientEmail" value="${config.clientEmail}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">team</label>
                        <input type="text" id="team" value="${config.team}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">manager</label>
                        <input type="text" id="manager" value="${config.manager}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <button id="saveConfigBtn" style="padding:10px 15px;background:#4285f4;color:white;border:none;border-radius:4px;cursor:pointer;">Kaydet</button>
                </div>
            `;

            const win = window.open("", "ErankConfig", "width=600,height=600");
            win.document.body.innerHTML = html;

            win.document.getElementById('saveConfigBtn').addEventListener('click', function() {
                config.apiKeyUspto = win.document.getElementById('apiKeyUspto').value;
                config.sheetId = win.document.getElementById('sheetId').value;
                config.sheetId2 = win.document.getElementById('sheetId2').value;
                config.erankUserKey = win.document.getElementById('erankUserKey').value;
                config.authorization = win.document.getElementById('authorization').value;
                config.erankKey = win.document.getElementById('erankKey').value;
                config.range = win.document.getElementById('range').value;
                config.rangeLink = win.document.getElementById('rangeLink').value;
                config.privateKey = win.document.getElementById('privateKey').value;
                config.clientEmail = win.document.getElementById('clientEmail').value;
                config.team = win.document.getElementById('team').value;
                config.manager = win.document.getElementById('manager').value;
                saveConfig();
                win.alert("Ayarlar kaydedildi! Sayfayı yenileyin.");
                win.close();
            });
        });
    }

    function observeElements(selector, callback, document) {
        const observedElements = new WeakSet();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.matches(selector) && !observedElements.has(node)) {
                            observedElements.add(node);
                            callback(node);
                        }
                        node.querySelectorAll(selector).forEach((child) => {
                            if (!observedElements.has(child)) {
                                observedElements.add(child);
                                callback(child);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        document.querySelectorAll(selector).forEach((element) => {
            if (!observedElements.has(element)) {
                observedElements.add(element);
                callback(element);
            }
        });
    }

    async function doTheThing(window) {
        const document = null; // use window.document instead!
        const location = null; // use window.location instead!
        const tokenUri = "https://oauth2.googleapis.com/token";


        async function createJwtToken() {
            try {
                const header = {
                    alg: "RS256",
                    typ: "JWT",
                };

                const now = Math.floor(Date.now() / 1000);
                const payload = {
                    iss: config.clientEmail,
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
                const signature = await signWithPrivateKey(toSign);
                return `${toSign}.${signature}`;
            } catch (error) {
                console.error('JWT creation failed:', error);
                return null;
            }
        }

        async function signWithPrivateKey(data) {
            try {
                const crypto = window.crypto.subtle || window.crypto.webkitSubtle;

                // Clean and prepare the private key
                const pemContents = config.privateKey
                .replace(/-----BEGIN PRIVATE KEY-----/, '')
                .replace(/-----END PRIVATE KEY-----/, '')
                .replace(/\s+/g, '');

                // Convert from Base64 to ArrayBuffer
                const binaryString = atob(pemContents);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                // Import the key
                const key = await crypto.importKey(
                    'pkcs8',
                    bytes.buffer,
                    { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
                    false,
                    ['sign']
                );

                // Sign the data
                const signature = await crypto.sign(
                    'RSASSA-PKCS1-v1_5',
                    key,
                    new TextEncoder().encode(data)
                );

                // Convert signature to Base64URL
                return btoa(String.fromCharCode(...new Uint8Array(signature)))
                    .replace(/=/g, '')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_');
            } catch (error) {
                console.error('Error in signWithPrivateKey:', error);
                showToast('JWT signing failed. Check private key format.', 'error');
                throw error; // Re-throw to be caught by caller
            }
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
        async function getAccessToken(e) {
            let AccToken = JSON.parse(sessionStorage.getItem('AccessToken')) || null;
            if (AccToken) {
                return AccToken
            }
            const jwt = await createJwtToken();
            if (!jwt) {
                showToast('Failed to create JWT token', 'error');
                return null;
            }
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

        function convertToNumber(age) {
            // Virgülü kaldırıp noktaya çeviriyoruz
            let cleanedAge = age.replace(',', '');
            // Number ile dönüştürüyoruz
            let numericAge = Number(cleanedAge);

            // Sayı değilse bir hata mesajı verebiliriz
            if (isNaN(numericAge)) {
                console.error("Geçerli bir sayı değil:", age);
                return null;
            }

            return numericAge;
        }

        // Google Sheets'e link ekle
        async function saveToGoogleSheet(sheet, link, title, img, sales, age, tag) {
            const accessToken = await getAccessToken();
            const tags = tag.join(", ");
            // 1. Mevcut son dolu satırı bul
            let linkAlreadyExists = false;
            let lastRow = 0;
            await GM.xmlHttpRequest({
                method: "GET",
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${config.rangeLink}?majorDimension=COLUMNS`,
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                },
                onload: function (response) {
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
                        sessionStorage.removeItem('AccessToken');
                        console.error("Veri alınırken hata oluştu:", response.responseText);
                        showToast('Veri alınırken hata oluştu', 'error');
                    }
                },
                onerror: function (error) {
                    sessionStorage.removeItem('AccessToken');
                    console.error("GET isteği hatası:", error);
                    showToast("GET isteği hatası", 'error');
                }
            });

            // Eğer link zaten varsa, işlem yapılmasın ve uyarı verilsin
            if (linkAlreadyExists) {
                showToast(title + '\n zaten var!', 'error');
                //alert("Bu link zaten eklenmiş.");
                return; // İşlem sonlanır, link eklenmez
            }
            // 2. Linki en son satırın altına ekle
            const newRow = lastRow + 1;

            let body;

            if (config.rangeLink == "Liste!D:D") {
                body = {
                    range: `Liste!D${newRow}:J${newRow}`,
                    majorDimension: "ROWS",
                    values: [
                        [
                            link,
                            img,
                            title,
                            null,
                            tags,
                            sales,
                            age
                        ]
                    ]
                };
            } else {
                body = {
                    range: `Liste!F${newRow}:P${newRow}`,
                    majorDimension: "ROWS",
                    values: [
                        [
                            link,
                            img,
                            title,
                            null,
                            config.team,
                            config.manager,
                            tags,
                            null,
                            null,
                            sales,
                            age
                        ]
                    ]
                };
            }

            await GM.xmlHttpRequest({
                method: "PUT",
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${body.range}?valueInputOption=RAW`,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                data: JSON.stringify(body),
                onload: function (response) {
                    if (response.status === 200 || response.status === 201) {
                        showToast(title + '\n Başarıyla eklendi!');
                        console.log("Başarıyla eklendi:", link);
                        console.log("Başarıyla resim eklendi:", img);
                    } else {
                        console.error("Ekleme hatası:", response.responseText);
                    }
                },
                onerror: function (error) {
                    console.error("PUT isteği hatası:", error);
                }
            });
        }

        // Google Sheets ve eRank işlemleri için aynı kodları kullandım.
        const fetchColumnData = async (sID = null) => {
            if (!config) return;
            let cacheKey;
            let sheet;
            if (sID && config.sheetId2) {
                cacheKey = 'cachedData2';
                sheet = config.sheetId2;
            } else {
                cacheKey = 'cachedData';
                sheet = config.sheetId;
            }
            const cacheTimestampKey = `${cacheKey}_timestamp`;
            const now = Date.now();
            //console.log("cacheKeyFetch",cacheKey);
            const cachedData = JSON.parse(localStorage.getItem(cacheKey));
            const cacheTimestamp = localStorage.getItem(cacheTimestampKey);

            if (cachedData && cacheTimestamp && now - parseInt(cacheTimestamp) < 1 * 60 * 60 * 1000) {
                return cachedData;
            }
            if (cachedData) { localStorage.removeItem(cacheKey) }

            const accessToken = await getAccessToken();

            await GM.xmlHttpRequest({
                method: "GET",
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values/${config.range}`,
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                },
                onload: function (response) {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        const processedData = data.values
                        .filter(row => row[0] != null && row[0] !== '') // row[0] boş değilse devam et
                        .map(row => ({
                            id: row[row.length - 1], // AD sütunu (son sütun)
                            dnoValue: row[0], // E sütunu (ilk sütun)
                            gDrive: row[row.length - 3], // AB gDrive serach
                            team: row[5], // J sütunu
                        }));
                        localStorage.setItem(cacheKey, JSON.stringify(processedData));
                        localStorage.setItem(cacheTimestampKey, now.toString());
                        return { processedData };
                    } else {
                        //console.error("Veri alınırken hata oluştu:", response.responseText);
                    }
                },
                onerror: function (error) {
                    console.error("GET isteği hatası:", error);
                }
            });
        };

        const findEValueById = (id, sID = null) => {
            let cacheKey;
            if (sID) {
                cacheKey = 'cachedData2';
            } else {
                cacheKey = 'cachedData';
            }
            //console.log("cacheKeyFind",cacheKey);
            const cachedData = JSON.parse(localStorage.getItem(cacheKey)) || [];
            const match = cachedData.find(row => row.id === id);
            const dnoValue = match ? match.dnoValue : null;
            const gDrive = match ? match.gDrive : null;
            const teamname = match ? match.team : null;
            return { dnoValue, gDrive, teamname };
        };

        const getErankData = async (id,imgUrl=null,link=null) => {
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
            if (!config) return;
            const url = `https://beta.erank.com/api/ext/listing/${id}`;

            try {
                const headers = {
                    accept: "application/json, text/plain, */*",
                    authorization: `${config.erankUserKey}|${config.authorization}`,
                    "x-erank-key": config.erankKey,
                    "x-user-agent": "erank-bx/1.0",
                }

                const { response } = await GM.xmlHttpRequest({
                    url,
                    headers,
                    responseType: "json",
                });

                if (response.error) {
                    console.error("eRank API error:", response.error.code, response.error.message);
                    return {
                        error: response.error.code == 404 ? "Not found" : "Error",
                    }
                }
                const age = convertToNumber(response.data.stats.listing_age);
                const sales = convertToNumber(response.data.stats.est_sales.label);
                const erankData = {
                    sales: sales,
                    age: age,
                    title: response.data.title,
                    timestamp: now.toString(),
                    tags: Object.keys(response.data.tags)
                };
                const erankLogData = {
                    id: id,
                    link: link,
                    img: imgUrl,
                    title: response.data.title,
                    tag: Object.keys(response.data.tags),
                    sls: sales,
                    day: age,
                    quantity: convertToNumber(response.data.stats.quantity),
                    views: convertToNumber(response.data.stats.views),
                    favorers: convertToNumber(response.data.stats.favorers),
                    est_conversion_rate: response.data.stats.est_conversion_rate.value
                };
                safeSetItem(cacheKey, JSON.stringify(erankData));
                if ((age >= 1 && age <= 50) && ( sales / 1.5 > age) ){
                    //console.log("age",age);
                    //console.log("sales",age);
                    logToGoogleSheets(erankLogData);
                }
                //console.log(erankLogData);
                //localStorage.setItem(cacheKey, JSON.stringify(erankData));
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
                console.error('format beklenmedik', url);
                return url; // Eğer format beklenmedikse orijinal URL'yi döndür
            } catch (error) {
                console.error('Geçersiz URL:', error);
                return null;
            }
        }

        function handleLocalStorageQuota() {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('erank')) {
                    localStorage.removeItem(key);
                    i--; // Silme sonrası indeks kaymasını önlemek için azalt
                }
            }
            showToast("LocalStorage doldu, 'erank' ile başlayan tüm anahtarlar silindi.", 'error');
            console.log("LocalStorage doldu, 'erank' ile başlayan tüm anahtarlar silindi.");
        }

        function safeSetItem(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    console.warn("LocalStorage dolu! 'erank' anahtarlarını temizliyorum...");
                    handleLocalStorageQuota();
                    try {
                        localStorage.setItem(key, value); // Tekrar dene
                    } catch (error) {
                        console.error("Yeterli alan açılamadı. LocalStorage işlemi başarısız.", error);
                    }
                } else {
                    console.error("LocalStorage hatası:", e);
                }
            }
        }

        function extractFirstParts(text) {
            const keywords = ['Sweatshirt', 'T Shirt', 'T-Shirt', 'Tshirt', 'Shirt', 'Hoodie', 'Png', 'Svg', 'Tee','DTF'].map(k => k.toLowerCase());
            const lowerText = text.toLowerCase();
            let minPosition = Infinity;
            let closestKeyword = '';

            for (let keyword of keywords) {
                const position = lowerText.indexOf(keyword);
                if (position !== -1 && position < minPosition) {
                    minPosition = position;
                    closestKeyword = keyword;
                }
            }

            let result = closestKeyword !== ''
            ? lowerText.substring(0, minPosition).trim().replace(/comfort colors /i, "")
            : lowerText;

            return result
                .replace("&#39;", "'")
                .replace(/'/g, "'")
                .replace(/\b\w/g, char => char.toUpperCase())
        }

        async function checkTrademark(term) {
            const classCode = '025'; // Filtrelenecek sınıf kodu
            const url = `https://developer.uspto.gov/trademark/v1/trademarks?searchText=${encodeURIComponent(term)}&fields=markIdentification,goodsAndServicesClassification`;

            try {
                const response = await fetch(url, {
                    headers: {
                        'X-Api-Key': config.apiKeyUspto, // API anahtarını header'a ekleyin
                    },
                });

                // Yanıtı kontrol et
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
                }

                const data = await response.json();

                // Sınıf kodu ile filtreleme
                const filteredResults = data.results.filter(result => {
                    // goodsAndServicesClassification alanını kontrol et
                    return result.goodsAndServicesClassification && result.goodsAndServicesClassification.includes(classCode);
                });

                if (filteredResults.length > 0) {
                    console.log(`'${term}' kelimesi 025 sınıfında zaten kayıtlı.`);
                    console.log(filteredResults);
                } else {
                    console.log(`'${term}' kelimesi 025 sınıfında kayıtlı değil.`);
                }
            } catch (error) {
                console.error('Hata oluştu:', error);
            }
        }

        function logToGoogleSheets(data) {
            let sheetUrl = "https://script.google.com/macros/s/AKfycbxuh_lJRDY4ZCVY3js2JVlIdusGmb3RtDd4IlH82hisewmwR13PUogxW9pUuX8h0C-e/exec"; // Buraya Apps Script'in Web URL'sini yapıştır
            fetch(sheetUrl, {
                method: "POST",
                mode: 'no-cors', // CORS engelini devre dışı bırakır ama yanıt okunamaz
                body: JSON.stringify({
                    id:data.id,
                    link:data.link,
                    img:data.img,
                    title:data.title,
                    tag:data.tag,
                    sls:data.sls,
                    day:data.day,
                    quantity:data.quantity,
                    views:data.views,
                    favorers:data.favorers,
                    est_conversion_rate:data.est_conversion_rate,
                    team:config.team
                }),
                headers: { "Content-Type": "application/json" }
            })
                .then(response => response.text())
                .then(result => console.log("Log kaydedildi:", result))
                .catch(error => console.error("Log hatası:", error));
        }

        const createOverlayOnElement = async ({
            element,
            id,
            imgUrl = null,
            url = null,
        }) => {
            //console.log("Creating overlay on", element);
            //console.log("Creating overlay id : ", id);
            const overlay = window.document.createElement("div");
            overlay.style.display = "flex";
            overlay.style.gap = "0.5rem";
            overlay.style.cursor = "alias";
            overlay.style.color = "black";
            overlay.style.padding = "1px";
            element.appendChild(overlay);

            const loadingEl = window.document.createElement("div");
            loadingEl.textContent = "Erank verileri yükleniyor...";
            overlay.appendChild(loadingEl);

            // Etsy ürün linkini al
            url ??= element.querySelector("a.listing-link")?.href ?? window.location.href
            const currentUrl = simplifyEtsyUrl(url);//**
            const img = imgUrl ?? element.querySelector("img")?.src;

            const erankData = await getErankData(id,img,currentUrl);
            if (erankData.error) {
                if (erankData.error === "Not found") {
                    loadingEl.textContent = "Erank verileri bulunamadı.";
                } else {
                    loadingEl.textContent = "Erank'a giriş yapın.";
                }
                return
            }

            const { sales, age, title, tags } = erankData;

            //console.log(img)
            let { dnoValue, gDrive, teamname } = findEValueById(id) || ""; // Eğer değer bulunmazsa boş string
            const result = dnoValue ? "❤️" : "🤍";
            const tooltipText = dnoValue ? `Dizayn NO: ${dnoValue} by ${teamname}` : `Listeye EKLE!`;

            loadingEl.remove();

            // Kalp sarmalayıcı
            const heartWrapper = window.document.createElement("div");
            heartWrapper.style.position = "relative"; // Konumlandırma için relative
            heartWrapper.style.display = "inline-block";

            // Kalp elementi
            const resultEl = window.document.createElement("div");
            resultEl.textContent = result;
            resultEl.title = tooltipText;
            resultEl.style.marginLeft = "1px";
            resultEl.style.fontSize = "1.6rem";
            resultEl.style.color = dnoValue ? "red" : "black";

            if (!dnoValue) {
                resultEl.style.cursor = "cell";
                resultEl.href = "#";
                heartWrapper.addEventListener("click", async function () {
                    resultEl.style.backgroundColor = "orange"
                    await saveToGoogleSheet(config.sheetId, currentUrl, title, img, sales, age, tags);
                    resultEl.textContent = "❤️"
                    resultEl.style.backgroundColor = null
                    showToast(title + '\n listeye eklendi!');
                });
            } else {
                if (gDrive) {
                    heartWrapper.addEventListener("click", async function () {
                        window.open(gDrive, "_blank");
                    });
                }
                // Rozet elementi (sadece değer varsa ekle)
                const badgeEl = window.document.createElement("span");
                resultEl.style.cursor = "hand";
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
            const salesEl = window.document.createElement("div");
            salesEl.textContent = `Satış: ${sales}`;
            if (Number(sales) / 1.5 > Number(age)) salesEl.style.backgroundColor = "green";
            overlay.appendChild(salesEl);

            const ageEl = window.document.createElement("div");
            ageEl.textContent = `Yaş: ${age}`;
            if (age >= 1 && age <= 50) ageEl.style.backgroundColor = "#73C476";
            else if (age >= 51 && age <= 100) ageEl.style.backgroundColor = "#C5E1A5";
            else if (age >= 101 && age <= 300) ageEl.style.backgroundColor = "#FFD54F";
            else if (age >= 301 && age <= 7000) ageEl.style.backgroundColor = "#EF9A9A";
            overlay.appendChild(ageEl);

            function copyTextToClipboard(text) {
                navigator.clipboard.writeText(text).then(function () {
                    showToast('Text successfully copied to clipboard!');
                    console.log('Text successfully copied to clipboard!');
                }).catch(function (error) {
                    console.error('Unable to copy text to clipboard', error);
                });
            }


            const buttonEl = window.document.createElement("button")
            buttonEl.textContent = "S"
            buttonEl.title = "Tag copy erank"
            buttonEl.style = "cursor: grab"
            buttonEl.onclick = () => copyTextToClipboard(tags.join(", "))
            overlay.appendChild(buttonEl);
            let trade = extractFirstParts(title)
            if (trade) {
                let uspto;
                if (config.apiKeyUspto) {
                    //uspto = checkTrademark(trade);
                }
                if (uspto) {
                    const buttonElTrade = window.document.createElement("button")
                    buttonElTrade.title = "Trade Mark Var"
                    buttonElTrade.style = "cursor: no-drop"
                    buttonElTrade.textContent = "🚨"
                    //buttonElTrade.onclick = () => window.open(`https://www.trademarkia.com/search/trademarks?q=${trade}&country=us&codes=025&status=registered`, '_blank')
                    overlay.appendChild(buttonElTrade);
                } else {
                    const buttonElTrade = window.document.createElement("button")
                    buttonElTrade.title = "Trade Mark Kontrol et"
                    buttonElTrade.style = "cursor: help"
                    buttonElTrade.textContent = "T"
                    buttonElTrade.onclick = () => window.open(`https://www.trademarkia.com/search/trademarks?q=${trade}&country=us&codes=025&status=registered`, '_blank')
                    overlay.appendChild(buttonElTrade);
                }
            }

            if (config.sheetId2 !== "") {
                // Kalp2 elementi
                let { dnoValue, gDrive, teamname } = findEValueById(id, 2) || ""; // Eğer değer bulunmazsa boş string
                const result2 = dnoValue ? "✅" : "⭐";
                const tooltipText2 = dnoValue ? `Dizayn NO: ${dnoValue} by ${teamname}` : `İsteğe EKLE! -${id}`;
                const resultEl2 = window.document.createElement("div");
                resultEl2.textContent = result2;
                resultEl2.title = tooltipText2;
                resultEl2.style.marginLeft = "1px";
                resultEl2.style.fontSize = "1.1rem";

                if (!dnoValue) {
                    resultEl2.style.cursor = "cell";
                    resultEl2.href = "#";
                    resultEl2.addEventListener("click", async function () {
                        resultEl2.style.backgroundColor = "orange"
                        await saveToGoogleSheet(config.sheetId2, currentUrl, title, img, sales, age, tags);
                        resultEl2.textContent = "✅"
                        resultEl2.style.backgroundColor = null
                        showToast(title + '\n listeye eklendi!');
                    });
                } else {
                    if (gDrive) {
                        resultEl2.addEventListener("click", async function () {
                            window.open(gDrive, "_blank");
                        });
                    }
                }
                overlay.appendChild(resultEl2);
            }
        };

        const handleListingPage = async () => {
            const urlParts = window.location.pathname.split('/');
            const id = urlParts[urlParts.indexOf('listing') + 1];
            const titleElement = window.document.querySelector('#listing-page-cart > div.wt-mb-xs-1 > h1');
            const imgElement = window.document.querySelector("#photos > div > div > ul > li > img")
            if (titleElement && id) {
                await createOverlayOnElement({
                    element: titleElement,
                    id,
                    imgUrl: imgElement.src,
                });
            }
        };

        const initOverlay = async () => {
            const addOverlay = async (el) => {
                //console.log(el);
                const id = el.dataset.listingId;
                const infoEl = el.querySelector(".streamline-spacing-pricing-info streamline-spacing-reduce-margin") || el;
                await createOverlayOnElement({
                    element: infoEl,
                    id,
                });
            };

            observeElements("[data-listing-id][data-listing-card-v2]", addOverlay, window.document);
        };

        /*deprecated*/
        const observeUrlChanges = () => {
            let lastUrl = window.location.href;
            new MutationObserver(() => {
                if (window.location.href !== lastUrl) {
                    lastUrl = window.location.href;
                    if (window.location.href.includes("/listing/")) {
                        handleListingPage();
                    } else {
                        initOverlay();
                    }
                }
            }).observe(window.document, { subtree: true, childList: true });
        };

        await fetchColumnData();
        if (config.sheetId2 !== "") {
            await fetchColumnData(2);
        }
        //observeUrlChanges();

        async function waitFor(conditionFn, delay = 500, timeout = 30_000) {
            const startTime = Date.now();

            while (!conditionFn()) {
                if (Date.now() - startTime > timeout) {
                    throw new Error('Timeout reached while waiting for condition');
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            return true;
        }

        function ehuntOverlay() {
            //console.log("ehuntOverlay is working");

            const addOverlay = async (el) => {
                const imgEl = el.querySelector("img");
                await waitFor(() => imgEl.dataset.src); // wait for img tag to load

                const imgUrl = imgEl.dataset.src.replace("/il_120xN","/il_620xN");
                const infoEl = el.querySelector(".src-css-product-productInfoSub-3svU") || el;
                const linkEl = el.querySelector(".cell > div > a:first-child")
                const url = linkEl.href;
                const id = /https:\/\/www\.etsy\.com\/listing\/(\d+)\/.+/.exec(url)[1];

                const titleEl = el.querySelector(".product_title")
                const title = titleEl.textContent;

                await createOverlayOnElement({
                    element: infoEl,
                    id,
                    imgUrl,
                    url,
                });
            };

            observeElements(".el-table__row", addOverlay, window.document);
        }

        const ehuntOverlayDetail = async () => {
            //console.log("ehuntOverlay Detail is working");
            const urlParts = window.location.pathname.split('/');
            const id = urlParts[3];
            //console.log("id :",id);
            //console.log("urlParts :",urlParts);
            const addOverlay = async (el) => {
                //console.log("imgEl :",imgEl);
                await waitFor(() => el.querySelector("#indexCarImg")?.src); // wait for img tag to load
                const imgEl = el.querySelector("#indexCarImg")
                const titleElement = el.querySelector('#header_container > div:nth-child(2) > div:nth-child(2)');
                //console.log("Waited imgEl src :",imgEl.src);
                //console.log("titleElement :",titleElement);
                if (titleElement && id) {
                    await createOverlayOnElement({
                        element: titleElement,
                        id,
                        imgUrl: imgEl.src,
                        //url:??
                    });
                }
            }
            observeElements(".etsy-container", addOverlay, window.document);
        }

        async function waitForValidEHuntDocument() {
            //console.log(window.document.location.href);
            while (
                !(window.document.location.href.startsWith('https://ehunt.ai/iframe/etsy-product-research?') ||
                  window.document.location.href.startsWith('https://ehunt.ai/iframe/product-detail'))
                || window.document.readyState !== "complete"
            ) {
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
            //console.log("Document is ready:", window.document.location.href);
        }

        if (window.location.href.includes("/listing/")) {
            handleListingPage();
            //console.log("handleListingPage");
        } else if (window.name == "zbaseiframe") {
            //console.log("window.name ? zbaseiframe :", window.name);
            await waitForValidEHuntDocument();
            if(window.location.href.includes("/product-detail/")){
                ehuntOverlayDetail();
                //console.log("ehuntOverlayDetail");
                showToast("Ehunt Detail");
            }else{
                ehuntOverlay();
                //console.log("ehuntOverlay");
                showToast("Ehunt");
            }

        } else {
            //console.log("initOverlay");
            initOverlay();
        }
    }

    function onLoaded(doc, fn) {
        if (doc.readyState == 'loading') {
            doc.addEventListener("DOMContentLoaded", fn);
        } else {
            fn()
        }
    }

    function runInIframe(iframeEl) {
        //console.log("runInIframe:", iframeEl);
        const iframeWin = iframeEl.contentWindow;
        const iframeDoc = iframeEl.contentDocument;

        onLoaded(iframeDoc, () => {
            //console.log("running doTheThing() with iframe", iframeWin);
            doTheThing(iframeWin, iframeDoc);
        });
    }

    const isEtsyHunt = window.location.host == 'ehunt.ai' && (window.location.pathname == '/etsy-product-research' || window.location.href.includes("/product-detail/"));
    if (isEtsyHunt) {
        // Run in iframe
        observeElements("iframe#zbaseiframe", runInIframe, window.document)
    } else { // In etsy
        onLoaded(window.document, () => doTheThing(window, window.document))
        //console.log("In Etsy")
    }

    // Sayfa yüklendiğinde
    window.addEventListener('load', async function() {
        await loadConfig();
        await showConfigMenu();
        await validateConfig();
    });

})();
