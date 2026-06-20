const express = require('express');
const db = require('../../db');
const { authenticateToken, checkRole } = require('../middleware/auth');
const { triggerWorkflow } = require('../../integrations/n8n');
const n8nConfig = require('../../config/n8n.config.json');
const {
  validateStockAvailability,
  validateCreditLimit,
  validateDuplicateTransaction,
  validateGSTIN,
  validateNegativeStock,
  validatePriceFloor
} = require('../middleware/rules');
const { auditLog } = require('../middleware/audit');
const { sendWhatsApp } = require('../../integrations/whatsapp');

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

// AI Pricing Memory (learning loop)
let b2bPricingMemory = [
  { id: 1, vendor_id: 1, vendor_name: 'Bhushan Solar Systems (EPC)', product_id: 1, product_name: 'Luminous Mono PERC 540W Panel', quantity_range: '20-50', margin_given: 8, approved_by: 'Owner', date: '2026-06-10' },
  { id: 2, vendor_id: 1, vendor_name: 'Bhushan Solar Systems (EPC)', product_id: 1, product_name: 'Luminous Mono PERC 540W Panel', quantity_range: '50-100', margin_given: 10, approved_by: 'Owner', date: '2026-06-12' },
  { id: 3, vendor_id: 2, vendor_name: 'Aditya Power EPC', product_id: 3, product_name: 'Luminous Solar Inverter 5kVA', quantity_range: '5-10', margin_given: 5, approved_by: 'Owner', date: '2026-06-15' },
];

// Task Lifecycle Tracking
let b2bTasks = [
  { id: 1, type: 'delivery', reference_id: 101, title: 'Deliver Order #101 to Bhushan Solar', assigned_to: 'Suresh Patel', status: 'Closed', proof_url: '', created_at: '2026-06-15T10:00:00Z', deadline: '2026-06-16T18:00:00Z', closed_at: '2026-06-16T14:00:00Z', proof_submitted: true, verified_by: 'Owner' },
  { id: 2, type: 'delivery', reference_id: 102, title: 'Deliver Order #102 to Aditya Power', assigned_to: 'Suresh Patel', status: 'In Progress', proof_url: '', created_at: '2026-06-18T14:30:00Z', deadline: '2026-06-20T18:00:00Z', closed_at: null, proof_submitted: false, verified_by: null },
];

