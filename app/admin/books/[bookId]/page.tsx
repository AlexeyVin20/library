"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import BookDetails from "@/components/admin/BookDetails";

// Theme classes aligned with DashboardPage's "cosmic" theme
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
        console.log("Book detail API response:", bookData);
        
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
  if (loading) return <div className="text-center text-neutral-500 dark:text-neutral-400">Загрузка...</div>;
  if (!book) return <div className="text-center text-neutral-500 dark:text-neutral-400">Книга не найдена</div>;

  return <BookDetails book={book} />;
}