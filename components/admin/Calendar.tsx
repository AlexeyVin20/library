"use client";
import { useState } from "react";

export type CalendarEvent = {
  id: number;
  date: string; // формат: YYYY-MM-DD
  info: string;
};

interface CalendarProps {
  events: CalendarEvent[];
}

export default function Calendar({ events }: CalendarProps) {
  // Отображаем текущий месяц (с 1-го числа)
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  // Локальное состояние событий (из пропсов + добавленные)
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>(events);
  // Выбранный день для добавления события
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventInfo, setNewEventInfo] = useState("");

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Генерация дней месяца (неделя начинается с понедельника)
  const generateDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days = [];
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, monthIndex, d));
    }
    return days;
  };

  const days = generateDays(currentMonth);

  // Цвет ячейки, если есть событие
  const getEventColor = (eventId: number) => {
    const colors = ["bg-blue-300", "bg-green-300", "bg-yellow-300", "bg-red-300"];
    return colors[eventId % colors.length];
  };

  // Поиск события по дате
  const getDayEvent = (day: Date) => {
    const dayStr = day.toISOString().split("T")[0];
    return localEvents.find((event) => event.date === dayStr);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setNewEventInfo("");
  };

  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedDate && newEventInfo.trim() !== "") {
      const dayStr = selectedDate.toISOString().split("T")[0];
      const newEvent: CalendarEvent = {
        id: Date.now(),
        date: dayStr,
        info: newEventInfo.trim(),
      };
      setLocalEvents([...localEvents, newEvent]);
      setSelectedDate(null);
      setNewEventInfo("");
    }
  };

  return (
    <div className="calendar w-80 h-80 border p-4 rounded shadow flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <button onClick={handlePrevMonth} className="p-1 rounded hover:bg-gray-200">
          &lt;
        </button>
        <h3 className="text-xl font-bold">
          {currentMonth.toLocaleString("ru-RU", { month: "long", year: "numeric" })}
        </h3>
        <button onClick={handleNextMonth} className="p-1 rounded hover:bg-gray-200">
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((dayLabel) => (
          <div key={dayLabel} className="text-center font-semibold text-sm">
            {dayLabel}
          </div>
        ))}
        {days.map((day, index) => {
          if (!day) return <div key={index} className="h-8"></div>;
          const event = getDayEvent(day);
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`h-8 border text-sm flex items-center justify-center rounded ${
                event ? getEventColor(event.id) : "bg-gray-100"
              }`}
              title={event ? event.info : ""}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <form onSubmit={handleAddEvent} className="mt-2">
          <input
            type="text"
            value={newEventInfo}
            onChange={(e) => setNewEventInfo(e.target.value)}
            placeholder="Введите событие"
            className="w-full p-2 border rounded"
          />
          <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
            Добавить событие
          </button>
        </form>
      )}
    </div>
  );
}
