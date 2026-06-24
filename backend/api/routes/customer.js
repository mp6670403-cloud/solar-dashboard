const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../../db');

const router = express.Router();

// Mock database for customer tickets and scheduled services
let customerTickets = [];
let cleaningSchedules = [];

// 1. POST /api/customer/ticket (Create a support / repair ticket)
router.post('/ticket', authenticateToken, async (req, res) => {
  const { project_id, customer_name, issue_type, description, attachment } = req.body;

  const ticket = {
    id: Date.now(),
    project_id,
    customer_name,
    issue_type,
    description,
    attachment: attachment || null,
    status: 'Open',
    created_at: new Date().toISOString()
  };

  customerTickets.unshift(ticket);

  try {
    // Audit log the complaint
    await db.query(
      `INSERT INTO system_logs (user_role, action_type, details) 
       VALUES ($1, $2, $3)`,
      ['Customer', 'Support Ticket Raised', `Ticket raised by ${customer_name || 'Customer'} for Project ${project_id}: "${issue_type} - ${description}"`]
    );

    res.status(201).json({
      success: true,
      message: 'Support ticket successfully raised and triaged by Surya AI.',
      ticket
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// 2. GET /api/customer/tickets/:projectId (Get customer specific tickets)
router.get('/tickets/:projectId', authenticateToken, (req, res) => {
  const { projectId } = req.params;
  const filtered = customerTickets.filter(t => t.project_id === parseInt(projectId) || t.project_id === projectId);
  res.json(filtered);
});

// 3. POST /api/customer/schedule-cleaning (Book a panel maintenance cleaning appointment)
router.post('/schedule-cleaning', authenticateToken, async (req, res) => {
  const { project_id, customer_name, preferred_date, cleaning_frequency } = req.body;

  const schedule = {
    id: Date.now(),
    project_id,
    customer_name,
    preferred_date,
    cleaning_frequency,
    status: 'Scheduled',
    created_at: new Date().toISOString()
  };

  cleaningSchedules.unshift(schedule);

  try {
    await db.query(
      `INSERT INTO system_logs (user_role, action_type, details) 
       VALUES ($1, $2, $3)`,
      ['Customer', 'Cleaning Visit Scheduled', `Cleaning scheduled by ${customer_name} for date: ${preferred_date}. Frequency: ${cleaning_frequency}`]
    );

    res.status(201).json({
      success: true,
      message: 'Panel maintenance visit scheduled successfully.',
      schedule
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule cleaning visit' });
  }
});

// 4. GET /api/customer/cleaning/:projectId (Get cleaning schedule list)
router.get('/cleaning/:projectId', authenticateToken, (req, res) => {
  const { projectId } = req.params;
  const filtered = cleaningSchedules.filter(s => s.project_id === parseInt(projectId) || s.project_id === projectId);
  res.json(filtered);
});

module.exports = router;
