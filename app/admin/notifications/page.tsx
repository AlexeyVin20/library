'use client'

import type React from "react";
import { useState, useEffect, useRef } from 'react'
import { motion } from "framer-motion";
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
import { Bell, Send, Users, TrendingUp, CheckCircle, AlertCircle, Clock, Mail, Search, User, X, RefreshCw, TestTube, Settings, MailCheck, Info, Timer, DollarSign, BookOpen, Calendar, Zap, Star, Shield } from 'lucide-react'
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
  totalUsers?: number
  activeUsers?: number
  notificationsByDate?: Record<string, number>
  averageResponseTime?: number
  topNotificationTypes?: Array<{type: string, count: number}>
}

interface UserType {
  id: string
  fullName: string
  email: string
  phone?: string
}

const FadeInView = ({ 
  children, 
  delay = 0 
}: { 
  children: React.ReactNode; 
  delay?: number; 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
  delay = 0,
  onClick
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
  onClick?: () => void;
}) => (
  <FadeInView delay={delay}>
    <motion.div 
      className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between border border-gray-200 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)" }}
      onClick={onClick}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${color}`}></div>
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${color.replace("bg-", "text-")}`}>
          {icon}
          {title}
        </h3>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${color.replace("bg-", "bg-").replace(/-(500|400|600)/, "-100")}`}>
          <span className={color.replace("bg-", "text-")}>
            {icon}
          </span>
        </div>
      </div>
      <div>
        <p className={`text-4xl font-bold mb-2 ${color.replace("bg-", "text-")}`}>{value}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </motion.div>
  </FadeInView>
);

const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center h-64">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full"
    />
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-4 text-blue-500 font-medium"
    >
      Загрузка данных...
    </motion.p>
  </div>
);

// Вспомогательная функция для отображения типов уведомлений
function getNotificationTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    'GeneralInfo': 'Общая информация',
    'BookDueSoon': 'Скоро возврат книги',
    'BookOverdue': 'Просроченная книга',
    'FineAdded': 'Штраф начислен',
    'BookReturned': 'Книга возвращена',
    'BookReserved': 'Книга зарезервирована'
  }
  return typeMap[type] || type
}

// Вспомогательная функция для получения иконки типа уведомления
function getNotificationTypeIcon(type: string) {
  const iconMap: Record<string, React.ReactNode> = {
    'GeneralInfo': <Info className="w-4 h-4" />,
    'BookDueSoon': <Timer className="w-4 h-4" />,
    'BookOverdue': <AlertCircle className="w-4 h-4" />,
    'FineAdded': <DollarSign className="w-4 h-4" />,
    'BookReturned': <BookOpen className="w-4 h-4" />,
    'BookReserved': <Calendar className="w-4 h-4" />
  }
  return iconMap[type] || <Info className="w-4 h-4" />
}

// Вспомогательная функция для получения цвета типа уведомления
function getNotificationTypeColor(type: string) {
  const colorMap: Record<string, string> = {
    'GeneralInfo': 'blue',
    'BookDueSoon': 'orange',
    'BookOverdue': 'red',
    'FineAdded': 'purple',
    'BookReturned': 'green',
    'BookReserved': 'indigo'
  }
  return colorMap[type] || 'blue'
}

// Вспомогательная функция для получения иконки приоритета
function getPriorityIcon(priority: string) {
  const iconMap: Record<string, React.ReactNode> = {
    'Low': <Info className="w-4 h-4" />,
    'Normal': <Bell className="w-4 h-4" />,
    'High': <Zap className="w-4 h-4" />,
    'Critical': <Shield className="w-4 h-4" />
  }
  return iconMap[priority] || <Bell className="w-4 h-4" />
}

// Вспомогательная функция для получения цвета приоритета
function getPriorityColor(priority: string) {
  const colorMap: Record<string, string> = {
    'Low': 'gray',
    'Normal': 'blue',
    'High': 'yellow',
    'Critical': 'red'
  }
  return colorMap[priority] || 'blue'
}

const notificationTypeToNumber = (type: string): number => {
  const map: Record<string, number> = {
    'GeneralInfo': 0,
    'BookDueSoon': 1,
    'BookOverdue': 2,
    'FineAdded': 3,
    'BookReturned': 4,
    'BookReserved': 5,
  };
  return map[type] ?? 0; // Default to GeneralInfo
};

const priorityToNumber = (priority: string): number => {
  const map: Record<string, number> = {
    'Low': 0,
    'Normal': 1,
    'High': 2,
    'Critical': 3,
  };
  return map[priority] ?? 1; // Default to Normal
};

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
  }, [open])
  
  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[400px] p-0 bg-white rounded-xl shadow-2xl border border-gray-200">
        <DialogHeader className="border-b border-gray-100 px-6 py-4 pt-5">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Выберите пользователя
          </DialogTitle>
        </DialogHeader>
        <div className="p-3">
          <div className="flex items-center border-2 border-gray-100 rounded-lg px-3">
            <Search className="mr-2 h-4 w-4 text-gray-500" />
            <Input
              ref={inputRef}
              placeholder="Поиск пользователя..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-800"
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
              <motion.div
                key={user.id}
                className="flex cursor-pointer items-center p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-all duration-200"
                onClick={() => onSelect(user)}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{user.fullName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.phone && (
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    )}
                  </div>
                </div>
                {selectedUser && selectedUser.id === user.id && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </motion.div>
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
      <DialogContent className="w-[500px] p-0 bg-white rounded-xl shadow-2xl border border-gray-200">
        <DialogHeader className="border-b border-gray-100 px-6 py-4 pt-5">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Выберите пользователей
          </DialogTitle>
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
              <motion.div
                key={user.id}
                className="flex items-center p-3 hover:bg-blue-50 border-b last:border-b-0 transition-all duration-200 rounded-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Checkbox
                  id={`bulk-user-${user.id}`}
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => handleToggleUser(user.id)}
                  className="mr-3"
                />
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleToggleUser(user.id)}>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{user.fullName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.phone && (
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full bg-blue-500 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            Применить выбор ({selectedUsers.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
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

  // Состояние для email уведомлений
  const [emailTestForm, setEmailTestForm] = useState({
    title: '',
    message: '',
    type: 'GeneralInfo',
    priority: 'Normal',
    userId: ''
  })

  const [selectedTestUser, setSelectedTestUser] = useState<UserType | null>(null)
  const [showTestUserPicker, setShowTestUserPicker] = useState(false)

  useEffect(() => {
    checkConnection()
    loadUsers()
    loadStats()
  }, [])
  
  useEffect(() => {
    if (users.length > 0) {
      loadNotifications()
    }
  }, [users])

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      // Используем административный эндпоинт для получения всех уведомлений
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Дополняем уведомления информацией о пользователях
        const notificationsWithUsers = await Promise.all(
          data.map(async (notification: Notification) => {
            if (notification.userId && users.length > 0) {
              const user = users.find(u => u.id === notification.userId)
              if (user) {
                return {
                  ...notification,
                  user: {
                    fullName: user.fullName,
                    email: user.email
                  }
                }
              }
            }
            return notification
          })
        )
        
        setNotifications(notificationsWithUsers)
      } else {
        console.error('Ошибка загрузки уведомлений:', response.status, response.statusText)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить уведомления",
          variant: "destructive"
        })
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
      // Используем административный эндпоинт для получения статистики
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Административная статистика уведомлений:', data)
        
        // Безопасная установка данных с проверками
        const safeStats = {
          totalNotifications: data.totalNotifications || 0,
          unreadNotifications: data.unreadNotifications || 0,
          readNotifications: data.readNotifications || 0,
          notificationsByType: (data.notificationsByType && typeof data.notificationsByType === 'object') ? data.notificationsByType : {},
          notificationsByPriority: (data.notificationsByPriority && typeof data.notificationsByPriority === 'object') ? data.notificationsByPriority : {},
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          notificationsByDate: (data.notificationsByDate && typeof data.notificationsByDate === 'object') ? data.notificationsByDate : {},
          averageResponseTime: data.averageResponseTime || 0,
          topNotificationTypes: (data.topNotificationTypes && Array.isArray(data.topNotificationTypes)) ? data.topNotificationTypes : []
        }
        
        setStats(safeStats)
      } else {
        console.error('Ошибка загрузки административной статистики:', response.status, response.statusText)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить административную статистику уведомлений",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки административной статистики:', error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке административной статистики",
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

  const handleTestUserSelect = (user: UserType) => {
    setSelectedTestUser(user)
    setEmailTestForm({...emailTestForm, userId: user.id})
    setShowTestUserPicker(false)
  }

  const handleRemoveTestUser = () => {
    setSelectedTestUser(null)
    setEmailTestForm({...emailTestForm, userId: ''})
  }

  const sendNotification = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/send-push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationForm)
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Успешно",
          description: "Push уведомление отправлено"
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
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Ошибка отправки",
          description: errorData.message || `Ошибка ${response.status}: ${response.statusText}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось отправить уведомление. Проверьте подключение к интернету",
        variant: "destructive"
      })
    }
  }

  const sendBulkNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/send-bulk-push`, {
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
        const result = await response.json()
        toast({
          title: "Успешно",
          description: `Push уведомления отправлены ${selectedUsers.length} пользователям`
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
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Ошибка массовой отправки",
          description: errorData.message || `Ошибка ${response.status}: ${response.statusText}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка массовой отправки уведомлений:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось отправить массовые уведомления. Проверьте подключение к интернету",
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
        const result = await response.json()
        toast({
          title: "Успешно",
          description: `${successMessage}. Отправлено: ${result.sentCount || 0} уведомлений`
        })
        loadStats()
        loadNotifications() // Обновляем список уведомлений
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Ошибка",
          description: errorData.message || "Не удалось отправить уведомления",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка отправки автоматических уведомлений:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось отправить уведомления",
        variant: "destructive"
      })
    }
  }

  const sendUserSpecificNotification = async (type: string) => {
    if (!selectedUser) {
      toast({
        title: "Ошибка",
        description: "Выберите пользователя",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem('token')
      let endpoint = ''
      let successMessage = ''
      
      switch (type) {
        case 'due-reminder':
          endpoint = `/api/Notification/send-due-reminder/${selectedUser.id}`
          successMessage = 'Напоминание о возврате отправлено'
          break
        case 'overdue-notification':
          endpoint = `/api/Notification/send-overdue-notification/${selectedUser.id}`
          successMessage = 'Уведомление о просрочке отправлено'
          break
        case 'fine-notification':
          endpoint = `/api/Notification/send-fine-notification/${selectedUser.id}`
          successMessage = 'Уведомление о штрафе отправлено'
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
          description: `${successMessage} пользователю ${selectedUser.fullName}`
        })
        loadStats()
        loadNotifications() // Обновляем список уведомлений
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Ошибка",
          description: errorData.message || "Не удалось отправить уведомление",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка отправки индивидуального автоматического уведомления:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось отправить уведомление",
        variant: "destructive"
      })
    }
  }

  // Функции для email уведомлений
  const sendEmailNotification = async () => {
    try {
      const token = localStorage.getItem('token')
      const payload = {
        userId: emailTestForm.userId,
        title: emailTestForm.title,
        type: emailTestForm.type,
        message: emailTestForm.message,
        templateData: {
          Message: emailTestForm.message,
          Title: emailTestForm.title,
        }
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/send-custom-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Успешно",
          description: "Email уведомление отправлено"
        })
        setEmailTestForm({
          title: '',
          message: '',
          type: 'GeneralInfo',
          priority: 'Normal',
          userId: ''
        })
        setSelectedTestUser(null)
        loadNotifications()
        loadStats()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Ошибка отправки email",
          description: errorData.message || `Ошибка ${response.status}: ${response.statusText}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка отправки email уведомления:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось отправить email уведомление",
        variant: "destructive"
      })
    }
  }

  const sendTestEmail = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/test-email/${emailTestForm.userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: emailTestForm.title,
          message: emailTestForm.message
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Успешно",
          description: "Тестовое email уведомление отправлено"
        })
        setEmailTestForm({
          title: '',
          message: '',
          type: 'GeneralInfo',
          priority: 'Normal',
          userId: ''
        })
        setSelectedTestUser(null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Ошибка отправки email",
          description: errorData.message || `Ошибка ${response.status}: ${response.statusText}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка отправки тестового email:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось отправить тестовое email уведомление",
        variant: "destructive"
      })
    }
  }

  const sendBulkEmailNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const payload = {
        title: bulkForm.title,
        message: bulkForm.message,
        type: bulkForm.type,
        priority: bulkForm.priority,
        userIds: selectedUsers,
        additionalData: ""
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/send-bulk-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Успешно",
          description: `Email уведомления отправлены ${selectedUsers.length} пользователям`
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
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Ошибка массовой отправки email",
          description: errorData.message || `Ошибка ${response.status}: ${response.statusText}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка массовой отправки email уведомлений:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось отправить массовые email уведомления",
        variant: "destructive"
      })
    }
  }

  // Функция принудительного обновления всех данных
  const refreshAllData = async () => {
    setLoading(true)
    try {
      await checkConnection() // Проверяем подключение
      
      await Promise.all([
        loadUsers(),
        loadStats(),
      ])
      
      // Загружаем уведомления после загрузки пользователей
      if (users.length > 0) {
        await loadNotifications()
      }
      
      toast({
        title: "Обновлено",
        description: "Данные успешно обновлены"
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Ошибка обновления данных:', error)
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить все данные",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Функция проверки подключения к API
  const checkConnection = async () => {
    try {
      setConnectionStatus('checking')
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/admin/stats`, {
        method: 'HEAD', // Используем HEAD для минимального запроса
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      setConnectionStatus(response.ok ? 'connected' : 'disconnected')
    } catch (error) {
      console.error('Ошибка проверки подключения:', error)
      setConnectionStatus('disconnected')
    }
  }

  if (loading) return <LoadingSpinner />;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Управление уведомлениями</h1>
              <p className="text-gray-500">Отправка и управление уведомлениями пользователей
                {!loadingUsers && (
                  <span className="ml-2 text-xs">
                    (Пользователей в системе: {users.length})
                  </span>
                )}
              </p>
              {/* Индикатор состояния подключения */}
              <div className="flex items-center gap-2 mt-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  connectionStatus === 'connected' && "bg-green-500",
                  connectionStatus === 'disconnected' && "bg-red-500",
                  connectionStatus === 'checking' && "bg-yellow-500 animate-pulse"
                )} />
                <span className="text-xs text-gray-500">
                  {connectionStatus === 'connected' && "Подключено к API"}
                  {connectionStatus === 'disconnected' && "Отключено от API"}
                  {connectionStatus === 'checking' && "Проверка подключения..."}
                </span>
                {lastUpdated && (
                  <span className="text-xs text-gray-500 ml-2">
                    • Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={refreshAllData}
                variant="outline"
                size="sm"
                disabled={loading}
                className="bg-white text-blue-500 border-2 border-blue-500 hover:bg-gray-100"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Обновить
              </Button>
              <Button 
                onClick={() => window.open('/admin/notifications/templates', '_blank')}
                variant="outline"
                className="bg-white text-blue-500 border-2 border-blue-500 hover:bg-gray-100"
              >
                Шаблоны
              </Button>
              <Button 
                onClick={() => window.open('/admin/notifications/analytics', '_blank')}
                variant="outline"
                className="bg-white text-blue-500 border-2 border-blue-500 hover:bg-gray-100"
              >
                Аналитика
              </Button>
              <Button 
                onClick={() => window.open('/admin/notifications/settings', '_blank')}
                variant="outline"
                className="bg-white text-blue-500 border-2 border-blue-500 hover:bg-gray-100"
              >
                Настройки
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Статистика */}
      {stats && (
        <div className="space-y-6">
          {/* Основная статистика */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Всего уведомлений"
              value={stats.totalNotifications}
              subtitle="отправлено в системе"
              icon={<Bell className="w-5 h-5" />}
              color="bg-blue-500"
              delay={0.1}
            />
            <StatCard
              title="Непрочитанные"
              value={stats.unreadNotifications}
              subtitle="ожидают прочтения"
              icon={<Mail className="w-5 h-5" />}
              color="bg-orange-500"
              delay={0.2}
            />
            <StatCard
              title="Прочитанные"
              value={stats.readNotifications}
              subtitle="успешно прочитано"
              icon={<CheckCircle className="w-5 h-5" />}
              color="bg-green-500"
              delay={0.3}
            />
            <StatCard
              title="Процент прочтения"
              value={`${stats.totalNotifications > 0 
                ? Math.round((stats.readNotifications / stats.totalNotifications) * 100)
                : 0
              }%`}
              subtitle="коэффициент прочтения"
              icon={<TrendingUp className="w-5 h-5" />}
              color="bg-purple-500"
              delay={0.4}
            />
          </div>

          {/* Дополнительная административная статистика */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.topNotificationTypes && stats.topNotificationTypes.length > 0 && (
              <StatCard
                title="Популярный тип"
                value={getNotificationTypeDisplayName(stats.topNotificationTypes[0]?.type)}
                subtitle={`${stats.topNotificationTypes[0]?.count} уведомлений`}
                icon={<TrendingUp className="w-5 h-5" />}
                color="bg-pink-500"
                delay={0.7}
              />
            )}
          </div>
        </div>
      )}

      <FadeInView delay={0.8}>
        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-lg border border-gray-200">
            <TabsTrigger value="send" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 transition-all duration-200">Push уведомления</TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 transition-all duration-200">Массовая отправка</TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 transition-all duration-200">Email уведомления</TabsTrigger>
            <TabsTrigger value="auto" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 transition-all duration-200">Автоматические</TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 transition-all duration-200">Управление</TabsTrigger>
          </TabsList>

        {/* Управление уведомлениями */}
        <TabsContent value="manage">
          <NotificationManager notifications={notifications as Notification[]} onRefresh={loadNotifications} />
        </TabsContent>

        {/* Push уведомления */}
        <TabsContent value="send">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Индивидуальное уведомление */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white rounded-xl shadow-lg border border-gray-200 h-full">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-500" />
                    Push уведомление
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Отправка индивидуального уведомления пользователю
                  </CardDescription>
                </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Пользователь</Label>
                  {selectedUser ? (
                    <div className="flex items-center justify-between p-3 border-2 border-blue-300 rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="font-medium text-gray-800">{selectedUser.fullName}</div>
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
                      className="w-full justify-start bg-white text-blue-500 border-2 border-blue-500 hover:bg-gray-100"
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
                className="w-full md:w-auto bg-blue-500 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Send className="mr-2 h-4 w-4" />
                Отправить уведомление
              </Button>
            </CardContent>
              </Card>
            </motion.div>

            {/* Автоматические уведомления для конкретного пользователя */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-white rounded-xl shadow-lg border border-gray-200 h-full">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Автоматические уведомления
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Отправка автоматических уведомлений конкретному пользователю
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Выберите пользователя</Label>
                    {selectedUser ? (
                      <div className="flex items-center justify-between p-3 border-2 border-orange-300 rounded-lg bg-orange-50">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-orange-500" />
                          <div>
                            <div className="font-medium text-gray-800">{selectedUser.fullName}</div>
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
                        className="w-full justify-start bg-white text-orange-500 border-2 border-orange-500 hover:bg-orange-50"
                        disabled={loadingUsers}
                      >
                        <User className="mr-2 h-4 w-4" />
                        {loadingUsers ? 'Загрузка пользователей...' : 'Выберите пользователя'}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={() => sendUserSpecificNotification('due-reminder')}
                      disabled={!selectedUser}
                      className="w-full bg-blue-500 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Напоминание о возврате
                    </Button>
                    
                    <Button 
                      onClick={() => sendUserSpecificNotification('overdue-notification')}
                      disabled={!selectedUser}
                      className="w-full bg-orange-500 hover:bg-orange-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Уведомление о просрочке
                    </Button>
                    
                    <Button 
                      onClick={() => sendUserSpecificNotification('fine-notification')}
                      disabled={!selectedUser}
                      className="w-full bg-red-500 hover:bg-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Уведомление о штрафе
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Массовая отправка */}
        <TabsContent value="bulk">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Массовая отправка
                </CardTitle>
                <CardDescription className="text-gray-500">
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
                  <div className="border-2 border-blue-300 rounded-lg p-3 bg-blue-50">
                    <div className="text-sm font-medium mb-2 text-gray-800">
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
              
              <div className="flex flex-col md:flex-row gap-3">
                <Button 
                  onClick={sendBulkNotifications}
                  disabled={!bulkForm.title || !bulkForm.message || selectedUsers.length === 0}
                  className="bg-blue-500 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Push уведомления ({selectedUsers.length})
                </Button>
                
                <Button 
                  onClick={sendBulkEmailNotifications}
                  disabled={!bulkForm.title || !bulkForm.message || selectedUsers.length === 0}
                  variant="outline"
                  className="bg-white text-green-600 border-2 border-green-600 hover:bg-green-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <MailCheck className="mr-2 h-4 w-4" />
                  Email уведомления ({selectedUsers.length})
                </Button>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Email уведомления */}
        <TabsContent value="email">
          <div className="flex justify-center">
            {/* Вариант 3: Элитный дизайн с анимациями */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full max-w-lg"
            >
              <div className="relative">
                {/* Анимированный фон */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl opacity-70"></div>
                
                <Card className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border-0 overflow-hidden">
                  {/* Динамическая верхняя полоса */}
                  <div className={`h-1 w-full bg-gradient-to-r ${
                    emailTestForm.type === 'GeneralInfo' ? 'from-blue-400 via-blue-500 to-blue-600' :
                    emailTestForm.type === 'BookDueSoon' ? 'from-orange-400 via-orange-500 to-orange-600' :
                    emailTestForm.type === 'BookOverdue' ? 'from-red-400 via-red-500 to-red-600' :
                    emailTestForm.type === 'FineAdded' ? 'from-purple-400 via-purple-500 to-purple-600' :
                    emailTestForm.type === 'BookReturned' ? 'from-green-400 via-green-500 to-green-600' :
                    emailTestForm.type === 'BookReserved' ? 'from-indigo-400 via-indigo-500 to-indigo-600' :
                    'from-blue-400 via-blue-500 to-blue-600'
                  } shadow-lg`}></div>
                  
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-3">
                      <motion.div 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          emailTestForm.type === 'GeneralInfo' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                          emailTestForm.type === 'BookDueSoon' ? 'bg-gradient-to-br from-orange-500 to-orange-700' :
                          emailTestForm.type === 'BookOverdue' ? 'bg-gradient-to-br from-red-500 to-red-700' :
                          emailTestForm.type === 'FineAdded' ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
                          emailTestForm.type === 'BookReturned' ? 'bg-gradient-to-br from-green-500 to-green-700' :
                          emailTestForm.type === 'BookReserved' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' :
                          'bg-gradient-to-br from-blue-500 to-blue-700'
                        }`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <MailCheck className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <div className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                          Отправка Email
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="px-6 pb-6 space-y-5">
                    {/* Получатель */}
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        Получатель
                      </Label>
                      
                      {selectedTestUser ? (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-green-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{selectedTestUser.fullName}</div>
                                <div className="text-green-600 text-sm">{selectedTestUser.email}</div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleRemoveTestUser}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setShowTestUserPicker(true)}
                          className="w-full h-16 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl"
                          disabled={loadingUsers}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <User className="w-5 h-5 text-gray-500" />
                            <div className="text-sm font-medium">
                              {loadingUsers ? 'Загрузка...' : 'Выбрать получателя'}
                            </div>
                          </div>
                        </Button>
                      )}
                    </div>

                    {/* Настройки */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            emailTestForm.type === 'GeneralInfo' ? 'bg-blue-500' :
                            emailTestForm.type === 'BookDueSoon' ? 'bg-orange-500' :
                            emailTestForm.type === 'BookOverdue' ? 'bg-red-500' :
                            emailTestForm.type === 'FineAdded' ? 'bg-purple-500' :
                            emailTestForm.type === 'BookReturned' ? 'bg-green-500' :
                            emailTestForm.type === 'BookReserved' ? 'bg-indigo-500' :
                            'bg-blue-500'
                          }`}></div>
                          Категория
                        </Label>
                        <Select 
                          value={emailTestForm.type || 'GeneralInfo'} 
                          onValueChange={(value) => setEmailTestForm({...emailTestForm, type: value})}
                        >
                          <SelectTrigger className="h-12 border-2 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GeneralInfo">📢 Общая информация</SelectItem>
                            <SelectItem value="BookDueSoon">⏰ Скоро возврат</SelectItem>
                            <SelectItem value="BookOverdue">🚨 Просрочка</SelectItem>
                            <SelectItem value="FineAdded">💰 Штраф</SelectItem>
                            <SelectItem value="BookReturned">✅ Возврат</SelectItem>
                            <SelectItem value="BookReserved">📅 Резерв</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            emailTestForm.priority === 'Low' ? 'bg-gray-500' :
                            emailTestForm.priority === 'Normal' ? 'bg-blue-500' :
                            emailTestForm.priority === 'High' ? 'bg-yellow-500' :
                            emailTestForm.priority === 'Critical' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}></div>
                          Важность
                        </Label>
                        <Select 
                          value={emailTestForm.priority || 'Normal'} 
                          onValueChange={(value) => setEmailTestForm({...emailTestForm, priority: value})}
                        >
                          <SelectTrigger className="h-12 border-2 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">🔵 Низкий</SelectItem>
                            <SelectItem value="Normal">🟡 Обычный</SelectItem>
                            <SelectItem value="High">🟠 Высокий</SelectItem>
                            <SelectItem value="Critical">🔴 Критический</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Содержание */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                          <Star className="w-3 h-3 text-yellow-500" />
                          Заголовок
                        </Label>
                        <Input
                          value={emailTestForm.title}
                          onChange={(e) => setEmailTestForm({...emailTestForm, title: e.target.value})}
                          placeholder="Введите заголовок..."
                          className="h-12 border-2 rounded-xl"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                          <Mail className="w-3 h-3 text-blue-500" />
                          Сообщение
                        </Label>
                        <Textarea
                          value={emailTestForm.message}
                          onChange={(e) => setEmailTestForm({...emailTestForm, message: e.target.value})}
                          placeholder="Введите текст..."
                          rows={3}
                          className="border-2 rounded-xl resize-none"
                        />
                      </div>
                    </div>
                    
                    {/* Кнопка отправки */}
                    <Button 
                      onClick={sendEmailNotification}
                      disabled={!emailTestForm.title || !emailTestForm.message || !emailTestForm.userId}
                      className={`w-full h-14 text-white rounded-xl font-bold ${
                        emailTestForm.type === 'GeneralInfo' ? 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800' :
                        emailTestForm.type === 'BookDueSoon' ? 'bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800' :
                        emailTestForm.type === 'BookOverdue' ? 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800' :
                        emailTestForm.type === 'FineAdded' ? 'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800' :
                        emailTestForm.type === 'BookReturned' ? 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800' :
                        emailTestForm.type === 'BookReserved' ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800' :
                        'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800'
                      }`}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="mr-2"
                      >
                        <MailCheck className="w-5 h-5" />
                      </motion.div>
                      Отправить
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        {/* Автоматические уведомления */}
        <TabsContent value="auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="bg-white rounded-xl shadow-lg border border-gray-200 h-full">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Напоминания о возврате
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Отправить напоминания пользователям о скором сроке возврата книг
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button 
                    onClick={() => sendAutomaticNotifications('due-reminders')} 
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Отправить напоминания
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <Card className="bg-white rounded-xl shadow-lg border border-gray-200 h-full">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    Уведомления о просрочке
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Отправить уведомления о просроченных книгах
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button 
                    onClick={() => sendAutomaticNotifications('overdue')} 
                    className="w-full bg-orange-500 hover:bg-orange-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Отправить уведомления
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <Card className="bg-white rounded-xl shadow-lg border border-gray-200 h-full">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Уведомления о штрафах
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Отправить уведомления о начисленных штрафах
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button 
                    onClick={() => sendAutomaticNotifications('fines')} 
                    className="w-full bg-red-500 hover:bg-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Отправить уведомления
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
        </Tabs>
      </FadeInView>

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

      {/* Модальное окно выбора тестового пользователя */}
      <UserPickerModal
        open={showTestUserPicker}
        onOpenChange={setShowTestUserPicker}
        users={users}
        onSelect={handleTestUserSelect}
        selectedUser={selectedTestUser}
      />
    </div>
    </div>
  )
} 