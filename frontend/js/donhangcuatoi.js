const API_BASE_URL = "http://localhost:8000/api";

let orders = [];
let filteredOrders = [];
let currentFilter = "all";
let currentSort = "newest";
let currentPage = 1;
let itemsPerPage = 10;
let currentUser = null;

// Lấy token và thông tin người dùng từ localStorage
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  updateUserUI(user);
  loadOrders();
  setupEventListeners();
});

// Update User UI
function updateUserUI(user) {
  document.getElementById("userName").textContent = user.name || "Khách hàng";
  const initial = (user.name).charAt(0).toUpperCase();
  document.getElementById("userAvatar").textContent = initial;
}

// Load Orders from Backend
async function loadOrders() {
  try {
    showLoading();
    const response = await fetch(`${API_BASE_URL}/my-orders`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      orders = Array.isArray(data) ? data : data.data || [];
      applyFilters();
      renderOrders();
    } else if (response.status === 401) {
      window.location.href = '/login.html';
    } else {
      showEmptyState();
    }
  } catch (error) {
    console.error("Error loading orders:", error);
    showEmptyState();
  }
}

// Filter Orders by Status
function filterByStatus(status) {
  currentFilter = status;
  currentPage = 1;
  updateActiveFilterBtn(status);
  applyFilters();
  renderOrders();
}

// Hàm remove diacritics (loại bỏ dấu)
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Apply all filters
function applyFilters() {
  let filtered = [...orders];

  // Filter by status
  if (currentFilter !== "all") {
    filtered = filtered.filter((order) => order.shipping_status === currentFilter);
  }

  // Filter by date - Lọc từ ngày được chọn trở đi
  const dateFilter = document.getElementById("dateFilter")?.value;
  if (dateFilter) {
    filtered = filtered.filter((order) => {
      const orderDate = new Date(order.created_at);
      const filterDate = new Date(dateFilter);
      
      // Lọc từ ngày filterDate trở đi
      return orderDate >= filterDate;
    });
  }

  // Search - Tìm kiếm không dấu, không biệt hoa thường
  const searchTerm = document.getElementById("searchInput")?.value.toLowerCase().trim();
  if (searchTerm) {
    const normalizedSearch = removeDiacritics(searchTerm).toLowerCase();
    
    filtered = filtered.filter((order) => {
      const orderNumber = removeDiacritics((order.order_number || "")).toLowerCase();
      const orderId = removeDiacritics((order.id || "").toString()).toLowerCase();
      
      // Tìm kiếm trong tên sản phẩm
      const itemsMatch = order.items && order.items.some(item => {
        const itemName = removeDiacritics((item.name || item.product_name || "")).toLowerCase();
        return itemName.includes(normalizedSearch);
      });
      
      return orderNumber.includes(normalizedSearch) || 
             orderId.includes(normalizedSearch) || 
             itemsMatch;
    });
  }

  // Sort
  filtered.sort((a, b) => {
    switch (currentSort) {
      case "newest":
        return new Date(b.created_at) - new Date(a.created_at);
      case "oldest":
        return new Date(a.created_at) - new Date(b.created_at);
      case "highest":
        return (b.total_amount || 0) - (a.total_amount || 0);
      case "lowest":
        return (a.total_amount || 0) - (b.total_amount || 0);
      default:
        return 0;
    }
  });

  filteredOrders = filtered;
}
// Sort Orders
function sortOrders() {
  currentSort = document.getElementById("sortSelect")?.value || "newest";
  currentPage = 1;
  applyFilters();
  renderOrders();
}

// Render Orders
function renderOrders() {
  const container = document.getElementById("ordersContainer");

  if (!container) return;

  if (filteredOrders.length === 0) {
    showEmptyState();
    return;
  }

  // Pagination
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(start, end);

  container.innerHTML = paginatedOrders
    .map((order) => createOrderCard(order))
    .join("");
  renderPagination();
}

