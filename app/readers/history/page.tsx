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
const ReservationItem: React.FC<{
  reservation: Reservation;
}> = ({
  reservation
}) => {
  const router = useRouter();
  const formattedReservationDate = new Date(reservation.reservationDate).toLocaleDateString();
  const formattedExpirationDate = new Date(reservation.expirationDate).toLocaleDateString();
  const getStatusChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "активна":
      case "подтверждена":
      case "обрабатывается":
        return "bg-blue-100 text-blue-800";
      case "возвращена":
        return "bg-green-100 text-green-800";
      case "отменена":
      case "отменена_пользователем":
      case "истекла":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return <div className="bg-white shadow-lg rounded-xl p-4 md:p-6 mb-4 border border-gray-200 hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-4">
        {reservation.book?.cover && <div className="flex-shrink-0 w-24 h-32 md:w-28 md:h-40 relative">
            <img src={reservation.book.cover} alt={reservation.book.title || "Обложка книги"} className="object-cover rounded-lg w-full h-full shadow-md" />
          </div>}
        <div className="flex-grow">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-1 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => router.push(`/readers/books/${reservation.bookId}`)}>
            {reservation.book?.title || "Название неизвестно"}
          </h3>
          {reservation.book?.authors && <p className="text-sm text-gray-500 mb-2">
              {reservation.book.authors}
            </p>}
          <div className="text-xs md:text-sm text-gray-500 space-y-2">
            <div className="bg-gray-100 border-l-4 border-blue-500 rounded-r-lg p-3">
              <p className="flex items-center gap-1.5 mb-1">
                <CalendarClock className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-gray-800 font-medium">Забронировано:</span> {formattedReservationDate}
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-gray-800 font-medium">Действительно до:</span> {formattedExpirationDate}
              </p>
            </div>
            <p className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-gray-800 font-medium">Статус:</span> 
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusChipColor(reservation.status)}`}>{reservation.status}</span>
            </p>
            {reservation.notes && <div className="bg-blue-100 border-l-4 border-blue-500 rounded-r-lg p-3">
                <p className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                  <span className="text-blue-800 font-medium">Заметка:</span> 
                  <span className="text-blue-800">{reservation.notes}</span>
                </p>
              </div>}
          </div>
        </div>
      </div>
    </div>;
};
export default function ReservationHistoryPage() {
  const router = useRouter();
  const {
    user
  } = useAuth();
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
        variant: "default"
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
        const errorMessage = err instanceof Error ? err.message : "Произошла неизвестная ошибка.";
        setError(errorMessage);
        toast({
          title: "Ошибка загрузки",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, [user, router, baseUrl]);
  if (user === undefined) {
    return <div className="min-h-screen bg-gray-200 flex justify-center items-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 flex items-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mr-4"></div>
          <p className="text-gray-800">Загрузка данных пользователя...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-200 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Button variant="ghost" className="mb-6 flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-800 rounded-lg px-4 py-2 shadow-md" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
          <div className="bg-blue-100/30 border-l-4 border-blue-500 rounded-r-lg p-6 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-2 flex items-center gap-3">
              <BookOpenCheck className="w-8 h-8 text-blue-500" />
              История ваших бронирований
            </h1>
            <p className="text-blue-700">Здесь отображаются все ваши бронирования книг с подробной информацией о статусе и датах.</p>
          </div>

          {loading && <div className="flex justify-center items-center py-10">
              <div className="bg-gray-100 rounded-xl p-6 flex items-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mr-4"></div>
                <p className="text-gray-800">Загружаем историю бронирований...</p>
              </div>
            </div>}

          {!loading && error && <div className="bg-red-100 border-l-4 border-red-500 rounded-r-lg p-6 text-center">
              <p className="text-red-800 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-700 text-white rounded-lg px-6 py-2">
                Попробовать снова
              </Button>
            </div>}

          {!loading && !error && reservations.length === 0 && <div className="text-center py-10">
              <div className="bg-gray-100 rounded-xl p-8">
                <BookOpenCheck className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <p className="text-lg text-gray-800 mb-4">У вас пока нет бронирований.</p>
                <p className="text-gray-500 mb-6">Начните исследовать нашу коллекцию книг и сделайте первое бронирование!</p>
                <Button asChild className="bg-blue-500 hover:bg-blue-700 text-white rounded-lg px-6 py-2">
                  <Link href="/readers/books">Найти книги</Link>
                </Button>
              </div>
            </div>}

          {!loading && !error && reservations.length > 0 && <div>
              <div className="bg-blue-100/30 border-l-4 border-blue-500 rounded-r-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  📋 Всего бронирований: <strong>{reservations.length}</strong>
                </p>
              </div>
              {reservations.map(reservation => <ReservationItem key={reservation.id} reservation={reservation} />)}
            </div>}
        </div>
      </div>
    </div>;
}