const formLogin = document.getElementById('login');

formLogin.addEventListener('submit', async (event) => {
    event.preventDefault(); // ngăn reload trang

    const email = document.getElementById('emailLog').value;
    const password = document.getElementById('passwordLog').value;

    try {
        const e = await fetch('http://backend.test/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await e.json();

        if (data.status === 'success') {
            // 🧩 Lưu thông tin đăng nhập để dùng sau
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('name', data.name);

            
            await Swal.fire({
                scrollbarPadding: false,
                heightAuto: false,
                icon: 'success',
                title: 'Đăng nhập thành công!',
                text: 'Chào mừng trở lại 👋',
                confirmButtonText: 'Vào trang quản trị'
            });

            if (data.role === 'admin') {
                window.location.href = '/frontend/admin/dashboard.html';
            } else {
                window.location.href = '';
            }

        } else {
            await Swal.fire({
                scrollbarPadding: false,
                heightAuto: false,
                icon: 'error',
                title: 'Đăng nhập thất bại!',
                text: data.message || 'Sai email hoặc mật khẩu.',
                confirmButtonText: 'Thử lại'
            });
        }

    } catch (error) {
        console.error('Lỗi khi gửi request:', error);
        await Swal.fire({
            scrollbarPadding: false,
            heightAuto: false,
            icon: 'error',
            title: 'Lỗi hệ thống!',
            text: 'Có lỗi xảy ra, vui lòng thử lại sau.',
            confirmButtonText: 'Đóng'
        });
    }
});