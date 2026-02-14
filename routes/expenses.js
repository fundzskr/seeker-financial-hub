const express = require('express');
const router = express.Router();
const db = require('../utils/database');

/**
 * POST /api/expenses/create
 * Create a new expense entry
 */
router.post('/create', async (req, res) => {
  try {
    const { walletAddress, amount, category, description, date, transactionHash } = req.body;

    // Validation
    if (!walletAddress || !amount || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const user = db.getUser(walletAddress);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found. Please connect wallet first.' 
      });
    }

    const expense = db.createExpense({
      walletAddress,
      amount,
      category,
      description: description || '',
      date: date || new Date().toISOString().split('T')[0], // YYYY-MM-DD
      transactionHash: transactionHash || null
    });

    res.json({
      success: true,
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create expense' 
    });
  }
});

/**
 * GET /api/expenses/user/:walletAddress
 * Get all expenses for a user with optional filters
 */
router.get('/user/:walletAddress', (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { category, startDate, endDate } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const expenses = db.getUserExpenses(walletAddress, filters);

    res.json({
      success: true,
      expenses,
      count: expenses.length
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get expenses' 
    });
  }
});

/**
 * GET /api/expenses/analytics/:walletAddress
 * Get expense analytics and insights
 */
router.get('/analytics/:walletAddress', (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { startDate, endDate } = req.query;

    const analytics = db.getExpenseAnalytics(
      walletAddress,
      startDate || '2020-01-01',
      endDate || new Date().toISOString().split('T')[0]
    );

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get analytics' 
    });
  }
});

/**
 * GET /api/expenses/tax-export/:walletAddress
 * Export expenses for tax purposes (CSV format)
 */
router.get('/tax-export/:walletAddress', (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { year } = req.query;

    const currentYear = year || new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;

    const expenses = db.getUserExpenses(walletAddress, { startDate, endDate });

    // Generate CSV
    const csvHeader = 'Date,Category,Description,Amount (SOL),Transaction Hash,Tax Deductible\n';
    const csvRows = expenses.map(exp => {
      const taxDeductible = ['Business', 'Office', 'Travel', 'Professional Services'].includes(exp.category) ? 'Yes' : 'No';
      return `${exp.date},${exp.category},"${exp.description}",${exp.amount},${exp.transactionHash || 'N/A'},${taxDeductible}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Calculate tax summary
    const deductibleExpenses = expenses.filter(exp => 
      ['Business', 'Office', 'Travel', 'Professional Services'].includes(exp.category)
    );
    const totalDeductible = deductibleExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({
      success: true,
      taxYear: currentYear,
      csv,
      summary: {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        deductibleExpenses: deductibleExpenses.length,
        totalDeductible
      }
    });
  } catch (error) {
    console.error('Tax export error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export tax data' 
    });
  }
});

/**
 * PUT /api/expenses/:id
 * Update an expense
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const expense = db.updateExpense(id, updates);

    if (!expense) {
      return res.status(404).json({ 
        success: false, 
        error: 'Expense not found' 
      });
    }

    res.json({
      success: true,
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update expense' 
    });
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete an expense
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = db.deleteExpense(id);

    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        error: 'Expense not found' 
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete expense' 
    });
  }
});

/**
 * GET /api/expenses/categories
 * Get available expense categories
 */
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Travel',
      'Business',
      'Office',
      'Professional Services',
      'Education',
      'Gifts & Donations',
      'Personal Care',
      'Other'
    ]
  });
});

module.exports = router;
