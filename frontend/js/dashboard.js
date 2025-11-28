document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
        await Swal.fire({
        icon: "error",
        title: "Quyền truy cập!",
        text: "Bạn không có quyền truy cập trang này!",
        confirmButtonText: "Đóng"
      });
        window.location.href = '/frontend/index.html'; // quay lại trang login
    } else {
        console.log('✅ Đã xác thực admin, cho phép vào dashboard');
        // Ở đây bạn có thể gọi API để lấy dữ liệu dashboard nếu muốn
    }
});