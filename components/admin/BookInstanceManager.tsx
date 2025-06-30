"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  DollarSign,
  Barcode,
  BookOpen,
  Zap,
  Copy,
  User,
  Clock
} from "lucide-react";
import { BookInstance } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { ButtonHoldAndRelease } from "@/components/ui/hold-and-release-button";

interface BookInstanceManagerProps {
  bookId: string;
  bookData?: {
    isbn?: string;
    title?: string;
  };
  onCreateInstance?: () => void;
  onEditInstance?: (instanceId: string) => void;
}

interface ReservationInfo {
  id: string;
  userId: string;
  userName: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
}

const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "доступна":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "выдана":
      return <Package className="w-4 h-4 text-blue-500" />;
    case "зарезервирована":
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    case "на обслуживании":
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    case "утеряна":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Package className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "доступна":
      return "bg-green-100 text-green-800";
    case "выдана":
      return "bg-blue-100 text-blue-800";
    case "зарезервирована":
      return "bg-yellow-100 text-yellow-800";
    case "на обслуживании":
      return "bg-orange-100 text-orange-800";
    case "утеряна":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const translateStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "доступна":
      return "Доступна";
    case "выдана":
      return "Выдана";
    case "зарезервирована":
      return "Зарезервирована";
    case "на обслуживании":
      return "На обслуживании";
    case "утеряна":
      return "Утеряна";
    default:
      return status;
  }
};

