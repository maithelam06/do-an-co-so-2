const API_BASE_URL = "http://localhost:8000/api";
let categories = [];
let filteredCategories = [];

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  loadCategories();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Form submission
  document
    .getElementById("categoryForm")
    .addEventListener("submit", handleFormSubmit);

  // Search input
  document
    .getElementById("searchInput")
    .addEventListener("input", debounce(filterCategories, 300));

  // Status filter
  document
    .getElementById("statusFilter")
    .addEventListener("change", filterCategories);
}

// Load categories from API
async function loadCategories() {
  try {
    showLoading(true);
    const response = await fetch(`${API_BASE_URL}/categories`);

    if (!response.ok) {
      throw new Error("Không thể tải danh sách danh mục");
    }

    categories = await response.json();
    filteredCategories = [...categories];
    renderCategories();
  } catch (error) {
    console.error("Error loading categories:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi!",
      text: error.message || "Không thể tải danh sách danh mục",
    });
  } finally {
    showLoading(false);
  }
}

// Render categories table
function renderCategories() {
  const tbody = document.getElementById("categoriesTableBody");
  const emptyState = document.getElementById("emptyState");

  if (filteredCategories.length === 0) {
    tbody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  tbody.innerHTML = filteredCategories
    .map(
      (category) => `
                <tr>
                    <td>${category.id}</td>
                    <td>
                        <strong>${category.name}</strong>
                    </td>
                    <td>
                        <span class="text-muted">${
                          category.description || "Không có mô tả"
                        }</span>
                    </td>
                    <td>
                        <span class="badge bg-info">${
                          category.products_count || 0
                        } sản phẩm</span>
                    </td>
                    <td>
                        <span class="badge ${
                          category.status ? "bg-success" : "bg-secondary"
                        }">
                            ${category.status ? "Hoạt động" : "Tạm dừng"}
                        </span>
                    </td>
                    <td>${formatDate(category.created_at)}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="editCategory(${
                              category.id
                            })" title="Sửa">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-${
                              category.status ? "warning" : "success"
                            }" 
                                    onclick="toggleCategoryStatus(${
                                      category.id
                                    })" 
                                    title="${
                                      category.status ? "Tạm dừng" : "Kích hoạt"
                                    }">
                                <i class="fas fa-${
                                  category.status ? "pause" : "play"
                                }"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteCategory(${
                              category.id
                            })" title="Xóa">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `
    )
    .join("");
}

// Filter categories
function filterCategories() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();

  const statusFilter = document.getElementById("statusFilter").value;

  filteredCategories = categories.filter((category) => {
    // Lọc theo tên & mô tả
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm) ||
      (category.description &&
        category.description.toLowerCase().includes(searchTerm));

    // 🔥 Lọc trạng thái (BOOLEAN -> NUMBER)
    const matchesStatus =
      statusFilter === "" || Number(category.status) === Number(statusFilter);

    return matchesSearch && matchesStatus;
  });

  renderCategories();
}

// Reset filters
function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("statusFilter").value = "";
  filteredCategories = [...categories];
  renderCategories();
}

// Open add modal
function openAddModal() {
  document.getElementById("categoryModalLabel").textContent = "Thêm Danh Mục";
  document.getElementById("submitBtn").innerHTML =
    '<i class="fas fa-save me-2"></i>Thêm';
  document.getElementById("categoryForm").reset();
  document.getElementById("categoryId").value = "";
  document.getElementById("categoryStatus").checked = true;
  clearValidationErrors();
}

// Edit category
async function editCategory(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`);

    if (!response.ok) {
      throw new Error("Không thể tải thông tin danh mục");
    }

    const category = await response.json();

    document.getElementById("categoryModalLabel").textContent = "Sửa Danh Mục";
    document.getElementById("submitBtn").innerHTML =
      '<i class="fas fa-save me-2"></i>Cập nhật';
    document.getElementById("categoryId").value = category.id;
    document.getElementById("categoryName").value = category.name;
    document.getElementById("categoryDescription").value =
      category.description || "";
    document.getElementById("categoryStatus").checked = category.status;

    clearValidationErrors();

    const modal = new bootstrap.Modal(document.getElementById("categoryModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading category:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi!",
      text: error.message || "Không thể tải thông tin danh mục",
    });
  }
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();

  const categoryId = document.getElementById("categoryId").value;
  const formData = {
    name: document.getElementById("categoryName").value.trim(),
    description: document.getElementById("categoryDescription").value.trim(),
    status: document.getElementById("categoryStatus").checked,
  };

  try {
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i>Đang xử lý...';

    const url = categoryId
      ? `${API_BASE_URL}/categories/${categoryId}`
      : `${API_BASE_URL}/categories`;
    const method = categoryId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 422) {
        displayValidationErrors(result.errors);
        return;
      }
      throw new Error(result.message || "Có lỗi xảy ra");
    }

    Swal.fire({
      icon: "success",
      title: "Thành công!",
      text: result.message,
      timer: 2000,
      showConfirmButton: false,
    });

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("categoryModal")
    );
    modal.hide();

    loadCategories();
  } catch (error) {
    console.error("Error saving category:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi!",
      text: error.message || "Không thể lưu danh mục",
    });
  } finally {
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = false;
    submitBtn.innerHTML = categoryId
      ? '<i class="fas fa-save me-2"></i>Cập nhật'
      : '<i class="fas fa-save me-2"></i>Thêm';
  }
}

// Toggle category status
async function toggleCategoryStatus(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/${id}/toggle`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Có lỗi xảy ra");
    }

    Swal.fire({
      icon: "success",
      title: "Thành công!",
      text: result.message,
      timer: 2000,
      showConfirmButton: false,
    });

    loadCategories();
  } catch (error) {
    console.error("Error toggling category status:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi!",
      text: error.message || "Không thể cập nhật trạng thái",
    });
  }
}

// Delete category
async function deleteCategory(id) {
  const category = categories.find((c) => c.id === id);

  const result = await Swal.fire({
    title: "Xác nhận xóa",
    text: `Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "DELETE",
    });

    const deleteResult = await response.json();

    if (!response.ok) {
      throw new Error(deleteResult.message || "Có lỗi xảy ra");
    }

    Swal.fire({
      icon: "success",
      title: "Thành công!",
      text: deleteResult.message,
      timer: 2000,
      showConfirmButton: false,
    });

    loadCategories();
  } catch (error) {
    console.error("Error deleting category:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi!",
      text: error.message || "Không thể xóa danh mục",
    });
  }
}

// Utility functions
function showLoading(show) {
  const spinner = document.getElementById("loadingSpinner");
  const table = document.querySelector(".table-responsive");

  if (show) {
    spinner.style.display = "block";
    table.style.display = "none";
  } else {
    spinner.style.display = "none";
    table.style.display = "block";
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayValidationErrors(errors) {
  clearValidationErrors();

  Object.keys(errors).forEach((field) => {
    const input = document.getElementById(
      `category${field.charAt(0).toUpperCase() + field.slice(1)}`
    );
    if (input) {
      input.classList.add("is-invalid");
      const feedback = input.nextElementSibling;
      if (feedback && feedback.classList.contains("invalid-feedback")) {
        feedback.textContent = errors[field][0];
      }
    }
  });
}

function clearValidationErrors() {
  document.querySelectorAll(".is-invalid").forEach((input) => {
    input.classList.remove("is-invalid");
  });
  document.querySelectorAll(".invalid-feedback").forEach((feedback) => {
    feedback.textContent = "";
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
