// app/admin/layout.tsx
"use client";

import Sidebar from "@/components/admin/Sidebar";
import TopNavigation from "@/components/admin/TopNavigation";
import Footer from "@/components/admin/Footer";
import { ReactNode, useEffect, useState } from "react";
import "@/styles/admin.css";
import { useAuth, User } from "@/lib/auth";
import { useRouter } from "next/navigation";
import NewTopNavigation from "@/components/admin/New-top-navigation";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Перенаправляем на страницу входа, если пользователь не аутентифицирован
    // или не имеет роли администратора
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (!user?.roles.includes("Администратор")) {
        // Если у пользователя нет роли "Администратор"
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  // Показываем пустой контейнер во время загрузки, чтобы избежать мигания контента
  if (isLoading) {
    return <div className="min-h-screen flex bg-gray-200 bg-cover bg-center bg-fixed bg-no-repeat text-white" />;
  }
  
  // Если пользователь не аутентифицирован или не имеет роли администратора, не рендерим контент
  if (!isAuthenticated || !user?.roles.includes("Администратор")) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-200 bg-cover bg-center bg-fixed bg-no-repeat text-white">
      {/* Добавляем плавающие фигуры как на странице admin/page.tsx */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-green/10 rounded-full blur-3xl"></div>
      
      <div className="flex flex-col flex-1">
        <NewTopNavigation user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}