'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation effect
  useEffect(() => {
    setIsVisible(true);
    
    // Add event listener for escape key
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };
  
  const handleLogin = () => {
    router.push('/login?returnUrl=/reviews');
  };
  
  const handleSignup = () => {
    router.push('/signup?returnUrl=/reviews');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
      >
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-auto overflow-hidden transition-transform duration-300 transform">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {t('reviews.loginRequired')}
            </h3>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6">
            <p className="text-gray-600 mb-6">
              {t('reviews.loginToLeaveReview')}
            </p>
            
            <div className="flex flex-col space-y-4">
              <button
                onClick={handleLogin}
                className="w-full py-3 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                {t('auth.signIn')}
              </button>
              
              <button
                onClick={handleSignup}
                className="w-full py-3 bg-white text-orange-600 font-medium rounded-md border border-orange-600 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                {t('auth.signUp')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 