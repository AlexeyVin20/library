"use client";

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import BookDetails from "@/components/admin/BookDetails";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  description: string;
}

export default async function BookDetailPage({
  params: { bookId },
}: {
  params: { bookId: string };
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

  try {
    const res = await fetch(`${baseUrl}/api/books/${bookId}`, {
      headers: { "Content-Type": "application/json" },
      cache: 'no-store'
    });

    if (!res.ok) {
      return notFound();
    }

    const book: Book = await res.json();
    return <BookDetails book={book} />;
    
  } catch (error) {
    console.error("Error fetching book:", error);
    return notFound();
  }
}
