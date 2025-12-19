const params = new URLSearchParams(window.location.search);
const status = params.get("status"); // success | failed
const order  = params.get("order");

const el = document.getElementById("result");

if (status === "success") {
    el.innerHTML = `
        <div class="icon text-success mb-3">✔</div>
        <h3 class="text-success mb-3">Thanh toán thành công</h3>
        <p>Đơn hàng <b>#${order}</b> đã được thanh toán.</p>
    `;
} else {
    el.innerHTML = `
        <div class="icon text-danger mb-3">✖</div>
        <h3 class="text-danger mb-3">Thanh toán thất bại</h3>
        <p>Giao dịch không thành công hoặc đã bị huỷ.</p>
    `;
}

/* Auto redirect */
let seconds = 5;
const countdown = document.getElementById("countdown");

const timer = setInterval(() => {
    countdown.innerText = `Tự động quay về sau ${seconds}s`;
    seconds--;
    if (seconds < 0) {
        clearInterval(timer);
        window.location.href = "trangchu.html";
    }
}, 1000);
