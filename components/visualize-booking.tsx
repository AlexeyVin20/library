'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Columns3,
  Grid,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

// Интерфейсы из EventCalendar.tsx
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

interface InteractiveCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  events?: CalendarEvent[];
}

// Улучшенный компонент статуса из EventCalendar.tsx
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

// Вспомогательная функция для нормализации дат из EventCalendar.tsx
const normalizeDate = (date: string | Date): Date => {
  const eventDate = new Date(date);
  return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
};

// Обновленный DayType
export type DayType = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
  eventCount: number;
};

// Добавляем тип для диапазона выбранных ячеек
type SelectionRange = {
  from: number;
  to: number;
};

interface DayProps {
  day: DayType;
  index: number;
  inRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  onHover: (index: number | null) => void;
  onMouseDown: (index: number) => void;
  onMouseEnter: (index: number) => void;
  onMouseUp: () => void;
}

const Day: React.FC<DayProps> = ({ day, index, inRange, isRangeStart, isRangeEnd, onHover, onMouseDown, onMouseEnter, onMouseUp }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isToday = day.date.toDateString() === new Date().toDateString();

  return (
    <motion.div
      className={`relative flex items-center justify-center py-1 cursor-pointer transition-all duration-200
        ${day.isCurrentMonth ? 'text-gray-800 hover:bg-blue-100' : 'text-gray-400 hover:bg-gray-100'}
        ${isToday ? 'bg-blue-50 border-2 border-blue-300' : ''}
        ${inRange ? 'bg-blue-200' : ''}
        ${isRangeStart || isRangeEnd ? 'bg-blue-500 text-white' : ''}
      `}
      style={{ height: '4rem', borderRadius: 16 }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover(index);
        onMouseEnter(index);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover(null);
      }}
      onMouseDown={(e) => {
        if (e.button === 0) {
          onMouseDown(index);
        }
      }}
      onMouseUp={onMouseUp}
      id={`day-${day.day}`}
    >
      <div className="flex flex-col items-center justify-center">
        <span className={`text-sm ${isRangeStart || isRangeEnd ? 'text-white' : ''}`}>
            {day.day}
        </span>
      </div>
      {day.eventCount > 0 && (
        <motion.div
          className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-red-500 p-1 text-[10px] font-bold text-white"
          layoutId={`day-${day.day}-meeting-count`}
          style={{
            borderRadius: 999,
          }}
        >
          {day.eventCount}
        </motion.div>
      )}

      <AnimatePresence>
        {day.eventCount > 0 && isHovered && (
          <div className="absolute inset-0 flex size-full items-center justify-center">
            <motion.div
              className="flex size-10 items-center justify-center bg-blue-600 p-1 text-xs font-bold text-white"
              layoutId={`day-${day.day}-meeting-count`}
              style={{
                borderRadius: 999,
              }}
            >
              {day.eventCount}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CalendarGrid: React.FC<{
  days: DayType[];
  onHover: (index: number | null) => void;
  onMouseDown: (index: number) => void;
  onMouseEnter: (index: number) => void;
  onMouseUp: () => void;
  selectedRange: SelectionRange | null;
  tempRange: SelectionRange | null;
}> = ({
  days,
  onHover,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  selectedRange,
  tempRange,
}) => {
  const effectiveRange = tempRange || selectedRange;

  const isInRange = (idx: number) => {
    if (!effectiveRange) return false;
    return idx >= effectiveRange.from && idx <= effectiveRange.to;
  };

  const isStart = (idx: number) => !!effectiveRange && idx === (effectiveRange as SelectionRange).from;
  const isEnd = (idx: number) => !!effectiveRange && idx === (effectiveRange as SelectionRange).to;

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, index) => (
        <Day
          key={`${day.date.getTime()}-${index}`}
          day={day}
          index={index}
          inRange={isInRange(index)}
          isRangeStart={isStart(index)}
          isRangeEnd={isEnd(index)}
          onHover={onHover}
          onMouseDown={onMouseDown}
          onMouseEnter={onMouseEnter}
          onMouseUp={onMouseUp}
        />
      ))}
    </div>
  );
};

const InteractiveCalendar = React.forwardRef<
  HTMLDivElement,
  InteractiveCalendarProps
