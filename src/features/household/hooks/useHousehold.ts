import { useMemo, useCallback } from 'react';
import { useHouseholdStore } from '@/src/stores/householdStore';
import type { Household, HouseholdMember } from '@/src/types/database';

export function useHousehold() {
  const { household, members, setHousehold, setMembers, addMember, updateMember, removeMember, clearHousehold } =
    useHouseholdStore();

  const totalContributions = useMemo(
    () => members.reduce((sum, m) => sum + (m.monthly_contribution ?? 0), 0),
    [members]
  );

  const memberCount = members.length;

  const ownerCount = useMemo(
    () => members.filter((m) => m.role === 'owner').length,
    [members]
  );

  const createHousehold = useCallback(
    (name: string) => {
      const newHousehold: Household = {
        id: Date.now().toString(),
        owner_id: '',
        name,
        created_at: new Date().toISOString(),
      };
      setHousehold(newHousehold);

      // Add owner as first member
      const ownerMember: HouseholdMember = {
        id: `${Date.now()}-owner`,
        household_id: newHousehold.id,
        user_id: null,
        name: 'Me',
        role: 'owner',
        monthly_contribution: null,
        created_at: new Date().toISOString(),
      };
      setMembers([ownerMember]);

      return newHousehold;
    },
    [setHousehold, setMembers]
  );

  const addNewMember = useCallback(
    (name: string, role: HouseholdMember['role'], contribution: number | null) => {
      if (!household) return null;

      const member: HouseholdMember = {
        id: Date.now().toString(),
        household_id: household.id,
        user_id: null,
        name,
        role,
        monthly_contribution: contribution,
        created_at: new Date().toISOString(),
      };
      addMember(member);
      return member;
    },
    [household, addMember]
  );

  const deleteHousehold = useCallback(() => {
    clearHousehold();
  }, [clearHousehold]);

  const canManageMembers = useCallback(
    (memberRole: HouseholdMember['role']): boolean => {
      return memberRole === 'owner' || memberRole === 'admin';
    },
    []
  );

  return {
    household,
    members,
    totalContributions,
    memberCount,
    ownerCount,
    createHousehold,
    addNewMember,
    updateMember,
    removeMember,
    deleteHousehold,
    canManageMembers,
  };
}
