const API_BASE_URL = "http://localhost:8000/api";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

function renderStatus(status) {
  switch (status) {
    case "pending":
      return '<span class="badge bg-warning text-dark">Chờ xử lý</span>';
    case "processing":
      return '<span class="badge bg-primary">Đang giao</span>';
    case "completed":
      return '<span class="badge bg-success">Hoàn thành</span>';
    case "cancelled":
      return '<span class="badge bg-danger">Đã hủy</span>';
    default:
      return '<span class="badge bg-secondary">Không rõ</span>';
  }
}

// Hiển thị text phương thức thanh toán
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

async function loadOrdersAdmin() {
  const tbody = document.getElementById("orderTableBody");
  const totalText = document.getElementById("orderTotalText");
  const badge = document.getElementById("orderCountBadge");

  tbody.innerHTML = "";

  const res = await fetch(`${API_BASE_URL}/orders`);
  const orders = await res.json();

  orders.forEach((order, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>DH${order.id}</td>
      <td>${order.full_name}</td>
      <td>${order.phone}</td>
      <td>${order.address}</td>
      <td>
        ${
          order.payment_method === "cod"
            ? "COD"
            : order.payment_channel || "Chuyển khoản"
        }
      </td>
      <td>${formatCurrency(order.total_amount)}</td>
      <td>${renderStatus(order.status)}</td>
      <td>${order.created_at}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary"
                onclick="showOrderDetail(${order.id})">
          Chi tiết
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  totalText.textContent = `Tổng: ${orders.length} đơn hàng`;
  badge.textContent = orders.length;
}

// ====== CHI TIẾT ĐƠN HÀNG ======
async function showOrderDetail(orderId) {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    if (!res.ok) {
      const txt = await res.text();
      console.error("Lỗi load chi tiết đơn:", txt);
      alert("Không tải được chi tiết đơn hàng");
      return;
    }

    const data = await res.json();
    console.log("Order detail API:", data);

    const order = data.order || data;
    const items = data.items || order.items || [];

    // --- Thông tin khách hàng ---
    document.getElementById("detailCustomerName").textContent =
      order.full_name || order.customer_name || "";
    document.getElementById("detailCustomerPhone").textContent =
      order.phone || order.customer_phone || "";
    document.getElementById("detailCustomerAddress").textContent =
      order.address || "";
    document.getElementById("detailPaymentMethod").textContent =
      renderPaymentMethod(order);
    document.getElementById("detailNote").textContent =
      order.note || "Không có";

    // Tổng tiền
    document.getElementById("detailTotalAmount").textContent =
      formatCurrency(order.total_amount || order.total_price);

    // --- Sản phẩm trong đơn ---
    const tbody = document.getElementById("detailProductBody");
    tbody.innerHTML = "";

    if (!items.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">
            Đơn hàng không có sản phẩm hoặc API chưa trả về danh sách sản phẩm.
          </td>
        </tr>
      `;
    } else {
      items.forEach((item, index) => {
        const name =
          item.product_name ||
          item.name ||
          (item.product && item.product.name) ||
          "Sản phẩm";
        const qty = item.quantity || item.qty || 0;
        const price =
          item.price || item.unit_price || item.product_price || 0;
        const lineTotal =
          item.subtotal ||
          item.total ||
          item.total_price ||
          Number(price) * Number(qty);

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${name}</td>
          <td>${qty}</td>
          <td>${formatCurrency(price)}</td>
          <td>${formatCurrency(lineTotal)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Mở modal
    const modalEl = document.getElementById("orderDetailModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  } catch (err) {
    console.error("Exception showOrderDetail:", err);
    alert("Có lỗi xảy ra khi tải chi tiết đơn hàng");
  }
}


document.addEventListener("DOMContentLoaded", loadOrdersAdmin);
