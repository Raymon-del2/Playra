export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen bg-black m-0 p-0 overflow-hidden">
      {children}
    </div>
  );
}
