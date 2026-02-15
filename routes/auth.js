const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Get Helius API key from environment
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Import database utility
const db = require('../utils/database');

/**
 * Connect wallet and check Genesis NFT ownership
 * POST /api/auth/connect
 * Body: { walletAddress, genesisMint }
 */
router.post('/connect', async (req, res) => {
    try {
        const { walletAddress, genesisMint } = req.body;
        
        if (!walletAddress) {
            return res.json({ 
                success: false, 
                error: 'Wallet address required' 
            });
        }
        
        console.log('Connecting wallet:', walletAddress);
        
        // Check for Genesis NFT if mint provided and Helius configured
        let hasGenesis = false;
        
        if (genesisMint && HELIUS_API_KEY) {
            try {
                const response = await fetch(HELIUS_RPC_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 'auth-genesis-check',
                        method: 'getTokenAccountsByOwner',
                        params: [
                            walletAddress,
                            { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
                            { encoding: 'jsonParsed' }
                        ]
                    })
                });
                
                const data = await response.json();
                
                if (!data.error && data.result) {
                    hasGenesis = data.result.value.some(account => {
                        const mint = account.account.data.parsed.info.mint;
                        const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
                        return mint === genesisMint && amount > 0;
                    });
                    
                    console.log('Genesis NFT check result:', hasGenesis);
                }
            } catch (error) {
                console.error('Genesis check failed:', error.message);
            }
        }
        
        // Get or create user in database
        let user = db.getUser(walletAddress);
        
        if (!user) {
            // Create new user
            user = db.createUser({
                walletAddress,
                hasGenesis,
                subscriptionActive: hasGenesis, // Genesis holders get automatic subscription
                createdAt: new Date().toISOString()
            });
            console.log('Created new user:', walletAddress);
        } else {
            // Update existing user's Genesis status
            user = db.updateUser(walletAddress, {
                hasGenesis,
                subscriptionActive: hasGenesis || user.subscriptionActive
            });
            console.log('Updated existing user:', walletAddress);
        }
        
        // Return user data
        res.json({
            success: true,
            user: {
                walletAddress,
                hasGenesis,
                subscriptionActive: user.subscriptionActive,
                connectedAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Auth connect error:', error);
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;
