// Solana Financial Hub - Frontend Application
// This is a web demo - for native Android app, we'll use React Native with Mobile Wallet Adapter

// ============================================
// WALLET DETECTION & GENESIS TOKEN VERIFICATION
// ============================================

// Genesis Token Configuration
const GENESIS_TOKEN_MINT = '9USAzZqpZrXYb8JHP1tvHh37YVFNj65TRhwZynnfMNxH'; // Replace with your actual Genesis Token mint address

let walletDetector;

document.addEventListener('DOMContentLoaded', async () => {
    walletDetector = new WalletDetector();
    
    // Auto-connect on Seeker phones
    if (walletDetector.isSeekerPhone()) {
        console.log('🔍 Seeker phone detected');
        await walletDetector.detectAllWallets();
        const seekerWallet = walletDetector.wallets.find(w => w.name === 'Seeker');
        if (seekerWallet) {
            try {
                const connected = await walletDetector.connect('Seeker');
                await updateWalletUI(connected);
            } catch (e) {
                console.log('Seeker auto-connect skipped');
            }
        }
    }
    
    // Auto-connect for returning users
    const autoConnected = await walletDetector.autoConnect();
    if (autoConnected) {
        await updateWalletUI(autoConnected);
    }
});

// Connect Wallet Button Handler
const connectWalletBtn = document.getElementById('connect-wallet');
if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', async () => {
        try {
            const wallets = await walletDetector.detectAllWallets();
            
            if (wallets.length === 0) {
                showToast('No Solana wallet detected! Please install Phantom, Solflare, Seeker, or another wallet.', 'error');
                return;
            }
            
            let selectedWalletName;
            if (wallets.length === 1) {
                selectedWalletName = wallets[0].name;
            } else {
                const walletList = wallets.map((w, i) => `${i + 1}. ${w.name}`).join('\n');
                selectedWalletName = prompt(`Select a wallet:\n\n${walletList}\n\nEnter wallet name:`);
            }
            
            if (!selectedWalletName) return;
            
            const connected = await walletDetector.connect(selectedWalletName);
            await updateWalletUI(connected);
            
            showToast(`Connected to ${connected.name}!`, 'success');
            
        } catch (error) {
            console.error('Connection failed:', error);
            showToast('Failed to connect wallet: ' + error.message, 'error');
        }
    });
}

// Update UI when wallet connects
async function updateWalletUI(walletInfo) {
    const connectBtn = document.getElementById('connect-wallet');
    const walletInfoDiv = document.getElementById('wallet-info');
    const walletAddress = document.querySelector('.wallet-address');
    
    if (connectBtn) connectBtn.style.display = 'none';
    if (walletInfoDiv) walletInfoDiv.style.display = 'block';
    if (walletAddress) {
        walletAddress.textContent = 
            `${walletInfo.name}: ${walletInfo.publicKey.slice(0, 4)}...${walletInfo.publicKey.slice(-4)}`;
    }
    
    // Update state
    state.wallet = walletInfo.publicKey;
    state.user = walletInfo.publicKey;
    
    // Check for Genesis Token
    const hasGenesis = await checkGenesisToken(walletInfo.publicKey);
    state.hasGenesis = hasGenesis;
    
    if (hasGenesis) {
        showGenesisUI();
    } else {
        showSubscriptionNotice();
    }
    
    console.log('✅ Wallet UI updated');
}

// Check if wallet holds Genesis Token
async function checkGenesisToken(walletAddress) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/api/genesis/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                walletAddress,
                genesisMint: GENESIS_TOKEN_MINT 
            })
        });
        
        const data = await response.json();
        hideLoading();
        
        if (data.hasGenesis) {
            console.log('✅ Genesis Token holder detected!');
            return true;
        } else {
            console.log('❌ No Genesis Token found');
            return false;
        }
        
    } catch (error) {
        console.error('Genesis check error:', error);
        hideLoading();
        return false;
    }
}

// Show Genesis holder UI
function showGenesisUI() {
    const genesisBanner = document.getElementById('genesis-banner');
    const subscriptionNotice = document.getElementById('subscription-notice');
    const genesisBadge = document.querySelector('.genesis-badge');
    
    if (genesisBanner) genesisBanner.style.display = 'block';
    if (subscriptionNotice) subscriptionNotice.style.display = 'none';
    if (genesisBadge) genesisBadge.style.display = 'block';
}

// Show subscription notice for non-Genesis holders
function showSubscriptionNotice() {
    const genesisBanner = document.getElementById('genesis-banner');
    const subscriptionNotice = document.getElementById('subscription-notice');
    const genesisBadge = document.querySelector('.genesis-badge');
    
    if (genesisBanner) genesisBanner.style.display = 'none';
    if (subscriptionNotice) subscriptionNotice.style.display = 'block';
    if (genesisBadge) genesisBadge.style.display = 'none';
}

