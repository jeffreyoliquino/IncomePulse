import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Replace with your real Ad Unit IDs from https://admob.google.com
// Create a Banner ad unit for each platform in your AdMob account.
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTION_IDS = {
  banner: {
    ios: 'ca-app-pub-4275093458052066/2196384775',
    android: 'ca-app-pub-4275093458052066/1019034477',
  },
};

export const AD_UNIT_IDS = {
  banner: __DEV__
    ? TestIds.BANNER
    : Platform.OS === 'ios'
      ? PRODUCTION_IDS.banner.ios
      : PRODUCTION_IDS.banner.android,
};
