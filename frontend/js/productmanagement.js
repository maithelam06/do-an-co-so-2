const API_URL = "http://localhost:8000/api/products";
const CATEGORIES_API_URL = "http://localhost:8000/api/categories";

let allCategories = [];
let currentSortOrder = "asc"; // mặc định tăng dần

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadProducts();

  // form thêm/sửa
  const addProductForm = document.getElementById("addProductForm");
  if (addProductForm) addProductForm.addEventListener("submit", addProduct);

  // Lọc theo danh mục trong dropdown
  const filterCategory = document.getElementById("filterCategory");
  if (filterCategory) {
    filterCategory.addEventListener("change", function () {
      loadProducts(this.value);
    });
  }

  // Xử lý hiển thị tên file khi chọn (nếu tồn tại)
  const fileInput = document.getElementById("image");
  const fileNameDiv = document.getElementById("fileName");
  const fileText = document.querySelector(".file-text");

  if (fileInput) {
    fileInput.addEventListener("change", function() {
      if (this.files && this.files[0]) {
        const fileName = this.files[0].name;
        if (fileNameDiv && fileNameDiv.querySelector("span")) {
          fileNameDiv.querySelector("span").textContent = fileName;
          fileNameDiv.classList.add("show");
        }
        if (fileText) fileText.textContent = "Đã chọn ảnh";
      } else {
        if (fileNameDiv) fileNameDiv.classList.remove("show");
        if (fileText) fileText.textContent = "Chọn ảnh sản phẩm";
      }
    });
  }

  // Preview ảnh - đảm bảo các phần tử tồn tại trước khi đăng listener
  const imageInput = document.getElementById("image");
  const previewImg = document.getElementById("previewImg");
  const uploadBox = document.getElementById("uploadBox");
  const fileName = document.getElementById("fileName");

  if (uploadBox && imageInput) {
    uploadBox.addEventListener("click", () => imageInput.click());
  }

  if (imageInput) {
    imageInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        if (fileName) fileName.textContent = file.name;

        const reader = new FileReader();
        reader.onload = function (e) {
          if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.style.display = "block";
          }
          if (uploadBox) uploadBox.style.display = "none";
        };

        reader.readAsDataURL(file);
      } else {
        if (previewImg) previewImg.style.display = "none";
        if (uploadBox) uploadBox.style.display = "block";
        if (fileName) fileName.textContent = "Chưa chọn ảnh";
      }
    });
  }
});

