'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, AlertTriangle, CheckCircle, X, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as UiCalendar } from '@/components/ui/calendar';
import { format, addDays } from "date-fns";
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface UserQueuePosition {
  position: number;
  reservationId: string;
  estimatedDate: string;
  totalInQueue: number;
}

interface QueuePositionProps {
  bookId: string;
  userId: string;
  bookTitle?: string;
  availableCopies?: number;
  isReserved?: boolean; // Уже есть активное резервирование
  onQueueUpdate?: () => void;
  maxReservationDays?: number;
}

const QueuePosition: React.FC<QueuePositionProps> = ({
  bookId,
  userId,
  bookTitle = "эту книгу",
  availableCopies = 0,
  isReserved = false,
  onQueueUpdate,
  maxReservationDays = 14
}) => {
  const { toast } = useToast();
  const [queuePosition, setQueuePosition] = useState<UserQueuePosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  // При изменении startDate, устанавливаем endDate по умолчанию
  useEffect(() => {
    if (startDate) {
      setEndDate(addDays(startDate, maxReservationDays - 1));
    }
  }, [startDate, maxReservationDays]);

  useEffect(() => {
    fetchUserQueuePosition();
  }, [bookId, userId]);

  const fetchUserQueuePosition = async () => {
    try {
      setLoading(true);
      
      // Получаем очередь пользователя
      const userQueueResponse = await fetch(`${baseUrl}/api/Queue/user/${userId}`);
      if (!userQueueResponse.ok) {
        if (userQueueResponse.status === 404) {
          setQueuePosition(null);
          return;
        }
        throw new Error("Ошибка при загрузке очереди пользователя");
      }
      
      const userQueue = await userQueueResponse.json();
      
      // Ищем резервирование для этой книги
      const bookReservation = Array.isArray(userQueue) 
        ? userQueue.find((r: any) => r.bookId === bookId)
        : userQueue.bookId === bookId ? userQueue : null;
      
      if (!bookReservation) {
        setQueuePosition(null);
        return;
      }
      
      // Получаем полную очередь на книгу для определения позиции
      const bookQueueResponse = await fetch(`${baseUrl}/api/Queue/book/${bookId}`);
      if (!bookQueueResponse.ok) {
        throw new Error("Ошибка при загрузке очереди на книгу");
      }
      
      const bookQueue = await bookQueueResponse.json();
      const position = bookQueue.findIndex((r: any) => r.id === bookReservation.id) + 1;
      
      if (position > 0) {
        const averageLoanDays = 14;
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + (position * averageLoanDays));
        
        setQueuePosition({
          position,
          reservationId: bookReservation.id,
          estimatedDate: estimatedDate.toISOString(),
          totalInQueue: bookQueue.length
        });
      }
      
    } catch (err) {
      console.error("Ошибка при загрузке позиции в очереди:", err);
      setQueuePosition(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Ошибка",
        description: "Необходимо выбрать начальную и конечную дату бронирования.",
        variant: "destructive"
      });
      return;
    }

    try {
      const reservationData = {
        userId,
        bookId,
        reservationDate: startDate.toISOString(),
        expirationDate: endDate.toISOString(),
        status: "Обрабатывается",
        notes: "В очереди - автоматическое резервирование при недоступности книги"
      };

      const response = await fetch(`${baseUrl}/api/Reservation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reservationData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Не удалось встать в очередь");
      }

      await fetchUserQueuePosition(); // Обновляем позицию
      
      if (onQueueUpdate) {
        onQueueUpdate();
      }

      toast({
        title: "Вы в очереди!",
        description: `Вы добавлены в очередь на "${bookTitle}". Мы уведомим вас, когда книга станет доступна.`,
        variant: "default",
      });

      setShowJoinModal(false);
    } catch (err) {
      console.error("Ошибка при постановке в очередь:", err);
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось встать в очередь",
        variant: "destructive",
      });
    }
  };

  const handleLeaveQueue = async () => {
    if (!queuePosition) return;

    try {
      const response = await fetch(`${baseUrl}/api/Queue/${queuePosition.reservationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error("Ошибка при выходе из очереди");
      }

      setQueuePosition(null);
      
      if (onQueueUpdate) {
        onQueueUpdate();
      }

      toast({
        title: "Вы покинули очередь",
        description: `Ваше резервирование на "${bookTitle}" отменено.`,
        variant: "default",
      });

    } catch (err) {
      console.error("Ошибка при выходе из очереди:", err);
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось покинуть очередь",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-center">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"
          />
        </div>
      </div>
    );
  }

  // Если книга доступна и пользователь не зарезервировал
  if (availableCopies > 0 && !isReserved && !queuePosition) {
    return null; // Не показываем компонент, если книга доступна
  }

  // Если пользователь уже в очереди
  if (queuePosition) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-orange-50 rounded-lg p-4 border border-orange-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-medium text-orange-800">
              Ваша позиция в очереди
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveQueue}
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <X className="h-4 w-4 mr-1" />
            Покинуть очередь
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                {queuePosition.position}
              </div>
              <span className="text-sm font-medium text-gray-800">Позиция</span>
            </div>
            <p className="text-xs text-gray-600">
              из {queuePosition.totalInQueue} в очереди
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">Ожидается</span>
            </div>
            <p className="text-xs text-gray-600">
              {formatDate(queuePosition.estimatedDate)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-800">Статус</span>
            </div>
            <p className="text-xs text-green-600 font-medium">
              {queuePosition.position === 1 ? "Следующий!" : "В ожидании"}
            </p>
          </div>
        </div>

        {queuePosition.position === 1 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <ArrowRight className="h-4 w-4" />
              <span className="text-sm font-medium">
                Вы следующий в очереди! Мы уведомим вас, как только книга станет доступна.
              </span>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-orange-600">
          💡 Время ожидания рассчитывается приблизительно. Мы уведомим вас, когда книга станет доступна.
        </div>
      </motion.div>
    );
  }

  // Если книга недоступна и пользователь не в очереди
  if (availableCopies === 0 && !isReserved) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 rounded-lg p-4 border border-red-200"
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-medium text-red-800">
            Книга недоступна
          </h3>
        </div>

        <p className="text-sm text-red-700 mb-4">
          Все экземпляры книги "{bookTitle}" в настоящее время заняты. 
          Вы можете встать в очередь и получить уведомление, когда книга станет доступна.
        </p>

        <Button
          onClick={() => setShowJoinModal(true)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Users className="h-4 w-4 mr-2" />
          Встать в очередь
        </Button>

        {/* Модальное окно для постановки в очередь */}
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Встать в очередь</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowJoinModal(false)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500">Вы встаете в очередь на книгу:</p>
                <p className="text-lg font-medium text-gray-800">{bookTitle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Желаемая дата начала:
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP', { locale: ru }) : <span>Выберите дату</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <UiCalendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={[{ before: new Date() }, { dayOfWeek: [0, 6] }]}
                        initialFocus
                        locale={ru}
                        weekStartsOn={1}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Желаемая дата окончания:
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                        disabled={!startDate}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP', { locale: ru }) : <span>Выберите дату</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <UiCalendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={[
                          { before: startDate || new Date() },
                          { after: startDate ? addDays(startDate, maxReservationDays - 1) : new Date() },
                          { dayOfWeek: [0, 6] }
                        ]}
                        initialFocus
                        locale={ru}
                        weekStartsOn={1}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    Мы уведомим вас, как только книга станет доступна для резервирования.
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowJoinModal(false)}
                  className="border-gray-100 text-gray-800 hover:bg-gray-100"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleJoinQueue}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Встать в очередь
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return null;
};

export default QueuePosition; 