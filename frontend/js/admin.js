// ==========================
// 🧩 TOGGLE SIDEBAR
// ==========================
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");
  sidebar.classList.toggle("collapsed");
  mainContent.classList.toggle("expanded");
}

// ==========================
// ACTIVE MENU LINK
// ==========================
function initMenuLinks() {
  document.querySelectorAll(".menu-link").forEach((link) => {
    link.addEventListener("click", function () {
      document
        .querySelectorAll(".menu-link")
        .forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
    });
  });
}

// ==========================
// RESPONSIVE SIDEBAR TOGGLE
// ==========================
function initResponsiveSidebar() {
  if (window.innerWidth <= 768) {
    const menuToggle = document.querySelector(".menu-toggle");
    if (menuToggle) {
      menuToggle.addEventListener("click", function () {
        document.getElementById("sidebar").classList.toggle("active");
      });
    }
  }
}

// ==========================
// 🔒 BẢO VỆ TRANG ADMIN
// ==========================
async function protectAdminPage() {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  if (!token || !userData) {
    await Swal.fire({
      icon: "warning",
      title: "Bạn chưa đăng nhập!",
      text: "Vui lòng đăng nhập để vào trang quản trị.",
      confirmButtonText: "Đăng nhập ngay",
    });
    window.location.href = "/frontend/index.html";
    return false;
  }

  const user = JSON.parse(userData);

  if (user.role !== "admin") {
    await Swal.fire({
      icon: "error",
      title: "Truy cập bị từ chối!",
      text: "Bạn không có quyền truy cập trang quản trị.",
      confirmButtonText: "Quay lại trang chủ",
    });
    window.location.href = "/frontend/trangchu.html";
    return false;
  }

  return user;
}

// ==========================
// 🔥 CHECK USER BỊ KHÓA
// ==========================
async function checkUserLocked(token) {
  try {
    const response = await fetch("http://localhost:8000/api/customers", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (response.status === 401 || response.status === 403) {
      await Swal.fire({
        icon: "error",
        title: "Tài khoản đã bị khóa!",
        text: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
        confirmButtonText: "Đăng nhập lại",
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/frontend/trangchu.html";
      return true;
    }
  } catch (err) {
    console.error("Lỗi check khóa tài khoản:", err);
  }

  return false;
}

// ==========================
// 🔧 LOAD THÔNG TIN NGƯỜI DÙNG
// ==========================
function loadUserInfo(user) {
  document.getElementById("admin-name").textContent = user.name || "Không rõ";
  document.getElementById("admin-role").textContent =
    user.role === "admin" ? "Quản trị viên" : "Người dùng";
  document.getElementById("admin-avatar").src = "/frontend/img/avt.jpg";
}

// ==========================
// 🚪 XỬ LÝ ĐĂNG XUẤT
// ==========================
async function handleLogout(event) {
  event.preventDefault();

  const confirmLogout = await Swal.fire({
    title: "Đăng xuất?",
    text: "Bạn có chắc chắn muốn đăng xuất không?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Có, đăng xuất",
    cancelButtonText: "Hủy",
  });

  if (confirmLogout.isConfirmed) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/frontend/trangchu.html";
  }
}

function initLogoutButton() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
}

// ==========================
// 🟢 INIT ALL
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
  // Sidebar & menu
  initMenuLinks();
  initResponsiveSidebar();

  // Bảo vệ trang admin
  const user = await protectAdminPage();
  if (!user) return;

  // Kiểm tra user bị khóa
  const isLocked = await checkUserLocked(localStorage.getItem("token"));
  if (isLocked) return;

  // Load thông tin người dùng
  loadUserInfo(user);

  // Logout
  initLogoutButton();
});
