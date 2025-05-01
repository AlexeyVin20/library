// app/admin/layout.tsx
import Sidebar from "@/components/admin/Sidebar";
import TopNavigation from "@/components/admin/TopNavigation";
import Footer from "@/components/admin/Footer";
import { ReactNode } from "react";
import "@/styles/admin.css";

// Для демонстрации используем фиктивные данные сессии.
// В реальном проекте их можно получать через NextAuth или другой механизм аутентификации.
const dummySession = {
  user: {
    name: "Admin User",
    email: "admin@example.com",
  },
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
};

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[url('/images/bg2.jpg')] bg-cover bg-center bg-fixed bg-no-repeat text-white">
      {/* Добавляем плавающие фигуры как на странице admin/page.tsx */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-green/10 rounded-full blur-3xl"></div>
      
      <div className="flex flex-col flex-1">
        <TopNavigation session={dummySession} />
        <main className="p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}