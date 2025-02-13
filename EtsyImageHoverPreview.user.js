// ==UserScript==
// @name         Etsy Image Hover Preview
// @namespace    https://github.com/cengaver
// @version      1.4
// @description  Show large image preview on hover, supports lazy loading
// @author       Cengaver
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @match        https://www.etsy.com/your/shops/me/advertising*
// @match        https://www.etsy.com/your/shops/me/dashboard*
// @match        https://ehunt.ai/etsy-product-research
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyImageHoverPreview.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyImageHoverPreview.user.js
// @grant        GM_addStyle
// ==/UserScript==

(() => {
    function addPreviews(win) {
        const styleTag = document.createElement("style")
        styleTag.innerHTML = `
.hover-preview {
    position: absolute;
    z-index: 1000;
    border: 2px solid #ccc;
    background: #fff;
    padding: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    display: none;
}
.hover-preview img {
    max-width: 300px;
    max-height: 300px;
}
`
        win.document.head.appendChild(styleTag)

        let previewDiv;

        function createPreview() {
            previewDiv = win.document.createElement('div');
            previewDiv.className = 'hover-preview';
            win.document.body.appendChild(previewDiv);
        }

        function showPreview(event, imgUrl) {
            if (!previewDiv) createPreview();
            previewDiv.innerHTML = `<img src="${imgUrl}" alt="Preview">`;
            previewDiv.style.display = 'block';
            previewDiv.style.left = `${event.pageX + 15}px`;
            previewDiv.style.top = `${event.pageY + 15}px`;
        }

        function hidePreview() {
            if (previewDiv) previewDiv.style.display = 'none';
        }

        function handleHover(event) {
            const target = event.target;
            if (target.tagName === 'IMG') {
                // Use data-src if available (for lazy loading), otherwise use src
                let imgUrl = target.getAttribute('data-src') || target.src;
                if (imgUrl) {
                    let largeImgUrl = imgUrl.replace('75x75', '400x400');
                    largeImgUrl = largeImgUrl.replace(/il_\d+xN/, 'il_400xN');
                    showPreview(event, largeImgUrl);
                }
            }
        }

        function attachHoverListeners() {
            win.document.addEventListener('mouseover', handleHover);
            win.document.addEventListener('mousemove', (e) => {
                if (previewDiv && previewDiv.style.display === 'block') {
                    previewDiv.style.left = `${e.pageX + 15}px`;
                    previewDiv.style.top = `${e.pageY + 15}px`;
                }
            });
            win.document.addEventListener('mouseout', hidePreview);
        }

        // Initial attachment of listeners
        attachHoverListeners();

        /*if (win.location.href.includes("ehunt.ai")) {
            observeDynamicContent();
        }*/
    }

    function onLoaded(doc, fn) {
        if (doc.readyState == 'loading') {
            doc.addEventListener("DOMContentLoaded", fn);
        } else {
            fn()
        }
    }

    function main() {
        addPreviews(window)

        let processedDocuments = []
        function processIframeWindows() {
            const iframes = document.querySelectorAll("iframe")
            for (const iframe of iframes) {
                const win = iframe.contentWindow

                onLoaded(win.document, () => {
                    if (!processedDocuments.includes(win.document)){
                        addPreviews(win)
                        processedDocuments.push(win.document)
                    }
                })
            }
        }
        processIframeWindows()

        new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    processIframeWindows()
                }
            });
        }).observe(document.body, { subtree: true, childList: true });
    }

    onLoaded(document, main)
})();
