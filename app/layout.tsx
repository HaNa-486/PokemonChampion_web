import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DevEnvironmentBanner } from "../components/DevEnvironmentBanner";
import { ThemePreferenceSync } from "../components/ThemeToggle";
import "./globals.css";

const preferenceBootScript = `(() => {
  try {
    const root = document.documentElement;
    const saved = localStorage.getItem("champions-lab-theme-v1");
    const theme = saved === "dark" || saved === "light"
      ? saved
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    const savedLocale = localStorage.getItem("champions-lab-locale-v1");
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
    const locale = savedLocale === "en" || savedLocale === "zh-Hant"
      ? savedLocale
      : (languages.some((language) => language.toLowerCase().startsWith("zh")) ? "zh-Hant" : "en");
    root.dataset.locale = locale;
    root.lang = locale;
    if (locale === "zh-Hant") root.dataset.localePending = "";
  } catch {}
})();`;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceBootScript }} />
      </head>
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
