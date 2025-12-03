const API_BASE_URL = "http://localhost:8000/api";

let currentUserEmail = "";
let provincesList = []; // lưu danh sách tỉnh
let currentDistricts = []; // lưu danh sách quận huyện khi load
let currentWards = []; // lưu danh sách phường xã khi load

// ==== MÃ GIẢM GIÁ ====
let coupon = null;        // thông tin mã đã áp dụng (code, discount, type, product_ids)
let discountValue = 0;    // số tiền được giảm

function getProvinceCodeByName(name) {
  const prov = provincesList.find((p) => p.name === name);
  return prov ? prov.code : null;
}

function getDistrictCodeByName(name) {
  const dist = currentDistricts.find((d) => d.name === name);
  return dist ? dist.code : null;
}

function getWardCodeByName(name) {
  const w = currentWards.find((w) => w.name === name);
  return w ? w.code : null;
}

async function loadCurrentUser() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) return;

    const data = await res.json();
    currentUserEmail = data.email || "";
    document.getElementById("email").value = currentUserEmail; // điền email người dùng ngay khi load
  } catch (err) {
    console.error("Lỗi lấy thông tin người dùng:", err);
  }
}

// Chọn các thẻ select
const provinceSelect = document.getElementById("province");
const districtSelect = document.getElementById("district");
const wardSelect = document.getElementById("ward");

// === PREFILL EMAIL TỪ TÀI KHOẢN ĐÃ ĐĂNG NHẬP ===
function prefillEmailFromUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return;

  try {
    const user = JSON.parse(userStr);

    if (user.email) {
      const emailInput = document.getElementById("email");
      emailInput.value = user.email;
      emailInput.readOnly = true; // khóa lại
      emailInput.classList.add("bg-light");
    }
  } catch (err) {
    console.error("Không parse được user:", err);
  }
}

