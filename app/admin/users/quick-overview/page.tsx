"use client";

import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Users, 
  BookOpen, 
  AlertTriangle, 
  ChevronLeft, 
  Calendar, 
  CreditCard, 
  User,
  Clock,
  Search,
  Filter,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Book } from "@/components/ui/book";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  borrowedBooksCount: number;
  fineAmount?: number;
  isActive?: boolean;
  username: string;
  maxBooksAllowed?: number;
  loanPeriodDays?: number;
}

interface BookInfo {
  id: string;
  title?: string;
  author?: string;
  returnDate?: string;
  cover?: string;
  isOverdue: boolean;
  bookTitle?: string;
  bookAuthors?: string;
  dueDate?: string;
}

interface UserWithBooks extends User {
  activeReservations: BookInfo[];
  overdueBooks?: BookInfo[];
}

interface UserWithFines extends User {
  fineAmount: number;
  overdueBooks: BookInfo[];
  allBorrowedBooks: BookInfo[];
}

interface UsersWithBooksResponse {
  totalUsers: number;
  totalBorrowedBooks: number;
  users: UserWithBooks[];
}

// Интерфейс для сырых данных из API
interface ApiUserWithFines {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  fineAmount: number;
  borrowedBooksCount: number;
  overdueBooks: Array<{
    reservationId: string;
    bookId: string;
    cover?: string;
    bookTitle: string;
    bookAuthors: string;
    bookISBN: string;
    borrowDate: string;
    dueDate: string;
    daysOverdue: number;
    estimatedFine: number;
    reservationStatus: string;
    notes?: string;
  }>;
  allReservations: Array<{
    reservationId: string;
    bookTitle: string;
    borrowDate: string;
    dueDate: string;
    returnDate?: string;
    isOverdue: boolean;
    status: string;
    notes?: string;
  }>;
}

interface UsersWithFinesResponse {
  totalUsersWithFines: number;
  totalFineAmount: number;
  totalOverdueBooks: number;
  users: ApiUserWithFines[];
}

