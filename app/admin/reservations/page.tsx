"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Reservation`);
      if (!response.ok) throw new Error("Ошибка при загрузке резерваций");
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке резерваций");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/Reservation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Ошибка при обновлении статуса");
      setReservations(reservations.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ));
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

  const getCardGradient = (status: string) => {
    switch(status) {
      case "Выполнена": return "from-green-300/50 to-green-300/40 dark:from-green-500/20 dark:to-green-600/10";
      case "Отменена": return "from-red-300/50 to-red-300/40 dark:from-red-500/20 dark:to-red-600/10";
      case "Обрабатывается": return "from-yellow-300/40 to-yellow-300/50 dark:from-yellow-500/20 dark:to-yellow-600/10";
      default: return "from-blue-300/50 to-blue-300/40 dark:from-blue-500/20 dark:to-blue-600/10";
    }
  };

  const filteredReservations = filter === "all" 
    ? reservations 
    : reservations.filter(r => r.status === filter);

  if (loading) return (
    <div className="flex justify-center items-center h-screen text-neutral-500 dark:text-neutral-200">
      Загрузка...
    </div>
  );

  if (error) return (
      <div className="p-4 bg-red-100/80 dark:bg-red-900/80 backdrop-blur-xl border border-red-400 text-red-700 dark:text-red-200 rounded-lg">
        {error}
      </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-500 dark:text-neutral-200">
            Резервации
          </h1>
          <div className="flex gap-4">
            <Link 
              href="/admin/reservations/create"
              className="bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
            >
              Создать резервацию
            </Link>
            <Link 
              href="/admin"
              className="bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
            >
              Назад
            </Link>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-4">
          <h2 className="text-lg font-semibold text-neutral-500 dark:text-neutral-200 mb-4">
            Фильтр по статусу
          </h2>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setFilter("all")}
              className={`bg-gradient-to-r ${filter === "all" ? "from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60" : "from-gray-600/90 to-gray-700/70 dark:from-gray-700/80 dark:to-gray-800/60"} backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2`}
            >
              Все
            </button>
            <button 
              onClick={() => setFilter("Обрабатывается")}
              className={`bg-gradient-to-r ${filter === "Обрабатывается" ? "from-yellow-600/90 to-yellow-700/70 dark:from-yellow-700/80 dark:to-yellow-800/60" : "from-gray-600/90 to-gray-700/70 dark:from-gray-700/80 dark:to-gray-800/60"} backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2`}
            >
              В обработке
            </button>
            <button 
              onClick={() => setFilter("Выполнена")}
              className={`bg-gradient-to-r ${filter === "Выполнена" ? "from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60" : "from-gray-600/90 to-gray-700/70 dark:from-gray-700/80 dark:to-gray-800/60"} backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2`}
            >
              Выполнены
            </button>
            <button 
              onClick={() => setFilter("Отменена")}
              className={`bg-gradient-to-r ${filter === "Отменена" ? "from-red-600/90 to-red-700/70 dark:from-red-700/80 dark:to-red-800/60" : "from-gray-600/90 to-gray-700/70 dark:from-gray-700/80 dark:to-gray-800/60"} backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2`}
            >
              Отклонены
            </button>
          </div>
        </div>

        {/* Список резерваций */}
        <div className="grid gap-6">
          {filteredReservations.length > 0 ? (
            filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className={`bg-gradient-to-br ${getCardGradient(reservation.status)} backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-500 dark:text-neutral-200">
                        {reservation.book?.title || "Неизвестная книга"}
                      </h2>
                      <p className="text-neutral-300 dark:text-neutral-300 mt-1">
                        {reservation.book?.authors || "Автор не указан"}
                      </p>
                    </div>

                    <div className={`rounded-lg p-4 border border-white/20 dark:border-neutral-700/20`}>
                      <h3 className="font-medium text-neutral-500 dark:text-neutral-200">
                        {reservation.user?.fullName || "Неизвестный пользователь"}
                      </h3>
                      <div className="mt-2 space-y-1">
                        {reservation.user?.email && (
                          <p className="text-sm text-neutral-300 dark:text-neutral-500">
                            Email: {reservation.user.email}
                          </p>
                        )}
                        {reservation.user?.phone && (
                          <p className="text-sm text-neutral-300 dark:text-neutral-500">
                            Телефон: {reservation.user.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-neutral-300 dark:text-neutral-500">
                        Дата запроса: {formatDate(reservation.reservationDate)}
                      </p>
                      <p className="text-sm text-neutral-300 dark:text-neutral-500">
                        Дата возврата: {formatDate(reservation.expirationDate)}
                      </p>
                    </div>

                    {reservation.notes && (
                      <div className={`mt-4 p-3 rounded-lg border border-white/20 dark:border-neutral-700/20`}>
                        <p className="text-sm text-neutral-300 dark:text-neutral-300">
                          Примечания: {reservation.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link
                      href={`/admin/reservations/${reservation.id}`}
                      className="bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2 text-center"
                    >
                      Подробнее
                    </Link>
                    {reservation.status === "Обрабатывается" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(reservation.id, "Выполнена")}
                          className="bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
                        >
                          Выполнена
                        </button>
                        <button
                          onClick={() => handleStatusChange(reservation.id, "Отменена")}
                          className="bg-gradient-to-r from-red-600/90 to-red-700/70 dark:from-red-700/80 dark:to-red-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
                        >
                          Отменить
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-300 dark:text-neutral-500 text-lg">
                Нет резерваций с выбранным статусом
              </p>
            </div>
          )}
        </div>
    </div>
  );
} 