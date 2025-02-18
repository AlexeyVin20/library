"use client";

import React, { useState } from "react";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import MyChartStats from "@/components/admin/ChartStats";
import BorrowedBooksChart from "@/components/admin/BorrowedBooksChart";
import ActiveUsersChart from "@/components/admin/ActiveUsersChart";
import Calendar, { CalendarEvent } from "@/components/admin/Calendar";

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Верхняя панель с навигационным меню и поиском */}
      <div className="border-b p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Navigation Menu из shadcn */}
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Главная</NavigationMenuTrigger>
              <NavigationMenuContent className="p-2">
                {/* Здесь можно добавить ссылки, выпадающее меню и т.д. */}
                <ul className="space-y-2">
                  <li><a href="/admin">Панель управления</a></li>
                  <li><a href="/admin/books">Список книг</a></li>
                  <li><a href="/admin/users">Пользователи</a></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Настройки</NavigationMenuTrigger>
              <NavigationMenuContent className="p-2">
                {/* Меню настроек */}
                <ul className="space-y-2">
                  <li><a href="#">Тема</a></li>
                  <li><a href="#">Уведомления</a></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Поле поиска */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Поиск книг..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="max-w-xs"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Поиск
          </button>
        </div>
      </div>

      {/* Основная часть */}
      <main className="flex-1 p-6 space-y-8">
        <h1 className="text-3xl font-bold mb-2">Панель управления</h1>

        {/* "Количества" */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border rounded p-4 bg-white shadow">
            <p className="text-sm text-gray-500">Количество взятых книг</p>
            <p className="text-2xl font-bold">{recentBorrowed}</p>
          </div>
          <div className="border rounded p-4 bg-white shadow">
            <p className="text-sm text-gray-500">Количество пользователей</p>
            <p className="text-2xl font-bold">{totalUsers}</p>
          </div>
          <div className="border rounded p-4 bg-white shadow">
            <p className="text-sm text-gray-500">Количество книг всего</p>
            <p className="text-2xl font-bold">{totalBooks}</p>
          </div>
        </div>

        {/* Диаграммы */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Диаграмма 1 (ChartStats) */}
          <div className="bg-white dark:bg-gray-800 p-4 shadow rounded">
            <MyChartStats
              totalBooks={totalBooks}
              recentBorrowed={recentBorrowed}
              totalUsers={totalUsers}
              totalBorrowed={totalBorrowed}
            />
          </div>
          {/* Диаграмма 2 (ActiveUsersChart) */}
          <div className="bg-white dark:bg-gray-800 p-4 shadow rounded">
            <h2 className="text-lg font-semibold mb-2">Активные пользователи</h2>
            {/* Пример новой диаграммы */}
            <ActiveUsersChart totalUsers={totalUsers} activeUsers={30} />
          </div>
          {/* Диаграмма 3 (BorrowedBooksChart) */}
          <div className="bg-white dark:bg-gray-800 p-4 shadow rounded">
            <BorrowedBooksChart
              totalBooks={totalBooks}
              recentBorrowed={recentBorrowed}
              totalUsers={totalUsers}
              totalBorrowed={totalBorrowed}
            />
          </div>
        </div>

        {/* Календарь (3 месяца) */}
        <div className="bg-white dark:bg-gray-800 p-4 shadow rounded w-full overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Календарь на 3 месяца</h2>
          <div className="flex gap-4 flex-wrap justify-center">
            {/* Можно отрисовать один и тот же компонент Calendar трижды, 
                просто сместив currentMonth, или добавить проп "monthsToShow" 
                и соответствующим образом доработать Calendar. 
                Для простоты здесь отрисовываем 3 одинаковых календаря подряд. */}
            <Calendar events={calendarEvents} />
            <Calendar events={calendarEvents} />
            <Calendar events={calendarEvents} />
          </div>
        </div>

        {/* Блоки "Недавние запросы", "Недавние чаты" и т.д. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 shadow rounded">
            <h2 className="text-lg font-semibold mb-2">Недавние запросы</h2>
            <ul className="text-sm space-y-1">
              {recentBookRequests.map((request) => (
                <li key={request.id} className="border-b py-1">
                  <span className="font-medium">{request.user}</span> запросил книгу{" "}
                  <span className="italic">{request.book}</span>{" "}
                  <span className="text-gray-500 text-xs">({request.date})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 shadow rounded">
            <h2 className="text-lg font-semibold mb-2">Недавние чаты</h2>
            <ul className="text-sm space-y-1">
              {recentChats.map((chat) => (
                <li key={chat.id} className="border-b py-1">
                  <span className="font-medium">{chat.user}</span>: {chat.message}{" "}
                  <span className="text-gray-500 text-xs">({chat.time})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 shadow rounded">
            <h2 className="text-lg font-semibold mb-2">Запросы пользователей</h2>
            <ul className="text-sm space-y-1">
              {userRequests.map((req) => (
                <li key={req.id} className="border-b py-1">
                  <span className="font-medium">{req.user}</span> — {req.type}{" "}
                  <span className="text-gray-500 text-xs">({req.date})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
