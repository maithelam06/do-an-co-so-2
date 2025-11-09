let currentProductId = null;

function showAddToCart(id) {
  currentProductId = id;
  document.getElementById('addToCartModal').classList.remove('d-none');
}

function closeAddToCart() {
  document.getElementById('addToCartModal').classList.add('d-none');
}

function confirmAddToCart() {
  const qty = parseInt(document.getElementById('quantityInput').value);
  if (isNaN(qty) || qty <= 0) return alert("Số lượng không hợp lệ!");

  // Thêm sản phẩm vào giỏ hàng
  addToCart(currentProductId, qty);
  closeAddToCart();
}

function addToCart(productId, quantity) {
  // Giả sử bạn lưu giỏ hàng trong localStorage
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Kiểm tra xem sản phẩm đã có trong giỏ chưa
  let item = cart.find(p => p.id === productId);
  if (item) {
    item.quantity += quantity;
  } else {
    cart.push({ id: productId, quantity });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();

  alert(`🛒 Đã thêm ${quantity} sản phẩm vào giỏ!`);
}

function updateCartCount() {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  const countEl = document.getElementById("cart-count");
  if (countEl) countEl.textContent = total;
}
