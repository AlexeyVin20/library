"use client";

import { useState, useEffect } from "react";

// Определение типов
export type CalendarEvent = {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
  userName?: string;
  bookTitle?: string;
};

interface CalendarProps {
  initialEvents?: CalendarEvent[];
}

export default function Calendar({ initialEvents = [] }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${baseUrl}/api/Reservation`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Ошибка при загрузке данных: ${response.status}`);
      }

      const data = await response.json();
      const calendarEvents = data.map((reservation: any) => ({
        id: reservation.id,
        userId: reservation.userId,
        bookId: reservation.bookId,
        reservationDate: new Date(reservation.reservationDate).toISOString().split('T')[0],
        expirationDate: new Date(reservation.expirationDate).toISOString().split('T')[0],
        status: reservation.status,
        notes: reservation.notes,
        userName: reservation.user?.fullName || "Неизвестный пользователь",
        bookTitle: reservation.book?.title || "Неизвестная книга"
      }));

      setEvents(calendarEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке резерваций");
      console.error("Ошибка при загрузке резерваций:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const getEventColor = (status: string) => {
    switch(status) {
      case "Выполнена": return "bg-green-100 text-green-800";
      case "Отменена": return "bg-red-100 text-red-800";
      case "Истекла": return "bg-blue-100 text-blue-800";
      case "Обрабатывается":
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getDayEvents = (day: Date) => {
    const dayStr = day.toISOString().split("T")[0];
    return events.filter((event) => event.expirationDate === dayStr && event.status === "Выполнена");
  };

  const handleDayClick = (day: Date) => {
    const dayStr = day.toISOString().split("T")[0];
    const eventsOnDay = events.filter((event) => event.expirationDate === dayStr);
    setSelectedDay(day);
    setSelectedDayEvents(eventsOnDay);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDay(null);
    setSelectedDayEvents([]);
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
      {error && (
        <div className="bg-red-100/80 dark:bg-red-900/80 backdrop-blur-xl border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
        >
          &lt; Пред.
        </button>

        <h2 className="text-xl font-bold text-neutral-700 dark:text-neutral-200">
          {currentMonth.toLocaleString("ru-RU", { month: "long", year: "numeric" })}
        </h2>

        <button
          onClick={handleNextMonth}
          className="bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
        >
          След. &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((dayLabel, index) => (
          <div key={index} className="text-center font-bold py-1 bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-lg border border-white/30 dark:border-neutral-700/30">
            {dayLabel}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="h-24 bg-white/20 dark:bg-neutral-800/20 backdrop-blur-xl rounded-lg border border-white/30 dark:border-neutral-700/30"></div>;

          const dayEvents = getDayEvents(day);
          const isToday = day.toDateString() === new Date().toDateString();
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={`day-${index}`}
              className={`h-24 border overflow-auto p-1 rounded-lg transition-all ${
                isToday ? "border-blue-600 shadow-md" : "border-white/30 dark:border-neutral-700/30"
              } ${hasEvents ? "cursor-pointer hover:bg-white/40 dark:hover:bg-neutral-700/40" : ""} bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl`}
              onClick={hasEvents ? () => handleDayClick(day) : undefined}
            >
              <div className="text-right font-semibold text-neutral-700 dark:text-neutral-200">{day.getDate()}</div>

              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className={`${getEventColor(event.status)} p-2 my-1 rounded-lg text-xs shadow-sm backdrop-blur-sm`}
                  title={`${event.userName} - ${event.bookTitle}`}
                >
                  <div className="font-bold truncate">{event.bookTitle}</div>
                  <div className="truncate">{event.userName}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Модальное окно для отображения событий дня */}
      {showModal && selectedDay && (
        <div className="fixed inset-0 backdrop-blur-3xl flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl rounded-2xl shadow-xl max-w-xl w-full max-h-[80vh] overflow-auto border border-gray-200 dark:border-neutral-700/30">
            <div className="border-b border-white/30 dark:border-neutral-700/30 p-4 flex justify-between">
              <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200">
                Возвраты на {selectedDay.toLocaleString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
              </h3>
              <button onClick={closeModal} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
                &times;
              </button>
            </div>
            <div className="p-4">
              {selectedDayEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedDayEvents.map((event) => (
                    <div 
                      key={event.id}
                      className={`p-4 rounded-lg border-l-4 backdrop-blur-xl ${
                        event.status === "Выполнена" 
                          ? "border-green-500 bg-green-50/80 dark:bg-green-900/20" 
                          : event.status === "Отменена" 
                          ? "border-red-500 bg-red-50/80 dark:bg-red-900/20"
                          : "border-yellow-500 bg-yellow-50/80 dark:bg-yellow-900/20"
                      }`}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium text-lg text-neutral-700 dark:text-neutral-200">{event.bookTitle}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getEventColor(event.status)} backdrop-blur-sm`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm mt-2 text-neutral-600 dark:text-neutral-300">Пользователь: <span className="font-medium">{event.userName}</span></p>
                      <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 grid grid-cols-2 gap-2">
                        <div>
                          <p>Дата резервации:</p>
                          <p className="font-medium">{formatEventDate(event.reservationDate)}</p>
                        </div>
                        <div>
                          <p>Дата возврата:</p>
                          <p className="font-medium">{formatEventDate(event.expirationDate)}</p>
                        </div>
                      </div>
                      {event.notes && (
                        <div className="mt-3 pt-3 border-t border-white/30 dark:border-neutral-700/30">
                          <p className="text-sm text-neutral-600 dark:text-neutral-300">Примечания:</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">{event.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-neutral-500 dark:text-neutral-400 py-6">Нет возвратов на выбранную дату</p>
              )}
            </div>
            <div className="border-t border-white/30 dark:border-neutral-700/30 p-4 flex justify-end">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
