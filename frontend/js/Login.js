
const formLogin = document.getElementById("login");

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault(); // ngăn reload trang

  const email = document.getElementById("emailLog").value;
  const password = document.getElementById("passwordLog").value;

  if(!email||!password){
    await Swal.fire({
      scrollbarPadding: false,
      heightAuto: false,
      icon: "error",
      title: "Đăng nhập thất bại!",
      text: "Vui lòng nhập đầy đủ thông tin.",
      confirmButtonText: "Đóng",
    });
    return;
  }

  try {
    const res = await fetch("http://localhost:8000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Lỗi hệ thống!",
        text: "Có lỗi xảy ra, vui lòng thử lại sau.",
        confirmButtonText: "Đóng",
      });
    }

    if (!res.ok) {
      // 403: tài khoản bị khóa
      if (res.status === 403) {
        await Swal.fire({
          scrollbarPadding: false,
          heightAuto: false,
          icon: "error",
          title: "Tài khoản bị khóa!",
          text:
            (data && data.message) ||
            "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
          confirmButtonText: "Đóng",
        });
        return;
      }

      // 401: sai email / mật khẩu
      if (res.status === 401) {
        await Swal.fire({
          scrollbarPadding: false,
          heightAuto: false,
          icon: "error",
          title: "Đăng nhập thất bại!",
          text: (data && data.message) || "Sai email hoặc mật khẩu.",
          confirmButtonText: "Thử lại",
        });
        return;
      }

      // các lỗi khác
      await Swal.fire({
        scrollbarPadding: false,
        heightAuto: false,
        icon: "error",
        title: "Lỗi hệ thống!",
        text: (data && data.message) || "Có lỗi xảy ra, vui lòng thử lại sau.",
        confirmButtonText: "Đóng",
      });
      return;
    }

    // Trường hợp response OK (2xx)
    if (data && data.status === "success") {
      const user = {
        id: data.user.id, 
        name: data.user.name,
        email: data.user.email,   
        role: data.role,
        avatar: data.user.avatar,
        token: data.token,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(user));

      if (data.role === "admin") {
        await Swal.fire({
          scrollbarPadding: false,
          heightAuto: false,
          icon: "success",
          title: "Đăng nhập thành công!",
          text: "Chào mừng trở lại 👋",
          confirmButtonText: "Vào trang quản trị",
        });
        window.location.href = "/frontend/Admin/admin.html";
      } else {
        await Swal.fire({
          scrollbarPadding: false,
          heightAuto: false,
          icon: "success",
          title: "Đăng nhập thành công!",
          text: "Chào mừng trở lại 👋",
          confirmButtonText: "Vào trang chủ",
        });
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get("redirect") || "/frontend/trangchu.html";

        // Chuyển hướng
        window.location.href = redirectUrl;
      }
    } else {
      // phòng trường hợp backend trả 200 nhưng status != success
      await Swal.fire({
        scrollbarPadding: false,
        heightAuto: false,
        icon: "error",
        title: "Đăng nhập thất bại!",
        text: (data && data.message) || "Sai email hoặc mật khẩu.",
        confirmButtonText: "Thử lại",
      });
    }
  } catch (error) {
    console.error("Lỗi khi gửi request:", error);
    await Swal.fire({
      scrollbarPadding: false,
      heightAuto: false,
      icon: "error",
      title: "Lỗi hệ thống!",
      text: "Có lỗi xảy ra, vui lòng thử lại sau.",
      confirmButtonText: "Đóng",
    });
  }
});
