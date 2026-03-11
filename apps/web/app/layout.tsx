import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/app/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "HubFutebol",
  description: "MVP mobile-first para microcampeonatos de pelada",
  applicationName: "HubFutebol",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HubFutebol"
  }
};

export const viewport: Viewport = {
  themeColor: "#2c7a4b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

