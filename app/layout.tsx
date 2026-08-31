import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DevEnvironmentBanner } from "../components/DevEnvironmentBanner";
import { ThemePreferenceSync } from "../components/ThemeToggle";
import "./globals.css";

const themeBootScript = `(() => {
  try {
    const saved = localStorage.getItem("champions-lab-theme-v1");
    const theme = saved === "dark" || saved === "light"
      ? saved
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
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
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
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
