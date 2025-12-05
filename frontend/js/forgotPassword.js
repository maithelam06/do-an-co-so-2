const API_BASE_URL = "http://localhost:8000/api";

let currentEmail = "";
let verifiedOtp = "";
let countdownInterval = null;
let countdownSeconds = 60;

// Helper: đổi step UI
function setStep(step) {
    const steps = document.querySelectorAll(".step");
    const contents = document.querySelectorAll(".step-content");

    steps.forEach((el) => {
        const s = el.getAttribute("data-step");
        el.classList.toggle("active", Number(s) === step);
    });

    contents.forEach((el, idx) => {
        el.style.display = idx === step - 1 ? "block" : "none";
    });
}

// Bước 1: Gửi email để nhận OTP
async function handleEmailSubmit(e) {
    e.preventDefault();

    const emailInput = document.getElementById("emailInput");
    const email = emailInput.value.trim();

    if (!email) {
        await Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Vui lòng nhập email đã đăng ký.",
            confirmButtonText: "Đóng",
        });
        return;
    }

    try {
        const btn = document.getElementById("emailSubmitBtn");
        btn.disabled = true;

        const res = await fetch(`${API_BASE_URL}/forgot-password/send-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ email }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            await Swal.fire({
                icon: "error",
                title: "Không thành công",
                text:
                    (data && data.message) ||
                    "Không tìm thấy tài khoản với email này.",
                confirmButtonText: "Đóng",
            });
            btn.disabled = false;
            return;
        }

        currentEmail = email;
        document.getElementById("emailDisplay").textContent = email;

        await Swal.fire({
            icon: "success",
            title: "Đã gửi OTP!",
            text:
                (data && data.message) ||
                "Mã OTP đã được gửi tới email của bạn.",
            confirmButtonText: "Tiếp tục",
        });

        setStep(2);
        startCountdown();
        focusOtpInputs();
    } catch (err) {
        console.error(err);
        await Swal.fire({
            icon: "error",
            title: "Lỗi hệ thống",
            text: "Có lỗi xảy ra, vui lòng thử lại sau.",
            confirmButtonText: "Đóng",
        });
    } finally {
        const btn = document.getElementById("emailSubmitBtn");
        btn.disabled = false;
    }
}

// Bước 2: Xác thực OTP
function getOtpValue() {
    const inputs = document.querySelectorAll(".otp-input-group .otp-input");
    return Array.from(inputs)
        .map((i) => i.value.trim())
        .join("");
}

async function handleOtpSubmit(e) {
    e.preventDefault();

    if (!currentEmail) {
        await Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Vui lòng nhập email ở bước 1 trước.",
            confirmButtonText: "Đóng",
        });
        setStep(1);
        return;
    }

    const otp = getOtpValue();

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        await Swal.fire({
            icon: "error",
            title: "OTP không hợp lệ",
            text: "Mã OTP phải gồm 6 chữ số.",
            confirmButtonText: "Đóng",
        });
        return;
    }

    try {
        const btn = document.getElementById("otpSubmitBtn");
        btn.disabled = true;

        const res = await fetch(`${API_BASE_URL}/forgot-password/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ email: currentEmail, otp }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            await Swal.fire({
                icon: "error",
                title: "Xác thực thất bại",
                text:
                    (data && data.message) ||
                    "Mã OTP không đúng hoặc đã hết hạn.",
                confirmButtonText: "Đóng",
            });
            btn.disabled = false;
            return;
        }

        verifiedOtp = otp;

        await Swal.fire({
            icon: "success",
            title: "Xác thực thành công!",
            text: "Bây giờ bạn có thể đặt lại mật khẩu.",
            confirmButtonText: "Tiếp tục",
        });

        setStep(3);
    } catch (err) {
        console.error(err);
        await Swal.fire({
            icon: "error",
            title: "Lỗi hệ thống",
            text: "Có lỗi xảy ra, vui lòng thử lại sau.",
            confirmButtonText: "Đóng",
        });
    } finally {
        const btn = document.getElementById("otpSubmitBtn");
        btn.disabled = false;
    }
}

// Bước 3: Đặt lại mật khẩu
function checkPasswordStrength(value) {
    const strengthEl = document.getElementById("passwordStrength");
    if (!strengthEl) return;

    let level = 0;
    if (value.length >= 6) level++;
    if (/[A-Z]/.test(value)) level++;
    if (/[0-9]/.test(value)) level++;
    if (/[^A-Za-z0-9]/.test(value)) level++;

    let text = "";
    if (!value) {
        text = "";
    } else if (level <= 1) {
        text = "Mật khẩu yếu";
    } else if (level === 2) {
        text = "Mật khẩu trung bình";
    } else if (level >= 3) {
        text = "Mật khẩu mạnh";
    }

    strengthEl.textContent = text;
}

