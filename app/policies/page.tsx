import { TranslatedContent } from '@/components/ui/translated-content';
import { useTranslation } from '@/hooks/use-translation';
import { cookies } from 'next/headers';
import { translations } from '@/lib/translations';

// Function to get translations on server side
function t(key: string) {
  const cookieStore = cookies();
  const lang = cookieStore.get('lang')?.value || 'en';
  
  const keys = key.split('.');
  let translation: any = translations[lang as 'en' | 'ar'];
  
  for (const k of keys) {
    if (translation && translation[k]) {
      translation = translation[k];
    } else {
      return key;
    }
  }
  
  return translation;
}

export default async function PoliciesPage() {
  const cookieStore = cookies();
  const lang = cookieStore.get('lang')?.value || 'en';
  const isRtl = lang === 'ar';

  return (
    <div className={`min-h-screen bg-gray-50 py-8 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className={`text-3xl font-bold text-gray-900 mb-8 ${isRtl ? 'text-right' : 'text-left'}`}>
            <TranslatedContent translationKey="policies.title" />
          </h1>

          {/* Privacy Policy */}
          <section className="mb-12">
            <h2 className={`text-2xl font-semibold text-gray-800 mb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
              <TranslatedContent translationKey="policies.privacy.title" />
            </h2>
            <div className={`text-gray-700 leading-relaxed space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
              <p>
                <TranslatedContent translationKey="policies.privacy.content1" />
              </p>
              <p>
                <TranslatedContent translationKey="policies.privacy.content2" />
              </p>
              <p>
                <TranslatedContent translationKey="policies.privacy.content3" />
              </p>
              <p>
                <TranslatedContent translationKey="policies.privacy.content4" />
              </p>
            </div>
          </section>

          {/* Shipping Policy */}
          <section className="mb-12">
            <h2 className={`text-2xl font-semibold text-gray-800 mb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
              <TranslatedContent translationKey="policies.shipping.title" />
            </h2>
            <div className={`text-gray-700 leading-relaxed space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
              <p>
                <TranslatedContent translationKey="policies.shipping.content1" />
              </p>
              <p>
                <TranslatedContent translationKey="policies.shipping.content2" />
              </p>
              <p>
                <TranslatedContent translationKey="policies.shipping.content3" />
              </p>
            </div>
          </section>

          {/* Refund and Exchange Policy */}
          <section className="mb-12">
            <h2 className={`text-2xl font-semibold text-gray-800 mb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
              <TranslatedContent translationKey="policies.refund.title" />
            </h2>
            <div className={`text-gray-700 leading-relaxed space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
              <p>
                <TranslatedContent translationKey="policies.refund.content1" />
              </p>
              <p>
                <TranslatedContent translationKey="policies.refund.content2" />
              </p>
              <p>
                <TranslatedContent translationKey="policies.refund.content3" />
              </p>
              <p>
                <TranslatedContent translationKey="policies.refund.content4" />
              </p>
              <p>
                <TranslatedContent translationKey="policies.refund.content5" />
              </p>
              <p>
                <TranslatedContent translationKey="policies.refund.content6" />
              </p>
            </div>
          </section>

          {/* Warranty Notice */}
          <section className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-r-lg">
            <div className={`text-orange-800 font-semibold text-lg ${isRtl ? 'text-right' : 'text-left'}`}>
              <TranslatedContent translationKey="policies.warranty.notice" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const cookieStore = cookies();
  const lang = cookieStore.get('lang')?.value || 'en';
  
  return {
    title: lang === 'ar' ? 'السياسات - متجر إمبابي' : 'Policies - Embabi Store',
    description: lang === 'ar' 
      ? 'سياسة الخصوصية وسياسة الشحن وسياسة الاستبدال والاسترجاع'
      : 'Privacy policy, shipping policy, and refund & exchange policy',
  };
}