import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ErrorPageProps {
  errorCode: "404" | "500" | "403" | "error";
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  className?: string;
}

const ErrorPage = ({
  errorCode,
  title,
  description,
  showHomeButton = true,
  className = ""
}: ErrorPageProps) => {
  const getErrorConfig = () => {
    switch (errorCode) {
      case "404":
        return {
          title: title || "Страница не найдена",
          description: description || "К сожалению, запрашиваемая страница не существует или была перемещена.",
          icon: "🔍",
          color: "text-blue-500"
        };
      case "500":
        return {
          title: title || "Внутренняя ошибка сервера",
          description: description || "Произошла техническая ошибка. Мы уже работаем над её устранением.",
          icon: "⚙️",
          color: "text-red-500"
        };
      case "403":
        return {
          title: title || "Доступ запрещён",
          description: description || "У вас нет прав для доступа к этой странице.",
          icon: "🔒",
          color: "text-yellow-500"
        };
      default:
        return {
          title: title || "Что-то пошло не так",
          description: description || "Произошла неожиданная ошибка. Попробуйте обновить страницу.",
          icon: "❌",
          color: "text-gray-500"
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-100 ${className}`}>
      <div className="text-center max-w-md mx-auto px-6">
        {/* Иконка ошибки */}
        <div className="text-8xl mb-6">{config.icon}</div>
        
        {/* Код ошибки */}
        <h1 className={`text-6xl font-bold mb-4 ${config.color}`}>
          {errorCode.toUpperCase()}
        </h1>
        
        {/* Заголовок */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {config.title}
        </h2>
        
        {/* Описание */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {config.description}
        </p>
        
        {/* Кнопки действий */}
        <div className="space-y-4">
          {showHomeButton && (
            <Link href="/">
              <Button className="form-btn">
                Вернуться на главную
              </Button>
            </Link>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full border-blue-500 text-blue-500 hover:bg-blue-50"
          >
            Назад
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => window.location.reload()}
            className="w-full text-gray-600 hover:bg-gray-200"
          >
            Обновить страницу
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage; 