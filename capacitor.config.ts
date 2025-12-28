import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.uijson.visualizer',
  appName: 'UI JSON Visualizer',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB', // Gera App Bundle em vez de APK
    },
  },
  ios: {
    scheme: 'UI JSON Visualizer',
  },
};

export default config;
