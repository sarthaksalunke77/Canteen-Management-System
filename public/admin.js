/* ─────────────────────────────────────────────────────────────
   ADMIN MODULE JAVASCRIPT
   Handles: Login, Dashboard, Orders, Menu CRUD, Reports
───────────────────────────────────────────────────────────── */

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 350); }, 3200);
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatTime(dt) {
  return new Date(dt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

function badgeHtml(status) {
  const cls = `badge badge-${status.toLowerCase()}`;
  return `<span class="${cls}">${status}</span>`;
}

// ── State ─────────────────────────────────────────────────────
let allOrders = [];
let allMenu   = [];
let charts    = {};
let deleteCallback = null;

// ── Login ─────────────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Logging in...';
  try {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('login-username').value,
        password: document.getElementById('login-password').value,
      }),
    });
    if (!resp.ok) { showToast('Invalid credentials', 'error'); return; }
    const data = await resp.json();
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-app').classList.remove('hidden');
    document.getElementById('admin-username-display').textContent = `Logged in as ${data.username}`;
    showToast(`Welcome back, ${data.username}!`, 'success');
    initAdmin();
  } catch {
    showToast('Login failed. Is server running?', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔑 Login to Dashboard';
  }
});

// Check existing session on load
(async function checkSession() {
  try {
    const resp = await fetch('/api/auth/status');
    const data = await resp.json();
    if (data.isAdmin) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('admin-app').classList.remove('hidden');
      document.getElementById('admin-username-display').textContent = `Logged in as ${data.username}`;
      initAdmin();
    }
  } catch { /* no-op, show login */ }
})();

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  location.reload();
});

// ── Navigation ────────────────────────────────────────────────
const views = ['dashboard', 'orders', 'menu', 'reports', 'qrcodes'];

function switchView(viewName) {
  views.forEach(v => {
    document.getElementById(`view-${v}`).classList.toggle('hidden', v !== viewName);
    document.getElementById(`nav-${v}`).classList.toggle('active', v === viewName);
  });

  if (viewName === 'dashboard') loadDashboard();
  if (viewName === 'orders')    loadOrders();
  if (viewName === 'menu')      loadMenu();
  if (viewName === 'reports')   loadReports();
  if (viewName === 'qrcodes')   initQRView();
}

document.querySelectorAll('.sidebar-nav-item').forEach(item => {
  item.addEventListener('click', () => switchView(item.dataset.view));
});

// ── Init ──────────────────────────────────────────────────────
function initAdmin() {
  const now = new Date();
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  document.getElementById('dash-date').textContent =
    `${dayNames[now.getDay()]}, ${now.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}`;
  loadDashboard();
  // Auto-refresh orders every 30s
  setInterval(loadOrders, 30000);
}

