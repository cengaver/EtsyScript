// ==UserScript==
// @name         Open Links Sequentially for ETSY ad
// @version      1.20
// @description  Open all matching links with a 1-second delay
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/advertising?ref=seller-platform-mcnav
// @icon         https://www.google.com/s2/favicons?sz=64&domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/openLinksSequentially.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/openLinksSequentially.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function colorRoas() {
        const roassEl = document.querySelectorAll("#listings-header > table > tbody > tr");
        roassEl.forEach((roas, index) => {
            setTimeout(() => {
                const roasValue = Number(roas.querySelector("td:nth-child(10) > span")?.textContent.trim() || 0);
                if (roasValue < 2){
                    roas.style.backgroundColor = "#ffa59e";
                }else{
                    roas.style.backgroundColor = "";
                }
                //console.log(roas);
            }, index * 400);
        });
    }

    function openLinks(mod) {
        //const links = document.querySelectorAll("#listings-header > table > tbody > tr > td.wt-table__row__cell.wt-pr-xs-3.wt-text-left-xs.wt-table__row__cell.wt-display-table-cell.wt-pt-xs-2.wt-pb-xs-2.wt-no-wrap > div.wt-pt-xs-1.wt-display-flex-xs > div > a")
        //const links = document.querySelectorAll("#manage_advertised_listings_wt_tab_panel > div > table > tbody > tr > td.wt-table__row__cell.wt-pr-xs-3.wt-text-left-xs.wt-table__row__cell.wt-display-table-cell.wt-pt-xs-2.wt-pb-xs-2.wt-no-wrap > div.wt-pt-xs-1.wt-display-flex-xs > div > a");
        const timer = mod==1?200000:80000
        const links = document.querySelectorAll("#listings-header > table > tbody > tr > td.wt-table__row__cell.wt-pr-xs-3.wt-text-left-xs.wt-table__row__cell.wt-display-table-cell.wt-pt-xs-2.wt-pb-xs-2.wt-z-index-1 > div > div > a")
        links.forEach((link, index) => {
            setTimeout(() => {
                console.log(`${link.href}&mod=${mod}`)
                window.open(`${link.href}&mod=${mod}`, '_blank');
            }, index * timer);
        });
    }

    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.altKey) {
            openLinks(0);
            console.log("yeni sekmeler çalıştı")
        }
        if (event.ctrlKey && event.code === "Space") {
            openLinks(1);
            console.log("yeni sekmeler çalıştı")
        }
    });

    window.addEventListener("load", async () => {
        colorRoas();
    })

    const observer = new MutationObserver(() => {
        colorRoas();
        console.log("DOM changed, rechecking links...");
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
