'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Eye, 
  Users, 
  Clock, 
  AlertCircle, 
  Bell, 
  Trash2,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  priority: string
  isRead: boolean
  createdAt: string
  userId: string
  user?: {
    fullName: string
    email: string
  }
}

interface NotificationManagerProps {
  notifications: Notification[]
  onRefresh: () => void
}

export default function NotificationManager({ notifications, onRefresh }: NotificationManagerProps) {
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>(notifications)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    setFilteredNotifications(notifications)
  }, [notifications])

  useEffect(() => {
    filterNotifications()
  }, [searchTerm, typeFilter, priorityFilter, statusFilter, notifications])

  const filterNotifications = () => {
    let filtered = notifications

    // Поиск по тексту
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.user?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Фильтр по типу
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter)
    }

    // Фильтр по приоритету
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(n => n.priority === priorityFilter)
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      if (statusFilter === 'read') {
        filtered = filtered.filter(n => n.isRead)
      } else if (statusFilter === 'unread') {
        filtered = filtered.filter(n => !n.isRead)
      }
    }

    setFilteredNotifications(filtered)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(filteredNotifications.map(n => n.id))
    } else {
      setSelectedNotifications([])
    }
  }

  const handleSelectNotification = (notificationId: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications([...selectedNotifications, notificationId])
    } else {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId))
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const token = localStorage.getItem('token')
      
      if (notificationIds.length === 1) {
        // Отметить одно уведомление
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Notification/${notificationIds[0]}/mark-read`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (response.ok) {
          toast({
            title: "Успешно",
            description: "Уведомление отмечено как прочитанное"
          })
        }
      } else {
        // Отметить несколько уведомлений
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Notification/mark-multiple-read`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notificationIds })
          }
        )
        
        if (response.ok) {
          toast({
            title: "Успешно",
            description: `${notificationIds.length} уведомлений отмечены как прочитанные`
          })
        }
      }
      
      setSelectedNotifications([])
      onRefresh()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отметить уведомления",
        variant: "destructive"
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/mark-all-read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Все уведомления отмечены как прочитанные"
        })
        onRefresh()
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отметить все уведомления",
        variant: "destructive"
      })
    }
  }

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      const token = localStorage.getItem('token')
      
      if (notificationIds.length === 1) {
        // Удалить одно уведомление
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/${notificationIds[0]}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (response.ok) {
          toast({
            title: "Успешно",
            description: "Уведомление удалено"
          })
        }
      } else {
        // Удалить несколько уведомлений
        await Promise.all(
          notificationIds.map(id => 
            fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          )
        )
        
        toast({
          title: "Успешно",
          description: `${notificationIds.length} уведомлений удалено`
        })
      }
      
      setSelectedNotifications([])
      onRefresh()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить уведомления",
        variant: "destructive"
      })
    }
  }

  const testPushNotification = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Notification/test-push/${userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Тестовое уведомление отправлено"
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить тестовое уведомление",
        variant: "destructive"
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BookDueSoon':
      case 'BookOverdue':
        return <Clock className="h-4 w-4" />
      case 'FineAdded':
        return <AlertCircle className="h-4 w-4" />
      case 'BookReturned':
      case 'BookReserved':
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'destructive'
      case 'High': return 'destructive'
      case 'Normal': return 'default'
      case 'Low': return 'secondary'
      default: return 'default'
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'GeneralInfo': 'Общая информация',
      'BookDueSoon': 'Скоро возврат',
      'BookOverdue': 'Просрочка',
      'FineAdded': 'Штраф',
      'BookReturned': 'Возврат книги',
      'BookReserved': 'Резерв'
    }
    return labels[type] || type
  }

  const allSelected = selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0
  const someSelected = selectedNotifications.length > 0

  return (
    <div className="space-y-4">
      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <CardTitle>Управление уведомлениями</CardTitle>
          <CardDescription>
            Поиск, фильтрация и массовые операции с уведомлениями
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Поиск */}
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по заголовку, сообщению или пользователю..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Фильтры */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Тип</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="GeneralInfo">Общая информация</SelectItem>
                  <SelectItem value="BookDueSoon">Скоро возврат</SelectItem>
                  <SelectItem value="BookOverdue">Просрочка</SelectItem>
                  <SelectItem value="FineAdded">Штраф</SelectItem>
                  <SelectItem value="BookReturned">Возврат книги</SelectItem>
                  <SelectItem value="BookReserved">Резерв</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Приоритет</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все приоритеты</SelectItem>
                  <SelectItem value="Low">Низкий</SelectItem>
                  <SelectItem value="Normal">Обычный</SelectItem>
                  <SelectItem value="High">Высокий</SelectItem>
                  <SelectItem value="Critical">Критический</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Статус</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="read">Прочитанные</SelectItem>
                  <SelectItem value="unread">Непрочитанные</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Действия</label>
              <Button onClick={onRefresh} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
            </div>
          </div>

          {/* Массовые операции */}
          {someSelected && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                Выбрано: {selectedNotifications.length}
              </span>
              <Button
                size="sm"
                onClick={() => markAsRead(selectedNotifications)}
                disabled={selectedNotifications.length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Отметить как прочитанные
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteNotifications(selectedNotifications)}
                disabled={selectedNotifications.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить выбранные
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedNotifications([])}
              >
                Отменить выбор
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Таблица уведомлений */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Список уведомлений</CardTitle>
            <CardDescription>
              Найдено: {filteredNotifications.length} из {notifications.length}
            </CardDescription>
          </div>
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Отметить все как прочитанные
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Заголовок</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Приоритет</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedNotifications.includes(notification.id)}
                      onCheckedChange={(checked) => 
                        handleSelectNotification(notification.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {notification.user ? 
                          `${notification.user.fullName}` : 
                          'Неизвестно'
                        }
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {notification.user?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{notification.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.message}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(notification.type)}
                      <span className="text-sm">{getTypeLabel(notification.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(notification.priority) as any}>
                      {notification.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={notification.isRead ? "default" : "secondary"}>
                      {notification.isRead ? "Прочитано" : "Не прочитано"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(notification.createdAt).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedNotification(notification)
                          setShowDetailModal(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead([notification.id])}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotifications([notification.id])}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {notification.user && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => testPushNotification(notification.userId)}
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Нет уведомлений для отображения
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно с деталями */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали уведомления</DialogTitle>
            <DialogDescription>
              Подробная информация об уведомлении
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Заголовок</label>
                  <p className="text-sm">{selectedNotification.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Тип</label>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(selectedNotification.type)}
                    <span className="text-sm">{getTypeLabel(selectedNotification.type)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Сообщение</label>
                <p className="text-sm mt-1">{selectedNotification.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Приоритет</label>
                  <Badge variant={getPriorityColor(selectedNotification.priority) as any}>
                    {selectedNotification.priority}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Статус</label>
                  <Badge variant={selectedNotification.isRead ? "default" : "secondary"}>
                    {selectedNotification.isRead ? "Прочитано" : "Не прочитано"}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Пользователь</label>
                  <p className="text-sm">
                    {selectedNotification.user ? 
                      `${selectedNotification.user.fullName}` : 
                      'Неизвестно'
                    }
                  </p>
                  {selectedNotification.user?.email && (
                    <p className="text-xs text-muted-foreground">{selectedNotification.user.email}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Дата создания</label>
                  <p className="text-sm">
                    {new Date(selectedNotification.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                {!selectedNotification.isRead && (
                  <Button 
                    onClick={() => {
                      markAsRead([selectedNotification.id])
                      setShowDetailModal(false)
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Отметить как прочитанное
                  </Button>
                )}
                {selectedNotification.user && (
                  <Button 
                    variant="outline"
                    onClick={() => testPushNotification(selectedNotification.userId)}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Тестовое уведомление
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}