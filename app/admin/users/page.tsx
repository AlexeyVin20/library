"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, UserPlus, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsersPieChart } from "@/components/admin/UsersPieChart";
import { UserBorrowingChart } from "@/components/admin/UserBorrowingChart";
import { FinesChart } from "@/components/admin/FinesChart";
import GlassMorphismContainer from '@/components/admin/GlassMorphismContainer';

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  borrowedBooksCount: number;
  maxBooksAllowed: number;
  fineAmount: number;
  isActive: boolean;
  phone: string;
  role: string;
}

interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  book?: { title: string };
}

export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof User>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
        
        const [usersResponse, reservationsResponse] = await Promise.all([
          fetch(`${baseUrl}/api/User`),
          fetch(`${baseUrl}/api/Reservation`),
        ]);
        
        if (!usersResponse.ok) throw new Error(`Ошибка загрузки пользователей: ${usersResponse.status}`);
        if (!reservationsResponse.ok) throw new Error(`Ошибка загрузки резерваций: ${reservationsResponse.status}`);
        
        const usersData = await usersResponse.json();
        const reservationsData = await reservationsResponse.json();
        
        setUsers(usersData);
        setReservations(reservationsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
        console.error("Ошибка загрузки данных:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Подготовка данных для отображения
  const usersWithNextReturn = users.map((user) => {
    const userReservations = reservations.filter(
      (r) => r.userId === user.id && r.status === "Выполнена"
    );
    
    const nextReservation = userReservations.length > 0
      ? userReservations.sort(
          (a, b) => 
            new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
        )[0]
      : null;
    
    return {
      ...user,
      nextReturnDate: nextReservation?.expirationDate 
        ? new Date(nextReservation.expirationDate).toLocaleDateString("ru-RU")
        : "Нет",
      nextReturnBook: nextReservation?.book?.title || "Нет",
    };
  });

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = usersWithNextReturn.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Сортировка пользователей
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Статистика для графиков
  const activeUsersCount = users.filter(u => u.isActive).length;
  const inactiveUsersCount = users.length - activeUsersCount;
  
  const totalBorrowed = users.reduce((sum, user) => sum + user.borrowedBooksCount, 0);
  const totalFines = users.reduce((sum, user) => sum + (user.fineAmount || 0), 0);
  
  // Данные для графика штрафов
  const usersWithFines = users.filter(u => u.fineAmount > 0);
  const finesData = usersWithFines.map(u => ({
    name: u.fullName,
    value: u.fineAmount
  }));

  // Данные для графика использования библиотеки
  const borrowingChartData = {
    borrowed: totalBorrowed,
    available: users.reduce((sum, user) => sum + (user.maxBooksAllowed - user.borrowedBooksCount), 0),
    reservations: reservations.filter(r => r.status === "Обрабатывается").length
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
      const response = await fetch(`${baseUrl}/api/User/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Ошибка при удалении пользователя");
      setUsers(users.filter(user => user.id !== id));
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      alert(err instanceof Error ? err.message : "Ошибка при удалении пользователя");
    }
  };

  if (loading) return (
    <GlassMorphismContainer>
      <div className="flex justify-center items-center h-screen text-neutral-500 dark:text-neutral-200">
        Загрузка...
      </div>
    </GlassMorphismContainer>
  );

  if (error) return (
    <GlassMorphismContainer>
      <div className="p-4 bg-red-100/80 dark:bg-red-900/80 backdrop-blur-xl border border-red-400 text-red-700 dark:text-red-200 rounded-lg">
        {error}
      </div>
    </GlassMorphismContainer>
  );

  return (
    <GlassMorphismContainer>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-neutral-500 dark:text-neutral-200">
            Пользователи
          </h1>
          <div className="flex gap-4">
            <Link 
              href="/admin/users/create"
              className="bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
            >
              Добавить пользователя
            </Link>
            <Link 
              href="/admin"
              className="bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
            >
              Назад
            </Link>
          </div>
        </div>

        {/* Графики статистики */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Активность пользователей</CardTitle>
              <CardDescription>Распределение активных/неактивных</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersPieChart activeUsers={activeUsersCount} inactiveUsers={inactiveUsersCount} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Использование библиотеки</CardTitle>
              <CardDescription>Статистика по всем пользователям</CardDescription>
            </CardHeader>
            <CardContent>
              <UserBorrowingChart data={borrowingChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Штрафы пользователей</CardTitle>
              <CardDescription>Общая сумма: {totalFines.toFixed(2)} ₽</CardDescription>
            </CardHeader>
            <CardContent>
              <FinesChart data={finesData} />
            </CardContent>
          </Card>
        </div>

        {/* Поиск */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Поиск по имени или email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-admin"
          />
        </div>

        {/* Список пользователей */}
        <div className="grid gap-6">
          {sortedUsers.map((user) => (
            <div
              key={user.id}
              className="bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-500 dark:text-neutral-200">
                      {user.fullName}
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-300 mt-1">
                      {user.email}
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-300">
                      {user.phone}
                    </p>
                  </div>

                  <div className="bg-white/20 dark:bg-neutral-700/20 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Роль</p>
                        <p className="text-neutral-700 dark:text-neutral-200">{user.role}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Взято книг</p>
                        <p className="text-neutral-700 dark:text-neutral-200">
                          {user.borrowedBooksCount} / {user.maxBooksAllowed}
                        </p>
                      </div>
                      {user.fineAmount && user.fineAmount > 0 && (
                        <div className="col-span-2">
                          <p className="text-sm text-red-500 dark:text-red-400">Штраф</p>
                          <p className="text-red-600 dark:text-red-300">{user.fineAmount} ₽</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2 text-center"
                  >
                    Подробнее
                  </Link>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="bg-gradient-to-r from-red-600/90 to-red-700/70 dark:from-red-700/80 dark:to-red-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Нет пользователей, соответствующих критериям поиска
          </div>
        )}
      </div>
    </GlassMorphismContainer>
  );
}
