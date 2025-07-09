'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, BookOpen, Users, BookMarked, CalendarClock, AlertTriangle, CircleDollarSign, BarChart3, PieChartIcon, TrendingUp, Info, ArrowRight, ChevronRight, FileText, Copy, Calendar, Filter, Target, Settings, Clock, Download, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Типы данных для статистики
interface User {
  id: string;
  fullName: string;
  borrowedBooksCount: number;
  maxBooksAllowed: number;
  fineAmount?: number;
  email?: string;
}
interface Book {
  id: string;
  title: string;
  availableCopies: number;
  cover?: string;
  authors?: string;
  categorization?: string;
  genre?: string;
  addedDate?: string;
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
interface FinesData {
  month: string;
  amount: number;
}
interface CategoryData {
  name: string;
  value: number;
}
interface TopUserData {
  name: string;
  value: number;
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

// Компонент для карточки статистики
const StatCard = ({
  title,
  value,
  subtitle,
  additionalInfo,
  icon,
  color,
  delay = 0,
  href
}: {
  title: string;
  value: number;
  subtitle: string;
  additionalInfo?: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  delay?: number;
  href?: string;
}) => {
  return <FadeInView delay={delay}>
      <motion.div className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between border border-gray-200 relative overflow-hidden`} whileHover={{
      y: -5,
      boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)"
    }}>
        <div className={`absolute top-0 left-0 w-1.5 h-full ${color}`}></div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shadow-inner`}>
            {icon}
          </div>
        </div>
          <div>
            <p className={`text-4xl font-bold mb-2 text-gray-800`}>
              <CountUp end={value} decimals={title === "Штрафы" ? 2 : 0} />
              {title === "Штрафы" && " ₽"}
            </p>
            <p className="text-sm text-gray-500">{subtitle}</p>
            {additionalInfo && <div className="mt-3 text-sm text-gray-500">
                {additionalInfo}
              </div>}
          </div>
        {href && <Link href={href} className="mt-4">
            <span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center">
              Подробнее
              <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </Link>}
      </motion.div>
    </FadeInView>;
};

// Компонент для карточки с графиком
const ChartCard = ({
  title,
  description,
  children,
  delay = 0,
  icon,
  infoTooltip
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  delay?: number;
  icon?: React.ReactNode;
  infoTooltip?: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  return <FadeInView delay={delay}>
      <motion.div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {icon || <BarChart3 className="w-5 h-5 text-blue-500" />}
              {title}
            </h3>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          
          {infoTooltip && <div className="relative">
              <motion.button whileHover={{
            scale: 1.1
          }} whileTap={{
            scale: 0.9
          }} className="text-gray-500 hover:text-blue-500 transition-colors" onClick={() => setShowTooltip(!showTooltip)}>
                <Info className="w-5 h-5" />
              </motion.button>
              
              <AnimatePresence>
                {showTooltip && <motion.div initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: 10
            }} className="absolute right-0 top-full mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 w-64 z-20">
                    <p className="text-sm text-gray-800">
                      {infoTooltip}
                    </p>
                  </motion.div>}
              </AnimatePresence>
            </div>}
        </div>
        
        <div className="flex-1 bg-gray-100 rounded-xl p-4 border border-gray-200">
          {children}
        </div>
      </motion.div>
    </FadeInView>;
};

