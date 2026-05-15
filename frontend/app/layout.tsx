import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata: Metadata = {
  title: "Axis — The Life RPG",
  description: "Tu sistema operativo personal gamificado. Convierte tus hábitos en stats de RPG.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Axis",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Axis: The Life RPG",
    description: "Convierte tus hábitos en stats de RPG",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7c3aed",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5145705039498306"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
