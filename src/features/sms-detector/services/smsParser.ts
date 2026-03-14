import type { TransactionType } from '@/src/types/database';

export interface ParsedSMS {
  amount: number;
  description: string;
  type: TransactionType;
  merchant: string | null;
  bank: string | null;
  referenceNo: string | null;
  date: string;
}

interface SMSPattern {
  bank: string;
  patterns: {
    regex: RegExp;
    type: TransactionType;
    extract: (match: RegExpMatchArray) => Partial<ParsedSMS>;
  }[];
}

const SMS_PATTERNS: SMSPattern[] = [
  // GCash
  {
    bank: 'GCash',
    patterns: [
      {
        regex: /You (?:have )?received (?:PHP|P)\s?([\d,]+\.?\d*)\s*from\s+(.+?)(?:\.|Ref)/i,
        type: 'income',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          merchant: m[2]?.trim() ?? null,
          description: `Received from ${m[2]?.trim() ?? 'GCash'}`,
        }),
      },
      {
        regex: /You (?:have )?(?:paid|sent) (?:PHP|P)\s?([\d,]+\.?\d*)\s*to\s+(.+?)(?:\.|Ref)/i,
        type: 'expense',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          merchant: m[2]?.trim() ?? null,
          description: `Paid to ${m[2]?.trim() ?? 'GCash'}`,
        }),
      },
      {
        regex: /(?:Cash[\s-]?In|loaded)\s*(?:of\s*)?(?:PHP|P)\s?([\d,]+\.?\d*)/i,
        type: 'income',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'GCash Cash In',
        }),
      },
    ],
  },
  // Maya / PayMaya
  {
    bank: 'Maya',
    patterns: [
      {
        regex: /(?:Maya|PayMaya).*(?:received|credited)\s*(?:PHP|P)\s?([\d,]+\.?\d*)\s*(?:from\s+(.+?))?(?:\.|Ref)/i,
        type: 'income',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          merchant: m[2]?.trim() ?? null,
          description: `Maya received${m[2] ? ` from ${m[2].trim()}` : ''}`,
        }),
      },
      {
        regex: /(?:Maya|PayMaya).*(?:sent|paid|debited)\s*(?:PHP|P)\s?([\d,]+\.?\d*)\s*(?:to\s+(.+?))?(?:\.|Ref)/i,
        type: 'expense',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          merchant: m[2]?.trim() ?? null,
          description: `Maya payment${m[2] ? ` to ${m[2].trim()}` : ''}`,
        }),
      },
    ],
  },
  // BDO
  {
    bank: 'BDO',
    patterns: [
      {
        regex: /BDO.*(?:acct|account).*(?:debited|debit)\s*(?:PHP|P)\s?([\d,]+\.?\d*)/i,
        type: 'expense',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'BDO account debit',
        }),
      },
      {
        regex: /BDO.*(?:acct|account).*(?:credited|credit)\s*(?:PHP|P)\s?([\d,]+\.?\d*)/i,
        type: 'income',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'BDO account credit',
        }),
      },
      {
        regex: /BDO.*(?:PHP|P)\s?([\d,]+\.?\d*).*(?:purchase|POS|withdrawal)/i,
        type: 'expense',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'BDO purchase/withdrawal',
        }),
      },
    ],
  },
  // BPI
  {
    bank: 'BPI',
    patterns: [
      {
        regex: /BPI.*(?:PHP|P)\s?([\d,]+\.?\d*).*(?:debited|debit|withdrawn)/i,
        type: 'expense',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'BPI account debit',
        }),
      },
      {
        regex: /BPI.*(?:PHP|P)\s?([\d,]+\.?\d*).*(?:credited|credit|deposited)/i,
        type: 'income',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'BPI account credit',
        }),
      },
    ],
  },
  // UnionBank
  {
    bank: 'UnionBank',
    patterns: [
      {
        regex: /UnionBank.*(?:Debit|debited).*(?:PHP|P)\s?([\d,]+\.?\d*)/i,
        type: 'expense',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'UnionBank debit',
        }),
      },
      {
        regex: /UnionBank.*(?:Credit|credited).*(?:PHP|P)\s?([\d,]+\.?\d*)/i,
        type: 'income',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'UnionBank credit',
        }),
      },
    ],
  },
  // Metrobank
  {
    bank: 'Metrobank',
    patterns: [
      {
        regex: /Metrobank.*(?:PHP|P)\s?([\d,]+\.?\d*).*(?:debited|debit|purchase)/i,
        type: 'expense',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'Metrobank debit',
        }),
      },
      {
        regex: /Metrobank.*(?:PHP|P)\s?([\d,]+\.?\d*).*(?:credited|credit)/i,
        type: 'income',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'Metrobank credit',
        }),
      },
    ],
  },
  // RCBC
  {
    bank: 'RCBC',
    patterns: [
      {
        regex: /RCBC.*(?:PHP|P)\s?([\d,]+\.?\d*).*(?:debited|debit|charged)/i,
        type: 'expense',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'RCBC debit',
        }),
      },
      {
        regex: /RCBC.*(?:PHP|P)\s?([\d,]+\.?\d*).*(?:credited|credit)/i,
        type: 'income',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'RCBC credit',
        }),
      },
    ],
  },
  // Landbank
  {
    bank: 'Landbank',
    patterns: [
      {
        regex: /(?:Landbank|LBP).*(?:PHP|P)\s?([\d,]+\.?\d*).*(?:debited|debit|withdrawn)/i,
        type: 'expense',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'Landbank debit',
        }),
      },
      {
        regex: /(?:Landbank|LBP).*(?:PHP|P)\s?([\d,]+\.?\d*).*(?:credited|credit|deposited)/i,
        type: 'income',
        extract: (m) => ({
          amount: parseAmount(m[1]),
          description: 'Landbank credit',
        }),
      },
    ],
  },
];

