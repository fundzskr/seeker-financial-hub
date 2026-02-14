// Solana Financial Hub - Frontend Application
// Production version with real wallet detection

// Genesis Token Configuration
const GENESIS_TOKEN_MINT = '9USAzZqpZrXYb8JHP1tvHh37YVFNj65TRhwZynnfMNxH';

// API Base URL
const API_BASE = window.location.origin;

// State Management
const state = {
    wallet: null,
    user: null,
    hasGenesis: false,
    subscriptionActive: false,
    currentTab: 'bills',
    walletAdapter: null
};

// Utility Functions
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function formatWalletAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatSOL(amount) {
    return `${parseFloat(amount).toFixed(4)} SOL`;
}

// Tab Switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        switchTab(tabName);
    });
});

function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update active content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    state.currentTab = tabName;
    
    // Load data for the tab
    if (state.wallet) {
        loadTabData(tabName);
    }
}

// Real Wallet Connection - Detects Phantom, Solflare, Backpack, Seeker, etc.
document.getElementById('connect-wallet').addEventListener('click', async () => {
    try {
        showLoading();
        
        // Detect available wallets
        const wallets = detectWallets();
        
        if (wallets.length === 0) {
            hideLoading();
            showToast('No Solana wallet detected! Please install Phantom, Solflare, or another Solana wallet.', 'error');
            return;
        }
        
        // If multiple wallets, let user choose
        let selectedWallet = wallets[0];
        if (wallets.length > 1) {
            const walletNames = wallets.map(w => w.name).join('\n');
            const choice = prompt(`Multiple wallets detected:\n\n${walletNames}\n\nEnter wallet name:`);
            selectedWallet = wallets.find(w => w.name.toLowerCase() === choice.toLowerCase()) || wallets[0];
        }
        
        // Connect to wallet
        await selectedWallet.adapter.connect();
        const publicKey = selectedWallet.adapter.publicKey.toString();
        
        // Store wallet info
        state.walletAdapter = selectedWallet.adapter;
        await connectWallet(publicKey);
        
        // Update UI
        document.getElementById('connect-wallet').style.display = 'none';
        document.getElementById('wallet-info').style.display = 'block';
        document.querySelector('.wallet-address').textContent = 
            `${selectedWallet.name}: ${formatWalletAddress(publicKey)}`;
        
        hideLoading();
        showToast(`Connected to ${selectedWallet.name}!`);
        
    } catch (error) {
        hideLoading();
        console.error('Wallet connection error:', error);
        showToast('Failed to connect wallet: ' + error.message, 'error');
    }
});

function detectWallets() {
    const wallets = [];
    
    // Detect Seeker (priority for Seeker phones)
    if (window.seeker) {
        wallets.push({ name: 'Seeker', adapter: window.seeker });
    }
    
    // Detect Phantom
    if (window.solana?.isPhantom) {
        wallets.push({ name: 'Phantom', adapter: window.solana });
    }
    
    // Detect Solflare
    if (window.solflare?.isSolflare) {
        wallets.push({ name: 'Solflare', adapter: window.solflare });
    }
    
    // Detect Backpack
    if (window.backpack?.isBackpack) {
        wallets.push({ name: 'Backpack', adapter: window.backpack });
    }
    
    // Detect Glow
    if (window.glow) {
        wallets.push({ name: 'Glow', adapter: window.glow });
    }
    
    // Detect Exodus
    if (window.exodus?.solana) {
        wallets.push({ name: 'Exodus', adapter: window.exodus.solana });
    }
    
    // Detect Coin98
    if (window.coin98?.sol) {
        wallets.push({ name: 'Coin98', adapter: window.coin98.sol });
    }
    
    return wallets;
}

async function connectWallet(walletAddress) {
    try {
        const response = await fetch(`${API_BASE}/api/auth/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress })
        });
        
        const data = await response.json();
        
        state.wallet = walletAddress;
        state.user = walletAddress;
        state.hasGenesis = data.hasGenesis || false;
        state.subscriptionActive = data.subscriptionActive || false;
        
        // Check for Genesis Token
        await checkGenesisToken(walletAddress);
        
        // Show/hide Genesis banner
        if (state.hasGenesis) {
            document.getElementById('genesis-banner').style.display = 'block';
            document.querySelector('.genesis-badge').style.display = 'block';
            showToast('🎉 Genesis Token Holder - 50% OFF!', 'success');
        } else {
            document.getElementById('subscription-notice').style.display = 'block';
        }
        
        // Load initial data
        loadTabData(state.currentTab);
    } catch (error) {
        console.error('Connect wallet error:', error);
        throw error;
    }
}

async function checkGenesisToken(walletAddress) {
    try {
        const response = await fetch(`${API_BASE}/api/genesis/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                walletAddress,
                genesisMint: GENESIS_TOKEN_MINT
            })
        });
        
        const data = await response.json();
        
        if (data.hasGenesis) {
            state.hasGenesis = true;
            console.log('✅ Genesis Token holder verified!');
        } else {
            state.hasGenesis = false;
            console.log('❌ No Genesis Token found');
        }
        
        return state.hasGenesis;
    } catch (error) {
        console.error('Genesis check error:', error);
        return false;
    }
}

