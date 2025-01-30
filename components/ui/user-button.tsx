'use client';

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export function UserButton() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  if (!session) return null;

  return (
    <div className="relative group">
      <button className="flex items-center gap-2">
        <User className="h-6 w-6" />
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block">
        <Link
          href="/profile"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          {t('common.profile')}
        </Link>
        <button
          onClick={() => signOut()}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          {t('common.signOut')}
        </button>
      </div>
    </div>
  );
} 