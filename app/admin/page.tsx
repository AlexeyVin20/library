"use client";

import React, { useState } from "react";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import MyChartStats from "@/components/admin/ChartStats";
import BorrowedBooksChart from "@/components/admin/BorrowedBooksChart";
import ActiveUsersChart from "@/components/admin/ActiveUsersChart";
import Calendar, { CalendarEvent } from "@/components/admin/Calendar";
import ThemeSelector from "@/components/admin/ThemeSelector";
import "@/styles/admin.css";

// Пример данных
const totalBooks = 120;
const recentBorrowed = 15;
const totalUsers = 50;
const activeUsers = 30;
const totalBorrowed = 45;

const recentBookRequests = [
  { id: 1, book: "Библиотека полуночи", user: "Алиса", date: "2025-02-10" },
  { id: 2, book: "Атомные привычки", user: "Боб", date: "2025-02-11" },
];
const userRequests = [
  { id: 1, type: "Регистрация", user: "Чарли", date: "2025-02-09" },
  { id: 2, type: "Изменение профиля", user: "Дана", date: "2025-02-10" },
];
const recentChats = [
  { id: 1, message: "Когда вернуть книгу?", user: "Алиса", time: "10:30" },
  { id: 2, message: "Нужна помощь с аккаунтом", user: "Боб", time: "11:00" },
];

const calendarEvents: CalendarEvent[] = [
  { id: 1, date: "2025-03-05", info: "Возврат: Алхимик" },
  { id: 2, date: "2025-03-15", info: "Возврат: Чистый код" },
  { id: 3, date: "2025-04-10", info: "Возврат: Прагматичный программист" },
];

