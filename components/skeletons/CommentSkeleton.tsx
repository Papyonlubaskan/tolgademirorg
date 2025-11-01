export default function CommentSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-flat">
          <div className="flex items-start gap-3">
            {/* Avatar skeleton */}
            <div className="skeleton w-10 h-10 rounded-full flex-shrink-0"></div>
            
            <div className="flex-1">
              {/* Name skeleton */}
              <div className="skeleton h-4 w-32 mb-2 rounded"></div>
              
              {/* Comment text skeleton */}
              <div className="skeleton h-4 w-full mb-2 rounded"></div>
              <div className="skeleton h-4 w-4/5 mb-2 rounded"></div>
              
              {/* Date skeleton */}
              <div className="skeleton h-3 w-24 mt-3 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