// Generic fallback pattern
const GENERIC_PATTERNS = [
  {
    regex: /(?:debited|debit|charged|paid|sent|purchase|withdrawal|withdrawn)\s*(?:of\s*)?(?:PHP|P)\s?([\d,]+\.?\d*)/i,
    type: 'expense' as TransactionType,
    description: 'Debit transaction',
  },
  {
    regex: /(?:credited|credit|received|deposited)\s*(?:of\s*)?(?:PHP|P)\s?([\d,]+\.?\d*)/i,
    type: 'income' as TransactionType,
    description: 'Credit transaction',
  },
  {
    regex: /(?:PHP|P)\s?([\d,]+\.?\d*).*(?:debited|debit|charged|paid|purchase)/i,
    type: 'expense' as TransactionType,
    description: 'Debit transaction',
  },
  {
    regex: /(?:PHP|P)\s?([\d,]+\.?\d*).*(?:credited|credit|received|deposited)/i,
    type: 'income' as TransactionType,
    description: 'Credit transaction',
  },
];

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, ''));
}

function extractRefNo(text: string): string | null {
  const refMatch = text.match(/(?:Ref\.?\s*(?:No\.?)?\s*:?\s*|Reference:?\s*)(\w+)/i);
  return refMatch ? refMatch[1] : null;
}

export function parseSMS(text: string): ParsedSMS | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const today = new Date().toISOString().split('T')[0];

  // Try bank-specific patterns first
  for (const bankPattern of SMS_PATTERNS) {
    for (const pattern of bankPattern.patterns) {
      const match = trimmed.match(pattern.regex);
      if (match) {
        const extracted = pattern.extract(match);
        return {
          amount: extracted.amount ?? 0,
          description: extracted.description ?? `${bankPattern.bank} transaction`,
          type: pattern.type,
          merchant: extracted.merchant ?? null,
          bank: bankPattern.bank,
          referenceNo: extractRefNo(trimmed),
          date: today,
        };
      }
    }
  }

  // Try generic fallback patterns
  for (const pattern of GENERIC_PATTERNS) {
    const match = trimmed.match(pattern.regex);
    if (match) {
      return {
        amount: parseAmount(match[1]),
        description: pattern.description,
        type: pattern.type,
        merchant: null,
        bank: null,
        referenceNo: extractRefNo(trimmed),
        date: today,
      };
    }
  }

  // Last resort: try to find any PHP amount
  const amountMatch = trimmed.match(/(?:PHP|P)\s?([\d,]+\.?\d*)/i);
  if (amountMatch) {
    const isDebit = /debit|paid|sent|charge|purchase|withdraw/i.test(trimmed);
    return {
      amount: parseAmount(amountMatch[1]),
      description: 'Transaction detected from SMS',
      type: isDebit ? 'expense' : 'income',
      merchant: null,
      bank: null,
      referenceNo: extractRefNo(trimmed),
      date: today,
    };
  }

  return null;
}
