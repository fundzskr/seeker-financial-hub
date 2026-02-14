const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { calculateFee } = require('../utils/genesis');
const { createBillSplitTransaction } = require('../utils/solana');
const db = require('../utils/database');

/**
 * POST /api/bills/create
 * Create a new bill split
 */
router.post('/create', async (req, res) => {
  try {
    const { walletAddress, title, totalAmount, participants } = req.body;

    // Validation
    if (!walletAddress || !title || !totalAmount || !participants || participants.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Get user and check Genesis status
    const user = db.getUser(walletAddress);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found. Please connect wallet first.' 
      });
    }

    // Calculate total of all participant amounts
    const participantTotal = participants.reduce((sum, p) => sum + p.amount, 0);

    // Calculate platform fee
    const feePercent = parseFloat(process.env.TRANSACTION_FEE_PERCENT || 1);
    const feeBreakdown = calculateFee(participantTotal, feePercent, user.hasGenesis);

    // Create bill record
    const bill = db.createBill({
      createdBy: walletAddress,
      title,
      totalAmount,
      participants,
      feeBreakdown,
      shareLink: uuidv4()
    });

    res.json({
      success: true,
      bill: {
        id: bill.id,
        title: bill.title,
        totalAmount: bill.totalAmount,
        participants: bill.participants,
        feeBreakdown: bill.feeBreakdown,
        shareLink: `${req.protocol}://${req.get('host')}/bill/${bill.shareLink}`,
        status: bill.status,
        createdAt: bill.createdAt
      }
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create bill' 
    });
  }
});

/**
 * POST /api/bills/pay
 * Generate payment transaction for bill
 */
router.post('/pay', async (req, res) => {
  try {
    const { billId, payerAddress } = req.body;

    const bill = db.getBill(billId);
    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bill not found' 
      });
    }

    // Create Solana transaction
    const txResult = await createBillSplitTransaction(
      payerAddress,
      bill.participants,
      bill.feeBreakdown.finalFee
    );

    if (!txResult.success) {
      return res.status(500).json(txResult);
    }

    res.json({
      success: true,
      transaction: txResult.transaction,
      bill: {
        id: bill.id,
        title: bill.title,
        participants: bill.participants,
        feeBreakdown: bill.feeBreakdown
      }
    });
  } catch (error) {
    console.error('Pay bill error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create payment transaction' 
    });
  }
});

/**
 * POST /api/bills/confirm
 * Confirm bill payment with transaction signature
 */
router.post('/confirm', async (req, res) => {
  try {
    const { billId, signature } = req.body;

    const bill = db.getBill(billId);
    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bill not found' 
      });
    }

    // Update bill status
    db.updateBill(billId, {
      status: 'paid',
      transactionSignature: signature,
      paidAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Bill payment confirmed',
      signature
    });
  } catch (error) {
    console.error('Confirm bill error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to confirm payment' 
    });
  }
});

/**
 * GET /api/bills/user/:walletAddress
 * Get all bills for a user
 */
router.get('/user/:walletAddress', (req, res) => {
  try {
    const { walletAddress } = req.params;
    const bills = db.getUserBills(walletAddress);

    res.json({
      success: true,
      bills: bills.map(bill => ({
        id: bill.id,
        title: bill.title,
        totalAmount: bill.totalAmount,
        participants: bill.participants,
        feeBreakdown: bill.feeBreakdown,
        status: bill.status,
        createdAt: bill.createdAt,
        paidAt: bill.paidAt
      }))
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get bills' 
    });
  }
});

/**
 * GET /api/bills/:billId
 * Get specific bill details
 */
router.get('/:billId', (req, res) => {
  try {
    const { billId } = req.params;
    const bill = db.getBill(billId);

    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bill not found' 
      });
    }

    res.json({
      success: true,
      bill: {
        id: bill.id,
        title: bill.title,
        totalAmount: bill.totalAmount,
        participants: bill.participants,
        feeBreakdown: bill.feeBreakdown,
        status: bill.status,
        createdAt: bill.createdAt,
        paidAt: bill.paidAt,
        transactionSignature: bill.transactionSignature
      }
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get bill' 
    });
  }
});

module.exports = router;
