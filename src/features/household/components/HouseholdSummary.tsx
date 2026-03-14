import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/src/components/ui';
import { formatCurrency } from '@/src/lib/formatters';
import type { HouseholdMember } from '@/src/types/database';

interface HouseholdSummaryProps {
  members: HouseholdMember[];
  totalContributions: number;
}

export function HouseholdSummary({ members, totalContributions }: HouseholdSummaryProps) {
  const contributingMembers = members.filter(
    (m) => m.monthly_contribution != null && m.monthly_contribution > 0
  );

  return (
    <Card variant="elevated" className="mb-4">
      <Text className="mb-3 text-sm font-semibold text-surface-900">
        Household Budget Summary
      </Text>

      {/* Total contributions */}
      <View className="mb-4 rounded-xl bg-accent-50 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <FontAwesome name="home" size={18} color="#16a34a" />
            <Text className="ml-2 text-sm text-accent-700">
              Total Monthly Contributions
            </Text>
          </View>
          <Text className="text-lg font-bold text-accent-800">
            {formatCurrency(totalContributions)}
          </Text>
        </View>
      </View>

      {/* Per-member breakdown */}
      {contributingMembers.length > 0 && (
        <>
          <Text className="mb-2 text-xs font-semibold text-surface-400">
            CONTRIBUTION BREAKDOWN
          </Text>
          {contributingMembers.map((member) => {
            const percentage =
              totalContributions > 0
                ? ((member.monthly_contribution ?? 0) / totalContributions) * 100
                : 0;

            return (
              <View key={member.id} className="mb-3">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-sm text-surface-700">{member.name}</Text>
                  <Text className="text-sm font-medium text-surface-900">
                    {formatCurrency(member.monthly_contribution ?? 0)}
                  </Text>
                </View>
                {/* Progress bar */}
                <View className="h-2 rounded-full bg-surface-100">
                  <View
                    className="h-2 rounded-full bg-primary-500"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </View>
                <Text className="mt-0.5 text-xs text-surface-400">
                  {percentage.toFixed(0)}% of total
                </Text>
              </View>
            );
          })}
        </>
      )}

      {/* Stats row */}
      <View className="mt-2 flex-row gap-3">
        <View className="flex-1 rounded-xl bg-surface-50 p-3">
          <Text className="text-xs text-surface-500">Members</Text>
          <Text className="text-lg font-bold text-surface-900">
            {members.length}
          </Text>
        </View>
        <View className="flex-1 rounded-xl bg-surface-50 p-3">
          <Text className="text-xs text-surface-500">Contributing</Text>
          <Text className="text-lg font-bold text-surface-900">
            {contributingMembers.length}
          </Text>
        </View>
        <View className="flex-1 rounded-xl bg-surface-50 p-3">
          <Text className="text-xs text-surface-500">Avg/Person</Text>
          <Text className="text-sm font-bold text-surface-900">
            {contributingMembers.length > 0
              ? formatCurrency(totalContributions / contributingMembers.length)
              : '₱0'}
          </Text>
        </View>
      </View>
    </Card>
  );
}
