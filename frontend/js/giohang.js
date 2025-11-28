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
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
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

//  Render giỏ hàng - CẬP NHẬT CHO TABLE
function renderCart(items) {
  const cartItemsDiv = document.getElementById("cartItems");
  const cartContent = document.getElementById("cartContent");
  const emptyCart = document.getElementById("emptyCart");

  cartItemsDiv.innerHTML = "";

  if (items.length === 0) {
    cartContent.classList.add("hide");
    emptyCart.style.display = "block";
    return;
  }

  cartContent.classList.remove("hide");
  emptyCart.style.display = "none";

  items.forEach((item) => {
    const itemHtml = `
      <tr class="cart-item"
           data-id="${item.id}"
           data-product-id="${item.product.id}"
           data-image="${item.product.image || ""}">
        <td>
          <input type="checkbox" class="form-check-input product-checkbox" onchange="updateSelected()" />
        </td>
        <td>
          <div class="item-product">
            <img src="${item.product.image ? "http://localhost:8000/storage/" + item.product.image : "/frontend/img/box.png"}" alt="${item.product.name}">
            <div class="item-product-info">
              <div class="item-product-name">${item.product.name}</div>
              <div class="item-product-variant">${item.product.variant || ""}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="item-price" data-price="${item.product.price}">
            ${formatPrice(item.product.price)}
          </div>
        </td>
        <td>
          <div class="quantity-control">
            <button type="button" onclick="decreaseQuantity(${item.id})">-</button>
            <input type="number" class="quantity-input" value="${item.quantity}" readonly>
            <button type="button" onclick="increaseQuantity(${item.id})">+</button>
          </div>
        </td>
        <td>
          <div class="item-total" data-unit-price="${item.product.price}">
            ${formatPrice(item.product.price * item.quantity)}
          </div>
        </td>
        <td>
          <div class="item-delete">
            <button type="button" onclick="removeItem(${item.id})">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    cartItemsDiv.innerHTML += itemHtml;
  });

  updateSelected();
}

// Update tổng số sản phẩm
function updateTotalItems(count) {
  const totalItemsEl = document.getElementById("totalItems");
  const totalItemsBottomEl = document.getElementById("totalItemsBottom");
  
  if (totalItemsEl) {
    totalItemsEl.textContent = count;
  }
  if (totalItemsBottomEl) {
    totalItemsBottomEl.textContent = count;
  }
}

// Update số lượng trên icon giỏ hàng
function updateCartCount(items) {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;

  let totalQty = 0;

  if (items && Array.isArray(items)) {
    totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  } else {
    // Nếu không truyền items, đếm từ DOM
    const qtyInputs = document.querySelectorAll(".quantity-input");
    qtyInputs.forEach((input) => {
      totalQty += parseInt(input.value) || 0;
    });
  }

  cartCountEl.textContent = totalQty;
}

// Tăng / giảm số lượng
function decreaseQuantity(itemId) {
  const row = document.querySelector(`.cart-item[data-id="${itemId}"]`);
  if (!row) return;
  
  const qtyInput = row.querySelector(".quantity-input");
  const newQty = parseInt(qtyInput.value) - 1;
  if (newQty < 1) return;
  
  qtyInput.value = newQty;
  updateQuantity(itemId, newQty);
}

function increaseQuantity(itemId) {
  const row = document.querySelector(`.cart-item[data-id="${itemId}"]`);
  if (!row) return;
  
  const qtyInput = row.querySelector(".quantity-input");
  const newQty = parseInt(qtyInput.value) + 1;
  if (newQty > 99) return;
  
  qtyInput.value = newQty;
  updateQuantity(itemId, newQty);
}

async function updateQuantity(itemId, newQuantity) {
  const token = localStorage.getItem("token");
  const row = document.querySelector(`.cart-item[data-id="${itemId}"]`);
  const itemTotalEl = row.querySelector(".item-total");
  const unitPrice = parseInt(itemTotalEl.dataset.unitPrice);

  // Cập nhật số tiền của sản phẩm này
  itemTotalEl.textContent = formatPrice(unitPrice * newQuantity);

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/cart/update/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
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
    const itemIndex = cart.findIndex((item) => item.id === itemId);
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
  const row = document.querySelector(`.cart-item[data-id="${itemId}"]`);

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/cart/remove/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    }
  } else {
    // Xóa khỏi localStorage nếu chưa đăng nhập
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter((item) => item.id !== itemId);
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  row.remove();

  // Kiểm tra nếu giỏ hàng trống
  const remainingItems = document.querySelectorAll(".cart-item");
  if (remainingItems.length === 0) {
    document.getElementById("cartContent").classList.add("hide");
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
  const selectAllBottom = document.getElementById("selectAllBottom");
  
  let subtotal = 0;
  let selectedCount = 0;
  const totalCount = checkboxes.length;

  checkboxes.forEach((box) => {
    const row = box.closest(".cart-item");
    const qty = parseInt(row.querySelector(".quantity-input").value);
    const itemTotalEl = row.querySelector(".item-total");
    const unitPrice = parseInt(itemTotalEl.dataset.unitPrice);

    if (box.checked) {
      subtotal += qty * unitPrice;
      selectedCount++;
    }
  });

  document.getElementById("subtotal").textContent = formatPrice(subtotal);
  document.getElementById("total").textContent = formatPrice(subtotal);
  document.getElementById("selectedCount").textContent = selectedCount;
  
  const selectedCountBtn = document.getElementById("selectedCountBtn");
  if (selectedCountBtn) {
    selectedCountBtn.textContent = selectedCount;
  }

  const buyNowBtn = document.getElementById("buyNowBtn");
  buyNowBtn.disabled = selectedCount === 0;

  // Nếu tất cả checkbox được chọn → tick chọn tất cả
  const allChecked = selectedCount === totalCount && totalCount > 0;
  if (selectAll) {
    selectAll.checked = allChecked;
  }
  if (selectAllBottom) {
    selectAllBottom.checked = allChecked;
  }
}

// Toggle chọn tất cả
function toggleSelectAll() {
  const selectAll = document.getElementById("selectAll");
  const selectAllBottom = document.getElementById("selectAllBottom");
  const checkboxes = document.querySelectorAll(".cart-item .product-checkbox");

  // Lấy trạng thái từ checkbox nào được click
  const isChecked = selectAll?.checked || selectAllBottom?.checked || false;
  
  // Đồng bộ cả 2 checkbox
  if (selectAll) selectAll.checked = isChecked;
  if (selectAllBottom) selectAllBottom.checked = isChecked;

  checkboxes.forEach((box) => {
    box.checked = isChecked;
  });

  updateSelected();
}

// Mua ngay
async function buyNow() {
  const selectedItems = [];
  const checkboxes = document.querySelectorAll(
    ".cart-item .product-checkbox:checked"
  );

  if (checkboxes.length === 0) {
    await Swal.fire({
        icon: "error",
        title: "Bạn chưa chọn sản phẩm!",
        text: "Vui lòng chọn sản phẩm để mua!",
        confirmButtonText: "Đóng"
      });
    return;
  }

  checkboxes.forEach((box) => {
    const row = box.closest(".cart-item");

    const cartItemId = parseInt(row.dataset.id); // id trong bảng cart_items
    const productId = parseInt(row.dataset.productId); // id trong bảng products
    const image = row.dataset.image;

    const qty = parseInt(row.querySelector(".quantity-input").value);
    const productName = row.querySelector(".item-product-name").textContent || "";
    const itemTotalEl = row.querySelector(".item-total");
    const unitPrice = parseInt(itemTotalEl.dataset.unitPrice);

    selectedItems.push({
      cart_item_id: cartItemId, // dùng để xoá giỏ trên DB
      product_id: productId, // dùng để lưu order_items
      name: productName,
      quantity: qty,
      price: unitPrice,
      image: image,
    });
  });

  // Lưu vào localStorage để chuyển sang trang thanh toán
  localStorage.setItem("checkoutItems", JSON.stringify(selectedItems));

  // Chuyển đến trang thanh toán
  window.location.href = "./thanhtoan.html";
}

// Khi trang load
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});