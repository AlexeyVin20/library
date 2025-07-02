"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Filter, BookMarked, ArrowUpDown, ChevronDown, Heart } from "lucide-react";
import { Book } from "@/components/ui/book";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import type { BookInstance } from "@/lib/types";

interface Book {
  id: string;
  title: string;
  authors?: string;
  genre?: string;
  cover?: string;
  availableCopies?: number;
}

// Компонент для анимированного появления
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) => {
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration,
    delay,
    ease: [0.22, 1, 0.36, 1]
  }}>
      {children}
    </motion.div>;
};
export default function BooksPage() {
  const searchParams = useSearchParams();
  const {
    user
  } = useAuth();
  const currentUserId = user?.id;
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteBookIds, setFavoriteBookIds] = useState<Set<string>>(new Set());
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  useEffect(() => {
    const fetchBooksAndFavorites = async () => {
      try {
        setLoading(true);
        // Загружаем книги и экземпляры параллельно
        const [booksResponse, instancesResponse] = await Promise.all([
          fetch(`${baseUrl}/api/books`),
          fetch(`${baseUrl}/api/bookinstances`)
        ]);
        
        if (!booksResponse.ok) {
          throw new Error("Ошибка при получении книг");
        }
        const booksData = await booksResponse.json();
        
        let instancesData = [];
        if (instancesResponse.ok) {
          instancesData = await instancesResponse.json();
        }
        
        const processedBooks = booksData.map((book: {
          id: string;
          title: string;
          authors?: any; // Можно уточнить, если известен формат
          genre?: string;
          cover?: string;
          coverImage?: string;
          coverImageUrl?: string;
          image?: string;
          coverUrl?: string;
          imageUrl?: string;
          availableCopies?: number;
          // rating поле удалено из Book интерфейса, так что здесь оно не нужно
        }) => {
          const coverUrl = book.cover || book.coverImage || book.coverImageUrl || book.image || book.coverUrl || book.imageUrl || "";
          
          // Подсчитываем экземпляры на полках для данной книги
          const bookInstances = instancesData.filter((instance: BookInstance) =>  
            instance.bookId === book.id && 
            instance.shelfId && 
            instance.isActive &&
            instance.status.toLowerCase() !== 'утеряна' &&
            instance.status.toLowerCase() !== 'списана'
          );
          
          return {
            id: book.id,
            title: book.title,
            authors: Array.isArray(book.authors) ? book.authors.join(", ") : book.authors,
            genre: book.genre || "Общая литература",
            cover: coverUrl,
            availableCopies: bookInstances.length
          };
        });
        const uniqueGenres = Array.from(new Set(processedBooks.map((book: Book) => book.genre || ""))).filter(Boolean);
        setGenres(uniqueGenres as string[]);
        setBooks(processedBooks);
        setFilteredBooks(processedBooks);
        if (currentUserId) {
          const favResponse = await fetch(`${baseUrl}/api/FavoriteBook/user/${currentUserId}`);
          if (favResponse.ok) {
            const favoriteBooksData: {
              bookId: string;
            }[] = await favResponse.json();
            setFavoriteBookIds(new Set(favoriteBooksData.map(fav => fav.bookId)));
          } else {
            console.warn("Не удалось загрузить избранные книги или их нет:", favResponse.status);
            setFavoriteBookIds(new Set());
          }
        }
      } catch (error) {
        console.error("Ошибка получения данных:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные для страницы книг.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBooksAndFavorites();
  }, [currentUserId, baseUrl]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...books];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(book => book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.authors && book.authors.toLowerCase().includes(searchQuery.toLowerCase()) || book.genre && book.genre.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Apply genre filter
    if (selectedGenres.length > 0) {
      result = result.filter(book => book.genre && selectedGenres.includes(book.genre));
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.title.localeCompare(b.title);
      } else {
        return b.title.localeCompare(a.title);
      }
    });
    setFilteredBooks(result);
  }, [books, searchQuery, selectedGenres, sortOrder]);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGenres([]);
    setSortOrder("asc");
  };

  // Функция для добавления/удаления из избранного
  const handleToggleFavorite = async (book: Book) => {
    if (!currentUserId) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему, чтобы добавлять книги в избранное.",
        variant: "default",
        action: <Button asChild variant="outline"><Link href="/auth/login">Войти</Link></Button>
      });
      return;
    }
    const bookId = book.id;
    const isCurrentlyFavorite = favoriteBookIds.has(bookId);
    const originalFavorites = new Set(favoriteBookIds);

    // Оптимистичное обновление UI
    setFavoriteBookIds(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      if (isCurrentlyFavorite) {
        newFavorites.delete(bookId);
      } else {
        newFavorites.add(bookId);
      }
      return newFavorites;
    });
    try {
      let response;
      if (isCurrentlyFavorite) {
        response = await fetch(`${baseUrl}/api/FavoriteBook/${currentUserId}/${bookId}`, {
          method: "DELETE"
        });
      } else {
        const favoriteData = {
          userId: currentUserId,
          bookId: book.id,
          bookTitle: book.title || "Без названия",
          bookAuthors: book.authors || "Неизвестный автор",
          bookCover: book.cover || "/placeholder.svg",
          dateAdded: new Date().toISOString()
        };
        response = await fetch(`${baseUrl}/api/FavoriteBook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(favoriteData)
        });
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
      }
      toast({
        title: "Успех!",
        description: isCurrentlyFavorite ? "Книга удалена из избранного." : "Книга добавлена в избранное."
      });
    } catch (error) {
      setFavoriteBookIds(originalFavorites);
      console.error("Ошибка при обновлении избранного:", error);
      toast({
        title: "Ошибка",
        description: (error as Error).message || "Не удалось обновить статус избранного.",
        variant: "destructive"
      });
    }
  };
  return <div className="min-h-screen bg-gray-200 relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <FadeInView>
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <BookMarked className="h-6 w-6 text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-800">Каталог книг</h1>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input type="text" placeholder="Поиск книг..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-white border border-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-10 pr-4 py-2 text-gray-800 w-[200px] md:w-[300px]" />
                </form>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-white border-blue-500 text-blue-500 hover:bg-gray-100">
                      <Filter className="h-4 w-4" />
                      Жанры
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white border border-gray-100">
                    <DropdownMenuItem onClick={clearFilters} className="text-gray-800 hover:bg-gray-100">Сбросить фильтры</DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    {genres.map(genre => <DropdownMenuCheckboxItem key={genre} checked={selectedGenres.includes(genre)} onCheckedChange={() => toggleGenre(genre)} className="text-gray-800 hover:bg-gray-100">
                        {genre}
                      </DropdownMenuCheckboxItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" className="flex items-center gap-2 bg-white border-blue-500 text-blue-500 hover:bg-gray-100" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                  <ArrowUpDown className="h-4 w-4" />
                  {sortOrder === "asc" ? "А-Я" : "Я-А"}
                </Button>
              </div>
            </div>
          </div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          {loading ? <div className="flex justify-center items-center h-64">
              <motion.div animate={{
            rotate: 360
          }} transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear"
          }} className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full" />
            </div> : filteredBooks.length === 0 ? <motion.div className="bg-white rounded-xl p-12 shadow-md border border-gray-100 text-center" initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.3
        }}>
              <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-xl text-gray-800">Книги не найдены</p>
              <p className="mt-2 text-gray-500">Попробуйте изменить параметры поиска</p>
              <Button className="mt-6 bg-blue-500 hover:bg-blue-700 text-white rounded-lg" onClick={clearFilters}>
                Сбросить фильтры
              </Button>
            </motion.div> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredBooks.map((book, index) => <div key={book.id} className="relative group">
                  {/* Бейдж с количеством экземпляров */}
                  {book.availableCopies !== undefined && book.availableCopies > 0 && (
                    <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-20">
                      {book.availableCopies}
                    </div>
                  )}
                  <Link href={`/readers/books/${book.id}`}>
                    <motion.div className="text-gray-800" initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0,
                transition: {
                  delay: 0.1 + index * 0.05,
                  duration: 0.5
                }
              }}>
                                            <div className="relative w-full overflow-visible flex items-center justify-center" style={{
                  height: "240px"
                }}>
                        <motion.div className="transform-gpu transition-all duration-500" initial={{
                    rotateY: 0
                  }} whileHover={{
                    scale: 1.05
                  }}>
                          <Book 
                            color={book.cover ? "#3B82F6" : "#6B7280"} 
                            width={180}
                            depth={3}
                            variant="default"
                            illustration={book.cover ? <img src={book.cover} alt={book.title} className="w-full h-full object-cover rounded" /> : undefined}
                          >
                            <div></div>
                          </Book>
                        </motion.div>
                      </div>
                      <motion.div className="mt-2 bg-white rounded-lg p-3 shadow-md border border-gray-100 text-center" whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                }}>
                        <p className="font-semibold line-clamp-1 group-hover:text-blue-500 transition-colors">
                          {book.title}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-1">{book.authors}</p>
                        {book.genre && <p className="text-xs text-gray-500">{book.genre}</p>}
                      </motion.div>
                    </motion.div>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleFavorite(book);
            }} className="absolute top-2 right-2 z-20 text-gray-800 hover:text-blue-500 bg-white/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" aria-label="Toggle Favorite">
                    <Heart fill={favoriteBookIds.has(book.id) ? "currentColor" : "none"} className="w-5 h-5" />
                  </Button>
                </div>)}
            </div>}
        </FadeInView>
      </div>
    </div>;
}