// Компонент для вкладок
const AnimatedTabsTrigger = ({
  value,
  icon,
  label,
  isActive
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}) => {
  return <TabsTrigger value={value} className="relative data-[state=active]:bg-transparent">
      <div className="flex items-center gap-2 py-2 px-1">
        <span className={isActive ? "text-blue-500" : "text-gray-500"}>
          {icon}
        </span>
        <span className={isActive ? "text-blue-500" : "text-gray-500"}>{label}</span>
      </div>
      {isActive && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.3
    }} />}
    </TabsTrigger>;
};
export default function StatisticsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyBorrowedData, setMonthlyBorrowedData] = useState<MonthlyBorrowedData[]>([]);
  const [monthlyFinesData, setMonthlyFinesData] = useState<FinesData[]>([]);
  const [bookCategoriesData, setBookCategoriesData] = useState<CategoryData[]>([]);
  const [bookGenresData, setBookGenresData] = useState<CategoryData[]>([]);
  const [topUsersData, setTopUsersData] = useState<TopUserData[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<CategoryData[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState("");
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
  }>({
    fullName: "Администратор библиотеки"
  });

  // Новые состояния для расширенного ИИ меню
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('3months');
  const [selectedReportCategories, setSelectedReportCategories] = useState<Set<string>>(new Set(['overview', 'books', 'users']));
  const [reportFormat, setReportFormat] = useState<string>('detailed');
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [reportPriority, setReportPriority] = useState<string>('mixed');
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set(['active_users', 'borrowed_books', 'fines', 'reservations']));
  const [htmlReportLoading, setHtmlReportLoading] = useState(false);

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

  // Расчет базовой статистики
  const activeUsersCount = users.filter(u => u.borrowedBooksCount > 0).length;
  const totalUsersCount = users.length;
  const pendingReservations = reservations.filter(r => r.status === "Обрабатывается").length;
  const issuedReservations = reservations.filter(r => r.status === "Выдана").length;
  const returnedReservations = reservations.filter(r => r.status === "Возвращена").length;
  const overdueReservations = reservations.filter(r => r.status === "Просрочена").length;
  const totalBorrowedBooks = users.reduce((total, user) => total + user.borrowedBooksCount, 0);
  const totalAvailableBooks = books.reduce((sum, book) => sum + book.availableCopies, 0);
  const totalFines = users.reduce((sum, user) => sum + (user.fineAmount || 0), 0);

  // Функция для получения данных за выбранный период
  const getDataForPeriod = (data: any[], dateField: string, period: string) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        if (customDateFrom && customDateTo) {
          startDate = new Date(customDateFrom);
          now.setTime(new Date(customDateTo).getTime());
        }
        break;
      default:
        startDate.setMonth(now.getMonth() - 3);
    }
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= now;
    });
  };

  // Функция для переключения категорий отчета
  const toggleReportCategory = (category: string) => {
    setSelectedReportCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Функция для переключения метрик
  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(metric)) {
        newSet.delete(metric);
      } else {
        newSet.add(metric);
      }
      return newSet;
    });
  };

  // Функция для выбора всех категорий
  const selectAllCategories = () => {
    setSelectedReportCategories(new Set(['overview', 'books', 'users', 'reservations', 'fines', 'performance']));
  };

  // Функция для снятия выбора всех категорий
  const deselectAllCategories = () => {
    setSelectedReportCategories(new Set());
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Лучше использовать статичное имя администратора без попытки получения данных текущего пользователя
        // API-эндпоинт для текущего пользователя может отсутствовать или иметь другой путь
        setCurrentUser({
          fullName: "Администратор библиотеки"
        });

        // Загрузка пользователей
        const usersResponse = await fetch(`${baseUrl}/api/User`);
        if (!usersResponse.ok) throw new Error("Ошибка при загрузке пользователей");
        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Загрузка книг
        const booksResponse = await fetch(`${baseUrl}/api/Books`);
        if (!booksResponse.ok) throw new Error("Ошибка при загрузке книг");
        const booksData = await booksResponse.json();
        setBooks(booksData);

        // Загрузка резервирований
        const reservationsResponse = await fetch(`${baseUrl}/api/Reservation`);
        if (!reservationsResponse.ok) throw new Error("Ошибка при загрузке резервирований");
        const reservationsData = await reservationsResponse.json();
        setReservations(reservationsData);

        // Генерация данных о займах книг по месяцам
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
            return reservationMonth === monthKey && (r.status === "Выдана" || r.status === "Возвращена");
          }).length;
          return {
            month: date.toLocaleString("ru-RU", {
              month: "short"
            }),
            borrowed
          };
        }).reverse();
        setMonthlyBorrowedData(lastSixMonths);

        // Получение данных о штрафах по месяцам
        const finesMonthly = Array.from({
          length: 6
        }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          // Суммируем штрафы на каждый месяц
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          // В реальном API мы бы получали штрафы за этот период
          // Здесь мы берем текущие данные о штрафах и распределяем их по месяцам
          // В идеале API должен предоставлять исторические данные
          const monthFines = usersData.reduce((sum: number, user: User) => {
            return sum + (user.fineAmount || 0) / 6 * (1 + Math.sin(i * Math.PI / 3));
          }, 0);
          return {
            month: date.toLocaleString("ru-RU", {
              month: "short"
            }),
            amount: Math.round(monthFines * 100) / 100
          };
        }).reverse();
        setMonthlyFinesData(finesMonthly);

        // Генерация данных о категориях книг из реальных данных
        const categoryMap = new Map<string, number>();
        const genreMap = new Map<string, number>();
        
        booksData.forEach((book: Book) => {
          const category = book.categorization || "Без категории";
          const genre = book.genre || "Без жанра";
          
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
        });
        
        const categories = Array.from(categoryMap.entries()).map(([name, value]) => ({
          name,
          value
        }));
        
        const genres = Array.from(genreMap.entries()).map(([name, value]) => ({
          name,
          value
        }));
        
        setBookCategoriesData(categories.length > 0 ? categories : [{
          name: "Художественная",
          value: Math.floor(booksData.length * 0.4)
        }, {
          name: "Научная",
          value: Math.floor(booksData.length * 0.25)
        }, {
          name: "Учебная",
          value: Math.floor(booksData.length * 0.2)
        }, {
          name: "Справочная",
          value: Math.floor(booksData.length * 0.1)
        }, {
          name: "Детская",
          value: Math.floor(booksData.length * 0.05)
        }]);
        
        setBookGenresData(genres.length > 0 ? genres : [{
          name: "Фантастика",
          value: Math.floor(booksData.length * 0.3)
        }, {
          name: "Детектив",
          value: Math.floor(booksData.length * 0.2)
        }, {
          name: "Роман",
          value: Math.floor(booksData.length * 0.25)
        }, {
          name: "Биография",
          value: Math.floor(booksData.length * 0.15)
        }, {
          name: "Поэзия",
          value: Math.floor(booksData.length * 0.1)
        }]);

        // Топ пользователей по количеству взятых книг
        const topUsers = usersData.sort((a: User, b: User) => b.borrowedBooksCount - a.borrowedBooksCount).slice(0, 5).map((user: User) => ({
          name: user.fullName.split(' ')[0],
          // Берем только имя для краткости
          value: user.borrowedBooksCount
        }));
        setTopUsersData(topUsers);

        // Распределение статусов резервирований
        const statusCounts = {
          "Выдана": reservationsData.filter((r: Reservation) => r.status === "Выдана").length,
          "Обрабатывается": reservationsData.filter((r: Reservation) => r.status === "Обрабатывается").length,
          "Возвращена": reservationsData.filter((r: Reservation) => r.status === "Возвращена").length,
          "Просрочена": reservationsData.filter((r: Reservation) => r.status === "Просрочена").length
        };
        const statusData = Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value
        }));
        setStatusDistribution(statusData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
        console.error("Ошибка:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [baseUrl]);

  // Компонент загрузки
  const LoadingSpinner = () => {
    return <div className="flex flex-col justify-center items-center h-screen bg-gray-200">
        <motion.div animate={{
        rotate: 360
      }} transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear"
      }} className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full" />
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

  // Расширенная функция для генерации отчета с настройками
  const generateAdvancedSummary = async () => {
    setSummaryLoading(true);
    setSummaryOpen(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("API ключ Gemini не настроен");
      }

      // Фильтруем данные по выбранному периоду
      const filteredReservations = getDataForPeriod(reservations, 'reservationDate', selectedTimePeriod);
      
      // Подготовка данных в зависимости от выбранных категорий
      const libraryData: any = {
        reportSettings: {
          timePeriod: selectedTimePeriod,
          categories: Array.from(selectedReportCategories),
          format: reportFormat,
          includeRecommendations,
          includeCharts,
          priority: reportPriority,
          metrics: Array.from(selectedMetrics),
          customDateRange: selectedTimePeriod === 'custom' ? { from: customDateFrom, to: customDateTo } : null
        },
        currentUser: {
          fullName: currentUser.fullName
        }
      };

      // Добавляем данные только по выбранным категориям
      if (selectedReportCategories.has('overview')) {
        libraryData.overview = {
          totalBooks: totalAvailableBooks + totalBorrowedBooks,
          totalUsers: totalUsersCount,
          totalReservations: filteredReservations.length,
          totalFines: totalFines
        };
      }

      if (selectedReportCategories.has('users')) {
        libraryData.users = {
          total: totalUsersCount,
          active: activeUsersCount,
          withFines: users.filter(u => (u.fineAmount || 0) > 0).length,
          topUsers: topUsersData,
          periodActivity: filteredReservations.reduce((acc, res) => {
            const userId = res.userId;
            acc[userId] = (acc[userId] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        };
      }

      if (selectedReportCategories.has('books')) {
        libraryData.books = {
          total: totalAvailableBooks + totalBorrowedBooks,
          available: totalAvailableBooks,
          borrowed: totalBorrowedBooks,
          categories: bookCategoriesData,
          genres: bookGenresData,
          periodBorrows: filteredReservations.filter(r => r.status === "Выдана" || r.status === "Возвращена").length
        };
      }

      if (selectedReportCategories.has('reservations')) {
        libraryData.reservations = {
          total: filteredReservations.length,
          pending: filteredReservations.filter(r => r.status === "Обрабатывается").length,
          issued: filteredReservations.filter(r => r.status === "Выдана").length,
          returned: filteredReservations.filter(r => r.status === "Возвращена").length,
          overdue: filteredReservations.filter(r => r.status === "Просрочена").length,
          dailyStats: filteredReservations.reduce((acc, res) => {
            const date = new Date(res.reservationDate).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        };
      }

      if (selectedReportCategories.has('fines')) {
        libraryData.fines = {
          total: totalFines,
          usersWithFines: users.filter(u => (u.fineAmount || 0) > 0).length,
          averageFine: totalFines / Math.max(users.filter(u => (u.fineAmount || 0) > 0).length, 1),
          monthlyStats: monthlyFinesData
        };
      }

      if (selectedReportCategories.has('performance')) {
        libraryData.performance = {
          utilizationRate: (totalBorrowedBooks / (totalAvailableBooks + totalBorrowedBooks)) * 100,
          userEngagement: (activeUsersCount / totalUsersCount) * 100,
          reservationEfficiency: ((filteredReservations.filter(r => r.status === "Выдана" || r.status === "Возвращена").length) / filteredReservations.length) * 100,
          averageProcessingTime: "2.3 дня" // Можно вычислить реально
        };
      }

      // Создаем промпт в зависимости от настроек
      const timePeriodText = {
        '1month': 'за последний месяц',
        '3months': 'за последние 3 месяца', 
        '6months': 'за последние 6 месяцев',
        '1year': 'за последний год',
        'custom': `за период с ${customDateFrom} по ${customDateTo}`
      }[selectedTimePeriod] || 'за выбранный период';

      const categoriesText = Array.from(selectedReportCategories).map(cat => {
        const names: Record<string, string> = {
          'overview': 'общий обзор',
          'books': 'анализ книг',
          'users': 'анализ пользователей', 
          'reservations': 'анализ резервирований',
          'fines': 'анализ штрафов',
          'performance': 'показатели эффективности'
        };
        return names[cat] || cat;
      }).join(', ');

      const formatInstructions = reportFormat === 'brief' 
        ? 'Сделай отчет кратким и сконцентрированным на ключевых метриках.'
        : reportFormat === 'detailed'
        ? 'Создай подробный аналитический отчет с развернутыми выводами.'
        : 'Используй стандартный формат отчета.';

      const recommendationsText = includeRecommendations 
        ? 'ОБЯЗАТЕЛЬНО включи раздел с конкретными рекомендациями по улучшению работы библиотеки.'
        : 'НЕ включай рекомендации в отчет.';

      const chartsText = includeCharts
        ? 'Упомяни, где можно было бы добавить графики и диаграммы для лучшей визуализации данных.'
        : '';

      const priorityText = {
        'efficiency': 'Сфокусируйся на показателях эффективности и оптимизации процессов.',
        'user_satisfaction': 'Акцентируй внимание на удовлетворенности пользователей и качестве обслуживания.',
        'financial': 'Сосредоточься на финансовых аспектах и экономической эффективности.',
        'collection': 'Уделяй особое внимание анализу коллекции книг и ее развитию.',
        'mixed': 'Используй сбалансированный подход к анализу всех аспектов.'
      }[reportPriority] || '';

      const prompt = `Отвечать по-русски. Ты - ИИ-аналитик библиотеки. Создай аналитический отчет ${timePeriodText} по следующим категориям: ${categoriesText}.

НАСТРОЙКИ ОТЧЕТА:
- Формат: ${reportFormat} (${formatInstructions})
- Временной период: ${timePeriodText}
- Приоритет анализа: ${priorityText}
- ${recommendationsText}
- ${chartsText}

СТРУКТУРА ОТЧЕТА:

## Аналитический отчет библиотеки ${timePeriodText}

**Подготовлено:** ИИ-аналитик библиотеки  
**Период анализа:** ${timePeriodText}  
**Категории анализа:** ${categoriesText}

${selectedReportCategories.has('overview') ? `
### 1. Общий обзор библиотеки
[Общее состояние за выбранный период, ключевые изменения, основные тренды]
` : ''}

${selectedReportCategories.has('books') ? `
### 2. Анализ книжной коллекции
[Детальный анализ книг: категории, жанры, популярность, использование фонда]
` : ''}

${selectedReportCategories.has('users') ? `
### 3. Анализ пользователей
[Активность пользователей, вовлеченность, поведенческие паттерны]
` : ''}

${selectedReportCategories.has('reservations') ? `
### 4. Анализ резервирований
[Эффективность обработки, тенденции, динамика заявок]
` : ''}

${selectedReportCategories.has('fines') ? `
### 5. Финансовый анализ (штрафы)
[Анализ штрафов, их динамика, влияние на дисциплину пользователей]
` : ''}

${selectedReportCategories.has('performance') ? `
### 6. Показатели эффективности
[KPI библиотеки, коэффициенты использования, операционная эффективность]
` : ''}

${includeRecommendations ? `
### 7. Рекомендации по улучшению
[5-7 конкретных рекомендаций с обоснованием и ожидаемым эффектом]
` : ''}

ТРЕБОВАНИЯ:
1. Используй **жирный шрифт** ТОЛЬКО для ключевых цифр и метрик
2. Применяй маркированные списки для структурирования информации
3. Каждый раздел отделяй пустой строкой
4. Сохраняй профессиональный аналитический стиль
5. Основывайся только на предоставленных данных
6. ${priorityText}

Данные библиотеки: ${JSON.stringify(libraryData)}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8096,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка API Gemini: ${response.status}`);
      }

      const result = await response.json();
      const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        throw new Error("Пустой ответ от ИИ");
      }

      setSummaryResult(aiResponse);
    } catch (err) {
      console.error("Ошибка при генерации сводки:", err);
      setSummaryResult(`Произошла ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    } finally {
      setSummaryLoading(false);
      setAiMenuOpen(false);
    }
  };

  // Функция для генерации HTML-отчета в новой вкладке
  const generateHtmlReport = async () => {
    setHtmlReportLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("API ключ Gemini не настроен");
      }

      const libraryData = {
          reportSettings: {
              generatedDate: new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
          },
          overview: {
              totalBooks: totalAvailableBooks + totalBorrowedBooks,
              totalUsers: totalUsersCount,
              totalReservations: reservations.length,
              activeUsers: activeUsersCount,
              pendingReservations: pendingReservations,
          },
          users: {
              total: totalUsersCount,
              active: activeUsersCount,
              inactive: totalUsersCount - activeUsersCount,
              topUsers: topUsersData
          },
          books: {
              total: totalAvailableBooks + totalBorrowedBooks,
              available: totalAvailableBooks,
              borrowed: totalBorrowedBooks,
              categories: bookCategoriesData,
              genres: bookGenresData,
          },
          reservations: {
              statusDistribution: statusDistribution,
              monthlyStats: monthlyBorrowedData
          },
          fines: {
              total: totalFines,
              usersWithFines: users.filter(u => (u.fineAmount || 0) > 0).length,
              monthlyStats: monthlyFinesData
          },
          performance: {
              utilizationRate: (totalBorrowedBooks / (totalAvailableBooks + totalBorrowedBooks)) * 100,
              userEngagement: (activeUsersCount / totalUsersCount) * 100,
              reservationEfficiency: ((reservations.filter(r => r.status === "Выдана" || r.status === "Возвращена").length) / reservations.length) * 100,
          }
      };

      const prompt = `
Отвечать по-русски. Ты - эксперт-веб-разработчик, специализирующийся на создании аналитических отчетов в формате HTML.
Твоя задача - сгенерировать ЕДИНЫЙ, САМОСТОЯТЕЛЬНЫЙ HTML-файл, который представляет статистику для библиотеки "СИНАПС".

**СТРОГИЕ ТРЕБОВАНИЯ К HTML-ФАЙЛУ:**

1.  **Полностью самодостаточный:** Весь код (HTML, CSS, JavaScript) должен быть в одном файле. Используй теги \`<style>\` и \`<script>\`. Никаких внешних ссылок на файлы, за исключением CDN для Chart.js и Google Fonts.
2.  **Интерактивные графики:**
    *   **ОБЯЗАТЕЛЬНО** используй библиотеку **Chart.js**. Подключи ее через CDN: \`<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\`.
    *   Создай подходящие графики для данных: круговые (Pie/Doughnut), столбчатые (Bar), линейные (Line).
    *   Графики должны быть интерактивными (всплывающие подсказки).
    *   Скрипты для графиков должны быть в теге \`<script>\`.
3.  **Структура и контент:**
    *   Используй семантические теги HTML5.
    *   Вверху страницы размести карточки с ключевыми метриками.
    *   Логически раздели отчет на секции (Обзор, Книги, Пользователи и т.д.).
    *   В каждой секции должен быть как минимум один график и краткое текстовое резюме.
    *   Заголовок отчета: **Аналитический отчет библиотеки «СИНАПС»**.
    *   Язык контента - **Русский**.

**ТРЕБОВАНИЯ К СТИЛЮ (CSS):**

Создай красивый, чистый и профессиональный дизайн, следуя этим указаниям. Весь CSS должен быть внутри тега \`<style>\`.

*   **Шрифты:**
    *   Подключи шрифт 'Roboto' из Google Fonts: \`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');\`
    *   Установи для \`body\`: \`font-family: 'Roboto', sans-serif;\`.

*   **Цветовая палитра (светлая тема):**
    *   **Фон страницы:** \`background-color:rgb(117, 200, 255);\`
    *   **Контейнеры/Карточки:** \`background-color:rgb(117, 200, 255);\`
    *   **Основной текст:** \`color: #333333;\`
    *   **Заголовки (h1, h2, h3):** \`color:rgb(117, 200, 255);\`
    *   **Акцентный цвет (графики, ссылки, ключевые элементы):** \`#3498db;\` (синий)
    *   **Вторичный акцентный цвет (для графиков):** \`#5a67d8;\` (фиолетовый)
    *   **Цвет для позитивных изменений:** \`#2ecc71;\` (зеленый)
    *   **Цвет для негативных моментов (штрафы):** \`#e74c3c;\` (красный)

*   **Макет и компоненты:**
    *   **Основной контейнер:** \`max-width: 1200px; margin: 0 auto; padding: 20px;\`
    *   **Заголовок (Header):** Должен содержать название "Аналитический отчет библиотеки «СИНАПС»" и дату генерации. Сделай его заметным.
    *   **Карточки (Cards):**
        *   \`border-radius: 8px;\`
        *   \`box-shadow: 0 4px 6px rgba(0,0,0,0.1);\`
        *   \`padding: 20px;\`
        *   \`margin-bottom: 20px;\`
        *   Используй Flexbox или Grid для расположения карточек в ряды.
    *   **Графики:** Должны быть внутри карточек, чтобы выглядеть аккуратно. Убедись, что контейнер для графика адаптивный.

**ДАННЫЕ ДЛЯ ОТЧЕТА:**
Вот JSON-объект с данными библиотеки. Используй его для всех цифр, текста и графиков.
\`\`\`json
${JSON.stringify(libraryData)}
\`\`\`

**ЗАДАЧА:**
Сгенерируй полный HTML-код для этого отчета. Не добавляй никаких объяснений или \`\`\`html\`\`\` оберток. Твой ответ должен быть **ТОЛЬКО** HTML-кодом, начиная с \`<!DOCTYPE html>\` и заканчивая \`</html>\`.
`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 65536,
            topK: 40,
            topP: 0.95
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка API Gemini: ${response.status} ${await response.text()}`);
      }

      const result = await response.json();
      console.log('Gemini API Response:', result);

      let aiResponse = '';
      if (result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];
        if (candidate?.content?.parts) {
          aiResponse = candidate.content.parts.map((p: any) => p.text || '').join('');
        }
        // Проверяем, был ли ответ заблокирован системой безопасности
        if (candidate.finishReason === 'SAFETY') {
          throw new Error('Ответ был заблокирован системой безопасности Gemini. Попробуйте сократить или упростить запрос.');
        }
      }

      if (!aiResponse || aiResponse.trim().length === 0) {
        // Выводим подробную информацию для отладки
        console.warn('AI response is empty. Full result:', result);
        throw new Error('Пустой ответ от ИИ. Проверьте ограничения безопасности или параметры запроса.');
      }

      const blob = new Blob([aiResponse], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

    } catch (err) {
      console.error("Ошибка при генерации HTML отчета:", err);
      // Можно будет заменить на toast-уведомление
      alert(`Произошла ошибка при генерации HTML отчета: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    } finally {
      setHtmlReportLoading(false);
    }
  };

  // Функция для запроса сводки через ИИ
  const generateSummary = async () => {
    setSummaryLoading(true);
    setSummaryOpen(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("API ключ Gemini не настроен");
      }

      // Используем имя из состояния currentUser
      const currentUserFullName = currentUser.fullName;

      // Подготовка данных для отправки в API
      const libraryData = {
        currentUser: {
          fullName: currentUserFullName
        },
        users: {
          total: totalUsersCount,
          active: activeUsersCount,
          withFines: users.filter(u => (u.fineAmount || 0) > 0).length,
          topUsers: topUsersData
        },
        books: {
          total: totalAvailableBooks + totalBorrowedBooks,
          available: totalAvailableBooks,
          borrowed: totalBorrowedBooks,
          categories: bookCategoriesData
        },
        reservations: {
          total: reservations.length,
          pending: pendingReservations,
          issued: issuedReservations,
          returned: returnedReservations,
          overdue: overdueReservations,
          monthlyStats: monthlyBorrowedData
        },
        fines: {
          total: totalFines,
          monthlyStats: monthlyFinesData
        }
      };

      const prompt = `Отвечать по-русски. Ты - ИИ-аналитик библиотеки. Проанализируй данные библиотеки и составь подробный аналитический отчет с выводами и рекомендациями. Выделяй главы и подразделы пропуском строки. Жирным шрифтом выделяй ТОЛЬКО цифры и ключевые показатели. Структура отчета должна быть СТРОГО следующей:

## Аналитический отчет о состоянии библиотеки

**Подготовлено:** ИИ-аналитик библиотеки

### 1. Общее состояние библиотеки
[Опиши общее количество книг, пользователей, резерваций, их статусов и т.д. Используй **жирный шрифт** для выделения ключевых цифр. Добавь информацию о динамике показателей за последние месяцы.]

### 2. Анализ коллекции
[Детальный анализ категорий книг, наиболее популярных жанров, рекомендации по расширению коллекции. Укажи процентное соотношение категорий, выдели цифрами.]

### 3. Анализ пользователей
[Активность пользователей, топ-пользователи, пользователи с задолженностями. Добавь информацию о процентном соотношении активных пользователей к общему числу.]

### 4. Анализ резерваций
[Эффективность обработки резерваций, тенденции, проблемные моменты. Включи анализ скорости обработки резерваций и рекомендации по улучшению.]

### 5. Финансовый анализ
[Детальный анализ штрафов, динамика по месяцам, эффективность финансовой политики. Добавь расчеты среднемесячных поступлений от штрафов.]

### 6. Показатели эффективности работы библиотеки
[Опиши основные KPI библиотеки. Включи сравнение текущих показателей с оптимальными значениями.]

### 7. Конкретные рекомендации по улучшению работы библиотеки
[5-7 конкретных рекомендаций с детальным обоснованием и ожидаемым эффектом от внедрения]

ВАЖНО: 
1. В каждом разделе ОБЯЗАТЕЛЬНО используй **жирный шрифт** для выделения ТОЛЬКО ключевых цифр и важных фактов. Выделяй по минимуму. 
2. Применяй маркированные списки для повышения читабельности текста. 
3. Сохраняй профессиональный стиль изложения. 
4. Соблюдай единообразие форматирования во всех разделах.
5. Включай подробную аналитику в каждый раздел, а не просто перечисление фактов.
6. Не отклоняйся от указанной структуры отчета.
7. Каждый раздел отделяй от предыдущего пустой строкой для лучшей читаемости.

Вот данные библиотеки: ${JSON.stringify(libraryData)}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          // Настройки генерации для лучшего качества анализа
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8096,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка API Gemini: ${response.status}`);
      }

      const result = await response.json();
      console.log("API response:", result); // Добавим логирование для отладки

      const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        throw new Error("Пустой ответ от ИИ");
      }

      setSummaryResult(aiResponse);
    } catch (err) {
      console.error("Ошибка при генерации сводки:", err);
      setSummaryResult(`Произошла ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Функция для получения текущей даты в формате "ДД месяц ГГГГ"
  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return new Date().toLocaleDateString('ru-RU', options);
  };

  // Функция для копирования отчета в буфер обмена
  const copyReportToClipboard = () => {
    // Создаем текстовую версию отчета без HTML-тегов
    let textReport = summaryResult.replace(/<br><br>/g, '\n\n').replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1').replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1').replace(/<span[^>]*>(.*?)<\/span>/g, '**$1**').replace(/<li[^>]*>(.*?)<\/li>/g, '* $1');

    // Добавляем текущую дату к началу отчета
    const currentDate = getCurrentDate();
    if (textReport.startsWith('## Аналитический отчет')) {
      // Если отчет начинается с заголовка, добавляем дату перед ним
      textReport = `Дата: ${currentDate}\n\n` + textReport;
    } else {
      // Добавляем в самое начало
      textReport = `Дата: ${currentDate}\n\n${textReport}`;
    }
    navigator.clipboard.writeText(textReport).then(() => {
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }).catch(err => {
      console.error('Ошибка при копировании: ', err);
    });
  };
  if (loading) return <LoadingSpinner />;
  if (error) return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} className="flex flex-col items-center justify-center h-screen p-6 bg-gray-200">
      <div className="bg-red-100 text-red-800 p-6 rounded-xl border border-gray-200 max-w-md w-full text-center shadow-lg">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
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
  const COLORS = ["#3B82F6", "#6B7280", "#93C5FD", "#374151", "#9CA3AF"];

  // Функция для форматирования подсказок в графиках
  const formatTooltipValue = (value: any, name?: string) => {
    if (typeof value === 'number') {
      return [`${value} книг`, name || ""];
    }
    return [value, name || ""];
  };
  const formatTooltipValueMoney = (value: any, name?: string) => {
    if (typeof value === 'number') {
      return [`${value.toFixed(2)} ₽`, name || ""];
    }
    return [value, name || ""];
  };
  const formatTooltipValueUsers = (value: any, name?: string) => {
    if (typeof value === 'number') {
      return [`${value} пользователей`, name || ""];
    }
    return [value, name || ""];
  };
  const formatTooltipValueReservations = (value: any, name?: string) => {
    if (typeof value === 'number') {
      return [`${value} резерваций`, name || ""];
    }
    return [value, name || ""];
  };
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-200 relative" ref={containerRef}>
      <div className="container mx-auto p-6 relative z-10">
        {/* Заголовок с анимацией при скролле */}
        <motion.div className="mb-8 sticky top-0 z-10 pt-4 pb-6 bg-gray-200" style={{
        opacity,
        scale,
        y
      }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div initial={{
              x: -20,
              opacity: 0
            }} animate={{
              x: 0,
              opacity: 1
            }} transition={{
              duration: 0.5
            }}>
                <Link href="/admin" className="flex items-center gap-2 text-gray-800 hover:text-blue-500 transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                  <span className="font-medium">Назад</span>
                </Link>
              </motion.div>
              
              <motion.h1 initial={{
              opacity: 0,
              y: -20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.1
            }} className="text-3xl font-bold text-gray-800">
                Статистика библиотеки
              </motion.h1>
            </div>
            
            <motion.div initial={{
            opacity: 0,
            y: -20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.3
          }} className="flex gap-2">
              <Button onClick={() => setAiMenuOpen(true)} className="bg-purple-500 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Настроить ИИ отчет
              </Button>
              <Button onClick={generateSummary} className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2" disabled={summaryLoading}>
                <FileText className="w-5 h-5" />
                {summaryLoading ? "Генерация..." : "Быстрый отчет"}
              </Button>
              <Button onClick={generateHtmlReport} className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2" disabled={htmlReportLoading}>
                <Download className="w-5 h-5" />
                {htmlReportLoading ? "Генерация HTML..." : "HTML-отчет"}
              </Button>
            </motion.div>
          </div>
          
          <motion.p initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }} className="text-gray-500 mt-2 max-w-2xl">
            Подробная аналитика по книгам, пользователям, резервациям и штрафам в библиотеке
          </motion.p>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-8" onValueChange={setActiveTab}>
          <TabsList className="bg-white p-1 rounded-xl border border-gray-200 shadow-md">
            <AnimatedTabsTrigger value="overview" icon={<TrendingUp className="w-5 h-5 text-blue-500" />} label="Обзор" isActive={activeTab === "overview"} />
            <AnimatedTabsTrigger value="books" icon={<BookMarked className="w-5 h-5 text-blue-500" />} label="Книги" isActive={activeTab === "books"} />
            <AnimatedTabsTrigger value="users" icon={<Users className="w-5 h-5 text-blue-500 " />} label="Пользователи" isActive={activeTab === "users"} />
            <AnimatedTabsTrigger value="reservations" icon={<CalendarClock className="w-5 h-5 text-blue-500" />} label="Резервирования" isActive={activeTab === "reservations"} />
          </TabsList>

          {/* Обзор библиотеки */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Книги" value={totalAvailableBooks + totalBorrowedBooks} subtitle="всего в библиотеке" additionalInfo={<p className="text-blue-500">
                    {totalAvailableBooks} доступно сейчас
                  </p>} icon={<BookOpen className="w-5 h-5 text-blue-500" />} color="bg-blue-500" delay={0.1} href="/admin/books" />
              <StatCard title="Пользователи" value={totalUsersCount} subtitle="зарегистрировано" additionalInfo={<p className="text-gray-500">
                    {activeUsersCount} активных ({Math.round(activeUsersCount / totalUsersCount * 100)}%)
                  </p>} icon={<Users className="w-5 h-5 text-gray-500" />} color="bg-gray-500" delay={0.2} href="/admin/users" />
              <StatCard title="Резервирования" value={reservations.length} subtitle="всего заявок" additionalInfo={<div className="flex items-center">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium text-white rounded-full bg-blue-400">
                      {pendingReservations}
                    </span>
                    <span className="ml-2">в обработке</span>
                  </div>} icon={<CalendarClock className="w-5 h-5 text-blue-400" />} color="bg-blue-400" delay={0.3} href="/admin/reservations" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard title="Взятые книги по месяцам" description="Количество взятых книг за последние 6 месяцев" delay={0.5} icon={<TrendingUp className="w-5 h-5 text-blue-500" />} infoTooltip="График показывает динамику выдачи книг за последние полгода. Позволяет отслеживать сезонные тренды и активность пользователей.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyBorrowedData} margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0
                  }}>
                      <defs>
                        <linearGradient id="colorBorrowed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <RechartsTooltip formatter={formatTooltipValue} contentStyle={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "white"
                    }} />
                      <Area type="monotone" dataKey="borrowed" name="Взято книг" stroke="#10B981" fillOpacity={1} fill="url(#colorBorrowed)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Распределение статусов резервирований" description="Статусы всех заявок в системе" delay={0.6} icon={<PieChartIcon className="w-5 h-5 text-blue-500" />} infoTooltip="Диаграмма показывает соотношение статусов всех резервирований в системе: выданные, в обработке, возвращенные и просроченные.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={90} fill="#8884d8" paddingAngle={5} dataKey="value" label={({
                      name,
                      percent
                    }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={{
                      stroke: "#999",
                      strokeWidth: 1
                    }}>
                        {statusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={formatTooltipValueReservations} contentStyle={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "white"
                    }} />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </TabsContent>

          {/* Статистика по книгам */}
          <TabsContent value="books" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard title="Категории книг" description="Распределение книг по категориям" delay={0.3} icon={<BookMarked className="w-5 h-5 text-blue-500" />} infoTooltip="Диаграмма показывает распределение книг по категориям в библиотеке. Помогает анализировать разнообразие коллекции.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={bookCategoriesData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} fill="#8884d8" paddingAngle={5} dataKey="value">
                        {bookCategoriesData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={formatTooltipValue} contentStyle={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "white"
                    }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Статистика доступности" description="Соотношение взятых и доступных книг" delay={0.4} icon={<BookOpen className="w-5 h-5 text-blue-500" />} infoTooltip="График показывает соотношение доступных и взятых книг в библиотеке. Помогает оценить загруженность фонда.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{
                    name: "Доступно",
                    value: totalAvailableBooks
                  }, {
                    name: "Взято",
                    value: totalBorrowedBooks
                  }]} margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0
                  }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={formatTooltipValue} contentStyle={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "white"
                    }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {[{
                        name: "Доступно",
                        value: totalAvailableBooks
                      }, {
                        name: "Взято",
                        value: totalBorrowedBooks
                      }].map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
            
            <FadeInView delay={0.5}>
              <motion.div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Рекомендации по управлению книгами
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Популярные категории</h4>
                    <p className="text-sm text-gray-500">
                      Наиболее популярные категории книг: {bookCategoriesData.sort((a, b) => b.value - a.value).slice(0, 2).map(cat => cat.name).join(', ')}.
                      Рекомендуется пополнить коллекцию книгами этих категорий.
                    </p>
                    <Link href="/admin/books/create" className="mt-4 inline-block">
                      <motion.span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center" whileHover={{
                      x: 3
                    }}>
                        Добавить книгу
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </motion.span>
                    </Link>
                  </div>
                  
                  <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Доступность книг</h4>
                    <p className="text-sm text-gray-500">
                      {totalBorrowedBooks > totalAvailableBooks ? "Большинство книг сейчас на руках у читателей. Рекомендуется пополнить библиотеку новыми экземплярами." : "Большинство книг доступно для выдачи. Хороший показатель доступности фонда."}
                    </p>
                    <Link href="/admin/books" className="mt-4 inline-block">
                      <motion.span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center" whileHover={{
                      x: 3
                    }}>
                        Управление книгами
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </motion.span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </FadeInView>
          </TabsContent>

          {/* Статистика по пользователям */}
          <TabsContent value="users" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard title="Топ пользователей" description="Пользователи с наибольшим количеством взятых книг" delay={0.3} icon={<Users className="w-5 h-5 text-blue-500" />} infoTooltip="График показывает пользователей, взявших наибольшее количество книг. Помогает выявить самых активных читателей.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topUsersData} layout="vertical" margin={{
                    top: 5,
                    right: 30,
                    left: 80,
                    bottom: 5
                  }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <RechartsTooltip formatter={formatTooltipValue} contentStyle={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "white"
                    }} />
                      <Bar dataKey="value" fill="#10B981" barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Активность пользователей" description="Соотношение активных и неактивных пользователей" delay={0.4} icon={<Users className="w-5 h-5 text-blue-500" />} infoTooltip="Диаграмма показывает соотношение активных (имеющих книги на руках) и неактивных пользователей библиотеки.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{
                      name: "Активные",
                      value: activeUsersCount
                    }, {
                      name: "Неактивные",
                      value: totalUsersCount - activeUsersCount
                    }]} cx="50%" cy="50%" innerRadius={70} outerRadius={90} fill="#8884d8" paddingAngle={5} dataKey="value" label={({
                      name,
                      percent
                    }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        <Cell fill="#10B981" />
                        <Cell fill="#d1d5db" />
                      </Pie>
                      <RechartsTooltip formatter={formatTooltipValueUsers} contentStyle={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "white"
                    }} />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
            
            <FadeInView delay={0.5}>
              <motion.div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Анализ активности пользователей
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Активные пользователи</h4>
                    <p className="text-sm text-gray-500">
                      {activeUsersCount > totalUsersCount / 2 ? `Большинство пользователей (${Math.round(activeUsersCount / totalUsersCount * 100)}%) активно пользуются библиотекой. Это отличный показатель!` : `Только ${Math.round(activeUsersCount / totalUsersCount * 100)}% пользователей активно пользуются библиотекой. Рекомендуется провести акции для привлечения читателей.`}
                    </p>
                    <Link href="/admin/users" className="mt-4 inline-block">
                      <motion.span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center" whileHover={{
                      x: 3
                    }}>
                        Управление пользователями
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </motion.span>
                    </Link>
                  </div>
                  
                  <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Топ читатели</h4>
                    <p className="text-sm text-gray-500">
                      Самые активные читатели: {topUsersData.slice(0, 3).map(user => user.name).join(', ')}.
                      Рекомендуется рассмотреть программу лояльности для постоянных читателей.
                    </p>
                    <Link href="/admin/users/create" className="mt-4 inline-block">
                      <motion.span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center" whileHover={{
                      x: 3
                    }}>
                        Добавить пользователя
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </motion.span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </FadeInView>
          </TabsContent>

          {/* Статистика по резервированиям */}
          <TabsContent value="reservations" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard title="Динамика резервирований" description="Количество резервирований за последние 6 месяцев" delay={0.3} icon={<CalendarClock className="w-5 h-5 text-blue-500" />} infoTooltip="График показывает динамику резервирований книг за последние полгода. Помогает отслеживать сезонные тренды и активность пользователей.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyBorrowedData} margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0
                  }}>
                      <defs>
                        <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <RechartsTooltip formatter={formatTooltipValueReservations} contentStyle={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "white"
                    }} />
                      <Area type="monotone" dataKey="borrowed" name="Резервирования" stroke="#F59E0B" fillOpacity={1} fill="url(#colorReservations)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Статусы резервирований" description="Распределение резервирований по статусам" delay={0.4} icon={<CalendarClock className="w-5 h-5 text-blue-500" />} infoTooltip="График показывает распределение резервирований по статусам: выданные, в обработке, возвращенные и просроченные.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusDistribution} margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0
                  }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={formatTooltipValueReservations} contentStyle={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "white"
                    }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {statusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
            
            <FadeInView delay={0.5}>
              <motion.div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Анализ резервирований
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Эффективность обработки</h4>
                    <p className="text-sm text-gray-500">
                      {(issuedReservations + returnedReservations) > overdueReservations * 2 ? `Высокая эффективность обработки заявок: ${Math.round((issuedReservations + returnedReservations) / reservations.length * 100)}% заявок выполнено успешно.` : `Средняя эффективность обработки заявок: ${Math.round((issuedReservations + returnedReservations) / reservations.length * 100)}% заявок выполнено успешно. Рекомендуется улучшить процесс обработки.`}
                    </p>
                    <Link href="/admin/reservations" className="mt-4 inline-block">
                      <motion.span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center" whileHover={{
                      x: 3
                    }}>
                        Управление резервированиями
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </motion.span>
                    </Link>
                  </div>
                  
                  <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Текущие заявки</h4>
                    <p className="text-sm text-gray-500">
                      В настоящее время в обработке находится {pendingReservations} заявок.
                      {pendingReservations > 10 ? " Рекомендуется ускорить обработку заявок для улучшения пользовательского опыта." : " Хороший показатель скорости обработки заявок."}
                    </p>
                    <Link href="/admin/reservations/create" className="mt-4 inline-block">
                      <motion.span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center" whileHover={{
                      x: 3
                    }}>
                        Создать резервирование
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </motion.span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </FadeInView>
          </TabsContent>

          {/* Статистика по штрафам */}
          <TabsContent value="fines" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard title="Динамика штрафов" description="Сумма штрафов за последние 6 месяцев" delay={0.3} icon={<CircleDollarSign className="w-5 h-5 text-blue-500" />} infoTooltip="График показывает динамику штрафов за последние полгода. Помогает отслеживать тенденции в нарушениях сроков возврата книг.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyFinesData} margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0
                  }}>
                      <defs>
                        <linearGradient id="colorFines" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <RechartsTooltip formatter={formatTooltipValueMoney} contentStyle={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "white"
                    }} />
                      <Area type="monotone" dataKey="amount" name="Штрафы" stroke="#EF4444" fillOpacity={1} fill="url(#colorFines)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Пользователи со штрафами" description="Топ пользователей по сумме штрафов" delay={0.4} icon={<CircleDollarSign className="w-5 h-5 text-blue-500" />} infoTooltip="График показывает пользователей с наибольшими суммами штрафов. Помогает выявить проблемных читателей.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={users.filter(user => (user.fineAmount || 0) > 0).sort((a, b) => (b.fineAmount || 0) - (a.fineAmount || 0)).slice(0, 5).map(user => ({
                    name: user.fullName.split(' ')[0],
                    value: user.fineAmount || 0
                  }))} layout="vertical" margin={{
                    top: 5,
                    right: 30,
                    left: 80,
                    bottom: 5
                  }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <RechartsTooltip formatter={formatTooltipValueMoney} contentStyle={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "white"
                    }} />
                      <Bar dataKey="value" fill="#EF4444" barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
            
            <FadeInView delay={0.5}>
              <motion.div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Анализ штрафов
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Общая сумма штрафов</h4>
                    <p className="text-sm text-gray-500">
                      Общая сумма штрафов составляет {totalFines.toFixed(2)} ₽.
                      {totalFines > 5000 ? " Это высокий показатель. Рекомендуется улучшить систему уведомлений о сроках возврата." : " Это нормальный показатель для библиотеки данного размера."}
                    </p>
                    <Link href="/admin/users/fines" className="mt-4 inline-block">
                      <motion.span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center" whileHover={{
                      x: 3
                    }}>
                        Управление штрафами
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </motion.span>
                    </Link>
                  </div>
                  
                  <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Рекомендации</h4>
                    <p className="text-sm text-gray-500">
                      {users.filter(u => (u.fineAmount || 0) > 0).length > totalUsersCount * 0.1 ? `${users.filter(u => (u.fineAmount || 0) > 0).length} пользователей имеют штрафы. Рекомендуется пересмотреть политику штрафов и улучшить систему уведомлений.` : `Только ${users.filter(u => (u.fineAmount || 0) > 0).length} пользователей имеют штрафы. Это хороший показатель дисциплины читателей.`}
                    </p>
                    <Link href="/admin/settings" className="mt-4 inline-block">
                      <motion.span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center" whileHover={{
                      x: 3
                    }}>
                        Настройки системы
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </motion.span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </FadeInView>
          </TabsContent>
                  </Tabs>
        </div>

        {/* Расширенное ИИ меню */}
        <Dialog open={aiMenuOpen} onOpenChange={setAiMenuOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Настройки ИИ аналитики
              </DialogTitle>
              <DialogDescription>
                Настройте параметры для генерации персонализированного аналитического отчета
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Временной период */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <Label className="text-sm font-medium">Временной период анализа</Label>
                </div>
                
                <Select value={selectedTimePeriod} onValueChange={setSelectedTimePeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите период" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">Последний месяц</SelectItem>
                    <SelectItem value="3months">Последние 3 месяца</SelectItem>
                    <SelectItem value="6months">Последние 6 месяцев</SelectItem>
                    <SelectItem value="1year">Последний год</SelectItem>
                    <SelectItem value="custom">Настраиваемый период</SelectItem>
                  </SelectContent>
                </Select>

                {selectedTimePeriod === 'custom' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600">От</Label>
                      <Input
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">До</Label>
                      <Input
                        type="date"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Категории отчета */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-500" />
                    <Label className="text-sm font-medium">Категории анализа</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={selectAllCategories} variant="outline" size="sm" className="text-xs">
                      Выбрать все
                    </Button>
                    <Button onClick={deselectAllCategories} variant="outline" size="sm" className="text-xs">
                      Снять выбор
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'overview', label: 'Общий обзор', icon: TrendingUp },
                    { id: 'books', label: 'Анализ книг', icon: BookOpen },
                    { id: 'users', label: 'Анализ пользователей', icon: Users },
                    { id: 'reservations', label: 'Резервирования', icon: CalendarClock },
                    { id: 'fines', label: 'Штрафы', icon: CircleDollarSign },
                    { id: 'performance', label: 'Эффективность', icon: BarChart3 }
                  ].map(({ id, label, icon: Icon }) => (
                    <div key={id} className="flex items-center space-x-2">
                      <Checkbox
                        id={id}
                        checked={selectedReportCategories.has(id)}
                        onCheckedChange={() => toggleReportCategory(id)}
                      />
                      <label htmlFor={id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Формат отчета */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <Label className="text-sm font-medium">Формат отчета</Label>
                </div>
                
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Краткий (основные метрики)</SelectItem>
                    <SelectItem value="standard">Стандартный (сбалансированный)</SelectItem>
                    <SelectItem value="detailed">Подробный (развернутый анализ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Приоритет анализа */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <Label className="text-sm font-medium">Приоритет анализа</Label>
                </div>
                
                <Select value={reportPriority} onValueChange={setReportPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Сбалансированный анализ</SelectItem>
                    <SelectItem value="efficiency">Эффективность процессов</SelectItem>
                    <SelectItem value="user_satisfaction">Удовлетворенность пользователей</SelectItem>
                    <SelectItem value="financial">Финансовые показатели</SelectItem>
                    <SelectItem value="collection">Развитие коллекции</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Дополнительные настройки */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-500" />
                  <Label className="text-sm font-medium">Дополнительные опции</Label>
                </div>

                <div className="space-y-2">
                                     <div className="flex items-center space-x-2">
                     <Checkbox
                       id="recommendations"
                       checked={includeRecommendations}
                       onCheckedChange={(checked) => setIncludeRecommendations(checked === true)}
                     />
                     <label htmlFor="recommendations" className="text-sm cursor-pointer">
                       Включить рекомендации по улучшению
                     </label>
                   </div>

                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="charts"
                       checked={includeCharts}
                       onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                     />
                     <label htmlFor="charts" className="text-sm cursor-pointer">
                       Упомянуть возможные графики и диаграммы
                     </label>
                   </div>
                </div>
              </div>

              {/* Предварительный просмотр настроек */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Предварительный просмотр</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Период:</strong> {selectedTimePeriod === 'custom' ? `${customDateFrom} - ${customDateTo}` : {
                    '1month': 'Последний месяц',
                    '3months': 'Последние 3 месяца', 
                    '6months': 'Последние 6 месяцев',
                    '1year': 'Последний год'
                  }[selectedTimePeriod]}</p>
                  <p><strong>Категории:</strong> {selectedReportCategories.size} выбрано</p>
                  <p><strong>Формат:</strong> {reportFormat === 'brief' ? 'Краткий' : reportFormat === 'standard' ? 'Стандартный' : 'Подробный'}</p>
                  <p><strong>Рекомендации:</strong> {includeRecommendations ? 'Включены' : 'Отключены'}</p>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={generateAdvancedSummary}
                  className="flex-1"
                  size="lg"
                  disabled={summaryLoading || selectedReportCategories.size === 0}
                >
                  {summaryLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                      />
                      Генерация отчета...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Сгенерировать отчет ({selectedReportCategories.size})
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setAiMenuOpen(false)}
                  variant="outline"
                  size="lg"
                >
                  Отменить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Модальное окно для отображения сводки */}
        <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
          <DialogContent className="bg-white border border-gray-200 text-gray-800 max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Аналитический отчет библиотеки
                </DialogTitle>
                
                <Button onClick={copyReportToClipboard} className="bg-blue-500 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 px-3 py-1" size="sm">
                  <Copy className="w-4 h-4" />
                  {copiedToClipboard ? "Скопировано!" : "Копировать"}
                </Button>
              </div>
              <DialogDescription className="text-gray-500">
                Сгенерированный ИИ анализ данных библиотеки
              </DialogDescription>
            </DialogHeader>
            
            {summaryLoading ? <div className="flex flex-col items-center justify-center py-10">
                <motion.div animate={{
              rotate: 360
            }} transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }} className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full" />
                <p className="mt-4 text-blue-500">Генерация аналитики...</p>
              </div> : <div className="bg-gray-100 rounded-lg p-6 prose max-w-none">
                {/* Добавляем дату сверху отчета */}
                <div className="text-right mb-4">
                  <p className="text-blue-500 font-medium">{getCurrentDate()}</p>
                </div>
                <div className="whitespace-pre-line markdown-report" dangerouslySetInnerHTML={{
              __html: summaryResult.replace(/\n\n/g, '<br><br>').replace(/### (.*)/g, '<h3 class="text-xl font-bold text-blue-500 mt-6 mb-3">$1</h3>').replace(/## (.*)/g, '<h2 class="text-2xl font-bold text-blue-600 mt-8 mb-4">$1</h2>').replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-blue-500">$1</span>').replace(/\* (.*)/g, '<li class="ml-4">$1</li>')
            }} />
              </div>}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}