const skeletonCards = Array.from({ length: 12 });

export default function Loading() {
  return (
    <div className="p-6">
      <div className="h-8 w-40 bg-gray-800 rounded-lg mb-6 animate-pulse" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {skeletonCards.map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="w-full aspect-video bg-gray-800 rounded-lg animate-pulse" />
            <div className="flex gap-3">
              <div className="w-9 h-9 bg-gray-800 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-800 rounded w-11/12 animate-pulse" />
                <div className="h-4 bg-gray-800 rounded w-9/12 animate-pulse" />
                <div className="h-3 bg-gray-800 rounded w-6/12 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
