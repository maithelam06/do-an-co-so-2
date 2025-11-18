async function updateCartCount() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/cart/count`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    const el = document.getElementById('cart-count');
    if (el) el.textContent = data.count || 0;
  } catch (error) {
    console.warn('Không thể cập nhật số lượng giỏ hàng:', error);
  }
}



// 👤 AUTH UI

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

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  updateCartCount();
});