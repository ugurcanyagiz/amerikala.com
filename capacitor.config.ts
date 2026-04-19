import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amerikala.app',
  appName: 'Amerikala',
  webDir: 'out',
  server: {
    url: 'https://www.amerikala.com',
    cleartext: false
  }
};

export default config;