// 1. Lấy danh sách tỉnh
async function loadProvinces() {
  try {
    const res = await fetch("https://provinces.open-api.vn/api/p/");
    const provinces = await res.json();
    provincesList = provinces; // Lưu danh sách tỉnh

    provinceSelect.innerHTML = `<option value="">Chọn Tỉnh/TP</option>`;
    provinces.forEach((province) => {
      const opt = document.createElement("option");
      opt.value = province.code;
      opt.textContent = province.name;
      provinceSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Lỗi khi tải tỉnh:", err);
  }
}

// 2. Khi chọn tỉnh → load quận/huyện
provinceSelect.addEventListener("change", async () => {
  const provinceCode = provinceSelect.value;
  districtSelect.innerHTML = `<option value="">Chọn Quận/Huyện</option>`;
  wardSelect.innerHTML = `<option value="">Chọn Phường/Xã</option>`;

  if (!provinceCode) return;

  try {
    const res = await fetch(
      `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
    );
    const data = await res.json();
    const districts = data.districts || [];

    districts.forEach((district) => {
      const opt = document.createElement("option");
      opt.value = district.code;
      opt.textContent = district.name;
      districtSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Lỗi khi tải quận/huyện:", err);
  }
});

// 3. Khi chọn quận → load phường/xã
districtSelect.addEventListener("change", async () => {
  const districtCode = districtSelect.value;
  wardSelect.innerHTML = `<option value="">Chọn Phường/Xã</option>`;

  if (!districtCode) return;

  try {
    const res = await fetch(
      `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
    );
    const data = await res.json();
    const wards = data.wards || [];

    wards.forEach((ward) => {
      const opt = document.createElement("option");
      opt.value = ward.code;
      opt.textContent = ward.name;
      wardSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Lỗi khi tải phường/xã:", err);
  }
});

async function loadDistricts(provinceCode) {
  if (!provinceCode) return [];
  const res = await fetch(
    `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
  );
  const data = await res.json();
  const districts = data.districts || [];
  currentDistricts = districts; // lưu danh sách quận

  districtSelect.innerHTML = `<option value="">Chọn Quận/Huyện</option>`;
  districts.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.code;
    opt.textContent = d.name;
    districtSelect.appendChild(opt);
  });
  return districts;
}

async function loadWards(districtCode) {
  if (!districtCode) return [];
  const res = await fetch(
    `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
  );
  const data = await res.json();
  const wards = data.wards || [];
  currentWards = wards; // lưu danh sách phường

  wardSelect.innerHTML = `<option value="">Chọn Phường/Xã</option>`;
  wards.forEach((w) => {
    const opt = document.createElement("option");
    opt.value = w.code;
    opt.textContent = w.name;
    wardSelect.appendChild(opt);
  });
  return wards;
}

// Hàm lấy token từ localStorage
function getAuthToken() {
  return localStorage.getItem("token");
}

// Lấy địa chỉ mặc định từ API
async function loadDefaultAddress() {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn("Không có token, bỏ qua lấy địa chỉ mặc định");
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/addresses/default`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn("Không có địa chỉ mặc định");
      return null;
    }

    const data = await res.json();
    console.log("Địa chỉ mặc định:", data);
    return data;
  } catch (err) {
    console.error("Lỗi lấy địa chỉ mặc định:", err);
    return null;
  }
}

// Lấy tất cả địa chỉ từ API
async function loadAllAddresses() {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn("Không có token, không thể lấy danh sách địa chỉ");
      return [];
    }

    const res = await fetch(`${API_BASE_URL}/addresses`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn("Lỗi lấy danh sách địa chỉ, status:", res.status);
      return [];
    }

    const data = await res.json();
    console.log("Danh sách địa chỉ:", data);
    return Array.isArray(data) ? data : data.data || [];
  } catch (err) {
    console.error("Lỗi lấy danh sách địa chỉ:", err);
    return [];
  }
}

// Hiển thị modal chọn địa chỉ
async function renderAddressModal() {
  const modalBody = document.getElementById("addressList");
  if (!modalBody) {
    console.warn("Không tìm thấy addressList modal");
    return;
  }

  modalBody.innerHTML = "";

  const addresses = await loadAllAddresses();

  if (addresses.length === 0) {
    modalBody.innerHTML = `
      <div class="alert alert-info" role="alert">
        <i class="fas fa-info-circle me-2"></i>
        Bạn chưa có địa chỉ nào. Vui lòng thêm địa chỉ mới.
      </div>
    `;
    return;
  }

  addresses.forEach((addr) => {
    const div = document.createElement("div");
    div.classList.add("address-item", "p-3", "mb-2", "border", "rounded");

    if (addr.is_default || addr.default) {
      div.classList.add("bg-light", "border-primary", "border-2");
    }

    div.style.cursor = "pointer";
    div.style.transition = "all 0.3s ease";

    const badgeHTML =
      addr.is_default || addr.default
        ? '<span class="badge bg-primary ms-2">Mặc định</span>'
        : "";

    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <strong style="font-size: 16px;">
            ${addr.recipient_name} ${badgeHTML}
          </strong><br>
          <small class="text-muted">
            <i class="fas fa-phone me-1"></i>${addr.recipient_phone} | 
            <i class="fas fa-envelope me-1"></i>${currentUserEmail}
          </small><br>
          <div class="mt-2" style="font-size: 14px;">
            <i class="fas fa-map-marker-alt me-2" style="color: #17a2b8;"></i>
            ${addr.address_detail}, ${addr.ward}, ${addr.district}, ${addr.province}
          </div>
          ${
            addr.note
              ? `<small class="text-muted d-block mt-1"><i class="fas fa-sticky-note me-1"></i>${addr.note}</small>`
              : ""
          }
        </div>
      </div>
    `;

    div.addEventListener("click", () => selectAddress(addr));
    div.addEventListener("mouseover", () => {
      div.style.boxShadow = "0 2px 8px rgba(23, 162, 184, 0.2)";
      div.style.backgroundColor = div.classList.contains("bg-light")
        ? "#f0f9fb"
        : "#f8f9fa";
    });
    div.addEventListener("mouseout", () => {
      div.style.boxShadow = "none";
      div.style.backgroundColor = div.classList.contains("bg-light")
        ? "#f8f9fa"
        : "transparent";
    });

    modalBody.appendChild(div);
  });
}

// Chọn một địa chỉ và điền vào form
async function selectAddress(addr) {
  try {
    document.getElementById("fullName").value = addr.recipient_name || "";
    document.getElementById("phone").value = addr.recipient_phone || "";
    document.getElementById("email").value = currentUserEmail || "";
    document.getElementById("address").value = addr.address_detail || "";
    document.getElementById("note").value = addr.note || "";

    // Thiết lập tỉnh/thành phố
    const provinceCode = getProvinceCodeByName(addr.province);
    if (provinceCode) {
      provinceSelect.value = provinceCode;
      await loadDistricts(provinceCode);

      const districtCode = getDistrictCodeByName(addr.district);
      if (districtCode) {
        districtSelect.value = districtCode;
        await loadWards(districtCode);

        const wardCode = getWardCodeByName(addr.ward);
        if (wardCode) {
          wardSelect.value = wardCode;
        }
      }
    }

    // Đóng modal
    const modalEl = document.getElementById("addressModal");
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    console.log("Đã chọn địa chỉ:", addr);
  } catch (err) {
    console.error("Lỗi khi chọn địa chỉ:", err);
    alert("Có lỗi xảy ra khi chọn địa chỉ!");
  }
}

// ================== PHẦN CHECKOUT & MÃ GIẢM GIÁ ==================

// CHECKOUT ITEMS từ localStorage
let checkoutItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];

// Kiểm tra mã có áp dụng được cho giỏ hàng hiện tại không
function hasApplicableProductInCart(couponData) {
  const ids = couponData.product_ids || [];

  // Không có product_ids => áp dụng cho tất cả sản phẩm
  if (ids.length === 0) {
    return checkoutItems.length > 0;
  }

  // Có danh sách product_ids => chỉ áp dụng nếu trong giỏ có ít nhất 1 sản phẩm thuộc danh sách
  return checkoutItems.some((item) => {
    const pid = item.product_id ?? item.productId ?? item.id;
    return ids.includes(pid);
  });
}

// ====== HÀM TÍNH LẠI TỔNG TIỀN (CÓ MÃ GIẢM GIÁ) ======
function updateSummary() {
  let subtotal = 0;
  const shippingFeeValue = 0; // hiện tại miễn phí
  let applicableSubtotal = 0; // tổng tiền của những sản phẩm được áp dụng mã

  checkoutItems.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    if (coupon) {
      const productId = item.product_id ?? item.productId ?? item.id;

      // Nếu coupon không có product_ids => áp dụng toàn bộ
      const applyToAll =
        !coupon.product_ids || coupon.product_ids.length === 0;

      const isApplicable =
        applyToAll || coupon.product_ids.includes(productId);

      if (isApplicable) {
        applicableSubtotal += itemTotal;
      }
    }
  });

  // tính giảm giá
  if (coupon && applicableSubtotal > 0) {
    if (coupon.type === "percent") {
      discountValue = Math.floor(
        applicableSubtotal * (coupon.discount / 100)
      );
    } else {
      // giảm cố định nhưng không được vượt quá phần được áp dụng
      discountValue = Math.min(coupon.discount, applicableSubtotal);
    }
  } else {
    discountValue = 0;
  }

  const total = Math.max(subtotal + shippingFeeValue - discountValue, 0);

  const subtotalEl = document.getElementById("subtotal");
  const shippingEl = document.getElementById("shippingFee");
  const discountEl = document.getElementById("discount");
  const totalEl = document.getElementById("total");

  if (subtotalEl)
    subtotalEl.textContent = subtotal.toLocaleString("vi-VN") + "₫";
  if (shippingEl)
    shippingEl.textContent =
      shippingFeeValue === 0
        ? "Miễn phí"
        : shippingFeeValue.toLocaleString("vi-VN") + "₫";
  if (discountEl)
    discountEl.textContent =
      "-" + discountValue.toLocaleString("vi-VN") + "₫";
  if (totalEl) totalEl.textContent = total.toLocaleString("vi-VN") + "₫";

  return total;
}

