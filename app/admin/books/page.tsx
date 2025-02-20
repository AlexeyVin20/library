// app/books/[bookId]/page.tsx (или, если это страница списка книг – app/books/page.tsx)
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { List, Grid2X2, CreditCard, LayoutList } from "lucide-react";

// Компонент для обработки загрузки изображения с ошибкой
const BookImage = ({ src, alt }: { src: string; alt: string }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded">
        <span className="text-gray-400">Нет обложки</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={192}
      height={192}
      className="w-full h-48 object-cover rounded"
      onError={() => setError(true)}
      unoptimized
    />
  );
};

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");

  // Получаем книги из API при монтировании компонента
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch("/api/books");
        if (res.ok) {
          const data = await res.json();
          setBooks(data);
        } else {
          console.error("Ошибка получения книг");
        }
      } catch (error) {
        console.error("Ошибка получения книг", error);
      }
    };

    fetchBooks();
  }, []);

  // Фильтрация и сортировка
  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedBooks = filteredBooks.sort((a, b) =>
    sortOrder === "asc"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  );

  // Обработчик удаления книги
  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту книгу?")) return;
    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Книга удалена", description: "Книга успешно удалена" });
        setBooks((prev) => prev.filter((book) => book.id !== id));
      } else {
        toast({ title: "Ошибка", description: "Не удалось удалить книгу", variant: "destructive" });
      }
    } catch (error) {
      console.error("Ошибка при удалении книги:", error);
      toast({ title: "Ошибка", description: "Ошибка при удалении книги", variant: "destructive" });
    }
  };

  return (
    <div className="p-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Все книги</h1>
          <p className="text-sm text-gray-500">Список всех книг в библиотеке</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/books/create">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Добавить книгу
            </button>
          </Link>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Сортировка {sortOrder === "asc" ? "▲" : "▼"}
          </button>
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <ViewModeMenu viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </header>

      {viewMode === "grid" && (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBooks.map((book) => (
            <li key={book.id} className="border rounded shadow p-4 relative">
              <BookImage src={book.coverUrl} alt={book.title} />
              <h3 className="text-xl font-bold">{book.title}</h3>
              <p className="text-gray-600">{book.author}</p>
              <p className="mt-2 text-sm text-gray-500">
                {book.description.slice(0, 100)}...
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Link href={`/admin/books/${book.id}/update`}>
                  <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                    Редактировать
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(book.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewMode === "list" && (
        <ul className="divide-y">
          {sortedBooks.map((book) => (
            <li key={book.id} className="py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{book.title}</h3>
                <p className="text-gray-600">{book.author}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/books/${book.id}/update`}>
                  <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                    Редактировать
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(book.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewMode === "cards" && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {sortedBooks.map((book) => (
            <li key={book.id} className="border rounded shadow p-4">
              <div className="flex gap-4">
                <BookImage src={book.coverUrl} alt={book.title} />
                <div>
                  <h3 className="text-xl font-bold">{book.title}</h3>
                  <p className="text-gray-600">{book.author}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    {book.description.slice(0, 80)}...
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/admin/books/${book.id}/update`}>
                      <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                        Редактировать
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewMode === "detailed" && (
        <div className="space-y-4">
          {sortedBooks.map((book) => (
            <div key={book.id} className="border rounded shadow p-4 flex gap-4">
              <BookImage src={book.coverUrl} alt={book.title} />
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{book.title}</h3>
                <p className="text-lg text-gray-600">{book.author}</p>
                <p className="mt-2 text-gray-500">{book.description}</p>
                <div className="mt-4 flex gap-2">
                  <Link href={`/admin/books/${book.id}/update`}>
                    <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                      Редактировать
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ViewModeMenu = ({
  viewMode,
  setViewMode,
}: {
  viewMode: string;
  setViewMode: (mode: string) => void;
}) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            {viewMode === "list" && <List className="mr-2 h-4 w-4" />}
            {viewMode === "grid" && <Grid2X2 className="mr-2 h-4 w-4" />}
            {viewMode === "cards" && <CreditCard className="mr-2 h-4 w-4" />}
            {viewMode === "detailed" && <LayoutList className="mr-2 h-4 w-4" />}
            Вид
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-2 p-4">
              <button
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
              >
                <List className="h-4 w-4" /> Список
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
              >
                <Grid2X2 className="h-4 w-4" /> Сетка
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
              >
                <CreditCard className="h-4 w-4" /> Карточки
              </button>
              <button
                onClick={() => setViewMode("detailed")}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
              >
                <LayoutList className="h-4 w-4" /> Подробно
              </button>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
