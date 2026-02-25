import { createContext, useContext, useState, useCallback } from 'react';
import type { Lang } from '../lib/i18n';
import { t as translate, getLangFromStorage, setLangToStorage } from '../lib/i18n';

interface LangContextValue {
  lang: Lang;
  toggle: () => void;
  t: (key: Parameters<typeof translate>[0]) => string;
}

const LangContext = createContext<LangContextValue>(null!);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(getLangFromStorage);

  const toggle = useCallback(() => {
    setLang(prev => {
      const next = prev === 'ko' ? 'en' : 'ko';
      setLangToStorage(next);
      return next;
    });
  }, []);

  const t = useCallback((key: Parameters<typeof translate>[0]) => translate(key, lang), [lang]);

  return (
    <LangContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
