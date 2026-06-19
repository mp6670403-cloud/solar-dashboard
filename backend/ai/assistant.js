/**
 * AI ASSISTANT MODULE — Placeholder with Mock Responses
 * =====================================================
 * This module provides AI-powered features for the dashboard.
 * Currently returns MOCK responses, but is structured to easily
 * connect to OpenAI, Gemini, Claude, or any LLM API later.
 * 
 * FEATURES:
 *   1. queryAssistant() — Natural language query about business data
 *   2. getDailySummary() — AI-generated daily business summary
 *   3. scoreLead() — AI lead scoring based on attributes
 * 
 * TO CONNECT REAL AI:
 *   1. Install the SDK: npm install openai (or equivalent)
 *   2. Add API key to .env: AI_API_KEY=your-key-here
 *   3. Replace mock returns with actual API calls
 */

/**
 * Process a natural language query about the business.
 * PLACEHOLDER: Returns mock insight based on keywords in the query.
 * 
 * @param {string} query - User's natural language question
 * @param {object} context - Optional context (user role, current page, etc.)
 * @returns {object} - AI response with answer and suggestions
 */
async function queryAssistant(query, context = {}) {
  console.log(`[AI Assistant] Processing query: "${query}"`);
  
  // TODO: Replace with actual AI API call
  // Example with OpenAI:
  // const response = await openai.chat.completions.create({
  //   model: 'gpt-4',
  //   messages: [{ role: 'user', content: query }],
  //   temperature: 0.7
  // });

  const queryLower = query.toLowerCase();
  
  // Mock responses based on keywords
  if (queryLower.includes('lead') || queryLower.includes('sales')) {
    return {
      answer: 'You currently have 8 leads in the pipeline. 1 lead (Rajendra Singh, 100kW) is in Negotiation stage with an estimated value of ₹55,00,000. I recommend prioritizing this lead as it has the highest AI score (95) and has been in negotiation for over 2 months.',
      suggestions: [
        'Schedule a meeting with Rajendra Singh this week',
        'Follow up with Neha Joshi on the sent proposal',
        'Assign new lead Pooja Nair to a sales rep'
      ],
      confidence: 0.85,
      source: 'mock'
    };
  }

  if (queryLower.includes('payment') || queryLower.includes('overdue') || queryLower.includes('collection')) {
    return {
      answer: 'There is 1 overdue payment: Mahesh Choudhary owes ₹8,40,000 for the Choudhary Factory project commissioning milestone. This payment was due on June 10th and is now 8 days overdue. Total collections to date: ₹76,36,000 across 3 projects.',
      suggestions: [
        'Send a formal payment reminder to Mahesh Choudhary',
        'Schedule a call with the customer this week',
        'Consider offering a short payment plan if needed'
      ],
      confidence: 0.90,
      source: 'mock'
    };
  }

  if (queryLower.includes('project') || queryLower.includes('milestone')) {
    return {
      answer: 'You have 3 projects: 2 In Progress and 1 Completed. The Bansal Residence 8kW project is on track with Panel Installation underway. The Choudhary Factory 50kW project is at Commissioning stage but has an overdue payment blocking progress.',
      suggestions: [
        'Resolve Choudhary payment to unblock commissioning',
        'Check panel installation progress at Bansal site',
        'Start planning next quarter\'s project pipeline'
      ],
      confidence: 0.88,
      source: 'mock'
    };
  }

  if (queryLower.includes('inventory') || queryLower.includes('stock')) {
    return {
      answer: 'Inventory alert: Lightning Arrestors (2 units) and Lithium Battery 10kWh (3 units) are at or below reorder levels. With monsoon approaching, lightning arrestors should be restocked urgently. Overall, you have 20 items across 6 categories.',
      suggestions: [
        'Place urgent order for Lightning Arrestors (10 units)',
        'Restock Lithium Battery 10kWh Wall-Mount (5 units)',
        'Review Q3 inventory forecast based on project pipeline'
      ],
      confidence: 0.92,
      source: 'mock'
    };
  }

  // Default response
  return {
    answer: `I understand you're asking about "${query}". Based on current data, your Solar EPC business is performing well with 3 active/completed projects, 8 leads in the pipeline, and ₹76L+ in collections. I'd recommend focusing on the overdue payment from Choudhary Factory and the high-value Rajendra Singh lead.`,
    suggestions: [
      'Ask me about leads, projects, payments, or inventory',
      'Try "What are my overdue payments?"',
      'Try "Which leads should I prioritize?"'
    ],
    confidence: 0.70,
    source: 'mock'
  };
}

