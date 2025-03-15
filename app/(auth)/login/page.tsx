import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";

export default function LoginPage() {
  // Get language from cookies for server component
  const cookieStore = cookies();
  const lang = (cookieStore.get('lang')?.value || 'en') as 'en' | 'ar';
  const t = (key: string) => {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      if (result[k] === undefined) return key;
      result = result[k];
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
              alt="Login Banner"
              fill
              className="object-contain p-8"
              priority
            />
          </div>

          {/* Right Side - Login Form */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-sm mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('auth.welcomeBack')}</h1>
                <p className="mt-2 text-sm text-gray-600">{t('auth.pleaseSignIn')}</p>
              </div>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 