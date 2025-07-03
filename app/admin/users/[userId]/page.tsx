'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, Trash2, User, Calendar, Book, CheckCircle, XCircle, Mail, Phone, Shield, Plus, UserMinus, ShieldCheck, Key, X } from "lucide-react";
import { UserBorrowingChart } from "@/components/admin/UserBorrowingChart";
import Image from "next/image";
interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string;
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
  cover?: string;
  isbn?: string;
  genre?: string;
  publicationYear?: number;
  publisher?: string;
  isFromReservation?: boolean;
  userId?: string;
}
interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
  book?: {
    id: string;
    title: string;
    authors?: string;
    cover?: string;
  };
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
const FadeInView = ({
  children,
  delay = 0
}: {
  children: React.ReactNode;
  delay?: number;
}) => <motion.div initial={{
  opacity: 0,
  y: 20
}} animate={{
  opacity: 1,
  y: 0
}} transition={{
  duration: 0.5,
  delay,
  ease: [0.22, 1, 0.36, 1]
}}>
    {children}
  </motion.div>;
const Section = ({
  title,
  children,
  delay = 0
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) => <FadeInView delay={delay}>
    <motion.div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200" whileHover={{
    y: -5,
    boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)"
  }}>
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">{title}</h2>
      <div>{children}</div>
    </motion.div>
  </FadeInView>;
