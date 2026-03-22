import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.symbiosis.protocol',
  appName: 'The Symbiosis Protocol',
  webDir: 'out',
  plugins: {
    SocialLogin: {
      google: {
        webClientId: "832774033925-1nrqdnelo8kbp2d4ulu2vuargb9vq6ln.apps.googleusercontent.com"
      }
    }
  },
  server: {
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
