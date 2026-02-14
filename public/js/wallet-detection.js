// Universal Solana Wallet Detection - Pure JavaScript
// Works with: Phantom, Solflare, Backpack, Seeker, Glow, Exodus, and more

class WalletDetector {
    constructor() {
        this.wallets = [];
        this.selectedWallet = null;
    }

    async detectAllWallets() {
        this.wallets = [];

        // Detect Seeker FIRST (priority on Seeker phones)
        if (window.seeker) {
            this.wallets.push({
                name: 'Seeker',
                adapter: window.seeker,
                priority: true
            });
        }

        // Detect Phantom
        if (window.solana?.isPhantom) {
            this.wallets.push({
                name: 'Phantom',
                adapter: window.solana
            });
        }

        // Detect Solflare
        if (window.solflare?.isSolflare) {
            this.wallets.push({
                name: 'Solflare',
                adapter: window.solflare
            });
        }

        // Detect Backpack
        if (window.backpack?.isBackpack) {
            this.wallets.push({
                name: 'Backpack',
                adapter: window.backpack
            });
        }

        // Detect Glow
        if (window.glow) {
            this.wallets.push({
                name: 'Glow',
                adapter: window.glow
            });
        }

        // Detect Exodus
        if (window.exodus?.solana) {
            this.wallets.push({
                name: 'Exodus',
                adapter: window.exodus.solana
            });
        }

        // Detect Coin98
        if (window.coin98?.sol) {
            this.wallets.push({
                name: 'Coin98',
                adapter: window.coin98.sol
            });
        }

        // Sort: Seeker first if available
        this.wallets.sort((a, b) => {
            if (a.priority) return -1;
            if (b.priority) return 1;
            return a.name.localeCompare(b.name);
        });

        console.log('Detected wallets:', this.wallets.map(w => w.name));
        return this.wallets;
    }

    async connect(walletName) {
        const wallet = this.wallets.find(w => w.name === walletName);
        if (!wallet) {
            throw new Error(`Wallet ${walletName} not found`);
        }

        try {
            await wallet.adapter.connect();
            const publicKey = wallet.adapter.publicKey;

            this.selectedWallet = {
                name: wallet.name,
                publicKey: publicKey.toString(),
                adapter: wallet.adapter
            };

            localStorage.setItem('lastWallet', wallet.name);
            localStorage.setItem('walletAddress', publicKey.toString());

            console.log(`✅ Connected to ${wallet.name}: ${publicKey.toString()}`);
            return this.selectedWallet;
        } catch (error) {
            console.error('Wallet connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.selectedWallet) {
            try {
                await this.selectedWallet.adapter.disconnect();
            } catch (e) {
                console.log('Disconnect error:', e);
            }
            this.selectedWallet = null;
            localStorage.removeItem('lastWallet');
            localStorage.removeItem('walletAddress');
        }
    }

    isSeekerPhone() {
        const userAgent = navigator.userAgent || '';
        return /Seeker/i.test(userAgent) || window.seeker !== undefined;
    }

    async autoConnect() {
        const lastWallet = localStorage.getItem('lastWallet');
        if (lastWallet) {
            await this.detectAllWallets();
            try {
                return await this.connect(lastWallet);
            } catch (e) {
                console.log('Auto-connect failed:', e);
                return null;
            }
        }
        return null;
    }
}

window.WalletDetector = WalletDetector;