// Create Order Card - Sửa hiển thị thông tin sản phẩm
function createOrderCard(order) {
  const statusClass = `status-${order.shipping_status}`;
  const statusText = getStatusText(order.shipping_status);

  // Kiểm tra và xử lý items
  const items = Array.isArray(order.items) ? order.items : [];

  const itemsHTML = items
    .map((item) => {
      // Lấy ảnh từ product object
      let itemImage = '/frontend/img/box.png';
      
      if (item.product && item.product.image) {
        itemImage = `http://localhost:8000/storage/${item.product.image}`;
      }

      const itemName = item.name || item.product?.name || "Sản phẩm";
      const itemPrice = parseFloat(item.price || 0);
      const itemQuantity = parseInt(item.quantity || 1);
      const itemTotal = itemPrice * itemQuantity;

      return `
        <div class="order-item">
            <div class="item-image">
                <img src="${itemImage}" 
                     alt="${itemName}" 
                     class="${item.product?.image ? '' : 'p-2'}"
                     onerror="this.src='/frontend/img/box.png'">
            </div>
            <div class="item-details">
                <div class="item-name">${itemName}</div>
                <div class="item-price-row">
                    <span class="item-price">${formatCurrency(itemPrice)} × ${itemQuantity}</span>
                    <span class="item-quantity">= ${formatCurrency(itemTotal)}</span>
                </div>
            </div>
        </div>
      `;
    })
    .join("");

  const subtotal = parseFloat(order.subtotal || 0);
  const shippingFee = parseFloat(order.shipping_fee || 0);
  const discount = parseFloat(order.discount || 0);
  const totalAmount = parseFloat(order.total_amount || 0);

  return `
    <div class="order-card" data-order-id="${order.id}">
        <div class="order-card-header">
            <div class="order-info">
                <div>
                    <div class="order-number">Đơn hàng #${order.order_number || order.id}</div>
                    <div class="order-date">${formatDate(order.created_at)}</div>
                </div>
            </div>
            <div class="order-header-right">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        </div>

        <div class="order-card-body">
            <div class="order-items">
                ${itemsHTML || '<p class="no-items">Không có sản phẩm</p>'}
            </div>

            <div class="order-summary">
                <div class="summary-row">
                    <span>Tạm tính:</span>
                    <span>${formatCurrency(subtotal)}</span>
                </div>
                <div class="summary-row">
                    <span>Phí vận chuyển:</span>
                    <span>${formatCurrency(shippingFee)}</span>
                </div>
                ${discount > 0 ? `
                <div class="summary-row">
                    <span>Giảm giá:</span>
                    <span>-${formatCurrency(discount)}</span>
                </div>
                ` : ""}
                <div class="summary-row total">
                    <span>Tổng cộng:</span>
                    <span>${formatCurrency(totalAmount)}</span>
                </div>
            </div>
        </div>

        <div class="order-card-footer">
            <button class="btn btn-info" onclick="viewOrderDetailModal(${order.id})">
                <i class="fas fa-eye"></i> Xem chi tiết
            </button>
            <button class="btn btn-success" onclick="openTrackingModal(${order.id})">
                <i class="fas fa-map"></i> Theo dõi
            </button>
            ${order.shipping_status === "pending" ? `
                <button class="btn btn-danger" onclick="cancelOrder(${order.id})">
                    <i class="fas fa-times"></i> Hủy đơn
                </button>
            ` : ""}
            ${order.shipping_status === "completed" ? `
                <button class="btn btn-warning" onclick="openReviewModal(${order.id})">
                    <i class="fas fa-star"></i> Đánh giá
                </button>
            ` : ""}
        </div>
    </div>
  `;
}

