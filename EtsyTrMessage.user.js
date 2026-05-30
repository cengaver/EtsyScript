// ==UserScript==
// @name         Etsy Message Translator (Hover Translate)
// @namespace    https://github.com/cengaver
// @version      2.0.0
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
    'use strict';

    // ─── Settings cache (loaded once, updated on menu change) ────────────────

    const settings = {
        apiKey:          '',
        translator:      'deepl',
        alwaysTranslate: false,
        deeplPro:        false,
    };

    async function loadSettings() {
        [
            settings.apiKey,
            settings.translator,
            settings.alwaysTranslate,
            settings.deeplPro,
        ] = await Promise.all([
            GM.getValue('deepl_api_key',    ''),
            GM.getValue('translator',       'deepl'),
            GM.getValue('always_translate', false),
            GM.getValue('deepl_pro',        false),
        ]);
    }

    // ─── Menu commands ────────────────────────────────────────────────────────

    GM.registerMenuCommand('🔑 DeepL API Key Ayarla', async () => {
        const key = prompt('DeepL API Key\'inizi girin:');
        if (!key?.trim()) return;
        settings.apiKey = key.trim();
        await GM.setValue('deepl_api_key', settings.apiKey);
        alert('✅ Kaydedildi.');
    });

    GM.registerMenuCommand('🌐 Çeviri Servisi Seç (deepl / google)', async () => {
        const choice = prompt('Kullanmak istediğiniz servisi yazın: deepl veya google');
        if (choice !== 'deepl' && choice !== 'google') {
            alert('Geçerli bir değer girin: deepl veya google');
            return;
        }
        settings.translator = choice;
        await GM.setValue('translator', choice);
        alert('✅ Seçilen servis: ' + choice);
    });

    GM.registerMenuCommand('⚙️ Her zaman çeviri yap (Açık/Kapalı)', async () => {
        settings.alwaysTranslate = !settings.alwaysTranslate;
        await GM.setValue('always_translate', settings.alwaysTranslate);
        alert(`🔁 Her zaman çeviri yap: ${settings.alwaysTranslate ? 'Açık' : 'Kapalı'}`);
    });

    GM.registerMenuCommand('⚙️ DeepL Pro (Açık/Kapalı)', async () => {
        settings.deeplPro = !settings.deeplPro;
        await GM.setValue('deepl_pro', settings.deeplPro);
        alert(`🔁 Pro olarak çeviri yap: ${settings.deeplPro ? 'Açık' : 'Kapalı'}`);
    });

    // ─── Translation (Promise-based) ──────────────────────────────────────────

    function xmlRequest(options) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                ...options,
                onload:  (res) => resolve(res),
                onerror: (err) => reject(err),
            });
        });
    }

    async function translateText(text, targetLang) {
        const cacheKey = `tr_${targetLang}_${text}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return cached;

        let result;

        try {
            if (settings.translator === 'google') {
                const res  = await xmlRequest({
                    method: 'GET',
                    url: `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
                });
                const data = JSON.parse(res.responseText);
                result = data[0].map(seg => seg[0]).join('');
            } else {
                if (!settings.apiKey) {
                    alert('⚠️ Lütfen menüden DeepL API Key girin.');
                    return null;
                }
                const url = settings.deeplPro
                    ? 'https://api.deepl.com/v2/translate'
                    : 'https://api-free.deepl.com/v2/translate';

                const res  = await xmlRequest({
                    method: 'POST',
                    url,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: `auth_key=${settings.apiKey}&text=${encodeURIComponent(text)}&target_lang=${targetLang}`,
                });
                const json = JSON.parse(res.responseText);
                result = json.translations[0].text;
            }
        } catch (e) {
            console.error('[EtsyTranslator] çeviri hatası:', e);
            return null;
        }

        if (result) {
            pruneSessionStorage();
            sessionStorage.setItem(cacheKey, result);
        }
        return result;
    }

    function pruneSessionStorage(maxEntries = 300) {
        const keys = Object.keys(sessionStorage).filter(k => k.startsWith('tr_'));
        if (keys.length > maxEntries) {
            keys.slice(0, keys.length - maxEntries).forEach(k => sessionStorage.removeItem(k));
        }
    }

    // ─── Tooltip ──────────────────────────────────────────────────────────────

    let _tooltip = null;

    function showTooltip(text, anchorEl) {
        if (!_tooltip) {
            _tooltip = document.createElement('div');
            _tooltip.id = 'et-translate-tooltip';
            Object.assign(_tooltip.style, {
                position:     'absolute',
                background:   '#fff',
                border:       '1px solid #ccc',
                padding:      '6px 10px',
                borderRadius: '8px',
                boxShadow:    '0 2px 8px rgba(0,0,0,.2)',
                fontSize:     '14px',
                maxWidth:     '500px',
                zIndex:       '10000',
                pointerEvents:'none',
            });
            document.body.appendChild(_tooltip);
        }

        _tooltip.textContent = text;
        _tooltip.style.display = 'block';

        // Position after paint so offsetHeight is accurate
        requestAnimationFrame(() => {
            const rect = anchorEl.getBoundingClientRect();
            _tooltip.style.left = (window.scrollX + rect.left) + 'px';
            _tooltip.style.top  = (window.scrollY + rect.top - _tooltip.offsetHeight - 8) + 'px';
        });

        // Auto-dismiss after 10s
        clearTimeout(_tooltip._timer);
        _tooltip._timer = setTimeout(hideTooltip, 10_000);
    }

    function hideTooltip() {
        if (_tooltip) _tooltip.style.display = 'none';
    }

    // Single document-level click listener to dismiss tooltip (registered once)
    document.addEventListener('click', (e) => {
        if (_tooltip && e.target !== _tooltip) hideTooltip();
    });

    // ─── Span hover binding ───────────────────────────────────────────────────

    function debounce(fn, ms) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    }

    function bindSpan(span) {
        if (span.dataset.etTranslatable || span.textContent.trim().length <= 2) return;
        span.dataset.etTranslatable = '1';

        const onEnter = debounce(async () => {
            const text = span.textContent.trim();
            if (!text) return;
            const result = await translateText(text, 'TR');
            if (result) showTooltip(result, span);
        }, 300);

        span.addEventListener('mouseenter', onEnter);
        span.addEventListener('mouseleave', hideTooltip);
    }

    function bindAllSpans(container, selector) {
        container.querySelectorAll(selector).forEach(bindSpan);
    }

    // ─── Container observation ────────────────────────────────────────────────

    const isSoldPage = () => window.location.href.includes('/your/orders/sold');

    function getContainerAndSelector() {
        if (isSoldPage()) {
            const c = document.querySelector('#dg-tabs-preact__tab-1--default_wt_tab_panel');
            return { container: c, selector: 'span' };
        }
        const c = document.querySelector('.msg-list-container');
        return { container: c, selector: 'span:not(.screen-reader-only)' };
    }

    // One persistent observer per container session
    let _containerObserver = null;
    let _observedContainer = null;

    function observeContainer(container, selector) {
        if (_containerObserver) _containerObserver.disconnect();
        _observedContainer = container;

        // Bind existing spans
        bindAllSpans(container, selector);

        // Bind new spans as they arrive
        _containerObserver = new MutationObserver(() => bindAllSpans(container, selector));
        _containerObserver.observe(container, { childList: true, subtree: true });
    }

    // Watch for the target container to appear (or reappear after SPA nav)
    const _containerWatcher = new MutationObserver(debounce(() => {
        const { container, selector } = getContainerAndSelector();
        if (container && container !== _observedContainer) {
            observeContainer(container, selector);
        }
    }, 250));

    _containerWatcher.observe(document.body, { childList: true, subtree: true });

    // ─── Translate button (inject into compose area) ──────────────────────────

    const GLOBE_SVG = `<svg width="22" height="22" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <style>.g{fill:none;stroke:#0F005B;stroke-width:8;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}</style>
        <ellipse class="g" cx="64" cy="64" rx="18.9" ry="44.3"/>
        <line class="g" x1="22.7" x2="105.3" y1="49.2" y2="49.2"/>
        <line class="g" x1="92.5" x2="22.7" y1="78.8" y2="78.8"/>
        <circle class="g" cx="64" cy="64" r="44.3"/>
    </svg>`;

    function injectTranslateButton(textarea, buttonContainer) {
        if (!textarea || !buttonContainer || textarea.dataset.etHasTranslator) return;
        textarea.dataset.etHasTranslator = '1';

        const btn = document.createElement('button');
        btn.type      = 'button';
        btn.title     = 'Translate to English';
        btn.innerHTML = GLOBE_SVG;
        Object.assign(btn.style, {
            marginLeft:  '8px',
            padding:     '4px',
            background:  'transparent',
            border:      'none',
            cursor:      'pointer',
            display:     'inline-flex',
            alignItems:  'center',
        });

        buttonContainer.appendChild(btn);

        btn.addEventListener('click', async () => {
            const original = textarea.value.trim();
            if (!original) return;
            btn.disabled = true;
            const translated = await translateText(original, 'EN');
            btn.disabled = false;
            if (!translated) return;
            textarea.value = translated;
            textarea.dispatchEvent(new Event('input',  { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    // ─── Compose area watcher ─────────────────────────────────────────────────

    // Selectors for the two textarea locations on Etsy
    const COMPOSE_VARIANTS = [
        {
            textareaSelector: 'textarea.new-message-textarea-min-height',
            buttonSelector:   'div.wt-p-xs-1.wt-p-md-2.wt-z-index-1.inline-compose-container > div:nth-child(1) > div > div:nth-child(2) > div > div:nth-child(1)',
        },
        {
            textareaSelector: 'textarea.textarea',
            buttonSelector:   '#dg-tabs-preact__tab-1--default_wt_tab_panel > div > div:nth-child(3) > div > div:nth-child(2) > div > div.display-flex-xs.justify-content-space-between.mt-xs-2 > div:nth-child(1)',
        },
    ];

    const _composeWatcher = new MutationObserver(debounce(() => {
        for (const { textareaSelector, buttonSelector } of COMPOSE_VARIANTS) {
            const ta  = document.querySelector(textareaSelector);
            const btn = document.querySelector(buttonSelector);
            if (ta && btn) {
                injectTranslateButton(ta, btn);
                break;
            }
        }
    }, 400));

    _composeWatcher.observe(document.body, { childList: true, subtree: true });

    // ─── Boot ─────────────────────────────────────────────────────────────────

    loadSettings().then(() => {
        // Fire once immediately in case the DOM is already ready
        const { container, selector } = getContainerAndSelector();
        if (container) observeContainer(container, selector);
    });

})();
