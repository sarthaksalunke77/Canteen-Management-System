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

// ── Render Menu ───────────────────────────────────────────────
function renderMenu() {
  const cat   = state.activeCategory;
  const query = state.searchQuery.toLowerCase();

  const filtered = state.menu.filter(item => {
    const matchCat   = cat === 'All' || item.category === cat;
    const matchQuery = !query || item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
    return matchCat && matchQuery && item.available;
  });

  const noResults = document.getElementById('menu-no-results');
  if (filtered.length === 0) {
    menuGrid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');

  menuGrid.innerHTML = filtered.map(item => `
    <article class="menu-card${item.available ? '' : ' unavailable'}" data-id="${item.id}" role="button" tabindex="0" aria-label="Add ${item.name} to cart">
      <span class="menu-emoji">${item.image_emoji || '🍽️'}</span>
      <div class="menu-name">${escHtml(item.name)}</div>
      <div class="menu-desc">${escHtml(item.description || '')}</div>
      <div class="menu-footer">
        <span class="menu-price">${item.price}</span>
        <button class="add-to-cart-btn" data-id="${item.id}" aria-label="Add ${item.name} to cart">+</button>
      </div>
    </article>
  `).join('');

  // Category badge
  const catBadge = document.createElement('span');
  catBadge.style.cssText = 'font-size:0.75rem;background:var(--glass);border:1px solid var(--glass-border);border-radius:50px;padding:0.2rem 0.7rem;color:var(--text-muted);margin-left:auto;';
  catBadge.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;

  menuGrid.addEventListener('click', handleMenuClick);
  menuGrid.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleMenuClick(e); });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function handleMenuClick(e) {
  const btn    = e.target.closest('.add-to-cart-btn');
  const card   = e.target.closest('.menu-card');
  const itemId = btn?.dataset.id || card?.dataset.id;
  if (!itemId) return;
  addToCart(parseInt(itemId));
}

// ── Cart Logic ────────────────────────────────────────────────
function addToCart(itemId) {
  const item = state.menu.find(m => m.id === itemId);
  if (!item || !item.available) return;

  const existing = state.cart.find(c => c.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ id: item.id, name: item.name, price: item.price, emoji: item.image_emoji || '🍽️', qty: 1 });
  }
  saveCart();
  renderCart();
  showToast(`${item.image_emoji} ${item.name} added to cart`, 'success');

  // Animate badge
  cartBadge.classList.remove('visible');
  void cartBadge.offsetWidth;
  cartBadge.classList.add('visible');
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
document.getElementById('checkout-btn').addEventListener('click', () => {
  if (state.cart.length === 0) { showToast('Your cart is empty!', 'warning'); return; }
  closeCart();
  // Populate preview
  document.getElementById('order-preview-items').innerHTML = state.cart.map(i =>
    `<div class="d-flex justify-between" style="padding:0.3rem 0;font-size:0.85rem;">
      <span>${i.emoji} ${escHtml(i.name)} × ${i.qty}</span>
      <span style="color:var(--accent);">₹${i.price * i.qty}</span>
    </div>`
  ).join('');
  document.getElementById('order-preview-total').textContent = getCartTotal();
  checkoutModal.classList.add('active');
});

document.getElementById('checkout-modal-close').addEventListener('click', () => {
  checkoutModal.classList.remove('active');
});
checkoutModal.addEventListener('click', (e) => { if (e.target === checkoutModal) checkoutModal.classList.remove('active'); });

// ── Order Type Toggle ─────────────────────────────────────────
function initOrderTypeToggle() {
  const dineRadio    = document.getElementById('order-type-dine');
  const takeRadio    = document.getElementById('order-type-takeaway');
  const lblDine      = document.getElementById('lbl-dine-in');
  const lblTake      = document.getElementById('lbl-takeaway');
  const tableGroup   = document.getElementById('table-number-group');
  const tableSelect  = document.getElementById('table-number');

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

document.getElementById('checkout-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Placing Order...';

  const orderType   = document.querySelector('input[name="order_type"]:checked')?.value || 'Dine In';
  const tableNumber = orderType === 'Dine In' ? document.getElementById('table-number').value : '';

  if (orderType === 'Dine In' && !tableNumber) {
    showToast('Please select a table number', 'warning');
    btn.disabled = false;
    btn.innerHTML = '✅ Confirm & Place Order';
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
    btn.disabled = false;
    btn.innerHTML = '✅ Confirm & Place Order';
  }
});

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

// ── Search ────────────────────────────────────────────────────
let searchTimer;
document.getElementById('menu-search').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.searchQuery = e.target.value;
    renderMenu();
  }, 200);
});

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

// ── Init ──────────────────────────────────────────────────────
(async function init() {
  renderCart();
  handleQRParams();
  await fetchMenu();

  // Patch checkout button to apply QR pre-fill before opening
  const originalCheckoutListener = () => {};
  const checkoutBtn = document.getElementById('checkout-btn');
  const originalClickHandler = checkoutBtn.onclick;
  checkoutBtn.addEventListener('click', () => {
    // Apply QR pre-fill after modal opens (next tick)
    setTimeout(applyQRPreFill, 50);
  }, true); // capture phase so it fires before the other listener
})();
c o n s t   s o c k e t   =   i o ( ) ;   s o c k e t . o n ( ' o r d e r _ s t a t u s _ u p d a t e ' ,   ( d a t a )   = >   {   f e t c h M y O r d e r s ( ) ;   } ) ;  
 