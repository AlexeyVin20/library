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
import { CreditCard, Box, BookOpen, List } from "lucide-react";
import BookCover from "@/components/BookCover";
import GlassMorphismContainer from '@/components/admin/GlassMorphismContainer';
import "@/styles/admin.css";

/**
 * Interface for book item
 */
interface BookItem {
  id: string;
  title: string;
  authors?: string;
  genre?: string;
  cover?: string;
  availableCopies?: number;
}

/**
 * Props interfaces for components
 */
interface BookImageProps {
  src?: string;
  alt: string;
  bookId?: string;
}

interface ViewProps {
  books: BookItem[];
  onDelete: (id: string) => void;
  themeClasses: Record<string, any>;
}

interface ViewModeMenuProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
  themeClasses: Record<string, any>;
}

/**
 * Theme classes с эффектом glassmorphism
 */
const getThemeClasses = () => {
  return {
    card: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300 h-full flex flex-col",
    statsCard: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between",
    mainContainer: "bg-gray-100/70 dark:bg-neutral-900/70 backdrop-blur-xl min-h-screen p-6",
    button: "bg-gradient-to-r from-primary-admin/90 to-primary-admin/70 dark:from-primary-admin/80 dark:to-primary-admin/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-5 py-3 flex items-center justify-center gap-2",
    bookCard: "flex p-4 bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl rounded-lg border border-white/30 dark:border-neutral-700/30 mb-3 transition-all duration-300 hover:shadow-lg hover:-translate-x-1",
    sectionTitle: "text-2xl font-bold mb-4 text-neutral-500 dark:text-white border-b pb-2 border-white/30 dark:border-neutral-700/30",
    input: "max-w-xs bg-gradient-to-br from-white/40 to-white/30 dark:from-neutral-800/40 dark:to-neutral-900/30 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-4 py-2 text-neutral-700 dark:text-white",
    menu: "backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/30 dark:from-neutral-800/40 dark:to-neutral-900/30 p-3 rounded-lg border border-white/30 dark:border-neutral-700/30 shadow-lg",
    menuItem: "block p-2 rounded-md hover:bg-white/20 dark:hover:bg-neutral-700/20 transition-colors text-neutral-700 dark:text-white",
    tableRow: {
      even: "bg-gradient-to-r from-gray-50/30 to-gray-50/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-sm",
      odd: "bg-gradient-to-r from-white/30 to-white/20 dark:from-neutral-700/30 dark:to-neutral-800/20 backdrop-blur-sm",
    },
    actionButton: {
      approve: "bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2 flex items-center justify-center gap-2",
      reject: "bg-gradient-to-r from-red-600/90 to-red-700/70 dark:from-red-700/80 dark:to-red-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2 flex items-center justify-center gap-2",
      neutral: "bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2 flex items-center justify-center gap-2",
    },
  };
};

/**
 * BookImage component with DashboardPage-style hover effects
 */
const BookImage = ({ src, alt, bookId }: BookImageProps) => {
  const [error, setError] = useState(false);
  const themeClasses = getThemeClasses();

  if (error || !src) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl rounded-lg">
        <BookOpen className="text-neutral-500 dark:text-neutral-400 w-12 h-12" />
      </div>
    );
  }

  const imageElement = (
    <div className="overflow-hidden rounded-xl group">
      <Image
        src={src}
        alt={alt}
        width={192}
        height={192}
        className="w-full h-48 object-cover transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );

  return bookId ? (
    <Link href={`/admin/books/${bookId}`}>{imageElement}</Link>
  ) : (
    imageElement
  );
};

/**
 * CardsView with DashboardPage-style cards
 */
