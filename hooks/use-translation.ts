'use client';

import { translations } from '@/lib/translations';
import Cookies from 'js-cookie';

export function useTranslation() {
  const lang = (Cookies.get('lang') || 'en') as 'en' | 'ar';
  
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