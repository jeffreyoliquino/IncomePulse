import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { Transaction } from '../../../types/database';

// Get or create a default account for the user
async function getOrCreateDefaultAccount(userId: string): Promise<string> {
  if (!isSupabaseConfigured) return '';

  // Check if default account exists
  const { data: existingAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'Default Account')
    .single();

  if (existingAccount) {
    return existingAccount.id;
  }

  // Create default account
  const { data: newAccount, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      name: 'Default Account',
      type: 'cash',
      balance: 0,
      currency: 'PHP',
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create default account:', error);
    return '';
  }

  return newAccount?.id ?? '';
}

// Fetch all transactions for the current user
export async function fetchTransactions(): Promise<Transaction[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }

  return (data ?? []).map((t) => ({
    ...t,
    account_id: t.account_id ?? '',
    category_id: t.category_id ?? null,
    recurring_id: t.recurring_id ?? null,
    receipt_url: t.receipt_url ?? null,
    transfer_to_account_id: t.transfer_to_account_id ?? null,
  }));
}

// Create a new transaction in Supabase
export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
): Promise<Transaction | null> {
  if (!isSupabaseConfigured) return null;

  // Ensure we have an account_id
  let accountId = transaction.account_id;
  if (!accountId && transaction.user_id) {
    accountId = await getOrCreateDefaultAccount(transaction.user_id);
  }

  // Remove id/created_at/updated_at if accidentally passed at runtime
  const { id: _id, created_at: _ca, updated_at: _ua, ...cleanTransaction } = transaction as any;

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...cleanTransaction,
      account_id: accountId,
    })
    .select()
    .single();

  if (error) {
    // Ignore duplicate key errors (23505) during sync
    if (error.code === '23505') return null;
    console.error('Failed to create transaction:', error);
    return null;
  }

  return data;
}

// Update an existing transaction
export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>
): Promise<Transaction | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('transactions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update transaction:', error);
    return null;
  }

  return data;
}

// Delete a transaction
export async function deleteTransaction(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase.from('transactions').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete transaction:', error);
    return false;
  }

  return true;
}

// Sync local transactions to Supabase (for offline-first approach)
export async function syncTransactionsToCloud(
  localTransactions: Transaction[],
  userId: string
): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  const accountId = await getOrCreateDefaultAccount(userId);
  if (!accountId) return;

  // Get existing remote transactions
  const remoteTransactions = await fetchTransactions();
  const remoteIds = new Set(remoteTransactions.map((t) => t.id));

  // Find transactions to upload (local but not remote)
  const toUpload = localTransactions.filter(
    (t) => t.user_id === userId && !remoteIds.has(t.id)
  );

  for (const transaction of toUpload) {
    await createTransaction({
      ...transaction,
      user_id: userId,
      account_id: accountId,
    });
  }
}
