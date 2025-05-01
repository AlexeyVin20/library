"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Calendar from "@/components/admin/Calendar";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { BookOpen, Users, AlertCircle, TrendingUp, CalendarIcon, BookMarked, Clock, ChevronRight, CheckCircle2, XCircle, BarChart3, Layers, ArrowRight, Shield } from 'lucide-react';
import React from "react";

// Определение типов
interface User {
  id: string;
  fullName: string;
  borrowedBooksCount: number;
  maxBooksAllowed: number;
  fineAmount?: number;
}

interface Book {
  id: string;
  title: string;
  availableCopies: number;
  cover?: string;
  authors?: string;
}

interface Journal {
  id: string;
  title: string;
  isOpenAccess: boolean;
  isPeerReviewed: boolean;
}

interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
  user?: User;
  book?: Book;
}

interface MonthlyBorrowedData {
  month: string;
  borrowed: number;
}

// Компонент для анимированного счетчика
const CountUp = ({ end, duration = 2, decimals = 0 }: { end: number; duration?: number; decimals?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTime = useRef(0);
  
  useEffect(() => {
    startTime.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const progress = Math.min((now - startTime.current) / (duration * 1000), 1);
      countRef.current = progress * end;
      setCount(countRef.current);
      
      if (progress === 1) {
        clearInterval(interval);
      }
    }, 16);
    
    return () => clearInterval(interval);
  }, [end, duration]);
  
  return <>{count.toFixed(decimals)}</>;
};

// Компонент для анимированного появления
const FadeInView = ({ children, delay = 0, duration = 0.5 }: { children: React.ReactNode; delay?: number; duration?: number }) => {
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

// Компонент для карточки статистики
const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  additionalInfo, 
  icon, 
  color, 
  delay = 0 
}: { 
  title: string; 
  value: number; 
  subtitle: string; 
  additionalInfo?: React.ReactNode; 
  icon: React.ReactNode; 
  color: string;
  delay?: number;
}) => {
  return (
    <FadeInView delay={delay}>
      <motion.div 
        className={`backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between border border-white/20 dark:border-gray-700/30 relative overflow-hidden`}
      >
        <div className={`absolute top-0 left-0 w-1.5 h-full ${color}`}></div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {React.cloneElement(icon as React.ReactElement<any, any>, { className: 'w-7 h-7 drop-shadow-lg' })}
            {title}
          </h3>
          <div className={`w-12 h-12 rounded-full ${color} bg-opacity-30 dark:bg-opacity-40 flex items-center justify-center shadow-inner`}>
            {React.cloneElement(icon as React.ReactElement<any, any>, { className: 'w-7 h-7 drop-shadow-lg' })}
          </div>
        </div>
        <div>
          <p className={`text-4xl font-bold mb-2 text-white`}>
            <CountUp end={value} />
          </p>
          <p className="text-sm text-white">{subtitle}</p>
          {additionalInfo && (
            <div className="mt-3 text-sm text-white">
              {additionalInfo}
            </div>
          )}
        </div>
        <Link href="/admin/statistics" className="mt-4">
          <span className="text-white hover:text-emerald-300 text-sm font-medium flex items-center">
            Подробная статистика
            <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </Link>
      </motion.div>
    </FadeInView>
  );
};

// Компонент для карточки с графиком
const ChartCard = ({ 
  title, 
  children, 
  delay = 0 
}: { 
  title: string; 
  children: React.ReactNode; 
  delay?: number;
}) => {
  return (
    <FadeInView delay={delay}>
      <motion.div 
        className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-white/20 dark:border-gray-700/30"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          {title}
        </h3>
        <div className="flex-1 h-[300px] bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 border border-white/30 dark:border-gray-700/30">
          {children}
        </div>
        <Link href="/admin/statistics" className="mt-4">
          <span className="text-white hover:text-emerald-300 text-sm font-medium flex items-center">
            Подробная статистика
            <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </Link>
      </motion.div>
    </FadeInView>
  );
};

