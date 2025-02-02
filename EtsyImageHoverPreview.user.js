// ==UserScript==
// @name         Etsy Image Hover Preview
// @namespace    https://github.com/cengaver
// @version      1.1
// @description  show large image preview on hover
// @author       Cengaver
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @match        https://www.etsy.com/your/shops/me/advertising*
// @match        https://www.etsy.com/your/shops/me/dashboard*
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyImageHoverPreview.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyImageHoverPreview.user.js
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
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
    max-width: 200px;
    max-height: 200px;
  }
`);

(function() {
    let previewDiv;

    function createPreview() {
        previewDiv = document.createElement('div');
        previewDiv.className = 'hover-preview';
        document.body.appendChild(previewDiv);
    }

    function showPreview(event, imgUrl) {
        if (!previewDiv) createPreview();
        previewDiv.innerHTML = `<img src="${imgUrl}" alt="Preview">`;
        previewDiv.style.display = 'block';
        previewDiv.style.left = `${event.pageX + 10}px`;
        previewDiv.style.top = `${event.pageY + 10}px`;
    }

    function hidePreview() {
        if (previewDiv) previewDiv.style.display = 'none';
    }

    function handleHover(event) {
        const target = event.target;
        if (target.tagName === 'IMG') {
            const largeImgUrl = target.src.replace('75x75', '200x200');
            showPreview(event, largeImgUrl);
        }
    }

    document.addEventListener('mouseover', handleHover);
    document.addEventListener('mousemove', (e) => {
        if (previewDiv && previewDiv.style.display === 'block') {
            previewDiv.style.left = `${e.pageX + 10}px`;
            previewDiv.style.top = `${e.pageY + 10}px`;
        }
    });
    document.addEventListener('mouseout', hidePreview);
})();
