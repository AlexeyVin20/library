import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Heart, Clock, Home, TrendingUp, Search, Filter, Star, Shield, Users, Bookmark, BarChart2, Bell, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickPagePreviewProps {
  route: string;
  isVisible: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

// Статические данные для быстрого предварительного просмотра
const getPreviewContent = (route: string) => {
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
    
    case '/readers/books':
      return {
        title: 'Каталог книг',
        description: 'Все книги с фильтрацией и сортировкой',
        features: [
          { icon: <BookOpen className="h-4 w-4" />, text: 'Полный каталог' },
          { icon: <Filter className="h-4 w-4" />, text: 'Фильтры по жанрам' },
          { icon: <Search className="h-4 w-4" />, text: 'Поиск по авторам' }
        ],
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
      };
    
    case '/readers/favorites':
      return {
        title: 'Избранные книги',
        description: 'Ваши любимые книги в одном месте',
        features: [
          { icon: <Heart className="h-4 w-4" />, text: 'Личная коллекция' },
          { icon: <BookOpen className="h-4 w-4" />, text: 'Быстрый доступ' },
          { icon: <Star className="h-4 w-4" />, text: 'Избранное' }
        ],
        color: 'from-red-500 to-pink-600',
        bgColor: 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20'
      };
    
    case '/readers/history':
      return {
        title: 'История чтения',
        description: 'Ваша история заимствований и возвратов',
        features: [
          { icon: <Clock className="h-4 w-4" />, text: 'История заимствований' },
          { icon: <BookOpen className="h-4 w-4" />, text: 'Статус возвратов' },
          { icon: <TrendingUp className="h-4 w-4" />, text: 'Статистика чтения' }
        ],
        color: 'from-orange-500 to-amber-600',
        bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'
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

    case '/admin/shelfs':
      return {
        title: 'Полки',
        description: 'Управление физическими и виртуальными полками библиотеки',
        features: [
          { icon: <BookOpen className="h-4 w-4" />, text: 'Создание полок' },
          { icon: <Bookmark className="h-4 w-4" />, text: 'Авто-раскладка книг' }
        ],
        color: 'from-orange-500 to-amber-600',
        bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'
      };

    case '/admin/statistics':
      return {
        title: 'Статистика',
        description: 'Просмотр ключевых метрик использования системы',
        features: [
          { icon: <BarChart2 className="h-4 w-4" />, text: 'Графики' },
          { icon: <TrendingUp className="h-4 w-4" />, text: 'Аналитика' }
        ],
        color: 'from-teal-500 to-emerald-600',
        bgColor: 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20'
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

const getPositionClasses = (position: string) => {
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

export const QuickPagePreview: React.FC<QuickPagePreviewProps> = ({
  route,
  isVisible,
  position = 'bottom',
  className
}) => {
  const content = getPreviewContent(route);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "absolute z-[500] w-72",
            getPositionClasses(position),
            className
          )}
        >
          <Card className="backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-600 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              {/* Header with gradient */}
              <div className={cn("p-4 text-white", content.bgColor)}>
                <div className={cn("h-2 w-full rounded-full mb-3 bg-gradient-to-r", content.color)} />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {content.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {content.description}
                </p>
              </div>

              {/* Features */}
              <div className="p-4 space-y-2">
                {content.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <div className="flex-shrink-0 text-blue-500 dark:text-blue-400">
                      {feature.icon}
                    </div>
                    <span>{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Action hint */}
              <div className="px-4 pb-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg py-2">
                  Нажмите для перехода
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickPagePreview; 