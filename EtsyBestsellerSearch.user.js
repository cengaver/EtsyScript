// ==UserScript==
// @name         Etsy Bestseller search
// @version      2024-11-15
// @description  Best seller search for Etsy
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/search*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        none
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyBestsellerSearch.user.js    
// ==/UserScript==

(function() {
    // URL parametrelerini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const isBestSellerParam = urlParams.get('is_best_seller');

    if (!isBestSellerParam) {
        // Parametre yoksa yeni div'i oluştur ve ekle
        const targetDiv = document.querySelector('div[data-active-filters=""]');

        const newDiv = document.createElement('div');
        newDiv.className = "wt-action-group wt-list-inline child-mb-xs-1 child-mr-xs-1 wt-pb-xs-1";
        newDiv.innerHTML = `
            <div class="">
                <div class="wt-action-group__item-container">
                    <a href="${window.location.href}&is_best_seller=true"
                       class="wt-btn wt-action-group__item wt-btn--small wt-display-flex-xs wt-align-items-center"
                       data-filter-tag-close-link="1" aria-label="Bestseller Filter">Bestseller</a>
                </div>
            </div>
        `;

        targetDiv.appendChild(newDiv);

        // URL'ye is_best_seller=true parametresini ekle
        //urlParams.set('is_best_seller', 'true');
        //const newUrl = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`;
        //window.history.replaceState({}, '', newUrl);
    }
})();
