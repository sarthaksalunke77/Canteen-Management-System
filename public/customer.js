/* ─────────────────────────────────────────────────────────────
   CUSTOMER MODULE JAVASCRIPT
   Handles: Menu fetching, Cart, Checkout, Toasts
───────────────────────────────────────────────────────────── */

// ── State ────────────────────────────────────────────────────
const state = {
  menu: [],
  cart: JSON.parse(localStorage.getItem('cms_cart') || '[]'),
  activeCategory: 'All',
  searchQuery: '',
  lastOrder: null,   // stores last placed order for receipt
};

// ── DOM References ────────────────────────────────────────────
const menuGrid        = document.getElementById('menu-grid');
const cartBadge       = document.getElementById('cart-count-badge');
const cartItemsList   = document.getElementById('cart-items-list');
const cartFooter      = document.getElementById('cart-footer');
const cartTotal       = document.getElementById('cart-total');
const cartSidebar     = document.getElementById('cart-sidebar');
const cartOverlay     = document.getElementById('cart-overlay');
const checkoutModal   = document.getElementById('checkout-modal');
const confirmModal    = document.getElementById('confirm-modal');

// ── Toast Notification ───────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

// ── Fetch Menu ────────────────────────────────────────────────
async function fetchMenu() {
  try {
    const resp = await fetch('/api/menu');
    if (!resp.ok) throw new Error('Failed to load menu');
    state.menu = await resp.json();
    renderMenu();
  } catch (err) {
    menuGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">
      <p style="font-size:2rem;margin-bottom:1rem;">⚠️</p>
      <p>Could not load menu. Is the server running?</p>
    </div>`;
    showToast('Failed to load menu', 'error');
  }
}

// ── Food Image Resolver ───────────────────────────────────────
const FOOD_IMAGE_MAP = {
  // 1. Specific Tea variations (Checked before generic 'tea' / 'chai')
  'green tea': 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=500&auto=format&fit=crop',
  'lemon tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop',
  'iced tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop',
  'black tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop',
  'masala chai': '/images/masala_chai.jpg',
  'cutting chai': '/images/masala_chai.jpg',
  'chai': '/images/masala_chai.jpg',
  'tea': '/images/masala_chai.jpg',

  // 2. Specific Coffee variations (Checked before generic 'coffee')
  'cold coffee': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop',
  'iced coffee': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop',
  'hot coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop',
  'cappuccino': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop',
  'espresso': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop',
  'coffee': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop',

  // 3. Lassi & Yogurt drinks (Distinct from coffee & generic beverage!)
  'mango lassi': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop',
  'sweet lassi': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop',
  'lassi': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop',
  'chaas': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop',
  'buttermilk': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop',

  // 4. Shakes & Cold drinks
  'shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop',
  'milkshake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop',
  'smoothie': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop',
  'lime': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop',
  'lemonade': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop',
  'soda': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop',
  'juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&auto=format&fit=crop',

  // 5. Snacks & Food
  'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop',
  'dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop',
  'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop',
  'pulao': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop',
  'rice': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop',
  'noodle': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop',
  'chowmein': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop',
  'chinese': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop',
  'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop',
  'toast': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop',
  'paneer roll': '/images/paneer_roll.jpg',
  'roll': '/images/paneer_roll.jpg',
  'wrap': '/images/paneer_roll.jpg',
  'frankie': '/images/paneer_roll.jpg',
  'paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop',
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop',
  'vada pav': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop',
  'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop',
  'thali': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop',
  'gulab jamun': '/images/gulab_jamun.jpg',
  'jamun': '/images/gulab_jamun.jpg',
  'dessert': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop',
  'sweet': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop',
  'ice cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&auto=format&fit=crop',
  'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop',

  // 6. Generic Category Fallbacks (distinct image for each category!)
  'beverage': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop',
  'tea & coffee': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop',
  'snack': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop',
  'meal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop'
};

function getItemImage(item) {
  if (item && item.image_url && (item.image_url.startsWith('http') || item.image_url.startsWith('/'))) {
    if (!item.image_url.includes('photo-1610057099443-fde8c4d50f91') &&
        !item.image_url.includes('photo-1626777552726-4a6b54c97e46') &&
        !item.image_url.includes('photo-1576092768241-dec231879fc3')) {
      return item.image_url;
    }
  }
  const name = (item && item.name ? item.name : '').toLowerCase();
  const cat  = (item && item.category ? item.category : '').toLowerCase();
  for (const [key, url] of Object.entries(FOOD_IMAGE_MAP)) {
    if (name.includes(key)) return url;
  }
  for (const [key, url] of Object.entries(FOOD_IMAGE_MAP)) {
    if (cat.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop';
}

// ── Render Menu ───────────────────────────────────────────────
let menuListenerAttached = false;

function renderMenu() {
  const cat   = state.activeCategory;
  const query = (state.searchQuery || '').toLowerCase().trim();

  const filtered = state.menu.filter(item => {
    if (!item.available) return false;
    const matchQuery = !query ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query));

    // When searching, search across all items so nothing is hidden by active category tab!
    if (query) {
      return matchQuery;
    }
    const matchCat = cat === 'All' || item.category === cat;
    return matchCat;
  });

  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) {
    if (query.length > 0) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }

  const noResults = document.getElementById('menu-no-results');
  if (filtered.length === 0) {
    menuGrid.innerHTML = '';
    if (noResults) noResults.classList.remove('hidden');
    return;
  }
  if (noResults) noResults.classList.add('hidden');

  menuGrid.innerHTML = filtered.map(item => {
    const imgUrl = getItemImage(item);
    return `
    <article class="food-card${item.available ? '' : ' unavailable'}" data-id="${item.id}" role="button" tabindex="0" aria-label="Add ${escHtml(item.name)} to cart">
      <div class="food-card-img-wrap">
        <img class="food-card-img" src="${imgUrl}" alt="${escHtml(item.name)}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500';">
      </div>
      <div class="food-card-body">
        <div class="food-card-name">${escHtml(item.name)}</div>
        <div class="food-card-price">₹${item.price}</div>
        <button class="add-to-cart-btn btn-food-add" data-id="${item.id}" aria-label="Add ${escHtml(item.name)} to cart">
          🛒 Add to Cart
        </button>
      </div>
    </article>
    `;
  }).join('');

  if (!menuListenerAttached) {
    menuGrid.addEventListener('click', handleMenuClick);
    menuGrid.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleMenuClick(e); });
    menuListenerAttached = true;
  }
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function handleMenuClick(e) {
  const btn    = e.target.closest('.add-to-cart-btn');
  const card   = e.target.closest('.food-card') || e.target.closest('.menu-card');
  const itemId = btn?.dataset.id || card?.dataset.id;
  if (!itemId) return;
  addToCart(parseInt(itemId));
}

window.quickAddSpecial = function(itemName) {
  let item = state.menu.find(m => m.name.toLowerCase().includes(itemName.toLowerCase()));
  if (!item) {
    const defaults = {
      'Veg Biryani': { id: 991, name: 'Veg Biryani', price: 70, category: 'Meals', image_emoji: '🍚', available: 1 },
      'Paneer Roll': { id: 992, name: 'Paneer Roll', price: 60, category: 'Snacks', image_emoji: '🌯', available: 1 },
      'Cold Coffee': { id: 993, name: 'Cold Coffee', price: 40, category: 'Beverages', image_emoji: '☕', available: 1 }
    };
    item = defaults[itemName] || { id: Date.now(), name: itemName, price: 50, category: 'Snacks', image_emoji: '⭐', available: 1 };
    state.menu.push(item);
  }
  addToCart(item);
  openCart();
};

// ── Cart Logic ────────────────────────────────────────────────
function addToCart(itemOrId) {
  let item = typeof itemOrId === 'object' ? itemOrId : state.menu.find(m => m.id === itemOrId);
  if (!item) return;

  const existing = state.cart.find(c => c.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      emoji: item.image_emoji || '🍽️',
      qty: 1
    });
  }
  saveCart();
  renderCart();
  showToast(`${item.image_emoji || '🍽️'} ${item.name} added to cart`, 'success');

  // Animate badge
  if (cartBadge) {
    cartBadge.classList.remove('visible');
    void cartBadge.offsetWidth;
    cartBadge.classList.add('visible');
  }
}

function removeFromCart(itemId) {
  state.cart = state.cart.filter(c => c.id !== itemId);
  saveCart();
  renderCart();
}

function updateQty(itemId, delta) {
  const item = state.cart.find(c => c.id === itemId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(itemId);
  else { saveCart(); renderCart(); }
}

function saveCart() {
  localStorage.setItem('cms_cart', JSON.stringify(state.cart));
}

function getCartTotal() {
  return state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function getCartCount() {
  return state.cart.reduce((sum, i) => sum + i.qty, 0);
}

function renderCart() {
  const total = getCartTotal();
  const count = getCartCount();

  // Badge
  cartBadge.textContent = count;
  if (count > 0) cartBadge.classList.add('visible');
  else cartBadge.classList.remove('visible');

  // Total
  cartTotal.textContent = total;

  if (state.cart.length === 0) {
    cartItemsList.innerHTML = `
      <div class="cart-empty">
        <span class="empty-icon">🍽️</span>
        <p class="font-semibold">Your cart is empty</p>
        <p class="text-muted" style="font-size:0.85rem">Add items from the menu to get started</p>
      </div>`;
    cartFooter.style.display = 'none';
    return;
  }

  cartFooter.style.display = 'block';
  cartItemsList.innerHTML = state.cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <span class="cart-item-emoji">${item.emoji}</span>
      <div class="cart-item-info">
        <div class="cart-item-name">${escHtml(item.name)}</div>
        <div class="cart-item-price">₹${(item.price * item.qty)}</div>
      </div>
      <div class="quantity-control">
        <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease quantity">−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase quantity">+</button>
      </div>
    </div>
  `).join('');

  // Bind qty buttons
  cartItemsList.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const action = btn.dataset.action;
      updateQty(id, action === 'inc' ? 1 : -1);
    });
  });
}

