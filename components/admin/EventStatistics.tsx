'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, Users, BookOpen } from 'lucide-react';

// Вспомогательная функция для нормализации дат
const normalizeDate = (date: string | Date): Date => {
  const eventDate = new Date(date);
  // Возвращаем дату в локальной временной зоне без времени
  return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
};

interface CalendarEvent {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
  userName?: string;
  bookTitle?: string;
}

interface EventStatisticsProps {
  events: CalendarEvent[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

const EventStatistics: React.FC<EventStatisticsProps> = ({ events, dateRange }) => {
  // Группировка по статусам
  const statusStats = useMemo(() => {
    const stats = events.reduce((acc, event) => {
      const status = event.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { status: 'Обрабатывается', count: stats['Обрабатывается'] || 0, color: 'bg-blue-500', icon: <Clock className="w-4 h-4" /> },
      { status: 'Одобрена', count: stats['Одобрена'] || 0, color: 'bg-green-500', icon: <CheckCircle className="w-4 h-4" /> },
      { status: 'Выдана', count: stats['Выдана'] || 0, color: 'bg-blue-700', icon: <CheckCircle className="w-4 h-4" /> },
      { status: 'Возвращена', count: stats['Возвращена'] || 0, color: 'bg-green-600', icon: <CheckCircle className="w-4 h-4" /> },
      { status: 'Отменена', count: stats['Отменена'] || 0, color: 'bg-red-500', icon: <XCircle className="w-4 h-4" /> },
      { status: 'Истекла', count: stats['Истекла'] || 0, color: 'bg-orange-500', icon: <AlertCircle className="w-4 h-4" /> },
      { status: 'Просрочена', count: stats['Просрочена'] || 0, color: 'bg-red-600', icon: <XCircle className="w-4 h-4" /> },
    ].filter(item => item.count > 0);
  }, [events]);

  // Топ книг
  const topBooks = useMemo(() => {
    const bookStats = events.reduce((acc, event) => {
      const title = event.bookTitle || 'Неизвестная книга';
      acc[title] = (acc[title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(bookStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([title, count]) => ({ title, count }));
  }, [events]);

  // Топ пользователей
  const topUsers = useMemo(() => {
    const userStats = events.reduce((acc, event) => {
      const name = event.userName || 'Неизвестный пользователь';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(userStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [events]);

  // Активность по дням
  const dailyActivity = useMemo(() => {
    const dailyStats = events.reduce((acc, event) => {
      const normalizedEventDate = normalizeDate(event.reservationDate);
      const dateStr = normalizedEventDate.toISOString().split('T')[0];
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ 
        date: new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
        count 
      }));
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Нет данных для отображения статистики</p>
        {dateRange && (
          <p className="text-sm mt-2">
            Период: {dateRange.from.toLocaleDateString('ru-RU')} - {dateRange.to.toLocaleDateString('ru-RU')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Информация о периоде */}
      {dateRange && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-blue-800 text-sm font-medium text-center">
            Анализ событий с {dateRange.from.toLocaleDateString('ru-RU')} по {dateRange.to.toLocaleDateString('ru-RU')}
          </p>
        </div>
      )}

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Всего событий</h3>
              <p className="text-2xl font-bold text-blue-700">{events.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Уникальные книги</h3>
              <p className="text-2xl font-bold text-green-700">{topBooks.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Пользователи</h3>
              <p className="text-2xl font-bold text-purple-700">{topUsers.length}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Статистика по статусам */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Распределение по статусам
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {statusStats.map((stat, index) => (
            <motion.div
              key={stat.status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div className={`${stat.color} text-white p-1 rounded`}>
                  {stat.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{stat.status}</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stat.count}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Топ книги и пользователи */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ книги */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Популярные книги
          </h3>
          <div className="space-y-3">
            {topBooks.length > 0 ? (
              topBooks.map((book, index) => (
                <motion.div
                  key={book.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                      {book.title}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{book.count}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Нет данных о книгах</p>
            )}
          </div>
        </div>

        {/* Топ пользователи */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Активные пользователи
          </h3>
          <div className="space-y-3">
            {topUsers.length > 0 ? (
              topUsers.map((user, index) => (
                <motion.div
                  key={user.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                      {user.name}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{user.count}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Нет данных о пользователях</p>
            )}
          </div>
        </div>
      </div>

      {/* Активность по дням */}
      {dailyActivity.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Активность по дням
          </h3>
          <div className="space-y-2">
            {dailyActivity.map((day, index) => {
              const maxCount = Math.max(...dailyActivity.map(d => d.count));
              const width = (day.count / maxCount) * 100;
              
              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-sm font-medium text-gray-600 min-w-[60px]">
                    {day.date}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 min-w-[30px] text-right">
                    {day.count}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventStatistics; 