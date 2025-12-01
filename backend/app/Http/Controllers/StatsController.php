<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * Hàm dùng chung: áp filter từ ngày / đến ngày lên query (dùng created_at).
     */
    protected function applyDateFilter($query, Request $request)
    {
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        return $query;
    }

    /**
     * Tổng quan: tổng đơn, tổng doanh thu, AOV, khách hàng mới.
     * GET /api/admin/stats/overview?from=YYYY-MM-DD&to=YYYY-MM-DD
     */
    public function overview(Request $request)
    {
        $q = $this->applyDateFilter(Order::query(), $request);

        $totalOrders  = (clone $q)->count();
        $totalRevenue = (clone $q)
            ->where('status', 'completed')
            ->sum('total_amount');

        $avgOrderValue = $totalOrders > 0
            ? round($totalRevenue / $totalOrders)
            : 0;

        // Số khách hàng khác nhau có đơn trong khoảng thời gian
        $newCustomers = (clone $q)
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');

        return response()->json([
            'total_orders'     => $totalOrders,
            'total_revenue'    => $totalRevenue,
            'avg_order_value'  => $avgOrderValue,
            'new_customers'    => $newCustomers,
        ]);
    }

    /**
     * Doanh thu theo ngày.
     * GET /api/admin/stats/revenue-by-date
     * trả về mảng: [ { date: '2025-11-28', revenue: 1000000 }, ... ]
     */
    public function revenueByDate(Request $request)
    {
        $q = Order::query()
            ->where('status', 'completed');

        $q = $this->applyDateFilter($q, $request);

        $data = $q->selectRaw('DATE(created_at) as date, SUM(total_amount) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($data);
    }

    /**
     * Tỷ lệ phương thức thanh toán.
     * GET /api/admin/stats/payment-method
     * trả về: { "vnpay": 10, "cod": 5, "bank": 2 }
     */
    public function paymentMethod(Request $request)
    {
        $q = $this->applyDateFilter(Order::query(), $request);

        $data = $q->selectRaw('payment_method, COUNT(*) as total')
            ->groupBy('payment_method')
            ->pluck('total', 'payment_method');

        return response()->json($data);
    }

    /**
     * Top sản phẩm bán chạy.
     * GET /api/admin/stats/top-products
     * dùng order_items + orders (chỉ lấy đơn completed).
     */
    public function topProducts(Request $request)
    {
        $q = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed');

        $q = $this->applyDateFilter($q, $request);

        $data = $q->selectRaw('
                order_items.product_id,
                order_items.product_name,
                SUM(order_items.quantity) as total_qty,
                SUM(order_items.subtotal) as total_revenue
            ')
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        return response()->json($data);
    }

    /**
     * Top khách hàng theo tổng chi tiêu.
     * GET /api/admin/stats/top-customers
     */
    public function topCustomers(Request $request)
    {
        $q = DB::table('orders')
            ->join('users', 'orders.user_id', '=', 'users.id')
            ->where('orders.status', 'completed');

        $q = $this->applyDateFilter($q, $request);

        $data = $q->selectRaw('
                users.id,
                users.name as full_name,
                COUNT(orders.id) as order_count,
                SUM(orders.total_amount) as total_spent
            ')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_spent')
            ->limit(5)
            ->get();

        return response()->json($data);
    }
}
