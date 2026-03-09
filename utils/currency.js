import { defaultCurrency, supportedCurrencies } from '../constants/currencies';

export function normalizeCurrencyCode(code) {
  if (!code) return defaultCurrency;
  const upper = String(code).toUpperCase();
  return supportedCurrencies.includes(upper) ? upper : defaultCurrency;
}

export function formatCurrency(amount, currencyCode = defaultCurrency) {
  const safeCode = normalizeCurrencyCode(currencyCode);
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return `${safeCode} 0.00`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${safeCode} ${numericAmount.toFixed(2)}`;
  }
}
