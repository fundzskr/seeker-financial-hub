const axios = require('axios');
const { Connection, PublicKey } = require('@solana/web3.js');

const SEEKER_GENESIS_TOKEN_MINT = 'GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4';
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

/**
 * Check if a wallet holds the Seeker Genesis Token
 * @param {string} walletAddress - Solana wallet address
 * @returns {Promise<boolean>} - True if wallet holds Genesis Token
 */
async function hasGenesisToken(walletAddress) {
  try {
    if (!HELIUS_API_KEY) {
      console.warn('⚠️ HELIUS_API_KEY not set, using fallback RPC method');
      return await hasGenesisTokenRPC(walletAddress);
    }

    // Use Helius API for reliable token detection
    const url = `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`;
    
    const response = await axios.get(url);
    const tokens = response.data.tokens || [];
    
    // Check if Genesis Token is in the wallet
    const hasGenesis = tokens.some(token => 
      token.mint === SEEKER_GENESIS_TOKEN_MINT && 
      parseFloat(token.amount) > 0
    );
    
    return hasGenesis;
  } catch (error) {
    console.error('Error checking Genesis Token:', error.message);
    // Fallback to RPC method
    return await hasGenesisTokenRPC(walletAddress);
  }
}

/**
 * Fallback RPC method to check Genesis Token
 */
async function hasGenesisTokenRPC(walletAddress) {
  try {
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );

    const walletPublicKey = new PublicKey(walletAddress);
    const genesisMint = new PublicKey(SEEKER_GENESIS_TOKEN_MINT);

    // Get token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      { mint: genesisMint }
    );

    // Check if any account has a balance > 0
    const hasBalance = tokenAccounts.value.some(account => {
      const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
      return amount > 0;
    });

    return hasBalance;
  } catch (error) {
    console.error('RPC fallback error:', error.message);
    return false;
  }
}

/**
 * Calculate fee with Genesis Token discount
 * @param {number} amount - Base amount
 * @param {number} feePercent - Fee percentage
 * @param {boolean} hasGenesis - Whether user has Genesis Token
 * @returns {object} - Fee breakdown
 */
function calculateFee(amount, feePercent, hasGenesis) {
  const baseFee = (amount * feePercent) / 100;
  const discountPercent = hasGenesis ? parseFloat(process.env.GENESIS_DISCOUNT_PERCENT || 50) : 0;
  const discount = (baseFee * discountPercent) / 100;
  const finalFee = baseFee - discount;

  return {
    baseAmount: amount,
    baseFee: baseFee,
    discount: discount,
    finalFee: finalFee,
    total: amount + finalFee,
    hasGenesisDiscount: hasGenesis,
    discountPercent: discountPercent
  };
}

/**
 * Get subscription price based on Genesis Token ownership
 * @param {boolean} hasGenesis - Whether user has Genesis Token
 * @returns {number} - Monthly price
 */
function getSubscriptionPrice(hasGenesis) {
  const basePrice = parseFloat(process.env.MONTHLY_SUBSCRIPTION_PRICE || 9.99);
  
  if (hasGenesis) {
    const discountPercent = parseFloat(process.env.GENESIS_DISCOUNT_PERCENT || 50);
    return basePrice * (1 - discountPercent / 100);
  }
  
  return basePrice;
}

module.exports = {
  hasGenesisToken,
  calculateFee,
  getSubscriptionPrice,
  SEEKER_GENESIS_TOKEN_MINT
};
