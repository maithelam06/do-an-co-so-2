const API_BASE_URL = "http://localhost:8000/api";


function showSuccessPopup(title = "Đã cập nhật", text = "Thao tác đã được thực hiện thành công!") {
  Swal.fire({
    icon: "success",
    title: title,
    text: text,
    confirmButtonText: "Đóng",
  });
}

function showErrorPopup(title = "Lỗi", text = "Đã có lỗi xảy ra, vui lòng thử lại!") {
  Swal.fire({
    icon: "error",
    title: title,
    text: text,
    confirmButtonText: "Đóng",
  });
}
// Hiển thị thông tin người dùng
function displayUserProfile(user) {
  // Hiển thị tên
  document.getElementById("profile-name").textContent =
    user.name || "Tên người dùng";

  // Hiển thị email
  document.getElementById(
    "profile-email"
  ).innerHTML = `<i class="fas fa-envelope"></i> ${user.email || "Email"}`;

  // Hiển thị số điện thoại hoặc "Chưa cập nhật"
  const phoneDisplay = user.phone ? user.phone : "Chưa cập nhật";
  document.getElementById(
    "profile-phone"
  ).innerHTML = `<i class="fas fa-phone"></i> ${phoneDisplay}`;

  // Hiển thị avatar nếu có
  if (user.avatar) {
    document.getElementById("profile-avatar").src = `${API_BASE_URL.replace(
      "/api",
      ""
    )}/storage/${user.avatar}`;
  }

  // Fill vào form
  document.getElementById("full-name").value = user.name || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = user.phone || "";
}

// Lấy thông tin người dùng từ token
async function loadUserProfile() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/frontend/index.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/user/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const user = await res.json();
      displayUserProfile(user);
    } else {
      console.error("Lỗi API:");
    }
  } catch (error) {
    console.error("Lỗi khi fetch user:", error);
  }
}

async function updateProfile() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/frontend/index.html";
    return;
  }

  const name = document.getElementById("full-name").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!name || !phone) {
    showErrorPopup("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin!");
    return;
  }
  const formData = new FormData();
  formData.append("name", name);
  formData.append("phone", phone);

  const avatarFile = document.getElementById("avatar").files[0];
  if (avatarFile) formData.append("avatar", avatarFile);

  try {
    const res = await fetch(`${API_BASE_URL}/user/profile/update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.ok) {
      const updatedUser = await res.json();

      // Cập nhật avatar trực tiếp
      if (updatedUser.avatar) {
        document.getElementById(
          "profile-avatar"
        ).src = `${API_BASE_URL}/storage/${updatedUser.avatar}`;
      }

      // Cập nhật tên, email, phone, dob
      displayUserProfile(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      showSuccessPopup("Đã cập nhật", "Thông tin tài khoản của bạn đã được lưu.");
    } else {
      showErrorPopup("Nhập sai định dạng", "Vui lòng nhập đúng định dạng thông tin");
    }
  } catch (err) {
    console.error("Lỗi khi cập nhật profile:", err);
  }
}

//dia chi
// Load danh sách Tỉnh/Thành phố

const provinceSelect = document.getElementById("province");
const districtSelect = document.getElementById("district");
const wardSelect = document.getElementById("ward");

async function loadProvinces() {
  try {
    const res = await fetch("https://provinces.open-api.vn/api/p/");
    const provinces = await res.json();

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

let addresses = [];
// Load danh sách địa chỉ của user
async function loadAddresses() {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/addresses`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (res.ok) {
      addresses = await res.json();
      displayAddresses(addresses);
    } else {
      console.error("Lỗi API:", res.status);
    }
  } catch (error) {
    console.error("Lỗi khi tải địa chỉ:", error);
  }
}

