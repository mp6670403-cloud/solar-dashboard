const express = require('express');
const db = require('../../db');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// DATA STORAGE (SYNCHRONIZED WITH IN-MEMORY DB)
// ============================================================================
let b2bPriceList = [
  { id: 1, product_name: 'Luminous Mono PERC 540W Panel', rate: 9200, category: 'Panels', stock_level: 150, reorder_level: 50 },
  { id: 2, product_name: 'Luminous Poly 335W Panel', rate: 5800, category: 'Panels', stock_level: 80, reorder_level: 30 },
  { id: 3, product_name: 'Luminous Solar Inverter 5kVA', rate: 45000, category: 'Inverters', stock_level: 25, reorder_level: 8 },
  { id: 4, product_name: 'Luminous Solar Inverter 10kVA', rate: 85000, category: 'Inverters', stock_level: 12, reorder_level: 5 },
];

let b2bClients = [
  { id: 1, business_name: 'Bhushan Solar Systems (EPC)', gstin: '08ABCDE1234F1Z5', contact: 'Manoj Bhushan', phone: '9876501234', state: 'Rajasthan', payment_behavior: 'Good', defaulter_status: 'No', pending_dues: 12000, credit_limit: 500000, status: 'Active' },
  { id: 2, business_name: 'Aditya Power EPC', gstin: '24GHIJK5678L2Z6', contact: 'Aditya Sen', phone: '9123450987', state: 'Gujarat', payment_behavior: 'Delayed', defaulter_status: 'No', pending_dues: 98000, credit_limit: 300000, status: 'Active' },
  { id: 3, business_name: 'Apex Green Solutions (EPC)', gstin: '07MNOPQ9012R3Z7', contact: 'Vijay Kadam', phone: '9988776655', state: 'Delhi', payment_behavior: 'Defaulter', defaulter_status: 'Yes', pending_dues: 245000, credit_limit: 150000, status: 'Flagged' },
];

let b2bVendors = [
  { id: 1, name: 'Luminous Power Technologies', gstin: '06AAAAL9876M1Z0', contact: 'info@luminous.com', phone: '18001033039', credit_balance: 450000 },
  { id: 2, name: 'Waaree Energies Ltd', gstin: '27AAAAA1111A1Z1', contact: 'sales@waaree.com', phone: '9820123456', credit_balance: 120000 },
  { id: 3, name: 'Growatt New Energy', gstin: '27BBBBB2222B2Z2', contact: 'service@growatt.com', phone: '9811223344', credit_balance: 0 }
];

let b2bOrders = [
  { id: 101, client_id: 1, client_name: 'Bhushan Solar Systems (EPC)', product_id: 1, product_name: 'Luminous Mono PERC 540W Panel', quantity: 50, rate: 9200, total_amount: 460000, status: 'Delivered', created_at: '2026-06-15T10:00:00Z', delivery_address: 'Jaipur, Rajasthan', booking_id: 'PRT-9821-DEL', logistics_partner: 'Porter', e_way_bill: 'EWB-2026-9812-A' },
  { id: 102, client_id: 2, client_name: 'Aditya Power EPC', product_id: 3, product_name: 'Luminous Solar Inverter 5kVA', quantity: 5, rate: 45000, total_amount: 225000, status: 'Confirmed', created_at: '2026-06-18T14:30:00Z', delivery_address: 'Ahmedabad, Gujarat', booking_id: 'PRT-1029-AHM', logistics_partner: 'VRL Logistics', e_way_bill: 'EWB-2026-1049-B' },
  { id: 103, client_id: 3, client_name: 'Apex Green Solutions (EPC)', product_id: 1, product_name: 'Luminous Mono PERC 540W Panel', quantity: 20, rate: 9500, total_amount: 190000, status: 'Pending Owner Approval', created_at: '2026-06-19T09:00:00Z', delivery_address: 'Dwarka, Delhi', booking_id: '', e_way_bill: '' },
  { id: 104, client_id: 1, client_name: 'Bhushan Solar Systems (EPC)', product_id: 2, product_name: 'Luminous Poly 335W Panel', quantity: 100, rate: 5800, total_amount: 580000, status: 'Dispatched', created_at: '2026-06-19T08:00:00Z', delivery_address: 'Ajmer, Rajasthan', booking_id: 'DEL-2039-44', logistics_partner: 'Delhivery', e_way_bill: 'EWB-2026-9999-DEMO' }
];

