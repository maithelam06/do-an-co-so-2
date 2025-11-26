<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    // Lấy tất cả sản phẩm (Admin)
    public function index(Request $request)
    {
        $query = Product::with('category');
        
        // Lọc theo tên danh mục nếu có query parameter 'category'
        if ($request->has('category')) {
            $categoryName = $request->query('category');
            $query->whereHas('category', function ($q) use ($categoryName) {
                $q->where('name', $categoryName);
            });
        }
        
        $products = $query->get();

        // Tính số lượng đã bán và gắn vào từng sản phẩm
        $soldMap = $this->getSoldCountMap();
        $products->transform(function ($p) use ($soldMap) {
            $p->sold_count = $soldMap[$p->id] ?? 0;
            return $p;
        });

        return response()->json($products);
    }

    // Lấy sản phẩm đang bật (User)
    public function active(Request $request)
    {
        $query = Product::with('category')->where('status', 1);
        
        // Lọc theo tên danh mục nếu có query parameter 'category'
        if ($request->has('category')) {
            $categoryName = $request->query('category');
            $query->whereHas('category', function ($q) use ($categoryName) {
                $q->where('name', $categoryName);
            });
        }
        
        $products = $query->get();

        // Tính số lượng đã bán và gắn vào từng sản phẩm
        $soldMap = $this->getSoldCountMap();
        $products->transform(function ($p) use ($soldMap) {
            $p->sold_count = $soldMap[$p->id] ?? 0;
            return $p;
        });

        return response()->json($products);
    }

    // Thêm sản phẩm mới
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|integer|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png',
        ]);

        $path = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
        }

        $product = Product::create([
            'name' => $validated['name'],
            'category_id' => $validated['category_id'] ?? null,
            'price' => $validated['price'],
            'description' => $validated['description'] ?? null,
            'image' => $path,
            'status' => 1, // mặc định bật
        ]);

        return response()->json([
            'message' => 'Thêm sản phẩm thành công!',
            'product' => $product,
        ], 201);
    }

    // Cập nhật sản phẩm
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category_id' => 'nullable|integer|exists:categories,id',
            'price' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($validated);

        return response()->json([
            'message' => 'Cập nhật sản phẩm thành công!',
            'product' => $product,
        ]);
    }

    // Xóa sản phẩm
    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return response()->json(['message' => 'Đã xóa sản phẩm!']);
    }

    // Bật / Tắt sản phẩm
    public function toggle($id)
    {
        $product = Product::findOrFail($id);
        $product->status = !$product->status;
        $product->save();

        return response()->json([
            'message' => $product->status ? 'Đã bật sản phẩm!' : 'Đã tắt sản phẩm!',
            'status' => $product->status,
        ]);
    }
    public function show($id)
{
    $product = Product::with('category')->find($id);

    if (!$product) {
        return response()->json(['message' => 'Sản phẩm không tồn tại'], 404);
    }

    // Tính số lượng đã bán và gắn vào sản phẩm
    $soldMap = $this->getSoldCountMap();
    $product->sold_count = $soldMap[$product->id] ?? 0;

    return response()->json($product);
}

    /**
     * Lấy map product_id => tổng quantity đã bán từ order_items
     * Chỉ tính các đơn hàng hợp lệ (ví dụ: status = 'completed').
     */
    protected function getSoldCountMap(): array
    {
        // Theo migration: orders.status: pending|processing|completed|cancelled
        // Có thêm shipping_status: pending|shipping|completed|cancelled
        // Ở đây mặc định chỉ tính những đơn đã completed. Có thể bổ sung điều kiện shipping_status nếu cần.
        $rows = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->where('o.status', 'completed')
            // ->where('o.shipping_status', 'completed') // bật nếu muốn tính khi giao hàng hoàn tất
            ->groupBy('oi.product_id')
            ->select('oi.product_id', DB::raw('COALESCE(SUM(oi.quantity),0) as total_sold'))
            ->get();

        $map = [];
        foreach ($rows as $r) {
            $map[$r->product_id] = (int) $r->total_sold;
        }
        return $map;
    }
}
