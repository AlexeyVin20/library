"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Search, Library, Eye, Book, AlertCircle, BookOpen, User, Clock, Hash, Lock } from "lucide-react";
import type { Book as BookType, Shelf, Journal } from "@/lib/types";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShelfCanvas from "@/components/admin/ShelfCanvas";
import BookInfoModal from "@/components/admin/BookInfoModalUsers";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useUserRoles } from "@/hooks/use-user-roles";
import { hasBookAccess, type ReservationAccess, type BorrowedBookAccess } from "@/lib/reservation-utils";

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

// Функция для вычисления ширины и высоты полки
function getShelfSize(capacity: number) {
  const width = Math.max(160, Math.min(40 * capacity + 30, 500));
  const height = 150;
  return { width, height };
}

export default function ReaderShelfsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { hasShelfAccess } = useUserRoles();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [books, setBooks] = useState<BookType[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBooks, setFilteredBooks] = useState<BookType[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [highlightedBookId, setHighlightedBookId] = useState<string | null>(null);
  const [showBookInfoModal, setShowBookInfoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BookType | Journal | null>(null);
  const [selectedItemIsJournal, setSelectedItemIsJournal] = useState(false);
  const [selectedItemShelfNumber, setSelectedItemShelfNumber] = useState<number>(0);
  const [selectedItemPosition, setSelectedItemPosition] = useState<number>(0);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [userBorrowedBooks, setUserBorrowedBooks] = useState<any[]>([]);
  const [hasAccess, setHasAccess] = useState(false);

  // Проверка доступа пользователя
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (!hasShelfAccess) {
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав для просмотра расположения книг на полках.",
        variant: "destructive"
      });
      router.push("/readers");
      return;
    }

    setHasAccess(true);
  }, [user, router, hasShelfAccess]);

  useEffect(() => {
    if (hasAccess) {
      fetchShelves();
      fetchBooks();
      fetchJournals();
      fetchUserReservations();
      fetchUserBorrowedBooks();
    }
  }, [hasAccess]);

  const fetchShelves = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const response = await fetch(`${baseUrl}/api/Shelf`);
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      const data = await response.json();
      setShelves(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при загрузке полок");
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при загрузке полок",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Ошибка авторизации",
          description: "Токен авторизации не найден. Пожалуйста, войдите в систему заново.",
          variant: "destructive"
        });
        return;
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const booksResponse = await fetch(`${baseUrl}/api/Books`);
      if (!booksResponse.ok) throw new Error(`API ответил с кодом: ${booksResponse.status}`);
      const booksData = await booksResponse.json();

      const enrichedBooksPromises = booksData.map(async (book: BookType) => {
        const instancesResponse = await fetch(`${baseUrl}/api/BookInstance?bookId=${book.id}`, { headers });
        
        let instancesData: any[] = [];
        if (instancesResponse.ok) {
          instancesData = await instancesResponse.json();
        }

        const bookInstances = instancesData.filter((instance: any) =>  
          instance.isActive &&
          instance.status.toLowerCase() !== 'утеряна' &&
          instance.status.toLowerCase() !== 'списана'
        );
        
        return {
          ...book,
          instancesOnShelf: book.availableCopies ?? bookInstances.length,
          instances: bookInstances
        };
      });

      const enrichedBooks = await Promise.all(enrichedBooksPromises);
      
      // Отладка: показываем только книги, которые находятся на полках
      const booksOnShelves = enrichedBooks.filter(book => book.shelfId && book.position !== undefined);
      console.log('Все книги:', enrichedBooks.length);
      console.log('Книги на полках:', booksOnShelves.length);
      console.log('Книги на полках (детали):', booksOnShelves.map(b => ({
        id: b.id,
        title: b.title,
        shelfId: b.shelfId,
        position: b.position,
        availableCopies: b.availableCopies
      })));
      
      setBooks(enrichedBooks);
      setFilteredBooks(enrichedBooks);
    } catch (err) {
      console.error("Ошибка при загрузке книг:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить книги",
        variant: "destructive"
      });
    }
  };

  const fetchJournals = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const response = await fetch(`${baseUrl}/api/Journals`);
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      const data = await response.json();
      setJournals(data);
    } catch (err) {
      console.error("Ошибка при загрузке журналов:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить журналы",
        variant: "destructive"
      });
    }
  };

  const fetchUserReservations = async () => {
    if (!user) return;
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(`${baseUrl}/api/Reservation/user/${user.id}`, { headers });
      if (response.ok) {
        const data = await response.json();
        // Фильтруем только одобренные резервирования (НЕ выданные и НЕ возвращенные)
        const approvedReservations = data.filter((reservation: any) => {
          const status = reservation.status.toLowerCase();
          return (status === 'активна' || status === 'active' ||
                  status === 'подтверждена' || status === 'confirmed' ||
                  status === 'одобрена' || status === 'approved') &&
                 !reservation.actualReturnDate; // Исключаем возвращенные
        });
        console.log('Все резервирования:', data);
        console.log('Одобренные резервирования (не выданные):', approvedReservations);
        setUserReservations(approvedReservations);
      }
    } catch (err) {
      console.error("Ошибка при загрузке резервирований:", err);
    }
  };

  const fetchUserBorrowedBooks = async () => {
    if (!user) return;
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // Получаем активные резервирования пользователя (статус "Выдана")
      const reservationsResponse = await fetch(`${baseUrl}/api/Reservation/user/${user.id}`, { headers });
      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json();
        // Фильтруем только выданные книги (статус "Выдана" и нет actualReturnDate)
        const activeBorrowedBooks = reservationsData.filter((reservation: any) => 
          reservation.status === 'Выдана' && !reservation.actualReturnDate
        );
        console.log('Все резервирования пользователя:', reservationsData);
        console.log('Активные выданные книги:', activeBorrowedBooks);
        setUserBorrowedBooks(activeBorrowedBooks);
        
        // Дополнительная отладка
        console.log('User ID:', user.id);
        console.log('Active borrowed books IDs:', activeBorrowedBooks.map((b: any) => b.bookId));
      }
    } catch (err) {
      console.error("Ошибка при загрузке взятых книг:", err);
    }
  };

  // Проверяем, может ли пользователь видеть книгу
  const canUserSeeBook = (book: BookType) => {
    if (!user) return false;
    
    // Проверяем, есть ли книга среди взятых (выданных) пользователем
    const isBorrowed = userBorrowedBooks.some(borrowed => borrowed.bookId === book.id);
    if (isBorrowed) {
      return true; // Пользователь может видеть книгу, которая у него на руках
    }
    
    // Проверяем, есть ли активное резервирование (одобренное, но не выданное)
    const hasActiveReservation = userReservations.some(reservation => 
      reservation.bookId === book.id
    );
    if (hasActiveReservation) {
      return true; // Пользователь может видеть зарезервированную книгу
    }
    
    return false; // В остальных случаях книга недоступна для просмотра
  };

  // Определяем статус книги для цветового кодирования
  const getBookStatus = (book: BookType) => {
    if (!user) return 'unavailable';
    
    // Проверяем, есть ли книга среди взятых (выданных)
    const isBorrowed = userBorrowedBooks.some(borrowed => borrowed.bookId === book.id);
    if (isBorrowed) {
      console.log(`Книга ${book.title} (${book.id}) - статус: borrowed`);
      return 'borrowed'; // Выдана - синий цвет
    }
    
    // Проверяем, есть ли активное резервирование
    const hasActiveReservation = userReservations.some(reservation => {
      const status = reservation.status.toLowerCase();
      // Поддерживаем как русские, так и английские статусы
      return reservation.bookId === book.id && 
        (status === 'активна' || status === 'active' ||
         status === 'подтверждена' || status === 'confirmed' ||
         status === 'одобрена' || status === 'approved' ||
         status === 'выдана' || status === 'issued');
    });
    if (hasActiveReservation) {
      console.log(`Книга ${book.title} (${book.id}) - статус: approved`);
      return 'approved'; // Одобрена - зеленый цвет
    }
    
    console.log(`Книга ${book.title} (${book.id}) - статус: unavailable`);
    return 'unavailable';
  };

  // Фильтруем книги и журналы для отображения
  const filteredBooksForDisplay = books.filter(book => {
    const canSee = canUserSeeBook(book);
    console.log(`Книга ${book.title} (${book.id}):`, {
      canSee,
      shelfId: book.shelfId,
      position: book.position,
      availableCopies: book.availableCopies,
      instancesOnShelf: book.instancesOnShelf,
      isBorrowed: userBorrowedBooks.some(borrowed => borrowed.bookId === book.id),
      hasReservation: userReservations.some(reservation => reservation.bookId === book.id)
    });
    return canSee;
  });
  const filteredJournalsForDisplay = journals.filter(journal => canUserSeeBook(journal as any));

  // Обогащаем книги информацией о статусе (только те, что на полках)
  const enrichedBooksForDisplay = filteredBooksForDisplay
    .filter(book => book.shelfId && book.position !== undefined) // Только книги на полках
    .map(book => ({
      ...book,
      userStatus: getBookStatus(book)
    }));

  // Обогащаем журналы информацией о статусе (только те, что на полках)
  const enrichedJournalsForDisplay = filteredJournalsForDisplay
    .filter(journal => journal.shelfId && journal.position !== undefined) // Только журналы на полках
    .map(journal => ({
      ...journal,
      userStatus: getBookStatus(journal as any) // Используем ту же функцию для журналов
    }));

  // Финальная отладка
  console.log('Финальные книги для отображения:', enrichedBooksForDisplay.length);
  console.log('Финальные журналы для отображения:', enrichedJournalsForDisplay.length);
  console.log('Детали финальных книг:', enrichedBooksForDisplay.map(b => ({
    id: b.id,
    title: b.title,
    shelfId: b.shelfId,
    position: b.position,
    userStatus: b.userStatus
  })));

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 1) {
      setShowSearchDropdown(true);
      const filteredResults = filteredBooksForDisplay.filter(b => 
        b.title.toLowerCase().includes(term.toLowerCase()) || 
        (b.authors && b.authors.toLowerCase().includes(term.toLowerCase()))
      );
      setFilteredBooks(filteredResults.slice(0, 5));
    } else {
      setShowSearchDropdown(false);
    }
  };

  const handleBookFound = (bookId: string) => {
    setHighlightedBookId(bookId);
    setTimeout(() => {
      setHighlightedBookId(null);
    }, 5000);
    
    const bookWithShelf = books.find(b => b.id === bookId);
    if (bookWithShelf?.shelfId) {
      const shelf = shelves.find(s => s.id === bookWithShelf.shelfId);
      if (shelf) {
        const shelfElement = document.getElementById(`shelf-${shelf.id}`);
        shelfElement?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }
  };

  const animateHighlightedBook = (bookId: string) => {
    handleBookFound(bookId);
    setShowSearchDropdown(false);
  };

  const handleItemClick = (item: BookType | Journal | null, isJournal: boolean, shelfId: number, position: number) => {
    if (!item || !canUserSeeBook(item as BookType)) return;
    
    setSelectedItem(item);
    setSelectedItemIsJournal(isJournal);
    const shelf = shelves.find(s => s.id === shelfId);
    setSelectedItemShelfNumber(shelf ? shelf.shelfNumber : shelfId);
    setSelectedItemPosition(position);
    setShowBookInfoModal(true);
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Проверка доступа...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="container mx-auto p-6">
        {/* Header */}
        <FadeInView>
          <div className="mb-8 flex items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Link href="/readers" className="flex items-center gap-2 text-blue-700 hover:text-blue-500 transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                  <span className="font-medium">Назад</span>
                </Link>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl font-bold text-gray-800"
              >
                Расположение книг на полках
              </motion.h1>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">Только ваши книги</span>
            </div>
          </div>
        </FadeInView>

        {/* Search */}
        <FadeInView delay={0.2}>
          <div className="mb-6">
            <div className="relative max-w-md">
              <Input
                type="text"
                placeholder="Поиск ваших книг..."
                className="bg-gray-100 border border-gray-200 w-full pl-10 text-black"
                value={searchTerm}
                onChange={handleSearch}
                onFocus={() => searchTerm.length > 1 && setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              />
              <Search className="absolute left-3 top-2.5 text-black" size={18} />
            </div>

            <AnimatePresence>
              {showSearchDropdown && filteredBooks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-30 mt-1 max-w-md w-full bg-white rounded-lg shadow-lg max-h-60 overflow-auto border border-gray-200"
                >
                  {filteredBooks.map((book, index) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={() => animateHighlightedBook(book.id)}
                    >
                      <div className="font-medium text-gray-800">{book.title}</div>
                      <div className="text-sm text-gray-500">{book.authors || "Автор не указан"}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeInView>

        {/* Info card */}
        <FadeInView delay={0.3}>
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div className="text-sm text-blue-800">
                  <strong>Информация:</strong> Здесь отображаются только те книги, которые вы зарезервировали 
                  или взяли в библиотеке. Это поможет вам найти расположение ваших книг на полках.
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInView>

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center"
          >
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Library className="h-5 w-5 text-blue-500" />
              Расположение ваших книг
            </h2>
            <Badge variant="outline" className="text-blue-600">
              {enrichedBooksForDisplay.length + enrichedJournalsForDisplay.length} книг(и) доступно
            </Badge>
          </div>

          {enrichedBooksForDisplay.length === 0 && enrichedJournalsForDisplay.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Нет доступных книг для просмотра
              </h3>
              <p className="text-gray-500">
                Зарезервируйте или возьмите книгу в библиотеке, чтобы увидеть её расположение на полках.
              </p>
              <Button asChild className="mt-4">
                <Link href="/readers/books">
                  Найти книги
                </Link>
              </Button>
            </div>
          ) : (
            <ShelfCanvas
              shelves={shelves}
              books={enrichedBooksForDisplay}
              journals={enrichedJournalsForDisplay}
              loading={loading}
              isEditMode={false}
              highlightedBookId={highlightedBookId}
              onDragStart={() => {}} // Disabled for readers
              onDragMove={() => {}} // Disabled for readers
              onDragEnd={() => {}} // Disabled for readers
              onShelfEdit={() => {}} // Disabled for readers
              onShelfDelete={() => {}} // Disabled for readers
              onItemClick={handleItemClick}
              onEmptySlotClick={() => {}} // Disabled for readers
              overlappingShelfIds={[]}
              getShelfSize={getShelfSize}
              // Disabled drag props
              draggedItem={null}
              dragOverSlot={null}
              isDraggingItem={false}
              onItemDragStart={() => {}}
              onSlotDragOver={() => {}}
              onSlotDragLeave={() => {}}
              onItemDrop={() => {}}
              onItemDragEnd={() => {}}
              // AI arrangement props (disabled)
              aiArrangedBooks={[]}
              onItemHoverStart={() => {}}
              onItemHoverEnd={() => {}}
              // Reader mode
              isReaderMode={true}
            />
          )}
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mt-6"
        >
          <h3 className="font-semibold text-gray-800 mb-4">Обозначения:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <div className="w-6 h-8 bg-blue-500 mr-3 rounded"></div>
              <span className="text-gray-600">Выданная книга/журнал</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-8 bg-green-500 mr-3 rounded"></div>
              <span className="text-gray-600">Одобренная книга</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-8 bg-yellow-400 mr-3 rounded animate-pulse"></div>
              <span className="text-gray-600">Найденная книга</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-8 bg-gray-400 mr-3 rounded"></div>
              <span className="text-gray-600">Недоступно</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Book Info Modal */}
      <BookInfoModal
        open={showBookInfoModal}
        onOpenChange={setShowBookInfoModal}
        item={selectedItem}
        isJournal={selectedItemIsJournal}
        shelfNumber={selectedItemShelfNumber}
        position={selectedItemPosition}
        onRemove={() => {}} // Disabled for readers
        onInstancesChange={() => {}} // Disabled for readers
        isReaderMode={true}
      />
    </div>
  );
} 