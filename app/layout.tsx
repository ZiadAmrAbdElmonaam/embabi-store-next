import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from '@/components/layout/footer';
import { cookies } from 'next/headers';
import { Toaster } from "react-hot-toast";
import { OrganizationStructuredData } from "@/components/seo/structured-data";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";

const inter = Inter({ subsets: ["latin"] });

const arabicFont = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://embabi-store.com'),
  title: {
    template: '%s | Embabi Store',
    default: 'Oxgen Embabi Store - Your One-Stop Shop for All Your Needs',
  },
  description: 'Discover a wide range of products at Oxgen Embabi Store. From electronics to clothing, we offer quality items at competitive prices with fast delivery.',
  keywords: ['online store', 'e-commerce', 'electronics', 'clothing', 'accessories', 'Egypt', 'shopping'],
  authors: [{ name: 'Oxgen Embabi Store', url: 'https://embabi-store.com' }],
  creator: 'Oxgen Embabi Store',
  publisher: 'Oxgen Embabi Store',
  icons: {
    icon: '/app-icon.png',
    shortcut: '/app-icon.png',
    apple: '/app-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_EG',
    siteName: 'Embabi Store',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@embabistore',
  },
  verification: {
    google: 'your-google-verification-code', // Replace with your Google verification code
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get('lang')?.value || 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html 
      lang={lang} 
      dir={dir} 
      className={lang === 'ar' ? arabicFont.className : inter.className}
      suppressHydrationWarning
    >
      <body className={`${lang === 'ar' ? arabicFont.className : inter.className} min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <Providers>
          <PageViewTracker />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <Toaster position="bottom-right" />
          </div>
        </Providers>
        <OrganizationStructuredData />
        
        {/* Meta Pixel Code - set NEXT_PUBLIC_META_PIXEL_ID in .env to enable */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <>
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img 
                height="1" 
                width="1" 
                style={{display: 'none'}}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
        {/* End Meta Pixel Code */}
      </body>
    </html>
  );
}
