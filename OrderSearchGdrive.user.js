// ==UserScript==
// @name         Etsy Order search gdrive
// @namespace    https://github.com/cengaver
// @version      2.0.0
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
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/OrderSearchGdrive.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/OrderSearchGdrive.user.js
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ─── Constants ────────────────────────────────────────────────────────────

    const TAB_PANEL   = '#dg-tabs-preact__tab-1--default_wt_tab_panel';
    const IS_ORDERS   = () => location.href.includes('/your/orders/sold');
    const IS_MESSAGES = () => location.href.includes('/messages/');

    // ─── Settings (loaded once, updated via menu) ─────────────────────────────

    const cfg = { filePath: '\\order\\Custom\\', sheetID: '', userId: '' };

    async function loadSettings() {
        [cfg.filePath, cfg.sheetID, cfg.userId] = await Promise.all([
            GM.getValue('filePath', '\\order\\Custom\\'),
            GM.getValue('sheetID',  ''),
            GM.getValue('userId',   ''),
        ]);
    }

    // ─── Menu commands ────────────────────────────────────────────────────────

    GM.registerMenuCommand('Dosya Yolu Ayarla', async () => {
        const v = prompt('Lütfen dosya yolu girin:', cfg.filePath);
        if (v === null) return;
        cfg.filePath = v;
        await GM.setValue('filePath', v);
        alert('Yol kaydedildi!');
    });

    GM.registerMenuCommand('Sheet ID', async () => {
        const v = prompt('Lütfen Sheet ID girin:', cfg.sheetID);
        if (v === null) return;
        cfg.sheetID = v;
        await GM.setValue('sheetID', v);
        alert('Kaydedildi!');
    });

    GM.registerMenuCommand('User ID (Photopea)', async () => {
        const v = prompt('Lütfen User ID girin:', cfg.userId);
        if (v === null) return;
        cfg.userId = v;
        await GM.setValue('userId', v);
        alert('Kaydedildi!');
    });

    // ─── Toast ────────────────────────────────────────────────────────────────

    let _toastEl   = null;
    let _toastTimer = null;

    function toast(msg) {
        if (!_toastEl) {
            _toastEl = document.createElement('div');
            _toastEl.className = 'tm-send-toast';
            Object.assign(_toastEl.style, {
                position: 'fixed', right: '12px', bottom: '12px', zIndex: '999999',
                padding: '10px 14px', borderRadius: '12px',
                boxShadow: '0 4px 14px rgba(0,0,0,.2)',
                background: '#111', color: '#fff', fontSize: '12px',
                opacity: '0.95', transition: 'opacity .2s',
            });
            document.body.appendChild(_toastEl);
        }
        _toastEl.textContent = msg;
        _toastEl.style.opacity = '0.95';
        clearTimeout(_toastTimer);
        _toastTimer = setTimeout(() => { _toastEl.style.opacity = '0'; }, 1800);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function absoluteUrl(href) {
        try   { return new URL(href, location.href).href; }
        catch (_) { return href || ''; }
    }

    function xmlPost(url, data) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'POST', url,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(data),
                onload:  (r) => resolve(r),
                onerror: (e) => reject(e),
            });
        });
    }

    function makeIconLink(href, src, alt, size = 24, ml = 10) {
        const a   = document.createElement('a');
        a.href    = href;
        a.target  = '_blank';
        const img = document.createElement('img');
        img.src   = src; img.alt = alt;
        img.style.cssText = `width:${size}px;height:${size}px;margin-left:${ml}px;vertical-align:middle;`;
        a.appendChild(img);
        return a;
    }

    function makeCopyButton(text, color = 'aqua') {
        const btn = document.createElement('button');
        btn.textContent = 'Kopyala';
        btn.style.marginLeft = '10px';
        btn.addEventListener('click', (e) => {
            navigator.clipboard.writeText(text).then(() => {
                e.target.style.backgroundColor = color;
            });
        });
        return btn;
    }

    // ─── Base64 icons (unchanged from original) ───────────────────────────────

    const HUB_ICON   = 'data:image/png;base64,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';
    const DRIVE_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAB+klEQVR4AWJwL/ChKx68ForXW7SJN1iswYb5GyxaqGqhycrgR+rTAKzUA2hoURwG8Cn3bL/wbNuIz7Y5p9kOY57NMBvZs23bPtt/dW7b4VR94ep3v6OHaJvFJSoaZldQROB+hDJValcFPBj20vB82AsEAYCVyTT1uUykaWitGAQIB1oy22WoKOhKQMCCMKa0dLypYN9dTs7HcMvg5YCAHQKAzLmwpwpYGbORBHH2LAfMY4G4JdmOaJkvBQnsMQ+DHAl5MTSeqjaMASaarvZ00SB8UATCyp1OVzMWgfBDiwLhY7J2+Nn5LScyVCkUfkoI3nLqWivAcB7j52HYSISMEJz9WIwEyyE/AAtEBJLbRLoNiBxigIcVgDO08AwFwnkpwfx4Sx1aSFrmLwAvRDz+BBtaFB6Gg9txA9sEg6d9NLNO+/5HvFz0sXXardmy567d4CFW4F5V1BuXiUgVNBa5jpdEBdz2vTRy2/cyxMtduyFpTjtMotobD1D75Yvs3LjopYDwh9v/5CNWrtsOSjGc/8bFqP/mHtRx7zyVodP7tisgZMeffB8SO6xfLYeIlllvTSkM2jH34UraQeB5VkvexoeWWsttR7bEaPu9Cz95IEZbAVw8wm461+7uuXrp4Q0L6LxxS/NKQQ+t2HpYKEKQPMhXkpkNqoYwXTEA+kphQitc/vYAAAAASUVORK5CYII=';
    const PHOTOPEA_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAYNQTFRFAAAAGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSXGKSX0Onc4AAAAF0Uk5TACOp//6hHHD791xB/Si0kfT23sbc09d8MAVFmvnv62UCGsrxuA8L8pIBFzg/Bxue6eVmXvDjDgqwmNVgyX/W9ZSD2z16Sp0TvCErioE7De4uzybnJG1jsfrLTMOGnLOMWRhUVuzRp4litYhOefy2V4Jdx7qH87uEvTa/KmnASYDOCtc5cgAAAgxJREFUeJx9k21IFHEQxp8H8+S4tEwiLkU8KKEs4SrsRSXksKTsiDxTKpEQLOqD0gtSSH1QVKIQBZUoRaIXtMgLMbUiQkwpISTBPhRlgSRCcPgSkWjN3q67a+05H/Y/O8+PmfnP7BIgCUsT4TeICM5Z62I2/qTjV0hZzE5GzS4HYCVXTy8JREnhGVPNNQwzqTHkhBxOgb5rofUmIJYcW/Rd/Ko6CQbg4kdTssQfgeC5QQc28kPw3Cz5R+RMDowvyeCIVfSkFYqYzHfibx9W4m4N2Ma3wE4OaelSBuWx540pw67XwNZVg3oLcdJj+oABpH6T/sMXxEsj54Tb+xLwvDJKZLwAMiUGD3uBrOfAvm7Y5g1g/1O1ZFaX8pbdDRzohLdLL5H9BDjcCXg7FP0I/XKf9/B16EDMJJD7GMhpB7Yk8SFw9AFwrE0vkX8POCGhQ34kOvslwAjZccF9fZLH7wCFd4G1E/A+k1Xafa3Ayc/9egnHFHCwR6AWoIhsX1A+geJmY5IKcOo24GsztnX6lmmbxU3AmZtKtEGTN3nYaALO1muAM6cuGI60BWD+HlyfNADYvWNy3bC7/s9iJbWH0hvAhVpY2bkgcP6aOoeQQKZcsey6JeBm/PiyQDTzHgEXa2TjfZZACi/NNKKsSt3x/2YvIcqrcbkiBJDmapU//8qYX0Z9tfJfleVfhkbxF6QJhTmGsYn9AAAAAElFTkSuQmCC';

    // ─── Order number icon (messages page & orders page) ──────────────────────

    function getOrderNoElement(isMessagesPage) {
        if (isMessagesPage) {
            return (
                document.querySelector('#main-content > div > div.wt-grid.wt-overflow-hidden.wt-bt-xs.wt-width-full > div.wt-hide-xs.wt-show-md.wt-grid__item-xs-12.wt-grid__item-md-4.wt-grid__item-lg-3.wt-display-flex-md.wt-flex-direction-column-xs.wt-pl-xs-4.wt-pr-xs-3.wt-pt-xs-2 > div.buyer-info.wt-mt-xs-2 > div:nth-child(2) > div.wt-display-flex-xs.wt-justify-content-space-between > div') ||
                document.querySelector('#main-content > div > div.wt-grid.wt-overflow-hidden.wt-bt-xs.wt-width-full > div.wt-hide-xs.wt-show-md.wt-grid__item-xs-12.wt-grid__item-md-4.wt-grid__item-lg-3.wt-display-flex-md.wt-flex-direction-column-xs.wt-pl-xs-4.wt-pr-xs-3.wt-pt-xs-2 > div.buyer-info.wt-mt-xs-2 > div:nth-child(2) > div > a > div > div > div > div.wt-ml-xs-2 > p:nth-child(3)')
            );
        }
        return document.querySelector(`${TAB_PANEL} > div > div.mt-xs-6 > div.col-group.col-flush > h4`);
    }

    function addOrderIcon(isMessagesPage) {
        const el = getOrderNoElement(isMessagesPage);
        if (!el || el.dataset.gdAdded) return;

        const match = el.textContent.match(/\d+/);
        if (!match) return;
        const orderNo = match[0];

        el.dataset.gdAdded = 'true';

        const link = makeIconLink(
            `https://app.customhub.io/orders/order-search?q=${orderNo}`,
            HUB_ICON, 'Hub'
        );
        link.className = 'gdrive-icon';

        el.appendChild(link);
        el.parentNode.insertBefore(makeCopyButton(orderNo, 'red'), el.nextSibling);
    }

    // ─── SKU icons ────────────────────────────────────────────────────────────

    // Cache SKU→id lookups to avoid redundant GM.getValue calls per mutation
    const _skuCache = new Map();

    async function getSkuId(sku) {
        if (_skuCache.has(sku)) return _skuCache.get(sku);
        const id = await GM.getValue(sku, '');
        _skuCache.set(sku, id);
        return id;
    }

    async function addSkuIcons() {
        const rows = document.querySelectorAll(
            `${TAB_PANEL} > div > div.mt-xs-6 > div.panel.mb-xs-0.text-smaller.p-xs-4 > table > tbody > tr`
        );

        for (const row of rows) {
            if (row.dataset.gdAdded) continue;

            const skuEl = row.querySelector(
                'td.col-xs-6.pl-xs-0 > div.flag > div.flag-body.prose > div > span > p > span'
            );
            if (!skuEl || skuEl.dataset.gdAdded) continue;

            skuEl.dataset.gdAdded = 'true';
            row.dataset.gdAdded   = 'true';

            const sku = skuEl.textContent.trim();

            // Google Drive search link
            skuEl.appendChild(makeIconLink(
                `https://drive.google.com/drive/search?q=${encodeURIComponent(sku)}`,
                DRIVE_ICON, 'Google Drive'
            ));
            skuEl.parentNode.insertBefore(makeCopyButton(sku, 'aqua'), skuEl.nextSibling);

            const id = await getSkuId(sku);

            if (!id) {
                // Input + save button — no page reload
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:inline-flex;align-items:center;margin-left:10px;gap:4px;';

                const input = document.createElement('input');
                input.type        = 'text';
                input.placeholder = 'Enter ID';
                input.style.cssText = 'padding:2px 4px;font-size:12px;';

                const saveBtn = document.createElement('button');
                saveBtn.textContent = 'Kaydet';
                saveBtn.style.fontSize = '12px';
                saveBtn.addEventListener('click', async () => {
                    const newId = input.value.trim();
                    if (!newId) return;
                    _skuCache.set(sku, newId);
                    await GM.setValue(sku, newId);
                    // Replace input widget with Photopea link inline
                    wrap.replaceWith(buildPhotopeaLink(newId));
                    toast('✅ Kaydedildi');
                });

                wrap.append(input, saveBtn);
                skuEl.appendChild(wrap);
            } else {
                skuEl.appendChild(buildPhotopeaLink(id));
            }
        }
    }

    function buildPhotopeaLink(id) {
        const url  = `https://www.photopea.com/?state={"ids":["${id}"],"action":"open","userId":"${cfg.userId}","resourceKeys":{}}`;
        const link = makeIconLink(url, PHOTOPEA_ICON, 'Folder');
        link.className = 'folder2';
        // Also copy URL on click (original behaviour)
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(url).then(() => window.open(url));
        });
        return link;
    }

    // ─── Send link (Alt + right-click) ────────────────────────────────────────

    async function sendLink(href) {
        if (!cfg.sheetID) { toast('⚠️ Sheet ID ayarlanmamış'); return; }

        const orderNo  = document.querySelector('#order-details-order-info > a:nth-child(1)')?.innerText;
        const shopName = document.querySelector('#order-details-order-info > a:nth-child(2)')?.innerText;

        try {
            const res  = await xmlPost(
                `https://script.google.com/macros/s/${cfg.sheetID}/exec`,
                { id: orderNo, sheetName: 'order', link: href, shop: shopName }
            );
            const data = JSON.parse(res.responseText);
            toast(data.status === 'success' ? '✅ Link gönderildi' : `❌ Hata: ${data.message ?? 'Bilinmeyen'}`);
        } catch (e) {
            toast('❌ Gönderilemedi: ' + (e?.message ?? 'Bilinmeyen hata'));
        }
    }

    window.addEventListener('contextmenu', (e) => {
        if (!e.altKey) return;
        const a = e.target.closest('a');
        if (!a) return;
        e.preventDefault();
        const href = absoluteUrl(a.getAttribute('href'));
        if (!href) { toast('⚠️ Hedef link bulunamadı'); return; }
        sendLink(href);
    }, true);

    // ─── Throttled MutationObserver ───────────────────────────────────────────

    let _ordersTimer   = null;
    let _messagesTimer = null;

    function scheduleOrders() {
        clearTimeout(_ordersTimer);
        _ordersTimer = setTimeout(() => {
            addOrderIcon(false);
            addSkuIcons();
        }, 350);
    }

    function scheduleMessages() {
        clearTimeout(_messagesTimer);
        _messagesTimer = setTimeout(() => addOrderIcon(true), 350);
    }

    const observer = new MutationObserver(() => {
        if (IS_ORDERS())   scheduleOrders();
        if (IS_MESSAGES()) scheduleMessages();
    });

    // ─── Boot ─────────────────────────────────────────────────────────────────

    loadSettings().then(() => {
        observer.observe(document.body, { childList: true, subtree: true });
        // Fire once immediately
        if (IS_ORDERS())   scheduleOrders();
        if (IS_MESSAGES()) scheduleMessages();
    });

})();
