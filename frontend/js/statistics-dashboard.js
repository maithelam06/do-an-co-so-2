const API_BASE_URL = "http://localhost:8000/api";

let revenueChart;
let paymentChart;

//CountUp helper

function getCountUpClass() {
    // Một số bản CDN expose CountUp trực tiếp, một số lại nằm trong window.countUp.CountUp
    if (window.CountUp) return window.CountUp;
    if (window.countUp && window.countUp.CountUp) return window.countUp.CountUp;
    return null;
}

//Format & animate number

function formatCurrency(value) {
    return Number(value || 0).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });
}

function animateCurrency(elementId, value) {
    const el = document.getElementById(elementId);
    const CountUpClass = getCountUpClass();

    // Nếu chưa có CountUp → fallback set text bình thường
    if (!el || !CountUpClass) {
        el.innerText = formatCurrency(value);
        return;
    }

    const numAnim = new CountUpClass(elementId, value || 0, {
        duration: 1.2,
        separator: ".",
        decimal: ",",
        suffix: " ₫",
    });

    if (!numAnim.error) {
        numAnim.start();
    } else {
        console.error("CountUp error:", numAnim.error);
        el.innerText = formatCurrency(value);
    }
}

function animateNumber(elementId, value) {
    const el = document.getElementById(elementId);
    const CountUpClass = getCountUpClass();

    if (!el || !CountUpClass) {
        el.innerText = Number(value || 0).toLocaleString("vi-VN");
        return;
    }

    const numAnim = new CountUpClass(elementId, value || 0, {
        duration: 1.2,
        separator: ".",
    });

    if (!numAnim.error) {
        numAnim.start();
    } else {
        console.error("CountUp error:", numAnim.error);
        el.innerText = Number(value || 0).toLocaleString("vi-VN");
    }
}

/*Fetch helper*/

async function fetchJson(url) {
    console.log(" Fetch:", url);
    const res = await fetch(url);
    console.log(" Status:", res.status);

    if (!res.ok) {
        const txt = await res.text();
        console.error("Response error body:", txt);
        throw new Error(`Request failed: ${res.status}`);
    }

    const data = await res.json();
    console.log(" Data:", data);
    return data;
}

/*Bộ lọc ngày*/

function buildDateParams() {
    const from = document.getElementById("fromDate").value;
    const to = document.getElementById("toDate").value;

    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const q = params.toString();
    return q ? `?${q}` : "";
}

function applyQuickRange(days) {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - Number(days));

    const pad = (n) => (n < 10 ? "0" + n : n);

    const toStr = `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(
        to.getDate()
    )}`;
    const fromStr = `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(
        from.getDate()
    )}`;

    document.getElementById("toDate").value = toStr;
    document.getElementById("fromDate").value = fromStr;
}

/*Cards tổng quan*/

async function loadOverview() {
    try {
        const params = buildDateParams();
        const data = await fetchJson(
            `${API_BASE_URL}/admin/stats/overview${params}`
        );

        animateCurrency("statTotalRevenue", data.total_revenue ?? 0);
        animateNumber("statTotalOrders", data.total_orders ?? 0);
        animateCurrency("statAvgOrderValue", data.avg_order_value ?? 0);
        animateNumber("statNewCustomers", data.new_customers ?? 0);
    } catch (e) {
        console.error("Lỗi load overview:", e);
    }
}

//Biểu đồ doanh thu theo ngày

async function loadRevenueChart() {
    try {
        const params = buildDateParams();
        const data = await fetchJson(
            `${API_BASE_URL}/admin/stats/revenue-by-date${params}`
        );
        const labels = data.map((item) => item.date);
        const values = data.map((item) => item.revenue);

        const ctx = document.getElementById("revenueChart").getContext("2d");
        if (revenueChart) revenueChart.destroy();

        revenueChart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Doanh thu (VND)",
                        data: values,
                        fill: true,
                        tension: 0.3,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function (value) {
                                return Number(value).toLocaleString("vi-VN");
                            },
                        },
                    },
                },
            },
        });
    } catch (e) {
        console.error("Lỗi load revenue chart:", e);
    }
}

//Biểu đồ phương thức thanh toán 

async function loadPaymentMethodChart() {
    try {
        const params = buildDateParams();
        const data = await fetchJson(
            `${API_BASE_URL}/admin/stats/payment-method${params}`
        );
        const labels = Object.keys(data);
        const values = Object.values(data);

        const ctx = document
            .getElementById("paymentMethodChart")
            .getContext("2d");
        if (paymentChart) paymentChart.destroy();

        paymentChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [
                    {
                        data: values,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom",
                    },
                },
            },
        });
    } catch (e) {
        console.error("Lỗi load payment method chart:", e);
    }
}

//Top sản phẩm & khách hàng

async function loadTopProducts() {
    try {
        const params = buildDateParams();
        const data = await fetchJson(
            `${API_BASE_URL}/admin/stats/top-products${params}`
        );
        const tbody = document.getElementById("topProductsBody");
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML =
                '<tr><td colspan="4" class="text-center text-muted">Không có dữ liệu</td></tr>';
            return;
        }

        data.forEach((item, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.product_name}</td>
                <td>${item.total_qty}</td>
                <td>${formatCurrency(item.total_revenue)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Lỗi load top products:", e);
    }
}

async function loadTopCustomers() {
    try {
        const params = buildDateParams();
        const data = await fetchJson(
            `${API_BASE_URL}/admin/stats/top-customers${params}`
        );
        const tbody = document.getElementById("topCustomersBody");
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML =
                '<tr><td colspan="4" class="text-center text-muted">Không có dữ liệu</td></tr>';
            return;
        }

        data.forEach((item, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.full_name}</td>
                <td>${item.order_count}</td>
                <td>${formatCurrency(item.total_spent)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Lỗi load top customers:", e);
    }
}

//Load tất cả 

async function loadAllStats() {
    await Promise.all([
        loadOverview(),
        loadRevenueChart(),
        loadPaymentMethodChart(),
        loadTopProducts(),
        loadTopCustomers(),
    ]);
}
/* Init*/

document.addEventListener("DOMContentLoaded", () => {
    console.log("statistics-dashboard.js loaded");

    const quickRange = document.getElementById("quickRange");
    const filterBtn = document.getElementById("filterBtn");

    // Chọn nhanh 7/30/90 ngày
    if (quickRange) {
        quickRange.addEventListener("change", () => {
            const days = quickRange.value;
            if (days) {
                applyQuickRange(days);
                loadAllStats();
            }
        });
    }

    // Bấm "Áp dụng bộ lọc"
    if (filterBtn) {
        filterBtn.addEventListener("click", () => {
            loadAllStats();
        });
    }

    // Lần đầu: không filter ngày → lấy toàn bộ
    loadAllStats();
});
