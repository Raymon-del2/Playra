import type { Metadata } from "next";
import { Anton } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import { getActiveProfile } from "@/app/actions/profile";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Playra - Next-Gen Video Discovery & Creation Platform",
  description: "Discover, create, and share amazing videos on Playra. Join a community of creators and viewers exploring the future of video content. Upload videos, engage with polls, quizzes, and more!",
  icons: {
    icon: [
      { url: "/icon-512x512.png", type: "image/png", sizes: "512x512" },
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
  openGraph: {
    title: "Playra - Next-Gen Video Discovery & Creation Platform",
    description: "Discover, create, and share amazing videos on Playra. Join a community of creators and viewers exploring the future of video content with polls, quizzes, and interactive posts!",
    url: "https://playra.vercel.app",
    siteName: "Playra",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Playra - Next-Gen Video Discovery Platform with Play Button",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Playra - Next-Gen Video Discovery & Creation Platform",
    description: "Discover, create, and share amazing videos on Playra. Join a community of creators and viewers exploring the future of video content.",
    images: ["/og-image.svg"],
  },
};

function isEmbedRoute(pathname: string): boolean {
  return pathname.startsWith('/embed/');
}

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
        <meta name="theme-color" content="#0f0f0f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Playra" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-512x512.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/icon-192x192.png" sizes="192x192" />
        <link rel="shortcut icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`bg-[#0f0f0f] text-white selection:bg-blue-500/30 ${anton.variable}`} suppressHydrationWarning>
        <LayoutShell activeProfile={activeProfile}>{children}</LayoutShell>
      </body>
    </html>
  );
}