async function loadTabData(tabName) {
    if (!state.wallet) return;
    
    switch(tabName) {
        case 'bills':
            await loadBills();
            break;
        case 'subscriptions':
            await loadSubscriptions();
            break;
        case 'expenses':
            await loadExpenses();
            break;
    }
}

// Bills Management
async function loadBills() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/api/bills?wallet=${state.wallet}`);
        const bills = await response.json();
        
        renderBills(bills);
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to load bills', 'error');
    }
}

function renderBills(bills) {
    const container = document.getElementById('bills-list');
    
    if (bills.length === 0) {
        container.innerHTML = '<p class="empty-state">No bills yet. Create your first bill to split expenses!</p>';
        return;
    }
    
    container.innerHTML = bills.map(bill => `
        <div class="bill-item">
            <div class="bill-header">
                <h4>${bill.description}</h4>
                <span class="bill-status ${bill.status}">${bill.status}</span>
            </div>
            <div class="bill-details">
                <p>Total Amount: ${formatSOL(bill.amount)}</p>
                <p>Split Between: ${bill.participants} people</p>
                <p>Your Share: ${formatSOL(bill.yourShare)}</p>
            </div>
            <div class="bill-actions">
                ${bill.status === 'pending' ? `
                    <button onclick="payBillShare('${bill.id}')" class="btn btn-primary">Pay Share</button>
                ` : ''}
                <button onclick="viewBillDetails('${bill.id}')" class="btn btn-secondary">View Details</button>
            </div>
        </div>
    `).join('');
}

document.getElementById('new-bill-btn').addEventListener('click', () => {
    document.getElementById('bill-modal').style.display = 'block';
});

document.getElementById('create-bill-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        showLoading();
        
        const formData = {
            description: document.getElementById('bill-description').value,
            amount: document.getElementById('bill-amount').value,
            participants: document.getElementById('bill-participants').value.split(',').map(p => p.trim()),
            wallet: state.wallet
        };
        
        const response = await fetch(`${API_BASE}/api/bills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            document.getElementById('bill-modal').style.display = 'none';
            document.getElementById('create-bill-form').reset();
            await loadBills();
            showToast('Bill created successfully!');
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to create bill', 'error');
    }
});

async function payBillShare(billId) {
    if (!state.walletAdapter) {
        showToast('Please reconnect your wallet', 'error');
        return;
    }
    
    try {
        showLoading();
        
        // Get payment details
        const response = await fetch(`${API_BASE}/api/bills/${billId}/payment-details`);
        const details = await response.json();
        
        // Create Solana transaction
        const transaction = await createPaymentTransaction(details);
        
        // Sign and send with wallet
        const signature = await state.walletAdapter.signAndSendTransaction(transaction);
        
        // Confirm payment on backend
        await fetch(`${API_BASE}/api/bills/${billId}/confirm-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signature, wallet: state.wallet })
        });
        
        await loadBills();
        hideLoading();
        showToast('Payment successful!');
        
    } catch (error) {
        hideLoading();
        showToast('Payment failed: ' + error.message, 'error');
    }
}

// Subscriptions Management
async function loadSubscriptions() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/api/subscriptions?wallet=${state.wallet}`);
        const subscriptions = await response.json();
        
        renderSubscriptions(subscriptions);
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to load subscriptions', 'error');
    }
}

function renderSubscriptions(subscriptions) {
    const container = document.getElementById('subscriptions-list');
    
    if (subscriptions.length === 0) {
        container.innerHTML = '<p class="empty-state">No active subscriptions. Add one to start tracking!</p>';
        return;
    }
    
    container.innerHTML = subscriptions.map(sub => `
        <div class="subscription-item">
            <div class="subscription-header">
                <h4>${sub.name}</h4>
                <span class="subscription-status ${sub.active ? 'active' : 'inactive'}">
                    ${sub.active ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div class="subscription-details">
                <p>Amount: ${formatSOL(sub.amount)}</p>
                <p>Frequency: ${sub.frequency}</p>
                <p>Next Payment: ${new Date(sub.nextPayment).toLocaleDateString()}</p>
            </div>
            <div class="subscription-actions">
                <button onclick="cancelSubscription('${sub.id}')" class="btn btn-danger">Cancel</button>
            </div>
        </div>
    `).join('');
}

