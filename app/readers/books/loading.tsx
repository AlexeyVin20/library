import LoadingSkeleton from "@/components/ui/loading-skeleton";

export default function BooksLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="root-container">
        {/* Заголовок загрузки */}
        <div className="py-10">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-300 rounded w-80 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-96"></div>
          </div>
        </div>
        
        {/* Skeleton для поиска */}
        <div className="search">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        
        {/* Skeleton для фильтров */}
        <div className="mt-6 flex gap-4">
          <div className="h-12 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        {/* Skeleton книг */}
        <LoadingSkeleton/>
        
        {/* Skeleton для пагинации */}
        <div className="flex justify-center items-center gap-4 mt-10 animate-pulse">
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
  