"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlassMorphismContainer from '@/components/admin/GlassMorphismContainer';
import Link from "next/link";
import { use } from "react";

interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
  user?: {
    fullName: string;
    email?: string;
    phone?: string;
  };
  book?: {
    title: string;
    authors?: string;
  };
}

export default function ReservationDetailsPage({ params }: { params: Promise<{ reservationId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    fetchReservation();
  }, [resolvedParams.reservationId]);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Reservation/${resolvedParams.reservationId}`);
      if (!response.ok) throw new Error("Ошибка при загрузке резервации");
      const data = await response.json();
      setReservation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке резервации");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!reservation) return;

    try {
      const response = await fetch(`${baseUrl}/api/Reservation/${reservation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Ошибка при обновлении статуса");
      setReservation({ ...reservation, status: newStatus });
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err);
      alert(err instanceof Error ? err.message : "Ошибка при обновлении статуса");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Выполнена": return "from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60";
      case "Отменена": return "from-red-600/90 to-red-700/70 dark:from-red-700/80 dark:to-red-800/60";
      case "Обрабатывается": return "from-yellow-600/90 to-yellow-700/70 dark:from-yellow-700/80 dark:to-yellow-800/60";
      default: return "from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60";
    }
  };

  if (loading) return (
    <GlassMorphismContainer>
      <div className="flex justify-center items-center h-screen text-neutral-500 dark:text-neutral-200">
        Загрузка...
      </div>
    </GlassMorphismContainer>
  );

  if (error) return (
    <GlassMorphismContainer>
      <div className="p-4 bg-red-100/80 dark:bg-red-900/80 backdrop-blur-xl border border-red-400 text-red-700 dark:text-red-200 rounded-lg">
        {error}
      </div>
    </GlassMorphismContainer>
  );

  if (!reservation) return (
    <GlassMorphismContainer>
      <div className="p-4 bg-yellow-100/80 dark:bg-yellow-900/80 backdrop-blur-xl border border-yellow-400 text-yellow-700 dark:text-yellow-200 rounded-lg">
        Резервация не найдена
      </div>
    </GlassMorphismContainer>
  );

  return (
    <GlassMorphismContainer>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-500 dark:text-neutral-200">
            Детали резервации
          </h1>
          <Link 
            href="/admin/reservations"
            className="bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
          >
            Назад
          </Link>
        </div>

        <div className="grid gap-6">
          {/* Информация о книге */}
          <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
            <h2 className="text-xl font-semibold text-neutral-500 dark:text-neutral-200 mb-4">
              Информация о книге
            </h2>
            <div className="space-y-2">
              <p className="text-neutral-500 dark:text-neutral-200">
                <span className="font-medium">Название:</span> {reservation.book?.title || "Неизвестная книга"}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                <span className="font-medium">Автор:</span> {reservation.book?.authors || "Автор не указан"}
              </p>
            </div>
          </div>

          {/* Информация о пользователе */}
          <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
            <h2 className="text-xl font-semibold text-neutral-500 dark:text-neutral-200 mb-4">
              Информация о пользователе
            </h2>
            <div className="space-y-2">
              <p className="text-neutral-500 dark:text-neutral-200">
                <span className="font-medium">ФИО:</span> {reservation.user?.fullName || "Неизвестный пользователь"}
              </p>
              {reservation.user?.email && (
                <p className="text-neutral-600 dark:text-neutral-300">
                  <span className="font-medium">Email:</span> {reservation.user.email}
                </p>
              )}
              {reservation.user?.phone && (
                <p className="text-neutral-600 dark:text-neutral-300">
                  <span className="font-medium">Телефон:</span> {reservation.user.phone}
                </p>
              )}
            </div>
          </div>

          {/* Даты и статус */}
          <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
            <h2 className="text-xl font-semibold text-neutral-500 dark:text-neutral-200 mb-4">
              Даты и статус
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Дата запроса</p>
                  <p className="text-neutral-500 dark:text-neutral-200">{formatDate(reservation.reservationDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Дата возврата</p>
                  <p className="text-neutral-500 dark:text-neutral-200">{formatDate(reservation.expirationDate)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Статус</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusChange("Обрабатывается")}
                    className={`bg-gradient-to-r ${getStatusColor("Обрабатывается")} backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2`}
                  >
                    В обработке
                  </button>
                  <button
                    onClick={() => handleStatusChange("Выполнена")}
                    className={`bg-gradient-to-r ${getStatusColor("Выполнена")} backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2`}
                  >
                    Выполнена
                  </button>
                  <button
                    onClick={() => handleStatusChange("Отменена")}
                    className={`bg-gradient-to-r ${getStatusColor("Отменена")} backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2`}
                  >
                    Отменена
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Примечания */}
          {reservation.notes && (
            <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
              <h2 className="text-xl font-semibold text-neutral-500 dark:text-neutral-200 mb-4">
                Примечания
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300">
                {reservation.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </GlassMorphismContainer>
  );
} 