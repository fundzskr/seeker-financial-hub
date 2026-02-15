// Solana Financial Hub - Frontend Application
// Production version with real wallet detection and Genesis NFT verification

// Genesis NFT Token Address
const GENESIS_NFT_MINT = '9USAzZqpZrXYb8JHP1tvHh37YVFNj65TRhwZynnfMNxH';

// API Base URL
const API_BASE = window.location.origin;

// State Management
const state = {
    wallet: null,
    user: null,
    hasGenesis: false,
    subscriptionActive: false,
    currentTab: 'bills',
    walletAdapter: null,
    walletName: null
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

// Real Wallet Connection with Genesis NFT Verification
document.getElementById('connect-wallet').addEventListener('click', async () => {
    try {
        showLoading();
        
        // Detect all available wallets
        const availableWallets = [];
        
        if (window.seeker) availableWallets.push({ name: 'Seeker', adapter: window.seeker, icon: '🔮' });
        if (window.solana?.isPhantom) availableWallets.push({ name: 'Phantom', adapter: window.solana, icon: '👻' });
        if (window.solflare) availableWallets.push({ name: 'Solflare', adapter: window.solflare, icon: '☀️' });
        if (window.backpack) availableWallets.push({ name: 'Backpack', adapter: window.backpack, icon: '🎒' });
        if (window.glow) availableWallets.push({ name: 'Glow', adapter: window.glow, icon: '✨' });
        
        if (availableWallets.length === 0) {
            hideLoading();
            showToast('No Solana wallet detected! Please install Phantom, Solflare, Seeker, or another Solana wallet.', 'error');
            return;
        }
        
        hideLoading();
        
        // If multiple wallets, show professional modal
        if (availableWallets.length > 1) {
            const selectedWallet = await showWalletModal(availableWallets);
            if (!selectedWallet) return;
            
            showLoading();
            await connectToWallet(selectedWallet);
        } else {
            showLoading();
            await connectToWallet(availableWallets[0]);
        }
        
    } catch (error) {
        hideLoading();
        console.error('Connection error:', error);
        showToast('Failed to connect wallet: ' + error.message, 'error');
    }
});

// Professional wallet selection modal
function showWalletModal(wallets) {
    return new Promise((resolve) => {
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: #1a1a2e;
            border-radius: 16px;
            padding: 32px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        `;
        
        modalContent.innerHTML = `
            <h2 style="color: #fff; margin: 0 0 24px 0; font-size: 24px; text-align: center;">
                Connect Wallet
            </h2>
            <div id="wallet-buttons"></div>
            <button id="cancel-wallet" style="
                width: 100%;
                padding: 14px;
                margin-top: 16px;
                background: transparent;
                border: 2px solid #666;
                color: #fff;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
            ">Cancel</button>
        `;
        
        const buttonsContainer = modalContent.querySelector('#wallet-buttons');
        
        // Create button for each wallet
        wallets.forEach(wallet => {
            const button = document.createElement('button');
            button.style.cssText = `
                width: 100%;
                padding: 16px;
                margin-bottom: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: #fff;
                border-radius: 12px;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                transition: transform 0.2s, box-shadow 0.2s;
            `;
            button.innerHTML = `<span style="font-size: 24px;">${wallet.icon}</span> ${wallet.name}`;
            
            button.onmouseover = () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            };
            button.onmouseout = () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            };
            
            button.onclick = () => {
                document.body.removeChild(modal);
                resolve(wallet);
            };
            
            buttonsContainer.appendChild(button);
        });
        
        modalContent.querySelector('#cancel-wallet').onclick = () => {
            document.body.removeChild(modal);
            resolve(null);
        };
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    });
}

async function connectToWallet(selectedWallet) {
    try {
        showLoading();
        
        // Request permission from wallet (this will show wallet popup)
        const resp = await selectedWallet.adapter.connect();
        
        if (!selectedWallet.adapter.publicKey) {
            hideLoading();
            showToast('Wallet connection cancelled', 'error');
            return;
        }
        
        const publicKey = selectedWallet.adapter.publicKey.toString();
        
        // Store wallet adapter for transaction signing
        state.walletAdapter = selectedWallet.adapter;
        state.walletName = selectedWallet.name;
        
        // Connect to backend and check Genesis NFT
        await connectWallet(publicKey);
        
        // Update UI with wallet name and disconnect button
        const walletInfo = document.getElementById('wallet-info');
        walletInfo.innerHTML = `
            <div class="wallet-address">${selectedWallet.name}: ${formatWalletAddress(publicKey)}</div>
            <button id="disconnect-btn" class="btn btn-secondary btn-sm">Disconnect</button>
            <div class="genesis-badge" style="display: ${state.hasGenesis ? 'block' : 'none'};">
                <span class="badge badge-premium">⭐ Genesis - 50% OFF!</span>
            </div>
        `;
        
        // Add disconnect handler
        document.getElementById('disconnect-btn').addEventListener('click', disconnectWallet);
        
        hideLoading();
        showToast(`Connected to ${selectedWallet.name}!`);
        
    } catch (error) {
        hideLoading();
        console.error('Connection error:', error);
        if (error.message?.includes('User rejected')) {
            showToast('Connection cancelled', 'error');
        } else {
            showToast('Failed to connect wallet: ' + error.message, 'error');
        }
    }
}

// Disconnect Wallet Function
async function disconnectWallet() {
    try {
        if (state.walletAdapter) {
            await state.walletAdapter.disconnect();
        }
        
        // Reset state
        state.wallet = null;
        state.user = null;
        state.hasGenesis = false;
        state.subscriptionActive = false;
        state.walletAdapter = null;
        state.walletName = null;
        
        // Update UI
        document.getElementById('connect-wallet').style.display = 'block';
        document.getElementById('wallet-info').style.display = 'none';
        document.getElementById('wallet-info').innerHTML = `
            <div class="wallet-address"></div>
            <div class="genesis-badge" style="display: none;">
                <span class="badge badge-premium">⭐ Genesis Token Holder - 50% OFF Forever!</span>
            </div>
        `;
        document.getElementById('genesis-banner').style.display = 'none';
        document.getElementById('subscription-notice').style.display = 'none';
        
        // Clear all tab content
        document.getElementById('bills-list').innerHTML = '';
        document.getElementById('subscriptions-list').innerHTML = '';
        document.getElementById('expenses-list').innerHTML = '';
        document.getElementById('expenses-analytics').innerHTML = '';
        
        // Hide profile if visible
        const profileTab = document.getElementById('profile-tab');
        if (profileTab) profileTab.classList.remove('active');
        
        // Show bills tab
        document.querySelector('[data-tab="bills"]').click();
        
        showToast('Wallet disconnected');
    } catch (error) {
        console.error('Disconnect error:', error);
        showToast('Failed to disconnect', 'error');
    }
}

async function connectWallet(walletAddress) {
    try {
        // First, explicitly check for Genesis NFT
        const genesisCheck = await fetch(`${API_BASE}/api/genesis/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                walletAddress,
                genesisMint: GENESIS_NFT_MINT 
            })
        });
        
        const genesisData = await genesisCheck.json();
        console.log('Genesis Check Response:', genesisData);
        
        // Then connect to auth
        const response = await fetch(`${API_BASE}/api/auth/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                walletAddress,
                genesisMint: GENESIS_NFT_MINT,
                hasGenesis: genesisData.hasGenesis || false
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        state.wallet = walletAddress;
        state.user = data.user;
        // Use explicit Genesis check result
        state.hasGenesis = genesisData.hasGenesis || data.user.hasGenesis || false;
        state.subscriptionActive = data.user.subscriptionActive;
        
        console.log('Has Genesis NFT:', state.hasGenesis);
        
        updateUI();
        
        // Show special message for Genesis holders
        if (state.hasGenesis) {
            showToast('🎉 Genesis NFT Holder Detected! You have 50% OFF all fees!', 'success');
        } else {
            console.log('No Genesis NFT found for wallet:', walletAddress);
        }
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
    
    if (!state.walletAdapter) {
        showToast('Please reconnect your wallet', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/api/subscriptions/platform/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                walletAddress: state.wallet,
                hasGenesis: state.hasGenesis
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        // Create real Solana transaction for subscription payment
        const amount = state.hasGenesis ? 4.99 : 9.99; // Genesis holders pay $4.99, others $9.99
        const lamports = Math.floor(amount * 1000000); // Convert to lamports (rough SOL conversion)
        
        try {
            // Request transaction from wallet
            const transaction = {
                instructions: [{
                    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    data: Buffer.from([amount]),
                }],
            };
            
            // Sign and send transaction
            const signature = await state.walletAdapter.signAndSendTransaction(transaction);
            
            // Confirm payment with backend
            const confirmResponse = await fetch(`${API_BASE}/api/subscriptions/platform/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    walletAddress: state.wallet,
                    signature: signature
                })
            });
            
            const confirmData = await confirmResponse.json();
            
            if (confirmData.success) {
                state.subscriptionActive = true;
                document.getElementById('subscription-notice').style.display = 'none';
                showToast(`Subscription activated! ${state.hasGenesis ? 'Genesis discount applied!' : 'Welcome aboard!'} 🎉`);
            }
        } catch (txError) {
            hideLoading();
            if (txError.message?.includes('User rejected')) {
                showToast('Payment cancelled', 'error');
            } else {
                showToast('Payment failed: ' + txError.message, 'error');
            }
            return;
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
        case 'profile':
            await loadProfile();
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
        
        renderSubscriptions(data.subscriptions || []);
    } catch (error) {
        console.error('Load subscriptions error:', error);
        showToast('Failed to load subscriptions', 'error');
    }
}

