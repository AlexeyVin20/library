// app/admin/layout.tsx
import "@/styles/admin.css";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { ReactNode } from "react";

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
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar session={dummySession} />
      <div className="flex flex-col flex-1">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
