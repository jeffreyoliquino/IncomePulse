import { useTheme } from '@/src/lib/ThemeProvider';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, Text, TouchableWithoutFeedback, View } from 'react-native';

const logoImage = require('@/assets/images/incompulse-header-logo-0226.png');

const FINANCES_MENU = [
  { label: 'Overview',    icon: 'th-large',    color: '#d97706', route: '/(tabs)/transactions' },
  { label: 'Income',      icon: 'arrow-down',  color: '#16a34a', route: '/(tabs)/transactions/income' },
  { label: 'Expenses',    icon: 'arrow-up',    color: '#dc2626', route: '/(tabs)/transactions/expenses' },
  { label: 'Investments', icon: 'line-chart',  color: '#7c3aed', route: '/(tabs)/transactions/investments' },
  { label: 'Funds',       icon: 'bank',        color: '#0891b2', route: '/(tabs)/transactions/funds' },
  { label: 'Accounts',    icon: 'credit-card', color: '#0284c7', route: '/(tabs)/transactions/accounts' },
];

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { isDark } = useTheme();
  const [showFinancesMenu, setShowFinancesMenu] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: isDark ? '#fbbf24' : '#d97706',
          tabBarInactiveTintColor: isDark ? '#64748b' : '#94a3b8',
          tabBarStyle: {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderTopColor: isDark ? '#334155' : '#e2e8f0',
            height: 85,
            paddingBottom: 20,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
          },
          headerTintColor: isDark ? '#f1f5f9' : '#0f172a',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.push('/(tabs)/dashboard')} style={{ marginLeft: 15 }}>
              <Image
                source={logoImage}
                style={{ width: 58, height: 58 }}
                resizeMode="contain"
              />
            </Pressable>
          ),
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Finances',
            tabBarIcon: ({ color }) => <TabBarIcon name="exchange" color={color} />,
            tabBarButton: ({ children, style, onLongPress, accessibilityState, testID }) => (
              <Pressable
                onPress={() => setShowFinancesMenu(true)}
                onLongPress={onLongPress}
                accessibilityState={accessibilityState}
                testID={testID}
                style={[style, { alignItems: 'center', justifyContent: 'center' }]}
              >
                {children}
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="savings"
          options={{
            title: 'Savings',
            tabBarIcon: ({ color }) => <TabBarIcon name="money" color={color} />,
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: 'Budgets',
            tabBarIcon: ({ color }) => <TabBarIcon name="pie-chart" color={color} />,
          }}
        />
        <Tabs.Screen
          name="financial-obligations"
          options={{
            title: 'Obligations',
            tabBarIcon: ({ color }) => <TabBarIcon name="file-text-o" color={color} />,
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: 'Tools',
            tabBarIcon: ({ color }) => <TabBarIcon name="calculator" color={color} />,
          }}
        />
        {/* Hide less essential screens */}
        <Tabs.Screen name="news" options={{ href: null }} />
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="two" options={{ href: null }} />
      </Tabs>

      {/* Finances bottom sheet — absolute overlay, works on both web and native */}
      {showFinancesMenu && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999,
          justifyContent: 'flex-end',
        }}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={() => setShowFinancesMenu(false)}>
            <View style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
            }} />
          </TouchableWithoutFeedback>

          {/* Sheet */}
          <View style={{
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingBottom: 48,
            width: '100%',
          }}>
            {/* Handle bar */}
            <View style={{
              width: 40, height: 4, borderRadius: 2,
              backgroundColor: '#e2e8f0',
              alignSelf: 'center',
              marginBottom: 16,
            }} />

            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#94a3b8',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              paddingHorizontal: 24,
              marginBottom: 6,
            }}>
              Finances
            </Text>

            {FINANCES_MENU.map((item, index) => (
              <Pressable
                key={item.route}
                onPress={() => {
                  setShowFinancesMenu(false);
                  router.push(item.route as any);
                }}
              >
                {({ pressed }) => (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 24,
                    paddingVertical: 15,
                    backgroundColor: pressed ? '#f8fafc' : '#ffffff',
                    borderTopWidth: index === 0 ? 1 : 0,
                    borderBottomWidth: 1,
                    borderColor: '#f1f5f9',
                  }}>
                    <View style={{
                      width: 38, height: 38,
                      borderRadius: 10,
                      backgroundColor: item.color + '18',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                    }}>
                      <FontAwesome name={item.icon as any} size={16} color={item.color} />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1e293b', flex: 1 }}>
                      {item.label}
                    </Text>
                    <FontAwesome name="chevron-right" size={12} color="#cbd5e1" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
