// ==UserScript==
// @name         ShipStation Sales Report Enhanced
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Show sales data by store for Yesterday, Last 7 Days, and Last 30 Days with floating button and improved UI
// @author       cengaver
// @icon         https://www.google.com/s2/favicons?domain=shipstation.com
// @match        *.customhub.io/*
// @match        *.etsy.com/your/shops/me/dashboard*
// @require      https://cdn.jsdelivr.net/npm/chart.js
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM.registerMenuCommand
// @grant        GM.getValue
// @grant        GM.setValue
// @connect      ssapi.shipstation.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ShipStationSalesReport.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/ShipStationSalesReport.user.js
// ==/UserScript==

(async function() {
    'use strict';

    GM_addStyle(`
    #sales-floating-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    }
    #sales-floating-button:hover {
        background-color: #0056b3;
    }
    #sales-report-container {
        position: fixed;
        top: 100px;
        right: 50px;
        width: 400px;
        max-height: 500px;
        background: #ffffff;
        border: 1px solid #ccc;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
        z-index: 9999;
    }
    #sales-report-table {
        width: 100%;
        border-collapse: collapse;
    }
    #sales-report-table th, #sales-report-table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    #sales-report-table th {
        background-color: #007bff;
        color: white;
    }
    #sales-report-table tr:hover {
        background-color: #f1f1f1;
    }
    #sales-dropdown-menu {
        margin: 10px;
    }
    #sales-dropdown-menu select, #sales-dropdown-menu button {
        margin-right: 5px;
        padding: 8px 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        font-size: 14px;
    }
    #loading-indicator {
        font-size: 16px;
        font-weight: bold;
        color: #333;
    }
`);

    const apiBaseUrl = 'https://ssapi.shipstation.com';
    const authHeader = (apiKey, apiSecret) => btoa(`${apiKey}:${apiSecret}`);

    GM.registerMenuCommand("API Anahtarını Ayarla", async () => {
        const apiKey = prompt("Lütfen API Anahtarını girin:", await GM.getValue("apiKey", ""));
        if (apiKey) await GM.setValue("apiKey", apiKey);
    });

    GM.registerMenuCommand("API Secret Ayarla", async () => {
        const apiSecret = prompt("Lütfen API Secret'ı girin:", await GM.getValue("apiSecret", ""));
        if (apiSecret) await GM.setValue("apiSecret", apiSecret);
    });

    GM.registerMenuCommand("Mağaza ID'lerini Ayarla", async () => {
        const storeIds = prompt(
            "Mağaza ID'lerini girin (örn: {'123':'X1','124':'X2'}):",
            await GM.getValue("storeIds", "{}")
        );
        try {
            const parsedStoreIds = JSON.parse(storeIds);
            if (typeof parsedStoreIds === "object") {
                await GM.setValue("storeIds", storeIds);
            } else {
                alert("Geçersiz format! Lütfen doğru bir JSON girin.");
            }
        } catch (e) {
            alert("Geçersiz JSON formatı!");
        }
    });

    const getApiConfig = async () => {
        const apiKey = await GM.getValue("apiKey", "");
        const apiSecret = await GM.getValue("apiSecret", "");
        const storeIdsRaw = await GM.getValue("storeIds", "{}");

        try {
            const storeIds = JSON.parse(storeIdsRaw);
            if (!apiKey || !apiSecret || Object.keys(storeIds).length === 0) {
                alert("API anahtarı, gizli anahtar ve mağaza ID'leri ayarlanmamış.");
                return null;
            }
            return { apiKey, apiSecret, storeIds };
        } catch (e) {
            alert("Mağaza ID'leri JSON formatında değil!");
            return null;
        }
    };

    const config = await getApiConfig();
    if (!config) return;

    const { apiKey, apiSecret, storeIds } = config;

    const waitForElement = (selector, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const interval = 100;
            let elapsedTime = 0;
            const checkExist = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(checkExist);
                    resolve(element);
                }
                elapsedTime += interval;
                if (elapsedTime >= timeout) {
                    clearInterval(checkExist);
                    reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms`));
                }
            }, interval);
        });
    };

    const getShipData = async () => {
        const store_ids = Object.keys(storeIds);
        const requests = store_ids.map(store => {
            const url = `https://ssapi.shipstation.com/stores/refreshstore?storeId=${store}`;
            return fetch(url, {
                method: "POST",
                headers: { 'Authorization': `Basic ${authHeader(apiKey, apiSecret)}` },
            }).then(response => {
                if (!response.ok) {
                    console.error(`Error refreshing store ${store}: ${response.status}`);
                    return response.status;
                }
                return 200;
            });
        });

        try {
            const results = await Promise.all(requests);
            console.log("All stores refreshed successfully:", results);
            return results.every(status => status === 200) ? 200 : null;
        } catch (error) {
            console.error("Error refreshing stores:", error);
            return null;
        }
    };

    async function getStores() {
        const response = await fetch(apiBaseUrl+"/stores", {
            method: "GET",
            headers: { 'Authorization': `Basic ${authHeader(apiKey, apiSecret)}` },
        });

        if (!response.ok) {
            console.error("Error:", response.status, await response.text());
            return;
        }

        const stores = await response.json();
        stores.forEach(store => {
            console.log(`ID: ${store.storeId} - Name: ${store.storeName}`);
        });
    }

    const initOverlay = async () => {
        try {
            const selector = await waitForElement("#refresh-area");

            const El = document.createElement("button");
            El.textContent = "Ship";
            El.title = "Ship Stations Senkronize";
            El.style.marginLeft = "1px";
            El.className = "mud-button-root mud-button mud-button-text mud-button-text-default mud-button-text-size-medium mud-ripple";
            El.style.fontSize = "1rem";
            El.style.color = "black";

            const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgIcon.setAttribute("aria-hidden", "true");
            svgIcon.setAttribute("focusable", "false");
            svgIcon.setAttribute("data-prefix", "fas");
            svgIcon.setAttribute("data-icon", "rotate-right");
            svgIcon.setAttribute("class", "svg-inline--fa fa-rotate-right icon");
            svgIcon.setAttribute("role", "img");
            svgIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svgIcon.setAttribute("viewBox", "0 0 512 512");
            svgIcon.style.width = "0.7em";
            svgIcon.style.height = "0.7em";
            svgIcon.style.marginLeft = "3px";

            const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            svgPath.setAttribute("fill", "currentColor");
            svgPath.setAttribute(
                "d",
                "M463.5 224l8.5 0c13.3 0 24-10.7 24-24l0-128c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8l119.5 0z"
            );

            svgIcon.appendChild(svgPath);
            El.appendChild(svgIcon);
            selector.appendChild(El);

            El.addEventListener("click", async function() {
                El.style.backgroundColor = "orange";
                const status = await getShipData();
                if (status == 200) {
                    El.textContent = "❤️";
                } else {
                    El.textContent = "🚨";
                    console.log("status:", status);
                }
                El.style.backgroundColor = null;
            });
        } catch (error) {
            console.error("Overlay initialization error:", error);
        }
    };

    const renderChart = (orders) => {
        const salesData = {};
        orders.forEach(order => {
            const date = order.createDate.split("T")[0];
            const amount = parseFloat(order.amountPaid || 0);
            if (!salesData[date]) salesData[date] = { totalSales: 0, totalOrders: 0 };
            salesData[date].totalSales += amount;
            salesData[date].totalOrders += 1;
        });

        const labels = Object.keys(salesData).sort();
        const salesDataArray = labels.map(date => salesData[date].totalSales);
        const ordersDataArray = labels.map(date => salesData[date].totalOrders);

        const ctx = document.getElementById("salesChart").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Satış Ücreti",
                        data: salesDataArray,
                        borderColor: "blue",
                        backgroundColor: "rgba(0, 0, 255, 0.1)",
                        type: "line",
                        yAxisID: "y-axis-sales"
                    },
                    {
                        label: "Satış Sayısı",
                        data: ordersDataArray,
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 1,
                        yAxisID: "y-axis-orders"
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    yAxes: [
                        {
                            id: "y-axis-sales",
                            type: "linear",
                            position: "left",
                            ticks: {
                                beginAtZero: true
                            }
                        },
                        {
                            id: "y-axis-orders",
                            type: "linear",
                            position: "right",
                            ticks: {
                                beginAtZero: true
                            },
                            gridLines: {
                                drawOnChartArea: false
                            }
                        }
                    ]
                }
            }
        });
    };

    const fetchSales = (startDate, endDate, storeId, storeName, callback) => {
        const url = `${apiBaseUrl}/orders?createDateStart=${startDate}&createDateEnd=${endDate}&storeId=${storeId}`;
        let currentPage = 1;
        let allOrders = [];

        const fetchPage = () => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${url}&page=${currentPage}`,
                headers: { 'Authorization': `Basic ${authHeader(apiKey, apiSecret)}` },
                onload: function(response) {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        allOrders = allOrders.concat(data.orders);
                        if (data.orders.length === 100) {
                            currentPage++;
                            fetchPage();
                        } else {
                            callback(allOrders);
                        }
                    } else {
                        console.error(`Error fetching data for store ${storeId}:`, response.statusText);
                    }
                },
                onerror: function(err) {
                    console.error(`Error fetching data for store ${storeId}:`, err);
                }
            });
        };
        fetchPage();
    };

    const getSalesData = (startDate, endDate, callback) => {
        const salesData = [];
        let processed = 0;

        for (const [storeId, storeName] of Object.entries(storeIds)) {
            fetchSales(startDate, endDate, storeId, storeName, data => {
                salesData.push({ storeId, storeName, orders: data });
                processed++;
                if (processed === Object.keys(storeIds).length) {
                    callback(salesData);
                }
            });
        }
    };

    const displaySalesTable = (salesData) => {
        const tableContainer = document.getElementById('sales-report-container');
        tableContainer.innerHTML = '<canvas id="salesChart"></canvas>';

        const table = document.createElement('table');
        table.id = 'sales-report-table';
        table.innerHTML = `
            <tr>
                <th>Mağaza Adı</th>
                <th>Satış Sayısı</th>
                <th>Satış Ücreti</th>
            </tr>
        `;
        let GtotalOrders = 0;
        let GtotalSales = 0;
        salesData.forEach(({ storeName, orders }) => {
            const totalOrders = orders.length;
            const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.amountPaid || 0), 0).toFixed(2);
            GtotalOrders += totalOrders;
            GtotalSales += parseFloat(totalSales);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${storeName}</td>
                <td>${totalOrders}</td>
                <td>${totalSales}</td>
            `;
            table.appendChild(row);
        });

        const rows = document.createElement('tr');
        rows.innerHTML = `
                <th>Toplam</th>
                <th>${GtotalOrders}</th>
                <th>${GtotalSales.toFixed(2)}</th>
        `;
        table.appendChild(rows);
        tableContainer.appendChild(table);
        tableContainer.style.display = 'block';

        renderChart(salesData.flatMap(data => data.orders));
        setTimeout(hideLoading, 2000);
        createDropdownMenu();
        initOverlay();
    };

    const createFloatingButton = () => {
        const button = document.createElement('button');
        button.id = 'sales-floating-button';
        button.innerHTML = '📊';
        document.body.appendChild(button);

        const tableContainer = document.createElement('div');
        tableContainer.id = 'sales-report-container';
        tableContainer.style.display = 'none';
        document.body.appendChild(tableContainer);

        button.addEventListener('click', () => {
            tableContainer.style.display = tableContainer.style.display === 'none' ? 'block' : 'none';
        });
    };


    const createDropdownMenu = () => {
        const menu = document.createElement('div');
        menu.id = 'sales-dropdown-menu';
        menu.innerHTML = `
        <select id="date-range-select">
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
        </select>
        <button id="fetch-sales-button">Get Sales</button>
        <span id= 'refresh-area'></span>
        <p id= 'loading-area'></p>
    `;
        document.getElementById('sales-report-container').appendChild(menu);

        GM.getValue("selectedDateRange", "").then((savedRange) => {
            if (savedRange) {
                document.getElementById('date-range-select').value = savedRange;
            }
        });

        document.getElementById('fetch-sales-button').addEventListener('click', () => {
            const dateRange = document.getElementById('date-range-select').value;
            GM.setValue('selectedDateRange', dateRange);
            const today = new Date();
            let startDate, endDate;

            if (dateRange === 'today') {
                endDate = today.toISOString().split('T')[0];
                //today.setDate(today.getDate() + 1);
                startDate = today.toISOString().split('T')[0];
             } else if (dateRange === 'yesterday') {
                endDate = today.toISOString().split('T')[0];
                today.setDate(today.getDate() - 1);
                startDate = today.toISOString().split('T')[0];
            } else if (dateRange === 'last7') {
                endDate = today.toISOString().split('T')[0];
                today.setDate(today.getDate() - 7);
                startDate = today.toISOString().split('T')[0];
            } else if (dateRange === 'last30') {
                endDate = today.toISOString().split('T')[0];
                today.setDate(today.getDate() - 30);
                startDate = today.toISOString().split('T')[0];
            }
            console.log("startDate:",startDate)
            console.log("endDate:",endDate)
            showLoading();
            getSalesData(startDate, endDate, displaySalesTable);
        });
    };

    const showLoading = () => {
        const loaderarea = document.getElementById('loading-area');
        const loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.innerHTML = 'Loading...';
        loader.style.position = 'fixed';
        loader.style.top = '50%';
        loader.style.left = '50%';
        loader.style.transform = 'translate(-50%, -50%)';
        loader.style.backgroundColor = '#fff';
        loader.style.padding = '20px';
        loader.style.borderRadius = '10px';
        loader.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        loaderarea.appendChild(loader);
    };

    const hideLoading = () => {
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.remove();
    };

    createFloatingButton();
    createDropdownMenu();
    initOverlay();
    //getStores();

})();