// Xem chi tiết đơn hàng - Popup Modal// Xem chi tiết đơn hàng - Popup Modal
function viewOrderDetailModal(orderId) {
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    showNotification("Không tìm thấy đơn hàng", "error");
    return;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  
  const itemsDetailHTML = items
    .map((item) => {
      let itemImage = '/frontend/img/box.png';
      if (item.product && item.product.image) {
        itemImage = `http://localhost:8000/storage/${item.product.image}`;
      }

      const itemName = item.name || item.product?.name || "Sản phẩm";
      const itemPrice = parseFloat(item.price || 0);
      const itemQuantity = parseInt(item.quantity || 1);
      const itemTotal = itemPrice * itemQuantity;

      return `
        <tr>
          <td>
            <img src="${itemImage}" alt="${itemName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.src='/frontend/img/box.png'">
          </td>
          <td>${itemName}</td>
          <td class="text-end">${formatCurrency(itemPrice)}</td>
          <td class="text-center">${itemQuantity}</td>
          <td class="text-end">${formatCurrency(itemTotal)}</td>
        </tr>
      `;
    })
    .join("");

  const subtotal = parseFloat(order.subtotal || 0);
  const shippingFee = parseFloat(order.shipping_fee || 0);
  const discount = parseFloat(order.discount || 0);
  const totalAmount = parseFloat(order.total_amount || 0);
  const statusText = getStatusText(order.shipping_status);

  const modalHTML = `
    <div class="modal fade" id="orderDetailModal_${orderId}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Chi tiết đơn hàng #${order.order_number || order.id}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <p><strong>Trạng thái:</strong> <span class="badge bg-info">${statusText}</span></p>
                <p><strong>Ngày đặt:</strong> ${formatDate(order.created_at)}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Mã đơn hàng:</strong> ${order.order_number || order.id}</p>
                <p><strong>Ngày cập nhật:</strong> ${formatDate(order.updated_at || order.created_at)}</p>
              </div>
            </div>

            <hr>

            <h6 class="mb-3"><strong>Danh sách sản phẩm:</strong></h6>
            <div class="table-responsive">
              <table class="table table-sm table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Ảnh</th>
                    <th>Sản phẩm</th>
                    <th class="text-end">Giá</th>
                    <th class="text-center">SL</th>
                    <th class="text-end">Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsDetailHTML}
                </tbody>
              </table>
            </div>

            <hr>

            <div class="row">
              <div class="col-md-6"></div>
              <div class="col-md-6">
                
                <div class="d-flex justify-content-between mb-2">
                  <span>Phí vận chuyển:</span>
                  <strong>${formatCurrency(shippingFee)}</strong>
                </div>
                ${discount > 0 ? `
                <div class="d-flex justify-content-between mb-2">
                  <span>Giảm giá:</span>
                  <strong>-${formatCurrency(discount)}</strong>
                </div>
                ` : ""}
                <div class="d-flex justify-content-between border-top pt-2">
                  <span><strong>Tổng cộng:</strong></span>
                  <strong class="text-primary fs-5">${formatCurrency(totalAmount)}</strong>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Xóa modal cũ nếu có
  const oldModal = document.getElementById(`orderDetailModal_${orderId}`);
  if (oldModal) {
    oldModal.remove();
  }

  // Thêm modal vào DOM
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Hiển thị modal
  const modal = new bootstrap.Modal(document.getElementById(`orderDetailModal_${orderId}`));
  modal.show();
}


// Popup Đánh giá
function openReviewModal(orderId) {
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    showNotification("Không tìm thấy đơn hàng", "error");
    return;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  
  const itemsHTML = items
    .map((item) => {
      let itemImage = '/frontend/img/box.png';
      if (item.product && item.product.image) {
        itemImage = `http://localhost:8000/storage/${item.product.image}`;
      }

      const itemName = item.name || item.product?.name || "Sản phẩm";
      const productId = item.product?.id || item.product_id || 0;

      return `
        <div class="review-item mb-3 p-3 border rounded">
          <div class="d-flex gap-3 align-items-start">
            <img src="${itemImage}" alt="${itemName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" onerror="this.src='/frontend/img/box.png'">
            <div class="flex-grow-1">
              <h6>${itemName}</h6>
              <div class="rating mb-2">
                <label class="me-3">Đánh giá:</label>
                <div class="d-flex gap-1">
                  ${[1,2,3,4,5].map(star => `
                    <i class="fas fa-star star-rating" data-rating="${star}" data-product="${productId}" style="cursor: pointer; font-size: 20px; color: #ddd;"></i>
                  `).join('')}
                </div>
              </div>
              <textarea class="form-control form-control-sm" rows="2" placeholder="Nhận xét về sản phẩm..." data-product="${productId}"></textarea>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  const modalHTML = `
    <div class="modal fade" id="reviewModal_${orderId}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Đánh giá đơn hàng #${order.order_number || order.id}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div id="reviewContainer_${orderId}">
              ${itemsHTML}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
            <button type="button" class="btn btn-primary" onclick="submitReview(${orderId})">Gửi đánh giá</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Xóa modal cũ nếu có
  const oldModal = document.getElementById(`reviewModal_${orderId}`);
  if (oldModal) {
    oldModal.remove();
  }

  // Thêm modal vào DOM
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Thêm event listener cho rating stars
  setTimeout(() => {
    document.querySelectorAll(`#reviewModal_${orderId} .star-rating`).forEach(star => {
      star.addEventListener('click', function() {
        const rating = this.dataset.rating;
        const productId = this.dataset.product;
        const container = this.closest('.d-flex');
        
        container.querySelectorAll('.star-rating').forEach(s => {
          if (s.dataset.rating <= rating) {
            s.style.color = '#ffc107';
          } else {
            s.style.color = '#ddd';
          }
        });
      });
    });
  }, 100);

  // Hiển thị modal
  const modal = new bootstrap.Modal(document.getElementById(`reviewModal_${orderId}`));
  modal.show();
}

