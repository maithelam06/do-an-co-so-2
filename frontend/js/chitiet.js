const API_BASE_URL = "http://localhost:8000/api"; // chỉnh theo backend

// Lấy productId từ URL
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
  alert("Không tìm thấy sản phẩm.");
  window.location.href = "index.html";
}

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
    document.getElementById("product-name").textContent = "Không thể tải sản phẩm";
  }
}


// Render dữ liệu sản phẩm
function renderProductDetail(product) {
  document.getElementById("product-name").textContent = product.name;
  document.getElementById("product-main-image").src = product.image
    ? `${API_BASE_URL.replace("/api","")}/storage/${product.image}`
    : "https://via.placeholder.com/400";

  document.getElementById("product-price").textContent = product.price.toLocaleString() + "₫";
  document.getElementById("product-description").textContent = product.description || "Không có mô tả.";

  // Breadcrumb
  document.getElementById("breadcrumb-product").textContent = product.name;
  document.getElementById("breadcrumb-category").textContent = product.category || "Danh mục";
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
  const token = localStorage.getItem('token');
  if (!token) {
    alert('⚠️ Vui lòng đăng nhập trước khi thêm vào giỏ hàng!');
    window.location.href = '/frontend/index.html';
    return;
  }

  const quantity = parseInt(document.getElementById('quantity').value);
  if (quantity < 1) {
    alert('Số lượng phải lớn hơn 0!');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/cart/add/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ quantity })
    });

    const data = await res.json();

    if (res.ok) {
      alert('✅ Đã thêm vào giỏ hàng!');
      updateCartCount();
    } else {
      alert('⚠️ ' + (data.message || 'Không thể thêm sản phẩm.'));
    }
  } catch (error) {
    console.error('❌ Lỗi khi thêm giỏ hàng:', error);
    alert('Không thể kết nối đến máy chủ.');
  }
}




function buyNow() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("Vui lòng đăng nhập!");
    window.location.href = "/frontend/index.html";
    return;
  }

  const quantity = parseInt(document.getElementById("quantity").value);
  if (quantity < 1) {
    alert("Số lượng không hợp lệ!");
    return;
  }

  const buyNowItem = {
    id: currentProduct.id,
    name: currentProduct.name,
    price: currentProduct.price,
    image: currentProduct.image,
    quantity: quantity
  };

  // Lưu vào checkoutItems để checkout.js có thể render
  localStorage.setItem("checkoutItems", JSON.stringify([buyNowItem]));

  // Chuyển đến trang thanh toán
  window.location.href = "/frontend/thanhtoan.html";
}



document.addEventListener("DOMContentLoaded", () => {
  loadProductDetail();
});
