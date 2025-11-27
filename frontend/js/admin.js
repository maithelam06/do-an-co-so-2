// ==========================
// 🧩 TOGGLE SIDEBAR
// ==========================
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");
  sidebar.classList.toggle("collapsed");
  mainContent.classList.toggle("expanded");
}

// Active menu link
document.querySelectorAll(".menu-link").forEach((link) => {
  link.addEventListener("click", function () {
    document
      .querySelectorAll(".menu-link")
      .forEach((l) => l.classList.remove("active"));
    this.classList.add("active");
  });
});

// Responsive sidebar toggle
if (window.innerWidth <= 768) {
  document.querySelector(".menu-toggle").addEventListener("click", function () {
    document.getElementById("sidebar").classList.toggle("active");
  });
}

// ==========================
// 🔒 BẢO VỆ TRANG ADMIN
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  // Nếu chưa đăng nhập
  if (!token || !userData) {
    await Swal.fire({
      icon: "warning",
      title: "Bạn chưa đăng nhập!",
      text: "Vui lòng đăng nhập để vào trang quản trị.",
      confirmButtonText: "Đăng nhập ngay",
    });
    window.location.href = "/frontend/login.html";
    return;
  }

  const user = JSON.parse(userData);

  // Nếu không phải admin
  if (user.role !== "admin") {
    await Swal.fire({
      icon: "error",
      title: "Truy cập bị từ chối!",
      text: "Bạn không có quyền truy cập trang quản trị.",
      confirmButtonText: "Quay lại trang chủ",
    });
    window.location.href = "/frontend/trangchu.html";
    return;
  }

  // =====================================================
  // 🔥 CHECK USER BỊ KHÓA SAU KHI ADMIN ẤN KHÓA
  // =====================================================
  try {
    const checkRes = await fetch("http://localhost:8000/api/customers", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (checkRes.status === 401 || checkRes.status === 403) {
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
  } catch (err) {
    console.error("Lỗi check khóa tài khoản:", err);
  }
  // =====================================================

  // ==========================
  //  LOAD THÔNG TIN NGƯỜI DÙNG
  // ==========================
  document.getElementById("admin-name").textContent = user.name || "Không rõ";
  document.getElementById("admin-role").textContent =
    user.role === "admin" ? "Quản trị viên" : "Người dùng";
  document.getElementById("admin-avatar").src = "/frontend/img/avt.jpg";

  // ==========================
  // 🚪 XỬ LÝ ĐĂNG XUẤT
  // ==========================
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const confirmLogout = await Swal.fire({
        title: "Đăng xuất?",
        text: "Bạn có chắc chắn muốn đăng xuất không?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Có, đăng xuất",
        cancelButtonText: "Hủy",
      });

      if (confirmLogout.isConfirmed) {
        // Xóa token và user
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/frontend/trangchu.html";
      }
    });
  }
});
