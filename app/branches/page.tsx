import { MapPin, Clock, Phone } from 'lucide-react';
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";

// You can move this to a separate data file or fetch from an API
const branches = [
  // {
  //   id: 1,
  //   name: 'Main Store',
  //   address: '123 Main Street, Downtown',
  //   city: 'Cairo',
  //   phone: '+20 123 456 7890',
  //   hours: 'Mon-Sat: 10:00 AM - 10:00 PM',
  //   mapUrl: 'https://www.google.com/maps/embed?pb=...', // Add your Google Maps embed URL
  //   image: '/images/branches/main-store.jpg'
  // },
  {
    id: 1,
    name: 'Embabi Store',
    address: 'Nagati Serag, Al Manteqah Ath Thamenah, Nasr City, Cairo Governorate 4441553',
    city: 'Cairo',
    phone: '+20 109 020 2577',
    hours: 'Mon-Sun: 10:00 AM - 11:00 PM',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d887.0603714069835!2d31.348438600000003!3d30.050434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583fdf6dbf2d0d%3A0x6b9fd9dd440580d2!2sOxygen%20Os%20Store!5e0!3m2!1sen!2seg!4v1716304000000!5m2!1sen!2seg',
    image: '/images/branches/mall-branch.jpg'
  },
  // Add more branches as needed
];

export default function BranchesPage() {
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('branches.title')}</h1>
          <p className="text-lg text-gray-600">
            {t('branches.description')}
          </p>
        </div>

        <div className="grid gap-8">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Map Section */}
                <div className="relative h-[300px] md:h-full min-h-[300px]">
                  <iframe
                    src={branch.mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                  />
                </div>

                {/* Branch Information */}
                <div className="p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {branch.name}
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-orange-600 mt-1" />
                      <div>
                        <h3 className="font-medium">{t('branches.address')}</h3>
                        <p className="text-gray-600">{branch.address}</p>
                        <p className="text-gray-600">{branch.city}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-orange-600 mt-1" />
                      <div>
                        <h3 className="font-medium">{t('branches.workingHours')}</h3>
                        <p className="text-gray-600">{branch.hours}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-orange-600 mt-1" />
                      <div>
                        <h3 className="font-medium">{t('branches.phone')}</h3>
                        <p className="text-gray-600">{branch.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Get Directions Button */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      `${branch.address}, ${branch.city}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors w-full md:w-auto"
                  >
                    <MapPin className="h-5 w-5" />
                    {t('branches.getDirections')}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 