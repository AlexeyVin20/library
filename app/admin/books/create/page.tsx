"use client";

import BookForm from "@/components/admin/forms/BookForm";
import Link from "next/link";

export default function CreateBookPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Добавить новую книгу</h2>
        <Link href="/admin/books">
          <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            Отмена
          </button>
        </Link>
      </div>
      <BookForm type="create" />
    </div>
  );
}
