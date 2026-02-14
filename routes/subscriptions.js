const express = require('express');
const router = express.Router();
const { getSubscriptionPrice } = require('../utils/genesis');
const { createSubscriptionTransaction } = require('../utils/solana');
const db = require('../utils/database');

/**
 * POST /api/subscriptions/create
 * Create a new subscription to track
 */
router.post('/create', async (req, res) => {
  try {
    const { walletAddress, name, amount, billingCycle, category, nextBillingDate } = req.body;

    // Validation
    if (!walletAddress || !name || !amount || !billingCycle) {
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

    const subscription = db.createSubscription({
      walletAddress,
      name,
      amount,
      billingCycle,
      category: category || 'Other',
      nextBillingDate: nextBillingDate || new Date().toISOString()
    });

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create subscription' 
    });
  }
});

/**
 * POST /api/subscriptions/platform/subscribe
 * Subscribe to platform (monthly payment)
 */
router.post('/platform/subscribe', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    const user = db.getUser(walletAddress);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found. Please connect wallet first.' 
      });
    }

    // Get subscription price (with Genesis discount if applicable)
    const price = getSubscriptionPrice(user.hasGenesis);

    // Create payment transaction
    const txResult = await createSubscriptionTransaction(walletAddress, price);

    if (!txResult.success) {
      return res.status(500).json(txResult);
    }

    res.json({
      success: true,
      transaction: txResult.transaction,
      pricing: {
        monthlyPrice: price,
        hasGenesisDiscount: user.hasGenesis,
        discountPercent: user.hasGenesis ? 50 : 0,
        savings: user.hasGenesis ? (9.99 - price).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Platform subscribe error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create subscription payment' 
    });
  }
});

/**
 * POST /api/subscriptions/platform/confirm
 * Confirm platform subscription payment
 */
router.post('/platform/confirm', async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;

    const user = db.getUser(walletAddress);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Calculate expiry (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Update user subscription status
    db.updateUser(walletAddress, {
      subscriptionActive: true,
      subscriptionExpiry: expiryDate.toISOString(),
      lastPaymentSignature: signature
    });

    res.json({
      success: true,
      message: 'Subscription activated',
      expiryDate: expiryDate.toISOString(),
      signature
    });
  } catch (error) {
    console.error('Confirm subscription error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to confirm subscription' 
    });
  }
});

/**
 * GET /api/subscriptions/user/:walletAddress
 * Get all subscriptions for a user
 */
router.get('/user/:walletAddress', (req, res) => {
  try {
    const { walletAddress } = req.params;
    const subscriptions = db.getUserSubscriptions(walletAddress);

    // Calculate total monthly spend
    const totalMonthly = subscriptions
      .filter(sub => sub.billingCycle === 'monthly' && sub.status === 'active')
      .reduce((sum, sub) => sum + sub.amount, 0);

    const totalYearly = subscriptions
      .filter(sub => sub.billingCycle === 'yearly' && sub.status === 'active')
      .reduce((sum, sub) => sum + sub.amount, 0);

    res.json({
      success: true,
      subscriptions,
      analytics: {
        totalActive: subscriptions.filter(s => s.status === 'active').length,
        totalMonthlySpend: totalMonthly,
        totalYearlySpend: totalYearly,
        annualizedSpend: (totalMonthly * 12) + totalYearly
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get subscriptions' 
    });
  }
});

/**
 * PUT /api/subscriptions/:id/cancel
 * Cancel a subscription
 */
router.put('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    
    const subscription = db.updateSubscription(id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subscription not found' 
      });
    }

    res.json({
      success: true,
      message: 'Subscription cancelled',
      subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel subscription' 
    });
  }
});

/**
 * DELETE /api/subscriptions/:id
 * Delete a subscription
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const subscription = db.getSubscription(id);
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subscription not found' 
      });
    }

    db.updateSubscription(id, { status: 'deleted' });

    res.json({
      success: true,
      message: 'Subscription deleted'
    });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete subscription' 
    });
  }
});

module.exports = router;