// Hiển thị danh sách địa chỉ
function displayAddresses(addresses) {
  const container = document.getElementById("addresses-container");

  if (!container) return;

  if (!addresses || addresses.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info text-center">
        <i class="fas fa-map-marker-alt me-2"></i>Chưa có địa chỉ nào
      </div>
    `;
    return;
  }

  container.innerHTML = addresses
    .map(
      (addr) => `
    <div class="address-card ${addr.is_default ? "default" : ""}">
      ${addr.is_default ? '<span class="default-badge">Mặc định</span>' : ""}
      <div class="address-content">
        <h6 class="mb-2 fw-bold">${addr.recipient_name}</h6>
        <p class="mb-1">
          <i class="fas fa-phone text-primary me-2"></i>
          <span>${addr.recipient_phone}</span>
        </p>
        <p class="mb-2">
          <i class="fas fa-map-marker-alt text-primary me-2"></i>
          <span>${addr.address_detail}, ${addr.ward}, ${addr.district}, ${addr.province
        }
        </span>
        </p>
      </div>
      <div class="address-actions mt-3">
        <button 
    class="btn btn-sm btn-outline-primary me-2" 
    data-bs-toggle="modal" 
    data-bs-target="#addressModal" 
    onclick="editAddress(${addr.id})">
    <i class="fas fa-edit"></i> Sửa
</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteAddress(${addr.id
        })">
          <i class="fas fa-trash"></i> Xóa
        </button>
        ${!addr.is_default
          ? `
          <button class="btn btn-sm btn-outline-success ms-2" onclick="setDefaultAddress(${addr.id})">
            <i class="fas fa-check"></i> Mặc định
          </button>
        `
          : ""
        }
      </div>
    </div>
  `
    )
    .join("");
}

let editingAddressId = null;
// Lưu địa chỉ mới
async function saveNewAddress() {
  const token = localStorage.getItem("token");

  const recipient_name = document.getElementById("recipient_name").value.trim();
  const recipient_phone = document
    .getElementById("recipient_phone")
    .value.trim();
  const address_detail = document.getElementById("address_detail").value.trim();
  const province = provinceSelect.options[provinceSelect.selectedIndex].text;
  const district = districtSelect.options[districtSelect.selectedIndex].text;
  const ward = wardSelect.options[wardSelect.selectedIndex].text;
  const is_default = document.getElementById("is-default").checked;
  if (
    !recipient_name ||
    !recipient_phone ||
    !address_detail ||
    !provinceSelect.value ||
    !districtSelect.value ||
    !wardSelect.value
  ) {
    showErrorPopup("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin!");
    return;
  }

  try {
    let url = `${API_BASE_URL}/addresses`;
    let method = "POST";
    if (editingAddressId) {
      // nếu đang sửa
      url = `${API_BASE_URL}/addresses/${editingAddressId}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient_name,
        recipient_phone,
        address_detail,
        province,
        district,
        ward,
        is_default,
      }),
    });

    if (res.ok) {
      showSuccessPopup(
        "Đã cập nhật",
        editingAddressId
          ? "Địa chỉ đã được cập nhật."
          : "Địa chỉ mới đã được thêm."
      );
      loadAddresses();
      const modalEl = document.getElementById("addressModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      document.getElementById("address-form").reset();
      modal.hide();
      editingAddressId = null; // reset
    } else {
      showErrorPopup("Lỗi", "Không thể lưu địa chỉ, vui lòng thử lại!");
    }
  } catch (error) {
    console.error("Lỗi:", error);
  }
}

async function getDistrictsByProvince(provinceCode) {
  const res = await fetch(
    `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
  );
  const data = await res.json();
  return data.districts || [];
}

async function getWardsByDistrict(districtCode) {
  const res = await fetch(
    `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
  );
  const data = await res.json();
  return data.wards || [];
}

