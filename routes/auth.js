const express = require('express');
const router = express.Router();
const { hasGenesisToken, getSubscriptionPrice } = require('../utils/genesis');
const db = require('../utils/database');

/**
 * POST /api/auth/connect
 * Connect wallet and verify Genesis Token status
 */
router.post('/connect', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address required' 
      });
    }

    // Check if user already exists
    let user = db.getUser(walletAddress);

    // Check Genesis Token status
    const hasGenesis = await hasGenesisToken(walletAddress);

    if (!user) {
      // Create new user
      user = db.createUser(walletAddress, hasGenesis);
    } else {
      // Update Genesis status (in case they acquired it)
      user = db.updateUser(walletAddress, { hasGenesis });
    }

    // Get subscription price for this user
    const subscriptionPrice = getSubscriptionPrice(hasGenesis);

    res.json({
      success: true,
      user: {
        walletAddress: user.walletAddress,
        hasGenesis: user.hasGenesis,
        subscriptionActive: user.subscriptionActive,
        subscriptionExpiry: user.subscriptionExpiry
      },
      pricing: {
        hasGenesisDiscount: hasGenesis,
        discountPercent: hasGenesis ? 50 : 0,
        monthlyPrice: subscriptionPrice,
        transactionFeePercent: 1,
        transactionFeeDiscounted: hasGenesis ? 0.5 : 1
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to authenticate' 
    });
  }
});

/**
 * GET /api/auth/user/:walletAddress
 * Get user profile
 */
router.get('/user/:walletAddress', (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = db.getUser(walletAddress);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const subscriptionPrice = getSubscriptionPrice(user.hasGenesis);

    res.json({
      success: true,
      user: {
        walletAddress: user.walletAddress,
        hasGenesis: user.hasGenesis,
        subscriptionActive: user.subscriptionActive,
        subscriptionExpiry: user.subscriptionExpiry
      },
      pricing: {
        hasGenesisDiscount: user.hasGenesis,
        discountPercent: user.hasGenesis ? 50 : 0,
        monthlyPrice: subscriptionPrice,
        transactionFeePercent: 1,
        transactionFeeDiscounted: user.hasGenesis ? 0.5 : 1
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user' 
    });
  }
});

module.exports = router;