// ── Cart Sidebar Toggle ───────────────────────────────────────
function openCart() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('cart-toggle-btn').addEventListener('click', openCart);
document.getElementById('cart-close-btn').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// ── Checkout ──────────────────────────────────────────────────
const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (state.cart.length === 0) { showToast('Your cart is empty!', 'warning'); return; }
    closeCart();
    // Populate preview
    const previewItems = document.getElementById('order-preview-items');
    if (previewItems) {
      previewItems.innerHTML = state.cart.map(i =>
        `<div class="d-flex justify-between" style="padding:0.3rem 0;font-size:0.85rem;">
          <span>${i.emoji || '🍽️'} ${escHtml(i.name)} × ${i.qty}</span>
          <span style="color:var(--accent);font-weight:600;">₹${i.price * i.qty}</span>
        </div>`
      ).join('');
    }
    const previewTotal = document.getElementById('order-preview-total');
    if (previewTotal) previewTotal.textContent = getCartTotal();
    const chkAmt = document.getElementById('checkout-amount');
    if (chkAmt) chkAmt.textContent = `₹${getCartTotal()}`;

    if (checkoutModal) checkoutModal.classList.add('active');
  });
}

const checkoutModalClose = document.getElementById('checkout-modal-close');
if (checkoutModalClose) {
  checkoutModalClose.addEventListener('click', () => {
    if (checkoutModal) checkoutModal.classList.remove('active');
  });
}
if (checkoutModal) {
  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) checkoutModal.classList.remove('active');
  });
}

