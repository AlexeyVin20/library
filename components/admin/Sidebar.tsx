"use client";

import Image from "next/image";
import { adminSideBarLinks } from "@/constants";
import Link from "next/link";
import { cn, getInitials } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Session } from "next-auth";
import "@/styles/admin.css"

// Пример условного компонента переключателя темы (ToggleButton) из shadcn
import { Toggle } from "@/components/ui/toggle"; // замените на реальную реализацию

const Sidebar = ({ session }: { session: Session }) => {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <aside className="w-64 h-screen bg-blue border border-white dark:bg-gray-800 shadow-lg flex flex-col justify-between p-6">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <Image src="/icons/admin/logo.png" alt="logo" height={37} width={37} />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Библиотека</h1>
        </div>

        <nav className="flex flex-col gap-4">
          {adminSideBarLinks.map((link) => {
            const isSelected =
              (link.route !== "/admin" &&
                pathname.includes(link.route) &&
                link.route.length > 1) ||
              pathname === link.route;
            return (
              <Link href={link.route} key={link.route}>
                <div
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-md cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
                    isSelected && "bg-primary-admin shadow-sm"
                  )}
                >
                  <div className="relative w-6 h-6">
                    <Image
                      src={link.img}
                      alt="icon"
                      fill
                      className={cn("object-contain transition-all", isSelected && "brightness-0 invert")}
                    />
                  </div>
                  <span className={cn("font-medium", isSelected ? "text-black" : "text-gray-800 dark:text-gray-200")}>
                    {link.text}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Переключатель темы над профилем */}
        <div className="mt-6 flex justify-center items-center text-5xl">
          <Toggle
            pressed={theme === "dark"}
            onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </Toggle>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-8">
        <Avatar>
          <AvatarFallback className="bg-amber-100 text-gray-800">
            {getInitials(session?.user?.name || "IN")}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:flex flex-col">
          <span className="font-semibold text-gray-800 dark:text-gray-200">{session?.user?.name}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.email}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
