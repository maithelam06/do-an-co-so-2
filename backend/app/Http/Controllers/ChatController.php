<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Message;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * Danh sách user cho ADMIN
     */
    public function users()
    {
        // Bảng users của em có cột "name" (không phải full_name)
        $users = User::select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(function ($u) {
                // Lấy tin nhắn gần nhất (nếu bảng messages có timestamps)
                $last = Message::where('user_id', $u->id)
                    ->orderBy('created_at', 'desc')
                    ->first();

                $u->last_message = $last ? $last->message : null;
                return $u;
            });

        return response()->json($users);
    }

    /**
     * Lấy toàn bộ tin nhắn theo user
     */
    public function messages(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
        ]);

        $messages = Message::where('user_id', $request->user_id)
            ->orderBy('created_at')
            ->get(['id', 'user_id', 'sender', 'message', 'created_at']);

        return response()->json($messages);
    }

    /**
     * ADMIN gửi tin nhắn
     */
    public function send(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'message' => 'required|string',
        ]);

        $msg = Message::create([
            'user_id' => $data['user_id'],
            'sender'  => 'admin',
            'message' => $data['message'],
        ]);

        return response()->json($msg, 201);
    }

    /**
     * USER gửi tin nhắn
     */
    public function userSend(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'message' => 'required|string',
        ]);

        $msg = Message::create([
            'user_id' => $data['user_id'],
            'sender'  => 'user',
            'message' => $data['message'],
        ]);

        return response()->json($msg, 201);
    }

    /**
     * API tạo phòng video call (Jitsi / Google Meet tuỳ em)
     */
    public function createRoom()
    {
        $room = 'techstore_room_' . uniqid();

        return response()->json([
            'room' => $room,
        ]);
    }
}
