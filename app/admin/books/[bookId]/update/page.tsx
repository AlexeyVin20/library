// app/admin/books/[bookId]/update/page.tsx
import BookForm from "@/components/admin/forms/BookForm";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = {
  params: { bookId: string };
};

export default async function UpdateBookPage({ params }: Params) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/books/${params.bookId}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    notFound();
  }

  const book = await res.json();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Редактировать книгу</h2>
        <Link href={`/admin/books/${book.id}`}>
          <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            Назад
          </button>
        </Link>
      </div>
      {/* Передаём данные книги в форму */}
      <BookForm type="update" {...book} />
    </div>
  );
}
