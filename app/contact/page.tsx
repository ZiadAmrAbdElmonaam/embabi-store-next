import { ContactForm } from "@/components/contact/contact-form";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";

export default function ContactPage() {
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('contact.title')}</h1>
          <p className="text-lg text-gray-600">
            {t('contact.description')}
          </p>
        </div>
        <ContactForm />
      </div>
    </div>
  );
} 