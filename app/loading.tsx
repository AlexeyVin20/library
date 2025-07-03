'use client';
import LoadingSkeleton from "@/components/ui/loading-skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-dark-100">
      <div className="root-container">
        {/* Заголовок загрузки */}
        <div className="text-center py-10">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-600 rounded w-48 mx-auto"></div>
          </div>
        </div>
        
        {/* Skeleton книг */}
        <LoadingSkeleton />
      </div>
    </div>
  );
} 