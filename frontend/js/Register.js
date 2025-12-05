const API_BASE_URL = "http://localhost:8000/api";

const createUserForm = document.getElementById("CreateUserForm");

if (createUserForm) {
  createUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("Name").value.trim();
    const email = document.getElementById("Email").value.trim();
    const password = document.getElementById("Password").value.trim();

    // ============================
    // 🔴 VALIDATE CLIENT-SIDE
    // ============================

    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Swal.fire({
        icon: "error",
        title: "Email không hợp lệ!",
        text: "Vui lòng nhập đúng định dạng email.",
      });
    }

    // Kiểm tra mật khẩu có chữ hoa
    if (!/[A-Z]/.test(password)) {
      return Swal.fire({
        icon: "error",
        title: "Mật khẩu không hợp lệ!",
        text: "Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa.",
      });
    }

    // Kiểm tra mật khẩu có số
    if (!/[0-9]/.test(password)) {
      return Swal.fire({
        icon: "error",
        title: "Mật khẩu không hợp lệ!",
        text: "Mật khẩu phải chứa ít nhất 1 chữ số.",
      });
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      return Swal.fire({
        icon: "error",
        title: "Mật khẩu quá ngắn!",
        text: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: password,
        }),
      });

      const data = await res.json().catch(() => null);

      // ============================
      // 🔴 BẮT LỖI TỪ BACKEND
      // ============================
      if (!res.ok) {
        let errorMsg = "Vui lòng kiểm tra lại thông tin.";

        if (data && data.errors) {
          const errors = data.errors;

          // lỗi email đã tồn tại
          if (errors.email) {
            errorMsg = errors.email.join(" ");
          }

          // lỗi mật khẩu từ Laravel
          else if (errors.password) {
            errorMsg = errors.password.join(" ");
          }

          // lỗi name
          else {
            errorMsg = Object.values(errors)
              .map((arr) => arr.join(" "))
              .join("\n");
          }
        } else if (data && data.message) {
          errorMsg = data.message;
        }

        return Swal.fire({
          icon: "error",
          title: "Đăng ký thất bại!",
          text: errorMsg,
        });
      }

      // ============================
      // 🟢 ĐĂNG KÝ THÀNH CÔNG
      // ============================
      if (data && data.status === "success") {
        await Swal.fire({
          icon: "success",
          title: "Đăng ký thành công!",
          text:
            data.message ||
            "Vui lòng kiểm tra email để kích hoạt tài khoản trước khi đăng nhập.",
          confirmButtonText: "Đến trang đăng nhập",
        });

        window.location.href = "/frontend/index.html";
      }
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi hệ thống!",
        text: "Vui lòng thử lại sau.",
      });
    }
  });
}
