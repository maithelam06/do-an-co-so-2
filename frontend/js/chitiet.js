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
    await loadProductReviews();
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
  document.getElementById("product-description").innerHTML  =
    (product.description || "Không có mô tả.").replace(/\n/g, "<br>");
  document.getElementById("product-specs").innerHTML  =
    (product.specs || "Không có thông tin chi tiết.").replace(/\n/g, "<br>");

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

async function loadProductReviews() {
  try {
    const res = await fetch(`${API_BASE_URL}/reviews/product/${productId}`);
    if (res.ok) {
      productReviews = await res.json();
      renderReviews();
      renderRating();
    }
  } catch (error) {
    console.error("Lỗi khi tải đánh giá:", error);
  }
}


// Render danh sách đánh giá
// Chỉ render từng đánh giá, không tính trung bình
function renderReviews() {
  const reviewContainer = document.getElementById("reviews-container");
  
  if (productReviews.length === 0) {
    reviewContainer.innerHTML = '<div class="alert alert-info text-center">Chưa có đánh giá nào</div>';
    return;
  }

  reviewContainer.innerHTML = productReviews.map(review => `
    <div class="review-card">
      <div class="review-header">
        <div class="reviewer-info">
          <div class="reviewer-avatar">
            ${review.user?.avatar ? `<img src="${API_BASE_URL.replace('/api', '')}/storage/${review.user.avatar}" alt="${review.user.name}">` : '<i class="fas fa-user-circle"></i>'}
          </div>
          <div class="reviewer-details">
            <div class="reviewer-name fw-bold">${review.user?.name || "Người dùng ẩn danh"}</div>
            <div class="review-date text-muted small">${new Date(review.created_at).toLocaleDateString('vi-VN', {year: 'numeric', month: 'long', day: 'numeric'})}</div>
          </div>
        </div>
      </div>
      <div class="review-rating mb-2">
        ${generateStars(review.rating)}
      </div>
      <div class="review-comment">
        ${review.comment}
      </div>
    </div>
  `).join('');
}


// Hàm tạo HTML sao
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let starsHTML = '';

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsHTML += '<i class="fas fa-star"></i>';
    } else if (i === fullStars && hasHalfStar) {
      starsHTML += '<i class="fas fa-star-half-alt"></i>';
    } else {
      starsHTML += '<i class="far fa-star"></i>';
    }
  }
  return starsHTML;
}


// Hàm hiển thị rating trung bình và số lượng đánh giá
function renderRating() {
  if (productReviews.length === 0) {
    document.getElementById("product-rating").innerHTML = '';
    document.getElementById("product-reviews").innerHTML = '';
    return;
  }

  // Tính trung bình sao
  const avgRating = (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1);
  const reviewCount = productReviews.length;

  // Render sao
  let starsHTML = '';
  for (let i = 0; i < 5; i++) {
    if (i < Math.floor(avgRating)) {
      starsHTML += '<i class="fas fa-star text-warning"></i>';
    } else if (i === Math.floor(avgRating) && avgRating % 1 >= 0.5) {
      starsHTML += '<i class="fas fa-star-half-alt text-warning"></i>';
    } else {
      starsHTML += '<i class="far fa-star text-warning"></i>';
    }
  }

  document.getElementById("product-rating").innerHTML = starsHTML + ` <span class="text-dark ms-1 fw-semibold">${avgRating}</span>`;
  document.getElementById("product-reviews").innerHTML = `(${reviewCount} đánh giá)`;
}