let b2bInvoices = [
  { id: 201, order_id: 101, client_name: 'Bhushan Solar Systems (EPC)', invoice_no: 'SLV-B2B-001', taxable_amount: 460000, cgst: 41400, sgst: 41400, igst: 0, total_amount: 542800, status: 'Paid', created_at: '2026-06-15T11:00:00Z', due_date: '2026-06-30' },
  { id: 202, order_id: 102, client_name: 'Aditya Power EPC', invoice_no: 'SLV-B2B-002', taxable_amount: 225000, cgst: 0, sgst: 0, igst: 40500, total_amount: 265500, status: 'Unpaid', created_at: '2026-06-18T15:00:00Z', due_date: '2026-07-03' },
  { id: 203, order_id: 104, client_name: 'Bhushan Solar Systems (EPC)', invoice_no: 'SLV-B2B-003', taxable_amount: 580000, cgst: 52200, sgst: 52200, igst: 0, total_amount: 684400, status: 'Unpaid', created_at: '2026-06-19T08:30:00Z', due_date: '2026-07-04' }
];

let b2bLedgers = [
  { id: 1, client_id: 1, type: 'Credit', amount: 542800, description: 'Invoice SLV-B2B-001 issued', created_at: '2026-06-15T11:00:00Z' },
  { id: 2, client_id: 1, type: 'Debit', amount: 542800, description: 'Payment received via RTGS Bank Transfer', created_at: '2026-06-16T12:00:00Z' },
  { id: 3, client_id: 2, type: 'Credit', amount: 265500, description: 'Invoice SLV-B2B-002 issued', created_at: '2026-06-18T15:00:00Z' }
];

let b2bStockInLogs = [
  { id: 1, date: '2026-06-10', supplier: 'Luminous Power Technologies', product_name: 'Luminous Mono PERC 540W Panel', quantity: 200, status: 'Confirmed', verified_by: 'Suresh Patel' }
];

// ============================================================================
// 1. STATS / METRICS
// ============================================================================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalSales = b2bOrders.filter(o => o.status !== 'Rejected').reduce((sum, o) => sum + o.total_amount, 0);
    const activeOrders = b2bOrders.filter(o => ['Confirmed', 'Dispatched', 'Pending Owner Approval'].includes(o.status)).length;
    const outstandingDues = b2bClients.reduce((sum, c) => sum + c.pending_dues, 0);
    const totalClients = b2bClients.length;

    res.json({
      totalSales,
      activeOrders,
      outstandingDues,
      totalClients,
      priceListCount: b2bPriceList.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch B2B stats' });
  }
});

// ============================================================================
// 2. CLIENTS / ACCOUNTS (EPC Buyers)
// ============================================================================
router.get('/clients', authenticateToken, async (req, res) => {
  res.json(b2bClients);
});

router.post('/clients', authenticateToken, async (req, res) => {
  const { business_name, gstin, contact, phone, state, credit_limit } = req.body;
  const newClient = {
    id: b2bClients.length + 1,
    business_name,
    gstin,
    contact,
    phone,
    state,
    payment_behavior: 'Good',
    defaulter_status: 'No',
    pending_dues: 0,
    credit_limit: parseFloat(credit_limit) || 200000,
    status: 'Active'
  };
  b2bClients.push(newClient);
  res.status(201).json(newClient);
});

