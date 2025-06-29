"use client";

import { useEffect } from "react";
import ErrorPage from "@/components/ui/error-page";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логирование ошибки
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Иконка ошибки */}
        <div className="text-8xl mb-6">❌</div>
        
        {/* Заголовок */}
        <h1 className="text-6xl font-bold mb-4 text-red-500">ОШИБКА</h1>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Что-то пошло не так
        </h2>
        
        {/* Описание */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          Произошла неожиданная ошибка при загрузке страницы. Попробуйте обновить страницу или вернуться позже.
        </p>
        
        {/* Кнопки действий */}
        <div className="space-y-4">
          <button
            onClick={reset}
            className="form-btn"
          >
            Попробовать снова
          </button>
          
          <button 
            onClick={() => window.history.back()}
            className="w-full min-h-14 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 rounded-md font-bold"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
} 