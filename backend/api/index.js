const express = require('express');
const cors = require('cors');
const db = require('../db');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/auth');
const crmRoutes = require('./routes/crm');
const projectsRoutes = require('./routes/projects');
const inventoryRoutes = require('./routes/inventory');
const paymentsRoutes = require('./routes/payments');
const workflowsRoutes = require('./routes/workflows');
const aiRoutes = require('./routes/ai');
const dashboardRoutes = require('./routes/dashboard');
const staffRoutes = require('./routes/staff');
const b2bRoutes = require('./routes/b2b');
const b2cRoutes = require('./routes/b2c');

// Legacy router (for backward compatibility)
const legacyRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json());

// Mount Modular API Routes
app.use('/api/auth', authRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/b2b', b2bRoutes);
app.use('/api/b2c', b2cRoutes);

// Mount Legacy Routes directly under /api for older clients
app.use('/api', legacyRoutes);

// Base route for sanity checks
app.get('/', (req, res) => {
  res.json({ message: 'Internal Business Dashboard Backend API is running with modular architecture' });
});

// Start DB Initialization & listen
const startServer = async () => {
  try {
    // Run DB pool initialization, table creations, and seeding
    await db.initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Backend server successfully listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Critical database initialization error. Server not started.', error);
    process.exit(1);
  }
};

startServer();
