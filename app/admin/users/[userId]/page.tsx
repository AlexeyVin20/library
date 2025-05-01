"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Calendar,
  Book,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Shield,
  Plus,
  UserMinus,
  ShieldCheck,
} from "lucide-react";
import { UserBorrowingChart } from "@/components/admin/UserBorrowingChart";

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportNumber: string;
  passportIssuedBy: string;
  passportIssuedDate: string;
  address: string;
  dateRegistered: string;
  borrowedBooksCount: number;
  fineAmount: number;
  isActive: boolean;
  lastLoginDate: string;
  loanPeriodDays: number;
  maxBooksAllowed: number;
  username: string;
}

interface Book {
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
  book?: { id: string; title: string };
}

interface Role {
  id: number;
  name: string;
  description: string;
}

interface UserRole {
  id: number;
  userId: string;
  roleId: number;
  role: Role;
}

const FadeInView = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const Section = ({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) => (
  <FadeInView delay={delay}>
    <motion.div
      className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/30"
      whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
    >
      <h2 className="text-white font-bold text-white dark:text-white mb-4 flex items-center gap-2">{title}</h2>
      <div>{children}</div>
    </motion.div>
  </FadeInView>
);

const StatusBadge = ({ status }: { status: string }) => {
  const color = status === "Выполнена" ? "bg-emerald-500" : status === "Обрабатывается" ? "bg-emerald-400" : "bg-gray-500";
  const label = status === "Выполнена" ? "Одобрено" : status === "Обрабатывается" ? "В обработке" : "Отклонено";
  return (
    <span className={`inline-block px-3 py-1 text-whitexs font-medium text-white rounded-full ${color} backdrop-blur-md shadow-sm`}>
      {label}
    </span>
  );
};

const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center h-screen">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full"
    />
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-4 text-white-600 dark:text-white-400 font-medium"
    >
      Загрузка данных...
    </motion.p>
  </div>
);

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<number[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const [userResponse, booksResponse, reservationsResponse, userRolesResponse, rolesResponse] = await Promise.all([
        fetch(`${baseUrl}/api/User/${userId}`),
        fetch(`${baseUrl}/api/Books/user/${userId}`),
        fetch(`${baseUrl}/api/Reservation?userId=${userId}`),
        fetch(`${baseUrl}/api/User/${userId}/roles`),
        fetch(`${baseUrl}/api/User/roles`),
      ]);

      if (!userResponse.ok) throw new Error("Ошибка при загрузке пользователя");
      const userData = await userResponse.json();
      setUser(userData);

      if (booksResponse.ok) setBorrowedBooks(await booksResponse.json());
      if (reservationsResponse.ok) setReservations(await reservationsResponse.json());
      
      if (userRolesResponse.ok) {
        const userRolesData = await userRolesResponse.json();
        setUserRoles(userRolesData.map((role: any) => role.roleId));
      }
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setAvailableRoles(rolesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
    } finally {
      setLoading(false);
    }
  }, [userId, baseUrl]);

  useEffect(() => {
    if (userId) fetchUserData();
  }, [userId, fetchUserData]);

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/User/${userId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Ошибка при удалении пользователя");
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при удалении пользователя");
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      setError("Выберите роль для назначения");
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/User/assign-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          roleId: selectedRoleId,
        }),
      });

      if (!response.ok) throw new Error("Ошибка при назначении роли");

      // Обновляем данные о ролях пользователя
      fetchUserData();
      setSelectedRoleId("");
      setIsAssigningRole(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при назначении роли");
    }
  };

  const handleRemoveRole = async (roleId: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту роль у пользователя?")) return;

    try {
      const response = await fetch(`${baseUrl}/api/User/remove-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          roleId: roleId,
        }),
      });

      if (!response.ok) throw new Error("Ошибка при удалении роли у пользователя");

      // Обновляем данные о ролях пользователя
      fetchUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при удалении роли");
    }
  };

  const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString("ru-RU") : "Не указано";

  // Фильтруем доступные роли, исключая те, которые уже назначены пользователю
  const filteredAvailableRoles = availableRoles.filter(
    (role) => !userRoles.includes(role.id)
  );

  // Получаем данные о ролях пользователя
  const userRolesWithDetails = userRoles
    .map(roleId => availableRoles.find(role => role.id === roleId))
    .filter(role => role !== undefined) as Role[];

  if (loading) return <LoadingSpinner />;

  if (error) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 bg-red-100/80 dark:bg-red-900/80 backdrop-blur-xl border border-red-400 text-whitered-700 dark:text-whitered-200 rounded-lg"
    >
      {error}
    </motion.div>
  );

  if (!user) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 bg-yellow-100/80 dark:bg-yellow-900/80 backdrop-blur-xl border border-yellow-400 text-whiteyellow-700 dark:text-whiteyellow-200 rounded-lg"
    >
      Пользователь не найден
    </motion.div>
  );

  const chartData = {
    borrowed: user.borrowedBooksCount,
    available: user.maxBooksAllowed - user.borrowedBooksCount,
    reservations: reservations.filter(r => r.status === "Обрабатывается" && r.userId === userId).length,
  };

  return (
    <div className="min-h-screen relative p-6 max-w-7xl mx-auto">
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>

      <main className="space-y-8 relative z-10">
        <FadeInView>
          <motion.div className="flex justify-between items-center mb-6">
            <Link href="/admin/users" className="text-white-600 hover:text-white-700 dark:text-white-400 dark:hover:text-white-300 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Назад к списку пользователей
            </Link>
            <div className="flex gap-4">
              <Link href={`/admin/users/${userId}/update`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                >
                  <Edit className="w-4 h-4" />
                  Редактировать
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteUser}
                className="bg-red-500/90 hover:bg-red-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </motion.button>
            </div>
          </motion.div>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Section title="Информация о пользователе" delay={0.2}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-whitexl font-bold text-white dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-white-500" />
                  {user.fullName}
                </h3>
                <StatusBadge status={user.isActive ? "Выполнена" : "Отменена"} />
              </div>
              <p className="text-white text-white dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              {user.phone && (
                <p className="text-white text-white dark:text-white flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {user.phone}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-semibold dark:text-white mb-2">Основная информация</h4>
                  <ul className="space-y-2 text-white">
                    <li><span className="font-medium">Логин:</span> {user.username}</li>
                    <li><span className="font-medium">Дата рождения:</span> {formatDate(user.dateOfBirth)}</li>
                    <li><span className="font-medium">Адрес:</span> {user.address || "Не указан"}</li>
                    <li><span className="font-medium">Дата регистрации:</span> {formatDate(user.dateRegistered)}</li>
                    <li><span className="font-medium">Последний вход:</span> {formatDate(user.lastLoginDate)}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-white dark:text-white mb-2">Библиотечная информация</h4>
                  <ul className="space-y-2 text-white">
                    <li><span className="font-medium">Книг на руках:</span> {user.borrowedBooksCount}/{user.maxBooksAllowed}</li>
                    <li><span className="font-medium">Срок выдачи:</span> {user.loanPeriodDays || 14} дней</li>
                    <li><span className="font-medium">Штраф:</span> <span className={user.fineAmount > 0 ? "text-whitered-500" : ""}>{user.fineAmount.toFixed(2)} руб.</span></li>
                  </ul>
                </div>
              </div>
              {user.passportNumber && (
                <div>
                  <h4 className="text-white font-semibold text-white dark:text-white mb-2">Паспортные данные</h4>
                  <ul className="space-y-2 text-white">
                    <li><span className="font-medium">Номер паспорта:</span> {user.passportNumber}</li>
                    {user.passportIssuedBy && <li><span className="font-medium">Кем выдан:</span> {user.passportIssuedBy}</li>}
                    {user.passportIssuedDate && <li><span className="font-medium">Дата выдачи:</span> {formatDate(user.passportIssuedDate)}</li>}
                  </ul>
                </div>
              )}
            </div>
          </Section>

          <Section title="Использование библиотеки" delay={0.3}>
            <div className="h-[300px] bg-green/10 dark:bg-green-800/70 backdrop-blur-md rounded-xl p-4 border border-white/30 dark:border-gray-700/30">
              <UserBorrowingChart data={chartData} />
            </div>
          </Section>

          <Section title="Роли пользователя" delay={0.3}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  Назначенные роли
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAssigningRole(!isAssigningRole)}
                  className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white text-sm font-medium rounded-lg px-3 py-1 flex items-center gap-1 shadow-md backdrop-blur-md"
                >
                  <Plus className="w-3 h-3" />
                  Добавить роль
                </motion.button>
              </div>

              {isAssigningRole && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 bg-green/10 dark:bg-green-800/70 backdrop-blur-md rounded-lg border border-white/30 dark:border-gray-700/30"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="block mb-1 text-white text-sm">Выберите роль:</label>
                      <select 
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(Number(e.target.value) || "")}
                        className="w-full p-2 rounded-lg bg-green/20 dark:bg-green-800/40 backdrop-blur-md border border-white/30 dark:border-gray-700/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <option value="">Выберите роль</option>
                        {filteredAvailableRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsAssigningRole(false)}
                        className="bg-gray-500/90 hover:bg-gray-600/90 text-white text-sm font-medium rounded-lg px-3 py-1 shadow-md backdrop-blur-md"
                      >
                        Отмена
                      </motion.button>
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAssignRole}
                        className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white text-sm font-medium rounded-lg px-3 py-1 shadow-md backdrop-blur-md"
                      >
                        Назначить
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                {userRolesWithDetails.length > 0 ? (
                  userRolesWithDetails.map((role) => (
                    <motion.div
                      key={role.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-green/10 dark:bg-green-800/70 backdrop-blur-md rounded-lg border border-white/30 dark:border-gray-700/30 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="font-medium text-white">{role.name}</p>
                          <p className="text-white text-sm">{role.description}</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemoveRole(role.id)}
                        className="bg-red-500/90 hover:bg-red-600/90 text-white p-1 rounded-lg shadow-md backdrop-blur-md"
                        title="Удалить роль"
                      >
                        <UserMinus className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-white text-center py-2">У пользователя нет ролей</p>
                )}
              </div>
              
              <Link href="/admin/roles">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full mt-2 bg-emerald-500/40 hover:bg-emerald-500/60 text-white text-sm font-medium rounded-lg px-3 py-2 flex items-center justify-center gap-2 shadow-md backdrop-blur-md"
                >
                  <Shield className="w-4 h-4" />
                  Управление ролями
                </motion.button>
              </Link>
            </div>
          </Section>
        </div>

        <Section title="Книги на руках" delay={0.4}>
          {borrowedBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {borrowedBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-lg border border-white/30 dark:border-gray-700/30"
                >
                  <h4 className="font-semibold text-white dark:text-white">{book.title}</h4>
                  <p className="text-white text-white dark:text-white">Автор: {book.author}</p>
                  <p className="text-white text-white dark:text-white">Дата возврата: {formatDate(book.returnDate)}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-white dark:text-white">Пользователь не брал книги</p>
          )}
        </Section>

        <Section title="Резервации пользователя" delay={0.5}>
          {reservations.filter(r => r.userId === userId).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservations.filter(r => r.userId === userId).map((reservation, index) => (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 bg-green/20 dark:bg-green-800/70 backdrop-blur-md rounded-lg border border-white/30 dark:border-gray-700/30"
                >
                  <h4 className="font-semibold text-white dark:text-white">{reservation.book?.title || "Неизвестная книга"}</h4>
                  <p className="text-white text-white dark:text-white">Срок до: {formatDate(reservation.expirationDate)}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-white mr-1 text-white dark:text-white">Статус:</span>
                    <StatusBadge status={reservation.status} />
                  </div>
                  {reservation.notes && (
                    <p className="text-white italic mt-2 text-white dark:text-white">Примечание: {reservation.notes}</p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-white dark:text-white">У пользователя нет активных резерваций</p>
          )}
        </Section>
      </main>
    </div>
  );
}