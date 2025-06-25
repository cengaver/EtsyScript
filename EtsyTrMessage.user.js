// ==UserScript==
// @name         Etsy Message Translator (Hover Translate)
// @namespace    https://github.com/cengaver
// @version      1.52
// @description  Etsy mesajlarının üzerine gelince çeviri gösterir (DeepL veya Google Translate)
// @match        https://www.etsy.com/messages/*
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.xmlHttpRequest
// @connect      api-free.deepl.com
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
                maxWidth: '300px',
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
            GM.xmlHttpRequest({
                method: 'POST',
                url: 'https://api-free.deepl.com/v2/translate',
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

    function observeMsgContainer() {
        const container = document.querySelector('.msg-list-container');
        if (!container) return;

        const processSpans = () => {
            const spans = container.querySelectorAll('span:not(.screen-reader-only)');
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
        const textarea = document.querySelector('textarea.new-message-textarea-min-height');
        if (!textarea || textarea.dataset.hasTranslator) return;
        textarea.dataset.hasTranslator = '1';

        const btn = document.createElement('button');
        btn.textContent = '🌍';
        Object.assign(btn.style, {
            position: 'absolute',
            right: '12px',
            bottom: '4px',
            padding: '4px 6px',
            background: '#eee',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            zIndex: 9999
        });

        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        textarea.parentNode.insertBefore(wrapper, textarea);
        wrapper.appendChild(textarea);
        wrapper.appendChild(btn);

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
            const container = document.querySelector('.msg-list-container');
            if (container) {
                obs.disconnect();
                observeMsgContainer();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    const interval = setInterval(() => {
        const textarea = document.querySelector('textarea.new-message-textarea-min-height');
        if (textarea) {
            clearInterval(interval);
            injectTranslateButton();
        }
    }, 2000);

    waitForMsgContainerThenObserve();
})();
