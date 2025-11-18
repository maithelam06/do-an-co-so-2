const API_BASE_URL = "http://localhost:8000/api";

// Chọn các thẻ select
const provinceSelect = document.getElementById("province");
const districtSelect = document.getElementById("district");
const wardSelect = document.getElementById("ward");

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

//
let checkoutItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];

//
function renderOrderItems() {
  const container = document.getElementById("orderItems");
  const itemCount = document.getElementById("itemCount");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");

  container.innerHTML = "";

  let subtotal = 0;

  checkoutItems.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    container.innerHTML += `
            <div class="d-flex align-items-center justify-content-between p-3 border-bottom">
                <div class="d-flex align-items-center">
                    <img src="${
                      item.image
                    }" class="rounded me-3" width="60" height="60">
                    <div>
                        <strong>${item.name}</strong>
                        <p class="mb-0 text-muted">${item.price.toLocaleString()}₫ x ${
      item.quantity
    }</p>
                    </div>
                </div>
                <strong>${itemTotal.toLocaleString()}₫</strong>
            </div>
        `;
  });

  itemCount.textContent = checkoutItems.length;
  subtotalEl.textContent = subtotal.toLocaleString() + "₫";
  totalEl.textContent = subtotal.toLocaleString() + "₫";
}


function selectPayment(method) {
  const methods = ["cod", "bank"];

  methods.forEach(m => {
    const radio = document.getElementById(m);
    const div = radio.closest(".payment-method");

    if (m === method) {
      radio.checked = true;        
      div.classList.add("active"); 
    } else {
      radio.checked = false;      
      div.classList.remove("active");
    }
  });
}

async function placeOrder() {
  if (checkoutItems.length === 0) {
    alert("Chưa có sản phẩm để thanh toán!");
    return;
  }

  const orderData = {
    items: checkoutItems,
    customer: {
      fullName: document.getElementById("fullName").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      province: document.getElementById("province").value,
      district: document.getElementById("district").value,
      ward: document.getElementById("ward").value,
      address: document.getElementById("address").value,
      note: document.getElementById("note").value,
    },
    payment_method: document.querySelector("input[name='payment']:checked")
      .value,
    total_price: document.getElementById("total").textContent,
  };

  console.log("Đơn hàng gửi backend:", orderData);

  try {
    // await fetch(`${API_BASE_URL}/orders`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Authorization": `Bearer ${token}`
    //     },
    //     body: JSON.stringify(orderData)
    // });
    const token = localStorage.getItem("token");
    // Xóa các sản phẩm đã mua khỏi giỏ hàng trên DB
    const itemIds = checkoutItems.map((item) => item.id);
    await fetch(`${API_BASE_URL}/cart/remove-multiple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemIds }),
    });

    localStorage.removeItem("checkoutItems");

    alert("Đặt hàng thành công!");
    window.location.href = "/frontend/trangchu.html";
  } catch (err) {
    console.error("Lỗi đặt hàng:", err);
    alert("Có lỗi xảy ra, vui lòng thử lại!");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderOrderItems();
  loadProvinces();
});