// ── Dashboard ─────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [summaryResp, menuResp] = await Promise.all([
      fetch('/api/reports/summary'),
      fetch('/api/menu'),
    ]);
    const summary = await summaryResp.json();
    const menu    = await menuResp.json();

    document.getElementById('stat-today-orders').textContent = summary.todayOrders;
    document.getElementById('stat-today-revenue').textContent = `₹${summary.todayRevenue}`;
    document.getElementById('stat-pending').textContent = summary.pendingOrders;
    document.getElementById('stat-menu-items').textContent = menu.length;

    // Pending badge in sidebar
    const pb = document.getElementById('pending-badge');
    if (summary.pendingOrders > 0) {
      pb.style.display = 'inline';
      pb.textContent = summary.pendingOrders;
    } else { pb.style.display = 'none'; }

    // Recent orders
    const tbody = document.getElementById('recent-orders-table');
    if (!summary.recentOrders || summary.recentOrders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:2rem;">No orders yet</td></tr>`;
      return;
    }
    tbody.innerHTML = summary.recentOrders.map(o => `
      <tr>
        <td><strong style="color:var(--accent);">#${String(o.id).padStart(4,'0')}</strong></td>
        <td>${escHtml(o.customer_name)}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${o.items.map(i => `${i.emoji||''} ${i.name} ×${i.qty}`).join(', ')}</td>
        <td><strong>₹${o.total}</strong></td>
        <td>${badgeHtml(o.status)}</td>
        <td style="color:var(--text-muted);font-size:0.82rem;">${formatTime(o.created_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load dashboard', 'error');
  }
}

// ── Orders ────────────────────────────────────────────────────
async function loadOrders() {
  try {
    const resp = await fetch('/api/orders');
    allOrders  = await resp.json();
    renderOrdersTable();
    // Update pending badge
    const pending = allOrders.filter(o => ['Received','Preparing'].includes(o.status)).length;
    const pb = document.getElementById('pending-badge');
    if (pending > 0) { pb.style.display='inline'; pb.textContent=pending; }
    else pb.style.display='none';
  } catch {
    showToast('Failed to load orders', 'error');
  }
}

function renderOrdersTable() {
  const filter = document.getElementById('order-status-filter').value;
  const filtered = filter === 'All' ? allOrders : allOrders.filter(o => o.status === filter);
  const tbody = document.getElementById('orders-table-body');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding:2rem;">No orders found</td></tr>`;
    return;
  }

  const statusOptions = ['Received','Preparing','Ready','Delivered','Cancelled'];
  tbody.innerHTML = filtered.map(o => {
    const isDineIn = (o.order_type || 'Dine In') === 'Dine In';
    const tableCell = isDineIn
      ? `<div style="font-weight:700;color:var(--accent);font-size:0.95rem;">🪑 ${escHtml(o.table_number || '—')}</div><div style="font-size:0.75rem;color:var(--text-muted);">Dine In</div>`
      : `<div style="font-weight:700;color:var(--purple-light);font-size:0.9rem;">🥡 Take Away</div>`;
    return `
    <tr>
      <td><strong style="color:var(--accent);">#${String(o.id).padStart(4,'0')}</strong></td>
      <td>
        <div class="font-semibold">${escHtml(o.customer_name)}</div>
        ${o.customer_phone ? `<div style="font-size:0.78rem;color:var(--text-muted);">${escHtml(o.customer_phone)}</div>` : ''}
      </td>
      <td style="max-width:200px;">
        <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.85rem;">${o.items.map(i=>`${i.emoji||''}${i.name}×${i.qty}`).join(', ')}</div>
      </td>
      <td><strong>₹${o.total}</strong></td>
      <td>${tableCell}</td>
      <td><span style="font-size:0.82rem;color:var(--text-secondary);">${escHtml(o.payment_method||'Cash')}</span></td>
      <td>${badgeHtml(o.status)}</td>
      <td style="color:var(--text-muted);font-size:0.8rem;">${formatTime(o.created_at)}</td>
      <td>
        <div style="display:flex;flex-direction:column;gap:0.4rem;">
          <select class="form-control" style="width:130px;padding:0.35rem 0.6rem;font-size:0.8rem;" data-order-id="${o.id}" onchange="updateOrderStatus(${o.id}, this.value)">
            ${statusOptions.map(s => `<option value="${s}"${s===o.status?' selected':''}>${s}</option>`).join('')}
          </select>
          <button onclick="downloadAdminReceipt(${o.id})" style="
            width:130px;padding:0.35rem 0.6rem;font-size:0.78rem;font-weight:700;
            background:linear-gradient(135deg,#10b981,#059669);color:white;
            border:none;border-radius:var(--radius-sm);cursor:pointer;
            font-family:inherit;display:flex;align-items:center;justify-content:center;gap:0.3rem;
          ">🧾 Download Bill</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const resp = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!resp.ok) throw new Error();
    const updated = await resp.json();
    const idx = allOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) allOrders[idx] = updated;
    renderOrdersTable();
    showToast(`Order #${String(orderId).padStart(4,'0')} → ${newStatus}`, 'success');
  } catch {
    showToast('Failed to update order status', 'error');
    loadOrders();
  }
}

document.getElementById('order-status-filter').addEventListener('change', renderOrdersTable);
document.getElementById('refresh-orders-btn').addEventListener('click', () => { loadOrders(); showToast('Orders refreshed', 'info'); });

