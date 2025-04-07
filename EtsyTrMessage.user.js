// ==UserScript==
// @name         Etsy Message Translator (DeepL Hover)
// @namespace    https://github.com/cengaver
// @version      1.2
// @author       Cengaver
// @description  Etsy mesajlarının üzerine gelince DeepL ile Türkçe çeviri gösterir
// @match        https://www.etsy.com/messages/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyTrMessage.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyTrMessage.user.js
// @connect      api-free.deepl.com
// @run-at       document-end
// ==/UserScript==

(function() {
    GM_registerMenuCommand("🔑 DeepL API Key Ayarla", async () => {
        const key = prompt("DeepL API Key’inizi girin:");
        if (key) {
            await GM_setValue("deepl_api_key", key.trim());
            alert("✅ Kaydedildi.");
        }
    });

    async function getApiKey() {
        const key = await GM_getValue("deepl_api_key", "");
        if (!key) alert("⚠️ Lütfen kullanıcı betiği menüsünden DeepL API Key girin.");
        return key;
    }

    function createTooltip(text, targetElement) {
        const existing = document.getElementById('deepl-tooltip');
        if (existing) existing.remove();

        const tooltip = document.createElement('div');
        tooltip.id = 'deepl-tooltip';
        tooltip.textContent = text;
        Object.assign(tooltip.style, {
            position: 'absolute',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            padding: '6px 8px',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            fontSize: '14px',
            maxWidth: '300px',
            zIndex: 9999
        });

        document.body.appendChild(tooltip);
        const rect = targetElement.getBoundingClientRect();
        tooltip.style.top = (window.scrollY + rect.top - tooltip.offsetHeight - 8) + 'px';
        tooltip.style.left = (window.scrollX + rect.left) + 'px';
    }

    async function translateText(text, targetLang, callback) {
        const API_KEY = await getApiKey();
        if (!API_KEY) return;

        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://api-free.deepl.com/v2/translate',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: `auth_key=${API_KEY}&text=${encodeURIComponent(text)}&target_lang=${targetLang}`,
            onload: res => {
                try {
                    const json = JSON.parse(res.responseText);
                    callback(json.translations[0].text);
                } catch (e) {
                    console.error('Çeviri hatası:', e);
                }
            }
        });
    }

    function observeMsgContainer() {
        const container = document.querySelector('.msg-list-container');
        if (!container) return;

        const observer = new MutationObserver(() => {
            const spans = container.querySelectorAll('span:not(.screen-reader-only)');
            spans.forEach(span => {
                if (!span.dataset.translatable && span.textContent.trim().length > 2) {
                    span.dataset.translatable = '1';
                    span.addEventListener('mouseenter', () => {
                        if (span.dataset.tr) {
                            createTooltip(span.dataset.tr, span);
                        } else {
                            translateText(span.textContent.trim(), 'TR', result => {
                                span.dataset.tr = result;
                                createTooltip(result, span);
                            });
                        }
                    });
                    span.addEventListener('mouseleave', () => {
                        const tip = document.getElementById('deepl-tooltip');
                        if (tip) tip.remove();
                    });
                }
            });
        });

        observer.observe(container, { childList: true, subtree: true });
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
            });
        });
    }

    const interval = setInterval(() => {
        const container = document.querySelector('.msg-list-container');
        const textarea = document.querySelector('textarea.new-message-textarea-min-height');
        if (container && textarea) {
            clearInterval(interval);
            observeMsgContainer();
            injectTranslateButton();
        }
    }, 1000);
})();
