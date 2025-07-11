'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Clock, CheckCircle, XCircle, AlertCircle, BarChart3, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import type { DateRange } from "react-day-picker";
import EventStatistics from './EventStatistics';

// Интерфейсы
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

interface EventCalendarProps {
  events: CalendarEvent[];
  selectedRange?: DateRange;
  onRangeChange?: (range: DateRange | undefined) => void;
  showStatsModal?: boolean;
  onToggleStatsModal?: () => void;
  quickRanges?: Array<{
    label: string;
    getRange: () => DateRange;
  }>;
}

// Улучшенный компонент статуса
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Обрабатывается":
        return { 
          color: "bg-blue-500", 
          label: "В обработке",
          icon: <Clock className="w-3 h-3" />
        };
      case "Одобрена":
        return { 
          color: "bg-green-500", 
          label: "Одобрена",
          icon: <CheckCircle className="w-3 h-3" />
        };
      case "Отменена":
        return { 
          color: "bg-red-500", 
          label: "Отменена",
          icon: <XCircle className="w-3 h-3" />
        };
      case "Истекла":
        return { 
          color: "bg-orange-500", 
          label: "Истекла",
          icon: <AlertCircle className="w-3 h-3" />
        };
      case "Выдана":
        return { 
          color: "bg-blue-700", 
          label: "Выдана",
          icon: <CheckCircle className="w-3 h-3" />
        };
      case "Возвращена":
        return { 
          color: "bg-green-600", 
          label: "Возвращена",
          icon: <CheckCircle className="w-3 h-3" />
        };
      case "Просрочена":
        return { 
          color: "bg-red-600", 
          label: "Просрочена",
          icon: <XCircle className="w-3 h-3" />
        };
      case "Отменена_пользователем":
        return { 
          color: "bg-gray-600", 
          label: "Отменена пользователем",
          icon: <XCircle className="w-3 h-3" />
        };
      default:
        return { 
          color: "bg-gray-500", 
          label: "Неизвестно",
          icon: <AlertCircle className="w-3 h-3" />
        };
    }
  };

  const { color, label, icon } = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white rounded-full ${color} shadow`}>
      {icon}
      {label}
    </span>
  );
};

// Вспомогательная функция для нормализации дат
const normalizeDate = (date: string | Date): Date => {
  const eventDate = new Date(date);
  // Возвращаем дату в локальной временной зоне без времени
  return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
};

// Главный компонент календаря
export default function EventCalendar({
  events,
  selectedRange,
  onRangeChange,
  showStatsModal = false,
  onToggleStatsModal,
  quickRanges = []
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [showQuickRanges, setShowQuickRanges] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>();
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  // Получение событий для конкретного дня
  const getEventsForDay = useCallback((date: Date) => {
    const dayStr = date.toISOString().split("T")[0];
    return events.filter(event => {
      const normalizedEventDate = normalizeDate(event.reservationDate);
      const eventDateStr = normalizedEventDate.toISOString().split("T")[0];
      return eventDateStr === dayStr;
    });
  }, [events]);

  // Генерация дней календаря
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Предыдущий месяц (серые даты)
    const prevMonth = new Date(year, month - 1, 0);
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i + 1);
      const dayEvents = getEventsForDay(date);
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: false,
        isPrevMonth: true,
        isNextMonth: false,
        events: dayEvents,
        eventCount: dayEvents.length
      });
    }
    
    // Текущий месяц
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDay(date);
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isPrevMonth: false,
        isNextMonth: false,
        events: dayEvents,
        eventCount: dayEvents.length
      });
    }
    
    // Следующий месяц
    const remainingDays = 42 - days.length; // 6 недель * 7 дней
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dayEvents = getEventsForDay(date);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true,
        events: dayEvents,
        eventCount: dayEvents.length
      });
    }
    
    return days;
  }, [currentDate, getEventsForDay]);

  // Навигация по месяцам
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Обработка выбора быстрого диапазона
  const handleQuickRangeSelect = (range: DateRange) => {
    onRangeChange?.(range);
    setShowQuickRanges(false);
    // Автоматически открываем статистику
    setTimeout(() => {
      onToggleStatsModal?.();
    }, 100);
  };

  // Обработка начала выбора диапазона (mouse down)
  const handleMouseDown = (dayData: any) => {
    setIsSelecting(true);
    const clickedDate = dayData.date;
    setTempRange({ from: clickedDate, to: undefined });
    
    // Очищаем предыдущий таймаут
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }
  };

  // Обработка движения мыши при выборе
  const handleMouseEnter = (dayData: any) => {
    if (isSelecting && tempRange?.from) {
      const hoveredDate = dayData.date;
      if (hoveredDate >= tempRange.from) {
        setTempRange({ from: tempRange.from, to: hoveredDate });
      } else {
        setTempRange({ from: hoveredDate, to: tempRange.from });
      }
    }
    setHoveredDay(calendarDays.findIndex(d => d.date.getTime() === dayData.date.getTime()));
  };

  // Обработка окончания выбора диапазона (mouse up)
  const handleMouseUp = () => {
    if (isSelecting && tempRange) {
      onRangeChange?.(tempRange);
      
      // Автоматически открываем статистику через короткий промежуток
      selectionTimeoutRef.current = setTimeout(() => {
        onToggleStatsModal?.();
      }, 300);
    }
    setIsSelecting(false);
    setTempRange(undefined);
  };

  // Обработка двойного клика
  const handleDoubleClick = (dayData: any) => {
    const clickedDate = dayData.date;
    onRangeChange?.({ from: clickedDate, to: clickedDate });
    
    // Очищаем таймаут автооткрытия
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }
    
    // Немедленно открываем статистику
    setTimeout(() => {
      onToggleStatsModal?.();
    }, 100);
  };

  // Проверка, находится ли день в выбранном диапазоне
  const isDayInRange = (date: Date) => {
    const rangeToCheck = tempRange || selectedRange;
    if (!rangeToCheck?.from) return false;
    if (!rangeToCheck.to) return date.toDateString() === rangeToCheck.from.toDateString();
    
    return date >= rangeToCheck.from && date <= rangeToCheck.to;
  };

  const isDayRangeStart = (date: Date) => {
    const rangeToCheck = tempRange || selectedRange;
    return rangeToCheck?.from && date.toDateString() === rangeToCheck.from.toDateString();
  };

  const isDayRangeEnd = (date: Date) => {
    const rangeToCheck = tempRange || selectedRange;
    return rangeToCheck?.to && date.toDateString() === rangeToCheck.to.toDateString();
  };

  // Фильтрованные события для статистики
  const filteredEvents = useMemo(() => {
    if (!selectedRange?.from || !selectedRange?.to) return [];
    
    const fromDate = normalizeDate(selectedRange.from);
    const toDate = normalizeDate(selectedRange.to);
    
    return events.filter(event => {
      const normalizedEventDate = normalizeDate(event.reservationDate);
      return normalizedEventDate >= fromDate && normalizedEventDate <= toDate;
    });
  }, [events, selectedRange]);

  // Ближайшие события (следующие 3)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => {
        const normalizedEventDate = normalizeDate(event.reservationDate);
        return normalizedEventDate >= today;
      })
      .sort((a, b) => {
        const dateA = new Date(a.reservationDate);
        const dateB = new Date(b.reservationDate);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3);
  }, [events]);

  return (
    <div className="flex flex-col h-full">
      {/* Календарь */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-blue-500 p-4 flex-1">
        {/* Заголовок календаря с быстрыми диапазонами */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              {currentDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
            </h3>
            
            {/* Выпадающий список быстрых диапазонов */}
            {quickRanges.length > 0 && (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowQuickRanges(!showQuickRanges)}
                  className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm"
                >
                  Быстрый выбор
                  <ChevronDown className={`w-4 h-4 transition-transform ${showQuickRanges ? 'rotate-180' : ''}`} />
                </motion.button>
                
                <AnimatePresence>
                  {showQuickRanges && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-10 min-w-[200px]"
                    >
                      {quickRanges.map((range, idx) => (
                        <button
                          key={range.label}
                          onClick={() => handleQuickRangeSelect(range.getRange())}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 text-gray-800 font-medium transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0"
                        >
                          {range.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToPrevMonth}
              className="p-2 rounded-full bg-blue-500 hover:bg-blue-700 text-white shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToNextMonth}
              className="p-2 rounded-full bg-blue-500 hover:bg-blue-700 text-white shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Заголовки дней недели */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Дни календаря */}
        <div 
          className="grid grid-cols-7 gap-1 select-none"
          onMouseLeave={() => {
            if (isSelecting) {
              handleMouseUp();
            }
            setHoveredDay(null);
          }}
        >
          {calendarDays.map((dayData, index) => {
            const isToday = dayData.date.toDateString() === new Date().toDateString();
            const inRange = isDayInRange(dayData.date);
            const isRangeStart = isDayRangeStart(dayData.date);
            const isRangeEnd = isDayRangeEnd(dayData.date);
            const isHovered = hoveredDay === index;

            return (
              <motion.div
                key={`${dayData.date.getTime()}-${index}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative p-2 min-h-[40px] cursor-pointer rounded-lg transition-all duration-200 text-center
                  ${dayData.isCurrentMonth 
                    ? 'text-gray-800 hover:bg-blue-100' 
                    : 'text-gray-400 hover:bg-gray-100'
                  }
                  ${isToday ? 'bg-blue-50 border-2 border-blue-300' : ''}
                  ${inRange ? 'bg-blue-200' : ''}
                  ${isRangeStart ? 'bg-blue-500 text-white rounded-l-lg' : ''}
                  ${isRangeEnd ? 'bg-blue-500 text-white rounded-r-lg' : ''}
                  ${isHovered ? 'shadow-md' : ''}
                  ${isSelecting ? 'cursor-crosshair' : ''}
                `}
                onMouseDown={() => handleMouseDown(dayData)}
                onMouseEnter={() => handleMouseEnter(dayData)}
                onMouseUp={handleMouseUp}
                onDoubleClick={() => handleDoubleClick(dayData)}
              >
                <div className="relative">
                  <span className={`text-sm font-medium ${isRangeStart || isRangeEnd ? 'text-white' : ''}`}>
                    {dayData.day}
                  </span>
                  
                  {/* Счетчик событий */}
                  {dayData.eventCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg"
                    >
                      {dayData.eventCount}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Ближайшие события */}
        <div className="mt-6">
          <h4 className="text-gray-800 text-lg font-semibold mb-3">Ближайшие события</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <div 
                  key={event.id} 
                  className="p-3 bg-gray-100 rounded-lg shadow text-gray-800 flex flex-col border border-blue-300"
                >
                  <span className="text-sm font-bold">{formatDate(event.reservationDate)}</span>
                  <span className="text-base">{event.bookTitle}</span>
                  <span className="text-sm">{event.userName}</span>
                  <div className="mt-1">
                    <StatusBadge status={event.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Нет ближайших событий</p>
            )}
          </div>
        </div>

        {/* Кнопка просмотра статистики */}
        {selectedRange?.from && selectedRange?.to && (
          <div className="mt-4 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onToggleStatsModal}
              className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-xl px-6 py-3 flex items-center gap-2 shadow-lg"
            >
              <BarChart3 className="w-4 h-4" />
              Статистика за период ({filteredEvents.length} событий)
            </motion.button>
          </div>
        )}
      </div>

      {/* Модальное окно статистики */}
      <AnimatePresence>
        {showStatsModal && selectedRange?.from && selectedRange?.to && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onToggleStatsModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl border-2 border-blue-500 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  События с {selectedRange.from.toLocaleDateString("ru-RU")} по {selectedRange.to.toLocaleDateString("ru-RU")}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "#93C5FD" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleStatsModal}
                  className="p-2 rounded-full hover:bg-blue-300 text-blue-500 shadow-sm"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <EventStatistics 
                events={filteredEvents}
                dateRange={selectedRange?.from && selectedRange?.to ? {
                  from: selectedRange.from,
                  to: selectedRange.to
                } : undefined}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 