// ============================================
// END WALLET DETECTION
// ============================================



// API Base URL
const API_BASE = window.location.origin;

// State Management
const state = {
    wallet: null,
    user: null,
    hasGenesis: false,
    subscriptionActive: false,
    currentTab: 'bills'
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

// Wallet Connection (Simulated for web demo)
document.getElementById('connect-wallet').addEventListener('click', async () => {
    try {
        showLoading();
        
        // In production, use Phantom/Solflare wallet adapter
        // For demo, simulate wallet connection
        const mockWallet = prompt('Enter wallet address (or leave blank for demo):') || 
                          'Demo' + Math.random().toString(36).substring(7);
        
        await connectWallet(mockWallet);
        
        hideLoading();
        showToast('Wallet connected successfully!');
    } catch (error) {
        hideLoading();
        showToast('Failed to connect wallet: ' + error.message, 'error');
    }
});

async function connectWallet(walletAddress) {
    try {
        const response = await fetch(`${API_BASE}/api/auth/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        state.wallet = walletAddress;
        state.user = data.user;
        state.hasGenesis = data.user.hasGenesis;
        state.subscriptionActive = data.user.subscriptionActive;
        
        updateUI();
    } catch (error) {
        console.error('Connect wallet error:', error);
        throw error;
    }
}

function updateUI() {
    const connectBtn = document.getElementById('connect-wallet');
    const walletInfo = document.getElementById('wallet-info');
    const genesisBanner = document.getElementById('genesis-banner');
    const subscriptionNotice = document.getElementById('subscription-notice');
    
    if (state.wallet) {
        connectBtn.style.display = 'none';
        walletInfo.style.display = 'block';
        walletInfo.querySelector('.wallet-address').textContent = formatWalletAddress(state.wallet);
        
        // Show Genesis badge if user has token
        if (state.hasGenesis) {
            walletInfo.querySelector('.genesis-badge').style.display = 'block';
            genesisBanner.style.display = 'block';
            subscriptionNotice.style.display = 'none';
        } else {
            // Show subscription notice for non-Genesis holders
            if (!state.subscriptionActive) {
                subscriptionNotice.style.display = 'block';
            }
        }
        
        // Load data for current tab
        loadTabData(state.currentTab);
    }
}

// Subscribe Button
document.getElementById('subscribe-btn')?.addEventListener('click', async () => {
    if (!state.wallet) {
        showToast('Please connect wallet first', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/api/subscriptions/platform/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: state.wallet })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        // In production, sign and send transaction
        // For demo, simulate payment
        const mockSignature = 'sig' + Math.random().toString(36).substring(7);
        
        const confirmResponse = await fetch(`${API_BASE}/api/subscriptions/platform/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                walletAddress: state.wallet,
                signature: mockSignature
            })
        });
        
        const confirmData = await confirmResponse.json();
        
        if (confirmData.success) {
            state.subscriptionActive = true;
            document.getElementById('subscription-notice').style.display = 'none';
            showToast('Subscription activated! Welcome aboard! 🎉');
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Subscription failed: ' + error.message, 'error');
    }
});

