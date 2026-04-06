import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSubscription } from '../../hooks/useSubscription';
import type { PurchasesPackage } from 'react-native-purchases';

interface PremiumGateProps {
  children: React.ReactNode;
  /** Feature name shown in the paywall, e.g. "AI Coach" */
  featureName: string;
  /** Short description shown under the feature name */
  featureDescription?: string;
}

export function PremiumGate({ children, featureName, featureDescription }: PremiumGateProps) {
  const { isPremium, isLoading, packages, loadOfferings, subscribe, restore } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  if (isPremium) return <>{children}</>;

  const handleOpenPaywall = async () => {
    setShowPaywall(true);
    await loadOfferings();
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const success = await subscribe(pkg);
      if (success) {
        setShowPaywall(false);
      }
    } catch (e: any) {
      Alert.alert('Purchase Failed', e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const success = await restore();
      if (success) {
        setShowPaywall(false);
        Alert.alert('Restored', 'Your premium subscription has been restored!');
      } else {
        Alert.alert('No Purchase Found', 'No active subscription was found for your account.');
      }
    } catch {
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <>
      {/* Locked feature placeholder */}
      <Pressable
        onPress={handleOpenPaywall}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          backgroundColor: '#f8fafc',
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#e2e8f0',
          borderStyle: 'dashed',
          margin: 16,
        }}
      >
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <FontAwesome name="lock" size={28} color="#d97706" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>
          {featureName}
        </Text>
        <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
          {featureDescription ?? 'Upgrade to Premium to unlock this feature.'}
        </Text>
        <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}>
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>Upgrade to Premium</Text>
        </View>
      </Pressable>

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaywall(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' }} />
            </View>

            <Pressable onPress={() => setShowPaywall(false)} style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
              <FontAwesome name="times" size={20} color="#94a3b8" />
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }}>
              {/* Header */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <FontAwesome name="star" size={32} color="#2563eb" />
                </View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>IncomePulse Premium</Text>
                <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginTop: 6 }}>
                  Unlock all features and remove ads
                </Text>
              </View>

              {/* Feature list */}
              {PREMIUM_FEATURES.map((item) => (
                <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <FontAwesome name="check-circle" size={18} color="#16a34a" style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 15, color: '#374151' }}>{item}</Text>
                </View>
              ))}

              <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 }} />

              {/* Packages */}
              {isLoading ? (
                <ActivityIndicator color="#2563eb" style={{ marginVertical: 20 }} />
              ) : packages.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#94a3b8', marginVertical: 20 }}>
                  No plans available at the moment.
                </Text>
              ) : (
                packages.map((pkg) => (
                  <Pressable
                    key={pkg.identifier}
                    onPress={() => handlePurchase(pkg)}
                    disabled={purchasing}
                    style={{
                      borderWidth: 2,
                      borderColor: '#2563eb',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      backgroundColor: '#eff6ff',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: purchasing ? 0.6 : 1,
                    }}
                  >
                    <View>
                      <Text style={{ fontWeight: '700', fontSize: 16, color: '#1e40af' }}>
                        {pkg.product.title}
                      </Text>
                      <Text style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                        {pkg.product.description}
                      </Text>
                    </View>
                    <Text style={{ fontWeight: '800', fontSize: 18, color: '#2563eb' }}>
                      {pkg.product.priceString}
                    </Text>
                  </Pressable>
                ))
              )}

              {/* Restore */}
              <Pressable onPress={handleRestore} disabled={purchasing} style={{ alignItems: 'center', marginTop: 8 }}>
                <Text style={{ color: '#2563eb', fontSize: 14 }}>Restore Purchases</Text>
              </Pressable>

              <Text style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 16 }}>
                Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date.
                Manage subscriptions in your App Store / Google Play account settings.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const PREMIUM_FEATURES = [
  'AI Financial Coach',
  'Receipt Scanner (OCR)',
  'SMS Auto-Detection',
  'Cashflow Forecast (30/60/90 days)',
  'Price Monitor',
  'Budget Templates (Employee, OFW, Student)',
  'Unlimited budgets & transaction history',
  'Household multi-user management',
  'Data export (CSV/PDF)',
  'No ads',
];
