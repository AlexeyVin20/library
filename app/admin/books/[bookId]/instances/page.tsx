"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Search,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  DollarSign,
  Zap,
  Copy
} from "lucide-react";
import { BookInstance, BookDto } from "@/lib/types";
import { ButtonHoldAndRelease } from "@/components/ui/hold-and-release-button";

interface Book {
  id: string;
  title: string;
  authors: string;
  isbn: string;
  cover?: string;
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
    case "обрабатывается":
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    case "одобрена":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "отменена":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "истекла":
      return <XCircle className="w-4 h-4 text-gray-500" />;
    case "выдана":
      return <Package className="w-4 h-4 text-blue-500" />;
    case "возвращена":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "просрочена":
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case "отменена_пользователем":
      return <XCircle className="w-4 h-4 text-orange-500" />;
    default:
      return <Package className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "обрабатывается":
      return "bg-yellow-100 text-yellow-800";
    case "одобрена":
      return "bg-green-100 text-green-800";
    case "отменена":
      return "bg-red-100 text-red-800";
    case "истекла":
      return "bg-gray-100 text-gray-800";
    case "выдана":
      return "bg-blue-100 text-blue-800";
    case "возвращена":
      return "bg-green-100 text-green-600";
    case "просрочена":
      return "bg-red-100 text-red-600";
    case "отменена_пользователем":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const translateStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "обрабатывается":
      return "Обрабатывается";
    case "одобрена":
      return "Одобрена";
    case "отменена":
      return "Отменена";
    case "истекла":
      return "Истекла";
    case "выдана":
      return "Выдана";
    case "возвращена":
      return "Возвращена";
    case "просрочена":
      return "Просрочена";
    case "отменена_пользователем":
      return "Отменена пользователем";
    default:
      return status;
  }
};

