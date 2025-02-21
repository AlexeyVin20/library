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
import { CreditCard, Box } from "lucide-react";
import BookCover from "@/components/BookCover";

/**
 * Компонент для отображения изображения обложки с 3D-ховер-эффектом.
 */
const BookImage = ({ src, alt, bookId }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded">
        <span className="text-gray-400">Нет обложки</span>
      </div>
    );
  }

  // Класс с 3D-эффектом
  const imageClass =
    "transform-gpu transition-transform duration-300 hover:scale-110 hover:-rotate-6 hover:shadow-xl rounded";

  const imageElement = (
    <Image
      src={src}
      alt={alt}
      width={192}
      height={192}
      className={`w-full h-48 object-cover ${imageClass}`}
      onError={() => setError(true)}
      unoptimized
    />
  );

  return bookId ? (
    <Link href={`/admin/books/${bookId}`}>{imageElement}</Link>
  ) : (
    imageElement
  );
};

/**
 * Карточки (cards) — более классический вид с фоном cover_color и обложкой слева.
 */
const CardsView = ({ books, onDelete }) => {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {books.map((book) => (
        <li
          key={book.id}
          className="border rounded shadow flex overflow-hidden relative"
          style={{ height: "190px", backgroundColor: book.coverColor || "#2f2f2f" }}
        >
          <div className="w-1/3">
            <BookImage src={book.coverUrl} alt={book.title} bookId={book.id} />
          </div>
          <div className="flex-1 p-4 text-white flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">{book.title}</h3>
              <p className="text-sm text-white/90 mb-1">{book.author}</p>
              <p className="text-xs text-white/80">{book.genre}</p>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Link href={`/admin/books/${book.id}/update`}>
                <button className="px-3 py-1 bg-white text-black rounded hover:bg-gray-100 text-bg">
                  Редактировать
                </button>
              </Link>
              <button
                onClick={() => onDelete(book.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-bg"
              >
                Удалить
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

/**
 * 3D-вид с использованием BookCover компонента
 */
const ThreeDBookView = ({ books, onDelete }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
      {books.map((book) => (
        <div key={book.id} className="group text-black">
          {/* Контейнер с перспективой для 3D-эффекта */}
          <div
            className="relative w-full h-80 overflow-hidden"
            style={{ perspective: "800px" }}
          >
            {/* Блок, который будет вращаться при ховере */}
            <div
              className="
                absolute inset-0
                transform-gpu
                transition-transform
                duration-300
                group-hover:rotate-y-0
                rotate-y-[15deg]
                preserve-3d
              "
            >
              {/* Лицевая сторона (обложка) с использованием BookCover */}
              <Link href={`/admin/books/${book.id}`}>
                <div className="absolute inset-0 backface-hidden">
                  <BookCover 
                    coverColor={book.coverColor || "#2f2f2f"}
                    coverImage={book.coverUrl}
                    variant="medium"
                    className="w-full h-full"
                  />
                </div>
              </Link>
            </div>
          </div>

          {/* Название, автор и жанр под обложкой */}
          <div className="mt-2 text-center">
            <p className="font-semibold">
              {book.title} — <span className="font-normal">By {book.author}</span>
            </p>
            {book.genre && (
              <p className="text-sm text-gray-400">{book.genre}</p>
            )}
          </div>

          {/* Кнопки "Редактировать" и "Удалить" */}
          <div className="mt-2 flex justify-center gap-2">
            <Link href={`/admin/books/${book.id}/update`}>
              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Редактировать
              </button>
            </Link>
            <button
              onClick={() => onDelete(book.id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ViewModeMenu остается без изменений
const ViewModeMenu = ({ viewMode, setViewMode }) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            {viewMode === "cards" && <CreditCard className="mr-2 h-4 w-4" />}
            {viewMode === "3d" && <Box className="mr-2 h-4 w-4" />}
            Вид
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-2 p-4">
              <button
                onClick={() => setViewMode("cards")}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
              >
                <CreditCard className="h-4 w-4" />
                Карточки
              </button>
              <button
                onClick={() => setViewMode("3d")}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
              >
                <Box className="h-4 w-4" />
                3D вид
              </button>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

// Основной компонент страницы остается без изменений
export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("cards");

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

  // Удаление
  const handleDelete = async (id) => {
    if (!confirm("Вы уверены, что хотите удалить эту книгу?")) return;
    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Книга удалена",
          description: "Книга успешно удалена",
        });
        setBooks((prev) => prev.filter((book) => book.id !== id));
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить книгу",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении книги:", error);
      toast({
        title: "Ошибка",
        description: "Ошибка при удалении книги",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 opacity-90">
      {/* Шапка */}
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

      {/* Отображение книг */}
      {viewMode === "cards" && (
        <CardsView books={sortedBooks} onDelete={handleDelete} />
      )}
      {viewMode === "3d" && (
        <ThreeDBookView books={sortedBooks} onDelete={handleDelete} />
      )}
    </div>
  );
}