// ── Order Type Toggle ─────────────────────────────────────────
function initOrderTypeToggle() {
  const dineRadio    = document.getElementById('order-type-dine');
  const takeRadio    = document.getElementById('order-type-takeaway');
  const lblDine      = document.getElementById('lbl-dine-in');
  const lblTake      = document.getElementById('lbl-takeaway');
  const tableGroup   = document.getElementById('table-number-group');
  const tableSelect  = document.getElementById('table-number');

  if (!dineRadio || !takeRadio || !lblDine || !lblTake || !tableGroup || !tableSelect) return;

  function updateToggle() {
    const isDineIn = dineRadio.checked;
    // Dine In label — active style
    lblDine.style.background    = isDineIn ? 'linear-gradient(135deg,var(--accent),var(--accent-dark))' : 'var(--glass)';
    lblDine.style.color         = isDineIn ? 'white' : 'var(--text-secondary)';
    lblDine.style.borderColor   = isDineIn ? 'var(--accent)' : 'var(--glass-border)';
    // Take Away label — active style
    lblTake.style.background    = !isDineIn ? 'linear-gradient(135deg,var(--purple),var(--purple-light))' : 'var(--glass)';
    lblTake.style.color         = !isDineIn ? 'white' : 'var(--text-secondary)';
    lblTake.style.borderColor   = !isDineIn ? 'var(--purple)' : 'var(--glass-border)';
    // Show/hide table number
    tableGroup.style.display    = isDineIn ? 'flex' : 'none';
    tableGroup.style.flexDirection = 'column';
    tableGroup.style.gap        = '0.4rem';
    tableSelect.required        = isDineIn;
    if (!isDineIn) tableSelect.value = '';
  }

  dineRadio.addEventListener('change', updateToggle);
  takeRadio.addEventListener('change', updateToggle);
  lblDine.addEventListener('click',  () => { dineRadio.checked = true; updateToggle(); });
  lblTake.addEventListener('click',  () => { takeRadio.checked = true; updateToggle(); });
  updateToggle(); // init state
}
initOrderTypeToggle();

