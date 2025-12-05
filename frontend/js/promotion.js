const API_BASE_URL = "http://localhost:8000/api";

// Lấy token admin (y như các trang admin khác)
function getAuthToken() {
  return localStorage.getItem("token");
}

let coupons = [];
let editingId = null; // đang sửa mã nào
let allProducts = []; // danh sách tất cả sản phẩm để chọn

function renderStatusBadge(status) {
  return status === "active"
    ? '<span class="badge bg-success">Đang áp dụng</span>'
    : '<span class="badge bg-secondary">Tạm dừng</span>';
}

function formatType(type, discount) {
  if (type === "percent") return `Giảm ${discount}%`;
  return `Giảm ${Number(discount).toLocaleString("vi-VN")}đ`;
}

function formatScope(coupon) {
  // nếu không có products hoặc mảng rỗng -> áp dụng cho tất cả
  if (!coupon.products || coupon.products.length === 0) {
    return "Tất cả sản phẩm";
  }
  if (coupon.products.length === 1) {
    return `1 sản phẩm`;
  }
  return `${coupon.products.length} sản phẩm`;
}

// Render danh sách sản phẩm để chọn
function renderProductList(selectedIds = []) {
  const container = document.getElementById("productList");
  if (!container) return;

  container.innerHTML = "";

  if (!allProducts || allProducts.length === 0) {
    container.innerHTML =
      '<div class="col-12"><small class="text-muted">Chưa có sản phẩm nào.</small></div>';
    return;
  }

  const selectedSet = new Set(selectedIds);

  allProducts.forEach((p) => {
    const checked = selectedSet.has(p.id) ? "checked" : "";
    container.innerHTML += `
      <div class="col-md-6">
        <div class="form-check">
          <input class="form-check-input product-checkbox" type="checkbox" value="${p.id}"
                 id="prod-${p.id}" ${checked}>
          <label class="form-check-label" for="prod-${p.id}">
            ${p.name}
          </label>
        </div>
      </div>
    `;
  });
}

// Render bảng mã giảm giá
function renderCoupons() {
  const tbody = document.getElementById("couponTableBody");
  const search = document.getElementById("searchCoupon").value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value;

  let filtered = coupons.filter((c) => {
    const matchSearch =
      c.code.toLowerCase().includes(search) ||
      (c.description && c.description.toLowerCase().includes(search));

    const matchStatus = statusFilter ? c.status === statusFilter : true;

    return matchSearch && matchStatus;
  });

  tbody.innerHTML = filtered
    .map(
      (c, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${c.code}</strong></td>
        <td>${c.type === "percent" ? "Theo %" : "Theo tiền"}</td>
        <td>${formatType(c.type, c.discount)}</td>
        <td>${c.start_date || "-"}</td>
        <td>${c.expires_at}</td>
        <td>${renderStatusBadge(c.status)}</td>
        <td>${formatScope(c)}</td>
        <td>${c.description || ""}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editCoupon(${c.id})">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteCoupon(${c.id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `
    )
    .join("");
}

// Lấy danh sách mã từ backend
async function loadCoupons() {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn("Không có token admin");
      return;
    }

    // Laravel: route GET /api/admin/coupons
    const res = await fetch(`${API_BASE_URL}/admin/coupons`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error("Lỗi load coupons:", res.status);
      return;
    }

    const data = await res.json();
    coupons = Array.isArray(data) ? data : data.data || [];
    renderCoupons();
  } catch (err) {
    console.error("Lỗi load coupons:", err);
  }
}

// Lấy danh sách sản phẩm để admin chọn
async function loadProducts() {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn("Không có token admin (vẫn có thể load products public nếu API cho phép)");
    }

    // m đã có route GET /api/products
    const res = await fetch(`${API_BASE_URL}/products`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error("Lỗi load products:", res.status);
      return;
    }

    const data = await res.json();
    allProducts = Array.isArray(data) ? data : data.data || [];
    renderProductList();
  } catch (err) {
    console.error("Lỗi load products:", err);
  }
}