document.getElementById('add-subscription-btn').addEventListener('click', () => {
    document.getElementById('subscription-modal').style.display = 'block';
});

document.getElementById('add-subscription-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        showLoading();
        
        const formData = {
            name: document.getElementById('subscription-name').value,
            amount: document.getElementById('subscription-amount').value,
            frequency: document.getElementById('subscription-frequency').value,
            wallet: state.wallet
        };
        
        const response = await fetch(`${API_BASE}/api/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            document.getElementById('subscription-modal').style.display = 'none';
            document.getElementById('add-subscription-form').reset();
            await loadSubscriptions();
            showToast('Subscription added successfully!');
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to add subscription', 'error');
    }
});

async function cancelSubscription(subId) {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
        showLoading();
        
        await fetch(`${API_BASE}/api/subscriptions/${subId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet: state.wallet })
        });
        
        await loadSubscriptions();
        hideLoading();
        showToast('Subscription cancelled');
        
    } catch (error) {
        hideLoading();
        showToast('Failed to cancel subscription', 'error');
    }
}

// Expenses Management
async function loadExpenses() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/api/expenses?wallet=${state.wallet}`);
        const expenses = await response.json();
        
        renderExpenses(expenses);
        renderExpenseAnalytics(expenses);
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to load expenses', 'error');
    }
}

function renderExpenses(expenses) {
    const container = document.getElementById('expenses-list');
    
    if (expenses.length === 0) {
        container.innerHTML = '<p class="empty-state">No expenses tracked yet. Add your first expense!</p>';
        return;
    }
    
    container.innerHTML = expenses.map(exp => `
        <div class="expense-item">
            <div class="expense-header">
                <h4>${exp.description}</h4>
                <span class="expense-category">${exp.category}</span>
            </div>
            <div class="expense-details">
                <p>Amount: ${formatSOL(exp.amount)}</p>
                <p>Date: ${new Date(exp.date).toLocaleDateString()}</p>
                ${exp.transactionHash ? `<p>TX: ${formatWalletAddress(exp.transactionHash)}</p>` : ''}
            </div>
        </div>
    `).join('');
}

function renderExpenseAnalytics(expenses) {
    const analyticsContainer = document.getElementById('expense-analytics');
    
    // Calculate analytics
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const byCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
        return acc;
    }, {});
    
    analyticsContainer.innerHTML = `
        <h3>📊 Expense Analytics</h3>
        <div class="analytics-grid">
            <div class="analytics-item">
                <div class="analytics-label">Total Expenses</div>
                <div class="analytics-value">${formatSOL(totalExpenses)}</div>
            </div>
            ${Object.entries(byCategory).map(([category, amount]) => `
                <div class="analytics-item">
                    <div class="analytics-label">${category}</div>
                    <div class="analytics-value">${formatSOL(amount)}</div>
                </div>
            `).join('')}
        </div>
    `;
}

document.getElementById('add-expense-btn').addEventListener('click', () => {
    document.getElementById('expense-modal').style.display = 'block';
});

document.getElementById('add-expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        showLoading();
        
        const formData = {
            description: document.getElementById('expense-description').value,
            amount: document.getElementById('expense-amount').value,
            category: document.getElementById('expense-category').value,
            wallet: state.wallet
        };
        
        const response = await fetch(`${API_BASE}/api/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            document.getElementById('expense-modal').style.display = 'none';
            document.getElementById('add-expense-form').reset();
            await loadExpenses();
            showToast('Expense added successfully!');
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to add expense', 'error');
    }
});

// Helper function to create Solana payment transaction
async function createPaymentTransaction(details) {
    // This would use @solana/web3.js to create actual transaction
    // Placeholder for now - implement based on your backend API
    const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = window.solanaWeb3 || {};
    
    if (!window.solanaWeb3) {
        throw new Error('Solana Web3.js not loaded');
    }
    
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: new PublicKey(state.wallet),
            toPubkey: new PublicKey(details.recipient),
            lamports: details.amount * LAMPORTS_PER_SOL
        })
    );
    
    transaction.feePayer = new PublicKey(state.wallet);
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    
    return transaction;
}

// Close modals
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
    });
});

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Make functions globally available
window.payBillShare = payBillShare;
window.viewBillDetails = (id) => console.log('View bill:', id);
window.cancelSubscription = cancelSubscription;
