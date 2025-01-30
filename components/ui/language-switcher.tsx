'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import Cookies from 'js-cookie';

export function LanguageSwitcher() {
  const currentLang = Cookies.get('lang') || 'en';

  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    Cookies.set('lang', newLang);
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100"
      title={currentLang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      <Globe className="h-5 w-5" />
      <span>{currentLang === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
} 