# 🎯 TERMINAL COMMANDS CHEAT SHEET

## 📱 PART 1: WEB DEPLOYMENT (Copy & Paste These Commands)

### Step 1: Install Node.js (if needed)
```bash
# Check if you have Node.js
node --version

# If not, install:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

### Step 2: Setup Project
```bash
# Navigate to the folder
cd ~/Downloads/solana-hub-clean

# Install dependencies
npm install
```

### Step 3: Configure Environment
```bash
# Create .env file
cp .env.example .env

# Edit it
open -a TextEdit .env

# Add your Helius API key from https://helius.dev
# Add your Solana wallet address
# Save the file
```

### Step 4: Test Locally
```bash
# Start server
npm start

# Open browser to: http://localhost:3000
# Test everything works
# Press Ctrl+C to stop
```

### Step 5: Deploy to Railway
```bash
# Initialize Git
git init
git add .
git commit -m "Initial commit"

# Replace YOUR_USERNAME with your GitHub username:
git remote add origin https://github.com/YOUR_USERNAME/solana-financial-hub.git
git push -u origin main

# Then go to Railway.app and deploy from GitHub
```

---

## 📱 PART 2: ANDROID APK (After Web Works)

### Step 1: Install Android Tools
```bash
# Install Java
brew install --cask temurin

# Install React Native
npm install -g react-native-cli

# Install Watchman
brew install watchman

# Download Android Studio manually from:
# https://developer.android.com/studio
```

### Step 2: Configure Android SDK
```bash
# Add to ~/.zshrc
nano ~/.zshrc

# Paste these lines:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Save (Ctrl+O, Enter, Ctrl+X)
source ~/.zshrc
```

### Step 3: Create React Native App
```bash
# Create new project
cd ~
npx react-native init SolanaFinancialHub
cd SolanaFinancialHub

# Install dependencies
npm install @solana/web3.js react-native-webview
```

### Step 4: Configure for arm64-v8a
```bash
# Edit build.gradle
open -a TextEdit android/app/build.gradle

# Find "splits" section and ensure it includes:
# include "arm64-v8a", "armeabi-v7a", "x86", "x86_64"
```

### Step 5: Build APK
```bash
# Navigate to android folder
cd android

# Clean and build
./gradlew clean
./gradlew assembleRelease

# APK will be at:
# android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

### Step 6: Sign APK
```bash
# Open Android Studio
# File → Open → Select your android folder
# Build → Generate Signed Bundle / APK
# Follow the wizard to create keystore and sign
```

---

## 🔧 TROUBLESHOOTING COMMANDS

### Kill process on port 3000
```bash
lsof -ti:3000 | xargs kill -9
```

### Clear npm cache
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Check Java version
```bash
java --version
```

### Check Android SDK
```bash
echo $ANDROID_HOME
```

### Verify APK architecture
```bash
aapt dump badging your-app.apk | grep native-code
# Should show: arm64-v8a
```

---

## ✅ QUICK CHECKLIST

### Web Deployment
- [ ] Node.js installed (`node --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] .env configured with Helius key
- [ ] Tested locally (`npm start`)
- [ ] Pushed to GitHub
- [ ] Deployed on Railway

### Android APK
- [ ] JDK installed (`java --version`)
- [ ] Android Studio installed
- [ ] React Native project created
- [ ] arm64-v8a in build.gradle
- [ ] APK built (`./gradlew assembleRelease`)
- [ ] APK signed in Android Studio
- [ ] Architecture verified

---

**For detailed explanations, see SETUP.md**