const CardsView = ({ books, onDelete, themeClasses }: ViewProps) => {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
      {books.map((book) => (
        <li key={book.id} className={`${themeClasses.bookCard} flex overflow-hidden`}>
          <div className="w-1/3 p-4">
            <BookImage src={book.cover} alt={book.title} bookId={book.id} />
          </div>
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-700 dark:text-white">{book.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{book.authors}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{book.genre || ""}</p>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Link href={`/admin/books/${book.id}/update`}>
                <button className={themeClasses.actionButton.neutral}>Редактировать</button>
              </Link>
              <button
                onClick={() => onDelete(book.id)}
                className={themeClasses.actionButton.reject}
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
 * ThreeDBookView with DashboardPage-style 3D effects
 */
const ThreeDBookView = ({ books, onDelete, themeClasses }: ViewProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6 p-6">
      {books.map((book) => (
        <div key={book.id} className="group text-neutral-700 dark:text-white">
          <div className="relative w-full h-96 overflow-visible" style={{ perspective: "1000px" }}>
            <div className="absolute inset-0 transform-gpu transition-all duration-500 group-hover:rotate-y-0 rotate-y-[15deg] preserve-3d group-hover:scale-105">
              <Link href={`/admin/books/${book.id}`}>
                <BookCover
                  coverColor="rgba(47, 47, 47, 0.5)"
                  coverImage={book.cover || ""}
                  variant="medium"
                  className="bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] w-full h-full"
                />
              </Link>
            </div>
          </div>
          <div className={`${themeClasses.card} mt-2 text-center p-3`}>
            <p className="font-semibold line-clamp-1">
            <span className="font-normal text-neutral-700 dark:text-white"> {book.title}{" "} </span>
              <span className="font-normal text-neutral-600 dark:text-neutral-300">— {book.authors}</span>
            </p>
            {book.genre && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{book.genre}</p>
            )}
          </div>
          <div className="mt-2 flex justify-center gap-2">
            <Link href={`/admin/books/${book.id}/update`}>
              <button className={themeClasses.actionButton.neutral}>Редактировать</button>
            </Link>
            <button
              onClick={() => onDelete(book.id)}
              className={themeClasses.actionButton.reject}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * ListView component for books
 */
const ListView = ({ books, onDelete, themeClasses }: ViewProps) => {
  return (
    <div className="overflow-x-auto p-6">
      <table className="min-w-full divide-y divide-gray-200/50 dark:divide-neutral-700/50">
        <thead className="bg-gradient-to-r from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-sm rounded-t-lg">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider w-12"></th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Название</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Автор</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Жанр</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200/50 dark:divide-neutral-700/50">
          {books.map((book, index) => (
            <tr key={book.id} className={index % 2 === 0 ? themeClasses.tableRow.even : themeClasses.tableRow.odd}>
              <td className="px-4 py-3">
                <div className="w-10 h-14 bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 rounded overflow-hidden">
                  {book.cover ? (
                    <img 
                      src={book.cover}
                      alt={book.title || "Обложка книги"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/books/${book.id}`}>
                  <p className="text-neutral-700 dark:text-white font-medium hover:text-blue-600 transition-colors">{book.title}</p>
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">{book.authors || "—"}</td>
              <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">{book.genre || "—"}</td>
              <td className="px-4 py-3 text-sm">
                <div className="flex gap-2">
                  <Link href={`/admin/books/${book.id}/update`}>
                    <button className={themeClasses.actionButton.neutral}>Редактировать</button>
                  </Link>
                  <button
                    onClick={() => onDelete(book.id)}
                    className={themeClasses.actionButton.reject}
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * ViewModeMenu with DashboardPage-style navigation
 */
const ViewModeMenu = ({ viewMode, setViewMode, themeClasses }: ViewModeMenuProps) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl text-neutral-700 dark:text-white">
            {viewMode === "cards" && <CreditCard className="mr-2 h-4 w-4" />}
            {viewMode === "3d" && <Box className="mr-2 h-4 w-4" />}
            {viewMode === "list" && <List className="mr-2 h-4 w-4" />}
            Вид
          </NavigationMenuTrigger>
          <NavigationMenuContent className={themeClasses.menu}>
            <div className="grid gap-2 p-1 min-w-40">
              <button onClick={() => setViewMode("cards")} className={themeClasses.menuItem}>
                <CreditCard className="h-4 w-4 mr-2 inline" />
                Карточки
              </button>
              <button onClick={() => setViewMode("3d")} className={themeClasses.menuItem}>
                <Box className="h-4 w-4 mr-2 inline" />
                3D вид
              </button>
              <button onClick={() => setViewMode("list")} className={themeClasses.menuItem}>
                <List className="h-4 w-4 mr-2 inline" />
                Список
              </button>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

/**
 * Main BooksPage component
 */
export default function BooksPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("cards");
  const themeClasses = getThemeClasses();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
        const res = await fetch(`${baseUrl}/api/Books`);
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

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedBooks = filteredBooks.sort((a, b) =>
    sortOrder === "asc"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту книгу?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseUrl}/api/Books/${id}`, { method: "DELETE" });
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
    <GlassMorphismContainer
      backgroundPattern={true}
      isDarkMode={false}
    >
      <div className={`min-h-screen flex flex-col ${themeClasses.mainContainer}`}>
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/30 dark:bg-neutral-800/30 border-b border-white/30 dark:border-neutral-700/30 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-[0_5px_20px_rgba(0,0,0,0.1)] mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Link href="/admin/books/create">
              <button className={themeClasses.button}>Добавить книгу</button>
            </Link>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className={themeClasses.button}
            >
              Сортировка {sortOrder === "asc" ? "▲" : "▼"}
            </button>
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={themeClasses.input}
            />
            <ViewModeMenu viewMode={viewMode} setViewMode={setViewMode} themeClasses={themeClasses} />
          </div>
        </header>

        <main className="flex-1 space-y-8 px-6">
          {sortedBooks.length === 0 ? (
            <div className={`${themeClasses.card} py-20 text-center`}>
              <p className="text-xl text-neutral-700 dark:text-white">Книги не найдены</p>
              <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                Попробуйте изменить параметры поиска или добавьте новую книгу
              </p>
            </div>
          ) : (
            <div className={themeClasses.card}>
              {viewMode === "cards" && (
                <CardsView books={sortedBooks} onDelete={handleDelete} themeClasses={themeClasses} />
              )}
              {viewMode === "3d" && (
                <ThreeDBookView books={sortedBooks} onDelete={handleDelete} themeClasses={themeClasses} />
              )}
              {viewMode === "list" && (
                <ListView books={sortedBooks} onDelete={handleDelete} themeClasses={themeClasses} />
              )}
            </div>
          )}
        </main>
      </div>
    </GlassMorphismContainer>
  );
}