router.put('/clients/:id', authenticateToken, async (req, res) => {
  const client = b2bClients.find(c => c.id == req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  
  const { defaulter_status, credit_limit, status } = req.body;
  if (defaulter_status !== undefined) client.defaulter_status = defaulter_status;
  if (credit_limit !== undefined) client.credit_limit = parseFloat(credit_limit);
  if (status !== undefined) client.status = status;
  
  res.json(client);
});

// ============================================================================
// 3. VENDORS / SUPPLIERS
// ============================================================================
router.get('/vendors', authenticateToken, async (req, res) => {
  res.json(b2bVendors);
});

router.post('/vendors', authenticateToken, async (req, res) => {
  const { name, gstin, contact, phone, credit_balance } = req.body;
  const newVendor = {
    id: b2bVendors.length + 1,
    name,
    gstin,
    contact,
    phone,
    credit_balance: parseFloat(credit_balance) || 0
  };
  b2bVendors.push(newVendor);
  res.status(201).json(newVendor);
});

// ============================================================================
// 4. PRICE LIST / PRODUCTS
// ============================================================================
router.get('/price-list', authenticateToken, async (req, res) => {
  res.json(b2bPriceList);
});

router.post('/price-list', authenticateToken, async (req, res) => {
  const { product_name, rate, category, stock_level, reorder_level } = req.body;
  const newItem = {
    id: b2bPriceList.length + 1,
    product_name,
    rate: parseFloat(rate),
    category: category || 'Panels',
    stock_level: parseInt(stock_level, 10) || 0,
    reorder_level: parseInt(reorder_level, 10) || 10
  };
  b2bPriceList.push(newItem);
  res.status(201).json(newItem);
});

router.put('/price-list/:id', authenticateToken, async (req, res) => {
  const item = b2bPriceList.find(p => p.id == req.params.id);
  if (!item) return res.status(404).json({ error: 'Product not found' });
  const { rate, stock_level, reorder_level } = req.body;
  if (rate !== undefined) item.rate = parseFloat(rate);
  if (stock_level !== undefined) item.stock_level = parseInt(stock_level, 10);
  if (reorder_level !== undefined) item.reorder_level = parseInt(reorder_level, 10);
  res.json(item);
});

// ============================================================================
// 5. ORDERS & QUOTATIONS
// ============================================================================
router.get('/orders', authenticateToken, async (req, res) => {
  res.json(b2bOrders);
});

router.post('/orders', authenticateToken, async (req, res) => {
  const { client_id, product_id, quantity, rate, delivery_address } = req.body;
  const client = b2bClients.find(c => c.id == client_id);
  const product = b2bPriceList.find(p => p.id == product_id);
  
  if (!client || !product) return res.status(400).json({ error: 'Invalid client or product selection' });
  
  const qty = parseInt(quantity, 10);
  const priceRate = parseFloat(rate) || product.rate;
  const total = qty * priceRate;

  // Stock check
  if (product.stock_level < qty) {
    return res.status(400).json({ error: `Insufficient stock. Available: ${product.stock_level}` });
  }

  const newOrder = {
    id: b2bOrders.length + 101,
    client_id: client.id,
    client_name: client.business_name,
    product_id: product.id,
    product_name: product.product_name,
    quantity: qty,
    rate: priceRate,
    total_amount: total,
    status: 'Pending Owner Approval',
    created_at: new Date().toISOString(),
    delivery_address: delivery_address || `${client.state}, India`,
    booking_id: '',
    e_way_bill: ''
  };
  b2bOrders.push(newOrder);
  res.status(201).json(newOrder);
});

router.put('/orders/:id', authenticateToken, async (req, res) => {
  const order = b2bOrders.find(o => o.id == req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  const { status, rate, booking_id, logistics_partner, e_way_bill } = req.body;
  
  if (rate !== undefined) {
    order.rate = parseFloat(rate);
    order.total_amount = order.quantity * order.rate;
  }
  
  if (status !== undefined) {
    order.status = status;
    
    // Automatically generate invoice and check E-Way Bill when order goes from "Pending Owner Approval" to "Confirmed"
    if (status === 'Confirmed') {
      const client = b2bClients.find(c => c.id === order.client_id);
      const isDifferentState = client && client.state.toLowerCase() !== 'rajasthan'; // default backend office is Rajasthan
      
      const taxable = order.total_amount;
      const taxRate = 0.18; // 18% standard GST for solar equipment
      
      let cgst = 0, sgst = 0, igst = 0;
      if (isDifferentState) {
        igst = taxable * taxRate;
      } else {
        cgst = (taxable * taxRate) / 2;
        sgst = (taxable * taxRate) / 2;
      }
      
      const invoiceNo = `SLV-B2B-${b2bInvoices.length + 201}`;
      const newInvoice = {
        id: b2bInvoices.length + 201,
        order_id: order.id,
        client_name: order.client_name,
        invoice_no: invoiceNo,
        taxable_amount: taxable,
        cgst,
        sgst,
        igst,
        total_amount: taxable + cgst + sgst + igst,
        status: 'Unpaid',
        created_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 15 Days payment terms
      };
      
      b2bInvoices.push(newInvoice);
      
      // Update client outstanding dues
      if (client) client.pending_dues += newInvoice.total_amount;

      // Update stock level of product
      const product = b2bPriceList.find(p => p.id == order.product_id);
      if (product) {
        product.stock_level = Math.max(0, product.stock_level - order.quantity);
      }
      
      // Update ledger
      b2bLedgers.push({
        id: b2bLedgers.length + 1,
        client_id: order.client_id,
        type: 'Credit',
        amount: newInvoice.total_amount,
        description: `Invoice ${invoiceNo} generated for Order #${order.id}`,
        created_at: new Date().toISOString()
      });
      
      // If amount > 50,000, auto-generate E-way Bill
      if (order.total_amount >= 50000) {
        order.e_way_bill = `EWB-2026-${Math.floor(1000 + Math.random() * 9000)}-SLV`;
      }
    }
    
    // Simulate WhatsApp Alert for Dispatch
    if (status === 'Dispatched') {
      const client = b2bClients.find(c => c.id === order.client_id);
      console.log(`[WHATSAPP ALERT SENT] 📱 To: ${client?.phone || 'Customer'} | Msg: Dear ${client?.business_name || 'Customer'}, your B2B order #${order.id} has been dispatched via ${logistics_partner || 'Transport'}. LR/Tracking No: ${booking_id}. E-Way Bill: ${e_way_bill || 'N/A'}`);
    }
  }
  
  if (booking_id !== undefined) order.booking_id = booking_id;
  if (logistics_partner !== undefined) order.logistics_partner = logistics_partner;
  if (e_way_bill !== undefined) order.e_way_bill = e_way_bill;
  
  res.json(order);
});

// ============================================================================
// 6. INVOICES & LEDGERS
// ============================================================================
router.get('/invoices', authenticateToken, async (req, res) => {
  res.json(b2bInvoices);
});

router.get('/ledgers', authenticateToken, async (req, res) => {
  res.json(b2bLedgers);
});

// ============================================================================
// 7. MANUAL ACTIONS (RECORD STOCK IN & RECORD PAYMENTS)
// ============================================================================

// Manually Stock In
router.post('/stock-in-manual', authenticateToken, async (req, res) => {
  const { vendor_id, product_id, quantity, rate } = req.body;
  const vendor = b2bVendors.find(v => v.id == vendor_id);
  const product = b2bPriceList.find(p => p.id == product_id);
  
  if (!vendor || !product) return res.status(400).json({ error: 'Invalid supplier vendor or product selection' });

  const qty = parseInt(quantity, 10);
  const costRate = parseFloat(rate) || product.rate;
  const totalCost = qty * costRate;

  // Increment stock level of product
  product.stock_level += qty;

  // Log stock record
  const newLog = {
    id: b2bStockInLogs.length + 1,
    date: new Date().toISOString().split('T')[0],
    supplier: vendor.name,
    product_name: product.product_name,
    quantity: qty,
    status: 'Confirmed',
    verified_by: req.user.full_name || 'Staff Member'
  };
  b2bStockInLogs.push(newLog);

  // Update vendor credit balance (payout dues to vendor)
  vendor.credit_balance += totalCost;

  res.status(201).json({
    message: `Recorded purchase: ${qty} units of ${product.product_name} added to stock. Supplier ${vendor.name} ledger updated.`,
    log: newLog
  });
});

// Manually Record Payment Receipt
router.post('/payments-manual', authenticateToken, async (req, res) => {
  const { invoice_id } = req.body;
  const invoice = b2bInvoices.find(i => i.id == invoice_id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  invoice.status = 'Paid';
  
  // Find order & client
  const order = b2bOrders.find(o => o.id == invoice.order_id);
  if (order) {
    order.status = 'Delivered';
    const client = b2bClients.find(c => c.id == order.client_id);
    if (client) {
      client.pending_dues = Math.max(0, client.pending_dues - invoice.total_amount);
      client.payment_behavior = 'Good';
      client.defaulter_status = 'No';
      
      // Record transaction in ledger
      b2bLedgers.push({
        id: b2bLedgers.length + 1,
        client_id: client.id,
        type: 'Debit',
        amount: invoice.total_amount,
        description: `Payment received in full for Invoice ${invoice.invoice_no}`,
        created_at: new Date().toISOString()
      });

      // Simulate WhatsApp Alert for Payment Receipt
      console.log(`[WHATSAPP ALERT SENT] 📱 To: ${client.phone} | Msg: Dear ${client.business_name}, we have received your payment of Rs. ${invoice.total_amount.toLocaleString('en-IN')} for Invoice ${invoice.invoice_no}. Thank you!`);
    }
  }

  res.json({
    message: `Payment registered successfully. Invoice marked Paid, client dues updated.`,
    invoice
  });
});

router.get('/stock-in-logs', authenticateToken, async (req, res) => {
  res.json(b2bStockInLogs);
});

module.exports = router;
