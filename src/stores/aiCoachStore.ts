import { create } from 'zustand';
import type { AIConversation, AIMessage } from '../types/database';

interface AICoachState {
  conversations: AIConversation[];
  activeConversation: AIConversation | null;
  messages: AIMessage[];
  setConversations: (conversations: AIConversation[]) => void;
  setActiveConversation: (conversation: AIConversation | null) => void;
  setMessages: (messages: AIMessage[]) => void;
  addConversation: (conversation: AIConversation) => void;
  addMessage: (message: AIMessage) => void;
  removeConversation: (id: string) => void;
  clearMessages: () => void;
}

export const useAICoachStore = create<AICoachState>()((set) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (conversation) =>
    set({ activeConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversation:
        state.activeConversation?.id === id ? null : state.activeConversation,
    })),
  clearMessages: () => set({ messages: [] }),
}));
