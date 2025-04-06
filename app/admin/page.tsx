"use client";

import { useState, useEffect } from "react";
import Calendar from "@/components/admin/Calendar";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BookOpen } from "lucide-react";
import GlassMorphismContainer from '@/components/admin/GlassMorphismContainer';

// Динамический импорт компонентов с графиками
const MyChartStats = dynamic(() => import("@/components/admin/ChartStats"), { ssr: false });
const BorrowedBooksChart = dynamic(() => import("@/components/admin/BorrowedBooksChart"), { ssr: false });

// Определение типов
interface User {
  Id: string;
  FullName: string;
  BorrowedBooksCount: number;
  MaxBooksAllowed: number;
  FineAmount?: number;
}

interface Book {
  Id: string;
  Title: string;
  AvailableCopies: number;
  Cover?: string;
  Authors?: string;
}

interface Journal {
  Id: string;
  Title: string;
  IsOpenAccess: boolean;
  IsPeerReviewed: boolean;
}

interface Reservation {
  Id: string;
  UserId: string;
  BookId: string;
  ReservationDate: string;
  ExpirationDate: string;
  Status: string;
  Notes?: string;
  User?: User;
  Book?: Book;
}

interface MonthlyBorrowedData {
  month: string;
  borrowed: number;
}

// Theme classes с эффектом glassmorphism
const getThemeClasses = () => {
  return {
    card: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300 h-full flex flex-col",
    statsCard: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between",
    mainContainer: "bg-gray-100/70 dark:bg-neutral-900/70 backdrop-blur-xl min-h-screen p-6",
    button: "bg-gradient-to-r from-primary-admin/90 to-primary-admin/70 dark:from-primary-admin/80 dark:to-primary-admin/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-5 py-3 flex items-center justify-center gap-2",
    bookCard: "flex p-4 bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl rounded-lg border border-white/30 dark:border-neutral-700/30 mb-3 transition-all duration-300 hover:shadow-lg hover:-translate-x-1",
    sectionTitle: "text-2xl font-bold mb-4 text-neutral-500 dark:text-white border-b pb-2 border-white/30 dark:border-neutral-700/30",
    requestCard: "mb-4 p-5 rounded-lg border border-white/30 dark:border-neutral-700/30 bg-gradient-to-br from-gray-50/30 to-gray-50/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl hover:shadow-lg transition-all duration-300",
    statusBadge: {
      completed: "inline-block px-3 py-1 text-sm font-semibold text-white rounded-full bg-green-600/90 backdrop-blur-sm",
      processing: "inline-block px-3 py-1 text-sm font-semibold text-white rounded-full bg-yellow-600/90 backdrop-blur-sm",
      canceled: "inline-block px-3 py-1 text-sm font-semibold text-white rounded-full bg-red-600/90 backdrop-blur-sm",
    },
    tableRow: {
      even: "bg-gradient-to-r from-gray-50/30 to-gray-50/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-sm",
      odd: "bg-gradient-to-r from-white/30 to-white/20 dark:from-neutral-700/30 dark:to-neutral-800/20 backdrop-blur-sm",
    },
    actionButton: {
      approve: "bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2 flex items-center justify-center gap-2",
      reject: "bg-gradient-to-r from-red-600/90 to-red-700/70 dark:from-red-700/80 dark:to-red-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2 flex items-center justify-center gap-2",
      neutral: "bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2 flex items-center justify-center gap-2",
    },
  };
};

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [bookRequests, setBookRequests] = useState<Reservation[]>([]);
  const [userRequests, setUserRequests] = useState<Reservation[]>([]);
  const [recentActivities, setRecentActivities] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recentBorrowed, setRecentBorrowed] = useState<number>(5);
  const [monthlyBorrowedData, setMonthlyBorrowedData] = useState<MonthlyBorrowedData[]>([]);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const themeClasses = getThemeClasses();

  // Вычисляемые свойства
  const activeUsersCount = users.filter((u) => u.BorrowedBooksCount > 0).length;
  const totalUsersCount = users.length;
  const pendingReservations = reservations.filter((r) => r.Status === "Обрабатывается").length;
  const totalBorrowedBooks = users.reduce((total, user) => total + user.BorrowedBooksCount, 0);
  const totalAvailableBooks = books.reduce((sum, book) => sum + book.AvailableCopies, 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const usersResponse = await fetch(`${baseUrl}/api/Users`);
        if (!usersResponse.ok) throw new Error("Ошибка при загрузке пользователей");
        const usersData = await usersResponse.json();
        setUsers(usersData);

        const booksResponse = await fetch(`${baseUrl}/api/Books`);
        if (!booksResponse.ok) throw new Error("Ошибка при загрузке книг");
        const booksData = await booksResponse.json();
        setBooks(booksData);

        const journalsResponse = await fetch(`${baseUrl}/api/Journals`);
        if (!journalsResponse.ok) throw new Error("Ошибка при загрузке журналов");
        const journalsData = await journalsResponse.json();
        setJournals(journalsData);

        const reservationsResponse = await fetch(`${baseUrl}/api/Reservations`);
        if (!reservationsResponse.ok) throw new Error("Ошибка при загрузке резерваций");
        const reservationsData = await reservationsResponse.json();
        setReservations(reservationsData);

        const pendingRequests = reservationsData.filter((r: Reservation) => r.Status === "Обрабатывается");
        setBookRequests(pendingRequests);

        const userRequestsData = reservationsData
          .filter((r: Reservation) => r.Status === "Обрабатывается")
          .sort((a: Reservation, b: Reservation) => new Date(a.ReservationDate).getTime() - new Date(b.ReservationDate).getTime());
        setUserRequests(userRequestsData);

        const sortedActivities = [...reservationsData]
          .sort((a: Reservation, b: Reservation) => new Date(b.ReservationDate).getTime() - new Date(a.ReservationDate).getTime())
          .slice(0, 10);
        setRecentActivities(sortedActivities);

        const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toLocaleString("ru-RU", { month: "short", year: "numeric" });
          const borrowed = reservationsData.filter((r: Reservation) => {
            const reservationMonth = new Date(r.ReservationDate).toLocaleString("ru-RU", { month: "short", year: "numeric" });
            return reservationMonth === monthKey && r.Status === "Выполнена";
          }).length;
          return {
            month: date.toLocaleString("ru-RU", { month: "short" }),
            borrowed,
          };
        }).reverse();
        setMonthlyBorrowedData(lastSixMonths);

        const recentBooksData = [...booksData]
          .sort((a, b) => new Date(b.addedDate || "").getTime() - new Date(a.addedDate || "").getTime())
          .slice(0, 6);
        setRecentBooks(recentBooksData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
        console.error("Ошибка:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseUrl]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleApproveRequest = async (id: string) => {
    try {
      const reservation = reservations.find((r) => r.Id === id);
      if (!reservation) throw new Error("Резервация не найдена");

      const updatedReservation = {
        ...reservation,
        ReservationDate: new Date(reservation.ReservationDate).toISOString(),
        ExpirationDate: new Date(reservation.ExpirationDate).toISOString(),
        Status: "Выполнена",
      };

      const response = await fetch(`${baseUrl}/api/Reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReservation),
      });

      if (!response.ok) throw new Error("Ошибка при обновлении резервации");

      setBookRequests(bookRequests.filter((r) => r.Id !== id));
      setUserRequests(userRequests.filter((r) => r.Id !== id));
      setReservations(reservations.map((r) => (r.Id === id ? { ...r, Status: "Выполнена" } : r)));
      setRecentActivities(recentActivities.map((r) => (r.Id === id ? { ...r, Status: "Выполнена" } : r)));
    } catch (err) {
      console.error("Ошибка при одобрении:", err);
      alert(err instanceof Error ? err.message : "Ошибка при одобрении запроса");
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      const reservation = reservations.find((r) => r.Id === id);
      if (!reservation) throw new Error("Резервация не найдена");

      const updatedReservation = {
        ...reservation,
        ReservationDate: new Date(reservation.ReservationDate).toISOString(),
        ExpirationDate: new Date(reservation.ExpirationDate).toISOString(),
        Status: "Отменена",
      };

      const response = await fetch(`${baseUrl}/api/Reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReservation),
      });

      if (!response.ok) throw new Error("Ошибка при обновлении резервации");

      setBookRequests(bookRequests.filter((r) => r.Id !== id));
      setUserRequests(userRequests.filter((r) => r.Id !== id));
      setReservations(reservations.map((r) => (r.Id === id ? { ...r, Status: "Отменена" } : r)));
      setRecentActivities(recentActivities.map((r) => (r.Id === id ? { ...r, Status: "Отменена" } : r)));
    } catch (err) {
      console.error("Ошибка при отклонении:", err);
      alert(err instanceof Error ? err.message : "Ошибка при отклонении запроса");
    }
  };

  const reservationEvents = reservations.map((reservation) => ({
    Id: reservation.Id,
    UserId: reservation.UserId,
    BookId: reservation.BookId,
    ReservationDate: new Date(reservation.ReservationDate).toISOString().split("T")[0],
    ExpirationDate: new Date(reservation.ExpirationDate).toISOString().split("T")[0],
    Status: reservation.Status,
    Notes: reservation.Notes,
    UserName: reservation.User?.FullName || "Неизвестный пользователь",
    BookTitle: reservation.Book?.Title || "Неизвестная книга",
  }));

  if (loading) return <div className="flex justify-center items-center h-screen text-neutral-200 dark:text-neutral-100">Загрузка...</div>;
  if (error) return <div className="text-red-500 p-4 border border-red-300 rounded">{error}</div>;

  return (
    <GlassMorphismContainer
      backgroundPattern={true}
      isDarkMode={false} // Установите false для светлой темы
    >
      <main className="flex-1 space-y-8">
        {/* Статистические карточки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`${themeClasses.statsCard} border-l-4 border-blue-600 min-h-[200px]`}>
            <h3 className={themeClasses.sectionTitle}>Книги</h3>
            <p className="text-3xl font-bold text-blue-800 mt-4">{totalAvailableBooks}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-200 mt-2">доступных ресурсов</p>
            <p className="text-sm text-green-800 mt-2 flex items-center">
              <span className="mr-1">+</span>{recentBorrowed} <span className="ml-1">за последний месяц</span>
            </p>
          </div>
          <div className={`${themeClasses.statsCard} border-l-4 border-green-600 min-h-[200px]`}>
            <h3 className={themeClasses.sectionTitle}>Пользователи</h3>
            <p className="text-3xl font-bold text-green-800 mt-4">{activeUsersCount}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-200 mt-2">взяли книги</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-200 mt-2">
              {totalUsersCount ? Math.round((activeUsersCount / totalUsersCount) * 100) : 0}% от общего числа
            </p>
          </div>
          <div className={`${themeClasses.statsCard} border-l-4 border-red-600 min-h-[200px]`}>
            <h3 className={themeClasses.sectionTitle}>Штрафы</h3>
            <p className="text-3xl font-bold text-red-800 mt-4">
              {users.reduce((sum, user) => sum + (user.FineAmount || 0), 0).toFixed(2)} ₽
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-200 mt-2">общая сумма</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-200 mt-2 flex items-center">
              <span className={themeClasses.statusBadge.processing}>{pendingReservations}</span>
              <span className="ml-2">в обработке</span>
            </p>
          </div>
        </div>

        {/* Графики */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={themeClasses.card}>
            <div className="flex-1 h-[300px]">
              <MyChartStats totalBooks={totalAvailableBooks} recentBorrowed={recentBorrowed} totalBorrowed={totalBorrowedBooks} />
            </div>
          </div>
          <div className={themeClasses.card}>
            <div className="flex-1 h-[300px]">
              <BorrowedBooksChart data={monthlyBorrowedData} />
            </div>
          </div>
        </div>

        {/* Календарь и последние книги */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={themeClasses.card}>
            <h2 className={themeClasses.sectionTitle}>Календарь возвратов</h2>
            <div className="flex-1 h-[400px]">
              <Calendar initialEvents={reservationEvents} />
            </div>
          </div>
          <div className={themeClasses.card}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={themeClasses.sectionTitle}>Последние книги</h2>
              <Link href="/admin/books" className="text-blue-700 hover:text-blue-800 transition-colors hover:underline text-sm">
                Все книги →
              </Link>
            </div>
            <div className="space-y-3 flex-1">
              {recentBooks.length > 0 ? (
                recentBooks.map((book) => (
                  <div key={book.Id} className={themeClasses.bookCard}>
                    <div className="flex items-center w-full">
                      <div className="w-12 h-16 flex-shrink-0 bg-gray-200/50 dark:bg-neutral-700/50 rounded mr-4 overflow-hidden">
                        {book.Cover ? (
                          <img src={book.Cover} alt={book.Title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-neutral-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/admin/books/${book.Id}`}>
                          <h3 className="text-neutral-400 dark:text-neutral-100 font-medium truncate hover:text-blue-600 transition-colors">
                            {book.Title}
                          </h3>
                        </Link>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          {book.Authors || "Автор не указан"}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center">
                          <span className="inline-block px-2 py-0.5 bg-blue-100/50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full mr-1">
                            {book.AvailableCopies}
                          </span>
                          экз.
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-neutral-400 dark:text-neutral-400">Нет доступных книг</p>
              )}
            </div>
          </div>
        </div>

        {/* Запросы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={themeClasses.card}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={themeClasses.sectionTitle}>Запросы пользователей</h2>
              <Link href="/admin/requests/users" className="text-blue-600 hover:text-blue-800 transition-colors hover:underline text-sm">
                Все запросы →
              </Link>
            </div>
            <div className="flex-1 max-h-[400px] overflow-y-auto">
              {userRequests.length > 0 ? (
                userRequests.slice(0, 3).map((reservation) => (
                  <div key={reservation.Id} className={`${themeClasses.requestCard} border-l-4 border-yellow-500`}>
                    <p className="text-lg font-medium text-neutral-500 dark:text-neutral-100">
                      {reservation.User?.FullName || "Неизвестный пользователь"}
                    </p>
                    <p className="text-sm text-neutral-400 dark:text-neutral-400 mt-2">{reservation.Book?.Title || "Неизвестная книга"}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">{formatDate(reservation.ReservationDate)}</p>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleApproveRequest(reservation.Id)}
                        className={themeClasses.actionButton.approve}
                      >
                        Одобрить
                      </button>
                      <button
                        onClick={() => handleRejectRequest(reservation.Id)}
                        className={themeClasses.actionButton.reject}
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-neutral-400 dark:text-neutral-400">Нет запросов пользователей</p>
              )}
            </div>
          </div>

          <div className={themeClasses.card}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={themeClasses.sectionTitle}>Запросы на книги</h2>
              <Link href="/admin/requests/books" className="text-blue-600 hover:text-blue-800 transition-colors hover:underline text-sm">
                Все запросы →
              </Link>
            </div>
            <div className="flex-1 max-h-[400px] overflow-y-auto">
              {bookRequests.length > 0 ? (
                bookRequests.slice(0, 3).map((request) => (
                  <div key={request.Id} className={`${themeClasses.requestCard} border-l-4 border-blue-500`}>
                    <p className="text-lg font-medium text-neutral-500 dark:text-neutral-100">{request.Book?.Title || "Неизвестная книга"}</p>
                    <p className="text-sm text-neutral-400 dark:text-neutral-400 mt-2">
                      Пользователь: {request.User?.FullName || "Неизвестный пользователь"}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">{formatDate(request.ReservationDate)}</p>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleApproveRequest(request.Id)}
                        className={themeClasses.actionButton.approve}
                      >
                        Одобрить
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.Id)}
                        className={themeClasses.actionButton.reject}
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-neutral-400 dark:text-neutral-400">Нет активных запросов на книги</p>
              )}
            </div>
          </div>
        </div>

        {/* Последние активности */}
        <div className={themeClasses.card}>
          <h2 className={themeClasses.sectionTitle}>Последние активности</h2>
          <div className="overflow-x-auto flex-1 max-h-[400px]">
            <table className="min-w-full divide-y divide-gray-200/20 dark:divide-neutral-700/20">
              <thead className="bg-gradient-to-r from-gray-100/20 to-gray-100/10 dark:from-neutral-800/20 dark:to-neutral-900/10 backdrop-blur-sm rounded-t-lg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 dark:text-neutral-400 uppercase tracking-wider">Действие</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 dark:text-neutral-400 uppercase tracking-wider">Книга</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 dark:text-neutral-400 uppercase tracking-wider">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 dark:text-neutral-400 uppercase tracking-wider">Статус</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((reservation, index) => (
                  <tr key={reservation.Id} className={index % 2 === 0 ? themeClasses.tableRow.even : themeClasses.tableRow.odd}>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-600 dark:text-white">Резервация</td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-600 dark:text-white">{reservation.Book?.Title || "Неизвестная книга"}</td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-600 dark:text-white">{formatDate(reservation.ReservationDate)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          reservation.Status === "Выполнена"
                            ? themeClasses.statusBadge.completed
                            : reservation.Status === "Обрабатывается"
                            ? themeClasses.statusBadge.processing
                            : themeClasses.statusBadge.canceled
                        }
                      >
                        {reservation.Status === "Выполнена"
                          ? "Выполнена"
                          : reservation.Status === "Обрабатывается"
                          ? "В обработке"
                          : "Отменена"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link href="/admin/reservations" className={themeClasses.actionButton.neutral}>
            Посмотреть резервации
          </Link>
          <Link href="/admin/books" className={themeClasses.actionButton.approve}>
            Все книги
          </Link>
          <Link href="/admin/users" className={themeClasses.actionButton.neutral}>
            Управление пользователями
          </Link>
        </div>
      </main>
    </GlassMorphismContainer>
  );
}