// Компонент для карточки с запросом
const RequestCard = ({ 
  request, 
  onApprove, 
  onReject, 
  type = "user",
  index = 0
}: { 
  request: Reservation; 
  onApprove: (id: string) => void; 
  onReject: (id: string) => void;
  type?: "user" | "book";
  index?: number;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.3 }}
      className={`mb-4 p-5 rounded-xl border border-white/20 dark:border-gray-700/30 backdrop-blur-xl bg-green/20 dark:bg-green/40 hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${type === "user" ? "bg-emerald-500" : "bg-emerald-400"}`}></div>
      <div className="flex justify-between">
        <div>
          <p className="text-lg font-medium text-white">
            {type === "user" 
              ? request.user?.fullName || "Неизвестный пользователь"
              : request.book?.title || "Неизвестная книга"
            }
          </p>
          <p className="text-sm text-white mt-2">
            {type === "user" 
              ? request.book?.title || "Неизвестная книга"
              : `Пользователь: ${request.user?.fullName || "Неизвестный пользователь"}`
            }
          </p>
          <p className="text-xs text-white mt-2 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(request.reservationDate).toLocaleString("ru-RU", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onApprove(request.id)} 
          className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors backdrop-blur-md shadow-md"
        >
          <CheckCircle2 className="w-4 h-4" />
          Одобрить
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onReject(request.id)} 
          className="bg-gray-500/80 hover:bg-gray-600/80 text-white font-medium rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors backdrop-blur-md shadow-md"
        >
          <XCircle className="w-4 h-4" />
          Отклонить
        </motion.button>
      </div>
    </motion.div>
  );
};

// Компонент для карточки книги
const BookCard = ({ book, index = 0 }: { book: Book; index?: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.3 }}
      className="flex p-4 backdrop-blur-xl bg-green/20 dark:bg-gray-800/30 rounded-xl border border-white/20 dark:border-gray-700/30 mb-3 transition-all duration-300 hover:shadow-lg"
    >
      <div className="flex items-center w-full">
        <div className="w-12 h-16 flex-shrink-0 bg-emerald-100/70 dark:bg-emerald-900/30 rounded-lg mr-4 overflow-hidden shadow-md">
          {book.cover ? (
            <img src={book.cover || "/placeholder.svg"} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/admin/books/${book.id}`}>
            <h3 className="text-white font-medium truncate hover:text-emerald-300 transition-colors">
              {book.title}
            </h3>
          </Link>
          <p className="text-sm text-white mt-1">
            {book.authors || "Автор не указан"}
          </p>
          <p className="text-xs text-white mt-1 flex items-center">
            <span className="inline-block px-2 py-0.5 bg-emerald-100/70 dark:bg-emerald-900/30 text-white rounded-full mr-1">
              {book.availableCopies}
            </span>
            экз.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Компонент для секции
const Section = ({ 
  title, 
  children, 
  action, 
  delay = 0 
}: { 
  title: string; 
  children: React.ReactNode; 
  action?: { label: string; href: string }; 
  delay?: number;
}) => {
  return (
    <FadeInView delay={delay}>
      <motion.div 
        className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-white/20 dark:border-gray-700/30"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {action && (
            <Link href={action.href}>
              <motion.span 
                className="text-white hover:text-emerald-300 transition-colors text-sm font-medium flex items-center"
                whileHover={{ x: 3 }}
              >
                {action.label}
                <ChevronRight className="w-4 h-4 ml-1" />
              </motion.span>
            </Link>
          )}
        </div>
        <div className="flex-1">
          {children}
        </div>
      </motion.div>
    </FadeInView>
  );
};

// Компонент для статуса
const StatusBadge = ({ status }: { status: string }) => {
  let color = "";
  let label = "";
  
  if (status === "Выполнена") {
    color = "bg-emerald-500";
    label = "Выполнена";
  } else if (status === "Обрабатывается") {
    color = "bg-emerald-400";
    label = "В обработке";
  } else {
    color = "bg-gray-500";
    label = "Отменена";
  }
  
  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium text-white rounded-full ${color} backdrop-blur-md shadow-sm`}>
      {label}
    </span>
  );
};

// Компонент для действий
const ActionButton = ({ 
  href, 
  label, 
  color = "emerald", 
  icon 
}: { 
  href: string; 
  label: string; 
  color?: "emerald" | "emerald-light" | "gray"; 
  icon?: React.ReactNode;
}) => {
  const colors = {
    "emerald": "bg-green-500/20 hover:bg-green-600/90 backdrop-blur-xl",
    "emerald-light": "bg-green-400/20 hover:bg-green-500/90 backdrop-blur-xl",
    "gray": "bg-green-500/20 hover:bg-green-600/90 backdrop-blur-xl"
  };
  
  return (
    <Link href={href}>
      <motion.div 
        className={`${colors[color]} backdrop-blur-xl text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-3 flex items-center justify-center gap-2 border border-white/10`}
        whileTap={{ scale: 0.98 }}
      >
        {icon}
        {label}
      </motion.div>
    </Link>
  );
};

