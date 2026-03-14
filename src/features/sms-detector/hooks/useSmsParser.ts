import { useState, useCallback } from 'react';
import { parseSMS, type ParsedSMS } from '../services/smsParser';
import { useTransactionStore } from '@/src/stores/transactionStore';

export function useSmsParser() {
  const [rawText, setRawText] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedSMS | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const { addTransaction } = useTransactionStore();

  const parse = useCallback(() => {
    setParseError(null);
    const result = parseSMS(rawText);
    if (result) {
      setParsedResult(result);
    } else {
      setParseError('Could not detect a transaction in this message. Try pasting a bank or e-wallet notification.');
      setParsedResult(null);
    }
  }, [rawText]);

  const updateParsed = useCallback((updates: Partial<ParsedSMS>) => {
    setParsedResult((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const saveTransaction = useCallback(() => {
    if (!parsedResult) return false;

    const newTransaction = {
      id: Date.now().toString(),
      user_id: '',
      account_id: '',
      category_id: null,
      type: parsedResult.type,
      amount: parsedResult.amount,
      currency: 'PHP',
      description: parsedResult.description,
      notes: parsedResult.bank
        ? `Detected from ${parsedResult.bank} SMS${parsedResult.referenceNo ? ` (Ref: ${parsedResult.referenceNo})` : ''}`
        : parsedResult.referenceNo
          ? `Ref: ${parsedResult.referenceNo}`
          : null,
      date: parsedResult.date,
      is_recurring: false,
      recurring_id: null,
      receipt_url: null,
      source: 'sms_scan' as const,
      transfer_to_account_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addTransaction(newTransaction);
    return true;
  }, [parsedResult, addTransaction]);

  const clear = useCallback(() => {
    setRawText('');
    setParsedResult(null);
    setParseError(null);
  }, []);

  return {
    rawText,
    setRawText,
    parsedResult,
    parseError,
    parse,
    updateParsed,
    saveTransaction,
    clear,
  };
}
