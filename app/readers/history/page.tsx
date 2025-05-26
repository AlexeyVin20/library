"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpenCheck, CalendarClock, Info, ListChecks } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Reservation {
  id: string;
  bookId: string;
  userId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
  // Предполагаем, что API может вернуть информацию о книге
  book?: {
    title: string;
    authors?: string;
    cover?: string;
  };
}

// Примерный компонент для отображения одного элемента бронирования
const ReservationItem: React.FC<{ reservation: Reservation }> = ({ reservation }) => {
  const router = useRouter();
  const formattedReservationDate = new Date(reservation.reservationDate).toLocaleDateString();
  const formattedExpirationDate = new Date(reservation.expirationDate).toLocaleDateString();

  const getStatusChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "активна":
      case "подтверждена":
      case "обрабатывается":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "возвращена":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "отменена":
      case "отменена_пользователем":
      case "истекла":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400";
    }
  };

  return (
    <div 
      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-lg rounded-lg p-4 md:p-6 mb-4 border border-white/20 dark:border-gray-700/30 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex flex-col md:flex-row gap-4">
        {reservation.book?.cover && (
          <div className="flex-shrink-0 w-24 h-32 md:w-28 md:h-40 relative">
            <img 
              src={reservation.book.cover} 
              alt={reservation.book.title || "Обложка книги"} 
              className="object-cover rounded-md w-full h-full"
            />
          </div>
        )}
        <div className="flex-grow">
          <h3 
            className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-1 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
            onClick={() => router.push(`/readers/books/${reservation.bookId}`)}
          >
            {reservation.book?.title || "Название неизвестно"}
          </h3>
          {reservation.book?.authors && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {reservation.book.authors}
            </p>
          )}
          <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p className="flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-emerald-500" />
              Забронировано: {formattedReservationDate} - действительно до: {formattedExpirationDate}
            </p>
            <p className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-emerald-500" />
              Статус: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusChipColor(reservation.status)}`}>{reservation.status}</span>
            </p>
            {reservation.notes && (
              <p className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                Заметка: {reservation.notes}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default function ReservationHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы просмотреть историю бронирований.",
        variant: "default",
        action: <Link href="/auth/login"><Button variant="outline">Войти</Button></Link>,
      });
      router.push("/auth/login");
      setLoading(false);
      return;
    }

    const fetchReservations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${baseUrl}/api/Reservation/user/${user.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setReservations([]); // Нет бронирований
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Не удалось загрузить историю бронирований. Статус: ${response.status}`);
          }
        } else {
          const data: Reservation[] = await response.json();
          // Сортируем бронирования: сначала активные, потом по дате (новые сначала)
          data.sort((a, b) => {
            const activeStatuses = ["активна", "подтверждена", "обрабатывается"];
            const aIsActive = activeStatuses.includes(a.status.toLowerCase());
            const bIsActive = activeStatuses.includes(b.status.toLowerCase());

            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;
            
            return new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime();
          });
          setReservations(data);
        }
      } catch (err) {
        console.error("Ошибка при загрузке истории бронирований:", err);
        const errorMessage = (err instanceof Error) ? err.message : "Произошла неизвестная ошибка.";
        setError(errorMessage);
        toast({
          title: "Ошибка загрузки",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [user, router, baseUrl]);

  if (user === undefined) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-700 dark:text-gray-300">Загрузка данных пользователя...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative py-8 px-4">
      {/* Floating shapes для фона */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl opacity-70"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl opacity-70"></div>
      
      <div className="container mx-auto relative z-10">
        <Button
          variant="ghost"
          className="mb-6 flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-200"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>

        <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <BookOpenCheck className="w-8 h-8 text-emerald-500" />
            История ваших бронирований
          </h1>

          {loading && (
            <div className="flex justify-center items-center py-10">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-10">
              <p className="text-red-500 dark:text-red-400">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4 bg-emerald-500 hover:bg-emerald-600">
                Попробовать снова
              </Button>
            </div>
          )}

          {!loading && !error && reservations.length === 0 && (
            <div className="text-center py-10">
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">У вас пока нет бронирований.</p>
              <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Link href="/readers/books">Найти книги</Link>
              </Button>
            </div>
          )}

          {!loading && !error && reservations.length > 0 && (
            <div>
              {reservations.map((reservation) => (
                <ReservationItem key={reservation.id} reservation={reservation} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 