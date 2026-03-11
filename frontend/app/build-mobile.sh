#!/bin/bash

# AI Daily Meal Planner - Mobile Build Script

echo "🚀 AI Daily Meal Planner - Mobile Build Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_info "Node.js version: $(node -v)"

# Install dependencies
print_info "Installing dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Build web assets
print_info "Building web assets..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Failed to build web assets"
    exit 1
fi

# Sync Capacitor
print_info "Syncing Capacitor..."
node node_modules/@capacitor/cli/bin/capacitor sync

if [ $? -ne 0 ]; then
    print_warning "Capacitor sync had some issues (iOS pod install may fail on Linux)"
fi

echo ""
echo "=============================================="
print_info "Build completed successfully!"
echo ""
echo "Next steps:"
echo ""
echo "📱 Android:"
echo "   1. Open Android Studio"
echo "   2. Open folder: $(pwd)/android"
echo "   3. Build → Generate Signed Bundle/APK"
echo ""
echo "🍎 iOS (macOS only):"
echo "   1. Run: npx cap open ios"
echo "   2. In Xcode: Product → Archive"
echo "   3. Distribute through App Store Connect"
echo ""
echo "🌐 Web:"
echo "   Already deployed to: https://j64yzev72vcq6.ok.kimi.link"
echo ""
