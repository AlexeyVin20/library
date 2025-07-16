'use client';

import type React from "react";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, UserPlus, ChevronRight, ArrowRight, ChevronLeft, Shield, BookOpen, LucideUser, LucideUserRound, LucideBook } from "lucide-react";

import { CreateUserDialog } from "@/components/ui/user-creation-modal";
import { USER_ROLES } from "@/lib/types";
import GlassCard from "@/components/glass-card";

// CSS для анимации строк таблицы
const fadeInAnimation = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
`;
interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  borrowedBooksCount: number;
  maxBooksAllowed: number;
  fineAmount: number;
  isActive: boolean;
  phone: string;
  role: string;
  rolesData?: { roleId: number; roleName: string }[];
  userRoles?: { roleId: number; roleName: string }[];
}
interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  book?: {
    title: string;
  };
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
const LoadingSpinner = () => <div className="flex flex-col justify-center items-center h-screen">
    <motion.div animate={{
    rotate: 360
  }} transition={{
    duration: 1.5,
    repeat: Number.POSITIVE_INFINITY,
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

// Добавляем определение компонента Section
const Section = ({
  title,
  children,
  action,
  delay = 0
}: {
  title: string;
  children: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
  delay?: number;
}) => <FadeInView delay={delay}>
    <motion.div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-200" whileHover={{
    y: -5,
    boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)"
  }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {action && <Link href={action.href}>
            <motion.span className="text-blue-500 hover:text-blue-700 transition-colors text-sm font-medium flex items-center" whileHover={{
          x: 3
        }}>
              {action.label}
              <ChevronRight className="w-4 h-4 ml-1" />
            </motion.span>
          </Link>}
      </div>
      <div className="flex-1">{children}</div>
    </motion.div>
  </FadeInView>;
export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof User>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  const [hoverState, setHoverState] = useState<{ id: string | null; position: "left" | "right" | "top" | "bottom"; coords: { top: number; left: number } }>({ id: null, position: "right", coords: { top: 0, left: 0 } });
  const [previewState, setPreviewState] = useState<{ id: string | null; position: "left" | "right" | "top" | "bottom"; coords: { top: number; left: number } }>({ id: null, position: "right", coords: { top: 0, left: 0 } });
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Вставка CSS анимации в DOM
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Токен авторизации не найден");
      }
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [usersResponse, reservationsResponse] = await Promise.all([
        fetch(`${baseUrl}/api/User`, { headers }),
        fetch(`${baseUrl}/api/Reservation`, { headers }),
      ]);

      if (!usersResponse.ok) throw new Error("Ошибка при загрузке пользователей");
      if (!reservationsResponse.ok) throw new Error("Ошибка при загрузке резерваций");
      const usersData = await usersResponse.json();
      const reservationsData = await reservationsResponse.json();
      setUsers(usersData);
      setReservations(reservationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMouseEnter = (event: React.MouseEvent<HTMLTableCellElement>, userId: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const previewWidth = 500; // Ширина превью
    const previewHeight = 900; // Высота превью
    const previewMargin = 16; // Отступ

    const hasSpaceOnRight = rect.right + previewMargin + previewWidth <= window.innerWidth;
    const hasSpaceOnLeft = rect.left - previewMargin - previewWidth >= 0;
    const hasSpaceOnBottom = rect.bottom + previewMargin + previewHeight <= window.innerHeight;
    const hasSpaceOnTop = rect.top - previewMargin - previewHeight >= 0;

    // Определяем наилучшую позицию и координаты
    let position: "left" | "right" | "top" | "bottom" = "right";
    let top = rect.top;
    let left = rect.right + previewMargin;

    if (hasSpaceOnRight) {
      position = "right";
      left = rect.right + previewMargin;
      top = Math.max(previewMargin, Math.min(rect.top, window.innerHeight - previewHeight - previewMargin));
    } else if (hasSpaceOnLeft) {
      position = "left";
      left = rect.left - previewWidth - previewMargin;
      top = Math.max(previewMargin, Math.min(rect.top, window.innerHeight - previewHeight - previewMargin));
    } else if (hasSpaceOnBottom) {
      position = "bottom";
      top = rect.bottom + previewMargin;
      left = Math.max(previewMargin, Math.min(rect.left, window.innerWidth - previewWidth - previewMargin));
    } else if (hasSpaceOnTop) {
      position = "top";
      top = rect.top - previewHeight - previewMargin;
      left = Math.max(previewMargin, Math.min(rect.left, window.innerWidth - previewWidth - previewMargin));
    } else {
      // Если нигде не помещается полностью, показываем справа с корректировкой по краям
      position = "right";
      left = Math.min(rect.right + previewMargin, window.innerWidth - previewWidth - previewMargin);
      top = Math.max(previewMargin, Math.min(rect.top, window.innerHeight - previewHeight - previewMargin));
    }

    setHoverState({ id: userId, position, coords: { top, left } });
  };

  const handleMouseLeave = () => {
    // Задержка скрытия, чтобы дать время мыши перейти на превью
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    hoverTimeout.current = setTimeout(() => {
      if (!isPreviewHovered) {
        setPreviewState({ id: null, position: "right", coords: { top: 0, left: 0 } });
      }
    }, 200);
  };
  
  useEffect(() => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    if (hoverState.id) {
      hoverTimeout.current = setTimeout(() => {
        setPreviewState(hoverState);
      }, 700);
    }
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, [hoverState]);
  
  useEffect(() => {
    if (!isPreviewHovered && previewState.id === null) {
      setHoverState({ id: null, position: "right", coords: { top: 0, left: 0 } });
    }
  }, [isPreviewHovered, previewState.id]);

  const usersWithNextReturn = useMemo(() => users.map(user => {
    const userReservations = reservations.filter(r => r.userId === user.id && r.status === "Выполнена");
    const nextReservation = userReservations.length > 0 ? userReservations.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())[0] : null;
    return {
      ...user,
      nextReturnDate: nextReservation?.expirationDate ? new Date(nextReservation.expirationDate).toLocaleDateString("ru-RU") : "Нет",
      nextReturnBook: nextReservation?.book?.title || "Нет"
    };
  }), [users, reservations]);
  const filteredUsers = useMemo(() => usersWithNextReturn.filter(user => user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())), [usersWithNextReturn, searchTerm]);
  const sortedUsers = useMemo(() => [...filteredUsers].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  }), [filteredUsers, sortField, sortDirection]);
  const activeUsersCount = useMemo(() => users.filter(u => u.isActive).length, [users]);
  const totalBorrowed = useMemo(() => users.reduce((sum, user) => sum + user.borrowedBooksCount, 0), [users]);
  const totalFines = useMemo(() => users.reduce((sum, user) => sum + (user.fineAmount || 0), 0), [users]);
  const finesData = useMemo(() => users.filter(u => u.fineAmount > 0).map(u => ({
    name: u.fullName,
    value: u.fineAmount
  })), [users]);
  const borrowingChartData = useMemo(() => ({
    borrowed: totalBorrowed,
    available: users.reduce((sum, user) => sum + (user.maxBooksAllowed - user.borrowedBooksCount), 0),
    reservations: reservations.filter(r => r.status === "Обрабатывается").length
  }), [users, reservations, totalBorrowed]);
  const handleDeleteUser = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Токен авторизации не найден");
      const response = await fetch(`${baseUrl}/api/User/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Ошибка при удалении пользователя");
      setUsers(users.filter(user => user.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка при удалении пользователя");
    }
  }, [users, baseUrl]);

  const handleCreateUser = useCallback(async (userData: any) => {
    try {
      // Убираем флаг назначения роли из данных пользователя
      const { _assignEmployeeRole, ...userDataToSend } = userData;
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Токен авторизации не найден");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      
      const response = await fetch(`${baseUrl}/api/User`, {
        method: "POST",
        headers,
        body: JSON.stringify(userDataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при создании пользователя");
      }

      const newUser = await response.json();
      
      // Если нужно назначить роль "Сотрудник"
      if (_assignEmployeeRole) {
        try {
          const assignRoleResponse = await fetch(`${baseUrl}/api/User/assign-role`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              userId: newUser.id,
              roleId: USER_ROLES.EMPLOYEE.id
            }),
          });

          if (!assignRoleResponse.ok) {
            console.warn("Не удалось назначить роль пользователю, но пользователь создан");
          }
        } catch (roleError) {
          console.warn("Ошибка при назначении роли:", roleError);
        }
      }
      
      setUsers(prev => [...prev, newUser]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Ошибка при создании пользователя");
    }
  }, [baseUrl]);
  const handleSort = (field: keyof User) => {
    setSortField(field);
    setSortDirection(sortField === field && sortDirection === "asc" ? "desc" : "asc");
  };
  const handleAssignRole = async (user) => {
    if (!selectedRoleId) {
      setError("Выберите роль для назначения");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Токен авторизации не найден");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const response = await fetch(`${baseUrl}/api/User/assign-role`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: user.id,
          roleId: selectedRoleId
        })
      });
      if (!response.ok) throw new Error("Ошибка при назначении роли");
      // Найти лимиты для выбранной роли
      const roleObj = Object.values(USER_ROLES).find(r => r.id === Number(selectedRoleId));
      if (roleObj) {
        await fetch(`${baseUrl}/api/User/${user.id}/update-limits`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            maxBooksAllowed: roleObj.maxBooksAllowed,
            loanPeriodDays: roleObj.loanPeriodDays
          })
        });
      }
      fetchData();
      setSelectedRoleId("");
      setIsAssigningRole(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при назначении роли");
    }
  };
  if (loading) return <LoadingSpinner />;
  if (error) return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} className="flex flex-col items-center justify-center h-screen p-6 bg-gray-200">
        <div className="bg-red-100 text-red-800 p-6 rounded-xl border border-red-200 max-w-md w-full text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Произошла ошибка</h2>
          <p>{error}</p>
          <motion.button whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }} onClick={() => window.location.reload()} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md">
            Попробовать снова
          </motion.button>
        </div>
      </motion.div>;
  return <div className="min-h-screen bg-gray-200">
      <main className="max-w-7xl mx-auto space-y-8 p-6">
        <FadeInView>
          <div className="mb-8 flex items-center gap-4">
            <motion.div initial={{
            x: -20,
            opacity: 0
          }} animate={{
            x: 0,
            opacity: 1
          }} transition={{
            duration: 0.5
          }}>
              <Link href="/admin" className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors">
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Назад</span>
              </Link>
            </motion.div>

            <motion.h1 initial={{
            opacity: 0,
            y: -20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.1
          }} className="text-3xl font-bold text-gray-800">
              Пользователи
            </motion.h1>

            <div className="ml-auto flex gap-3">
              <Link href="/admin/users/quick-overview">
                <motion.button className="bg-green-500 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" whileHover={{
                y: -3,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
              }} whileTap={{
                scale: 0.98
              }}>
                  <BookOpen className="h-4 w-4" />
                  Быстрый просмотр
                </motion.button>
              </Link>
              <Link href="/admin/roles">
                <motion.button className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" whileHover={{
                y: -3,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
              }} whileTap={{
                scale: 0.98
              }}>
                  <Shield className="h-4 w-4" />
                  Управление ролями
                </motion.button>
              </Link>
              <motion.button 
                onClick={() => setCreateUserDialogOpen(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" 
                whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                }} 
                whileTap={{
                  scale: 0.98
                }}
              >
                <UserPlus className="h-4 w-4" />
                Добавить пользователя
              </motion.button>
            </div>
          </div>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/admin/statistics">
            <GlassCard
              title="Активные пользователи"
              value={activeUsersCount}
              subtitle={`из ${users.length} пользователей`}
              icon={<LucideUserRound />}
            />
          </Link>
          <Link href="/admin/users/quick-overview">
            <GlassCard
              title="Взято книг"
              value={totalBorrowed}
              subtitle="всего на руках"
              icon={<LucideBook />}
            />
          </Link>
        </div>

        
        <Section title="Список пользователей" delay={0.7}>
          <motion.input type="text" placeholder="Поиск по имени или email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 mb-4 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.8
        }} />
          <div className="max-h-[800px] bg-white rounded-xl overflow-hidden border border-gray-200">
            <div className="overflow-auto" style={{
            height: 800
          }}>
              <table className="min-w-full" cellPadding={0} cellSpacing={0}>
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider cursor-pointer min-w-[140px]" onClick={() => handleSort("fullName")}>Имя {sortField === "fullName" && (sortDirection === "asc" ? "↑" : "↓")}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider cursor-pointer min-w-[140px]" onClick={() => handleSort("email")}>Email {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider cursor-pointer min-w-[80px]" onClick={() => handleSort("borrowedBooksCount")}>Книги {sortField === "borrowedBooksCount" && (sortDirection === "asc" ? "↑" : "↓")}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider min-w-[100px]">Роль</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider min-w-[120px]">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.slice(0, 50).map((user, index) => {
                    let mainRole = user.role || "Гость";
                    let badgeClass = "bg-gray-100 text-gray-700 border border-gray-300";
                    if (Array.isArray(user.userRoles) && user.userRoles.length > 0) {
                      const sortedRoles = [...user.userRoles].sort((a, b) => a.roleId - b.roleId);
                      mainRole = sortedRoles[0].roleName;
                    }
                    if (mainRole === "Администратор") badgeClass = "bg-blue-100 text-blue-700 border border-blue-300";
                    else if (mainRole === "Сотрудник") badgeClass = "bg-green-100 text-green-700 border border-green-300";
                    else if (mainRole === "Читатель") badgeClass = "bg-yellow-100 text-yellow-700 border border-yellow-300";
                    else if (mainRole === "Гость") badgeClass = "bg-gray-100 text-gray-700 border border-gray-300";
                    return (
                      <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100" style={{
                        opacity: 0,
                        transform: "translateX(-20px)",
                        animation: `fadeIn 0.5s ease-out ${0.1 * index}s forwards`,
                        height: 56 // фиксированная высота строки
                      }}>
                        <td className="px-6 py-4 text-gray-800 align-middle cursor-pointer"
                          onMouseEnter={(e) => handleMouseEnter(e, user.id)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <Link href={`/admin/users/${user.id}`} className="hover:underline">
                            {user.fullName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-800 align-middle">{user.email}</td>
                        <td className="px-6 py-4 text-gray-800 align-middle">{user.borrowedBooksCount}/{user.maxBooksAllowed}</td>
                        <td className="px-6 py-4 text-gray-800 align-middle">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${badgeClass}`}>{mainRole}</span>
                        </td>
                        <td className="px-6 py-4 flex gap-2 align-middle">
                          <Link href={`/admin/users/${user.id}`}>
                            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-3 py-1 shadow-md">Подробнее</motion.button>
                          </Link>
                          <motion.button 
                            onClick={() => {
                              if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
                                handleDeleteUser(user.id);
                              }
                            }}
                            className="bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 px-3 py-1 shadow-md rounded font-medium"
                            whileHover={{ y: -2 }} 
                            whileTap={{ scale: 0.95 }}
                          >
                            Удалить
                          </motion.button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {sortedUsers.length === 0 && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="text-center py-8 text-gray-500">
            Нет пользователей, соответствующих критериям поиска
          </motion.div>}
      </main>

      <CreateUserDialog 
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
        onCreateUser={handleCreateUser}
      />
    </div>;
}