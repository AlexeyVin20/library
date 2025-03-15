"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Calendar from "@/components/admin/Calendar";
import {
  Activity, BookOpen, Library, Users, FileText, MessageSquare,
  Clock, GitPullRequest, BarChart, BookText
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

// Интерфейсы на основе контроллеров
interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  isActive: boolean;
  borrowedBooksCount: number;
  maxBooksAllowed: number;
  fineAmount: number;
}

interface Book {
  id: string;
  title: string;
  authors: string;
  isbn: string;
  cover?: string;
  availableCopies: number;
}

interface Journal {
  id: number;
  title: string;
  issn: string;
  publisher?: string;
  category: string;
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
}

export default function DashboardPage() {
  // Состояния для хранения данных
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date>(new Date());

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
        
        // Параллельная загрузка данных
        const [usersRes, booksRes, journalsRes, reservationsRes] = await Promise.all([
          fetch(`${baseUrl}/api/User`),
          fetch(`${baseUrl}/api/Books`),
          fetch(`${baseUrl}/api/Journals`),
          fetch(`${baseUrl}/api/Reservation`)
        ]);
        
        if (usersRes.ok && booksRes.ok && journalsRes.ok && reservationsRes.ok) {
          const [usersData, booksData, journalsData, reservationsData] = await Promise.all([
            usersRes.json(),
            booksRes.json(),
            journalsRes.json(),
            reservationsRes.json()
          ]);
          
          setUsers(usersData);
          setBooks(booksData);
          setJournals(journalsData);
          setReservations(reservationsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Вычисляемые значения
  const activeUsersCount = users.filter(user => user.isActive).length;
  const totalBooksCount = books.length;
  const totalJournalsCount = journals.length;
  const totalUsersCount = users.length;
  const pendingReservations = reservations.filter(res => res.status === "Pending").length;
  
  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Панель управления</h1>
      <p className="text-gray-500 mb-6">
        Последнее обновление: {new Date().toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
      
      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Взятые книги</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, user) => sum + user.borrowedBooksCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.borrowedBooksCount > 0).length} пользователей взяли книги
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsersCount}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((activeUsersCount / totalUsersCount) * 100)}% от общего числа
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего книг</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBooksCount}</div>
            <p className="text-xs text-muted-foreground">
              {books.reduce((sum, book) => sum + book.availableCopies, 0)} доступных копий
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsersCount}</div>
            <p className="text-xs text-muted-foreground">
              +5 за последний месяц
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Новая строка с дополнительными показателями */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего журналов</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJournalsCount}</div>
            <p className="text-xs text-muted-foreground">
              {journals.filter(j => j.isOpenAccess).length} в открытом доступе
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Резервации</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingReservations} ожидают подтверждения
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Штрафы</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.fineAmount > 0).length}</div>
            <p className="text-xs text-muted-foreground">
              {users.reduce((sum, user) => sum + (user.fineAmount || 0), 0).toFixed(2)} ₽ общая сумма
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Научные журналы</CardTitle>
            <BookText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {journals.filter(j => j.category === "Scientific").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {journals.filter(j => j.isPeerReviewed).length} рецензируемых
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Основной контент */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Статистика библиотеки */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Статистика библиотеки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Взятые книги</span>
                  <span className="text-sm font-medium">
                    {Math.round((users.reduce((sum, user) => sum + user.borrowedBooksCount, 0) / 
                      totalBooksCount) * 100)}%
                  </span>
                </div>
                <Progress value={(users.reduce((sum, user) => sum + user.borrowedBooksCount, 0) / 
                  totalBooksCount) * 100} className="h-2 mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Активные пользователи</span>
                  <span className="text-sm font-medium">
                    {Math.round((activeUsersCount / totalUsersCount) * 100)}%
                  </span>
                </div>
                <Progress value={(activeUsersCount / totalUsersCount) * 100} className="h-2 mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Книги в резервации</span>
                  <span className="text-sm font-medium">
                    {Math.round((reservations.length / totalBooksCount) * 100)}%
                  </span>
                </div>
                <Progress value={(reservations.length / totalBooksCount) * 100} className="h-2 mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Журналы открытого доступа</span>
                  <span className="text-sm font-medium">
                    {Math.round((journals.filter(j => j.isOpenAccess).length / totalJournalsCount) * 100)}%
                  </span>
                </div>
                <Progress value={(journals.filter(j => j.isOpenAccess).length / totalJournalsCount) * 100} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Активность пользователей */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Активность пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 4).map((user, index) => (
                <div key={user.id} className="flex items-center">
                  <Avatar className="h-9 w-9 mr-3">
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.borrowedBooksCount} книг из {user.maxBooksAllowed} разрешенных
                    </p>
                  </div>
                  <Progress 
                    value={(user.borrowedBooksCount / user.maxBooksAllowed) * 100} 
                    className="h-2 w-24" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Календарь возвратов книг */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Календарь возвратов книг</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border"
            />
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Ожидаемые возвраты на {date.toLocaleDateString('ru-RU')}</h4>
              <div className="space-y-2">
                {reservations
                  .filter(r => new Date(r.expirationDate).toDateString() === date.toDateString())
                  .map((reservation) => {
                    const user = users.find(u => u.id === reservation.userId);
                    const book = books.find(b => b.id === reservation.bookId);
                    return (
                      <div key={reservation.id} className="flex items-center justify-between text-sm">
                        <span>{book?.title || 'Неизвестная книга'}</span>
                        <span className="font-medium">{user?.fullName || 'Неизвестный пользователь'}</span>
                      </div>
                    );
                  })}
                {reservations.filter(r => new Date(r.expirationDate).toDateString() === date.toDateString()).length === 0 && (
                  <p className="text-sm text-muted-foreground">Нет ожидаемых возвратов на этот день</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Запросы на книги */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Запросы на книги</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reservations.filter(r => r.status === "Pending").slice(0, 3).map((reservation) => {
                const user = users.find(u => u.id === reservation.userId);
                const book = books.find(b => b.id === reservation.bookId);
                
                return (
                  <div key={reservation.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{user?.fullName || 'Неизвестный пользователь'} запросил книгу</p>
                        <p className="text-sm text-muted-foreground">{formatDate(reservation.reservationDate)}</p>
                      </div>
                      <div className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                        {reservation.status}
                      </div>
                    </div>
                    <p className="mt-2 text-sm">{book?.title || 'Неизвестная книга'}</p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline">Одобрить</Button>
                      <Button size="sm" variant="outline" className="text-red-500">Отклонить</Button>
                    </div>
                  </div>
                );
              })}
              {reservations.filter(r => r.status === "Pending").length === 0 && (
                <p className="text-sm text-muted-foreground">Нет активных запросов на книги</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Сообщения пользователей */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Сообщения пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 3).map((user, index) => (
                <div key={user.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start">
                    <Avatar className="h-9 w-9 mr-3">
                      <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium mr-2">{user.fullName}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(Date.now() - index * 3600000).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        {[
                          "Здравствуйте, можно ли продлить срок возврата книги?",
                          "Когда будут новые поступления в разделе научной литературы?",
                          "У вас есть электронная версия этой книги?"
                        ][index]}
                      </p>
                      <Button size="sm" variant="link" className="p-0 h-auto mt-2">Ответить</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Запросы пользователей */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Запросы пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 3).map((user, index) => (
                <div key={user.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(new Date(Date.now() - index * 86400000).toISOString())}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      ["bg-yellow-100 text-yellow-800", "bg-green-100 text-green-800", "bg-red-100 text-red-800"][index]
                    }`}>
                      {["В обработке", "Одобрено", "Отклонено"][index]}
                    </div>
                  </div>
                  <p className="mt-2 text-sm">
                    {[
                      "Запрос на продление абонемента",
                      "Заявка на доступ к редкому фонду",
                      "Запрос на изменение личных данных"
                    ][index]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Статистика выдачи книг */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Статистика выдачи книг</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Художественная литература</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2 mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Научная литература</span>
                  <span className="text-sm font-medium">28%</span>
                </div>
                <Progress value={28} className="h-2 mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Учебная литература</span>
                  <span className="text-sm font-medium">18%</span>
                </div>
                <Progress value={18} className="h-2 mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Детская литература</span>
                  <span className="text-sm font-medium">9%</span>
                </div>
                <Progress value={9} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Быстрые действия */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center">
                <BookOpen className="h-5 w-5 mb-1" />
                <span>Добавить книгу</span>
              </Button>
              <Button className="h-20 flex flex-col items-center justify-center">
                <Users className="h-5 w-5 mb-1" />
                <span>Новый пользователь</span>
              </Button>
              <Button className="h-20 flex flex-col items-center justify-center">
                <FileText className="h-5 w-5 mb-1" />
                <span>Добавить журнал</span>
              </Button>
              <Button className="h-20 flex flex-col items-center justify-center">
                <GitPullRequest className="h-5 w-5 mb-1" />
                <span>Статус резервации</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Последние активности */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Последние активности</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium p-2">Действие</th>
                  <th className="text-left font-medium p-2">Пользователь</th>
                  <th className="text-left font-medium p-2">Книга</th>
                  <th className="text-left font-medium p-2">Дата</th>
                  <th className="text-left font-medium p-2">Статус</th>
                </tr>
              </thead>
              <tbody>
                {reservations.slice(0, 5).map((reservation, index) => {
                  const user = users.find(u => u.id === reservation.userId);
                  const book = books.find(b => b.id === reservation.bookId);
                  
                  return (
                    <tr key={reservation.id} className="border-b last:border-0">
                      <td className="p-2">Резервация</td>
                      <td className="p-2">{user?.fullName || "Неизвестный пользователь"}</td>
                      <td className="p-2">{book?.title || "Неизвестная книга"}</td>
                      <td className="p-2">{formatDate(reservation.reservationDate)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          reservation.status === "Approved" ? "bg-green-100 text-green-800" :
                          reservation.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {reservation.status === "Approved" ? "Одобрено" :
                           reservation.status === "Pending" ? "В обработке" :
                           "Отклонено"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