// Render danh sách sản phẩm + tổng tiền
function renderOrderItems() {
  const container = document.getElementById("orderItems");

  container.innerHTML = "";

  if (checkoutItems.length === 0) {
    container.innerHTML = `
      <div class="alert alert-warning" role="alert">
        <i class="fas fa-shopping-cart me-2"></i>
        Giỏ hàng trống
      </div>
    `;
    updateSummary();
    return;
  }

  checkoutItems.forEach((item) => {
    const itemTotal = item.price * item.quantity;

    const imageUrl = item.image
      ? "http://localhost:8000/storage/" + item.image
      : "/frontend/img/box.png";

    container.innerHTML += `
      <div class="order-item">
        <img src="${imageUrl}" alt="${
      item.name
    }" onerror="this.src='/frontend/img/box.png'">
        <div class="order-item-info">
          <div class="order-item-name">${item.name}</div>
          <div class="order-item-quantity">x${item.quantity}</div>
        </div>
        <div class="order-item-price">${itemTotal.toLocaleString(
          "vi-VN"
        )}₫</div>
      </div>
    `;
  });

  // cập nhật lại phần tổng tiền
  updateSummary();
}

// ÁP DỤNG MÃ GIẢM GIÁ
async function applyCoupon() {
  const input = document.getElementById("couponInput");
  const msg = document.getElementById("couponMessage");
  if (!input || !msg) return;

  const code = input.value.trim();
  if (!code) {
    msg.textContent = "Vui lòng nhập mã giảm giá!";
    msg.style.color = "red";
    msg.style.display = "block";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/coupons/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();

    if (!res.ok) {
      coupon = null;
      msg.textContent = data.error || "Mã giảm giá không hợp lệ";
      msg.style.color = "red";
      msg.style.display = "block";
      updateSummary(); // reset giảm giá
      return;
    }

    // data từ BE: { code, discount, type, product_ids: [...] }
    const receivedCoupon = {
      code: data.code,
      discount: data.discount,
      type: data.type,
      product_ids: data.product_ids || [],
    };

    // Kiểm tra xem trong giỏ có sản phẩm nào áp dụng được không
    if (!hasApplicableProductInCart(receivedCoupon)) {
      coupon = null; // không lưu mã
      msg.textContent =
        "Mã này chỉ áp dụng cho một số sản phẩm, giỏ hàng của bạn hiện không có sản phẩm phù hợp.";
      msg.style.color = "red";
      msg.style.display = "block";
      updateSummary(); // không giảm
      return;
    }

    // OK, lưu mã và tính lại
    coupon = receivedCoupon;

    msg.textContent = `Áp dụng mã ${data.code} thành công: -${
      data.discount
    }${data.type === "percent" ? "%" : "đ"}`;
    msg.style.color = "green";
    msg.style.display = "block";

    updateSummary();
  } catch (err) {
    console.error("Lỗi áp dụng mã giảm giá:", err);
    coupon = null;
    msg.textContent = "Có lỗi xảy ra, vui lòng thử lại!";
    msg.style.color = "red";
    msg.style.display = "block";
    updateSummary();
  }
}


