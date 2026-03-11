# AI Daily Meal Planner - Build Guide

## 🌐 Web App (Already Deployed)
**Live URL**: https://j64yzev72vcq6.ok.kimi.link

## 📱 Native App Build Instructions

### Prerequisites

1. **Node.js 18+** and npm
2. **Android Studio** (for Android builds)
3. **Xcode 14+** (for iOS builds, macOS only)
4. **CocoaPods** (for iOS dependencies, macOS only)

---

## Android Build

### Step 1: Install Dependencies
```bash
cd /mnt/okcomputer/output/app
npm install
```

### Step 2: Build Web Assets
```bash
npm run build
```

### Step 3: Sync Capacitor
```bash
npx cap sync android
```

### Step 4: Open in Android Studio
```bash
npx cap open android
```

### Step 5: Build APK/AAB
In Android Studio:
1. Select `Build` → `Generate Signed Bundle / APK`
2. Choose `APK` or `Android App Bundle`
3. Create or select a keystore
4. Build the release version

Or use command line:
```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

---

## iOS Build (macOS only)

### Step 1: Install CocoaPods
```bash
sudo gem install cocoapods
```

### Step 2: Build Web Assets
```bash
npm run build
```

### Step 3: Sync Capacitor
```bash
npx cap sync ios
```

### Step 4: Install Pods
```bash
cd ios/App
pod install
```

### Step 5: Open in Xcode
```bash
npx cap open ios
```

### Step 6: Build and Archive
In Xcode:
1. Select your team in Signing & Capabilities
2. Select `Product` → `Archive`
3. Distribute the app through App Store Connect

---

## HarmonyOS Build

HarmonyOS support requires additional setup:

1. Install **DevEco Studio** (Huawei's IDE)
2. Create a HarmonyOS project
3. Copy the web assets from `dist/` folder
4. Build using DevEco Studio

Note: Full HarmonyOS support is experimental and may require additional configuration.

---

## Configuration

### Required API Keys

1. **LLM API Key** (for recipe generation):
   - OpenAI: https://platform.openai.com/api-keys
   - Doubao: https://www.volcengine.com/product/doubao
   - Tongyi: https://dashscope.aliyun.com/
   - Anthropic: https://console.anthropic.com/

2. **Google Maps API Key** (for location services):
   - Get from: https://console.cloud.google.com/google/maps-apis/credentials
   - Enable APIs: Places API, Geocoding API, Maps Static API

### Environment Variables

Create a `.env` file in the project root:
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## Features

### ✅ Implemented
- [x] Multi-language support (EN, DE, FR, ES, IT, ZH)
- [x] LLM API configuration with save functionality
- [x] Google Maps integration
- [x] Supermarket deal scraper
- [x] Restaurant recommendations
- [x] User preference storage
- [x] Recipe generation
- [x] Cross-platform (iOS, Android, Web)

### 🔜 Coming Soon
- [ ] Real supermarket API integration
- [ ] Push notifications
- [ ] Offline mode
- [ ] Recipe favorites
- [ ] Meal planning calendar

---

## Troubleshooting

### Android Build Issues
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run build
npx cap sync android
```

### iOS Build Issues
```bash
# Clean and rebuild
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..
npm run build
npx cap sync ios
```

### Capacitor Sync Issues
```bash
# Force sync
npx cap sync --force
```

---

## Support

For issues and feature requests, please contact the development team.
