import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: "Playra - Watch Videos",
  description: "A Playra-like video platform",
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
      </head>
      <body className="bg-gray-900 text-white selection:bg-red-500/30">
        <LayoutShell activeProfile={activeProfile}>{children}</LayoutShell>
      </body>
    </html>
  );
}

