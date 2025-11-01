export default function BookSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-flat">
          {/* Image skeleton */}
          <div className="skeleton h-64 w-full mb-4 rounded-lg"></div>
          
          {/* Title skeleton */}
          <div className="skeleton h-6 w-3/4 mb-3 rounded"></div>
          
          {/* Description skeleton */}
          <div className="skeleton h-4 w-full mb-2 rounded"></div>
          <div className="skeleton h-4 w-5/6 mb-4 rounded"></div>
          
          {/* Meta info skeleton */}
          <div className="flex items-center gap-4 mt-4">
            <div className="skeleton h-4 w-20 rounded"></div>
            <div className="skeleton h-4 w-20 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
