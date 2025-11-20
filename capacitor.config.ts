import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sinceonearth.app',
  appName: 'SinceOnEarth',
  webDir: 'dist',
  // Point to your production server for API calls
  server: {
    url: 'https://sinceonearth.com',
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#000000',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },
  },
};

export default config;
