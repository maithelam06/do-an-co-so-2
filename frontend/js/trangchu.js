// CẤU HÌNH API
const API_BASE_URL = 'http://localhost:8000/api';


// ===============================
// 🔥 CHECK TÀI KHOẢN BỊ KHÓA 🔥
// ===============================
async function checkUserLocked() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  // Nếu chưa đăng nhập thì không cần check
  if (!token || !user) return;

  try {
    // Gọi API cần token (cart) để kiểm tra token còn hợp lệ không
    const res = await fetch(`${API_BASE_URL}/cart`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
      }
    });

    // Nếu BE trả 401/403 → token bị revoke (do admin khóa user)
    if (res.status === 401 || res.status === 403) {
      await Swal.fire({
        icon: "error",
        title: "Tài khoản bị khóa!",
        text: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị vi��n.",
        confirmButtonText: "Đăng nhập lại"
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/frontend/login.html";
      return;
    }

  } catch (error) {
    console.error("Lỗi kiểm tra tài khoản bị khóa:", error);
  }
}




// ===============================
// LOAD DANH MỤC
// ===============================
async function loadCategories() {
  try {
    const res = await fetch('http://localhost:8000/api/categories', {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Không thể tải danh mục');
    const categories = await res.json();
    renderCategories(categories);
  } catch (e) {
    console.error('Lỗi load danh mục:', e);
    // Fallback: load demo categories nếu API lỗi
    loadDemoCategories();
  }
}

// Render categories vào sidebar
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
      <div class="category-item" onclick="filterByCategory('${cat.name}', event)">
        <i class="fas fa-tag"></i> ${cat.name}
      </div>
    `;
  });
}



// ===============================
// LOAD PRODUCTS
// ===============================
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
    // Lấy số lượng đã bán từ sold_count, mặc định 0 nếu không có
    const soldCount = p.sold_count || 0;
    
    container.innerHTML += `
      <div class="col-12 col-md-6 col-lg-5-per-row">
        <div class="card product-card h-100 shadow-sm" onclick="viewProductDetail(${p.id})" style="cursor: pointer;">
          <div class="product-img-wrapper">
            <img src="${p.image ? 'http://localhost:8000/storage/' + p.image : 'https://via.placeholder.com/300'}" alt="${p.name}" class="card-img-top">
            ${p.discount ? `<span class="badge bg-danger position-absolute top-0 end-0 m-2">-${p.discount}%</span>` : ''}
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="product-title">${p.name}</h5>
            <p class="product-price text-danger fw-bold mb-1">${Number(p.price).toLocaleString()}₫</p>
            ${p.oldPrice ? `<p class="text-decoration-line-through text-muted small mb-2">${Number(p.oldPrice).toLocaleString()}₫</p>` : ''}
            <div class="mt-auto pt-2">
              <span class="badge bg-info text-white">
                <i class="fas fa-shopping-bag me-1"></i>Đã bán: ${soldCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}


// ===============================
// XEM CHI TIẾT SẢN PHẨM
// ===============================
function viewProductDetail(productId) {
  localStorage.setItem('selectedProductId', productId);
  window.location.href = `chitiet.html?id=${productId}`;
}


// ===============================
// TÌM KIẾM SẢN PHẨM
// ===============================
function filterProducts(keyword) {
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(keyword)
  );
  renderProducts(filtered);
}


// ===============================
// LỌC THEO DANH MỤC
// ===============================
function filterByCategory(category, event) {
  document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
  event.target.closest('.category-item').classList.add('active');
  loadProducts(category);
}


// ===============================
// LOGIN & LOGOUT
// ===============================
function showLogin(event) {
  event.preventDefault();
  window.location.href = "/frontend/index.html";
}




// ===============================
// SEARCH EVENT
// ===============================
document.getElementById('searchInput')?.addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  filterProducts(term);
});


// ===============================
// DOM READY
// ===============================
document.addEventListener('DOMContentLoaded', async () => {

  // 🔥 CHECK TÀI KHOẢN BỊ KHÓA
  await checkUserLocked();

  loadCategories();
  loadProducts();
});
