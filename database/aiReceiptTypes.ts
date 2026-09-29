export interface AIReceiptDraft {
  title: string;
  amount: number | null;
  currency: string;
  date: string;
  category: 'food' | 'stay' | 'transport' | 'other';
  paymentMethod: 'cash' | 'transfer' | 'card';
}

export interface AIReceiptImport extends AIReceiptDraft {
  id: string;
  receiptImage?: string;
}

/** Unknown amounts and foreign currency must be reviewed, never converted silently. */
export function normalizeAIReceipt(value: unknown): AIReceiptDraft {
  const receipt = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const currency = typeof receipt.currency === 'string' ? receipt.currency.trim().toUpperCase().slice(0, 12) : '';
  const amount = typeof receipt.totalAmount === 'number' && Number.isSafeInteger(receipt.totalAmount)
    && receipt.totalAmount > 0 && receipt.totalAmount <= 1_000_000_000 && currency === 'VND'
    ? receipt.totalAmount : null;
  const date = typeof receipt.date === 'string' ? receipt.date : '';
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00Z`) : null;
  return {
    title: typeof receipt.store === 'string' ? receipt.store.trim().slice(0, 100) : '',
    amount, currency,
    date: parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date ? date : '',
    category: ['food', 'stay', 'transport'].includes(String(receipt.category)) ? receipt.category as AIReceiptDraft['category'] : 'other',
    paymentMethod: ['transfer', 'card'].includes(String(receipt.paymentMethod)) ? receipt.paymentMethod as AIReceiptDraft['paymentMethod'] : 'cash',
  };
}
