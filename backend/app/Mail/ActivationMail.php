<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ActivationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function build()
    {
        $activationUrl = url('/activate-account/' . $this->user->activation_token);

        return $this->subject('Kích hoạt tài khoản TechStore')
            ->view('emails.activation')
            ->with([
                'user'          => $this->user,
                'activationUrl' => $activationUrl,
            ]);
    }
}
