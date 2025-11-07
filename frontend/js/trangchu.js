// ===========================================
        // CẤU HÌNH API - Thay đổi URL của bạn ở đây
        // ===========================================
        const API_BASE_URL = 'http://localhost:8000/api'; // URL Laravel API của bạn
        
        // ===========================================
        // LOAD CATEGORIES
        // ===========================================
        async function loadCategories() {
            try {
                const response = await fetch(`${API_BASE_URL}/categories`);
                const categories = await response.json();
                
                const categoriesList = document.getElementById('categories-list');
                
                // Category "Tất cả"
                categoriesList.innerHTML = `
                    <div class="category-item active" onclick="filterByCategory('all')">
                        <i class="fas fa-th"></i> Tất cả
                    </div>
                `;
                
                // Render categories từ API
                categories.forEach(category => {
                    categoriesList.innerHTML += `
                        <div class="category-item" onclick="filterByCategory('${category.slug}')">
                            <i class="${category.icon || 'fas fa-tag'}"></i> ${category.name}
                        </div>
                    `;
                });
            } catch (error) {
                console.error('Lỗi khi load categories:', error);
                // Nếu API lỗi, hiển thị categories mẫu
                loadDemoCategories();
            }
        }

        // Categories mẫu khi chưa có API
        function loadDemoCategories() {
            const demoCategories = [
                {name: 'Tất cả', icon: 'fas fa-th', slug: 'all'},
                {name: 'Laptop', icon: 'fas fa-laptop', slug: 'laptop'},
                {name: 'Điện thoại', icon: 'fas fa-mobile-alt', slug: 'phone'},
                {name: 'Tablet', icon: 'fas fa-tablet-alt', slug: 'tablet'},
                {name: 'Tai nghe', icon: 'fas fa-headphones', slug: 'headphone'},
                {name: 'Đồng hồ', icon: 'fas fa-clock', slug: 'watch'},
                {name: 'Camera', icon: 'fas fa-camera', slug: 'camera'},
                {name: 'Phụ kiện', icon: 'fas fa-plug', slug: 'accessory'}
            ];

            const categoriesList = document.getElementById('categories-list');
            categoriesList.innerHTML = '';
            
            demoCategories.forEach((cat, index) => {
                categoriesList.innerHTML += `
                    <div class="category-item ${index === 0 ? 'active' : ''}" onclick="filterByCategory('${cat.slug}')">
                        <i class="${cat.icon}"></i> ${cat.name}
                    </div>
                `;
            });
        }

        // ===========================================
        // LOAD PRODUCTS
        // ===========================================
        let currentCategory = 'all';
        
        async function loadProducts(categorySlug = 'all') {
            try {
                currentCategory = categorySlug;
                const url = categorySlug === 'all' 
                    ? `${API_BASE_URL}/products`
                    : `${API_BASE_URL}/products?category=${categorySlug}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                // Giả sử API trả về: { data: [...products], categories: [...] }
                const products = data.data || data;
                
                if (categorySlug === 'all') {
                    // Hiển thị tất cả categories với products
                    const groupedProducts = {};
                    products.forEach(product => {
                        const catName = product.category_name || 'Khác';
                        if (!groupedProducts[catName]) {
                            groupedProducts[catName] = [];
                        }
                        groupedProducts[catName].push(product);
                    });
                    renderProducts(groupedProducts);
                } else {
                    // Hiển thị chỉ 1 category được chọn
                    const categoryName = products[0]?.category_name || 'Sản phẩm';
                    const categoryIcon = products[0]?.category_icon || 'fas fa-box';
                    renderSingleCategory(categoryName, categoryIcon, categorySlug, products);
                }
            } catch (error) {
                console.error('Lỗi khi load products:', error);
                // Nếu API lỗi, hiển thị products mẫu
                loadDemoProducts(categorySlug);
            }
        }

        // ===========================================
        // RENDER PRODUCTS
        // ===========================================
        function renderProducts(groupedProducts) {
            const container = document.getElementById('products-container');
            container.innerHTML = '';
            
            Object.keys(groupedProducts).forEach(categoryName => {
                const products = groupedProducts[categoryName];
                const categorySlug = products[0]?.category_slug || '';
                const categoryIcon = products[0]?.category_icon || 'fas fa-box';
                
                // Lấy tối đa 6 sản phẩm cho mỗi category
                const displayProducts = products.slice(0, 6);
                const hasMore = products.length > 6;
                
                container.innerHTML += `
                    <div class="product-section">
                        <div class="section-header">
                            <h3 class="section-title">
                                <i class="${categoryIcon} me-2"></i>${categoryName}
                            </h3>
                            ${hasMore ? `<a href="#" class="see-all" onclick="viewAllProducts('${categorySlug}')">Xem tất cả <i class="fas fa-arrow-right"></i></a>` : ''}
                        </div>
                        <div class="row g-2" id="products-${categorySlug}">
                            ${displayProducts.map(product => createProductCard(product)).join('')}
                        </div>
                    </div>
                `;
            });
        }

        // ===========================================
        // CREATE PRODUCT CARD
        // ===========================================
        function createProductCard(product) {
            const discount = product.discount || 0;
            const hasDiscount = discount > 0;
            const oldPrice = product.price;
            const newPrice = hasDiscount ? oldPrice * (1 - discount / 100) : oldPrice;
            
            return `
                <div class="col-lg-2 col-md-3 col-sm-4 col-6">
                    <div class="product-card" onclick="viewProduct(${product.id})">
                        <div class="product-img">
                            ${product.image ? `<img src="${product.image}" alt="${product.name}">` : `<i class="fas fa-box"></i>`}
                            ${hasDiscount ? `<span class="badge-sale">-${discount}%</span>` : ''}
                        </div>
                        <div class="product-body">
                            <h6 class="product-title">${product.name}</h6>
                            <p class="product-brand">${product.brand || 'Brand'}</p>
                            <div class="price-container">
                                <div class="price">${formatPrice(newPrice)}</div>
                                ${hasDiscount ? `<div class="old-price">${formatPrice(oldPrice)}</div>` : '<div style="height: 18px;"></div>'}
                            </div>
                            <div class="rating">
                                ${createStarRating(product.rating || 5)}
                                <span class="text-muted">(${product.review_count || 0})</span>
                            </div>
                            <button class="btn-cart" onclick="addToCart(${product.id}, event)">
                                <i class="fas fa-shopping-cart"></i> Thêm giỏ hàng
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // ===========================================
        // HELPER FUNCTIONS
        // ===========================================
        function formatPrice(price) {
            return new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
            }).format(price);
        }

        function createStarRating(rating) {
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 !== 0;
            let stars = '';
            
            for (let i = 0; i < fullStars; i++) {
                stars += '<i class="fas fa-star"></i>';
            }
            if (hasHalfStar) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            }
            for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
                stars += '<i class="far fa-star"></i>';
            }
            
            return stars;
        }

        // ===========================================
        // EVENT HANDLERS
        // ===========================================
        function filterByCategory(categorySlug) {
            // Update active state
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.closest('.category-item').classList.add('active');
            
            // Load products
            loadProducts(categorySlug);
        }

        function viewAllProducts(categorySlug) {
            event.preventDefault();
            console.log('View all products for category:', categorySlug);
            // Redirect to category page hoặc load more products
            window.location.href = `/category/${categorySlug}`;
        }

        function viewProduct(productId) {
            console.log('View product:', productId);
            // Redirect to product detail page
            window.location.href = `/product/${productId}`;
        }

        function addToCart(productId, event) {
            event.stopPropagation();
            console.log('Add to cart:', productId);
            
            // Gọi API add to cart
            fetch(`${API_BASE_URL}/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // Nếu dùng auth
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: 1
                })
            })
            .then(response => response.json())
            .then(data => {
                alert('Đã thêm vào giỏ hàng!');
                updateCartCount();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Có lỗi xảy ra!');
            });
        }

        // ===========================================
        // CART FUNCTIONS
        // ===========================================
        function toggleCart(event) {
            event.preventDefault();
            console.log('Open cart');
            // Redirect to cart page hoặc mở modal
            window.location.href = '/cart';
        }

        function updateCartCount() {
            // Gọi API lấy số lượng sản phẩm trong giỏ
            fetch(`${API_BASE_URL}/cart/count`, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('cart-count').textContent = data.count || 0;
            })
            .catch(error => {
                console.error('Error getting cart count:', error);
            });
        }

        // ===========================================
        // AUTH FUNCTIONS
        // ===========================================
        function showLogin(event) {
            event.preventDefault();
            console.log('Show login modal');
            // Mở modal đăng nhập hoặc redirect
            window.location.href = '/login';
        }

        function showRegister(event) {
            event.preventDefault();
            console.log('Show register modal');
            // Mở modal đăng ký hoặc redirect
            window.location.href = '/register';
        }

        function logout(event) {
            event.preventDefault();
            
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                // Gọi API logout
                fetch(`${API_BASE_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                })
                .then(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    updateAuthUI();
                    window.location.href = '/';
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }
        }

        function updateAuthUI() {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (token && user.name) {
                // Đã đăng nhập
                document.getElementById('user-name').textContent = user.name;
                document.querySelectorAll('.not-logged-in').forEach(el => el.classList.add('d-none'));
                document.querySelectorAll('.logged-in').forEach(el => el.classList.remove('d-none'));
            } else {
                // Chưa đăng nhập
                document.getElementById('user-name').textContent = 'Tài khoản';
                document.querySelectorAll('.not-logged-in').forEach(el => el.classList.remove('d-none'));
                document.querySelectorAll('.logged-in').forEach(el => el.classList.add('d-none'));
            }
        }

        // Search function
        document.getElementById('searchInput')?.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            console.log('Searching for:', searchTerm);
            // Implement search logic
        });

        // ===========================================
        // DEMO DATA (Khi chưa có API)
        // ===========================================
        function loadDemoProducts() {
            const demoProducts = {
                'Laptop': [
                    {id: 1, name: 'MacBook Pro M3 14 inch', brand: 'Apple', price: 41990000, discount: 20, rating: 5, review_count: 128, category_icon: 'fas fa-laptop'},
                    {id: 2, name: 'Dell XPS 15 9530', brand: 'Dell', price: 33990000, discount: 15, rating: 4.5, review_count: 89, category_icon: 'fas fa-laptop'},
                    {id: 3, name: 'Asus ROG Zephyrus G14', brand: 'Asus', price: 35990000, discount: 25, rating: 4.5, review_count: 145, category_icon: 'fas fa-laptop'},
                    {id: 4, name: 'HP Envy 13 x360', brand: 'HP', price: 24390000, discount: 18, rating: 4, review_count: 67, category_icon: 'fas fa-laptop'},
                    {id: 5, name: 'Lenovo ThinkPad X1', brand: 'Lenovo', price: 31990000, discount: 0, rating: 5, review_count: 201, category_icon: 'fas fa-laptop'},
                    {id: 6, name: 'MSI Prestige 14 Evo', brand: 'MSI', price: 24990000, discount: 10, rating: 4, review_count: 54, category_icon: 'fas fa-laptop'}
                ],
                'Điện thoại': [
                    {id: 7, name: 'iPhone 15 Pro Max 256GB', brand: 'Apple', price: 33990000, discount: 15, rating: 5, review_count: 342, category_icon: 'fas fa-mobile-alt'},
                    {id: 8, name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', price: 32990000, discount: 20, rating: 4.5, review_count: 289, category_icon: 'fas fa-mobile-alt'},
                    {id: 9, name: 'Xiaomi 14 Pro 512GB', brand: 'Xiaomi', price: 23990000, discount: 25, rating: 4, review_count: 156, category_icon: 'fas fa-mobile-alt'},
                    {id: 10, name: 'OPPO Find X7 Pro', brand: 'OPPO', price: 26790000, discount: 18, rating: 4, review_count: 98, category_icon: 'fas fa-mobile-alt'},
                    {id: 11, name: 'Google Pixel 8 Pro', brand: 'Google', price: 24990000, discount: 0, rating: 5, review_count: 187, category_icon: 'fas fa-mobile-alt'},
                    {id: 12, name: 'Vivo X100 Pro 5G', brand: 'Vivo', price: 22690000, discount: 12, rating: 4, review_count: 76, category_icon: 'fas fa-mobile-alt'}
                ],
                'Tablet': [
                    {id: 13, name: 'iPad Pro M2 11 inch', brand: 'Apple', price: 24990000, discount: 20, rating: 5, review_count: 167, category_icon: 'fas fa-tablet-alt'},
                    {id: 14, name: 'Samsung Galaxy Tab S9', brand: 'Samsung', price: 29390000, discount: 15, rating: 4.5, review_count: 134, category_icon: 'fas fa-tablet-alt'},
                    {id: 15, name: 'Xiaomi Pad 6 Max', brand: 'Xiaomi', price: 12990000, discount: 0, rating: 4, review_count: 89, category_icon: 'fas fa-tablet-alt'},
                    {id: 16, name: 'Lenovo Tab P12', brand: 'Lenovo', price: 15990000, discount: 10, rating: 4, review_count: 56, category_icon: 'fas fa-tablet-alt'}
                ]
            };
            
            renderProducts(demoProducts);
        }

        // ===========================================
        // KHỞI TẠO
        // ===========================================
        document.addEventListener('DOMContentLoaded', function() {
            loadCategories();
            loadProducts();
            updateAuthUI();
            updateCartCount();
        });