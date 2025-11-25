const formLogin = document.getElementById('login');

formLogin.addEventListener('submit', async (event) => {
    event.preventDefault(); // ngăn reload trang

    const email = document.getElementById('emailLog').value;
    const password = document.getElementById('passwordLog').value;

    try {
        const res = await fetch('http://localhost:8000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        let data = null;
        try {
            data = await res.json();
        } catch (e) {
            // nếu backend không trả JSON thì vẫn tránh app crash
        }

        // ❌ Nếu response không OK (4xx / 5xx)
        if (!res.ok) {
            // 403: tài khoản bị khóa
            if (res.status === 403) {
                await Swal.fire({
                    scrollbarPadding: false,
                    heightAuto: false,
                    icon: 'error',
                    title: 'Tài khoản bị khóa!',
                    text: (data && data.message) || 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
                    confirmButtonText: 'Đóng'
                });
                return;
            }

            // 401: sai email / mật khẩu
            if (res.status === 401) {
                await Swal.fire({
                    scrollbarPadding: false,
                    heightAuto: false,
                    icon: 'error',
                    title: 'Đăng nhập thất bại!',
                    text: (data && data.message) || 'Sai email hoặc mật khẩu.',
                    confirmButtonText: 'Thử lại'
                });
                return;
            }

            // các lỗi khác
            await Swal.fire({
                scrollbarPadding: false,
                heightAuto: false,
                icon: 'error',
                title: 'Lỗi hệ thống!',
                text: (data && data.message) || 'Có lỗi xảy ra, vui lòng thử lại sau.',
                confirmButtonText: 'Đóng'
            });
            return;
        }

        // ✅ Trường hợp response OK (2xx)
        if (data && data.status === 'success') {
            const user = {
                name: data.user.name,
                role: data.role,
                avatar: data.user.avatar,
                token: data.token
            };

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(user));

            await Swal.fire({
                scrollbarPadding: false,
                heightAuto: false,
                icon: 'success',
                title: 'Đăng nhập thành công!',
                text: 'Chào mừng trở lại 👋',
                confirmButtonText: 'Vào trang quản trị'
            });

            if (data.role === 'admin') {
                window.location.href = '/frontend/Admin/admin.html';
            } else {
                window.location.href = '/frontend/trangchu.html';
            }
        } else {
            // phòng trường hợp backend trả 200 nhưng status != success
            await Swal.fire({
                scrollbarPadding: false,
                heightAuto: false,
                icon: 'error',
                title: 'Đăng nhập thất bại!',
                text: (data && data.message) || 'Sai email hoặc mật khẩu.',
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
