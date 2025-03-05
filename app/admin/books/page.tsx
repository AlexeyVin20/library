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
import { CreditCard, Box, BookOpen } from "lucide-react";
import BookCover from "@/components/BookCover";
import ThemeSelector from "@/components/admin/ThemeSelector";
import "@/styles/admin.css";

/**
 * Функция для получения классов стилей - улучшенный "Enhanced Glassmorphism"
 */
const getThemeClasses = () => {
  return {
    // Усиленное размытие и сниженная непрозрачность
    card: "backdrop-blur-xl bg-white/10 dark:bg-gray-800/10 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15 dark:hover:bg-gray-800/15 hover:scale-[1.02]",
    // Более насыщенный градиентный фон
    mainContainer: "bg-gradient-to-br from-blue-100/80 via-purple-50/70 to-pink-50/80 dark:from-blue-950/80 dark:via-purple-900/70 dark:to-blue-900/80 backdrop-blur-lg",
    // Добавлена лёгкая тень для усиления эффекта "парения"
    button: "backdrop-blur-xl bg-white/15 dark:bg-gray-800/15 border border-white/30 dark:border-gray-700/30 text-black dark:text-white hover:bg-white/25 dark:hover:bg-gray-800/25 transition-all duration-300 shadow-sm hover:shadow-md",
    // Добавлен светлый фокус для усиления интерактивности
    input: "backdrop-blur-xl bg-white/15 dark:bg-gray-800/15 border border-white/30 dark:border-gray-700/30 text-black dark:text-white focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-500/30 transition-all duration-300",
    // Класс для меню без заднего фона
    menu: "backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-lg",
    // Плавное изменение прозрачности при наведении
    menuItem: "hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300",
    // Новый класс для декоративных размытых элементов
    blurElement: "absolute rounded-full blur-3xl opacity-60 animate-pulse",
    // Плавное свечение для активных элементов
    glow: "hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
  };
};

/**
 * Компонент для отображения изображения обложки с усиленным 3D-ховер-эффектом.
 */
const BookImage = ({ src, alt, bookId }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-48 bg-gray-200/20 backdrop-blur-xl flex items-center justify-center rounded-lg border border-white/10">
        <BookOpen className="text-gray-400/70 w-12 h-12" />
      </div>
    );
  }

  // Усиленные эффекты 3D-трансформации
  const imageClass =
    "transform-gpu transition-all duration-300 hover:scale-110 hover:-rotate-6 hover:shadow-xl hover:shadow-blue-300/20 dark:hover:shadow-blue-500/20 rounded-lg";

  const imageElement = (
    <div className="overflow-hidden rounded-lg group relative">
      <Image
        src={src}
        alt={alt}
        width={192}
        height={192}
        className={`w-full h-48 object-cover ${imageClass}`}
        onError={() => setError(true)}
        unoptimized
      />
      {/* Добавлено тонкое свечение при наведении */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-lg"></div>
    </div>
  );

  return bookId ? (
    <Link href={`/admin/books/${bookId}`}>{imageElement}</Link>
  ) : (
    imageElement
  );
};

/**
 * Представление списка книг в виде карточек с усиленным glass-эффектом.
 */
const CardsView = ({ books, onDelete, themeClasses }) => {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {books.map((book) => (
        <li
          key={book.id}
          className={`${themeClasses.card} ${themeClasses.glow} shadow-lg flex overflow-hidden relative group`}
          style={{ height: "190px", backgroundColor: `${book.coverColor || "rgba(47, 47, 47, 0.3)"}` }}
        >
          <div className="w-1/3 p-2">
            <BookImage src={book.cover} alt={book.title} bookId={book.id} />
          </div>
          <div className="flex-1 p-4 text-white flex flex-col justify-between backdrop-blur-2xl bg-black/5">
            <div>
              <h3 className="text-lg font-bold mb-1">{book.title}</h3>
              <p className="text-sm text-white/90 mb-1">{book.authors}</p>
              <p className="text-xs text-white/80">{book.genre || ""}</p>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Link href={`/admin/books/${book.id}/update`}>
                <button className={`px-3 py-1 rounded-lg ${themeClasses.button}`}>
                  Редактировать
                </button>
              </Link>
              <button
                onClick={() => onDelete(book.id)}
                className="px-3 py-1 bg-red-500/50 backdrop-blur-xl text-white rounded-lg hover:bg-red-600/50 transition-all duration-300"
              >
                Удалить
              </button>
            </div>
          </div>
          {/* Добавлено несколько слоёв для создания многослойного эффекта при наведении */}
          <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 transition-opacity duration-300"></div>
          <div className="absolute -inset-1 -z-20 opacity-0 group-hover:opacity-40 bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-md transition-opacity duration-500 scale-105"></div>
        </li>
      ))}
    </ul>
  );
};

/**
 * Представление списка книг в виде 3D-отображения с улучшенным glass-эффектом.
 */
