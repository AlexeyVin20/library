"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { CreditCard, Box, BookOpen, List, Plus, Search, ArrowUpDown, Edit, Trash2, BookMarked } from 'lucide-react';
import BookCover from "@/components/BookCover";

/**
 * Interface for book item
 */
interface Book {
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
  books: Book[];
  onDelete: (id: string) => void;
}

interface ViewModeMenuProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
}

// Компонент для анимированного появления
const FadeInView = ({ children, delay = 0, duration = 0.5 }: { children: React.ReactNode; delay?: number; duration?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/**
 * BookImage component with DashboardPage-style hover effects
 */
const BookImage = ({ src, alt, bookId }: BookImageProps) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-48 flex items-center justify-center backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-lg border border-white/20 dark:border-gray-700/30">
        <BookOpen className="text-gray-400 dark:text-gray-500 w-12 h-12" />
      </div>
    );
  }

  const imageElement = (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className="overflow-hidden rounded-xl shadow-md"
    >
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        width={192}
        height={192}
        className="w-full h-48 object-cover"
        onError={(e) => {
          console.error(`Ошибка загрузки изображения:`, src);
          setError(true);
        }}
        unoptimized
      />
    </motion.div>
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
const CardsView = ({ books, onDelete }: ViewProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
      {books.map((book, index) => (
        <FadeInView key={book.id} delay={0.05 * index}>
          <motion.div 
            className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/30 flex overflow-hidden"
            whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)" }}
          >
            <div className="w-1/3">
              <BookImage src={book.cover} alt={book.title} bookId={book.id} />
            </div>
            <div className="flex-1 pl-4 flex flex-col justify-between">
              <div>
                <Link href={`/admin/books/${book.id}`}>
                  <h3 className="text-lg font-bold text-white hover:text-emerald-400 transition-colors">{book.title}</h3>
                </Link>
                <p className="text-sm text-white">{book.authors}</p>
                <p className="text-xs text-white/80">{book.genre || ""}</p>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Link href={`/admin/books/${book.id}/update`}>
                  <motion.button 
                    className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-md backdrop-blur-md"
                    whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span className="text-sm">Редактировать</span>
                  </motion.button>
                </Link>
                <motion.button
                  onClick={() => onDelete(book.id)}
                  className="bg-red-500/90 hover:bg-red-600/90 text-white font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-md backdrop-blur-md"
                  whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-sm">Удалить</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </FadeInView>
      ))}
    </div>
  );
};

/**
 * ThreeDBookView with DashboardPage-style 3D effects
 */
const ThreeDBookView = ({ books, onDelete }: ViewProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6 p-6">
      {books.map((book, index) => (
        <FadeInView key={book.id} delay={0.05 * index}>
          <div className="group text-white">
            <div className="relative w-full h-96 overflow-visible" style={{ perspective: "1000px" }}>
              <motion.div 
                className="absolute inset-0 transform-gpu transition-all duration-500 preserve-3d"
                initial={{ rotateY: 15 }}
                whileHover={{ rotateY: 0, scale: 1.05 }}
              >
                <Link href={`/admin/books/${book.id}`}>
                  <BookCover
                    coverColor="rgba(0, 39, 5, 0.56)"
                    coverImage={book.cover || ""}
                    variant="medium"
                    className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-lg w-full h-full"
                  />
                </Link>
              </motion.div>
            </div>
            <motion.div 
              className="mt-2 backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-3 shadow-md border border-white/20 dark:border-gray-700/30 text-center"
              whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
            >
              <Link href={`/admin/books/${book.id}`}>
                <p className="font-semibold line-clamp-1 hover:text-emerald-400 transition-colors">
                  {book.title}
                </p>
              </Link>
              <p className="text-sm text-white/90 line-clamp-1">{book.authors}</p>
              {book.genre && (
                <p className="text-xs text-white/80">{book.genre}</p>
              )}
            </motion.div>
            <div className="mt-2 flex justify-center gap-2">
              <Link href={`/admin/books/${book.id}/update`}>
                <motion.button 
                  className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-md backdrop-blur-md"
                  whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="text-sm">Ред.</span>
                </motion.button>
              </Link>
              <motion.button
                onClick={() => onDelete(book.id)}
                className="bg-red-500/90 hover:bg-red-600/90 text-white font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-md backdrop-blur-md"
                whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-sm">Удал.</span>
              </motion.button>
            </div>
          </div>
        </FadeInView>
      ))}
    </div>
  );
};

