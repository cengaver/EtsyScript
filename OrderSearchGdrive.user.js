// ==UserScript==
// @name         Etsy Order search gdrive
// @namespace    https://github.com/cengaver
// @version      1.8
// @description  Order Search Gdrive
// @author       Cengaver
// @match        https://www.etsy.com/your/orders/sold/*
// @match        https://www.etsy.com/messages/*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @grant        GM.setClipboard
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM.addElement
// @grant        GM.getResourceText
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/OrderSearchGdrive.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/OrderSearchGdrive.user.js
// @run-at       document-en
// ==/UserScript==

(function() {
    'use strict';

    const defaultPath = `\\order\\Custom\\`;

    async function setPath() {
        const currentPath = await GM.getValue("filePath", defaultPath);
        const newPath = prompt("Lütfen dosya yolu girin:", currentPath);
        if (newPath !== null) {
            await GM.setValue("filePath", newPath);
            alert("Yol kaydedildi!");
        }
    }

    async function setImg() {
        const currentId = await GM.getValue("sheetID", "");
        const newId = prompt("Lütfen Sheet ID girin:", currentId);
        if (newId !== null) {
            await GM.setValue("sheetID", newId);
            alert("Yol kaydedildi!");
        }
    }

    async function addIconNextToOrderNo(selector) {
        const orderNoElement = selector?document.querySelector("#main-content > div > div.wt-grid.wt-overflow-hidden.wt-bt-xs.wt-width-full > div.wt-hide-xs.wt-show-md.wt-grid__item-xs-12.wt-grid__item-md-4.wt-grid__item-lg-3.wt-display-flex-md.wt-flex-direction-column-xs.wt-pl-xs-4.wt-pr-xs-3.wt-pt-xs-2 > div.buyer-info.wt-mt-xs-2 > div:nth-child(2) > div.wt-display-flex-xs.wt-justify-content-space-between > div"):document.querySelector("#dg-tabs-preact__tab-1--default_wt_tab_panel > div > div.mt-xs-6 > div.col-group.col-flush > h4");
        if (orderNoElement && !orderNoElement.dataset.gdAdded) {
            orderNoElement.dataset.gdAdded = "true";
            const orderNo = orderNoElement.textContent.match(/\d+/)[0];
            if (orderNo && !document.querySelector('.gdrive-icon')) {
                const gdriveSearchUrl = `https://dashboard.k8s.customhub.io/orders/order-search?q=${orderNo}`;
                const linkElement = document.createElement('a');
                linkElement.href = gdriveSearchUrl;
                linkElement.target = "_blank";
                linkElement.className = 'gdrive-icon';

                const imgElement = document.createElement('img');
                imgElement.src = 'data:image/png;base64,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';
                imgElement.alt = 'Hub';
                imgElement.style.width = '24px';
                imgElement.style.height = '24px';
                imgElement.style.marginLeft = '10px';
                linkElement.appendChild(imgElement);

                const copyButton = document.createElement('button');
                copyButton.textContent = 'Kopyala';
                copyButton.style.marginLeft = '10px';
                copyButton.addEventListener('click', function(e) {
                    navigator.clipboard.writeText(orderNo).then(() => {
                        e.target.style.backgroundColor = "red";
                    });
                });

                orderNoElement.parentNode.insertBefore(copyButton, orderNoElement.nextSibling);
                orderNoElement.appendChild(linkElement);
            }
        }
    }

    async function addIconNextToSkuNo() {
        const rows = document.querySelectorAll("#dg-tabs-preact__tab-1--default_wt_tab_panel > div > div.mt-xs-6 > div.panel.mb-xs-0.text-smaller.p-xs-4 > table > tbody > tr");
        const filePath = await GM.getValue("filePath", defaultPath);
        const userId = await GM.getValue("userId", 0);
        rows.forEach(async (rowEl) => {
            if (rowEl.dataset.gdAdded) return;

            const skuNoElement = rowEl.querySelector('td.col-xs-6.pl-xs-0 > div.flag > div.flag-body.prose > div > span > p > span');
            if (!skuNoElement || skuNoElement.dataset.gdAdded) return;

            skuNoElement.dataset.gdAdded = "true";
            const skuNo = skuNoElement.textContent.trim();
            const gdriveSearchUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(skuNo)}`;
            let id = await GM.getValue(skuNo, "");

            const copyButton = document.createElement('button');
            copyButton.textContent = 'Kopyala';
            copyButton.style.marginLeft = '10px';
            copyButton.addEventListener('click', function(e) {
                navigator.clipboard.writeText(skuNo).then(() => {
                    e.target.style.backgroundColor = "aqua";
                });
            });

            const linkElement = document.createElement('a');
            linkElement.href = gdriveSearchUrl;
            linkElement.target = "_blank";
            linkElement.className = 'gdrive-icon2';
            const imgElement = document.createElement('img');
            imgElement.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAB+klEQVR4AWJwL/ChKx68ForXW7SJN1iswYb5GyxaqGqhycrgR+rTAKzUA2hoURwG8Cn3bL/wbNuIz7Y5p9kOY57NMBvZs23bPtt/dW7b4VR94ep3v6OHaJvFJSoaZldQROB+hDJValcFPBj20vB82AsEAYCVyTT1uUykaWitGAQIB1oy22WoKOhKQMCCMKa0dLypYN9dTs7HcMvg5YCAHQKAzLmwpwpYGbORBHH2LAfMY4G4JdmOaJkvBQnsMQ+DHAl5MTSeqjaMASaarvZ00SB8UATCyp1OVzMWgfBDiwLhY7J2+Nn5LScyVCkUfkoI3nLqWivAcB7j52HYSISMEJz9WIwEyyE/AAtEBJLbRLoNiBxigIcVgDO08AwFwnkpwfx4Sx1aSFrmLwAvRDz+BBtaFB6Gg9txA9sEg6d9NLNO+/5HvFz0sXXardmy567d4CFW4F5V1BuXiUgVNBa5jpdEBdz2vTRy2/cyxMtduyFpTjtMotobD1D75Yvs3LjopYDwh9v/5CNWrtsOSjGc/8bFqP/mHtRx7zyVodP7tisgZMeffB8SO6xfLYeIlllvTSkM2jH34UraQeB5VkvexoeWWsttR7bEaPu9Cz95IEZbAVw8wm461+7uuXrp4Q0L6LxxS/NKQQ+t2HpYKEKQPMhXkpkNqoYwXTEA+kphQitc/vYAAAAASUVORK5CYII=';
            imgElement.alt = 'Google Drive';
            imgElement.style.width = '24px';
            imgElement.style.height = '24px';
            imgElement.style.marginLeft = '10px';
            linkElement.appendChild(imgElement);

            skuNoElement.appendChild(linkElement);
            skuNoElement.parentNode.insertBefore(copyButton, skuNoElement.nextSibling);

            if (!id) {
                const container = document.createElement('div');
                container.style.display = 'inline-block';
                container.style.marginLeft = '10px';

                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = 'Enter ID';
                input.style.marginRight = '5px';

                const saveButton = document.createElement('button');
                saveButton.textContent = 'Kaydet';
                saveButton.addEventListener('click', async () => {
                    const newId = input.value.trim();
                    if (newId) {
                        await GM.setValue(skuNo, newId);
                        location.reload();
                    }
                });

                container.appendChild(input);
                container.appendChild(saveButton);
                skuNoElement.appendChild(container);
            } else {
                const folderUrl = `https://www.photopea.com/?state={\"ids\":[\"${id}\"],\"action\":\"open\",\"userId\":\"${userId}\",\"resourceKeys\":{}}`;
                const linkElement2 = document.createElement('a');
                linkElement2.href = folderUrl;
                linkElement2.target = "_blank";
                linkElement2.className = 'folder2';
                const imgElement2 = document.createElement('img');
                imgElement2.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAYNQTFRFAAAAGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSX0Onc4AAAAIF0Uk5TACOp//6hHHD791xB/Si0kfT23sbc09d8MAVFmvnv62UCGsrxuA8L8pIBFzg/Bxue6eVmXvDjDgqwmNVgyX/W9ZSD2z16Sp0TvCErioE7De4uzybnJG1jsfrLTMOGnLOMWRhUVuzRp4litYhOefy2V4Jdx7qH87uEvTa/KmnASYDOCtc5cgAAAgxJREFUeJx9k21IFHEQxp8H8+S4tEwiLkU8KKEs4SrsRSXksKTsiDxTKpEQLOqD0gtSSH1QVKIQBZUoRaIXtMgLMbUiQkwpISTBPhRlgSRCcPgSkWjN3q67a+05H/Y/O8+PmfnP7BIgCUsT4TeICM5Z62I2/qTjV0hZzE5GzS4HYCVXTy8JREnhGVPNNQwzqTHkhBxOgb5rofUmIJYcW/Rd/Ko6CQbg4kdTssQfgeC5QQc28kPw3Cz5R+RMDowvyeCIVfSkFYqYzHfibx9W4m4N2Ma3wE4OaelSBuWx540pw67XwNZVg3oLcdJj+oABpH6T/sMXxEsj54Tb+xLwvDJKZLwAMiUGD3uBrOfAvm7Y5g1g/1O1ZFaX8pbdDRzohLdLL5H9BDjcCXg7FP0I/XKf9/B16EDMJJD7GMhpB7Yk8SFw9AFwrE0vkX8POCGhQ34kOvslwAjZccF9fZLH7wCFd4G1E/A+k1Xafa3Ayc/9egnHFHCwR6AWoIhsX1A+geJmY5IKcOo24GsztnX6lmmbxU3AmZtKtEGTN3nYaALO1muAM6cuGI60BWD+HlyfNADYvWNy3bC7/s9iJbWH0hvAhVpY2bkgcP6aOoeQQKZcsey6JeBm/PiyQDTzHgEXa2TjfZZACi/NNKKsSt3x/2YvIcqrcbkiBJDmapU//8qYX0Z9tfJfleVfhkbxF6QJhTmGsYn9AAAAAElFTkSuQmCC'; // Folder icon
                imgElement2.alt = 'Folder';
                imgElement2.style.width = '24px';
                imgElement2.style.height = '24px';
                imgElement2.style.marginLeft = '10px';
                linkElement2.appendChild(imgElement2);

                linkElement2.addEventListener('click', function(e) {
                    navigator.clipboard.writeText(folderUrl).then(() => {
                        window.open(folderUrl);
                    });
                });

                skuNoElement.appendChild(linkElement2);
            }

            rowEl.dataset.gdAdded = "true";
        });
    }
    const sheetID = GM.getValue("sheetID", 0);
    const WEB_APP_URL = 'https://script.google.com/macros/s/${sheetID}/exec';

    function absoluteUrl(href) {
        try { return new URL(href, location.href).href; } catch { return href || ''; }
    }

    async function sendLink(u) {
        //const orderNo = orderNoElement.textContent.trim().replace("Receipt #", "");
        const orderNo = document.querySelector("#order-details-order-info > a:nth-child(1)")?.innerText;
        const shopName = document.querySelector("#order-details-order-info > a:nth-child(2)")?.innerText;
        const payload = {
            id: orderNo,
            sheetName: 'order',
            link: u,
            shop: shopName
        };
        // GM_xmlhttpRequest kullanıyoruz (fetch yerine)
        GM_xmlhttpRequest({
            method: "POST",
            url: WEB_APP_URL,
            data: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json"
            },
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.status === 'success') {
                        toast('✅ Link gönderildi');
                    } else {
                        toast('❌ Hata: ' + (data.message || 'Bilinmeyen hata'));
                    }
                } catch (e) {
                    toast('✅ Link eklendi!!!');
                }
            },
            onerror: function(error) {
                toast('❌ Gönderilemedi: ' + (error.message || 'Bilinmeyen hata'));
            }
        });
    }

    window.addEventListener('contextmenu', e => {
        if (!e.altKey) return;// Sadece Alt + sağ tık
        const a = e.target.closest('a');
        if (!a) return;
        e.preventDefault();// Native menüyü engelle
        const href = absoluteUrl(a.getAttribute('href'));
        if (!href) return toast('⚠️ Hedef link bulunamadı');
        sendLink(href);
    }, true);

    function toast(msg) {
        let c = document.querySelector('.tm-send-toast');
        if (!c) {
            c = document.createElement('div');
            c.className = 'tm-send-toast';
            Object.assign(c.style, {
                position:'fixed', right:'12px', bottom:'12px', zIndex: 999999,
                padding:'10px 14px', borderRadius:'12px', boxShadow:'0 4px 14px rgba(0,0,0,.2)',
                background:'#111', color:'#fff', fontSize:'12px', opacity:'0.95'
            });
            document.body.appendChild(c);
        }
        c.textContent = msg;
        setTimeout(() => { if (c && c.parentNode) c.parentNode.removeChild(c); }, 1800);
    }

    GM.registerMenuCommand("Dosya Yolu Ayarla", setPath);
    GM.registerMenuCommand("Sheet ID", setImg);
    let timeout;
    const observer = new MutationObserver(() => {
        clearTimeout(timeout);
        if (window.location.href.includes("/messages/")) {
            timeout = setTimeout(() => {
                addIconNextToOrderNo(1);
            }, 300);
        }
        if (window.location.href.includes("/your/orders/sold")) {
            timeout = setTimeout(() => {
                addIconNextToOrderNo();
                addIconNextToSkuNo();
            }, 300);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
