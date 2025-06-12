"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  initialFocus?: boolean;
}

function Calendar({ mode = "single", selected, onSelect, className, initialFocus }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date());
  const [showYearMonthPicker, setShowYearMonthPicker] = React.useState(false);

  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  // Получаем дни месяца
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Получаем день недели первого дня (0 = воскресенье, 1 = понедельник, ...)
    let firstDayOfWeek = firstDay.getDay();
    // Преобразуем в формат где понедельник = 0
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days = [];
    
    // Добавляем пустые дни в начале
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Добавляем дни месяца
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isSelected = (date: Date) => {
    if (!selected) return false;
    return date.toDateString() === selected.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateClick = (date: Date) => {
    onSelect?.(date);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleMonthYearChange = (month: number, year: number) => {
    setCurrentDate(new Date(year, month, 1));
    setShowYearMonthPicker(false);
  };

  const days = getDaysInMonth(currentDate);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Генерируем годы (текущий год ± 50)
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);

  return (
    <div className={cn("p-3 w-fit", className)}>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => setShowYearMonthPicker(!showYearMonthPicker)}
          className="text-sm font-medium hover:text-blue-600 cursor-pointer px-2 py-1 rounded hover:bg-gray-100"
        >
          {months[currentMonth]} {currentYear}
        </button>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Селектор года и месяца */}
      {showYearMonthPicker && (
        <div className="mb-4 p-3 border rounded-md bg-white shadow-lg">
          <div className="mb-3">
            <p className="text-xs font-medium mb-2">Месяц:</p>
            <div className="grid grid-cols-3 gap-1">
              {months.map((month, index) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleMonthYearChange(index, currentYear)}
                  className={cn(
                    "p-1 text-xs rounded hover:bg-blue-100",
                    index === currentMonth && "bg-blue-500 text-white"
                  )}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-xs font-medium mb-2">Год:</p>
            <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => handleMonthYearChange(currentMonth, year)}
                  className={cn(
                    "p-1 text-xs rounded hover:bg-blue-100",
                    year === currentYear && "bg-blue-500 text-white"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setShowYearMonthPicker(false)}
            className="w-full mt-2 p-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
            {day}
          </div>
        ))}
      </div>

      {/* Календарь дней */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <div key={index} className="h-8 w-8">
            {date && (
              <button
                type="button"
                onClick={() => handleDateClick(date)}
                className={cn(
                  "w-full h-full text-sm rounded hover:bg-blue-100 transition-colors",
                  isSelected(date) && "bg-blue-500 text-white hover:bg-blue-600",
                  isToday(date) && !isSelected(date) && "bg-blue-100 text-blue-800",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                )}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
export type { CalendarProps };