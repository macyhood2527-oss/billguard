import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultCurrency } from '../constants/currencies';
import { useAuth } from './AuthProvider';
import { getOrCreateProfileCurrency, updateProfileCurrency } from '../services/profileService';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const { session, isSupabaseConfigured } = useAuth();
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency);
  const [isLoadingCurrency, setIsLoadingCurrency] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCurrency() {
      if (!isSupabaseConfigured || !session?.user?.id) {
        if (active) setCurrencyCode(defaultCurrency);
        return;
      }

      try {
        setIsLoadingCurrency(true);
        const code = await getOrCreateProfileCurrency(session.user.id);
        if (active) setCurrencyCode(code);
      } catch {
        if (active) setCurrencyCode(defaultCurrency);
      } finally {
        if (active) setIsLoadingCurrency(false);
      }
    }

    loadCurrency();
    return () => {
      active = false;
    };
  }, [session?.user?.id, isSupabaseConfigured]);

  async function changeCurrency(nextCode) {
    if (!isSupabaseConfigured || !session?.user?.id) {
      setCurrencyCode(nextCode);
      return;
    }

    const saved = await updateProfileCurrency(session.user.id, nextCode);
    setCurrencyCode(saved);
  }

  const value = useMemo(
    () => ({
      currencyCode,
      isLoadingCurrency,
      changeCurrency,
    }),
    [currencyCode, isLoadingCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
