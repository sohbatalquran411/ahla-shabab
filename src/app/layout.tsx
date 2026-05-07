import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨",
  description: "Ù…Ù†ØµØ© Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨ Ù„Ù„ØªÙ‚ÙŠÙŠÙ… ÙˆØ§Ù„Ù…ØªØ§Ø¨Ø¹Ø© - Ø§Ù„Ù…Ø¯Ø±Ø³Ø© Ø§Ù„Ø¥ÙŠÙ…Ø§Ù†ÙŠØ©",
  keywords: ["Ø£Ø°ÙƒØ§Ø±", "ØªÙ‚ÙŠÙŠÙ…", "Ù…ØªØ§Ø¨Ø¹Ø©", "Ù…Ø¯Ø±Ø³Ø© Ø¥ÙŠÙ…Ø§Ù†ÙŠØ©"],
  authors: [{ name: "Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

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
    <html lang="ar" dir="rtl" className={`${cairo.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}