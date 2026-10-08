import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";

type LayoutProps = { children: React.ReactNode };

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#fbfbfa",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "IRIS — Personal Chief of Staff",
  description: "Intelligent Routine & Intent Scheduler — Calm, intentional, productive time management.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "IRIS — Personal Chief of Staff",
    description: "Intelligent Routine & Intent Scheduler — Calm, intentional, productive time management.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "IRIS Logo" }],
  },
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex bg-[#fbfbfa] text-stone-900 selection:bg-emerald-100 selection:text-emerald-900">
        <TooltipProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            <TopBar />
            <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto overflow-x-hidden">
              {children}
            </main>
            <MobileNav />
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
