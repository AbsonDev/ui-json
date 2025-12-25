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
    buildOptions: {
      developmentTeam: undefined, // Configurar com o Team ID da Apple
      provisioningProfile: undefined, // Configurar com o Provisioning Profile
    },
  },
};

export default config;
