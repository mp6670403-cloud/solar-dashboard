const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { triggerWorkflow } = require('../integrations/n8n');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

// Load config files helper
const loadJsonConfig = (filename) => {
  try {
    const filePath = path.join(__dirname, '..', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading configuration ${filename}:`, error.message);
    return [];
  }
};

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// 1. AUTHENTICATION: Login Endpoint
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Look up user in PostgreSQL
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, designation: user.designation },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        designation: user.designation
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. DASHBOARD CONFIG: Get allowed tables and actions for logged-in user
router.get('/dashboard/config', authenticateToken, (req, res) => {
  const { designation } = req.user;

  const allActions = loadJsonConfig('actions.config.json');
  const allTables = loadJsonConfig('tables.config.json');

  // Filter based on designation
  const allowedActions = allActions.filter(action => 
    action.allowed_designations.includes(designation)
  );

  // Filter tables metadata (omit the queries for security before sending to frontend)
  const allowedTables = allTables
    .filter(table => table.allowed_designations.includes(designation))
    .map(({ id, name, allowed_designations }) => ({ id, name, allowed_designations }));

  res.json({
    designation,
    actions: allowedActions,
    tables: allowedTables
  });
});

// 3. DATA RETRIEVAL: Execute query for specific table
router.get('/dashboard/data/:tableId', authenticateToken, async (req, res) => {
  const { tableId } = req.params;
  const { designation } = req.user;

  const allTables = loadJsonConfig('tables.config.json');
  const tableConfig = allTables.find(t => t.id === tableId);

  // Check if table exists
  if (!tableConfig) {
    return res.status(404).json({ error: 'Data table configuration not found' });
  }

  // Verify authorization
  if (!tableConfig.allowed_designations.includes(designation)) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to view this table' });
  }

  try {
    // Run configured query
    const result = await db.query(tableConfig.query);
    res.json({
      tableId,
      tableName: tableConfig.name,
      rows: result.rows
    });
  } catch (error) {
    console.error(`Database query failed for table ${tableId}:`, error);
    res.status(500).json({ error: `Failed to retrieve data: ${error.message}` });
  }
});

// 4. TRIGGER ACTION: Call n8n webhook and log action
router.post('/actions/trigger', authenticateToken, async (req, res) => {
  const { actionName, payload } = req.body;
  const { designation } = req.user;

  if (!actionName || !payload) {
    return res.status(400).json({ error: 'Action name and payload are required' });
  }

  const allActions = loadJsonConfig('actions.config.json');
  const actionConfig = allActions.find(a => a.action_name === actionName);

  if (!actionConfig) {
    return res.status(404).json({ error: 'Action configuration not found' });
  }

  // Verify authorization
  if (!actionConfig.allowed_designations.includes(designation)) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to trigger this action' });
  }

  // Validate payload fields
  const missingFields = actionConfig.payload_fields.filter(field => !payload[field] || payload[field].toString().trim() === '');
  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    // Trigger n8n webhook
    const triggerResult = await triggerWorkflow(actionConfig.webhook_url, payload);

    // Log the action to database
    const logDetails = `Triggered: "${actionName}" | Payload: ${JSON.stringify(payload)}`;
    await db.query(
      'INSERT INTO system_logs (user_role, action_type, details) VALUES ($1, $2, $3)',
      [designation, `Action Trigger: ${actionName}`, logDetails]
    );

    res.json({
      success: true,
      message: `Action "${actionName}" triggered successfully.`,
      integrationResult: triggerResult
    });
  } catch (error) {
    console.error(`Failed to execute action ${actionName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