// ── Download Receipt (Admin) ───────────────────────────────────
async function downloadAdminReceipt(orderId) {
  try {
    const resp = await fetch(`/api/orders/${orderId}`);
    if (!resp.ok) throw new Error('Order not found');
    const order = await resp.json();
    generateReceipt(order);
  } catch {
    showToast('Failed to load order for receipt', 'error');
  }
}

// ── Menu CRUD ─────────────────────────────────────────────────
async function loadMenu() {
  try {
    const resp = await fetch('/api/menu');
    allMenu    = await resp.json();
    renderMenuTable();
  } catch {
    showToast('Failed to load menu', 'error');
  }
}

function renderMenuTable() {
  const tbody = document.getElementById('menu-table-body');
  if (allMenu.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:2rem;">No menu items. Add one!</td></tr>`;
    return;
  }
  tbody.innerHTML = allMenu.map(item => `
    <tr>
      <td style="font-size:1.8rem;">${item.image_emoji || '🍽️'}</td>
      <td>
        <div class="font-semibold">${escHtml(item.name)}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);">${escHtml(item.description || '')}</div>
      </td>
      <td><span style="font-size:0.82rem;background:var(--glass);padding:0.2rem 0.6rem;border-radius:50px;color:var(--text-secondary);">${item.category}</span></td>
      <td><strong style="color:var(--accent);">₹${item.price}</strong></td>
      <td>
        <button class="btn btn-sm ${item.available ? 'btn-success' : 'btn-danger'}" onclick="toggleAvailable(${item.id}, ${item.available})">
          ${item.available ? '✅ Available' : '❌ Hidden'}
        </button>
      </td>
      <td>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn btn-secondary btn-sm" onclick="openEditForm(${item.id})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete(${item.id}, '${escHtml(item.name)}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

document.getElementById('add-item-btn').addEventListener('click', () => {
  document.getElementById('menu-form-title').textContent = 'Add New Item';
  document.getElementById('menu-item-form').reset();
  document.getElementById('edit-item-id').value = '';
  document.getElementById('item-emoji').value = '🍽️';
  document.getElementById('menu-form-card').style.display = 'block';
  document.getElementById('menu-form-card').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('cancel-form-btn').addEventListener('click', () => {
  document.getElementById('menu-form-card').style.display = 'none';
});

function openEditForm(itemId) {
  const item = allMenu.find(m => m.id === itemId);
  if (!item) return;
  document.getElementById('menu-form-title').textContent = 'Edit Menu Item';
  document.getElementById('edit-item-id').value = item.id;
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-price').value = item.price;
  document.getElementById('item-category').value = item.category;
  document.getElementById('item-emoji').value = item.image_emoji || '🍽️';
  document.getElementById('item-description').value = item.description || '';
  document.getElementById('menu-form-card').style.display = 'block';
  document.getElementById('menu-form-card').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('menu-item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = document.getElementById('edit-item-id').value;
  const payload = {
    name:        document.getElementById('item-name').value.trim(),
    price:       parseFloat(document.getElementById('item-price').value),
    category:    document.getElementById('item-category').value,
    image_emoji: document.getElementById('item-emoji').value.trim() || '🍽️',
    description: document.getElementById('item-description').value.trim(),
    available:   1,
  };

  try {
    let resp;
    if (editId) {
      resp = await fetch(`/api/menu/${editId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
    } else {
      resp = await fetch('/api/menu', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
    }
    if (!resp.ok) throw new Error();
    showToast(editId ? 'Item updated' : 'Item added', 'success');
    document.getElementById('menu-form-card').style.display = 'none';
    loadMenu();
  } catch {
    showToast('Failed to save item', 'error');
  }
});

