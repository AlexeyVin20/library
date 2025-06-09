import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "book-card" | "book-list" | "book-overview";
  count?: number;
}

const LoadingSkeleton = ({ 
  className, 
  variant = "book-card", 
  count = 1 
}: LoadingSkeletonProps) => {
  const renderBookCardSkeleton = () => (
    <li className="animate-pulse">
      {/* Skeleton для обложки книги */}
      <div className="relative xs:w-[174px] w-[114px] xs:h-[239px] h-[169px] bg-gray-700 rounded-lg"></div>
      
      {/* Skeleton для информации о книге */}
      <div className="mt-4 xs:max-w-40 max-w-28">
        <div className="h-6 bg-gray-600 rounded mb-2"></div>
        <div className="h-4 bg-gray-500 rounded w-3/4"></div>
      </div>
    </li>
  );

  const renderBookListSkeleton = () => (
    <div className="book-list animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-4">
          {renderBookCardSkeleton()}
        </div>
      ))}
    </div>
  );

  const renderBookOverviewSkeleton = () => (
    <div className="book-overview animate-pulse">
      <div className="xl:w-1/2">
        {/* Skeleton для заголовка */}
        <div className="h-16 bg-gray-700 rounded mb-4"></div>
        <div className="h-8 bg-gray-600 rounded w-3/4 mb-7"></div>
        
        {/* Skeleton для информации */}
        <div className="book-info">
          <div className="h-6 bg-gray-600 rounded w-24"></div>
          <div className="h-6 bg-gray-600 rounded w-32"></div>
          <div className="h-6 bg-gray-600 rounded w-28"></div>
        </div>
        
        {/* Skeleton для копий */}
        <div className="book-copies">
          <div className="h-6 bg-gray-600 rounded w-40"></div>
          <div className="h-6 bg-gray-600 rounded w-36"></div>
        </div>
        
        {/* Skeleton для описания */}
        <div className="mt-2 space-y-2">
          <div className="h-4 bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-600 rounded w-5/6"></div>
        </div>
        
        {/* Skeleton для кнопки */}
        <div className="h-14 bg-gray-700 rounded mt-4 w-fit px-8"></div>
      </div>
      
      <div className="xl:w-1/2 flex justify-center">
        {/* Skeleton для большой обложки */}
        <div className="xs:w-[296px] w-[256px] xs:h-[404px] h-[354px] bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );

  if (variant === "book-list") {
    return (
      <div className={cn("", className)}>
        {renderBookListSkeleton()}
      </div>
    );
  }

  if (variant === "book-overview") {
    return (
      <div className={cn("", className)}>
        {renderBookOverviewSkeleton()}
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderBookCardSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton; 