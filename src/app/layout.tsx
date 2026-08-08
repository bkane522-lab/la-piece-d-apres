import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand } from "@/config/brand";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s — ${brand.name}`,
  },
  description: brand.tagline,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: brand.logo.favicon,
    apple: brand.logo.appleTouchIcon,
  },
};

export const viewport: Viewport = {
  themeColor: brand.colors.terracotta,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
