import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.symbiosis.protocol',
  appName: 'TSP',
  webDir: 'out',
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "SEU_CLIENT_ID_AQUI.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
