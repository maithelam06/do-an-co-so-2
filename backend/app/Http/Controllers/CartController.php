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

        // Kiểm tra sản phẩm đã có trong giỏ chưa
        $item = CartItem::where('cart_id', $cart->id)
                        ->where('product_id', $productId)
                        ->first();

         if ($item) {
            $item->quantity += $quantity; // ✅ cộng thêm số lượng chọn
            $item->save();
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $productId,
                'quantity' => $quantity, // ✅ thêm đúng số lượng chọn
            ]);
        }

        return response()->json(['message' => 'Đã thêm sản phẩm vào giỏ hàng']);
      }

      public function viewCart()
    {
        $user = Auth::user();
        $cart = Cart::where('user_id', $user->id)->with('items.product')->first();

        return response()->json($cart);
    }

    // 🔴 Xóa 1 sản phẩm khỏi giỏ
    public function removeItem($itemId)
    {
        CartItem::findOrFail($itemId)->delete();
        return response()->json(['message' => 'Đã xóa sản phẩm khỏi giỏ hàng']);
    }

    public function count(Request $request)
    {
        $user = Auth::user(); // Lấy user từ token Sanctum

        // Lấy giỏ hàng của user
        $cart = Cart::where('user_id', $user->id)->first();

        // Tính tổng số lượng (nếu chưa có giỏ hàng thì là 0)
        if (!$cart) {
            return response()->json(['count' => 0]);
        }

        // Đếm tổng số lượng sản phẩm trong giỏ
        $count = $cart->items()->sum('quantity');

        return response()->json(['count' => $count]);
    }
}
