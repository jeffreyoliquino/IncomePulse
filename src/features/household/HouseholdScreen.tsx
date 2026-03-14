import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card } from '@/src/components/ui';
import { useHousehold } from './hooks/useHousehold';
import { MemberCard } from './components/MemberCard';
import { HouseholdSummary } from './components/HouseholdSummary';
import type { HouseholdMember } from '@/src/types/database';

const householdSchema = z.object({
  name: z.string().min(1, 'Household name is required'),
});

const memberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contribution: z.string().optional(),
});

type HouseholdForm = z.infer<typeof householdSchema>;
type MemberForm = z.infer<typeof memberSchema>;

const ROLES: { label: string; value: HouseholdMember['role']; color: string }[] = [
  { label: 'Admin', value: 'admin', color: '#2563eb' },
  { label: 'Member', value: 'member', color: '#64748b' },
];

export function HouseholdScreen() {
  const {
    household,
    members,
    totalContributions,
    createHousehold,
    addNewMember,
    updateMember,
    removeMember,
    deleteHousehold,
  } = useHousehold();

  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<HouseholdMember['role']>('member');

  // Household creation form
  const {
    control: householdControl,
    handleSubmit: handleHouseholdSubmit,
    formState: { errors: householdErrors },
  } = useForm<HouseholdForm>({
    resolver: zodResolver(householdSchema),
    defaultValues: { name: '' },
  });

  // Member form
  const {
    control: memberControl,
    handleSubmit: handleMemberSubmit,
    reset: resetMember,
    setValue: setMemberValue,
    formState: { errors: memberErrors },
  } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: '', contribution: '' },
  });

  const onCreateHousehold = (data: HouseholdForm) => {
    createHousehold(data.name);
  };

  const onAddMember = (data: MemberForm) => {
    const contribution = data.contribution ? parseFloat(data.contribution) : null;

    if (editingMember) {
      updateMember(editingMember.id, {
        name: data.name,
        role: selectedRole,
        monthly_contribution: contribution,
      });
      setEditingMember(null);
    } else {
      addNewMember(data.name, selectedRole, contribution);
    }

    resetMember();
    setSelectedRole('member');
    setShowAddMember(false);
  };

  const handleEdit = (member: HouseholdMember) => {
    setEditingMember(member);
    setMemberValue('name', member.name);
    setMemberValue('contribution', member.monthly_contribution?.toString() ?? '');
    setSelectedRole(member.role === 'owner' ? 'admin' : member.role);
    setShowAddMember(true);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Household',
      'This will remove the household and all members. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteHousehold },
      ]
    );
  };

  // No household yet - show creation flow
  if (!household) {
    return (
      <ScrollView className="flex-1 bg-surface-50 px-4 pt-4">
        <View className="items-center py-12">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary-50">
            <FontAwesome name="home" size={36} color="#2563eb" />
          </View>
          <Text className="mb-2 text-xl font-bold text-surface-900">
            Set Up Your Household
          </Text>
          <Text className="mb-8 text-center text-sm text-surface-500">
            Track shared expenses and contributions with family members or
            housemates.
          </Text>

          <View className="w-full">
            <Controller
              control={householdControl}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Household Name"
                  placeholder="e.g., Dela Cruz Family"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={householdErrors.name?.message}
                />
              )}
            />

            <View className="mt-4">
              <Button
                title="Create Household"
                onPress={handleHouseholdSubmit(onCreateHousehold)}
                fullWidth
                size="lg"
                icon={<FontAwesome name="plus" size={16} color="#ffffff" />}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Household exists - show management
  return (
    <View className="flex-1 bg-surface-50">
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Household name header */}
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-50">
              <FontAwesome name="home" size={18} color="#2563eb" />
            </View>
            <View>
              <Text className="text-lg font-bold text-surface-900">
                {household.name}
              </Text>
              <Text className="text-xs text-surface-500">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <Pressable onPress={handleDelete} className="p-2">
            <FontAwesome name="trash-o" size={18} color="#dc2626" />
          </Pressable>
        </View>

        {/* Summary */}
        <HouseholdSummary
          members={members}
          totalContributions={totalContributions}
        />

        {/* Members list */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-surface-500">
            MEMBERS
          </Text>
          <Pressable
            onPress={() => {
              setEditingMember(null);
              resetMember();
              setSelectedRole('member');
              setShowAddMember(true);
            }}
            className="flex-row items-center"
          >
            <FontAwesome name="plus" size={12} color="#2563eb" />
            <Text className="ml-1 text-sm font-medium text-primary-600">
              Add
            </Text>
          </Pressable>
        </View>

        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isEditable={true}
            onEdit={handleEdit}
            onRemove={removeMember}
          />
        ))}

        <View className="h-8" />
      </ScrollView>

      {/* Add/Edit Member Modal */}
      <Modal visible={showAddMember} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white"
        >
          <View className="flex-row items-center justify-between border-b border-surface-200 px-4 py-4">
            <Pressable
              onPress={() => {
                setShowAddMember(false);
                setEditingMember(null);
                resetMember();
              }}
            >
              <Text className="text-base text-surface-500">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-bold text-surface-900">
              {editingMember ? 'Edit Member' : 'Add Member'}
            </Text>
            <View className="w-12" />
          </View>

          <ScrollView className="flex-1 px-4 pt-4">
            <Controller
              control={memberControl}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Name"
                  placeholder="e.g., Juan Dela Cruz"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={memberErrors.name?.message}
                />
              )}
            />

            {/* Role selector */}
            <Text className="mb-2 mt-2 text-sm font-medium text-surface-700">
              Role
            </Text>
            <View className="mb-4 flex-row gap-2">
              {ROLES.map((role) => (
                <Pressable
                  key={role.value}
                  onPress={() => setSelectedRole(role.value)}
                  className={`flex-1 items-center rounded-xl py-3 ${
                    selectedRole === role.value
                      ? 'bg-primary-600'
                      : 'bg-surface-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedRole === role.value
                        ? 'text-white'
                        : 'text-surface-700'
                    }`}
                  >
                    {role.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Controller
              control={memberControl}
              name="contribution"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Monthly Contribution (optional)"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  leftIcon={<Text className="text-base text-surface-400">₱</Text>}
                />
              )}
            />

            <View className="mb-8 mt-4">
              <Button
                title={editingMember ? 'Update Member' : 'Add Member'}
                onPress={handleMemberSubmit(onAddMember)}
                fullWidth
                size="lg"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
