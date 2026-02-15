const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Get Helius API key from environment
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

/**
 * Check if wallet owns Genesis NFT
 * POST /api/genesis/check
 * Body: { walletAddress, genesisMint }
 */
router.post('/check', async (req, res) => {
    try {
        const { walletAddress, genesisMint } = req.body;
        
        if (!walletAddress || !genesisMint) {
            return res.json({ 
                success: false, 
                error: 'Missing walletAddress or genesisMint' 
            });
        }
        
        if (!HELIUS_API_KEY) {
            console.error('HELIUS_API_KEY not configured!');
            return res.json({ 
                success: true, 
                hasGenesis: false,
                error: 'Helius API not configured'
            });
        }
        
        console.log('Checking Genesis NFT for wallet:', walletAddress);
        console.log('Looking for mint:', genesisMint);
        
        // Query Helius for all token accounts owned by the wallet
        const response = await fetch(HELIUS_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'genesis-check',
                method: 'getTokenAccountsByOwner',
                params: [
                    walletAddress,
                    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
                    { encoding: 'jsonParsed' }
                ]
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.error('Helius API error:', data.error);
            return res.json({ 
                success: true, 
                hasGenesis: false,
                error: 'Helius query failed'
            });
        }
        
        // Check if Genesis NFT mint is in the token accounts
        const hasGenesis = data.result.value.some(account => {
            const mint = account.account.data.parsed.info.mint;
            const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
            return mint === genesisMint && amount > 0;
        });
        
        console.log('Genesis NFT found:', hasGenesis);
        
        res.json({
            success: true,
            hasGenesis,
            walletAddress,
            genesisMint,
            checkedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Genesis check error:', error);
        res.json({ 
            success: true, 
            hasGenesis: false,
            error: error.message 
        });
    }
});

module.exports = router;
