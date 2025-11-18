const API_BASE_URL = "http://localhost:8000/api";

//  Định dạng giá
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}


//  Load giỏ hàng

async function loadCart() {
  let items = [];
  const token = localStorage.getItem("token");

  if (token) {
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });
      if (!res.ok) throw new Error("Không thể tải giỏ hàng");
      const data = await res.json();
      items = data.items || [];
    } catch (err) {
      console.error(err);
    }
  } else {
    items = JSON.parse(localStorage.getItem("cart")) || [];
  }

  renderCart(items);
  updateCartCount(items);
  updateTotalItems(items.length);
}


//  Render giỏ hàng

function renderCart(items) {
  const cartItemsDiv = document.getElementById("cartItems");
  const cartContent = document.getElementById("cartContent");
  const emptyCart = document.getElementById("emptyCart");
  
  cartItemsDiv.innerHTML = "";

  if (items.length === 0) {
    cartContent.style.display = "none";
    emptyCart.style.display = "block";
    return;
  }

  cartContent.style.display = "flex";
  emptyCart.style.display = "none";

  items.forEach((item) => {
    const itemHtml = `
      <div class="cart-item" data-id="${item.id}">
        <div class="row align-items-center g-2">
          <div class="col-auto">
            <input type="checkbox" class="form-check-input product-checkbox" onchange="updateSelected()" />
          </div>
          <div class="col-auto">
            <img src="${item.product.image}" alt="${item.product.name}" class="product-image">
          </div>
          <div class="col">
            <div class="product-name">${item.product.name}</div>
            <div class="product-details">${item.product.variant || ""}</div>
          </div>
          <div class="col-auto">
            <div class="price-text" data-price="${item.product.price}">
              ${formatPrice(item.product.price)}
            </div>
          </div>
          <div class="col-auto">
            <div class="quantity-control">
              <button class="quantity-btn" onclick="decreaseQuantity(${item.id})">-</button>
              <input type="number" class="quantity-input" value="${item.quantity}" readonly>
              <button class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button>
            </div>
          </div>
          <div class="col-auto">
            <button class="btn btn-link text-danger btn-remove p-1" onclick="removeItem(${item.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    cartItemsDiv.innerHTML += itemHtml;
  });

  updateSelected();
}


// Update tổng số sản phẩm

function updateTotalItems(count) {
  const totalItemsEl = document.getElementById("totalItems");
  if (totalItemsEl) {
    totalItemsEl.textContent = count;
  }
}


// Update số lượng trên icon giỏ hàng

// function updateCartCount(items) {
//   const cartCountEl = document.getElementById("cart-count");
//   if (!cartCountEl) return;
  
//   let totalQty = 0;
  
//   if (items && Array.isArray(items)) {
//     totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
//   } else {
//     // Nếu không truyền items, đếm từ DOM
//     const qtyInputs = document.querySelectorAll(".quantity-input");
//     qtyInputs.forEach(input => {
//       totalQty += parseInt(input.value) || 0;
//     });
//   }
  
//   cartCountEl.textContent = totalQty;
// }

// Tăng / giảm số lượng

function decreaseQuantity(itemId) {
  const qtyInput = document.querySelector(`.cart-item[data-id="${itemId}"] .quantity-input`);
  if (!qtyInput) return;
  const newQty = parseInt(qtyInput.value) - 1;
  if (newQty < 1) return;
  qtyInput.value = newQty;
  updateQuantity(itemId, newQty);
}

function increaseQuantity(itemId) {
  const qtyInput = document.querySelector(`.cart-item[data-id="${itemId}"] .quantity-input`);
  if (!qtyInput) return;
  const newQty = parseInt(qtyInput.value) + 1;
  if (newQty > 99) return;
  qtyInput.value = newQty;
  updateQuantity(itemId, newQty);
}

async function updateQuantity(itemId, newQuantity) {
  const token = localStorage.getItem("token");
  const itemDiv = document.querySelector(`.cart-item[data-id="${itemId}"]`);
  const priceEl = itemDiv.querySelector(".price-text");
  const unitPrice = parseInt(priceEl.dataset.price);

  priceEl.textContent = formatPrice(unitPrice * newQuantity);

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/cart/update/${itemId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });
    } catch (err) {
      console.error(err);
    }
  } else {
    // Update localStorage nếu chưa đăng nhập
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      cart[itemIndex].quantity = newQuantity;
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }

  updateSelected();
  updateCartCount();
}


// Xóa sản phẩm

async function removeItem(itemId) {
  if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

  const token = localStorage.getItem("token");
  const itemDiv = document.querySelector(`.cart-item[data-id="${itemId}"]`);
  
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/cart/remove/${itemId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    }
  } else {
    // Xóa khỏi localStorage nếu chưa đăng nhập
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  itemDiv.remove();

  // Kiểm tra nếu giỏ hàng trống
  const remainingItems = document.querySelectorAll(".cart-item");
  if (remainingItems.length === 0) {
    document.getElementById("cartContent").style.display = "none";
    document.getElementById("emptyCart").style.display = "block";
  }

  updateSelected();
  updateCartCount();
  updateTotalItems(remainingItems.length);
}


// Cập nhật chọn sản phẩm & tổng tiền

function updateSelected() {
  const checkboxes = document.querySelectorAll(".cart-item .product-checkbox");
  const selectAll = document.getElementById("selectAll");
  let subtotal = 0;
  let selectedCount = 0;
  const totalCount = checkboxes.length;

  checkboxes.forEach(box => {
    const itemDiv = box.closest(".cart-item");
    const qty = parseInt(itemDiv.querySelector(".quantity-input").value);
    const unitPrice = parseInt(itemDiv.querySelector(".price-text").dataset.price);

    if (box.checked) {
      subtotal += qty * unitPrice;
      selectedCount++;
    }
  });

  document.getElementById("subtotal").textContent = formatPrice(subtotal);
  document.getElementById("total").textContent = formatPrice(subtotal);
  document.getElementById("selectedCount").textContent = selectedCount;
  
  const buyNowBtn = document.getElementById("buyNowBtn");
  buyNowBtn.disabled = selectedCount === 0;

  // Nếu tất cả checkbox được chọn → tick chọn tất cả
  if (selectAll) {
    selectAll.checked = selectedCount === totalCount && totalCount > 0;
  }
}


// Toggle chọn tất cả

function toggleSelectAll() {
  const selectAll = document.getElementById("selectAll");
  const checkboxes = document.querySelectorAll(".cart-item .product-checkbox");

  checkboxes.forEach(box => {
    box.checked = selectAll.checked;
  });

  updateSelected();
}


// Mua ngay

function buyNow() {
  const selectedItems = [];
  const checkboxes = document.querySelectorAll(".cart-item .product-checkbox:checked");
  
  if (checkboxes.length === 0) {
    alert("Vui lòng chọn sản phẩm để mua!");
    return;
  }

  checkboxes.forEach(box => {
    const itemDiv = box.closest(".cart-item");
    const itemId = itemDiv.dataset.id;
    const qty = parseInt(itemDiv.querySelector(".quantity-input").value);
    const productName = itemDiv.querySelector(".product-name").textContent;
    const unitPrice = parseInt(itemDiv.querySelector(".price-text").dataset.price);
    
    selectedItems.push({
      id: itemId,
      name: productName,
      quantity: qty,
      price: unitPrice
    });
  });

  // Lưu vào sessionStorage để chuyển sang trang thanh toán
  localStorage.setItem("checkoutItems", JSON.stringify(selectedItems));
  
  // Chuyển đến trang thanh toán (cần tạo trang này)
  window.location.href = "./thanhtoan.html";
}


// Khi trang load

document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});