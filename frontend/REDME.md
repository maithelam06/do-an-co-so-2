# Dự Án Frontend E-Commerce TechStore

Đây là giao diện người dùng (Frontend) cho ứng dụng e-commerce TechStore, được xây dựng bằng HTML, CSS, JavaScript thuần, sử dụng Bootstrap và Font Awesome. Frontend kết nối với Backend Laravel qua API để quản lý sản phẩm, giỏ hàng, đơn hàng, và các tính năng khác.

## Tính Năng Chính

### Phần Người Dùng (User)
- **Trang chủ**: Hiển thị sản phẩm nổi bật, danh mục
- **Chi tiết sản phẩm**: Xem thông tin, đánh giá sản phẩm
- **Giỏ hàng**: Thêm, xóa, cập nhật sản phẩm
- **Thanh toán**: Tích hợp VNPay và COD
- **Đơn hàng**: Xem lịch sử đơn hàng, hủy đơn
- **Tài khoản**: Đăng ký, đăng nhập, quên mật khẩu, cập nhật profile
- **Đánh giá**: Đánh giá sản phẩm sau khi nhận hàng
- **Chat**: Chat với admin
- **Địa chỉ**: Quản lý địa chỉ giao hàng

### Phần Quản Trị (Admin)
- **Dashboard**: Thống kê tổng quan
- **Quản lý sản phẩm**: Thêm, sửa, xóa sản phẩm
- **Quản lý danh mục**: CRUD danh mục
- **Quản lý đơn hàng**: Xem, cập nhật trạng thái, hoàn tiền
- **Quản lý khách hàng**: Xem danh sách, khóa tài khoản
- **Thống kê**: Báo cáo doanh thu, sản phẩm bán chạy
- **Chat**: Trả lời tin nhắn khách hàng
- **Mã giảm giá**: Quản lý coupon

## Công Nghệ Sử Dụng

- **HTML5**: Cấu trúc trang
- **CSS3**: Styling tùy chỉnh
- **JavaScript (ES6+)**: Logic frontend, AJAX với Fetch API
- **Bootstrap 5**: Framework CSS responsive
- **Font Awesome 6**: Icons
- **SweetAlert2**: Thông báo đẹp
- **LocalStorage**: Lưu trữ token và thông tin user

## Yêu Cầu Hệ Thống

- Trình duyệt web hiện đại (Chrome, Firefox, Edge)
- Backend Laravel chạy trên `http://localhost:8000` (hoặc cấu hình API_BASE_URL)
- Không cần server riêng, chỉ cần mở file HTML

## Cài Đặt và Chạy

1. **Đảm bảo Backend đang chạy**:
   - Backend Laravel phải chạy trên `http://localhost:8000`
   - Xem README backend để cài đặt

2. **Mở Frontend**:
   - Mở file `index.html` hoặc `trangchu.html` trong trình duyệt
   - Hoặc sử dụng server local như Live Server extension trong VS Code

3. **Cấu hình API** (nếu cần):
   - Trong các file JS, API_BASE_URL mặc định là `http://localhost:8000/api`
   - Thay đổi nếu backend chạy trên port khác

## Cấu Trúc Thư Mục

```
frontend/
├── index.html                    # Trang đăng nhập chính
├── trangchu.html                 # Trang chủ
├── chitiet.html                  # Chi tiết sản phẩm
├── tranggiohang.html             # Giỏ hàng
├── thanhtoan.html                # Thanh toán
├── donhangcuatoi.html            # Đơn hàng của tôi
├── profile.html                  # Hồ sơ cá nhân
├── forgotPassword.html           # Quên mật khẩu
├── payment-result.html           # Kết quả thanh toán
├── *.html                        # Các trang chính sách
├── Admin/
│   ├── admin.html                # Dashboard admin
│   ├── productmanagement.html    # Quản lý sản phẩm
│   ├── category-management.html  # Quản lý danh mục
│   ├── order.html                # Quản lý đơn hàng
│   ├── customermanagement.html   # Quản lý khách hàng
│   ├── promotion.html            # Mã giảm giá
│   ├── statistics.html           # Thống kê
│   ├── chat-admin.html           # Chat admin
│   └── ...
├── css/
│   ├── main.css                  # CSS chung
│   ├── trangchu.css              # CSS trang chủ
│   ├── admin.css                 # CSS admin
│   ├── chat.css                  # CSS chat
│   └── ...
├── js/
│   ├── main.js                   # JS chung (auth, cart)
│   ├── Login.js                  # JS đăng nhập
│   ├── Register.js               # JS đăng ký
│   ├── main.js                   # JS trang chủ
│   ├── chitiet.js                # JS chi tiết sản phẩm
│   ├── giohang.js                # JS giỏ hàng
│   ├── pay.js                    # JS thanh toán
│   ├── profile.js                # JS profile
│   ├── admin.js                  # JS admin chung
│   ├── productmanagement.js      # JS quản lý sản phẩm
│   └── ...
├── img/                          # Hình ảnh
└── REDME.md                      # File này
```

## Hướng Dẫn Sử Dụng

### Cho Người Dùng
1. **Đăng ký/Đăng nhập**: Truy cập `index.html`, đăng ký tài khoản mới hoặc đăng nhập
2. **Duyệt sản phẩm**: Trên trang chủ, xem sản phẩm theo danh mục
3. **Thêm vào giỏ**: Click "Thêm vào giỏ" trên trang chi tiết
4. **Thanh toán**: Đi đến giỏ hàng, chọn sản phẩm và thanh toán
5. **Theo dõi đơn**: Xem đơn hàng trong "Đơn hàng của tôi"

### Cho Admin
1. **Đăng nhập**: Sử dụng tài khoản admin để đăng nhập
2. **Quản lý**: Sử dụng sidebar để điều hướng đến các trang quản lý
3. **Thống kê**: Xem dashboard để biết tình hình kinh doanh
4. **Chat**: Trả lời tin nhắn khách hàng trong thời gian thực

## API Integration

Frontend kết nối với Backend qua REST API:

- **Base URL**: `http://localhost:8000/api`
- **Auth**: Sử dụng Bearer token trong header
- **Storage**: Token và user info lưu trong localStorage

Các API chính:
- `/login`, `/register` - Auth
- `/products` - Sản phẩm
- `/cart/*` - Giỏ hàng
- `/orders` - Đơn hàng
- `/vnpay/*` - Thanh toán

## Phát Triển

- **Thêm trang mới**: Tạo file HTML, CSS, JS tương ứng
- **Responsive**: Sử dụng Bootstrap classes
- **AJAX**: Sử dụng Fetch API cho các request
- **Validation**: Kiểm tra input trước khi gửi API

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

- **Không kết nối được API**: Kiểm tra backend có chạy không
- **Token expired**: Tự động redirect về login
- **Lỗi 401/403**: Tài khoản bị khóa
- **Responsive issues**: Kiểm tra viewport meta tag

## Contributing

1. Fork project
2. Tạo branch: `git checkout -b feature/new-feature`
3. Commit: `git commit -m 'Add new feature'`
4. Push: `git push origin feature/new-feature`
5. Pull Request

## License

MIT License