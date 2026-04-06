// Web stub — react-native-purchases is native only.
// On web, the app always runs in free mode (no in-app purchases).
import type { PurchasesPackage } from 'react-native-purchases';

export const ENTITLEMENT_ID = 'premium';

export function initializePurchases(_userId?: string | null) {}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  return [];
}

export async function purchasePackage(_pkg: PurchasesPackage): Promise<boolean> {
  return false;
}

export async function restorePurchases(): Promise<boolean> {
  return false;
}

export async function syncSubscriptionStatus(_userId?: string | null): Promise<void> {}
