// ==UserScript==
// @name         Etsy Listing
// @namespace    https://github.com/cengaver
// @version      0.2
// @description  Listing creator and copy
// @author       Cengaver
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @match        https://www.etsy.com/your/shops/me/listing-editor/edit*
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyListing.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyListing.user.js
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Toast bildirimi için CSS ekle
    GM_addStyle(`
        .toast {
            visibility: hidden;
            min-width: 250px;
            background-color: #4CAF50;
            color: white;
            text-align: center;
            border-radius: 5px;
            padding: 16px;
            position: fixed;
            z-index: 1001;
            bottom: 50px;
            right: 20px;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.5s, visibility 0.5s;
        }

        .toast.show {
            visibility: visible;
            opacity: 1;
        }
    `);

    // Toast bildirimi gösteren fonksiyon
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = message;
        document.body.appendChild(toast);

        // Toast'u göster
        setTimeout(() => toast.classList.add('show'), 100);

        // Toast'u gizle ve kaldır
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // Butonu oluştur ve sayfaya ekle
    function addCopyButton() {
        const button = document.createElement('button');
        button.innerText = 'Copy Title & Tags';
        button.style.position = 'fixed';
        button.style.top = '40px';
        button.style.right = '20px';
        button.style.zIndex = 1000;
        button.style.padding = '10px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';

        button.addEventListener('click', function() {
            // Başlığı al
            const title = document.querySelector('#listing-title-input').value;

            // Etiketleri topla
            const tagElements = document.querySelectorAll('.le-pill.wt-mb-xs-1.le-pill--icon');
            const tags = Array.from(tagElements).map(tag => tag.childNodes[0].textContent.trim()).join(', ');

            // Başlık ve etiketleri birleştir
            const textToCopy = `Title: ${title}\nTags: ${tags}`;

            // Panoya kopyala
            navigator.clipboard.writeText(textToCopy).then(function() {
                showToast('Başlık ve etiketler kopyalandı!');
            }).catch(function(err) {
                console.error('Kopyalama işlemi başarısız oldu: ', err);
                showToast('Kopyalama işlemi başarısız oldu!');
            });
        });

        document.body.appendChild(button);
    }

    // Sayfa yüklendiğinde butonu ekle
    window.addEventListener('load', addCopyButton);
})();
