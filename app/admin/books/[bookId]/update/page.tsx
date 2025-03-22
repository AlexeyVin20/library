"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import BookForm from "@/components/admin/forms/BookForm"; // Предполагается, что у вас есть этот компонент
import { Shelf } from "@/lib/types";

// Интерфейс Book
interface Book {
  id: string;
  title: string;
  authors: string;
  genre?: string | null;
  categorization?: string | null;
  isbn: string;
  cover?: string | null;
  description?: string | null;
  summary?: string | null;
  publicationYear?: number | null;
  publisher?: string | null;
  pageCount?: number | null;
  language?: string | null;
  availableCopies: number;
  dateAdded?: string;
  dateModified?: string;
}

export default function BookUpdatePage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const router = useRouter();

  // Распарсим params
  const resolvedParams = use(params);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

        // Загружаем книгу
        const bookRes = await fetch(`${baseUrl}/api/books/${resolvedParams.bookId}`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!bookRes.ok) {
          setError(true);
          return;
        }

        const bookData = await bookRes.json();
        setBook(bookData);
        
        // Загружаем полки
        const shelvesRes = await fetch(`${baseUrl}/api/shelf`);
        if (shelvesRes.ok) {
          const shelvesData = await shelvesRes.json();
          setShelves(shelvesData);
        } else {
          console.error("Ошибка при загрузке полок:", shelvesRes.statusText);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.bookId]);

  const handleSubmit = async (updatedBook: Omit<Book, 'id' | 'dateAdded' | 'dateModified'>) => {
    if (!book) return;
    
    setUpdating(true);
    setUpdateError(null);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

      const res = await fetch(`${baseUrl}/api/books/${book.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBook),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Не удалось обновить книгу");
      }

      // Перенаправляем на страницу деталей книги после успешного обновления
      router.push(`/admin/books/${book.id}`);
      router.refresh(); // Обновляем кэш Next.js
    } catch (error) {
      console.error("Error updating book:", error);
      setUpdateError(error instanceof Error ? error.message : "Произошла ошибка при обновлении книги");
    } finally {
      setUpdating(false);
    }
  };

  if (error) return notFound();
  if (loading) return <div>Загрузка...</div>;
  if (!book) return <div>Книга не найдена</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Редактирование книги</h1>
      
      {updateError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {updateError}
        </div>
      )}
      
      <BookForm 
        initialData={book} 
        onSubmit={handleSubmit} 
        isSubmitting={updating} 
        mode="update"
        shelves={shelves}
      />
      
      <div className="mt-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}