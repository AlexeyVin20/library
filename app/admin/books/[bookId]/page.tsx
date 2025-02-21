"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import BookDetails from "@/components/admin/BookDetails";

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  // Если у вас появятся реальные поля:
  // genre: string;
  // rating: number;
  // totalCopies: number;
  // availableCopies: number;
  // resume: string;
}

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<boolean>(false);

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
        setBook(bookData);
      } catch (error) {
        console.error("Error fetching book:", error);
        setError(true);
      }
    };

    fetchBook();
  }, [resolvedParams.bookId]);

  if (error) return notFound();
  if (!book) return <div>Загрузка...</div>;

  return <BookDetails book={book} />;
}
