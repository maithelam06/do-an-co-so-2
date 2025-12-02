<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Carbon\Carbon;

class VnpayReportController extends Controller
{
    /**
     * Build query base theo loại thanh toán + filter ngày + status
     */
    protected function buildBaseQuery(Request $request, string $type)
    {
        $query = Order::query();

        // Lọc theo loại thanh toán
        if ($type === 'vnpay') {
            // Theo DB của bạn: payment_channel = 'vnpay', payment_method = 'bank'
            $query->where('payment_channel', 'vnpay');
        } elseif ($type === 'cod') {
            // Theo DB: payment_method = 'cod', payment_channel đang NULL
            $query->where('payment_method', 'cod');
        }

        // Bộ lọc ngày
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        // Bộ lọc trạng thái
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return $query;
    }

    /*VNPay */

    // Tổng quan VNPay
    public function summary(Request $request)
    {
        $query = Order::query()
            ->where('payment_channel', 'vnpay'); // chỉ đơn VNPAY

        // Bộ lọc ngày
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        // Bộ lọc trạng thái (optional)
        if ($request->filled('status')) {
            if ($request->status === 'cancelled') {
                // ĐÃ HỦY = cancelled + refunded
                $query->whereIn('status', ['cancelled', 'refunded']);
            } elseif ($request->status === 'pending') {
                // ĐANG CHỜ = pending + refund_pending
                $query->whereIn('status', ['pending', 'refund_pending']);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Clone query để đếm / tính riêng
        $base = clone $query;

        $totalOrders      = (clone $base)->count();
        $paidOrders       = (clone $base)->where('status', 'completed')->count();
        $cancelledOrders  = (clone $base)->whereIn('status', ['cancelled', 'refunded'])->count();
        $pendingOrders    = (clone $base)->whereIn('status', ['pending', 'refund_pending'])->count();

        $totalRevenue = (clone $base)
            ->where('status', 'completed')
            ->sum('total_amount');

        $today = Carbon::today();
        $todayRevenue = (clone $base)
            ->where('status', 'completed')
            ->whereDate('created_at', $today)
            ->sum('total_amount');

        // Lấy danh sách để render bảng
        $orders = $query
            ->orderByDesc('id')
            ->get([
                'id',
                'full_name',
                'phone',
                'total_amount',
                'payment_method',
                'payment_channel',
                'status',
                'created_at',
            ]);

        return response()->json([
            'total_orders'     => $totalOrders,
            'paid_orders'      => $paidOrders,
            'cancelled_orders' => $cancelledOrders,
            'pending_orders'   => $pendingOrders,
            'total_revenue'    => $totalRevenue,
            'today_revenue'    => $todayRevenue,
            'orders'           => $orders,
        ]);
    }


    // Danh sách đơn VNPay
    public function orders(Request $request)
    {
        $query = $this->buildBaseQuery($request, 'vnpay');

        $orders = $query
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($orders);
    }

    /* COD*/

    // Tổng quan COD
    public function codSummary(Request $request)
    {
        $query = $this->buildBaseQuery($request, 'cod');
        $base  = clone $query;

        $totalOrders     = (clone $base)->count();
        $paidOrders      = (clone $base)->where('status', 'completed')->count();
        $cancelledOrders = (clone $base)->where('status', 'cancelled')->count();
        $pendingOrders   = (clone $base)->where('status', 'pending')->count();

        $totalRevenue = (clone $base)
            ->where('status', 'completed')
            ->sum('total_amount');

        $today = Carbon::today();

        $todayRevenue = (clone $base)
            ->where('status', 'completed')
            ->whereDate('created_at', $today)
            ->sum('total_amount');

        return response()->json([
            'total_orders'     => $totalOrders,
            'paid_orders'      => $paidOrders,
            'cancelled_orders' => $cancelledOrders,
            'pending_orders'   => $pendingOrders,
            'total_revenue'    => $totalRevenue,
            'today_revenue'    => $todayRevenue,
        ]);
    }

    // Danh sách đơn COD
    public function codOrders(Request $request)
    {
        $query = $this->buildBaseQuery($request, 'cod');

        $orders = $query
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($orders);
    }
}
