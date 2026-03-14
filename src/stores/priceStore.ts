import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKVStorage } from '../lib/storage';

export interface PriceItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  location: string;
  current_price: number;
  previous_price: number | null;
  currency: string;
  updated_at: string;
  created_at: string;
}

export interface PriceHistoryEntry {
  id: string;
  item_id: string;
  price: number;
  recorded_at: string;
}

interface PriceState {
  items: PriceItem[];
  history: PriceHistoryEntry[];
  addItem: (item: Omit<PriceItem, 'id' | 'previous_price' | 'created_at' | 'updated_at'>) => void;
  updatePrice: (itemId: string, newPrice: number) => void;
  removeItem: (itemId: string) => void;
  getItemHistory: (itemId: string) => PriceHistoryEntry[];
}

export const usePriceStore = create<PriceState>()(
  persist(
    (set, get) => ({
      items: [],
      history: [],
      addItem: (item) => {
        const newItem: PriceItem = {
          ...item,
          id: Date.now().toString(),
          previous_price: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const historyEntry: PriceHistoryEntry = {
          id: `${newItem.id}-${Date.now()}`,
          item_id: newItem.id,
          price: item.current_price,
          recorded_at: new Date().toISOString(),
        };
        set((state) => ({
          items: [newItem, ...state.items],
          history: [historyEntry, ...state.history],
        }));
      },
      updatePrice: (itemId, newPrice) => {
        const historyEntry: PriceHistoryEntry = {
          id: `${itemId}-${Date.now()}`,
          item_id: itemId,
          price: newPrice,
          recorded_at: new Date().toISOString(),
        };
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  previous_price: item.current_price,
                  current_price: newPrice,
                  updated_at: new Date().toISOString(),
                }
              : item
          ),
          history: [historyEntry, ...state.history],
        }));
      },
      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
          history: state.history.filter((h) => h.item_id !== itemId),
        })),
      getItemHistory: (itemId) => get().history.filter((h) => h.item_id === itemId),
    }),
    {
      name: 'price-store',
      storage: createJSONStorage(() => createMMKVStorage('price-storage')),
    }
  )
);
