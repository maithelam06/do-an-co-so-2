# Dự Án Backend E-Commerce Laravel

Đây là backend API cho ứng dụng e-commerce được xây dựng bằng Laravel 12, sử dụng Laravel Sanctum cho xác thực, và tích hợp thanh toán VNPay.

## Tính Năng Chính

- **Xác thực người dùng**: Đăng ký, đăng nhập, quên mật khẩu với OTP
- **Quản lý sản phẩm**: CRUD sản phẩm, danh mục
- **Giỏ hàng**: Thêm, xóa, cập nhật sản phẩm trong giỏ
- **Đơn hàng**: Tạo đơn, quản lý trạng thái, hủy đơn
- **Thanh toán**: Tích hợp VNPay, COD
- **Chat**: Chat giữa admin và khách hàng
- **Đánh giá sản phẩm**: Khách hàng đánh giá sau khi nhận hàng
- **Địa chỉ giao hàng**: Quản lý địa chỉ mặc định và nhiều địa chỉ
- **Mã giảm giá**: Tạo và áp dụng coupon
- **Thống kê**: Báo cáo doanh thu, sản phẩm bán chạy, v.v.

## Yêu Cầu Hệ Thống

- PHP >= 8.2
- Composer
- Node.js & npm (cho Vite build)
- Database: MySQL hoặc SQLite
- Laravel 12

## Cài Đặt

1. **Clone repository**:
   ```bash
   git clone https://github.com/maithelam06/do-an-co-so-2
   cd backend
   ```

2. **Cài đặt dependencies PHP**:
   ```bash
   composer install
   ```

3. **Cài đặt dependencies Node.js**:
   ```bash
   npm install
   ```

4. **Cấu hình môi trường**:
   - Sao chép file `.env.example` thành `.env`:
     ```bash
     cp .env.example .env
     ```
   - Chỉnh sửa `.env` với thông tin database và các cấu hình khác:
     ```env
     DB_CONNECTION=mysql
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=your_database
     DB_USERNAME=your_username
     DB_PASSWORD=your_password

     # Admin account (cho seeder)
     ADMIN_EMAIL=admin@example.com
     ADMIN_NAME=Admin
     ADMIN_PASSWORD=your_admin_password

     # VNPay config
     VNPAY_TMN_CODE=your_tmn_code
     VNPAY_HASH_SECRET=your_hash_secret
     VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
     VNPAY_RETURN_URL=http://your-domain/api/vnpay/return

     # Mail config (cho forgot password)
     MAIL_MAILER=smtp
     MAIL_HOST=your_smtp_host
     MAIL_PORT=587
     MAIL_USERNAME=your_email
     MAIL_PASSWORD=your_password
     MAIL_ENCRYPTION=tls
     MAIL_FROM_ADDRESS=your_email
     ```

5. **Tạo key ứng dụng**:
   ```bash
   php artisan key:generate
   ```

6. **Chạy migrations và seeders**:
   ```bash
   php artisan migrate
   php artisan db:seed  # Tạo tài khoản admin
    php artisan:link  # để upload ảnh lên
   
   ```

   **Import dữ liệu đầy đủ từ file SQL dump** (tùy chọn):
   - Vào link `https://drive.google.com/file/d/1PEYycCckPDsN_d4umX1Dam812iWbbLy4/view?usp=sharing` với dữ liệu đầy đủ, import vào database:
     ```bash
     mysql -u your_username -p your_database < path/to/dacs.sql
     ```
   - Hoặc dùng phpMyAdmin: Import > Chọn file `dacs.sql` > Go

7. **Build assets**:
   ```bash
   npm run build
   ```

## Chạy Ứng Dụng

### Chế độ phát triển:
```bash
composer run dev
```
Lệnh này sẽ khởi động:
- Laravel server trên `http://localhost:8000`
- Queue worker
- Logs
- Vite dev server

### Chế độ production:
```bash
php artisan serve
```

## Cài Đặt và Sử Dụng Ngrok

Ngrok cho phép expose local server ra internet, hữu ích cho việc test webhook từ VNPay hoặc các dịch vụ bên ngoài.

1. **Download và cài đặt ngrok**:
   - Truy cập [https://ngrok.com/download](https://ngrok.com/download)
   - Download phiên bản phù hợp với OS của bạn
   - Giải nén và đặt vào PATH hoặc thư mục tiện lợi

2. **Đăng ký tài khoản ngrok** (tùy chọn nhưng khuyến nghị):
   - Tạo tài khoản tại [https://dashboard.ngrok.com](https://dashboard.ngrok.com)
   - Lấy auth token và cấu hình:
     ```bash
     ngrok config add-authtoken YOUR_AUTH_TOKEN
     ```

3. **Chạy ngrok để expose port 8000**:
   ```bash
   ngrok http 8000
   ```
   - Ngrok sẽ cung cấp URL public, ví dụ: `https://abc123.ngrok.io`
   - Sử dụng URL này thay cho `http://localhost:8000` trong cấu hình VNPay return URL

4. **Cập nhật .env cho VNPay**:
   ```env
   VNPAY_RETURN_URL=https://abc123.ngrok.io/api/vnpay/return
   ```

5. **Lưu ý**:
   - URL ngrok thay đổi mỗi lần restart, trừ khi dùng tài khoản paid
   - Đảm bảo backend đang chạy trên port 8000 trước khi chạy ngrok
   - Sử dụng cho development/testing, không dùng production

## API Documentation

API sử dụng Laravel Sanctum cho xác thực. Gửi token trong header: `Authorization: Bearer {token}`

### Các endpoint chính:

#### Auth
- `POST /api/register` - Đăng ký
- `POST /api/login` - Đăng nhập
- `POST /api/forgot-password` - Quên mật khẩu

#### Sản phẩm
- `GET /api/products` - Lấy danh sách sản phẩm
- `POST /api/products` - Thêm sản phẩm (admin)
- `GET /api/products/{id}` - Chi tiết sản phẩm

#### Giỏ hàng (cần auth)
- `POST /api/cart/add/{productId}` - Thêm vào giỏ
- `GET /api/cart` - Xem giỏ hàng
- `DELETE /api/cart/remove/{itemId}` - Xóa item

#### Đơn hàng
- `POST /api/orders` - Tạo đơn (cần auth)
- `GET /api/my-orders` - Đơn của tôi (cần auth)
- `GET /api/orders` - Tất cả đơn (admin)

#### Thanh toán
- `POST /api/vnpay/create` - Tạo thanh toán VNPay
- `GET /api/vnpay/return` - Callback từ VNPay

#### Chat
- `GET /api/chat/messages` - Lấy tin nhắn
- `POST /api/chat/send` - Gửi tin nhắn

#### Thống kê (admin)
- `GET /api/admin/stats/overview` - Tổng quan
- `GET /api/admin/stats/revenue-by-date` - Doanh thu theo ngày

Xem chi tiết trong `routes/api.php`.

## Testing

Chạy tests:
```bash
php artisan test
```

## Cấu Trúc Thư Mục

```
backend/
├── app/
│   ├── Http/Controllers/  # Controllers
│   ├── Models/           # Models
│   └── ...
├── database/
│   ├── migrations/       # Database migrations
│   └── seeders/          # Seeders
├── routes/
│   └── api.php           # API routes
├── config/               # Config files
├── public/               # Public assets
├── resources/            # Views, CSS, JS
└── tests/                # Tests
```

## Contributing

1. Fork project
2. Tạo branch feature: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add some AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Tạo Pull Request

## License

MIT License

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
