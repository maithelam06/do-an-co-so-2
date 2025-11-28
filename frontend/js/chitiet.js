const API_BASE_URL = "http://localhost:8000/api"; // chỉnh theo backend

// Lấy productId từ URL
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

document.addEventListener("DOMContentLoaded", async () => {
  if (!productId) {
    await Swal.fire({
      icon: "error",
      title: "Không tìm thấy sản phẩm",
      text: "Sản phẩm bạn đang tìm không tồn tại.",
      confirmButtonText: "Quay lại trang chủ",
    });
    window.location.href = "/frontend/trangchu.html";
    return;
  }

  await loadProductDetail(productId);
});

let currentProduct = null;

// Load chi tiết sản phẩm
async function loadProductDetail() {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`);
    if (!res.ok) throw new Error("Không tìm thấy sản phẩm.");
    const product = await res.json();
    currentProduct = product;
    renderProductDetail(product);
  } catch (error) {
    console.error(error);
    document.getElementById("product-name").textContent =
      "Không thể tải sản phẩm";
  }
}

// Render dữ liệu sản phẩm
function renderProductDetail(product) {
  document.getElementById("product-name").textContent = product.name;
  document.getElementById("product-main-image").src = product.image
    ? `${API_BASE_URL.replace("/api", "")}/storage/${product.image}`
    : "/frontend/img/box.png";

  document.getElementById("product-price").textContent =
    product.price.toLocaleString() + "₫";
  document.getElementById("product-description").textContent =
    product.description || "Không có mô tả.";
  document.getElementById("product-specs").textContent =
    product.specs || "Không có thông tin chi tiết.";

  // Hiển thị số lượng đã bán
  document.getElementById("product-sold-count").textContent =
    product.sold_count || 0;

  // Breadcrumb
  document.getElementById("breadcrumb-product").textContent = product.name;
  document.getElementById("breadcrumb-category").textContent =
    product.category?.name || "Danh mục";
}

// Số lượng

function decreaseQuantity() {
  const qtyInput = document.getElementById("quantity");
  if (qtyInput.value > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
}

function increaseQuantity() {
  const qtyInput = document.getElementById("quantity");
  if (qtyInput.value < 99) qtyInput.value = parseInt(qtyInput.value) + 1;
}

// Thêm sản phẩm vào giỏ hàng
async function addToCart() {
  const token = localStorage.getItem("token");
  if (!token) {
    await Swal.fire({
      icon: "error",
      title: "Bạn chưa đăng nhập!",
      text: "Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng.",
      confirmButtonText: "Đăng nhập!",
    });

    // Trang hiện tại
    const currentPage = window.location.pathname + window.location.search;

    if (!token) {
      // Chuyển đến login, kèm query param redirect
      window.location.href = `/frontend/index.html?redirect=${encodeURIComponent(
        currentPage
      )}`;
      return;
    }
    window.location.href = "/frontend/index.html";
    return;
  }

  const quantity = parseInt(document.getElementById("quantity").value);
  if (quantity < 1) {
    await Swal.fire({
      icon: "error",
      title: "Số lượng không hợp lệ!",
      text: "Vui lòng chọn số lượng hợp lệ!",
      confirmButtonText: "Đóng",
    });
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/cart/add/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ quantity }),
    });

    const data = await res.json();

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Thêm sản phẩm vào giỏ hàng thành công!",
        confirmButtonText: "Đóng",
      });
      updateCartCount();
    } else {
      await Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: (data.message || "Không thể thêm sản phẩm."),
        confirmButtonText: "Đóng"
      });
    }
  } catch (error) {
    console.error("Lỗi khi thêm giỏ hàng:", error);
    await Swal.fire({
      icon: "error",
      title: "Lỗi hệ thống",
      text: "Không thể kết nối đến máy chủ!",
      confirmButtonText: "Đóng",
    });
  }
}

async function buyNow() {
  const token = localStorage.getItem("token");
  if (!token) {
    await Swal.fire({
      icon: "error",
      title: "Bạn chưa đăng nhập!",
      text: "Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng.",
      confirmButtonText: "Đăng nhập!",
    });

    // Trang hiện tại
    const currentPage = window.location.pathname + window.location.search;

    if (!token) {
      // Chuyển đến login, kèm query param redirect
      window.location.href = `/frontend/index.html?redirect=${encodeURIComponent(
        currentPage
      )}`;
      return;
    }
    return;
  }

  const quantity = parseInt(document.getElementById("quantity").value);
  if (quantity < 1) {
    await Swal.fire({
      icon: "error",
      title: "Số lượng không hợp lệ!",
      text: "Vui lòng chọn số lượng hợp lệ!",
      confirmButtonText: "Đóng",
    });
    return;
  }

  const buyNowItem = {
    id: currentProduct.id,
    name: currentProduct.name,
    price: currentProduct.price,
    image: currentProduct.image,
    quantity: quantity,
  };

  // Lưu vào checkoutItems để checkout.js có thể render
  localStorage.setItem("checkoutItems", JSON.stringify([buyNowItem]));

  // Chuyển đến trang thanh toán
  window.location.href = "/frontend/thanhtoan.html";
}
