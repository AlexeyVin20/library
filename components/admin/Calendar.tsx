"use client";

import { useState, useEffect } from "react";

// Определение типов
export type CalendarEvent = {
  id: string; // Изменено на string для совместимости с Guid
  userId: string;
  bookId: string;
  reservationDate: string; // формат: YYYY-MM-DD
  expirationDate: string;
  status: string;
  notes?: string;
  userName?: string; // Дополнительное поле для отображения
  bookTitle?: string; // Дополнительное поле для отображения
};

interface CalendarProps {
  initialEvents?: CalendarEvent[];
}

export default function Calendar({ initialEvents = [] }: CalendarProps) {
  // Отображаем текущий месяц (с 1-го числа)
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  
  // Локальное состояние событий
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  
  // Состояние загрузки
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Выбранный день для добавления события
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventInfo, setNewEventInfo] = useState("");
  
  // Пользователь и книга для новой резервации
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchReservations();
    fetchUsers();
    fetchBooks();
  }, []);

  // Загрузка резерваций с сервера
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
      
      // Преобразование данных для календаря
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

  // Загрузка пользователей
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/User`, {
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при загрузке пользователей: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data);
      
      // Установить первого пользователя по умолчанию, если есть
      if (data.length > 0 && !selectedUserId) {
        setSelectedUserId(data[0].id);
      }
    } catch (err) {
      console.error("Ошибка при загрузке пользователей:", err);
    }
  };

  // Загрузка книг
  const fetchBooks = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/Books`, {
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при загрузке книг: ${response.status}`);
      }
      
      const data = await response.json();
      setBooks(data);
      
      // Установить первую книгу по умолчанию, если есть
      if (data.length > 0 && !selectedBookId) {
        setSelectedBookId(data[0].id);
      }
    } catch (err) {
      console.error("Ошибка при загрузке книг:", err);
    }
  };

  // Добавление новой резервации через API
  const createReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedUserId || !selectedBookId) {
      setError("Выберите дату, пользователя и книгу");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Форматирование даты
      const reservationDate = selectedDate.toISOString();
      
      // Устанавливаем дату окончания резервации через 14 дней
      const expirationDate = new Date(selectedDate);
      expirationDate.setDate(expirationDate.getDate() + 14);
      
      const newReservation = {
        id: crypto.randomUUID(), // Сгенерировать новый GUID
        userId: selectedUserId,
        bookId: selectedBookId,
        reservationDate: reservationDate,
        expirationDate: expirationDate.toISOString(),
        status: "Pending", // По умолчанию "В ожидании"
        notes: newEventInfo.trim()
      };
      
      const response = await fetch(`${baseUrl}/api/Reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReservation),
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при создании резервации: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Найти имя пользователя и название книги
      const user = users.find(u => u.id === selectedUserId);
      const book = books.find(b => b.id === selectedBookId);
      
      // Добавляем новое событие в календарь
      const newCalendarEvent: CalendarEvent = {
        id: data.id,
        userId: data.userId,
        bookId: data.bookId,
        reservationDate: new Date(data.reservationDate).toISOString().split('T')[0],
        expirationDate: new Date(data.expirationDate).toISOString().split('T')[0],
        status: data.status,
        notes: data.notes,
        userName: user?.fullName || "Неизвестный пользователь",
        bookTitle: book?.title || "Неизвестная книга"
      };
      
      setEvents([...events, newCalendarEvent]);
      setSelectedDate(null);
      setNewEventInfo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при создании резервации");
      console.error("Ошибка при создании резервации:", err);
    } finally {
      setLoading(false);
    }
  };

  // Обновление статуса резервации
  const updateReservationStatus = async (id: string, newStatus: string) => {
    try {
      setLoading(true);
      
      // Найти текущую резервацию
      const reservation = events.find(e => e.id === id);
      if (!reservation) {
        throw new Error("Резервация не найдена");
      }
      
      // Создать обновленный объект
      const updatedReservation = {
        userId: reservation.userId,
        bookId: reservation.bookId,
        reservationDate: new Date(reservation.reservationDate).toISOString(),
        expirationDate: new Date(reservation.expirationDate).toISOString(),
        status: newStatus,
        notes: reservation.notes
      };
      
      const response = await fetch(`${baseUrl}/api/Reservation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReservation),
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при обновлении резервации: ${response.status}`);
      }
      
      // Обновляем список событий
      setEvents(events.map(e => 
        e.id === id ? { ...e, status: newStatus } : e
      ));
    } catch (err) {
      console.error("Ошибка при обновлении резервации:", err);
    } finally {
      setLoading(false);
    }
  };

  // Удаление резервации
  const deleteReservation = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту резервацию?")) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${baseUrl}/api/Reservation/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при удалении резервации: ${response.status}`);
      }
      
      // Удаляем событие из списка
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      console.error("Ошибка при удалении резервации:", err);
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

  // Генерация дней месяца (неделя начинается с понедельника)
  const generateDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const days = [];
    
    // Пустые ячейки для выравнивания календаря
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    
    // Заполняем дни месяца
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, monthIndex, d));
    }
    
    return days;
  };

  const days = generateDays(currentMonth);

  // Цвет ячейки, если есть событие
  const getEventColor = (status: string) => {
    switch(status) {
      case "Approved": return "bg-green-300";
      case "Rejected": return "bg-red-300";
      case "Completed": return "bg-blue-300";
      case "Pending": 
      default: return "bg-yellow-300";
    }
  };

  // Поиск событий по дате
  const getDayEvents = (day: Date) => {
    const dayStr = day.toISOString().split("T")[0];
    return events.filter((event) => event.reservationDate === dayStr);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setNewEventInfo("");
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          &lt; Пред.
        </button>
        
        <h2 className="text-xl font-bold">
          {currentMonth.toLocaleString("ru-RU", { month: "long", year: "numeric" })}
        </h2>
        
        <button
          onClick={handleNextMonth}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          След. &gt;
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((dayLabel, index) => (
          <div key={index} className="text-center font-bold py-1 bg-gray-200 rounded">
            {dayLabel}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="h-24 bg-gray-50 rounded"></div>;
          
          const dayEvents = getDayEvents(day);
          const isToday = day.toDateString() === new Date().toDateString();
          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
          
          return (
            <div
              key={`day-${index}`}
              onClick={() => handleDayClick(day)}
              className={`h-24 border overflow-auto p-1 rounded cursor-pointer transition-all ${
                isToday ? "border-blue-500 shadow-md" : "border-gray-200"
              } ${isSelected ? "bg-blue-100" : "bg-white"}`}
            >
              <div className="text-right font-semibold">{day.getDate()}</div>
              
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className={`${getEventColor(event.status)} p-1 my-1 rounded text-xs truncate`}
                  title={`${event.userName} - ${event.bookTitle} (${event.status})`}
                >
                  <div className="font-bold">{event.bookTitle}</div>
                  <div>{event.userName}</div>
                  <div className="flex justify-between mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateReservationStatus(event.id, "Approved");
                      }}
                      className="bg-green-700 text-white px-1 rounded text-xs"
                    >
                      ✓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateReservationStatus(event.id, "Rejected");
                      }}
                      className="bg-red-700 text-white px-1 rounded text-xs"
                    >
                      ✗
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReservation(event.id);
                      }}
                      className="bg-gray-700 text-white px-1 rounded text-xs"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      
      {selectedDate && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-bold mb-2">
            Добавить резервацию на {selectedDate.toLocaleDateString('ru-RU')}
          </h3>
          
          <form onSubmit={createReservation} className="space-y-3">
            <div>
              <label className="block mb-1">Читатель:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Выберите читателя</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block mb-1">Книга:</label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Выберите книгу</option>
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block mb-1">Примечания:</label>
              <textarea
                value={newEventInfo}
                onChange={(e) => setNewEventInfo(e.target.value)}
                placeholder="Введите примечания к резервации"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              {loading ? "Добавление..." : "Добавить резервацию"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
