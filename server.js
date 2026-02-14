require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import routes
const authRoutes = require('./routes/auth');
const billRoutes = require('./routes/bills');
const subscriptionRoutes = require('./routes/subscriptions');
const expenseRoutes = require('./routes/expenses');
const genesisRoutes = require('./routes/genesis');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/genesis', genesisRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Solana Financial Hub API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Solana Financial Hub running on port ${PORT}`);
  console.log(`🌐 Web: http://localhost:${PORT}`);
  console.log(`📱 Ready for deployment to Railway`);
});
