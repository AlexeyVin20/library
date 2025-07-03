"use client";

import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Search, 
  CheckCircle, 
  XCircle,
  Plus,
  Eye,
  CreditCard,
  AlertTriangle,
  FileText,
  User,
  ChevronDown,
  ChevronUp,
  Clock,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateFineDialog } from "@/components/ui/fine-creation-modal";

// Интерфейс для отдельного штрафа
interface FineRecord {
  id: string;
  userId: string;
  reservationId?: string;
  amount: number;
  reason: string;
  overdueDays?: number;
  createdAt: string;
  paidAt?: string;
  isPaid: boolean;
  notes?: string;
  calculatedForDate?: string;
  fineType: string;
  userName: string;
  bookTitle?: string;
}

// Интерфейс для данных о штрафах пользователя
interface UserFineData {
  userId: string;
  userName: string;
  totalFineAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  totalFines: number;
  paidFines: number;
  unpaidFines: number;
  fineRecords: FineRecord[];
}

// Интерфейс для пользователя со штрафами из API
interface UserWithFines {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  fineAmount: number;
}

interface UsersWithFinesResponse {
  totalUsersWithFines: number;
  totalFineAmount: number;
  users: UserWithFines[];
}

interface FineStats {
  totalUsers: number;
  totalFineAmount: number;
}

