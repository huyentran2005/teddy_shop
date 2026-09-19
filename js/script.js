/* =========================================================
   BIN BIN TEDDY - SCRIPT.JS
   Toàn bộ logic: hiển thị sản phẩm, tìm kiếm, lọc,
   giỏ hàng (thêm/sửa/xóa), lưu localStorage, giao diện.
   ========================================================= */

(function () {
  "use strict";

  /* ============================================================
     1. DỮ LIỆU SẢN PHẨM
     Trong dự án thực tế, dữ liệu này có thể lấy từ API/server.
     Ở đây khai báo tĩnh để phục vụ bài tập.
     ============================================================ */
  const PRODUCTS = [
    {
      id: "sp01",
      name: "Gấu Teddy Nâu Cổ Điển",
      price: 250000,
      category: "co-dien",
      categoryLabel: "Cổ điển",
      image: "images/bear-1.svg",
      badge: "Bán chạy",
    },
    {
      id: "sp02",
      name: "Gấu Bông Trắng Tinh Khôi",
      price: 230000,
      category: "co-dien",
      categoryLabel: "Cổ điển",
      image: "images/bear-2.svg",
    },
    {
      id: "sp03",
      name: "Gấu Bông Hồng Pastel",
      price: 220000,
      category: "co-dien",
      categoryLabel: "Cổ điển",
      image: "images/bear-3.svg",
      badge: "Yêu thích",
    },
    {
      id: "sp04",
      name: "Gấu Bông Khổng Lồ 1m2",
      price: 890000,
      category: "khong-lo",
      categoryLabel: "Khổng lồ",
      image: "images/bear-4.svg",
    },
    {
      id: "sp05",
      name: "Gấu Nâu Khổng Lồ 1m5",
      price: 1250000,
      category: "khong-lo",
      categoryLabel: "Khổng lồ",
      image: "images/bear-5.svg",
    },
    {
      id: "sp06",
      name: "Gấu Bông Mini Móc Khóa",
      price: 65000,
      category: "mini",
      categoryLabel: "Mini",
      image: "images/bear-6.svg",
      badge: "Giá tốt",
    },
    {
      id: "sp07",
      name: "Thỏ Bông Tai Dài",
      price: 195000,
      category: "thu-khac",
      categoryLabel: "Thú khác",
      image: "images/bear-7.svg",
    },
    {
      id: "sp08",
      name: "Gấu Trúc Panda Bông",
      price: 240000,
      category: "thu-khac",
      categoryLabel: "Thú khác",
      image: "images/bear-8.svg",
    },
  ];

  const CART_STORAGE_KEY = "binbinteddy_cart"; // khóa lưu giỏ hàng trong localStorage

  /* ============================================================
     2. TRUY XUẤT CÁC PHẦN TỬ DOM DÙNG NHIỀU LẦN
     ============================================================ */
  const productGrid = document.getElementById("product-grid");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const priceFilter = document.getElementById("price-filter");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");

  const cartBtn = document.getElementById("cart-btn");
  const closeCartBtn = document.getElementById("close-cart-btn");
  const cartDrawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("overlay");
  const cartBody = document.getElementById("cart-body");
  const cartTotalEl = document.getElementById("cart-total");
  const cartCountEl = document.getElementById("cart-count");
  const checkoutBtn = document.getElementById("checkout-btn");
  const toastEl = document.getElementById("toast");

  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");

  /* ============================================================
     3. TIỆN ÍCH DÙNG CHUNG
     ============================================================ */

  // Định dạng số tiền theo kiểu Việt Nam, ví dụ 250000 -> "250.000đ"
  function formatCurrency(amount) {
    return amount.toLocaleString("vi-VN") + "đ";
  }

  // Hiện thông báo nhỏ (toast) trong vài giây
  let toastTimer = null;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 2200);
  }

  /* ============================================================
     4. QUẢN LÝ GIỎ HÀNG (state + localStorage)
     Cấu trúc giỏ hàng: mảng các object { id, quantity }
     ============================================================ */
  let cart = loadCartFromStorage();

  // Đọc giỏ hàng đã lưu từ localStorage khi tải trang
  function loadCartFromStorage() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      // Nếu dữ liệu lưu bị lỗi/hỏng thì bỏ qua, dùng giỏ hàng rỗng
      console.error("Không đọc được giỏ hàng đã lưu:", err);
      return [];
    }
  }

  // Lưu giỏ hàng hiện tại vào localStorage sau mỗi thay đổi
  function saveCartToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error("Không lưu được giỏ hàng:", err);
    }
  }

  // Thêm sản phẩm vào giỏ (nếu đã có thì tăng số lượng lên 1)
  function addToCart(productId) {
    const existing = cart.find((item) => item.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: productId, quantity: 1 });
    }
    saveCartToStorage();
    renderCart();

    const product = PRODUCTS.find((p) => p.id === productId);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng 🧸`);
  }

  // Cập nhật số lượng sản phẩm (dùng cho nút +/-)
  function updateQuantity(productId, delta) {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;

    item.quantity += delta;

    if (item.quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    saveCartToStorage();
    renderCart();
  }

  // Xóa hẳn 1 sản phẩm khỏi giỏ hàng
  function removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    saveCartToStorage();
    renderCart();
  }

  // Tính tổng số lượng sản phẩm (hiển thị badge trên icon giỏ hàng)
  function getCartItemCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Tính tổng tiền của giỏ hàng
  function getCartTotal() {
    return cart.reduce((sum, item) => {
      const product = PRODUCTS.find((p) => p.id === item.id);
      if (!product) return sum;
      return sum + product.price * item.quantity;
    }, 0);
  }

  /* ============================================================
     5. RENDER GIAO DIỆN GIỎ HÀNG
     ============================================================ */
  function renderCart() {
    cartCountEl.textContent = getCartItemCount();

    if (cart.length === 0) {
      cartBody.innerHTML = `
        <div class="cart-empty">
          <p>🧸 Giỏ hàng đang trống.</p>
          <p>Hãy chọn một người bạn bông nhé!</p>
        </div>`;
      cartTotalEl.textContent = formatCurrency(0);
      return;
    }

    // Dựng danh sách HTML cho từng sản phẩm trong giỏ
    const itemsHtml = cart
      .map((item) => {
        const product = PRODUCTS.find((p) => p.id === item.id);
        if (!product) return "";
        const subtotal = product.price * item.quantity;

        return `
          <div class="cart-item" data-id="${product.id}">
            <div class="cart-item-thumb">
              <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="cart-item-main">
              <p class="cart-item-name">${product.name}</p>
              <p class="cart-item-price">${formatCurrency(product.price)} / sản phẩm</p>
              <div class="qty-control">
                <button class="qty-btn" data-action="decrease" aria-label="Giảm số lượng">-</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn" data-action="increase" aria-label="Tăng số lượng">+</button>
              </div>
            </div>
            <div class="cart-item-actions">
              <span class="cart-item-subtotal">${formatCurrency(subtotal)}</span>
              <button class="remove-item-btn" data-action="remove">Xóa</button>
            </div>
          </div>`;
      })
      .join("");

    cartBody.innerHTML = itemsHtml;
    cartTotalEl.textContent = formatCurrency(getCartTotal());
  }

  // Xử lý các thao tác bên trong giỏ hàng bằng ủy quyền sự kiện (event delegation)
  cartBody.addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const cartItemEl = e.target.closest(".cart-item");
    const productId = cartItemEl.dataset.id;
    const action = btn.dataset.action;

    if (action === "increase") updateQuantity(productId, 1);
    if (action === "decrease") updateQuantity(productId, -1);
    if (action === "remove") removeFromCart(productId);
  });

  /* ============================================================
     6. MỞ / ĐÓNG GIỎ HÀNG (drawer)
     ============================================================ */
  function openCart() {
    cartDrawer.classList.add("open");
    overlay.classList.add("active");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // khóa cuộn trang nền
  }

  function closeCart() {
    cartDrawer.classList.remove("open");
    overlay.classList.remove("active");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  cartBtn.addEventListener("click", openCart);
  closeCartBtn.addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  checkoutBtn.addEventListener("click", function () {
    if (cart.length === 0) {
      showToast("Giỏ hàng đang trống, hãy chọn sản phẩm trước nhé!");
      return;
    }
    // Trong bài tập này chỉ mô phỏng thanh toán, không có backend thật
    showToast("Đặt hàng thành công! Cảm ơn bạn đã ủng hộ Bin Bin Teddy 💝");
    cart = [];
    saveCartToStorage();
    renderCart();
    closeCart();
  });

  /* ============================================================
     7. RENDER DANH SÁCH SẢN PHẨM (có tìm kiếm + lọc)
     ============================================================ */
  function renderProducts(list) {
    if (list.length === 0) {
      productGrid.innerHTML = "";
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    productGrid.innerHTML = list
      .map(
        (product) => `
        <article class="product-card" data-id="${product.id}">
          <div class="product-thumb">
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
            <img src="${product.image}" alt="${product.name}" loading="lazy">
          </div>
          <div class="product-info">
            <span class="product-category">${product.categoryLabel}</span>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${formatCurrency(product.price)}</p>
            <button class="add-to-cart-btn" data-action="add-to-cart">Thêm vào giỏ</button>
          </div>
        </article>`
      )
      .join("");
  }

  // Ủy quyền sự kiện click nút "Thêm vào giỏ" trên toàn bộ lưới sản phẩm
  productGrid.addEventListener("click", function (e) {
    const btn = e.target.closest('button[data-action="add-to-cart"]');
    if (!btn) return;
    const card = e.target.closest(".product-card");
    addToCart(card.dataset.id);
  });

  /* ============================================================
     8. TÌM KIẾM + LỌC SẢN PHẨM
     Mọi thay đổi ở ô tìm kiếm / bộ lọc đều gọi lại hàm này
     để tính toán danh sách sản phẩm cần hiển thị.
     ============================================================ */
  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const priceRange = priceFilter.value;

    const filtered = PRODUCTS.filter((product) => {
      // Điều kiện 1: tên sản phẩm chứa từ khóa tìm kiếm
      const matchKeyword = product.name.toLowerCase().includes(keyword);

      // Điều kiện 2: đúng loại sản phẩm (hoặc chọn "Tất cả")
      const matchCategory = category === "all" || product.category === category;

      // Điều kiện 3: nằm trong khoảng giá đã chọn (hoặc "Tất cả mức giá")
      let matchPrice = true;
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        matchPrice = product.price >= min && product.price <= max;
      }

      return matchKeyword && matchCategory && matchPrice;
    });

    renderProducts(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  categoryFilter.addEventListener("change", applyFilters);
  priceFilter.addEventListener("change", applyFilters);

  clearFiltersBtn.addEventListener("click", function () {
    searchInput.value = "";
    categoryFilter.value = "all";
    priceFilter.value = "all";
    applyFilters();
  });

  /* ============================================================
     9. MENU DI ĐỘNG (mobile nav toggle)
     ============================================================ */
  menuToggle.addEventListener("click", function () {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Đóng menu di động sau khi bấm chọn 1 mục điều hướng
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.addEventListener("click", function () {
      mainNav.classList.remove("open");
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");

      document.querySelectorAll("[data-nav]").forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  /* ============================================================
     10. KHỞI TẠO TRANG
     ============================================================ */
  function init() {
    renderProducts(PRODUCTS);
    renderCart();
  }

  init();
})();
