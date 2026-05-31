// ==UserScript==
// @name         ShipStation Sales Report Enhanced
// @namespace    https://github.com/cengaver/EtsyScript/
// @version      2.02
// @description  Show sales data by store for Yesterday, Last 7 Days, and Last 30 Days with floating button and improved UI
// @author       cengaver
// @icon         https://www.google.com/s2/favicons?domain=shipstation.com
// @match        *.customhub.io/*
// @match        *.etsy.com/your/shops/me/dashboard*
// @require      https://cdn.jsdelivr.net/npm/chart.js
// @connect      ssapi.shipstation.com
// @grant        GM_xmlhttpRequest
// @grant        GM.addStyle
// @grant        GM.registerMenuCommand
// @grant        GM.getValue
// @grant        GM.setValue
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ShipStationSalesReport.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ShipStationSalesReport.user.js
// ==/UserScript==

(async function () {
    'use strict';

    // ─── CSS Variables + Styles ───────────────────────────────────────────────
    GM.addStyle(`
        :root {
            --primary:      #007bff;
            --primary-dark: #0056b3;
            --success:      #34a853;
            --success-dark: #2e7d32;
            --danger:       #ea4335;
            --danger-dark:  #c62828;
            --warning:      #fbbc05;
            --warning-dark: #f57f17;
            --light:        #f8f9fa;
            --dark:         #202124;
            --gray:         #5f6368;
            --radius:       4px;
            --shadow:       0 2px 10px rgba(0,0,0,.1);
            --transition:   all .25s ease;
            --font:         'Segoe UI', Roboto, Arial, sans-serif;
        }

        /* Floating action button */
        #sales-floating-button {
            position: fixed; bottom: 20px; right: 20px;
            width: 56px; height: 56px;
            background: var(--primary); color: #fff;
            border: none; border-radius: 50%;
            font-size: 22px; cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,.2);
            z-index: 10000; transition: var(--transition);
        }
        #sales-floating-button:hover { background: var(--primary-dark); transform: scale(1.08); }

        /* Report panel */
        #sales-report-container {
            position: fixed; top: 80px; right: 50px;
            width: 460px; max-height: 88vh;
            background: #fff;
            border: 1px solid #dde;
            border-radius: 10px;
            box-shadow: 0 6px 24px rgba(0,0,0,.15);
            overflow-y: auto;
            z-index: 9999;
            font-family: var(--font);
        }

        /* Dropdown bar */
        #sales-dropdown-menu {
            position: sticky; top: 0;
            background: #fff;
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
            z-index: 1;
        }
        #sales-dropdown-menu select,
        #sales-dropdown-menu button {
            padding: 5px 10px;
            border: 1px solid #ccc; border-radius: var(--radius);
            font-size: 12px; font-family: var(--font);
            cursor: pointer; background: #fff;
            transition: var(--transition);
        }
        #sales-dropdown-menu button {
            background: var(--primary); color: #fff; border-color: var(--primary);
            font-weight: 600;
        }
        #sales-dropdown-menu button:hover { background: var(--primary-dark); }

        /* Table */
        #sales-report-table {
            width: 100%; border-collapse: collapse;
            font-size: 13px;
        }
        #sales-report-table th {
            background: var(--primary); color: #fff;
            padding: 9px 11px; text-align: left;
            position: sticky; top: 0;
        }
        #sales-report-table td { padding: 8px 11px; border-bottom: 1px solid #f0f0f0; }
        #sales-report-table tbody tr:hover { background: #f5f8ff; }
        #sales-report-table tfoot tr th { background: #343a40; }

        /* Loading overlay */
        #loading-indicator {
            position: fixed; inset: 0;
            background: rgba(255,255,255,.75);
            display: flex; align-items: center; justify-content: center;
            z-index: 99999;
            font-family: var(--font); font-size: 18px; font-weight: 600; color: var(--dark);
        }
        .spinner {
            width: 36px; height: 36px; margin-right: 12px;
            border: 4px solid #dde;
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Toast */
        .toast-container {
            position: fixed; bottom: 90px; right: 20px;
            z-index: 99999; display: flex; flex-direction: column; gap: 8px;
        }
        .toast {
            min-width: 260px; padding: 11px 14px;
            border-radius: var(--radius); box-shadow: var(--shadow);
            font-family: var(--font); font-size: 13px;
            display: flex; align-items: center; justify-content: space-between;
            opacity: 0; transform: translateY(10px);
            transition: var(--transition);
        }
        .toast.show { opacity: 1; transform: translateY(0); }
        .toast-success  { background: var(--success);  color: #fff; }
        .toast-error    { background: var(--danger);   color: #fff; }
        .toast-warning  { background: var(--warning);  color: var(--dark); }
        .toast-info     { background: var(--primary);  color: #fff; }
        .toast-close {
            background: none; border: none; color: inherit;
            cursor: pointer; font-size: 16px; margin-left: 10px; opacity: .7;
        }
        .toast-close:hover { opacity: 1; }

        /* Config Modal */
        .etsy-modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,.45);
            display: flex; align-items: center; justify-content: center;
            z-index: 99999;
            opacity: 0; visibility: hidden; transition: var(--transition);
        }
        .etsy-modal-overlay.show { opacity: 1; visibility: visible; }
        .etsy-modal {
            background: #fff; border-radius: 8px;
            box-shadow: var(--shadow);
            width: 90%; max-width: 520px; max-height: 90vh; overflow: auto;
            transform: translateY(-16px); transition: var(--transition);
        }
        .etsy-modal-overlay.show .etsy-modal { transform: translateY(0); }
        .etsy-modal-header {
            padding: 14px 18px;
            border-bottom: 1px solid #eee;
            display: flex; align-items: center; justify-content: space-between;
            font-family: var(--font); font-weight: 600; font-size: 16px;
        }
        .etsy-modal-body { padding: 18px; }
        .etsy-modal-footer {
            padding: 14px 18px; border-top: 1px solid #eee;
            display: flex; justify-content: flex-end; gap: 10px;
        }
        .etsy-modal label {
            display: block; margin-bottom: 4px;
            font-family: var(--font); font-size: 13px; font-weight: 600;
        }
        .etsy-modal input, .etsy-modal textarea {
            width: 100%; padding: 7px 10px;
            border: 1px solid #ccc; border-radius: var(--radius);
            font-family: var(--font); font-size: 14px;
            box-sizing: border-box; transition: var(--transition);
            margin-bottom: 14px;
        }
        .etsy-modal input:focus, .etsy-modal textarea:focus {
            outline: none; border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(0,123,255,.2);
        }
        .etsy-modal textarea { height: 90px; resize: vertical; }
        .btn {
            padding: 8px 16px; border: none; border-radius: var(--radius);
            font-family: var(--font); font-size: 13px; font-weight: 600;
            cursor: pointer; transition: var(--transition);
        }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:hover { background: var(--primary-dark); }
        .btn-light { background: var(--light); color: var(--dark); border: 1px solid #ccc; }
        .btn-light:hover { background: #e2e6ea; }
    `);

    // ─── Constants & State ────────────────────────────────────────────────────
    const API_BASE = 'https://ssapi.shipstation.com';
    const EXCLUDED_STORE_ID = 307646;

    const DEFAULT_CONFIG = { apiKey: '', apiSecret: '', selectedDateRange: 'yesterday', storeIds: '{}' };
    let config = { ...DEFAULT_CONFIG };
    let toastContainer = null;
    let activeChart = null;     // track Chart instance to destroy on re-render
    let overlayInitialized = false;

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const authHeader = () => btoa(`${config.apiKey}:${config.apiSecret}`);

    const delay = ms => new Promise(r => setTimeout(r, ms));

    /** Safe JSON parse for config.storeIds */
    const parseStoreIds = () => {
        try { return JSON.parse(config.storeIds); }
        catch { return {}; }
    };

    /** Returns a NEW Date object offset by `days` from today — never mutates. */
    const dateOffset = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };

    /** Maps a dateRange key → { startDate, endDate } */
    const resolveDateRange = (range) => {
        const today = dateOffset(0);
        switch (range) {
            case 'today':     return { startDate: today,          endDate: today };
            case 'yesterday': return { startDate: dateOffset(-1), endDate: today };
            case 'otherday':  return { startDate: dateOffset(-2), endDate: dateOffset(-1) };
            case 'last7':     return { startDate: dateOffset(-7), endDate: today };
            case 'last30':    return { startDate: dateOffset(-30),endDate: today };
            default:          return { startDate: today,          endDate: today };
        }
    };

    // ─── Config ───────────────────────────────────────────────────────────────
    async function loadConfig() {
        try {
            const saved = await GM.getValue('Config');
            if (saved) config = { ...DEFAULT_CONFIG, ...saved };
        } catch (e) { console.error('[SS] Config load error:', e); }
    }

    async function saveConfig() {
        try { await GM.setValue('Config', config); }
        catch (e) { console.error('[SS] Config save error:', e); }
    }

    // ─── Toast ────────────────────────────────────────────────────────────────
    function showToast(message, type = 'info', duration = 3500) {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const msg = document.createElement('span');
        msg.textContent = message;

        const close = document.createElement('button');
        close.className = 'toast-close';
        close.innerHTML = '&times;';
        close.onclick = () => dismissToast(toast);

        toast.append(msg, close);
        toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));

        if (duration > 0) setTimeout(() => dismissToast(toast), duration);
    }

    function dismissToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }

    // ─── Loading ──────────────────────────────────────────────────────────────
    function showLoading() {
        hideLoading();
        const el = document.createElement('div');
        el.id = 'loading-indicator';
        el.innerHTML = '<div class="spinner"></div> Veriler yükleniyor...';
        document.body.appendChild(el);
    }

    function hideLoading() {
        document.getElementById('loading-indicator')?.remove();
    }

    // ─── Config Modal ─────────────────────────────────────────────────────────
    async function showConfigMenu() {
        await loadConfig();

        const overlay = document.createElement('div');
        overlay.className = 'etsy-modal-overlay';

        const fields = [
            { id: 'apiKey',            label: 'API Key',            type: 'text',     value: config.apiKey },
            { id: 'apiSecret',         label: 'API Secret',         type: 'password', value: config.apiSecret },
            { id: 'selectedDateRange', label: 'Varsayılan Aralık',  type: 'text',     value: config.selectedDateRange },
            { id: 'storeIds',          label: 'Store IDs (JSON)',   type: 'textarea', value: config.storeIds },
        ];

        const bodyHTML = fields.map(f => {
            const tag = f.type === 'textarea'
                ? `<textarea id="cfg-${f.id}">${f.value}</textarea>`
                : `<input type="${f.type}" id="cfg-${f.id}" value="${f.value}" autocomplete="off">`;
            return `<label>${f.label}</label>${tag}`;
        }).join('');

        overlay.innerHTML = `
            <div class="etsy-modal">
                <div class="etsy-modal-header">
                    ⚙️ ShipStation Ayarları
                    <button class="btn btn-light" id="cfg-close" style="padding:4px 10px">&times;</button>
                </div>
                <div class="etsy-modal-body">${bodyHTML}</div>
                <div class="etsy-modal-footer">
                    <button class="btn btn-light" id="cfg-cancel">İptal</button>
                    <button class="btn btn-primary" id="cfg-save">Kaydet</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        const close = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.querySelector('#cfg-close').onclick  = close;
        overlay.querySelector('#cfg-cancel').onclick = close;
        overlay.querySelector('#cfg-save').onclick   = async () => {
            fields.forEach(f => {
                config[f.id] = document.getElementById(`cfg-${f.id}`).value.trim();
            });
            // Validate JSON before saving
            try { JSON.parse(config.storeIds); }
            catch { showToast('storeIds geçerli bir JSON değil!', 'error'); return; }
            await saveConfig();
            showToast('Ayarlar kaydedildi', 'success');
            close();
        };
    }

    // ─── API Wrappers ─────────────────────────────────────────────────────────

    /** Wraps GM_xmlhttpRequest in a Promise. */
    function gmRequest(options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                ...options,
                headers: {
                    'Authorization': `Basic ${authHeader()}`,
                    'Content-Type': 'application/json',
                    ...(options.headers || {}),
                },
                onload:  resolve,
                onerror: reject,
            });
        });
    }

    async function getStores() {
        const res = await gmRequest({ method: 'GET', url: `${API_BASE}/stores` });
        if (res.status !== 200) throw new Error(`getStores failed: ${res.status}`);
        const stores = JSON.parse(res.responseText);
        return stores.filter(s => s.storeId !== EXCLUDED_STORE_ID);
    }

    async function refreshStore(storeId) {
        const res = await gmRequest({
            method: 'POST',
            url: `${API_BASE}/stores/refreshstore?storeId=${storeId}`,
        });
        if (res.status !== 200)
            console.warn(`[SS] refreshStore ${storeId} → ${res.status}`);
        return res.status;
    }

    /** Fetch ALL pages for a single store. */
    async function fetchAllOrdersForStore(startDate, endDate, storeId) {
        const baseUrl = `${API_BASE}/orders?createDateStart=${startDate}&createDateEnd=${endDate}&storeId=${storeId}`;
        let page = 1;
        let all  = [];

        while (true) {
            const res = await gmRequest({ method: 'GET', url: `${baseUrl}&page=${page}` });
            if (res.status !== 200) {
                console.error(`[SS] fetchOrders storeId=${storeId} page=${page} → ${res.status}`);
                break;
            }
            const data = JSON.parse(res.responseText);
            all = all.concat(data.orders);
            if (data.orders.length < 100) break; // last page
            page++;
        }
        return all;
    }

    // ─── Store ID Resolution ──────────────────────────────────────────────────

    /**
     * pod values:
     *   "0"  → use config.storeIds only
     *   "1"  → fetch all stores from API
     *   else → single specific storeId
     */
    async function resolveStoreMap(pod) {
        const myStores = parseStoreIds();
        if (pod == 1){
            if(config?.pod == 1){
                pod='1';
            }else{
                pod='0';
            }
        }
        if (pod === '1') {
            const stores = await getStores();
            const map = {};
            stores.forEach(s => { map[s.storeId] = s.storeName.replace('CUSTOMHUB ', ''); });
            return map;
        }

        if (pod === '0') return myStores;

        // Single store
        return { [pod]: myStores[pod] ?? 'Shop' };
    }

    // ─── Sync (Refresh) ───────────────────────────────────────────────────────
    async function syncStores(pod) {
        const storeMap  = await resolveStoreMap(pod);
        const storeIds  = Object.keys(storeMap);
        const results   = [];

        for (let i = 0; i < storeIds.length; i++) {
            const status = await refreshStore(storeIds[i]);
            results.push(status);
            if (i < storeIds.length - 1) await delay(2200);
        }

        return results.every(s => s === 200) ? 200 : null;
    }

    // ─── Sales Data ───────────────────────────────────────────────────────────
    async function getSalesData(startDate, endDate, pod) {
        const storeMap = await resolveStoreMap(pod);
        const entries  = Object.entries(storeMap);

        // Parallel fetch — all stores at once
        const results = await Promise.all(
            entries.map(async ([storeId, storeName]) => {
                const orders = await fetchAllOrdersForStore(startDate, endDate, storeId);
                return { storeId, storeName, orders };
            })
        );

        return results;
    }

    // ─── Chart ────────────────────────────────────────────────────────────────
    function renderChart(orders) {
        const salesByDate = {};
        orders.forEach(o => {
            const date   = o.createDate.split('T')[0];
            const amount = parseFloat(o.amountPaid) || 0;
            if (!salesByDate[date]) salesByDate[date] = { sales: 0, count: 0 };
            salesByDate[date].sales += amount;
            salesByDate[date].count += 1;
        });

        const labels = Object.keys(salesByDate).sort();
        const salesArr  = labels.map(d => +salesByDate[d].sales.toFixed(2));
        const ordersArr = labels.map(d => salesByDate[d].count);

        const canvas = document.getElementById('salesChart');
        if (!canvas) return;

        if (activeChart) { activeChart.destroy(); activeChart = null; }

        activeChart = new Chart(canvas.getContext('2d'), {
            data: {
                labels,
                datasets: [
                    {
                        type: 'line', label: 'Satış ($)',
                        data: salesArr,
                        borderColor: '#007bff', backgroundColor: 'rgba(0,123,255,.1)',
                        yAxisID: 'ySales', tension: 0.3, pointRadius: 3,
                    },
                    {
                        type: 'bar', label: 'Sipariş Adedi',
                        data: ordersArr,
                        backgroundColor: 'rgba(255,99,132,.35)', borderColor: 'rgba(255,99,132,1)',
                        borderWidth: 1, yAxisID: 'yOrders',
                    },
                ],
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    ySales:  { type: 'linear', position: 'left',  beginAtZero: true, title: { display: true, text: 'USD ($)' } },
                    yOrders: { type: 'linear', position: 'right', beginAtZero: true, title: { display: true, text: 'Adet' }, grid: { drawOnChartArea: false } },
                },
            },
        });
    }

    // ─── Table ────────────────────────────────────────────────────────────────
    function displaySalesTable(salesData, startDate, endDate) {
        const container = document.getElementById('sales-report-container');
        if (!container) return;

        // Sort by revenue desc
        salesData.sort((a, b) => {
            const sumA = a.orders.reduce((s, o) => s + (parseFloat(o.amountPaid) || 0), 0);
            const sumB = b.orders.reduce((s, o) => s + (parseFloat(o.amountPaid) || 0), 0);
            return sumB - sumA;
        });

        const myStoreNames = new Set(Object.values(parseStoreIds()));
        const ms   = new Date(endDate) - new Date(startDate);
        const days = Math.max(1, ms / 864e5);

        let gOrders = 0, gSales = 0;

        const tbody = salesData.map(({ storeName, orders }, idx) => {
            const cnt   = orders.length;
            const total = orders.reduce((s, o) => s + (parseFloat(o.amountPaid) || 0), 0);
            const avg   = cnt > 0 ? Math.ceil(total / cnt) : 0;
            gOrders += cnt;
            gSales  += total;
            const bold = myStoreNames.has(storeName) ? 'font-weight:600' : '';
            return `<tr>
                <td>${idx + 1}</td>
                <td style="${bold}">${storeName}</td>
                <td>${cnt}</td>
                <td>$${total.toFixed(2)}</td>
                <td>$${avg}</td>
            </tr>`;
        }).join('');

        const gAvg = gOrders > 0 ? Math.ceil(gSales / gOrders) : 0;

        // Rebuild only the dynamic portion — keep the sticky menu intact
        const existingMenu = container.querySelector('#sales-dropdown-menu');

        container.innerHTML = '';
        if (existingMenu) container.appendChild(existingMenu);

        container.insertAdjacentHTML('beforeend', `
            <canvas id="salesChart" style="padding:10px 12px;"></canvas>
            <table id="sales-report-table">
                <thead>
                    <tr>
                        <th>#</th><th>Mağaza</th><th>Sipariş</th><th>Ciro</th><th>Ort. ($)</th>
                    </tr>
                </thead>
                <tbody>${tbody}</tbody>
                <tfoot>
                    <tr>
                        <th colspan="2">TOPLAM</th>
                        <th>${gOrders}</th>
                        <th>$${gSales.toFixed(2)}</th>
                        <th>$${gAvg}</th>
                    </tr>
                    <tr>
                        <th colspan="2">GÜNLÜK ORT. (${days} gün)</th>
                        <th>${(gOrders / days).toFixed(1)}</th>
                        <th>$${(gSales / days).toFixed(2)}</th>
                        <th>—</th>
                    </tr>
                </tfoot>
            </table>
        `);

        renderChart(salesData.flatMap(d => d.orders));
        hideLoading();
    }

    // ─── Overlay (Sync button) ────────────────────────────────────────────────
    async function initOverlay() {
        if (overlayInitialized) return;

        const refreshArea = document.getElementById('refresh-area');
        if (!refreshArea) return;

        overlayInitialized = true;

        const btn = document.createElement('button');
        btn.title = 'ShipStation Senkronize Et';
        btn.style.cssText = 'margin-left:4px;padding:4px 10px;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:11px;';
        btn.textContent = '🔄 Sync';

        refreshArea.appendChild(btn);

        btn.addEventListener('click', async () => {
            const pod = document.getElementById('pod-select')?.value ?? '0';
            btn.disabled = true;
            btn.textContent = '⏳';
            btn.style.background = '#ffc107';

            try {
                const status = await syncStores(pod);
                if (status === 200) {
                    btn.textContent = '✅';
                    btn.style.background = '#d4edda';
                    showToast('ShipStation siparişleri alındı', 'success');
                } else {
                    btn.textContent = '❌';
                    btn.style.background = '#f8d7da';
                    showToast('Senkronizasyon başarısız', 'error');
                }
            } catch (e) {
                btn.textContent = '❌';
                btn.style.background = '#f8d7da';
                showToast(`Hata: ${e.message}`, 'error');
                console.error('[SS] syncStores error:', e);
            } finally {
                btn.disabled = false;
                setTimeout(() => {
                    btn.textContent = '🔄 Sync';
                    btn.style.background = '';
                }, 4000);
            }
        });
    }

    // ─── Dropdown Menu ────────────────────────────────────────────────────────
    function createDropdownMenu(container) {
        const myStores = parseStoreIds();
        const storeOptions = Object.entries(myStores)
            .map(([id, name]) => `<option value="${id}">${name}</option>`)
            .join('');

        const menu = document.createElement('div');
        menu.id = 'sales-dropdown-menu';
        menu.innerHTML = `
            <select id="pod-select">
                <option value="0">My Stores</option>
                <option value="1">Tümü</option>
                ${storeOptions}
            </select>
            <select id="date-range-select">
                <option value="today">Bugün</option>
                <option value="yesterday">Dün</option>
                <option value="otherday">Evvelsi Gün</option>
                <option value="last7">Son 7 Gün</option>
                <option value="last30">Son 30 Gün</option>
            </select>
            <button id="fetch-sales-btn">📊 Getir</button>
            <span id="refresh-area"></span>
            <span id="loading-area"></span>
        `;

        container.appendChild(menu);

        // Restore saved date range
        if (config.selectedDateRange) {
            const sel = menu.querySelector('#date-range-select');
            if (sel) sel.value = config.selectedDateRange;
        }

        menu.querySelector('#fetch-sales-btn').addEventListener('click', async () => {
            const range = document.getElementById('date-range-select').value;
            const pod   = document.getElementById('pod-select').value;

            config.selectedDateRange = range;
            await saveConfig();

            const { startDate, endDate } = resolveDateRange(range);

            showLoading();
            try {
                const data = await getSalesData(startDate, endDate, pod);
                displaySalesTable(data, startDate, endDate);
            } catch (e) {
                hideLoading();
                showToast(`Veri alınamadı: ${e.message}`, 'error');
                console.error('[SS] getSalesData error:', e);
            }
        });

        // Init overlay after menu is in DOM
        initOverlay();
    }

    // ─── Floating Button & Panel ──────────────────────────────────────────────
    function createFloatingButton() {
        const btn = document.createElement('button');
        btn.id = 'sales-floating-button';
        btn.innerHTML = '📊';
        btn.title = 'ShipStation Raporu';
        document.body.appendChild(btn);

        const panel = document.createElement('div');
        panel.id = 'sales-report-container';
        panel.style.display = 'none';
        document.body.appendChild(panel);

        // Build the menu once
        createDropdownMenu(panel);

        btn.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
    }

    // ─── Init ─────────────────────────────────────────────────────────────────
    async function initialize() {
        await loadConfig();
        GM.registerMenuCommand('⚙️ ShipStation Ayarları', showConfigMenu);
        createFloatingButton();
    }

    initialize();

})();
