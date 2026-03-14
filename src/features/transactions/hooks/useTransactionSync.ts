import { useEffect, useCallback, useState } from 'react';
import { useTransactionStore } from '../../../stores/transactionStore';
import { useAuth } from '../../auth/hooks/useAuth';
import { isSupabaseConfigured } from '../../../lib/supabase';
import * as transactionService from '../services/transactionService';
import type { Transaction } from '../../../types/database';

export function useTransactionSync() {
  const { user, isAuthenticated } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    transactions,
    setTransactions,
    addTransaction: addToStore,
    updateTransaction: updateInStore,
    removeTransaction: removeFromStore,
    setCurrentUserId,
  } = useTransactionStore();

  // Load transactions from Supabase when user logs in
  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthenticated || !user?.id) {
      return;
    }

    setCurrentUserId(user.id);

    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const remoteTransactions = await transactionService.fetchTransactions();
        // Always set remote transactions as the source of truth
        setTransactions(remoteTransactions);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [isAuthenticated, user?.id]);

  // Add transaction (local + cloud)
  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
      const userId = user?.id ?? '';

      // Try to sync to cloud first if configured
      if (isSupabaseConfigured && userId) {
        try {
          const cloudTransaction = await transactionService.createTransaction({
            ...transaction,
            user_id: userId,
          });

          if (cloudTransaction) {
            addToStore(cloudTransaction);
            return;
          }
        } catch (error) {
          console.warn('Cloud save failed (offline?), saving locally:', error);
        }
      }

      // Fallback to local-only if cloud fails or offline
      const localTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addToStore(localTransaction);
    },
    [user?.id, addToStore]
  );

  // Update transaction (local + cloud)
  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      // Update local store immediately
      updateInStore(id, updates);

      // Sync to cloud (silently fail if offline)
      if (isSupabaseConfigured) {
        try {
          await transactionService.updateTransaction(id, updates);
        } catch (error) {
          console.warn('Cloud update failed (offline?):', error);
        }
      }
    },
    [updateInStore]
  );

  // Delete transaction (local + cloud)
  const deleteTransaction = useCallback(
    async (id: string) => {
      // Remove from local store immediately
      removeFromStore(id);

      // Sync to cloud (silently fail if offline)
      if (isSupabaseConfigured) {
        try {
          await transactionService.deleteTransaction(id);
        } catch (error) {
          console.warn('Cloud delete failed (offline?):', error);
        }
      }
    },
    [removeFromStore]
  );

  // Upload all local transactions to cloud
  const syncLocalToCloud = useCallback(async () => {
    if (!isSupabaseConfigured || !user?.id) return;

    setIsSyncing(true);
    try {
      // Get remote transaction IDs to avoid duplicates
      const remoteTransactions = await transactionService.fetchTransactions();
      const remoteIds = new Set(remoteTransactions.map((t) => t.id));

      // Get local transactions that are not yet in cloud
      const localOnly = transactions.filter(
        (t) => (t.user_id === user.id || t.user_id === '') && !remoteIds.has(t.id)
      );

      for (const transaction of localOnly) {
        await transactionService.createTransaction({
          ...transaction,
          user_id: user.id,
        });
      }

      // Refresh from cloud to get the synced data
      const refreshed = await transactionService.fetchTransactions();
      setTransactions(refreshed);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [transactions, user?.id, setTransactions]);

  // Refresh from cloud
  const refreshFromCloud = useCallback(async () => {
    if (!isSupabaseConfigured || !user?.id) return;

    setIsLoading(true);
    try {
      const remoteTransactions = await transactionService.fetchTransactions();
      setTransactions(remoteTransactions);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, setTransactions]);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    syncLocalToCloud,
    refreshFromCloud,
    isSyncing,
    isLoading,
  };
}
