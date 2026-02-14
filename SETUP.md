# 🚀 SOLANA FINANCIAL HUB - COMPLETE SETUP GUIDE

## 📁 WHAT'S IN THIS FOLDER

```
solana-hub-clean/
├── public/              # Your website (HTML, CSS, JS)
├── routes/              # Backend API routes
├── utils/               # Helper functions
├── server.js            # Main server file
├── package.json         # Project dependencies
├── .env.example         # Environment variables template
└── .gitignore           # Files to ignore in Git
```

---

## ⚙️ PREREQUISITES

You need:
1. **MacBook** (you have this ✅)
2. **Node.js** (we'll install this)
3. **GitHub account** (free - for deployment only)
4. **Helius API key** (free - for Solana data)

---

## 🎯 PART 1: WEB DEPLOYMENT (30 minutes)

### STEP 1: Install Node.js (5 mins - one-time setup)

```bash
# Check if you already have Node.js
node --version
npm --version

# If you DON'T see version numbers, install Node.js:

# First, install Homebrew (if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install Node.js
brew install node

# Verify installation
node --version  # Should show v18 or higher
npm --version   # Should show v9 or higher
```

---

### STEP 2: Set Up Your Project (3 mins)

```bash
# Navigate to where you unzipped this folder
cd ~/Downloads/solana-hub-clean

# Install all dependencies
npm install

# This will take 1-2 minutes
```

---

### STEP 3: Configure Environment Variables (3 mins)

```bash
# Create your environment file
cp .env.example .env

# Open it in TextEdit
open -a TextEdit .env
```

**Fill in these values:**

```
HELIUS_API_KEY=get_from_helius.dev
TREASURY_WALLET=your_solana_wallet_address_here
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
GENESIS_DISCOUNT_PERCENT=50
TRANSACTION_FEE_PERCENT=1
MONTHLY_SUBSCRIPTION_PRICE=9.99
PORT=3000
```

**🔑 Get Your Helius API Key (FREE):**
1. Go to: https://helius.dev
2. Sign up (takes 1 minute)
3. Create new API key
4. Copy and paste it into `.env` file
5. Add your Solana wallet address
6. **Save the file**

---

### STEP 4: Test Locally (1 min)

```bash
# Start the server
npm start
```

You should see:
```
🚀 Solana Financial Hub running on port 3000
🌐 Web: http://localhost:3000
```

**Open browser:** http://localhost:3000

✅ Test wallet connection
✅ Try creating a bill or expense
✅ Make sure everything works!

**Press Ctrl+C to stop the server when done testing**

---

### STEP 5: Deploy to Railway (15 mins)

#### A. Create GitHub Account & Repository

```bash
# Stop your local server first (Ctrl+C)

# Initialize Git in your project
git init
git add .
git commit -m "Initial commit"

# Go to GitHub.com and:
# 1. Click "New Repository" (green button)
# 2. Name it: solana-financial-hub
# 3. Make it PUBLIC
# 4. DON'T initialize with README
# 5. Click "Create Repository"

# Back in terminal (replace YOUR_USERNAME with your GitHub username):
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/solana-financial-hub.git
git push -u origin main

# Enter your GitHub credentials if asked
```

#### B. Deploy on Railway

1. **Go to:** https://railway.app
2. **Sign up** with your GitHub account (free, no credit card)
3. **Click:** "New Project"
4. **Click:** "Deploy from GitHub repo"
5. **Select:** `solana-financial-hub` repository
6. **Wait** for Railway to detect it's a Node.js app
7. **Click:** "Variables" tab on the left
8. **Add these environment variables** (click "New Variable" for each):

```
HELIUS_API_KEY = your_helius_key_here
TREASURY_WALLET = your_wallet_address
SOLANA_NETWORK = mainnet-beta
SOLANA_RPC_URL = https://api.mainnet-beta.solana.com
GENESIS_DISCOUNT_PERCENT = 50
TRANSACTION_FEE_PERCENT = 1
MONTHLY_SUBSCRIPTION_PRICE = 9.99
```

9. **Click:** "Deploy" (top right)
10. **Wait 2-3 minutes** for deployment
11. **Click:** "Settings" → "Generate Domain"
12. **Your live URL:** `https://solana-financial-hub-production.up.railway.app`

---

### 🎉 YOUR WEBSITE IS LIVE!

Test your live site:
- Open the Railway URL
- Connect wallet
- Try all features

---

## 🎯 PART 2: ANDROID APK BUILD (45 minutes)

### REQUIREMENTS FOR APK

You'll need:
- Java Development Kit (JDK)
- Android Studio
- React Native CLI
- **arm64-v8a** architecture support (required for Solana dApp Store)

---

### STEP 1: Install Required Tools (15 mins)

```bash
# Install Java JDK
brew install --cask temurin

# Verify Java installation
java --version

# Install React Native CLI
npm install -g react-native-cli

# Install Watchman (for React Native)
brew install watchman

# Install Android Studio
# Download from: https://developer.android.com/studio
# Manual installation required - follow Android Studio setup wizard
```

**Android Studio Setup:**
1. Open Android Studio
2. Go to: Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
3. Install:
   - Android SDK Platform 33 (or latest)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
4. Note the SDK path (usually: `/Users/YOUR_USERNAME/Library/Android/sdk`)

**Add to your terminal profile:**

```bash
# Open your shell profile
nano ~/.zshrc

# Add these lines:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Save (Ctrl+O, Enter, Ctrl+X)

# Reload profile
source ~/.zshrc

# Verify
echo $ANDROID_HOME
```

---

### STEP 2: Create React Native Project (10 mins)

```bash
# Navigate to your home directory
cd ~

# Create React Native project
npx react-native init SolanaFinancialHub

# Navigate into the project
cd SolanaFinancialHub

# Install required dependencies
npm install @solana/web3.js @solana/wallet-adapter-react-native axios
```

---

### STEP 3: Configure for arm64-v8a (5 mins)

```bash
# Open gradle.properties
open -a TextEdit android/gradle.properties
```

**Add these lines:**

```
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx4096m
```

**Edit build.gradle:**

```bash
# Open build.gradle
open -a TextEdit android/app/build.gradle
```

**Find the `splits` section and update it:**

```gradle
splits {
    abi {
        reset()
        enable true
        universalApk false
        include "arm64-v8a", "armeabi-v7a", "x86", "x86_64"
    }
}
```

This ensures your APK supports **arm64-v8a** which is REQUIRED for Solana dApp Store.

---

### STEP 4: Connect Your App to Backend (10 mins)

```bash
# Open App.tsx or App.js
open -a TextEdit App.tsx
```

**Replace the content with a simple WebView that points to your Railway URL:**

```typescript
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: 'https://your-railway-url.up.railway.app' }}
        style={styles.webview}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default App;
```

**Install WebView:**

```bash
npm install react-native-webview
cd ios && pod install && cd ..
```

---

### STEP 5: Build APK (10 mins)

```bash
# Navigate to Android folder
cd android

# Clean build
./gradlew clean

# Build release APK
./gradlew assembleRelease

# Your APK will be at:
# android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

---

### STEP 6: Sign APK with Android Studio (5 mins)

1. **Open Android Studio**
2. **Open:** Your project's `android` folder
3. **Go to:** Build → Generate Signed Bundle / APK
4. **Select:** APK
5. **Create new keystore:**
   - Key store path: `/Users/YOUR_NAME/solana-hub.jks`
   - Password: (create a strong password)
   - Key alias: `solana-hub`
   - Validity: 25 years
6. **Build Variants:** Select `release`
7. **Click:** Finish

**Your signed APK will be at:**
```
android/app/release/app-arm64-v8a-release.apk
```

---

### STEP 7: Verify Architecture Support

```bash
# Install AAPT (if not already installed)
brew install android-platform-tools

# Check APK architecture
aapt dump badging android/app/build/outputs/apk/release/app-arm64-v8a-release.apk | grep native-code

# Should show: native-code: 'arm64-v8a'
```

---

## 📱 SUBMIT TO SOLANA dAPP STORE

Your APK is now ready! It supports:
- ✅ arm64-v8a architecture (required)
- ✅ Signed with your keystore
- ✅ Release build optimized

**Submission checklist:**
- [ ] APK is signed
- [ ] APK supports arm64-v8a
- [ ] App connects to Solana mainnet
- [ ] All features tested on Android device
- [ ] Screenshots prepared
- [ ] App description ready

---

## 🐛 TROUBLESHOOTING

**Node.js issues:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Android build fails:**
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

**Keystore lost:**
- Keep your keystore file safe!
- Back it up - you can't update your app without it

---

## 📞 NEED HELP?

- Check Railway logs for backend errors
- Check React Native logs: `npx react-native log-android`
- Verify all environment variables are set
- Make sure Helius API key is valid

---

## ✅ FINAL CHECKLIST

**Web Deployment:**
- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] .env file configured
- [ ] Tested locally
- [ ] Pushed to GitHub
- [ ] Deployed to Railway
- [ ] Live URL working

**Android APK:**
- [ ] JDK installed
- [ ] Android Studio installed
- [ ] React Native project created
- [ ] arm64-v8a configured
- [ ] APK built
- [ ] APK signed with keystore
- [ ] Architecture verified

---

## 🎉 YOU'RE READY!

Your Solana Financial Hub is now:
1. ✅ Live on the web
2. ✅ Ready to distribute as Android APK

**Keep your original zip as backup - you have everything you need in this clean version!**
