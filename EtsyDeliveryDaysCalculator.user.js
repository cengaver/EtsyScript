// ==UserScript==
// @name         Etsy Delivery Days Calculator
// @version      2.0.0
// @description  Calculate the number of days between order and delivery
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/orders/sold/completed*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        none
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyDeliveryDaysCalculator.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyDeliveryDaysCalculator.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ─── Constants ────────────────────────────────────────────────────────────

    const TAB_PANEL = '#dg-tabs-preact__tab-1--default_wt_tab_panel';

    // Matches: "Ordered 3:45pm, Friday, Nov 2, 2024"
    const RE_ORDER_DATE    = /Ordered\s+[\d:apm]+,\s+\w+,\s+(\w+\s+\d{1,2},\s+\d{4})/i;

    // Matches: "Nov 2, 2024" at start of string
    const RE_DELIVERY_DATE = /^(\w+\s+\d{1,2},\s+\d{4})/;

    const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function getCurrentOrderId() {
        return new URLSearchParams(window.location.search).get('order_id');
    }

    /**
     * Parse a "MMM D, YYYY" string safely — avoids locale-dependent `new Date(string)`.
     * Returns a Date at midnight UTC, or null on failure.
     */
    function parseMDY(str) {
        if (!str) return null;
        // e.g. "Nov 2, 2024"
        const m = /^(\w{3})\s+(\d{1,2}),\s+(\d{4})$/.exec(str.trim());
        if (!m) return null;
        const month = MONTH_ABBR.indexOf(m[1]);
        if (month === -1) return null;
        return new Date(Date.UTC(Number(m[3]), month, Number(m[2])));
    }

    /** "MMM D" for display */
    function formatShort(date) {
        return `${MONTH_ABBR[date.getUTCMonth()]} ${date.getUTCDate()}`;
    }

    function daysBetween(a, b) {
        return Math.ceil(Math.abs(b - a) / 864e5);
    }

    function qs(selector, root = document) {
        return root.querySelector(selector);
    }

    function hideProtectionBanners() {
        ['purchase-protection-seller-onsite-under-250',
         'purchase-protection-seller-onsite-under-500']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
    }

    // ─── DOM accessors ────────────────────────────────────────────────────────

    /**
     * Find the "Ordered …" element. Etsy renders it in either the 2nd or 3rd
     * child of `.mt-xs-1` depending on order state — check both.
     */
    function getOrderDateEl() {
        const panel = qs(TAB_PANEL);
        if (!panel) return null;
        const parent = panel.querySelector('div.mt-xs-1');
        if (!parent) return null;

        for (const child of parent.children) {
            if (child.innerText?.includes('Ordered')) return child;
        }
        return null;
    }

    function getDeliveryDateEl() {
        // Walk to the first tracking date cell; robust against minor DOM shifts.
        const panel = qs(TAB_PANEL);
        if (!panel) return null;
        return panel.querySelector(
            'div.col-xs-5.text-gray-lightest.text-right'
        );
    }

    function getResultEl() {
        const panel = qs(TAB_PANEL);
        if (!panel) return null;
        // The "Completed" status row — 2nd child of the order-state panel
        return panel.querySelector(
            'div.flag-body.icon-t-2.text-body-smaller.text-gray-darker > div:nth-child(2)'
        );
    }

    // ─── Core logic ───────────────────────────────────────────────────────────

    let lastProcessedOrderId = null;

    function processOrderDates() {
        const orderId = getCurrentOrderId();
        if (!orderId || orderId === lastProcessedOrderId) return;

        const orderDateEl    = getOrderDateEl();
        const deliveryDateEl = getDeliveryDateEl();
        const resultEl       = getResultEl();

        if (!orderDateEl || !deliveryDateEl || !resultEl) return;

        // Extract date strings
        const orderMatch    = RE_ORDER_DATE.exec(orderDateEl.innerText);
        const deliveryMatch = RE_DELIVERY_DATE.exec(deliveryDateEl.innerText.trim());

        if (!orderMatch || !deliveryMatch) return;

        const orderDate    = parseMDY(orderMatch[1]);
        const deliveryDate = parseMDY(deliveryMatch[1]);

        if (!orderDate || !deliveryDate) return;

        // All data valid — commit the processed ID now
        lastProcessedOrderId = orderId;

        const days = daysBetween(orderDate, deliveryDate);
        const badge = days < 7 ? '✅' : '❌';

        resultEl.innerText =
            `${days}${badge} gün : (${deliveryMatch[1]}) - (${formatShort(orderDate)})`;

        hideProtectionBanners();
    }

    // ─── Throttled MutationObserver ───────────────────────────────────────────

    let _pending = false;

    const observer = new MutationObserver(() => {
        if (_pending) return;
        _pending = true;
        setTimeout(() => {
            _pending = false;
            processOrderDates();
        }, 600);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Also fire once on load in case the page is already hydrated
    processOrderDates();

})();
