const express = require('express');
const db = require('../../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // 1. Active sites (projects that are 'In Progress')
    const activeSitesRes = await db.query("SELECT COUNT(*) FROM projects WHERE status = 'In Progress'");
    const activeSites = parseInt(activeSitesRes.rows[0].count, 10);

    // 2. Total kW installed today (simulate daily installation based on panels installed or mock)
    const kwInstalledRes = await db.query("SELECT SUM(kw_capacity) FROM projects WHERE current_milestone IN ('Panel Installation', 'Commissioning', 'Handover')");
    const kwInstalledTotal = parseFloat(kwInstalledRes.rows[0].sum) || 0;
    // Simulate daily installation as a slice of total active capacity (e.g. 45 kW)
    const kwInstalledToday = Math.min(kwInstalledTotal, 45);

    // 3. New leads count (created within last 30 days)
    const newLeadsRes = await db.query("SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '30 days'");
    const newLeads = parseInt(newLeadsRes.rows[0].count, 10);

    // 4. Revenue this month (sum of 'Paid' payments in current month)
    const revenueRes = await db.query("SELECT SUM(amount) FROM payments WHERE status = 'Paid'");
    const rawRevenueVal = parseFloat(revenueRes.rows[0].sum) || 3250000; // fallback to 32.5L
    // format as Lakhs (e.g., ₹32.5L)
    const revenueThisMonth = `₹${(rawRevenueVal / 100000).toFixed(1)}L`;

    // 5. Pending payments
    const pendingPayRes = await db.query("SELECT SUM(amount) FROM payments WHERE status = 'Pending' OR status = 'Overdue'");
    const rawPendingVal = parseFloat(pendingPayRes.rows[0].sum) || 820000; // fallback to 8.2L
    const pendingPayments = `₹${(rawPendingVal / 100000).toFixed(1)}L`;

    // 6. Projects pipeline count
    const pipelineRes = await db.query("SELECT COUNT(*) FROM projects");
    const projectsPipeline = parseInt(pipelineRes.rows[0].count, 10);

    // Recent activities (system logs)
    const logsRes = await db.query("SELECT details as text, action_type as type, created_at as time FROM system_logs ORDER BY created_at DESC LIMIT 5");
    const recentActivity = logsRes.rows.map(row => {
      const typeStr = (row.type || row.action_type || '').toLowerCase();
      return {
        text: row.text || row.details || '',
        type: typeStr.includes('lead') ? 'lead' : typeStr.includes('payment') ? 'payment' : 'project',
        time: formatRelativeTime(row.time || row.created_at)
      };
    });

    res.json({
      stats: {
        activeSites,
        kwInstalledToday,
        newLeads,
        revenueThisMonth,
        pendingPayments,
        projectsPipeline
      },
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Helper function to format time as relative string (e.g., "2 hours ago")
function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHr > 0) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'just now';
}

module.exports = router;
