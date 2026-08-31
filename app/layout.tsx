import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DevEnvironmentBanner } from "../components/DevEnvironmentBanner";
import { ThemePreferenceSync } from "../components/ThemeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Champions Lab",
  description: "Pokémon Champions battle intelligence and team building.",
  openGraph: {
    title: "Champions Lab — Pokémon Champions Team Builder",
    description: "Build clearly. Battle intelligently.",
    type: "website",
    images: [{ url: "/og.png", width: 1733, height: 910, alt: "Champions Lab battle intelligence dashboard" }],
  },
  twitter: { card: "summary_large_image", title: "Champions Lab", description: "Build clearly. Battle intelligently.", images: ["/og.png"] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemePreferenceSync />
        <DevEnvironmentBanner />
        {children}
      </body>
    </html>
  );
}
