// ==UserScript==
// @name         Etsy Listing Inline Analyzer
// @description  Etsy Listing Inline Analyzer — Advanced Edition
// @version      2.11
// @author       Cengaver
// @namespace    https://github.com/cengaver
// @match        https://www.etsy.com/your/shops/me/tools/listings*
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// @connect      sheets.googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/etsyListingAnalyzer.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/etsyListingAnalyzer.user.js
// ==/UserScript==

(async function () {
    'use strict';

    const VERSION = '7';
    const PERIOD = 120;
    const SENT_KEY = `etsy_analyzer_sent_v${VERSION}`;
    const QUEUE_KEY = `etsy_analyzer_queue_v${VERSION}`;
    const MAX_RETRIES = 8;
    const MAX_BACKOFF = 3600000;

    const cfg = {
        sheetUrl: await GM.getValue('sheet_url', ''),
        shopName: await GM.getValue('shop_name', ''),
        version: await GM.getValue('version', VERSION)
    };

    const SENT_KEY_CURRENT = `etsy_analyzer_sent_v${cfg.version}`;
    const PREFIX = 'etsy_analyzer_sent_';

    function readJSON(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || 'null');
            return value ?? fallback;
        } catch {
            return fallback;
        }
    }

    const sent = readJSON(SENT_KEY_CURRENT, {});
    let queue = readJSON(QUEUE_KEY, []);
    if (!Array.isArray(queue)) queue = [];

    function saveSent() {
        try {
            localStorage.setItem(SENT_KEY_CURRENT, JSON.stringify(sent));
        } catch (e) {
            console.error('[ELA] Sent storage error:', e);
        }
    }

    function saveQueue() {
        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        } catch (e) {
            console.error('[ELA] Queue storage error:', e);
            showToast('Queue kaydedilemedi. Depolama alanını kontrol edin.', 'error');
        }
    }

    const settings = {
        sheetUrl: () => cfg.sheetUrl,
        shopName: () => cfg.shopName
    };

    // ─────────────────────────────────────────────
    // STYLES
    // ─────────────────────────────────────────────

    GM.addStyle(`
        :root {
            --ela-green:#34a853;
            --ela-blue:#4285f4;
            --ela-red:#ea4335;
            --ela-orange:#e67e22;
            --ela-yellow:#fbbc05;
            --ela-purple:#8e44ad;
            --ela-dark:#202124;
            --ela-gray:#5f6368;
        }

        .ela-toast-wrap {
            position:fixed;
            bottom:20px;
            right:20px;
            z-index:99999;
            display:flex;
            flex-direction:column;
            gap:8px;
            pointer-events:none;
        }

        .ela-toast {
            min-width:260px;
            max-width:400px;
            padding:11px 14px;
            border-radius:5px;
            box-shadow:0 2px 10px rgba(0,0,0,.15);
            font:14px 'Segoe UI',Arial,sans-serif;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
            opacity:0;
            transform:translateY(12px);
            transition:all .25s ease;
            pointer-events:all;
        }

        .ela-toast.show {
            opacity:1;
            transform:translateY(0);
        }

        .ela-toast.success {background:var(--ela-green);color:white}
        .ela-toast.error {background:var(--ela-red);color:white}
        .ela-toast.warning {background:var(--ela-yellow);color:#202124}
        .ela-toast.info {background:var(--ela-blue);color:white}

        .ela-toast-x {
            background:none;
            border:0;
            color:inherit;
            cursor:pointer;
            font-size:18px;
        }

        .ela-tip {
            position:fixed;
            display:none;
            z-index:999999;
            width:290px;
            max-width:calc(100vw - 24px);
            padding:12px;
            background:white;
            color:#202124;
            border:1px solid #ddd;
            border-radius:6px;
            box-shadow:0 4px 16px rgba(0,0,0,.18);
            font:12px/1.6 'Segoe UI',Arial,sans-serif;
            pointer-events:none;
        }

        .ela-tip-title {
            font-weight:700;
            font-size:13px;
            margin-bottom:5px;
        }

        .ela-tip-name {
            font-weight:600;
            margin-bottom:8px;
            overflow-wrap:anywhere;
        }

        .ela-tip-section {
            font-weight:700;
            margin-top:9px;
            border-top:1px solid #eee;
            padding-top:6px;
        }

        .ela-badge {
            margin-left:8px;
            font-size:18px;
            cursor:pointer;
            line-height:1;
            user-select:none;
        }

        .ela-score {
            display:inline-block;
            margin-left:5px;
            font-size:11px;
            font-weight:700;
            color:#555;
            vertical-align:middle;
        }
    `);

    // ─────────────────────────────────────────────
    // TOAST
    // ─────────────────────────────────────────────

    let toastWrap;

    function showToast(message, type = 'success', duration = 3000) {
        if (!toastWrap) {
            toastWrap = document.createElement('div');
            toastWrap.className = 'ela-toast-wrap';
            document.body.appendChild(toastWrap);
        }

        const toast = document.createElement('div');
        toast.className = `ela-toast ${type}`;

        const text = document.createElement('span');
        text.textContent = message;

        const close = document.createElement('button');
        close.className = 'ela-toast-x';
        close.textContent = '×';
        close.onclick = () => dismissToast(toast);

        toast.append(text, close);
        toastWrap.appendChild(toast);

        toast.getBoundingClientRect();
        toast.classList.add('show');

        if (duration > 0) {
            setTimeout(() => dismissToast(toast), duration);
        }
    }

    function dismissToast(toast) {
        if (!toast.isConnected) return;
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }

    // ─────────────────────────────────────────────
    // SETTINGS
    // ─────────────────────────────────────────────

    GM.registerMenuCommand('⚙️ Sheet URL Ayarla', async () => {
        const value = prompt('Google Sheets Web App URL:', cfg.sheetUrl);
        if (value === null) return;

        cfg.sheetUrl = value.trim();
        await GM.setValue('sheet_url', cfg.sheetUrl);

        showToast('Sheet URL kaydedildi', 'success');
        flushQueue();
    });

    GM.registerMenuCommand('⚙️ Mağaza Adı', async () => {
        const value = prompt('Mağaza adı:', cfg.shopName);
        if (value === null) return;

        cfg.shopName = value.trim();
        await GM.setValue('shop_name', cfg.shopName);

        showToast('Mağaza adı kaydedildi', 'success');
    });

    GM.registerMenuCommand('⚙️ Versiyon / Veri Anahtarı', async () => {
        const value = prompt('Veri versiyonu:', cfg.version);
        if (value === null || !value.trim()) return;

        cfg.version = value.trim();
        await GM.setValue('version', cfg.version);

        showToast('Versiyon kaydedildi. Sayfayı yenileyin.', 'warning');
    });

    GM.registerMenuCommand('🔄 Başarısız Sheets Gönderimlerini Yeniden Dene', () => {
        let count = 0;

        queue.forEach(item => {
            if (item.attempts >= MAX_RETRIES) {
                item.attempts = 0;
                item.nextAt = Date.now();
                count++;
            }
        });

        saveQueue();
        flushQueue();
        showToast(`${count} kayıt yeniden denemeye alındı`, 'info');
    });

    GM.registerMenuCommand('📊 Queue Durumu', () => {
        const failed = queue.filter(x => x.attempts >= MAX_RETRIES).length;
        showToast(
            `Bekleyen: ${queue.length} | Kalıcı hata: ${failed} | Gönderilen: ${Object.keys(sent).length}`,
            'info',
            6000
        );
    });

    // ─────────────────────────────────────────────
    // DOM HELPERS
    // ─────────────────────────────────────────────

    function findCard(el) {
        return el.closest('.card');
    }

    function getListingId(card) {
        const links = card.querySelectorAll('a[href*="/listing/"]');

        for (const link of links) {
            const match = link.href.match(/\/listing\/(\d+)/);
            if (match) return match[1];
        }

        return null;
    }

    function getTitleFromRow(card) {
        const element = card.querySelector('h2.card-title');
        return (element?.getAttribute('title') || element?.textContent || '').trim();
    }

    function getSkuFromRow(card) {
        const element = card.querySelector('.card-meta-row-sku span');

        return element
            ? (element.getAttribute('title') || element.textContent || '').trim()
            : '';
    }

    function getImgFromRow(card) {
        return card.querySelector('.card-img-wrap img')?.src?.trim() || '';
    }

    function pick(text, regex) {
        const match = text.match(regex);
        return match ? Number(match[1]) : 0;
    }

    function parseStats(card) {
        const stats = { sales: 0, favs: 0, visits: 0, renewal: 0, ready: false };
        let found = 0;

        card.querySelectorAll('.card-meta-row-item').forEach(el => {
            const t = (el.textContent || '').replace(/\u00a0/g, ' ').trim();
            const m = t.match(/^([\d.,]+)\s+([^\d$].*)$/);
            if (!m) return;

            const n = Number(m[1].replace(/[.,](?=\d{3}\b)/g, '')) || 0;
            const label = m[2].toLowerCase();

            if (/^sales?\b|^satış|^satis/.test(label)) { stats.sales = n; found++; }
            else if (/^favorites?\b|^favori/.test(label)) { stats.favs = n; found++; }
            else if (/^visits?\b|^ziyaret/.test(label)) { stats.visits = n; found++; }
            else if (/^renewals?\b|^yenileme/.test(label)) { stats.renewal = n; found++; }
        });

        stats.ready = found >= 4;
        return stats;
    }
    // ─────────────────────────────────────────────
    // LISTING AGE
    // ─────────────────────────────────────────────

    function parseRenewDate(text) {
        const match = text.match(
            /(?:Auto[-\s]?renews?|Expires)\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
        );

        if (!match) return null;

        const date = new Date(match[1]);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function calculateAge(expirationDate, renewalCount) {
        if (!expirationDate) {
            return {
                age: null,
                confidence: 'unavailable',
                estimatedDate: null
            };
        }

        const periods = Math.max(0, renewalCount) + 1;
        const publicationDate = new Date(
            expirationDate.getTime() - periods * PERIOD * 86400000
        );

        const today = new Date();
        const todayUTC = Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        const publicationUTC = Date.UTC(
            publicationDate.getFullYear(),
            publicationDate.getMonth(),
            publicationDate.getDate()
        );

        const age = Math.max(
            0,
            Math.floor((todayUTC - publicationUTC) / 86400000)
        );

        return {
            age,
            confidence: 'estimated',
            estimatedDate: publicationDate.toISOString().slice(0, 10)
        };
    }

    // ─────────────────────────────────────────────
    // PERFORMANCE ANALYSIS
    // ─────────────────────────────────────────────

    function calculateScore({ age, visits, favs, sales }) {
        const trafficScore = Math.min(visits / 100, 1) * 30;

        const favoriteRate = visits > 0 ? favs / visits : 0;
        const favoriteScore = Math.min(favoriteRate / 0.05, 1) * 25;

        const salesScore = Math.min(sales, 5) * 9;

        const ageFactor = age === null ? 0.5 : age < 15 ? 0.5 : 1;

        return Math.round(
            Math.min(100, (trafficScore + favoriteScore + salesScore) * ageFactor)
        );
    }

    function getLevel({ age, sales, visits, favs }) {
        if (sales > 0) {
            return {
                icon: '🟢',
                color: '#2ecc71',
                label: 'Satış Var',
                category: 'performing'
            };
        }

        if (age === null) {
            return {
                icon: '⚪',
                color: '#808080',
                label: 'Yaş Bilgisi Yok',
                category: 'unknown'
            };
        }

        if (age <= 14) {
            return {
                icon: '🟡',
                color: '#f1c40f',
                label: 'Yeni – Dokunma',
                category: 'new'
            };
        }

        if (age <= 30) {
            return {
                icon: '🟠',
                color: '#e67e22',
                label: 'İzleme Aşaması',
                category: 'monitor'
            };
        }

        if (age <= 60) {
            return {
                icon: '🔴',
                color: '#e74c3c',
                label: 'Optimizasyon Gerekli',
                category: 'optimize'
            };
        }

        return {
            icon: '🚨',
            color: '#8e44ad',
            label: 'Başarısız – İnceleme Gerekli',
            category: 'failed'
        };
    }

    function buildIssues({ age, visits, favs, sales }) {
        if (sales > 0) {
            return ['Satış almış', 'Öneri: Performansı takip et; gereksiz değişiklik yapma'];
        }

        if (age === null) {
            return ['İlan yaşı hesaplanamadı', 'Öneri: Yayın tarihini doğrula'];
        }

        if (age <= 14) {
            return ['Yeni listing', 'Öneri: Veri birikmesini bekle'];
        }

        if (visits < 10) {
            return [
                'Düşük trafik – görünürlük problemi',
                'Öneri: SEO, etiketler ve kategori kontrolü'
            ];
        }

        const rate = favs / visits;

        if (visits >= 50 && rate < 0.01) {
            return [
                'Trafik var ancak favori oranı düşük',
                'Öneri: Ana görsel, tasarım ve başlık testi'
            ];
        }

        if (favs > 0 && rate >= 0.01) {
            return [
                'Ürün ilgisi var ancak satış yok',
                'Öneri: Fiyat, kargo ve teklif kontrolü'
            ];
        }

        if (visits >= 30) {
            return [
                'Trafik var ancak ürün ilgisi zayıf',
                'Öneri: Görsel ve ürün sunumunu incele'
            ];
        }

        return [
            'Yeterli performans verisi yok',
            'Öneri: Trafik ve favori gelişimini takip et'
        ];
    }

    function decision2({ age, visits, favs, sales }) {
        if (sales > 0) {
            return ['Satış almış – performans takibi yap'];
        }

        if (age === null) {
            return ['İlan yaşı bilinmiyor – öncelik belirlenemedi'];
        }

        const rate = visits > 0 ? favs / visits : 0;
        const output = [];

        if (visits >= 50 && rate >= 0.02) {
            output.push(
                'A. Ürün ilgisi güçlü, satış yok. Dönüşüm problemi olabilir.',
                'Eylem: Fiyat, kargo, teslimat süresi ve güven unsurlarını incele.'
            );
        } else if (visits >= 50 && rate < 0.01) {
            output.push(
                'B. Yeterli trafik var ancak favori oranı düşük.',
                'Eylem: Ana görsel, tasarım ve başlık optimizasyonu.'
            );
        } else if (visits >= 10 && favs > 0) {
            output.push(
                'C. Trafik ve ürün ilgisi mevcut.',
                'Eylem: SEO ve dönüşüm optimizasyonunu birlikte değerlendir.'
            );
        } else if (visits >= 10) {
            output.push(
                'D. Trafik var ancak favori oluşmuyor.',
                'Eylem: Ana görsel ve ürün sunumu testi.'
            );
        } else if (visits < 10 && age > 30) {
            output.push(
                'E. Görünürlük problemi olası.',
                'Eylem: SEO, etiketler ve arama görünürlüğünü kontrol et.'
            );
        } else {
            output.push(
                'F. Veri yetersiz.',
                'Eylem: Bir süre daha performans izle.'
            );
        }

        return output;
    }

    // ─────────────────────────────────────────────
    // SHARED TOOLTIP
    // ─────────────────────────────────────────────

    let sharedTip;

    function getTooltip() {
        if (sharedTip) return sharedTip;

        sharedTip = document.createElement('div');
        sharedTip.className = 'ela-tip';
        document.body.appendChild(sharedTip);

        return sharedTip;
    }

    function addTipLine(parent, label, value) {
        const line = document.createElement('div');
        line.textContent = `${label}: ${value}`;
        parent.appendChild(line);
    }

    function renderTooltip(data) {
        const tip = getTooltip();
        tip.replaceChildren();

        const heading = document.createElement('div');
        heading.className = 'ela-tip-title';
        heading.textContent = `${data.level.icon} ${data.level.label}`;
        tip.appendChild(heading);

        const title = document.createElement('div');
        title.className = 'ela-tip-name';
        title.textContent = data.title || 'Untitled';
        tip.appendChild(title);

        addTipLine(tip, 'Performance Score', `${data.score}/100`);
        addTipLine(tip, 'Sales', data.sales);
        addTipLine(tip, 'Favorites', data.favs);
        addTipLine(tip, 'Visits', data.visits);
        addTipLine(tip, 'Favorite Rate', `${data.favoriteRate}%`);
        addTipLine(tip, 'Age', data.age === null ? 'Bilinmiyor' : `${data.age} gün`);
        addTipLine(tip, 'Age Confidence', data.ageConfidence);
        addTipLine(tip, 'Renewal', data.renewal);
        addTipLine(tip, 'SKU', data.sku || 'N/A');

        const section1 = document.createElement('div');
        section1.className = 'ela-tip-section';
        section1.textContent = 'Issues';
        tip.appendChild(section1);

        data.issues.forEach(item => {
            const line = document.createElement('div');
            line.textContent = `• ${item}`;
            tip.appendChild(line);
        });

        const section2 = document.createElement('div');
        section2.className = 'ela-tip-section';
        section2.textContent = 'Advanced Decision';
        tip.appendChild(section2);

        data.issues2.forEach(item => {
            const line = document.createElement('div');
            line.textContent = `• ${item}`;
            tip.appendChild(line);
        });

        return tip;
    }

    function positionTooltip(tip, event) {
        tip.style.display = 'block';

        const margin = 12;
        const rect = tip.getBoundingClientRect();

        let left = event.clientX + margin;
        let top = event.clientY + margin;

        if (left + rect.width > window.innerWidth) {
            left = event.clientX - rect.width - margin;
        }

        if (top + rect.height > window.innerHeight) {
            top = event.clientY - rect.height - margin;
        }

        tip.style.left = `${Math.max(8, left)}px`;
        tip.style.top = `${Math.max(8, top)}px`;
    }

    // ─────────────────────────────────────────────
    // GOOGLE SHEETS QUEUE
    // ─────────────────────────────────────────────

    let queueRunning = false;
    let queueTimer = null;

    function enqueue(payload) {
        if (queue.some(item => item.payload.id === payload.id)) return;

        queue.push({
            id: payload.id,
            payload,
            attempts: 0,
            nextAt: Date.now(),
            createdAt: Date.now()
        });

        saveQueue();
        flushQueue();
    }

    function sendRequest(payload) {
        return new Promise((resolve, reject) => {
            if (!cfg.sheetUrl) {
                reject(new Error('Sheet URL ayarlanmamış'));
                return;
            }

            GM.xmlHttpRequest({
                method: 'POST',
                url: cfg.sheetUrl,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(payload),
                timeout: 30000,

                onload(response) {
                    try {
                        if (response.status < 200 || response.status >= 300) {
                            throw new Error(`HTTP ${response.status}`);
                        }

                        const result = JSON.parse(response.responseText);

                        if (result.status !== 'success') {
                            throw new Error(result.message || 'Sheets işlem hatası');
                        }

                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                },

                onerror() {
                    reject(new Error('Network error'));
                },

                ontimeout() {
                    reject(new Error('Request timeout'));
                }
            });
        });
    }

    function scheduleQueue(delay) {
        clearTimeout(queueTimer);
        queueTimer = setTimeout(flushQueue, Math.max(1000, delay));
    }

    async function flushQueue() {
        if (queueRunning || !queue.length || !cfg.sheetUrl) return;

        queueRunning = true;

        try {
            while (queue.length) {
                const item = queue[0];

                if (item.attempts >= MAX_RETRIES) {
                    break;
                }

                const wait = item.nextAt - Date.now();

                if (wait > 0) {
                    scheduleQueue(wait);
                    break;
                }

                try {
                    await sendRequest(item.payload);

                    queue.shift();

                    sent[item.id] = Date.now();
                    saveSent();
                    saveQueue();

                    showToast(`Analiz gönderildi: ${item.id}`, 'success');

                } catch (error) {
                    item.attempts++;

                    const delay = Math.min(
                        30000 * Math.pow(2, item.attempts - 1),
                        MAX_BACKOFF
                    );

                    item.nextAt = item.attempts >= MAX_RETRIES
                        ? Number.MAX_SAFE_INTEGER
                        : Date.now() + delay;

                    saveQueue();

                    console.error('[ELA] Sheets error:', error);

                    if (item.attempts >= MAX_RETRIES) {
                        showToast(
                            `${item.id}: Maksimum deneme sayısına ulaşıldı`,
                            'error',
                            6000
                        );
                    } else {
                        showToast(
                            `${item.id}: Gönderim başarısız. Tekrar denenecek.`,
                            'warning'
                        );
                        scheduleQueue(delay);
                    }

                    break;
                }
            }
        } finally {
            queueRunning = false;
        }
    }

    // ─────────────────────────────────────────────
    // ANALYSIS
    // ─────────────────────────────────────────────

    const seen = new Set();
    const processing = new Set();

    async function analyze(card, actions, id) {
        if (processing.has(id) || seen.has(id)) return;

        processing.add(id);

        try {
            const text = card.innerText || card.textContent || '';
            const { sales, favs, visits, renewal, ready } = parseStats(card);

            if (!ready) return;  // istatistikler henüz yüklenmedi, MutationObserver tekrar tetikleyecek

            const expirationDate = parseRenewDate(text);
            const ageData = calculateAge(expirationDate, renewal);

            const metrics = {
                age: ageData.age,
                visits,
                favs,
                sales
            };

            const level = getLevel(metrics);
            const score = calculateScore({ ...metrics, renewal });

            const data = {
                id,
                title: getTitleFromRow(card),
                sku: getSkuFromRow(card),
                age: ageData.age,
                ageConfidence: ageData.confidence,
                estimatedDate: ageData.estimatedDate,
                visits,
                favs,
                sales,
                renewal,
                favoriteRate: visits > 0
                    ? ((favs / visits) * 100).toFixed(2)
                    : '0.00',
                score,
                level,
                issues: buildIssues(metrics),
                issues2: decision2(metrics),
                img: getImgFromRow(card),
                expires: !!expirationDate,
                shopName: settings.shopName(),
                sheetName: 'analiz',
                analyzedAt: new Date().toISOString(),
                analyzerVersion: '2.1'
            };

            if (inject(actions, data)) {
                seen.add(id);

                if (!sent[id]) {
                    enqueue(data);
                }
            }

        } catch (error) {
            console.error('[ELA] Analysis error:', id, error);
        } finally {
            processing.delete(id);
        }
    }

    // ─────────────────────────────────────────────
    // BADGE INJECTION
    // ─────────────────────────────────────────────

    function inject(actions, data) {
        const target = actions.querySelector(
            '.wt-display-flex-xs.wt-align-items-center'
        );

        if (!target || actions.querySelector('.ela-badge')) {
            return false;
        }

        const badge = document.createElement('span');
        badge.className = 'ela-badge';
        badge.dataset.icon = data.level.icon;
        badge.textContent = data.level.icon;
        badge.title = `${data.level.label} | Score: ${data.score}/100`;
        badge.style.color = data.level.color;

        const score = document.createElement('span');
        score.className = 'ela-score';
        score.textContent = data.score;

        const wrapper = document.createElement('div');
        wrapper.className = 'wt-flex-xs-1';
        wrapper.append(badge, score);

        const tip = renderTooltip(data);

        badge.addEventListener('mouseenter', event => {
            renderTooltip(data);
            positionTooltip(tip, event);
        });

        badge.addEventListener('mousemove', event => {
            positionTooltip(tip, event);
        });

        badge.addEventListener('mouseleave', () => {
            tip.style.display = 'none';
        });

        target.appendChild(wrapper);

        return true;
    }

    // ─────────────────────────────────────────────
    // FAILED LISTING SELECTOR
    // ─────────────────────────────────────────────

    function selectFailed() {
        const badges = document.querySelectorAll(
            '.ela-badge[data-icon="🚨"]'
        );

        let newly = 0;

        badges.forEach(badge => {
            const checkbox = badge.closest('.card')
                ?.querySelector('.card-actions input[type="checkbox"]');

            if (checkbox && !checkbox.checked) {
                checkbox.click();
                newly++;
            }
        });

        showToast(
            badges.length
                ? `${badges.length} başarısız kart bulundu, ${newly} yeni seçildi`
                : 'Bu sayfada başarısız kart yok',
            badges.length ? 'success' : 'warning'
        );
    }

    function ensureSelectBtn() {
        if (document.getElementById('ela-select-fail')) return;

        const bulk = document.querySelector(
            '[data-tour-anchor="bulk-edit-button"]'
        );

        if (!bulk) return;

        const button = document.createElement('button');
        button.id = 'ela-select-fail';
        button.type = 'button';
        button.className = 'wt-btn wt-btn--secondary wt-btn--small';
        button.textContent = '🚨 Seç';
        button.title = 'Başarısız kartları seç';
        button.addEventListener('click', selectFailed);

        bulk.insertAdjacentElement('afterend', button);
    }

    // ─────────────────────────────────────────────
    // SCAN
    // ─────────────────────────────────────────────

    let scanTimer;

    function scheduleScan() {
        clearTimeout(scanTimer);
        scanTimer = setTimeout(scan, 200);
    }

    function scan() {
        ensureSelectBtn();

        document.querySelectorAll(
            '.card-actions.card-actions-3'
        ).forEach(actions => {
            const card = findCard(actions);
            if (!card) return;

            const id = getListingId(card);
            if (!id || seen.has(id) || processing.has(id)) return;

            analyze(card, actions, id);
        });
    }

    // ─────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────

    const observer = new MutationObserver(scheduleScan);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setTimeout(scan, 800);
    flushQueue();

    console.log(
        `%c[Etsy Listing Inline Analyzer v2.1] Started`,
        'color:#34a853;font-weight:bold'
    );

})();
