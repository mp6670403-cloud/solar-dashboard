const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../../db');

const router = express.Router();

// 1. POST /api/field/attendance (Selfie check-in with GPS coords)
router.post('/attendance', authenticateToken, async (req, res) => {
  const { check_in, current_activity, selfie, latitude, longitude } = req.body;
  const username = req.user.username;

  try {
    // Log the attendance selfie and GPS lock
    await db.query(
      `INSERT INTO system_logs (user_role, action_type, details) 
       VALUES ($1, $2, $3)`,
      [
        req.user.designation, 
        'Attendance Check-In', 
        `User ${username} checked in at ${check_in || 'now'}. GPS: ${latitude || 'N/A'}, ${longitude || 'N/A'}. Activity: ${current_activity || 'None'}. Selfie: ${selfie ? 'Uploaded' : 'None'}`
      ]
    );

    res.json({
      success: true,
      message: 'Attendance check-in logged successfully with visual and GPS metrics.',
      check_in: check_in || new Date().toLocaleTimeString(),
      coords: { latitude, longitude }
    });
  } catch (error) {
    console.error('Error logging field attendance:', error);
    res.status(500).json({ error: 'Failed to log field attendance' });
  }
});

// 2. POST /api/field/safety-sop (Safety verification audit log)
router.post('/safety-sop', authenticateToken, async (req, res) => {
  const { itemsChecked, selfieProof } = req.body;

  try {
    await db.query(
      `INSERT INTO system_logs (user_role, action_type, details) 
       VALUES ($1, $2, $3)`,
      [
        req.user.designation, 
        'Safety SOP Audit', 
        `Technician verified ${itemsChecked?.length || 0} safety items. Selfie proof provided: ${selfieProof ? 'Yes' : 'No'}`
      ]
    );
    res.json({ success: true, message: 'Safety SOP compliance locked. Site access granted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to audit safety check' });
  }
});

module.exports = router;
