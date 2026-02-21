
import { CurrencyInfo } from "../types.ts";

// Base currency is EUR. All rates are relative to EUR.
// In a real application, these rates would be fetched from a live exchange rate API.
export const CURRENCY_MAP: { [key: string]: Omit<CurrencyInfo, 'code'> } = {
  'EUR': { symbol: '€', rate: 1 },
  'USD': { symbol: '$', rate: 1.08 },
  'GBP': { symbol: '£', rate: 0.85 },
  'JPY': { symbol: '¥', rate: 170 },
  'SAR': { symbol: 'ر.س', rate: 4.05 },
  'AED': { symbol: 'د.إ', rate: 3.96 },
  'BRL': { symbol: 'R$', rate: 5.5 },
  'CNY': { symbol: '¥', rate: 7.8 },
  'RUB': { symbol: '₽', rate: 98 },
  'CAD': { symbol: '$', rate: 1.48 },
  'AUD': { symbol: '$', rate: 1.65 },
  'INR': { symbol: '₹', rate: 90 },
};

export const DEFAULT_CURRENCY_INFO: CurrencyInfo = {
    code: 'SAR',
    ...CURRENCY_MAP['SAR']
};
