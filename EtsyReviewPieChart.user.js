// ==UserScript==
// @name         Etsy Review Pie Chart with Badge
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Reviews yanına pie chart ve badge
// @match        https://www.etsy.com/your/shops/me/dashboard*
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewPieChart.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewPieChart.user.js
// ==/UserScript==

(function() {
    'use strict';

    function normalizeNumber(str) {
        return parseInt(str.replace(/[^\d]/g, ''), 10);
    }

    function addReviewPie() {
        const container = document.querySelector('.dashboard-header-metadata');
        if (!container) return;
        if (container.querySelector('.review-pie-wrapper')) return;

        const reviewsEl = container.querySelector('a[href*="#reviews"] div:nth-child(2) > span:nth-child(2)');
        const salesEl = container.querySelector('a[href*="/your/orders/sold"]');
        if (!reviewsEl || !salesEl) return;

        const reviews = normalizeNumber(reviewsEl.textContent);
        const sales = normalizeNumber(salesEl.textContent);
        if (!reviews || !sales) return;

        const ratio = reviews / sales;

        // Wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'review-pie-wrapper';
        wrapper.style.display = 'inline-block';
        wrapper.style.position = 'relative';
        wrapper.style.marginLeft = '6px';
        wrapper.style.verticalAlign = 'middle';
        wrapper.style.width = '24px';
        wrapper.style.height = '24px';

        const size = 24;
        const radius = size / 2;
        const strokeWidth = 6;
        const circumference = 2 * Math.PI * (radius - strokeWidth/2);
        const offset = circumference * (1 - ratio);

        // SVG Pie
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", size);
        svg.setAttribute("height", size);

        // Background circle
        const bg = document.createElementNS(svg.namespaceURI, "circle");
        bg.setAttribute("cx", radius);
        bg.setAttribute("cy", radius);
        bg.setAttribute("r", radius - strokeWidth/2);
        bg.setAttribute("fill", "none");
        bg.setAttribute("stroke", "#eee");
        bg.setAttribute("stroke-width", strokeWidth);
        svg.appendChild(bg);

        // Foreground circle
        const fg = document.createElementNS(svg.namespaceURI, "circle");
        fg.setAttribute("cx", radius);
        fg.setAttribute("cy", radius);
        fg.setAttribute("r", radius - strokeWidth/2);
        fg.setAttribute("fill", "none");
        fg.setAttribute("stroke", ratio >= 0.1 ? "green" : ratio >= 0.05 ? "orange" : "red");
        fg.setAttribute("stroke-width", strokeWidth);
        fg.setAttribute("stroke-dasharray", circumference);
        fg.setAttribute("stroke-dashoffset", offset);
        fg.setAttribute("transform", `rotate(-90 ${radius} ${radius})`);
        svg.appendChild(fg);

        wrapper.appendChild(svg);

        // Badge
        const badge = document.createElement('span');
        badge.textContent = `${(ratio*100).toFixed(1)}%`;
        badge.style.position = 'absolute';
        badge.style.top = '-12px';
        badge.style.right = '-24px';
        badge.style.background = '#333';
        badge.style.color = 'white';
        badge.style.fontSize = '10px';
        badge.style.padding = '1px 4px';
        badge.style.borderRadius = '8px';
        badge.style.fontWeight = '600';
        badge.style.lineHeight = '10px';

        wrapper.appendChild(badge);

        // ReviewsEl'in yanına ekle
        reviewsEl.parentNode.appendChild(wrapper);
    }

    addReviewPie();
    const observer = new MutationObserver(addReviewPie);
    observer.observe(document.body, { childList: true, subtree: true });
})();
