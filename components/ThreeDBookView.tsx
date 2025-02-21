"use client";

import Link from "next/link";
import { useState } from "react";
import BookCover from "@/components/BookCover";

interface Book {
  id: string;
  title: string;
  author?: string;
  genre?: string;
  cover_color?: string; // например, "#012B48"
  coverUrl: string;     // путь или URL к обложке
}

interface ThreeDBookViewProps {
  books: Book[];
  onDelete: (id: string) => void;
}

/**
 * 3D-режим: сетка обложек с 3D-поворотом.
 * В качестве обложки используем компонент BookCover,
 * который внутри себя рендерит SVG и картинку.
 */
export default function ThreeDBookView({ books, onDelete }: ThreeDBookViewProps) {
  return (
    <ul className="grid grid-cols-2 md:grid-cols-5 gap-6">
      {books.map((book) => (
        <li key={book.id} className="group text-white">
          {/* Контейнер с перспективой для 3D */}
          <div
            className="relative w-full h-auto overflow-hidden"
            style={{ perspective: "800px" }}
          >
            {/* Внутренний блок, который будет вращаться при наведении */}
            <div
              className="
                absolute inset-0
                transform-gpu
                transition-transform
                duration-300
                group-hover:rotate-y-0
                rotate-y-[15deg]
                preserve-3d
                flex
                items-center
                justify-center
              "
            >
              {/* Лицевая сторона (обложка), backface-hidden чтобы «изнанка» не была видна */}
              <div className="absolute inset-0 backface-hidden flex items-center justify-center">
                <BookCover
                  // Если у вас поле cover_color в базе, передавайте его сюда
                  coverColor={book.cover_color || "#012B48"}
                  coverImage={book.coverUrl}
                  variant="regular"
                />
              </div>
            </div>
          </div>

          {/* Название, автор, жанр (или любой другой текст) под обложкой */}
          <div className="mt-4 text-center">
            <p className="font-semibold text-base">
              {book.title}
              {book.author && (
                <span className="font-normal text-sm text-gray-300">
                  {" "}
                  — By {book.author}
                </span>
              )}
            </p>
            {book.genre && (
              <p className="text-sm text-gray-400">{book.genre}</p>
            )}
          </div>

          {/* Кнопки "Редактировать" и "Удалить" (опционально) */}
          <div className="mt-3 flex justify-center gap-2">
            <Link href={`/admin/books/${book.id}/update`}>
              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Редактировать
              </button>
            </Link>
            <button
              onClick={() => onDelete(book.id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Удалить
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