// Submit Đánh giá
function submitReview(orderId) {
  const order = orders.find(o => o.id === orderId);
  const reviewContainer = document.getElementById(`reviewContainer_${orderId}`);
  const reviewItems = reviewContainer.querySelectorAll('.review-item');

  reviewItems.forEach(async (item) => {
    const stars = item.querySelectorAll('.star-rating');
    const textarea = item.querySelector('textarea');
    const productId = textarea.dataset.product;

    let rating = 0;
    stars.forEach(star => {
      if (
        window.getComputedStyle(star).color.includes('255, 193, 7') ||
        star.style.color === 'rgb(255, 193, 7)' ||
        star.style.color === '#ffc107'
      ) {
        rating = Math.max(rating, parseInt(star.dataset.rating));
      }
    });

    if (rating === 0) {
      showNotification("Vui lòng chọn đánh giá sao cho tất cả sản phẩm", "error");
      return;
    }

    // Gửi từng product lên API
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/review`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: rating,
          comment: textarea.value.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        showNotification(`Không thể gửi đánh giá cho sản phẩm #${productId}`, "error");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      showNotification(`Có lỗi xảy ra khi gửi sản phẩm #${productId}`, "error");
    }
  });

  showNotification("Gửi đánh giá thành công!", "success");
  const modal = bootstrap.Modal.getInstance(document.getElementById(`reviewModal_${orderId}`));
  modal.hide();
  loadOrders();
}