const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('place-order-btn') || document.getElementById('confirm-order-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> Placing Order...';
    }

    const orderType   = document.querySelector('input[name="order_type"]:checked')?.value || 'Dine In';
    const tableNumber = orderType === 'Dine In' ? (document.getElementById('table-number')?.value || '') : '';

    if (orderType === 'Dine In' && !tableNumber) {
      showToast('Please select a table number', 'warning');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '✅ Confirm & Place Order';
      }
      return;
    }

  const payload = {
    customer_name:  document.getElementById('customer-name').value.trim(),
    customer_phone: document.getElementById('customer-phone').value.trim(),
    items:          state.cart,
    total:          getCartTotal(),
    payment_method: document.getElementById('payment-method').value,
    order_type:     orderType,
    table_number:   tableNumber,
  };

  try {
    const resp = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error('Order failed');
    const order = await resp.json();

    checkoutModal.classList.remove('active');
    document.getElementById('confirm-order-id').textContent = `#${String(order.id).padStart(4, '0')}`;
    document.getElementById('track-order-link').href = `/order-status?id=${order.id}`;
    state.lastOrder = order;   // save for receipt download
    confirmModal.classList.add('active');

    // Clear cart
    state.cart = [];
    saveCart();
    renderCart();
    document.getElementById('checkout-form').reset();
    showToast('🎉 Order placed successfully!', 'success');
    } catch (err) {
      showToast('Failed to place order. Try again.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '✅ Confirm & Place Order';
      }
    }
  });
}

document.getElementById('confirm-modal-close').addEventListener('click', () => {
  confirmModal.classList.remove('active');
});

// ── Download Receipt (Customer) ───────────────────────────────
document.getElementById('download-receipt-btn').addEventListener('click', () => {
  if (state.lastOrder) {
    generateReceipt(state.lastOrder);
  } else {
    showToast('No order to download. Place an order first.', 'warning');
  }
});

// ── Category Filter ───────────────────────────────────────────
document.getElementById('category-filter').addEventListener('click', (e) => {
  const btn = e.target.closest('.category-btn');
  if (!btn) return;
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.activeCategory = btn.dataset.category;
  renderMenu();
});

// ── Search & Clear Handlers ───────────────────────────────────
window.clearMenuSearch = function() {
  const sInput = document.getElementById('menu-search');
  if (sInput) sInput.value = '';
  state.searchQuery = '';
  state.activeCategory = 'All';
  document.querySelectorAll('.category-btn').forEach(b => {
    if (b.dataset.category === 'All') b.classList.add('active');
    else b.classList.remove('active');
  });
  renderMenu();
  if (sInput) sInput.focus();
};

let searchTimer;
const searchInput = document.getElementById('menu-search');
if (searchInput) {
  const onSearchChange = (val) => {
    state.searchQuery = val;
    renderMenu();
  };

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => onSearchChange(e.target.value), 120);
  });

  searchInput.addEventListener('search', (e) => {
    onSearchChange(e.target.value);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.clearMenuSearch();
      searchInput.blur();
    }
  });
}

