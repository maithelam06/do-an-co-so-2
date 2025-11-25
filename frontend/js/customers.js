const API_BASE_URL = "http://localhost:8000/api";

let allCustomers = [];

// Badge trạng thái
function renderCustomerStatus(status) {
  switch (status) {
    case "blocked":
      return '<span class="badge bg-danger">Đã khóa</span>';
    case "active":
    default:
      return '<span class="badge bg-success">Đang hoạt động</span>';
  }
}

// Load khách hàng từ API
async function loadCustomers() {
  try {
    const token = localStorage.getItem("token"); // 🔥 lấy token (nếu có)

    const res = await fetch(`${API_BASE_URL}/customers`, {
      headers: token
        ? { Authorization: "Bearer " + token }
        : {}, // nếu sau này /customers cần auth thì sẵn luôn
    });

    // 🔥 Nếu BE trả 401/403 (token hết hạn / tài khoản bị khóa)
    if (res.status === 401 || res.status === 403) {
      await Swal.fire({
        icon: "error",
        title: "Tài khoản đã bị khóa!",
        text: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
        confirmButtonText: "Đăng nhập lại",
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/frontend/login.html";
      return;
    }

    if (!res.ok) {
      console.error("Lỗi load customers:", await res.text());
      Swal.fire("Lỗi", "Không tải được danh sách khách hàng", "error");
      return;
    }

    allCustomers = await res.json();
    renderCustomers();
  } catch (err) {
    console.error("Lỗi load customers:", err);
    Swal.fire("Lỗi", "Không tải được danh sách khách hàng", "error");
  }
}

// renner tim kiem kh
function renderCustomers() {
  const tbody = document.getElementById("customerTableBody");
  const search = document
    .getElementById("searchCustomerInput")
    .value.trim()
    .toLowerCase();
  const statusFilter = document.getElementById("customerStatusFilter").value;

  let filtered = allCustomers.filter((c) => {
    const code = (c.code || c.customer_code || `KH${c.id}`).toString();
    const name = c.full_name || c.name || "";
    const email = c.email || "";
    const phone = c.phone || "";

    const text = `${code} ${name} ${email} ${phone}`.toLowerCase();

    if (search && !text.includes(search)) return false;
    if (statusFilter && c.status !== statusFilter) return false;

    return true;
  });

  document.getElementById(
    "customerTotalText"
  ).textContent = `Tổng: ${filtered.length} khách hàng`;

  tbody.innerHTML = "";

  filtered.forEach((c, index) => {
    const tr = document.createElement("tr");

    const code = c.code || c.customer_code || `KH${c.id}`;
    const name = c.full_name || c.name || "(Chưa có tên)";
    const email = c.email || "";
    const phone = c.phone || "";
    const totalOrders = c.total_orders ?? c.orders_count ?? 0;
    const totalSpent = c.total_spent ?? 0;

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${code}</td>
      <td>${name}</td>
      <td>${email}</td>
      <td>${phone}</td>
      <td>${totalOrders}</td>
      <td>${Number(totalSpent).toLocaleString("vi-VN")} đ</td>
      <td>${renderCustomerStatus(c.status)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary mb-1"
                onclick="viewCustomerOrders(${c.id})">
          Đơn hàng
        </button>
        <button class="btn btn-sm btn-outline-danger mb-1"
                onclick="toggleBlockCustomer(${c.id})">
          ${c.status === "blocked" ? "Mở khóa" : "Khóa"}
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Xem đơn hàng của khách -> chuyển sang trang order.html kèm query
function viewCustomerOrders(customerId) {
  window.location.href = `/frontend/Admin/order.html?customerId=${customerId}`;
}

// Khóa / mở khóa khách hàng
async function toggleBlockCustomer(customerId) {
  const customer = allCustomers.find((c) => c.id === customerId);
  if (!customer) return;

  const isBlocked = customer.status === "blocked";

  const result = await Swal.fire({
    title: isBlocked ? "Mở khóa khách hàng?" : "Khóa khách hàng?",
    text: (customer.full_name || customer.name || "") || `ID: ${customerId}`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: isBlocked ? "Mở khóa" : "Khóa",
    cancelButtonText: "Hủy",
    confirmButtonColor: isBlocked ? "#3085d6" : "#d33",
  });

  if (!result.isConfirmed) return;

  try {
    const token = localStorage.getItem("token"); // 🔥 lấy token

    const res = await fetch(`${API_BASE_URL}/customers/${customerId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}), // 🔥 gửi kèm token nếu có
      },
      body: JSON.stringify({
        status: isBlocked ? "active" : "blocked",
      }),
    });

    // 🔥 Nếu admin đang dùng mà bị khóa (trường hợp đặc biệt)
    if (res.status === 401 || res.status === 403) {
      await Swal.fire({
        icon: "error",
        title: "Tài khoản đã bị khóa!",
        text: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
        confirmButtonText: "Đăng nhập lại",
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/frontend/login.html";
      return;
    }

    if (!res.ok) {
      console.error("Lỗi cập nhật trạng thái KH:", await res.text());
      Swal.fire("Lỗi", "Không cập nhật được trạng thái khách hàng", "error");
      return;
    }

    const updated = await res.json();
    const idx = allCustomers.findIndex((c) => c.id === customerId);
    if (idx !== -1) {
      allCustomers[idx] = updated;
    }

    Swal.fire(
      "Thành công",
      isBlocked ? "Đã mở khóa khách hàng" : "Đã khóa khách hàng",
      "success"
    );
    renderCustomers();
  } catch (err) {
    console.error("Lỗi cập nhật trạng thái KH:", err);
    Swal.fire("Lỗi", "Không cập nhật được trạng thái khách hàng", "error");
  }
}

// Khởi tạo
document.addEventListener("DOMContentLoaded", () => {
  loadCustomers();
});
