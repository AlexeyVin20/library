// app/profile/layout.tsx
"use client";

import ReaderNavigation from "@/components/reader-navigation";
import Footer from "@/components/admin/Footer";
import { ReactNode, useEffect, useState } from "react";
import "@/styles/admin.css";
import { useAuth, User } from "@/lib/auth";
import { useRouter } from "next/navigation";

type ProfileLayoutProps = {
  children: ReactNode;
};

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Показываем пустой контейнер во время загрузки, чтобы избежать мигания контента
  if (isLoading) {
    return <div className="min-h-screen flex bg-gray-200" />;
  }

  return (
    <div className="min-h-screen flex bg-gray-200">
      <div className="flex flex-col flex-1">
        <ReaderNavigation/>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}