const API_BASE_URL = "http://localhost:8000/api";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

// Trạng thái THANH TOÁN
function renderStatus(status) {
  switch (status) {
    case "pending":
      return '<span class="badge bg-warning text-dark">Chờ xử lý</span>';
    case "processing":
      return '<span class="badge bg-primary">Đang xử lý</span>';
    case "completed":
      return '<span class="badge bg-success">Hoàn thành</span>';
    case "refund_pending":
      return '<span class="badge bg-warning text-dark">Chờ hoàn tiền</span>';
    case "cancelled":
      return '<span class="badge bg-danger">Đã hủy</span>';
    default:
      return '<span class="badge bg-secondary">Không rõ</span>';
  }
}

// Trạng thái GIAO HÀNG
function renderShippingStatus(status) {
  switch (status) {
    case "pending":
      return '<span class="badge bg-warning text-dark">Chờ xử lí</span>';
    case "processing":
      return '<span class="badge bg-primary">Đang giao</span>';
    case "completed":
      return '<span class="badge bg-success">Đã giao</span>';
    case "cancelled":
      return '<span class="badge bg-danger">Đã hủy</span>';
    default:
      return '<span class="badge bg-secondary">Không rõ</span>';
  }
}

// Hiển thị phương thức thanh toán
function renderPaymentMethod(order) {
  if (order.payment_method === "cod") {
    return "Thanh toán khi nhận hàng (COD)";
  }
  if (order.payment_method === "bank") {
    if (order.payment_channel === "vnpay") {
      return "Chuyển khoản qua VNPay";
    }
    return "Chuyển khoản ngân hàng";
  }
  return order.payment_method || "Không rõ";
}

let ORDERS_CACHE = [];

// ===================== FILTER ORDERS =====================
function filterOrders() {
  const searchTerm = document.getElementById("searchInput")?.value.toLowerCase().trim() || "";
  const statusFilter = document.getElementById("statusFilter")?.value || "";

  if (!searchTerm && !statusFilter) {
    return ORDERS_CACHE;
  }

  return ORDERS_CACHE.filter(order => {
    // Tìm kiếm theo tên khách, SĐT, mã đơn
    const searchMatch = !searchTerm || 
      order.full_name?.toLowerCase().includes(searchTerm) ||
      order.phone?.toLowerCase().includes(searchTerm) ||
      `DH${order.id}`.toLowerCase().includes(searchTerm) ||
      order.address?.toLowerCase().includes(searchTerm);

    // Lọc theo trạng thái
    const statusMatch = !statusFilter || order.status === statusFilter;

    return searchMatch && statusMatch;
  });
}