/**
 * ListView component for books
 */
const ListView = ({ books, onDelete }: ViewProps) => {
  return (
    <div className="overflow-x-auto p-6">
      <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
        <thead className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-t-lg">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-12"></th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Название</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Автор</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Жанр</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
          {books.map((book, index) => (
            <motion.tr 
              key={book.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.3 }}
              className={index % 2 === 0 
                ? "backdrop-blur-sm bg-white/10 dark:bg-gray-800/10" 
                : "backdrop-blur-sm bg-white/20 dark:bg-gray-800/20"
              }
              whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.05)" }}
            >
              <td className="px-4 py-3">
                <div className="w-10 h-14 flex-shrink-0 bg-emerald-100/70 dark:bg-emerald-900/30 rounded-lg overflow-hidden shadow-md">
                  {book.cover ? (
                    <motion.img 
                      src={book.cover} 
                      alt={book.title} 
                      className="w-full h-full object-cover" 
                      loading="lazy" 
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      onError={(e) => {
                        console.error(`Ошибка загрузки изображения для книги ${book.id}:`, book.cover);
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-emerald-400" />
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/books/${book.id}`}>
                  <p className="text-white font-medium hover:text-emerald-400 transition-colors">{book.title}</p>
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-white/90">{book.authors || "—"}</td>
              <td className="px-4 py-3 text-sm text-white/90">{book.genre || "—"}</td>
              <td className="px-4 py-3 text-sm">
                <div className="flex gap-2">
                  <Link href={`/admin/books/${book.id}/update`}>
                    <motion.button 
                      className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-md backdrop-blur-md"
                      whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="text-sm">Ред.</span>
                    </motion.button>
                  </Link>
                  <motion.button
                    onClick={() => onDelete(book.id)}
                    className="bg-red-500/90 hover:bg-red-600/90 text-white font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-md backdrop-blur-md"
                    whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-sm">Удал.</span>
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * ViewModeMenu with DashboardPage-style navigation
 */
const ViewModeMenu = ({ viewMode, setViewMode }: ViewModeMenuProps) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 text-white border border-white/20 dark:border-gray-700/30">
            {viewMode === "cards" && <CreditCard className="mr-2 h-4 w-4" />}
            {viewMode === "3d" && <Box className="mr-2 h-4 w-4" />}
            {viewMode === "list" && <List className="mr-2 h-4 w-4" />}
            Вид
          </NavigationMenuTrigger>
          <NavigationMenuContent className="backdrop-blur-xl bg-green/30 dark:bg-gray-800/20 p-2 rounded-xl border border-white/20 dark:border-gray-700/30 shadow-lg">
            <div className="grid gap-2 p-1 min-w-40">
              <motion.button 
                onClick={() => setViewMode("cards")} 
                className="flex items-center gap-2 p-2 rounded-lg text-white hover:bg-white/20 dark:hover:bg-gray-700/20 transition-colors"
                whileHover={{ x: 3 }}
              >
                <CreditCard className="h-4 w-4" />
                Карточки
              </motion.button>
              <motion.button 
                onClick={() => setViewMode("3d")} 
                className="flex items-center gap-2 p-2 rounded-lg text-white hover:bg-white/20 dark:hover:bg-gray-700/20 transition-colors"
                whileHover={{ x: 3 }}
              >
                <Box className="h-4 w-4" />
                3D вид
              </motion.button>
              <motion.button 
                onClick={() => setViewMode("list")} 
                className="flex items-center gap-2 p-2 rounded-lg text-white hover:bg-white/20 dark:hover:bg-gray-700/20 transition-colors"
                whileHover={{ x: 3 }}
              >
                <List className="h-4 w-4" />
                Список
              </motion.button>
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
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("cards");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const response = await fetch(`${baseUrl}/api/books`);
        
        if (!response.ok) {
          throw new Error('Ошибка при получении книг');
        }
        
        const data = await response.json();
        console.log("API response data:", data);
        
        setBooks(data.map((book: any) => {
          // Получаем URL обложки из любого доступного поля
          const coverUrl = 
            book.cover || 
            book.coverImage || 
            book.coverImageUrl || 
            book.image || 
            book.coverUrl || 
            book.imageUrl || 
            "";
          
          console.log(`Book ${book.id} - Cover URL:`, coverUrl);
          
          return {
            id: book.id,
            title: book.title,
            authors: Array.isArray(book.authors) ? book.authors.join(', ') : book.authors,
            genre: book.genre,
            cover: coverUrl,
            availableCopies: book.availableCopies
          };
        }));
      } catch (error) {
        console.error("Ошибка получения книг", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить книги",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (book.authors && book.authors.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const sortedBooks = filteredBooks.sort((a, b) =>
    sortOrder === "asc"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  );

  const handleDelete = async (id: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/books/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при удалении книги');
      }
      
      setBooks(books.filter((book) => book.id !== id));
      toast({
        title: "Успешно",
        description: "Книга успешно удалена",
      });
    } catch (error) {
      console.error("Ошибка удаления книги", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить книгу",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto p-6 relative z-10">
        {/* Header */}
        <FadeInView>
          <motion.div 
            className="sticky top-0 z-10 backdrop-blur-xl bg-green/30 dark:bg-gray-800/30 border-b border-white/20 dark:border-gray-700/30 p-4 rounded-xl shadow-lg mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <BookMarked className="h-6 w-6 text-emerald-500" />
                <h1 className="text-2xl font-bold text-white">Управление книгами</h1>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center">
                <Link href="/admin/books/create">
                  <motion.button 
                    className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                    whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="h-4 w-4" />
                    Добавить книгу
                  </motion.button>
                </Link>
                
                <motion.button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md border border-white/20 dark:border-gray-700/30"
                  whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {sortOrder === "asc" ? "По возрастанию" : "По убыванию"}
                </motion.button>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 text-white" />
                  <input
                    type="text"
                    placeholder="Поиск книг..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg pl-10 pr-4 py-2 text-white shadow-md"
                  />
                </div>
                
                <ViewModeMenu viewMode={viewMode} setViewMode={setViewMode} />
              </div>
            </div>
          </motion.div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full"
              />
            </div>
          ) : sortedBooks.length === 0 ? (
            <motion.div 
              className="backdrop-blur-xl bg-green/20 dark:bg-gray-800/20 rounded-2xl p-12 shadow-lg border border-white/20 dark:border-gray-700/30 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-xl text-white">Книги не найдены</p>
              <p className="mt-2 text-white/90">
                Попробуйте изменить параметры поиска или добавьте новую книгу
              </p>
              <Link href="/admin/books/create">
                <motion.button 
                  className="mt-6 bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md mx-auto"
                  whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="h-4 w-4" />
                  Добавить книгу
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              className="backdrop-blur-xl bg-green/20 dark:bg-gray-800/20 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {viewMode === "cards" && (
                <CardsView books={sortedBooks} onDelete={handleDelete} />
              )}
              {viewMode === "3d" && (
                <ThreeDBookView books={sortedBooks} onDelete={handleDelete} />
              )}
              {viewMode === "list" && (
                <ListView books={sortedBooks} onDelete={handleDelete} />
              )}
            </motion.div>
          )}
        </FadeInView>
      </div>
    </div>
  );
}
