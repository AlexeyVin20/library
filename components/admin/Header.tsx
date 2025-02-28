"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  // Разбиваем путь на сегменты (например, /admin/books/create → ["admin", "books", "create"])
  const segments = pathname.split("/").filter(Boolean);

  // Формируем хлебные крошки с накопительным путём
  let cumulativePath = "";
  const breadcrumbs = segments.map((segment) => {
    cumulativePath += `/${segment}`;
    // Преобразуем сегмент в читабельный вид (например, "create" → "Создать")
    const label =
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    return { label, path: cumulativePath };
  });

  return (
    <header className="w-full bg-white dark:bg-gray-800 shadow p-4 flex items-center justify-between">
      {/* Левая часть: логотип и хлебные крошки */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Image
            src="/icons/admin/logo.svg"
            alt="Logo"
            width={40}
            height={40}
            className="cursor-pointer"
          />
        </Link>
        {/* Хлебные крошки (скрываем на маленьких экранах) */}
        <nav className="hidden md:block">
          <ul className="flex items-center text-sm text-gray-800 dark:text-gray-200">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-gray-500">{" > "}</span>
                )}
                <Link
                  href={crumb.path}
                  className="hover:underline transition-colors"
                >
                  {crumb.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* Правая часть: основные навигационные ссылки */}
      <div className="flex items-center gap-6">
        <Link
          href="/admin/books"
          className="text-gray-800 dark:text-gray-200 hover:underline transition-colors"
        >
          Книги
        </Link>
        <Link
          href="/admin/authors"
          className="text-gray-800 dark:text-gray-200 hover:underline transition-colors"
        >
          Авторы
        </Link>
        <Link
          href="/admin/settings"
          className="text-gray-800 dark:text-gray-200 hover:underline transition-colors"
        >
          Настройки
        </Link>
      </div>
    </header>
  );
}
