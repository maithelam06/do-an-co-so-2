   function selectPayment(method) {
            const codWrapper = document.getElementById('paymentCod');
            const bankWrapper = document.getElementById('paymentBank');
            const bankOptions = document.getElementById('bankOptions');

            // bỏ trạng thái active cũ
            codWrapper.classList.remove('active');
            bankWrapper.classList.remove('active');

            if (method === 'cod') {
                document.getElementById('cod').checked = true;
                codWrapper.classList.add('active');

                // ẩn lựa chọn VNPAY/MoMo + bỏ tick
                bankOptions.classList.add('d-none');
                document.querySelectorAll('input[name="bankMethod"]').forEach(i => i.checked = false);
            } else if (method === 'bank') {
                document.getElementById('bank').checked = true;
                bankWrapper.classList.add('active');

                // hiện lựa chọn VNPAY/MoMo
                bankOptions.classList.remove('d-none');
            }
        }