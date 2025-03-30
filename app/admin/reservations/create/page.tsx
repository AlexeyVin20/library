"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface Book {
  id: string;
  title: string;
  authors?: string;
  availableCopies: number;
}

export default function CreateReservationPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userId: "",
    bookId: "",
    reservationDate: new Date().toISOString().split("T")[0],
    expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
  });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, booksResponse] = await Promise.all([
        fetch(`${baseUrl}/api/User`),
        fetch(`${baseUrl}/api/Books`),
      ]);

      if (!usersResponse.ok) throw new Error("Ошибка при загрузке пользователей");
      if (!booksResponse.ok) throw new Error("Ошибка при загрузке книг");

      const [usersData, booksData] = await Promise.all([
        usersResponse.json(),
        booksResponse.json(),
      ]);

      setUsers(usersData);
      setBooks(booksData.filter((book: Book) => book.availableCopies > 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseUrl}/api/Reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "Обрабатывается",
        }),
      });

      if (!response.ok) throw new Error("Ошибка при создании резервации");
      router.push("/admin/reservations");
    } catch (err) {
      console.error("Ошибка при создании резервации:", err);
      alert(err instanceof Error ? err.message : "Ошибка при создании резервации");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen text-neutral-500 dark:text-neutral-200">
      Загрузка...
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-100/80 dark:bg-red-900/80 backdrop-blur-xl border border-red-400 text-red-700 dark:text-red-200 rounded-lg">
      {error}
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-500 dark:text-neutral-200">
            Создание резервации
          </h1>
          <Link 
            href="/admin/reservations"
            className="bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
          >
            Назад
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
            <div className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Пользователь
                </label>
                <select
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/20 dark:bg-neutral-700/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-lg px-4 py-2 text-neutral-500 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите пользователя</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bookId" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Книга
                </label>
                <select
                  id="bookId"
                  name="bookId"
                  value={formData.bookId}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/20 dark:bg-neutral-700/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-lg px-4 py-2 text-neutral-500 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите книгу</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} - {book.authors || "Автор не указан"} (Доступно: {book.availableCopies})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reservationDate" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                    Дата резервации
                  </label>
                  <input
                    type="date"
                    id="reservationDate"
                    name="reservationDate"
                    value={formData.reservationDate}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/20 dark:bg-neutral-700/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-lg px-4 py-2 text-neutral-500 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="expirationDate" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                    Дата возврата
                  </label>
                  <input
                    type="date"
                    id="expirationDate"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleChange}
                    required
                    min={formData.reservationDate}
                    className="w-full bg-white/20 dark:bg-neutral-700/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-lg px-4 py-2 text-neutral-500 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Примечания
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-white/20 dark:bg-neutral-700/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-lg px-4 py-2 text-neutral-500 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-6 py-2"
            >
              Создать резервацию
            </button>
          </div>
        </form>
      </div>
  );
} 