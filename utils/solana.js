const {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID
} = require('@solana/spl-token');

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

/**
 * Create a bill split transaction
 * @param {string} payerAddress - Person paying the bill
 * @param {Array} recipients - Array of {address, amount}
 * @param {number} feeAmount - Platform fee in SOL
 * @returns {Promise<object>} - Transaction details
 */
async function createBillSplitTransaction(payerAddress, recipients, feeAmount) {
  try {
    const payerPubkey = new PublicKey(payerAddress);
    const treasuryPubkey = new PublicKey(process.env.TREASURY_WALLET);

    const transaction = new Transaction();

    // Add payment to each recipient
    for (const recipient of recipients) {
      const recipientPubkey = new PublicKey(recipient.address);
      const lamports = Math.floor(recipient.amount * LAMPORTS_PER_SOL);

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: payerPubkey,
          toPubkey: recipientPubkey,
          lamports: lamports
        })
      );
    }

    // Add platform fee payment
    if (feeAmount > 0) {
      const feeLamports = Math.floor(feeAmount * LAMPORTS_PER_SOL);
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: payerPubkey,
          toPubkey: treasuryPubkey,
          lamports: feeLamports
        })
      );
    }

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payerPubkey;

    // Serialize transaction for signing
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    return {
      success: true,
      transaction: serializedTransaction.toString('base64'),
      message: 'Transaction created successfully'
    };
  } catch (error) {
    console.error('Error creating bill split transaction:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create subscription payment transaction
 * @param {string} subscriberAddress - User paying subscription
 * @param {number} amount - Subscription amount in SOL
 * @returns {Promise<object>} - Transaction details
 */
async function createSubscriptionTransaction(subscriberAddress, amount) {
  try {
    const subscriberPubkey = new PublicKey(subscriberAddress);
    const treasuryPubkey = new PublicKey(process.env.TREASURY_WALLET);

    const transaction = new Transaction();

    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: subscriberPubkey,
        toPubkey: treasuryPubkey,
        lamports: lamports
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = subscriberPubkey;

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    return {
      success: true,
      transaction: serializedTransaction.toString('base64'),
      message: 'Subscription transaction created'
    };
  } catch (error) {
    console.error('Error creating subscription transaction:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify transaction signature
 * @param {string} signature - Transaction signature
 * @returns {Promise<boolean>} - True if confirmed
 */
async function verifyTransaction(signature) {
  try {
    const confirmation = await connection.confirmTransaction(signature);
    return confirmation.value.err === null;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}

/**
 * Get SOL balance
 * @param {string} address - Wallet address
 * @returns {Promise<number>} - Balance in SOL
 */
async function getBalance(address) {
  try {
    const pubkey = new PublicKey(address);
    const balance = await connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting balance:', error);
    return 0;
  }
}

module.exports = {
  createBillSplitTransaction,
  createSubscriptionTransaction,
  verifyTransaction,
  getBalance
};
