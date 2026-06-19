const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Mock database for B2C Residential Projects (Net Metering & Loans)
let b2cProjects = [
  { 
    id: 1, 
    lead_id: 1, 
    customer_name: 'Rajesh Patel', 
    phone: '9876543210', 
    kw_capacity: 5,
    project_value: 300000,
    subsidy_amount: 78000,
    loan_opted: true,
    loan_provider: 'CreditFair',
    loan_status: 'Sanctioned',
    loan_sanctioned_amount: 250000,
    downpayment_collected: 50000,
    net_metering_stage: 'Feasibility Approval',
    created_at: '2026-06-18'
  },
  { 
    id: 2, 
    lead_id: 6, 
    customer_name: 'Kavita Sharma', 
    phone: '9876543215', 
    kw_capacity: 3,
    project_value: 180000,
    subsidy_amount: 78000,
    loan_opted: false,
    loan_provider: null,
    loan_status: 'NA',
    loan_sanctioned_amount: 0,
    downpayment_collected: 180000,
    net_metering_stage: 'Net Metering Application',
    created_at: '2026-06-15'
  }
];

// GET /api/b2c/projects
router.get('/projects', authenticateToken, (req, res) => {
  res.json(b2cProjects);
});

// PUT /api/b2c/projects/:id (Update milestone or loan status)
router.put('/projects/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const index = b2cProjects.findIndex(p => p.id === parseInt(id));
  if (index === -1) return res.status(404).json({ error: 'Project not found' });
  
  b2cProjects[index] = { ...b2cProjects[index], ...updates };
  res.json(b2cProjects[index]);
});

// POST /api/b2c/projects (Create new project from Won lead)
router.post('/projects', authenticateToken, (req, res) => {
  const newProject = {
    id: Date.now(),
    ...req.body,
    net_metering_stage: 'Registration & Application',
    created_at: new Date().toISOString().split('T')[0]
  };
  b2cProjects.unshift(newProject);
  res.status(201).json(newProject);
});

module.exports = router;