// Load Tab Data
async function loadTabData(tabName) {
    switch (tabName) {
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

// === BILLS TAB ===
document.getElementById('create-bill-btn').addEventListener('click', () => {
    document.getElementById('create-bill-form').style.display = 'block';
});

document.getElementById('cancel-bill').addEventListener('click', () => {
    document.getElementById('create-bill-form').style.display = 'none';
    document.getElementById('bill-form').reset();
});

document.getElementById('add-participant').addEventListener('click', () => {
    const participantsList = document.getElementById('participants-list');
    const newParticipant = document.createElement('div');
    newParticipant.className = 'participant-item';
    newParticipant.innerHTML = `
        <input type="text" class="participant-address" placeholder="Wallet Address" required>
        <input type="number" class="participant-amount" placeholder="Amount (SOL)" step="0.01" required>
        <button type="button" class="btn-remove">Remove</button>
    `;
    participantsList.appendChild(newParticipant);
    
    newParticipant.querySelector('.btn-remove').addEventListener('click', () => {
        newParticipant.remove();
    });
});

document.getElementById('bill-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        showLoading();
        
        const title = document.getElementById('bill-title').value;
        const totalAmount = parseFloat(document.getElementById('bill-total').value);
        
        const participants = [];
        document.querySelectorAll('.participant-item').forEach(item => {
            const address = item.querySelector('.participant-address').value;
            const amount = parseFloat(item.querySelector('.participant-amount').value);
            if (address && amount) {
                participants.push({ address, amount });
            }
        });
        
        const response = await fetch(`${API_BASE}/api/bills/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: state.wallet,
                title,
                totalAmount,
                participants
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        document.getElementById('create-bill-form').style.display = 'none';
        document.getElementById('bill-form').reset();
        
        showToast('Bill created successfully!');
        await loadBills();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to create bill: ' + error.message, 'error');
    }
});

async function loadBills() {
    if (!state.wallet) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/bills/user/${state.wallet}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        renderBills(data.bills || []);
    } catch (error) {
        console.error('Load bills error:', error);
        showToast('Failed to load bills', 'error');
    }
}

function renderBills(bills) {
    const container = document.getElementById('bills-list');
    
    if (bills.length === 0) {
        container.innerHTML = `
            <div class="list-item" style="text-align: center; padding: 40px;">
                <p style="color: var(--text-secondary);">No bills yet. Create your first bill split!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = bills.map(bill => `
        <div class="list-item">
            <div class="list-item-header">
                <div>
                    <div class="list-item-title">${bill.title}</div>
                    <span class="status-badge status-${bill.status}">${bill.status.toUpperCase()}</span>
                </div>
                <div class="list-item-amount">${formatSOL(bill.totalAmount)}</div>
            </div>
            <div class="list-item-meta">
                <span>👥 ${bill.participants.length} participants</span>
                <span>💰 Fee: ${formatSOL(bill.feeBreakdown.finalFee)}</span>
                ${bill.feeBreakdown.hasGenesisDiscount ? '<span>⭐ Genesis Discount Applied</span>' : ''}
                <span>📅 ${new Date(bill.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

// === SUBSCRIPTIONS TAB ===
document.getElementById('add-subscription-btn').addEventListener('click', () => {
    document.getElementById('subscription-form').style.display = 'block';
    // Set default next billing date to today
    document.getElementById('sub-next-billing').valueAsDate = new Date();
});

document.getElementById('cancel-sub').addEventListener('click', () => {
    document.getElementById('subscription-form').style.display = 'none';
    document.getElementById('sub-form').reset();
});

document.getElementById('sub-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        showLoading();
        
        const name = document.getElementById('sub-name').value;
        const amount = parseFloat(document.getElementById('sub-amount').value);
        const billingCycle = document.getElementById('sub-cycle').value;
        const category = document.getElementById('sub-category').value;
        const nextBillingDate = document.getElementById('sub-next-billing').value;
        
        const response = await fetch(`${API_BASE}/api/subscriptions/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: state.wallet,
                name,
                amount,
                billingCycle,
                category,
                nextBillingDate
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        document.getElementById('subscription-form').style.display = 'none';
        document.getElementById('sub-form').reset();
        
        showToast('Subscription added successfully!');
        await loadSubscriptions();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to add subscription: ' + error.message, 'error');
    }
});

async function loadSubscriptions() {
    if (!state.wallet) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/subscriptions/user/${state.wallet}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        renderSubscriptions(data.subscriptions || [], data.analytics);
    } catch (error) {
        console.error('Load subscriptions error:', error);
        showToast('Failed to load subscriptions', 'error');
    }
}

function renderSubscriptions(subscriptions, analytics) {
    const analyticsContainer = document.getElementById('subscriptions-analytics');
    const listContainer = document.getElementById('subscriptions-list');
    
    // Render analytics
    if (analytics) {
        analyticsContainer.innerHTML = `
            <h3>📊 Subscription Analytics</h3>
            <div class="analytics-grid">
                <div class="analytics-item">
                    <div class="analytics-label">Active Subscriptions</div>
                    <div class="analytics-value">${analytics.totalActive}</div>
                </div>
                <div class="analytics-item">
                    <div class="analytics-label">Monthly Spend</div>
                    <div class="analytics-value">${formatSOL(analytics.totalMonthlySpend)}</div>
                </div>
                <div class="analytics-item">
                    <div class="analytics-label">Annual Spend</div>
                    <div class="analytics-value">${formatSOL(analytics.annualizedSpend)}</div>
                </div>
            </div>
        `;
    }
    
    // Render subscriptions list
    if (subscriptions.length === 0) {
        listContainer.innerHTML = `
            <div class="list-item" style="text-align: center; padding: 40px;">
                <p style="color: var(--text-secondary);">No subscriptions tracked yet. Add your first subscription!</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = subscriptions.map(sub => `
        <div class="list-item">
            <div class="list-item-header">
                <div>
                    <div class="list-item-title">${sub.name}</div>
                    <span class="status-badge status-${sub.status}">${sub.status.toUpperCase()}</span>
                </div>
                <div class="list-item-amount">${formatSOL(sub.amount)}/${sub.billingCycle}</div>
            </div>
            <div class="list-item-meta">
                <span>📁 ${sub.category}</span>
                <span>📅 Next billing: ${new Date(sub.nextBillingDate).toLocaleDateString()}</span>
            </div>
            ${sub.status === 'active' ? `
                <button class="btn btn-secondary" style="margin-top: 12px;" onclick="cancelSubscription('${sub.id}')">
                    Cancel Subscription
                </button>
            ` : ''}
        </div>
    `).join('');
}

async function cancelSubscription(subId) {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/api/subscriptions/${subId}/cancel`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        showToast('Subscription cancelled');
        await loadSubscriptions();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to cancel subscription: ' + error.message, 'error');
    }
}

// === EXPENSES TAB ===
document.getElementById('add-expense-btn').addEventListener('click', () => {
    document.getElementById('expense-form').style.display = 'block';
    // Set default date to today
    document.getElementById('exp-date').valueAsDate = new Date();
});

document.getElementById('cancel-exp').addEventListener('click', () => {
    document.getElementById('expense-form').style.display = 'none';
    document.getElementById('exp-form').reset();
});

document.getElementById('exp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        showLoading();
        
        const amount = parseFloat(document.getElementById('exp-amount').value);
        const category = document.getElementById('exp-category').value;
        const description = document.getElementById('exp-description').value;
        const date = document.getElementById('exp-date').value;
        const transactionHash = document.getElementById('exp-hash').value;
        
        const response = await fetch(`${API_BASE}/api/expenses/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: state.wallet,
                amount,
                category,
                description,
                date,
                transactionHash
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        document.getElementById('expense-form').style.display = 'none';
        document.getElementById('exp-form').reset();
        
        showToast('Expense added successfully!');
        await loadExpenses();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to add expense: ' + error.message, 'error');
    }
});

document.getElementById('export-tax-btn').addEventListener('click', async () => {
    if (!state.wallet) {
        showToast('Please connect wallet first', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const year = new Date().getFullYear();
        const response = await fetch(`${API_BASE}/api/expenses/tax-export/${state.wallet}?year=${year}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        // Download CSV file
        const blob = new Blob([data.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-export-${year}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast(`Tax export downloaded! Total deductible: ${formatSOL(data.summary.totalDeductible)}`);
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to export tax data: ' + error.message, 'error');
    }
});

async function loadExpenses() {
    if (!state.wallet) return;
    
    try {
        const [expensesResponse, analyticsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/expenses/user/${state.wallet}`),
            fetch(`${API_BASE}/api/expenses/analytics/${state.wallet}`)
        ]);
        
        const expensesData = await expensesResponse.json();
        const analyticsData = await analyticsResponse.json();
        
        if (!expensesData.success || !analyticsData.success) {
            throw new Error('Failed to load expenses');
        }
        
        renderExpenses(expensesData.expenses || [], analyticsData.analytics);
    } catch (error) {
        console.error('Load expenses error:', error);
        showToast('Failed to load expenses', 'error');
    }
}

function renderExpenses(expenses, analytics) {
    const analyticsContainer = document.getElementById('expenses-analytics');
    const listContainer = document.getElementById('expenses-list');
    
    // Render analytics
    if (analytics) {
        const topCategory = Object.entries(analytics.byCategory)
            .sort((a, b) => b[1] - a[1])[0];
        
        analyticsContainer.innerHTML = `
            <h3>📊 Expense Analytics</h3>
            <div class="analytics-grid">
                <div class="analytics-item">
                    <div class="analytics-label">Total Expenses</div>
                    <div class="analytics-value">${analytics.totalExpenses}</div>
                </div>
                <div class="analytics-item">
                    <div class="analytics-label">Total Spent</div>
                    <div class="analytics-value">${formatSOL(analytics.totalSpent)}</div>
                </div>
                ${topCategory ? `
                    <div class="analytics-item">
                        <div class="analytics-label">Top Category</div>
                        <div class="analytics-value" style="font-size: 18px;">${topCategory[0]}</div>
                        <div style="font-size: 14px; opacity: 0.9;">${formatSOL(topCategory[1])}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Render expenses list
    if (expenses.length === 0) {
        listContainer.innerHTML = `
            <div class="list-item" style="text-align: center; padding: 40px;">
                <p style="color: var(--text-secondary);">No expenses tracked yet. Add your first expense!</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(exp => {
        const taxDeductible = ['Business', 'Office', 'Travel', 'Professional Services'].includes(exp.category);
        
        return `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">${exp.description || exp.category}</div>
                        <span class="status-badge" style="background: var(--surface-light); color: var(--text-primary);">
                            ${exp.category}
                        </span>
                        ${taxDeductible ? '<span class="status-badge status-active">Tax Deductible</span>' : ''}
                    </div>
                    <div class="list-item-amount">${formatSOL(exp.amount)}</div>
                </div>
                <div class="list-item-meta">
                    <span>📅 ${new Date(exp.date).toLocaleDateString()}</span>
                    ${exp.transactionHash ? `<span>🔗 ${formatWalletAddress(exp.transactionHash)}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Make cancelSubscription available globally
window.cancelSubscription = cancelSubscription;