// ĐẶT HÀNG + THANH TOÁN
async function placeOrder() {
  if (checkoutItems.length === 0) {
    await Swal.fire({
      icon: "error",
      title: "Chưa có sản phẩm!",
      text: "Vui lòng chọn sản phẩm để thanh toán!",
      confirmButtonText: "Đóng",
    });
    return;
  }

  // Validate thông tin khách
  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const provinceCode = document.getElementById("province").value;
  const districtCode = document.getElementById("district").value;
  const wardCode = document.getElementById("ward").value;
  const address = document.getElementById("address").value.trim();
  const note = document.getElementById("note").value.trim();

  if (
    !fullName ||
    !phone ||
    !address ||
    !provinceCode ||
    !districtCode ||
    !wardCode
  ) {
    await Swal.fire({
      icon: "error",
      title: "Thông tin không đầy đủ!",
      text: "Vui lòng nhập đầy đủ thông tin giao hàng!",
      confirmButtonText: "Đóng",
    });
    return;
  }

  const provinceName =
    provinceSelect.options[provinceSelect.selectedIndex]?.text || "";
  const districtName =
    districtSelect.options[districtSelect.selectedIndex]?.text || "";
  const wardName = wardSelect.options[wardSelect.selectedIndex]?.text || "";

  const paymentMethod = document.querySelector(
    "input[name='payment']:checked"
  )?.value;

  if (!paymentMethod) {
    await Swal.fire({
      icon: "error",
      title: "Chưa chọn phương thức!",
      text: "Vui lòng chọn phương thức thanh toán!",
      confirmButtonText: "Đóng",
    });
    return;
  }

  let paymentChannel = null;
  if (paymentMethod === "bank") {
    const bankMethod = document.querySelector(
      "input[name='bankMethod']:checked"
    );

    if (!bankMethod || bankMethod.value !== "vnpay") {
      await Swal.fire({
        icon: "error",
        title: "Phương thức không hỗ trợ!",
        text: "Hiện tại chỉ hỗ trợ thanh toán qua VNPAY!",
        confirmButtonText: "Đóng",
      });
      return;
    }

    paymentChannel = "vnpay";
  }

  // Tổng tiền sau khi áp dụng mã giảm giá
  const totalNumber = updateSummary();

  const orderItemsForBackend = checkoutItems.map((item) => ({
    product_id: item.product_id ?? item.productId ?? item.id,
    quantity: item.quantity,
  }));

  const orderData = {
    items: orderItemsForBackend,
    customer: {
      fullName,
      phone,
      email,
      provinceCode,
      districtCode,
      wardCode,
      provinceName,
      districtName,
      wardName,
      address,
      note,
    },
    payment_method: paymentMethod,
    payment_channel: paymentChannel,
    total_price: totalNumber,
    coupon_code: coupon ? coupon.code : null,
    discount_value: discountValue,
  };

  console.log("Đơn hàng gửi backend:", orderData);

  try {
    const token = getAuthToken();

    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Lỗi xác thực!",
        text: "Vui lòng đăng nhập để tiếp tục!",
        confirmButtonText: "Đóng",
      });
      return;
    }

    // Gửi đơn hàng
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Lỗi tạo đơn:", errData);
      await Swal.fire({
        icon: "error",
        title: "Tạo đơn thất bại!",
        text: errData.message || "Có lỗi xảy ra, vui lòng thử lại!",
        confirmButtonText: "Đóng",
      });
      return;
    }

    const data = await res.json();
    const orderId = data.order_id || data.id || data.order?.id;
    const itemIds = checkoutItems.map((item) => item.cart_item_id ?? item.id);

    // THANH TOÁN VNPAY
    if (paymentMethod === "bank") {
      // Xoá giỏ trên DB
      if (itemIds.length > 0) {
        await fetch(`${API_BASE_URL}/cart/remove-multiple`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemIds }),
        });
      }

      localStorage.removeItem("checkoutItems");

      // Gọi API tạo URL VNPay
      const vnpRes = await fetch(`${API_BASE_URL}/vnpay/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: totalNumber,
        }),
      });

      if (!vnpRes.ok) {
        console.error("Lỗi tạo VNPay link");
        await Swal.fire({
          icon: "error",
          title: "Lỗi tạo liên kết!",
          text: "Không thể tạo liên kết thanh toán. Đơn hàng sẽ ở trạng thái chờ thanh toán.",
          confirmButtonText: "Đóng",
        });
        return;
      }

      const vnpData = await vnpRes.json();

      if (!vnpData.payment_url) {
        await Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: "Không nhận được liên kết thanh toán!",
          confirmButtonText: "Đóng",
        });
        return;
      }

      const win = window.open(vnpData.payment_url, "_blank");

      if (!win) {
        await Swal.fire({
          icon: "warning",
          title: "Trình duyệt chặn popup!",
          html: `Hãy copy link sau để thanh toán:<br><br>
                 <input type="text" class="form-control" value="${vnpData.payment_url}" readonly>`,
          confirmButtonText: "Đóng",
        });
      }

      return;
    }

    // COD
    if (itemIds.length > 0) {
      await fetch(`${API_BASE_URL}/cart/remove-multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemIds }),
      });
    }

    localStorage.removeItem("checkoutItems");

    await Swal.fire({
      icon: "success",
      title: "Đặt hàng thành công!",
      text: `Mã đơn hàng: ${orderId}`,
      confirmButtonText: "Tiếp tục",
    }).then(() => {
      window.location.href = "./donhangcuatoi.html";
    });
  } catch (err) {
    console.error("Lỗi đặt hàng:", err);
    await Swal.fire({
      icon: "error",
      title: "Lỗi!",
      text: "Có lỗi xảy ra, vui lòng thử lại!",
      confirmButtonText: "Đóng",
    });
  }
}

// Khởi tạo khi DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  // Kiểm tra token
  const token = getAuthToken();
  if (!token) {
    console.warn("Không có token");
  }
  // Load thông tin người dùng (email)
  await loadCurrentUser();

  // Render sản phẩm
  renderOrderItems();

  // Load tỉnh/thành phố
  await loadProvinces();

  // Load địa chỉ mặc định
  const defaultAddr = await loadDefaultAddress();
  if (defaultAddr) {
    console.log("Sử dụng địa chỉ mặc định:", defaultAddr);
    selectAddress(defaultAddr);
  }

  // Render danh sách địa chỉ trong modal
  await renderAddressModal();

  console.log("Trang thanh toán đã sẵn sàng");
  prefillEmailFromUser();

  // Gắn sự kiện nút áp dụng mã giảm giá
  const applyBtn = document.getElementById("applyCouponBtn");
  if (applyBtn) {
    applyBtn.addEventListener("click", applyCoupon);
  }
});
