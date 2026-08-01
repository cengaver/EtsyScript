// ==UserScript==
// @name         Etsy Title GEM Optimizer
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @version      1.0.6
// @description  Etsy ilan başlığını Gemini ile güvenli biçimde optimize eder
// @match        https://www.etsy.com/your/shops/me/listing-editor/*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @connect      generativelanguage.googleapis.com
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// @run-at       document-idle
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyTitleOptimizer.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyTitleOptimizer.user.js
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = Object.freeze({
        apiKeyStorageKey: 'api_key',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        requestTimeoutMs: 45000,
        buttonClass: 'gem-title-optimizer-btn',
        idleButtonText: '✨ Başlığı Optimize Et (GEM)',
        busyButtonText: '⏳ Optimize ediliyor...'
    });

    const GEM_PROMPT = `
You edit an existing Etsy listing title for clarity and keyword order.

Rules:
- Do not claim access to Etsy's private ranking algorithm, search volume, or competitor data.
- Do not rewrite the title from scratch.
- Preserve at least 70% of the original meaningful words, case-insensitively.
- Improve keyword order, readability, and clarity only.
- Do not add product features, materials, audiences, occasions, or claims that are not present in the original title.
- Do not add emojis or promotional fluff.
- Aim for 110-130 characters only when the original information supports it; never exceed 140 characters.
- Return only the requested JSON fields.
`;

    let isProcessing = false;
    let toastContainer = null;
    let mountTimer = null;

    GM.addStyle(`
        .gem-opt-toast-container {
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 2147483647;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        }

        .gem-opt-toast {
            min-width: 280px;
            max-width: min(420px, calc(100vw - 40px));
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
            font-family: "Segoe UI", Roboto, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            opacity: 0;
            transform: translateY(16px);
            transition: opacity 180ms ease, transform 180ms ease;
            pointer-events: auto;
        }

        .gem-opt-toast.is-visible {
            opacity: 1;
            transform: translateY(0);
        }

        .gem-opt-toast--success { background: #2e7d32; color: #fff; }
        .gem-opt-toast--error { background: #c62828; color: #fff; }
        .gem-opt-toast--warning { background: #fbbc05; color: #202124; }
        .gem-opt-toast--info { background: #3367d6; color: #fff; }

        .gem-opt-toast__close {
            flex: 0 0 auto;
            padding: 0;
            border: 0;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font: inherit;
            font-size: 18px;
            line-height: 1;
            opacity: 0.75;
        }

        .gem-opt-toast__close:hover { opacity: 1; }

        .${CONFIG.buttonClass} {
            margin-bottom: 8px;
        }

        .${CONFIG.buttonClass}[disabled] {
            cursor: wait;
            opacity: 0.7;
        }
    `);

    GM.registerMenuCommand('⚙️ Gemini API Anahtarını Ayarla', async () => {
        const hasCurrentKey = Boolean(await getApiKey());
        const message = hasCurrentKey
            ? 'Yeni Gemini API anahtarını girin. İptal mevcut anahtarı korur; boş bırakırsanız anahtar silinir.'
            : 'Gemini API anahtarınızı girin:';
        const enteredKey = window.prompt(message, '');

        if (enteredKey === null) return;

        const cleanKey = enteredKey.trim();
        await GM.setValue(CONFIG.apiKeyStorageKey, cleanKey);
        showToast(
            cleanKey ? 'Gemini API anahtarı kaydedildi.' : 'Gemini API anahtarı silindi.',
            cleanKey ? 'success' : 'info'
        );
    });

    async function getApiKey() {
        const value = await GM.getValue(CONFIG.apiKeyStorageKey, '');
        return typeof value === 'string' ? value.trim() : '';
    }

    function createToastContainer() {
        if (toastContainer?.isConnected) return toastContainer;

        toastContainer = document.createElement('div');
        toastContainer.className = 'gem-opt-toast-container';
        toastContainer.setAttribute('aria-live', 'polite');
        toastContainer.setAttribute('aria-atomic', 'false');
        (document.body || document.documentElement).appendChild(toastContainer);
        return toastContainer;
    }

    function showToast(message, type = 'success', duration = 4000) {
        const container = createToastContainer();
        const toast = document.createElement('div');
        toast.className = `gem-opt-toast gem-opt-toast--${type}`;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'gem-opt-toast__close';
        closeButton.setAttribute('aria-label', 'Bildirimi kapat');
        closeButton.textContent = '×';

        let dismissTimer = null;
        const dismiss = () => {
            if (dismissTimer) clearTimeout(dismissTimer);
            toast.classList.remove('is-visible');
            window.setTimeout(() => toast.remove(), 200);
        };

        closeButton.addEventListener('click', dismiss);
        toast.append(messageSpan, closeButton);
        container.appendChild(toast);
        window.setTimeout(() => toast.classList.add('is-visible'), 10);

        if (duration > 0) {
            dismissTimer = window.setTimeout(dismiss, duration);
        }

        return toast;
    }

    function getTitleInput() {
        return document.querySelector('input[name="title"], textarea[name="title"]');
    }

    function normalizeTitle(value) {
        return String(value ?? '').replace(/\s+/g, ' ').trim();
    }

    function tokenizeTitle(value) {
        return normalizeTitle(value).toLocaleLowerCase('en-US').match(/[\p{L}\p{N}]+/gu) || [];
    }

    function getRetentionRatio(originalTitle, newTitle) {
        const originalWords = new Set(tokenizeTitle(originalTitle));
        const newWords = new Set(tokenizeTitle(newTitle));
        if (originalWords.size === 0) return 1;

        let retained = 0;
        for (const word of originalWords) {
            if (newWords.has(word)) retained += 1;
        }
        return retained / originalWords.size;
    }

    function setControlledInputValue(input, value) {
        const prototype = input instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

        input.focus();
        if (setter) setter.call(input, value);
        else input.value = value;

        try {
            input.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                inputType: 'insertText',
                data: value
            }));
        } catch (_) {
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function cleanJson(text) {
        return String(text ?? '')
            .replace(/^\s*```json\s*/i, '')
            .replace(/^\s*```\s*/i, '')
            .replace(/\s*```\s*$/i, '')
            .trim();
    }

    function buildPayload(oldTitle) {
        return {
            systemInstruction: {
                parts: [{ text: GEM_PROMPT }]
            },
            contents: [{
                role: 'user',
                parts: [{ text: JSON.stringify({ title: oldTitle }) }]
            }],
            generationConfig: {
                responseFormat: {
                    text: {
                        mimeType: 'application/json',
                        schema: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                new_title: {
                                    type: 'string',
                                    minLength: 1,
                                    maxLength: 140
                                },
                                confidence: {
                                    type: 'number',
                                    minimum: 0,
                                    maximum: 1
                                },
                                change_type: {
                                    type: 'string',
                                    enum: ['none', 'micro', 'light']
                                }
                            },
                            required: ['new_title', 'confidence', 'change_type']
                        }
                    }
                },
                maxOutputTokens: 300,
                thinkingConfig: {
                    thinkingLevel: 'low'
                }
            }
        };
    }

    function extractApiMessage(responseText) {
        try {
            const parsed = JSON.parse(responseText);
            return typeof parsed?.error?.message === 'string' ? parsed.error.message.trim() : '';
        } catch (_) {
            return '';
        }
    }

    function createHttpError(response) {
        const status = Number(response.status) || 0;
        const apiMessage = extractApiMessage(response.responseText);
        let message = `Gemini API isteği başarısız oldu${status ? ` (${status})` : ''}.`;

        if (status === 400) message = 'Gemini isteği geçersiz. API ayarlarını kontrol edin.';
        else if (status === 401 || status === 403) message = 'Gemini API anahtarı geçersiz veya bu işlem için yetkisiz.';
        else if (status === 429) message = 'Gemini kullanım limiti aşıldı. Bir süre sonra tekrar deneyin.';
        else if (status >= 500) message = 'Gemini hizmetinde geçici bir sunucu hatası oluştu.';

        return new Error(apiMessage ? `${message} ${apiMessage}` : message);
    }

    function requestGemini(apiKey, payload) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'POST',
                url: CONFIG.endpoint,
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                data: JSON.stringify(payload),
                timeout: CONFIG.requestTimeoutMs,
                anonymous: true,
                onload: (response) => {
                    if (response.status < 200 || response.status >= 300) {
                        reject(createHttpError(response));
                        return;
                    }
                    resolve(response.responseText);
                },
                onerror: () => reject(new Error('Gemini API bağlantısı kurulamadı. İnternet bağlantınızı kontrol edin.')),
                ontimeout: () => reject(new Error('Gemini API isteği zaman aşımına uğradı.')),
                onabort: () => reject(new Error('Gemini API isteği iptal edildi.'))
            });
        });
    }

    function parseGeminiResponse(responseText) {
        let response;
        try {
            response = JSON.parse(responseText);
        } catch (_) {
            throw new Error('Gemini API geçersiz bir sunucu yanıtı döndürdü.');
        }

        const rawText = response.candidates?.[0]?.content?.parts
            ?.map((part) => part?.text)
            .filter(Boolean)
            .join('');

        if (!rawText) {
            const blockReason = response.promptFeedback?.blockReason;
            throw new Error(
                blockReason
                    ? `Gemini isteği engelledi: ${blockReason}`
                    : 'Gemini boş bir yanıt döndürdü.'
            );
        }

        try {
            return JSON.parse(cleanJson(rawText));
        } catch (_) {
            throw new Error('Gemini yanıtı beklenen JSON biçiminde değil.');
        }
    }

    function validateOptimization(data, oldTitle) {
        if (!data || typeof data !== 'object') {
            throw new Error('Gemini yanıtında optimize edilmiş başlık bulunamadı.');
        }

        const newTitle = normalizeTitle(data.new_title);
        if (!newTitle) throw new Error('Gemini boş bir başlık döndürdü.');
        if (newTitle.length > 140) {
            throw new Error(`Gemini başlığı 140 karakter sınırını aştı (${newTitle.length}).`);
        }

        const retentionRatio = getRetentionRatio(oldTitle, newTitle);
        if (retentionRatio < 0.7) {
            throw new Error(
                `Gemini mevcut kelimelerin yalnızca %${Math.round(retentionRatio * 100)} kadarını koruduğu için sonuç uygulanmadı.`
            );
        }

        let confidence = Number(data.confidence);
        if (confidence > 1 && confidence <= 100) confidence /= 100;
        if (!Number.isFinite(confidence)) confidence = 0;
        confidence = Math.min(1, Math.max(0, confidence));

        const allowedChangeTypes = new Set(['none', 'micro', 'light']);
        const changeType = allowedChangeTypes.has(data.change_type) ? data.change_type : 'none';

        return { newTitle, confidence, changeType };
    }

    function setButtonBusy(button, busy) {
        button.disabled = busy;
        button.textContent = busy ? CONFIG.busyButtonText : CONFIG.idleButtonText;
        button.setAttribute('aria-busy', String(busy));
    }

    async function optimizeTitle(button) {
        if (isProcessing) return;

        const input = getTitleInput();
        const oldTitle = normalizeTitle(input?.value);
        if (!input || !oldTitle) {
            showToast('Önce Etsy başlık alanına bir başlık yazın.', 'warning');
            return;
        }

        const apiKey = await getApiKey();
        if (!apiKey) {
            showToast('Önce Tampermonkey menüsünden Gemini API anahtarını ayarlayın.', 'warning', 6000);
            return;
        }

        isProcessing = true;
        setButtonBusy(button, true);

        try {
            const responseText = await requestGemini(apiKey, buildPayload(oldTitle));
            const result = validateOptimization(parseGeminiResponse(responseText), oldTitle);

            if (!input.isConnected || getTitleInput() !== input) {
                throw new Error('Etsy başlık alanı işlem sırasında değişti; sonuç uygulanmadı.');
            }

            if (normalizeTitle(input.value) !== oldTitle) {
                throw new Error('Başlık siz beklerken değiştirildi; Gemini sonucu uygulanmadı.');
            }

            if (result.newTitle === oldTitle) {
                showToast('Başlık zaten uygun görünüyor; değişiklik yapılmadı.', 'info');
                return;
            }

            setControlledInputValue(input, result.newTitle);

            const changeLabels = {
                none: 'değişiklik yok',
                micro: 'çok küçük değişiklik',
                light: 'hafif değişiklik'
            };
            showToast(
                `Başlık optimize edildi (${changeLabels[result.changeType]}, model güveni %${Math.round(result.confidence * 100)}).`,
                'success',
                6000
            );
            console.info('✨ GEM başlık optimizasyonu tamamlandı', {
                oldTitle,
                newTitle: result.newTitle,
                changeType: result.changeType,
                confidence: result.confidence
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Başlık optimize edilirken bilinmeyen bir hata oluştu.';
            console.error('❌ GEM başlık optimizasyonu başarısız', error);
            showToast(message, 'error', 8000);
        } finally {
            isProcessing = false;
            if (button.isConnected) setButtonBusy(button, false);
        }
    }

    function createButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `wt-btn wt-btn--small wt-btn--secondary ${CONFIG.buttonClass}`;
        button.textContent = CONFIG.idleButtonText;
        button.setAttribute('aria-busy', 'false');
        button.addEventListener('click', () => optimizeTitle(button));
        return button;
    }

    function mount() {
        const input = getTitleInput();
        if (!input?.isConnected) return;

        const wrapper = input.closest('.wt-mb-xs-2, .wt-mb-xs-3') || input.parentElement;
        if (!wrapper || wrapper.querySelector(`.${CONFIG.buttonClass}`)) return;

        wrapper.prepend(createButton());
    }

    function scheduleMount() {
        if (mountTimer) window.clearTimeout(mountTimer);
        mountTimer = window.setTimeout(() => {
            mountTimer = null;
            mount();
        }, 100);
    }

    const observer = new MutationObserver(scheduleMount);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('popstate', scheduleMount);
    window.addEventListener('pageshow', scheduleMount);
    scheduleMount();
})();
