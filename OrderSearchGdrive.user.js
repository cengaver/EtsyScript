// ==UserScript==
// @name         Etsy Order search gdrive
// @namespace    https://github.com/cengaver
// @version      1.6
// @description  Order Search Gdrive
// @author       Cengaver
// @match        https://www.etsy.com/your/orders/sold/*
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/OrderSearchGdrive.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/OrderSearchGdrive.user.js
// ==/UserScript==

(function() {
    'use strict';

    const defaultPath = `C:\\Users\\Aile\\Desktop\\HC\\order\\Custom\\`;

    async function setPath() {
        const currentPath = await GM.getValue("filePath", defaultPath);
        const newPath = prompt(
            "Lütfen dosya yolu girin:",
            currentPath
        );
        if (newPath !== null) {
            await GM.setValue("filePath", currentPath);
            alert("Yol kaydedildi!");
        }
    }

    async function addIconNextToOrderNo() {
        const orderNoElement = document.querySelector("#dg-tabs-preact__tab-1--default_wt_tab_panel > div > div.mt-xs-6 > div.col-group.col-flush > h4")
        //const orderNoElement = document.querySelector('#order-detail-container > div.pt-xs-2.pb-xs-4 > div > div > div.col-group.col-flush > h4');
        if (orderNoElement) {
            const orderNo = orderNoElement.textContent.trim().replace("Receipt #", "");
            if (orderNo && !document.querySelector('.gdrive-icon')) {
                const gdriveSearchUrl = `https://dashboard.k8s.customhub.io/orders/order-search?q=${orderNo}`;
                const linkElement = document.createElement('a');
                linkElement.href = gdriveSearchUrl;
                linkElement.target = "_blank";
                linkElement.className = 'gdrive-icon'; // Aynı simgenin tekrar eklenmemesi için

                const imgElement = document.createElement('img');
                imgElement.src = 'data:image/png;base64,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';
                imgElement.alt = 'Hub';
                imgElement.style.width = '24px';
                imgElement.style.height = '24px';
                imgElement.style.marginLeft = '10px'; // Simgeyi order numarasının yanına koymak için biraz boşluk bırakın

                linkElement.appendChild(imgElement);

                const copyButton = document.createElement('button');
                copyButton.textContent = 'Kopyala';
                copyButton.addEventListener('click', function(e) {
                    navigator.clipboard.writeText(orderNo).then(() => {
                        e.target.style.backgroundColor = "red"
                        //alert('Order numarası kopyalandı: ' + orderNo);
                    });
                });
                orderNoElement.parentNode.insertBefore(copyButton, orderNoElement.nextSibling);
                orderNoElement.appendChild(linkElement);
            }
        }
    }

    async function addIconNextToSkuNo() {
        const rows = document.querySelectorAll("#dg-tabs-preact__tab-1--default_wt_tab_panel > div > div.mt-xs-6 > div.panel.mb-xs-0.text-smaller.p-xs-4 > table > tbody > tr")
        //const rows = document.querySelectorAll('#order-detail-container > div.pt-xs-2.pb-xs-4 > div > div > div.panel.mb-xs-0.text-smaller.p-xs-4 > table > tbody > tr.col-group.pl-xs-0.pt-xs-3.pr-xs-0.pb-xs-3.bb-xs-1');
         const filePath = await GM.getValue("filePath", defaultPath);
        rows.forEach(addIcon)
        function addIcon(rowEl) {
            if (rowEl.dataset.gdAdded) return
            const skuNoElement = rowEl.querySelector('td.col-xs-6.pl-xs-0 > div.flag > div.flag-body.prose > div > span > p > span');
            if (skuNoElement) {
                const skuNo = skuNoElement.textContent.trim();

                const gdriveSearchUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(skuNo)}`;
                const folderUrl = `${filePath}${skuNo}`;
                const linkElement = document.createElement('a');
                const linkElement2 = document.createElement('a');
                linkElement.href = gdriveSearchUrl;
                linkElement2.href = folderUrl;
                linkElement.target = "_blank";
                linkElement2.target = "_blank";
                linkElement.className = 'gdrive-icon2'; // Prevents duplicate icons
                linkElement2.className = 'folder2'; // Prevents duplicate icons
                const imgElement = document.createElement('img');
                const imgElement2 = document.createElement('img');
                imgElement.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAB+klEQVR4AWJwL/ChKx68ForXW7SJN1iswYb5GyxaqGqhycrgR+rTAKzUA2hoURwG8Cn3bL/wbNuIz7Y5p9kOY57NMBvZs23bPtt/dW7b4VR94ep3v6OHaJvFJSoaZldQROB+hDJValcFPBj20vB82AsEAYCVyTT1uUykaWitGAQIB1oy22WoKOhKQMCCMKa0dLypYN9dTs7HcMvg5YCAHQKAzLmwpwpYGbORBHH2LAfMY4G4JdmOaJkvBQnsMQ+DHAl5MTSeqjaMASaarvZ00SB8UATCyp1OVzMWgfBDiwLhY7J2+Nn5LScyVCkUfkoI3nLqWivAcB7j52HYSISMEJz9WIwEyyE/AAtEBJLbRLoNiBxigIcVgDO08AwFwnkpwfx4Sx1aSFrmLwAvRDz+BBtaFB6Gg9txA9sEg6d9NLNO+/5HvFz0sXXardmy567d4CFW4F5V1BuXiUgVNBa5jpdEBdz2vTRy2/cyxMtduyFpTjtMotobD1D75Yvs3LjopYDwh9v/5CNWrtsOSjGc/8bFqP/mHtRx7zyVodP7tisgZMeffB8SO6xfLYeIlllvTSkM2jH34UraQeB5VkvexoeWWsttR7bEaPu9Cz95IEZbAVw8wm461+7uuXrp4Q0L6LxxS/NKQQ+t2HpYKEKQPMhXkpkNqoYwXTEA+kphQitc/vYAAAAASUVORK5CYII=';
                imgElement2.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAACxAAAAsQHGLUmNAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAjlJREFUSIntlc9LVFEUxz/3+aZxSq3AoB9ERItKlH4R5SoicpFBLiooiKBNiIuW/gUiEhREiyKoaBEiQkVTSRAlNRqW1MKJCtGKmMxszLF0Zt5997R4b0bGGMN6Sw887vfcd+7nyz3wzoOF+EuoFctKTp08ELq4tExFlPi74okvY2a847Fu+zZhzgLmnwzOHC1NtTZGypX4YBFmNLz/7NJ4Pt0bG3AbgNH5GtgVZWpxMTgIG9co7rdEai/cyn568da8msrIz/zp3I0xGMG8HpLO5CRXCgzmgitfl4aE5iOhMCK7C+rAP+fVdfWbuoMtOg705A1EBK2LwwuNi8MRYecGBVA1ywBcPQO/FIWR7GYipWHAgBh/lVm5QYnx+iReLmJoOibnbCWtX5PTyfauxGlbDDjagMCbDy5ra47T3LADxPEe44Do+ehyRJcjTmVFhHbLaxFoV4j2hThcv+V/4AXaLhGvRVoLGEGV1bDIlkDgjpPlQU+y0za+wct3LnV7twYCRxwePh9jOJG5ZmG8FnUPRNiza10gcERz58n3UaDfEoFM1lCxshrbcgOBp9MZ7sUmrgNYItAbN9Tvqw4EjnGIPk2SGMve8A2EvsEl1G5bHQgccbj77MdHIA5guRpWra9GoQOBT/7KEo2lrua+ZGt4xKhD+zcFAkc0t7vHSabMzbxBmuVqe1VlIHCMQ8ejVAIYzM+iaR2Wtssxhbh4c8ZfxfVnTi7PvSteFx+a1tGeqRNz/R8W4o/4Ddknz9PJEJdpAAAAAElFTkSuQmCC';
                imgElement.alt = 'Google Drive';
                imgElement2.alt = 'Folder';
                imgElement.style.width = '24px';
                imgElement2.style.width = '24px';
                imgElement.style.height = '24px';
                imgElement2.style.height = '24px';
                imgElement.style.marginLeft = '10px'; // Space between SKU and icon
                imgElement2.style.marginLeft = '10px'; // Space between Folder and icon
                linkElement.appendChild(imgElement);
                linkElement2.appendChild(imgElement2);
                const copyButton = document.createElement('button');
                copyButton.textContent = 'Kopyala';
                copyButton.addEventListener('click', function(e) {
                    navigator.clipboard.writeText(folderUrl).then(() => {
                        e.target.style.backgroundColor = "aqua"
                        //alert('Order numarası kopyalandı: ' + folderUrl);
                    });
                });
                skuNoElement.parentNode.insertBefore(copyButton, skuNoElement.nextSibling);
                skuNoElement.appendChild(linkElement);
                skuNoElement.appendChild(linkElement2);
            }

            rowEl.dataset.gdAdded = true
        }
    }

    GM.registerMenuCommand("Dosya Yolu Ayarla", setPath);

    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            addIconNextToOrderNo();
            addIconNextToSkuNo();
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
