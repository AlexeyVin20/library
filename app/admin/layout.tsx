// app/admin/layout.tsx
import Sidebar from "@/components/admin/Sidebar";
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
      <Sidebar session={dummySession} />
      <div className="flex flex-col flex-1">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
