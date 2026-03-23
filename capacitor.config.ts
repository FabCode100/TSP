import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.symbiosis.protocol',
  appName: 'The Symbiosis Protocol',
  webDir: 'out',
  plugins: {
    SocialLogin: {
      google: {
        webClientId: "373842633648-jdjblnkhroppt9rgk4j7bltdb13uivou.apps.googleusercontent.com"
      }
    }
  },
  server: {
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
