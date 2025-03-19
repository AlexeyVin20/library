"use client";

import { useState, useEffect } from "react";
import GlassMorphismContainer from '@/components/admin/GlassMorphismContainer';
import Link from "next/link";

interface UserRequest {
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

export default function UserRequestsPage() {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Reservation`);
      if (!response.ok) throw new Error("Ошибка при загрузке запросов");
      const data = await response.json();
      setRequests(data.filter((r: UserRequest) => r.status === "Обрабатывается"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке запросов");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/Reservation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Выполнена" }),
      });

      if (!response.ok) throw new Error("Ошибка при обновлении запроса");
      setRequests(requests.filter(r => r.id !== id));
    } catch (err) {
      console.error("Ошибка при одобрении:", err);
      alert(err instanceof Error ? err.message : "Ошибка при одобрении запроса");
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/Reservation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Отменена" }),
      });

      if (!response.ok) throw new Error("Ошибка при обновлении запроса");
      setRequests(requests.filter(r => r.id !== id));
    } catch (err) {
      console.error("Ошибка при отклонении:", err);
      alert(err instanceof Error ? err.message : "Ошибка при отклонении запроса");
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

  if (loading) return (
    <GlassMorphismContainer>
      <div className="flex justify-center items-center h-screen text-neutral-700 dark:text-neutral-200">
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

  return (
    <GlassMorphismContainer>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-neutral-700 dark:text-neutral-200">
            Запросы пользователей
          </h1>
          <Link 
            href="/admin"
            className="bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
          >
            Назад
          </Link>
        </div>

        <div className="grid gap-6">
          {requests.length > 0 ? (
            requests.map((request) => (
              <div
                key={request.id}
                className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200">
                        {request.user?.fullName || "Неизвестный пользователь"}
                      </h2>
                      <div className="mt-2 space-y-1">
                        {request.user?.email && (
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Email: {request.user.email}
                          </p>
                        )}
                        {request.user?.phone && (
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Телефон: {request.user.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/20 dark:bg-neutral-700/20 rounded-lg p-4">
                      <h3 className="font-medium text-neutral-700 dark:text-neutral-200">
                        {request.book?.title || "Неизвестная книга"}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {request.book?.authors || "Автор не указан"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Дата запроса: {formatDate(request.reservationDate)}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Дата возврата: {formatDate(request.expirationDate)}
                      </p>
                    </div>

                    {request.notes && (
                      <div className="mt-4 p-3 bg-white/20 dark:bg-neutral-700/20 rounded-lg">
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                          Примечания: {request.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
                    >
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="bg-gradient-to-r from-red-600/90 to-red-700/70 dark:from-red-700/80 dark:to-red-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500 dark:text-neutral-400 text-lg">
                Нет активных запросов пользователей
              </p>
            </div>
          )}
        </div>
      </div>
    </GlassMorphismContainer>
  );
}
