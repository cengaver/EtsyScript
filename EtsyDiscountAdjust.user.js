// ==UserScript==
// @name         Etsy Discount Adjust
// @version      0.1
// @description  Create daily discount
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/sales-discounts*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.addStyle
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyDiscountAdjust.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyDiscountAdjust.user.js
// @run-at       document-en
// ==/UserScript==

(async function () {

    GM.addStyle(`
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
        }
        #sku-div-message{
            color: red;
        }
        #sku-button {
           background-color: rgb(0, 123, 255);
           color: white;
           border: none;
           padding: 5px 10px;
           border-radius: 3px;
           cursor: pointer;
        }
    `);

    function showToast(message, type = null) {
        const toast = document.createElement('div');
        if (type == 'error') {
            toast.className = 'toast-error';
        }else{
            toast.className = 'toast';
        }
        toast.innerText = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // Config yapısı
    const DEFAULT_CONFIG = {
        discount: 25,
        discountName: "",
        mount: "",
        lastDay: 1,
        fullYear: "2025",
    };

    // Global değişken
    let config = {...DEFAULT_CONFIG};
    let configLoaded = false; // Add a flag to track if config is loaded

    // Config yönetimi - Basitleştirilmiş versiyon
    async function loadConfig() {
        try {
            const savedConfig ={
                discount: await GM.getValue('discount', 25),
                discountName: await GM.getValue('discountName', ""),
                mount: await GM.getValue('mount', ''),
                lastDay: await GM.getValue('lastDay', 1),
            }
            if (savedConfig) {
                config = {...DEFAULT_CONFIG, ...savedConfig};
                configLoaded = true;
                showToast('Config yüklendi');
                console.log("Config yüklendi: ",config);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Config yükleme hatası:', error);
            return false;
        }
    }

    async function saveConfig() {
        if (config.discount) await GM.setValue('discount', config.discount);
        if (config.discountName) await GM.setValue('discountName', config.discountName.trim());
        if (config.mount) await GM.setValue('mount', config.mount);
        if (config.lastDay) await GM.setValue('lastDay', config.lastDay);
        if (config.fullYear) await GM.setValue('fullYear', config.lasfullYeartDay.trim());
        showToast('Config Kaydedildi');
        console.log("Config Kaydedildi: ",config);
    }

    // Config kontrol fonksiyonu
    async function checkConfig() {
        if (!configLoaded) {
            await loadConfig();
        }
        return configLoaded;
    }

    async function showConfigMenu() {
        GM.registerMenuCommand('⚙️ Ayarlar', function() {
            const html = `
                <div style="padding:20px;font-family:Arial,sans-serif;max-width:520px;">
                    <h2 style="margin-top:0;">Ayarlar</h2>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">discount: (25)</label>
                        <input type="number" id="discount" value="${config.discount}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">discountName (APR)</label>
                        <input type="text" id="discountName" value="${config.discountName}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">mount</label>
                        <input type="number" id="mount" value="${config.mount}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">lastDay</label>
                        <input type="number" id="lastDay" value="${config.lastDay}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:bold;">fullYear</label>
                        <input type="number" id="fullYear" value="${config.fullYear}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <button id="saveConfigBtn" style="padding:10px 15px;background:#4285f4;color:white;border:none;border-radius:4px;cursor:pointer;">Kaydet</button>
                </div>
            `;

            const win = window.open("", "Config", "width=600,height=600");
            win.document.body.innerHTML = html;

            win.document.getElementById('saveConfigBtn').addEventListener('click', function() {
                config.discount = parseFloat(win.document.getElementById('discount').value);
                config.discountName = win.document.getElementById('discountName').value;
                config.mount = win.document.getElementById('mount').value;
                config.lastDay = parseFloat(win.document.getElementById('lastDay').value);
                config.fullYear = win.document.getElementById('fullYear').value;
                saveConfig();
                win.alert("Ayarlar kaydedildi! Sayfayı yenileyin.");
                win.close();
            });
        });
    }

    // Önce config'in yüklendiğinden emin ol
    if (!await checkConfig()) {
        showToast('Config yüklenemedi', 'error');
        return;
    }

    async function main(send = false) {
        // Inputlara tarih yaz
        // lastDay + 1 ve geri kaydet
        const lastDay = await GM.getValue("lastDay", "");
        const dateInputs = [...document.querySelectorAll('input[data-datepicker-input="true"]')];
        if (dateInputs.length >= 2) {
            const dateStr = `${config.mount.padStart(2, '0')}/${String(lastDay).padStart(2, '0')}/${config.fullYear}`;
            dateInputs[0].value = dateStr;
            dateInputs[1].value = dateStr;
            dateInputs[0].dispatchEvent(new Event('input', { bubbles: true })); // "input" etkinliğini tetikle
            dateInputs[0].dispatchEvent(new Event('change', { bubbles: true })); // "change" etkinliğini tetikle
            dateInputs[1].dispatchEvent(new Event('input', { bubbles: true })); // "input" etkinliğini tetikle
            dateInputs[1].dispatchEvent(new Event('change', { bubbles: true })); // "change" etkinliğini tetikle
        }

        const lastDayStr = String(lastDay).padStart(2, '0');
        const mountStr = config.mount.padStart(2, '0');

        // Select'i seçili hale getir
        const select = document.querySelector("#reward-percentage");
        if (select) {
            const option = [...select.options].find(opt => opt.value === String(config.discount));
            if (option) option.selected = true;
            select.dispatchEvent(new Event('input', { bubbles: true })); // "input" etkinliğini tetikle
            select.dispatchEvent(new Event('change', { bubbles: true })); // "change" etkinliğini tetikle
        }
        // 3. Kupon ismini gir: DD + DISC + YY
        const couponInput = document.querySelector('#name-your-coupon');
        if (couponInput) {
            couponInput.value = `${lastDayStr}${config.discountName}${config.discount}`;
            couponInput.dispatchEvent(new Event('input', { bubbles: true })); // "input" etkinliğini tetikle
            couponInput.dispatchEvent(new Event('change', { bubbles: true })); // "change" etkinliğini tetikle
        }

        // 4. lastDay + 1 olarak güncelle
        await GM.setValue("lastDay", parseInt(lastDay) + 1);
        showToast(`Tarih ayarlandı: ${config.mount}/${lastDay}/2025, Discount: ${config.discount}`, "success");
        showToast("Başarıyla eklendi: "+lastDay);
        console.log("Başarıyla eklendi: ",lastDay);

    }

    // Ctrl + Space ile sadece doldurma
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.code === "Space") {
            main(false); // Sadece doldur
        }
    });

    window.addEventListener('load', async function() {
        try {
            const configLoaded = await checkConfig();
            if (!configLoaded) {
                showToast('Config yüklenemedi', 'error');
            }
            await showConfigMenu();

        } catch (error) {
            console.error('Başlatma hatası:', error);
            showToast('Script başlatılamadı', 'error');
        }
    });
})();
