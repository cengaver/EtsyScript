// ==UserScript==
// @name         Open Links Sequentially for ETSY Dashboard favorited people profile link
// @version      1.2
// @description  Open all matching links with a 3-second delay
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/dashboard?ref=seller-platform-mcnav
// @icon         https://www.google.com/s2/favicons?sz=64&domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/openLinksSequentiallyFav.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/openLinksSequentiallyFav.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function openLinks() {
        const favHrefs = [...document.querySelectorAll("#recent-activity-content-region > ul > li")]
        .filter(li => li.querySelector("span.wt-icon--smallest.etsy-icon"))
        .map(li => li.querySelector('a[data-testid="username"]')?.href);
        const links = [...new Set(favHrefs)];

        links.forEach((link, index) => {
            setTimeout(() => {
                console.log(link)
                window.open(link, '_blank');
            }, index * 2000);
        });
    }

    function clickUntilButtonDisappears(interval = 3000) {
        const intervalId = setInterval(() => {
            const button = document.querySelector("#recent-activity-content-region > div > div > span > button");
            if (button) {
                button.click();
            } else {
                clearInterval(intervalId);
                console.log("Buton kayboldu, tıklama işlemi durduruldu.");
            }
        }, interval);
    }

    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.altKey) {
            openLinks();
            console.log("yeni sekmeler çalıştı")
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.code === "Space") {
            clickUntilButtonDisappears();
            console.log("more clicked")
        }
    });

    const observer = new MutationObserver(() => {
        console.log("DOM changed, rechecking links...");
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
