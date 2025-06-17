'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Bell, Send, Users, TrendingUp, CheckCircle, AlertCircle, Clock, Mail, Search, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import NotificationStatsCard from '@/components/admin/NotificationStatsCard'
import NotificationManager from '@/components/admin/NotificationManager'

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

interface NotificationStats {
  totalNotifications: number
  unreadNotifications: number
  readNotifications: number
  notificationsByType?: Record<string, number>
  notificationsByPriority?: Record<string, number>
}

interface UserType {
  id: string
  fullName: string
  email: string
  phone?: string
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [showUserPicker, setShowUserPicker] = useState(false)
  const [showBulkUserPicker, setShowBulkUserPicker] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'GeneralInfo',
    priority: 'Normal',
    userId: ''
  })
  
  const [bulkForm, setBulkForm] = useState({
    title: '',
    message: '',
    type: 'GeneralInfo',
    priority: 'Normal'
  })

  useEffect(() => {
    loadNotifications()
    loadStats()
    loadUsers()
  }, [])

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить уведомления",
        variant: "destructive"
      })
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Статистика уведомлений:', data)
        
        // Безопасная установка данных с проверками
        const safeStats = {
          totalNotifications: data.totalNotifications || 0,
          unreadNotifications: data.unreadNotifications || 0,
          readNotifications: data.readNotifications || 0,
          notificationsByType: (data.notificationsByType && typeof data.notificationsByType === 'object') ? data.notificationsByType : {},
          notificationsByPriority: (data.notificationsByPriority && typeof data.notificationsByPriority === 'object') ? data.notificationsByPriority : {}
        }
        
        setStats(safeStats)
      } else {
        console.error('Ошибка загрузки статистики:', response.status, response.statusText)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить статистику уведомлений",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке статистики",
        variant: "destructive"
      })
    }
    finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const token = localStorage.getItem('token')
      console.log('Загружаем пользователей с API URL:', `${process.env.NEXT_PUBLIC_BASE_URL}/api/User`)
      
      if (!token) {
        console.error('Токен авторизации не найден')
        toast({
          title: "Ошибка авторизации",
          description: "Токен не найден, необходимо войти в систему",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/User`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Ответ API пользователей:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Данные пользователей:', data)
        
        if (!Array.isArray(data)) {
          console.error('Данные пользователей не являются массивом:', data)
          toast({
            title: "Ошибка",
            description: "Неверный формат данных пользователей",
            variant: "destructive"
          })
          return
        }
        
        // Добавляем fullName для каждого пользователя
        const usersWithFullName = data.map((user: UserType) => ({
          ...user,
          fullName: `${user.fullName}`
        }))
        
        console.log('Обработанные пользователи:', usersWithFullName)
        setUsers(usersWithFullName)
        
        if (usersWithFullName.length === 0) {
          toast({
            title: "Информация",
            description: "В системе пока нет пользователей",
            variant: "default"
          })
        }
      } else {
        const errorText = await response.text()
        console.error('Ошибка API:', response.status, errorText)
        toast({
          title: "Ошибка загрузки",
          description: `Не удалось загрузить пользователей: ${response.status} ${response.statusText}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить пользователей. Проверьте подключение к интернету",
        variant: "destructive"
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUserSelect = (user: UserType) => {
    setSelectedUser(user)
    setNotificationForm({...notificationForm, userId: user.id})
    setShowUserPicker(false)
  }

  const handleRemoveSelectedUser = () => {
    setSelectedUser(null)
    setNotificationForm({...notificationForm, userId: ''})
  }

  const sendNotification = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationForm)
      })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Уведомление отправлено"
        })
        setNotificationForm({
          title: '',
          message: '',
          type: 'GeneralInfo',
          priority: 'Normal',
          userId: ''
        })
        setSelectedUser(null)
        loadNotifications()
        loadStats()
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить уведомление",
        variant: "destructive"
      })
    }
  }

  const sendBulkNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/send-bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...bulkForm,
          userIds: selectedUsers
        })
      })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: `Уведомления отправлены ${selectedUsers.length} пользователям`
        })
        setBulkForm({
          title: '',
          message: '',
          type: 'GeneralInfo',
          priority: 'Normal'
        })
        setSelectedUsers([])
        loadNotifications()
        loadStats()
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить массовые уведомления",
        variant: "destructive"
      })
    }
  }

  const sendAutomaticNotifications = async (type: string) => {
    try {
      const token = localStorage.getItem('token')
      let endpoint = ''
      let successMessage = ''
      
      switch (type) {
        case 'due-reminders':
          endpoint = '/api/Notification/send-due-reminders'
          successMessage = 'Напоминания о возврате отправлены'
          break
        case 'overdue':
          endpoint = '/api/Notification/send-overdue-notifications'
          successMessage = 'Уведомления о просрочке отправлены'
          break
        case 'fines':
          endpoint = '/api/Notification/send-fine-notifications'
          successMessage = 'Уведомления о штрафах отправлены'
          break
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: successMessage
        })
        loadStats()
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить уведомления",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Загрузка...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление уведомлениями</h1>
          <p className="text-muted-foreground">
            Отправка и управление уведомлениями пользователей
            {!loadingUsers && (
              <span className="ml-2 text-xs">
                (Пользователей в системе: {users.length})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => window.open('/admin/notifications/templates', '_blank')}
            variant="outline"
            className="text-foreground hover:text-accent-foreground"
          >
            Шаблоны
          </Button>
          <Button 
            onClick={() => window.open('/admin/notifications/analytics', '_blank')}
            variant="outline"
            className="text-foreground hover:text-accent-foreground"
          >
            Аналитика
          </Button>
          <Button 
            onClick={() => window.open('/admin/notifications/settings', '_blank')}
            variant="outline"
            className="text-foreground hover:text-accent-foreground"
          >
            Настройки
          </Button>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего уведомлений</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotifications}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Непрочитанные</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Прочитанные</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.readNotifications}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Процент прочтения</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalNotifications > 0 
                  ? Math.round((stats.readNotifications / stats.totalNotifications) * 100)
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stats">Статистика</TabsTrigger>
          <TabsTrigger value="manage">Управление</TabsTrigger>
          <TabsTrigger value="send">Отправить уведомление</TabsTrigger>
          <TabsTrigger value="bulk">Массовая отправка</TabsTrigger>
          <TabsTrigger value="auto">Автоматические</TabsTrigger>
        </TabsList>

        {/* Статистика */}
        <TabsContent value="stats">
          {stats && <NotificationStatsCard stats={stats} />}
        </TabsContent>

        {/* Управление уведомлениями */}
        <TabsContent value="manage">
          <NotificationManager notifications={notifications as Notification[]} onRefresh={loadNotifications} />
        </TabsContent>

        {/* Отправка индивидуального уведомления */}
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Отправить уведомление</CardTitle>
              <CardDescription>
                Отправка индивидуального уведомления пользователю
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Пользователь</Label>
                  {selectedUser ? (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{selectedUser.fullName}</div>
                          <div className="text-sm text-gray-500">{selectedUser.email}</div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveSelectedUser}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUserPicker(true)}
                      className="w-full justify-start"
                      disabled={loadingUsers}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {loadingUsers ? 'Загрузка пользователей...' : 'Выберите пользователя'}
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Тип уведомления</Label>
                  <Select 
                    value={notificationForm.type} 
                    onValueChange={(value) => setNotificationForm({...notificationForm, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GeneralInfo">Общая информация</SelectItem>
                      <SelectItem value="BookDueSoon">Скоро возврат книги</SelectItem>
                      <SelectItem value="BookOverdue">Просроченная книга</SelectItem>
                      <SelectItem value="FineAdded">Штраф начислен</SelectItem>
                      <SelectItem value="BookReturned">Книга возвращена</SelectItem>
                      <SelectItem value="BookReserved">Книга зарезервирована</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Заголовок</Label>
                  <Input
                    id="title"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                    placeholder="Введите заголовок"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Приоритет</Label>
                  <Select 
                    value={notificationForm.priority} 
                    onValueChange={(value) => setNotificationForm({...notificationForm, priority: value})}
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
              
              <div className="space-y-2">
                <Label htmlFor="message">Сообщение</Label>
                <Textarea
                  id="message"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                  placeholder="Введите текст уведомления"
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={sendNotification}
                disabled={!notificationForm.title || !notificationForm.message || !notificationForm.userId}
                className="w-full md:w-auto"
              >
                <Send className="mr-2 h-4 w-4" />
                Отправить уведомление
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Массовая отправка */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Массовая отправка</CardTitle>
              <CardDescription>
                Отправка уведомления нескольким пользователям одновременно
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Выберите пользователей</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkUserPicker(true)}
                      disabled={loadingUsers}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {loadingUsers ? 'Загрузка...' : 'Выбрать пользователей'}
                    </Button>
                    {selectedUsers.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUsers([])}
                      >
                        Очистить все
                      </Button>
                    )}
                  </div>
                </div>
                
                {selectedUsers.length > 0 && (
                  <div className="border rounded-md p-3 bg-gray-50">
                    <div className="text-sm font-medium mb-2">
                      Выбранные пользователи ({selectedUsers.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((userId) => {
                        const user = users.find(u => u.id === userId)
                        if (!user) return null
                        return (
                          <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                            {user.fullName}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-title">Заголовок</Label>
                  <Input
                    id="bulk-title"
                    value={bulkForm.title}
                    onChange={(e) => setBulkForm({...bulkForm, title: e.target.value})}
                    placeholder="Введите заголовок"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulk-type">Тип уведомления</Label>
                  <Select 
                    value={bulkForm.type} 
                    onValueChange={(value) => setBulkForm({...bulkForm, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GeneralInfo">Общая информация</SelectItem>
                      <SelectItem value="BookDueSoon">Скоро возврат книги</SelectItem>
                      <SelectItem value="BookOverdue">Просроченная книга</SelectItem>
                      <SelectItem value="FineAdded">Штраф начислен</SelectItem>
                      <SelectItem value="BookReturned">Книга возвращена</SelectItem>
                      <SelectItem value="BookReserved">Книга зарезервирована</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bulk-message">Сообщение</Label>
                <Textarea
                  id="bulk-message"
                  value={bulkForm.message}
                  onChange={(e) => setBulkForm({...bulkForm, message: e.target.value})}
                  placeholder="Введите текст уведомления"
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={sendBulkNotifications}
                disabled={!bulkForm.title || !bulkForm.message || selectedUsers.length === 0}
                className="w-full md:w-auto"
              >
                <Users className="mr-2 h-4 w-4" />
                Отправить {selectedUsers.length} пользователям
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Автоматические уведомления */}
        <TabsContent value="auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Напоминания о возврате</CardTitle>
                <CardDescription>
                  Отправить напоминания пользователям о скором сроке возврата книг
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => sendAutomaticNotifications('due-reminders')} className="w-full">
                  <Clock className="mr-2 h-4 w-4" />
                  Отправить напоминания
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Уведомления о просрочке</CardTitle>
                <CardDescription>
                  Отправить уведомления о просроченных книгах
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => sendAutomaticNotifications('overdue')} className="w-full">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Отправить уведомления
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Уведомления о штрафах</CardTitle>
                <CardDescription>
                  Отправить уведомления о начисленных штрафах
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => sendAutomaticNotifications('fines')} className="w-full">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Отправить уведомления
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Модальное окно выбора пользователя */}
      <UserPickerModal
        open={showUserPicker}
        onOpenChange={setShowUserPicker}
        users={users}
        onSelect={handleUserSelect}
        selectedUser={selectedUser}
      />

      {/* Модальное окно массового выбора пользователей */}
      <BulkUserPickerModal
        open={showBulkUserPicker}
        onOpenChange={setShowBulkUserPicker}
        users={users}
        selectedUsers={selectedUsers}
        onSelectionChange={setSelectedUsers}
      />
    </div>
  )
}

// Компонент модального окна выбора пользователя
function UserPickerModal({ 
  open, 
  onOpenChange, 
  users, 
  onSelect, 
  selectedUser 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  users: UserType[]
  onSelect: (user: UserType) => void
  selectedUser: UserType | null
}) {
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
    if (open) {
      console.log('UserPickerModal открыт, количество пользователей:', users.length)
      console.log('Пользователи в модальном окне:', users)
    }
  }, [open, users])
  
  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )
  
  console.log('Отфильтрованные пользователи:', filteredUsers.length, 'поиск:', search)
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[400px] p-0">
        <DialogHeader className="border-b px-6 py-4 pt-5">
          <DialogTitle>Выберите пользователя</DialogTitle>
        </DialogHeader>
        <div className="p-3">
          <div className="flex items-center border rounded-md px-3">
            <Search className="mr-2 h-4 w-4 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Поиск пользователя..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div>Пользователи не найдены</div>
              <div className="text-xs mt-2">
                Всего пользователей: {users.length}, Поиск: "{search}"
              </div>
              {users.length === 0 && (
                <div className="text-xs mt-1 text-red-500">
                  Список пользователей пуст. Проверьте API или права доступа.
                </div>
              )}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex cursor-pointer items-center p-3 hover:bg-gray-100 border-b last:border-b-0"
                onClick={() => onSelect(user)}
              >
                <div className="flex-1">
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  {user.phone && (
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  )}
                </div>
                {selectedUser && selectedUser.id === user.id && (
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Компонент модального окна массового выбора пользователей
function BulkUserPickerModal({ 
  open, 
  onOpenChange, 
  users, 
  selectedUsers, 
  onSelectionChange 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  users: UserType[]
  selectedUsers: string[]
  onSelectionChange: (userIds: string[]) => void
}) {
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])
  
  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )
  
  const handleToggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onSelectionChange(selectedUsers.filter(id => id !== userId))
    } else {
      onSelectionChange([...selectedUsers, userId])
    }
  }
  
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(filteredUsers.map(user => user.id))
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[500px] p-0">
        <DialogHeader className="border-b px-6 py-4 pt-5">
          <DialogTitle>Выберите пользователей</DialogTitle>
        </DialogHeader>
        <div className="p-3 space-y-3">
          <div className="flex items-center border rounded-md px-3">
            <Search className="mr-2 h-4 w-4 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Поиск пользователей..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedUsers.length === filteredUsers.length ? 'Снять все' : 'Выбрать все'}
            </Button>
            <span className="text-sm text-gray-500">
              Выбрано: {selectedUsers.length} из {filteredUsers.length}
            </span>
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div>Пользователи не найдены</div>
              <div className="text-xs mt-2">
                Всего пользователей: {users.length}, Поиск: "{search}"
              </div>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center p-3 hover:bg-gray-100 border-b last:border-b-0"
              >
                <Checkbox
                  id={`bulk-user-${user.id}`}
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => handleToggleUser(user.id)}
                  className="mr-3"
                />
                <div className="flex-1 cursor-pointer" onClick={() => handleToggleUser(user.id)}>
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  {user.phone && (
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t p-4">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Применить выбор ({selectedUsers.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 