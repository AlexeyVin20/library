import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Heart, Clock, Home, Loader2, ExternalLink, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface PagePreviewProps {
  route: string;
  isVisible: boolean;
  onClose?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

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

// Компонент для скелетона загрузки
const PreviewSkeleton = () => (
  <div className="space-y-3">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
    <div className="space-y-2">
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
    </div>
  </div>
);

// Хук для получения данных предварительного просмотра
const usePagePreview = (route: string, isVisible: boolean): PreviewData => {
  const [data, setData] = useState<PreviewData>({
    title: '',
    description: '',
    loading: true
  });

  // Получаем текущего пользователя для персонализированных запросов
  const { user } = useAuth();

  useEffect(() => {
    if (!isVisible) return;

    const fetchPreviewData = async () => {
      setData(prev => ({ ...prev, loading: true }));
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        
        switch (route) {
          case '/readers':
            // Получаем статистику для главной страницы
            const [booksResponse, favoritesResponse] = await Promise.all([
              fetch(`${baseUrl}/api/books`).catch(() => null),
              fetch(`${baseUrl}/api/FavoriteBook`).catch(() => null)
            ]);
            
            const booksCount = booksResponse?.ok ? (await booksResponse.json()).length : 0;
            const favoritesCount = favoritesResponse?.ok ? (await favoritesResponse.json()).length : 0;
            
            setData({
              title: 'Главная страница',
              description: 'Добро пожаловать в библиотечную систему СИНАПС',
              stats: [
                { label: 'Всего книг', value: booksCount, icon: <BookOpen className="h-4 w-4" /> },
                { label: 'В избранном', value: favoritesCount, icon: <Heart className="h-4 w-4" /> }
              ],
              loading: false
            });
            break;

          case '/readers/books':
            // Получаем данные каталога книг
            const catalogResponse = await fetch(`${baseUrl}/api/books`).catch(() => null);
            const catalogBooks = catalogResponse?.ok ? await catalogResponse.json() : [];
            
            const genresSet = new Set(catalogBooks.map((book: any) => book.genre).filter(Boolean));
            
            setData({
              title: 'Каталог книг',
              description: 'Просмотр всех доступных книг с фильтрацией и поиском',
              stats: [
                { label: 'Книг в каталоге', value: catalogBooks.length, icon: <BookOpen className="h-4 w-4" /> },
                { label: 'Жанров', value: genresSet.size, icon: <Badge className="h-4 w-4" /> }
              ],
              preview: (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen className="h-4 w-4" />
                    <span>Поиск, фильтры, сортировка</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {catalogBooks.slice(0, 3).map((book: any, index: number) => (
                      <div key={index} className="h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                      </div>
                    ))}
                  </div>
                </div>
              ),
              loading: false
            });
            break;

          case '/readers/favorites':
            // Получаем избранные книги
            const favResponse = await fetch(`${baseUrl}/api/FavoriteBook`).catch(() => null);
            const favorites = favResponse?.ok ? await favResponse.json() : [];
            
            setData({
              title: 'Избранные книги',
              description: 'Ваши любимые книги в одном месте',
              stats: [
                { label: 'Избранных книг', value: favorites.length, icon: <Heart className="h-4 w-4" /> }
              ],
              loading: false
            });
            break;

          case '/readers/history':
            // Если пользователь не авторизован, выводим плейсхолдер
            if (!user) {
              setData({
                title: 'История чтения',
                description: 'Требуется вход для просмотра просроченных книг',
                loading: false
              });
              break;
            }

            // Получаем историю бронирований конкретного пользователя
            const historyResponse = await fetch(`${baseUrl}/api/Reservation/user/${user.id}`).catch(() => null);
            const history = historyResponse?.ok ? await historyResponse.json() : [];

            // Фильтруем просроченные записи
            const overdue = history.filter((item: any) => ['просрочена', 'истекла'].includes((item?.status || '').toLowerCase()));
            const overdueCount = overdue.length;

            // Получаем детали книг (обложки) для первых трёх просроченных записей
            const overduePreview = await Promise.all(
              overdue.slice(0, 5).map(async (item: any) => {
                if (item?.book?.cover) return item; // уже есть обложка

                try {
                  const bookRes = await fetch(`${baseUrl}/api/books/${item.bookId}`).catch(() => null);
                  if (bookRes?.ok) {
                    const bookDetails = await bookRes.json();
                    return {
                      ...item,
                      book: {
                        ...item.book,
                        ...bookDetails
                      }
                    };
                  }
                } catch (_) { /* ignore */ }
                return item;
              })
            );

            setData({
              title: 'История чтения',
              description: 'Быстрый обзор просроченных книг',
              stats: [
                { label: 'Просроченных', value: overdueCount, icon: <AlertCircle className="h-4 w-4" /> },
                { label: 'Всего записей', value: history.length, icon: <Clock className="h-4 w-4" /> }
              ],
              preview: overdueCount > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Просроченные книги</span>
                  </div>
                  <div className="flex gap-2">
                    {overduePreview.map((item: any, idx: number) => (
                      <div key={idx} className="w-12 h-16 relative rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {item?.book?.cover ? (
                          <img src={item.book.cover} alt={item.book.title || 'Обложка'} className="object-cover w-full h-full" />
                        ) : (
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    ))}
                    {overdueCount > overduePreview.length && (
                      <div className="w-12 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-500 dark:text-gray-400">
                        +{overdueCount - overduePreview.length}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Нет просроченных книг</span>
                </div>
              ),
              loading: false
            });
            break;

          case '/admin/users/quick-overview':
            // Получаем краткую статистику пользователей с книгами и штрафами
            const [booksQuick, finesQuick] = await Promise.all([
              fetch(`${baseUrl}/api/User/with-books`).catch(() => null),
              fetch(`${baseUrl}/api/User/with-fines`).catch(() => null)
            ]);

            const booksJson = booksQuick?.ok ? await booksQuick.json() : null;
            const finesJson = finesQuick?.ok ? await finesQuick.json() : null;

            const totalUsers = booksJson?.totalUsers || 0;
            const totalBorrowed = booksJson?.totalBorrowedBooks || 0;
            const totalFines = finesJson?.totalUsersWithFines || 0;
            const totalOverdue = finesJson?.totalOverdueBooks || 0;

            setData({
              title: 'Быстрый обзор пользователей',
              description: 'Статистика пользователей с книгами и задолженностями',
              stats: [
                { label: 'С книгами', value: totalUsers, icon: <Users className="h-4 w-4" /> },
                { label: 'Книг на руках', value: totalBorrowed, icon: <BookOpen className="h-4 w-4" /> },
                { label: 'Должников', value: totalFines, icon: <AlertCircle className="h-4 w-4" /> },
                { label: 'Проср. книг', value: totalOverdue, icon: <Clock className="h-4 w-4" /> }
              ],
              loading: false
            });
            break;

          default:
            setData({
              title: 'Страница',
              description: 'Предварительный просмотр недоступен',
              loading: false
            });
        }
      } catch (error) {
        console.error('Ошибка загрузки предварительного просмотра:', error);
        setData({
          title: 'Ошибка загрузки',
          description: 'Не удалось загрузить предварительный просмотр',
          loading: false
        });
      }
    };

    // Добавляем небольшую задержку для избежания лишних запросов
    const timeoutId = setTimeout(fetchPreviewData, 300);
    return () => clearTimeout(timeoutId);
  }, [route, isVisible]);

  return data;
};

export const PagePreview: React.FC<PagePreviewProps> = ({
  route,
  isVisible,
  onClose,
  position = 'bottom',
  className
}) => {
  const previewData = usePagePreview(route, isVisible);

  const getPositionClasses = (position: 'top' | 'bottom' | 'left' | 'right') => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default:
        return 'top-full mt-2';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "absolute z-[500] w-80",
            getPositionClasses(position),
            className
          )}
        >
          <Card className="backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-600 shadow-xl">
            <CardContent className="p-4">
              {previewData.loading ? (
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Загрузка...</span>
                </div>
              ) : (
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {previewData.title}
                  </h3>
                  <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              )}

              {previewData.loading ? (
                <PreviewSkeleton />
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {previewData.description}
                  </p>

                  {previewData.stats && previewData.stats.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {previewData.stats.map((stat, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {stat.icon}
                          <span className="text-gray-600 dark:text-gray-400">{stat.label}:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {previewData.preview && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                      {previewData.preview}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PagePreview; 