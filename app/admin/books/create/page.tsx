'use client';

import useSWR from 'swr';
import { useRouter } from "next/navigation";
export const dynamic = 'force-dynamic';

import BookForm from "@/components/admin/forms/BookForm";
import Link from "next/link";
import { useState } from "react";
import { BookInput } from "@/lib/admin/actions/book";
import { Shelf } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Ошибка при загрузке данных');
  return res.json();
};

export default function CreateBookPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const { data: shelves, error: shelvesError, isLoading } = useSWR<Shelf[]>(
    baseUrl ? `${baseUrl}/api/shelf` : null,
    fetcher
  );

  const handleCreateBook = async (data: BookInput) => {
    if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
    try {
      console.log("Отправляем данные книги:", data);
      const res = await fetch(`${baseUrl}/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Ошибка ответа сервера:", errorText);
        throw new Error("Не удалось создать книгу");
      }
      const newBook = await res.json();
      router.push(`/admin/books/${newBook.id}`);
    } catch (error) {
      console.error("Ошибка при создании книги:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <Link href="/admin/books">
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            Отмена
          </button>
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : shelvesError ? (
        <div className="bg-red-100 border border-red-500 text-red-800 px-4 py-3 rounded-lg mb-4">
          Ошибка: {shelvesError.message}
        </div>
      ) : (
        <BookForm 
          mode="create" 
          onSubmit={handleCreateBook} 
          isSubmitting={false} 
          shelves={shelves || []}
        />
      )}
    </div>
  );
}