"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import BookDetails from "@/components/admin/BookDetails";

// Theme classes aligned with DashboardPage's new blue theme
interface Book {
  id: string;
  title: string;
  authors: string;
  isbn: string;
  genre?: string | null;
  categorization?: string | null;
  cover?: string | null;
  description?: string | null;
  publicationYear?: number | null;
  publisher?: string | null;
  pageCount?: number | null;
  language?: string | null;
  availableCopies: number;
  shelfId?: number;
  edition?: string | null;
  price?: number | null;
  format?: string | null;
  originalTitle?: string | null;
  originalLanguage?: string | null;
  isEbook?: boolean;
  condition?: string | null;
  rating?: number;
  readCount?: number;
  series?: string | null;
  seriesOrder?: number;
  dateRead?: string | null;
  purchaseLink?: string | null;
  dateAdded?: string;
  dateModified?: string;
}

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const resolvedParams = use(params);

  const updateBookInfo = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

      // Получаем токен для авторизации
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        
        // Принудительно пересчитываем количество доступных копий через API
        try {
          const recalculateResponse = await fetch(`${baseUrl}/api/BookInstance/recalculate/${resolvedParams.bookId}`, {
            method: 'POST',
            headers
          });
          
          if (recalculateResponse.ok) {
            console.log("Количество копий пересчитано принудительно на странице просмотра книги");
          } else {
            console.warn("Не удалось пересчитать количество копий через API на странице просмотра книги");
          }
        } catch (recalculateError) {
          console.warn("Ошибка при принудительном пересчете на странице просмотра книги:", recalculateError);
        }
      }

      const res = await fetch(`${baseUrl}/api/books/${resolvedParams.bookId}`, { headers });

      if (!res.ok) {
        setError(true);
        return;
      }

      const bookData = await res.json();
      console.log("Book detail API response (updated):", bookData);
      
      if (!bookData.authors || typeof bookData.authors !== "string") {
        bookData.authors = "";
      }
      setBook(bookData);
      console.log("Обновлена информация о книге на странице просмотра, доступные копии:", bookData.availableCopies);
    } catch (error) {
      console.error("Error updating book info:", error);
    }
  };

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        await updateBookInfo();
      } catch (error) {
        console.error("Error fetching book:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();

    // Слушаем обновления экземпляров книги
    const handleInstancesUpdate = (event: CustomEvent) => {
      const { bookId: updatedBookId, action, remainingInstances } = event.detail;
      if (updatedBookId === resolvedParams.bookId) {
        console.log(`Обновляем данные книги после изменения экземпляров. Действие: ${action}, осталось экземпляров: ${remainingInstances}`);
        updateBookInfo();
      }
    };

    window.addEventListener('bookInstancesUpdated', handleInstancesUpdate as EventListener);

    return () => {
      window.removeEventListener('bookInstancesUpdated', handleInstancesUpdate as EventListener);
    };
  }, [resolvedParams.bookId]);

  if (error) return notFound();
  if (loading) return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="text-center text-gray-500">Загрузка...</div>
    </div>
  );
  if (!book) return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="text-center text-gray-500">Книга не найдена</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-200">
      <BookDetails book={book} />
    </div>
  );
}