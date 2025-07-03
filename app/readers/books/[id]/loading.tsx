import LoadingSkeleton from "@/components/ui/loading-skeleton";

export default function BookDetailsLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="root-container">
        {/* Skeleton для детальной страницы книги */}
        <LoadingSkeleton/>
        
        {/* Skeleton для дополнительной информации */}
        <div className="mt-16 animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
          
          {/* Skeleton для похожих книг */}
          <div className="book-list">
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="animate-pulse">
                <div className="relative xs:w-[174px] w-[114px] xs:h-[239px] h-[169px] bg-gray-300 rounded-lg"></div>
                <div className="mt-4 xs:max-w-40 max-w-28">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </li>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 