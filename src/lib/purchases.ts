import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';
import { useSubscriptionStore } from '../stores/subscriptionStore';

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Replace these with your actual RevenueCat API keys.
// Get them from https://app.revenuecat.com → Project → API Keys
// ─────────────────────────────────────────────────────────────────────────────
const API_KEYS = {
  ios: 'appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  android: 'goog_aCuiUOJpwVATxNQncweUGNeoLUn',
};

// The entitlement identifier you create in RevenueCat dashboard
export const ENTITLEMENT_ID = 'premium';

export function initializePurchases(userId?: string | null) {
  const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey, appUserID: userId ?? undefined });
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    if (!offerings.current) return [];
    return offerings.current.availablePackages;
  } catch {
    return [];
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    const expiry = customerInfo.entitlements.active[ENTITLEMENT_ID]?.expirationDate ?? null;
    useSubscriptionStore.getState().setPremium(isPremium, 'monthly', expiry);
    return isPremium;
  } catch (e: any) {
    if (!e.userCancelled) throw e;
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    const expiry = customerInfo.entitlements.active[ENTITLEMENT_ID]?.expirationDate ?? null;
    useSubscriptionStore.getState().setPremium(isPremium, isPremium ? 'monthly' : 'free', expiry);
    return isPremium;
  } catch {
    return false;
  }
}

export async function syncSubscriptionStatus(userId?: string | null): Promise<void> {
  try {
    if (userId) {
      await Purchases.logIn(userId);
    }
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    const expiry = customerInfo.entitlements.active[ENTITLEMENT_ID]?.expirationDate ?? null;
    useSubscriptionStore.getState().setPremium(isPremium, isPremium ? 'monthly' : 'free', expiry);
  } catch {
    // Network error — keep locally cached status
  }
}
