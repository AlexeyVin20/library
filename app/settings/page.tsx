'use client';

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useSettings } from '@/hooks/use-settings'
import { GenreSelector } from '@/components/GenreSelector'
import { NotificationSettings } from '@/components/NotificationSettings'
import { 
  Settings, 
  Type, 
  Layout, 
  Heart, 
  Bell, 
  Save, 
  RotateCcw,
  Eye,
  Monitor
} from 'lucide-react'

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings, updateNotificationSetting, isLoaded } = useSettings()
  const { toast } = useToast()
  const [hasChanges, setHasChanges] = useState(false)

  // Отслеживание изменений для показа кнопки сохранения
  useEffect(() => {
    setHasChanges(false)
  }, [settings])

  const handleSaveSettings = () => {
    toast({
      title: "Настройки сохранены",
      description: "Ваши настройки успешно сохранены.",
    })
    setHasChanges(false)
  }

  const handleResetSettings = () => {
    resetSettings()
    toast({
      title: "Настройки сброшены",
      description: "Все настройки возвращены к значениям по умолчанию.",
      variant: "destructive"
    })
  }

  const fontSizeOptions = [
    { value: 'small', label: 'Маленький', description: '14px' },
    { value: 'medium', label: 'Средний', description: '16px' },
    { value: 'large', label: 'Большой', description: '18px' },
    { value: 'extra-large', label: 'Очень большой', description: '20px' }
  ]

  const viewModeOptions = [
    { value: 'grid', label: 'Сетка', description: 'Карточки книг в виде сетки' },
    { value: 'list', label: 'Список', description: 'Подробный список с описанием' },
    { value: 'compact', label: 'Компактный', description: 'Плотный список для быстрого просмотра' }
  ]

  if (!isLoaded) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Загрузка настроек...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Настройки
          </h1>
          <p className="text-muted-foreground mt-1">
            Персонализируйте свой опыт использования библиотеки
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Сбросить
          </Button>
          <Button onClick={handleSaveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Сохранить
          </Button>
        </div>
      </div>

      <Separator />

      {/* Основной контент */}
      <Tabs defaultValue="display" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Отображение
          </TabsTrigger>
          <TabsTrigger value="reading" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Чтение
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Предпочтения
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
          </TabsTrigger>
        </TabsList>

        {/* Вкладка "Отображение" */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Настройки отображения
              </CardTitle>
              <CardDescription>
                Настройте, как отображается контент в библиотеке
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Режим отображения по умолчанию */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Режим отображения по умолчанию</Label>
                <Select 
                  value={settings.defaultViewMode} 
                  onValueChange={(value: 'grid' | 'list' | 'compact') => 
                    updateSettings({ defaultViewMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {viewModeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Выберите, как по умолчанию будут отображаться книги в каталоге
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Вкладка "Чтение" */}
        <TabsContent value="reading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Настройки чтения
              </CardTitle>
              <CardDescription>
                Настройте параметры для комфортного чтения
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Размер шрифта */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Размер шрифта</Label>
                <Select 
                  value={settings.fontSize} 
                  onValueChange={(value: 'small' | 'medium' | 'large' | 'extra-large') => 
                    updateSettings({ fontSize: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontSizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          <Badge variant="secondary" className="ml-2">
                            {option.description}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className={`transition-all duration-200 ${
                    settings.fontSize === 'small' ? 'text-sm' :
                    settings.fontSize === 'medium' ? 'text-base' :
                    settings.fontSize === 'large' ? 'text-lg' :
                    'text-xl'
                  }`}>
                    Пример текста с выбранным размером шрифта. Этот текст поможет вам понять, 
                    как будет выглядеть контент при чтении.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Вкладка "Предпочтения" */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Предпочитаемые жанры
              </CardTitle>
              <CardDescription>
                Выберите жанры, которые вам интересны, чтобы получать персональные рекомендации
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GenreSelector
                selectedGenres={settings.preferredGenres}
                onGenresChange={(genres) => updateSettings({ preferredGenres: genres })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Вкладка "Уведомления" */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings
            settings={settings}
            onNotificationChange={updateNotificationSetting}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 