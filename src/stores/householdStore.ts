import { create } from 'zustand';
import type { Household, HouseholdMember } from '../types/database';

interface HouseholdState {
  household: Household | null;
  members: HouseholdMember[];
  setHousehold: (household: Household | null) => void;
  setMembers: (members: HouseholdMember[]) => void;
  addMember: (member: HouseholdMember) => void;
  updateMember: (id: string, updates: Partial<HouseholdMember>) => void;
  removeMember: (id: string) => void;
  clearHousehold: () => void;
}

export const useHouseholdStore = create<HouseholdState>()((set) => ({
  household: null,
  members: [],
  setHousehold: (household) => set({ household }),
  setMembers: (members) => set({ members }),
  addMember: (member) =>
    set((state) => ({ members: [...state.members, member] })),
  updateMember: (id, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  removeMember: (id) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    })),
  clearHousehold: () => set({ household: null, members: [] }),
}));
