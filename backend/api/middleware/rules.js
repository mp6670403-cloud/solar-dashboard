/**
 * AI RULES VALIDATION MIDDLEWARE
 * ===============================
 * Business safety rules that prevent invalid transactions.
 * Each function returns proper error JSON with:
 *   - error: error message
 *   - rule_violated: rule code (e.g. 'S1_NEGATIVE_STOCK')
 *   - suggestion: what to do
 * 
 * RULES IMPLEMENTED:
 *   S1 — Negative Stock Prevention
 *   S2 — Stock Availability Check
 *   F1 — Duplicate Transaction Detection
 *   F2 — GSTIN Validation for B2B
 *   F3 — Price Floor Check (cost price protection)
 *   F5 — Credit Limit Enforcement
 */

/**
 * validateStockAvailability — Check stock >= requested quantity.
 * If not enough, return 400 with available stock and partial order option.
 */
const validateStockAvailability = (getProductFn, getQuantityFn) => {
  return (req, res, next) => {
    try {
      const product = getProductFn(req);
      const requestedQty = getQuantityFn(req);

      if (!product) return next(); // Let route handler deal with missing product

      if (product.stock_level < requestedQty) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.product_name}. Available: ${product.stock_level}, Requested: ${requestedQty}`,
          rule_violated: 'S2_INSUFFICIENT_STOCK',
          available_stock: product.stock_level,
          requested_quantity: requestedQty,
          partial_order_possible: product.stock_level > 0,
          suggestion: product.stock_level > 0
            ? `Partial order laga sakte ho (${product.stock_level} units available). Ya phir stock-in karo pehle.`
            : 'Stock zero hai — pehle supplier se maal mangwao, phir order create karo.'
        });
      }

      next();
    } catch (err) {
      console.error('[Rules] Stock availability check error:', err.message);
      next(); // Don't block on rule check failure
    }
  };
};

/**
 * validateCreditLimit — Check vendor/client outstanding + new order <= credit limit.
 * Block if exceeded.
 */
const validateCreditLimit = (getClientFn, getOrderTotalFn) => {
  return (req, res, next) => {
    try {
      const client = getClientFn(req);
      const orderTotal = getOrderTotalFn(req);

      if (!client) return next(); // Let route handler deal with missing client

      const projectedOutstanding = (client.pending_dues || 0) + orderTotal;

      if (projectedOutstanding > client.credit_limit) {
        return res.status(400).json({
          error: 'Credit limit exceeded',
          rule_violated: 'F5_CREDIT_LIMIT',
          outstanding: client.pending_dues,
          new_order: orderTotal,
          projected_total: projectedOutstanding,
          credit_limit: client.credit_limit,
          excess_amount: projectedOutstanding - client.credit_limit,
          suggestion: 'Pehle payment lo ya Owner se limit badhwao'
        });
      }

      next();
    } catch (err) {
      console.error('[Rules] Credit limit check error:', err.message);
      next();
    }
  };
};

/**
 * validateDuplicateTransaction — Check same vendor/client + same amount + same day.
 * Block if found (prevents double entry).
 */
const validateDuplicateTransaction = (getOrdersFn) => {
  return (req, res, next) => {
    try {
      const { client_id, quantity, rate } = req.body;
      const orders = getOrdersFn();
      const today = new Date().toISOString().split('T')[0];
      const total = parseInt(quantity) * (parseFloat(rate) || 0);

      const duplicate = orders.find(o =>
        o.client_id == client_id &&
        o.total_amount === total &&
        o.created_at.startsWith(today)
      );

      if (duplicate) {
        return res.status(400).json({
          error: `Duplicate transaction detected! Order #${duplicate.id} already exists today with same client and amount.`,
          rule_violated: 'F1_DUPLICATE_TRANSACTION',
          existing_order_id: duplicate.id,
          existing_order_status: duplicate.status,
          suggestion: 'Ye same order aaj pehle se create ho chuka hai. Agar naya order hai toh amount ya quantity change karo.'
        });
      }

      next();
    } catch (err) {
      console.error('[Rules] Duplicate transaction check error:', err.message);
      next();
    }
  };
};

