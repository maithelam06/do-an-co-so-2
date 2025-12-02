const API_BASE_URL = "http://localhost:8000/api";

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
      emailInput.readOnly = true;      // khóa lại
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

    // Reset và tạo option mặc định
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
  wardSelect.innerHTML = `<option value="">Chọn Phường/Xã</option>`; // reset xã

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
  wardSelect.innerHTML = `<option value="">Chọn Phường/Xã</option>`; // reset xã

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

// CHECKOUT ITEMS TỪ LOCALSTORAGE
let checkoutItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];

// Render danh sách sản phẩm + tổng tiền
function renderOrderItems() {
  const container = document.getElementById("orderItems");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");

  container.innerHTML = "";

  let subtotal = 0;

  checkoutItems.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    
    container.innerHTML += `
      <div class="order-item">
        <img src="${item.image ? "http://localhost:8000/storage/" + item.image : "/frontend/img/box.png"}" alt="${item.name}">
        <div class="order-item-info">
          <div class="order-item-name">${item.name}</div>
          <div class="order-item-quantity">x${item.quantity}</div>
        </div>
        <div class="order-item-price">${itemTotal.toLocaleString()}₫</div>
      </div>
    `;
  });

  subtotalEl.textContent = subtotal.toLocaleString() + "₫";
  totalEl.textContent = subtotal.toLocaleString() + "₫";
}

// ĐẶT HÀNG + THANH TOÁN
async function placeOrder() {
  if (checkoutItems.length === 0) {
    await Swal.fire({
        icon: "error",
        title: "Chưa có sản phẩm để thanh toán!",
        text: "Vui lòng chọn sản phẩm!",
        confirmButtonText: "Đóng"
      });
    return;
  }

  // Validate đơn giản thông tin khách
  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const provinceCode = document.getElementById("province").value;
  const districtCode = document.getElementById("district").value;
  const wardCode = document.getElementById("ward").value;
  const address = document.getElementById("address").value.trim();
  const note = document.getElementById("note").value.trim();

  if (!fullName || !phone || !address) {
    await Swal.fire({
        icon: "error",
        title: "Thông tin không hợp lệ!",
        text: "Vui lòng nhập đầy đủ thông tin!",
        confirmButtonText: "Đóng"
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
  )?.value; // 'cod' | 'bank'

  if (!paymentMethod) {
    await Swal.fire({
        icon: "error",
        title: "Chọn phương thức thanh toán!",
        text: "Vui lòng chọn phương thức thanh toán!",
        confirmButtonText: "Đóng"
      });
    return;
  }

  // CHỈ CÒN VNPAY cho nhánh bank
  let paymentChannel = null;
  if (paymentMethod === "bank") {
    const bankMethod = document.querySelector(
      "input[name='bankMethod']:checked"
    );

    if (!bankMethod || bankMethod.value !== "vnpay") {
      await Swal.fire({
        icon: "error",
        title: "Phương thức thanh toán",
        text: "Hiện tại hệ thống chỉ hỗ trợ thanh toán qua VNPAY. Vui lòng chọn lại 'Thanh toán qua VNPAY",
        confirmButtonText: "Đóng"
      });
      return;
    }

    paymentChannel = "vnpay";
  }

  // Tổng tiền dạng number
  const totalNumber = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Chỉ gửi product_id + quantity cho backend
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
    payment_method: paymentMethod, // cod | bank
    payment_channel: paymentChannel, // chỉ vnpay hoặc null
    total_price: totalNumber,
  };

  console.log("checkoutItems:", checkoutItems);
  console.log("Đơn hàng gửi backend:", orderData);

  try {
    const token = localStorage.getItem("token");

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
        title: "Thất bại!",
        text: "Tạo đơn hàng thất bại!",
        confirmButtonText: "Đóng"
      });
      return;
    }
    const data = await res.json();
    console.log("Order created:", data);
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

      // Xoá checkoutItems trên FE
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
        const txt = await vnpRes.text();
        console.error("Lỗi tạo VNPay link:", txt);
        await Swal.fire({
        icon: "error",
        title: "Liên kết thất bại!",
        text: "Không tạo được liên kết thanh toán VNPay. Đơn hàng sẽ ở trạng thái chờ thanh toán.",
        confirmButtonText: "Đóng"
      });
        return;
      }

      let vnpData;
      try {
        vnpData = await vnpRes.json();
      } catch (e) {
        const rawText = await vnpRes.text().catch(() => "");
        console.error("VNPay JSON parse error:", e, rawText);
        await Swal.fire({
        icon: "error",
        title: "Số lượng không hợp lệ!",
        text: "Phản hồi từ VNPay không đúng định dạng JSON.",
        confirmButtonText: "Đóng"
      });
        return;
      }

      console.log("VNPay JSON:", vnpData);

      if (!vnpData.payment_url) {
        await Swal.fire({
        icon: "error",
        title: "Lỗi serve!",
        text: "Lỗi",
        confirmButtonText: "Đóng"
      });
        return;
      }

      const payUrl = vnpData.payment_url;
      console.log("Đi tới VNPay:", payUrl);

      // Thử mở VNPay trong tab mới
      const win = window.open(payUrl, "_blank");

      // Nếu trình duyệt chặn popup => hiện link để m copy / bấm
      if (!win) {
        await Swal.fire({
        icon: "error",
        title: "Trình duyệt chặn popup!",
        text: "Trình duyệt đang chặn mở VNPay tự động.\n\n" +
          "Hãy copy link sau và dán vào 1 tab mới để thanh toán:\n\n" +
          payUrl,
        confirmButtonText: "Đóng"
      });
      }

      return;
    }

    //COD
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
        title: "Số lượng không hợp lệ!",
        text: "Đặt hàng thành công! Mã đơn: " + orderId,
        confirmButtonText: "Đóng"
      });
  } catch (err) {
    console.error("Lỗi đặt hàng:", err);
    await Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: "Có lỗi xảy ra, vui lòng thử lại!",
        confirmButtonText: "Đóng"
      });
  }
}

// Khởi tạo
document.addEventListener("DOMContentLoaded", () => {
  renderOrderItems();
  loadProvinces();
  prefillEmailFromUser(); // 👈 THÊM DÒNG NÀY
});
