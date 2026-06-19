const express = require('express');
const db = require('../../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, c.name as customer_name, c.phone as customer_phone 
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id (Single project + milestones)
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const projectRes = await db.query(`
      SELECT p.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address, c.city as customer_city, c.state as customer_state
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const milestonesRes = await db.query('SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY id ASC', [id]);

    res.json({
      project: projectRes.rows[0],
      milestones: milestonesRes.rows
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// PUT /api/projects/:id/milestones (Update milestone progress)
router.put('/:id/milestones', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { milestone_name, status } = req.body; // status: 'Pending', 'In Progress', 'Completed'

  if (!milestone_name || !status) {
    return res.status(400).json({ error: 'Milestone name and status are required' });
  }

  try {
    // Check if project exists
    const projectCheck = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update the milestone
    const updateRes = await db.query(
      `UPDATE project_milestones 
       SET status = $1, updated_at = NOW() 
       WHERE project_id = $2 AND milestone_name = $3
       RETURNING *`,
      [status, id, milestone_name]
    );

    if (updateRes.rows.length === 0) {
      // If the milestone doesn't exist yet, insert it
      await db.query(
        `INSERT INTO project_milestones (project_id, milestone_name, status, updated_at)
         VALUES ($1, $2, $3, NOW())`,
        [id, milestone_name, status]
      );
    }

    // If status is 'In Progress' or 'Completed', update current_milestone in the main project
    if (status === 'In Progress' || status === 'Completed') {
      let finalStatus = 'In Progress';
      if (milestone_name === 'Handover' && status === 'Completed') {
        finalStatus = 'Completed';
      }

      await db.query(
        `UPDATE projects 
         SET current_milestone = $1, status = $2, expected_completion = CASE WHEN $3 = 'Completed' AND $1 = 'Handover' THEN CURRENT_DATE ELSE expected_completion END
         WHERE id = $4`,
        [milestone_name, finalStatus, status, id]
      );
    }

    // Add milestone-based billing trigger if a specific milestone is completed
    if (status === 'Completed') {
      let paymentAmount = 0;
      let stageLabel = '';
      
      const val = projectCheck.rows[0].project_value || 500000;
      
      if (milestone_name === 'Site Survey') {
        paymentAmount = val * 0.10; // 10% on Survey
        stageLabel = 'Site Survey Completed';
      } else if (milestone_name === 'Material Procurement') {
        paymentAmount = val * 0.40; // 40% on Materials
        stageLabel = 'Material Mobilization';
      } else if (milestone_name === 'Panel Installation') {
        paymentAmount = val * 0.30; // 30% on Panel Installation
        stageLabel = 'Panel Installation Completed';
      } else if (milestone_name === 'Handover') {
        paymentAmount = val * 0.20; // 20% on Handover
        stageLabel = 'Project Handover / Net-metering Complete';
      }

      if (paymentAmount > 0) {
        // Create a milestone payment record
        await db.query(
          `INSERT INTO payments (project_id, amount, due_date, status, payment_stage, created_at)
           VALUES ($1, $2, CURRENT_DATE + INTERVAL '7 days', 'Pending', $3, NOW())`,
          [id, paymentAmount, stageLabel]
        );
      }
    }

    // Log action
    await db.query(
      'INSERT INTO system_logs (user_role, action_type, details) VALUES ($1, $2, $3)',
      [req.user.designation, 'Project Milestone Update', `Updated project ID ${id} milestone "${milestone_name}" to: ${status}`]
    );

    res.json({ success: true, message: 'Milestone updated successfully' });
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

module.exports = router;