export default function BookInstanceManager({ 
  bookId, 
  bookData,
  onCreateInstance, 
  onEditInstance 
}: BookInstanceManagerProps) {
  const [instances, setInstances] = useState<BookInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [autoCreateLoading, setAutoCreateLoading] = useState(false);
  const [showMultipleCreateModal, setShowMultipleCreateModal] = useState(false);
  const [multipleCount, setMultipleCount] = useState(1);
  const [multipleCreateLoading, setMultipleCreateLoading] = useState(false);
  const [reservations, setReservations] = useState<{[instanceId: string]: ReservationInfo}>({});

  useEffect(() => {
    fetchInstances();
    
    // Слушаем события обновления экземпляров из других компонентов
    const handleInstanceUpdate = () => {
      fetchInstances();
    };
    
    window.addEventListener('instanceStatusUpdate', handleInstanceUpdate);
    
    return () => {
      window.removeEventListener('instanceStatusUpdate', handleInstanceUpdate);
    };
  }, [bookId]);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Ошибка авторизации",
          description: "Токен авторизации не найден. Пожалуйста, войдите в систему заново.",
          variant: "destructive"
        });
        return;
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(`${baseUrl}/api/BookInstance?bookId=${bookId}`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setInstances(data);
        // Получаем информацию о резервированиях для каждого экземпляра
        await fetchReservations(data);
      } else {
        console.warn('Не удалось загрузить экземпляры книги');
        setInstances([]);
      }
    } catch (error) {
      console.error("Ошибка загрузки экземпляров", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить экземпляры книги",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async (instances: BookInstance[]) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // Получаем все резервирования
      const response = await fetch(`${baseUrl}/api/Reservation`, {
        headers
      });
      
      if (response.ok) {
        const allReservations = await response.json();
        const reservationMap: {[instanceId: string]: ReservationInfo} = {};
        
        // Фильтруем резервирования для текущих экземпляров
        allReservations.forEach((reservation: any) => {
          if (reservation.bookInstanceId) {
            const instance = instances.find(inst => inst.id === reservation.bookInstanceId);
            if (instance) {
              reservationMap[reservation.bookInstanceId] = {
                id: reservation.id,
                userId: reservation.userId,
                userName: reservation.user?.fullName || 'Неизвестный пользователь',
                reservationDate: reservation.reservationDate,
                expirationDate: reservation.expirationDate,
                status: reservation.status,
                notes: reservation.notes
              };
            }
          }
        });
        
        setReservations(reservationMap);
      }
    } catch (error) {
      console.error("Ошибка загрузки резервирований", error);
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Ошибка авторизации",
          description: "Токен авторизации не найден. Пожалуйста, войдите в систему заново.",
          variant: "destructive"
        });
        return;
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(`${baseUrl}/api/BookInstance/${instanceId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Ошибка при удалении экземпляра');
      }

      setInstances(instances.filter(instance => instance.id !== instanceId));
      toast({
        title: "Успешно",
        description: "Экземпляр книги успешно удален"
      });
    } catch (error) {
      console.error("Ошибка удаления экземпляра", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить экземпляр книги",
        variant: "destructive"
      });
    }
  };

  const handleAutoCreateInstances = async () => {
    try {
      setAutoCreateLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const token = localStorage.getItem('token');

      if (!token) {
        toast({
          title: "Ошибка авторизации",
          description: "Токен авторизации не найден. Пожалуйста, войдите в систему заново.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`${baseUrl}/api/BookInstance/auto-create/${bookId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Ошибка при автосоздании экземпляров');
      }

      const result = await response.json();
      
      // Перезагружаем список экземпляров
      await fetchInstances();

      toast({
        title: "Успешно",
        description: result.message || `Создано ${result.createdCount} экземпляров`
      });
    } catch (error) {
      console.error("Ошибка автосоздания экземпляров", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать экземпляры",
        variant: "destructive"
      });
    } finally {
      setAutoCreateLoading(false);
    }
  };

  const handleCreateMultipleInstances = async () => {
    if (multipleCount <= 0 || multipleCount > 100) {
      toast({
        title: "Ошибка",
        description: "Количество экземпляров должно быть от 1 до 100",
        variant: "destructive"
      });
      return;
    }

    try {
      setMultipleCreateLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const token = localStorage.getItem('token');

      if (!token) {
        toast({
          title: "Ошибка авторизации",
          description: "Токен авторизации не найден. Пожалуйста, войдите в систему заново.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`${baseUrl}/api/BookInstance/create-multiple/${bookId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(multipleCount)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Ошибка при создании экземпляров');
      }

      const result = await response.json();
      
      // Перезагружаем список экземпляров
      await fetchInstances();

      setShowMultipleCreateModal(false);
      setMultipleCount(1);

      toast({
        title: "Успешно",
        description: result.message || `Создано ${result.createdCount} экземпляров`
      });
    } catch (error) {
      console.error("Ошибка создания экземпляров", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать экземпляры",
        variant: "destructive"
      });
    } finally {
      setMultipleCreateLoading(false);
    }
  };

  const filteredInstances = instances.filter(instance => {
    const matchesSearch = 
      instance.instanceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instance.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instance.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (instance.location && instance.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || instance.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: instances.length,
    available: instances.filter(i => i.status.toLowerCase() === 'доступна').length,
    borrowed: instances.filter(i => i.status.toLowerCase() === 'выдана').length,
    reserved: instances.filter(i => i.status.toLowerCase() === 'зарезервирована').length,
    maintenance: instances.filter(i => i.status.toLowerCase() === 'на обслуживании').length,
    lost: instances.filter(i => i.status.toLowerCase() === 'утеряна').length,
  };

  const renderReservationInfo = (instance: BookInstance) => {
    const reservation = reservations[instance.id];
    
    if (!reservation) {
      return null;
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const getReservationStatusColor = (status: string) => {
      switch (status) {
        case "Обрабатывается":
          return "bg-blue-100 text-blue-800";
        case "Одобрена":
          return "bg-green-100 text-green-800";
        case "Отменена":
          return "bg-red-100 text-red-800";
        case "Истекла":
          return "bg-orange-100 text-orange-800";
        case "Выдана":
          return "bg-purple-100 text-purple-800";
        case "Возвращена":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-800">Информация о резервировании</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Пользователь:</span>
            <span className="font-medium text-gray-800">{reservation.userName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Дата резервирования:</span>
            <span className="text-gray-800">{formatDate(reservation.reservationDate)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Срок действия:</span>
            <span className="text-gray-800">{formatDate(reservation.expirationDate)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Статус:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReservationStatusColor(reservation.status)}`}>
              {reservation.status}
            </span>
          </div>
          
          {reservation.notes && (
            <div className="pt-2 border-t border-blue-200">
              <span className="text-gray-600">Примечания:</span>
              <p className="text-gray-800 mt-1">{reservation.notes}</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-300 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-800">Экземпляры книги</h3>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
            {instances.length}
          </span>
        </div>
        
        <div className="flex gap-2">
          <motion.button
            onClick={onCreateInstance}
            className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-3 py-2 flex items-center gap-2 shadow-md text-sm"
            whileHover={{
              y: -2,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            Добавить
          </motion.button>

          <motion.button
            onClick={handleAutoCreateInstances}
            disabled={autoCreateLoading || !bookData?.isbn}
            className={`${
              bookData?.isbn 
                ? "bg-green-500 hover:bg-green-700 text-white" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } font-medium rounded-lg px-3 py-2 flex items-center gap-2 shadow-md disabled:opacity-50 text-sm`}
            whileHover={bookData?.isbn ? {
              y: -2,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
            } : {}}
            whileTap={bookData?.isbn ? { scale: 0.98 } : {}}
            title={!bookData?.isbn ? "Отсутствует ISBN для автосоздания" : "Автоматически создать экземпляры"}
          >
            {autoCreateLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Авто
          </motion.button>

          <motion.button
            onClick={() => setShowMultipleCreateModal(true)}
            disabled={!bookData?.isbn}
            className={`${
              bookData?.isbn 
                ? "bg-purple-500 hover:bg-purple-700 text-white" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } font-medium rounded-lg px-3 py-2 flex items-center gap-2 shadow-md disabled:opacity-50 text-sm`}
            whileHover={bookData?.isbn ? {
              y: -2,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
            } : {}}
            whileTap={bookData?.isbn ? { scale: 0.98 } : {}}
            title={!bookData?.isbn ? "Отсутствует ISBN для создания экземпляров" : "Создать несколько экземпляров"}
          >
            <Copy className="h-4 w-4" />
            Несколько
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <motion.button
          onClick={() => setStatusFilter("all")}
          className={`p-3 rounded-lg border transition-all ${
            statusFilter === "all" 
              ? "bg-blue-100 border-blue-500 text-blue-800" 
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center">
            <div className="text-lg font-bold">{statusCounts.all}</div>
            <div className="text-xs">Всего</div>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setStatusFilter("available")}
          className={`p-3 rounded-lg border transition-all ${
            statusFilter === "available" 
              ? "bg-green-100 border-green-500 text-green-800" 
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center">
            <div className="text-lg font-bold">{statusCounts.available}</div>
            <div className="text-xs">Доступно</div>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setStatusFilter("borrowed")}
          className={`p-3 rounded-lg border transition-all ${
            statusFilter === "borrowed" 
              ? "bg-blue-100 border-blue-500 text-blue-800" 
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center">
            <div className="text-lg font-bold">{statusCounts.borrowed}</div>
            <div className="text-xs">Выдано</div>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setStatusFilter("reserved")}
          className={`p-3 rounded-lg border transition-all ${
            statusFilter === "reserved" 
              ? "bg-yellow-100 border-yellow-500 text-yellow-800" 
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center">
            <div className="text-lg font-bold">{statusCounts.reserved}</div>
            <div className="text-xs">Зарезервировано</div>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setStatusFilter("maintenance")}
          className={`p-3 rounded-lg border transition-all ${
            statusFilter === "maintenance" 
              ? "bg-orange-100 border-orange-500 text-orange-800" 
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center">
            <div className="text-lg font-bold">{statusCounts.maintenance}</div>
            <div className="text-xs">Обслуживание</div>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setStatusFilter("lost")}
          className={`p-3 rounded-lg border transition-all ${
            statusFilter === "lost" 
              ? "bg-red-100 border-red-500 text-red-800" 
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center">
            <div className="text-lg font-bold">{statusCounts.lost}</div>
            <div className="text-xs">Утеряно</div>
          </div>
        </motion.button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Поиск экземпляров..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Instances List */}
      {filteredInstances.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchQuery || statusFilter !== "all" 
              ? "Экземпляры не найдены" 
              : "Нет экземпляров для этой книги"
            }
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {searchQuery || statusFilter !== "all"
              ? "Попробуйте изменить параметры поиска"
              : "Добавьте первый экземпляр этой книги"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredInstances.map((instance, index) => (
              <motion.div
                key={instance.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Barcode className="w-4 h-4 text-gray-500" />
                        <span className="font-mono text-lg font-bold text-gray-800">
                          {instance.instanceCode}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {getStatusIcon(instance.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
                          {translateStatus(instance.status)}
                        </span>
                      </div>
                      
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {instance.condition}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Поступила: {new Date(instance.dateAcquired).toLocaleDateString('ru-RU')}</span>
                      </div>
                      
                      {instance.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>Местоположение: {instance.location}</span>
                        </div>
                      )}
                      
                      {instance.purchasePrice && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Цена: {instance.purchasePrice} ₽</span>
                        </div>
                      )}
                    </div>
                    
                    {instance.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Примечания:</span> {instance.notes}
                      </div>
                    )}

                    {/* Информация о резервировании */}
                    {renderReservationInfo(instance)}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <motion.button
                      onClick={() => onEditInstance?.(instance.id)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-md"
                      whileHover={{
                        y: -2,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="text-sm">Ред.</span>
                    </motion.button>
                    
                    <ButtonHoldAndRelease 
                      onAction={() => handleDeleteInstance(instance.id)}
                      className="px-3 py-1.5 shadow-md"
                      holdDuration={2000}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-sm ml-1">Удал.</span>
                    </ButtonHoldAndRelease>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Multiple Create Modal */}
      <AnimatePresence>
        {showMultipleCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => !multipleCreateLoading && setShowMultipleCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <Copy className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Создать несколько экземпляров
                </h3>
                <p className="text-gray-600">
                  Укажите количество экземпляров для создания
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Количество экземпляров (1-100)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={multipleCount}
                  onChange={(e) => setMultipleCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={multipleCreateLoading}
                />
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => !multipleCreateLoading && setShowMultipleCreateModal(false)}
                  disabled={multipleCreateLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg py-2 px-4 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Отмена
                </motion.button>
                
                <motion.button
                  onClick={handleCreateMultipleInstances}
                  disabled={multipleCreateLoading || multipleCount <= 0 || multipleCount > 100}
                  className="flex-1 bg-purple-500 hover:bg-purple-700 text-white font-medium rounded-lg py-2 px-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {multipleCreateLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Создать
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 