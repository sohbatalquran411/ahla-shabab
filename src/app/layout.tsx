import type { Metadata, Viewport } from "next";
import { Cairo, Reem_Kufi } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
});

const reemKufi = Reem_Kufi({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-reem-kufi",
});

import { createClient } from '@/utils/supabase/server';
import ServiceWorker from '@/components/ServiceWorker';

export async function generateMetadata(): Promise<Metadata> {
  let appName = "أحلى شباب";
  let appDesc = "منصة إدارة المشاريع الدعوية";
  let appLogo = "/icon.svg";

  try {
    const supabase = await createClient();
    const { data } = await supabase.from('app_settings').select('key, value');

    if (data) {
      const nameSetting = data.find(s => s.key === 'app_name');
      const descSetting = data.find(s => s.key === 'app_description');
      const logoSetting = data.find(s => s.key === 'app_logo');

      if (nameSetting?.value) appName = nameSetting.value;
      if (descSetting?.value) appDesc = descSetting.value;
      if (logoSetting?.value) appLogo = logoSetting.value;
    }
  } catch (error) {
    console.error("Error fetching metadata:", error);
  }

  return {
    title: appName,
    description: appDesc,
    keywords: ["تطوع", "شباب", "مشاريع", appName],
    authors: [{ name: appName }],
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: appName,
    },
    icons: {
      icon: appLogo,
      apple: appLogo,
      shortcut: appLogo,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${reemKufi.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}


