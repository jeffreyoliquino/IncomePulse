import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/src/components/ui';
import { formatCurrency } from '@/src/lib/formatters';
import type { HouseholdMember } from '@/src/types/database';

const ROLE_STYLES: Record<HouseholdMember['role'], { bg: string; text: string; color: string }> = {
  owner: { bg: 'bg-purple-100', text: 'text-purple-700', color: '#7c3aed' },
  admin: { bg: 'bg-primary-100', text: 'text-primary-700', color: '#2563eb' },
  member: { bg: 'bg-surface-100', text: 'text-surface-600', color: '#64748b' },
};

interface MemberCardProps {
  member: HouseholdMember;
  isEditable: boolean;
  onEdit: (member: HouseholdMember) => void;
  onRemove: (id: string) => void;
}

export function MemberCard({ member, isEditable, onEdit, onRemove }: MemberCardProps) {
  const roleStyle = ROLE_STYLES[member.role];

  const handleRemove = () => {
    if (member.role === 'owner') return;
    Alert.alert(
      'Remove Member',
      `Remove ${member.name} from the household?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemove(member.id) },
      ]
    );
  };

  return (
    <Card variant="elevated" className="mb-3">
      <View className="flex-row items-center">
        {/* Avatar */}
        <View
          className="mr-3 h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: roleStyle.color + '20' }}
        >
          <FontAwesome name="user" size={18} color={roleStyle.color} />
        </View>

        {/* Info */}
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-sm font-semibold text-surface-900">
              {member.name}
            </Text>
            <View className={`ml-2 rounded-full px-2 py-0.5 ${roleStyle.bg}`}>
              <Text className={`text-xs font-medium ${roleStyle.text}`}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </Text>
            </View>
          </View>
          {member.monthly_contribution != null && member.monthly_contribution > 0 ? (
            <Text className="mt-0.5 text-xs text-surface-500">
              Contributes {formatCurrency(member.monthly_contribution)}/month
            </Text>
          ) : (
            <Text className="mt-0.5 text-xs text-surface-400">
              No contribution set
            </Text>
          )}
        </View>

        {/* Actions */}
        {isEditable && member.role !== 'owner' && (
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => onEdit(member)}
              className="h-8 w-8 items-center justify-center rounded-lg bg-surface-50"
            >
              <FontAwesome name="pencil" size={12} color="#64748b" />
            </Pressable>
            <Pressable
              onPress={handleRemove}
              className="h-8 w-8 items-center justify-center rounded-lg bg-danger-50"
            >
              <FontAwesome name="trash-o" size={12} color="#dc2626" />
            </Pressable>
          </View>
        )}
      </View>
    </Card>
  );
}
