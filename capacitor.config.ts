import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.symbiosis.protocol',
  appName: 'TSP',
  webDir: 'out',
  plugins: {
    SocialLogin: {
      google: {
        webClientId: "373842633648-jdjblnkhroppt9rgk4j7bltdb13uivou.apps.googleusercontent.com"
      }
    }
  }
};

export default config;
