// ==UserScript==
// @name         Etsy Listing Changer
// @description  Etsy Listing Changer for input
// @version      0.4
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/listing-editor/edit/*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @require      https://cdn.jsdelivr.net/npm/notyf@3.0.0/notyf.min.js
// @resource     notyf-css https://cdn.jsdelivr.net/npm/notyf@3.0.0/notyf.min.css
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ListingChanger.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ListingChanger.user.js
// ==/UserScript==

(function(){
    "use strict";

    const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;

    function waitFor(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            const observer = new MutationObserver(() => {
                const found = document.querySelector(selector);
                if (found) {
                    observer.disconnect();
                    resolve(found);
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
            if (timeout > 0) setTimeout(() => {
                observer.disconnect();
                reject(new Error("waitFor timeout: " + selector));
            }, timeout);
        });
    }

    const dispatchInputEvents = el => {
        if (!el) return;
        try { el.focus && el.focus(); } catch(e){}
        el.dispatchEvent(new Event("focus", { bubbles: true }));
        el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
        el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
        el.dispatchEvent(new InputEvent("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        try { el.blur && el.blur(); } catch(e){}
        el.dispatchEvent(new Event("blur", { bubbles: true }));
    };

    function setReactInputValue(input, value) {
        if (!input) return false;
        try {
            nativeValueSetter.call(input, String(value)); // native setter
            input.setAttribute("value", String(value));
            input.defaultValue = String(value);
            dispatchInputEvents(input);
            return true;
        } catch (e) {
            console.error("setReactInputValue hata:", e);
            return false;
        }
    }

    async function inputChanger(value = 6, autoSave = false) {
        try {
            const selPrimary = "#listing-weight-primary-input";
            const selSecondary = "#listing-weight-secondary-input"; // varsa

            const input1 = await waitFor(selPrimary, 4000).catch(()=>null);
            if (!input1) {
                console.warn("Birinci input bulunamadı:", selPrimary);
            } else {
                setReactInputValue(input1, 0);
                console.log("Birinci input 0 yapıldı");
            }

            const input2 = await waitFor(selSecondary, 2000).catch(()=>null);
            if (input2) {
                setReactInputValue(input2, value);
                console.log("İkinci input", value, "yapıldı");
            } else {
                console.log("İkinci input bulunamadı (opsiyonel):", selSecondary);
            }

            if (autoSave) {
                // kısa bir bekleme bırak React state işlemesi için, 200-400 ms yeterli
                setTimeout(() => save(), 300);
            }
        } catch (err) {
            console.error("inputChanger hata:", err);
        }
    }

    function save() {
        try {
            const btn = document.querySelector("#shop-manager--listing-publish-edit");
            if (!btn) return console.warn("Kaydet butonu bulunamadı");
            btn.click();
            console.log("Kaydet butonuna tıklandı");
        } catch (e) {
            console.error("save hata:", e);
        }
    }

    // Kısayollar (isteğe göre kaldır)
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.code === "Space") {
            e.preventDefault();
            inputChanger(15, true); // otomatik kaydetme: false
        } else if (e.ctrlKey && e.altKey) {
            e.preventDefault();
            save();
        }
    });

    // global erişim
    window.EtsyListingChanger = { inputChanger, save, setReactInputValue };

    window.addEventListener("load", async () => {
        // yüklenince hash'i #shipping yap
        try {
            if (location.hash !== "#shipping") {
                location.hash = "#shipping"
            }
        } catch (e) {
            console.warn("Hash ayarlanamadı:", e)
        }
    })

})();