/**
 * Generate a daily business summary.
 * PLACEHOLDER: Returns a pre-built summary with realistic data.
 * 
 * @returns {object} - Daily summary with sections
 */
async function getDailySummary() {
  console.log('[AI Assistant] Generating daily summary...');

  // TODO: Replace with actual AI-generated summary using real DB data
  return {
    date: new Date().toISOString().split('T')[0],
    greeting: 'Good morning, Rajesh! Here\'s your daily business snapshot.',
    sections: {
      leads: {
        title: '🎯 Leads & Sales',
        highlights: [
          'New lead received: Pooja Nair (20kW commercial) via referral',
          'Rajendra Singh (100kW, ₹55L) — in Negotiation for 2+ months, needs push',
          'Total pipeline: 8 leads, 2 new this month'
        ],
        action_needed: 'Follow up with Rajendra Singh and send proposal to Pooja Nair'
      },
      projects: {
        title: '🏗️ Active Projects',
        highlights: [
          'Bansal Residence 8kW — Panel installation underway, on schedule',
          'Choudhary Factory 50kW — Commissioning pending (payment blocker)',
          'Mehta Group 100kW — Completed and handed over ✅'
        ],
        action_needed: 'Resolve Choudhary payment to proceed with commissioning'
      },
      payments: {
        title: '💰 Collections',
        highlights: [
          'Total collected: ₹76,36,000',
          'Pending: ₹1,44,000 (Bansal commissioning)',
          'OVERDUE: ₹8,40,000 from Mahesh Choudhary (8 days late)'
        ],
        action_needed: 'Urgent: Follow up on Choudhary overdue payment'
      },
      inventory: {
        title: '📦 Inventory Alerts',
        highlights: [
          'Lightning Arrestors critically low (2 units vs 5 reorder level)',
          'Battery 10kWh at reorder level (3 units)',
          'All other items stocked adequately'
        ],
        action_needed: 'Place urgent order for lightning arrestors before monsoon'
      }
    },
    overall_health: 'Good — 1 critical action item (overdue payment), 1 urgent restock needed',
    source: 'mock'
  };
}

/**
 * Score a lead using AI analysis.
 * PLACEHOLDER: Uses a simple formula based on lead attributes.
 * 
 * @param {object} leadData - Lead attributes (kw_capacity, monthly_bill, source, etc.)
 * @returns {object} - Score and reasoning
 */
async function scoreLead(leadData) {
  console.log('[AI Assistant] Scoring lead:', leadData.name);

  // TODO: Replace with ML model or AI API call
  // Simple scoring formula for now
  let score = 50; // Base score

  // Higher capacity = more serious buyer
  if (leadData.kw_capacity >= 50) score += 25;
  else if (leadData.kw_capacity >= 20) score += 15;
  else if (leadData.kw_capacity >= 10) score += 10;

  // Higher monthly bill = more motivated
  if (leadData.monthly_bill >= 50000) score += 20;
  else if (leadData.monthly_bill >= 20000) score += 10;
  else if (leadData.monthly_bill >= 5000) score += 5;

  // Source reliability
  if (leadData.source === 'Referral') score += 10;
  else if (leadData.source === 'Website') score += 5;

  // Cap at 100
  score = Math.min(score, 100);

  return {
    score,
    reasoning: `Score based on: ${leadData.kw_capacity}kW capacity, ₹${leadData.monthly_bill}/month bill, ${leadData.source} source.`,
    recommendation: score >= 80 ? 'High priority — contact within 24 hours' :
                     score >= 60 ? 'Medium priority — schedule follow-up this week' :
                     'Low priority — add to nurture sequence',
    source: 'mock'
  };
}

module.exports = { queryAssistant, getDailySummary, scoreLead };
