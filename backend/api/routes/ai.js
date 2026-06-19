const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const assistant = require('../../ai/assistant');
const db = require('../../db');

const router = express.Router();

// GET /api/ai/suggestions
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const suggestions = await assistant.getDailySummary();
    
    // Check if we have specific insights saved in db, else use standard format
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

    // Default mock suggestion fallback matches the UI demo list but is fetched dynamically
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

module.exports = router;
