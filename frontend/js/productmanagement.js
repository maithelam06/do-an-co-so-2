const API_URL = "http://localhost:8000/api/products";
const CATEGORIES_API_URL = "http://localhost:8000/api/categories";

let allCategories = [];

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadProducts();

  document.getElementById("addProductForm").addEventListener("submit", addProduct);  // Event listeners cho category links sẽ được setup sau khi load categories
  // setupCategoryEventListeners() sẽ được gọi trong renderCategoriesInSidebar()
  
  // Xử lý hiển thị tên file khi chọn
  const fileInput = document.getElementById("image");
  const fileNameDiv = document.getElementById("fileName");
  const fileText = document.querySelector(".file-text");
  
  fileInput.addEventListener("change", function() {
    if (this.files && this.files[0]) {
      const fileName = this.files[0].name;
      fileNameDiv.querySelector("span").textContent = fileName;
      fileNameDiv.classList.add("show");
      fileText.textContent = "Đã chọn ảnh";
    } else {
      fileNameDiv.classList.remove("show");
      fileText.textContent = "Chọn ảnh sản phẩm";
    }
  });
});


// ===============================
// LOAD CATEGORIES FROM API
// ===============================
async function loadCategories() {
  try {
    const res = await fetch(CATEGORIES_API_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Không thể tải danh mục');
    
    allCategories = await res.json();
    renderCategoriesInSidebar();
    renderCategoriesInSelect();
  } catch (error) {
    console.error('Lỗi load danh mục:', error);
    // Fallback: sử dụng categories mặc định nếu API lỗi
    loadFallbackCategories();
  }
}

// Render categories vào sidebar
function renderCategoriesInSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // Tìm container cho categories hoặc tạo mới
  let categoriesContainer = sidebar.querySelector('.categories-container');
  if (!categoriesContainer) {
    categoriesContainer = document.createElement('div');
    categoriesContainer.className = 'categories-container';
    sidebar.appendChild(categoriesContainer);
  }

  categoriesContainer.innerHTML = `
    <a href="#" class="category-link active" data-category=""><i class="fas fa-th"></i> Tất cả</a>
  `;

  allCategories.forEach(cat => {
    categoriesContainer.innerHTML += `
      <a href="#" class="category-link" data-category="${cat.name}">
        <i class="fas fa-tag"></i> ${cat.name}
      </a>
    `;
  });

  // Thêm lại event listeners cho các category links mới
  setupCategoryEventListeners();
}

// Render categories vào dropdown select
function renderCategoriesInSelect() {
  const categorySelect = document.getElementById('category');
  if (!categorySelect) return;

  categorySelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';
  
  allCategories.forEach(cat => {
    categorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
}

// Setup event listeners cho category links
function setupCategoryEventListeners() {
  const categoryLinks = document.querySelectorAll(".category-link");
  categoryLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const category = e.target.closest('.category-link').dataset.category;
      categoryLinks.forEach(l => l.classList.remove("active"));
      e.target.closest('.category-link').classList.add("active");
      loadProducts(category);
    });
  });
}

// Fallback categories nếu API lỗi
function loadFallbackCategories() {
  allCategories = [
    { id: 1, name: 'Laptop' },
    { id: 2, name: 'Điện thoại' },
    { id: 3, name: 'Tablet' },
    { id: 4, name: 'Tai nghe' },
    { id: 5, name: 'Đồng hồ' },
    { id: 6, name: 'Camera' },
    { id: 7, name: 'Phụ kiện' }
  ];
  renderCategoriesInSidebar();
  renderCategoriesInSelect();
}

//load san pham sang user
async function loadProducts(category = "") {
  try {
    const url = category
      ? `${API_URL}?category=${encodeURIComponent(category)}`
      : API_URL;

    const res = await fetch(url);
    const products = await res.json();

    const tableBody = document.querySelector("#productTable tbody");
    tableBody.innerHTML = "";

    if (products.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-3">
            Không có sản phẩm nào trong danh mục này.
          </td>
        </tr>`;
      return;
    }

    products.forEach((p, index) => {
      tableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${p.name}</td>
          <td>${p.category ? p.category.name : "—"}</td>
          <td>${Number(p.price).toLocaleString()}₫</td>
          <td>
            ${p.image
              ? `<img src="http://localhost:8000/storage/${p.image}" alt="${p.name}" width="60" height="60" style="object-fit:cover;border-radius:8px;">`
              : "Không có ảnh"}
          </td>
          <td>${p.description ?? ""}</td>
          <td>
            <button class="toggle-btn ${p.status ? "active" : "inactive"}" onclick="toggleProduct(${p.id})">
              <i class="fas ${p.status ? "fa-toggle-on" : "fa-toggle-off"}"></i>
              <span>${p.status ? "Bật" : "Tắt"}</span>
            </button>
          </td>
          <td>
            <button class="action-btn btn-edit" onclick="editProduct(${p.id})">
              <i class="fas fa-edit"></i>
              <span>Sửa</span>
            </button>
            <button class="action-btn btn-delete" onclick="deleteProduct(${p.id})">
              <i class="fas fa-trash-alt"></i>
              <span>Xóa</span>
            </button>
          </td>
        </tr>`;
    });
  } catch (error) {
    console.error("Lỗi load sản phẩm:", error);
  }
}

//them
async function addProduct(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ " + data.message);
      form.reset();
      const submitBtn = document.getElementById("submitBtn");
      submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i><span>Thêm sản phẩm</span>';
      form.onsubmit = addProduct;
      loadProducts();
    } else {
      alert("❌ Lỗi: " + JSON.stringify(data));
    }
  } catch (error) {
    console.error("Lỗi thêm sản phẩm:", error);
  }
}

//sua san pham
async function editProduct(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    const p = await res.json();

    document.getElementById("productId").value = p.id;
    document.getElementById("name").value = p.name;
    document.getElementById("price").value = p.price;
    document.getElementById("description").value = p.description ?? "";
    document.getElementById("category").value = p.category_id ?? "";

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Cập nhật sản phẩm</span>';
    document.getElementById("addProductForm").onsubmit = (e) => updateProduct(e, id);
  } catch (error) {
    console.error("Lỗi load sản phẩm để sửa:", error);
  }
}

//cap nhat san pham
async function updateProduct(e, id) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  formData.append("_method", "PUT");

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ " + data.message);
      form.reset();
      const submitBtn = document.getElementById("submitBtn");
      submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i><span>Thêm sản phẩm</span>';
      form.onsubmit = addProduct;
      loadProducts();
    } else {
      alert("❌ Lỗi: " + JSON.stringify(data));
    }
  } catch (error) {
    console.error("Lỗi cập nhật sản phẩm:", error);
  }
}

//xoa san pham
async function deleteProduct(id) {
  if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    const data = await res.json();
    alert("🗑️ " + data.message);
    loadProducts();
  } catch (error) {
    console.error("Lỗi xóa sản phẩm:", error);
  }
}

async function toggleProduct(id) {
  try {
    const res = await fetch(`${API_URL}/${id}/toggle`, {
      method: "PATCH",
    });
    const data = await res.json();
    alert(data.message);
    loadProducts();
  } catch (error) {
    console.error("Lỗi bật/tắt sản phẩm:", error);
  }
}