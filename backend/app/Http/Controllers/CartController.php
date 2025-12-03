<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    public function addToCart(Request $request, $productId)
    {
        $user = Auth::user();

        // Nếu người dùng chưa có giỏ hàng thì tạo mới
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        // Lấy số lượng từ frontend (mặc định 1 nếu không có)
        $quantity = $request->input('quantity', 1);

        // Tạo mới một dòng CartItem mỗi lần thêm
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $productId,
            'quantity' => $quantity,
        ]);

        return response()->json([
            'message' => 'Thêm sản phẩm vào giỏ hàng thành công',
        ]);
    }


    public function viewCart()
    {
        $user = Auth::user();
        $cart = Cart::where('user_id', $user->id)->with('items.product')->first();

        return response()->json($cart);
    }

    // Xóa 1 sản phẩm khỏi giỏ
    public function removeItem($itemId)
    {
        CartItem::findOrFail($itemId)->delete();
        return response()->json(['message' => 'Đã xóa sản phẩm khỏi giỏ hàng']);
    }

    public function count(Request $request)
    {
        $user = Auth::user();

        
        $cart = Cart::where('user_id', $user->id)->first();

        // Nếu chưa có giỏ hàng → trả về 0
        if (!$cart) {
            return response()->json(['count' => 0]);
        }

        // Đếm số sản phẩm riêng lẻ
        $count = $cart->items()->count();

        return response()->json(['count' => $count]);
    }


    public function updateQuantity(Request $request, $itemId)
    {
        $quantity = $request->input('quantity');

        if ($quantity < 1) {
            return response()->json(['error' => 'Số lượng phải lớn hơn 0'], 400);
        }

        $item = CartItem::findOrFail($itemId);
        $item->quantity = $quantity;
        $item->save();

        return response()->json(['message' => 'Đã cập nhật số lượng']);
    }

    public function clearCart()
    {
        $user = Auth::user();
        $cart = Cart::where('user_id', $user->id)->first();

        if ($cart) {
            $cart->items()->delete();
        }

        return response()->json(['message' => 'Đã xóa toàn bộ sản phẩm trong giỏ']);
    }

    // Xóa nhiều sản phẩm cùng lúc
    public function removeMultiple(Request $request)
    {
        $user = Auth::user();
        $itemIds = $request->input('itemIds', []);

        // Chỉ xóa các item thuộc giỏ của user
        CartItem::whereIn('id', $itemIds)
            ->whereHas('cart', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->delete();

        return response()->json(['message' => 'Đã xóa các sản phẩm đã chọn']);
    }
}