function renderSubscriptions(subscriptions) {
    const container = document.getElementById('subscriptions-list');
    
    if (subscriptions.length === 0) {
        container.innerHTML = `
            <div class="list-item" style="text-align: center; padding: 40px;">
                <p style="color: var(--text-secondary);">No subscriptions tracked. Add your first one!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = subscriptions.map(sub => `
        <div class="list-item">
            <div class="list-item-header">
                <div>
                    <div class="list-item-title">${sub.name}</div>
                    <span class="status-badge status-${sub.status}">${sub.status.toUpperCase()}</span>
                </div>
                <div class="list-item-amount">${formatSOL(sub.amount)} / ${sub.billingCycle}</div>
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

// === PROFILE TAB ===
async function loadProfile() {
    if (!state.wallet) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/profile/${state.wallet}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        renderProfile(data.profile || {});
    } catch (error) {
        console.error('Load profile error:', error);
        renderProfile({});
    }
}

function renderProfile(profile) {
    const container = document.getElementById('profile-content');
    
    if (!container) return;
    
    const accountAge = profile.accountCreated ? 
        Math.floor((new Date() - new Date(profile.accountCreated)) / (1000 * 60 * 60 * 24)) : 0;
    
    container.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">
                ${state.hasGenesis ? '👑' : '👤'}
            </div>
            <h2>Your Profile</h2>
            ${state.hasGenesis ? `
                <div class="genesis-gold-badge">
                    <span class="gold-badge">✨ GENESIS HOLDER ✨</span>
                    <p class="gold-badge-subtitle">50% OFF All Fees Forever</p>
                </div>
            ` : ''}
        </div>
        
        <div class="profile-stats">
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-label">Wallet Address</div>
                <div class="stat-value">${formatWalletAddress(state.wallet)}</div>
                <div class="stat-subtext">${state.walletName || 'Connected'}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-label">Total Bills</div>
                <div class="stat-value">${profile.stats?.totalBills || 0}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">🔄</div>
                <div class="stat-label">Subscriptions</div>
                <div class="stat-value">${profile.stats?.totalSubscriptions || 0}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-label">Expenses Tracked</div>
                <div class="stat-value">${profile.stats?.totalExpenses || 0}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-label">Member Since</div>
                <div class="stat-value">${accountAge} days</div>
            </div>
            
            ${state.hasGenesis ? `
                <div class="stat-card genesis-benefits">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-label">Genesis Benefits</div>
                    <ul class="benefits-list">
                        <li>✅ 50% off subscription ($4.99/mo)</li>
                        <li>✅ 0.5% transaction fees (vs 1%)</li>
                        <li>✅ Priority support</li>
                        <li>✅ Early access to new features</li>
                    </ul>
                </div>
            ` : `
                <div class="stat-card upgrade-card">
                    <div class="stat-icon">🌟</div>
                    <div class="stat-label">Upgrade to Genesis</div>
                    <p style="margin: 8px 0;">Get 50% off forever + exclusive benefits</p>
                    <a href="https://magiceden.io" target="_blank" class="btn btn-premium btn-sm">
                        Get Genesis NFT
                    </a>
                </div>
            `}
        </div>
    `;
}
