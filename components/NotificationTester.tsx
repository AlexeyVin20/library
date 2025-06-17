"use client"

import { useState } from 'react'
import { useNotifications } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { NotificationType, NotificationPriority } from '@/lib/types'
import { formatRelativeTime, getNotificationIcon, getNotificationTypeLabel } from '@/lib/notification-utils'

interface NotificationTestData {
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
}

export default function NotificationTester() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  } = useNotifications()

  const [testData, setTestData] = useState<NotificationTestData>({
    title: 'Тестовое уведомление',
    message: 'Это тестовое сообщение для проверки системы уведомлений',
    type: 'GeneralInfo',
    priority: 'Normal'
  })

  const [isSending, setIsSending] = useState(false)

  const sendTestNotification = async () => {
    setIsSending(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('Необходима авторизация')
        return
      }

      const response = await fetch('https://localhost:7139/api/Notification/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: "your-user-id", // Замените на реальный ID пользователя
          ...testData
        })
      })

      if (response.ok) {
        alert('Тестовое уведомление отправлено!')
      } else {
        alert('Ошибка отправки уведомления')
      }
    } catch (error) {
      alert('Ошибка: ' + error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Панель управления */}
      <Card>
        <CardHeader>
          <CardTitle>Тестирование уведомлений</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Статус подключения */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              SignalR: {isConnected ? 'Подключен' : 'Отключен'}
            </span>
            <Badge variant="outline" className="ml-auto">
              Непрочитанных: {unreadCount}
            </Badge>
          </div>

          {/* Форма для отправки тестового уведомления */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Заголовок</Label>
              <Input
                id="title"
                value={testData.title}
                onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="message">Сообщение</Label>
              <Input
                id="message"
                value={testData.message}
                onChange={(e) => setTestData(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="type">Тип</Label>
              <Select
                value={testData.type}
                onValueChange={(value: NotificationType) => 
                  setTestData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GeneralInfo">Общая информация</SelectItem>
                  <SelectItem value="BookDueSoon">Скоро возврат</SelectItem>
                  <SelectItem value="BookOverdue">Просрочено</SelectItem>
                  <SelectItem value="FineAdded">Штраф начислен</SelectItem>
                  <SelectItem value="BookReturned">Книга возвращена</SelectItem>
                  <SelectItem value="BookReserved">Книга зарезервирована</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Приоритет</Label>
              <Select
                value={testData.priority}
                onValueChange={(value: NotificationPriority) => 
                  setTestData(prev => ({ ...prev, priority: value }))
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
          </div>

          {/* Кнопки управления */}
          <div className="flex gap-2">
            <Button 
              onClick={sendTestNotification} 
              disabled={isSending}
              className="flex-1"
            >
              {isSending ? 'Отправка...' : 'Отправить тест'}
            </Button>
            <Button 
              onClick={() => fetchNotifications()} 
              variant="outline"
              disabled={isLoading}
            >
              Обновить
            </Button>
            <Button 
              onClick={markAllAsRead} 
              variant="outline"
              disabled={unreadCount === 0}
            >
              Прочитать все
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Список уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle>Список уведомлений ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-gray-600">Загрузка...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.isRead 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium ${
                          notification.isRead ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                        {notification.priority !== 'Normal' && (
                          <Badge 
                            variant={notification.priority === 'Critical' ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {notification.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Нет уведомлений</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 