"use client";

import Link from "next/link";
import Image from "next/image";

interface BookDetailsProps {
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    description: string;
    // Если появятся реальные поля, добавьте их здесь
    // genre: string;
    // rating: number;
    // totalCopies: number;
    // availableCopies: number;
    // resume: string;
  };
}

export default function BookDetails({ book }: BookDetailsProps) {
  // Заглушки (при необходимости замените реальными данными)
  const genre = "Не указан";
  const rating = "—"; // можно, например, book.rating || "—"
  const totalCopies = "—";
  const availableCopies = "—";
  const resume = "Здесь может быть резюме книги";

  return (
    <div className="p-6 opacity-90">
      <div className="border border-gray-300 p-4 grid grid-cols-[300px_minmax(0,1fr)] gap-4">
        {/* Левая часть: обложка */}
        <div className="border border-gray-300 flex items-center justify-center relative">
          {book.coverUrl ? (
            <div className="relative w-[250px] h-[400px]">
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover rounded"
                priority
              />
            </div>
          ) : (
            <div className="w-[250px] h-[400px] bg-gray-300 flex items-center justify-center">
              <span>Нет обложки</span>
            </div>
          )}
        </div>

        {/* Правая часть: сетка из 8 блоков */}
        <div className="grid grid-cols-4 grid-rows-3 gap-4">
          {/* Первая строка (4 ячейки) */}
          <div className="border border-gray-300 p-2">
            <strong>Автор:</strong> <br />
            {book.author}
          </div>
          <div className="border border-gray-300 p-2">
            <strong>Название:</strong> <br />
            {book.title}
          </div>
          <div className="border border-gray-300 p-2">
            <strong>Жанр:</strong> <br />
            {genre}
          </div>
          <div className="border border-gray-300 p-2">
            <strong>Рейтинг и диаграмма:</strong> <br />
            {rating}
          </div>

          {/* Вторая строка (2 ячейки, каждая col-span-2) */}
          <div className="border border-gray-300 p-2 col-span-2">
            <strong>Описание:</strong> <br />
            {book.description}
          </div>
          <div className="border border-gray-300 p-2 col-span-2">
            <strong>Резюме:</strong> <br />
            {resume}
          </div>

          {/* Третья строка (2 ячейки, каждая col-span-2) */}
          <div className="border border-gray-300 p-2 col-span-2">
            <strong>Всего копий:</strong> <br />
            {totalCopies}
          </div>
          <div className="border border-gray-300 p-2 col-span-2">
            <strong>Доступно копий:</strong> <br />
            {availableCopies}
          </div>
        </div>
      </div>

      {/* Кнопки внизу */}
      <div className="flex gap-4 justify-end mt-4">
        <Link
          href={`/admin/books/${book.id}/update`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Редактировать
        </Link>
        <Link
          href="/admin/books"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          Назад
        </Link>
      </div>
    </div>
  );
}
