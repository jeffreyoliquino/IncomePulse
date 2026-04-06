import React from 'react';
import { View } from 'react-native';
import { BannerAd as AdMobBanner, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { AD_UNIT_IDS } from '../../lib/ads';

export function BannerAd() {
  const isPremium = useSubscriptionStore((s) => s.isPremium);

  // Premium users never see ads
  if (isPremium) return null;

  return (
    <View style={{ alignItems: 'center', backgroundColor: '#f8fafc' }}>
      <AdMobBanner
        unitId={AD_UNIT_IDS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}