// ===================== RENDER ORDERS TABLE =====================
function renderOrdersTable(orders) {
  const tbody = document.getElementById("orderTableBody");
  const totalText = document.getElementById("orderTotalText");
  const badge = document.getElementById("orderCountBadge");

  tbody.innerHTML = "";

  orders.forEach((order, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>DH${order.id}</td>
      <td>${order.full_name}</td>
      <td>${order.phone}</td>
      <td>${order.address}</td>
      <td>${renderPaymentMethod(order)}</td>
      <td>${formatCurrency(order.total_amount)}</td>
      <td>${renderStatus(order.status)}</td>
      <td>${renderShippingStatus(order.shipping_status)}</td>
      <td>${order.created_at}</td>      <td>
        <div class="btn-group" role="group" aria-label="Thao tác đơn hàng">
          <button class="btn btn-sm btn-outline-primary" 
                  onclick="showOrderDetail(${order.id})"
                  title="Xem chi tiết đơn hàng">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-success" 
                  onclick="openShippingStatusModal(${order.id})"
                  title="Cập nhật trạng thái giao hàng">
            <i class="fas fa-truck"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" 
                  onclick="deleteOrder(${order.id})"
                  title="Xóa đơn hàng">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  totalText.textContent = `Tổng: ${orders.length} đơn hàng`;
  badge.textContent = orders.length;
}

// ===================== LOAD LIST ORDERS =====================
async function loadOrdersAdmin() {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`);
    const orders = await res.json();
    
    ORDERS_CACHE = orders;
    renderOrders(); // Render sau khi load xong
  } catch (error) {
    console.error("Lỗi load orders:", error);
    const tbody = document.getElementById("orderTableBody");
    tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Lỗi tải dữ liệu đơn hàng</td></tr>';
  }
}

// ===================== DETAIL ORDER =====================
async function showOrderDetail(orderId) {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    if (!res.ok) {
      const txt = await res.text();
      console.error("Lỗi load chi tiết đơn:", txt);
      await Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: "Không tải được chi tiết đơn hàng!",
        confirmButtonText: "Đóng"
      });
      return;
    }

    const data = await res.json();
    const order = data.order;
    const items = data.items || [];

    document.getElementById("detailCustomerName").textContent =
      order.full_name || "";
    document.getElementById("detailCustomerPhone").textContent = order.phone || "";
    document.getElementById("detailCustomerAddress").textContent =
      order.address || "";
    document.getElementById("detailPaymentMethod").textContent =
      renderPaymentMethod(order);
    document.getElementById("detailNote").textContent =
      order.note || "Không có";

    document.getElementById("detailTotalAmount").textContent =
      formatCurrency(order.total_amount);

    const tbody = document.getElementById("detailProductBody");
    tbody.innerHTML = "";

    if (!items.length) {
      tbody.innerHTML = `
        <tr><td colspan="5" class="text-center text-muted">Không có sản phẩm.</td></tr>
      `;
    } else {
      items.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${item.product_name}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.price)}</td>
          <td>${formatCurrency(item.subtotal)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    const modal = new bootstrap.Modal(document.getElementById("orderDetailModal"));
    modal.show();
  } catch (err) {
    console.error("Exception showOrderDetail:", err);
    await Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: "Có lỗi xảy ra khi tải chi tiết đơn hàng!",
        confirmButtonText: "Đóng"
      });
  }
}

// ===================== UPDATE SHIPPING =====================
async function openShippingStatusModal(orderId) {
  const order = ORDERS_CACHE.find((o) => o.id === orderId);
  if (!order) return;

  const inputOptions = {
    pending: "Chờ xử lí",
    processing: "Đang giao",
    completed: "Đã giao",
    cancelled: "Đã hủy",
  };

  const { value: newShipping, isConfirmed } = await Swal.fire({
    title: `Cập nhật giao hàng DH${order.id}`,
    input: "select",
    inputOptions,
    inputValue: order.shipping_status,
    confirmButtonText: "Lưu",
    cancelButtonText: "Hủy",
    showCancelButton: true,
  });

  if (!isConfirmed || !newShipping) return;

  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipping_status: newShipping,
      }),
    });

    if (!res.ok) {
      Swal.fire("Lỗi", "Không thể cập nhật giao hàng!", "error");
      return;
    }

    Swal.fire("Thành công", "Đã cập nhật trạng thái!", "success");
    loadOrdersAdmin();
  } catch (err) {
    console.error("Lỗi update shipping:", err);
    Swal.fire("Lỗi", "Có lỗi khi cập nhật giao hàng", "error");
  }
}

async function deleteOrder(orderId) {
  const order = ORDERS_CACHE.find(o => o.id === orderId);
  const code = order?.code || order?.order_code || `DH${orderId}`;

  const result = await Swal.fire({
    title: "Xóa đơn hàng?",
    text: `Bạn có chắc muốn xóa đơn ${code}? Hành động này không thể hoàn tác.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#d33"
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Lỗi xóa đơn:", err);
      await Swal.fire("Lỗi", "Xóa đơn hàng thất bại!", "error");
      return;
    }

    // Xóa khỏi mảng và render lại
    ORDERS_CACHE = ORDERS_CACHE.filter(o => o.id !== orderId);
    renderOrders();

    await Swal.fire("Đã xóa!", `Đơn ${code} đã được xóa.`, "success");
  } catch (e) {
    console.error("Lỗi xóa đơn:", e);
    await Swal.fire("Lỗi", "Có lỗi xảy ra khi xóa đơn!", "error");
  }
}

// =====================
function loadOrders() {
  loadOrdersAdmin();
}
function renderOrders() {
  const filteredOrders = filterOrders();
  renderOrdersTable(filteredOrders);
}

document.addEventListener("DOMContentLoaded", loadOrdersAdmin);