// Компонент загрузки
const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full"
      />
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-emerald-600 dark:text-emerald-400 font-medium"
      >
        Загрузка данных...
      </motion.p>
    </div>
  );
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
  
  // Ref для отслеживания скролла
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.1], [0, -20]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  // Мемоизация вычисляемых свойств
  const activeUsersCount = useMemo(() => users.filter((u) => u.borrowedBooksCount > 0).length, [users]);
  const totalUsersCount = useMemo(() => users.length, [users]);
  const pendingReservations = useMemo(() => reservations.filter((r) => r.status === "Обрабатывается").length, [reservations]);
  const totalBorrowedBooks = useMemo(() => users.reduce((total, user) => total + user.borrowedBooksCount, 0), [users]);
  const totalAvailableBooks = useMemo(() => books.reduce((sum, book) => sum + book.availableCopies, 0), [books]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [usersResponse, booksResponse, journalsResponse, reservationsResponse] = await Promise.all([
          fetch(`${baseUrl}/api/User`),
          fetch(`${baseUrl}/api/Books`),
          fetch(`${baseUrl}/api/Journals`),
          fetch(`${baseUrl}/api/Reservation`),
        ]);

        if (!usersResponse.ok) throw new Error("Ошибка при загрузке пользователей");
        const usersData = await usersResponse.json();
        setUsers(usersData);

        if (!booksResponse.ok) throw new Error("Ошибка при загрузке книг");
        const booksData = await booksResponse.json();
        setBooks(booksData);

        if (!journalsResponse.ok) throw new Error("Ошибка при загрузке журналов");
        const journalsData = await journalsResponse.json();
        setJournals(journalsData);

        if (!reservationsResponse.ok) throw new Error("Ошибка при загрузке резервирований");
        const reservationsData = await reservationsResponse.json();
        setReservations(reservationsData);

        const pendingRequests = reservationsData.filter((r: Reservation) => r.status === "Обрабатывается");
        setBookRequests(pendingRequests);

        const userRequestsData = reservationsData
          .filter((r: Reservation) => r.status === "Обрабатывается")
          .sort((a: Reservation, b: Reservation) => new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime());
        setUserRequests(userRequestsData);

        const sortedActivities = [...reservationsData]
          .sort((a: Reservation, b: Reservation) => new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime())
          .slice(0, 10);
        setRecentActivities(sortedActivities);

        const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toLocaleString("ru-RU", { month: "short", year: "numeric" });
          const borrowed = reservationsData.filter((r: Reservation) => {
            const reservationMonth = new Date(r.reservationDate).toLocaleString("ru-RU", { month: "short", year: "numeric" });
            return reservationMonth === monthKey && r.status === "Выполнена";
          }).length;
          return { month: date.toLocaleString("ru-RU", { month: "short" }), borrowed };
        }).reverse();
        setMonthlyBorrowedData(lastSixMonths);

        // Количество новых книг за последний месяц
        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const newBooksThisMonth = booksData.filter((b: any) => b.dateAdded && new Date(b.dateAdded) > monthAgo).length;
        setRecentBorrowed(newBooksThisMonth);
        // Последние книги по дате добавления
        const recentBooksData = [...booksData]
          .filter((b) => b.dateAdded)
          .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
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

  // Восстанавливаем определение функции formatDate
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleApproveRequest = useCallback(async (id: string) => {
    try {
      const reservation = reservations.find((r) => r.id === id);
      if (!reservation) throw new Error("Резервирование не найдено");

      const updatedReservation = {
        ...reservation,
        reservationDate: new Date(reservation.reservationDate).toISOString(),
        expirationDate: new Date(reservation.expirationDate).toISOString(),
        status: "Выполнена",
      };

      const response = await fetch(`${baseUrl}/api/Reservation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReservation),
      });

      if (!response.ok) throw new Error("Ошибка при обновлении резервирования");

      setBookRequests((prev) => prev.filter((r) => r.id !== id));
      setUserRequests((prev) => prev.filter((r) => r.id !== id));
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Выполнена" } : r)));
      setRecentActivities((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Выполнена" } : r)));
    } catch (err) {
      console.error("Ошибка при одобрении:", err);
      alert(err instanceof Error ? err.message : "Ошибка при одобрении запроса");
    }
  }, [reservations, baseUrl]);

  const handleRejectRequest = useCallback(async (id: string) => {
    try {
      const reservation = reservations.find((r) => r.id === id);
      if (!reservation) throw new Error("Резервирование не найдено");

      const updatedReservation = {
        ...reservation,
        reservationDate: new Date(reservation.reservationDate).toISOString(),
        expirationDate: new Date(reservation.expirationDate).toISOString(),
        status: "Отменена",
      };

      const response = await fetch(`${baseUrl}/api/Reservation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReservation),
      });

      if (!response.ok) throw new Error("Ошибка при обновлении резервирования");

      setBookRequests((prev) => prev.filter((r) => r.id !== id));
      setUserRequests((prev) => prev.filter((r) => r.id !== id));
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Отменена" } : r)));
      setRecentActivities((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Отменена" } : r)));
    } catch (err) {
      console.error("Ошибка при отклонении:", err);
      alert(err instanceof Error ? err.message : "Ошибка при отклонении запроса");
    }
  }, [reservations, baseUrl]);

  const reservationEvents = useMemo(() =>
    reservations.map((reservation) => ({
      id: reservation.id,
      userId: reservation.userId,
      bookId: reservation.bookId,
      reservationDate: new Date(reservation.reservationDate).toISOString().split("T")[0],
      expirationDate: new Date(reservation.expirationDate).toISOString().split("T")[0],
      status: reservation.status,
      notes: reservation.notes,
      userName: reservation.user?.fullName || "Неизвестный пользователь",
      bookTitle: reservation.book?.title || "Неизвестная книга",
    })),
    [reservations]
  );

  // Добавляем стиль для анимации строк таблицы
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  if (loading) return <LoadingSpinner />;
  
  if (error) return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-screen p-6"
    >
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-red-600 dark:text-red-400 p-6 rounded-xl border border-white/20 dark:border-gray-700/30 max-w-md w-full text-center shadow-lg">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Произошла ошибка</h2>
        <p>{error}</p>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="mt-4 bg-emerald-500/90 hover:bg-emerald-600/90 text-white px-4 py-2 rounded-lg font-medium shadow-md backdrop-blur-md"
        >
          Попробовать снова
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen relative" ref={containerRef}>

      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      <main className="max-w-7xl mx-auto space-y-8 relative z-10 p-6">

        {/* Статистические карточки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Книги" 
            value={totalAvailableBooks}
            subtitle="доступных ресурсов"
            additionalInfo={
              <p className="text-white-600 dark:text-white-400 flex items-center">
                <span className="mr-1">+</span>{recentBorrowed} <span className="ml-1">за последний месяц</span>
              </p>
            }
            icon={<BookOpen className="text-emerald-500" />}
            color="bg-emerald-500"
            delay={0.1}
          />
          <StatCard 
            title="Пользователи" 
            value={activeUsersCount}
            subtitle="взяли книги"
            additionalInfo={
              <p className="text-black-600 dark:text-black-300">
                {totalUsersCount ? Math.round((activeUsersCount / totalUsersCount) * 100) : 0}% от общего числа
              </p>
            }
            icon={<Users className="text-blue-500" />}
            color="bg-blue-500"
            delay={0.2}
          />
          <StatCard 
            title="Штрафы" 
            value={users.reduce((sum, user) => sum + (user.fineAmount || 0), 0)}
            subtitle="общая сумма"
            additionalInfo={
              <div className="flex items-center">
                <StatusBadge status="Обрабатывается" />
                <span className="ml-2">{pendingReservations} в обработке</span>
              </div>
            }
            icon={<AlertCircle className="text-red-500" />}
            color="bg-red-500"
            delay={0.3}
          />
        </div>

        {/* Календарь и последние книги */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex-1 h-[700px]">
              <Calendar initialEvents={reservationEvents} />
            </div>

            <div className="space-y-3 flex-1">
              {recentBooks.length > 0 ? (
                recentBooks.map((book, index) => (
                  <BookCard key={book.id} book={book} index={index} />
                ))
              ) : (
                <p className="text-black-600 dark:text-black-300">Нет доступных книг</p>
              )}
            </div>
        </div>

        {/* Запросы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section 
            title="Запросы пользователей" 
            action={{ label: "Все запросы", href: "/admin/requests/users" }}
            delay={0.8}
          >
            <div className="flex-1 max-h-[400px] overflow-y-auto">
              {userRequests.length > 0 ? (
                userRequests.slice(0, 3).map((reservation, index) => (
                  <RequestCard 
                    key={reservation.id} 
                    request={reservation} 
                    onApprove={handleApproveRequest} 
                    onReject={handleRejectRequest}
                    type="user"
                    index={index}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-black-600 dark:text-black-300">
                  <Users className="w-12 h-12 mb-2 text-black-300 dark:text-black-600" />
                  <p>Нет запросов пользователей</p>
                </div>
              )}
            </div>
          </Section>

          <Section 
            title="Запросы на книги" 
            action={{ label: "Все запросы", href: "/admin/requests/books" }}
            delay={0.9}
          >
            <div className="flex-1 max-h-[400px] overflow-y-auto">
              {bookRequests.length > 0 ? (
                bookRequests.slice(0, 3).map((request, index) => (
                  <RequestCard 
                    key={request.id} 
                    request={request} 
                    onApprove={handleApproveRequest} 
                    onReject={handleRejectRequest}
                    type="book"
                    index={index}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-black-600 dark:text-black-300">
                  <BookMarked className="w-12 h-12 mb-2 text-black-300 dark:text-black-600" />
                  <p>Нет активных запросов на книги</p>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Последние активности с виртуализацией через react-virtuoso */}
        <Section title="Последние активности" delay={1.0}>
          <div className="flex-1 max-h-[400px] bg-green/20 dark:bg-gren/70 backdrop-blur-md rounded-xl overflow-hidden border border-white/30 dark:border-gray-700/30 w-full">
            <div className="overflow-auto" style={{ height: 400, width: "100%" }}>
              <table className="min-w-full" cellPadding={0} cellSpacing={0}>
                <thead className="sticky top-0 bg-emerald-50/80 dark:bg-emerald-900/30 backdrop-blur-md w-full">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-large text-green-700 dark:text-gray-200 uppercase tracking-wider w-1/4">Действие</th>
                    <th className="px-6 py-3 text-left text-xs font-large text-green-700 dark:text-gray-200 uppercase tracking-wider w-1/4">Книга</th>
                    <th className="px-6 py-3 text-left text-xs font-large text-green-700 dark:text-gray-200 uppercase tracking-wider w-1/4">Дата</th>
                    <th className="px-6 py-3 text-left text-xs font-large text-green-700 dark:text-gray-200 uppercase tracking-wider w-1/4">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((reservation, index) => (
                    <tr 
                      key={reservation.id}
                      className="border-b border-white/20 dark:border-gray-700/30 hover:bg-emerald-100/40 dark:hover:bg-emerald-900/20 cursor-pointer"
                      style={{
                        opacity: 0,
                        transform: 'translateX(-20px)',
                        animation: `fadeIn 0.5s ease-out ${0.1 * index}s forwards`
                      }}
                      onClick={() => window.location.href = `/admin/reservations/${reservation.id}`}
                    >
                      <td className="px-6 py-4 text-lg font-large text-black-800 dark:text-black-100 underline">Резервирование</td>
                      <td className="px-6 py-4 text-lg font-large text-black-800 dark:text-black-100 underline">{reservation.book?.title || "Неизвестная книга"}</td>
                      <td className="px-6 py-4 text-lg font-large text-black-800 dark:text-black-100 underline">{formatDate(reservation.reservationDate)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={reservation.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* Быстрые действия */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <ActionButton 
            href="/admin/reservations" 
            label="Посмотреть резервирования" 
            color="emerald-light"
            icon={<CalendarIcon className="w-5 h-5" />}
          />
          <ActionButton 
            href="/admin/books" 
            label="Все книги" 
            color="emerald" 
            icon={<Layers className="w-5 h-5" />}
          />
          <ActionButton 
            href="/admin/users" 
            label="Управление пользователями" 
            color="emerald-light" 
            icon={<Users className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <ActionButton 
            href="/admin/roles" 
            label="Управление ролями" 
            color="emerald" 
            icon={<Shield className="w-5 h-5" />}
          />
        </div>
      </main>
    </div>
  );
}
