const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const assistant = require('../../ai/assistant');
const db = require('../../db');

const router = express.Router();

// Defined schema descriptors for each dynamic configuration key to render labels and guidelines on the controller
const SETTING_SCHEMAS = {
  surya_strategy_override: {
    label: "AI Recommendation Strategy",
    description: "Overrides standard pitch instructions for AI suggestions.",
    category: "AI Engine Settings"
  },
  active_offers: {
    label: "Active Promotional Offers",
    description: "Sales offers currently live (e.g. Monsoon or festival deals).",
    category: "Marketing Guidelines"
  },
  sales_strategy: {
    label: "Sales Core Strategy Focus",
    description: "Sets focus keywords for pitches (e.g. government subsidies).",
    category: "Marketing Guidelines"
  },
  bot_whatsapp_number: {
    label: "WAHA Sender/Bot Number",
    description: "The registered WhatsApp number from which alerts are dispatched.",
    category: "WhatsApp Integration Setup"
  },
  owner_whatsapp_number: {
    label: "Owner Target Alert Number",
    description: "The owner's WhatsApp number to receive operations and lead alerts.",
    category: "WhatsApp Integration Setup"
  },
  waha_api_url: {
    label: "WAHA REST Service Endpoint URL",
    description: "Endpoint hosting the self-hosted WAHA instance (e.g. http://localhost:3000).",
    category: "WhatsApp Integration Setup"
  },
  waha_api_key: {
    label: "WAHA Connection API Key",
    description: "Required API Authentication Token (x-api-key header) for the Waha instance.",
    category: "WhatsApp Integration Setup"
  },
  openai_api_key: {
    label: "OpenAI Platform API Key",
    description: "Platform Key to connect real GPT models to internal tools.",
    category: "AI Engine Settings"
  },
  strategy_override_prompt: {
    label: "Owner Core Strategy Prompt Override",
    description: "Instructs Surya on company marketing directives (retains Surya core identity).",
    category: "AI Engine Settings"
  },
  fallback_email_recipient: {
    label: "System Fallback Notification Email",
    description: "Inbox receiving system alerts if WhatsApp API dispatch encounters errors.",
    category: "System Fallbacks Setup"
  },
  controller_access_password: {
    label: "System Controller Lock Password",
    description: "Locks the System Controller panel to guard configuration keys.",
    category: "System Access Protection"
  }
};

// GET /api/ai/suggestions
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const suggestions = await assistant.getDailySummary();
    const dbSuggestions = await db.query('SELECT * FROM ai_suggestions ORDER BY created_at DESC LIMIT 5');
    
    if (dbSuggestions.rows.length > 0) {
      const formatted = dbSuggestions.rows.map(row => ({
        id: row.id,
        priority: row.priority || 'medium',
        title: row.title,
        description: row.description,
        action: row.action_label || 'View Details',
        timestamp: 'AI Generated'
      }));
      return res.json(formatted);
    }

    const defaultSuggestions = [
      {
        id: 1,
        priority: 'high',
        title: 'Follow up on Rajendra Singh (100kW)',
        description: 'Lead has an AI score of 95 and has been in Negotiation stage for over 3 days. Estimated value is ₹60L.',
        action: 'View Leads',
        timestamp: 'Just now'
      },
      {
        id: 2,
        priority: 'high',
        title: 'Material Procurement Delay Alert',
        description: 'Choudhary Factory project requires 150 Solar panels. Mono PERC panel stock is low. Order placement is recommended.',
        action: 'Check Inventory',
        timestamp: '1 hour ago'
      },
      {
        id: 3,
        priority: 'medium',
        title: 'Overdue Milestones & Collections',
        description: 'Bansal Residence project milestone "Panel Installation" was completed. Milestone invoice ₹1.44L is pending collection.',
        action: 'View Payments',
        timestamp: '3 hours ago'
      }
    ];

    res.json(defaultSuggestions);
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    res.status(500).json({ error: 'Failed to generate AI insights' });
  }
});

// POST /api/ai/query (AI Chatbot query)
router.post('/query', authenticateToken, async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const context = {
      username: req.user.username,
      designation: req.user.designation
    };
    const reply = await assistant.queryAssistant(query, context);
    res.json(reply);
  } catch (error) {
    console.error('Error processing AI query:', error);
    res.status(500).json({ error: 'AI Assistant failed to process request' });
  }
});

// GET /api/ai/settings - Pull settings and annotate with labels and groups
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT setting_key, setting_value FROM system_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    // Append config schemas for UI presentation mapping
    res.json({
      settings,
      schemas: SETTING_SCHEMAS
    });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// POST /api/ai/settings - Updates settings key-value entries with access validation
router.post('/settings', authenticateToken, async (req, res) => {
  const { key, value, password } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Setting key is required' });
  }

  try {
    // 1. Fetch current controller password from settings
    const pwdRes = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'controller_access_password'");
    const currentPassword = pwdRes.rows.length > 0 ? pwdRes.rows[0].setting_value : 'admin123';

    // 2. Validate password
    if (password !== currentPassword) {
      return res.status(403).json({ error: 'Invalid System Controller Password. Authorization Denied.' });
    }

    // 3. Update or Insert key-value pairs
    const checkRes = await db.query('SELECT * FROM system_settings WHERE setting_key = $1', [key]);
    if (checkRes.rows.length === 0) {
      await db.query('INSERT INTO system_settings (setting_key, setting_value) VALUES ($1, $2)', [key, value || '']);
    } else {
      await db.query('UPDATE system_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2', [value || '', key]);
    }

    // 4. Log the action
    await db.query(
      'INSERT INTO system_logs (user_role, action_type, details) VALUES ($1, $2, $3)',
      [req.user.designation, 'AI Settings Update', `Updated setting ${key} with Controller credentials.`]
    );

    res.json({ success: true, key, value });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

module.exports = router;
