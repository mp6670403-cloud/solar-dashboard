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
    stage: 'Survey Done',
    stage_history: [
      { stage: 'Survey Pending', timestamp: '2026-06-15T09:00:00Z', updated_by: 'System' },
      { stage: 'Survey Done', timestamp: '2026-06-15T11:00:00Z', updated_by: 'Suresh Patel', proof_url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80' }
    ],
    tracking_token: 'TRK-PATEL-001',
    technician_id: 4,
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
    stage: 'Survey Pending',
    stage_history: [
      { stage: 'Survey Pending', timestamp: '2026-06-15T14:00:00Z', updated_by: 'System' }
    ],
    tracking_token: 'TRK-SHARMA-002',
    technician_id: 4,
    created_at: '2026-06-15'
  }
];

// GET /api/b2c/projects
router.get('/projects', authenticateToken, (req, res) => {
  res.json(b2cProjects);
});

// GET /api/b2c/project/track/:token (PUBLIC tracking endpoint - no auth)
router.get('/project/track/:token', (req, res) => {
  const project = b2cProjects.find(p => p.tracking_token === req.params.token);
  if (!project) return res.status(404).json({ error: 'Project not found with this tracking token' });
  
  // Return a subset of fields for public tracking privacy
  res.json({
    id: project.id,
    customer_name: project.customer_name,
    kw_capacity: project.kw_capacity,
    net_metering_stage: project.net_metering_stage,
    stage: project.stage,
    stage_history: project.stage_history,
    created_at: project.created_at
  });
});

// PATCH /api/b2c/projects/:id/stage (Update project tracking stage)
router.patch('/projects/:id/stage', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { stage, proof_url } = req.body;
  
  const project = b2cProjects.find(p => p.id === parseInt(id));
  if (!project) return res.status(404).json({ error: 'Project not found' });
  
  // Rule B1: Certain stages require proof (like Survey Done, Panel Installation)
  const stagesRequiringProof = ['Survey Done', 'Panel Installation', 'Wiring & Commissioning'];
  if (stagesRequiringProof.includes(stage) && !proof_url) {
    return res.status(400).json({
      error: `Stage update to '${stage}' requires proof`,
      rule_violated: 'B1_PROOF_REQUIRED',
      suggestion: `Pehle site photo ya validation document (proof_url) upload karo.`
    });
  }
  
  project.stage = stage;
  if (!project.stage_history) project.stage_history = [];
  project.stage_history.push({
    stage,
    timestamp: new Date().toISOString(),
    updated_by: req.user?.full_name || req.user?.username || 'Owner',
    proof_url: proof_url || null
  });
  
  res.json(project);
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
    stage: 'Survey Pending',
    stage_history: [
      { stage: 'Survey Pending', timestamp: new Date().toISOString(), updated_by: req.user?.full_name || 'System' }
    ],
    tracking_token: `TRK-${(req.body.customer_name || 'CUST').replace(/\s+/g, '').toUpperCase()}-${Date.now().toString().slice(-4)}`,
    created_at: new Date().toISOString().split('T')[0]
  };
  b2cProjects.unshift(newProject);
  res.status(201).json(newProject);
});

module.exports = router;