// Popup Theo dõi đơn hàng
// Popup Theo dõi đơn hàng
async function openTrackingModal(orderId) {
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    showNotification("Không tìm thấy đơn hàng", "error");
    return;
  }

  try {
    // Lấy dữ liệu lịch sử giao hàng từ API
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/shipments`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      showNotification("Không thể tải thông tin giao hàng", "error");
      return;
    }

    const shipments = await response.json();
    
    // Tạo HTML cho timeline từ dữ liệu API
    let timelineHTML = '';
    
    if (Array.isArray(shipments) && shipments.length > 0) {
      timelineHTML = shipments
        .map((shipment) => {
          const statusIcon = getShipmentStatusIcon(shipment.status);
          const statusColor = getShipmentStatusColor(shipment.status);
          const statusLabel = getShipmentStatusLabel(shipment.status);

          return `
            <div class="timeline-item mb-3">
              <div class="d-flex gap-3">
                <div class="timeline-marker">
                  <i class="fas ${statusIcon} ${statusColor}" style="font-size: 24px;"></i>
                </div>
                <div>
                  <h6>${statusLabel}</h6>
                  <p class="text-muted mb-1">${shipment.description || ''}</p>
                  <small class="text-muted">${formatDate(shipment.created_at)}</small>
                  ${shipment.location ? `<p class="text-muted mb-0"><i class="fas fa-map-marker-alt"></i> ${shipment.location}</p>` : ''}
                </div>
              </div>
            </div>
          `;
        })
        .join('');
    } else {
      timelineHTML = `
        <div class="timeline-item mb-3">
          <div class="d-flex gap-3">
            <div class="timeline-marker">
              <i class="fas fa-check-circle text-success" style="font-size: 24px;"></i>
            </div>
            <div>
              <h6>Đơn hàng được xác nhận</h6>
              <small class="text-muted">${formatDate(order.created_at)}</small>
            </div>
          </div>
        </div>
      `;
    }

    const trackingHTML = `
      <div class="modal fade" id="trackingModal_${orderId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Theo dõi đơn hàng #${order.order_number || order.id}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="tracking-info mb-4 p-3 bg-light rounded">
                <div class="row">
                  <div class="col-md-6">
                    <p class="mb-2"><strong>Mã vận đơn:</strong></p>
                    <p class="text-primary fw-bold">${order.tracking_number || 'Chưa cập nhật'}</p>
                  </div>
                  <div class="col-md-6">
                    <p class="mb-2"><strong>Nhà vận chuyển:</strong></p>
                    <p class="fw-bold">${order.carrier_name || 'Chưa cập nhật'}</p>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-12">
                    <p class="mb-2"><strong>Trạng thái:</strong></p>
                    <span class="badge bg-info p-2">${getStatusText(order.shipping_status)}</span>
                  </div>
                </div>
              </div>

              <h6 class="mb-3"><strong>Lịch sử giao hàng:</strong></h6>
              <div class="tracking-timeline">
                ${timelineHTML}
              </div>

              ${order.tracking_number ? `
              <div class="mt-4 p-3 bg-light rounded">
                <p class="mb-2"><strong>Theo dõi trực tuyến:</strong></p>
                <a href="https://tracking.example.com/${order.tracking_number}" target="_blank" class="btn btn-sm btn-outline-primary">
                  <i class="fas fa-external-link-alt"></i> Xem trên website vận chuyển
                </a>
              </div>
              ` : ''}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Xóa modal cũ nếu có
    const oldModal = document.getElementById(`trackingModal_${orderId}`);
    if (oldModal) {
      oldModal.remove();
    }

    // Thêm modal vào DOM
    document.body.insertAdjacentHTML("beforeend", trackingHTML);

    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById(`trackingModal_${orderId}`));
    modal.show();

  } catch (error) {
    console.error("Error loading shipments:", error);
    showNotification("Có lỗi xảy ra khi tải thông tin giao hàng", "error");
  }
}

// Helper functions cho shipment status
function getShipmentStatusIcon(status) {
  const iconMap = {
    pending: "fa-clock",
    processing: "fa-box",
    delivered: "fa-home",
    cancelled: "fa-ban",
  };
  return iconMap[status] || "fa-info-circle";
}

function getShipmentStatusColor(status) {
  const colorMap = {
    pending: "text-warning",
    processing: "text-primary",
    completed: "text-success",
    cancelled: "text-danger",
  };
  return colorMap[status] || "text-secondary";
}