async function handleResetPassword(e) {
    e.preventDefault();

    if (!currentEmail || !verifiedOtp) {
        await Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Vui lòng hoàn thành bước xác thực OTP trước.",
            confirmButtonText: "Đóng",
        });
        setStep(1);
        return;
    }

    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document
        .getElementById("confirmPassword")
        .value.trim();

    if (!newPassword || !confirmPassword) {
        await Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Vui lòng nhập đầy đủ mật khẩu.",
            confirmButtonText: "Đóng",
        });
        return;
    }

    if (newPassword !== confirmPassword) {
        await Swal.fire({
            icon: "error",
            title: "Mật khẩu không khớp",
            text: "Mật khẩu xác nhận không trùng khớp.",
            confirmButtonText: "Đóng",
        });
        return;
    }

    try {
        const btn = document.getElementById("resetSubmitBtn");
        btn.disabled = true;

        const res = await fetch(
            `${API_BASE_URL}/forgot-password/reset-password`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email: currentEmail,
                    otp: verifiedOtp,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            }
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            await Swal.fire({
                icon: "error",
                title: "Cập nhật thất bại",
                text:
                    (data && data.message) ||
                    "Không thể đặt lại mật khẩu.",
                confirmButtonText: "Đóng",
            });
            btn.disabled = false;
            return;
        }

        await Swal.fire({
            icon: "success",
            title: "Đổi mật khẩu thành công!",
            text: "Bạn có thể đăng nhập với mật khẩu mới.",
            confirmButtonText: "Đăng nhập",
        });

        window.location.href = "./index.html";
    } catch (err) {
        console.error(err);
        await Swal.fire({
            icon: "error",
            title: "Lỗi hệ thống",
            text: "Có lỗi xảy ra, vui lòng thử lại sau.",
            confirmButtonText: "Đóng",
        });
    } finally {
        const btn = document.getElementById("resetSubmitBtn");
        btn.disabled = false;
    }
}

// Gửi lại OTP
async function handleResendOtp(e) {
    e.preventDefault();
    if (!currentEmail) return;

    if (countdownSeconds > 0) {
        return; // chưa hết thời gian chờ
    }

    await sendOtpForResend(currentEmail);
}

async function sendOtpForResend(email) {
    try {
        const resendBtn = document.getElementById("resendBtn");
        resendBtn.classList.add("disabled");

        const res = await fetch(`${API_BASE_URL}/forgot-password/send-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ email }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            await Swal.fire({
                icon: "error",
                title: "Không thành công",
                text:
                    (data && data.message) ||
                    "Không thể gửi lại OTP.",
                confirmButtonText: "Đóng",
            });
            resendBtn.classList.remove("disabled");
            return;
        }

        await Swal.fire({
            icon: "success",
            title: "Đã gửi lại OTP!",
            text:
                (data && data.message) || "Vui lòng kiểm tra email.",
            confirmButtonText: "Đóng",
        });

        startCountdown();
    } catch (err) {
        console.error(err);
        await Swal.fire({
            icon: "error",
            title: "Lỗi hệ thống",
            text: "Có lỗi xảy ra, vui lòng thử lại sau.",
            confirmButtonText: "Đóng",
        });
    }
}

// Countdown resend OTP
function startCountdown() {
    const countdownEl = document.getElementById("countdown");
    const resendBtn = document.getElementById("resendBtn");

    countdownSeconds = 60;
    countdownEl.textContent = `(${countdownSeconds}s)`;
    resendBtn.classList.add("disabled");

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        countdownSeconds--;
        countdownEl.textContent = `(${countdownSeconds}s)`;

        if (countdownSeconds <= 0) {
            clearInterval(countdownInterval);
            countdownEl.textContent = "";
            resendBtn.classList.remove("disabled");
        }
    }, 1000);
}

// Quay lại step (dùng trong onclick HTML)
function goBackToStep(step, e) {
    if (e) e.preventDefault();
    setStep(step);
}

// Tự focus OTP input & điều hướng trái/phải
function focusOtpInputs() {
    const inputs = document.querySelectorAll(".otp-input");
    if (!inputs.length) return;

    inputs.forEach((input, index) => {
        input.addEventListener("input", () => {
            if (input.value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !input.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });

    inputs[0].focus();
}

// Khởi tạo
document.addEventListener("DOMContentLoaded", () => {
    setStep(1);
});
