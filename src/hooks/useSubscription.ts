import { useState } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  syncSubscriptionStatus,
} from '../lib/purchases';

// ─────────────────────────────────────────────────────────────────────────────
// Free-tier limits
// ─────────────────────────────────────────────────────────────────────────────
export const FREE_LIMITS = {
  BUDGET_CATEGORIES: 3,
  TRANSACTION_MONTHS: 3,
  FINANCIAL_OBLIGATIONS: 3,
};

// Tools that require premium
export const PREMIUM_TOOLS = new Set([
  'ai_coach',
  'receipt_scanner',
  'sms_detector',
  'cashflow',
  'price_monitor',
  'budget_templates',
  'export',
  'household',
]);

export function useSubscription() {
  const { isPremium, plan, expiresAt, isLoading, setLoading } = useSubscriptionStore();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  const loadOfferings = async () => {
    setLoading(true);
    const pkgs = await getOfferings();
    setPackages(pkgs);
    setLoading(false);
    return pkgs;
  };

  const subscribe = async (pkg: PurchasesPackage): Promise<boolean> => {
    setLoading(true);
    try {
      return await purchasePackage(pkg);
    } finally {
      setLoading(false);
    }
  };

  const restore = async (): Promise<boolean> => {
    setLoading(true);
    try {
      return await restorePurchases();
    } finally {
      setLoading(false);
    }
  };

  const sync = async (userId?: string | null) => {
    await syncSubscriptionStatus(userId);
  };

  const canUseTool = (toolId: string): boolean => {
    if (isPremium) return true;
    return !PREMIUM_TOOLS.has(toolId);
  };

  return {
    isPremium,
    plan,
    expiresAt,
    isLoading,
    packages,
    loadOfferings,
    subscribe,
    restore,
    sync,
    canUseTool,
    FREE_LIMITS,
  };
}
