import Image from "next/image";
import { VerificationForm } from "@/components/auth/verification-form";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { translations } from '@/lib/translations';

interface VerifyPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  const email = searchParams.email as string;
  const returnUrl = (searchParams.returnUrl as string) || '/';
  const fromCart = searchParams.fromCart === 'true';

  // If no email is provided, redirect to signup
  if (!email) {
    redirect('/signup');
  }

  // Get translation function
  const t = (key: string) => {
    const cookieStore = cookies();
    const lang = cookieStore.get('lang')?.value || 'en';
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        return key;
      }
    }
    return result;
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-orange-50 items-center justify-center">
        <Image
          src="/images/logo/logo-onepiece.png"
          alt="Authentication"
          width={600}
          height={800}
          className="object-cover h-full"
        />
      </div>

      {/* Right side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              {t('auth.verifyYourEmail')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.verificationCodeSent')} <span className="font-medium">{email}</span>
            </p>
          </div>

          <VerificationForm 
            email={email} 
            returnUrl={returnUrl} 
            fromCart={fromCart}
          />
        </div>
      </div>
    </div>
  );
} 