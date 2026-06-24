/**
 * DATABASE MODULE — Solar EPC + Distribution Internal Dashboard
 * =============================================================
 * This module handles ALL database operations. It tries to connect to PostgreSQL first,
 * but if PostgreSQL is unavailable, it seamlessly falls back to an in-memory mock database.
 * 
 * TABLES MANAGED:
 *   users, leads, customers, projects, project_milestones, inventory,
 *   payments, tasks, webhook_logs, ai_suggestions, system_logs
 * 
 * HOW IT WORKS:
 *   1. On startup, it attempts a PostgreSQL connection
 *   2. If PG fails (not installed, wrong password, etc.), it switches to mock mode
 *   3. Mock mode stores everything in JavaScript arrays (lost on restart)
 *   4. The `query()` function works identically in both modes
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
let pool = null;
let useMockDb = false;

// ============================================================================
// IN-MEMORY MOCK DATABASE — All tables stored as arrays of objects
// ============================================================================
const mockDb = {
  users: [],
  leads: [],
  customers: [],
  projects: [],
  project_milestones: [],
  inventory: [],
  payments: [],
  tasks: [],
  webhook_logs: [],
  ai_suggestions: [],
  system_logs: [],
  vendors: [],
  vendor_ledgers: [],
  material_dispatches: [],
  attendance: [],
  leave_requests: [],
  candidates: [],
  expense_claims: [],
  system_settings: []
};

// Helper: generate next ID for a table
const nextId = (table) => {
  if (mockDb[table].length === 0) return 1;
  return Math.max(...mockDb[table].map(r => r.id)) + 1;
};

// Helper: current ISO timestamp
const now = () => new Date().toISOString();

// ============================================================================
// SEED DATA — Realistic Solar EPC business data with Indian names
// ============================================================================
const seedMockDb = async () => {
  console.log('[Mock DB] Seeding initial mock database in memory...');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password123', salt);

  // --- USERS (5 default users as specified) ---
  mockDb.users = [
    { id: 1, username: 'owner', password_hash: hash, designation: 'Owner', full_name: 'Rajesh Gupta', email: 'rajesh@suncraftpower.in' },
    { id: 2, username: 'hr_user', password_hash: hash, designation: 'HR', full_name: 'Priya Sharma', email: 'priya@suncraftpower.in' },
    { id: 3, username: 'sales_user', password_hash: hash, designation: 'Sales Head', full_name: 'Amit Verma', email: 'amit@suncraftpower.in' },
    { id: 4, username: 'ops_user', password_hash: hash, designation: 'Operations Head', full_name: 'Suresh Patel', email: 'suresh@suncraftpower.in' },
    { id: 5, username: 'b2b_sales', password_hash: hash, designation: 'B2B Sales', full_name: 'Ankit Sharma', email: 'ankit@suncraftpower.in' }
  ];

  // --- LEADS (Solar EPC leads from various sources) ---
  mockDb.leads = [
    { id: 1, name: 'Vikram Malhotra', phone: '9876543210', email: 'vikram.m@gmail.com', source: 'Website', stage: 'New', assigned_to: 'Amit Verma', kw_capacity: 10, monthly_bill: 8500, roof_area: 600, ai_score: 85, notes: 'Interested in rooftop solar for home', created_at: '2026-05-15T10:30:00Z', updated_at: '2026-05-15T10:30:00Z' },
    { id: 2, name: 'Sunita Reddy', phone: '9123456789', email: 'sunita.r@yahoo.com', source: 'Referral', stage: 'Contacted', assigned_to: 'Amit Verma', kw_capacity: 25, monthly_bill: 35000, roof_area: 2000, ai_score: 92, notes: 'Factory owner, wants to reduce electricity costs', created_at: '2026-05-20T14:00:00Z', updated_at: '2026-06-01T09:00:00Z' },
    { id: 3, name: 'Arun Krishnamurthy', phone: '9988776655', email: 'arun.k@outlook.com', source: 'IndiaMART', stage: 'Site Visit Done', assigned_to: 'Amit Verma', kw_capacity: 50, monthly_bill: 85000, roof_area: 5000, ai_score: 78, notes: 'Warehouse rooftop, needs structural assessment', created_at: '2026-04-10T08:00:00Z', updated_at: '2026-06-10T11:30:00Z' },
    { id: 4, name: 'Neha Joshi', phone: '9871234567', email: 'neha.j@gmail.com', source: 'Facebook Ads', stage: 'Proposal Sent', assigned_to: 'Amit Verma', kw_capacity: 5, monthly_bill: 4200, roof_area: 350, ai_score: 70, notes: 'Small residential system, budget-conscious', created_at: '2026-06-01T16:00:00Z', updated_at: '2026-06-12T15:00:00Z' },
    { id: 5, name: 'Rajendra Singh', phone: '9012345678', email: 'rajendra.s@corp.in', source: 'Google Ads', stage: 'Negotiation', assigned_to: 'Amit Verma', kw_capacity: 100, monthly_bill: 250000, roof_area: 10000, ai_score: 95, notes: 'Large industrial plant, high potential deal', created_at: '2026-03-25T09:00:00Z', updated_at: '2026-06-15T10:00:00Z' },
    { id: 6, name: 'Kavita Bansal', phone: '9876001234', email: 'kavita.b@gmail.com', source: 'Walk-in', stage: 'Won', assigned_to: 'Amit Verma', kw_capacity: 8, monthly_bill: 6500, roof_area: 500, ai_score: 88, notes: 'Converted! Installation scheduled for next month', created_at: '2026-02-10T11:00:00Z', updated_at: '2026-06-05T14:00:00Z' },
    { id: 7, name: 'Deepak Agarwal', phone: '9998887776', email: 'deepak.a@biz.com', source: 'Website', stage: 'Lost', assigned_to: 'Amit Verma', kw_capacity: 15, monthly_bill: 12000, roof_area: 900, ai_score: 45, notes: 'Went with competitor - price issue', created_at: '2026-04-01T13:00:00Z', updated_at: '2026-05-28T16:00:00Z' },
    { id: 8, name: 'Pooja Nair', phone: '9112233445', email: 'pooja.n@company.co.in', source: 'Referral', stage: 'New', assigned_to: 'Amit Verma', kw_capacity: 20, monthly_bill: 22000, roof_area: 1500, ai_score: 80, notes: 'IT park office, referred by Vikram Malhotra', created_at: '2026-06-18T09:00:00Z', updated_at: '2026-06-18T09:00:00Z' }
  ];

  // --- CUSTOMERS (converted leads) ---
  mockDb.customers = [
    { id: 1, lead_id: 6, name: 'Kavita Bansal', phone: '9876001234', email: 'kavita.b@gmail.com', address: '42, Green Park Colony', city: 'Jaipur', state: 'Rajasthan', roof_type: 'RCC Flat Roof', created_at: '2026-06-05T14:00:00Z' },
    { id: 2, lead_id: null, name: 'Mahesh Choudhary', phone: '9334455667', email: 'mahesh.c@factory.in', address: '1201, RIICO Industrial Area', city: 'Bhiwadi', state: 'Rajasthan', roof_type: 'Metal Sheet', created_at: '2025-11-10T10:00:00Z' },
    { id: 3, lead_id: null, name: 'Sanjay Mehta', phone: '9445566778', email: 'sanjay.m@group.com', address: '78, MG Road', city: 'Ahmedabad', state: 'Gujarat', roof_type: 'RCC Flat Roof', created_at: '2025-08-20T12:00:00Z' }
  ];

  // --- PROJECTS (active Solar EPC projects) ---
  mockDb.projects = [
    { id: 1, customer_id: 1, project_name: 'Bansal Residence 8kW Rooftop', site_address: '42, Green Park Colony, Jaipur', kw_capacity: 8, project_value: 480000, current_milestone: 'Panel Installation', status: 'In Progress', start_date: '2026-06-10', expected_completion: '2026-07-15', created_at: '2026-06-05T14:30:00Z' },
    { id: 2, customer_id: 2, project_name: 'Choudhary Factory 50kW Commercial', site_address: '1201, RIICO Industrial Area, Bhiwadi', kw_capacity: 50, project_value: 2800000, current_milestone: 'Commissioning', status: 'In Progress', start_date: '2025-12-01', expected_completion: '2026-06-30', created_at: '2025-11-15T09:00:00Z' },
    { id: 3, customer_id: 3, project_name: 'Mehta Group 100kW Industrial', site_address: '78, MG Road, Ahmedabad', kw_capacity: 100, project_value: 5500000, current_milestone: 'Net Metering Application', status: 'Completed', start_date: '2025-09-01', expected_completion: '2026-03-15', created_at: '2025-08-25T11:00:00Z' }
  ];

  // --- PROJECT MILESTONES ---
  const milestoneTemplate = [
    'Site Survey', 'Design Approval', 'Material Procurement',
    'Structure Installation', 'Panel Installation', 'Electrical Wiring',
    'Inverter Setup', 'Commissioning', 'Net Metering Application', 'Handover'
  ];

  mockDb.project_milestones = [];
  let msId = 1;

  // Project 1: Bansal Residence — currently at Panel Installation (milestone 5)
  milestoneTemplate.forEach((name, idx) => {
    mockDb.project_milestones.push({
      id: msId++, project_id: 1, milestone_name: name, milestone_order: idx + 1,
      status: idx < 4 ? 'Completed' : (idx === 4 ? 'In Progress' : 'Pending'),
      completed_date: idx < 4 ? '2026-06-' + String(10 + idx * 2).padStart(2, '0') : null,
      notes: idx < 4 ? 'Completed on schedule' : null
    });
  });

  // Project 2: Choudhary Factory — at Commissioning (milestone 8)
  milestoneTemplate.forEach((name, idx) => {
    mockDb.project_milestones.push({
      id: msId++, project_id: 2, milestone_name: name, milestone_order: idx + 1,
      status: idx < 7 ? 'Completed' : (idx === 7 ? 'In Progress' : 'Pending'),
      completed_date: idx < 7 ? '2026-0' + (idx < 3 ? '1' : (idx < 6 ? '3' : '5')) + '-' + String(5 + idx * 3).padStart(2, '0') : null,
      notes: idx < 7 ? 'Completed' : null
    });
  });

  // Project 3: Mehta Group — fully completed
  milestoneTemplate.forEach((name, idx) => {
    mockDb.project_milestones.push({
      id: msId++, project_id: 3, milestone_name: name, milestone_order: idx + 1,
      status: 'Completed',
      completed_date: '2026-0' + Math.min(idx + 1, 3) + '-' + String(5 + idx * 2).padStart(2, '0'),
      notes: 'Completed'
    });
  });

  // --- INVENTORY (Solar equipment & components) ---
  mockDb.inventory = [
    { id: 1, item_name: 'Mono PERC Solar Panel 545W (Tier-1)', item_code: 'PNL-545-MONO', category: 'Solar Panels', stock_level: 120, reserved_for_projects: 30, price: 14500, supplier: 'Waaree Energies', reorder_level: 50 },
    { id: 2, item_name: 'Mono PERC Solar Panel 440W', item_code: 'PNL-440-MONO', category: 'Solar Panels', stock_level: 85, reserved_for_projects: 20, price: 11800, supplier: 'Adani Solar', reorder_level: 40 },
    { id: 3, item_name: 'Bifacial Solar Panel 550W', item_code: 'PNL-550-BFCL', category: 'Solar Panels', stock_level: 40, reserved_for_projects: 15, price: 16200, supplier: 'Trina Solar', reorder_level: 30 },
    { id: 4, item_name: 'On-Grid String Inverter 10kW', item_code: 'INV-10K-GRID', category: 'Inverters', stock_level: 12, reserved_for_projects: 3, price: 85000, supplier: 'Growatt', reorder_level: 5 },
    { id: 5, item_name: 'On-Grid String Inverter 25kW', item_code: 'INV-25K-GRID', category: 'Inverters', stock_level: 6, reserved_for_projects: 2, price: 165000, supplier: 'Sungrow', reorder_level: 3 },
    { id: 6, item_name: 'Hybrid Inverter 5kW', item_code: 'INV-5K-HYB', category: 'Inverters', stock_level: 8, reserved_for_projects: 1, price: 72000, supplier: 'Deye', reorder_level: 4 },
    { id: 7, item_name: 'Lithium Battery 5.12kWh (LiFePO4)', item_code: 'BAT-5K-LFP', category: 'Batteries', stock_level: 10, reserved_for_projects: 2, price: 135000, supplier: 'Pylontech', reorder_level: 5 },
    { id: 8, item_name: 'Lithium Battery 10kWh Wall-Mount', item_code: 'BAT-10K-WALL', category: 'Batteries', stock_level: 3, reserved_for_projects: 1, price: 245000, supplier: 'BYD', reorder_level: 3 },
    { id: 9, item_name: 'GI Mounting Structure (per kW)', item_code: 'MNT-GI-1KW', category: 'Mounting Structures', stock_level: 200, reserved_for_projects: 60, price: 3500, supplier: 'Strolar India', reorder_level: 80 },
    { id: 10, item_name: 'Elevated Mounting Structure (per kW)', item_code: 'MNT-ELV-1KW', category: 'Mounting Structures', stock_level: 50, reserved_for_projects: 20, price: 5500, supplier: 'Strolar India', reorder_level: 25 },
    { id: 11, item_name: 'DC Cable 4mm² (per meter)', item_code: 'CBL-DC-4MM', category: 'Cables & Wiring', stock_level: 2000, reserved_for_projects: 500, price: 35, supplier: 'Polycab', reorder_level: 500 },
    { id: 12, item_name: 'DC Cable 6mm² (per meter)', item_code: 'CBL-DC-6MM', category: 'Cables & Wiring', stock_level: 1500, reserved_for_projects: 400, price: 48, supplier: 'Polycab', reorder_level: 400 },
    { id: 13, item_name: 'AC Cable 6mm² 3-Core (per meter)', item_code: 'CBL-AC-6MM3', category: 'Cables & Wiring', stock_level: 800, reserved_for_projects: 200, price: 85, supplier: 'Havells', reorder_level: 300 },
    { id: 14, item_name: 'MC4 Connector Pair', item_code: 'CON-MC4-PR', category: 'Connectors & Accessories', stock_level: 500, reserved_for_projects: 100, price: 120, supplier: 'Staubli India', reorder_level: 150 },
    { id: 15, item_name: 'DC Distribution Box 4-in-1-out', item_code: 'DCDB-4IN1', category: 'Connectors & Accessories', stock_level: 15, reserved_for_projects: 5, price: 4500, supplier: 'Elmex Controls', reorder_level: 8 },
    { id: 16, item_name: 'AC Distribution Box (ACDB)', item_code: 'ACDB-STD', category: 'Connectors & Accessories', stock_level: 18, reserved_for_projects: 4, price: 5200, supplier: 'Elmex Controls', reorder_level: 8 },
    { id: 17, item_name: 'Solar Net Meter Bi-directional', item_code: 'MTR-NET-BI', category: 'Meters & Monitoring', stock_level: 10, reserved_for_projects: 3, price: 3800, supplier: 'Genus Innovation', reorder_level: 5 },
    { id: 18, item_name: 'WiFi Monitoring Dongle', item_code: 'MON-WIFI-DNG', category: 'Meters & Monitoring', stock_level: 25, reserved_for_projects: 5, price: 2200, supplier: 'Growatt', reorder_level: 10 },
    { id: 19, item_name: 'Earthing Kit Complete', item_code: 'ERTH-KIT-01', category: 'Safety & Earthing', stock_level: 30, reserved_for_projects: 8, price: 2800, supplier: 'Safe Earthing', reorder_level: 10 },
    { id: 20, item_name: 'Lightning Arrestor', item_code: 'LA-TYPE2', category: 'Safety & Earthing', stock_level: 2, reserved_for_projects: 1, price: 8500, supplier: 'DEHN India', reorder_level: 5 }
  ];

  // --- PAYMENTS ---
  mockDb.payments = [
    { id: 1, project_id: 1, customer_name: 'Kavita Bansal', amount: 144000, payment_type: 'Advance', milestone_ref: 'Booking Advance (30%)', status: 'Paid', due_date: '2026-06-08', paid_date: '2026-06-07', notes: 'Advance received via NEFT' },
    { id: 2, project_id: 1, customer_name: 'Kavita Bansal', amount: 192000, payment_type: 'Milestone', milestone_ref: 'Material Delivery (40%)', status: 'Paid', due_date: '2026-06-15', paid_date: '2026-06-14', notes: 'Paid on material delivery' },
    { id: 3, project_id: 1, customer_name: 'Kavita Bansal', amount: 144000, payment_type: 'Milestone', milestone_ref: 'Commissioning (30%)', status: 'Pending', due_date: '2026-07-15', paid_date: null, notes: 'Due on project completion' },
    { id: 4, project_id: 2, customer_name: 'Mahesh Choudhary', amount: 840000, payment_type: 'Advance', milestone_ref: 'Booking Advance (30%)', status: 'Paid', due_date: '2025-11-20', paid_date: '2025-11-18', notes: 'RTGS received' },
    { id: 5, project_id: 2, customer_name: 'Mahesh Choudhary', amount: 1120000, payment_type: 'Milestone', milestone_ref: 'Material & Structure (40%)', status: 'Paid', due_date: '2026-02-01', paid_date: '2026-02-03', notes: 'Paid 2 days late' },
    { id: 6, project_id: 2, customer_name: 'Mahesh Choudhary', amount: 840000, payment_type: 'Milestone', milestone_ref: 'Commissioning (30%)', status: 'Overdue', due_date: '2026-06-10', paid_date: null, notes: 'OVERDUE — follow up required' },
    { id: 7, project_id: 3, customer_name: 'Sanjay Mehta', amount: 1650000, payment_type: 'Advance', milestone_ref: 'Booking Advance (30%)', status: 'Paid', due_date: '2025-09-01', paid_date: '2025-08-28', notes: 'Cheque cleared' },
    { id: 8, project_id: 3, customer_name: 'Sanjay Mehta', amount: 2200000, payment_type: 'Milestone', milestone_ref: 'Material & Structure (40%)', status: 'Paid', due_date: '2025-11-15', paid_date: '2025-11-14', notes: 'NEFT' },
    { id: 9, project_id: 3, customer_name: 'Sanjay Mehta', amount: 1650000, payment_type: 'Final', milestone_ref: 'Handover (30%)', status: 'Paid', due_date: '2026-03-20', paid_date: '2026-03-18', notes: 'Final payment cleared' }
  ];

  // --- TASKS ---
  mockDb.tasks = [
    { id: 1, assigned_to: 'Suresh Patel', title: 'Procure panels for Bansal project', description: 'Order 15x 545W Mono PERC panels from Waaree', priority: 'High', status: 'Completed', related_project_id: 1, due_date: '2026-06-12', created_at: '2026-06-06T09:00:00Z' },
    { id: 2, assigned_to: 'Amit Verma', title: 'Follow up with Rajendra Singh', description: 'Call to discuss final pricing for 100kW project. He has budget concerns.', priority: 'High', status: 'In Progress', related_project_id: null, due_date: '2026-06-20', created_at: '2026-06-15T10:00:00Z' },
    { id: 3, assigned_to: 'Suresh Patel', title: 'Schedule commissioning for Choudhary', description: 'Coordinate with DISCOM for commissioning date. Net meter application pending.', priority: 'High', status: 'In Progress', related_project_id: 2, due_date: '2026-06-25', created_at: '2026-06-10T11:00:00Z' },
    { id: 4, assigned_to: 'Amit Verma', title: 'Send proposal to Pooja Nair', description: 'Prepare and email 20kW commercial rooftop proposal', priority: 'Medium', status: 'Pending', related_project_id: null, due_date: '2026-06-22', created_at: '2026-06-18T09:30:00Z' },
    { id: 5, assigned_to: 'Suresh Patel', title: 'Restock lightning arrestors', description: 'Only 2 units left. Place order for 10 units from DEHN India.', priority: 'Medium', status: 'Pending', related_project_id: null, due_date: '2026-06-23', created_at: '2026-06-17T14:00:00Z' },
    { id: 6, assigned_to: 'Priya Sharma', title: 'Update employee handbook', description: 'Add solar safety protocols section for site workers', priority: 'Low', status: 'Pending', related_project_id: null, due_date: '2026-06-30', created_at: '2026-06-15T08:00:00Z' },
    { id: 7, assigned_to: 'Amit Verma', title: 'Collect Choudhary overdue payment', description: 'Rs 8.4L commissioning payment overdue. Contact Mahesh Choudhary.', priority: 'Critical', status: 'In Progress', related_project_id: 2, due_date: '2026-06-19', created_at: '2026-06-11T10:00:00Z' }
  ];

  // --- WEBHOOK LOGS ---
  mockDb.webhook_logs = [
    { id: 1, direction: 'outbound', workflow_name: 'New Lead Notification', payload: JSON.stringify({ lead_name: 'Pooja Nair', source: 'Referral' }), status: 'success', created_at: '2026-06-18T09:05:00Z' },
    { id: 2, direction: 'outbound', workflow_name: 'Payment Overdue Alert', payload: JSON.stringify({ customer: 'Mahesh Choudhary', amount: 840000 }), status: 'success', created_at: '2026-06-11T10:30:00Z' },
    { id: 3, direction: 'inbound', workflow_name: 'IndiaMART Lead Import', payload: JSON.stringify({ name: 'Arun Krishnamurthy', phone: '9988776655' }), status: 'success', created_at: '2026-04-10T08:05:00Z' }
  ];

  // --- AI SUGGESTIONS ---
  mockDb.ai_suggestions = [
    { id: 1, suggestion_type: 'lead_priority', title: 'High-Value Lead Alert', description: 'Rajendra Singh (100kW industrial) has been in Negotiation stage for 2+ months. Recommend scheduling an in-person meeting to close the deal. Estimated value: ₹55,00,000.', priority: 'High', is_read: false, created_at: '2026-06-18T08:00:00Z' },
    { id: 2, suggestion_type: 'inventory_alert', title: 'Critical Stock: Lightning Arrestors', description: 'Lightning Arrestor (LA-TYPE2) stock is at 2 units, below reorder level of 5. With monsoon season approaching, recommend immediate reorder of 10+ units.', priority: 'Critical', is_read: false, created_at: '2026-06-18T07:30:00Z' },
    { id: 3, suggestion_type: 'payment_followup', title: 'Overdue Payment: Choudhary Factory', description: 'Mahesh Choudhary\'s commissioning payment of ₹8,40,000 is 8 days overdue. Project commissioning is pending. Recommend sending formal reminder.', priority: 'High', is_read: false, created_at: '2026-06-18T07:00:00Z' },
    { id: 4, suggestion_type: 'project_insight', title: 'Project Completion Forecast', description: 'Bansal Residence 8kW project is on track for July 15 completion. All milestones up to Panel Installation are completed. No delays detected.', priority: 'Medium', is_read: true, created_at: '2026-06-17T08:00:00Z' },
    { id: 5, suggestion_type: 'sales_tip', title: 'Optimal Follow-up Time', description: 'Data analysis shows leads contacted between 10AM-12PM on weekdays have 40% higher conversion. Recommend scheduling calls with Neha Joshi and Pooja Nair in this window.', priority: 'Low', is_read: true, created_at: '2026-06-16T08:00:00Z' }
  ];

  // --- SYSTEM LOGS ---
  mockDb.system_logs = [
    { id: 1, user_role: 'Owner', action_type: 'System Startup', details: 'Dashboard backend initialized with in-memory database.', created_at: now() },
    { id: 2, user_role: 'Sales', action_type: 'Lead Created', details: 'New lead "Pooja Nair" added from referral source.', created_at: '2026-06-18T09:00:00Z' },
    { id: 3, user_role: 'Operations', action_type: 'Inventory Check', details: 'Low stock alert generated for Lightning Arrestors.', created_at: '2026-06-17T14:00:00Z' },
    { id: 4, user_role: 'Sales', action_type: 'Stage Update', details: 'Lead "Rajendra Singh" moved to Negotiation stage.', created_at: '2026-06-15T10:00:00Z' },
    { id: 5, user_role: 'Operations', action_type: 'Project Update', details: 'Bansal Residence project — Panel Installation milestone started.', created_at: '2026-06-14T09:00:00Z' }
  ];

  // --- VENDORS ---
  mockDb.vendors = [
    { id: 1, name: 'Waaree Energies Ltd', gstin: '27AAAAA1111A1Z1', contact: 'sales@waaree.com', credit_balance: 450000 },
    { id: 2, name: 'Growatt New Energy', gstin: '27BBBBB2222B2Z2', contact: 'service@growatt.com', credit_balance: 120000 },
    { id: 3, name: 'Adani Solar Manufacturing', gstin: '27CCCCC3333C3Z3', contact: 'orders@adanisolar.com', credit_balance: 0 }
  ];

  // --- VENDOR LEDGERS ---
  mockDb.vendor_ledgers = [
    { id: 1, vendor_id: 1, transaction_type: 'Credit', amount: 450000, description: 'Bulk Purchase of Mono PERC Panels 540Wp', created_at: '2026-06-01T10:00:00Z' },
    { id: 2, vendor_id: 2, transaction_type: 'Credit', amount: 120000, description: 'Procured 10 units of 10kW Hybrid Inverters', created_at: '2026-06-10T14:30:00Z' },
    { id: 3, vendor_id: 1, transaction_type: 'Debit', amount: 200000, description: 'Advance part payment for panel shipment', created_at: '2026-06-15T09:00:00Z' }
  ];

  // --- MATERIAL DISPATCHES ---
  mockDb.material_dispatches = [
    { id: 1, project_id: 1, item_name: 'Mono PERC Solar Panel 550Wp', quantity: 16, status: 'Delivered', dispatched_at: '2026-06-11T09:00:00Z' },
    { id: 2, project_id: 2, item_name: 'Aluminum Solar Panel Mounting Rail 4.2m', quantity: 40, status: 'Dispatched', dispatched_at: '2026-06-17T11:30:00Z' },
    { id: 3, project_id: 1, item_name: 'MC4 Connectors Male/Female (Pair)', quantity: 30, status: 'Pending', dispatched_at: '2026-06-18T10:00:00Z' }
  ];

  // --- ATTENDANCE ---
  mockDb.attendance = [
    { id: 1, user_id: 3, date: now().split('T')[0], status: 'Present', check_in: '09:15 AM', check_out: '', current_activity: 'Field Site Survey at Bansal Residence' },
    { id: 2, user_id: 4, date: now().split('T')[0], status: 'Present', check_in: '09:00 AM', check_out: '', current_activity: 'At Bhiwadi Factory Warehouse' },
    { id: 3, user_id: 5, date: now().split('T')[0], status: 'Present', check_in: '09:30 AM', check_out: '06:00 PM', current_activity: 'Checked out' }
  ];

  // --- LEAVE REQUESTS ---
  mockDb.leave_requests = [
    { id: 1, user_id: 3, user_name: 'Amit Verma', leave_type: 'Casual', start_date: '2026-06-20', end_date: '2026-06-21', days: 2, reason: 'Family function in hometown', status: 'Pending', applied_on: '2026-06-17', reviewed_by: null },
    { id: 2, user_id: 4, user_name: 'Suresh Patel', leave_type: 'Sick', start_date: '2026-06-15', end_date: '2026-06-16', days: 2, reason: 'Fever and body ache', status: 'Approved', applied_on: '2026-06-14', reviewed_by: 'Priya Sharma' },
    { id: 3, user_id: 5, user_name: 'Ankit Sharma', leave_type: 'Earned', start_date: '2026-07-01', end_date: '2026-07-05', days: 5, reason: 'Annual vacation trip to Shimla', status: 'Pending', applied_on: '2026-06-18', reviewed_by: null },
    { id: 4, user_id: 3, user_name: 'Amit Verma', leave_type: 'Half Day', start_date: '2026-06-12', end_date: '2026-06-12', days: 0.5, reason: 'Doctor appointment in afternoon', status: 'Approved', applied_on: '2026-06-11', reviewed_by: 'Priya Sharma' },
    { id: 5, user_id: 4, user_name: 'Suresh Patel', leave_type: 'Casual', start_date: '2026-06-25', end_date: '2026-06-25', days: 1, reason: 'Personal work at bank', status: 'Rejected', applied_on: '2026-06-18', reviewed_by: 'Priya Sharma' },
    { id: 6, user_id: 2, user_name: 'Priya Sharma', leave_type: 'Earned', start_date: '2026-07-10', end_date: '2026-07-12', days: 3, reason: 'Sister wedding ceremony', status: 'Pending', applied_on: '2026-06-19', reviewed_by: null }
  ];

  // --- CANDIDATES (Hiring Pipeline) ---
  mockDb.candidates = [
    { id: 1, position: 'Senior Site Engineer', department: 'Engineering', candidate_name: 'Rohit Mehra', email: 'rohit.m@gmail.com', phone: '9876123450', experience_years: 5, current_company: 'Tata Power Solar', status: 'Interview Scheduled', applied_date: '2026-06-10', resume_link: '#', notes: 'Strong experience in 50kW+ commercial installations' },
    { id: 2, position: 'Solar Installer Technician', department: 'Operations', candidate_name: 'Manoj Kumar', email: 'manoj.k@yahoo.com', phone: '9812345670', experience_years: 3, current_company: 'Local Contractor', status: 'Applied', applied_date: '2026-06-16', resume_link: '#', notes: 'Knows panel mounting and DC wiring' },
    { id: 3, position: 'B2B Telecaller', department: 'Sales', candidate_name: 'Sneha Gupta', email: 'sneha.g@gmail.com', phone: '9998877665', experience_years: 2, current_company: 'SolarEdge India', status: 'Technical Round', applied_date: '2026-06-05', resume_link: '#', notes: 'Excellent communication, knows solar industry terminology' },
    { id: 4, position: 'Design Engineer (AutoCAD)', department: 'Engineering', candidate_name: 'Vivek Agarwal', email: 'vivek.a@outlook.com', phone: '9123098765', experience_years: 4, current_company: 'Vikram Solar', status: 'Offered', applied_date: '2026-05-28', resume_link: '#', notes: 'Expert in single-line diagrams and shadow analysis' },
    { id: 5, position: 'Project Manager', department: 'Operations', candidate_name: 'Deepika Nair', email: 'deepika.n@corp.in', phone: '9087654321', experience_years: 7, current_company: 'Adani Solar', status: 'HR Round', applied_date: '2026-06-01', resume_link: '#', notes: 'Managed 200+ residential installations across Gujarat' },
    { id: 6, position: 'Electrician (Licensed)', department: 'Operations', candidate_name: 'Ram Prasad', email: 'ram.p@email.com', phone: '9234567890', experience_years: 8, current_company: 'Self Employed', status: 'Hired', applied_date: '2026-05-15', resume_link: '#', notes: 'Licensed wireman, 8 years industrial experience' },
    { id: 7, position: 'Accounts Executive', department: 'Finance', candidate_name: 'Kavya Reddy', email: 'kavya.r@gmail.com', phone: '9345678901', experience_years: 3, current_company: 'Clean Energy Co.', status: 'Rejected', applied_date: '2026-05-20', resume_link: '#', notes: 'Good profile but salary expectation too high' }
  ];

  // --- EXPENSE CLAIMS ---
  mockDb.expense_claims = [
    { id: 1, user_id: 4, user_name: 'Suresh Patel', project_id: 1, project_name: 'Bansal Residence 8kW', expense_type: 'Travel', amount: 1200, description: 'Cab to Bansal site for panel inspection', bill_date: '2026-06-15', status: 'Approved', submitted_on: '2026-06-16', reviewed_by: 'Priya Sharma' },
    { id: 2, user_id: 4, user_name: 'Suresh Patel', project_id: 2, project_name: 'Choudhary Factory 50kW', expense_type: 'Petrol', amount: 800, description: 'Bike petrol for daily site visits (5 days)', bill_date: '2026-06-14', status: 'Pending', submitted_on: '2026-06-17', reviewed_by: null },
    { id: 3, user_id: 3, user_name: 'Amit Verma', project_id: null, project_name: 'Client Meetings', expense_type: 'Food', amount: 650, description: 'Lunch with potential B2B client Mr. Singh', bill_date: '2026-06-16', status: 'Pending', submitted_on: '2026-06-17', reviewed_by: null },
    { id: 4, user_id: 5, user_name: 'Ankit Sharma', project_id: null, project_name: 'Market Survey', expense_type: 'Travel', amount: 2500, description: 'Train ticket to Ahmedabad for dealer meeting', bill_date: '2026-06-10', status: 'Approved', submitted_on: '2026-06-12', reviewed_by: 'Priya Sharma' },
    { id: 5, user_id: 4, user_name: 'Suresh Patel', project_id: 1, project_name: 'Bansal Residence 8kW', expense_type: 'Tools', amount: 1800, description: 'Crimping tool and MC4 connector kit purchase', bill_date: '2026-06-13', status: 'Paid', submitted_on: '2026-06-14', reviewed_by: 'Rajesh Gupta' },
    { id: 6, user_id: 4, user_name: 'Suresh Patel', project_id: 2, project_name: 'Choudhary Factory 50kW', expense_type: 'Accommodation', amount: 3500, description: '2 nights stay at Bhiwadi during commissioning', bill_date: '2026-06-18', status: 'Pending', submitted_on: '2026-06-19', reviewed_by: null }
  ];

  mockDb.system_settings = [
    { setting_key: 'surya_strategy_override', setting_value: 'Pitch standard SunCraft Power rates at ₹60,000 per kW. Highlight Lucknow location.' },
    { setting_key: 'active_offers', setting_value: 'Monsoon Offer: ₹5,000 cash discount on systems 5kW and above.' },
    { setting_key: 'sales_strategy', setting_value: 'Focus on central subsidy of ₹78,000.' },
    { setting_key: 'bot_whatsapp_number', setting_value: '6386434561' },
    { setting_key: 'owner_whatsapp_number', setting_value: '917052051010' },
    { setting_key: 'waha_api_url', setting_value: 'http://localhost:3000' },
    { setting_key: 'waha_api_key', setting_value: '' },
    { setting_key: 'openai_api_key', setting_value: '' },
    { setting_key: 'strategy_override_prompt', setting_value: '' },
    { setting_key: 'fallback_email_recipient', setting_value: 'alerts@suncraftpower.in' },
    { setting_key: 'controller_access_password', setting_value: 'admin123' }
  ];

  console.log('[Mock DB] Mock database seeded successfully with Solar EPC data.');
};

// ============================================================================
// PostgreSQL Connection Setup
// ============================================================================
try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false
    });
  } else {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'dashboard_db',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
    });
  }
} catch (e) {
  console.warn('PostgreSQL configuration error:', e.message);
  useMockDb = true;
}

// ============================================================================
// QUERY WRAPPER — Routes through PG or Mock depending on connection status
// ============================================================================
const query = async (text, params = []) => {
  if (useMockDb) {
    return executeMockQuery(text, params);
  }

  try {
    return await pool.query(text, params);
  } catch (err) {
    // If database unreachable, fall back to mock
    if (err.code === 'ECONNREFUSED' || err.code === '28P01' || err.code === '3D000') {
      console.warn(`[DB WARNING] PostgreSQL connection failed (${err.message}). Falling back to IN-MEMORY database.`);
      useMockDb = true;
      await seedMockDb();
      return executeMockQuery(text, params);
    }
    throw err;
  }
};

// ============================================================================
// MOCK QUERY EXECUTOR
// Parses simplified SQL and operates on the in-memory arrays.
// Not a full SQL engine — just handles the queries our routes actually use.
// ============================================================================
const executeMockQuery = (text, params) => {
  const q = text.trim().replace(/\s+/g, ' ').toLowerCase();

  // ---- USERS ----
  if (q.includes('from users where username')) {
    const user = mockDb.users.find(u => u.username === params[0]?.toLowerCase());
    return { rows: user ? [user] : [] };
  }
  if (q.includes('from users where email like') || q.includes('from users where username like')) {
    // Handling search: "SELECT * FROM users WHERE email LIKE $1 OR username LIKE $2"
    // Params are like "%amit%" or "%Amit%"
    const searchParam1 = (params[0] || '').replace(/%/g, '').toLowerCase();
    const searchParam2 = (params[1] || '').replace(/%/g, '').toLowerCase();
    const matches = mockDb.users.filter(u => 
      (u.email && u.email.toLowerCase().includes(searchParam1)) || 
      (u.username && u.username.toLowerCase().includes(searchParam2))
    );
    return { rows: matches };
  }
  if (q.includes('select count') && q.includes('from users')) {
    return { rows: [{ count: mockDb.users.length }] };
  }
  if (q.includes('select id, username, designation, full_name, email from users')) {
    return { rows: mockDb.users.map(u => ({ id: u.id, username: u.username, designation: u.designation, full_name: u.full_name, email: u.email })) };
  }
  if (q.includes('insert into users')) {
    const newUser = {
      id: nextId('users'),
      username: params[0],
      password_hash: params[1], // Already hashed in route
      designation: params[2],
      full_name: params[3],
      email: params[4]
    };
    mockDb.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }
  if (q.includes('update users set') && q.includes('where id')) {
    const id = parseInt(params[params.length - 1]);
    const user = mockDb.users.find(u => u.id === id);
    if (!user) return { rows: [], rowCount: 0 };
    if (q.includes('designation')) user.designation = params[0];
    if (q.includes('full_name')) user.full_name = params[1];
    if (q.includes('email')) user.email = params[2];
    return { rows: [user], rowCount: 1 };
  }
  if (q.includes('delete from users where id')) {
    const id = parseInt(params[0]);
    const idx = mockDb.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      mockDb.users.splice(idx, 1);
      return { rowCount: 1 };
    }
    return { rowCount: 0 };
  }

  // ---- LEADS ----
  if (q.includes('from leads where id')) {
    const lead = mockDb.leads.find(l => l.id === parseInt(params[0]));
    return { rows: lead ? [lead] : [] };
  }
  if (q.includes('select count') && q.includes('from leads')) {
    if (q.includes('where stage')) {
      const stage = params[0];
      return { rows: [{ count: mockDb.leads.filter(l => l.stage === stage).length }] };
    }
    return { rows: [{ count: mockDb.leads.length }] };
  }
  if (q.includes('insert into leads')) {
    const newLead = {
      id: nextId('leads'),
      name: params[0], phone: params[1], email: params[2], source: params[3],
      stage: params[4] || 'New', assigned_to: params[5] || null,
      kw_capacity: params[6] || null, monthly_bill: params[7] || null,
      roof_area: params[8] || null, ai_score: params[9] || null,
      notes: params[10] || '', created_at: now(), updated_at: now()
    };
    mockDb.leads.push(newLead);
    return { rows: [newLead], rowCount: 1 };
  }
  if (q.includes('update leads set') && q.includes('where id')) {
    const id = parseInt(params[params.length - 1]);
    const lead = mockDb.leads.find(l => l.id === id);
    if (!lead) return { rows: [], rowCount: 0 };
    // Generic update: parse SET field names from query
    // Our routes send specific fields, so we handle common patterns
    if (q.includes('stage')) lead.stage = params[0];
    if (q.includes('name') && !q.includes('item_name')) lead.name = params[0];
    if (q.includes('notes') && params.length > 1) lead.notes = params[params.length - 2] || lead.notes;
    lead.updated_at = now();
    return { rows: [lead], rowCount: 1 };
  }
  if (q.includes('from leads')) {
    let results = [...mockDb.leads];
    // Filter by stage if WHERE clause present
    if (q.includes('where stage') && params[0]) {
      results = results.filter(l => l.stage === params[0]);
    }
    // Filter by source
    if (q.includes('where source') && params[0]) {
      results = results.filter(l => l.source === params[0]);
    }
    return { rows: results.sort((a, b) => b.created_at.localeCompare(a.created_at)) };
  }

  // ---- CUSTOMERS ----
  if (q.includes('from customers where id')) {
    const c = mockDb.customers.find(c => c.id === parseInt(params[0]));
    return { rows: c ? [c] : [] };
  }
  if (q.includes('select count') && q.includes('from customers')) {
    return { rows: [{ count: mockDb.customers.length }] };
  }
  if (q.includes('insert into customers')) {
    const newC = {
      id: nextId('customers'),
      lead_id: params[0] || null, name: params[1], phone: params[2],
      email: params[3], address: params[4], city: params[5],
      state: params[6], roof_type: params[7] || null, created_at: now()
    };
    mockDb.customers.push(newC);
    return { rows: [newC], rowCount: 1 };
  }
  if (q.includes('from customers')) {
    return { rows: [...mockDb.customers] };
  }

  // ---- PROJECTS ----
  if (q.includes('from projects where id')) {
    const p = mockDb.projects.find(p => p.id === parseInt(params[0]));
    return { rows: p ? [p] : [] };
  }
  if (q.includes('select count') && q.includes('from projects')) {
    if (q.includes('where status')) {
      return { rows: [{ count: mockDb.projects.filter(p => p.status === params[0]).length }] };
    }
    return { rows: [{ count: mockDb.projects.length }] };
  }
  if (q.includes('insert into projects')) {
    const newP = {
      id: nextId('projects'),
      customer_id: params[0], project_name: params[1], site_address: params[2],
      kw_capacity: params[3], project_value: params[4],
      current_milestone: params[5] || 'Site Survey', status: params[6] || 'Not Started',
      start_date: params[7] || null, expected_completion: params[8] || null,
      created_at: now()
    };
    mockDb.projects.push(newP);
    return { rows: [newP], rowCount: 1 };
  }
  if (q.includes('update projects set') && q.includes('where id')) {
    const id = parseInt(params[params.length - 1]);
    const p = mockDb.projects.find(p => p.id === id);
    if (!p) return { rows: [], rowCount: 0 };
    if (q.includes('status')) p.status = params[0];
    if (q.includes('current_milestone')) p.current_milestone = params[0];
    return { rows: [p], rowCount: 1 };
  }
  if (q.includes('from projects')) {
    return { rows: [...mockDb.projects] };
  }

  // ---- PROJECT MILESTONES ----
  if (q.includes('from project_milestones where project_id') && q.includes('and id')) {
    const ms = mockDb.project_milestones.find(
      m => m.project_id === parseInt(params[0]) && m.id === parseInt(params[1])
    );
    return { rows: ms ? [ms] : [] };
  }
  if (q.includes('from project_milestones where project_id')) {
    const projectId = parseInt(params[0]);
    return {
      rows: mockDb.project_milestones
        .filter(m => m.project_id === projectId)
        .sort((a, b) => a.milestone_order - b.milestone_order)
    };
  }
  if (q.includes('update project_milestones set') && q.includes('project_id') && q.includes('milestone_name')) {
    const status = params[0];
    const projectId = parseInt(params[1]);
    const milestoneName = params[2];
    const ms = mockDb.project_milestones.find(m => m.project_id === projectId && m.milestone_name === milestoneName);
    if (ms) {
      ms.status = status;
      ms.completed_date = status === 'Completed' ? now() : ms.completed_date;
    }
    return { rows: ms ? [ms] : [], rowCount: ms ? 1 : 0 };
  }
  if (q.includes('update project_milestones set') && q.includes('where id')) {
    const id = parseInt(params[params.length - 1]);
    const ms = mockDb.project_milestones.find(m => m.id === id);
    if (!ms) return { rows: [], rowCount: 0 };
    if (q.includes('status')) ms.status = params[0];
    if (q.includes('completed_date')) ms.completed_date = params[1] || now();
    if (q.includes('notes')) ms.notes = params[params.length - 2] || ms.notes;
    return { rows: [ms], rowCount: 1 };
  }
  if (q.includes('insert into project_milestones')) {
    const newMs = {
      id: nextId('project_milestones'),
      project_id: params[0], milestone_name: params[1],
      milestone_order: params[2], status: params[3] || 'Pending',
      completed_date: null, notes: params[4] || null
    };
    mockDb.project_milestones.push(newMs);
    return { rows: [newMs], rowCount: 1 };
  }

  // ---- INVENTORY ----
  if (q.includes('from inventory where id')) {
    const item = mockDb.inventory.find(i => i.id === parseInt(params[0]));
    return { rows: item ? [item] : [] };
  }
  if (q.includes('select count') && q.includes('from inventory')) {
    return { rows: [{ count: mockDb.inventory.length }] };
  }
  if (q.includes('from inventory') && q.includes('where stock_level <= reorder_level')) {
    return { rows: mockDb.inventory.filter(i => i.stock_level <= i.reorder_level) };
  }
  if (q.includes('from inventory') && q.includes('stock_level') && q.includes('reorder_level') && q.includes('<=')) {
    return { rows: mockDb.inventory.filter(i => i.stock_level <= i.reorder_level) };
  }
  if (q.includes('insert into inventory')) {
    const newItem = {
      id: nextId('inventory'),
      item_name: params[0], item_code: params[1], category: params[2] || 'General',
      stock_level: parseInt(params[3]) || 0, reserved_for_projects: parseInt(params[4]) || 0,
      price: parseFloat(params[5]) || 0, supplier: params[6] || '',
      reorder_level: parseInt(params[7]) || 10
    };
    mockDb.inventory.push(newItem);
    return { rows: [newItem], rowCount: 1 };
  }
  if (q.includes('update inventory set') && q.includes('where id')) {
    const id = parseInt(params[params.length - 1]);
    const item = mockDb.inventory.find(i => i.id === id);
    if (!item) return { rows: [], rowCount: 0 };
    if (q.includes('stock_level')) item.stock_level = parseInt(params[0]) || item.stock_level;
    if (q.includes('reserved_for_projects')) item.reserved_for_projects = parseInt(params[1]) || item.reserved_for_projects;
    if (q.includes('price')) item.price = parseFloat(params[1]) || item.price;
    return { rows: [item], rowCount: 1 };
  }
  if (q.includes('from inventory')) {
    if (q.includes('where category') && params[0]) {
      return { rows: mockDb.inventory.filter(i => i.category === params[0]) };
    }
    return { rows: [...mockDb.inventory].sort((a, b) => a.stock_level - b.stock_level) };
  }

  // ---- PAYMENTS ----
  if (q.includes('from payments where id')) {
    const pay = mockDb.payments.find(p => p.id === parseInt(params[0]));
    return { rows: pay ? [pay] : [] };
  }
  if (q.includes('select count') && q.includes('from payments')) {
    return { rows: [{ count: mockDb.payments.length }] };
  }
  if (q.includes('from payments') && q.includes('overdue')) {
    return { rows: mockDb.payments.filter(p => p.status === 'Overdue') };
  }
  if (q.includes('from payments') && q.includes("where status = 'overdue'")) {
    return { rows: mockDb.payments.filter(p => p.status === 'Overdue') };
  }
  if (q.includes('from payments') && q.includes('where status') && params[0]) {
    return { rows: mockDb.payments.filter(p => p.status === params[0]) };
  }
  if (q.includes('insert into payments')) {
    const newPay = {
      id: nextId('payments'),
      project_id: params[0], customer_name: params[1], amount: parseFloat(params[2]),
      payment_type: params[3], milestone_ref: params[4] || '',
      status: params[5] || 'Pending', due_date: params[6] || null,
      paid_date: params[7] || null, notes: params[8] || ''
    };
    mockDb.payments.push(newPay);
    return { rows: [newPay], rowCount: 1 };
  }
  if (q.includes('update payments set') && q.includes('where id')) {
    const id = parseInt(params[params.length - 1]);
    const pay = mockDb.payments.find(p => p.id === id);
    if (!pay) return { rows: [], rowCount: 0 };
    if (q.includes('status')) pay.status = params[0];
    if (q.includes('paid_date')) pay.paid_date = params[1] || now();
    return { rows: [pay], rowCount: 1 };
  }
  if (q.includes('sum(amount)') && q.includes('from payments')) {
    const total = mockDb.payments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);
    return { rows: [{ total_collected: total }] };
  }
  if (q.includes('from payments')) {
    return { rows: [...mockDb.payments] };
  }

  // ---- TASKS ----
  if (q.includes('from tasks where id')) {
    const task = mockDb.tasks.find(t => t.id === parseInt(params[0]));
    return { rows: task ? [task] : [] };
  }
  if (q.includes('select count') && q.includes('from tasks')) {
    return { rows: [{ count: mockDb.tasks.length }] };
  }
  if (q.includes('insert into tasks')) {
    const newTask = {
      id: nextId('tasks'),
      assigned_to: params[0], title: params[1], description: params[2] || '',
      priority: params[3] || 'Medium', status: params[4] || 'Pending',
      related_project_id: params[5] || null, due_date: params[6] || null,
      created_at: now()
    };
    mockDb.tasks.push(newTask);
    return { rows: [newTask], rowCount: 1 };
  }
  if (q.includes('update tasks set status') && q.includes('where id')) {
    const id = parseInt(params[1]);
    const task = mockDb.tasks.find(t => t.id === id);
    if (task) task.status = params[0];
    return { rows: task ? [task] : [], rowCount: task ? 1 : 0 };
  }
  if (q.includes('from tasks')) {
    if (q.includes('where assigned_to') && params[0]) {
      return { rows: mockDb.tasks.filter(t => t.assigned_to === params[0]) };
    }
    return { rows: [...mockDb.tasks] };
  }

  // ---- ATTENDANCE ----
  if (q.includes('insert into attendance')) {
    const newAtt = {
      id: nextId('attendance'),
      user_id: params[0], date: params[1], status: params[2] || 'Present',
      check_in: params[3] || '09:00 AM', check_out: params[4] || '',
      current_activity: params[5] || 'Idle',
      created_at: now()
    };
    mockDb.attendance.push(newAtt);
    return { rows: [newAtt], rowCount: 1 };
  }
  if (q.includes('update attendance set')) {
    const userId = parseInt(params[params.length - 1]);
    const att = mockDb.attendance.find(a => a.user_id === userId && a.date === now().split('T')[0]);
    if (att) {
      if (q.includes('check_out')) att.check_out = params[0] || '06:00 PM';
      if (q.includes('current_activity')) att.current_activity = params[0] || att.current_activity;
      if (q.includes('status')) att.status = params[1] || att.status;
    }
    return { rows: att ? [att] : [], rowCount: att ? 1 : 0 };
  }
  if (q.includes('from attendance')) {
    return { rows: [...mockDb.attendance] };
  }

  // ---- VENDORS & LEDGERS & DISPATCHES ----
  if (q.includes('from vendors')) {
    return { rows: [...mockDb.vendors] };
  }
  if (q.includes('insert into vendors')) {
    const newVendor = {
      id: nextId('vendors'),
      name: params[0], gstin: params[1] || '', contact: params[2] || '', credit_balance: parseFloat(params[3]) || 0
    };
    mockDb.vendors.push(newVendor);
    return { rows: [newVendor], rowCount: 1 };
  }
  if (q.includes('from vendor_ledgers')) {
    return { rows: [...mockDb.vendor_ledgers] };
  }
  if (q.includes('insert into vendor_ledgers')) {
    const newL = {
      id: nextId('vendor_ledgers'),
      vendor_id: parseInt(params[0]), transaction_type: params[1], amount: parseFloat(params[2]), description: params[3] || '', created_at: now()
    };
    mockDb.vendor_ledgers.push(newL);
    return { rows: [newL], rowCount: 1 };
  }
  if (q.includes('from material_dispatches')) {
    return { rows: [...mockDb.material_dispatches] };
  }
  if (q.includes('insert into material_dispatches')) {
    const newD = {
      id: nextId('material_dispatches'),
      project_id: parseInt(params[0]), item_name: params[1], quantity: parseInt(params[2]), status: params[3] || 'Pending', dispatched_at: now()
    };
    mockDb.material_dispatches.push(newD);
    return { rows: [newD], rowCount: 1 };
  }

  // ---- WEBHOOK LOGS ----
  if (q.includes('insert into webhook_logs')) {
    let webhook_source = 'Unknown';
    let payload = '';
    let status = 'Pending';
    let error_details = '';
    
    if (q.includes('webhook_source, payload, status, error_details')) {
      webhook_source = 'WhatsApp';
      payload = params[0];
      status = 'Failed';
      error_details = params[1];
    } else if (q.includes('webhook_source, payload, status, created_at')) {
      webhook_source = 'WhatsApp';
      payload = params[0];
      status = 'Success';
    } else if (q.includes('webhook_source, payload, status')) {
      webhook_source = params[0];
      payload = params[1];
      status = params[2];
    }
    
    const newLog = {
      id: nextId('webhook_logs'),
      webhook_source,
      payload,
      status,
      error_details,
      created_at: now()
    };
    mockDb.webhook_logs.push(newLog);
    return { rows: [newLog], rowCount: 1 };
  }
  if (q.includes('from webhook_logs')) {
    return { rows: [...mockDb.webhook_logs].sort((a, b) => b.created_at.localeCompare(a.created_at)) };
  }

  // ---- SYSTEM SETTINGS ----
  if (q.includes('from system_settings')) {
    return { rows: [...mockDb.system_settings] };
  }
  if (q.includes('update system_settings') && q.includes('where setting_key')) {
    const val = params[0];
    const key = params[1];
    const setting = mockDb.system_settings.find(s => s.setting_key === key);
    if (setting) setting.setting_value = val;
    return { rows: setting ? [setting] : [], rowCount: setting ? 1 : 0 };
  }

  // ---- AI SUGGESTIONS ----
  if (q.includes('update ai_suggestions') && q.includes('where id')) {
    const id = parseInt(params[params.length - 1]);
    const sug = mockDb.ai_suggestions.find(s => s.id === id);
    if (sug) sug.is_read = true;
    return { rows: sug ? [sug] : [], rowCount: sug ? 1 : 0 };
  }
  if (q.includes('from ai_suggestions')) {
    return { rows: [...mockDb.ai_suggestions].sort((a, b) => b.created_at.localeCompare(a.created_at)) };
  }

  // ---- SYSTEM LOGS ----
  if (q.includes('insert into system_logs')) {
    const newLog = {
      id: nextId('system_logs'),
      user_role: params[0], action_type: params[1],
      details: params[2], created_at: now()
    };
    mockDb.system_logs.push(newLog);
    return { rows: [newLog], rowCount: 1 };
  }
  if (q.includes('select count') && q.includes('from system_logs')) {
    return { rows: [{ count: mockDb.system_logs.length }] };
  }
  if (q.includes('from system_logs')) {
    return { rows: [...mockDb.system_logs].sort((a, b) => b.created_at.localeCompare(a.created_at)) };
  }

  // ---- LEAVE REQUESTS ----
  if (q.includes('from leave_requests') && !q.includes('insert') && !q.includes('update')) {
    return { rows: [...mockDb.leave_requests].sort((a, b) => (b.applied_on || '').localeCompare(a.applied_on || '')) };
  }
  if (q.includes('insert into leave_requests')) {
    const newLeave = {
      id: nextId('leave_requests'),
      user_id: params[0], user_name: params[1], leave_type: params[2],
      start_date: params[3], end_date: params[4], days: params[5],
      reason: params[6], status: params[7] || 'Pending',
      applied_on: params[8] || now().split('T')[0], reviewed_by: params[9] || null
    };
    mockDb.leave_requests.push(newLeave);
    return { rows: [newLeave], rowCount: 1 };
  }
  if (q.includes('update leave_requests') && q.includes('where id')) {
    const id = parseInt(params[params.length - 1]);
    const leave = mockDb.leave_requests.find(l => l.id === id);
    if (!leave) return { rows: [], rowCount: 0 };
    if (params[0]) leave.status = params[0];
    if (params[1]) leave.reviewed_by = params[1];
    return { rows: [leave], rowCount: 1 };
  }

  // ---- CANDIDATES ----
  if (q.includes('from candidates') && !q.includes('insert') && !q.includes('update')) {
    return { rows: [...mockDb.candidates].sort((a, b) => (b.applied_date || '').localeCompare(a.applied_date || '')) };
  }
  if (q.includes('insert into candidates')) {
    const newCandidate = {
      id: nextId('candidates'),
      position: params[0], department: params[1], candidate_name: params[2],
      email: params[3], phone: params[4], experience_years: params[5],
      current_company: params[6], status: params[7] || 'Applied',
      applied_date: params[8] || now().split('T')[0],
      resume_link: params[9] || '', notes: params[10] || ''
    };
    mockDb.candidates.push(newCandidate);
    return { rows: [newCandidate], rowCount: 1 };
  }
  if (q.includes('update candidates') && q.includes('where id')) {
    const id = parseInt(params[params.length - 1]);
    const candidate = mockDb.candidates.find(c => c.id === id);
    if (!candidate) return { rows: [], rowCount: 0 };
    if (params[0]) candidate.status = params[0];
    if (params[1] !== undefined) candidate.notes = params[1];
    return { rows: [candidate], rowCount: 1 };
  }

  // ---- EXPENSE CLAIMS ----
  if (q.includes('from expense_claims') && !q.includes('insert') && !q.includes('update')) {
    return { rows: [...mockDb.expense_claims].sort((a, b) => (b.submitted_on || '').localeCompare(a.submitted_on || '')) };
  }
  if (q.includes('insert into expense_claims')) {
    const newExpense = {
      id: nextId('expense_claims'),
      user_id: params[0], user_name: params[1], project_id: params[2],
      project_name: params[3], expense_type: params[4], amount: params[5],
      description: params[6], bill_date: params[7],
      status: params[8] || 'Pending',
      submitted_on: params[9] || now().split('T')[0],
      reviewed_by: params[10] || null
    };
    mockDb.expense_claims.push(newExpense);
    return { rows: [newExpense], rowCount: 1 };
  }
  if (q.includes('update expense_claims') && q.includes('where id')) {
    const id = parseInt(params[params.length - 1]);
    const expense = mockDb.expense_claims.find(e => e.id === id);
    if (!expense) return { rows: [], rowCount: 0 };
    if (params[0]) expense.status = params[0];
    if (params[1]) expense.reviewed_by = params[1];
    return { rows: [expense], rowCount: 1 };
  }

  // ---- FALLBACK ----
  console.warn(`[Mock DB] Unhandled query: "${text}"`);
  return { rows: [] };
};

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================
const initializeDatabase = async () => {
  if (useMockDb) {
    await seedMockDb();
    return;
  }

  try {
    const client = await pool.connect();
    try {
      console.log('Database connection established. Initializing schema...');

      // Create all 11 tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          designation VARCHAR(50) NOT NULL,
          full_name VARCHAR(100),
          email VARCHAR(100)
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(100),
          source VARCHAR(50),
          stage VARCHAR(50) DEFAULT 'New',
          assigned_to VARCHAR(100),
          kw_capacity NUMERIC(10,2),
          monthly_bill NUMERIC(12,2),
          roof_area NUMERIC(10,2),
          ai_score INTEGER,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES leads(id),
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          city VARCHAR(50),
          state VARCHAR(50),
          roof_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER REFERENCES customers(id),
          project_name VARCHAR(200) NOT NULL,
          site_address TEXT,
          kw_capacity NUMERIC(10,2),
          project_value NUMERIC(14,2),
          current_milestone VARCHAR(100),
          status VARCHAR(50) DEFAULT 'Not Started',
          start_date DATE,
          expected_completion DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS project_milestones (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES projects(id),
          milestone_name VARCHAR(100) NOT NULL,
          milestone_order INTEGER,
          status VARCHAR(50) DEFAULT 'Pending',
          completed_date DATE,
          notes TEXT
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
          item_name VARCHAR(200) NOT NULL,
          item_code VARCHAR(50) UNIQUE NOT NULL,
          category VARCHAR(100),
          stock_level INTEGER DEFAULT 0,
          reserved_for_projects INTEGER DEFAULT 0,
          price NUMERIC(12,2) DEFAULT 0,
          supplier VARCHAR(100),
          reorder_level INTEGER DEFAULT 10
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES projects(id),
          customer_name VARCHAR(100),
          amount NUMERIC(14,2),
          payment_type VARCHAR(50),
          milestone_ref VARCHAR(100),
          status VARCHAR(50) DEFAULT 'Pending',
          due_date DATE,
          paid_date DATE,
          notes TEXT
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          assigned_to VARCHAR(100),
          title VARCHAR(200) NOT NULL,
          description TEXT,
          priority VARCHAR(20) DEFAULT 'Medium',
          status VARCHAR(50) DEFAULT 'Pending',
          related_project_id INTEGER,
          due_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS webhook_logs (
          id SERIAL PRIMARY KEY,
          webhook_source VARCHAR(100),
          payload TEXT,
          status VARCHAR(50),
          error_details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          setting_key VARCHAR(50) PRIMARY KEY,
          setting_value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_suggestions (
          id SERIAL PRIMARY KEY,
          suggestion_type VARCHAR(50),
          title VARCHAR(200),
          description TEXT,
          priority VARCHAR(20),
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS system_logs (
          id SERIAL PRIMARY KEY,
          user_role VARCHAR(50) NOT NULL,
          action_type VARCHAR(100) NOT NULL,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed system_settings if empty
      const settingsCount = await client.query('SELECT COUNT(*) FROM system_settings');
      if (parseInt(settingsCount.rows[0].count, 10) === 0) {
        console.log('Seeding system settings...');
        await client.query(`
          INSERT INTO system_settings (setting_key, setting_value) VALUES
          ('surya_strategy_override', 'Pitch standard SunCraft Power rates at ₹60,000 per kW. Highlight Lucknow location.'),
          ('active_offers', 'Monsoon Offer: ₹5,000 cash discount on systems 5kW and above.'),
          ('sales_strategy', 'Focus on central subsidy of ₹78,000.'),
          ('bot_whatsapp_number', '6386434561'),
          ('owner_whatsapp_number', '917052051010'),
          ('waha_api_url', 'http://localhost:3000'),
          ('waha_api_key', ''),
          ('openai_api_key', ''),
          ('strategy_override_prompt', ''),
          ('fallback_email_recipient', 'alerts@suncraftpower.in'),
          ('controller_access_password', 'admin123');
        `);
      }

      // Seed if empty (only users check shown; full seeding would mirror mockDb data)
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCount.rows[0].count, 10) === 0) {
        console.log('Seeding PostgreSQL database...');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('password123', salt);
        await client.query(`
          INSERT INTO users (username, password_hash, designation, full_name, email) VALUES
          ('owner', $1, 'Owner', 'Rajesh Gupta', 'rajesh@suncraftpower.in'),
          ('hr_user', $1, 'HR', 'Priya Sharma', 'priya@suncraftpower.in'),
          ('sales_user', $1, 'Sales Head', 'Amit Verma', 'amit@suncraftpower.in'),
          ('ops_user', $1, 'Operations Head', 'Suresh Patel', 'suresh@suncraftpower.in');
        `, [hash]);
      }

      console.log('PostgreSQL initialization complete.');
    } catch (err) {
      console.error('Schema init failed:', err.message);
      console.warn('Falling back to IN-MEMORY database.');
      useMockDb = true;
      await seedMockDb();
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('PostgreSQL connection failed:', err.message);
    console.warn('Falling back to IN-MEMORY database.');
    useMockDb = true;
    await seedMockDb();
  }
};

// Export the public API
module.exports = { query, pool, initializeDatabase, mockDb };
