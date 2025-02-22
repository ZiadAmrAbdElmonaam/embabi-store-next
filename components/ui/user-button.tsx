'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { User, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';

export function UserButton() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useTranslation();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100"
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-5 w-5 text-gray-600" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          {session ? (
            <>
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-sm text-gray-500">{session.user.email}</p>
              </div>
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-4 w-4" />
                {t('common.profile')}
              </Link>
              {session.user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  {t('common.adminDashboard')}
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t('common.signOut')}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              {t('common.signIn')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
} 