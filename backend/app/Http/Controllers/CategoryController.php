<?php

namespace App\Http\Controllers;

use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        // Trả về toàn bộ categories
        return response()->json(Category::orderBy('name')->get());
    }
}