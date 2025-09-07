// ==UserScript==
// @name         Etsy Message Translator (Hover Translate)
// @namespace    https://github.com/cengaver
// @version      1.60
// @description  Etsy mesajlarının üzerine gelince çeviri gösterir (DeepL veya Google Translate)
// @match        https://www.etsy.com/messages/*
// @match        https://www.etsy.com/your/orders/sold/*
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.xmlHttpRequest
// @connect      api-free.deepl.com
// @connect      api.deepl.com
// @connect      translate.googleapis.com
// @icon         https://www.google.com/s2/favicons?domain=deepl.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyTrMessage.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyTrMessage.user.js
// @run-at       document-end
// ==/UserScript==

(function () {
    GM.registerMenuCommand("🔑 DeepL API Key Ayarla", async () => {
        const key = prompt("DeepL API Key’inizi girin:");
        if (key) {
            await GM.setValue("deepl_api_key", key.trim());
            alert("✅ Kaydedildi.");
        }
    });

    GM.registerMenuCommand("🌐 Çeviri Servisi Seç (DeepL / Google)", async () => {
        const choice = prompt("Kullanmak istediğiniz servisi yazın: deepl veya google");
        if (choice === "deepl" || choice === "google") {
            await GM.setValue("translator", choice);
            alert("✅ Seçilen servis: " + choice);
        } else alert("Geçerli bir değer girin: deepl veya google");
    });

    GM.registerMenuCommand("⚙️ Her zaman çeviri yap (Açık/Kapalı)", async () => {
        const current = await GM.getValue("always_translate", false);
        const next = !current;
        await GM.setValue("always_translate", next);
        alert(`🔁 Her zaman çeviri yap: ${next ? "Açık" : "Kapalı"}`);
    });

    GM.registerMenuCommand("⚙️ DeepL Pro (Açık/Kapalı)", async () => {
        const current = await GM.getValue("deepl_pro", false);
        const next = !current;
        await GM.setValue("deepl_pro", next);
        alert(`🔁 Pro olarak çeviri yap: ${next ? "Açık" : "Kapalı"}`);
    });

    async function getTranslator() {
        return await GM.getValue("translator", "deepl");
    }

    async function getApiKey() {
        const key = await GM.getValue("deepl_api_key", "");
        if (!key) alert("⚠️ Lütfen menüden DeepL API Key girin.");
        return key;
    }

    async function getAlwaysTranslate() {
        return await GM.getValue("always_translate", false);
    }

    async function getProTranslate() {
        return await GM.getValue("deepl_pro", false);
    }

    function createTooltip(text, targetElement) {
        let tooltip = document.getElementById('deepl-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'deepl-tooltip';
            Object.assign(tooltip.style, {
                position: 'absolute',
                background: '#fff',
                border: '1px solid #ccc',
                padding: '6px 8px',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                fontSize: '14px',
                maxWidth: '500px',
                zIndex: 9999
            });
            document.body.appendChild(tooltip);
        }
        tooltip.textContent = text;
        const rect = targetElement.getBoundingClientRect();
        tooltip.style.top = (window.scrollY + rect.top - tooltip.offsetHeight - 8) + 'px';
        tooltip.style.left = (window.scrollX + rect.left) + 'px';
    }

    async function translateText(text, targetLang, callback) {
        const service = await getTranslator();
        if (service === 'google') {
            GM.xmlHttpRequest({
                method: 'GET',
                url: `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
                onload: res => {
                    try {
                        const data = JSON.parse(res.responseText);
                        callback(data[0][0][0]);
                    } catch (e) {
                        console.error("Google çeviri hatası:", e);
                    }
                }
            });
        } else {
            const API_KEY = await getApiKey();
            if (!API_KEY) return;
            const proTranslate = await getProTranslate();
            let url;
            if(proTranslate)
            {
                url ="https://api.deepl.com/v2/translate"
            }else{
                url ="https://api-free.deepl.com/v2/translate"
            }
            GM.xmlHttpRequest({
                method: 'POST',
                url,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: `auth_key=${API_KEY}&text=${encodeURIComponent(text)}&target_lang=${targetLang}`,
                onload: res => {
                    try {
                        const json = JSON.parse(res.responseText);
                        callback(json.translations[0].text);
                    } catch (e) {
                        console.error('DeepL çeviri hatası:', e);
                    }
                }
            });
        }
    }

    function observeMsgContainer(container,spans) {
        if (!container) {console.log("yok"); return;}
        //console.log(container);
        const processSpans = () => {
            spans.forEach(span => {
                if (!span.dataset.translatable && span.textContent.trim().length > 2) {
                    span.dataset.translatable = '1';

                    const debouncedMouseEnter = debounce(async () => {
                        const alwaysTranslate = await getAlwaysTranslate();
                        const originalText = span.textContent.trim();
                        const cacheKey = `tr_${originalText}`;

                        const cached = sessionStorage.getItem(cacheKey);
                        if (cached) {
                            createTooltip(cached, span);
                            return;
                        }

                        if (alwaysTranslate) {
                            translateText(originalText, 'TR', result => {
                                sessionStorage.setItem(cacheKey, result);
                                createTooltip(result, span);
                            });
                        } else {
                            translateText(originalText, 'TR', result => {
                                sessionStorage.setItem(cacheKey, result);
                                cleanOldSessionStorage();
                                createTooltip(result, span);
                            });
                        }
                    }, 300);

                    span.addEventListener('mouseenter', debouncedMouseEnter);
                    span.addEventListener('mouseleave', () => {
                        const tip = document.getElementById('deepl-tooltip');
                        if (tip) tip.remove();
                    });
                }
            });
        };

        const observer = new MutationObserver(() => processSpans());
        observer.observe(container, { childList: true, subtree: true });

        processSpans();
    }

    function cleanOldSessionStorage(maxEntries = 300) {
        const keys = Object.keys(sessionStorage).filter(k => k.startsWith('tr_'));
        if (keys.length > maxEntries) {
            keys.slice(0, keys.length - maxEntries).forEach(k => sessionStorage.removeItem(k));
        }
    }

    function debounce(func, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function injectTranslateButton() {
        const translateButton = document.querySelector(".inline-compose-container > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(1)");
        const textarea = document.querySelector('textarea.new-message-textarea-min-height');
        if (!textarea || textarea.dataset.hasTranslator) return;
        textarea.dataset.hasTranslator = '1';

        const btn = document.createElement('button');
        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
            <style>.st2{fill:none;stroke:#0F005B;stroke-width:8;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}</style>
            <ellipse class="st2" cx="64" cy="64" rx="18.9" ry="44.3"/>
            <line class="st2" x1="22.7" x2="105.3" y1="49.2" y2="49.2"/>
            <line class="st2" x1="92.5" x2="22.7" y1="78.8" y2="78.8"/>
            <circle class="st2" cx="64" cy="64" r="44.3"/>
            </svg>`;

        Object.assign(btn.style, {
            marginLeft: '8px',
            padding: '4px',
            background: 'transparent',
            title: 'Translate',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        // **Butonu sonuna ekle**
        translateButton.appendChild(btn);

        btn.addEventListener('click', async () => {
            const original = textarea.value.trim();
            if (!original) return;
            translateText(original, 'EN', translated => {
                textarea.value = translated;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
    }

    function waitForMsgContainerThenObserve() {
        const observer = new MutationObserver((mutations, obs) => {
            let container,spans;
            if (window.location.href.includes("/your/orders/sold")) {
                //console.log("sold");
                container = document.querySelector("#dg-tabs-preact__tab-1--default_wt_tab_panel")
                //spans = container?.querySelectorAll('.note');
                spans = container?.querySelectorAll('span');
            }else{
                //console.log("msg");
                container = document.querySelector('.msg-list-container');
                spans = container?.querySelectorAll('span:not(.screen-reader-only)');
            }

            if (container && spans) {
                obs.disconnect();
                observeMsgContainer(container,spans);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    const interval = setInterval(() => {
        const textarea = document.querySelector('textarea.new-message-textarea-min-height');//injecktions button
        if (textarea) {
            clearInterval(interval);
            injectTranslateButton();
        }
    }, 2000);

    waitForMsgContainerThenObserve();
})();