>(({ className, events = [], ...props }, ref) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Состояние для выделения диапазона
  const [isSelecting, setIsSelecting] = useState(false);
  const [tempRange, setTempRange] = useState<SelectionRange | null>(null);
  const [selectedRange, setSelectedRange] = useState<SelectionRange | null>(null);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const getEventsForDay = useCallback((date: Date) => {
    const dayStr = date.toISOString().split("T")[0];
    return events.filter(event => {
      const normalizedEventDate = normalizeDate(event.reservationDate);
      const eventDateStr = normalizedEventDate.toISOString().split("T")[0];
      return eventDateStr === dayStr;
    });
  }, [events]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Предыдущий месяц (серые даты)
    const prevMonth = new Date(year, month, 0); // Correctly get last day of previous month
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i + 1);
      const dayEvents = getEventsForDay(date);
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: false,
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
        events: dayEvents,
        eventCount: dayEvents.length
      });
    }
    
    return days;
  }, [currentDate, getEventsForDay]);
  
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayMouseDown = useCallback((index: number) => {
    setIsSelecting(true);
    setTempRange({ from: index, to: index });
  }, []);

  const handleDayMouseEnter = useCallback(
    (index: number) => {
      if (isSelecting && tempRange) {
        const newRange: SelectionRange = {
          from: Math.min(tempRange.from, index),
          to: Math.max(tempRange.from, index),
        };
        setTempRange(newRange);
      }
    },
    [isSelecting, tempRange]
  );

  const handleDayMouseUp = useCallback(() => {
    if (isSelecting && tempRange) {
      setSelectedRange(tempRange);
    }
    setIsSelecting(false);
    setTempRange(null);
  }, [isSelecting, tempRange]);

  const handleDayHover = (index: number | null) => {
    setHoveredDay(index);
  };

  const displayedEvents = useMemo(() => {
    if (hoveredDay !== null && calendarDays[hoveredDay]) {
      return calendarDays[hoveredDay].events;
    }
    if (selectedRange !== null) {
      return calendarDays
        .slice(selectedRange.from, selectedRange.to + 1)
        .flatMap(d => d.events);
    }
    return [];
  }, [hoveredDay, selectedRange, calendarDays]);

  return (
    <motion.div
      ref={ref}
      className="relative mx-auto my-4 flex w-full flex-col items-start justify-center gap-8 lg:flex-row bg-white p-6 rounded-2xl shadow-lg border border-gray-200"
      {...(props as any)}
    >
      <motion.div layout className="w-full max-w-lg select-none">
        <motion.div
          key="calendar-view"
          className="flex w-full flex-col gap-4"
        >
          <div className="flex w-full items-center justify-between">
            <motion.h2 className="text-xl font-bold tracking-wider text-gray-800">
              {currentDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
            </motion.h2>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToPrevMonth}
                className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextMonth}
                className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="px-0/5 rounded-xl bg-gray-100 py-1 text-center text-xs text-gray-600 font-semibold"
              >
                {day}
              </div>
            ))}
          </div>
          <CalendarGrid
            days={calendarDays}
            onHover={handleDayHover}
            onMouseDown={handleDayMouseDown}
            onMouseEnter={handleDayMouseEnter}
            onMouseUp={handleDayMouseUp}
            selectedRange={selectedRange}
            tempRange={tempRange}
          />
        </motion.div>
      </motion.div>
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          key="more-view"
          className="mt-4 flex w-full flex-col gap-4"
        >
          <div className="flex w-full flex-col items-start justify-between">
            <motion.h2 className="mb-2 text-2xl font-bold tracking-wider text-gray-800">
              События
            </motion.h2>
            <p className="font-medium text-gray-500">
              Детали резервирований для выбранного дня или периода.
            </p>
          </div>
          <motion.div
            className="flex h-[450px] flex-col items-start justify-start overflow-hidden overflow-y-auto rounded-xl border-2 border-gray-200 shadow-inner bg-gray-50"
            layout
          >
            <AnimatePresence>
              {displayedEvents.length > 0 ? (
                displayedEvents.map((event, mIndex) => (
                  <Link href={`/admin/reservations/${event.id}`} key={event.id} passHref>
                    <motion.div
                      className={`w-full border-b-2 border-gray-200 py-3 px-4 last:border-b-0 cursor-pointer hover:bg-gray-100 transition-colors duration-200`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        duration: 0.2,
                        delay: mIndex * 0.05,
                      }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">
                            {formatDate(event.reservationDate)}
                          </span>
                          <span className="text-xs font-mono text-gray-500 bg-gray-200 px-1 rounded">
                            {event.id.substring(0, 8)}
                          </span>
                        </div>
                        <StatusBadge status={event.status} />
                      </div>
                      <h3 className="mb-1 text-lg font-semibold text-gray-900">
                        {event.bookTitle}
                      </h3>
                      <p className="mb-1 text-sm text-gray-600">
                        {event.userName}
                      </p>
                    </motion.div>
                  </Link>
                ))
              ) : (
                <motion.div className="flex items-center justify-center w-full h-full p-4">
                   <p className="text-gray-500 text-center">Нет событий для отображения. Наведите на день или выберите диапазон.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});
InteractiveCalendar.displayName = 'InteractiveCalendar';

export default InteractiveCalendar;

const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];