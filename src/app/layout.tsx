import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { DM_Sans, Geist_Mono, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { getLocaleFromCookies, getDirection } from "@/lib/i18n";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const arabicFont = localFont({
  src: [
    { path: "../../public/OTF/TheYearofHandicrafts-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/OTF/TheYearofHandicrafts-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/OTF/TheYearofHandicrafts-SemiBold.otf", weight: "600", style: "normal" },
    { path: "../../public/OTF/TheYearofHandicrafts-Bold.otf", weight: "700", style: "normal" },
    { path: "../../public/OTF/TheYearofHandicrafts-Black.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "Wahb - Discover Audio & News",
  description: "Mobile-first social platform with audio-first MP4 Pods feed and magazine-style News feed",
  keywords: ["podcast", "news", "audio", "social media", "discovery"],
  authors: [{ name: "Wahb Team" }],
  icons: {
    icon: "/images/wahb_app_icon.png",
    apple: "/images/wahb_app_icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e63946",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Next.js 16: cookies() returns a Promise — must await before .toString().
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const locale = getLocaleFromCookies(cookieHeader);
  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${arabicFont.variable} ${dmSans.variable} ${playfair.variable} ${geistMono.variable} font-sans antialiased bg-black text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
