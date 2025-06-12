"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, CheckCircle, XCircle, Clock, ArrowRight, Filter, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

interface Reservation {
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
    cover?: string;
    availableCopies?: number;
  };
}

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

// Компонент предупреждения о недоступности книги
const BookUnavailableWarning = ({ 
  reservation, 
  expectedAvailableDate 
}: { 
  reservation: Reservation;
  expectedAvailableDate: Date | null;
}) => {
  if (!reservation.book || (reservation.book.availableCopies && reservation.book.availableCopies > 0)) {
    return null;
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3"
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-orange-800">Книга недоступна</h4>
          <p className="text-sm text-orange-700 mt-1">
            Все экземпляры книги "{reservation.book?.title}" заняты. 
            {expectedAvailableDate ? (
              <span className="font-medium"> Ожидается возврат до {formatDate(expectedAvailableDate)}.</span>
            ) : (
              <span> Дата возврата неизвестна.</span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
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
  return <TabsTrigger value={value} className={`relative transition-colors
        ${isActive ? 'bg-transparent text-gray-800 shadow-md' : ''}
        rounded-lg px-3 py-2
      `}>
      <div className="flex items-center gap-2">
        <span className={isActive ? "text-blue-700" : "text-gray-500"}>{icon}</span>
        <span>{label}</span>
      </div>
      {isActive && <motion.div layoutId="activeReservationTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.3
    }} />}
    </TabsTrigger>;
};

const StatusBadge = ({
  status
}: {
  status: string;
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Обрабатывается":
        return { color: "bg-blue-500", label: "В обработке" };
      case "Одобрена":
        return { color: "bg-green-500", label: "Одобрена" };
      case "Отменена":
        return { color: "bg-red-500", label: "Отменена" };
      case "Истекла":
        return { color: "bg-orange-500", label: "Истекла" };
      case "Выдана":
        return { color: "bg-blue-700", label: "Выдана" };
      case "Возвращена":
        return { color: "bg-green-600", label: "Возвращена" };
      case "Просрочена":
        return { color: "bg-red-600", label: "Просрочена" };
      case "Отменена_пользователем":
        return { color: "bg-gray-600", label: "Отменена пользователем" };
      default:
        return { color: "bg-gray-500", label: "Неизвестно" };
    }
  };

  const { color, label } = getStatusConfig(status);

  return <span className={`inline-block px-2 py-1 text-xs font-semibold text-white rounded-full ${color} shadow`}>
      {label}
    </span>;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Обрабатывается");
  const [bookAvailabilityDates, setBookAvailabilityDates] = useState<{[bookId: string]: Date}>({});
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    fetchReservations();
  }, []);

  // Функция для вычисления ожидаемых дат возврата книг
  const calculateBookAvailabilityDates = (reservations: Reservation[]) => {
    const availabilityMap: {[bookId: string]: Date} = {};
    
    reservations.forEach(reservation => {
      if (reservation.status === 'Выдана' && reservation.bookId) {
        const expirationDate = new Date(reservation.expirationDate);
        const currentDate = availabilityMap[reservation.bookId];
        
        // Берем самую позднюю дату возврата для каждой книги
        if (!currentDate || expirationDate > currentDate) {
          availabilityMap[reservation.bookId] = expirationDate;
        }
      }
    });
    
    setBookAvailabilityDates(availabilityMap);
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseUrl}/api/Reservation`);
      if (!response.ok) throw new Error("Ошибка при загрузке резервирований");
      const baseReservations: Reservation[] = await response.json();

      // Запрашиваем детали для каждой книги и пользователя
      const enrichedReservations = await Promise.all(baseReservations.map(async reservation => {
        let bookDetails = null;
        let userDetails = null;
        try {
          // Запрос деталей книги
          if (reservation.bookId) {
            const bookRes = await fetch(`${baseUrl}/api/books/${reservation.bookId}`);
            if (bookRes.ok) {
              bookDetails = await bookRes.json();
            } else {
              console.warn(`Не удалось загрузить книгу ${reservation.bookId} для резервирования ${reservation.id}`);
            }
          }
          // Запрос деталей пользователя
          if (reservation.userId) {
            const userRes = await fetch(`${baseUrl}/api/users/${reservation.userId}`);
            if (userRes.ok) {
              userDetails = await userRes.json();
            } else {
              console.warn(`Не удалось загрузить пользователя ${reservation.userId} для резервирования ${reservation.id}`);
            }
          }
        } catch (err) {
          console.error(`Ошибка при дозагрузке данных для резервирования ${reservation.id}:`, err);
        }
        return {
          ...reservation,
          book: bookDetails ? {
            ...reservation.book,
            ...bookDetails
          } : reservation.book,
          user: userDetails ? {
            ...reservation.user,
            ...userDetails
          } : reservation.user
        };
      }));

      // Применяем логику статусов для отображения
      const displayedReservations = enrichedReservations.map(r => {
        const now = new Date();
        const expirationDate = new Date(r.expirationDate);
        
        // Если резервирование выдано и просрочено
        if (expirationDate < now && r.status === 'Выдана') {
          return { ...r, status: 'Просрочена' };
        }
        
        // Если резервирование не выдано и срок истек
        if (expirationDate < now && (r.status === 'Обрабатывается' || r.status === 'Одобрена')) {
          return { ...r, status: 'Истекла' };
        }
        
        return r;
      });
      setReservations(displayedReservations);
      
      // Вычисляем ожидаемые даты доступности книг
      calculateBookAvailabilityDates(displayedReservations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке резервирований");
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Получаем токен авторизации
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Токен авторизации не найден. Пожалуйста, войдите в систему заново.");
      }

      const reservation = reservations.find(r => r.id === id);
      if (!reservation) throw new Error("Резервирование не найдено");
      const updatedReservation = {
        ...reservation,
        reservationDate: new Date(reservation.reservationDate).toISOString(),
        expirationDate: new Date(reservation.expirationDate).toISOString(),
        status: newStatus
      };
      const response = await fetch(`${baseUrl}/api/Reservation/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedReservation)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Ошибка при обновлении статуса");
      }
      setReservations(reservations.map(r => r.id === id ? {
        ...r,
        status: newStatus
      } : r));
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err);
      alert(err instanceof Error ? err.message : "Ошибка при обновлении статуса");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/Reservation/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Ошибка при удалении резервирования");
      setReservations(reservations.filter(r => r.id !== id));
      alert("Резервирование успешно удалено");
    } catch (err) {
      console.error("Ошибка при удалении резервирования:", err);
      alert(err instanceof Error ? err.message : "Ошибка при удалении резервирования");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Обрабатывается":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "Одобрена":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Отменена":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "Истекла":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "Выдана":
        return <ArrowRight className="w-5 h-5 text-blue-700" />;
      case "Возвращена":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Просрочена":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "Отменена_пользователем":
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCardGradient = (status: string) => {
    switch (status) {
      case "Обрабатывается":
        return "border-l-4 border-blue-500";
      case "Одобрена":
        return "border-l-4 border-green-500";
      case "Отменена":
        return "border-l-4 border-red-500";
      case "Истекла":
        return "border-l-4 border-orange-500";
      case "Выдана":
        return "border-l-4 border-blue-700";
      case "Возвращена":
        return "border-l-4 border-green-600";
      case "Просрочена":
        return "border-l-4 border-red-600";
      case "Отменена_пользователем":
        return "border-l-4 border-gray-600";
      default:
        return "border-l-4 border-gray-500";
    }
  };

  const filteredReservations = activeTab === "all" ? reservations : reservations.filter(r => r.status === activeTab);

  return <div className="min-h-screen bg-gray-200">
      <div className="container mx-auto p-6">
        {/* Header */}
        <FadeInView>
          <div className="mb-8 flex items-center gap-4">
            <motion.div initial={{
            x: -20,
            opacity: 0
          }} animate={{
            x: 0,
            opacity: 1
          }} transition={{
            duration: 0.5
          }}>
              <Link href="/admin" className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors">
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium text-gray-800">Назад</span>
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
              Резервирования
            </motion.h1>
          </div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-800">Фильтр</h2>
            </div>
            <Link href="/admin/reservations/create">
              <motion.button className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" whileHover={{
              y: -3,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
            }} whileTap={{
              scale: 0.98
            }}>
                <Plus className="h-4 w-4" />
                Создать резервирование
              </motion.button>
            </Link>
          </div>

          {error && <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </motion.div>}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="bg-white p-1 rounded-xl border border-gray-300 shadow-md text-gray-800">
              <AnimatedTabsTrigger value="all" icon={<Filter className="w-4 h-4" />} label="Все" isActive={activeTab === "all"} />
              <AnimatedTabsTrigger value="Обрабатывается" icon={<Clock className="w-4 h-4" />} label="В обработке" isActive={activeTab === "Обрабатывается"} />
              <AnimatedTabsTrigger value="Одобрена" icon={<CheckCircle className="w-4 h-4" />} label="Одобрены" isActive={activeTab === "Одобрена"} />
              <AnimatedTabsTrigger value="Отменена" icon={<XCircle className="w-4 h-4" />} label="Отменены" isActive={activeTab === "Отменена"} />
              <AnimatedTabsTrigger value="Истекла" icon={<Clock className="w-4 h-4" />} label="Истекшие" isActive={activeTab === "Истекла"} />
              <AnimatedTabsTrigger value="Выдана" icon={<ArrowRight className="w-4 h-4" />} label="Выданы" isActive={activeTab === "Выдана"} />
              <AnimatedTabsTrigger value="Возвращена" icon={<CheckCircle className="w-4 h-4" />} label="Возвращены" isActive={activeTab === "Возвращена"} />
              <AnimatedTabsTrigger value="Просрочена" icon={<XCircle className="w-4 h-4" />} label="Просроченные" isActive={activeTab === "Просрочена"} />
              <AnimatedTabsTrigger value="Отменена_пользователем" icon={<XCircle className="w-4 h-4" />} label="Отменены пользователем" isActive={activeTab === "Отменена_пользователем"} />
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <AnimatePresence>
                {loading ? <div className="flex justify-center items-center py-12">
                    <motion.div animate={{
                  rotate: 360
                }} transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear"
                }} className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
                  </div> : filteredReservations.length === 0 ? <motion.div initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg">
                    Резервирования не найдены
                  </motion.div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReservations.map(reservation => <motion.div key={reservation.id} className={`bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-300 ${getCardGradient(reservation.status)}`} whileHover={{
                  y: -5,
                  boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.05)"
                }} whileTap={{
                  scale: 0.98
                }} initial={{
                  opacity: 0,
                  y: 20
                }} animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 0.1
                  }
                }} layout>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(reservation.status)}
                            <StatusBadge status={reservation.status} />
                          </div>
                          <span className="text-sm text-gray-500">
                            {reservation.id.split('-')[0].toUpperCase()}
                          </span>
                        </div>

                        <div className="flex gap-4 mb-3">
                          {reservation.book?.cover && <div className="flex-shrink-0 w-16 h-24 relative rounded-md overflow-hidden">
                              <Image src={reservation.book.cover} alt={reservation.book?.title || "Книга"} fill style={{
                        objectFit: "cover"
                      }} className="rounded-md" />
                            </div>}
                          
                          <div className="flex-grow">
                            <h3 className="text-lg font-bold mb-2 text-gray-800 line-clamp-2">
                              {reservation.book?.title || "Книга не указана"}
                            </h3>
                            <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                              Автор: {reservation.book?.authors || "Не указан"}
                            </p>
                            <BookUnavailableWarning 
                              reservation={reservation} 
                              expectedAvailableDate={bookAvailabilityDates[reservation.bookId] || null}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500">Читатель:</span>
                            <span className="text-gray-800 line-clamp-1">
                              {reservation.user?.fullName || "Не указан"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500">Дата:</span>
                            <span className="text-gray-800">
                              {formatDate(reservation.reservationDate)}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 gap-2">
                          <div className="flex gap-2">
                            {reservation.status !== "Одобрена" && (
                              <motion.button 
                                onClick={() => handleStatusChange(reservation.id, "Одобрена")} 
                                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed" 
                                disabled={reservation.book?.availableCopies === 0}
                                whileHover={{ y: -2 }} 
                                whileTap={{ scale: 0.95 }}
                                title={reservation.book?.availableCopies === 0 ? "Нет доступных экземпляров" : "Одобрить резервирование"}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </motion.button>
                            )}
                            {reservation.status !== "Отменена" && <motion.button onClick={() => handleStatusChange(reservation.id, "Отменена")} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md" whileHover={{
                        y: -2
                      }} whileTap={{
                        scale: 0.95
                      }}>
                                <XCircle className="w-4 h-4" />
                              </motion.button>}
                            <motion.button onClick={() => handleDelete(reservation.id)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md" whileHover={{
                        y: -2
                      }} whileTap={{
                        scale: 0.95
                      }}>
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                          <Link href={`/admin/reservations/${reservation.id}`}>
                            <motion.button className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center gap-2" whileHover={{
                        y: -2
                      }} whileTap={{
                        scale: 0.95
                      }}>
                              <span className="text-sm font-medium text-white">Подробнее</span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </Link>
                        </div>
                      </motion.div>)}
                  </div>}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </FadeInView>
      </div>
    </div>;
}