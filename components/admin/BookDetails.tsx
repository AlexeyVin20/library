'use client';

import Link from "next/link";
import Image from "next/image";

interface BookDetailsProps {
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    description: string;
  }
}

export default function BookDetails({ book }: BookDetailsProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{book.title}</h1>
      <p className="mb-2 text-gray-600">Автор: {book.author}</p>
      {book.coverUrl ? (
        <div className="relative w-64 h-96 mb-4">
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="rounded object-cover"
            priority
          />
        </div>
      ) : (
        <div className="w-64 h-96 mb-4 bg-gray-300 flex items-center justify-center">
          <span>No Image</span>
        </div>
      )}
      <p className="mb-4">{book.description}</p>
      <div className="flex gap-4">
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