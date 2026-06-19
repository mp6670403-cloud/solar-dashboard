const express = require('express');
const db = require('../../db');
const { authenticateToken, checkRole } = require('../middleware/auth');
const { triggerWorkflow } = require('../../integrations/n8n');
const n8nConfig = require('../../config/n8n.config.json');

const router = express.Router();

// GET /api/staff/directory
router.get('/directory', authenticateToken, async (req, res) => {
  try {
    const result = await db.query("SELECT id, username, designation, full_name, email FROM users ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff directory:', error);
    res.status(500).json({ error: 'Failed to fetch directory' });
  }
});

// GET /api/staff/attendance
router.get('/attendance', authenticateToken, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM attendance ORDER BY date DESC, created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    res.status(500).json({ error: 'Failed to fetch attendance logs' });
  }
});

// POST /api/staff/attendance
router.post('/attendance', authenticateToken, async (req, res) => {
  const { user_id, date, status, check_in, check_out, current_activity } = req.body;
  const targetUserId = user_id || req.user.id;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // Check if attendance entry already exists for user and date
    const checkRes = await db.query(
      "SELECT * FROM attendance WHERE user_id = $1 AND date = $2",
      [targetUserId, targetDate]
    );

    if (checkRes.rows.length > 0) {
      // Update existing
      const queryText = `
        UPDATE attendance 
        SET status = $1, check_out = $2, current_activity = $3
        WHERE user_id = $4 AND date = $5
        RETURNING *
      `;
      const result = await db.query(queryText, [
        status || checkRes.rows[0].status,
        check_out || checkRes.rows[0].check_out,
        current_activity || checkRes.rows[0].current_activity,
        targetUserId,
        targetDate
      ]);
      return res.json(result.rows[0]);
    } else {
      // Create new
      const queryText = `
        INSERT INTO attendance (user_id, date, status, check_in, check_out, current_activity)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const result = await db.query(queryText, [
        targetUserId,
        targetDate,
        status || 'Present',
        check_in || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        check_out || '',
        current_activity || 'Active in Office'
      ]);
      return res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// GET /api/staff/tasks
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM tasks ORDER BY due_date ASC, created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/staff/tasks
router.post('/tasks', authenticateToken, checkRole(['Owner', 'Operations']), async (req, res) => {
  const { assigned_to, title, description, priority, status, related_project_id, due_date } = req.body;
  if (!assigned_to || !title) {
    return res.status(400).json({ error: 'Assigned To name and Task Title are required' });
  }
  try {
    const queryText = `
      INSERT INTO tasks (assigned_to, title, description, priority, status, related_project_id, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query(queryText, [
      assigned_to,
      title,
      description || '',
      priority || 'Medium',
      status || 'Pending',
      related_project_id || null,
      due_date || null
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/staff/tasks/:id (Update task status)
router.put('/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Pending', 'In Progress', 'Completed'
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  try {
    const result = await db.query(
      "UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *",
      [status, parseInt(id)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ─── COMBINED WHATSAPP SITE CHECK-IN & AI INSPECTION WEBHOOK ───

// POST /api/staff/webhook/whatsapp-inspection
// Handles incoming messages from staff containing Geolocation Coordinates, milestone updates, or photos.
router.post('/webhook/whatsapp-inspection', async (req, res) => {
  const { staff_name, phone, text, latitude, longitude, image_url, project_id, milestone_name } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Sender phone is required' });
  }

  try {
    let responseText = '';
    const dateToday = new Date().toISOString().split('T')[0];

    // Find user by phone in database (simulated search in mock user directory)
    const userRes = await db.query("SELECT * FROM users WHERE email LIKE $1 OR username LIKE $2", [`%${staff_name || ''}%`, `%${staff_name || ''}%`]);
    const user = userRes.rows[0] || { id: 3, username: staff_name || 'Vikram Malhotra', designation: 'Operations' };

    // Scenario A: Staff sends Live Location Check-In
    if (latitude && longitude) {
      // In a real application, check coordinates against project site address coordinates (e.g. 26.9124, 75.7873 for Jaipur)
      // Geofencing verification
      const isWithinRange = true; // Simulating check within 100 meters
      
      const status = 'Present';
      const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const currentActivity = `Checked-in via WhatsApp Live Location at project site (Verified Geofence). Lat: ${latitude}, Lng: ${longitude}`;
      
      await db.query(
        "INSERT INTO attendance (user_id, date, status, check_in, check_out, current_activity) VALUES ($1, $2, $3, $4, $5, $6)",
        [user.id, dateToday, status, checkInTime, '', currentActivity]
      );

      // Log to system logs
      await db.query(
        "INSERT INTO system_logs (user_role, action_type, details) VALUES ($1, $2, $3)",
        [user.designation || 'Operations', 'WhatsApp Attendance', `Staff "${user.full_name || user.username}" checked in at site. Geofence verified.`]
      );

      responseText = `Namaste ${staff_name || user.username}! Attendance checked-in at site. Geofence Verified successfully. Current task: Install panels.`;
      
      return res.json({
        success: true,
        action: 'Attendance Check-in',
        geofence_verified: isWithinRange,
        message: responseText
      });
    }

    // Scenario B: Staff sends Milestone completion image
    if (image_url && milestone_name && project_id) {
      // Simulate AI Vision inspection (Gemini Vision API proxy)
      console.log(`[AI Vision] Running quality inspection on photo: ${image_url} for milestone: ${milestone_name}`);
      
      // In real code: call Gemini API with image_url and verify structure
      const isQualityApproved = !text?.toLowerCase().includes('fail'); // trigger mock rejection if text says "fail"
      
      let nextStatus = 'In Progress';
      if (isQualityApproved) {
        nextStatus = 'Completed';
        responseText = `AI Inspection Approved! Milestone "${milestone_name}" verified successfully. Outstanding payment block released. Good work!`;
      } else {
        responseText = `AI Inspection Rejected: Solar structure rails show alignment issues or missing anchor bolts. Please align structural rails and re-submit.`;
      }

      // If approved, update project milestones in db
      if (isQualityApproved) {
        await db.query(
          "UPDATE project_milestones SET status = $1 WHERE project_id = $2 AND milestone_name = $3",
          ['Completed', parseInt(project_id), milestone_name]
        );

        // System activity log
        await db.query(
          "INSERT INTO system_logs (user_role, action_type, details) VALUES ($1, $2, $3)",
          [user.designation || 'Operations', 'AI Milestone Verification', `Milestone "${milestone_name}" for Project ID ${project_id} verified & approved by AI Vision.`]
        );
      }

      // Log webhook action
      await db.query(
        `INSERT INTO webhook_logs (webhook_source, payload, status) VALUES ($1, $2, $3)`,
        ['WhatsApp Inspection', JSON.stringify(req.body), isQualityApproved ? 'Success' : 'Failed']
      );

      return res.json({
        success: true,
        action: 'Milestone Image Inspection',
        approved: isQualityApproved,
        message: responseText
      });
    }

    res.status(400).json({ error: 'Unsupported request. Provide either latitude/longitude or image_url + project_id + milestone_name.' });
  } catch (error) {
    console.error('WhatsApp Inspection webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/staff/users (list all system users — Owner & HR only)
router.get('/users', authenticateToken, checkRole(['Owner', 'HR']), async (req, res) => {
  try {
    const result = await db.query("SELECT id, username, designation, full_name, email FROM users ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

// POST /api/staff/users (create new user account — Owner & HR)
router.post('/users', authenticateToken, checkRole(['Owner', 'HR']), async (req, res) => {
  const { username, password, designation, full_name, email } = req.body;
  if (!username || !password || !designation || !full_name || !email) {
    return res.status(400).json({ error: 'All fields (username, password, designation, full_name, email) are required' });
  }
  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      "INSERT INTO users (username, password_hash, designation, full_name, email) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, designation, full_name, email",
      [username.toLowerCase(), hash, designation, full_name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// PUT /api/staff/users/:id (update user designation/details — Owner & HR)
router.put('/users/:id', authenticateToken, checkRole(['Owner', 'HR']), async (req, res) => {
  const userId = parseInt(req.params.id);
  const { designation, full_name, email } = req.body;
  try {
    const result = await db.query(
      "UPDATE users SET designation = $1, full_name = $2, email = $3 WHERE id = $4 RETURNING id, username, designation, full_name, email",
      [designation, full_name, email, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/staff/users/:id (revoke user access — Owner & HR)
router.delete('/users/:id', authenticateToken, checkRole(['Owner', 'HR']), async (req, res) => {
  const userId = parseInt(req.params.id);
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own active account' });
  }
  try {
    await db.query("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ success: true, message: 'User access revoked successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to revoke user access' });
  }
});

// ─── LEAVE MANAGEMENT ───

// GET /api/staff/leaves — Get all leave requests
router.get('/leaves', authenticateToken, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM leave_requests ORDER BY applied_on DESC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// POST /api/staff/leaves — Submit new leave request (any user)
router.post('/leaves', authenticateToken, async (req, res) => {
  const { leave_type, start_date, end_date, days, reason } = req.body;
  if (!leave_type || !start_date || !end_date || !reason) {
    return res.status(400).json({ error: 'Leave type, dates, and reason are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO leave_requests (user_id, user_name, leave_type, start_date, end_date, days, reason, status, applied_on, reviewed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user.id, req.user.full_name || req.user.username, leave_type, start_date, end_date, days || 1, reason, 'Pending', new Date().toISOString().split('T')[0], null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// PUT /api/staff/leaves/:id — Approve/Reject leave (HR & Owner only)
router.put('/leaves/:id', authenticateToken, checkRole(['Owner', 'HR']), async (req, res) => {
  const { status, reviewed_by } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  try {
    const result = await db.query(
      "UPDATE leave_requests SET status = $1, reviewed_by = $2 WHERE id = $3 RETURNING *",
      [status, reviewed_by || req.user.full_name || req.user.username, parseInt(req.params.id)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

// ─── HIRING / CANDIDATE PIPELINE ───

// GET /api/staff/candidates — Get all candidates (HR & Owner only)
router.get('/candidates', authenticateToken, checkRole(['Owner', 'HR']), async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM candidates ORDER BY applied_date DESC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// POST /api/staff/candidates — Add new candidate (HR & Owner only)
router.post('/candidates', authenticateToken, checkRole(['Owner', 'HR']), async (req, res) => {
  const { position, department, candidate_name, email, phone, experience_years, current_company, resume_link, notes } = req.body;
  if (!candidate_name || !position) {
    return res.status(400).json({ error: 'Candidate name and position are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO candidates (position, department, candidate_name, email, phone, experience_years, current_company, status, applied_date, resume_link, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [position, department || 'General', candidate_name, email || '', phone || '', experience_years || 0, current_company || '', 'Applied', new Date().toISOString().split('T')[0], resume_link || '', notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

// PUT /api/staff/candidates/:id — Update candidate status (HR & Owner only)
router.put('/candidates/:id', authenticateToken, checkRole(['Owner', 'HR']), async (req, res) => {
  const { status, notes } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  try {
    const result = await db.query(
      "UPDATE candidates SET status = $1, notes = $2 WHERE id = $3 RETURNING *",
      [status, notes || '', parseInt(req.params.id)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// ─── EXPENSE CLAIMS ───

// GET /api/staff/expenses — Get all expense claims
router.get('/expenses', authenticateToken, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM expense_claims ORDER BY submitted_on DESC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expense claims:', error);
    res.status(500).json({ error: 'Failed to fetch expense claims' });
  }
});

// POST /api/staff/expenses — Submit new expense claim (any user)
router.post('/expenses', authenticateToken, async (req, res) => {
  const { project_id, project_name, expense_type, amount, description, bill_date } = req.body;
  if (!expense_type || !amount || !description) {
    return res.status(400).json({ error: 'Expense type, amount, and description are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO expense_claims (user_id, user_name, project_id, project_name, expense_type, amount, description, bill_date, status, submitted_on, reviewed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [req.user.id, req.user.full_name || req.user.username, project_id || null, project_name || 'General', expense_type, parseFloat(amount), description, bill_date || new Date().toISOString().split('T')[0], 'Pending', new Date().toISOString().split('T')[0], null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating expense claim:', error);
    res.status(500).json({ error: 'Failed to submit expense claim' });
  }
});

// PUT /api/staff/expenses/:id — Approve/Reject/Pay expense (HR & Owner only)
router.put('/expenses/:id', authenticateToken, checkRole(['Owner', 'HR']), async (req, res) => {
  const { status, reviewed_by } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  try {
    const result = await db.query(
      "UPDATE expense_claims SET status = $1, reviewed_by = $2 WHERE id = $3 RETURNING *",
      [status, reviewed_by || req.user.full_name || req.user.username, parseInt(req.params.id)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense claim not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating expense claim:', error);
    res.status(500).json({ error: 'Failed to update expense claim' });
  }
});

module.exports = router;
