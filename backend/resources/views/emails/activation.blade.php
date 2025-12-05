<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Kích hoạt tài khoản</title>
</head>
<body>
    <h2>Xin chào {{ $user->name }}!</h2>

    <p>Bạn vừa đăng ký tài khoản tại <strong>TechStore</strong>.</p>

    <p>Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản:</p>

    <p>
        <a href="{{ $activationUrl }}" style="
            display:inline-block;
            padding:10px 20px;
            background:#0d6efd;
            color:#fff;
            text-decoration:none;
            border-radius:4px;
        ">
            Kích hoạt tài khoản
        </a>
    </p>

    <p>Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>

    <p>Trân trọng,<br>Đội ngũ TechStore</p>
</body>
</html>
