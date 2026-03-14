import type { Transaction, Category } from '@/src/types/database';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function generateTransactionCSV(
  transactions: Transaction[],
  categories: Category[]
): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const header = ['Date', 'Description', 'Type', 'Category', 'Amount', 'Currency', 'Source', 'Notes'];
  const rows = transactions.map((t) => [
    formatDate(t.date),
    escapeCSV(t.description ?? ''),
    t.type,
    escapeCSV(categoryMap.get(t.category_id ?? '') ?? 'Uncategorized'),
    t.type === 'income' ? `+${t.amount.toFixed(2)}` : `-${t.amount.toFixed(2)}`,
    t.currency,
    t.source,
    escapeCSV(t.notes ?? ''),
  ]);

  const csvLines = [header.join(','), ...rows.map((row) => row.join(','))];
  return csvLines.join('\n');
}

export function getExportFilename(range: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  return `incomepulse-${range}-${dateStr}.csv`;
}