// ========== CATEGORIES ==========
async function loadCategories() {
  try {
    const res = await fetch(CATEGORIES_API_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Không thể tải danh mục. Status: ${res.status}`);
    
    allCategories = await res.json();
    // đảm bảo allCategories là mảng
    if (!Array.isArray(allCategories)) throw new Error('Dữ liệu danh mục không hợp lệ');

    renderCategoriesInSidebar();
    renderCategoriesInSelect();
    renderCategoriesInFilter(); 
  } catch (error) {
    console.error('Lỗi load danh mục:', error);
    // Fallback: sử dụng categories mặc định nếu API lỗi
    loadFallbackCategories();
  }
}

function renderCategoriesInSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  let categoriesContainer = sidebar.querySelector('.categories-container');
  if (!categoriesContainer) {
    categoriesContainer = document.createElement('div');
    categoriesContainer.className = 'categories-container';
    sidebar.appendChild(categoriesContainer);
  }

  // Dùng data-id nếu backend xử lý theo id tốt hơn (ở đây vẫn để name - bạn có thể đổi thành id)
  let html = `<a href="#" class="category-link active" data-category=""><i class="fas fa-th"></i> Tất cả</a>`;

  allCategories.forEach(cat => {
    // nếu muốn dùng id: data-category="${cat.id}" và gửi id lên API
    html += `<a href="#" class="category-link" data-category="${cat.name}"><i class="fas fa-tag"></i> ${cat.name}</a>`;
  });

  categoriesContainer.innerHTML = html;

  // Thêm lại event listeners cho các category links mới
  setupCategoryEventListeners();
}

function renderCategoriesInSelect() {
  const categorySelect = document.getElementById('category');
  if (!categorySelect) return;

  categorySelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';
  allCategories.forEach(cat => {
    categorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
}

function renderCategoriesInFilter() {
  const filter = document.getElementById("filterCategory");
  if (!filter) return;

  filter.innerHTML = '<option value="">Lọc theo danh mục</option>';
  allCategories.forEach(cat => {
    filter.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
  });
}

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
  renderCategoriesInFilter();
}

function setupCategoryEventListeners() {
  const categoryLinks = document.querySelectorAll(".category-link");
  categoryLinks.forEach(link => {
    // remove rồi add prevent duplicate
    link.removeEventListener('click', link._catHandler);
    const handler = (e) => {
      e.preventDefault();
      // lấy dataset từ chính link
      const category = link.dataset.category ?? "";
      categoryLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      loadProducts(category);
    };
    link.addEventListener("click", handler);
    link._catHandler = handler; // lưu reference để có thể remove sau này nếu cần
  });
}

// ========== PRODUCTS ==========
async function loadProducts(category = "") {
  try {
    const url = category
      ? `${API_URL}?category=${encodeURIComponent(category)}`
      : API_URL;

    const res = await fetch(url);
    // kiểm tra status trước khi parse json
    if (!res.ok) {
      const text = await res.text();
      console.error(`Error loading products. Status ${res.status}:`, text);
      const tableBodyErr = document.querySelector("#productTable tbody");
      if (tableBodyErr) {
        tableBodyErr.innerHTML = `
          <tr><td colspan="9" class="text-center text-danger py-3">
            Lỗi khi tải sản phẩm từ server (status ${res.status}). Kiểm tra console.
          </td></tr>`;
      }
      return;
    }

    const products = await res.json();
    if (!Array.isArray(products)) {
      console.error('Dữ liệu sản phẩm trả về không phải mảng:', products);
      return;
    }

    const tableBody = document.querySelector("#productTable tbody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (products.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center text-muted py-3">
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
          <td>${Number(p.price || 0).toLocaleString()}₫</td>
          <td>
            ${p.image
              ? `<img src="http://localhost:8000/storage/${p.image}" alt="${p.name}" width="60" height="60" style="object-fit:cover;border-radius:8px;">`
              : "Không có ảnh"}
          </td>
          <td>${p.description ?? ""}</td>
          <td>${p.specs ?? ""}</td>
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
    const tableBodyErr = document.querySelector("#productTable tbody");
    if (tableBodyErr) {
      tableBodyErr.innerHTML = `
        <tr><td colspan="9" class="text-center text-danger py-3">
          Có lỗi khi tải sản phẩm. Kiểm tra console.
        </td></tr>`;
    }
  }
}

// ========== CRUD FUNCTIONS ==========
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
      await Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: data.message,
        confirmButtonText: "Đóng"
      });
      form.reset();
      const submitBtn = document.getElementById("submitBtn");
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i><span>Thêm sản phẩm</span>';
      form.onsubmit = addProduct;
      loadProducts();
    } else {
      await Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: JSON.stringify(data),
        confirmButtonText: "Đóng"
      });
    }
  } catch (error) {
    console.error("Lỗi thêm sản phẩm:", error);
    await Swal.fire({
      icon: "error",
      title: "Lỗi!",
      text: "Có lỗi khi gửi yêu cầu. Kiểm tra console.",
      confirmButtonText: "Đóng"
    });
  }
}

async function editProduct(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const p = await res.json();

    document.getElementById("productId").value = p.id;
    document.getElementById("name").value = p.name;
    document.getElementById("price").value = p.price;
    document.getElementById("description").value = p.description ?? "";
    document.getElementById("category").value = p.category_id ?? "";

    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Cập nhật sản phẩm</span>';
    document.getElementById("addProductForm").onsubmit = (e) => updateProduct(e, id);
  } catch (error) {
    console.error("Lỗi load sản phẩm để sửa:", error);
  }
}

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
      await Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: data.message,
        confirmButtonText: "Đóng"
      });
      form.reset();
      const submitBtn = document.getElementById("submitBtn");
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i><span>Thêm sản phẩm</span>';
      form.onsubmit = addProduct;
      loadProducts();
    } else {
      await Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: JSON.stringify(data),
        confirmButtonText: "Đóng"
      });
    }
  } catch (error) {
    console.error("Lỗi cập nhật sản phẩm:", error);
  }
}

async function toggleProduct(id) {
  Swal.fire({
    title: "Thay đổi trạng thái?",
    text: "Bạn có chắc muốn bật/tắt sản phẩm này?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#0d6efd",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Đồng ý",
    cancelButtonText: "Hủy"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/${id}/toggle`, { method: "PATCH" });
        const data = await res.json();

        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: data.message,
          confirmButtonText: "Đóng"
        });

        loadProducts();
      } catch (error) {
        console.error("Lỗi bật/tắt sản phẩm:", error);
      }
    }
  });
}

async function deleteProduct(id) {
  Swal.fire({
    title: "Bạn có chắc?",
    text: "Sản phẩm sẽ bị xóa và không thể khôi phục!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Xóa ngay",
    cancelButtonText: "Hủy"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        const data = await res.json();

        Swal.fire({
          icon: "success",
          title: "Đã xóa!",
          text: data.message,
          confirmButtonText: "Đóng"
        });

        loadProducts();
      } catch (error) {
        console.error("Lỗi xóa sản phẩm:", error);
      }
    }
  });
}
