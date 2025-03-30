"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, BookOpen, Users, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface Request {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
  requestType?: string;
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

interface User {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface Book {
  id: string;
  title: string;
  authors?: string;
  availableCopies: number;
}

interface Journal {
  id: string;
  title: string;
  editors?: string;
  issueNumber?: string;
  availableCopies: number;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isJournalTab, setIsJournalTab] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  
  const [formData, setFormData] = useState({
    userId: "",
    itemId: "",
    reservationDate: new Date().toISOString().split("T")[0],
    expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
    requestType: "book", // book или journal
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Reservation`);
      if (!response.ok) throw new Error("Ошибка при загрузке запросов");
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке запросов");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/User`);
      if (!response.ok) throw new Error("Ошибка при загрузке пользователей");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Ошибка при загрузке пользователей:", err);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/Books`);
      if (!response.ok) throw new Error("Ошибка при загрузке книг");
      const data = await response.json();
      setBooks(data.filter((book: Book) => book.availableCopies > 0));
    } catch (err) {
      console.error("Ошибка при загрузке книг:", err);
    }
  };
  
  const fetchJournals = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/Journals`);
      if (!response.ok) throw new Error("Ошибка при загрузке журналов");
      const data = await response.json();
      setJournals(data.filter((journal: Journal) => journal.availableCopies > 0));
    } catch (err) {
      console.error("Ошибка при загрузке журналов:", err);
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
      setRequests(requests.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ));
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err);
      alert(err instanceof Error ? err.message : "Ошибка при обновлении статуса");
    }
  };

  const handleApproveRequest = (id: string) => {
    handleStatusChange(id, "Выполнена");
  };

  const handleRejectRequest = (id: string) => {
    handleStatusChange(id, "Отменена");
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

  const filteredRequests = filter === "all" 
    ? requests 
    : requests.filter(r => r.status === filter);

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    // Загружаем данные для формы
    fetchUsers();
    fetchBooks();
    fetchJournals();
  };

  const handleHideCreateForm = () => {
    setShowCreateForm(false);
    // Сбрасываем данные формы
    setFormData({
      userId: "",
      itemId: "",
      reservationDate: new Date().toISOString().split("T")[0],
      expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "",
      requestType: "book",
    });
  };

  const handleChangeTab = (isJournal: boolean) => {
    setIsJournalTab(isJournal);
    setFormData(prev => ({
      ...prev,
      itemId: "",
      requestType: isJournal ? "journal" : "book"
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Определяем правильный идентификатор для API
      const apiData = {
        userId: formData.userId,
        bookId: formData.requestType === "book" ? formData.itemId : null,
        journalId: formData.requestType === "journal" ? formData.itemId : null,
        reservationDate: formData.reservationDate,
        expirationDate: formData.expirationDate,
        notes: formData.notes,
        status: "Обрабатывается",
      };

      const response = await fetch(`${baseUrl}/api/Reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) throw new Error("Ошибка при создании запроса");
      
      // После успешного создания обновляем список запросов
      fetchRequests();
      handleHideCreateForm();
    } catch (err) {
      console.error("Ошибка при создании запроса:", err);
      alert(err instanceof Error ? err.message : "Ошибка при создании запроса");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
      {showCreateForm ? (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-neutral-500 dark:text-neutral-200">
                Создание запроса
              </h1>
              <button
                onClick={handleHideCreateForm}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
              >
                <ArrowLeft size={18} />
                Назад к списку
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
                <div className="space-y-4">
                  {/* Тип запроса */}
                  <div className="mb-6">
                    <span className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-2">
                      Тип запроса
                    </span>
                    <div className="flex bg-white/20 dark:bg-neutral-700/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-lg overflow-hidden">
                      <button 
                        type="button"
                        onClick={() => handleChangeTab(false)}
                        className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${!isJournalTab ? 'bg-blue-500/50 text-white' : 'text-neutral-500 dark:text-neutral-200 hover:bg-white/10 dark:hover:bg-neutral-600/30'}`}
                      >
                        <BookOpen size={18} />
                        Книги
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleChangeTab(true)}
                        className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${isJournalTab ? 'bg-blue-500/50 text-white' : 'text-neutral-500 dark:text-neutral-200 hover:bg-white/10 dark:hover:bg-neutral-600/30'}`}
                      >
                        <Users size={18} />
                        Журналы
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="userId" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                      Пользователь
                    </label>
                    <select
                      id="userId"
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      required
                      className="w-full bg-white/20 dark:bg-neutral-700/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-lg px-4 py-2 text-neutral-500 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Выберите пользователя</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="itemId" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                      {isJournalTab ? "Журнал" : "Книга"}
                    </label>
                    <select
                      id="itemId"
                      name="itemId"
                      value={formData.itemId}
                      onChange={handleChange}
                      required
                      className="w-full bg-white/20 dark:bg-neutral-700/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-lg px-4 py-2 text-neutral-500 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{isJournalTab ? "Выберите журнал" : "Выберите книгу"}</option>
                      {isJournalTab 
                        ? journals.map((journal) => (
                            <option key={journal.id} value={journal.id}>
                              {journal.title} - {journal.editors || "Редактор не указан"} (Выпуск: {journal.issueNumber}) (Доступно: {journal.availableCopies})
                            </option>
                          ))
                        : books.map((book) => (
                            <option key={book.id} value={book.id}>
                              {book.title} - {book.authors || "Автор не указан"} (Доступно: {book.availableCopies})
                            </option>
                          ))
                      }
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="reservationDate" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                        Дата запроса
                      </label>
                      <input
                        type="date"
                        id="reservationDate"
                        name="reservationDate"
                        value={formData.reservationDate}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/20 dark:bg-neutral-700/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-lg px-4 py-2 text-neutral-500 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="expirationDate" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                        Дата возврата
                      </label>
                      <input
                        type="date"
                        id="expirationDate"
                        name="expirationDate"
                        value={formData.expirationDate}
                        onChange={handleChange}
                        required
                        min={formData.reservationDate}
                        className="w-full bg-white/20 dark:bg-neutral-700/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-lg px-4 py-2 text-neutral-500 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                      Примечания
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full bg-white/20 dark:bg-neutral-700/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-lg px-4 py-2 text-neutral-500 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-6 py-2"
                >
                  Создать запрос
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-neutral-500 dark:text-neutral-200">
                Запросы пользователей
              </h1>
              <div className="flex gap-4">
                <button 
                  onClick={handleShowCreateForm}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
                >
                  <PlusCircle size={18} />
                  Создать запрос
                </button>
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

            {/* Список запросов */}
            <div className="grid gap-6">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`bg-gradient-to-br ${getCardGradient(request.status)} backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-4">
                        <div className="flex items-start gap-6">
                          <div>
                            <h3 className="font-medium text-neutral-500 dark:text-neutral-200">
                              {request.user?.fullName || "Неизвестный пользователь"}
                            </h3>
                            <div className="mt-1 space-y-1">
                              {request.user?.email && (
                                <p className="text-sm text-neutral-300 dark:text-neutral-500">
                                  Email: {request.user.email}
                                </p>
                              )}
                              {request.user?.phone && (
                                <p className="text-sm text-neutral-300 dark:text-neutral-500">
                                  Телефон: {request.user.phone}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="bg-white/20 dark:bg-neutral-700/20 rounded-lg p-4 flex-1">
                            <h2 className="text-xl font-semibold text-neutral-500 dark:text-neutral-200">
                              {request.book?.title || "Неизвестная публикация"}
                            </h2>
                            <p className="text-neutral-300 dark:text-neutral-400 mt-1">
                              {request.book?.authors || "Автор не указан"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm text-neutral-300 dark:text-neutral-500">
                            Статус: <span className={request.status === "Выполнена" ? "text-green-500" : request.status === "Отменена" ? "text-red-500" : "text-yellow-500"}>{request.status}</span>
                          </p>
                          <p className="text-sm text-neutral-300 dark:text-neutral-500">
                            Дата запроса: {formatDate(request.reservationDate)}
                          </p>
                          <p className="text-sm text-neutral-300 dark:text-neutral-500">
                            Дата возврата: {formatDate(request.expirationDate)}
                          </p>
                        </div>

                        {request.notes && (
                          <div className="p-3 bg-white/20 dark:bg-neutral-700/20 rounded-lg">
                            <p className="text-sm text-neutral-300 dark:text-neutral-400">
                              Примечания: {request.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {request.status === "Обрабатывается" && (
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            className="flex items-center gap-2 bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
                          >
                            <CheckCircle size={18} />
                            Одобрить
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex items-center gap-2 bg-gradient-to-r from-red-600/90 to-red-700/70 dark:from-red-700/80 dark:to-red-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
                          >
                            <XCircle size={18} />
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-neutral-300 dark:text-neutral-500 text-lg">
                    Нет запросов с выбранным статусом
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
  );
} 