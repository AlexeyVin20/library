"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import BookDetails from "@/components/admin/BookDetails";

// Theme classes aligned with DashboardPage's "cosmic" theme
interface Book {
  Id: string;
  Title: string;
  Authors: string;
  ISBN: string;
  Genre?: string | null;
  Categorization?: string | null;
  Cover?: string | null;
  Description?: string | null;
  PublicationYear?: number | null;
  Publisher?: string | null;
  PageCount?: number | null;
  Language?: string | null;
  AvailableCopies: number;
  ShelfId?: number;
  Edition?: string | null;
  Price?: number | null;
  Format?: string | null;
  OriginalTitle?: string | null;
  OriginalLanguage?: string | null;
  IsEbook?: boolean;
  Condition?: string | null;
  Rating?: number;
  ReadCount?: number;
  Series?: string | null;
  SeriesOrder?: number;
  DateRead?: string | null;
  PurchaseLink?: string | null;
  DateAdded?: string;
  DateModified?: string;
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