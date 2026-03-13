import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { NowPlayingProvider } from "@/components/now-playing-provider";
import { GlobalNowPlayingBar } from "@/components/global-now-playing-bar";

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
  description: "Mobile-first social platform with audio-first For You feed and magazine-style News feed",
  keywords: ["podcast", "news", "audio", "social media", "discovery"],
  authors: [{ name: "Wahb Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#DAA428",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${arabicFont.variable} ${dmSans.variable} ${playfair.variable} font-sans antialiased bg-black text-foreground`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen max-w-md mx-auto border-x border-border relative bg-background shadow-2xl">
            <main className="flex-1">
              {children}
            </main>
          </div>
          <NowPlayingProvider />
          <GlobalNowPlayingBar />
        </Providers>
      </body>
    </html>
  );
}

