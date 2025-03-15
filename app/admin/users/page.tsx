"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string; // Guid из API
  fullName: string;
  email: string;
  borrowedBooksCount: number;
  isActive: boolean;
}

interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  book?: { title: string; }
}

export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        
        // Параллельно загружаем пользователей и резервации
        const [usersResponse, reservationsResponse] = await Promise.all([
          fetch(`${baseUrl}/api/User`),
          fetch(`${baseUrl}/api/Reservation`)
        ]);

        if (!usersResponse.ok) throw new Error(`Ошибка загрузки пользователей: ${usersResponse.status}`);
        if (!reservationsResponse.ok) throw new Error(`Ошибка загрузки резерваций: ${reservationsResponse.status}`);

        const usersData = await usersResponse.json();
        const reservationsData = await reservationsResponse.json();
        
        setUsers(usersData);
        setReservations(reservationsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных');
        console.error('Ошибка загрузки данных:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Для каждого пользователя находим ближайшую дату возврата книги
  const usersWithNextReturn = users.map(user => {
    // Находим резервации данного пользователя со статусом Approved
    const userReservations = reservations.filter(
      r => r.userId === user.id && r.status === "Approved"
    );
    
    // Сортируем по дате и берем ближайшую
    const nextReservation = userReservations.length > 0 
      ? userReservations.sort((a, b) => 
          new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
        )[0]
      : null;
      
    return {
      ...user,
      nextReturnDate: nextReservation?.expirationDate 
        ? new Date(nextReservation.expirationDate).toLocaleDateString() 
        : 'Нет',
      nextReturnBook: nextReservation?.book?.title || 'Нет'
    };
  });

  if (loading) return <div className="text-center p-8">Загрузка...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Ошибка: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Все пользователи</h1>
        <Link href="/admin/users/create">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
            Добавить пользователя
          </button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usersWithNextReturn.map(user => (
          <div key={user.id} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-2">
              <Link href={`/admin/users/${user.id}`}>
                {user.fullName}
              </Link>
            </h2>
            <p className="text-gray-600 mb-2">{user.email}</p>
            <p className="mb-1">Книг на руках: {user.borrowedBooksCount}</p>
            <p className="mb-1">Ближайший возврат: {user.nextReturnDate}</p>
            <p className="mb-1">Книга: {user.nextReturnBook}</p>
            <p className="mt-2">
              <span className={`px-2 py-1 rounded text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user.isActive ? 'Активен' : 'Заблокирован'}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
