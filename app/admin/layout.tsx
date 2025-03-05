// app/admin/layout.tsx
import Sidebar from "@/components/admin/Sidebar";
import TopNavigation from "@/components/admin/TopNavigation";
import { ReactNode } from "react";
import "@/styles/admin.css";

// Для демонстрации используем фиктивные данные сессии.
// В реальном проекте их можно получать через NextAuth или другой механизм аутентификации.
const dummySession = {
  user: {
    name: "Admin User",
    email: "admin@example.com",
  },
};

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex bg-gradient-app">
      <div className="flex flex-col flex-1">
        <TopNavigation session={dummySession} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}