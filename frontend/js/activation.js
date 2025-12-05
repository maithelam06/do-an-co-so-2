// Lấy tham số từ URL
const params = new URLSearchParams(window.location.search);
const activated = params.get("activated");

// Hàm xóa query khỏi URL sau khi đóng popup
function goToLoginWithoutQuery() {
    const baseUrl = window.location.origin + "/frontend/index.html";
    window.location.href = baseUrl;
}

// Kích hoạt thành công
if (activated === "1") {
    Swal.fire({
        icon: "success",
        title: "Kích hoạt tài khoản thành công!",
        html: `
            <div style="margin-top:6px;">
                <p style="margin:0 0 4px;">Tài khoản của bạn đã được <b>kích hoạt</b>.</p>
                <p style="margin:0;">Vui lòng quay lại trang đăng nhập để tiếp tục sử dụng TechStore.</p>
            </div>
        `,
        confirmButtonText: "Quay lại đăng nhập",
        scrollbarPadding: false,
        heightAuto: false,
        customClass: {
            popup: "techstore-popup",
            title: "techstore-title",
            htmlContainer: "techstore-text",
            confirmButton: "techstore-confirm",
        },
    }).then(goToLoginWithoutQuery);
}

// Kích hoạt thất bại
if (activated === "0") {
    Swal.fire({
        icon: "error",
        title: "Kích hoạt không thành công!",
        html: `
            <div style="margin-top:6px;">
                <p style="margin:0 0 4px;">Liên kết kích hoạt không hợp lệ hoặc đã hết hạn.</p>
                <p style="margin:0;">Nếu cần, vui lòng đăng ký lại hoặc liên hệ hỗ trợ.</p>
            </div>
        `,
        confirmButtonText: "Quay lại đăng nhập",
        scrollbarPadding: false,
        heightAuto: false,
        customClass: {
            popup: "techstore-popup",
            title: "techstore-title",
            htmlContainer: "techstore-text",
            confirmButton: "techstore-confirm",
        },
    }).then(goToLoginWithoutQuery);
}