async function toggleAvailable(itemId, current) {
  const item = allMenu.find(m => m.id === itemId);
  if (!item) return;
  try {
    await fetch(`/api/menu/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, available: current ? 0 : 1 }),
    });
    showToast(`Item ${current ? 'hidden' : 'made available'}`, 'success');
    loadMenu();
  } catch {
    showToast('Failed to update item', 'error');
  }
}

function confirmDelete(itemId, itemName) {
  document.getElementById('delete-modal-msg').textContent = `"${itemName}" will be permanently removed.`;
  deleteCallback = itemId;
  document.getElementById('delete-modal').classList.add('active');
}

document.getElementById('delete-cancel-btn').addEventListener('click', () => {
  document.getElementById('delete-modal').classList.remove('active');
  deleteCallback = null;
});

document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
  if (!deleteCallback) return;
  const itemId = deleteCallback;
  document.getElementById('delete-modal').classList.remove('active');
  deleteCallback = null;
  try {
    await fetch(`/api/menu/${itemId}`, { method: 'DELETE' });
    showToast('Item deleted', 'success');
    loadMenu();
  } catch {
    showToast('Failed to delete item', 'error');
  }
});

// ── Reports ───────────────────────────────────────────────────
async function loadReports() {
  try {
    const resp = await fetch('/api/reports/summary');
    const data = await resp.json();

    document.getElementById('rep-total-orders').textContent  = data.totalOrders;
    document.getElementById('rep-total-revenue').textContent = `₹${data.totalRevenue.toFixed(0)}`;
    document.getElementById('rep-today-orders').textContent  = data.todayOrders;
    document.getElementById('rep-today-revenue').textContent = `₹${data.todayRevenue.toFixed(0)}`;

    // Destroy old charts
    Object.values(charts).forEach(c => c.destroy());
    charts = {};

    const chartDefaults = {
      color: '#94a3b8',
      borderColor: 'rgba(255,255,255,0.1)',
    };

    // Status pie chart
    const statusCtx = document.getElementById('status-chart').getContext('2d');
    const statusLabels = data.statusBreakdown.map(s => s.status);
    const statusColors = {
      Received: '#3b82f6', Preparing: '#f59e0b', Ready: '#10b981',
      Delivered: '#8b5cf6', Cancelled: '#ef4444',
    };
    charts.status = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: statusLabels,
        datasets: [{
          data: data.statusBreakdown.map(s => s.count),
          backgroundColor: statusLabels.map(l => statusColors[l] || '#64748b'),
          borderWidth: 2, borderColor: '#0f1526',
          hoverOffset: 8,
        }],
      },
      options: {
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } },
        },
        cutout: '65%',
      },
    });

    // Category bar chart
    const catCtx = document.getElementById('category-chart').getContext('2d');
    charts.category = new Chart(catCtx, {
      type: 'bar',
      data: {
        labels: data.categoryStats.map(c => c.category),
        datasets: [{
          label: 'Items in Category',
          data: data.categoryStats.map(c => c.count),
          backgroundColor: ['rgba(249,115,22,0.7)','rgba(139,92,246,0.7)','rgba(20,184,166,0.7)','rgba(244,63,94,0.7)'],
          borderRadius: 8,
          borderWidth: 0,
        }],
      },
      options: {
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
        },
      },
    });
  } catch {
    showToast('Failed to load reports', 'error');
  }
}

// ── QR Code Generator ─────────────────────────────────────────
function initQRView() {
  // Auto-detect the base URL
  const baseUrl = window.location.origin;
  const urlInput = document.getElementById('qr-base-url');
  if (urlInput) urlInput.value = baseUrl;
}

function generateAllQRCodes() {
  const baseUrl    = document.getElementById('qr-base-url').value.trim() || window.location.origin;
  const tableCount = parseInt(document.getElementById('qr-table-count').value) || 6;
  const qrSize     = parseInt(document.getElementById('qr-size').value) || 240;
  const grid       = document.getElementById('qr-grid');

  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;"><div class="spinner"></div><p style="margin-top:1rem;color:var(--text-muted);">Generating QR codes...</p></div>';

  // Small delay for visual feedback
  setTimeout(() => {
    let html = '';
    for (let t = 1; t <= tableCount; t++) {
      const tableId  = `T${t}`;
      const menuUrl  = `${baseUrl}/?table=${tableId}&type=dine`;
      html += `
        <div class="qr-card" id="qr-card-${t}">
          <div class="qr-card-header">
            <span class="qr-table-icon">🪑</span>
            <div>
              <div class="qr-table-name">Table ${t}</div>
              <div class="qr-table-sub">Scan to order</div>
            </div>
          </div>
          <div class="qr-canvas-wrap">
            <div id="qr-div-${t}" style="width:${qrSize}px;height:${qrSize}px;"></div>
          </div>
          <div class="qr-url-label">${menuUrl}</div>
          <div class="qr-card-actions">
            <button class="btn btn-secondary btn-sm" onclick="downloadQR(${t}, '${tableId}')">
              ⬇️ Download
            </button>
            <button class="btn btn-primary btn-sm" onclick="printSingleQR(${t}, '${tableId}', '${menuUrl}')">
              🖨️ Print
            </button>
          </div>
        </div>
      `;
    }
    grid.innerHTML = html;

    // Render all QR codes using qrcodejs
    if (typeof QRCode === 'undefined') {
      showToast('QR library not loaded. Check internet connection.', 'error');
      return;
    }
    for (let t = 1; t <= tableCount; t++) {
      const tableId = `T${t}`;
      const menuUrl = `${baseUrl}/?table=${tableId}&type=dine`;
      const el      = document.getElementById(`qr-div-${t}`);
      if (el) {
        new QRCode(el, {
          text:            menuUrl,
          width:           qrSize,
          height:          qrSize,
          colorDark:       '#0a0e1a',
          colorLight:      '#ffffff',
          correctLevel:    QRCode.CorrectLevel.H,
        });
      }
    }
    showToast(`✅ Generated ${tableCount} QR codes!`, 'success');
  }, 100);
}


function downloadQR(tableNum, tableId) {
  const qrDiv = document.getElementById(`qr-div-${tableNum}`);
  if (!qrDiv) return;
  const img    = qrDiv.querySelector('img');
  const cvs    = qrDiv.querySelector('canvas');
  const src    = img ? img.src : (cvs ? cvs.toDataURL('image/png') : null);
  if (!src) { showToast('QR not ready yet', 'warning'); return; }

  const pad    = 24;
  const label  = `CMS Canteen \u2014 Table ${tableNum}`;
  const size   = 240;
  const off    = document.createElement('canvas');
  off.width    = size + pad * 2;
  off.height   = size + pad * 2 + 44;
  const ctx    = off.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, off.width, off.height);

  const image  = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    ctx.drawImage(image, pad, pad, size, size);
    ctx.fillStyle = '#0a0e1a';
    ctx.font      = 'bold 16px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, off.width / 2, size + pad + 30);
    const link   = document.createElement('a');
    link.download = `QR_Table_${tableNum}.png`;
    link.href     = off.toDataURL('image/png');
    link.click();
    showToast(`Downloaded QR for Table ${tableNum}`, 'success');
  };
  image.src = src;
}

function printSingleQR(tableNum, tableId, menuUrl) {
  const qrDiv  = document.getElementById(`qr-div-${tableNum}`);
  if (!qrDiv) return;
  const img     = qrDiv.querySelector('img');
  const cvs     = qrDiv.querySelector('canvas');
  const dataUrl = img ? img.src : (cvs ? cvs.toDataURL('image/png') : null);
  if (!dataUrl) { showToast('QR not ready yet', 'warning'); return; }
  const win = window.open('', '_blank', 'width=500,height=600');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Table ${tableNum} QR Code</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: Inter, Arial, sans-serif; background:#fff; color:#111; text-align:center; padding:2rem; }
        .logo { font-size:2.5rem; margin-bottom:0.5rem; }
        .title { font-size:1.5rem; font-weight:900; margin-bottom:0.25rem; }
        .subtitle { font-size:0.9rem; color:#666; margin-bottom:1.5rem; }
        img { width:240px; height:240px; display:block; margin:0 auto 1rem; border:4px solid #f97316; border-radius:12px; padding:8px; }
        .table-name { font-size:2rem; font-weight:900; color:#f97316; margin-bottom:0.25rem; }
        .instruction { font-size:0.85rem; color:#555; max-width:260px; margin:0 auto 1rem; }
        .url { font-size:0.7rem; color:#999; word-break:break-all; }
        .divider { border:none; border-top:1px dashed #ddd; margin:1rem 0; }
        @media print { body { padding:0.5cm; } }
      </style>
    </head>
    <body>
      <div class="logo">🍽️</div>
      <div class="title">CMS Canteen</div>
      <div class="subtitle">Student Canteen Management System</div>
      <hr class="divider">
      <div class="table-name">Table ${tableNum}</div>
      <img src="${dataUrl}" alt="QR Code for Table ${tableNum}">
      <p class="instruction">📱 Scan with your phone camera to browse the menu and place your order instantly!</p>
      <p class="url">${menuUrl}</p>
      <script>window.onload=function(){window.print();}<\/script>
    </body>
    </html>
  `);
  win.document.close();
}

function printAllQRCodes() {
  const grid = document.getElementById('qr-grid');
  const cards = grid.querySelectorAll('.qr-card');
  if (cards.length === 0) {
    showToast('Please generate QR codes first!', 'warning');
    return;
  }

  let imagesHtml = '';
  document.querySelectorAll('[id^="qr-card-"]').forEach(card => {
    const qrDiv  = card.querySelector('[id^="qr-div-"]');
    const label  = card.querySelector('.qr-table-name')?.textContent || 'Table';
    if (qrDiv) {
      const imgEl  = qrDiv.querySelector('img');
      const cvsEl  = qrDiv.querySelector('canvas');
      const src    = imgEl ? imgEl.src : (cvsEl ? cvsEl.toDataURL('image/png') : null);
      if (src) {
        imagesHtml += `
          <div class="print-card">
            <div class="print-logo">🍽️</div>
            <div class="print-canteen">CMS Canteen</div>
            <div class="print-table">${label}</div>
            <img src="${src}" alt="${label} QR">
            <p class="print-instruction">📱 Scan to order instantly</p>
          </div>
        `;
      }
    }
  });

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>All Table QR Codes – CMS Canteen</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: Inter, Arial, sans-serif; background:#fff; padding:1cm; }
        h1 { text-align:center; font-size:1.4rem; font-weight:900; margin-bottom:0.5rem; }
        .subtitle { text-align:center; color:#757575; font-size:0.85rem; margin-bottom:1.5rem; }
        .print-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1cm; }
        .print-card { text-align:center; border:2px solid #f0f0f0; border-radius:12px; padding:1rem; page-break-inside:avoid; }
        .print-logo { font-size:1.5rem; }
        .print-canteen { font-size:0.78rem; color:#888; margin-bottom:0.2rem; }
        .print-table { font-size:1.3rem; font-weight:900; color:#f97316; margin-bottom:0.5rem; }
        .print-card img { width:150px; height:150px; border:3px solid #f97316; border-radius:8px; padding:4px; }
        .print-instruction { font-size:0.7rem; color:#555; margin-top:0.5rem; }
        @media print { .print-grid { grid-template-columns:repeat(3,1fr); } }
      </style>
    </head>
    <body>
      <h1>🍽️ CMS Canteen – Table QR Codes</h1>
      <p class="subtitle">Print and place these on each table for instant menu access</p>
      <div class="print-grid">${imagesHtml}</div>
      <script>window.onload=function(){window.print();}<\/script>
    </body>
    </html>
  `);
  win.document.close();
  showToast('QR print window opened!', 'success');
}
c o n s t   s o c k e t   =   i o ( ) ;   s o c k e t . o n ( ' n e w _ o r d e r ' ,   ( )   = >   {   f e t c h L i v e O r d e r s ( ) ;   f e t c h D a s h b o a r d ( ) ;   } ) ;   s o c k e t . o n ( ' o r d e r _ s t a t u s _ u p d a t e ' ,   ( )   = >   {   f e t c h L i v e O r d e r s ( ) ;   } ) ;  
 