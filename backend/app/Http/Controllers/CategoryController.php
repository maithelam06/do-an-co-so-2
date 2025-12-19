<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index()
    {
        // Trả về toàn bộ categories với thông tin số lượng sản phẩm
        $categories = Category::withCount('products')->orderBy('name')->get();
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string|max:1000',
            'status' => 'boolean'
        ]);

        $category = Category::create([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status ?? true
        ]);

        return response()->json([
            'message' => 'Danh mục đã được tạo thành công',
            'category' => $category
        ], 201);
    }

    public function show($id)
    {
        $category = Category::withCount('products')->findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category->id)
            ],
            'description' => 'nullable|string|max:1000',
            'status' => 'boolean'
        ]);

        $category->update([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status ?? $category->status
        ]);

        return response()->json([
            'message' => 'Danh mục đã được cập nhật thành công',
            'category' => $category
        ]);
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        // Kiểm tra xem danh mục có sản phẩm không
        if ($category->products()->count() > 0) {
            return response()->json([
                'message' => 'Không thể xóa danh mục này vì vẫn còn sản phẩm thuộc danh mục'
            ], 400);
        }

        $category->delete();

        return response()->json([
            'message' => 'Danh mục đã được xóa thành công'
        ]);
    }

    public function toggle($id)
    {
        $category = Category::findOrFail($id);
        $category->status = !$category->status;
        $category->save();

        return response()->json([
            'message' => 'Trạng thái danh mục đã được cập nhật',
            'category' => $category
        ]);
    }
}