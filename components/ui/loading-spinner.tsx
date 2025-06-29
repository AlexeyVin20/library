import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const LoadingSpinner = ({ 
  size = "md", 
  className = "",
  text 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-4"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-3">
        <div 
          className={cn(
            "border-blue-300 border-t-blue-500 rounded-full animate-spin",
            sizeClasses[size]
          )}
        />
        {text && (
          <p className={cn("text-gray-600", textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner; 