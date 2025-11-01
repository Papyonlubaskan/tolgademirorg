export default function ChapterSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-flat">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Chapter title skeleton */}
              <div className="skeleton h-5 w-2/3 mb-2 rounded"></div>
              
              {/* Chapter meta skeleton */}
              <div className="flex items-center gap-3">
                <div className="skeleton h-3 w-20 rounded"></div>
                <div className="skeleton h-3 w-20 rounded"></div>
              </div>
            </div>
            
            {/* Icon skeleton */}
            <div className="skeleton w-8 h-8 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
