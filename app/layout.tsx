import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/ui/navbar";
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ["latin"] });

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata = {
  title: "Tech Store",
  description: "Your one-stop shop for tech products",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const lang = cookieStore.get('lang')?.value || 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} className={lang === 'ar' ? arabicFont.variable : inter.variable}>
      <body className={`${lang === 'ar' ? arabicFont.className : inter.className} min-h-screen`}>
        <Providers>
          <div className={lang === 'ar' ? 'rtl' : 'ltr'}>
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
