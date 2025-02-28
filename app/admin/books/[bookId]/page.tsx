"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import BookDetails from "@/components/admin/BookDetails";

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

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Распарсим params (Next.js 13 для серверных роутов)
  const resolvedParams = use(params);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

        const res = await fetch(`${baseUrl}/api/books/${resolvedParams.bookId}`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          setError(true);
          return;
        }

        const bookData = await res.json();
        // Если поле authors отсутствует или не строка – устанавливаем пустую строку
        if (!bookData.authors || typeof bookData.authors !== "string") {
          bookData.authors = "";
        }
        setBook(bookData);
      } catch (error) {
        console.error("Error fetching book:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [resolvedParams.bookId]);

  if (error) return notFound();
  if (loading) return <div>Загрузка...</div>;
  if (!book) return <div>Книга не найдена</div>;

  return <BookDetails book={book} />;
}
