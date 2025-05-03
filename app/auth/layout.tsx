// app/auth/layout.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import "@/styles/admin.css";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Если пользователь уже авторизован, перенаправляем на главную страницу
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Показываем пустой контейнер во время загрузки, чтобы избежать мигания контента
  if (isLoading) {
    return <div className="min-h-screen flex bg-[url('/images/bg2.jpg')] bg-cover bg-center bg-fixed bg-no-repeat text-white" />;
  }

  return (
    <div className="min-h-screen flex bg-[url('/images/bg2.jpg')] bg-cover bg-center bg-fixed bg-no-repeat text-white">
      {/* Добавляем плавающие фигуры для визуального эффекта */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-green/10 rounded-full blur-3xl"></div>
      
      <div className="flex flex-col flex-1 items-center justify-center">
        <main className="p-6 w-full max-w-md">{children}</main>
      </div>
    </div>
  );
}