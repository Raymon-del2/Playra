import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: "Playra - Watch Videos",
  description: "A Playra-like video platform",
  icons: {
    icon: [
      { url: "/Playra.png?v=4", type: "image/png", sizes: "512x512" },
      { url: "/Playra.png?v=4", type: "image/png", sizes: "192x192" },
      { url: "/Playra.png?v=4", type: "image/png", sizes: "64x64" },
      { url: "/Playra.png?v=4", type: "image/png", sizes: "32x32" },
      { url: "/Playra.png?v=4", type: "image/png", sizes: "16x16" },
    ],
    shortcut: "/Playra.png?v=4",
    apple: "/Playra.png?v=4",
  },
};


import { getActiveProfile } from "@/app/actions/profile";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeProfile = await getActiveProfile();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Playra" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/Playra.png?v=4" sizes="512x512" />
        <link rel="icon" type="image/png" href="/Playra.png?v=4" sizes="192x192" />
        <link rel="icon" type="image/png" href="/Playra.png?v=4" sizes="64x64" />
        <link rel="icon" type="image/png" href="/Playra.png?v=4" sizes="32x32" />
        <link rel="icon" type="image/png" href="/Playra.png?v=4" sizes="16x16" />
        <link rel="shortcut icon" href="/Playra.png?v=4" />
        <link rel="apple-touch-icon" href="/Playra.png?v=4" />
      </head>
      <body className="bg-gray-900 text-white selection:bg-red-500/30">
        <LayoutShell activeProfile={activeProfile}>{children}</LayoutShell>
      </body>
    </html>
  );
}

