import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from '@/components/layout/footer';
import { cookies } from 'next/headers';
import { Toaster } from "react-hot-toast";
import { OrganizationStructuredData } from "@/components/seo/structured-data";

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
    default: 'Embabi Store - Your One-Stop Shop for All Your Needs',
  },
  description: 'Discover a wide range of products at Embabi Store. From electronics to clothing, we offer quality items at competitive prices with fast delivery.',
  keywords: ['online store', 'e-commerce', 'electronics', 'clothing', 'accessories', 'Egypt', 'shopping'],
  authors: [{ name: 'Embabi Store', url: 'https://embabi-store.com' }],
  creator: 'Embabi Store',
  publisher: 'Embabi Store',
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
      </body>
    </html>
  );
}
