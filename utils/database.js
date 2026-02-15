// Simple in-memory database for web demo
// In production native app, replace with SQLite or Realm

class Database {
  constructor() {
    this.users = new Map();
    this.bills = new Map();
    this.subscriptions = new Map();
    this.expenses = new Map();
    this.billCounter = 0;
    this.subscriptionCounter = 0;
    this.expenseCounter = 0;
  }

  // USER OPERATIONS
  createUser(userData) {
    const { walletAddress, hasGenesis, subscriptionActive, createdAt } = userData;
    const user = {
      walletAddress,
      hasGenesis: hasGenesis || false,
      createdAt: createdAt || new Date().toISOString(),
      subscriptionActive: subscriptionActive || false,
      subscriptionExpiry: null
    };
    this.users.set(walletAddress, user);
    console.log('User created in database:', walletAddress);
    return user;
  }

  getUser(walletAddress) {
    return this.users.get(walletAddress);
  }

  updateUser(walletAddress, updates) {
    const user = this.users.get(walletAddress);
    if (user) {
      Object.assign(user, updates);
      this.users.set(walletAddress, user);
    }
    return user;
  }

  // BILL OPERATIONS
  createBill(billData) {
    const billId = `bill_${++this.billCounter}`;
    const bill = {
      id: billId,
      ...billData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.bills.set(billId, bill);
    return bill;
  }

  getBill(billId) {
    return this.bills.get(billId);
  }

  getUserBills(walletAddress) {
    return Array.from(this.bills.values()).filter(
      bill => bill.createdBy === walletAddress || 
              bill.participants.some(p => p.address === walletAddress)
    );
  }

  updateBill(billId, updates) {
    const bill = this.bills.get(billId);
    if (bill) {
      Object.assign(bill, updates);
      this.bills.set(billId, bill);
    }
    return bill;
  }

  // SUBSCRIPTION OPERATIONS
  createSubscription(subscriptionData) {
    const subId = `sub_${++this.subscriptionCounter}`;
    const subscription = {
      id: subId,
      ...subscriptionData,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this.subscriptions.set(subId, subscription);
    return subscription;
  }

  getSubscription(subId) {
    return this.subscriptions.get(subId);
  }

  getUserSubscriptions(walletAddress) {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.walletAddress === walletAddress
    );
  }

  updateSubscription(subId, updates) {
    const subscription = this.subscriptions.get(subId);
    if (subscription) {
      Object.assign(subscription, updates);
      this.subscriptions.set(subId, subscription);
    }
    return subscription;
  }

  // EXPENSE OPERATIONS
  createExpense(expenseData) {
    const expenseId = `exp_${++this.expenseCounter}`;
    const expense = {
      id: expenseId,
      ...expenseData,
      createdAt: new Date().toISOString()
    };
    this.expenses.set(expenseId, expense);
    return expense;
  }

  getExpense(expenseId) {
    return this.expenses.get(expenseId);
  }

  getUserExpenses(walletAddress, filters = {}) {
    let userExpenses = Array.from(this.expenses.values()).filter(
      exp => exp.walletAddress === walletAddress
    );

    // Apply filters
    if (filters.category) {
      userExpenses = userExpenses.filter(exp => exp.category === filters.category);
    }

    if (filters.startDate) {
      userExpenses = userExpenses.filter(exp => exp.date >= filters.startDate);
    }

    if (filters.endDate) {
      userExpenses = userExpenses.filter(exp => exp.date <= filters.endDate);
    }

    return userExpenses;
  }

  updateExpense(expenseId, updates) {
    const expense = this.expenses.get(expenseId);
    if (expense) {
      Object.assign(expense, updates);
      this.expenses.set(expenseId, expense);
    }
    return expense;
  }

  deleteExpense(expenseId) {
    return this.expenses.delete(expenseId);
  }

  // ANALYTICS
  getExpenseAnalytics(walletAddress, startDate, endDate) {
    const expenses = this.getUserExpenses(walletAddress, { startDate, endDate });
    
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const byCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    const monthlyBreakdown = expenses.reduce((acc, exp) => {
      const month = exp.date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + exp.amount;
      return acc;
    }, {});

    return {
      totalExpenses: expenses.length,
      totalSpent,
      byCategory,
      monthlyBreakdown
    };
  }
}

// Export singleton instance
module.exports = new Database();
