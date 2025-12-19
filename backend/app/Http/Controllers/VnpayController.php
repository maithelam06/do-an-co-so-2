<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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

        Log::info('VNPAY_CREATE_PAYMENT', [
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
        Log::info('VNPAY_IPN_HIT', $request->all());

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
            Log::warning('VNPAY_IPN_INVALID_HASH', [
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

            // LƯU THÊM THÔNG TIN GIAO DỊCH ĐỂ HOÀN TIỀN SAU NÀY
            $order->vnp_transaction_no = $inputData['vnp_TransactionNo'] ?? null;
            $order->vnp_amount         = isset($inputData['vnp_Amount'])
                ? $inputData['vnp_Amount'] / 100
                : null;
            $order->vnp_pay_date       = $inputData['vnp_PayDate'] ?? null;
        } else {
            // Thanh toán thất bại hoặc bị hủy
            $order->status          = 'cancelled';
            $order->shipping_status = 'cancelled';
        }

        $order->save();

        // BẮT BUỘC: VNPay yêu cầu trả JSON có RspCode
        return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
    }

    public function return(Request $request)
    {
        $vnp_HashSecret = config('vnpay.hash_secret');

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

        $hashData = '';
        $i = 0;
        foreach ($inputData as $key => $value) {
            if ($i == 1) $hashData .= '&';
            $hashData .= urlencode($key) . '=' . urlencode($value);
            $i = 1;
        }

        $checkHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        if ($checkHash !== $vnp_SecureHash) {
            return 'Chữ ký không hợp lệ';
        }

        $orderId      = $inputData['vnp_TxnRef'] ?? null;
        $responseCode = $inputData['vnp_ResponseCode'] ?? null;

        if ($orderId) {
            $order = Order::find($orderId);
            if ($order) {
                if ($responseCode === '00') {
                    $order->status = 'completed';
                } else {
                    $order->status = 'cancelled';
                    $order->shipping_status = 'cancelled';
                }
                $order->save();
            }
        }

        // ✅ REDIRECT VỀ FRONTEND
   return redirect()->away(
    'http://127.0.0.1:5500/frontend/payment-result.html'
    . '?status=' . ($responseCode === '00' ? 'success' : 'failed')
    . '&order=' . $orderId
);
    }

    public function refund(Request $request)
    {
        Log::info('VNPAY_REFUND_CALLED', $request->all());

        $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
        ]);

        $order = Order::findOrFail($request->order_id);

        if (!in_array($order->status, ['completed', 'refund_pending'])) {
            return response()->json([
                'step'    => 'check_status',
                'ok'      => false,
                'message' => 'Chỉ hoàn tiền cho đơn đã thanh toán thành công',
                'order_status' => $order->status,
            ], 400);
        }

        if (!$order->vnp_transaction_no || !$order->vnp_pay_date || !$order->vnp_amount) {
            return response()->json([
                'step'    => 'check_vnp_fields',
                'ok'      => false,
                'message' => 'Thiếu thông tin giao dịch VNPay, không thể hoàn tiền',
                'vnp_transaction_no' => $order->vnp_transaction_no,
                'vnp_amount'         => $order->vnp_amount,
                'vnp_pay_date'       => $order->vnp_pay_date,
            ], 400);
        }

        $vnp_TmnCode    = config('vnpay.tmn_code');
        $vnp_HashSecret = config('vnpay.hash_secret');
        $vnp_RefundUrl  = config('vnpay.refund_url');

        $vnp_Version          = '2.1.0';
        $vnp_Command          = 'refund';
        $vnp_RequestId        = time() . '';
        $vnp_TransactionType  = '02';
        $vnp_Amount           = $order->vnp_amount * 100;
        $vnp_OrderInfo        = 'Hoan tien don hang #' . $order->id;
        $vnp_TxnRef           = (string) $order->id;
        $vnp_TransactionNo    = $order->vnp_transaction_no;
        $vnp_TransactionDate  = $order->vnp_pay_date;
        $vnp_CreateBy         = optional($request->user())->email ?? 'system';
        $vnp_CreateDate       = now()->format('YmdHis');
        $vnp_IpAddr           = $request->ip() ?? '127.0.0.1';

        $inputData = [
            'vnp_RequestId'       => $vnp_RequestId,
            'vnp_Version'         => $vnp_Version,
            'vnp_Command'         => $vnp_Command,
            'vnp_TmnCode'         => $vnp_TmnCode,
            'vnp_TransactionType' => $vnp_TransactionType,
            'vnp_TxnRef'          => $vnp_TxnRef,
            'vnp_Amount'          => $vnp_Amount,
            'vnp_TransactionNo'   => $vnp_TransactionNo,
            'vnp_TransactionDate' => $vnp_TransactionDate,
            'vnp_CreateBy'        => $vnp_CreateBy,
            'vnp_CreateDate'      => $vnp_CreateDate,
            'vnp_IpAddr'          => $vnp_IpAddr,
            'vnp_OrderInfo'       => $vnp_OrderInfo,
        ];

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

        $vnp_SecureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        $inputData['vnp_SecureHash'] = $vnp_SecureHash;

        // Gửi sang VNPay
        $response = Http::asForm()->post($vnp_RefundUrl, $inputData);

        // Nếu lỗi HTTP
        if (!$response->ok()) {
            Log::error('VNPAY_REFUND_HTTP_ERROR', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            return response()->json([
                'step'    => 'http_call',
                'ok'      => false,
                'message' => 'Không gọi được API hoàn tiền VNPay',
                'http_status' => $response->status(),
                'body'        => $response->body(),
                'url'         => $vnp_RefundUrl,
                'request'     => $inputData,
            ], 500);
        }

        $body = $response->json();
        Log::info('VNPAY_REFUND_RESPONSE', $body ?? []);

        $code = $body['vnp_ResponseCode'] ?? null;

        if (!is_array($body) || $code !== '00') {
            return response()->json([
                'step'         => 'vnp_response',
                'ok'           => false,
                'message'      => 'Hoàn tiền thất bại',
                'vnp_code'     => $code,
                'vnp_response' => $body,
            ], 400);
        }

        $order->status          = 'refunded';
        $order->shipping_status = 'cancelled';
        $order->save();

        return response()->json([
            'step'         => 'done',
            'ok'           => true,
            'message'      => 'Hoàn tiền thành công',
            'vnp_response' => $body,
        ]);
    }
}
