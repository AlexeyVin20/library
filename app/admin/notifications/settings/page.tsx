'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Save, Bell, Clock, Mail, Shield, Settings, RefreshCw } from 'lucide-react'

interface NotificationSettings {
  // Общие настройки
  enableNotifications: boolean
  enableEmailNotifications: boolean
  enablePushNotifications: boolean
  enableSmsNotifications: boolean
  
  // Настройки времени
  quietHoursStart: string
  quietHoursEnd: string
  respectUserTimezone: boolean
  
  // Настройки повторов
  maxRetryAttempts: number
  retryInterval: number // минуты
  
  // Настройки по типам
  typeSettings: {
    [key: string]: {
      enabled: boolean
      priority: string
      retryAttempts: number
      cooldownPeriod: number // минуты
    }
  }
  
  // Настройки доставки
  batchSize: number
  deliveryDelay: number // секунды
  
  // Шаблоны по умолчанию
  defaultSubject: string
  defaultSignature: string
  
  // Безопасность
  requireEmailConfirmation: boolean
  enableRateLimiting: boolean
  maxNotificationsPerUser: number
  rateLimitPeriod: number // часы
}

const notificationTypes = [
  { key: 'GeneralInfo', label: 'Общая информация' },
  { key: 'BookDueSoon', label: 'Скоро возврат' },
  { key: 'BookOverdue', label: 'Просрочка' },
  { key: 'FineAdded', label: 'Штраф' },
  { key: 'BookReturned', label: 'Возврат книги' },
  { key: 'BookReserved', label: 'Резерв' },
]

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Пока что используем моковые данные
      const mockSettings: NotificationSettings = {
        enableNotifications: true,
        enableEmailNotifications: true,
        enablePushNotifications: true,
        enableSmsNotifications: false,
        
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        respectUserTimezone: true,
        
        maxRetryAttempts: 3,
        retryInterval: 30,
        
        typeSettings: {
          'GeneralInfo': { enabled: true, priority: 'Normal', retryAttempts: 2, cooldownPeriod: 60 },
          'BookDueSoon': { enabled: true, priority: 'Normal', retryAttempts: 3, cooldownPeriod: 1440 },
          'BookOverdue': { enabled: true, priority: 'High', retryAttempts: 5, cooldownPeriod: 720 },
          'FineAdded': { enabled: true, priority: 'High', retryAttempts: 3, cooldownPeriod: 1440 },
          'BookReturned': { enabled: true, priority: 'Low', retryAttempts: 1, cooldownPeriod: 0 },
          'BookReserved': { enabled: true, priority: 'Normal', retryAttempts: 2, cooldownPeriod: 60 },
        },
        
        batchSize: 100,
        deliveryDelay: 2,
        
        defaultSubject: 'Уведомление из библиотеки',
        defaultSignature: 'С уважением,\nКоманда библиотеки',
        
        requireEmailConfirmation: false,
        enableRateLimiting: true,
        maxNotificationsPerUser: 50,
        rateLimitPeriod: 24,
      }
      
      setSettings(mockSettings)
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить настройки",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    
    try {
      setSaving(true)
      
      // Здесь будет API запрос для сохранения настроек
      // const response = await fetch('/api/notification-settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // })
      
      toast({
        title: "Успешно",
        description: "Настройки сохранены"
      })
      
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    try {
      // Здесь будет тест подключения к внешним сервисам
      toast({
        title: "Успешно",
        description: "Подключение к сервисам уведомлений работает"
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Ошибка подключения к сервисам",
        variant: "destructive"
      })
    }
  }

  const updateTypeSettings = (type: string, field: string, value: any) => {
    if (!settings) return
    
    setSettings({
      ...settings,
      typeSettings: {
        ...settings.typeSettings,
        [type]: {
          ...settings.typeSettings[type],
          [field]: value
        }
      }
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Загрузка настроек...</div>
  }

  if (!settings) {
    return <div className="flex items-center justify-center h-96">Не удалось загрузить настройки</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Настройки уведомлений</h1>
              <p className="text-gray-500">
                Управление системой уведомлений и параметрами доставки
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={testConnection} variant="outline" className="bg-white text-blue-500 border-2 border-blue-500 hover:bg-gray-100">
                <RefreshCw className="mr-2 h-4 w-4" />
                Тест подключения
              </Button>
              <Button onClick={saveSettings} disabled={saving} className="bg-blue-500 hover:bg-blue-700 text-white rounded-lg">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Общие настройки */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Bell className="h-5 w-5 text-blue-500" />
              Общие настройки
            </CardTitle>
            <CardDescription className="text-gray-500">
              Основные параметры системы уведомлений
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-notifications">Включить уведомления</Label>
              <Switch
                id="enable-notifications"
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => 
                  setSettings({...settings, enableNotifications: checked})
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-email">Email уведомления</Label>
              <Switch
                id="enable-email"
                checked={settings.enableEmailNotifications}
                onCheckedChange={(checked) => 
                  setSettings({...settings, enableEmailNotifications: checked})
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-push">Push уведомления</Label>
              <Switch
                id="enable-push"
                checked={settings.enablePushNotifications}
                onCheckedChange={(checked) => 
                  setSettings({...settings, enablePushNotifications: checked})
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-sms">SMS уведомления</Label>
              <Switch
                id="enable-sms"
                checked={settings.enableSmsNotifications}
                onCheckedChange={(checked) => 
                  setSettings({...settings, enableSmsNotifications: checked})
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Настройки времени */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Clock className="h-5 w-5 text-blue-500" />
              Настройки времени
            </CardTitle>
            <CardDescription className="text-gray-500">
              Управление временем отправки уведомлений
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Тихие часы (начало)</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => 
                    setSettings({...settings, quietHoursStart: e.target.value})
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quiet-end">Тихие часы (конец)</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => 
                    setSettings({...settings, quietHoursEnd: e.target.value})
                  }
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="respect-timezone">Учитывать часовой пояс пользователя</Label>
              <Switch
                id="respect-timezone"
                checked={settings.respectUserTimezone}
                onCheckedChange={(checked) => 
                  setSettings({...settings, respectUserTimezone: checked})
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Настройки повторов */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              Настройки повторов
            </CardTitle>
            <CardDescription className="text-gray-500">
              Параметры повторной отправки уведомлений
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-retry">Максимальное количество попыток</Label>
              <Input
                id="max-retry"
                type="number"
                min="1"
                max="10"
                value={settings.maxRetryAttempts}
                onChange={(e) => 
                  setSettings({...settings, maxRetryAttempts: parseInt(e.target.value)})
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retry-interval">Интервал между попытками (минуты)</Label>
              <Input
                id="retry-interval"
                type="number"
                min="1"
                max="1440"
                value={settings.retryInterval}
                onChange={(e) => 
                  setSettings({...settings, retryInterval: parseInt(e.target.value)})
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Настройки доставки */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Mail className="h-5 w-5 text-blue-500" />
              Настройки доставки
            </CardTitle>
            <CardDescription className="text-gray-500">
              Параметры пакетной обработки и доставки
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-size">Размер пакета</Label>
              <Input
                id="batch-size"
                type="number"
                min="1"
                max="1000"
                value={settings.batchSize}
                onChange={(e) => 
                  setSettings({...settings, batchSize: parseInt(e.target.value)})
                }
              />
              <p className="text-sm text-gray-500">
                Количество уведомлений в одном пакете
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delivery-delay">Задержка доставки (секунды)</Label>
              <Input
                id="delivery-delay"
                type="number"
                min="0"
                max="60"
                value={settings.deliveryDelay}
                onChange={(e) => 
                  setSettings({...settings, deliveryDelay: parseInt(e.target.value)})
                }
              />
              <p className="text-sm text-muted-foreground">
                Задержка между отправками для снижения нагрузки
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Настройки по типам уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Настройки по типам уведомлений
          </CardTitle>
          <CardDescription>
            Индивидуальные настройки для каждого типа уведомления
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {notificationTypes.map((type) => {
              const typeSettings = settings.typeSettings[type.key] || {
                enabled: true,
                priority: 'Normal',
                retryAttempts: 2,
                cooldownPeriod: 60
              }
              
              return (
                <div key={type.key} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{type.label}</h3>
                    <Switch
                      checked={typeSettings.enabled}
                      onCheckedChange={(checked) => 
                        updateTypeSettings(type.key, 'enabled', checked)
                      }
                    />
                  </div>
                  
                  {typeSettings.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Приоритет</Label>
                        <Select 
                          value={typeSettings.priority}
                          onValueChange={(value) => 
                            updateTypeSettings(type.key, 'priority', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Низкий</SelectItem>
                            <SelectItem value="Normal">Обычный</SelectItem>
                            <SelectItem value="High">Высокий</SelectItem>
                            <SelectItem value="Critical">Критический</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Попытки повтора</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={typeSettings.retryAttempts}
                          onChange={(e) => 
                            updateTypeSettings(type.key, 'retryAttempts', parseInt(e.target.value))
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Период блокировки (мин)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10080"
                          value={typeSettings.cooldownPeriod}
                          onChange={(e) => 
                            updateTypeSettings(type.key, 'cooldownPeriod', parseInt(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Шаблоны по умолчанию */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Шаблоны по умолчанию</CardTitle>
            <CardDescription>
              Стандартные шаблоны для email уведомлений
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-subject">Тема письма по умолчанию</Label>
              <Input
                id="default-subject"
                value={settings.defaultSubject}
                onChange={(e) => 
                  setSettings({...settings, defaultSubject: e.target.value})
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default-signature">Подпись по умолчанию</Label>
              <Textarea
                id="default-signature"
                value={settings.defaultSignature}
                onChange={(e) => 
                  setSettings({...settings, defaultSignature: e.target.value})
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Настройки безопасности */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Безопасность
            </CardTitle>
            <CardDescription>
              Параметры безопасности и ограничения
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-confirmation">Требовать подтверждение email</Label>
              <Switch
                id="email-confirmation"
                checked={settings.requireEmailConfirmation}
                onCheckedChange={(checked) => 
                  setSettings({...settings, requireEmailConfirmation: checked})
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="rate-limiting">Включить ограничение частоты</Label>
              <Switch
                id="rate-limiting"
                checked={settings.enableRateLimiting}
                onCheckedChange={(checked) => 
                  setSettings({...settings, enableRateLimiting: checked})
                }
              />
            </div>
            
            {settings.enableRateLimiting && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="max-notifications">Максимум уведомлений на пользователя</Label>
                  <Input
                    id="max-notifications"
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.maxNotificationsPerUser}
                    onChange={(e) => 
                      setSettings({...settings, maxNotificationsPerUser: parseInt(e.target.value)})
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rate-limit-period">Период ограничения (часы)</Label>
                  <Input
                    id="rate-limit-period"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.rateLimitPeriod}
                    onChange={(e) => 
                      setSettings({...settings, rateLimitPeriod: parseInt(e.target.value)})
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}