"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReaderNavigation from "@/components/reader-navigation";
import { BookOpen, Users, Shield, ArrowRight, TrendingUp, BarChart3, Users2, Clock, Star, BookMarked, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import dynamic from "next/dynamic";
import { cn, formatNumber } from "@/lib/utils";
import { PinContainer } from "@/components/ui/3d-pin";
import { LibraryStats, CategoryStats } from "@/lib/api";
import { useLibraryStats } from "@/hooks/use-library-stats";

const PixelCanvas = dynamic(() => import("@/components/ui/pixel-canvas").then(mod => mod.PixelCanvas), {
  ssr: false
});

// Предположим, что у вас есть тип для роли пользователя
type UserRole = "Администратор" | "Пользователь" | null;

// Интерфейс для статистики
interface StatCard {
  label: string;
  value: string;
  icon: any;
  color: string;
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [userRole, setUserRole] = useState<UserRole>(null);
  
  const {
    user,
    isLoading
  } = useAuth();

  const { stats: libraryStats, loading: statsLoading, error: statsError } = useLibraryStats();

  // Эффект для темы
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme === "dark" || savedTheme === "system" && prefersDark ? "dark" : "light";
    setTheme(initialTheme as "light" | "dark");
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

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



  // Формируем карточки статистики из реальных данных
  const getStatCards = (): StatCard[] => {
    if (!libraryStats) return [];
    
    return [
      { 
        label: "Всего книг", 
        value: formatNumber(libraryStats.totalBooks), 
        icon: BookOpen, 
        color: "text-blue-600" 
      },
      { 
        label: "Активных читателей", 
        value: formatNumber(libraryStats.activeUsers), 
        icon: Users2, 
        color: "text-green-600" 
      },
      { 
        label: "Книг в каталоге", 
        value: formatNumber(libraryStats.totalAvailableBooks), 
        icon: TrendingUp, 
        color: "text-purple-600" 
      },
    ];
  };
  
  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Навигация */}
      <ReaderNavigation />
      
      {/* Анимированный фон */}
      <div className="fixed inset-0 z-0">
        <PixelCanvas 
          colors={['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8']} 
          speed={30} 
          gap={8} 
          noFocus={true} 
        />
      </div>
      
      <main className="relative z-10 container mx-auto px-4 py-20 space-y-16">
        {/* Героическая секция */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }} 
          className="text-center space-y-6"
        >
          <motion.h1 
            className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-700 via-purple-600 to-blue-500 bg-clip-text text-transparent"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Библиотека будущего
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Откройте мир знаний с современными технологиями управления библиотечными ресурсами
          </motion.p>
          
          {/* Статистика */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {statsLoading ? (
              // Показываем загрузку
              Array.from({ length: 3 }).map((_, index) => (
                <motion.div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 flex items-center justify-center"
                >
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </motion.div>
              ))
            ) : statsError ? (
              // Показываем ошибку
              <motion.div
                className="col-span-full bg-red-100/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-red-200"
              >
                <p className="text-red-600 text-center">{statsError}</p>
              </motion.div>
            ) : (
              // Показываем реальные данные
              getStatCards().map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </motion.div>
              ))
            )}
          </motion.div>
        </motion.div>

        {/* Основные разделы с 3D-пинами */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {/* Раздел для читателей */}
          <PinContainer
            title="Перейти к чтению"
            href="/readers"
            className="h-full"
          >
            <div className="flex flex-col h-full p-6 space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <BookOpen className="w-16 h-16 text-blue-500" />
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-white text-xs font-bold">!</span>
                  </motion.div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 text-center">Читательский портал</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <BookMarked className="w-4 h-4 mr-2 text-blue-500" />
                  Персональные закладки
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2 text-green-500" />
                  История чтения
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  Рекомендации
                </div>
              </div>
            </div>
          </PinContainer>

          {/* Раздел для администраторов */}
          {userRole === "Администратор" && (
            <PinContainer
              title="Панель управления"
              href="/admin"
              className="h-full"
            >
              <div className="flex flex-col h-full p-6 space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <Shield className="w-16 h-16 text-purple-500" />
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 text-center">Администрирование</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <BarChart3 className="w-4 h-4 mr-2 text-purple-500" />
                    Аналитика и отчеты
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2 text-blue-500" />
                    Управление пользователями
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="w-4 h-4 mr-2 text-green-500" />
                    Каталог книг
                  </div>
                </div>
              </div>
            </PinContainer>
          )}
        </motion.div>

        {/* Секция популярных категорий - используем реальные данные */}
        {libraryStats && libraryStats.categories.length > 0 && (
          <motion.div 
            className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Популярные категории
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {libraryStats.categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{category.name}</span>
                    <span className="text-sm text-gray-500">{formatNumber(category.count)} книг</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{ duration: 1, delay: 1.4 + index * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Информационная секция */}
        <motion.div 
          className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Возможности системы
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              className="space-y-4"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-blue-500" />
                Для читателей
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-green-500" />
                  Удобный поиск по каталогу
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-green-500" />
                  Система резервирования
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-green-500" />
                  Персональная история
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-green-500" />
                  Рекомендации книг
                </li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="space-y-4"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-purple-500" />
                Для администраторов
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-500" />
                  Управление коллекцией
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-500" />
                  Аналитика и отчеты
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-500" />
                  Контроль пользователей
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-500" />
                  Система уведомлений
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </main>
      
      {/* Обновленный футер */}
      <footer className="relative z-10 container mx-auto px-4 py-8">
        <motion.div 
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-8">
            <Link href="#" className="group flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
              <Image aria-hidden src="/file.svg" alt="File icon" width={20} height={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Справка</span>
            </Link>
            <Link href="#" className="group flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
              <Image aria-hidden src="/window.svg" alt="Window icon" width={20} height={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Каталог</span>
            </Link>
            <Link href="#" className="group flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
              <Image aria-hidden src="/globe.svg" alt="Globe icon" width={20} height={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Контакты</span>
            </Link>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}