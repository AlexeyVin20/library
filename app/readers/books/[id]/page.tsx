"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, Share2, Calendar, User, BookMarked, ArrowLeft, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
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
  const [selectedReservationDate, setSelectedReservationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  // Статусы, которые считаются неактивными (пользователь может забронировать снова)
  const nonActiveReservationStatuses = ["отменена", "истекла", "возвращена", "отменена_пользователем"];
  useEffect(() => {
    const fetchBookData = async () => {
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
    };
    fetchBookData();
  }, [id, currentUserId, baseUrl]);
  const handleToggleFavorite = async () => {
    if (!currentUserId) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему, чтобы управлять избранным.",
        variant: "default",
        action: <Link href="/auth/login" variant="outline" className="text-gray-800 dark:text-white border-gray-800 dark:border-white">Войти</Link>
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
        action: <Link href="/auth/login" variant="outline">Войти</Link>
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
    setSelectedReservationDate(new Date().toISOString().split('T')[0]); // Сброс даты на сегодня
    setShowReservationModal(true);
  };
  const handleConfirmReservation = async () => {
    if (!currentUserId || !book) return;
    const reservationDate = new Date(selectedReservationDate);
    const expirationDate = new Date(selectedReservationDate);
    expirationDate.setDate(reservationDate.getDate() + 3); // Бронь на 3 дня

    const reservationData = {
      userId: currentUserId,
      bookId: book.id,
      reservationDate: reservationDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
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
      // Опционально: обновить availableCopies локально или перезапросить данные книги
      if (book && book.availableCopies) {
        setBook({
          ...book,
          availableCopies: book.availableCopies - 1
        });
      }
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
    return <div className="flex justify-center items-center h-screen">
        <motion.div animate={{
        rotate: 360
      }} transition={{
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear"
      }} className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full" />
      </div>;
  }
  if (!book) {
    return <div className="container mx-auto px-4 py-8">
        <div className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-2xl p-12 shadow-lg border border-white/20 dark:border-gray-700/30 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700 dark:text-gray-200">Книга не найдена</p>
          <Button className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => router.push("/readers/books")}>
            Вернуться к каталогу
          </Button>
        </div>
      </div>;
  }
  const calculatedExpirationDate = new Date(selectedReservationDate);
  calculatedExpirationDate.setDate(calculatedExpirationDate.getDate() + 3);
  return <div className="min-h-screen relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Button variant="ghost" className="mb-6 flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>

        <div className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/30 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
            <FadeInView>
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-[300px] h-[400px] mx-auto">
                  {book.cover ? <Image src={book.cover || "/placeholder.svg"} alt={book.title} fill className="object-cover rounded-xl shadow-lg" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" /> : <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 rounded-xl">
                      <BookOpen className="text-emerald-500 w-24 h-24" />
                    </div>}
                </div>
                <div className="flex gap-2 mt-6 w-full max-w-[300px]">
                  <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed" onClick={openReservationModal} disabled={isBookEffectivelyReservedByCurrentUser || (book.availableCopies ?? 0) <= 0}>
                    {isBookEffectivelyReservedByCurrentUser ? "Активно забронировано" : (book.availableCopies ?? 0) <= 0 ? "Нет в наличии" : "Забронировать"}
                  </Button>
                  <Button variant="outline" className={`border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-400 ${favoriteBookIds.has(book.id) ? "text-red-500 border-red-500 dark:text-red-400 dark:border-red-400" : "text-gray-700 dark:text-gray-300"}`} onClick={handleToggleFavorite}>
                    <Heart className={`h-5 w-5 ${favoriteBookIds.has(book.id) ? "fill-red-500" : ""}`} />
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-500 dark:hover:border-emerald-400">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </FadeInView>

            <FadeInView delay={0.2} className="md:col-span-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{book.title}</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">{book.authors || "Автор неизвестен"}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-800/10 rounded-lg p-3 border border-white/10 dark:border-gray-700/20">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <BookMarked className="h-4 w-4 text-emerald-500" />
                      <span>Жанр:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{book.genre}</span>
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-800/10 rounded-lg p-3 border border-white/10 dark:border-gray-700/20">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Calendar className="h-4 w-4 text-emerald-500" />
                      <span>Год издания:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{book.publishedDate}</span>
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-800/10 rounded-lg p-3 border border-white/10 dark:border-gray-700/20">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <User className="h-4 w-4 text-emerald-500" />
                      <span>Страниц:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{book.pageCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Описание</h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{book.description}</p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Доступность</h2>
                  <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-800/10 rounded-lg p-4 border border-white/10 dark:border-gray-700/20">
                    <div className="flex items-center justify-between">
                      <div className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{book.availableCopies ?? 0}</span>{" "}
                        экземпляров доступно
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${(book.availableCopies ?? 0) > 0 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {(book.availableCopies ?? 0) > 0 ? "В наличии" : "Нет в наличии"}
                      </div>
                    </div>
                  </div>
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
      }} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Подтверждение бронирования</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowReservationModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Вы собираетесь забронировать книгу:</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{book.title}</p>
              {book.authors && <p className="text-sm text-gray-500 dark:text-gray-400">{book.authors}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="reservationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Дата начала бронирования:
              </label>
              <input type="date" id="reservationDate" name="reservationDate" value={selectedReservationDate} onChange={e => setSelectedReservationDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowReservationModal(false)} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Отмена
              </Button>
              <Button onClick={handleConfirmReservation} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Подтвердить
              </Button>
            </div>
          </motion.div>
        </motion.div>}
    </div>;
}