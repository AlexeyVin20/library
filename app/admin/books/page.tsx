"use client";

import { useState } from "react";
import { sampleBooks } from "@/constants";
import Link from "next/link";

export default function BooksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");

  // Фильтрация книг по поисковому запросу (по названию)
  const filteredBooks = sampleBooks.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Сортировка книг по заголовку
  const sortedBooks = filteredBooks.sort((a, b) => {
    if (sortOrder === "asc") {
      return a.title.localeCompare(b.title);
    } else {
      return b.title.localeCompare(a.title);
    }
  });

  return (
    <div className="p-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Все книги</h1>
          <p className="text-sm text-gray-500">Список всех книг в библиотеке</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/books/create">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Добавить книгу
            </button>
          </Link>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Сортировка {sortOrder === "asc" ? "▲" : "▼"}
          </button>
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 border rounded ${
                viewMode === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-800"
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 border rounded ${
                viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white text-gray-800"
              }`}
            >
              Сетка
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-2 border rounded ${
                viewMode === "cards" ? "bg-blue-600 text-white" : "bg-white text-gray-800"
              }`}
            >
              Карточки
            </button>
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-3 py-2 border rounded ${
                viewMode === "detailed" ? "bg-blue-600 text-white" : "bg-white text-gray-800"
              }`}
            >
              Подробно
            </button>
          </div>
        </div>
      </header>

      {viewMode === "grid" && (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBooks.map((book) => (
            <li key={book.id} className="border rounded shadow p-4 relative">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-48 object-cover mb-3 rounded"
              />
              <h3 className="text-xl font-bold">{book.title}</h3>
              <p className="text-gray-600">{book.author}</p>
              <p className="mt-2 text-sm text-gray-500">
                {book.description.slice(0, 100)}...
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                  Редактировать
                </button>
                <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewMode === "list" && (
        <ul className="divide-y">
          {sortedBooks.map((book) => (
            <li key={book.id} className="py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{book.title}</h3>
                <p className="text-gray-600">{book.author}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                  Редактировать
                </button>
                <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewMode === "cards" && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {sortedBooks.map((book) => (
            <li key={book.id} className="border rounded shadow p-4">
              <div className="flex gap-4">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-24 h-32 object-cover rounded"
                />
                <div>
                  <h3 className="text-xl font-bold">{book.title}</h3>
                  <p className="text-gray-600">{book.author}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    {book.description.slice(0, 80)}...
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                      Редактировать
                    </button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewMode === "detailed" && (
        <div className="space-y-4">
          {sortedBooks.map((book) => (
            <div key={book.id} className="border rounded shadow p-4 flex gap-4">
              <img
                src={book.cover}
                alt={book.title}
                className="w-32 h-40 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{book.title}</h3>
                <p className="text-lg text-gray-600">{book.author}</p>
                <p className="mt-2 text-gray-500">{book.description}</p>
                <div className="mt-4 flex gap-2">
                  <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                    Редактировать
                  </button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
