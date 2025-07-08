'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, Calendar, X, AlertCircle, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface QueueReservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes: string;
  user?: {
    fullName: string;
  };
}

interface QueueDisplayProps {
  bookId: string;
  bookTitle?: string;
  showControls?: boolean; // Показывать ли кнопки управления (для админа)
  onQueueUpdate?: () => void; // Коллбек при изменении очереди
  maxVisibleItems?: number; // Максимальное количество видимых элементов
  showUserNames?: boolean; // Показывать ли имена пользователей (по умолчанию true для админов)
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({
  bookId,
  bookTitle = "эту книгу",
  showControls = false,
  onQueueUpdate,
  maxVisibleItems = 5,
  showUserNames = true
}) => {
  const { toast } = useToast();
  const [queue, setQueue] = useState<QueueReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    fetchQueue();
  }, [bookId]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${baseUrl}/api/Queue/book/${bookId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setQueue([]);
          return;
        }
        throw new Error("Ошибка при загрузке очереди");
      }
      
      const queueData = await response.json();
      setQueue(queueData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при загрузке очереди");
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string, userName: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/Queue/${reservationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error("Ошибка при отмене резервирования");
      }
      
      // Обновляем локальное состояние
      setQueue(prev => prev.filter(item => item.id !== reservationId));
      
      // Уведомляем родительский компонент
      if (onQueueUpdate) {
        onQueueUpdate();
      }
      
      toast({
        title: "Резервирование отменено",
        description: `Резервирование пользователя ${userName} удалено из очереди`,
        variant: "default",
      });
    } catch (err) {
      console.error("Ошибка при отмене резервирования:", err);
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при отмене резервирования",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getEstimatedAvailableDate = (position: number) => {
    // Предполагаем средний срок выдачи 14 дней
    const averageLoanDays = 14;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + (position * averageLoanDays));
    return estimatedDate;
  };

  const displayedQueue = showAll ? queue : queue.slice(0, maxVisibleItems);
  const hasMore = queue.length > maxVisibleItems;

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-800">Очередь на книгу</h3>
        </div>
        <div className="flex justify-center py-4">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Ошибка загрузки очереди</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchQueue}
          className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
        >
          Повторить попытку
        </Button>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-medium">Очередь на книгу</h3>
        </div>
        <p className="text-sm text-green-600 mt-1">
          Очередь пуста. Книга доступна для резервирования!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-medium text-orange-800">
            Очередь на {bookTitle}
          </h3>
        </div>
        <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
          {queue.length} {queue.length === 1 ? 'человек' : queue.length < 5 ? 'человека' : 'человек'}
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {displayedQueue.map((reservation, index) => (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-3 border border-orange-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-grow">
                                         <div className="flex items-center gap-2 mb-1">
                       <User className="h-4 w-4 text-gray-500" />
                       <span className="font-medium text-gray-800">
                         {showUserNames ? 
                           (reservation.user?.fullName || "Неизвестный пользователь") : 
                           `Пользователь ${index + 1}`
                         }
                       </span>
                     </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Подано: {formatDate(reservation.reservationDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Ожидается: {formatDate(getEstimatedAvailableDate(index + 1).toISOString())}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {showControls && (
                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelReservation(reservation.id, reservation.user?.fullName || "Неизвестный")}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {index === 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <ArrowRight className="h-4 w-4" />
                    <span className="font-medium">Следующий в очереди</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-3 text-orange-700 border-orange-300 hover:bg-orange-100"
          >
            {showAll ? `Скрыть ${queue.length - maxVisibleItems} элементов` : `Показать еще ${queue.length - maxVisibleItems} человек`}
          </Button>
        )}
      </div>

      <div className="mt-4 text-xs text-orange-600">
        💡 Время ожидания рассчитывается приблизительно на основе среднего срока выдачи книг (14 дней)
      </div>
    </div>
  );
};

export default QueueDisplay; 