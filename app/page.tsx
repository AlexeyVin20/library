"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import ReaderNavigation from "@/components/reader-navigation"
import { BookOpen, Users, Shield, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth"

// Предположим, что у вас есть тип для роли пользователя
type UserRole = "Администратор" | "Пользователь" | null;

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [userRole, setUserRole] = useState<UserRole>(null);
  const { user, isLoading } = useAuth();

  // Эффект для темы
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialTheme = savedTheme === "dark" || (savedTheme === "system" && prefersDark) ? "dark" : "light"

    setTheme(initialTheme as "light" | "dark")

    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  // Эффект для установки роли пользователя из контекста аутентификации
  useEffect(() => {
    if (!isLoading && user) {
      // Проверяем, есть ли роль "Администратор" в массиве ролей пользователя
      if (user.roles && user.roles.includes("Администратор")) {
        setUserRole("Администратор");
      } else {
        setUserRole("Пользователь");
      }
    } else if (!isLoading && !user) {
      // Если пользователь не аутентифицирован, роль null
      setUserRole(null);
    }
  }, [user, isLoading]);

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] relative">
      {/* Плавающие фигуры */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      {/* Навигация */}
      <ReaderNavigation />

      <main className="container mx-auto px-4 py-20 space-y-12">
        {/* Заголовок */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent">
            Добро пожаловать в Библиотеку
          </h1>
          <p className="text-xl text-white max-w-2xl mx-auto">
            Ваш доступ к богатому миру знаний и литературы
          </p>
        </motion.div>

        {/* Основные секции */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Секция для читателей */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/30 flex flex-col h-full"
          >
            <div className="mb-6 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Для читателей</h2>
            <p className="text-white mb-6 flex-grow text-center">
              Ищите книги, создавайте закладки и отслеживайте вашу историю чтения. Наша библиотека предлагает богатую коллекцию литературы для всех интересов.
            </p>
            <Link href="/readers" className="mx-auto">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-emerald-500/90 hover:bg-emerald-600/90 text-white gap-2 text-base h-12 px-6 shadow-md backdrop-blur-md"
              >
                Войти как читатель
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Секция для администраторов */}
          {userRole === "Администратор" && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/30 flex flex-col h-full"
            >
              <div className="mb-6 flex items-center justify-center">
                <Shield className="w-16 h-16 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Для администраторов</h2>
              <p className="text-white mb-6 flex-grow text-center">
                Управляйте коллекцией библиотеки, отслеживайте резервирования и контролируйте пользователей. Полный контроль над библиотечной системой.
              </p>
              <Link href="/admin" className="mx-auto">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full border border-solid border-white/20 dark:border-white/[.145] transition-colors flex items-center justify-center bg-green-500/20 hover:bg-green-600/90 backdrop-blur-xl text-white text-base h-12 px-6 shadow-md"
                >
                  Войти как администратор
                  <ArrowRight className="w-5 h-5 ml-1" />
                </motion.button>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Информационная секция */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/30 max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-white mb-4 text-center">О библиотеке</h2>
          <p className="text-white mb-4 text-center">
            Наша библиотека предоставляет доступ к различным книгам, журналам и учебным материалам. 
            Система разработана для удобного управления и каталогизации библиотечных ресурсов.
          </p>
          <ol className="list-inside list-decimal text-white space-y-2 font-[family-name:var(--font-geist-mono)]">
            <li>
              Богатая коллекция литературы
            </li>
            <li>
              Удобный поиск и навигация
            </li>
            <li>
              Система резервирования
            </li>
            <li>
              Учет пользователей и выдач
            </li>
          </ol>
        </motion.div>
      </main>

      {/* Футер */}
      <footer className="container mx-auto px-4 py-6 backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-4 shadow-lg transition-all duration-300 border border-white/20 dark:border-gray-700/30 relative z-10 max-w-3xl mx-auto mt-8 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link href="#" className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-white">
            <Image
              aria-hidden
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
              className="invert"
            />
            Справка
          </Link>
          <Link href="#" className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-white">
            <Image
              aria-hidden
              src="/window.svg"
              alt="Window icon"
              width={16}
              height={16}
              className="invert"
            />
            Каталог
          </Link>
          <Link href="#" className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-white">
            <Image
              aria-hidden
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
              className="invert"
            />
            Контакты
          </Link>
        </div>
      </footer>
    </div>
  )
}