// Submit form: tạo / cập nhật mã
async function handleSubmit(e) {
  e.preventDefault();

  const code = document.getElementById("code").value.trim();
  const type = document.getElementById("type").value;
  const discount = document.getElementById("discount").value;
  const startDate = document.getElementById("startDate").value || null;
  const expiresAt = document.getElementById("expiresAt").value;
  const status = document.getElementById("status").value;
  const description = document.getElementById("description").value.trim();
  const applyScope = document.getElementById("applyScope").value;

  if (!code || !discount || !expiresAt) {
    Swal.fire(
      "Thiếu dữ liệu",
      "Vui lòng nhập đầy đủ mã, giá trị và ngày hết hạn",
      "warning"
    );
    return;
  }

  // lấy product_ids nếu chọn "specific"
  let productIds = [];
  if (applyScope === "specific") {
    const checkboxes = document.querySelectorAll(
      ".product-checkbox:checked"
    );
    productIds = Array.from(checkboxes).map((cb) => Number(cb.value));

    if (productIds.length === 0) {
      Swal.fire(
        "Chưa chọn sản phẩm",
        "Bạn đã chọn 'Chỉ sản phẩm được chọn' nhưng chưa tick sản phẩm nào",
        "warning"
      );
      return;
    }
  }

  const token = getAuthToken();
  if (!token) {
    Swal.fire("Lỗi xác thực", "Vui lòng đăng nhập lại admin", "error");
    return;
  }

  const payload = {
    code,
    type,
    discount: Number(discount),
    start_date: startDate,
    expires_at: expiresAt,
    status,
    description,
    product_ids: productIds,
  };

  try {
    let url = `${API_BASE_URL}/admin/coupons`;
    let method = "POST";

    if (editingId) {
      url = `${API_BASE_URL}/admin/coupons/${editingId}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Lỗi lưu coupon:", data);
      Swal.fire(
        "Lỗi",
        data.message || "Không thể lưu mã giảm giá, thử lại!",
        "error"
      );
      return;
    }

    if (editingId) {
      // cập nhật item trong mảng
      const index = coupons.findIndex((c) => c.id === editingId);
      if (index !== -1) {
        coupons[index] = data;
      }
      Swal.fire("Đã cập nhật", "Mã giảm giá đã được cập nhật", "success");
    } else {
      // thêm mới vào đầu danh sách
      coupons.unshift(data);
      Swal.fire("Thành công", "Đã thêm mã giảm giá mới", "success");
    }

    // reset form
    editingId = null;
    document.getElementById("couponForm").reset();
    document.getElementById("applyScope").value = "all";
    document.getElementById("productSelection").style.display = "none";
    renderCoupons();
  } catch (err) {
    console.error("Lỗi lưu coupon:", err);
    Swal.fire("Lỗi", "Có lỗi xảy ra, vui lòng thử lại!", "error");
  }
}

// Bấm nút sửa
function editCoupon(id) {
  const c = coupons.find((x) => x.id === id);
  if (!c) return;

  editingId = id;

  document.getElementById("code").value = c.code;
  document.getElementById("type").value = c.type;
  document.getElementById("discount").value = c.discount;
  document.getElementById("startDate").value = c.start_date || "";
  document.getElementById("expiresAt").value = c.expires_at;
  document.getElementById("status").value = c.status;
  document.getElementById("description").value = c.description || "";

  // Áp dụng cho
  const scopeSelect = document.getElementById("applyScope");
  const productSelection = document.getElementById("productSelection");

  const productIds =
    c.products && c.products.length > 0
      ? c.products.map((p) => p.id)
      : [];

  if (productIds.length > 0) {
    scopeSelect.value = "specific";
    productSelection.style.display = "block";
  } else {
    scopeSelect.value = "all";
    productSelection.style.display = "none";
  }

  // render lại list sản phẩm với các sản phẩm đã chọn
  renderProductList(productIds);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Bấm nút xóa
async function deleteCoupon(id) {
  const c = coupons.find((x) => x.id === id);
  if (!c) return;

  const confirm = await Swal.fire({
    title: "Xóa mã giảm giá?",
    html: `Bạn chắc chắn muốn xóa mã <strong>${c.code}</strong>?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
  });

  if (!confirm.isConfirmed) return;

  const token = getAuthToken();
  if (!token) {
    Swal.fire("Lỗi xác thực", "Vui lòng đăng nhập lại admin", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("Lỗi xóa coupon:", data);
      Swal.fire(
        "Lỗi",
        data.message || "Không thể xóa mã giảm giá!",
        "error"
      );
      return;
    }

    coupons = coupons.filter((x) => x.id !== id);
    renderCoupons();
    Swal.fire("Đã xóa", "Mã giảm giá đã được xóa", "success");
  } catch (err) {
    console.error("Lỗi xóa coupon:", err);
    Swal.fire("Lỗi", "Có lỗi xảy ra, vui lòng thử lại!", "error");
  }
}

// Gắn vào window để gọi từ HTML
window.editCoupon = editCoupon;
window.deleteCoupon = deleteCoupon;

// Khởi tạo
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("couponForm");
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  const searchInput = document.getElementById("searchCoupon");
  const statusFilter = document.getElementById("statusFilter");
  const applyScope = document.getElementById("applyScope");
  const productSelection = document.getElementById("productSelection");

  if (searchInput) {
    searchInput.addEventListener("input", renderCoupons);
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", renderCoupons);
  }

  if (applyScope && productSelection) {
    applyScope.addEventListener("change", () => {
      if (applyScope.value === "specific") {
        productSelection.style.display = "block";
      } else {
        productSelection.style.display = "none";
      }
    });
  }

  await loadProducts();
  await loadCoupons();
});
