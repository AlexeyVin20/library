"use client";

import { useRouter } from "next/navigation";
import BookForm from "@/components/admin/forms/BookForm";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BookInput } from "@/lib/admin/actions/book";
import { Shelf } from "@/lib/types";
export default function CreateBookPage() {
  const router = useRouter();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchShelves();
  }, []);
  const fetchShelves = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      const response = await fetch(`${baseUrl}/api/shelf`);
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      const data = await response.json();
      setShelves(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке полок');
      console.error("Ошибка при загрузке полок:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateBook = async (data: BookInput) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
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
  return <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Link href="/admin/books">
          <button className="px-4 py-2 bg-red-200 text-black-800 rounded hover:bg-red-300">
            Отмена
          </button>
        </Link>
      </div>
      {loading ? <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div> : error ? <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Ошибка: {error}
        </div> : <BookForm mode="create" onSubmit={handleCreateBook} isSubmitting={false} shelves={shelves} />}
    </div>;
}