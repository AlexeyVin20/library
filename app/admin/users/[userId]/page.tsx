"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface User {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  borrowedBooksCount: number;
  maxBooksAllowed: number;
  fineAmount: number;
}

interface BorrowedBook {
  id: string;
  title: string;
  author: string;
  returnDate: string;
}

interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
}

interface Book {
  id: string;
  title: string;
  authors: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния для резерваций
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [reservationNote, setReservationNote] = useState<string>("");
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      
      // Получаем все необходимые данные
      const [userResponse, reservationsResponse, booksResponse] = await Promise.all([
        fetch(`${baseUrl}/api/User/${userId}`),
        fetch(`${baseUrl}/api/Reservation`),
        fetch(`${baseUrl}/api/Books`)
      ]);
      
      if (!userResponse.ok) throw new Error(`Ошибка загрузки данных пользователя: ${userResponse.status}`);
      if (!reservationsResponse.ok) throw new Error(`Ошибка загрузки резерваций: ${reservationsResponse.status}`);
      if (!booksResponse.ok) throw new Error(`Ошибка загрузки книг: ${booksResponse.status}`);
      
      const userData = await userResponse.json();
      const reservationsData = await reservationsResponse.json();
      const booksData = await booksResponse.json();
      
      setUser(userData);
      setBooks(booksData);
      
      if (booksData.length > 0) {
        setSelectedBookId(booksData[0].id);
      }
      
      // Фильтруем резервации для текущего пользователя
      const userReservations = reservationsData.filter(
        (reservation: Reservation) => reservation.userId === userId
      );
      
      setUserReservations(userReservations);
      
      // Создаем список книг на руках (со статусом Approved)
      const approvedReservations = userReservations.filter(
        (reservation: Reservation) => reservation.status === "Approved"
      );
      
      const borrowedBooksData = approvedReservations.map((reservation: Reservation) => {
        const book = booksData.find((b: Book) => b.id === reservation.bookId);
        return {
          id: reservation.id,
          title: book?.title || "Неизвестная книга",
          author: book?.authors || "Неизвестный автор",
          returnDate: new Date(reservation.expirationDate).toLocaleDateString()
        };
      });
      
      setBorrowedBooks(borrowedBooksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных');
      console.error('Ошибка загрузки данных пользователя:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Создание новой резервации
  const createReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBookId) {
      setError('Выберите книгу для резервации');
      return;
    }
    
    try {
      setSubmitting(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      
      // Подготовка данных для новой резервации
      const reservationDate = new Date().toISOString();
      
      // Дата окончания - через 14 дней
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 14);
      
      const newReservation = {
        id: crypto.randomUUID(),
        userId: userId,
        bookId: selectedBookId,
        reservationDate: reservationDate,
        expirationDate: expirationDate.toISOString(),
        status: "Pending",
        notes: reservationNote
      };
      
      const response = await fetch(`${baseUrl}/api/Reservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReservation)
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при создании резервации: ${response.status}`);
      }
      
      // Обновляем данные после успешного создания
      setReservationNote("");
      fetchUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании резервации');
    } finally {
      setSubmitting(false);
    }
  };

  // Отмена резервации
  const cancelReservation = async (reservationId: string) => {
    if (!confirm("Вы уверены, что хотите отменить эту резервацию?")) return;
    
    try {
      setSubmitting(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      
      const response = await fetch(`${baseUrl}/api/Reservation/${reservationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при отмене резервации: ${response.status}`);
      }
      
      // Обновляем данные после отмены
      fetchUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при отмене резервации');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center p-8">Загрузка...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Ошибка: {error}</div>;
  if (!user) return <div className="text-center p-8">Пользователь не найден</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/admin/users" className="text-blue-500 hover:underline mb-4 block">
        &lt; Назад к списку пользователей
      </Link>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">{user.fullName}</h1>
        <p className="mb-2">{user.email}</p>
        <p className="mb-2">Статус: {user.isActive ? 'Активен' : 'Заблокирован'}</p>
        <p className="mb-2">Книг на руках: {user.borrowedBooksCount}</p>
        <p className="mb-2">Максимально доступно: {user.maxBooksAllowed}</p>
        {user.fineAmount > 0 && (
          <p className="mb-2 text-red-500">Штраф: {user.fineAmount} руб.</p>
        )}
      </div>
      
      <h2 className="text-xl font-bold mb-4">Взятые книги</h2>
      {borrowedBooks.length === 0 ? (
        <p>Пользователь не брал книги</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {borrowedBooks.map(book => (
            <div key={book.id} className="bg-white shadow-md rounded-lg p-4">
              <h3 className="font-bold mb-2">{book.title}</h3>
              <p className="mb-1">Автор: {book.author}</p>
              <p className="mb-1">Дата возврата: {book.returnDate}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Блок управления резервациями */}
      <div className="mt-8 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Управление резервациями</h2>
        
        <h3 className="font-bold mb-2">Текущие резервации</h3>
        {userReservations.length === 0 ? (
          <p className="mb-4">У пользователя нет активных резерваций</p>
        ) : (
          <div className="mb-6">
            {userReservations.map(reservation => {
              const book = books.find(b => b.id === reservation.bookId);
              return (
                <div key={reservation.id} className="border-b pb-3 mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{book?.title || 'Неизвестная книга'}</p>
                      <p className="text-sm text-gray-600">
                        Срок до: {new Date(reservation.expirationDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        Статус: <span className={
                          reservation.status === 'Approved' ? 'text-green-600' : 
                          reservation.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'
                        }>
                          {reservation.status === 'Approved' ? 'Одобрено' :
                           reservation.status === 'Rejected' ? 'Отклонено' : 'В обработке'}
                        </span>
                      </p>
                      {reservation.notes && (
                        <p className="text-sm text-gray-600">Примечание: {reservation.notes}</p>
                      )}
                    </div>
                    {reservation.status !== 'Approved' && (
                      <button
                        onClick={() => cancelReservation(reservation.id)}
                        disabled={submitting}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Отменить
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <h3 className="font-bold mb-2">Создать новую резервацию</h3>
        <form onSubmit={createReservation} className="space-y-4">
          <div>
            <label className="block mb-1">Выберите книгу:</label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={submitting || books.length === 0}
            >
              {books.length === 0 ? (
                <option>Нет доступных книг</option>
              ) : (
                books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label className="block mb-1">Примечания:</label>
            <textarea
              value={reservationNote}
              onChange={(e) => setReservationNote(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={submitting}
              rows={3}
              placeholder="Необязательные примечания к резервации"
            />
          </div>
          
          <button
            type="submit"
            disabled={submitting || !selectedBookId}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Создание...' : 'Зарезервировать книгу'}
          </button>
        </form>
      </div>
    </div>
  );
}
