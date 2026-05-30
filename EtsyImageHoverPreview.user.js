// ==UserScript==
// @name         Etsy Image Hover Preview
// @namespace    https://github.com/cengaver
// @version      2.00
// @description  Show large image preview on hover, supports lazy loading — Optimized v2
// @author       Cengaver
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @match        https://www.etsy.com/your/shops/me/advertising*
// @match        https://www.etsy.com/your/shops/me/dashboard*
// @match        https://*.customhub.io/p/batch/*
// @match        https://www.etsy.com/people/*
// @match        https://ehunt.ai/*
// @match        https://erank.com/*
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyImageHoverPreview.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyImageHoverPreview.user.js
// @grant        GM.addStyle
// ==/UserScript==

(() => {
    'use strict';

    // ─────────────────────────────────────────────
    // STYLES — injected once via GM.addStyle
    // ─────────────────────────────────────────────
    GM.addStyle(`
        .ehp-preview {
            position: fixed;
            z-index: 2147483647;
            border: 2px solid #ccc;
            background: #fff;
            padding: 5px;
            box-shadow: 0 4px 16px rgba(0,0,0,.4);
            border-radius: 4px;
            pointer-events: none;
            display: none;
            transition: opacity .1s ease;
        }
        .ehp-preview img {
            display: block;
            max-width: 300px;
            max-height: 300px;
            object-fit: contain;
        }
    `);

    // ─────────────────────────────────────────────
    // PREVIEW ELEMENT — single singleton for the page
    // ─────────────────────────────────────────────
    let preview = null;

    function getPreview() {
        if (!preview) {
            preview = document.createElement('div');
            preview.className = 'ehp-preview';
            const img = document.createElement('img');
            img.alt = 'Preview';
            preview.appendChild(img);
            document.body.appendChild(preview);
        }
        return preview;
    }

    // ─────────────────────────────────────────────
    // URL TRANSFORM — upscale thumbnail to ~400px
    // ─────────────────────────────────────────────
    function getLargeUrl(url) {
        return url
            .replace(/\b75x75\b/,  '400x400')
            .replace(/\b80x80\b/,  '400x400')
            .replace(/il_\d+xN/,   'il_400xN');
    }

    // ─────────────────────────────────────────────
    // POSITION — keep preview inside viewport
    // Using `position:fixed` so we work in terms of clientX/Y, not pageX/Y
    // ─────────────────────────────────────────────
    const OFFSET = 16;
    function positionPreview(e) {
        const p   = getPreview();
        const vw  = window.innerWidth;
        const vh  = window.innerHeight;
        const pw  = p.offsetWidth  || 310;
        const ph  = p.offsetHeight || 310;
        const x   = e.clientX + OFFSET + pw > vw ? e.clientX - pw - OFFSET : e.clientX + OFFSET;
        const y   = e.clientY + OFFSET + ph > vh ? e.clientY - ph - OFFSET : e.clientY + OFFSET;
        p.style.left = Math.max(4, x) + 'px';
        p.style.top  = Math.max(4, y) + 'px';
    }

    // ─────────────────────────────────────────────
    // EVENT HANDLERS — delegated on document (single listeners)
    // ─────────────────────────────────────────────
    document.addEventListener('mouseover', e => {
        const t = e.target;
        if (t.tagName !== 'IMG') return;

        const raw = t.getAttribute('data-src') || t.src || '';
        if (!raw || raw.startsWith('data:')) return; // skip inline/placeholder

        const p   = getPreview();
        const img = p.querySelector('img');
        img.src = getLargeUrl(raw);
        positionPreview(e);
        p.style.display = 'block';
    }, { passive: true });

    document.addEventListener('mousemove', e => {
        if (preview?.style.display === 'block') positionPreview(e);
    }, { passive: true });

    document.addEventListener('mouseout', e => {
        if (e.target.tagName === 'IMG' && preview) {
            preview.style.display = 'none';
        }
    }, { passive: true });

    // ─────────────────────────────────────────────
    // IFRAME SUPPORT
    //
    // Cross-origin iframes throw SecurityError when accessing .document.
    // We guard every access inside try/catch and skip silently.
    // Same-origin iframes (e.g. customhub.io internal) still get previews.
    // ─────────────────────────────────────────────
    const _processedDocs = new WeakSet();

    function tryAddToIframe(iframe) {
        let win, doc;
        try {
            win = iframe.contentWindow;
            doc = win?.document; // throws on cross-origin
        } catch { return; } // cross-origin — skip silently

        if (!doc || _processedDocs.has(doc)) return;
        _processedDocs.add(doc);

        const inject = () => {
            // Delegate on the iframe's document — same pattern as main page
            doc.addEventListener('mouseover', e => {
                const t = e.target;
                if (t.tagName !== 'IMG') return;
                const raw = t.getAttribute('data-src') || t.src || '';
                if (!raw || raw.startsWith('data:')) return;
                const p   = getPreview(); // still the main-page singleton
                p.querySelector('img').src = getLargeUrl(raw);
                positionPreview(e);
                p.style.display = 'block';
            }, { passive: true });

            doc.addEventListener('mousemove', e => {
                if (preview?.style.display === 'block') positionPreview(e);
            }, { passive: true });

            doc.addEventListener('mouseout', e => {
                if (e.target.tagName === 'IMG' && preview) preview.style.display = 'none';
            }, { passive: true });
        };

        if (doc.readyState === 'loading') {
            doc.addEventListener('DOMContentLoaded', inject, { once: true });
        } else {
            inject();
        }
    }

    function scanIframes() {
        document.querySelectorAll('iframe').forEach(tryAddToIframe);
    }

    // Debounce iframe scanning — MutationObserver fires very frequently
    let _iframeTimer = null;
    new MutationObserver(() => {
        clearTimeout(_iframeTimer);
        _iframeTimer = setTimeout(scanIframes, 300);
    }).observe(document.body, { childList: true, subtree: true });

    scanIframes(); // initial pass

})();
