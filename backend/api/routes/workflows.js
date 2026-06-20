const express = require('express');
const db = require('../../db');
const { authenticateToken } = require('../middleware/auth');
const { triggerWorkflow } = require('../../integrations/n8n');
const n8nConfig = require('../../config/n8n.config.json');

const router = express.Router();

// GET /api/workflows
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Return the list of configured workflows
    const workflows = Object.keys(n8nConfig.workflows).map(key => ({
      id: key,
      ...n8nConfig.workflows[key]
    }));
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// POST /api/workflows/trigger
router.post('/trigger', authenticateToken, async (req, res) => {
  const { workflowId, payload } = req.body;

  if (!workflowId) {
    return res.status(400).json({ error: 'Workflow ID is required' });
  }

  const workflow = n8nConfig.workflows[workflowId];
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow configuration not found' });
  }

  try {
    const triggerResult = await triggerWorkflow(workflow.webhook_url, payload || {});

    // Log action to db
    const details = `Triggered workflow: ${workflow.name} | Payload: ${JSON.stringify(payload || {})}`;
    await db.query(
      'INSERT INTO system_logs (user_role, action_type, details) VALUES ($1, $2, $3)',
      [req.user.designation, `Workflow Trigger: ${workflowId}`, details]
    );

    res.json({
      success: true,
      message: `Workflow "${workflow.name}" triggered successfully.`,
      result: triggerResult
    });
  } catch (error) {
    console.error(`Error triggering workflow ${workflowId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/workflows/logs (Retrieves webhook logs for the workflow panel)
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 20');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
});

// POST /api/workflows/webhook/whatsapp (Incoming webhook from WhatsApp / n8n)
// This endpoint receives WhatsApp chat data, processes it, and auto-creates leads
router.post('/webhook/whatsapp', async (req, res) => {
  const { sender_name, sender_phone, message_text, kw_capacity, monthly_bill, city } = req.body;

  if (!sender_phone || !message_text) {
    return res.status(400).json({ error: 'Sender phone and message text are required' });
  }

  try {
    const textLower = message_text.toLowerCase();
    
    // 1. Parse and extract requirements
    let kw = parseInt(kw_capacity, 10);
    if (isNaN(kw)) {
      kw = 5; // default fallback
      if (textLower.includes('kw') || textLower.includes('kilowatt')) {
        const match = textLower.match(/(\d+)\s*(?:kw|kilowatt)/);
        if (match) kw = parseInt(match[1], 10);
      }
    }

    let bill = parseInt(monthly_bill, 10) || 0;

    // AI score calculation
    let aiScore = 50;
    if (bill > 5000 || textLower.includes('bill')) aiScore += 20;
    if (kw >= 5) aiScore += 20;
    if (textLower.includes('rooftop')) aiScore += 10;
    aiScore = Math.min(100, aiScore);

    const notes = `Auto-captured from WhatsApp chat message: "${message_text}"`;
    const stage = 'New Inquiry';
    let lead;

    // 2. Check if lead already exists to prevent duplication
    const checkRes = await db.query('SELECT * FROM leads WHERE phone = $1', [sender_phone]);
    if (checkRes.rows.length > 0) {
      // Update existing lead details
      const existing = checkRes.rows[0];
      const updateText = `
        UPDATE leads
        SET name = $1, kw_capacity = $2, monthly_bill = $3, roof_area = $4, ai_score = $5, 
            notes = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `;
      const updateRes = await db.query(updateText, [
        sender_name || existing.name,
        kw,
        bill,
        kw * 100,
        aiScore,
        existing.notes ? `${existing.notes}\n\n[Update] ${notes}` : notes,
        existing.id
      ]);
      lead = updateRes.rows[0];
    } else {
      // Insert new lead record
      const queryText = `
        INSERT INTO leads (name, phone, source, stage, assigned_to, kw_capacity, monthly_bill, roof_area, ai_score, notes, created_at, updated_at)
        VALUES ($1, $2, 'WhatsApp', $3, 'Amit Verma', $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;
      const insertRes = await db.query(queryText, [
        sender_name || 'WhatsApp Contact',
        sender_phone,
        stage,
        kw,
        bill,
        kw * 100,
        aiScore,
        notes
      ]);
      lead = insertRes.rows[0];
    }

    // Log webhook execution successfully
    await db.query(
      `INSERT INTO webhook_logs (webhook_source, payload, status, created_at)
       VALUES ('WhatsApp', $1, 'Success', NOW())`,
      [JSON.stringify(req.body)]
    );

    // Log system event
    await db.query(
      `INSERT INTO system_logs (user_role, action_type, details)
       VALUES ('System', 'WhatsApp Webhook Lead', 'Auto-created/updated lead ${lead.name} from WhatsApp message: ${sender_phone}')`
    );

    res.json({
      success: true,
      message: 'WhatsApp message processed and lead created successfully',
      lead_id: lead.id,
      ai_score: lead.ai_score
    });
  } catch (error) {
    console.error('WhatsApp Webhook error:', error);
    // Log webhook failure
    try {
      await db.query(
        `INSERT INTO webhook_logs (webhook_source, payload, status, error_details, created_at)
         VALUES ('WhatsApp', $1, 'Failed', $2, NOW())`,
        [JSON.stringify(req.body), error.message]
      );
    } catch (dbErr) {
      console.error('Failed logging webhook failure to db:', dbErr.message);
    }
    res.status(500).json({ error: `Webhook processing failed: ${error.message}` });
  }
});

module.exports = router;