const FadeInView = ({ 
  children, 
  delay = 0 
}: { 
  children: React.ReactNode; 
  delay?: number; 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
  delay = 0,
  onClick
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
  onClick?: () => void;
}) => (
  <FadeInView delay={delay}>
    <motion.div 
      className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between border border-gray-200 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)" }}
      onClick={onClick}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${color}`}></div>
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${color.replace("bg-", "text-")}`}>
          {icon}
          {title}
        </h3>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${color.replace("bg-", "bg-").replace(/-(500|400|600)/, "-100")}`}>
          <span className={color.replace("bg-", "text-")}>
            {icon}
          </span>
        </div>
      </div>
      <div>
        <p className={`text-4xl font-bold mb-2 ${color.replace("bg-", "text-")}`}>{value}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </motion.div>
  </FadeInView>
);

const UserFineCard = ({ 
  user, 
  onAddFine, 
  onViewDetails 
}: { 
  user: UserWithFines; 
  onAddFine: (userId: string) => void;
  onViewDetails: (userId: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [userFineDetails, setUserFineDetails] = useState<UserFineData | null>(null);
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  const fetchUserFineDetails = async () => {
    if (userFineDetails) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${baseUrl}/api/User/${user.id}/fines`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserFineDetails(data);
      }
    } catch (err) {
      console.error("Ошибка при загрузке деталей штрафов:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
    if (!expanded) {
      fetchUserFineDetails();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)}₽`;
  };

  const getFineTypeLabel = (type: string) => {
    switch (type) {
      case "Overdue": return "Просрочка";
      case "Damage": return "Повреждение";
      case "Lost": return "Утеря";
      case "Manual": return "Ручной";
      default: return type;
    }
  };

  const getFineTypeColor = (type: string) => {
    switch (type) {
      case "Overdue": return "bg-orange-100 text-orange-800";
      case "Damage": return "bg-red-100 text-red-800";
      case "Lost": return "bg-purple-100 text-purple-800";
      case "Manual": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      {/* Заголовок карточки */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{user.fullName}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">Текущий штраф</div>
              <div className="text-lg font-bold text-red-600">{formatCurrency(user.fineAmount)}</div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => onAddFine(user.id)}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                Начислить
              </Button>
              
              <Button
                onClick={() => onViewDetails(user.id)}
                variant="outline"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-1 text-black" />
                <span className="text-black">Профиль</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Кнопка развернуть/свернуть */}
        <Button
          onClick={handleToggleExpand}
          variant="ghost"
          className="mt-4 w-full flex items-center justify-center gap-2"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Свернуть детали
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Показать историю штрафов
            </>
          )}
        </Button>
      </div>

      {/* Развернутые детали */}
      {expanded && (
        <div className="p-6 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full"
              />
            </div>
          ) : userFineDetails ? (
            <div className="space-y-6">
              {/* Общая статистика по штрафам */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-sm text-gray-500">Всего штрафов</div>
                  <div className="text-xl font-bold text-gray-800">{userFineDetails.totalFines}</div>
                  <div className="text-xs text-gray-400">
                    Оплачено: {userFineDetails.paidFines} | Не оплачено: {userFineDetails.unpaidFines}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-sm text-gray-500">Оплачено</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(userFineDetails.paidAmount)}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-sm text-gray-500">К доплате</div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(userFineDetails.unpaidAmount)}</div>
                </div>
              </div>

              {/* Список штрафов */}
              {userFineDetails.fineRecords.length > 0 ? (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">История штрафов</h4>
                  <div className="space-y-3">
                    {userFineDetails.fineRecords.map((fine) => (
                      <div key={fine.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getFineTypeColor(fine.fineType)}`}>
                                {getFineTypeLabel(fine.fineType)}
                              </span>
                              {fine.isPaid ? (
                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  Оплачено
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-600 text-sm">
                                  <XCircle className="w-4 h-4" />
                                  Не оплачено
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-800 mb-1">
                              <strong>Причина:</strong> {fine.reason}
                            </div>
                            
                            {fine.bookTitle && (
                              <div className="text-sm text-gray-600 mb-1">
                                <strong>Книга:</strong> {fine.bookTitle}
                              </div>
                            )}
                            
                            {fine.notes && (
                              <div className="text-sm text-gray-500 mb-1">
                                <strong>Примечания:</strong> {fine.notes}
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-400 mt-2">
                              Создано: {formatDate(fine.createdAt)}
                              {fine.paidAt && (
                                <span className="ml-2">
                                  | Оплачено: {formatDate(fine.paidAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-gray-800">
                              {formatCurrency(fine.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>История штрафов пуста</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Не удалось загрузить детали штрафов</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center h-64">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full"
    />
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-4 text-blue-500 font-medium"
    >
      Загрузка данных...
    </motion.p>
  </div>
);

export default function FinesPage() {
  const [usersWithFines, setUsersWithFines] = useState<UserWithFines[]>([]);
  const [stats, setStats] = useState<FineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  const fetchUsersWithFines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${baseUrl}/api/User/with-fines`);

      if (!response.ok) {
        throw new Error("Ошибка при загрузке пользователей со штрафами");
      }

      const data: UsersWithFinesResponse = await response.json();
      setUsersWithFines(data.users || []);
      
      setStats({
        totalUsers: data.totalUsersWithFines,
        totalFineAmount: data.totalFineAmount
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchUsersWithFines();
  }, [fetchUsersWithFines]);

  const handleCloseModal = (open: boolean) => {
    setShowCreateModal(open);
    if (!open) {
      setSelectedUserId(undefined);
    }
  };

  const handleAddFine = (userId: string) => {
    setSelectedUserId(userId);
    setShowCreateModal(true);
  };

  const handleViewDetails = (userId: string) => {
    window.location.href = `/admin/users/${userId}`;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)}₽`;
  };

  const handleCreateFine = async (fineData: {
    userId: string;
    amount: number;
    reason: string;
    fineType: string;
    notes?: string;
    reservationId?: string;
    overdueDays?: number;
  }) => {
    try {
      const response = await fetch(`${baseUrl}/api/User/${fineData.userId}/fine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: fineData.amount,
          reason: fineData.reason,
          fineType: fineData.fineType,
          notes: fineData.notes,
          reservationId: fineData.reservationId,
          overdueDays: fineData.overdueDays
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Ошибка при начислении штрафа");
      }
      
      // Обновляем список пользователей со штрафами после успешного создания
      await fetchUsersWithFines();
      
      // Сбрасываем состояние модального окна
      setShowCreateModal(false);
      setSelectedUserId(undefined);
    } catch (error) {
      console.error("Ошибка при начислении штрафа:", error);
      throw error; // Пробрасываем ошибку для обработки в модальном окне
    }
  };

  const filteredUsers = useMemo(() => 
    usersWithFines.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    ), [usersWithFines, searchTerm]
  );

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium">Ошибка загрузки данных</p>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
            <Button onClick={fetchUsersWithFines} className="mt-3" size="sm">
              Повторить попытку
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Назад к админ-панели
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Управление штрафами</h1>
              <p className="text-gray-500">Ручное начисление и управление штрафами пользователей</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Со штрафами"
              value={stats.totalUsers}
              subtitle="пользователей имеют штрафы"
              icon={<User className="w-5 h-5" />}
              color="bg-red-500"
              delay={0.1}
            />
            <StatCard
              title="Сумма штрафов"
              value={formatCurrency(stats.totalFineAmount)}
              subtitle="общая сумма задолженности"
              icon={<DollarSign className="w-5 h-5" />}
              color="bg-orange-500"
              delay={0.2}
            />
            <StatCard
              title="Средний штраф"
              value={stats.totalUsers > 0 ? formatCurrency(stats.totalFineAmount / stats.totalUsers) : "0₽"}
              subtitle="на одного пользователя"
              icon={<CreditCard className="w-5 h-5" />}
              color="bg-purple-500"
              delay={0.3}
            />
          </div>
        )}

        {/* Поиск и фильтры */}
        <FadeInView delay={0.4}>
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Поиск по имени, email или логину..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setSelectedUserId(undefined);
                    setShowCreateModal(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Начислить штраф
                </Button>
              </div>
            </div>
          </div>
        </FadeInView>

        {/* Список пользователей со штрафами */}
        <FadeInView delay={0.5}>
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-red-500" />
                    Пользователи со штрафами
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Найдено {filteredUsers.length} пользователей со штрафами
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {filteredUsers.length > 0 ? (
                <div className="space-y-6">
                  {filteredUsers.map((user) => (
                    <UserFineCard
                      key={user.id}
                      user={user}
                      onAddFine={handleAddFine}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? "Не найдено пользователей со штрафами по вашему запросу" : "Нет пользователей со штрафами"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </FadeInView>
      </div>

      {/* Модальное окно создания штрафа */}
      <CreateFineDialog
        open={showCreateModal}
        onOpenChange={handleCloseModal}
        onCreateFine={handleCreateFine}
        selectedUserId={selectedUserId}
      />
    </div>
  );
}