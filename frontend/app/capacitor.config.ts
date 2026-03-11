import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aidailymeal.app',
  appName: 'AI Daily Meal Planner',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    Geolocation: {
      enabled: true,
    },
    Preferences: {
      enabled: true,
    },
  },
  ios: {
    contentInset: 'always',
    scheme: 'AI Meal Planner',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