// ── Search Trigger in Header ──────────────────────────────────
const searchTriggerBtn = document.getElementById('search-trigger-btn');
if (searchTriggerBtn) {
  searchTriggerBtn.addEventListener('click', () => {
    const sInput = document.getElementById('menu-search');
    if (sInput) {
      sInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        sInput.focus();
        sInput.classList.add('search-highlight');
        setTimeout(() => sInput.classList.remove('search-highlight'), 1800);
      }, 350);
    } else {
      document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// ── QR Code Table Pre-fill ────────────────────────────────────
function handleQRParams() {
  const params    = new URLSearchParams(window.location.search);
  const tableParam = params.get('table');   // e.g. "T3"
  const typeParam  = params.get('type');    // e.g. "dine"

  if (!tableParam) return;

  // Show QR arrival banner
  const tableNum = tableParam.replace('T', '');
  const banner   = document.createElement('div');
  banner.id      = 'qr-arrival-banner';
  banner.innerHTML = `
    <div style="
      position:fixed; top:68px; left:0; right:0; z-index:99;
      background:linear-gradient(135deg, #f97316, #8b5cf6);
      color:white; padding:0.75rem 1.5rem;
      display:flex; align-items:center; justify-content:space-between;
      gap:1rem; flex-wrap:wrap;
      box-shadow: 0 4px 20px rgba(249,115,22,0.35);
      animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    ">
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <span style="font-size:1.6rem;">🪑</span>
        <div>
          <div style="font-weight:800;font-size:1rem;">Welcome to Table ${tableNum}!</div>
          <div style="font-size:0.82rem;opacity:0.9;">Browse the menu and tap any item to add it to your order.</div>
        </div>
      </div>
      <button onclick="this.closest('#qr-arrival-banner').remove()" style="
        background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3);
        color:white; padding:0.4rem 0.9rem; border-radius:6px;
        cursor:pointer; font-weight:600; font-size:0.82rem; font-family:inherit;
        white-space:nowrap;
      ">✕ Dismiss</button>
    </div>
    <style>
      @keyframes slideDown {
        from { transform: translateY(-100%); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
      }
    </style>
  `;
  document.body.appendChild(banner);

  // Pre-fill checkout form once it's needed
  // Store in state so we can apply when checkout opens
  state.qrTable = tableParam;
  state.qrType  = typeParam;
}

function applyQRPreFill() {
  if (!state.qrTable) return;

  // Select Dine In if arriving from QR
  const dineRadio  = document.getElementById('order-type-dine');
  const takeRadio  = document.getElementById('order-type-takeaway');
  const tableSelect = document.getElementById('table-number');

  if (state.qrType === 'dine' || !state.qrType) {
    if (dineRadio) dineRadio.checked = true;
    // Trigger update
    dineRadio?.dispatchEvent(new Event('change'));
  } else {
    if (takeRadio) takeRadio.checked = true;
    takeRadio?.dispatchEvent(new Event('change'));
  }

  // Pre-select the table
  if (tableSelect) {
    tableSelect.value = state.qrTable;
    // If table not in list, add a temporary option
    if (!tableSelect.value) {
      const opt   = document.createElement('option');
      const num   = state.qrTable.replace('T', '');
      opt.value   = state.qrTable;
      opt.text    = `Table ${num} (QR)`;
      opt.selected = true;
      tableSelect.appendChild(opt);
    }
  }
}

// ── Feedback Module ───────────────────────────────────────────
function initFeedbackModule() {
  const starsGroup  = document.getElementById('star-rating-group');
  const ratingInput = document.getElementById('fb-rating');
  const ratingText  = document.getElementById('rating-text');
  const form        = document.getElementById('feedback-form');
  const feedbackList = document.getElementById('feedback-list');

  const ratingLabels = {
    1: '1.0 — Needs Improvement ⚠️',
    2: '2.0 — Fair',
    3: '3.0 — Good 👍',
    4: '4.0 — Very Good! ⭐',
    5: '5.0 — Excellent! 🎉'
  };

  // Interactive star clicks
  if (starsGroup) {
    const stars = starsGroup.querySelectorAll('.cc-star-icon');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val);
        if (ratingInput) ratingInput.value = val;
        stars.forEach(s => {
          const sVal = parseInt(s.dataset.val);
          if (sVal <= val) s.classList.add('active');
          else s.classList.remove('active');
        });
        if (ratingText) ratingText.textContent = ratingLabels[val] || `${val}.0`;
      });
    });
  }

  // Fetch & render reviews
  async function loadFeedback() {
    if (!feedbackList) return;
    try {
      const res = await fetch('/api/feedback');
      if (!res.ok) throw new Error('Failed to load feedback');
      const data = await res.json();
      renderFeedbackList(data);
    } catch (e) {
      feedbackList.innerHTML = `
        <div style="text-align:center;padding:1.5rem;color:#94a3b8;font-size:0.85rem;">
          Be the first student to leave a review!
        </div>`;
    }
  }

  function renderFeedbackList(items) {
    if (!feedbackList) return;
    if (!items || items.length === 0) {
      feedbackList.innerHTML = `
        <div style="text-align:center;padding:1.5rem;color:#94a3b8;font-size:0.85rem;">
          No reviews yet. Share your experience below!
        </div>`;
      return;
    }
    feedbackList.innerHTML = items.map(fb => `
      <div class="cc-review-card">
        <div class="cc-review-top">
          <div>
            <span class="cc-review-author">${escHtml(fb.name)}</span>
            <span class="cc-review-role">(${escHtml(fb.role || 'Student')})</span>
          </div>
          <div class="cc-review-stars">${'★'.repeat(fb.rating || 5)}${'☆'.repeat(5 - (fb.rating || 5))}</div>
        </div>
        <div class="cc-review-tag">${escHtml(fb.category || 'General')}</div>
        <p class="cc-review-msg">"${escHtml(fb.message)}"</p>
      </div>
    `).join('');
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('fb-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> Submitting...';
      }

      const payload = {
        name: document.getElementById('fb-name').value.trim(),
        role: document.getElementById('fb-role').value,
        rating: document.getElementById('fb-rating').value,
        category: document.getElementById('fb-category').value,
        message: document.getElementById('fb-message').value.trim(),
      };

      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Feedback submission failed');
        const data = await res.json();

        showToast('🎉 Thank you for your feedback!', 'success');
        form.reset();
        // Reset stars to 5
        if (starsGroup) {
          starsGroup.querySelectorAll('.cc-star-icon').forEach(s => s.classList.add('active'));
          if (ratingText) ratingText.textContent = ratingLabels[5];
          if (ratingInput) ratingInput.value = '5';
        }
        // Prepend review
        if (data.feedback) {
          const cardHtml = `
            <div class="cc-review-card" style="border-color:#10b981;">
              <div class="cc-review-top">
                <div>
                  <span class="cc-review-author">${escHtml(data.feedback.name)}</span>
                  <span class="cc-review-role">(${escHtml(data.feedback.role || 'Student')})</span>
                </div>
                <div class="cc-review-stars">${'★'.repeat(data.feedback.rating || 5)}</div>
              </div>
              <div class="cc-review-tag" style="background:#dcfce7;color:#166534;">${escHtml(data.feedback.category || 'General')}</div>
              <p class="cc-review-msg">"${escHtml(data.feedback.message)}"</p>
            </div>`;
          feedbackList.insertAdjacentHTML('afterbegin', cardHtml);
        }
      } catch (err) {
        showToast('Could not submit feedback. Try again.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '🚀 Submit Feedback';
        }
      }
    });
  }

  loadFeedback();
}

// ── Smooth Nav Link Active State ──────────────────────────────
function initNavLinks() {
  document.querySelectorAll('.cc-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          document.querySelectorAll('.cc-nav-link').forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });
  });
}

// ── Init ──────────────────────────────────────────────────────
(async function init() {
  renderCart();
  handleQRParams();
  initFeedbackModule();
  initNavLinks();
  await fetchMenu();

  // Patch checkout button to apply QR pre-fill before opening
  const chkBtn = document.getElementById('checkout-btn');
  if (chkBtn) {
    chkBtn.addEventListener('click', () => {
      setTimeout(applyQRPreFill, 50);
    }, true);
  }
})();
