import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Loader2, AlertCircle, Mouse, Users, Tag, BookText, Calendar, Building, Info, GripVertical, Package, CheckCircle, XCircle, BookOpen, Heart, Clock, Home, TrendingUp, Search, Filter, Star, Shield, Bookmark, BarChart2, Bell, Plus, Eye, Edit3, Copy, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookInstance } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

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
    case "доступна":
        return "bg-green-100 text-green-800";
    case "выдана":
        return "bg-red-100 text-red-800";
    case "обрабатывается":
      return "bg-yellow-100 text-yellow-800";
    case "одобрена":
      return "bg-green-100 text-green-800";
    case "отменена":
      return "bg-red-100 text-red-800";
    case "истекла":
      return "bg-gray-100 text-gray-800";
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
    if (!status) return "Неизвестно";
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

interface Book {
  id: string;
  title: string;
  authors: string | string[];
  genre?: string;
  isbn?: string;
  publicationYear?: number;
  publisher?: string;
  availableCopies?: number;
  categorization?: string;
  instances?: BookInstance[];
}

interface UserData {
  id: string;
  fullName: string;
  email: string;
  username: string;
  borrowedBooksCount: number;
  maxBooksAllowed: number;
  fineAmount: number;
  isActive: boolean;
  phone?: string;
  role?: string;
  userRoles?: { roleId: number; roleName: string }[];
  reservations?: any[];
  avatarUrl?: string;
}

// Интерфейс для данных предварительного просмотра API
interface PreviewData {
  title: string;
  description: string;
  stats?: {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }[];
  preview?: React.ReactNode;
  loading?: boolean;
}

