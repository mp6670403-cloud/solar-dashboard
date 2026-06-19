const express = require('express');
const db = require('../../db');
const { authenticateToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/inventory
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM inventory ORDER BY stock_level ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/inventory (Add new item)
router.post('/', authenticateToken, checkRole(['Owner', 'B2B Sales', 'Operations']), async (req, res) => {
  const { item_name, item_code, stock_level, price, supplier } = req.body;

  if (!item_name || !item_code || stock_level === undefined || price === undefined) {
    return res.status(400).json({ error: 'Item name, code, stock level, and price are required' });
  }

  try {
    const queryText = `
      INSERT INTO inventory (item_name, item_code, stock_level, price, supplier, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const result = await db.query(queryText, [item_name, item_code, Number(stock_level), Number(price), supplier || '']);
    
    // Log action
    await db.query(
      'INSERT INTO system_logs (user_role, action_type, details) VALUES ($1, $2, $3)',
      [req.user.designation, 'Inventory Add', `Added inventory item: ${item_name} (${item_code})`]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// PUT /api/inventory/:id (Update stock levels / details)
router.put('/:id', authenticateToken, checkRole(['Owner', 'B2B Sales', 'Operations']), async (req, res) => {
  const { id } = req.params;
  const { stock_level, price, supplier } = req.body;

  try {
    const checkItem = await db.query('SELECT * FROM inventory WHERE id = $1', [id]);
    if (checkItem.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    const item = checkItem.rows[0];

    const newStock = stock_level !== undefined ? Number(stock_level) : item.stock_level;
    const newPrice = price !== undefined ? Number(price) : item.price;
    const newSupplier = supplier !== undefined ? supplier : item.supplier;

    const queryText = `
      UPDATE inventory
      SET stock_level = $1, price = $2, supplier = $3
      WHERE id = $4
      RETURNING *
    `;
    const result = await db.query(queryText, [newStock, newPrice, newSupplier, id]);

    // Log action if stock level changed
    if (stock_level !== undefined && Number(stock_level) !== item.stock_level) {
      await db.query(
        'INSERT INTO system_logs (user_role, action_type, details) VALUES ($1, $2, $3)',
        [req.user.designation, 'Inventory Stock Update', `Updated stock of "${item.item_name}" from ${item.stock_level} to ${newStock}`]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// ─── B2B VENDORS & SUPPLIERS ───

// GET /api/inventory/vendors
router.get('/vendors', authenticateToken, checkRole(['Owner', 'B2B Sales']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM vendors ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// POST /api/inventory/vendors
router.post('/vendors', authenticateToken, checkRole(['Owner', 'B2B Sales']), async (req, res) => {
  const { name, gstin, contact, credit_balance } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Vendor name is required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO vendors (name, gstin, contact, credit_balance) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, gstin || '', contact || '', Number(credit_balance) || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// GET /api/inventory/ledgers
router.get('/ledgers', authenticateToken, checkRole(['Owner', 'B2B Sales']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM vendor_ledgers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ledgers:', error);
    res.status(500).json({ error: 'Failed to fetch ledgers' });
  }
});

// POST /api/inventory/ledgers
router.post('/ledgers', authenticateToken, checkRole(['Owner', 'B2B Sales']), async (req, res) => {
  const { vendor_id, transaction_type, amount, description } = req.body;
  if (!vendor_id || !transaction_type || !amount) {
    return res.status(400).json({ error: 'Vendor ID, Transaction Type (Credit/Debit), and Amount are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO vendor_ledgers (vendor_id, transaction_type, amount, description) VALUES ($1, $2, $3, $4) RETURNING *`,
      [parseInt(vendor_id), transaction_type, Number(amount), description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ledger entry:', error);
    res.status(500).json({ error: 'Failed to create ledger entry' });
  }
});

// ─── EPC MATERIAL DISPATCHES ───

// GET /api/inventory/dispatches
router.get('/dispatches', authenticateToken, checkRole(['Owner', 'Operations']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM material_dispatches ORDER BY dispatched_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching dispatches:', error);
    res.status(500).json({ error: 'Failed to fetch material dispatches' });
  }
});

// POST /api/inventory/dispatches
router.post('/dispatches', authenticateToken, checkRole(['Owner', 'Operations']), async (req, res) => {
  const { project_id, item_name, quantity, status } = req.body;
  if (!project_id || !item_name || !quantity) {
    return res.status(400).json({ error: 'Project ID, Item Name, and Quantity are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO material_dispatches (project_id, item_name, quantity, status) VALUES ($1, $2, $3, $4) RETURNING *`,
      [parseInt(project_id), item_name, parseInt(quantity), status || 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating dispatch record:', error);
    res.status(500).json({ error: 'Failed to create dispatch record' });
  }
});

module.exports = router;
