import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PreviewSwitcher, PreviewType } from './preview-switcher';
import { QuickPagePreview } from './quick-page-preview';
import { PagePreview } from './page-preview';
import { IframePagePreview } from './iframe-page-preview';
import { BookOpen, Heart, Clock, Home, Settings, Zap, Globe, Database } from 'lucide-react';

const PreviewDemo: React.FC = () => {
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<PreviewType>('quick');

  const routes = [
    { path: '/readers', name: 'Главная', icon: <Home className="h-4 w-4" /> },
    { path: '/readers/books', name: 'Каталог книг', icon: <BookOpen className="h-4 w-4" /> },
    { path: '/readers/favorites', name: 'Избранное', icon: <Heart className="h-4 w-4" /> },
    { path: '/readers/history', name: 'История', icon: <Clock className="h-4 w-4" /> },
  ];

  const previewTypes: { type: PreviewType; name: string; icon: React.ReactNode; description: string }[] = [
    {
      type: 'quick',
      name: 'Быстрый',
      icon: <Zap className="h-4 w-4" />,
      description: 'Статический предварительный просмотр без API запросов'
    },
    {
      type: 'api',
      name: 'С данными',
      icon: <Database className="h-4 w-4" />,
      description: 'Предварительный просмотр с реальными данными из API'
    },
    {
      type: 'iframe',
      name: 'Iframe',
      icon: <Globe className="h-4 w-4" />,
      description: 'Реальный предварительный просмотр страницы в iframe'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Демонстрация предварительного просмотра страниц
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Различные способы отображения предварительного просмотра страниц при наведении
        </p>
      </div>

      {/* Выбор типа предварительного просмотра */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Настройки предварительного просмотра
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {previewTypes.map((type) => (
              <div
                key={type.type}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  previewType === type.type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setPreviewType(type.type)}
              >
                <div className="flex items-center gap-3 mb-2">
                  {type.icon}
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {type.name}
                  </h3>
                  {previewType === type.type && (
                    <Badge variant="default" className="ml-auto">
                      Активен
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Демонстрация навигации */}
      <Card>
        <CardHeader>
          <CardTitle>Навигация с предварительным просмотром</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center">
            {routes.map((route) => (
              <div
                key={route.path}
                className="relative"
                onMouseEnter={() => setActivePreview(route.path)}
                onMouseLeave={() => setActivePreview(null)}
              >
                <Button
                  variant={activePreview === route.path ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  {route.icon}
                  {route.name}
                </Button>

                {/* Предварительный просмотр */}
                <PreviewSwitcher
                  route={route.path}
                  isVisible={activePreview === route.path}
                  position="bottom"
                  className="left-1/2 transform -translate-x-1/2"
                  type={previewType}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Сравнение типов */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Быстрый предварительный просмотр
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full mb-4"
                onMouseEnter={() => setActivePreview('quick-demo')}
                onMouseLeave={() => setActivePreview(null)}
              >
                Наведите для просмотра
              </Button>
              
              <QuickPagePreview
                route="/readers"
                isVisible={activePreview === 'quick-demo'}
                position="bottom"
                className="left-1/2 transform -translate-x-1/2"
              />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Мгновенная загрузка</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Без API запросов</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Статическое содержимое</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Предварительный просмотр с данными
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full mb-4"
                onMouseEnter={() => setActivePreview('api-demo')}
                onMouseLeave={() => setActivePreview(null)}
              >
                Наведите для просмотра
              </Button>
              
              <PagePreview
                route="/readers"
                isVisible={activePreview === 'api-demo'}
                position="bottom"
                className="left-1/2 transform -translate-x-1/2"
              />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Реальные данные</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Задержка загрузки</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Актуальная статистика</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Iframe предварительный просмотр
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full mb-4"
                onMouseEnter={() => setActivePreview('iframe-demo')}
                onMouseLeave={() => setActivePreview(null)}
              >
                Наведите для просмотра
              </Button>
              
              <IframePagePreview
                route="/readers"
                isVisible={activePreview === 'iframe-demo'}
                position="bottom"
                className="left-1/2 transform -translate-x-1/2"
                delay={500}
                enableScrollControl={true}
              />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Полный предварительный просмотр</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Интерактивный скролл</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Блокировка основного скролла</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Может влиять на производительность</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Рекомендации */}
      <Card>
        <CardHeader>
          <CardTitle>Рекомендации по использованию</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                Быстрый предварительный просмотр
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Идеально для навигации с высокой частотой наведений. Мгновенная отзывчивость.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
                Предварительный просмотр с данными
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Подходит для страниц с важной статистикой. Показывает актуальные данные.
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h4 className="font-semibold text-orange-800 dark:text-orange-400 mb-2">
                Iframe предварительный просмотр
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Полный интерактивный предварительный просмотр с блокировкой основного скролла. Клик для активации скролла в превью.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreviewDemo; 