export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="bg-black text-white m-0 p-0 overflow-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
