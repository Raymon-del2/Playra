import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import { getActiveProfile } from "@/app/actions/profile";

const roboto = Roboto({ 
  weight: ["300", "400", "500", "700"], 
  subsets: ["latin"], 
  variable: "--font-roboto" 
});

const youtubeSans = localFont({
  src: [
    {
      path: '../fonts/youtube-sans-medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/youtube-sans-bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-youtube-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Playra",
  description: "The next era of video sharing for everyone",
  icons: {
    icon: "/playra.svg",
    shortcut: "/playra.svg",
    apple: "/playra.svg",
  },
  openGraph: {
    title: "Playra",
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
    title: "Playra",
    description: "The next era of video sharing for everyone",
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
        <link rel="icon" href="/playra.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/playra.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/playra.svg" />
      </head>
      <body className={`bg-white text-zinc-900 selection:bg-blue-500/30 ${roboto.variable} ${youtubeSans.variable} font-sans`} suppressHydrationWarning>
        <LayoutShell activeProfile={activeProfile}>{children}</LayoutShell>
      </body>
    </html>
  );
}
