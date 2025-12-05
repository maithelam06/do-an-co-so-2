<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $token;

    public function __construct(User $user, string $token)
    {
        $this->user = $user;
        $this->token = $token;
    }

    public function build()
    {
        // ĐƯỜNG DẪN TRANG RESET MẬT KHẨU FRONTEND
        $resetUrl = 'http://127.0.0.1:5500/frontend/resetPassword.html'
            . '?token=' . $this->token
            . '&email=' . urlencode($this->user->email);

        return $this->subject('Đặt lại mật khẩu TechStore')
            ->view('emails.reset_password')
            ->with([
                'user'     => $this->user,
                'resetUrl' => $resetUrl,
            ]);
    }
}
