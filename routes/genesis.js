const express = require('express');
const router = express.Router();
const { hasGenesisToken, getSubscriptionPrice, SEEKER_GENESIS_TOKEN_MINT } = require('../utils/genesis');

/**
 * GET /api/genesis/verify/:walletAddress
 * Verify if wallet holds Genesis Token
 */
router.get('/verify/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const hasGenesis = await hasGenesisToken(walletAddress);
    const subscriptionPrice = getSubscriptionPrice(hasGenesis);

    res.json({
      success: true,
      walletAddress,
      hasGenesisToken: hasGenesis,
      genesisTokenMint: SEEKER_GENESIS_TOKEN_MINT,
      benefits: {
        discountPercent: hasGenesis ? 50 : 0,
        monthlyPrice: subscriptionPrice,
        transactionFeePercent: hasGenesis ? 0.5 : 1,
        exclusiveRewards: hasGenesis ? 'Coming Soon' : 'Unavailable'
      }
    });
  } catch (error) {
    console.error('Genesis verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify Genesis Token' 
    });
  }
});

/**
 * GET /api/genesis/info
 * Get Genesis Token information
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    genesisToken: {
      mint: SEEKER_GENESIS_TOKEN_MINT,
      name: 'Solana Seeker Genesis Token',
      benefits: [
        '50% off all transaction fees forever',
        '50% off monthly subscription (was $9.99, now $4.99)',
        'Exclusive rewards coming soon',
        'Priority support',
        'Early access to new features'
      ]
    }
  });
});

module.exports = router;
