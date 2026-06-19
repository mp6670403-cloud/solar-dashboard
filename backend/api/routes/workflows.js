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

// POST /api/workflows/webhook/whatsapp (Incoming webhook from WhatsApp / n8n)
// This endpoint receives WhatsApp chat data, processes it, and auto-creates leads
router.post('/webhook/whatsapp', async (req, res) => {
  const { sender_name, sender_phone, message_text, details } = req.body;

  if (!sender_phone || !message_text) {
    return res.status(400).json({ error: 'Sender phone and message text are required' });
  }

  try {
    // 1. Analyze text for lead qualities
    const textLower = message_text.toLowerCase();
    let kw = 5; // default
    let stage = 'New Inquiry';
    
    // Simple parsing logic
    if (textLower.includes('kw') || textLower.includes('kilowatt')) {
      const match = textLower.match(/(\d+)\s*(?:kw|kilowatt)/);
      if (match) kw = parseInt(match[1], 10);
    }

    // AI score simulation
    let aiScore = 55;
    if (textLower.includes('rooftop') || textLower.includes('bill')) aiScore += 25;
    if (kw > 10) aiScore += 15;
    aiScore = Math.min(100, aiScore);

    // 2. Insert into leads table
    const queryText = `
      INSERT INTO leads (name, phone, source, stage, assigned_to, kw_capacity, ai_score, notes, created_at, updated_at)
      VALUES ($1, $2, 'WhatsApp', $3, 'Amit Verma', $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const notes = `Auto-captured from WhatsApp chat message: "${message_text}"`;
    const result = await db.query(queryText, [sender_name || 'WhatsApp Contact', sender_phone, stage, kw, aiScore, notes]);
    const lead = result.rows[0];

    // Log webhook execution
    await db.query(
      `INSERT INTO webhook_logs (webhook_source, payload, status, created_at)
       VALUES ('WhatsApp', $1, 'Success', NOW())`,
      [JSON.stringify(req.body)]
    );

    // Log system event
    await db.query(
      `INSERT INTO system_logs (user_role, action_type, details)
       VALUES ('System', 'WhatsApp Webhook Lead', 'Auto-created lead ${lead.name} from WhatsApp message: ${sender_phone}')`
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
