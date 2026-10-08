import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DatabaseKeepAlive } from "@/components/DatabaseKeepAlive";

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const playfair = localFont({
  src: "./fonts/playfair-display-latin.woff2",
  variable: "--font-playfair",
  weight: "400 700",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  preload: false,
});

export const metadata: Metadata = {
  title: "Avirat Jewelers",
  description: "Exquisite handcrafted jewelry for those who know exactly what they're looking at",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DatabaseKeepAlive />
        <Header />
        <main className="flex-1 animate-fade-in">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