async function editAddress(addressId) {
  const addr = addresses.find((a) => a.id === addressId);
  if (!addr) return;
  editingAddressId = addressId;
  document.getElementById("recipient_name").value = addr.recipient_name;
  document.getElementById("recipient_phone").value = addr.recipient_phone;
  document.getElementById("address_detail").value = addr.address_detail;

  const modalTitle = document.querySelector("#addressModal .modal-title");
  modalTitle.textContent = "Cập nhật địa chỉ";

  await loadProvinces();
  const provinceOption = Array.from(provinceSelect.options).find(
    (opt) => opt.textContent === addr.province
  );
  provinceSelect.value = provinceOption.value;

  // Load Quận
  const districts = await getDistrictsByProvince(provinceOption.value);
  districtSelect.innerHTML = `<option value="">Chọn Quận/Huyện</option>`;
  districts.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.code;
    opt.textContent = d.name;
    districtSelect.appendChild(opt);
  });
  const districtOption = Array.from(districtSelect.options).find(
    (opt) => opt.textContent === addr.district
  );
  if (districtOption) districtSelect.value = districtOption.value;

  // Load Xã
  const wards = await getWardsByDistrict(districtOption.value);
  wardSelect.innerHTML = `<option value="">Chọn Phường/Xã</option>`;
  wards.forEach((w) => {
    const opt = document.createElement("option");
    opt.value = w.code;
    opt.textContent = w.name;
    wardSelect.appendChild(opt);
  });
  const wardOption = Array.from(wardSelect.options).find(
    (opt) => opt.textContent === addr.ward
  );
  if (wardOption) wardSelect.value = wardOption.value;
}

// Đặt địa chỉ mặc định
async function setDefaultAddress(addressId) {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const res = await fetch(
      `${API_BASE_URL}/addresses/${addressId}/set-default`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (res.ok) {
      showSuccessPopup("Thành công", "Địa chỉ đã được đặt làm mặc định.");

      loadAddresses();
    } else {
      showErrorPopup("Lỗi", "Không thể lưu địa chỉ, vui lòng thử lại!");

    }
  } catch (error) {
    console.error("Lỗi:", error);
    showErrorPopup("Lỗi", "Không thể lưu địa chỉ, vui lòng thử lại!");
  }
}

// Đổi mật khẩu
async function changePassword() {
  const token = localStorage.getItem("token");
  if (!token) {
    showErrorPopup("Lỗi", "Bạn chưa đăng nhập!");
    return;
  }

  const currentPassword = document.getElementById("current-password").value.trim();
  const newPassword = document.getElementById("new-password").value.trim();
  const confirmPassword = document.getElementById("confirm-password").value.trim();

  // Kiểm tra input
  if (!currentPassword || !newPassword || !confirmPassword) {
    showErrorPopup("Thiếu thông tin", "Vui lòng điền đầy đủ thông tin!");
    return;
  }

  if (newPassword !== confirmPassword) {
    showErrorPopup("Lỗi", "Mật khẩu mới và xác nhận mật khẩu không khớp!");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/user/change-password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      }),
    });

    if (res.ok) {
      showSuccessPopup("Thành công", "Mật khẩu của bạn đã được thay đổi.");
      document.getElementById("security-form").reset();
    } else {
      const errorData = await res.json();
      showErrorPopup("Lỗi", errorData.message || "Đổi mật khẩu thất bại!");
    }
  } catch (err) {
    console.error("Lỗi khi đổi mật khẩu:", err);
    showErrorPopup("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại!");
  }
}


// Gắn sự kiện submit cho form
document.getElementById("security-form")?.addEventListener("submit", (e) => {
  e.preventDefault(); // ngăn form submit mặc định
  changePassword(); // gọi hàm đổi mật khẩu
});

// Khởi tạo khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  // Load user profile
  loadUserProfile();

  // Load addresses
  loadAddresses();

  // Button lưu profile
  document.getElementById("save-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    updateProfile();
  });

  document.getElementById("add-address-btn").addEventListener("click", () => {
    // Reset trước khi load
    document.getElementById("address-form").reset();
    const modalTitle = document.querySelector("#addressModal .modal-title");
    modalTitle.textContent = "Thêm địa chỉ mới";
    editingAddressId = null;

    // Gọi API load tỉnh
    loadProvinces();
  });

  document.getElementById("save-address-btn").addEventListener("click", () => {
    saveNewAddress();
    loadAddresses();
  });

  const addressModalEl = document.getElementById("addressModal");
  const addressForm = document.getElementById("address-form");

  addressModalEl.addEventListener("hidden.bs.modal", () => {
    document.getElementById("address-form").reset();
  });
});
