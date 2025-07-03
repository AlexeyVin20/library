'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, CheckCircle, XCircle, Clock, ArrowRight, Filter, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import Image from "next/image";
import Filters, { Filter as FilterType, FilterType as FilterTypeEnum, FilterOperator, Status, Priority } from "@/components/ui/filters";
import { CreateReservationDialog } from "@/components/ui/reservation-creation-modal";
import type { Reservation as ReservationType, ReservationDto } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

// Расширенный интерфейс для работы с резервированиями на странице
interface Reservation extends Omit<ReservationDto, 'book'> {
  originalStatus?: string; // Оригинальный статус для операций
  book?: {
    id?: string;
    title: string;
    authors?: string;
    isbn?: string;
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
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookAvailabilityDates, setBookAvailabilityDates] = useState<{[bookId: string]: Date}>({});
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    fetchReservations();
  }, []);

  // Функция для определения приоритетного статуса с учетом просрочки
  const getDisplayStatus = (reservation: Reservation) => {
    const now = new Date();
    const expirationDate = new Date(reservation.expirationDate);
    
    // Если срок истек, приоритет у просроченных статусов
    if (expirationDate < now) {
      // Если книга была выдана и просрочена
      if ((reservation.originalStatus || reservation.status) === 'Выдана') {
        return 'Просрочена';
      }
      // Если резервирование не было выдано и срок истек
      if ((reservation.originalStatus || reservation.status) === 'Обрабатывается' || 
          (reservation.originalStatus || reservation.status) === 'Одобрена') {
        return 'Истекла';
      }
      // Для уже завершенных статусов (Возвращена, Отменена и т.д.) оставляем как есть
    }
    
    return reservation.originalStatus || reservation.status;
  };

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
      const displayedReservations = enrichedReservations.map(r => ({
        ...r,
        status: getDisplayStatus(r),
        originalStatus: r.status // Сохраняем оригинальный статус для операций
      }));
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

  // Функция для правильного форматирования дат для PostgreSQL
  const formatDateForPostgres = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString();
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
      
      // Backend теперь сам управляет назначением и освобождением экземпляров
      
      // Используем оригинальный статус для отправки на сервер, но обновляем его
      const updatedReservation = {
        ...reservation,
        reservationDate: new Date(reservation.reservationDate).toISOString(),
        expirationDate: new Date(reservation.expirationDate).toISOString(),
        actualReturnDate: reservation.actualReturnDate ? new Date(reservation.actualReturnDate).toISOString() : null,
        status: newStatus
      };
      
      // Удаляем поля, которые не нужны для API
      delete updatedReservation.originalStatus;
      delete updatedReservation.user;
      delete updatedReservation.book;
      delete updatedReservation.bookInstance;
      
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
      
      // Обновляем локальное состояние с пересчетом отображаемого статуса
      setReservations(reservations.map(r => {
        if (r.id === id) {
          const updatedReservation = { ...r, originalStatus: newStatus };
          return {
            ...updatedReservation,
            status: getDisplayStatus({ ...updatedReservation, status: newStatus })
          };
        }
        return r;
      }));
      
      // Отправляем событие для обновления других компонентов
      window.dispatchEvent(new CustomEvent('instanceStatusUpdate'));
      
      // Показываем уведомление об успехе  
      toast({
        title: "Статус обновлен",
        description: `Статус резервирования изменен на "${newStatus}"`,
        variant: "default",
      });
      
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err);
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при обновлении статуса",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/Reservation/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Ошибка при удалении резервирования");
      setReservations(reservations.filter(r => r.id !== id));
      toast({
        title: "Успешно",
        description: "Резервирование удалено",
        variant: "default",
      });
    } catch (err) {
      console.error("Ошибка при удалении резервирования:", err);
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при удалении резервирования",
        variant: "destructive",
      });
    }
  };

  const handleCreateReservation = async (reservationData: any) => {
    try {
      const response = await fetch(`${baseUrl}/api/Reservation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reservationData)
      });
      
      if (!response.ok) throw new Error("Ошибка при создании резервирования");
      
      // Обновляем список резервирований
      await fetchReservations();
      toast({
        title: "Успешно",
        description: "Резервирование создано",
        variant: "default",
      });
    } catch (error) {
      console.error("Ошибка при создании резервирования:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать резервирование",
        variant: "destructive",
      });
      throw error; // Пробрасываем ошибку для обработки в модальном окне
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

  // Добавляем фильтр по датам
  const addDateFilter = (type: FilterTypeEnum, period: string) => {
    setFilters(prev => {
      // Ищем существующий фильтр этого типа
      const existingFilterIndex = prev.findIndex(f => f.type === type);
      
      if (existingFilterIndex !== -1) {
        // Если фильтр уже существует, добавляем значение к существующему
        const updatedFilters = [...prev];
        const existingFilter = updatedFilters[existingFilterIndex];
        if (!existingFilter.value.includes(period)) {
          updatedFilters[existingFilterIndex] = {
            ...existingFilter,
            value: [...existingFilter.value, period],
            operator: existingFilter.value.length > 0 ? FilterOperator.IS_ANY_OF : FilterOperator.IS
          };
        }
        return updatedFilters;
      } else {
        // Создаем новый фильтр
        const filterId = `${type}-${Date.now()}`;
        const newFilter: FilterType = {
          id: filterId,
          type: type,
          operator: FilterOperator.IS,
          value: [period]
        };
        return [...prev, newFilter];
      }
    });
    setShowFilters(true);
  };

  // Добавляем фильтр по статусу
  const addStatusFilter = (status: string) => {
    setFilters(prev => {
      // Ищем существующий фильтр статуса
      const existingFilterIndex = prev.findIndex(f => f.type === FilterTypeEnum.STATUS);
      
      if (existingFilterIndex !== -1) {
        // Если фильтр уже существует, добавляем статус к существующему
        const updatedFilters = [...prev];
        const existingFilter = updatedFilters[existingFilterIndex];
        if (!existingFilter.value.includes(status)) {
          updatedFilters[existingFilterIndex] = {
            ...existingFilter,
            value: [...existingFilter.value, status],
            operator: existingFilter.value.length > 0 ? FilterOperator.IS_ANY_OF : FilterOperator.IS
          };
        }
        return updatedFilters;
      } else {
        // Создаем новый фильтр
        const filterId = `status-${Date.now()}`;
        const newFilter: FilterType = {
          id: filterId,
          type: FilterTypeEnum.STATUS,
          operator: FilterOperator.IS,
          value: [status]
        };
        return [...prev, newFilter];
      }
    });
    setShowFilters(true);
  };

  // Функция применения фильтров
  const applyFilters = (reservations: Reservation[]) => {
    let filtered = reservations;

    filters.forEach(filter => {
      switch (filter.type) {
        case FilterTypeEnum.STATUS:
          if (filter.operator === FilterOperator.IS || filter.operator === FilterOperator.IS_ANY_OF) {
            filtered = filtered.filter(r => filter.value.includes(r.status));
          } else if (filter.operator === FilterOperator.IS_NOT) {
            filtered = filtered.filter(r => !filter.value.includes(r.status));
          }
          break;
        
        case FilterTypeEnum.CREATED_DATE:
        case FilterTypeEnum.UPDATED_DATE:
        case FilterTypeEnum.DUE_DATE:
          const now = new Date();
          
          // Создаем массив резервирований, которые соответствуют хотя бы одному из периодов
          const matchingReservations = new Set<string>();
          
          filter.value.forEach(period => {
            let startDate = new Date();
            let endDate = new Date();
            
            switch (period) {
              case "24 hours from now":
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                endDate = now;
                break;
              case "3 days from now":
                startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
              case "1 week from now":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
              case "1 month from now":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
              default:
                return;
            }

            // Для периодов "истекает в течение..." меняем логику
            if (period.includes("Истекает")) {
              startDate = now;
              if (period.includes("24 часов")) {
                endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              } else if (period.includes("3 дней")) {
                endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
              } else if (period.includes("недели")) {
                endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              } else if (period.includes("месяца")) {
                endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              }
            }

            // Добавляем подходящие резервирования в множество
            filtered.forEach(reservation => {
              let dateToCheck: Date;
              
              if (filter.type === FilterTypeEnum.CREATED_DATE) {
                dateToCheck = new Date(reservation.reservationDate);
              } else if (filter.type === FilterTypeEnum.DUE_DATE) {
                dateToCheck = new Date(reservation.expirationDate);
              } else {
                return;
              }

              if (dateToCheck >= startDate && dateToCheck <= endDate) {
                matchingReservations.add(reservation.id);
              }
            });
          });

          // Фильтруем резервирования, оставляя только те, которые есть в множестве
          if (filter.operator === FilterOperator.IS || filter.operator === FilterOperator.IS_ANY_OF) {
            filtered = filtered.filter(r => matchingReservations.has(r.id));
          }
          break;
      }
    });

    return filtered;
  };

  const filteredReservations = applyFilters(reservations);

  // Группировка резервирований по статусам с определенным порядком
  const groupReservationsByStatus = (reservations: Reservation[]) => {
    const statusOrder = ['Обрабатывается', 'Одобрена', 'Выдана', 'Возвращена', 'Отменена', 'Истекла', 'Просрочена', 'Отменена_пользователем'];
    
    const groups = statusOrder.reduce((acc, status) => {
      acc[status] = reservations.filter(r => r.status === status);
      return acc;
    }, {} as Record<string, Reservation[]>);

    // Добавляем резервирования с неизвестными статусами в конец
    const knownStatuses = new Set(statusOrder);
    const unknownReservations = reservations.filter(r => !knownStatuses.has(r.status));
    if (unknownReservations.length > 0) {
      groups['Неизвестно'] = unknownReservations;
    }

    return groups;
  };

  const groupedReservations = groupReservationsByStatus(filteredReservations);

  // Получаем названия статусов для отображения
  const getStatusDisplayName = (status: string) => {
    const statusNames: Record<string, string> = {
      'Обрабатывается': 'В обработке',
      'Одобрена': 'Одобренные',
      'Выдана': 'Выданные',
      'Возвращена': 'Возвращенные',
      'Отменена': 'Отмененные',
      'Истекла': 'Истекшие',
      'Просрочена': 'Просроченные',
      'Отменена_пользователем': 'Отменены пользователем',
      'Неизвестно': 'Неизвестные'
    };
    return statusNames[status] || status;
  };

  // Получаем иконку для заголовка группы
  const getGroupIcon = (status: string) => {
    switch (status) {
      case "Обрабатывается":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "Одобрена":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "Выдана":
        return <ArrowRight className="w-5 h-5 text-blue-700" />;
      case "Возвращена":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Отменена":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "Истекла":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "Просрочена":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "Отменена_пользователем":
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

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
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-gray-800 hover:text-gray-900"
              >
                <Filter className="h-4 w-4" />
                Фильтры
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {/* Быстрые фильтры по статусу */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 text-gray-800 hover:text-gray-900">
                    <CheckCircle className="h-4 w-4" />
                    По статусу
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0">
                  <Command>
                    <CommandInput placeholder="Поиск статуса..." />
                    <CommandList>
                      <CommandEmpty>Статус не найден</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => addStatusFilter("Обрабатывается")}>
                          <Clock className="h-4 w-4 mr-2 text-blue-500" />
                          В обработке
                        </CommandItem>
                        <CommandItem onSelect={() => addStatusFilter("Одобрена")}>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          Одобрены
                        </CommandItem>
                        <CommandItem onSelect={() => addStatusFilter("Отменена")}>
                          <XCircle className="h-4 w-4 mr-2 text-red-500" />
                          Отменены
                        </CommandItem>
                        <CommandItem onSelect={() => addStatusFilter("Истекла")}>
                          <Clock className="h-4 w-4 mr-2 text-orange-500" />
                          Истекшие
                        </CommandItem>
                        <CommandItem onSelect={() => addStatusFilter("Выдана")}>
                          <ArrowRight className="h-4 w-4 mr-2 text-blue-700" />
                          Выданы
                        </CommandItem>
                        <CommandItem onSelect={() => addStatusFilter("Возвращена")}>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Возвращены
                        </CommandItem>
                        <CommandItem onSelect={() => addStatusFilter("Просрочена")}>
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Просроченные
                        </CommandItem>
                        <CommandItem onSelect={() => addStatusFilter("Отменена_пользователем")}>
                          <XCircle className="h-4 w-4 mr-2 text-gray-600" />
                          Отменены пользователем
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Быстрые фильтры по датам */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 text-gray-800 hover:text-gray-900">
                    <Clock className="h-4 w-4" />
                    По датам
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <Command>
                    <CommandInput placeholder="Поиск периода..." />
                    <CommandList>
                      <CommandEmpty>Период не найден</CommandEmpty>
                      <CommandGroup heading="Дата создания">
                        <CommandItem onSelect={() => addDateFilter(FilterTypeEnum.CREATED_DATE, "24 hours from now")}>
                          Последние 24 часа
                        </CommandItem>
                        <CommandItem onSelect={() => addDateFilter(FilterTypeEnum.CREATED_DATE, "3 days from now")}>
                          Последние 3 дня
                        </CommandItem>
                        <CommandItem onSelect={() => addDateFilter(FilterTypeEnum.CREATED_DATE, "1 week from now")}>
                          Последняя неделя
                        </CommandItem>
                        <CommandItem onSelect={() => addDateFilter(FilterTypeEnum.CREATED_DATE, "1 month from now")}>
                          Последний месяц
                        </CommandItem>
                      </CommandGroup>
                      <CommandGroup heading="Срок действия">
                        <CommandItem onSelect={() => addDateFilter(FilterTypeEnum.DUE_DATE, "Истекает в течение 24 часов")}>
                          Истекает в течение 24 часов
                        </CommandItem>
                        <CommandItem onSelect={() => addDateFilter(FilterTypeEnum.DUE_DATE, "Истекает в течение 3 дней")}>
                          Истекает в течение 3 дней
                        </CommandItem>
                        <CommandItem onSelect={() => addDateFilter(FilterTypeEnum.DUE_DATE, "Истекает в течение недели")}>
                          Истекает в течение недели
                        </CommandItem>
                        <CommandItem onSelect={() => addDateFilter(FilterTypeEnum.DUE_DATE, "Истекает в течение месяца")}>
                          Истекает в течение месяца
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <motion.button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" 
              whileHover={{
                y: -3,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
              }} 
              whileTap={{
                scale: 0.98
              }}
            >
              <Plus className="h-4 w-4" />
              Создать резервирование
            </motion.button>
          </div>

          {/* Раздел фильтров */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Активные фильтры</h3>
                    {filters.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters([])}
                        className="text-red-600 hover:text-red-700"
                      >
                        Очистить все
                      </Button>
                    )}
                  </div>
                  
                  {filters.length > 0 ? (
                    <Filters filters={filters} setFilters={setFilters} />
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Фильтры не применены. Используйте быстрые фильтры выше или добавьте свои.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </motion.div>}

          <div className="mt-6">
              <AnimatePresence>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear"
                      }} 
                      className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full" 
                    />
                  </div>
                ) : filteredReservations.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg"
                  >
                    Резервирования не найдены
                  </motion.div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(groupedReservations).map(([status, reservations]) => {
                      if (reservations.length === 0) return null;
                      
                      return (
                        <motion.div 
                          key={status}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          {/* Заголовок группы */}
                          <div className="flex items-center gap-3 pb-2 border-b border-gray-300">
                            {getGroupIcon(status)}
                            <h2 className="text-xl font-semibold text-gray-800">
                              {getStatusDisplayName(status)}
                            </h2>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
                              {reservations.length}
                            </span>
                          </div>
                          
                          {/* Сетка резервирований */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reservations.map((reservation, index) => (
                              <motion.div 
                                key={reservation.id} 
                                className={`bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-300 ${getCardGradient(reservation.status)}`} 
                                whileHover={{
                                  y: -5,
                                  boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.05)"
                                }} 
                                whileTap={{ scale: 0.98 }} 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  transition: {
                                    delay: index * 0.05
                                  }
                                }} 
                                layout
                              >
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
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500">Срок до:</span>
                            <span className="text-gray-800">
                              {formatDate(reservation.expirationDate)}
                            </span>
                          </div>
                          {reservation.actualReturnDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-500 font-medium">Возвращено:</span>
                              <span className="text-green-600 font-medium">
                                {formatDate(reservation.actualReturnDate)}
                              </span>
                            </div>
                          )}
                          {reservation.bookInstance && (
                            <div className="border-t pt-2 mt-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-purple-500 font-medium">Экземпляр:</span>
                                <span className="text-gray-800 font-mono text-sm">
                                  {reservation.bookInstance.instanceCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-purple-500">Состояние:</span>
                                <span className="text-gray-800 text-sm">
                                  {reservation.bookInstance.condition}
                                </span>
                              </div>
                              {reservation.bookInstance.location && (
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-purple-500">Расположение:</span>
                                  <span className="text-gray-800 text-sm">
                                    {reservation.bookInstance.location}
                                  </span>
                                </div>
                              )}
                              {reservation.bookInstance.shelf && (
                                <div className="flex items-center gap-2">
                                  <span className="text-purple-500">Полка:</span>
                                  <span className="text-gray-800 text-sm">
                                    {reservation.bookInstance.shelf.category} - {reservation.bookInstance.shelf.shelfNumber}
                                    {reservation.bookInstance.position && ` (поз. ${reservation.bookInstance.position})`}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          {reservation.status === 'Просрочена' && (
                            <div className="flex items-center gap-2">
                              <span className="text-red-500 font-medium">Просрочено:</span>
                              <span className="text-red-600 font-medium">
                                {Math.ceil((new Date().getTime() - new Date(reservation.expirationDate).getTime()) / (1000 * 60 * 60 * 24))} дней
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                          {/* Основные быстрые действия */}
                          <div className="flex gap-2">
                            {/* Быстрое действие: Одобрить */}
                            {(reservation.originalStatus || reservation.status) === "Обрабатывается" && (
                              <motion.button 
                                onClick={() => handleStatusChange(reservation.id, "Одобрена")} 
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm" 
                                disabled={reservation.book?.availableCopies === 0}
                                whileHover={{ y: -2 }} 
                                whileTap={{ scale: 0.95 }}
                                title={reservation.book?.availableCopies === 0 ? "Нет доступных экземпляров" : "Одобрить резервирование"}
                              >
                                <CheckCircle className="w-4 h-4" />
                                Одобрить
                              </motion.button>
                            )}
                            
                            {/* Быстрое действие: Выдать книгу */}
                            {(reservation.originalStatus || reservation.status) === "Одобрена" && (
                              <motion.button 
                                onClick={() => handleStatusChange(reservation.id, "Выдана")} 
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm" 
                                disabled={reservation.book?.availableCopies === 0}
                                whileHover={{ y: -2 }} 
                                whileTap={{ scale: 0.95 }}
                                title="Выдать книгу (назначить экземпляр)"
                              >
                                <ArrowRight className="w-4 h-4" />
                                Выдать книгу
                              </motion.button>
                            )}
                            
                            {/* Быстрое действие: Оформить возврат */}
                            {(reservation.originalStatus || reservation.status) === "Выдана" && (
                              <motion.button 
                                onClick={() => handleStatusChange(reservation.id, "Возвращена")} 
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md flex items-center justify-center gap-2 font-medium text-sm"
                                whileHover={{ y: -2 }} 
                                whileTap={{ scale: 0.95 }}
                                title="Оформить возврат книги"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Возвращена
                              </motion.button>
                            )}
                            
                            {/* Если резервирование завершено, показываем статус */}
                            {(reservation.status === "Возвращена" || reservation.status === "Отменена" || reservation.status === "Истекла" || reservation.status === "Просрочена" || reservation.status === "Отменена_пользователем") && (
                              <div className="flex-1 bg-gray-100 text-gray-600 px-3 py-2 rounded-md flex items-center justify-center gap-2 font-medium text-sm">
                                {getStatusIcon(reservation.status)}
                                {reservation.status === "Возвращена" ? "Завершено" : 
                                 reservation.status === "Отменена" ? "Отменено" :
                                 reservation.status === "Истекла" ? "Истекло" :
                                 reservation.status === "Просрочена" ? "Просрочено" :
                                 "Отменено пользователем"}
                              </div>
                            )}
                          </div>

                          {/* Дополнительные действия */}
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex gap-2">
                              {/* Отменить (только для активных резервирований) */}
                              {(reservation.originalStatus || reservation.status) !== "Отменена" && 
                               (reservation.originalStatus || reservation.status) !== "Возвращена" && 
                               (reservation.originalStatus || reservation.status) !== "Истекла" && 
                               (reservation.originalStatus || reservation.status) !== "Просрочена" && 
                               (reservation.originalStatus || reservation.status) !== "Отменена_пользователем" && (
                                <motion.button 
                                  onClick={() => handleStatusChange(reservation.id, "Отменена")} 
                                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md" 
                                  whileHover={{ y: -2 }} 
                                  whileTap={{ scale: 0.95 }}
                                  title="Отменить резервирование"
                                >
                                  <XCircle className="w-4 h-4" />
                                </motion.button>
                              )}
                              
                              {/* Удалить */}
                              <motion.button 
                                onClick={() => handleDelete(reservation.id)} 
                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md" 
                                whileHover={{ y: -2 }} 
                                whileTap={{ scale: 0.95 }}
                                title="Удалить резервирование"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                            
                            {/* Подробнее */}
                            <Link href={`/admin/reservations/${reservation.id}`}>
                              <motion.button 
                                className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center gap-2" 
                                whileHover={{ y: -2 }} 
                                whileTap={{ scale: 0.95 }}
                              >
                                <span className="text-sm font-medium text-white">Подробнее</span>
                                <ArrowRight className="w-4 h-4" />
                              </motion.button>
                            </Link>
                            </div>
                            </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>
            </div>
        </FadeInView>

        {/* Модальное окно создания резервирования */}
        <CreateReservationDialog
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onCreateReservation={handleCreateReservation}
        />
      </div>
    </div>;
}