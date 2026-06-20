const express = require('express');
const db = require('../../db');
const { authenticateToken } = require('../middleware/auth');
const { triggerWorkflow } = require('../../integrations/n8n');
const n8nConfig = require('../../config/n8n.config.json');

const router = express.Router();

// GET /api/payments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT pay.*, proj.project_name, cust.name as customer_name, cust.phone as customer_phone
      FROM payments pay
      LEFT JOIN projects proj ON pay.project_id = proj.id
      LEFT JOIN customers cust ON proj.customer_id = cust.id
      ORDER BY pay.due_date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// PUT /api/payments/:id (Update status)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, transaction_reference } = req.body; // status: 'Paid', 'Pending', 'Overdue'

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const checkPayment = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (checkPayment.rows.length === 0) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const queryText = `
      UPDATE payments
      SET status = $1, transaction_reference = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(queryText, [status, transaction_reference || '', id]);

    // Log action
    await db.query(
      'INSERT INTO system_logs (user_role, action_type, details) VALUES ($1, $2, $3)',
      [req.user.designation, 'Payment Update', `Updated payment ID ${id} to status: ${status}`]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// POST /api/payments/:id/reminder (Trigger WhatsApp/n8n payment reminder)
router.post('/:id/reminder', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const paymentRes = await db.query(`
      SELECT pay.*, proj.project_name, cust.name as customer_name, cust.phone as customer_phone, cust.email as customer_email
      FROM payments pay
      LEFT JOIN projects proj ON pay.project_id = proj.id
      LEFT JOIN customers cust ON proj.customer_id = cust.id
      WHERE pay.id = $1
    `, [id]);

    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentRes.rows[0];

    // Trigger n8n webhook
    let n8nResult = null;
    if (n8nConfig.workflows && n8nConfig.workflows.payment_reminder) {
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

      n8nResult = await triggerWorkflow(n8nConfig.workflows.payment_reminder.webhook_url, {
        payment_id: payment.id,
        customer_name: payment.customer_name,
        customer_phone: payment.customer_phone,
        customer_email: payment.customer_email,
        amount: payment.amount,
        due_date: payment.due_date,
        project_name: payment.project_name,
        payment_stage: payment.payment_stage,
        owner_phone: ownerPhone,
        bot_phone: botPhone,
        waha_api_url: wahaApiUrl,
        waha_api_key: wahaApiKey
      });
    }

    // Log action
    await db.query(
      'INSERT INTO system_logs (user_role, action_type, details) VALUES ($1, $2, $3)',
      [req.user.designation, 'Payment Reminder', `Triggered n8n payment reminder for "${payment.customer_name}" - Amt: ₹${payment.amount}`]
    );

    res.json({
      success: true,
      message: 'Reminder notification request dispatched successfully',
      integration: n8nResult
    });
  } catch (error) {
    console.error('Error triggering payment reminder:', error);
    res.status(500).json({ error: `Failed to trigger reminder: ${error.message}` });
  }
});

module.exports = router;
