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
  const container = document.getElementById('products-container');
  if (!container) return;

  container.innerHTML = '';

  if (!products.length) {
    container.innerHTML = `<p class="text-center mt-4 text-muted">Không có sản phẩm nào để hiển thị.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="row g-3">
      ${products.map(p => `
        <div class="col-md-3 col-sm-6">
          <div class="card h-100 shadow-sm product-card">
            <img src="http://localhost:8000/storage/${p.image}" 
                 class="card-img-top" alt="${p.name}" 
                 style="height:180px;object-fit:cover;">
            <div class="card-body text-center">
              <h6 class="card-title text-truncate">${p.name}</h6>
              <p class="text-danger fw-bold mb-1">${Number(p.price).toLocaleString()}₫</p>
              <p class="text-muted small">${p.description ?? "Không có mô tả"}</p>
              <button class="btn btn-primary btn-sm w-100" onclick="addToCart(${p.id}, event)">
                <i class="fas fa-cart-plus me-2"></i>Mua ngay
              </button>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
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
function addToCart(id, event) {
  event.stopPropagation();
  let countEl = document.getElementById('cart-count');
  if (!countEl) return;
  let count = parseInt(countEl.textContent || '0');
  countEl.textContent = count + 1;
  alert(`🛒 Đã thêm sản phẩm ID ${id} vào giỏ hàng!`);
}

function updateCartCount() {
  fetch(`${API_BASE_URL}/cart/count`, {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  })
    .then(res => res.json())
    .then(data => {
      const el = document.getElementById('cart-count');
      if (el) el.textContent = data.count || 0;
    })
    .catch(() => {});
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
