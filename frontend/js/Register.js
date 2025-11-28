
const formCreate = document.getElementById("CreateUserForm");
const alertBox = document.getElementById("alertBox");


formCreate.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Lấy dữ liệu người dùng nhập
    const userData = {
        name: document.getElementById("Name").value.trim(),
        email: document.getElementById("Email").value.trim(),
        password: document.getElementById("Password").value.trim(),
    };

    if (!userData.name || !userData.email || !userData.password) {
        await Swal.fire({
            icon: 'warning',
            title: 'Thiếu thông tin',
            text: 'Vui lòng nhập đầy đủ thông tin!',
            confirmButtonText: 'Đóng'
        });
        return;
    }

    try {

        const response = await fetch("http://localhost:8000/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(userData),
        });


        const result = await response.json();

        if (response.ok) {
            alertBox.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    ${result.message || "Đăng ký thành công!"}
                </div>
            `;
            formCreate.reset();
        } else {
            alertBox.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    ${result.message || "Đăng ký thất bại!"}
                </div>
            `;
        }

    } catch (error) {
        alertBox.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                Không thể kết nối tới server!
            </div>
        `;
        console.error(error);
    }

});