const ThreeDBookView = ({ books, onDelete, themeClasses }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
      {books.map((book) => (
        <div key={book.id} className="group text-black dark:text-white">
          <div
            className="relative w-full h-96 overflow-visible"
            style={{ perspective: "1000px" }}
          >
            <div
              className="absolute inset-0 transform-gpu transition-all duration-500 group-hover:rotate-y-0 rotate-y-[15deg] preserve-3d group-hover:scale-105"
            >
              <Link href={`/admin/books/${book.id}`}>
                <div className="absolute inset-0 backface-hidden">
                  <BookCover
                    coverColor={"rgba(47, 47, 47, 0.5)"}
                    coverImage={book.cover}
                    variant="medium"
                    className="w-full h-full rounded-lg shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  />
                  {/* Добавлен эффект внешнего свечения при наведении */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-[0_0_25px_rgba(59,130,246,0.4)] rounded-lg transition-opacity duration-500"></div>
                </div>
              </Link>
            </div>
          </div>
          <div className={`mt-2 text-center p-3 rounded-lg ${themeClasses.card} backdrop-blur-xl bg-white/15 dark:bg-gray-800/15`}>
            <p className="font-semibold line-clamp-1">
              {book.title} <span className="font-normal text-black/70 dark:text-white/70">— {book.authors}</span>
            </p>
            {book.genre && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{book.genre}</p>
            )}
          </div>
          <div className="mt-2 flex justify-center gap-2">
            <Link href={`/admin/books/${book.id}/update`}>
              <button className={`px-3 py-1 rounded-lg text-sm ${themeClasses.button}`}>
                Редактировать
              </button>
            </Link>
            <button
              onClick={() => onDelete(book.id)}
              className="px-3 py-1 bg-red-500/50 backdrop-blur-xl text-white rounded-lg hover:bg-red-600/50 transition-all duration-300 text-sm"
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
 * Меню выбора режима отображения книг с улучшенным glass-эффектом.
 */
const ViewModeMenu = ({ viewMode, setViewMode, themeClasses }) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className={`${themeClasses.menu} rounded-lg`}>
            {viewMode === "cards" && <CreditCard className="mr-2 h-4 w-4" />}
            {viewMode === "3d" && <Box className="mr-2 h-4 w-4" />}
            Вид
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-transparent z-50 backdrop-blur-xl rounded-lg border border-white/30 shadow-lg">
            <div className="grid gap-2 p-4">
              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-2 p-2 rounded-lg ${themeClasses.menuItem}`}
              >
                <CreditCard className="h-4 w-4" />
                Карточки
              </button>
              <button
                onClick={() => setViewMode("3d")}
                className={`flex items-center gap-2 p-2 rounded-lg ${themeClasses.menuItem}`}
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

/**
 * Декоративные плавающие элементы для создания воздушного эффекта
 */
const BackgroundElements = () => {
  const themeClasses = getThemeClasses();
  
  return (
    <>
      {/* Увеличено количество фоновых элементов для создания более насыщенного визуального опыта */}
      <div className={`${themeClasses.blurElement} top-20 left-20 w-72 h-72 bg-blue-400/30 animate-pulse-slow`}></div>
      <div className={`${themeClasses.blurElement} bottom-20 right-40 w-96 h-96 bg-purple-400/20 animate-pulse-slower`}></div>
      <div className={`${themeClasses.blurElement} top-1/3 right-1/4 w-60 h-60 bg-pink-300/20 animate-pulse-slow`}></div>
      <div className={`${themeClasses.blurElement} bottom-1/3 left-1/4 w-80 h-80 bg-indigo-300/15 animate-pulse-slower`}></div>
      <div className={`${themeClasses.blurElement} top-2/3 right-1/3 w-64 h-64 bg-blue-200/25 animate-pulse-slow`}></div>
    </>
  );
};

/**
 * Основной компонент страницы со списком книг.
 */
export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("cards");
  const themeClasses = getThemeClasses();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not определён");
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

  const handleDelete = async (id) => {
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
    <div className={`min-h-screen flex flex-col ${themeClasses.mainContainer} p-6 relative overflow-hidden`}>
      {/* Декоративные размытые элементы с анимацией */}
      <BackgroundElements />
      
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 backdrop-blur-xl p-5 rounded-xl bg-white/10 border border-white/30 dark:border-gray-700/20 shadow-lg z-10">
        <div className="flex flex-wrap gap-3 items-center">
          <Link href="/admin/books/create">
            <button className={`px-4 py-2 rounded-lg ${themeClasses.button} ${themeClasses.glow}`}>
              Добавить книгу
            </button>
          </Link>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className={`px-4 py-2 rounded-lg ${themeClasses.button}`}
          >
            Сортировка {sortOrder === "asc" ? "▲" : "▼"}
          </button>
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`px-4 py-2 rounded-lg ${themeClasses.input}`}
          />
          <ViewModeMenu viewMode={viewMode} setViewMode={setViewMode} themeClasses={themeClasses} />
        </div>
      </header>

      <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/30 dark:border-gray-700/20 rounded-xl p-6 shadow-lg z-10">
        {sortedBooks.length === 0 ? (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400">
            <p className="text-xl">Книги не найдены</p>
            <p className="mt-2">Попробуйте изменить параметры поиска или добавьте новую книгу</p>
          </div>
        ) : (
          <>
            {viewMode === "cards" && (
              <CardsView books={sortedBooks} onDelete={handleDelete} themeClasses={themeClasses} />
            )}
            {viewMode === "3d" && (
              <ThreeDBookView books={sortedBooks} onDelete={handleDelete} themeClasses={themeClasses} />
            )}
          </>
        )}
      </div>
      
      {/* Дополнительные стили для анимации */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s infinite ease-in-out;
        }
        .animate-pulse-slower {
          animation: pulse-slower 12s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
