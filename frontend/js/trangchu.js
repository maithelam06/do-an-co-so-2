// ===========================================
// ⚙️ CẤU HÌNH API
// ===========================================
const API_BASE_URL = 'http://localhost:8000/api'; // Laravel API

// ===========================================
// 🔖 LOAD DANH MỤC
// ===========================================
async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    const categories = await response.json();

    renderCategories(categories);
  } catch (error) {
    console.warn('⚠️ Lỗi khi load categories, dùng demo:', error);
    loadDemoCategories();
  }
}

// ✅ Render categories từ API hoặc fallback demo
function renderCategories(categories) {
  const list = document.getElementById('categories-list');
  if (!list) return;

  list.innerHTML = `
    <div class="category-item active" onclick="filterByCategory('all', event)">
      <i class="fas fa-th"></i> Tất cả
    </div>
  `;

  categories.forEach(cat => {
    list.innerHTML += `
      <div class="category-item" onclick="filterByCategory('${cat.slug}', event)">
        <i class="${cat.icon || 'fas fa-tag'}"></i> ${cat.name}
      </div>
    `;
  });
}

// ⚙️ Categories mẫu khi API lỗi
function loadDemoCategories() {
  const demoCategories = [
    { name: 'Tất cả', icon: 'fas fa-th', slug: 'all' },
    { name: 'Laptop', icon: 'fas fa-laptop', slug: 'Laptop' },
    { name: 'Điện thoại', icon: 'fas fa-mobile-alt', slug: 'Điện thoại' },
    { name: 'Tablet', icon: 'fas fa-tablet-alt', slug: 'Tablet' },
    { name: 'Tai nghe', icon: 'fas fa-headphones', slug: 'Tai nghe' },
    { name: 'Đồng hồ', icon: 'fas fa-clock', slug: 'Đồng hồ' },
    { name: 'Camera', icon: 'fas fa-camera', slug: 'Camera' },
    { name: 'Phụ kiện', icon: 'fas fa-plug', slug: 'Phụ kiện' }
  ];
  renderCategories(demoCategories);
}

// ===========================================
// 🧱 LOAD PRODUCTS
// ===========================================
let allProducts = [];
let currentCategory = 'all';

async function loadProducts(category = 'all') {
  try {
    currentCategory = category;
    const url = category === 'all'
      ? `${API_BASE_URL}/products/active`
      : `${API_BASE_URL}/products?category=${encodeURIComponent(category)}`;

    const res = await fetch(url);
    const products = await res.json();
    allProducts = products;

    renderProducts(products);
  } catch (error) {
    console.error('❌ Lỗi khi load sản phẩm:', error);
    document.getElementById('products-container').innerHTML =
      `<p class="text-center text-danger mt-4">Không thể tải sản phẩm.</p>`;
  }
}

// ===========================================
// 🎨 RENDER PRODUCTS
// ===========================================
function renderProducts(products) {
  const container = document.getElementById("products-container");
  if (!container) return;
  
  container.className = "row g-3";
  container.innerHTML = "";
  
  products.forEach(p => {
    container.innerHTML += `
      <div class="col-12 col-md-6 col-lg-2">
        <div class="card product-card h-100 shadow-sm">
          <div class="product-img-wrapper">
            <img src="${p.image}" alt="${p.name}" class="card-img-top">
          </div>
          <div class="card-body">
            <h5 class="product-title">${p.name}</h5>
            <p class="product-price text-danger fw-bold">${p.price.toLocaleString()}₫</p>
            <button class="btn btn-outline-primary w-100 mb-2" onclick="showAddToCart(${p.id})">
              <i class="fas fa-cart-plus me-1"></i>Thêm vào giỏ
            </button>
            <button class="btn btn-primary w-100" onclick="buyNow(${p.id})">
              <i class="fas fa-bolt me-1"></i>Mua ngay
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

function buyNow(productId) {
  // Giả sử ta lưu sản phẩm cần mua ngay vào localStorage để truyền qua trang thanh toán
  localStorage.setItem("buyNowProduct", JSON.stringify({ id: productId, quantity: 1 }));
  window.location.href = "checkout.html";
}


// ===========================================
// 🔍 TÌM KIẾM SẢN PHẨM
// ===========================================
function filterProducts(keyword) {
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(keyword)
  );
  renderProducts(filtered);
}

// ===========================================
// 🧭 LỌC THEO DANH MỤC
// ===========================================
function filterByCategory(category, event) {
  document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
  event.target.closest('.category-item').classList.add('active');
  loadProducts(category);
}

// ===========================================
// 🛒 GIỎ HÀNG
// ===========================================
let selectedProductId = null;

// Hiện overlay chọn số lượng
function showAddToCart(productId) {
  selectedProductId = productId;
  document.getElementById('quantityInput').value = 1;
  document.getElementById('addToCartModal').classList.remove('d-none');
}

// Đóng overlay
function closeAddToCart() {
  document.getElementById('addToCartModal').classList.add('d-none');
}

// Xác nhận thêm vào giỏ hàng
async function confirmAddToCart() {
  const token = localStorage.getItem('token');
  const quantity = parseInt(document.getElementById('quantityInput').value);

  if (!token) {
    alert('⚠️ Vui lòng đăng nhập trước khi thêm vào giỏ hàng!');
    window.location.href = '/frontend/login.html';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/cart/add/${selectedProductId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ quantity })
    });

    const data = await response.json();

    if (response.ok) {
      alert('✅ Đã thêm vào giỏ hàng!');
      await updateCartCount();
      closeAddToCart();
    } else {
      alert('⚠️ ' + (data.message || 'Không thể thêm sản phẩm.'));
    }
  } catch (error) {
    console.error('❌ Lỗi khi thêm giỏ hàng:', error);
    alert('Không thể kết nối đến máy chủ.');
  }
}

// Cập nhật số lượng hiển thị ở icon giỏ hàng
async function updateCartCount() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/cart/count`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    const el = document.getElementById('cart-count');
    if (el) el.textContent = data.count || 0;
  } catch (error) {
    console.warn('Không thể cập nhật số lượng giỏ hàng:', error);
  }
}

// ===========================================
// 👤 AUTH UI
// ===========================================
function updateAuthUI() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const nameEl = document.getElementById('user-name');
  const avatarEl = document.getElementById('user-avatar');

  if (token && user) {
    nameEl.textContent = user.name || 'Người dùng';
    if (avatarEl)
      avatarEl.src = user.avatar
        ? `${user.avatar.startsWith('http') ? user.avatar : 'http://localhost:8000/storage/' + user.avatar}`
        : 'https://via.placeholder.com/30';

    document.querySelectorAll('.not-logged-in').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('.logged-in').forEach(el => el.classList.remove('d-none'));
  } else {
    nameEl.textContent = 'Tài khoản';
    if (avatarEl) avatarEl.src = 'https://via.placeholder.com/30';
    document.querySelectorAll('.not-logged-in').forEach(el => el.classList.remove('d-none'));
    document.querySelectorAll('.logged-in').forEach(el => el.classList.add('d-none'));
  }
}

async function logout(event) {
  event.preventDefault();
  if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
  } catch {}
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthUI();
  window.location.href = '/frontend/index.html';
}

// ===========================================
// 🔍 SEARCH EVENT
// ===========================================
document.getElementById('searchInput')?.addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  filterProducts(term);
});

// ===========================================
// 🚀 KHỞI TẠO
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadProducts();
  updateAuthUI();
  updateCartCount();
});
