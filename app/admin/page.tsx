'use client';

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { BookOpen, Users, AlertCircle, TrendingUp, CalendarIcon, ChevronRight, BarChart3, Layers, ArrowRight, Shield, ChevronDown, ChevronUp, Activity, Bookmark, PieChart, Sparkles, Clock, X, CheckCircle, XCircle } from "lucide-react";
import React from "react";
import { FloatingActionPanelRoot, FloatingActionPanelTrigger, FloatingActionPanelContent, FloatingActionPanelButton } from "@/components/ui/floating-action-panel";
import { PinContainer } from "@/components/ui/3d-pin";
import { PixelCanvas } from "@/components/ui/pixel-canvas";
import type { DateRange } from "react-day-picker";
import { QuickActionsMenu } from "@/components/admin/QuickActionsMenu";
import { ReservationsChart } from "@/components/admin/Chart_reservs";
import { RecentActivitiesTable } from "@/components/admin/RecentActivitiesTable";
import EventCalendar from "@/components/admin/EventCalendar";

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
const CountUp = ({
  end,
  duration = 2,
  decimals = 0
}: {
  end: number;
  duration?: number;
  decimals?: number;
}) => {
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
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
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
  }}>
      {children}
    </motion.div>;
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
  return <FadeInView delay={delay}>
      <motion.div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col border-2 border-blue-500">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          {title}
        </h3>
        <div className="flex-1 h-[300px] bg-gray-100 rounded-xl p-4 border border-gray-300">
          {children}
        </div>
        <Link href="/admin/statistics" className="mt-4">
          <span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center">
            Подробная статистика
            <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </Link>
      </motion.div>
    </FadeInView>;
};

// Компонент для карточки книги
const BookCard = ({
  book,
  index = 0
}: {
  book: Book;
  index?: number;
}) => {
  return <motion.div initial={{
    opacity: 0,
    x: -20
  }} animate={{
    opacity: 1,
    x: 0
  }} transition={{
    delay: 0.1 * index,
    duration: 0.3
  }} className="flex p-4 bg-white rounded-xl border-2 border-blue-500 mb-3 transition-all duration-300 hover:shadow-lg relative overflow-hidden">
      <PixelCanvas colors={['#3B82F6', '#2563EB', '#93C5FD']} gap={3} speed={8} variant="icon" noFocus />
      <div className="flex items-center w-full relative z-10">
        <div className="w-12 h-16 flex-shrink-0 bg-gray-100 rounded-lg mr-4 overflow-hidden shadow-md">
          {book.cover ? <img src={book.cover || "/placeholder.svg"} alt={book.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/admin/books/${book.id}`}>
            <h3 className="text-gray-800 font-medium truncate hover:text-blue-500 transition-colors">{book.title}</h3>
          </Link>
          <p className="text-sm text-gray-500 mt-1">{book.authors || "Автор не указан"}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded-full mr-1">
              {book.availableCopies}
            </span>
            экз.
          </p>
        </div>
      </div>
    </motion.div>;
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
  action?: {
    label: string;
    href: string;
  };
  delay?: number;
}) => {
  return <FadeInView delay={delay}>
      <motion.div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col border-2 border-blue-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          {action && <span className="text-blue-500 hover:text-blue-700 transition-colors text-sm font-medium flex items-center cursor-pointer">
              {action.label}
              <ChevronRight className="w-4 h-4 ml-1" />
            </span>}
        </div>
        <div className="flex-1">{children}</div>
      </motion.div>
    </FadeInView>;
};

// Улучшенный компонент для статуса
const StatusBadge = ({
  status
}: {
  status: string;
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Обрабатывается":
        return { 
          color: "bg-blue-500", 
          label: "В обработке",
          icon: <Clock className="w-3 h-3" />
        };
      case "Одобрена":
        return { 
          color: "bg-green-500", 
          label: "Одобрена",
          icon: <CheckCircle className="w-3 h-3" />
        };
      case "Отменена":
        return { 
          color: "bg-red-500", 
          label: "Отменена",
          icon: <XCircle className="w-3 h-3" />
        };
      case "Истекла":
        return { 
          color: "bg-orange-500", 
          label: "Истекла",
          icon: <AlertCircle className="w-3 h-3" />
        };
      case "Выдана":
        return { 
          color: "bg-blue-700", 
          label: "Выдана",
          icon: <CheckCircle className="w-3 h-3" />
        };
      case "Возвращена":
        return { 
          color: "bg-green-600", 
          label: "Возвращена",
          icon: <CheckCircle className="w-3 h-3" />
        };
      case "Просрочена":
        return { 
          color: "bg-red-600", 
          label: "Просрочена",
          icon: <XCircle className="w-3 h-3" />
        };
      case "Отменена_пользователем":
        return { 
          color: "bg-gray-600", 
          label: "Отменена пользователем",
          icon: <XCircle className="w-3 h-3" />
        };
      default:
        return { 
          color: "bg-gray-500", 
          label: "Неизвестно",
          icon: <AlertCircle className="w-3 h-3" />
        };
    }
  };

  const { color, label, icon } = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white rounded-full ${color} shadow`}>
      {icon}
      {label}
    </span>
  );
};