const FadeInView = ({ 
  children, 
  delay = 0 
}: { 
  children: React.ReactNode; 
  delay?: number; 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
  delay = 0,
  onClick
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
  onClick?: () => void;
}) => (
  <FadeInView delay={delay}>
    <motion.div 
      className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between border border-gray-200 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)" }}
      onClick={onClick}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${color}`}></div>
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${color.replace("bg-", "text-")}`}>
          {icon}
          {title}
        </h3>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${color.replace("bg-", "bg-").replace(/-(500|400|600)/, "-100")}`}>
          <span className={color.replace("bg-", "text-")}>
            {icon}
          </span>
        </div>
      </div>
      <div>
        <p className={`text-4xl font-bold mb-2 ${color.replace("bg-", "text-")}`}>{value}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </motion.div>
  </FadeInView>
);

const BookCover = ({ book }: { book: BookInfo }) => (
  <Link href={`/admin/reservations/${book.id}`} className="block group text-gray-800 cursor-pointer">
    <div className="relative w-full overflow-visible flex items-center justify-center" style={{ height: "180px" }}>
      <motion.div 
        className="transform-gpu transition-all duration-500" 
        initial={{ rotateY: 0 }} 
        whileHover={{ scale: 1.05 }}
      >
        <Book 
          color={book.isOverdue ? "#DC2626" : "#4F46E5"} 
          width={120}
          depth={3}
          variant="default"
          illustration={book.cover ? 
            <Image 
              src={book.cover} 
              alt={book.title || 'Неизвестная книга'} 
              width={120} 
              height={140} 
              className="object-cover rounded" 
              unoptimized 
            /> : undefined
          }
        >
          <div></div>
        </Book>
      </motion.div>
    </div>
    <motion.div 
      className={`mt-2 rounded-lg p-3 shadow-md border text-center transition-all duration-300 ${
        book.isOverdue ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-white border-gray-100 hover:bg-gray-50'
      }`}
      whileHover={{
        y: -3,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
      }}
    >
      <p className={`font-semibold text-sm line-clamp-2 ${book.isOverdue ? 'text-red-800' : 'text-gray-800'}`} 
         title={book.title || 'Неизвестная книга'}>
        {book.title || 'Неизвестная книга'}
      </p>
      <p className="text-xs text-gray-500 line-clamp-1 mt-1" title={book.author || 'Автор не указан'}>
        {book.author || 'Автор не указан'}
      </p>
      {book.returnDate && book.returnDate !== null && (
        <div className={`flex items-center justify-center gap-1 mt-2 text-xs ${
          book.isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
        }`}>
          <Calendar className="w-3 h-3" />
          <span>
            {new Date(book.returnDate).toLocaleDateString("ru-RU")}
            {book.isOverdue && " (просрочено)"}
          </span>
        </div>
      )}
    </motion.div>
  </Link>
);

const UserCard = ({ 
  user, 
  type 
}: { 
  user: UserWithBooks | UserWithFines; 
  type: 'books' | 'fines';
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200"
    whileHover={{ y: -2 }}
  >
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="font-semibold text-gray-800">{user.fullName}</h3>
        <p className="text-sm text-gray-500">{user.email}</p>
        {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
      </div>
      <Link href={`/admin/users/${user.id}`}>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4" />
        </Button>
      </Link>
    </div>

    {type === 'books' && 'activeReservations' in user && (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <BookOpen className="w-4 h-4" />
          <span>Книг на руках: {user.borrowedBooksCount}</span>
          {user.maxBooksAllowed && (
            <span className="text-xs text-gray-400">/ {user.maxBooksAllowed}</span>
          )}
        </div>
        
        {(() => {
          const userWithBooks = user as UserWithBooks;
          const allBooks = [
            ...(userWithBooks.activeReservations || []),
            ...(userWithBooks.overdueBooks || [])
          ];
          
          if (allBooks.length > 0) {
            return (
              <div className="space-y-3">
                {userWithBooks.overdueBooks && userWithBooks.overdueBooks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-red-700 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Просроченные книги ({userWithBooks.overdueBooks.length}):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {userWithBooks.overdueBooks.slice(0, 3).map((book) => (
                        <div key={book.id} className="flex-shrink-0">
                          <BookCover book={book} />
                        </div>
                      ))}
                      {userWithBooks.overdueBooks.length > 3 && (
                        <div className="flex flex-col items-center justify-center bg-red-50 rounded-lg p-4 shadow-md border border-red-200" style={{ height: "180px" }}>
                          <div className="text-center">
                            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-red-600">
                              +{userWithBooks.overdueBooks.length - 3}
                            </p>
                            <p className="text-xs text-red-500">
                              просроченных
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {userWithBooks.activeReservations && userWithBooks.activeReservations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      Активные книги ({userWithBooks.activeReservations.length}):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {userWithBooks.activeReservations.slice(0, 3).map((book) => (
                        <div key={book.id} className="flex-shrink-0">
                          <BookCover book={book} />
                        </div>
                      ))}
                      {userWithBooks.activeReservations.length > 3 && (
                        <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4 shadow-md border border-gray-200" style={{ height: "180px" }}>
                          <div className="text-center">
                            <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-600">
                              +{userWithBooks.activeReservations.length - 3}
                            </p>
                            <p className="text-xs text-gray-500">
                              активных
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          } else if (user.borrowedBooksCount > 0) {
            return (
              <div className="text-xs text-gray-400 italic flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Детали книг не загружены (всего: {user.borrowedBooksCount})
              </div>
            );
          } else {
            return (
              <div className="text-xs text-gray-400 italic">
                Нет книг на руках
              </div>
            );
          }
        })()}
      </div>
    )}

    {type === 'fines' && 'overdueBooks' in user && (
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <CreditCard className="w-4 h-4" />
            <span>Текущий штраф: {(user as UserWithFines).fineAmount.toFixed(2)} ₽</span>
          </div>
        </div>
        
        {(user as UserWithFines).overdueBooks && (user as UserWithFines).overdueBooks.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 font-medium">Просроченные книги:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(user as UserWithFines).overdueBooks.slice(0, 6).map((book: BookInfo) => (
                <div key={book.id} className="flex-shrink-0">
                  <BookCover book={book} />
                </div>
              ))}
              {(user as UserWithFines).overdueBooks.length > 6 && (
                <div className="flex flex-col items-center justify-center bg-red-50 rounded-lg p-4 shadow-md border border-red-200" style={{ height: "180px" }}>
                  <div className="text-center">
                    <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-red-600">
                      +{(user as UserWithFines).overdueBooks.length - 6}
                    </p>
                    <p className="text-xs text-red-500">
                      просроченных
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(user as UserWithFines).allBorrowedBooks && (user as UserWithFines).allBorrowedBooks.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-600">
              Всего книг: {(user as UserWithFines).allBorrowedBooks.length}
            </p>
          </div>
        )}
      </div>
    )}
  </motion.div>
);

const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center h-64">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full"
    />
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-4 text-blue-500 font-medium"
    >
      Загрузка данных...
    </motion.p>
  </div>
);

export default function QuickOverviewPage() {
  const [usersWithBooks, setUsersWithBooks] = useState<UserWithBooks[]>([]);
  const [usersWithFines, setUsersWithFines] = useState<UserWithFines[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'books' | 'fines'>('books');
  const [totalStats, setTotalStats] = useState({
    totalUsers: 0,
    totalBorrowedBooks: 0,
    totalUsersWithFines: 0,
    totalFineAmount: 0,
    totalOverdueBooks: 0
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Получаем данные с новых эндпоинтов
      const [booksResponse, finesResponse] = await Promise.all([
        fetch(`${baseUrl}/api/User/with-books`),
        fetch(`${baseUrl}/api/User/with-fines`)
      ]);

      if (!booksResponse.ok) throw new Error("Ошибка при загрузке пользователей с книгами");
      if (!finesResponse.ok) throw new Error("Ошибка при загрузке пользователей со штрафами");

      const booksData: UsersWithBooksResponse = await booksResponse.json();
      const finesData: UsersWithFinesResponse = await finesResponse.json();

      // Проверяем, что данные корректны
      if (!booksData || !finesData) {
        throw new Error("Получены некорректные данные от сервера");
      }

      // Создаем карту пользователей со штрафами для быстрого поиска
      const finesUsersMap = new Map();
      (finesData.users || []).forEach((user: ApiUserWithFines) => {
        finesUsersMap.set(user.id, {
          overdueBooks: (user.overdueBooks || []).map((book: any) => ({
            id: book.reservationId || book.bookId || '',
            title: book.bookTitle || 'Неизвестная книга',
            author: book.bookAuthors || 'Автор не указан',
            returnDate: book.dueDate || null,
            cover: book.cover || '',
            isOverdue: true
          }))
        });
      });

      // Обрабатываем данные о книгах и добавляем просроченные книги
      const processedUsersWithBooks = booksData.users?.map(user => {
        const finesData = finesUsersMap.get(user.id);
        return {
          ...user,
          activeReservations: (user.activeReservations || []).map(book => ({
            id: book.id,
            title: book.bookTitle,
            author: book.bookAuthors,
            returnDate: book.dueDate,
            cover: book.cover,
            isOverdue: book.isOverdue
          })),
          overdueBooks: finesData?.overdueBooks || []
        };
      }) || [];

      // Обрабатываем данные о штрафах
      const processedUsersWithFines: UserWithFines[] = (finesData.users || []).map((user: ApiUserWithFines) => {
        return {
          id: user.id || '',
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          borrowedBooksCount: user.borrowedBooksCount || 0,
          fineAmount: user.fineAmount || 0,
          username: user.username || '',
          // Маппим overdueBooks и преобразуем структуру
          overdueBooks: (user.overdueBooks || []).map((book: any) => ({
            id: book.reservationId || book.bookId || '',
            title: book.bookTitle || 'Неизвестная книга',
            author: book.bookAuthors || 'Автор не указан',
            returnDate: book.dueDate || null,
            cover: book.cover || '',
            isOverdue: true
          })),
          // Маппим allReservations в allBorrowedBooks
          allBorrowedBooks: (user.allReservations || []).map((book: any) => ({
            id: book.reservationId || '',
            title: book.bookTitle || 'Неизвестная книга',
            author: book.bookAuthors || 'Автор не указан',
            returnDate: book.dueDate || null,
            cover: book.cover || '',
            isOverdue: book.isOverdue || false
          }))
        };
      });

      setUsersWithBooks(processedUsersWithBooks);
      setUsersWithFines(processedUsersWithFines);
      setTotalStats({
        totalUsers: booksData.totalUsers || 0,
        totalBorrowedBooks: booksData.totalBorrowedBooks || 0,
        totalUsersWithFines: finesData.totalUsersWithFines || 0,
        totalFineAmount: finesData.totalFineAmount || 0,
        totalOverdueBooks: finesData.totalOverdueBooks || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Фильтрация по поиску
  const filteredUsersWithBooks = useMemo(() => 
    usersWithBooks.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.activeReservations.some(book => 
        (book.title && book.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()))
      ) ||
      (user.overdueBooks && user.overdueBooks.some(book => 
        (book.title && book.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()))
      ))
    ), [usersWithBooks, searchTerm]
  );

  const filteredUsersWithFines = useMemo(() => 
    usersWithFines.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    ), [usersWithFines, searchTerm]
  );

  const overdueUsersCount = useMemo(() => 
    usersWithBooks.filter(user => 
      user.activeReservations.some(book => book.isOverdue)
    ).length, [usersWithBooks]
  );

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium">Ошибка загрузки данных</p>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
            <Button onClick={fetchData} className="mt-3" size="sm">
              Повторить попытку
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Назад к пользователям
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Быстрый просмотр пользователей</h1>
              <p className="text-gray-500">Пользователи с книгами и задолженностями</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="С книгами"
            value={totalStats.totalUsers}
            subtitle="пользователей имеют книги"
            icon={<BookOpen className="w-5 h-5 text-gray-600" />}
            color="bg-blue-500"
            delay={0.1}
          />
          <StatCard
            title="Просрочили"
            value={overdueUsersCount}
            subtitle="пользователей с просрочкой"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="bg-orange-500"
            delay={0.2}
            onClick={() => {
              setActiveTab('books');
              setSearchTerm('');
            }}
          />
          <StatCard
            title="Просрочено"
            value={totalStats.totalOverdueBooks}
            subtitle="книг просрочено"
            icon={<Clock className="w-5 h-5" />}
            color="bg-red-400"
            delay={0.3}
          />
          <StatCard
            title="Со штрафами"
            value={totalStats.totalUsersWithFines}
            subtitle="пользователей имеют штрафы"
            icon={<CreditCard className="w-5 h-5" />}
            color="bg-red-500"
            delay={0.4}
            onClick={() => setActiveTab('fines')}
          />
          <StatCard
            title="Текущие штрафы"
            value={Math.round(totalStats.totalFineAmount)}
            subtitle="рублей начислено"
            icon={<CreditCard className="w-5 h-5" />}
            color="bg-gray-600"
            delay={0.5}
          />
        </div>

        {/* Поиск и фильтры */}
        <FadeInView delay={0.5}>
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Поиск по имени, email, логину или книге..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={activeTab === 'books' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('books')}
                  className={`text-sm ${activeTab === 'books' ? '' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  С книгами ({filteredUsersWithBooks.length})
                </Button>
                <Button
                  variant={activeTab === 'fines' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('fines')}
                  className={`text-sm ${activeTab === 'fines' ? '' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Со штрафами ({filteredUsersWithFines.length})
                </Button>
              </div>
            </div>
          </div>
        </FadeInView>

        {/* Список пользователей */}
        <FadeInView delay={0.6}>
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {activeTab === 'books' ? (
                      <>
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        Пользователи с книгами
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 text-red-500" />
                        Пользователи со штрафами
                      </>
                    )}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {activeTab === 'books' 
                      ? `Найдено ${filteredUsersWithBooks.length} пользователей с книгами`
                      : `Найдено ${filteredUsersWithFines.length} пользователей со штрафами`
                    }
                  </p>
                </div>
                {activeTab === 'fines' && (
                  <Link href="/admin/fines">
                    <Button variant="outline" size="lg">
                      <CreditCard className="w-4 h-4 mr-1 text-black" />
                      <span className="text-black">Управление штрафами</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'books' ? (
                filteredUsersWithBooks.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredUsersWithBooks.map((user) => (
                      <UserCard key={user.id} user={user} type="books" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchTerm ? "Не найдено пользователей с книгами по вашему запросу" : "Нет пользователей с книгами"}
                    </p>
                  </div>
                )
              ) : (
                filteredUsersWithFines.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredUsersWithFines.map((user) => (
                      <UserCard key={user.id} user={user} type="fines" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchTerm ? "Не найдено пользователей со штрафами по вашему запросу" : "Нет пользователей со штрафами"}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </FadeInView>
      </div>
    </div>
  );
} 