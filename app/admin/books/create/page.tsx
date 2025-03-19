"use client";

import { useRouter } from "next/navigation";
import BookForm from "@/components/admin/forms/BookForm";
import Link from "next/link";

export default function CreateBookPage() {
  const router = useRouter();

  const handleCreateBook = async (data) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
    
    try {
      const res = await fetch(`${baseUrl}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error("Не удалось создать книгу");
      }
      
      const newBook = await res.json();
      router.push(`/admin/books/${newBook.id}`);
    } catch (error) {
      console.error("Ошибка при создании книги:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Link href="/admin/books">
          <button className="px-4 py-2 bg-red-200 text-black-800 rounded hover:bg-red-300">
            Отмена
          </button>
        </Link>
      </div>
      <BookForm type="create" onSubmit={handleCreateBook} isSubmitting={false} />
    </div>
  );
}
