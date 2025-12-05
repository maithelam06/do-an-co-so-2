<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function saveReview(Request $request, Product $product)
    {
        $user = $request->user();
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
            'order_id' => 'required|integer|exists:orders,id'
        ]);

        // Lưu hoặc cập nhật review theo sản phẩm
        $review = Review::updateOrCreate(
            [
                'user_id' => $user->id,
                'product_id' => $product->id
            ],
            [
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? '',
                'order_id' => $validated['order_id']
            ]
        );

        // 👉 Cập nhật trạng thái đánh giá của đơn hàng
        $order = \App\Models\Order::find($validated['order_id']);
        $order->is_reviewed = true;
        $order->save();

        return response()->json([
            'message' => 'Review saved successfully',
            'review' => $review
        ]);
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