export interface IframePagePreviewCenteredProps {
  route: string;
  isVisible: boolean;
  className?: string;
  delay?: number;
  enableScrollControl?: boolean;
  displayMode?: 'iframe' | 'api' | 'quick';
  coords: { top: number; left: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// Статические данные для быстрого предварительного просмотра
const getQuickPreviewContent = (route: string) => {
  switch (route) {
    case '/readers':
      return {
        title: 'Главная страница',
        description: 'Поиск книг, рекомендации и новинки',
        features: [
          { icon: <Search className="h-4 w-4" />, text: 'Умный поиск' },
          { icon: <TrendingUp className="h-4 w-4" />, text: 'Популярные книги' },
          { icon: <Star className="h-4 w-4" />, text: 'Рекомендации' }
        ],
        color: 'from-blue-500 to-purple-600',
        bgColor: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
      };
    
    case '/admin/books/create':
      return {
        title: 'Добавить книгу',
        description: 'Форма для добавления новой книги в каталог',
        features: [
          { icon: <BookOpen className="h-4 w-4" />, text: 'Автоматический ввод данных книги' },
          { icon: <Star className="h-4 w-4" />, text: 'Авто загрузка обложки' },
          { icon: <TrendingUp className="h-4 w-4" />, text: 'Поиск по ISBN' }
        ],
        color: 'from-green-500 to-lime-600',
        bgColor: 'bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-900/20 dark:to-lime-900/20'
      };

    case '/admin/roles':
      return {
        title: 'Управление ролями',
        description: 'Создание и редактирование пользовательских ролей',
        features: [
          { icon: <Shield className="h-4 w-4" />, text: 'Настройка разрешений' },
          { icon: <Users className="h-4 w-4" />, text: 'Назначение ролей пользователям' }
        ],
        color: 'from-purple-500 to-indigo-600',
        bgColor: 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20'
      };

    case '/admin/notifications':
      return {
        title: 'Уведомления',
        description: 'Просмотр и управление системными уведомлениями',
        features: [
          { icon: <Bell className="h-4 w-4" />, text: 'Отметка как прочитанных' },
          { icon: <AlertCircle className="h-4 w-4" />, text: 'Приоритеты' }
        ],
        color: 'from-pink-500 to-rose-600',
        bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20'
      };
    
    default:
      return {
        title: 'Страница',
        description: 'Информация о странице',
        features: [],
        color: 'from-gray-500 to-gray-600',
        bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20'
      };
  }
};

// Хук для получения данных предварительного просмотра API
const usePagePreview = (route: string, isVisible: boolean): PreviewData => {
  const [data, setData] = useState<PreviewData>({
    title: '',
    description: '',
    loading: true
  });

  const { user } = useAuth();

  useEffect(() => {
    if (!isVisible) return;

    const fetchPreviewData = async () => {
      setData(prev => ({ ...prev, loading: true }));
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        
        switch (route) {
          case '/admin/users/quick-overview':
            // Получаем быстрый обзор пользователей
            const [usersResponse, booksResponse] = await Promise.all([
              fetch(`${baseUrl}/api/User`).catch(() => null),
              fetch(`${baseUrl}/api/books`).catch(() => null)
            ]);
            
            const usersCount = usersResponse?.ok ? (await usersResponse.json()).length : 0;
            const booksCount = booksResponse?.ok ? (await booksResponse.json()).length : 0;
            
            setData({
              title: 'Быстрый обзор пользователей',
              description: 'Статистика пользователей системы',
              stats: [
                { label: 'Всего пользователей', value: usersCount, icon: <Users className="h-4 w-4" /> },
                { label: 'Книг в каталоге', value: booksCount, icon: <BookOpen className="h-4 w-4" /> }
              ],
              loading: false
            });
            break;

          default:
            setData({
              title: 'Предварительный просмотр',
              description: 'Информация недоступна',
              loading: false
            });
            break;
        }
      } catch (error) {
        console.error('Ошибка загрузки данных предварительного просмотра:', error);
        setData({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные',
          loading: false
        });
      }
    };

    fetchPreviewData();
  }, [route, isVisible, user]);

  return data;
};

function isAvailableInstance(status: string) {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return [
    'доступна',
    'available',
    'в наличии',
    'свободна',
    'free',
    'готова к выдаче',
  ].includes(s);
}

function isIssuedInstance(status: string) {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return [
    'выдана',
    'выдан',
    'issued',
    'выдана читателю',
    'занята',
    'занят',
    'checked out',
  ].includes(s);
}

export const IframePagePreviewCentered: React.FC<IframePagePreviewCenteredProps> = ({
  route,
  isVisible,
  className,
  delay = 800,
  enableScrollControl = true,
  displayMode = 'iframe',
  coords,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [bookData, setBookData] = useState<Book | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const dragControls = useDragControls();

  const entityId = route.split('/').pop();
  
  // Данные для разных режимов
  const quickContent = getQuickPreviewContent(route);
  const apiData = usePagePreview(route, isVisible && displayMode === 'api');

  useEffect(() => {
    const disableBodyScroll = () => {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px';
    };
    const enableBodyScroll = () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
    if (isVisible && enableScrollControl) {
      disableBodyScroll();
    } else {
      enableBodyScroll();
    }
    return () => enableBodyScroll();
  }, [isVisible, enableScrollControl]);

  useEffect(() => {
    if (displayMode !== 'iframe' || !isVisible) {
      setShouldLoad(false);
      setIsLoading(true);
      setHasError(false);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    if (isVisible) {
      timeoutId = setTimeout(() => {
        setShouldLoad(true);
      }, delay);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, delay, displayMode]);

  useEffect(() => {
    if (displayMode === 'api' && isVisible && entityId && route.includes('/books/')) {
      setIsFetchingData(true);
      const fetchBookWithInstances = async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
          
          const token = localStorage.getItem('token');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const [bookResponse, instancesResponse] = await Promise.all([
            fetch(`${baseUrl}/api/books/${entityId}`, { headers }),
            fetch(`${baseUrl}/api/BookInstance?bookId=${entityId}`, { headers })
          ]);

          if (bookResponse.ok) {
            const bookData = await bookResponse.json();
            let bookInstances = [];
            if (instancesResponse.ok) {
                bookInstances = await instancesResponse.json();
            }
            setBookData({ ...bookData, instances: bookInstances });
          } else {
            setBookData(null);
          }
        } catch (error) {
          console.error("Failed to fetch book data for preview:", error);
          setBookData(null);
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchBookWithInstances();
    } else if (displayMode !== 'api' || !route.includes('/books/')) {
      setIsFetchingData(false);
      setBookData(null);
    }
  }, [displayMode, isVisible, entityId, route]);

  useEffect(() => {
    if (displayMode === 'api' && isVisible && entityId && route.includes('/users/') && !route.includes('quick-overview')) {
      setIsFetchingData(true);
      const fetchUserData = async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
          const token = localStorage.getItem('token');
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const [userResponse, reservationsResponse] = await Promise.all([
            fetch(`${baseUrl}/api/User/${entityId}`, { headers }),
            fetch(`${baseUrl}/api/Reservation?userId=${entityId}`, { headers })
          ]);

          if (userResponse.ok) {
            const fetchedUserData = await userResponse.json();
            const userReservations = reservationsResponse.ok ? await reservationsResponse.json() : [];
            setUserData({ ...fetchedUserData, reservations: userReservations });
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error("Failed to fetch user data for preview:", error);
          setUserData(null);
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchUserData();
    } else {
        setUserData(null);
    }
  }, [displayMode, isVisible, entityId, route]);


  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };
  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          drag
          dragListener={false}
          dragControls={dragControls}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, zIndex: 9999 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: coords?.top || 0,
            left: coords?.left || 0,
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={cn(
            'z-[9999] transform-gpu',
            displayMode === 'iframe' ? 'w-[800px] h-[750px]' : 'w-[500px] h-[800px]',
            className
          )}
        >
          <Card className={cn(
            "backdrop-blur-xl overflow-hidden transition-all duration-300 h-full flex flex-col",
            displayMode === 'iframe' 
              ? "bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-600 shadow-xl border-blue-500 shadow-2xl"
              : "bg-white/98 dark:bg-gray-900/98 border border-blue-200 dark:border-blue-700 shadow-2xl shadow-blue-500/20 rounded-xl"
          )}>
            {displayMode === 'iframe' ? (
              <div 
                onPointerDown={(e) => dragControls.start(e)}
                className="drag-handle p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 cursor-move flex items-center justify-between text-xs select-none"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                    <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex gap-1.5 items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 font-mono truncate ml-2" title={route}>{route}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <a href={route} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500" title="Открыть в новой вкладке">
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>
            </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 text-center">
                <h3 className="font-semibold text-sm">{quickContent?.title || 'Предварительный просмотр'}</h3>
              </div>
            )}
            <CardContent className="p-0 h-full flex flex-col">
              {/* Quick Preview Mode */}
              {displayMode === 'quick' && (
                <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
                  <div className="p-4">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {quickContent.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {quickContent.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <div className="text-white text-xs">
                                {feature.icon}
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.text}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* API Preview Mode for Books */}
              {displayMode === 'api' && route.includes('/books/') && (
                <div className="h-full overflow-y-auto bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20">
                  {isFetchingData ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : bookData ? (
                    <div className="p-4 space-y-3">
                      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-2">{bookData.title}</h3>
                          </div>
                        </div>
                        
                        {/* Быстрые действия с экземплярами */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <a
                            href={`/admin/books/${bookData.id}/instances`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Все экземпляры
                          </a>
                          <a
                            href={`/admin/books/${bookData.id}/instances/create`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Добавить экземпляр
                          </a>
                          <a
                            href={`/admin/books/${bookData.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Редактировать
                          </a>
                        </div>
                      
                                              <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Авторы</span>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{Array.isArray(bookData.authors) ? bookData.authors.join(', ') : bookData.authors}</p>
                        </div>
                        
                        {/* Статистика по экземплярам */}
                        {bookData.instances && bookData.instances.length > 0 && (
                          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-3 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Статистика экземпляров</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <div className="font-bold text-lg text-blue-600">{bookData.instances.length}</div>
                                <div className="text-gray-500">Всего</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-lg text-green-600">{bookData.instances.filter(inst => isAvailableInstance(inst.status)).length}</div>
                                <div className="text-gray-500">Доступно</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-lg text-red-600">{bookData.instances.filter(inst => isIssuedInstance(inst.status)).length}</div>
                                <div className="text-gray-500">Выдано</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {bookData.genre && (<div className="flex items-start gap-3">
                        <Tag className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-600">Жанр:</span>
                          <p className="text-gray-800">{bookData.genre}</p>
                        </div>
                      </div>)}
                      
                      {bookData.isbn && (<div className="flex items-start gap-3">
                        <BookText className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-600">ISBN:</span>
                          <p className="text-gray-800">{bookData.isbn}</p>
                        </div>
                      </div>)}

                      {bookData.publisher && (<div className="flex items-start gap-3">
                        <Building className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-600">Издательство:</span>
                          <p className="text-gray-800">{bookData.publisher}</p>
                        </div>
                      </div>)}
                      
                      {bookData.publicationYear && (<div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-600">Год издания:</span>
                          <p className="text-gray-800">{bookData.publicationYear}</p>
                        </div>
                      </div>)}
                      
                      {bookData.categorization && (<div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-600">Категоризация:</span>
                          <p className="text-gray-800">{bookData.categorization}</p>
                        </div>
                      </div>)}

                      {bookData.instances && bookData.instances.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-600 mt-4 border-t pt-3 flex items-center justify-between">
                            <span>Экземпляры ({bookData.instances.length}):</span>
                            <div className="flex gap-1">
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                Доступно: {bookData.instances.filter(inst => isAvailableInstance(inst.status)).length}
                              </span>
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                Выдано: {bookData.instances.filter(inst => isIssuedInstance(inst.status)).length}
                              </span>
                            </div>
                          </h4>
                          <div className="max-h-64 overflow-y-auto mt-2 space-y-2 pr-2">
                            {bookData.instances.map(inst => (
                              <div key={inst.id} className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                <div className="flex items-center justify-between font-mono text-base mb-2">
                                    <span className="font-bold text-gray-800">{inst.instanceCode}</span>
                                    <div className="flex items-center gap-1.5">
                                        {getStatusIcon(inst.status)}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inst.status)}`}>
                                            {translateStatus(inst.status)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <Info className="w-3 h-3 text-gray-400" />
                                        <span>Состояние: <strong>{inst.condition}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span>Получена: <strong>{new Date(inst.dateAcquired).toLocaleDateString()}</strong></span>
                                    </div>
                                    {inst.location && (
                                        <div className="flex items-center gap-1.5 col-span-2">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            <span>Расположение: <strong>{inst.location}</strong></span>
                                        </div>
                                    )}
                                </div>

                                {/* Быстрые действия для экземпляра */}
                                <div className="flex gap-1 pt-2 border-t border-gray-200">
                                  <a
                                    href={`/admin/books/${bookData.id}/instances/${inst.id}/update`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                                    title="Редактировать экземпляр"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    Ред.
                                  </a>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(inst.instanceCode);
                                      toast({
                                        title: "Скопировано!",
                                        description: `Код экземпляра "${inst.instanceCode}" скопирован в буфер обмена.`,
                                      });
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                                    title="Скопировать код экземпляра"
                                  >
                                    <Copy className="w-3 h-3" />
                                    Код
                                  </button>
                                  <a
                                    href={`/admin/books/${bookData.id}/instances/${inst.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs transition-colors"
                                    title="Посмотреть подробности"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Детали
                                  </a>
                                </div>

                                {inst.notes && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 italic">
                                        <Info className="w-3 h-3 inline mr-1" />
                                        "{inst.notes}"
                                    </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!bookData.instances || bookData.instances.length === 0 && (
                        <div className="mt-4 border-t pt-3">
                          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Нет экземпляров</span>
                            </div>
                            <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">
                              У этой книги пока нет экземпляров. Создайте экземпляр для добавления физических копий в библиотеку.
                            </p>
                            <a
                              href={`/admin/books/${bookData.id}/instances/create`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Создать первый экземпляр
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-red-500">
                      <AlertCircle className="w-6 h-6 mr-2" />
                      <span>Не удалось загрузить информацию о книге.</span>
                    </div>
                  )}
                </div>
              )}

              {/* API Preview Mode for Users */}
              {displayMode === 'api' && route.includes('/users/') && !route.includes('quick-overview') && (
                 <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
                  {isFetchingData ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    </div>
                  ) : userData ? (
                    <div className="p-4 space-y-3">
                       <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-700/50">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                            {userData.avatarUrl ? <img src={userData.avatarUrl} alt={userData.fullName} className="w-full h-full rounded-full object-cover" /> : userData.fullName?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2">{userData.fullName}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{userData.email}</p>
                          </div>
                        </div>
                         <div className="flex flex-wrap gap-2 mb-4">
                           <a href={`/admin/users/${userData.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            Профиль
                          </a>
                           <a href={`/admin/users/${userData.id}/update`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                            Редактировать
                          </a>
                        </div>
                         <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg">
                            <div className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Телефон</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{userData.phone || 'Не указан'}</div>
                          </div>
                          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg">
                            <div className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Почта</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{userData.email || 'Не указан'}</div>
                          </div>
                          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg">
                            <div className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Роль</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{userData.userRoles?.[0]?.roleName || 'Не указана'}</div>
                          </div>
                          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg">
                            <div className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Статус</div>
                            <div className={`font-semibold ${userData.isActive ? 'text-green-600' : 'text-red-600'}`}>{userData.isActive ? 'Активен' : 'Не активен'}</div>
                          </div>
                          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg">
                            <div className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Книг на руках</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{userData.borrowedBooksCount} / {userData.maxBooksAllowed}</div>
                          </div>
                          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg">
                            <div className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Штраф</div>
                            <div className="font-semibold text-red-500">{userData.fineAmount > 0 ? `${userData.fineAmount} ₽` : 'Нет'}</div>
                          </div>
                          
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-red-500">
                        <AlertCircle className="w-6 h-6 mr-2" />
                        <span>Не удалось загрузить информацию о пользователе.</span>
                    </div>
                  )}
                </div>
              )}

              {/* API Preview Mode for Other Pages */}
              {displayMode === 'api' && !route.includes('/books/') && !route.includes('/users/') && (
                <div className="h-full overflow-y-auto bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-red-900/20 p-4">
                  {apiData.loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <div className="space-y-4 text-gray-800">
                      <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">{apiData.title}</h3>
                      <p className="text-sm text-gray-600">{apiData.description}</p>
                      
                      {apiData.stats && apiData.stats.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {apiData.stats.map((stat, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                {stat.icon}
                                <span className="text-xs font-medium text-gray-600">{stat.label}</span>
                              </div>
                              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {apiData.preview && (
                        <div className="mt-4 border-t pt-3">
                          {apiData.preview}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {displayMode === 'iframe' && (
                <div className="relative bg-gray-100 dark:bg-gray-800 flex-1">
                  {!shouldLoad ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Подготовка предварительного просмотра...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                          <div className="text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Загрузка страницы...
                            </p>
                          </div>
                        </div>
                      )}
                      {hasError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                          <div className="text-center">
                            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Не удалось загрузить предварительный просмотр
                            </p>
                          </div>
                        </div>
                      )}
                      <iframe
                        ref={iframeRef}
                        src={`${route}?preview=true`}
                        className="w-full h-full border-none"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        style={{
                          transform: 'scale(0.5)',
                          transformOrigin: 'top left',
                          width: '200%',
                          height: '200%',
                          pointerEvents: 'auto',
                          transition: 'transform 0.3s ease-out'
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IframePagePreviewCentered; 