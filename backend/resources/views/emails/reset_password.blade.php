<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Đặt lại mật khẩu</title>
</head>
<body>
    <h2>Xin chào {{ $user->name }}!</h2>

    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản TechStore của bạn.</p>

    <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>

    <p>
        <a href="{{ $resetUrl }}" style="
            display:inline-block;
            padding:10px 20px;
            background:#0d6efd;
            color:#fff;
            text-decoration:none;
            border-radius:4px;
        ">
            Đặt lại mật khẩu
        </a>
    </p>

    <p>Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này.</p>

    <p>Trân trọng,<br>Đội ngũ TechStore</p>
</body>
</html>
