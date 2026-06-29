'use client';

export default function SkeletonLoading() {
  return (
    <div className="w-full p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 24 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3">
            {/* Thumbnail placeholder */}
            <div className="w-full aspect-video bg-[#f0f0f0] rounded-lg" />
            
            {/* Avatar and text section */}
            <div className="flex gap-3">
              {/* Circular avatar placeholder */}
              <div className="w-9 h-9 rounded-full bg-[#f0f0f0] flex-shrink-0" />
              
              {/* Text lines */}
              <div className="flex flex-col gap-2 flex-1">
                {/* Title line */}
                <div className="w-full h-4 bg-[#e0e0e0] rounded" />
                {/* Metadata line */}
                <div className="w-3/4 h-3 bg-[#e0e0e0] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
