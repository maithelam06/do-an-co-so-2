const API_BASE_URL = "http://localhost:8000/api";

function formatCurrency(value) {
    return Number(value || 0).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });
}

function renderStatus(status) {
    switch (status) {
        case "completed":
            return '<span class="badge bg-success">Hoàn thành</span>';
        case "pending":
            return '<span class="badge bg-warning text-dark">Chờ xử lý</span>';
        case "cancelled":
            return '<span class="badge bg-danger">Đã hủy</span>';
        default:
            return '<span class="badge bg-secondary">Không rõ</span>';
    }
}

function buildFilterParams() {
    const from = document.getElementById("fromDate").value;
    const to = document.getElementById("toDate").value;
    const status = document.getElementById("statusFilter").value;

    const searchParams = new URLSearchParams();

    if (from) searchParams.append("from", from);
    if (to) searchParams.append("to", to);
    if (status) searchParams.append("status", status);

    const query = searchParams.toString();
    return query ? `?${query}` : "";
}

/* ANIMATION*/

// Đếm số nguyên: 0 -> target
function animateCount(id, target, duration = 800) {
    const el = document.getElementById(id);
    if (!el) return;

    target = Number(target || 0);
    const currentText = el.innerText.replace(/[^\d]/g, "");
    const start = Number(currentText || 0);
    const range = target - start;
    const startTime = performance.now();

    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.round(start + range * progress);
        el.innerText = value.toLocaleString("vi-VN");
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// Đếm số tiền, có format VND
function animateCurrency(id, target, duration = 800) {
    const el = document.getElementById(id);
    if (!el) return;

    target = Number(target || 0);
    const currentText = el.innerText.replace(/[^\d]/g, "");
    const start = Number(currentText || 0);
    const range = target - start;
    const startTime = performance.now();

    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.round(start + range * progress);
        el.innerText = value.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
        });
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// Cập nhật toàn bộ card summary bằng animation
function updateSummaryCards(data) {
    animateCount("totalOrders",     data.total_orders     ?? 0);
    animateCount("paidOrders",      data.paid_orders      ?? 0);
    animateCount("cancelledOrders", data.cancelled_orders ?? 0);
    animateCount("pendingOrders",   data.pending_orders   ?? 0);
    animateCurrency("totalRevenue", data.total_revenue    ?? 0);
    animateCurrency("todayRevenue", data.today_revenue    ?? 0);
}

/*FETCH HELPER*/

async function safeFetchJson(url) {
    console.log("🛰 Fetch:", url);
    const res = await fetch(url);

    console.log("Status:", res.status);
    if (!res.ok) {
        const text = await res.text();
        console.error("Lỗi response:", text);
        throw new Error(`Request failed: ${res.status}`);
    }

    const data = await res.json();
    console.log("Data:", data);
    return data;
}

//VNPay

async function loadVnpaySummary() {
    try {
        const params = buildFilterParams();
        const url = `${API_BASE_URL}/admin/vnpay/summary${params}`;
        const data = await safeFetchJson(url);

        updateSummaryCards(data); // dùng animation
    } catch (err) {
        console.error("Lỗi load summary VNPay:", err);
    }
}

async function loadVnpayOrders() {
    try {
        const params = buildFilterParams();
        const url = `${API_BASE_URL}/admin/vnpay/orders${params}`;
        const page = await safeFetchJson(url);

        const tbody = document.getElementById("orderTableBody");
        tbody.innerHTML = "";

        const orders = page.data || page; // paginate hoặc array

        if (!orders || !orders.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">Không có đơn nào</td>
                </tr>
            `;
            return;
        }

        orders.forEach((order) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${order.id}</td>
                <td>${order.full_name ?? ""}</td>
                <td>${order.phone ?? ""}</td>
                <td>${formatCurrency(order.total_amount)}</td>
                <td>VNPay</td>
                <td>${renderStatus(order.status)}</td>
                <td>${order.created_at}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Lỗi load orders VNPay:", err);
    }
}

/*COD*/

async function loadCodSummary() {
    try {
        const params = buildFilterParams();
        const url = `${API_BASE_URL}/admin/cod/summary${params}`;
        const data = await safeFetchJson(url);

        updateSummaryCards(data); // dùng lại animation
    } catch (err) {
        console.error("Lỗi load summary COD:", err);
    }
}

async function loadCodOrders() {
    try {
        const params = buildFilterParams();
        const url = `${API_BASE_URL}/admin/cod/orders${params}`;
        const page = await safeFetchJson(url);

        const tbody = document.getElementById("orderTableBody");
        tbody.innerHTML = "";

        const orders = page.data || page;

        if (!orders || !orders.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">Không có đơn nào</td>
                </tr>
            `;
            return;
        }

        orders.forEach((order) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${order.id}</td>
                <td>${order.full_name ?? ""}</td>
                <td>${order.phone ?? ""}</td>
                <td>${formatCurrency(order.total_amount)}</td>
                <td>COD (Thanh toán khi nhận hàng)</td>
                <td>${renderStatus(order.status)}</td>
                <td>${order.created_at}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Lỗi load orders COD:", err);
    }
}

/*CHỌN MODE + INIT */

async function loadDataByMethod() {
    const methodSelect = document.getElementById("paymentMethodFilter");
    const currentMethod = methodSelect?.value || "vnpay";

    const label = document.getElementById("currentPaymentLabel");
    if (label) {
        label.innerText = currentMethod === "vnpay" ? "VNPay" : "COD";
    }

    if (currentMethod === "vnpay") {
        await loadVnpaySummary();
        await loadVnpayOrders();
    } else {
        await loadCodSummary();
        await loadCodOrders();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("vnpay-dashboard.js loaded");

    const filterBtn = document.getElementById("filterBtn");
    const paymentSelect = document.getElementById("paymentMethodFilter");

    if (filterBtn) {
        filterBtn.addEventListener("click", () => {
            loadDataByMethod();
        });
    }

    if (paymentSelect) {
        paymentSelect.addEventListener("change", () => {
            loadDataByMethod();
        });
    }

    // Load mặc định (VNPay)
    loadDataByMethod();
});
