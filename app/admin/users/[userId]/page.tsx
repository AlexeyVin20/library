"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Edit, Trash2, User, Calendar, Book, AlertTriangle, CheckCircle, XCircle, Mail, Phone
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { UserBorrowingChart } from "@/components/admin/UserBorrowingChart";

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportNumber: string;
  passportIssuedBy: string;
  passportIssuedDate: string;
  address: string;
  dateRegistered: string;
  borrowedBooksCount: number;
  fineAmount: number;
  isActive: boolean;
  lastLoginDate: string;
  loanPeriodDays: number;
  maxBooksAllowed: number;
  username: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  returnDate: string;
}

interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
  book?: { 
    id: string;
    title: string;
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
        
        // Получение данных пользователя
        const userResponse = await fetch(`${baseUrl}/api/User/${userId}`);
        if (!userResponse.ok) throw new Error(`Ошибка загрузки пользователя: ${userResponse.status}`);
        const userData = await userResponse.json();
        console.log("Данные пользователя:", userData);
        console.log("Адрес:", userData.address);
        console.log("Срок выдачи (дней):", userData.loanPeriodDays);
        setUser(userData);
        
        // Получение книг пользователя
        const booksResponse = await fetch(`${baseUrl}/api/Books/user/${userId}`);
        if (booksResponse.ok) {
          const booksData = await booksResponse.json();
          setBorrowedBooks(booksData);
        }
        
        // Получение резерваций пользователя
        const reservationsResponse = await fetch(`${baseUrl}/api/Reservation?userId=${userId}`);
        if (reservationsResponse.ok) {
          const reservationsData = await reservationsResponse.json();
          setReservations(reservationsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
        console.error("Ошибка загрузки данных:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleDeleteUser = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
      const response = await fetch(`${baseUrl}/api/User/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при удалении пользователя: ${response.status}`);
      }
      
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при удалении пользователя");
      console.error("Ошибка удаления:", err);
    }
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

  if (!user) return (
      <div className="p-4 bg-yellow-100/80 dark:bg-yellow-900/80 backdrop-blur-xl border border-yellow-400 text-yellow-700 dark:text-yellow-200 rounded-lg">
        Пользователь не найден
      </div>
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "Не указано";
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  // Данные для графика использования библиотеки
  const chartData = {
    borrowed: user.borrowedBooksCount,
    available: user.maxBooksAllowed - user.borrowedBooksCount,
    reservations: reservations.filter(r => r.status === "Обрабатывается" && r.userId === userId).length
  };

  return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/admin/users" className="text-blue-600 hover:underline flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад к списку пользователей
          </Link>
          
          <div className="flex space-x-2">
            <Link href={`/admin/users/${userId}/update`}>
              <Button className="bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2">
                <Edit className="h-4 w-4 mr-1" />
                Редактировать
              </Button>
            </Link>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button className="bg-gradient-to-r from-red-600/90 to-red-700/70 dark:from-red-700/80 dark:to-red-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Удалить
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие удалит пользователя и все связанные с ним данные. Это действие необратимо.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Основная информация о пользователе */}
          <Card className="md:col-span-2 bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold flex items-center text-neutral-500 dark:text-neutral-200">
                  <User className="mr-2" />
                  {user.fullName}
                </CardTitle>
                <Badge variant={user.isActive ? "success" : "destructive"} className="bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl">
                  {user.isActive ? "Активен" : "Заблокирован"}
                </Badge>
              </div>
              <CardDescription className="flex items-center mt-1 text-neutral-400 dark:text-neutral-300">
                <Mail className="h-4 w-4 mr-1" />
                {user.email}
              </CardDescription>
              {user.phone && (
                <CardDescription className="flex items-center mt-1 text-neutral-400 dark:text-neutral-300">
                  <Phone className="h-4 w-4 mr-1" />
                  {user.phone}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-neutral-500 dark:text-neutral-200">Основная информация</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-neutral-400 dark:text-neutral-300 min-w-32">Логин:</span>
                      <span className="text-neutral-500 dark:text-neutral-200">{user.username}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neutral-400 dark:text-neutral-300 min-w-32">Дата рождения:</span>
                      <span className="text-neutral-500 dark:text-neutral-200">{formatDate(user.dateOfBirth)}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neutral-400 dark:text-neutral-300 min-w-32">Адрес:</span>
                      <span className="text-neutral-500 dark:text-neutral-200">{user.address || "Не указан"}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neutral-400 dark:text-neutral-300 min-w-32">Дата регистрации:</span>
                      <span className="text-neutral-500 dark:text-neutral-200">{formatDate(user.dateRegistered)}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neutral-400 dark:text-neutral-300 min-w-32">Последний вход:</span>
                      <span className="text-neutral-500 dark:text-neutral-200">{formatDate(user.lastLoginDate)}</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-neutral-500 dark:text-neutral-200">Библиотечная информация</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-neutral-400 dark:text-neutral-300 min-w-40">Книг на руках:</span>
                      <span className="text-neutral-500 dark:text-neutral-200">
                        {user.borrowedBooksCount} из {user.maxBooksAllowed}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neutral-400 dark:text-neutral-300 min-w-40">Срок выдачи:</span>
                      <span className="text-neutral-500 dark:text-neutral-200">{user.loanPeriodDays || 14} дней</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-neutral-400 dark:text-neutral-300 min-w-40">Штраф:</span>
                      <span className={user.fineAmount > 0 ? "text-red-500 font-semibold" : "text-neutral-500 dark:text-neutral-200"}>
                        {user.fineAmount.toFixed(2)} руб.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {user.passportNumber && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2 text-neutral-500 dark:text-neutral-200">Паспортные данные</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-neutral-400 dark:text-neutral-300 min-w-32">Номер паспорта:</span>
                      <span className="text-neutral-500 dark:text-neutral-200">{user.passportNumber}</span>
                    </li>
                    {user.passportIssuedBy && (
                      <li className="flex items-start">
                        <span className="text-neutral-400 dark:text-neutral-300 min-w-32">Кем выдан:</span>
                        <span className="text-neutral-500 dark:text-neutral-200">{user.passportIssuedBy}</span>
                      </li>
                    )}
                    {user.passportIssuedDate && (
                      <li className="flex items-start">
                        <span className="text-neutral-400 dark:text-neutral-300 min-w-32">Дата выдачи:</span>
                        <span className="text-neutral-500 dark:text-neutral-200">{formatDate(user.passportIssuedDate)}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* График использования библиотеки */}
          <Card className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-neutral-500 dark:text-neutral-200">Использование библиотеки</CardTitle>
              <CardDescription className="text-neutral-400 dark:text-neutral-300">Квота книг пользователя</CardDescription>
            </CardHeader>
            <CardContent>
              <UserBorrowingChart data={chartData} />
            </CardContent>
          </Card>
        </div>

        {/* Книги на руках */}
        <div className="mt-6">
          <Card className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-neutral-500 dark:text-neutral-200">
                <Book className="mr-2" />
                Книги на руках
              </CardTitle>
            </CardHeader>
            <CardContent>
              {borrowedBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {borrowedBooks.map((book) => (
                    <div key={book.id} className="bg-white/20 dark:bg-neutral-700/20 rounded-lg p-4 border border-white/30 dark:border-neutral-700/30">
                      <h4 className="font-semibold text-neutral-500 dark:text-neutral-200">{book.title}</h4>
                      <p className="text-neutral-400 dark:text-neutral-300">Автор: {book.author}</p>
                      <p className="text-sm mt-1 text-neutral-400 dark:text-neutral-300">
                        Дата возврата: <span className="font-medium text-neutral-500 dark:text-neutral-200">{formatDate(book.returnDate)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-400 dark:text-neutral-300">Пользователь не брал книги</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Резервации пользователя */}
        <div className="mt-6">
          <Card className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-neutral-500 dark:text-neutral-200">
                <Calendar className="mr-2" />
                Резервации пользователя
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reservations.filter(r => r.userId === userId).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reservations.filter(r => r.userId === userId).map((reservation) => (
                    <div 
                      key={reservation.id} 
                      className={`bg-white/20 dark:bg-neutral-700/20 rounded-lg p-4 border ${
                        reservation.status === "Выполнена" ? "border-green-300/30 bg-green-50/20" : 
                        reservation.status === "Отменена" ? "border-red-300/30 bg-red-50/20" : 
                        "border-yellow-300/30 bg-yellow-50/20"
                      }`}
                    >
                      <h4 className="font-semibold text-neutral-500 dark:text-neutral-200">
                        {reservation.book?.title || "Неизвестная книга"}
                      </h4>
                      <p className="text-sm text-neutral-400 dark:text-neutral-300">
                        Срок до: {formatDate(reservation.expirationDate)}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-sm mr-1 text-neutral-400 dark:text-neutral-300">Статус: </span>
                        <Badge variant={
                          reservation.status === "Выполнена" ? "success" : 
                          reservation.status === "Отменена" ? "destructive" : 
                          "warning"
                        } className="bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl">
                          {reservation.status === "Выполнена" ? "Одобрено" : 
                           reservation.status === "Отменена" ? "Отклонено" : 
                           "В обработке"}
                        </Badge>
                      </div>
                      {reservation.notes && (
                        <p className="text-sm italic mt-2 text-neutral-400 dark:text-neutral-300">
                          Примечание: {reservation.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-400 dark:text-neutral-300">У пользователя нет активных резерваций</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
