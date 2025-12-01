<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function store(Request $request, $productId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Bạn chưa đăng nhập'], 401);
        }
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        $review = Review::create([
            'user_id'    => $user->id,
            'product_id' => $productId,
            'rating'     => $request->rating,
            'comment'    => $request->comment
        ]);

        return response()->json([
            'message' => 'Đánh giá thành công!',
            'data' => $review
        ], 201);
    }

    public function getReviews($productId)
    {
        $reviews = Review::with('user') // lấy thông tin người dùng
            ->where('product_id', $productId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($reviews);
    }
}
