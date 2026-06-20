const express = require('express');
const db = require('../../db');
const { authenticateToken } = require('../middleware/auth');
const { triggerWorkflow } = require('../../integrations/n8n');
const n8nConfig = require('../../config/n8n.config.json');

const router = express.Router();

// GET /api/crm/leads
router.get('/leads', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// POST /api/crm/leads (Create new lead)
router.post('/leads', authenticateToken, async (req, res) => {
  const { name, phone, email, source, kw_capacity, monthly_bill, roof_area, notes } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone are required' });
  }

  // Basic validation & AI Lead Scoring simulation
  const kw = Number(kw_capacity) || 0;
  const bill = Number(monthly_bill) || 0;
  const area = Number(roof_area) || 0;
  
  // Calculate a simulated AI score based on lead attributes
  let ai_score = 50;
  if (kw > 20 || bill > 40000 || area > 2000) ai_score += 30; // High value lead
  if (source === 'Referral' || source === 'WhatsApp') ai_score += 15;
  if (phone.startsWith('9')) ai_score += 5;
  ai_score = Math.min(100, ai_score);

  try {
    const queryText = `
      INSERT INTO leads (name, phone, email, source, stage, assigned_to, kw_capacity, monthly_bill, roof_area, ai_score, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      name,
      phone,
      email || '',
      source || 'Manual',
      'New Inquiry',
      req.user.username || 'Amit Verma',
      kw,
      bill,
      area,
      ai_score,
      notes || ''
    ];

    const result = await db.query(queryText, values);
    const newLead = result.rows[0];

    // Trigger n8n webhook (asynchronous background notification)
    if (n8nConfig.workflows && n8nConfig.workflows.new_lead_notification) {
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

      triggerWorkflow(n8nConfig.workflows.new_lead_notification.webhook_url, {
        lead_id: newLead.id,
        lead_name: newLead.name,
        phone: newLead.phone,
        email: newLead.email,
        source: newLead.source,
        kw_capacity: newLead.kw_capacity,
        ai_score: newLead.ai_score,
        owner_phone: ownerPhone,
        bot_phone: botPhone,
        waha_api_url: wahaApiUrl,
        waha_api_key: wahaApiKey
      }).catch(err => console.warn('n8n notification trigger skipped or failed:', err.message));
    }

    // System log
    await db.query(
      'INSERT INTO system_logs (user_role, action_type, details) VALUES ($1, $2, $3)',
      [req.user.designation, 'Lead Creation', `Created lead: ${name} (${phone}) - Stage: New Inquiry`]
    );

    res.status(201).json(newLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// PUT /api/crm/leads/:id (Update lead)
router.put('/leads/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, source, stage, assigned_to, kw_capacity, monthly_bill, roof_area, notes } = req.body;

  try {
    // Check if lead exists
    const currentLeadRes = await db.query('SELECT * FROM leads WHERE id = $1', [id]);
    if (currentLeadRes.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    const currentLead = currentLeadRes.rows[0];

    const queryText = `
      UPDATE leads
      SET name = $1, phone = $2, email = $3, source = $4, stage = $5, assigned_to = $6,
          kw_capacity = $7, monthly_bill = $8, roof_area = $9, notes = $10, updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;
    const values = [
      name || currentLead.name,
      phone || currentLead.phone,
      email !== undefined ? email : currentLead.email,
      source || currentLead.source,
      stage || currentLead.stage,
      assigned_to || currentLead.assigned_to,
      kw_capacity !== undefined ? Number(kw_capacity) : currentLead.kw_capacity,
      monthly_bill !== undefined ? Number(monthly_bill) : currentLead.monthly_bill,
      roof_area !== undefined ? Number(roof_area) : currentLead.roof_area,
      notes !== undefined ? notes : currentLead.notes,
      id
    ];

    const result = await db.query(queryText, values);
    const updatedLead = result.rows[0];

    // If stage changed, trigger n8n hook
    if (stage && stage !== currentLead.stage) {
      if (n8nConfig.workflows && n8nConfig.workflows.lead_stage_update) {
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

        triggerWorkflow(n8nConfig.workflows.lead_stage_update.webhook_url, {
          lead_id: updatedLead.id,
          lead_name: updatedLead.name,
          old_stage: currentLead.stage,
          new_stage: updatedLead.stage,
          owner_phone: ownerPhone,
          bot_phone: botPhone,
          waha_api_url: wahaApiUrl,
          waha_api_key: wahaApiKey
        }).catch(err => console.warn('n8n stage update trigger failed:', err.message));
      }

      // If converted to 'Won', automatically create a customer record and project structure!
      if (stage === 'Won' && currentLead.stage !== 'Won') {
        // Create Customer
        const customerRes = await db.query(
          `INSERT INTO customers (lead_id, name, phone, email, address, city, state, roof_type, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
          [updatedLead.id, updatedLead.name, updatedLead.phone, updatedLead.email, 'To be surveyed', 'City', 'State', 'Flat Roof']
        );
        const customer = customerRes.rows[0];

        // Create Project
        const projectValue = (updatedLead.kw_capacity || 5) * 60000; // Estimated 60k per kW
        const projectRes = await db.query(
          `INSERT INTO projects (customer_id, project_name, site_address, kw_capacity, project_value, current_milestone, status, start_date, expected_completion, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', NOW()) RETURNING *`,
          [customer.id, `${customer.name} ${updatedLead.kw_capacity}kW Project`, 'To be surveyed', updatedLead.kw_capacity || 5, projectValue, 'Site Survey', 'In Progress']
        );
        const project = projectRes.rows[0];

        // Create initial project milestones
        const milestones = ['Site Survey', 'Design Approval', 'Material Procurement', 'Structure Installation', 'Panel Installation', 'Commissioning', 'Net Metering Application'];
        for (let i = 0; i < milestones.length; i++) {
          await db.query(
            `INSERT INTO project_milestones (project_id, milestone_name, status, updated_at)
             VALUES ($1, $2, $3, NOW())`,
            [project.id, milestones[i], i === 0 ? 'In Progress' : 'Pending']
          );
        }
      }
    }

    res.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// DELETE /api/crm/leads/:id
router.delete('/leads/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM leads WHERE id = $1', [id]);
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

module.exports = router;