function getShipmentStatusLabel(status) {
  const labelMap = {
    pending: "Chờ xử lí",
    processing: "Đơn hàng đang được giao đến bạn",
    completed: "Đã giao thành công",
    cancelled: "Đơn hàng bị hủy",
  };
  return labelMap[status] || status;
}

// ...existing code...


// Pagination
function renderPagination() {
  const container = document.getElementById("pagination");
  if (!container) return;

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button ${i === currentPage ? 'class="active"' : ""} onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }

  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderOrders();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Action Handlers
function viewOrderDetail(orderId) {
  window.location.href = `/order-detail.html?id=${orderId}`;
}

async function repeatOrder(orderId) {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/repeat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      showNotification("Đã thêm sản phẩm vào giỏ hàng", "success");
    } else {
      showNotification("Không thể mua lại đơn hàng này", "error");
    }
  } catch (error) {
    console.error("Error repeating order:", error);
    showNotification("Có lỗi xảy ra", "error");
  }
}

async function reviewOrder(orderId) {
  window.location.href = `/review.html?order_id=${orderId}`;
}

function trackOrder(orderId) {
  window.location.href = `/track-order.html?id=${orderId}`;
}

async function cancelOrder(orderId) {
  if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      showNotification("Đơn hàng đã được hủy", "success");
      loadOrders();
    } else {
      const errorData = await response.json();
      showNotification(errorData.message || "Không thể hủy đơn hàng này", "error");
    }
  } catch (error) {
    console.error("Error cancelling order:", error);
    showNotification("Có lỗi xảy ra", "error");
  }
}

// UI Helpers
function updateActiveFilterBtn(status) {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.classList.remove("active");
    
    // Kiểm tra xem button này có phải là status được chọn không
    const btnText = btn.textContent.toLowerCase().trim();
    let btnStatus = null;
    
    if (btnText.includes("tất cả")) {
      btnStatus = "all";
    } else if (btnText.includes("chờ xử lí")) {
      btnStatus = "pending";
    } else if (btnText.includes("đang giao")) {
      btnStatus = "processing"; 
    } else if (btnText.includes("đã giao")) {
      btnStatus = "completed";
    } else if (btnText.includes("đã hủy")) {
      btnStatus = "cancelled";
    }
    
    // Thêm class active nếu trùng
    if (btnStatus === status) {
      btn.classList.add("active");
    }
  });
}

function showLoading() {
  const container = document.getElementById("ordersContainer");
  if (container) {
    container.innerHTML = `
      <div class="loading">
          <div class="spinner"></div>
          <p>Đang tải đơn hàng...</p>
      </div>
    `;
  }
}

function showEmptyState() {
  const container = document.getElementById("ordersContainer");
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h2 class="empty-title">Không có đơn hàng</h2>
          <p class="empty-text">Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
          <button class="btn-empty" onclick="window.location.href='/'">
              <i class="fas fa-shopping-cart"></i> Tiếp tục mua sắm
          </button>
      </div>
    `;
  }
  const pagination = document.getElementById("pagination");
  if (pagination) {
    pagination.innerHTML = "";
  }
}

// Event Listeners
function setupEventListeners() {
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const dateFilter = document.getElementById("dateFilter");

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentPage = 1;
        applyFilters();
        renderOrders();
      }, 300);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", sortOrders);
  }

  if (dateFilter) {
    dateFilter.addEventListener("change", () => {
      currentPage = 1;
      applyFilters();
      renderOrders();
    });
  }
}

// Utility Functions
function formatCurrency(value) {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getStatusText(status) {
  const statusMap = {
    pending: "Chờ xử lí",
    processing: "Đang giao",
    completed: "Đã giao",
    cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
}

function showNotification(message, type = "info") {
  // Có thể thay bằng thư viện Toast như Toastr hoặc SweetAlert2
  alert(message);
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/frontend/index.html';
}