export default function BookInstancesPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const [book, setBook] = useState<Book | null>(null);
  const [instances, setInstances] = useState<BookInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoCreateLoading, setAutoCreateLoading] = useState(false);
  const [showMultipleCreateModal, setShowMultipleCreateModal] = useState(false);
  const [multipleCount, setMultipleCount] = useState(1);
  const [multipleCreateLoading, setMultipleCreateLoading] = useState(false);

  const resolvedParams = use(params);
  const bookId = resolvedParams.bookId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        
        // Получаем токен авторизации
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему заново.');
        }
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        // Загружаем информацию о книге и её экземплярах
        const [bookResponse, instancesResponse] = await Promise.all([
          fetch(`${baseUrl}/api/books/${bookId}`, { headers }),
          fetch(`${baseUrl}/api/BookInstance?bookId=${bookId}`, { headers })
        ]);

        if (!bookResponse.ok) {
          throw new Error('Ошибка при получении информации о книге');
        }

        const bookData = await bookResponse.json();
        setBook({
          id: bookData.id,
          title: bookData.title,
          authors: bookData.authors,
          isbn: bookData.isbn,
          cover: bookData.cover
        });

        if (instancesResponse.ok) {
          const instancesData = await instancesResponse.json();
          setInstances(instancesData);
        } else {
          console.warn('Не удалось загрузить экземпляры книги');
          setInstances([]);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Функция для обработки обновлений статуса экземпляров из других компонентов
    const handleInstanceUpdate = () => {
      fetchData();
    };
    
    // Слушаем события обновления экземпляров
    window.addEventListener('instanceStatusUpdate', handleInstanceUpdate);
    
    return () => {
      window.removeEventListener('instanceStatusUpdate', handleInstanceUpdate);
    };
  }, [bookId]);

  const updateBookInfo = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Принудительно пересчитываем количество доступных копий через API
      try {
        const recalculateResponse = await fetch(`${baseUrl}/api/BookInstance/recalculate/${bookId}`, {
          method: 'POST',
          headers
        });
        
        if (recalculateResponse.ok) {
          console.log("Количество копий пересчитано принудительно");
        } else {
          console.warn("Не удалось пересчитать количество копий через API");
        }
      } catch (recalculateError) {
        console.warn("Ошибка при принудительном пересчете:", recalculateError);
      }

      // Перезагружаем информацию о книге для обновления количества копий
      const bookResponse = await fetch(`${baseUrl}/api/books/${bookId}`, { headers });
      if (bookResponse.ok) {
        const bookData = await bookResponse.json();
        setBook({
          id: bookData.id,
          title: bookData.title,
          authors: bookData.authors,
          isbn: bookData.isbn,
          cover: bookData.cover
        });
        console.log("Обновлена информация о книге, доступные копии:", bookData.availableCopies);
        
        // Дополнительная проверка: считаем активные экземпляры локально
        const activeInstancesCount = instances.filter(instance => 
          instance.isActive && 
          instance.status !== 'Утеряна' && 
          instance.status !== 'Списана'
        ).length;
        
        const availableInstancesCount = instances.filter(instance => 
          instance.isActive && 
          instance.status.toLowerCase() === 'доступна'
        ).length;
        
        console.log("Локальный подсчет активных экземпляров:", activeInstancesCount);
        console.log("Локальный подсчет доступных экземпляров:", availableInstancesCount);
        console.log("Статистика экземпляров:", {
          всего: instances.length,
          активных: activeInstancesCount,
          доступных: availableInstancesCount,
          выданных: instances.filter(i => i.status.toLowerCase() === 'выдана' && i.isActive).length,
          зарезервированных: instances.filter(i => i.status.toLowerCase() === 'зарезервирована' && i.isActive).length,
          неактивных: instances.filter(i => !i.isActive).length
        });
        
        if (bookData.availableCopies !== activeInstancesCount) {
          console.warn(
            `Несоответствие количества: API показывает ${bookData.availableCopies}, ` +
            `локально ${activeInstancesCount} активных экземпляров, ` +
            `${availableInstancesCount} доступных экземпляров`
          );
        }
      }
    } catch (error) {
      console.error("Ошибка обновления информации о книге", error);
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

      console.log(`Экземпляр ${instanceId} успешно удален с сервера`);
      
      // Обновляем локальный список экземпляров
      const newInstances = instances.filter(instance => instance.id !== instanceId);
      setInstances(newInstances);
      console.log(`Осталось экземпляров: ${newInstances.length}`);
      
      // Обновляем информацию о книге после удаления экземпляра
      await updateBookInfo();
      
      // Уведомляем другие компоненты об изменении экземпляров
      window.dispatchEvent(new CustomEvent('bookInstancesUpdated', { 
        detail: { bookId, action: 'delete', instanceId, remainingInstances: newInstances.length } 
      }));
      
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
      const instancesResponse = await fetch(`${baseUrl}/api/BookInstance?bookId=${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        setInstances(instancesData);
      }

      // Обновляем информацию о книге после создания экземпляров
      await updateBookInfo();

      // Уведомляем другие компоненты об изменении экземпляров
      window.dispatchEvent(new CustomEvent('bookInstancesUpdated', { 
        detail: { bookId, action: 'create', count: result.createdCount } 
      }));

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
      const instancesResponse = await fetch(`${baseUrl}/api/BookInstance?bookId=${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        setInstances(instancesData);
      }

      // Обновляем информацию о книге после создания экземпляров
      await updateBookInfo();

      // Уведомляем другие компоненты об изменении экземпляров
      window.dispatchEvent(new CustomEvent('bookInstancesUpdated', { 
        detail: { bookId, action: 'createMultiple', count: result.createdCount } 
      }));

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

  const filteredInstances = instances.filter(instance => 
    instance.instanceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instance.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instance.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (instance.location && instance.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">Книга не найдена</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="container mx-auto p-6">
        {/* Header */}
        <FadeInView>
          <motion.div 
            className="sticky top-0 z-10 bg-white border border-gray-100 p-6 rounded-xl shadow-md mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/admin/books/${bookId}`}>
                  <motion.button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md border"
                    whileHover={{
                      y: -3,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Назад к книге
                  </motion.button>
                </Link>
                
                <div className="flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-500" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Экземпляры книги</h1>
                    <p className="text-gray-600">{book.title}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center">
                <Link href={`/admin/books/${bookId}/instances/create`}>
                  <motion.button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md"
                    whileHover={{
                      y: -3,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="h-4 w-4" />
                    Добавить экземпляр
                  </motion.button>
                </Link>

                <motion.button
                  onClick={handleAutoCreateInstances}
                  disabled={autoCreateLoading || !book?.isbn}
                  className={`${
                    book?.isbn 
                      ? "bg-green-500 hover:bg-green-700 text-white" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  } font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md disabled:opacity-50`}
                  whileHover={book?.isbn ? {
                    y: -3,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                  } : {}}
                  whileTap={book?.isbn ? { scale: 0.98 } : {}}
                  title={!book?.isbn ? "Отсутствует ISBN для автосоздания" : "Автоматически создать экземпляры"}
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
                  Авто-создание
                </motion.button>

                <motion.button
                  onClick={() => setShowMultipleCreateModal(true)}
                  disabled={!book?.isbn}
                  className={`${
                    book?.isbn 
                      ? "bg-purple-500 hover:bg-purple-700 text-white" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  } font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md disabled:opacity-50`}
                  whileHover={book?.isbn ? {
                    y: -3,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                  } : {}}
                  whileTap={book?.isbn ? { scale: 0.98 } : {}}
                  title={!book?.isbn ? "Отсутствует ISBN для создания экземпляров" : "Создать несколько экземпляров"}
                >
                  <Copy className="h-4 w-4" />
                  Создать несколько
                </motion.button>

                                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Поиск экземпляров..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border border-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-10 pr-4 py-2 text-gray-800 shadow-md placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </FadeInView>

        {/* Book Info */}
        <FadeInView delay={0.1}>
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-4">
              {book.cover && (
                <div className="w-16 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={book.cover} 
                    alt={book.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-800">{book.title}</h2>
                <p className="text-gray-600">{book.authors}</p>
                <p className="text-sm text-gray-500">ISBN: {book.isbn}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-blue-600">
                    Всего экземпляров: {instances.length}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    Доступно: {instances.filter(i => i.status.toLowerCase() === 'доступна' && i.isActive).length}
                  </span>
                  <span className="text-sm font-medium text-yellow-600">
                    Выдано: {instances.filter(i => i.status.toLowerCase() === 'выдана' && i.isActive).length}
                  </span>
                  <span className="text-sm font-medium text-purple-600">
                    Зарезервировано: {instances.filter(i => i.status.toLowerCase() === 'зарезервирована' && i.isActive).length}
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    Неактивно: {instances.filter(i => !i.isActive).length}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </FadeInView>

        {/* Instances List */}
        <FadeInView delay={0.2}>
          {filteredInstances.length === 0 ? (
            <motion.div 
              className="bg-white rounded-xl p-12 shadow-md border border-gray-100 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-xl text-gray-800">Экземпляры не найдены</p>
              <p className="mt-2 text-gray-500">
                {searchQuery ? "Попробуйте изменить параметры поиска" : "Добавьте первый экземпляр этой книги"}
              </p>
              <Link href={`/admin/books/${bookId}/instances/create`}>
                <motion.button
                  className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md mx-auto"
                  whileHover={{
                    y: -3,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="h-4 w-4" />
                  Добавить экземпляр
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="grid gap-4 p-6">
                {filteredInstances.map((instance, index) => (
                  <motion.div
                    key={instance.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.3 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-mono text-lg font-bold text-gray-800">
                            {instance.instanceCode}
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
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Link href={`/admin/books/${bookId}/instances/${instance.id}/update`}>
                          <motion.button
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
                        </Link>
                        
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
              </div>
            </motion.div>
          )}
        </FadeInView>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800"
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
    </div>
  );
} 