// Vendor Credit Scores
let b2bCreditScores = [
  { vendor_id: 1, vendor_name: 'Bhushan Solar Systems (EPC)', score: 87, payment_on_time: 95, order_frequency: 'High', overdue_count: 1, last_calculated: '2026-06-19' },
  { vendor_id: 2, vendor_name: 'Aditya Power EPC', score: 52, payment_on_time: 60, order_frequency: 'Medium', overdue_count: 4, last_calculated: '2026-06-19' },
  { vendor_id: 3, vendor_name: 'Apex Green Solutions (EPC)', score: 28, payment_on_time: 30, order_frequency: 'Low', overdue_count: 8, last_calculated: '2026-06-19' },
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

const getB2BProduct = (req) => b2bPriceList.find(p => p.id == req.body.product_id);
const getRequestedQty = (req) => parseInt(req.body.quantity, 10) || 0;
const getB2BClient = (req) => b2bClients.find(c => c.id == req.body.client_id);
const getOrderTotal = (req) => {
  const product = b2bPriceList.find(p => p.id == req.body.product_id);
  const qty = parseInt(req.body.quantity, 10) || 0;
  const rate = parseFloat(req.body.rate) || (product ? product.rate : 0);
  return qty * rate;
};
const getB2BOrders = () => b2bOrders;

router.post('/orders',
  authenticateToken,
  validateStockAvailability(getB2BProduct, getRequestedQty),
  validateCreditLimit(getB2BClient, getOrderTotal),
  validateDuplicateTransaction(getB2BOrders),
  validatePriceFloor(getB2BProduct),
  auditLog('b2b_order_placed', (req) => `Client ID: ${req.body.client_id}, Product ID: ${req.body.product_id}, Qty: ${req.body.quantity}`),
  async (req, res) => {
  const { client_id, product_id, quantity, rate, delivery_address } = req.body;
  const client = b2bClients.find(c => c.id == client_id);
  const product = b2bPriceList.find(p => p.id == product_id);
  
  if (!client || !product) return res.status(400).json({ error: 'Invalid client or product selection' });
  
  const qty = parseInt(quantity, 10);
  const priceRate = parseFloat(rate) || product.rate;
  const total = qty * priceRate;

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

  // Trigger n8n webhook alert
  if (n8nConfig.workflows && n8nConfig.workflows.b2b_order_placed) {
    let ownerPhone = '917052051010';
    let botPhone = '6386434561';
    let wahaApiUrl = 'http://localhost:3000';
    let wahaApiKey = '';
    try {
      const settingsRes = await db.query(
        "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('owner_whatsapp_number', 'bot_whatsapp_number', 'waha_api_url', 'waha_api_key')"
      );
      settingsRes.rows.forEach(row => {
        if (row.setting_key === 'owner_whatsapp_number') ownerPhone = row.setting_value;
        if (row.setting_key === 'bot_whatsapp_number') botPhone = row.setting_value;
        if (row.setting_key === 'waha_api_url') wahaApiUrl = row.setting_value;
        if (row.setting_key === 'waha_api_key') wahaApiKey = row.setting_value;
      });
    } catch (dbErr) {
      console.warn('Could not read system settings from db:', dbErr.message);
    }

    triggerWorkflow(n8nConfig.workflows.b2b_order_placed.webhook_url, {
      order_id: newOrder.id,
      client_name: newOrder.client_name,
      product_name: newOrder.product_name,
      quantity: newOrder.quantity,
      total_amount: newOrder.total_amount,
      phone: client.phone,
      owner_phone: ownerPhone,
      bot_phone: botPhone,
      waha_api_url: wahaApiUrl,
      waha_api_key: wahaApiKey
    }).catch(err => console.warn('n8n B2B order alert failed:', err.message));
  }

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

      // Trigger n8n webhook confirmed alert
      if (n8nConfig.workflows && n8nConfig.workflows.b2b_order_confirmed) {
        let ownerPhone = '917052051010';
        let botPhone = '6386434561';
        let wahaApiUrl = 'http://localhost:3000';
        let wahaApiKey = '';
        try {
          const settingsRes = await db.query(
            "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('owner_whatsapp_number', 'bot_whatsapp_number', 'waha_api_url', 'waha_api_key')"
          );
          settingsRes.rows.forEach(row => {
            if (row.setting_key === 'owner_whatsapp_number') ownerPhone = row.setting_value;
            if (row.setting_key === 'bot_whatsapp_number') botPhone = row.setting_value;
            if (row.setting_key === 'waha_api_url') wahaApiUrl = row.setting_value;
            if (row.setting_key === 'waha_api_key') wahaApiKey = row.setting_value;
          });
        } catch (dbErr) {
          console.warn('Could not read system settings from db:', dbErr.message);
        }

        triggerWorkflow(n8nConfig.workflows.b2b_order_confirmed.webhook_url, {
          order_id: order.id,
          client_name: order.client_name,
          invoice_no: newInvoice.invoice_no,
          total_amount: newInvoice.total_amount,
          phone: client ? client.phone : '',
          owner_phone: ownerPhone,
          bot_phone: botPhone,
          waha_api_url: wahaApiUrl,
          waha_api_key: wahaApiKey
        }).catch(err => console.warn('n8n B2B confirmed alert failed:', err.message));
      }
    }
    
    // Trigger WhatsApp Alert for Dispatch via n8n
    if (status === 'Dispatched') {
      const client = b2bClients.find(c => c.id === order.client_id);
      const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track?orderId=${order.id}`;
      
      if (n8nConfig.workflows && n8nConfig.workflows.b2b_order_dispatched) {
        let ownerPhone = '917052051010';
        let botPhone = '6386434561';
        let wahaApiUrl = 'http://localhost:3000';
        let wahaApiKey = '';
        try {
          const settingsRes = await db.query(
            "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('owner_whatsapp_number', 'bot_whatsapp_number', 'waha_api_url', 'waha_api_key')"
          );
          settingsRes.rows.forEach(row => {
            if (row.setting_key === 'owner_whatsapp_number') ownerPhone = row.setting_value;
            if (row.setting_key === 'bot_whatsapp_number') botPhone = row.setting_value;
            if (row.setting_key === 'waha_api_url') wahaApiUrl = row.setting_value;
            if (row.setting_key === 'waha_api_key') wahaApiKey = row.setting_value;
          });
        } catch (dbErr) {
          console.warn('Could not read system settings from db:', dbErr.message);
        }

        triggerWorkflow(n8nConfig.workflows.b2b_order_dispatched.webhook_url, {
          order_id: order.id,
          client_name: order.client_name,
          logistics_partner: logistics_partner || order.logistics_partner || 'Courier',
          tracking_no: booking_id || order.booking_id || 'N/A',
          e_way_bill: e_way_bill || order.e_way_bill || 'N/A',
          tracking_url: trackingUrl,
          phone: client ? client.phone : '',
          owner_phone: ownerPhone,
          bot_phone: botPhone,
          waha_api_url: wahaApiUrl,
          waha_api_key: wahaApiKey
        }).catch(err => console.warn('n8n B2B dispatch alert failed:', err.message));
      }
      const messageText = `Dear ${client?.business_name || 'Customer'}, your B2B order #${order.id} has been dispatched. Track live: ${trackingUrl}`;
      sendWhatsApp(client?.phone || '', messageText).catch(err => console.error('Failed to send dispatch WhatsApp alert:', err.message));
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

      // Send WhatsApp Alert for Payment Receipt
      const messageText = `Dear ${client.business_name}, we have received your payment of Rs. ${invoice.total_amount.toLocaleString('en-IN')} for Invoice ${invoice.invoice_no}. Thank you!`;
      sendWhatsApp(client.phone, messageText).catch(err => console.error('Failed to send payment WhatsApp alert:', err.message));
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

// GET /api/b2b/track/:id (PUBLIC tracking endpoint for dealers)
router.get('/track/:id', async (req, res) => {
  const order = b2bOrders.find(o => o.id == req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  // Find associated invoice
  const invoice = b2bInvoices.find(i => i.order_id == order.id);
  
  res.json({
    id: order.id,
    client_name: order.client_name,
    product_name: order.product_name,
    quantity: order.quantity,
    status: order.status,
    created_at: order.created_at,
    delivery_address: order.delivery_address,
    logistics_partner: order.logistics_partner || null,
    booking_id: order.booking_id || null,
    e_way_bill: order.e_way_bill || null,
    invoice: invoice || null
  });
});

// ============================================================================
// 8. AI PRICING MEMORY (Learning Loop)
// ============================================================================
router.get('/pricing-memory', authenticateToken, (req, res) => { res.json(b2bPricingMemory); });
router.get('/pricing-memory/:vendor_id', authenticateToken, (req, res) => {
  const vendorMemory = b2bPricingMemory.filter(m => m.vendor_id == req.params.vendor_id);
  res.json(vendorMemory);
});
router.post('/pricing-memory', authenticateToken, (req, res) => {
  const { vendor_id, vendor_name, product_id, product_name, quantity_range, margin_given } = req.body;
  const newMemory = {
    id: b2bPricingMemory.length + 1,
    vendor_id: parseInt(vendor_id), vendor_name, product_id: parseInt(product_id), product_name,
    quantity_range, margin_given: parseFloat(margin_given),
    approved_by: req.user?.full_name || 'Owner',
    date: new Date().toISOString().split('T')[0]
  };
  b2bPricingMemory.push(newMemory);
  res.status(201).json(newMemory);
});

// AI Price Suggestion (Learning Loop)
router.get('/price-suggest/:vendor_id/:product_id', authenticateToken, (req, res) => {
  const { vendor_id, product_id } = req.params;
  const quantity = parseInt(req.query.quantity) || 1;
  const memories = b2bPricingMemory.filter(m => m.vendor_id == vendor_id && m.product_id == product_id);
  const product = b2bPriceList.find(p => p.id == product_id);
  const vendor = b2bClients.find(c => c.id == vendor_id);
  
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  let suggestion = { confidence: 'low', recommended_margin: 0, reason: '' };
  
  if (memories.length >= 5) {
    const avgMargin = memories.reduce((sum, m) => sum + m.margin_given, 0) / memories.length;
    suggestion = { confidence: 'high', recommended_margin: Math.round(avgMargin * 10) / 10, reason: `${memories.length} past decisions se calculate kiya (Phase 3 — Confident)` };
  } else if (memories.length >= 2) {
    const avgMargin = memories.reduce((sum, m) => sum + m.margin_given, 0) / memories.length;
    suggestion = { confidence: 'medium', recommended_margin: Math.round(avgMargin * 10) / 10, reason: `${memories.length} past decisions hai — suggest kar raha hun (Phase 2)` };
  } else {
    suggestion = { confidence: 'low', recommended_margin: 0, reason: 'Insufficient data — Owner se poochna padega (Phase 1)' };
  }
  
  const suggestedRate = product.rate * (1 - suggestion.recommended_margin / 100);
  res.json({
    vendor_name: vendor?.business_name || 'Unknown',
    product_name: product.product_name,
    base_rate: product.rate,
    suggested_margin: suggestion.recommended_margin,
    suggested_rate: Math.round(suggestedRate),
    confidence: suggestion.confidence,
    reason: suggestion.reason,
    history_count: memories.length,
    memories: memories.slice(-5)
  });
});

// ============================================================================
// 9. TASK LIFECYCLE
// ============================================================================
router.get('/tasks', authenticateToken, (req, res) => { res.json(b2bTasks); });
router.post('/tasks', authenticateToken, (req, res) => {
  const { type, reference_id, title, assigned_to, deadline } = req.body;
  const newTask = {
    id: b2bTasks.length + 1, type, reference_id: parseInt(reference_id),
    title, assigned_to, status: 'Created',
    proof_url: '', created_at: new Date().toISOString(),
    deadline: deadline || new Date(Date.now() + 24*60*60*1000).toISOString(),
    closed_at: null, proof_submitted: false, verified_by: null
  };
  b2bTasks.push(newTask);
  res.status(201).json(newTask);
});
router.put('/tasks/:id', authenticateToken, (req, res) => {
  const task = b2bTasks.find(t => t.id == req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { status, proof_url, verified_by } = req.body;
  
  // Rule B1: Cannot close without proof
  if (status === 'Closed' && !task.proof_submitted && !proof_url) {
    return res.status(400).json({
      error: 'Task cannot be closed without proof',
      rule_violated: 'B1_PROOF_REQUIRED',
      suggestion: 'Pehle proof (photo/document) submit karo, phir close karo'
    });
  }
  
  if (status) task.status = status;
  if (proof_url) { task.proof_url = proof_url; task.proof_submitted = true; }
  if (verified_by) task.verified_by = verified_by;
  if (status === 'Closed') task.closed_at = new Date().toISOString();
  
  res.json(task);
});

// ============================================================================
// 10. CREDIT SCORES
// ============================================================================
router.get('/credit-scores', authenticateToken, (req, res) => { res.json(b2bCreditScores); });
router.get('/credit-scores/:vendor_id', authenticateToken, (req, res) => {
  const score = b2bCreditScores.find(s => s.vendor_id == req.params.vendor_id);
  if (!score) return res.status(404).json({ error: 'Credit score not found' });
  res.json(score);
});

// ============================================================================
// 11. DAILY REPORT
// ============================================================================
router.get('/daily-report', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = b2bOrders.filter(o => o.created_at.startsWith(today));
  const pendingPayments = b2bInvoices.filter(i => i.status === 'Unpaid');
  const lowStock = b2bPriceList.filter(p => p.stock_level <= p.reorder_level);
  const totalRevenue = b2bOrders.filter(o => o.status !== 'Rejected').reduce((sum, o) => sum + o.total_amount, 0);
  const overdueTasks = b2bTasks.filter(t => t.status !== 'Closed' && new Date(t.deadline) < new Date());
  
  res.json({
    date: today,
    stock_summary: b2bPriceList.map(p => ({ name: p.product_name, stock: p.stock_level, low: p.stock_level <= p.reorder_level })),
    low_stock_alerts: lowStock.map(p => ({ name: p.product_name, stock: p.stock_level, reorder: p.reorder_level })),
    today_orders: { count: todayOrders.length, items: todayOrders },
    pending_payments: { count: pendingPayments.length, total: pendingPayments.reduce((s, i) => s + i.total_amount, 0), items: pendingPayments },
    overdue_tasks: { count: overdueTasks.length, items: overdueTasks },
    total_revenue: totalRevenue,
    active_clients: b2bClients.filter(c => c.status === 'Active').length,
    defaulter_clients: b2bClients.filter(c => c.defaulter_status === 'Yes').length
  });
});

module.exports = router;
