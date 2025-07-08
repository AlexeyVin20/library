"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, BookOpen, Heart, Share2, Calendar, User, BookMarked, ArrowLeft, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getHighestPriorityRole } from "@/lib/types";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import QueuePosition from "@/components/ui/queue-position";
import QueueDisplay from "@/components/admin/QueueDisplay";
import { format, addDays } from "date-fns";
import { ru } from 'date-fns/locale';

interface Book {
  id: string;
  title: string;
  authors?: string;
  genre?: string;
  cover?: string;
  description?: string;
  publishedDate?: string;
  availableCopies?: number;
  pageCount?: number;
}

// Добавим тип для бронирования, если он отличается от общего
interface BookReservation {
  id: string;
  userId: string;
  bookId: string;
  status: string; // Добавляем статус для проверки активных бронирований
  // Можно добавить другие поля, если они приходят с /api/Reservation/book/{bookId}
}

// Компонент для анимированного появления
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5,
  className
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
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
  }} className={className}>
      {children}
    </motion.div>;
};
export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const {
    id
  } = params;
  const {
    user
  } = useAuth();
  const currentUserId = user?.id;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteBookIds, setFavoriteBookIds] = useState<Set<string>>(new Set());
  const [isBookEffectivelyReservedByCurrentUser, setIsBookEffectivelyReservedByCurrentUser] = useState(false);
  const [userActiveReservationId, setUserActiveReservationId] = useState<string | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [queueUpdateKey, setQueueUpdateKey] = useState(0); // Для принудительного обновления очереди
  
  // Состояния для дат начала и окончания
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Определяем максимальный срок резервирования
  const maxReservationDays = React.useMemo(() => {
    if (user && user.roles) {
      const userRole = getHighestPriorityRole(user.roles);
      return userRole?.loanPeriodDays || 7;
    }
    return 7;
  }, [user]);

  // При изменении startDate, устанавливаем endDate по умолчанию
  useEffect(() => {
    if (startDate) {
        setEndDate(addDays(startDate, maxReservationDays-1));
    }
  }, [startDate, maxReservationDays]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  // Статусы, которые считаются неактивными (пользователь может забронировать снова)
  const nonActiveReservationStatuses = ["отменена", "истекла", "возвращена", "отменена_пользователем"];
  
  const fetchBookData = React.useCallback(async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [bookResponse, favoritesResponse, allUserReservationsResponse] = await Promise.all([fetch(`${baseUrl}/api/books/${id}`), currentUserId ? fetch(`${baseUrl}/api/FavoriteBook/user/${currentUserId}`) : Promise.resolve(null), currentUserId ? fetch(`${baseUrl}/api/Reservation/user/${currentUserId}`) : Promise.resolve(null)]);
        if (!bookResponse.ok) {
          throw new Error("Ошибка при получении книги");
        }
        const bookData = await bookResponse.json();
        const coverUrl = bookData.cover || bookData.coverImage || bookData.coverImageUrl || bookData.image || bookData.coverUrl || bookData.imageUrl || "";
        setBook({
          id: bookData.id,
          title: bookData.title,
          authors: Array.isArray(bookData.authors) ? bookData.authors.join(", ") : bookData.authors,
          genre: bookData.genre || "Общая литература",
          cover: coverUrl,
          description: bookData.description || "Описание отсутствует",
          publishedDate: bookData.publishedDate || "Неизвестно",
          availableCopies: bookData.availableCopies || 0,
          pageCount: bookData.pageCount || Math.floor(Math.random() * 500) + 100
        });
        if (favoritesResponse) {
          if (favoritesResponse.ok) {
            const favoriteBooksData: {
              bookId: string;
            }[] = await favoritesResponse.json();
            setFavoriteBookIds(new Set(favoriteBooksData.map(fav => fav.bookId)));
          } else if (favoritesResponse.status !== 404) {
            console.warn("Не удалось загрузить избранные книги:", favoritesResponse.status);
          }
        }

        // Обработка ВСЕХ бронирований пользователя для поиска активного на ТЕКУЩУЮ книгу
        if (currentUserId && allUserReservationsResponse) {
          if (allUserReservationsResponse.ok) {
            const allUserReservations: BookReservation[] = await allUserReservationsResponse.json();
            let activeReservationForThisBook: BookReservation | undefined = undefined;
            if (Array.isArray(allUserReservations)) {
              // Ищем бронирование для текущей книги (bookId === id) среди всех бронирований пользователя
              activeReservationForThisBook = allUserReservations.find(res => res.bookId === id && res.status &&
              // Убедимся что статус есть
              !nonActiveReservationStatuses.includes(res.status.toLowerCase()));
            }
            // Если API может вернуть одиночный объект вместо массива, даже для /api/Reservation/user/{userId}
            // (что маловероятно для списка всех бронирований, но для полноты можно добавить обработку)
            // else if (allUserReservations && typeof allUserReservations === 'object' && (allUserReservations as BookReservation).bookId === id) { ... }

            if (activeReservationForThisBook) {
              setIsBookEffectivelyReservedByCurrentUser(true);
              setUserActiveReservationId(activeReservationForThisBook.id);
            } else {
              // Активного бронирования для ЭТОЙ книги не найдено
              setIsBookEffectivelyReservedByCurrentUser(false);
              setUserActiveReservationId(null);
            }
          } else if (allUserReservationsResponse.status === 404) {
            // 404: у пользователя вообще нет бронирований (значит и для этой книги тоже)
            setIsBookEffectivelyReservedByCurrentUser(false);
            setUserActiveReservationId(null);
          } else {
            // Другая ошибка при загрузке бронирований
            console.warn("Не удалось загрузить все бронирования пользователя:", allUserReservationsResponse.status);
            setIsBookEffectivelyReservedByCurrentUser(false);
            setUserActiveReservationId(null);
          }
        } else {
          // currentUserId отсутствует или запрос на бронирования не выполнялся
          setIsBookEffectivelyReservedByCurrentUser(false);
          setUserActiveReservationId(null);
        }
      } catch (error) {
        console.error("Ошибка получения данных:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить информацию.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }, [id, currentUserId, baseUrl]);

  // Функция для обновления данных очереди  
  const handleQueueUpdate = () => {
    setQueueUpdateKey(prev => prev + 1);
    fetchBookData(); // Перезагружаем данные книги
  };

  useEffect(() => {
    fetchBookData();
  }, [fetchBookData]);
  const handleToggleFavorite = async () => {
    if (!currentUserId) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему, чтобы управлять избранным.",
        variant: "default",
        action: <Button asChild variant="outline"><Link href="/auth/login">Войти</Link></Button>
      });
      return;
    }
    if (!book) return;
    const bookId = book.id;
    const isCurrentlyFavorite = favoriteBookIds.has(bookId);
    const originalFavorites = new Set(favoriteBookIds);
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
        setFavoriteBookIds(originalFavorites);
        toast({
          title: "Ошибка",
          description: errorData.message || `Не удалось обновить статус избранного. Код: ${response.status}`,
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Успех!",
        description: isCurrentlyFavorite ? "Книга удалена из избранного." : "Книга добавлена в избранное."
      });
    } catch (error) {
      setFavoriteBookIds(originalFavorites);
      console.error("Ошибка при обновлении избранного:", error);
      toast({
        title: "Ошибка сети",
        description: (error as Error).message || "Не удалось связаться с сервером для обновления избранного.",
        variant: "destructive"
      });
    }
  };
  const openReservationModal = () => {
    if (!currentUserId) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему, чтобы зарезервировать книгу.",
        variant: "default",
        action: <Button asChild variant="outline"><Link href="/auth/login">Войти</Link></Button>
      });
      return;
    }
    if (!book) return;
    if ((book.availableCopies ?? 0) <= 0 && !isBookEffectivelyReservedByCurrentUser) {
      // Проверяем доступность, только если еще не забронировано активно
      toast({
        title: "Книга недоступна",
        description: "К сожалению, все экземпляры этой книги уже зарезервированы или выданы.",
        variant: "default"
      });
      return;
    }
    if (isBookEffectivelyReservedByCurrentUser) {
      // Используем новое состояние
      toast({
        title: "Книга уже активно забронирована",
        description: "У вас уже есть активное бронирование на эту книгу.",
        variant: "default"
      });
      return;
    }
    // Сбрасываем даты при открытии
    setStartDate(new Date());
    setEndDate(addDays(new Date(), maxReservationDays - 1));
    setShowReservationModal(true);
  };
  const handleConfirmReservation = async () => {
    if (!currentUserId || !book || !startDate || !endDate) {
      toast({
        title: "Ошибка",
        description: "Необходимо выбрать начальную и конечную дату бронирования.",
        variant: "destructive"
      });
      return;
    }

    const reservationData = {
      userId: currentUserId,
      bookId: book.id,
      reservationDate: startDate.toISOString(),
      expirationDate: endDate.toISOString(),
      status: "Обрабатывается",
      notes: `Зарезервировано пользователем ${user?.username || currentUserId} через страницу книги.`
    };

    try {
      const response = await fetch(`${baseUrl}/api/Reservation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reservationData)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Не удалось создать бронирование. Код: ${response.status}`);
      }
      const newReservation = await response.json();
      toast({
        title: "Книга успешно зарезервирована!",
        description: `Ожидайте подтверждение от библиотекаря для книги "${book.title}".`,
        variant: "default"
      });
      setIsBookEffectivelyReservedByCurrentUser(true);
      setUserActiveReservationId(newReservation.id);
      setShowReservationModal(false);
      handleQueueUpdate(); // Обновляем данные очереди
    } catch (error) {
      console.error("Ошибка при создании бронирования:", error);
      toast({
        title: "Ошибка бронирования",
        description: (error as Error).message || "Произошла непредвиденная ошибка.",
        variant: "destructive"
      });
    }
  };
  const handleShare = () => {
    if (navigator.share && book) {
      navigator.share({
        title: book.title,
        text: `Проверьте эту книгу: ${book.title} от ${book.authors}`,
        url: window.location.href
      }).catch(error => console.error('Ошибка при попытке поделиться:', error));
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Ссылка скопирована",
        description: "Ссылка на книгу скопирована в буфер обмена"
      });
    }
  };
  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-200">
        <motion.div animate={{
        rotate: 360
      }} transition={{
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear"
      }} className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full" />
      </div>;
  }
  if (!book) {
    return <div className="min-h-screen bg-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl p-12 shadow-md border border-gray-100 text-center">
            <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-xl text-gray-800">Книга не найдена</p>
            <Button className="mt-6 bg-blue-500 hover:bg-blue-700 text-white rounded-lg" onClick={() => router.push("/readers/books")}>
              Вернуться к каталогу
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-200 relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Button variant="ghost" className="mb-6 flex items-center gap-2 hover:bg-gray-100 text-gray-800" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
            <FadeInView>
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-[300px] h-[400px] mx-auto">
                  {book.cover ? <Image src={book.cover || "/placeholder.svg"} alt={book.title} fill className="object-cover rounded-xl shadow-lg" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
                      <BookOpen className="text-blue-500 w-24 h-24" />
                    </div>}
                </div>
                <div className="flex gap-2 mt-6 w-full max-w-[300px]">
                  <Button className="flex-1 bg-blue-500 hover:bg-blue-700 text-white disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg" onClick={openReservationModal} disabled={isBookEffectivelyReservedByCurrentUser || (book.availableCopies ?? 0) <= 0}>
                    {isBookEffectivelyReservedByCurrentUser ? "Активно забронировано" : (book.availableCopies ?? 0) <= 0 ? "Нет в наличии" : "Забронировать"}
                  </Button>
                  <Button variant="outline" className={`border-gray-100 hover:border-red-500 rounded-lg ${favoriteBookIds.has(book.id) ? "text-red-500 border-red-500 bg-red-100" : "text-gray-800 bg-white"}`} onClick={handleToggleFavorite}>
                    <Heart className={`h-5 w-5 ${favoriteBookIds.has(book.id) ? "fill-red-500" : ""}`} />
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="border-gray-100 text-gray-800 bg-white hover:border-blue-500 rounded-lg">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </FadeInView>

            <FadeInView delay={0.2} className="md:col-span-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{book.title}</h1>
                <p className="text-lg text-gray-500 mb-4">{book.authors || "Автор неизвестен"}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-100 rounded-lg p-3 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <BookMarked className="h-4 w-4 text-blue-500" />
                      <span>Жанр:</span>
                      <span className="font-medium text-gray-800">{book.genre}</span>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>Год издания:</span>
                      <span className="font-medium text-gray-800">{book.publishedDate}</span>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <User className="h-4 w-4 text-blue-500" />
                      <span>Страниц:</span>
                      <span className="font-medium text-gray-800">{book.pageCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Описание</h2>
                  <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-blue-500">
                    <p className="text-gray-800 leading-relaxed">{book.description}</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Доступность</h2>
                  <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div className="text-gray-800">
                        <span className="font-medium text-gray-800">{book.availableCopies ?? 0}</span>{" "}
                        экземпляров доступно
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${(book.availableCopies ?? 0) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {(book.availableCopies ?? 0) > 0 ? "В наличии" : "Нет в наличии"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Компонент очереди для пользователя */}
                {currentUserId && (
                  <div key={queueUpdateKey} className="mt-6">
                    <QueuePosition
                      bookId={book.id}
                      userId={currentUserId}
                      bookTitle={book.title}
                      availableCopies={book.availableCopies}
                      isReserved={isBookEffectivelyReservedByCurrentUser}
                      onQueueUpdate={handleQueueUpdate}
                      maxReservationDays={maxReservationDays}
                    />
                  </div>
                )}

                                 {/* Отображение очереди на книгу (без персональных данных для обычных пользователей) */}
                 <div className="mt-6">
                   <QueueDisplay
                     bookId={book.id}
                     bookTitle={book.title}
                     showControls={false} // Обычные пользователи не могут управлять очередью
                     onQueueUpdate={handleQueueUpdate}
                     maxVisibleItems={3}
                     showUserNames={false} // Скрываем имена пользователей для обычных читателей
                   />
                 </div>
              </div>
            </FadeInView>
          </div>
        </div>
      </div>

      {/* Reservation Confirmation Modal */}
      {showReservationModal && book && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowReservationModal(false)}>
          <motion.div initial={{
        y: 50,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} exit={{
        y: 50,
        opacity: 0
      }} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Подтверждение бронирования</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowReservationModal(false)} className="text-gray-500 hover:text-gray-800">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">Вы собираетесь забронировать книгу:</p>
              <p className="text-lg font-medium text-gray-800">{book.title}</p>
              {book.authors && <p className="text-sm text-gray-500">{book.authors}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
               <div>
                 <label className="block text-sm font-medium text-gray-800 mb-1">
                    Дата начала:
                 </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP', { locale: ru }) : <span>Выберите дату</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <UiCalendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={[{ before: new Date() }, { dayOfWeek: [0, 6] }]}
                        initialFocus
                        locale={ru}
                        weekStartsOn={1}
                      />
                    </PopoverContent>
                  </Popover>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Дата окончания:
                  </label>
                   <Popover>
                    <PopoverTrigger asChild>
                       <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                        disabled={!startDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP', { locale: ru }) : <span>Выберите дату</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <UiCalendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={[
                            { before: startDate || new Date() }, 
                            { after: startDate ? addDays(startDate, maxReservationDays - 1) : new Date() },
                            { dayOfWeek: [0, 6] }
                        ]}
                        initialFocus
                        locale={ru}
                        weekStartsOn={1}
                      />
                    </PopoverContent>
                  </Popover>
               </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowReservationModal(false)} className="border-gray-100 text-gray-800 hover:bg-gray-100 rounded-lg">
                Отмена
              </Button>
              <Button onClick={handleConfirmReservation} className="bg-blue-500 hover:bg-blue-700 text-white rounded-lg">
                Подтвердить
              </Button>
            </div>
          </motion.div>
        </motion.div>}
    </div>;
}