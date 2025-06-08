"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Calendar as DayPickerCalendar } from "@/components/ui/calendar";
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
      <motion.div className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-white/20 dark:border-gray-700/30">
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
  }} className="flex p-4 backdrop-blur-xl bg-green/20 dark:bg-gray-800/30 rounded-xl border border-white/20 dark:border-gray-700/30 mb-3 transition-all duration-300 hover:shadow-lg relative overflow-hidden">
      <PixelCanvas colors={['#34d399', '#10b981', '#059669']} gap={2} speed={10} variant="icon" noFocus />
      <div className="flex items-center w-full relative z-10">
        <div className="w-12 h-16 flex-shrink-0 bg-emerald-100/70 dark:bg-emerald-900/30 rounded-lg mr-4 overflow-hidden shadow-md">
          {book.cover ? <img src={book.cover || "/placeholder.svg"} alt={book.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/admin/books/${book.id}`}>
            <h3 className="text-white font-medium truncate hover:text-emerald-300 transition-colors">{book.title}</h3>
          </Link>
          <p className="text-sm text-white mt-1">{book.authors || "Автор не указан"}</p>
          <p className="text-xs text-white mt-1 flex items-center">
            <span className="inline-block px-2 py-0.5 bg-emerald-100/70 dark:bg-emerald-900/30 text-white rounded-full mr-1">
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
      <motion.div className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-white/20 dark:border-gray-700/30">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {action && <span className="text-white hover:text-emerald-300 transition-colors text-sm font-medium flex items-center cursor-pointer">
              {action.label}
              <ChevronRight className="w-4 h-4 ml-1" />
            </span>}
        </div>
        <div className="flex-1">{children}</div>
      </motion.div>
    </FadeInView>;
};

// Компонент для статуса
const StatusBadge = ({
  status
}: {
  status: string;
}) => {
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
  return <span className={`inline-block px-3 py-1 text-xs font-medium text-white rounded-full ${color} backdrop-blur-md shadow-sm`}>
      {label}
    </span>;
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
    emerald: "bg-green-500/20 hover:bg-green-600/90 backdrop-blur-xl",
    "emerald-light": "bg-green-400/20 hover:bg-green-500/90 backdrop-blur-xl",
    gray: "bg-green-500/20 hover:bg-green-600/90 backdrop-blur-xl"
  };
  return <Link href={href}>
      <motion.div className={`${colors[color]} backdrop-blur-xl text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-3 flex items-center justify-center gap-2 border border-white/10`} whileTap={{
      scale: 0.98
    }}>
        {icon}
        {label}
      </motion.div>
    </Link>;
};

// Компонент загрузки
const LoadingSpinner = () => {
  return <div className="flex flex-col justify-center items-center h-screen">
      <motion.div animate={{
      rotate: 360
    }} transition={{
      duration: 1.5,
      repeat: Number.POSITIVE_INFINITY,
      ease: "linear"
    }} className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full" />
      <motion.p initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.5
    }} className="mt-4 text-emerald-600 dark:text-emerald-400 font-medium">
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
  }} className={`backdrop-blur-xl bg-green/30 dark:bg-green/50 rounded-2xl p-6 shadow-lg border border-white/30 dark:border-white/10 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-20 rounded-bl-full`}></div>
      <div className={`absolute top-3 right-3 w-12 h-12 rounded-full ${color} bg-opacity-30 flex items-center justify-center`}>
        {React.cloneElement(icon as React.ReactElement<any, any>, {/* className: "w-6 h-6 text-white" */})}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-3xl font-bold text-white mb-1">
        <CountUp end={value} />
      </p>
      <p className="text-sm text-white/80">{subtitle}</p>
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
  const [showRangeModal, setShowRangeModal] = useState(false);

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
    reservationDate: new Date(reservation.reservationDate).toISOString().split("T")[0],
    expirationDate: new Date(reservation.expirationDate).toISOString().split("T")[0],
    status: reservation.status,
    notes: reservation.notes,
    userName: reservation.user?.fullName || "Неизвестный пользователь",
    bookTitle: reservation.book?.title || "Неизвестная книга"
  })), [reservations]);
  const filteredEvents = useMemo(() => {
    if (!selectedRange?.from || !selectedRange?.to) return [];
    const fromTime = selectedRange.from.getTime();
    const toTime = selectedRange.to.getTime();
    return reservationEvents.filter(ev => {
      const date = new Date(ev.reservationDate).getTime();
      return date >= fromTime && date <= toTime;
    });
  }, [reservationEvents, selectedRange]);

  // Получить 3 ближайших события (по дате бронирования)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Установить время на начало дня для корректного сравнения дат

    return [...reservationEvents].filter(ev => {
      const eventDate = new Date(ev.reservationDate);
      // При сравнении дат важно убедиться, что мы не отбрасываем события сегодняшнего дня
      // Преобразуем дату события к началу дня в локальном часовом поясе для сравнения
      const localEventDate = new Date(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate());
      return localEventDate >= today;
    }).sort((a, b) => new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime()).slice(0, 3);
  }, [reservationEvents]);

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
  }} className="flex flex-col items-center justify-center h-screen p-6">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-red-600 dark:text-red-400 p-6 rounded-xl border border-white/20 dark:border-gray-700/30 max-w-md w-full text-center shadow-lg">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Произошла ошибка</h2>
          <p>{error}</p>
          <motion.button whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }} onClick={() => window.location.reload()} className="mt-4 bg-emerald-500/90 hover:bg-emerald-600/90 text-white px-4 py-2 rounded-lg font-medium shadow-md backdrop-blur-md">
            Попробовать снова
          </motion.button>
        </div>
      </motion.div>;
  return <div className="min-h-screen relative" ref={containerRef}>
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      <main className="max-w-7xl mx-auto space-y-8 relative z-10 p-6">
        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
          <PinContainer title="Книги" href="/admin/statistics" containerClassName="h-full w-full" className="h-full w-full">
            <div className="flex flex-col justify-between h-full w-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="text-emerald-500 w-7 h-7 drop-shadow-lg" />
                  Книги
                </h3>
                <div className="w-12 h-12 rounded-full bg-emerald-500 bg-opacity-30 dark:bg-opacity-40 flex items-center justify-center shadow-inner">
                  <BookOpen className="text-emerald-500 w-7 h-7 drop-shadow-lg" />
                </div>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2 text-white">
                  <CountUp end={totalAvailableBooks} />
                </p>
                <p className="text-sm text-white">доступных ресурсов</p>
                <div className="mt-3 text-sm text-white flex items-center">
                  <span className="mr-1">+</span>
                  {recentBorrowed} <span className="ml-1">за последний месяц</span>
                </div>
              </div>
              <span className="mt-4 text-white hover:text-emerald-300 text-sm font-medium flex items-center cursor-pointer">
                Подробная статистика
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          </PinContainer>
          <PinContainer title="Пользователи" href="/admin/statistics" containerClassName="h-full w-full" className="h-full w-full">
            <div className="flex flex-col justify-between h-full w-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="text-blue-500 w-7 h-7 drop-shadow-lg" />
                  Пользователи
                </h3>
                <div className="w-12 h-12 rounded-full bg-blue-500 bg-opacity-30 dark:bg-opacity-40 flex items-center justify-center shadow-inner">
                  <Users className="text-blue-500 w-7 h-7 drop-shadow-lg" />
                </div>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2 text-white">
                  <CountUp end={activeUsersCount} />
                </p>
                <p className="text-sm text-white">взяли книги</p>
                <div className="mt-3 text-sm text-white">
                  {totalUsersCount ? Math.round(activeUsersCount / totalUsersCount * 100) : 0}% от общего числа
                </div>
              </div>
              <span className="mt-4 text-white hover:text-emerald-300 text-sm font-medium flex items-center cursor-pointer">
                Подробная статистика
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          </PinContainer>
          <PinContainer title="Резервирования" href="/admin/statistics" containerClassName="h-full w-full" className="h-full w-full">
            <div className="flex flex-col justify-between h-full w-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="text-emerald-400 w-7 h-7 drop-shadow-lg" />
                  Резервирования
                </h3>
                <div className="w-12 h-12 rounded-full bg-emerald-400 bg-opacity-30 dark:bg-opacity-40 flex items-center justify-center shadow-inner">
                  <CalendarIcon className="text-emerald-400 w-7 h-7 drop-shadow-lg" />
                </div>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2 text-white">
                  <CountUp end={reservations.length} />
                </p>
                <p className="text-sm text-white">всего заявок</p>
                <div className="mt-3 text-sm text-white flex items-center">
                  <span className="inline-block px-2 py-0.5 text-xs font-medium text-white rounded-full bg-emerald-400">
                    {pendingReservations}
                  </span>
                  <span className="ml-2">в обработке</span>
                </div>
              </div>
              <span className="mt-4 text-white hover:text-emerald-300 text-sm font-medium flex items-center cursor-pointer">
                Подробная статистика
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          </PinContainer>
        </div>

        {/* Быстрые действия в виде плавающей панели */}
        <QuickActionsMenu />

        {/* Календарь и фильтр событий */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col items-center min-h-[200px]">
            {!showRangeModal ? <>
                <div className="flex flex-col md:flex-row gap-2 mb-4 w-full max-w-2xl">
                  <div className="flex flex-col gap-1 w-full md:w-56">
                    {quickRanges.map((range, idx) => <button key={range.label} onClick={() => setSelectedRange(range.getRange())} className="text-left px-3 py-2 rounded-lg hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-white font-medium transition-colors" style={{
                  width: '100%'
                }}>
                        {range.label}
                      </button>)}
                  </div>
                  <div className="flex-1 flex justify-center">
                    <DayPickerCalendar mode="range" selected={selectedRange} onSelect={setSelectedRange} className="w-full h-[340px] max-w-xl min-w-[340px] text-white" style={{
                  fontSize: '1.08rem',
                  color: '#fff'
                }} classNames={{
                  day_selected: "bg-emerald-500 text-white hover:bg-emerald-600 focus:bg-emerald-600",
                  // зелёный фон для выбранных дат
                  day_range_start: "bg-emerald-500 text-white rounded-l-lg",
                  day_range_end: "bg-emerald-500 text-white rounded-r-lg",
                  day_range_middle: "bg-emerald-200 text-emerald-900", // светло-зелёный для промежуточных дат
                  nav_button_previous: "bg-emerald-500/50 hover:bg-emerald-500/40 text-white",
                  nav_button_next: "bg-emerald-500/50 hover:bg-emerald-500/40 text-white",
                  caption_label: "uppercase"
                } as Record<string, string>} />
                  </div>
                </div>
                {/* 3 ближайших события */}
                <div className="w-full max-w-xl mb-4">
                  <div className="space-y-2">
                    <h4 className="text-white text-lg font-semibold mb-2">Ближайшие события</h4>
                    {upcomingEvents.length > 0 ? upcomingEvents.map(ev => <div key={ev.id} className="p-3 bg-green-600/40 dark:bg-green-900/40 backdrop-blur rounded-lg shadow text-white flex flex-col">
                          <span className="text-sm font-bold">{formatDate(ev.reservationDate)}</span>
                          <span className="text-base">{ev.bookTitle}</span>
                          <span className="text-sm">{ev.userName}</span>
                          <div className="mt-1">
                            <StatusBadge status={ev.status} />
                          </div>
                        </div>) : <p className="text-center text-white/80">Нет ближайших событий</p>}
                  </div>
                </div>
                <button disabled={!selectedRange?.from || !selectedRange?.to} onClick={() => setShowRangeModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed" style={{
              marginTop: 0
            }}>
                  Просмотр
                </button>
              </> : <motion.div className="w-full h-full max-w-xl min-w-[340px] bg-green-500/20 dark:bg-green-800/30 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-700/30 overflow-y-auto p-6 flex flex-col flex-1" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: 20
          }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">
                    События с {selectedRange?.from?.toLocaleDateString("ru-RU")} по {selectedRange?.to?.toLocaleDateString("ru-RU")}
                  </h3>
                  <motion.button whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(16, 185, 129, 0.1)"
              }} whileTap={{
                scale: 0.9
              }} onClick={() => setShowRangeModal(false)} className="p-2 rounded-full hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30 text-emerald-200 shadow-sm">
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {/* Ограничение высоты для 5 резервов, остальные с прокруткой */}
                  <div className="flex flex-col space-y-3 max-h-[620px] overflow-y-auto">
                    {filteredEvents.length > 0 ? filteredEvents.map(event => <div key={event.id} className="p-3 bg-green-600/40 dark:bg-green-900/40 backdrop-blur rounded-lg shadow text-white">
                          <Link href={`/admin/reservations/${event.id}`} className="block">
                            <h4 className="font-medium text-white">{event.bookTitle}</h4>
                            <p className="text-sm text-white/90">{event.userName}</p>
                            <p className="text-xs mt-1 text-white/80">Дата брони: {formatDate(event.reservationDate)}</p>
                            <div className="mt-2">
                              <StatusBadge status={event.status} />
                            </div>
                          </Link>
                        </div>) : <p className="text-center text-white/80">Нет событий за этот период</p>}
                  </div>
                </div>
              </motion.div>}
          </div>
          <div className="space-y-3 flex-1">
            {/* Недавно добавленные книги */}
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              Недавно добавленные книги
            </h3>
            <div className="relative">
              {recentBooks.length > 0 ? recentBooks.map((book, index) => <BookCard key={book.id} book={book} index={index} />) : <p className="text-white">Нет доступных книг</p>}
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