const skeletonCards = Array.from({ length: 12 });

export default function Loading() {
  return (
    <div className="p-0 sm:p-6 bg-gray-900 min-h-screen">
      <div className="h-8 w-40 bg-zinc-800/50 rounded-full mb-6 animate-pulse hidden sm:block" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-10 gap-x-4">
        {skeletonCards.map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="w-full aspect-video bg-zinc-800/80 sm:rounded-xl animate-pulse" />
            <div className="flex gap-3 px-3 sm:px-0">
              <div className="w-10 h-10 bg-zinc-800/80 rounded-full animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2 mt-1">
                <div className="h-4 bg-zinc-800/80 rounded w-11/12 animate-pulse" />
                <div className="h-3 bg-zinc-800/30 rounded w-9/12 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