const StatusBadge = ({
  status
}: {
  status: string;
}) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Выполнена":
      case "Выдана":
      case "Возвращена":
        return "bg-green-100 text-green-800 border-green-200";
      case "Обрабатывается":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Истекла":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  const label = status === "Выполнена" ? "Одобрено" : status === "Обрабатывается" ? "В обработке" : status === "Отклонена" || status === "Отменена" ? "Отклонено" : status === "Истекла" ? "Истекла" : status === "Выдана" ? "Выдана" : status === "Возвращена" ? "Возвращена" : "Неизвестно";
  
  return <span className={`inline-block px-3 py-1 text-xs font-medium rounded-lg border ${getStatusStyle(status)}`}>
      {label}
    </span>;
};
const LoadingSpinner = () => <div className="flex flex-col justify-center items-center h-screen bg-gray-200">
    <motion.div animate={{
    rotate: 360
  }} transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: "linear"
  }} className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full" />
    <motion.p initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    delay: 0.5
  }} className="mt-4 text-blue-500 font-medium">
      Загрузка данных...
    </motion.p>
  </div>;
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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const [userResponse, borrowedBooksResponse, reservationsResponse, userRolesResponse, rolesResponse] = await Promise.all([fetch(`${baseUrl}/api/User/${userId}`), fetch(`${baseUrl}/api/Books/user/${userId}`), fetch(`${baseUrl}/api/Reservation?userId=${userId}`), fetch(`${baseUrl}/api/User/${userId}/roles`), fetch(`${baseUrl}/api/User/roles`)]);
      if (!userResponse.ok) throw new Error("Ошибка при загрузке пользователя");
      const userData = await userResponse.json();
      setUser(userData);
      let currentBorrowedBooks: Book[] = [];
      if (borrowedBooksResponse.ok) {
        const initiallyBorrowedBooks: Book[] = await borrowedBooksResponse.json();
        currentBorrowedBooks = await Promise.all(initiallyBorrowedBooks.filter(book => book.userId === userId).map(async (book: Book) => {
          let bookToUpdate = {
            ...book,
            isFromReservation: false
          };
          if (bookToUpdate.id) {
            try {
              const bookDetailsRes = await fetch(`${baseUrl}/api/books/${bookToUpdate.id}`);
              if (bookDetailsRes.ok) {
                const detailedBookData = await bookDetailsRes.json();
                const coverUrl = detailedBookData.cover || detailedBookData.coverImage || detailedBookData.coverImageUrl || detailedBookData.image || detailedBookData.coverUrl || detailedBookData.imageUrl || bookToUpdate.cover || "";
                bookToUpdate.cover = coverUrl;
                bookToUpdate.title = detailedBookData.title || bookToUpdate.title;
                if (detailedBookData.authors) {
                  bookToUpdate.author = Array.isArray(detailedBookData.authors) ? detailedBookData.authors.join(', ') : detailedBookData.authors;
                }
                if (detailedBookData.isbn) bookToUpdate.isbn = detailedBookData.isbn;
                if (detailedBookData.genre) bookToUpdate.genre = detailedBookData.genre;
                if (detailedBookData.publicationYear) bookToUpdate.publicationYear = detailedBookData.publicationYear;
                if (detailedBookData.publisher) bookToUpdate.publisher = detailedBookData.publisher;
              }
            } catch (bookErr) {
              console.warn(`Не удалось загрузить полные детали для книги ${bookToUpdate.id}`);
            }
          }
          return bookToUpdate;
        }));
      }
      let userReservations: Reservation[] = [];
      if (reservationsResponse.ok) {
        const rawReservations = await reservationsResponse.json();
        userReservations = await Promise.all(rawReservations.map(async (res: Reservation) => {
          let enrichedBookDetails = res.book;
          if (res.bookId) {
            try {
              const bookDetailsRes = await fetch(`${baseUrl}/api/books/${res.bookId}`);
              if (bookDetailsRes.ok) {
                const detailedBookData = await bookDetailsRes.json();
                const coverUrl = detailedBookData.cover || detailedBookData.coverImage || detailedBookData.coverImageUrl || detailedBookData.image || detailedBookData.coverUrl || detailedBookData.imageUrl || "";
                enrichedBookDetails = {
                  id: detailedBookData.id,
                  title: detailedBookData.title,
                  authors: detailedBookData.authors,
                  cover: coverUrl
                };
              }
            } catch (bookErr) {
              console.warn(`Не удалось загрузить детали для книги ${res.bookId} в резервации ${res.id}`);
            }
          }
          let displayStatus = res.status;
          if (new Date(res.expirationDate) < new Date() && (res.status === 'Обрабатывается' || res.status === 'Выполнена' || res.status === 'Выдана')) {
            displayStatus = 'Истекла';
          }
          return {
            ...res,
            book: enrichedBookDetails,
            status: displayStatus
          };
        }));
        setReservations(userReservations);
      }
      const booksFromIssuedReservations: Book[] = userReservations.filter(r => r.status === 'Выдана' && r.book && new Date(r.expirationDate) >= new Date() && r.userId === userId).map(r => ({
        id: r.book!.id,
        title: r.book!.title,
        author: r.book!.authors || 'Автор не указан',
        returnDate: r.expirationDate,
        cover: r.book!.cover,
        isFromReservation: true,
        userId: r.userId
      }));
      const allBooksOnHold = [...currentBorrowedBooks, ...booksFromIssuedReservations].filter((book, index, self) => index === self.findIndex(b => b.id === book.id));
      setBorrowedBooks(allBooksOnHold);

      // Обновляем счетчик книг на руках в БД, если он отличается от фактического
      if (userData.borrowedBooksCount !== allBooksOnHold.length) {
        try {
          const updateResponse = await fetch(`${baseUrl}/api/User/${userId}/update-borrowed-count`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              borrowedBooksCount: allBooksOnHold.length
            })
          });
          if (updateResponse.ok) {
            console.log(`Счетчик книг обновлен: ${allBooksOnHold.length}`);
            // Обновляем локальное состояние пользователя
            setUser({
              ...userData,
              borrowedBooksCount: allBooksOnHold.length
            });
          } else {
            console.warn("Не удалось обновить счетчик книг на руках");
          }
        } catch (updateErr) {
          console.error("Ошибка при обновлении счетчика книг:", updateErr);
        }
      }
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
      const response = await fetch(`${baseUrl}/api/User/${userId}`, {
        method: "DELETE"
      });
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: userId,
          roleId: selectedRoleId
        })
      });
      if (!response.ok) throw new Error("Ошибка при назначении роли");
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: userId,
          roleId: roleId
        })
      });
      if (!response.ok) throw new Error("Ошибка при удалении роли у пользователя");
      fetchUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при удалении роли");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Новые пароли не совпадают");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Новый пароль должен содержать минимум 6 символов");
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/api/User/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id: userId,
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Ошибка при смене пароля");
      }
      
      // Успешная смена пароля
      setIsPasswordModalOpen(false);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      alert("Пароль успешно изменен");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Произошла ошибка при смене пароля");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setPasswordError(null);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordError(null);
  };
  const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString("ru-RU") : "Не указано";
  const filteredAvailableRoles = availableRoles.filter(role => !userRoles.includes(role.id));
  const userRolesWithDetails = userRoles.map(roleId => availableRoles.find(role => role.id === roleId)).filter(role => role !== undefined) as Role[];
  if (loading) return <LoadingSpinner />;
  if (error) return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} className="p-6 bg-red-100 border border-red-200 text-red-800 rounded-lg">
      {error}
    </motion.div>;
  if (!user) return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} className="p-6 bg-red-100 border border-red-200 text-red-800 rounded-lg">
      Пользователь не найден
    </motion.div>;
  const chartData = {
    borrowed: user.borrowedBooksCount,
    available: user.maxBooksAllowed - user.borrowedBooksCount,
    reservations: reservations.filter(r => r.status === "Обрабатывается" && r.userId === userId).length
  };
  return <div className="min-h-screen bg-gray-200 p-6 max-w-7xl mx-auto">
      <main className="space-y-8">
        <FadeInView>
          <motion.div className="flex justify-between items-center mb-6">
            <Link href="/admin/users" className="text-blue-500 hover:text-blue-700 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Назад к списку пользователей
            </Link>
            <div className="flex gap-4">
              <Link href={`/admin/users/${userId}/update`}>
                <motion.button whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.95
              }} className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
                  <Edit className="w-4 h-4" />
                  Редактировать
                </motion.button>
              </Link>
              <motion.button whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }} onClick={() => setIsPasswordModalOpen(true)} className="bg-green-500 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
                <Key className="w-4 h-4" />
                Сменить пароль
              </motion.button>
              <motion.button whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }} onClick={handleDeleteUser} className="bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
                <Trash2 className="w-4 h-4" />
                Удалить
              </motion.button>
            </div>
          </motion.div>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Section title="Информация о пользователе" delay={0.2}>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    {user.fullName}
                  </h3>
                  <StatusBadge status={user.isActive ? "Выполнена" : "Отменена"} />
                </div>
                <p className="text-gray-800 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
                {user.phone && <p className="text-gray-800 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {user.phone}
                  </p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-gray-800 font-semibold mb-2">Основная информация</h4>
                    <ul className="space-y-2 text-gray-500">
                      <li><span className="font-medium">Логин:</span> {user.username}</li>
                      <li><span className="font-medium">Дата регистрации:</span> {formatDate(user.dateRegistered)}</li>
                      <li><span className="font-medium">Последний вход:</span> {formatDate(user.lastLoginDate)}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-gray-800 font-semibold mb-2">Библиотечная информация</h4>
                    <ul className="space-y-2 text-gray-500">
                      <li><span className="font-medium">Книг на руках:</span> {user.borrowedBooksCount}/{user.maxBooksAllowed}</li>
                      <li><span className="font-medium">Срок выдачи:</span> {user.loanPeriodDays || 14} дней</li>
                      <li><span className="font-medium">Штраф:</span> <span className={user.fineAmount > 0 ? "text-red-800" : ""}>{user.fineAmount.toFixed(2)} руб.</span></li>
                    </ul>
                  </div>
                </div>

              </div>
            </Section>
          </div>

          <div className="md:col-span-1">
            <Section title="Роли пользователя" delay={0.3}>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-gray-800 font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Назначенные роли
                  </h3>
                  <motion.button whileHover={{
                  scale: 1.05
                }} whileTap={{
                  scale: 0.95
                }} onClick={() => setIsAssigningRole(!isAssigningRole)} className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-3 py-1 flex items-center gap-1 shadow-md">
                    <Plus className="w-3 h-3" />
                    Добавить роль
                  </motion.button>
                </div>

                {isAssigningRole && <motion.div initial={{
                opacity: 0,
                height: 0
              }} animate={{
                opacity: 1,
                height: "auto"
              }} className="p-3 bg-blue-100 rounded-lg border border-blue-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block mb-1 text-gray-800 text-sm">Выберите роль:</label>
                        <select value={selectedRoleId} onChange={e => setSelectedRoleId(Number(e.target.value) || "")} className="w-full p-2 rounded-lg bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Выберите роль</option>
                          {filteredAvailableRoles.map(role => <option key={role.id} value={role.id}>
                              {role.name}
                            </option>)}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <motion.button whileHover={{
                      y: -2
                    }} whileTap={{
                      scale: 0.95
                    }} onClick={() => setIsAssigningRole(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg px-3 py-1 shadow-md border border-gray-200">
                          Отмена
                        </motion.button>
                        <motion.button whileHover={{
                      y: -2
                    }} whileTap={{
                      scale: 0.95
                    }} onClick={handleAssignRole} className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-3 py-1 shadow-md">
                          Назначить
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>}

                <div className="space-y-2">
                  {userRolesWithDetails.length > 0 ? userRolesWithDetails.map(role => <motion.div key={role.id} initial={{
                  opacity: 0,
                  x: -10
                }} animate={{
                  opacity: 1,
                  x: 0
                }} className="p-3 bg-gray-100 rounded-lg border border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-800">{role.name}</p>
                            <p className="text-gray-500 text-sm">{role.description}</p>
                          </div>
                        </div>
                        <motion.button whileHover={{
                    y: -2
                  }} whileTap={{
                    scale: 0.95
                  }} onClick={() => handleRemoveRole(role.id)} className="bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 p-1 rounded-lg shadow-md" title="Удалить роль">
                          <UserMinus className="w-4 h-4" />
                        </motion.button>
                      </motion.div>) : <p className="text-gray-500 text-center py-2">У пользователя нет ролей</p>}
                </div>
              
                <Link href="/admin/roles">
                  <motion.button whileHover={{
                  y: -2
                }} whileTap={{
                  scale: 0.95
                }} className="w-full mt-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 text-sm font-medium rounded-lg px-3 py-2 flex items-center justify-center gap-2 shadow-md">
                    <Shield className="w-4 h-4" />
                    Управление ролями
                  </motion.button>
                </Link>
              </div>
            </Section>
          </div>
        </div>

        <Section title="Книги на руках" delay={0.4}>
          {borrowedBooks.filter(book => !book.userId || book.userId === userId).length > 0 ? <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {borrowedBooks.filter(book => !book.userId || book.userId === userId).map((book, index) => <motion.div key={`${book.id}-${index}`} initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.1 * index
          }} className="p-3 max-w-xs bg-white rounded-lg border border-gray-200 flex items-start gap-3 mx-auto shadow-md">
                  {book.cover && <div className="w-14 h-20 relative flex-shrink-0 rounded-md overflow-hidden shadow-lg">
                      <Image src={book.cover} alt={book.title || "Книга"} fill style={{
                objectFit: "cover"
              }} className="rounded-md" />
                    </div>}
                  <div className="flex-grow">
                    <h4 className="font-semibold text-gray-800 mb-1 line-clamp-2">{book.title}</h4>
                    <p className="text-sm text-gray-500 mb-1 line-clamp-1">Автор: {book.author}</p>
                    <p className="text-sm text-gray-500">
                      Дата возврата: {formatDate(book.returnDate)}
                    </p>
                    {book.isFromReservation && <span className="text-xs text-blue-500 mt-1 inline-block"></span>}
                  </div>
                </motion.div>)}
            </div> : <p className="text-gray-500 text-center py-4">Пользователь не имеет книг на руках</p>}
        </Section>

        <Section title="Резервации пользователя" delay={0.5}>
          {reservations.filter(r => r.userId === userId).length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservations.filter(r => r.userId === userId).sort((a, b) => {
            const activeStatuses = ['Обрабатывается', 'Выдана'];
            const aIsActive = activeStatuses.includes(a.status);
            const bIsActive = activeStatuses.includes(b.status);
            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;
            return new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime();
          }).map((reservation, index) => <motion.div key={reservation.id} initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.1 * index
          }} className="p-4 bg-white rounded-lg border border-gray-200 shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800 line-clamp-2">{reservation.book?.title || "Неизвестная книга"}</h4>
                    <StatusBadge status={reservation.status} />
                  </div>
                  <p className="text-sm text-gray-500">Авторы: {reservation.book?.authors || "Не указаны"}</p>
                  <p className="text-sm text-gray-500">Зарезервировано до: {formatDate(reservation.expirationDate)}</p>
                  <p className="text-sm text-gray-500">Дата резервации: {formatDate(reservation.reservationDate)}</p>
                  {reservation.notes && <p className="text-xs italic mt-2 text-gray-500">Примечание: {reservation.notes}</p>}
                   <Link href={`/admin/reservations/${reservation.id}`}>
                    <motion.button whileHover={{
                scale: 1.05
              }} className="mt-3 w-full bg-blue-500 hover:bg-blue-700 text-white text-sm font-medium rounded-lg py-1.5 shadow-md">
                      К резервации
                    </motion.button>
                  </Link>
                </motion.div>)}
            </div> : <p className="text-gray-500 text-center py-4">У пользователя нет резерваций</p>}
        </Section>
      </main>

      {/* Модальное окно смены пароля */}
      {isPasswordModalOpen && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-green-500" />
                Смена пароля
              </h3>
              <motion.button whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.9
            }} onClick={closePasswordModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {passwordError && <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg text-sm">
                {passwordError}
              </div>}

            <form onSubmit={e => {
            e.preventDefault();
            handlePasswordChange();
          }} className="space-y-4">
              <div>
                <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-800 mb-1">
                  Текущий пароль
                </label>
                <input id="oldPassword" name="oldPassword" type="password" value={passwordForm.oldPassword} onChange={handlePasswordFormChange} required className="w-full p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-800 mb-1">
                  Новый пароль
                </label>
                <input id="newPassword" name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordFormChange} required minLength={6} className="w-full p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800 mb-1">
                  Подтвердите новый пароль
                </label>
                <input id="confirmPassword" name="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={handlePasswordFormChange} required minLength={6} className="w-full p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <motion.button whileHover={{
                y: -2
              }} whileTap={{
                scale: 0.95
              }} type="button" onClick={closePasswordModal} className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 font-medium rounded-lg px-4 py-2 shadow-md">
                  Отмена
                </motion.button>
                <motion.button whileHover={{
                y: -2
              }} whileTap={{
                scale: 0.95
              }} type="submit" disabled={isChangingPassword} className="bg-green-500 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md disabled:opacity-50">
                  {isChangingPassword && <motion.div animate={{
                  rotate: 360
                }} transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                  Сменить пароль
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>}
    </div>;
}