export default function DashboardPage() {
  const [searchValue, setSearchValue] = useState("");
  const [currentTheme, setCurrentTheme] = useState("modern"); // modern, minimal, glassmorphism

  const getThemeClasses = () => {
    switch(currentTheme) {
      case "minimal":
        return {
          card: "border rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm hover:shadow transition-all duration-300",
          statsCard: "border rounded-lg bg-white/90 dark:bg-gray-800/90 p-4 shadow-sm hover:shadow-md transition-all duration-300",
          mainContainer: "bg-gray-50 dark:bg-gray-900"
        };
      case "glassmorphism":
        return {
          card: "backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300",
          statsCard: "backdrop-blur-md bg-white/20 dark:bg-gray-800/30 border border-white/30 dark:border-gray-700/30 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300",
          mainContainer: "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900"
        };
      case "modern":
      default:
        return {
          card: "bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform perspective-1000 hover:translate-z-4 transition-all duration-300",
          statsCard: "bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform perspective-1000 hover:translate-z-3 transition-all duration-300",
          mainContainer: "bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950"
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses.mainContainer}`}>
      {/* Верхняя панель с навигационным меню и поиском */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/50 dark:bg-gray-900/50 border-b border-white/20 dark:border-gray-800/20 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-sm">
        {/* Navigation Menu из shadcn */}
        <div className="flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-white/20 dark:hover:bg-gray-800/20">Главная</NavigationMenuTrigger>
                <NavigationMenuContent className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 p-2 rounded-lg border border-white/20 dark:border-gray-700/20 shadow-lg">
                  <ul className="space-y-2 min-w-32">
                    <li><a href="/admin" className="block p-2 rounded hover:bg-white/50 dark:hover:bg-gray-700/50">Панель управления</a></li>
                    <li><a href="/admin/books" className="block p-2 rounded hover:bg-white/50 dark:hover:bg-gray-700/50">Список книг</a></li>
                    <li><a href="/admin/users" className="block p-2 rounded hover:bg-white/50 dark:hover:bg-gray-700/50">Пользователи</a></li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-white/20 dark:hover:bg-gray-800/20">Настройки</NavigationMenuTrigger>
                <NavigationMenuContent className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 p-2 rounded-lg border border-white/20 dark:border-gray-700/20 shadow-lg">
                  <ul className="space-y-2 min-w-32">
                    <li><a href="#" className="block p-2 rounded hover:bg-white/50 dark:hover:bg-gray-700/50">Тема</a></li>
                    <li><a href="#" className="block p-2 rounded hover:bg-white/50 dark:hover:bg-gray-700/50">Уведомления</a></li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Правая часть хедера */}
        <div className="flex items-center gap-4">
          {/* Выбор дизайна */}
          <ThemeSelector currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />

          {/* Поле поиска */}
          <div className="flex items-center">
            <Input
              type="text"
              placeholder="Поиск книг..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="max-w-xs bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button className="ml-2 px-4 py-2 bg-blue-600/90 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transform hover:translate-y-px transition-all duration-200">
              Поиск
            </button>
          </div>
        </div>
      </div>

      {/* Основная часть */}
      <main className="flex-1 p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-2">Панель управления</h1>
          <p className="text-sm text-gray-500">Последнее обновление: 28 февраля, 2025</p>
        </div>

        {/* "Количества" */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className={`${themeClasses.statsCard} group`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Количество взятых книг</p>
                <p className="text-3xl font-bold mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{recentBorrowed}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">+2 за последний день</div>
          </div>
          <div className={`${themeClasses.statsCard} group`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Количество пользователей</p>
                <p className="text-3xl font-bold mt-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{totalUsers}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">+5 за последнюю неделю</div>
          </div>
          <div className={`${themeClasses.statsCard} group`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Количество книг всего</p>
                <p className="text-3xl font-bold mt-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{totalBooks}</p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">+3 за последний месяц</div>
          </div>
        </div>

        {/* Диаграммы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Диаграмма 1 (ChartStats) */}
          <div className={`${themeClasses.card} p-4`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Общая статистика
            </h2>
            <MyChartStats
              totalBooks={totalBooks}
              recentBorrowed={recentBorrowed}
              totalUsers={totalUsers}
              totalBorrowed={totalBorrowed}
            />
          </div>
          {/* Диаграмма 2 (ActiveUsersChart) */}
          <div className={`${themeClasses.card} p-4`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Активные пользователи
            </h2>
            <ActiveUsersChart totalUsers={totalUsers} activeUsers={30} />
          </div>
          {/* Диаграмма 3 (BorrowedBooksChart) */}
          <div className={`${themeClasses.card} p-4`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Статистика выдачи книг
            </h2>
            <BorrowedBooksChart
              totalBooks={totalBooks}
              recentBorrowed={recentBorrowed}
              totalUsers={totalUsers}
              totalBorrowed={totalBorrowed}
            />
          </div>
        </div>

        {/* Календарь и информационные блоки - новая структура */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Календарь (3 месяца) в одну строку с горизонтальным скроллом */}
            <div className={`${themeClasses.card} p-4 overflow-hidden`}>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Календарь возвратов
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                <div className="snap-center">
                  <Calendar events={calendarEvents} monthOffset={0} />
                </div>
                <div className="snap-center">
                  <Calendar events={calendarEvents} monthOffset={1} />
                </div>
                <div className="snap-center">
                  <Calendar events={calendarEvents} monthOffset={2} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Блоки информации в одной колонке */}
            <div className={`${themeClasses.card} p-4`}>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Недавние запросы
              </h2>
              <ul className="space-y-3">
                {recentBookRequests.map((request) => (
                  <li key={request.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 group">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-blue-600 dark:text-blue-400 mr-1">{request.user}</span>
                        <span>запросил книгу</span>
                      </div>
                      <span className="text-gray-500 text-xs">{request.date}</span>
                    </div>
                    <p className="mt-1 italic group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{request.book}</p>
                  </li>
                ))}
              </ul>
              <button className="mt-4 w-full py-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                Показать все запросы
              </button>
            </div>

            <div className={`${themeClasses.card} p-4`}>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Недавние чаты
              </h2>
              <ul className="space-y-3">
                {recentChats.map((chat) => (
                  <li key={chat.id} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">{chat.user}</span>
                      <span className="text-gray-500 text-xs">{chat.time}</span>
                    </div>
                    <p className="mt-1">{chat.message}</p>
                  </li>
                ))}
              </ul>
              <button className="mt-4 w-full py-2 text-center text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                Открыть чаты
              </button>
            </div>

            <div className={`${themeClasses.card} p-4`}>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Запросы пользователей
              </h2>
              <ul className="space-y-3">
                {userRequests.map((req) => (
                  <li key={req.id} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-green-600 dark:text-green-400">{req.user}</span>
                      <span className="text-gray-500 text-xs">{req.date}</span>
                    </div>
                    <p className="mt-1">{req.type}</p>
                  </li>
                ))}
              </ul>
              <button className="mt-4 w-full py-2 text-center text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                Показать все запросы
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}