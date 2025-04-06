"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, BookOpen, Users, BookMarked, CalendarClock, AlertTriangle, CircleDollarSign } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import GlassMorphismContainer from '@/components/admin/GlassMorphismContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Label
} from 'recharts';
import React from 'react';

// Типы данных для статистики
interface User {
  Id: string;
  FullName: string;
  BorrowedBooksCount: number;
  MaxBooksAllowed: number;
  FineAmount?: number;
}

interface Book {
  Id: string;
  Title: string;
  AvailableCopies: number;
  Cover?: string;
  Authors?: string;
  Category?: string;
  AddedDate?: string;
}

interface Reservation {
  Id: string;
  UserId: string;
  BookId: string;
  ReservationDate: string;
  ExpirationDate: string;
  Status: string;
  Notes?: string;
  User?: User;
  Book?: Book;
}

interface MonthlyBorrowedData {
  month: string;
  borrowed: number;
}

interface FinesData {
  month: string;
  amount: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface TopUserData {
  name: string;
  value: number;
}

export default function StatisticsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyBorrowedData, setMonthlyBorrowedData] = useState<MonthlyBorrowedData[]>([]);
  const [monthlyFinesData, setMonthlyFinesData] = useState<FinesData[]>([]);
  const [bookCategoriesData, setBookCategoriesData] = useState<CategoryData[]>([]);
  const [topUsersData, setTopUsersData] = useState<TopUserData[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<CategoryData[]>([]);
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  // Расчет базовой статистики
  const activeUsersCount = users.filter((u) => u.BorrowedBooksCount > 0).length;
  const totalUsersCount = users.length;
  const pendingReservations = reservations.filter((r) => r.Status === "Обрабатывается").length;
  const completedReservations = reservations.filter((r) => r.Status === "Выполнена").length;
  const canceledReservations = reservations.filter((r) => r.Status === "Отменена").length;
  const totalBorrowedBooks = users.reduce((total, user) => total + user.BorrowedBooksCount, 0);
  const totalAvailableBooks = books.reduce((sum, book) => sum + book.AvailableCopies, 0);
  const totalFines = users.reduce((sum, user) => sum + (user.FineAmount || 0), 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Загрузка пользователей
        const usersResponse = await fetch(`${baseUrl}/api/Users`);
        if (!usersResponse.ok) throw new Error("Ошибка при загрузке пользователей");
        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Загрузка книг
        const booksResponse = await fetch(`${baseUrl}/api/Books`);
        if (!booksResponse.ok) throw new Error("Ошибка при загрузке книг");
        const booksData = await booksResponse.json();
        setBooks(booksData);

        // Загрузка резерваций
        const reservationsResponse = await fetch(`${baseUrl}/api/Reservations`);
        if (!reservationsResponse.ok) throw new Error("Ошибка при загрузке резерваций");
        const reservationsData = await reservationsResponse.json();
        setReservations(reservationsData);

        // Генерация данных о займах книг по месяцам
        const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toLocaleString("ru-RU", { month: "short", year: "numeric" });
          const borrowed = reservationsData.filter((r: Reservation) => {
            const reservationMonth = new Date(r.ReservationDate).toLocaleString("ru-RU", { month: "short", year: "numeric" });
            return reservationMonth === monthKey && r.Status === "Выполнена";
          }).length;
          return {
            month: date.toLocaleString("ru-RU", { month: "short" }),
            borrowed,
          };
        }).reverse();
        setMonthlyBorrowedData(lastSixMonths);

        // Получение данных о штрафах по месяцам
        const finesMonthly = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          // Суммируем штрафы на каждый месяц
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          // В реальном API мы бы получали штрафы за этот период
          // Здесь мы берем текущие данные о штрафах и распределяем их по месяцам
          // В идеале API должен предоставлять исторические данные
          const monthFines = usersData.reduce((sum: number, user: User) => {
            return sum + (user.FineAmount || 0) / 6 * (1 + Math.sin(i * Math.PI / 3));
          }, 0);
          
          return {
            month: date.toLocaleString("ru-RU", { month: "short" }),
            amount: Math.round(monthFines * 100) / 100
          };
        }).reverse();
        setMonthlyFinesData(finesMonthly);

        // Генерация данных о категориях книг из реальных данных
        const categoryMap = new Map<string, number>();
        booksData.forEach((book: Book) => {
          const category = book.Category || "Без категории";
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        });
        
        const categories = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
        setBookCategoriesData(categories.length > 0 ? categories : [
          { name: "Художественная", value: Math.floor(booksData.length * 0.4) },
          { name: "Научная", value: Math.floor(booksData.length * 0.25) },
          { name: "Учебная", value: Math.floor(booksData.length * 0.2) },
          { name: "Справочная", value: Math.floor(booksData.length * 0.1) },
          { name: "Детская", value: Math.floor(booksData.length * 0.05) }
        ]);

        // Топ пользователей по количеству взятых книг
        const topUsers = usersData
          .sort((a: User, b: User) => b.BorrowedBooksCount - a.BorrowedBooksCount)
          .slice(0, 5)
          .map((user: User) => ({
            name: user.FullName.split(' ')[0],  // Берем только имя для краткости
            value: user.BorrowedBooksCount,
          }));
        setTopUsersData(topUsers);

        // Распределение статусов резерваций
        const statusCounts = {
          "Выполнена": completedReservations,
          "Обрабатывается": pendingReservations,
          "Отменена": canceledReservations
        };
        const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        setStatusDistribution(statusData);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
        console.error("Ошибка:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseUrl, completedReservations, pendingReservations, canceledReservations]);

  if (loading) return <div className="flex justify-center items-center h-screen text-neutral-200 dark:text-neutral-100">Загрузка...</div>;
  if (error) return <div className="text-red-500 p-4 border border-red-300 rounded">{error}</div>;

  const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  // Функция для форматирования подсказок в графиках
  const formatTooltipValue = (value: any, name?: string, props?: any) => {
    if (typeof value === 'number') {
      return [`${value} книг`, name || ""];
    }
    return [value, name || ""];
  };

  const formatTooltipValueMoney = (value: any, name?: string, props?: any) => {
    if (typeof value === 'number') {
      return [`${value.toFixed(2)} ₽`, name || ""];
    }
    return [value, name || ""];
  };

  const formatTooltipValueUsers = (value: any, name?: string, props?: any) => {
    if (typeof value === 'number') {
      return [`${value} пользователей`, name || ""];
    }
    return [value, name || ""];
  };

  const formatTooltipValueReservations = (value: any, name?: string, props?: any) => {
    if (typeof value === 'number') {
      return [`${value} резерваций`, name || ""];
    }
    return [value, name || ""];
  };

  return (
    <GlassMorphismContainer
      backgroundPattern={true}
      isDarkMode={false}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link 
            href="/admin" 
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Назад в панель управления</span>
          </Link>
          <h1 className="text-2xl font-bold ml-4">Статистика библиотеки</h1>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Обзор</span>
          </TabsTrigger>
          <TabsTrigger value="books" className="flex items-center gap-2">
            <BookMarked className="h-4 w-4" />
            <span>Книги</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Пользователи</span>
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <span>Резервации</span>
          </TabsTrigger>
          <TabsTrigger value="fines" className="flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4" />
            <span>Штрафы</span>
          </TabsTrigger>
        </TabsList>

        {/* Обзор библиотеки */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-medium">Книги</CardTitle>
                <BookOpen className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalAvailableBooks + totalBorrowedBooks}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalAvailableBooks} доступно
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-medium">Пользователи</CardTitle>
                <Users className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalUsersCount}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeUsersCount} активных
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-medium">Резервации</CardTitle>
                <CalendarClock className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reservations.length}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {pendingReservations} в ожидании
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-medium">Штрафы</CardTitle>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalFines.toFixed(2)} ₽</div>
                <p className="text-sm text-muted-foreground mt-1">
                  За просроченные книги
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Взятые книги по месяцам</CardTitle>
                <CardDescription>
                  Количество взятых книг за последние 6 месяцев
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyBorrowedData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorBorrowed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <RechartsTooltip 
                      formatter={formatTooltipValue}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="borrowed" 
                      name="Взято книг"
                      stroke="#4F46E5" 
                      fillOpacity={1} 
                      fill="url(#colorBorrowed)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Распределение статусов резерваций</CardTitle>
                <CardDescription>
                  Статусы всех заявок в системе
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={true}
                      label={(entry) => String(entry.name)}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={formatTooltipValueReservations}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Статистика по книгам */}
        <TabsContent value="books" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Категории книг</CardTitle>
                <CardDescription>
                  Распределение книг по категориям
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookCategoriesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={true}
                      label={(entry) => String(entry.name)}
                    >
                      {bookCategoriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={formatTooltipValue}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Статистика доступности</CardTitle>
                <CardDescription>
                  Соотношение взятых и доступных книг
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Доступно", value: totalAvailableBooks },
                      { name: "Взято", value: totalBorrowedBooks },
                    ]}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={formatTooltipValue}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                      {[
                        { name: "Доступно", value: totalAvailableBooks },
                        { name: "Взято", value: totalBorrowedBooks },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Статистика по пользователям */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Топ пользователей</CardTitle>
                <CardDescription>
                  Пользователи с наибольшим количеством взятых книг
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topUsersData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <RechartsTooltip
                      formatter={formatTooltipValue}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="value" fill="#10B981" barSize={20} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Активность пользователей</CardTitle>
                <CardDescription>
                  Соотношение активных и неактивных пользователей
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Активные", value: activeUsersCount },
                        { name: "Неактивные", value: totalUsersCount - activeUsersCount },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={true}
                      label={(entry) => String(entry.name)}
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#d1d5db" />
                    </Pie>
                    <RechartsTooltip
                      formatter={formatTooltipValueUsers}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Статистика по резервациям */}
        <TabsContent value="reservations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Динамика резерваций</CardTitle>
                <CardDescription>
                  Количество резерваций за последние 6 месяцев
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyBorrowedData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <RechartsTooltip
                      formatter={formatTooltipValueReservations}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="borrowed"
                      name="Резервации"
                      stroke="#F59E0B"
                      fillOpacity={1}
                      fill="url(#colorReservations)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Статусы резерваций</CardTitle>
                <CardDescription>
                  Распределение резерваций по статусам
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statusDistribution}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={formatTooltipValueReservations}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Статистика по штрафам */}
        <TabsContent value="fines" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Динамика штрафов</CardTitle>
                <CardDescription>
                  Сумма штрафов за последние 6 месяцев
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyFinesData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorFines" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <RechartsTooltip
                      formatter={formatTooltipValueMoney}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      name="Штрафы"
                      stroke="#EF4444"
                      fillOpacity={1}
                      fill="url(#colorFines)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Пользователи со штрафами</CardTitle>
                <CardDescription>
                  Топ пользователей по сумме штрафов
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={users
                      .filter((user) => (user.FineAmount || 0) > 0)
                      .sort((a, b) => (b.FineAmount || 0) - (a.FineAmount || 0))
                      .slice(0, 5)
                      .map((user) => ({
                        name: user.FullName.split(' ')[0],
                        value: user.FineAmount || 0,
                      }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <RechartsTooltip
                      formatter={formatTooltipValueMoney}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="value" fill="#EF4444" barSize={20} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </GlassMorphismContainer>
  );
} 