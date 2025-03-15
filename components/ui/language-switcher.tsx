'use client';

import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState<'en' | 'ar'>('en');
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLang = Cookies.get('lang') as 'en' | 'ar';
    if (savedLang) {
      setCurrentLang(savedLang);
    }
    setMounted(true);

    // Add click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleLanguage = (newLang: 'en' | 'ar') => {
    if (currentLang === newLang) return;
    
    Cookies.set('lang', newLang, { expires: 365 });
    setCurrentLang(newLang);
    
    // Update document direction
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    
    // Hard reload the page to apply changes
    window.location.reload();
  };

  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return <div className="w-5 h-5"></div>;
  }

  // Determine dropdown position based on language
  const dropdownPosition = currentLang === 'ar' ? 'left-0' : 'right-0';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-700 hover:text-black"
        aria-label="Switch language"
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium">{currentLang.toUpperCase()}</span>
      </button>
      
      {isOpen && (
        <div className={`absolute ${dropdownPosition} mt-2 w-32 bg-white rounded-md shadow-lg z-50`}>
          <div className="py-1">
            <button
              onClick={() => toggleLanguage('en')}
              className={`block px-4 py-2 text-sm w-full text-left hover:text-black ${
                currentLang === 'en' 
                  ? 'bg-gray-100 font-medium text-black' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              English
            </button>
            <button
              onClick={() => toggleLanguage('ar')}
              className={`block px-4 py-2 text-sm w-full text-left hover:text-black ${
                currentLang === 'ar' 
                  ? 'bg-gray-100 font-medium text-black' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              العربية
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 