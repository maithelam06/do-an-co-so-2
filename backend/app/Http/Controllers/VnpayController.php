<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class VnpayController extends Controller
{
    // API tạo URL thanh toán
    public function createPayment(Request $request)
{
    $request->validate([
        'order_id' => 'required|integer|exists:orders,id',
        'amount'   => 'required|numeric|min:1',
    ]);

    $order = Order::findOrFail($request->order_id);

    $vnp_TmnCode    = config('vnpay.tmn_code');
    $vnp_HashSecret = config('vnpay.hash_secret');
    $vnp_Url        = config('vnpay.url');
    $vnp_Returnurl  = config('vnpay.return_url');
    $vnp_IpnUrl     = config('vnpay.ipn_url'); // vẫn lấy, nhưng KHÔNG gửi cho VNPay

    $vnp_TxnRef    = (string) $order->id;
    $vnp_OrderInfo = 'Thanh toan don hang #' . $order->id;
    $vnp_OrderType = 'other';
    $vnp_Amount    = (int) $request->amount * 100;
    $vnp_Locale    = 'vn';
    $vnp_BankCode  = '';
    $vnp_IpAddr    = $request->ip();

    $inputData = [
        'vnp_Version'    => '2.1.0',
        'vnp_TmnCode'    => $vnp_TmnCode,
        'vnp_Amount'     => $vnp_Amount,
        'vnp_Command'    => 'pay',
        'vnp_CreateDate' => now()->format('YmdHis'),
        'vnp_CurrCode'   => 'VND',
        'vnp_IpAddr'     => $vnp_IpAddr,
        'vnp_Locale'     => $vnp_Locale,
        'vnp_OrderInfo'  => $vnp_OrderInfo,
        'vnp_OrderType'  => $vnp_OrderType,
        'vnp_ReturnUrl'  => $vnp_Returnurl,
        'vnp_TxnRef'     => $vnp_TxnRef,
        // ❌ KHÔNG có vnp_IpnUrl ở đây
    ];

    if (!empty($vnp_BankCode)) {
        $inputData['vnp_BankCode'] = $vnp_BankCode;
    }

    ksort($inputData);

    $hashData = '';
    $query    = '';
    $i        = 0;

    foreach ($inputData as $key => $value) {
        if ($i == 1) {
            $hashData .= '&';
            $query    .= '&';
        }
        $hashData .= urlencode($key) . '=' . urlencode($value);
        $query    .= urlencode($key) . '=' . urlencode($value);
        $i = 1;
    }

    $vnp_SecureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
    $paymentUrl     = $vnp_Url . '?' . $query . '&vnp_SecureHash=' . $vnp_SecureHash;

    \Log::info('VNPAY_CREATE_PAYMENT', [
        'inputData'  => $inputData,
        'hashData'   => $hashData,
        'secureHash' => $vnp_SecureHash,
        'paymentUrl' => $paymentUrl,
    ]);

    return response()->json([
        'payment_url' => $paymentUrl,
    ]);
}

    // IPN URL VNPay bắn server-to-server
public function ipnHandler(Request $request)
{
    \Log::info('VNPAY_IPN_HIT', $request->all());

    $vnp_HashSecret = config('vnpay.hash_secret');

    // Lọc param vnp_
    $inputData = [];
    foreach ($request->all() as $key => $value) {
        if (substr($key, 0, 4) === 'vnp_') {
            $inputData[$key] = $value;
        }
    }

    $vnp_SecureHash = $inputData['vnp_SecureHash'] ?? null;
    if (!$vnp_SecureHash) {
        return response()->json(['RspCode' => '97', 'Message' => 'Missing signature']);
    }

    unset($inputData['vnp_SecureHash'], $inputData['vnp_SecureHashType']);

    ksort($inputData);

    $hashData = '';
    $i        = 0;
    foreach ($inputData as $key => $value) {
        if ($i == 1) {
            $hashData .= '&';
        }
        $hashData .= urlencode($key) . '=' . urlencode($value);
        $i = 1;
    }

    $checkHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

    if ($checkHash !== $vnp_SecureHash) {
        \Log::warning('VNPAY_IPN_INVALID_HASH', [
            'hashData'   => $hashData,
            'local_hash' => $checkHash,
            'remote'     => $vnp_SecureHash,
            'params'     => $inputData,
        ]);

        return response()->json(['RspCode' => '97', 'Message' => 'Invalid signature']);
    }

    $orderId      = $inputData['vnp_TxnRef'] ?? null;
    $responseCode = $inputData['vnp_ResponseCode'] ?? null;

    if (!$orderId) {
        return response()->json(['RspCode' => '01', 'Message' => 'Order not found']);
    }

    $order = Order::find($orderId);
    if (!$order) {
        return response()->json(['RspCode' => '01', 'Message' => 'Order not found']);
    }

    // Nếu đơn đã hoàn thành rồi thì trả OK luôn để VNPay khỏi gọi lại
    if ($order->status === 'completed') {
        return response()->json(['RspCode' => '00', 'Message' => 'Order already confirmed']);
    }

    if ($responseCode === '00') {
        // Thanh toán thành công
        $order->status = 'completed';
        // $order->paid_amount = $inputData['vnp_Amount'] / 100 ?? ...; // nếu m muốn lưu số tiền
    } else {
        // Thanh toán thất bại hoặc bị hủy
        $order->status          = 'cancelled';
        $order->shipping_status = 'cancelled';
    }

    $order->save();

    // BẮT BUỘC: VNPay yêu cầu trả JSON có RspCode
    return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
}




    // URL VNPay redirect về sau khi thanh toán
    public function return(Request $request)
    {
        $vnp_HashSecret = config('vnpay.hash_secret');

        // Lọc param vnp_
        $inputData = [];
        foreach ($request->all() as $key => $value) {
            if (substr($key, 0, 4) === 'vnp_') {
                $inputData[$key] = $value;
            }
        }

        $vnp_SecureHash = $inputData['vnp_SecureHash'] ?? null;
        if (!$vnp_SecureHash) {
            return 'Thiếu tham số chữ ký';
        }

        unset($inputData['vnp_SecureHash'], $inputData['vnp_SecureHashType']);

        ksort($inputData);

        // Ở đây cũng hash trên CHUỖI ĐÃ urlencode, y như bên VNPay làm
        $hashData = '';
        $i        = 0;
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData .= '&';
            }
            $hashData .= urlencode($key) . '=' . urlencode($value);
            $i = 1;
        }

        $checkHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        if ($checkHash !== $vnp_SecureHash) {
            \Log::warning('VNPAY_RETURN_INVALID_HASH', [
                'hashData'   => $hashData,
                'local_hash' => $checkHash,
                'remote'     => $vnp_SecureHash,
                'params'     => $inputData,
            ]);

            return 'Chữ ký không hợp lệ';
        }

        $orderId      = $inputData['vnp_TxnRef'] ?? null;
        $responseCode = $inputData['vnp_ResponseCode'] ?? null;

        if ($orderId) {
            $order = Order::find($orderId);
            if ($order) {
                if ($responseCode === '00') {
                    // Thanh toán THÀNH CÔNG
                    $order->status = 'completed';
                    // shipping_status vẫn để 'pending' (chờ admin giao)
                } else {
                    // Thanh toán THẤT BẠI / HỦY
                    $order->status          = 'cancelled';
                    $order->shipping_status = 'cancelled'; // hủy giao luôn
                }

                $order->save();
            }
        }


        return 'Thanh toán VNPay: ' . ($responseCode === '00' ? 'THÀNH CÔNG' : 'THẤT BẠI');
    }
}
