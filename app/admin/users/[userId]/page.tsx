"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface BorrowedBook {
  id: number;
  title: string;
  author: string;
  returnDate: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  borrowedBooks: BorrowedBook[];
}

// Пример данных (замените на реальные, возможно, загрузив по userId)
const dummyUserProfile: UserProfile = {
  id: 1,
  name: "Иван Иванов",
  email: "ivan@example.com",
  phone: "+7 123 456 7890",
  address: "г. Москва, ул. Пушкина, д. 10",
  borrowedBooks: [
    { id: 1, title: "Война и мир", author: "Лев Толстой", returnDate: "2025-03-10" },
    { id: 2, title: "Мастер и Маргарита", author: "Михаил Булгаков", returnDate: "2025-03-20" },
  ],
};

export default function UserProfilePage() {
  const params = useParams();
  // В реальном приложении здесь производится загрузка данных пользователя по params.userId
  const user: UserProfile = dummyUserProfile;

  return (
    <div className="p-6">
      <Link
        href="/admin/users"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Назад к списку пользователей
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Левая колонка: Карта с информацией о пользователе */}
        <div className="md:col-span-1 bg-white shadow rounded p-4">
          <div className="flex items-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-700">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="text-sm">
            {user.phone && (
              <p>
                <span className="font-medium">Телефон:</span> {user.phone}
              </p>
            )}
            {user.address && (
              <p>
                <span className="font-medium">Адрес:</span> {user.address}
              </p>
            )}
          </div>
        </div>
        {/* Правая колонка: Список книг, которые пользователь брал */}
        <div className="md:col-span-2 bg-white shadow rounded p-4">
          <h3 className="text-xl font-semibold mb-4">Взятые книги</h3>
          {user.borrowedBooks.length === 0 ? (
            <p>Пользователь не брал книги</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.borrowedBooks.map((book) => (
                <div key={book.id} className="border rounded p-4">
                  <h4 className="text-lg font-semibold">{book.title}</h4>
                  <p className="text-sm text-gray-500">Автор: {book.author}</p>
                  <p className="text-sm text-gray-500">Дата возврата: {book.returnDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
