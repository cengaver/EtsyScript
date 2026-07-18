// ==UserScript==
// @name         Etsy Listing Changer
// @description  Etsy Listing Changer for input
// @version      0.55
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

    async function addPersonalizationOptions(colors) {
        const textareaSelector = '#field-personalizationQuestions-options';

        const textarea = await waitFor(textareaSelector, 5000);
        if (!textarea) {
            console.warn("Textarea bulunamadı");
            return;
        }

        for (const color of colors) {

            setReactInputValue(textarea, color);

            textarea.focus();

            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));

            await new Promise(r => setTimeout(r, 400));
            const addBtn = [...document.querySelectorAll('button[type="submit"]')]
            .find(btn => btn.textContent.trim() === "Add");
            if (!addBtn) {
                console.warn("Aktif Add butonu bulunamadı:", color);
                continue;
            }

            addBtn.click();

            console.log("Eklendi:", color);

            await new Promise(r => setTimeout(r, 500));
        }

        console.log("Tamamlandı");
    }

    function setReactInputValue(el, value) {
        const proto = Object.getPrototypeOf(el);
        const setter = Object.getOwnPropertyDescriptor(proto, "value").set;

        setter.call(el, value);

        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const colors = [
        "Black","Blue","Brown","Burgundy","Columbia","Forest Green",
        "Gold","Green","Grey","Kelly Green","Magenta","Maroon",
        "Navy","Neon Green","Neon Orange","Neon Pink","Orange",
        "Pink","Purple","Red","Royal","Sand","Silver","Sky Blue",
        "Teal","Vegas","White","Yellow"
    ];


    /*function setReactInputValue(input, value) {
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
    }*/

    function setReactInputChecker(checkbox, value) {
        if (!checkbox) return false;
        try {
            //nativeValueSetter.call(inputEl, String(value)); // native setter
            if (checkbox.checked !== value) {
                checkbox.click()
                dispatchInputEvents(checkbox);
                return true;
            }
        } catch (e) {
            console.error("setReactInputChecker hata:", e);
            return false;
        }
    }
    async function inputChangerDimension(strLength,strWidth,strHeight, autoSave = false) {
        try {
            const selLength = "#shipping_item_dimension-itemLength";
            const selWidth = "#shipping_item_dimension-itemWidth";
            const selHeight = "#shipping_item_dimension-itemHeight";


            const Length = await waitFor(selLength, 4000).catch(()=>null);
            if (!Length) {
                console.warn("Length input bulunamadı:", selLength);
            } else {
                setReactInputValue(Length, strLength);
                console.log("Length input ",strLength," yapıldı");
            }

            const Width = await waitFor(selWidth, 2000).catch(()=>null);
            if (Width) {
                setReactInputValue(Width, strWidth);
                console.log("Width input", strWidth, "yapıldı");
            } else {
                console.log("Width input bulunamadı (opsiyonel):", selWidth);
            }

            const Height = await waitFor(selHeight, 2000).catch(()=>null);
            if (Height) {
                setReactInputValue(Height, strHeight);
                console.log("Height input", strHeight, "yapıldı");
            } else {
                console.log("Height input bulunamadı (opsiyonel):", selHeight);
            }
            if (autoSave) {
                // kısa bir bekleme bırak React state işlemesi için, 200-400 ms yeterli
                setTimeout(() => save(), 300);
            }
        } catch (err) {
            console.error("inputChangerDimension hata:", err);
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

    async function variantChanger(value = 364, autoSave = false) {
        try {
            const variant = "table tbody tr:nth-of-type("+value+") td:nth-of-type(5) input"; // varsa

            const input1 = await waitFor(variant, 4000).catch(()=>null);
            if (!input1) {
                console.warn("Variant bulunamadı:", variant);
            } else {
                setReactInputChecker(input1, false);
                console.log("Variant input false yapıldı");
            }

            if (autoSave) {
                // kısa bir bekleme bırak React state işlemesi için, 200-400 ms yeterli
                setTimeout(() => save(), 300);
            }
        } catch (err) {
            console.error("variantChanger hata:", err);
        }
    }

    async function variantInputUpdater(index, value, autoSave = false) {
        try {
            const variant = "table tbody tr:nth-of-type("+index+") td:nth-of-type(3) input"; // varsa 4 fiyat

            const input1 = await waitFor(variant, 4000).catch(()=>null);
            if (!input1) {
                console.warn("Variant bulunamadı:", variant);
            } else {
                setReactInputValue(input1, value);
                console.log("Variant "+index+". index input :"+value+" yapıldı");
            }

            if (autoSave) {
                // kısa bir bekleme bırak React state işlemesi için, 200-400 ms yeterli
                //setTimeout(() => save(), 300);
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

    async function ShowAllVariant() {
        try {
            const buton = "#field-variations > div > div > div > div.wt-text-center-xs > button";
            const btn = await waitFor(buton, 4000).catch(()=>null);
            if (!btn) {
                return console.warn("ShowAll butonu bulunamadı");
            }
            btn.click();
            console.log("ShowAll butonuna tıklandı");
        } catch (e) {
            console.error("ShowAll hata:", e);
        }
    }

    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.code === "Space") {
            e.preventDefault();
            addPersonalizationOptions(colors);
            /*inputChangerDimension(15,12,3);*/
            /*******/
            //color count 22
            /*let start = 117;//L-XL
            let count = 29;//2 grup 2*22
            let price = 42.88;
            for (let i = 0; i < count; i++) {
                ((n) => {
                    setTimeout(() => variantInputUpdater(n, price), i * 100);
                })(start + i);
            }

            let start2 = 57;//2XL
            let count2 = 14;
            let price2 = 47.88;
            for (let j = 0; j < count2; j++) {
                ((n) => {
                    setTimeout(() => variantInputUpdater(n, price2), ((j * 200) + (count * 200)) );
                })(start2 + j);
            }*/

            /*let start3 = 111;//3XL
            let count3 = 22;
            let price3 = 44.63;
            for (let k = 0; k < count3; k++) {
                ((n) => {
                    setTimeout(() => variantInputUpdater(n, price3), ((k * 200) + (count * 200) + (count2 * 200)) );
                })(start3 + k);
            }

            setTimeout(() => save(), (3000 + (count * 200) + (count2 * 200) + (count3 * 200) ));*/
            //setTimeout(() => save(), (3000 + (count * 100) ));

        } else if (e.ctrlKey && e.altKey) {
            e.preventDefault();
            save();
        }
    });


    // global erişim
    window.EtsyListingChanger = { inputChanger, save, setReactInputValue };

    window.addEventListener("load", async () => {
        // yüklenince hash'i #shipping yap #pricing-logistics
        try {
            if (location.hash !== "#pricing-logistics") {
               // location.hash = "#pricing-logistics"
                //setTimeout(() => ShowAllVariant(), 300);
            }
        } catch (e) {
            console.warn("Hash ayarlanamadı:", e)
        }
    })

})();
