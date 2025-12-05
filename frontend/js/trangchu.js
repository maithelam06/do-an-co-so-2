const API_BASE_URL = "http://localhost:8000/api";

async function checkUserLocked() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) return;

  try {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (res.status === 401 || res.status === 403) {
      await Swal.fire({
        icon: "error",
        title: "Tài khoản bị khóa!",
        text: "Vui lòng liên hệ quản trị viên.",
        confirmButtonText: "Đăng nhập lại",
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/frontend/login.html";
    }
  } catch (err) {
    console.error(err);
  }
}


async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    const categories = await res.json();
    renderCategories(categories);
  } catch (e) {
    console.error("Lỗi load danh mục:", e);
  }
}

function renderCategories(categories) {
  const list = document.getElementById("categories-list");
  if (!list) return;

  list.innerHTML = `
    <div class="category-item active" onclick="filterByCategory('all', event)">
      <i class="fas fa-th"></i> Tất cả
    </div>
  `;

  categories.forEach((cat) => {
    list.innerHTML += `
      <div class="category-item" onclick="filterByCategory('${cat.name}', event)">
        <i class="fas fa-tag"></i> ${cat.name}
      </div>
    `;
  });
}

let sortType = "newest";

function sortByType(type) {
  sortType = type;
  currentPage = 1;
  updateActiveSortBtn();
  applyFilters();
}

function updateActiveSortBtn() {
  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(`[data-sort="${sortType}"]`);
  if (activeBtn) activeBtn.classList.add("active");
}

function applySorting(list) {
  const sorted = [...list];

  switch (sortType) {
    case "newest":
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;

    case "bestseller":
      sorted.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
      break;

    case "price-low":
      sorted.sort((a, b) => a.price - b.price);
      break;

    case "price-high":
      sorted.sort((a, b) => b.price - a.price);
      break;
  }

  return sorted;
}

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 40;

function renderPagination() {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const pag = document.getElementById("pagination");

  if (!pag) return;
  pag.innerHTML = "";

  if (totalPages <= 1) return;

  if (currentPage > 1) {
    pag.innerHTML += `<li class="page-item"><a class="page-link" href="#" onclick="goPage(${currentPage - 1})">&laquo;</a></li>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    pag.innerHTML += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
        <a class="page-link" href="#" onclick="goPage(${i})">${i}</a>
      </li>`;
  }

  if (currentPage < totalPages) {
    pag.innerHTML += `<li class="page-item"><a class="page-link" href="#" onclick="goPage(${currentPage + 1})">&raquo;</a></li>`;
  }
}

function goPage(page) {
  currentPage = page;
  renderProductsPaginated();
}

function renderProductsPaginated() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  const pageProducts = filteredProducts.slice(start, end);
  renderProducts(pageProducts);
  renderPagination();
}

function applyFilters() {
  filteredProducts = [...allProducts];

  // search
  const keyword = document.getElementById("searchInput")?.value.toLowerCase() || "";
  if (keyword) {
    filteredProducts = filteredProducts.filter((p) =>
      p.name.toLowerCase().includes(keyword)
    );
  }

  filteredProducts = applySorting(filteredProducts);
  currentPage = 1;
  renderProductsPaginated();
}


// ===============================
// LOAD PRODUCTS
// ===============================
let currentCategory = "all";

async function loadProducts(category = "all") {
  try {
    currentCategory = category;

    const url =
      category === "all"
        ? `${API_BASE_URL}/products/active`
        : `${API_BASE_URL}/products?category=${encodeURIComponent(category)}`;

    const res = await fetch(url);
    allProducts = await res.json();

    applyFilters();
  } catch (err) {
    console.error("Lỗi khi load sản phẩm:", err);
  }
}


function renderProducts(products) {
  const container = document.getElementById("products-container");
  if (!container) return;

  container.className = "row g-3";
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = `<p class="text-center text-muted mt-4">Không có sản phẩm nào.</p>`;
    return;
  }

  products.forEach((p) => {
    const soldCount = p.sold_count || 0;

    container.innerHTML += `
      <div class="col-12 col-md-6 col-lg-5-per-row">
        <div class="card product-card h-100 shadow-sm" onclick="viewProductDetail(${p.id})" style="cursor:pointer;">
          <div class="product-img-wrapper">
            <img src="${p.image ? `http://localhost:8000/storage/${p.image}` : "/frontend/img/box.png"}"
                alt="${p.name}" class="${p.image ? "" : "p-2"} card-img-top">

            ${p.discount ? `<span class="badge bg-danger position-absolute top-0 end-0 m-2">-${p.discount}%</span>` : ""}
          </div>

          <div class="card-body d-flex flex-column">
            <h5 class="product-title">${p.name}</h5>
            <p class="product-price text-danger fw-bold mb-1">${Number(p.price).toLocaleString()}₫</p>

            <div class="mt-auto pt-2">
              <span class="badge bg-info text-white">
                <i class="fas fa-shopping-bag me-1"></i>Đã bán: ${soldCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>`;
  });
}

// ===============================
// XEM CHI TIẾT SẢN PHẨM
// ===============================
function viewProductDetail(productId) {
  localStorage.setItem("selectedProductId", productId);
  window.location.href = `chitiet.html?id=${productId}`;
}


// ===============================
// LỌC THEO DANH MỤC
// ===============================
function filterByCategory(category, event) {
  document.querySelectorAll(".category-item").forEach((item) =>
    item.classList.remove("active")
  );

  event.target.closest(".category-item").classList.add("active");

  loadProducts(category);
}

// ===============================
// SEARCH EVENT
// ===============================
document.getElementById("searchInput")?.addEventListener("input", () => {
  applyFilters();
});

// ===============================
// DOM READY
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  await checkUserLocked();
  loadCategories();
  loadProducts();
});
