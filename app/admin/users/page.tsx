"use client";

import React from "react";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  booksOnHand: number;
  nextReturnDate: string;
  nextReturnBook: string;
}

// Пример данных (замените на реальные данные)
const users: User[] = [
  {
    id: 1,
    name: "Иван Иванов",
    email: "ivan@example.com",
    booksOnHand: 3,
    nextReturnDate: "2025-03-10",
    nextReturnBook: "Война и мир",
  },
  {
    id: 2,
    name: "Петр Петров",
    email: "petr@example.com",
    booksOnHand: 2,
    nextReturnDate: "2025-03-15",
    nextReturnBook: "Преступление и наказание",
  },
  {
    id: 3,
    name: "Мария Смирнова",
    email: "maria@example.com",
    booksOnHand: 1,
    nextReturnDate: "2025-03-20",
    nextReturnBook: "Мастер и Маргарита",
  },
  {
    id: 4,
    name: "Алексей Соколов",
    email: "aleksey@example.com",
    booksOnHand: 4,
    nextReturnDate: "2025-03-18",
    nextReturnBook: "Анна Каренина",
  },
  // можно добавить ещё пользователей
];

export default function AllUsersPage() {
  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <p className="text-sm text-gray-500">
          Список пользователей с информацией о взятых книгах
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/admin/users/${user.id}`}
            className="block bg-white shadow rounded p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-gray-700">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="text-sm">
              <p>
                <span className="font-medium">Книг на руках:</span> {user.booksOnHand}
              </p>
              <p>
                <span className="font-medium">Ближайший возврат:</span> {user.nextReturnDate}
              </p>
              <p>
                <span className="font-medium">Книга:</span> {user.nextReturnBook}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