/**
 * validateGSTIN — Check GSTIN is not null/empty for B2B clients.
 * Block if missing.
 */
const validateGSTIN = (req, res, next) => {
  try {
    const { gstin } = req.body;

    if (!gstin || gstin.trim() === '') {
      return res.status(400).json({
        error: 'GSTIN is required for B2B clients',
        rule_violated: 'F2_GSTIN_MISSING',
        suggestion: 'B2B client ka GSTIN number daalo — bina GSTIN ke invoice nahi ban sakta. Format: 2-digit state code + 10-char PAN + 1Z + checksum'
      });
    }

    // Basic GSTIN format validation (15 characters, alphanumeric)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(gstin.trim().toUpperCase())) {
      return res.status(400).json({
        error: 'Invalid GSTIN format',
        rule_violated: 'F2_GSTIN_INVALID',
        provided_gstin: gstin,
        suggestion: 'GSTIN format galat hai. Sahi format: 08ABCDE1234F1Z5 (15 characters). Check karo state code aur PAN.'
      });
    }

    next();
  } catch (err) {
    console.error('[Rules] GSTIN validation error:', err.message);
    next();
  }
};

/**
 * validateNegativeStock — Ensure stock never goes below 0.
 * Block update if it would result in negative stock.
 */
const validateNegativeStock = (getProductFn) => {
  return (req, res, next) => {
    try {
      const product = getProductFn(req);
      const { stock_level } = req.body;

      if (!product) return next();

      if (stock_level !== undefined && parseInt(stock_level) < 0) {
        return res.status(400).json({
          error: `Stock level cannot be negative for ${product.product_name}`,
          rule_violated: 'S1_NEGATIVE_STOCK',
          current_stock: product.stock_level,
          attempted_value: parseInt(stock_level),
          suggestion: 'Stock negative nahi ho sakta. Agar stock kam karna hai toh order create karo ya manual adjustment karo with valid quantity.'
        });
      }

      next();
    } catch (err) {
      console.error('[Rules] Negative stock check error:', err.message);
      next();
    }
  };
};

/**
 * validatePriceFloor — Ensure quote rate >= cost price.
 * Warn if below (allows Owner override).
 */
const validatePriceFloor = (getProductFn) => {
  return (req, res, next) => {
    try {
      const product = getProductFn(req);
      const { rate } = req.body;

      if (!product || rate === undefined) return next();

      const quoteRate = parseFloat(rate);
      const costPrice = product.rate; // Base rate is the cost/list price

      if (quoteRate < costPrice) {
        // Allow Owner to override — just warn others
        if (req.user && req.user.designation === 'Owner') {
          // Owner can sell below cost — just log warning
          console.warn(`[Rules WARNING] Owner selling ${product.product_name} below cost: ₹${quoteRate} < ₹${costPrice}`);
          return next();
        }

        return res.status(400).json({
          error: `Quote rate (₹${quoteRate}) is below cost price (₹${costPrice}) for ${product.product_name}`,
          rule_violated: 'F3_PRICE_BELOW_FLOOR',
          quote_rate: quoteRate,
          cost_price: costPrice,
          loss_per_unit: costPrice - quoteRate,
          suggestion: 'Rate cost price se kam hai — loss hoga! Owner se approval lo ya rate badhao. Sirf Owner below-cost sale approve kar sakta hai.'
        });
      }

      next();
    } catch (err) {
      console.error('[Rules] Price floor check error:', err.message);
      next();
    }
  };
};

module.exports = {
  validateStockAvailability,
  validateCreditLimit,
  validateDuplicateTransaction,
  validateGSTIN,
  validateNegativeStock,
  validatePriceFloor
};