// Компонент для действий
const ActionButton = ({
  href,
  label,
  color = "blue",
  icon
}: {
  href: string;
  label: string;
  color?: "blue" | "blue-light" | "gray";
  icon?: React.ReactNode;
}) => {
  const colors = {
    blue: "bg-blue-500 hover:bg-blue-700 text-white",
    "blue-light": "bg-blue-300 hover:bg-blue-500 text-gray-800 hover:text-white",
    gray: "bg-gray-100 hover:bg-gray-200 text-gray-800"
  };
  return <Link href={href}>
      <motion.div className={`${colors[color]} font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-3 flex items-center justify-center gap-2 border-2 border-blue-500`} whileTap={{
      scale: 0.98
    }}>
        {icon}
        {label}
      </motion.div>
    </Link>;
};

// Компонент загрузки
const LoadingSpinner = () => {
  return <div className="flex flex-col justify-center items-center h-screen bg-gray-200">
      <motion.div animate={{
      rotate: 360
    }} transition={{
      duration: 1.5,
      repeat: Number.POSITIVE_INFINITY,
      ease: "linear"
    }} className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
      <motion.p initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.5
    }} className="mt-4 text-blue-500 font-medium">
        Загрузка данных...
      </motion.p>
    </div>;
};

// Компонент для угловой карточки
const CornerCard = ({
  title,
  value,
  subtitle,
  icon,
  color
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) => {
  return <motion.div initial={{
    opacity: 0,
    scale: 0.9
  }} animate={{
    opacity: 1,
    scale: 1
  }} transition={{
    duration: 0.5
  }} className={`bg-white rounded-xl p-6 shadow-lg border-2 border-blue-500 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} rounded-bl-full`}></div>
      <div className={`absolute top-3 right-3 w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
        {React.cloneElement(icon as React.ReactElement<any, any>, {className: "w-6 h-6 text-white"})}
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-800 mb-1">
        <CountUp end={value} />
      </p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </motion.div>;
};

// Быстрые диапазоны дат на русском
const quickRanges = [{
  label: "Сегодня",
  getRange: () => {
    const today = new Date();
    return {
      from: today,
      to: today
    };
  }
}, {
  label: "Вчера",
  getRange: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      from: yesterday,
      to: yesterday
    };
  }
}, {
  label: "Последние 7 дней",
  getRange: () => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 6);
    return {
      from,
      to
    };
  }
}, {
  label: "Последние 30 дней",
  getRange: () => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 29);
    return {
      from,
      to
    };
  }
}, {
  label: "С начала месяца",
  getRange: () => {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth(), 1);
    return {
      from,
      to
    };
  }
}, {
  label: "Прошлый месяц",
  getRange: () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      from,
      to
    };
  }
}, {
  label: "С начала года",
  getRange: () => {
    const to = new Date();
    const from = new Date(to.getFullYear(), 0, 1);
    return {
      from,
      to
    };
  }
}, {
  label: "Прошлый год",
  getRange: () => {
    const year = new Date().getFullYear() - 1;
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31);
    return {
      from,
      to
    };
  }
}];
export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [recentActivities, setRecentActivities] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recentBorrowed, setRecentBorrowed] = useState<number>(5);
  const [monthlyBorrowedData, setMonthlyBorrowedData] = useState<MonthlyBorrowedData[]>([]);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Ref для отслеживания скролла
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    scrollYProgress
  } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.1], [0, -20]);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  // Мемоизация вычисляемых свойств
  const activeUsersCount = useMemo(() => users.filter(u => u.borrowedBooksCount > 0).length, [users]);
  const totalUsersCount = useMemo(() => users.length, [users]);
  const pendingReservations = useMemo(() => reservations.filter(r => r.status === "Обрабатывается").length, [reservations]);
  const totalBorrowedBooks = useMemo(() => users.reduce((total, user) => total + user.borrowedBooksCount, 0), [users]);
  const totalAvailableBooks = useMemo(() => books.reduce((sum, book) => sum + book.availableCopies, 0), [books]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersResponse, booksResponse, journalsResponse, reservationsResponse] = await Promise.all([fetch(`${baseUrl}/api/User`), fetch(`${baseUrl}/api/Books`), fetch(`${baseUrl}/api/Journals`), fetch(`${baseUrl}/api/Reservation`)]);
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
        const sortedActivities = [...reservationsData].sort((a: Reservation, b: Reservation) => new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime()).slice(0, 10);
        setRecentActivities(sortedActivities);
        const lastSixMonths = Array.from({
          length: 6
        }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toLocaleString("ru-RU", {
            month: "short",
            year: "numeric"
          });
          const borrowed = reservationsData.filter((r: Reservation) => {
            const reservationMonth = new Date(r.reservationDate).toLocaleString("ru-RU", {
              month: "short",
              year: "numeric"
            });
            return reservationMonth === monthKey && r.status === "Выполнена";
          }).length;
          return {
            month: date.toLocaleString("ru-RU", {
              month: "short"
            }),
            borrowed
          };
        }).reverse();
        setMonthlyBorrowedData(lastSixMonths);

        // Количество новых книг за последний месяц
        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const newBooksThisMonth = booksData.filter((b: any) => b.dateAdded && new Date(b.dateAdded) > monthAgo).length;
        setRecentBorrowed(newBooksThisMonth);
        // Последние книги по дате добавления
        const recentBooksData = [...booksData].filter(b => b.dateAdded).sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()).slice(0, 6);
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
      minute: "2-digit"
    });
  };
  const reservationEvents = useMemo(() => reservations.map(reservation => ({
    id: reservation.id,
    userId: reservation.userId,
    bookId: reservation.bookId,
    reservationDate: reservation.reservationDate, // Оставляем полный формат даты
    expirationDate: reservation.expirationDate,
    status: reservation.status,
    notes: reservation.notes,
    userName: reservation.user?.fullName || "Неизвестный пользователь",
    bookTitle: reservation.book?.title || "Неизвестная книга"
  })), [reservations]);


  // Добавляем стиль для анимации строк таблицы
  useEffect(() => {
    const styleElement = document.createElement("style");
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
  if (error) return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} className="flex flex-col items-center justify-center h-screen p-6 bg-gray-200">
        <div className="bg-white text-red-800 p-6 rounded-xl border-2 border-red-100 max-w-md w-full text-center shadow-lg">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Произошла ошибка</h2>
          <p>{error}</p>
          <motion.button whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }} onClick={() => window.location.reload()} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md">
            Попробовать снова
          </motion.button>
        </div>
      </motion.div>;
  return <div className="min-h-screen bg-gray-200 relative" ref={containerRef}>
      <main className="max-w-7xl mx-auto space-y-8 relative z-10 p-6">
        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
          <PinContainer title="Книги" href="/admin/books" containerClassName="h-full w-full" className="h-full w-full">
            <Link href="/admin/books" className="flex flex-col justify-between h-full w-full bg-white rounded-xl p-6 border-2 border-blue-500 hover:shadow-xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <BookOpen className="text-blue-500 w-7 h-7" />
                  Книги
                </h3>
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-inner">
                  <BookOpen className="text-white w-7 h-7" />
                </div>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2 text-gray-800">
                  <CountUp end={totalAvailableBooks} />
                </p>
                <p className="text-sm text-gray-500">доступных ресурсов</p>
                <div className="mt-3 text-sm text-gray-500 flex items-center">
                  <span className="mr-1">+</span>
                  {recentBorrowed} <span className="ml-1">за последний месяц</span>
                </div>
              </div>
            </Link>
            <Link href="/admin/statistics" className="mt-4 block">
              <span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center cursor-pointer">
                Подробная статистика
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </Link>
          </PinContainer>
          <PinContainer title="Пользователи" href="/admin/users" containerClassName="h-full w-full" className="h-full w-full">
            <Link href="/admin/users" className="flex flex-col justify-between h-full w-full bg-white rounded-xl p-6 border-2 border-blue-500 hover:shadow-xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Users className="text-blue-500 w-7 h-7" />
                  Пользователи
                </h3>
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-inner">
                  <Users className="text-white w-7 h-7" />
                </div>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2 text-gray-800">
                  <CountUp end={activeUsersCount} />
                </p>
                <p className="text-sm text-gray-500">взяли книги</p>
                <div className="mt-3 text-sm text-gray-500">
                  {totalUsersCount ? Math.round(activeUsersCount / totalUsersCount * 100) : 0}% от общего числа
                </div>
              </div>
            </Link>
            <Link href="/admin/statistics" className="mt-4 block">
              <span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center cursor-pointer">
                Подробная статистика
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </Link>
          </PinContainer>
          <PinContainer title="Резервирования" href="/admin/reservations" containerClassName="h-full w-full" className="h-full w-full">
            <Link href="/admin/reservations" className="flex flex-col justify-between h-full w-full bg-white rounded-xl p-6 border-2 border-blue-500 hover:shadow-xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <CalendarIcon className="text-blue-500 w-7 h-7" />
                  Резервирования
                </h3>
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-inner">
                  <CalendarIcon className="text-white w-7 h-7" />
                </div>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2 text-gray-800">
                  <CountUp end={reservations.length} />
                </p>
                <p className="text-sm text-gray-500">всего заявок</p>
                <div className="mt-3 text-sm text-gray-500 flex items-center">
                  <span className="inline-block px-2 py-0.5 text-xs font-medium text-green-800 rounded-full bg-green-100">
                    {pendingReservations}
                  </span>
                  <span className="ml-2">в обработке</span>
                </div>
              </div>
            </Link>
            <Link href="/admin/statistics" className="mt-4 block">
              <span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center cursor-pointer">
                Подробная статистика
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </Link>
          </PinContainer>
        </div>

        {/* Улучшенный календарь событий */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col min-h-[500px]">
            <EventCalendar
              events={reservationEvents}
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
              showStatsModal={showStatsModal}
              onToggleStatsModal={() => setShowStatsModal(!showStatsModal)}
              quickRanges={quickRanges}
            />
          </div>
          <div className="space-y-3 flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Недавно добавленные книги
            </h3>
            <div className="relative">
              {recentBooks.length > 0 ? recentBooks.map((book, index) => <BookCard key={book.id} book={book} index={index} />) : <p className="text-gray-500">Нет доступных книг</p>}
            </div>
          </div>
        </div>

        {/* Последние активности с виртуализацией через react-virtuoso */}
        <ReservationsChart reservations={reservations} />
        <Section title="Последние активности" delay={1.0}>
          <RecentActivitiesTable data={recentActivities} />
        </Section>
      </main>
    </div>;
}