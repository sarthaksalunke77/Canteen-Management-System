/* ──────────────────────────────────────────────────────────────
   RECEIPT GENERATOR — Canteen Bill PDF / Print
   Used by both customer.js and admin.js
   Call: generateReceipt(order)  where order has:
     id, customer_name, customer_phone, items[], total,
     payment_method, order_type, table_number, created_at, status
────────────────────────────────────────────────────────────── */

function generateReceipt(order) {
  const items = order.items || [];

  const formatDate = (dt) => {
    const d = dt ? new Date(dt) : new Date();
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const orderId = String(order.id || '').padStart(4, '0');
  const tableInfo = (order.order_type === 'Take Away' || !order.order_type)
    ? '🥡 Take Away'
    : `🪑 Dine In — ${order.table_number || 'Table'}`;

  const itemRows = items.map(i => `
    <tr>
      <td>${i.emoji || ''} ${i.name}</td>
      <td class="center">${i.qty}</td>
      <td class="right">₹${i.price}</td>
      <td class="right">₹${(i.price * i.qty)}</td>
    </tr>
  `).join('');

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt #${orderId} — CMS Canteen</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #f0f4f8;
      display: flex; align-items: flex-start; justify-content: center;
      min-height: 100vh;
      padding: 2rem 1rem;
    }

    .receipt {
      background: white;
      width: 420px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.15);
    }

    /* Header */
    .receipt-header {
      background: linear-gradient(135deg, #f97316, #c2410c);
      color: white;
      padding: 2rem 1.5rem 1.5rem;
      text-align: center;
    }
    .receipt-logo { font-size: 2.8rem; margin-bottom: 0.5rem; }
    .receipt-brand { font-size: 1.3rem; font-weight: 900; letter-spacing: -0.02em; }
    .receipt-tagline { font-size: 0.8rem; opacity: 0.8; margin-top: 0.2rem; }
    .receipt-order-id {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.35);
      border-radius: 50px;
      padding: 0.3rem 1rem;
      font-size: 0.85rem; font-weight: 700;
      margin-top: 1rem;
      letter-spacing: 0.05em;
    }

    /* Status bar */
    .receipt-status-bar {
      background: #1e293b;
      color: white;
      padding: 0.6rem 1.5rem;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 0.8rem;
    }
    .status-pill {
      background: #22c55e;
      color: white;
      padding: 0.2rem 0.75rem;
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-pill.pending   { background: #f59e0b; }
    .status-pill.preparing { background: #3b82f6; }
    .status-pill.cancelled { background: #ef4444; }

    /* Body */
    .receipt-body { padding: 1.5rem; }

    /* Info grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px dashed #e2e8f0;
    }
    .info-item .label {
      font-size: 0.7rem; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.07em;
      margin-bottom: 0.2rem;
    }
    .info-item .value {
      font-size: 0.9rem; font-weight: 600; color: #1e293b;
    }

    /* Items table */
    .items-title {
      font-size: 0.75rem; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.07em;
      margin-bottom: 0.75rem;
    }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      font-size: 0.72rem; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.05em;
      padding: 0.4rem 0;
      border-bottom: 1px solid #e2e8f0;
    }
    thead th.right { text-align: right; }
    thead th.center { text-align: center; }
    tbody td {
      padding: 0.6rem 0;
      font-size: 0.9rem; color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    td.right  { text-align: right; font-weight: 600; }
    td.center { text-align: center; color: #64748b; }

    /* Totals */
    .totals {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px dashed #e2e8f0;
    }
    .total-row {
      display: flex; justify-content: space-between;
      font-size: 0.88rem; color: #64748b;
      padding: 0.25rem 0;
    }
    .total-row.grand {
      font-size: 1.2rem; font-weight: 900;
      color: #1e293b; margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 2px solid #1e293b;
    }
    .total-row.grand .amount { color: #f97316; }

    /* Payment method */
    .payment-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #f0fdf4; border: 1px solid #86efac;
      border-radius: 50px; padding: 0.35rem 0.85rem;
      font-size: 0.82rem; font-weight: 600; color: #16a34a;
      margin-top: 1rem;
    }

    /* Footer */
    .receipt-footer {
      background: #f8fafc;
      border-top: 2px dashed #e2e8f0;
      padding: 1.5rem;
      text-align: center;
    }
    .thank-you {
      font-size: 1.1rem; font-weight: 800; color: #1e293b;
      margin-bottom: 0.4rem;
    }
    .footer-note { font-size: 0.78rem; color: #94a3b8; line-height: 1.5; }
    .barcode {
      font-family: 'Courier New', monospace;
      font-size: 0.7rem; color: #cbd5e1;
      letter-spacing: 0.3em;
      margin-top: 1rem;
    }

    /* Print Styles */
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; border-radius: 0; width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt">

    <!-- Header -->
    <div class="receipt-header">
      <div class="receipt-logo">🍽️</div>
      <div class="receipt-brand">CMS Canteen</div>
      <div class="receipt-tagline">School of Engineering & Technology</div>
      <div class="receipt-order-id">ORDER #${orderId}</div>
    </div>

    <!-- Status Bar -->
    <div class="receipt-status-bar">
      <span>${formatDate(order.created_at)}</span>
      <span class="status-pill ${
        order.status === 'Delivered' ? '' :
        order.status === 'Cancelled' ? 'cancelled' :
        order.status === 'Ready' ? '' :
        'preparing'
      }">${order.status || 'Received'}</span>
    </div>

    <!-- Body -->
    <div class="receipt-body">

      <!-- Info grid -->
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Customer</div>
          <div class="value">${order.customer_name || '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">Phone</div>
          <div class="value">${order.customer_phone || '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">Order Type</div>
          <div class="value">${tableInfo}</div>
        </div>
        <div class="info-item">
          <div class="label">Payment</div>
          <div class="value">${order.payment_method || 'Cash'}</div>
        </div>
      </div>

      <!-- Items -->
      <div class="items-title">Order Items</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="center">Qty</th>
            <th class="right">Rate</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:1rem 0;">No items</td></tr>'}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>₹${subtotal}</span>
        </div>
        <div class="total-row">
          <span>Tax / GST</span>
          <span style="color:#22c55e;">Included</span>
        </div>
        <div class="total-row grand">
          <span>Total Paid</span>
          <span class="amount">₹${order.total}</span>
        </div>
      </div>

      <!-- Payment badge -->
      <div>
        <span class="payment-badge">✅ ${order.payment_method || 'Cash'} — Payment ${order.status === 'Cancelled' ? 'Cancelled' : 'Confirmed'}</span>
      </div>

    </div>

    <!-- Footer -->
    <div class="receipt-footer">
      <div class="thank-you">🎉 Thank you for your order!</div>
      <div class="footer-note">
        Please keep this receipt for your reference.<br>
        For queries, contact the canteen counter.
      </div>
      <div class="barcode">||| ${orderId} ||| CMS-CANTEEN |||</div>
    </div>

    <!-- Print / Download Buttons (hidden in print) -->
    <div class="no-print" style="padding:1rem 1.5rem;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;gap:0.75rem;">
      <button onclick="window.print()" style="
        flex:1;padding:0.75rem;border:none;border-radius:8px;cursor:pointer;
        background:linear-gradient(135deg,#f97316,#c2410c);color:white;
        font-family:inherit;font-size:0.9rem;font-weight:700;
      ">🖨️ Print Receipt</button>
      <button onclick="window.close()" style="
        flex:1;padding:0.75rem;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;
        background:white;color:#64748b;
        font-family:inherit;font-size:0.9rem;font-weight:600;
      ">✕ Close</button>
    </div>

  </div>
</body>
</html>`;

  // Open receipt in a new popup window
  const popup = window.open('', '_blank', 'width=480,height=750,scrollbars=yes,resizable=yes');
  if (!popup) {
    alert('Please allow popups for this site to download your receipt.');
    return;
  }
  popup.document.open();
  popup.document.write(receiptHtml);
  popup.document.close();
  // Auto-trigger print after fonts load
  popup.onload = () => {
    setTimeout(() => popup.print(), 600);
  };
}
