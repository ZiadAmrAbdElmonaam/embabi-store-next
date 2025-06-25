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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-[1000px] mx-4 bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Image */}
          <div className="lg:w-1/2 relative bg-orange-50 min-h-[300px] lg:min-h-[600px]">
            <Image
              src="/logo-onepiece.png"
              alt="Verification Banner"
              fill
              className="object-contain p-8"
              priority
            />
          </div>

          {/* Right Side - Verification Form */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-sm mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('auth.verifyYourEmail')}</h1>
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
      </div>
    </div>
  );
} 