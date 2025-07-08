// app/auth/layout.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import AuthHeader from "@/components/auth/AuthHeader";
import PeekingOwl from "@/components/auth/PeekingOwl";
import Image from "next/image";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Если пользователь уже авторизован, перенаправляем на главную страницу
  useEffect(() => {
    // Не перенаправляем, если пользователю требуется сменить пароль
    if (user?.passwordResetRequired) {
      // Если пользователь находится не на странице смены пароля, а где-то еще в /auth,
      // принудительно направим его на нужную страницу.
      if (window.location.pathname !== '/auth/force-password-change') {
        router.push('/auth/force-password-change');
      }
      return;
    }

    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [user, isAuthenticated, isLoading, router]);
  
  // Показываем пустой контейнер во время загрузки, чтобы избежать мигания контента
  if (isLoading) {
    return <div className="min-h-screen flex bg-white" />;
  }

  return (
    <div className="relative min-h-screen w-full bg-gray-50 overflow-hidden">
      {/* Декоративные элементы */}
      <div className="fixed -top-32 -left-40 w-96 h-96 bg-blue-200/70 rounded-full blur-3xl animate-pulse pointer-events-none animation-delay-2000"></div>
      <div className="fixed -bottom-40 -right-32 w-[30rem] h-[30rem] bg-indigo-200/80 rounded-full blur-3xl animate-pulse pointer-events-none animation-delay-4000"></div>
      <div className="fixed top-1/2 -right-32 w-80 h-80 bg-pink-200/60 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-1/4 -left-32 w-80 h-80 bg-teal-200/70 rounded-full blur-3xl animate-pulse pointer-events-none animation-delay-6000"></div>

      <PeekingOwl />

      <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
        <AuthHeader />
        <main className="w-full max-w-md z-10">{children}</main>
      </div>
    </div>
  );
}