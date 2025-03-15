'use client';

import { useState, useEffect } from 'react';
import { translations } from '@/lib/translations';
import Cookies from 'js-cookie';

export function useTranslation() {
  // Default to 'en' for server-side rendering
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  
  // Update language from cookie on client-side only
  useEffect(() => {
    const cookieLang = (Cookies.get('lang') || 'en') as 'en' | 'ar';
    setLang(cookieLang);
  }, []);
  
  const t = (key: string) => {
    const keys = key.split('.');
    let value = translations[lang];
    
    for (const k of keys) {
      value = value?.[k];
      if (!value) return key;
    }
    
    return value as string;
  };

  return { t, lang };
} 