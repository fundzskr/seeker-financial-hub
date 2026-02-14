# Solana Financial Hub - Clean Version

## 🚀 Quick Start

This is your simplified, ready-to-deploy Solana Financial Hub.

### What's Inside?
- ✅ Web-ready Node.js backend
- ✅ Vanilla JavaScript frontend
- ✅ No unnecessary files
- ✅ Optimized for Railway deployment
- ✅ Ready for Android APK build

### Setup Instructions

**Read the complete guide:** [SETUP.md](./SETUP.md)

**Quick commands:**

```bash
# Install dependencies
npm install

# Configure .env file
cp .env.example .env
# (Edit .env with your Helius API key)

# Test locally
npm start

# Deploy to Railway
# (Push to GitHub first, then deploy via Railway dashboard)
```

### File Structure

```
solana-hub-clean/
├── public/           # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── css/
│   └── js/
├── routes/           # API routes
├── utils/            # Helper functions
├── server.js         # Main server
├── package.json      # Dependencies
├── .env.example      # Environment template
└── SETUP.md          # Complete guide
```

### Environment Variables Needed

```
HELIUS_API_KEY=your_key_here
TREASURY_WALLET=your_wallet_address
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
GENESIS_DISCOUNT_PERCENT=50
TRANSACTION_FEE_PERCENT=1
MONTHLY_SUBSCRIPTION_PRICE=9.99
PORT=3000
```

### Deployment Options

1. **Railway** (Recommended - has backend support)
2. **Heroku** (Alternative)
3. **Render** (Alternative)

### Android APK

Follow the Android section in SETUP.md for:
- React Native setup
- arm64-v8a configuration (required for Solana dApp Store)
- Building & signing APK
- Submission to dApp Store

---

**For detailed step-by-step instructions, see [SETUP.md](./SETUP.md)**
