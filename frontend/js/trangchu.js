
// CẤU HÌNH API

const API_BASE_URL = 'http://localhost:8000/api';


// LOAD DANH MỤC

async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    const categories = await response.json();

    renderCategories(categories);
  } catch (error) {
    console.warn('Lỗi khi load categories, dùng demo:', error);
    loadDemoCategories();
  }
}

// Render categories từ API hoặc fallback demo
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

// Categories mẫu khi API lỗi
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


// LOAD PRODUCTS

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
    console.error('Lỗi khi load sản phẩm:', error);
    document.getElementById('products-container').innerHTML =
      `<p class="text-center text-danger mt-4">Không thể tải sản phẩm.</p>`;
  }
}


// RENDER PRODUCTS (CLICK CARD = XEM CHI TIẾT)

function renderProducts(products) {
  const container = document.getElementById("products-container");
  if (!container) return;
  
  container.className = "row g-3";
  container.innerHTML = "";
  
  if (products.length === 0) {
    container.innerHTML = '<p class="text-center text-muted mt-4">Không có sản phẩm nào.</p>';
    return;
  }
  
  products.forEach(p => {
    container.innerHTML += `
      <div class="col-12 col-md-6 col-lg-3">
        <div class="card product-card h-100 shadow-sm" onclick="viewProductDetail(${p.id})" style="cursor: pointer;">
          <div class="product-img-wrapper">
            <img src="${p.image}" alt="${p.name}" class="card-img-top">
            ${p.discount ? `<span class="badge bg-danger position-absolute top-0 end-0 m-2">-${p.discount}%</span>` : ''}
          </div>
          <div class="card-body">
            <h5 class="product-title">${p.name}</h5>
            <p class="product-price text-danger fw-bold mb-1">${p.price.toLocaleString()}₫</p>
            ${p.oldPrice ? `<p class="text-decoration-line-through text-muted small mb-2">${p.oldPrice.toLocaleString()}₫</p>` : ''}
          </div>
        </div>
      </div>
    `;
  });
}


// XEM CHI TIẾT SẢN PHẨM

function viewProductDetail(productId) {
  // Lưu productId vào localStorage
  localStorage.setItem('selectedProductId', productId);
  
  // Chuyển hướng đến trang chi tiết
  window.location.href = `chitiet.html?id=${productId}`;
}




// TÌM KIẾM SẢN PHẨM

function filterProducts(keyword) {
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(keyword)
  );
  renderProducts(filtered);
}


// LỌC THEO DANH MỤC

function filterByCategory(category, event) {
  document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
  event.target.closest('.category-item').classList.add('active');
  loadProducts(category);
}



function showLogin(event) {
  event.preventDefault(); // tránh reload
  window.location.href = "/frontend/index.html";
}




// SEARCH EVENT

document.getElementById('searchInput')?.addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  filterProducts(term);
});


document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadProducts();
  
});
