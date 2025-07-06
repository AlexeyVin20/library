'use client';

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

interface BookType {
  id: string;
  title: string;
  authorName: string;
  publicationYear: number;
  coverImageUrl?: string;
  actualReturnDate?: string;
}

interface ReservationType {
  id: string;
  bookId: string;
  bookTitle: string;
  authorName: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  book: BookType;
  actualReturnDate?: string;
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
    'GeneralEmail': 'Общая информация',
    'ReturnSoon': 'Скоро возврат книги',
    'BookOverdue': 'Просроченная книга',
    'FineAdded': 'Штраф начислен',
    'BookReturned': 'Книга возвращена',
    'ReservationReady': 'Книга зарезервирована'
  }
  return typeMap[type] || type
}

// Вспомогательная функция для получения иконки типа уведомления
function getNotificationTypeIcon(type: string) {
  const iconMap: Record<string, React.ReactNode> = {
    'GeneralEmail': <Info className="w-4 h-4" />,
    'ReturnSoon': <Timer className="w-4 h-4" />,
    'BookOverdue': <AlertCircle className="w-4 h-4" />,
    'FineAdded': <DollarSign className="w-4 h-4" />,
    'BookReturned': <BookOpen className="w-4 h-4" />,
    'ReservationReady': <Calendar className="w-4 h-4" />
  }
  return iconMap[type] || <Info className="w-4 h-4" />
}

// Вспомогательная функция для получения цвета типа уведомления
function getNotificationTypeColor(type: string) {
  const colorMap: Record<string, string> = {
    'GeneralEmail': 'blue',
    'ReturnSoon': 'orange',
    'BookOverdue': 'red',
    'FineAdded': 'purple',
    'BookReturned': 'green',
    'ReservationReady': 'indigo'
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
    'GeneralEmail': 0,
    'ReturnSoon': 1,
    'BookOverdue': 2,
    'FineAdded': 3,
    'BookReturned': 4,
    'ReservationReady': 5,
  };
  return map[type] ?? 0; // Default to GeneralEmail
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
      <DialogContent className="w-[600px] p-0 bg-white rounded-xl shadow-2xl border border-gray-200">
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

// Компонент модального окна выбора книги
function BookPickerModal({
  open,
  onOpenChange,
  books,
  onSelect,
  selectedBook
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  books: BookType[]
  onSelect: (book: BookType) => void
  selectedBook: BookType | null
}) {
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.authorName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px] p-0 bg-white rounded-xl shadow-2xl border border-gray-200">
        <DialogHeader className="border-b border-gray-100 px-6 py-4 pt-5">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Выберите книгу
          </DialogTitle>
        </DialogHeader>
        <div className="p-3">
          <div className="flex items-center border-2 border-gray-100 rounded-lg px-3">
            <Search className="mr-2 h-4 w-4 text-gray-500" />
            <Input
              ref={inputRef}
              placeholder="Поиск по названию или автору..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-800"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredBooks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div>Книги не найдены</div>
              <div className="text-xs mt-2">
                Всего книг: {books.length}, Поиск: "{search}"
              </div>
            </div>
          ) : (
            filteredBooks.map((book) => (
              <motion.div
                key={book.id}
                className="flex cursor-pointer items-center p-3 hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-all duration-200"
                onClick={() => onSelect(book)}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{book.title}</div>
                    <div className="text-sm text-gray-500">{book.authorName}, {book.publicationYear}</div>
                  </div>
                </div>
                {selectedBook && selectedBook.id === book.id && (
                  <CheckCircle className="h-5 w-5 text-indigo-500" />
                )}
              </motion.div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Компонент модального окна выбора резервирования
function ReservationPickerModal({
  open,
  onOpenChange,
  reservations,
  onSelect
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservations: ReservationType[]
  onSelect: (reservation: ReservationType) => void
}) {
  const [search, setSearch] = useState("")

  const filteredReservations = reservations.filter(r =>
    r.bookTitle.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px] p-0 bg-white rounded-xl shadow-2xl border border-gray-200">
        <DialogHeader className="border-b border-gray-100 px-6 py-4 pt-5">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            Выберите резервирование
          </DialogTitle>
        </DialogHeader>
        <div className="p-3">
           <Input
              placeholder="Поиск по названию книги..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredReservations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Резервирования не найдены.
            </div>
          ) : (
            filteredReservations.map((reservation) => (
              <motion.div
                key={reservation.id}
                className="flex cursor-pointer items-center p-3 hover:bg-green-50 border-b last:border-b-0"
                onClick={() => onSelect(reservation)}
                whileHover={{ x: 5 }}
              >
                <div className="flex items-center gap-3 flex-1">
                   <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{reservation.bookTitle}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(reservation.reservationDate).toLocaleDateString()} - {reservation.status}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
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
  
  // Состояние для книг
  const [books, setBooks] = useState<BookType[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);

  // Состояние для резервирований
  const [reservations, setReservations] = useState<ReservationType[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [showReservationPicker, setShowReservationPicker] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationType | null>(null);

  const [singleNotificationForm, setSingleNotificationForm] = useState({
    title: '',
    message: '',
    type: 'GeneralEmail',
    priority: 'Normal',
    userId: '',
    fineAmount: '',
    reason: '',
    dueDate: '',
    pickupUntilDate: '',
  });
  
  const [bulkForm, setBulkForm] = useState({
    title: '',
    message: '',
    type: 'GeneralEmail',
    priority: 'Normal'
  })

  useEffect(() => {
    checkConnection()
    loadUsers()
    loadStats()
    // loadBooks() - убираем отсюда, книги будут грузиться по выбору пользователя
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

  const loadReservationsForUser = async (userId: string) => {
    try {
      setLoadingReservations(true);
      setLoadingBooks(true);
      setReservations([]);
      setBooks([]);
      setSelectedBook(null);
      setSelectedReservation(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Reservation/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Форматируем резервирования
        const formattedReservations = data.map((res: any) => ({
          id: res.id,
          bookId: res.book.id,
          bookTitle: res.book.title,
          authorName: res.book.author?.name || 'Неизвестный автор',
          reservationDate: res.reservationDate,
          expirationDate: res.expirationDate,
          status: res.status,
          book: {
            id: res.book.id,
            title: res.book.title,
            authorName: res.book.author?.name || 'Неизвестный автор',
            publicationYear: res.book.publicationYear,
            coverImageUrl: res.book.coverImageUrl,
          },
          actualReturnDate: res.actualReturnDate || undefined,
        }));
        setReservations(formattedReservations);

        // Извлекаем уникальные книги из резервирований
        const uniqueBooks = Array.from(new Map(formattedReservations.map((res: ReservationType) => [res.book.id, res.book])).values()) as BookType[];
        setBooks(uniqueBooks);

      } else {
        toast({ title: "Ошибка", description: "Не удалось загрузить резервирования пользователя", variant: "destructive" });
      }
    } catch (error) {
       toast({ title: "Ошибка", description: "Произошла ошибка при загрузке резервирований", variant: "destructive" });
    } finally {
       setLoadingReservations(false);
       setLoadingBooks(false);
    }
  };

  const handleSingleFormUserSelect = (user: UserType) => {
    setSelectedUser(user);
    setSingleNotificationForm({ ...singleNotificationForm, userId: user.id });
    setShowUserPicker(false);
    loadReservationsForUser(user.id);
  };

  const handleRemoveSingleFormUser = () => {
    setSelectedUser(null);
    setSingleNotificationForm({ ...singleNotificationForm, userId: '' });
    setReservations([]);
    setBooks([]);
    setSelectedBook(null);
    setSelectedReservation(null);
  };

  const handleBookSelect = (book: BookType) => {
    setSelectedBook(book);
    setShowBookPicker(false);
  };

  const handleRemoveSelectedBook = () => {
    setSelectedBook(null);
  };

  const handleReservationSelect = async (reservation: ReservationType) => {
    setShowReservationPicker(false);
    // Делаем дополнительный запрос для получения всех полей, включая actualReturnDate
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Reservation/${reservation.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Обновляем выбранное резервирование всеми полями
        const updatedReservation: ReservationType = {
          ...reservation,
          actualReturnDate: data.actualReturnDate || undefined,
          expirationDate: data.expirationDate || reservation.expirationDate,
        };
        setSelectedReservation(updatedReservation);
        setSelectedBook(updatedReservation.book); // Автоматически выбрать связанную книгу
      } else {
        setSelectedReservation(reservation);
        setSelectedBook(reservation.book);
      }
    } catch {
      setSelectedReservation(reservation);
      setSelectedBook(reservation.book);
    }
  };

  const handleRemoveSelectedReservation = () => {
    setSelectedReservation(null);
    setSelectedBook(null); // Сбрасываем и книгу тоже
  };

  const sendNotification = async () => {
    try {
      const token = localStorage.getItem('token')
      const { userId, type, title, message, priority } = singleNotificationForm
      if (!userId) {
        toast({
          title: "Ошибка",
          description: "Не выбран пользователь",
          variant: "destructive"
        })
        return
      }
      
      const body = {
        userId: userId,
        title: title,
        message: message,
        type: notificationTypeToNumber(type),
        priority: priorityToNumber(priority)
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/send-custom-push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Push уведомление отправлено"
        })
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/send-bulk-custom-push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: bulkForm.title,
          message: bulkForm.message,
          type: notificationTypeToNumber(bulkForm.type),
          priority: priorityToNumber(bulkForm.priority),
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
          type: 'GeneralEmail',
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
        // Если сервер возвращает массив id (например, result.sentIds), получаем подробности
        if (result.sentIds && Array.isArray(result.sentIds)) {
          const details = await Promise.all(result.sentIds.map(async (id: string) => {
            // Пробуем получить подробности о резервировании/уведомлении
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Reservation/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
              if (res.ok) {
                const data = await res.json();
                return {
                  UserName: data.user?.fullName || 'N/A',
                  BookTitle: data.book?.title || 'N/A',
                  DueDate: data.expirationDate ? new Date(data.expirationDate).toLocaleDateString() : 'N/A',
                  ActualReturnDate: data.actualReturnDate ? new Date(data.actualReturnDate).toLocaleDateString() : 'N/A',
                  FineAmount: data.fineAmount || 'N/A',
                  Reason: data.reason || 'N/A',
                  ReservationStatus: data.status || 'N/A',
                };
              }
            } catch {}
            return { UserName: 'N/A', BookTitle: 'N/A', DueDate: 'N/A', ActualReturnDate: 'N/A', FineAmount: 'N/A', Reason: 'N/A', ReservationStatus: 'N/A' };
          }));
          toast({
            title: 'Результаты автоотправки',
            description: details.map(d => `Пользователь: ${d.UserName}, Книга: ${d.BookTitle}, Дата возврата: ${d.DueDate}, Возврат: ${d.ActualReturnDate}, Штраф: ${d.FineAmount}, Причина: ${d.Reason}, Статус: ${d.ReservationStatus}`).join('\n'),
            variant: 'default',
            duration: 12000
          });
        } else {
          toast({
            title: "Успешно",
            description: `${successMessage}. Отправлено: ${result.sentCount || 0} уведомлений` || result.message,
            variant: 'default'
          })
        }
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

      const templateData: Record<string, any> = {
          Message: singleNotificationForm.message,
          Title: singleNotificationForm.title,
      };

      if (selectedBook) {
        templateData['BookTitle'] = selectedBook.title;
        templateData['Author'] = selectedBook.authorName;
        templateData['PublicationYear'] = selectedBook.publicationYear;
      }
      if (selectedReservation) {
        templateData['ReservationDate'] = new Date(selectedReservation.reservationDate).toLocaleDateString();
        templateData['ExpirationDate'] = selectedReservation.expirationDate ? new Date(selectedReservation.expirationDate).toLocaleDateString() : 'N/A';
        templateData['ReservationStatus'] = selectedReservation.status;
        // Для BookOverdue — ExpirationDate
        if (singleNotificationForm.type === 'BookOverdue' && selectedReservation.expirationDate) {
          templateData['ExpirationDate'] = new Date(selectedReservation.expirationDate).toLocaleDateString();
        }
        // Для BookReturned — ActualReturnDate
        if (singleNotificationForm.type === 'BookReturned' && selectedReservation.actualReturnDate) {
          templateData['ActualReturnDate'] = new Date(selectedReservation.actualReturnDate).toLocaleDateString();
        }
      }
      if (selectedUser) {
        templateData['UserName'] = selectedUser.fullName;
      }
      // Если выбран тип FineAdded, добавляем поля FineAmount, Reason, DateIssued
      if (singleNotificationForm.type === 'FineAdded') {
        templateData['FineAmount'] = singleNotificationForm.fineAmount || '';
        templateData['Reason'] = singleNotificationForm.reason || '';
        templateData['DateIssued'] = new Date().toLocaleDateString();
      }
      // Если выбран тип ReturnSoon, добавляем DueDate
      if (singleNotificationForm.type === 'ReturnSoon') {
        templateData['DueDate'] = singleNotificationForm.dueDate || '';
      }
      // Если выбран тип ReservationReady, добавляем PickupUntilDate
      if (singleNotificationForm.type === 'ReservationReady') {
        templateData['PickupUntilDate'] = singleNotificationForm.pickupUntilDate || '';
      }

      const payload = {
        userId: singleNotificationForm.userId,
        title: singleNotificationForm.title,
        type: singleNotificationForm.type,
        message: singleNotificationForm.message,
        templateData: templateData
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Notification/test-email/${singleNotificationForm.userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: singleNotificationForm.title,
          message: singleNotificationForm.message
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Успешно",
          description: "Тестовое email уведомление отправлено"
        })
        setSingleNotificationForm({
          ...singleNotificationForm,
          title: '',
          message: '',
          type: 'GeneralEmail',
          priority: 'Normal',
          userId: '',
          fineAmount: '',
          reason: '',
          dueDate: '',
          pickupUntilDate: '',
        });
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
          type: 'GeneralEmail',
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
            <TabsTrigger value="send" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 transition-all duration-200">Индивидуальная отправка</TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 transition-all duration-200">Массовая отправка</TabsTrigger>
            <TabsTrigger value="auto" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 transition-all duration-200">Автоматические</TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 transition-all duration-200">Управление</TabsTrigger>
          </TabsList>

        {/* Управление уведомлениями */}
        <TabsContent value="manage">
          <NotificationManager notifications={notifications as Notification[]} onRefresh={loadNotifications} />
        </TabsContent>

        {/* Индивидуальная отправка */}
        <TabsContent value="send">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full max-w-4xl mx-auto"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl opacity-70"></div>
                
                <Card className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border-0 overflow-hidden">
                  <div className={`h-1 w-full bg-gradient-to-r ${
                    singleNotificationForm.type === 'GeneralEmail' ? 'from-blue-400 via-blue-500 to-blue-600' :
                    singleNotificationForm.type === 'ReturnSoon' ? 'from-orange-400 via-orange-500 to-orange-600' :
                    singleNotificationForm.type === 'BookOverdue' ? 'from-red-400 via-red-500 to-red-600' :
                    singleNotificationForm.type === 'FineAdded' ? 'from-purple-400 via-purple-500 to-purple-600' :
                    singleNotificationForm.type === 'BookReturned' ? 'from-green-400 via-green-500 to-green-600' :
                    singleNotificationForm.type === 'ReservationReady' ? 'from-indigo-400 via-indigo-500 to-indigo-600' :
                    'from-blue-400 via-blue-500 to-blue-600'
                  } shadow-lg`}></div>
                  
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-3">
                      <motion.div 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          singleNotificationForm.type === 'GeneralEmail' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                          singleNotificationForm.type === 'ReturnSoon' ? 'bg-gradient-to-br from-orange-500 to-orange-700' :
                          singleNotificationForm.type === 'BookOverdue' ? 'bg-gradient-to-br from-red-500 to-red-700' :
                          singleNotificationForm.type === 'FineAdded' ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
                          singleNotificationForm.type === 'BookReturned' ? 'bg-gradient-to-br from-green-500 to-green-700' :
                          singleNotificationForm.type === 'ReservationReady' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' :
                          'bg-gradient-to-br from-blue-500 to-blue-700'
                        }`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Send className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <div className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                          Индивидуальная отправка
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
                      
                      {selectedUser ? (
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
                                <div className="font-semibold text-gray-800">{selectedUser.fullName}</div>
                                <div className="text-green-600 text-sm">{selectedUser.email}</div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleRemoveSingleFormUser}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setShowUserPicker(true)}
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

                    {/* Выбор резервирования */}
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-500" />
                        Контекст (Резервирование)
                      </Label>

                      {selectedReservation ? (
                         <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{selectedReservation.bookTitle}</div>
                                <div className="text-green-600 text-sm">
                                  {new Date(selectedReservation.reservationDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleRemoveSelectedReservation}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setShowReservationPicker(true)}
                          className="w-full h-16 border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl"
                          disabled={!selectedUser || loadingReservations}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <div className="text-sm font-medium">
                              {loadingReservations ? 'Загрузка...' : 'Выбрать резервирование'}
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
                            singleNotificationForm.type === 'GeneralEmail' ? 'bg-blue-500' :
                            singleNotificationForm.type === 'ReturnSoon' ? 'bg-orange-500' :
                            singleNotificationForm.type === 'BookOverdue' ? 'bg-red-500' :
                            singleNotificationForm.type === 'FineAdded' ? 'bg-purple-500' :
                            singleNotificationForm.type === 'BookReturned' ? 'bg-green-500' :
                            singleNotificationForm.type === 'ReservationReady' ? 'bg-indigo-500' :
                            'bg-blue-500'
                          }`}></div>
                          Категория
                        </Label>
                        <Select 
                          value={singleNotificationForm.type || 'GeneralEmail'} 
                          onValueChange={(value) => setSingleNotificationForm({...singleNotificationForm, type: value})}
                        >
                          <SelectTrigger className="h-12 border-2 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GeneralEmail">📢 Общая информация</SelectItem>
                            <SelectItem value="ReturnSoon">⏰ Скоро возврат</SelectItem>
                            <SelectItem value="BookOverdue">🚨 Просрочка</SelectItem>
                            <SelectItem value="FineAdded">💰 Штраф</SelectItem>
                            <SelectItem value="BookReturned">✅ Возврат</SelectItem>
                            <SelectItem value="ReservationReady">📅 Резерв</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            singleNotificationForm.priority === 'Low' ? 'bg-gray-500' :
                            singleNotificationForm.priority === 'Normal' ? 'bg-blue-500' :
                            singleNotificationForm.priority === 'High' ? 'bg-yellow-500' :
                            singleNotificationForm.priority === 'Critical' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}></div>
                          Важность
                        </Label>
                        <Select 
                          value={singleNotificationForm.priority || 'Normal'} 
                          onValueChange={(value) => setSingleNotificationForm({...singleNotificationForm, priority: value})}
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
                      {/* Для штрафа: сумма и причина */}
                      {singleNotificationForm.type === 'FineAdded' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                              <DollarSign className="w-3 h-3 text-purple-500" />
                              Сумма штрафа
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              value={singleNotificationForm.fineAmount}
                              onChange={e => setSingleNotificationForm({...singleNotificationForm, fineAmount: e.target.value})}
                              placeholder="Введите сумму..."
                              className="h-12 border-2 rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                              <Info className="w-3 h-3 text-purple-500" />
                              Причина
                            </Label>
                            <Input
                              value={singleNotificationForm.reason}
                              onChange={e => setSingleNotificationForm({...singleNotificationForm, reason: e.target.value})}
                              placeholder="Причина штрафа..."
                              className="h-12 border-2 rounded-xl"
                            />
                          </div>
                        </div>
                      )}
                      {/* Для ReturnSoon: DueDate */}
                      {singleNotificationForm.type === 'ReturnSoon' && (
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-orange-500" />
                            Дата возврата
                          </Label>
                          <Input
                            type="date"
                            value={singleNotificationForm.dueDate}
                            onChange={e => setSingleNotificationForm({...singleNotificationForm, dueDate: e.target.value})}
                            className="h-12 border-2 rounded-xl"
                          />
                        </div>
                      )}
                      {/* Для ReservationReady: PickupUntilDate */}
                      {singleNotificationForm.type === 'ReservationReady' && (
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            Дата окончания хранения (PickupUntilDate)
                          </Label>
                          <Input
                            type="date"
                            value={singleNotificationForm.pickupUntilDate}
                            onChange={e => setSingleNotificationForm({...singleNotificationForm, pickupUntilDate: e.target.value})}
                            className="h-12 border-2 rounded-xl"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                          <Star className="w-3 h-3 text-yellow-500" />
                          Заголовок
                        </Label>
                        <Input
                          value={singleNotificationForm.title}
                          onChange={(e) => setSingleNotificationForm({...singleNotificationForm, title: e.target.value})}
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
                          value={singleNotificationForm.message}
                          onChange={(e) => setSingleNotificationForm({...singleNotificationForm, message: e.target.value})}
                          placeholder="Введите текст..."
                          rows={3}
                          className="border-2 rounded-xl resize-none"
                        />
                      </div>
                    </div>
                    
                    {/* Кнопки отправки */}
                    <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-200">
                      <Button 
                        onClick={sendNotification}
                        disabled={!singleNotificationForm.title || !singleNotificationForm.message || !singleNotificationForm.userId}
                        className="flex-1 h-12 bg-blue-500 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Отправить Push
                      </Button>
                      
                      <Button 
                        onClick={sendEmailNotification}
                        disabled={!singleNotificationForm.title || !singleNotificationForm.message || !singleNotificationForm.userId}
                        className="flex-1 h-12 bg-green-500 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <MailCheck className="mr-2 h-4 w-4" />
                        Отправить Email
                      </Button>
                    </div>

                    {/* Автоматические для пользователя */}
                    <div className="pt-4 border-t border-gray-200">
                       <Label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-orange-500" />
                        Авто-уведомления для выбранного пользователя
                      </Label>
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
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            </motion.div>
        </TabsContent>

        {/* Массовая отправка */}
        <TabsContent value="bulk">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full max-w-4xl mx-auto"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-xl opacity-70"></div>
                
                <Card className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border-0 overflow-hidden">
                  <div className={`h-1 w-full bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-600 shadow-lg`}></div>
                  
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-3">
                      <motion.div 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-cyan-700`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Users className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <div className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                          Массовая отправка
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="px-6 pb-6 space-y-5">
                    {/* Выбор пользователей */}
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        Получатели
                      </Label>
                      
                      <Button
                        variant="outline"
                        onClick={() => setShowBulkUserPicker(true)}
                        className="w-full h-16 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl"
                        disabled={loadingUsers}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Users className="w-5 h-5 text-gray-500" />
                          <div className="text-sm font-medium">
                            {loadingUsers ? 'Загрузка...' : 'Выбрать получателей'} ({selectedUsers.length} выбрано)
                          </div>
                        </div>
                      </Button>

                      {selectedUsers.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold text-gray-800">
                              Выбранные пользователи ({selectedUsers.length}):
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUsers([])}
                            >
                              Очистить
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                            {selectedUsers.map((userId) => {
                              const user = users.find(u => u.id === userId)
                              if (!user) return null
                              return (
                                <Badge key={userId} variant="secondary" className="bg-white border-blue-300 text-blue-800">
                                  {user.fullName}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Настройки */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Категория</Label>
                        <Select 
                          value={bulkForm.type || 'GeneralEmail'} 
                          onValueChange={(value) => setBulkForm({...bulkForm, type: value})}
                        >
                          <SelectTrigger className="h-12 border-2 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GeneralEmail">📢 Общая информация</SelectItem>
                            <SelectItem value="ReturnSoon">⏰ Скоро возврат</SelectItem>
                            <SelectItem value="BookOverdue">🚨 Просрочка</SelectItem>
                            <SelectItem value="FineAdded">💰 Штраф</SelectItem>
                            <SelectItem value="BookReturned">✅ Возврат</SelectItem>
                            <SelectItem value="ReservationReady">📅 Резерв</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Важность</Label>
                        <Select 
                          value={bulkForm.priority || 'Normal'} 
                          onValueChange={(value) => setBulkForm({...bulkForm, priority: value})}
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
                          value={bulkForm.title}
                          onChange={(e) => setBulkForm({...bulkForm, title: e.target.value})}
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
                          value={bulkForm.message}
                          onChange={(e) => setBulkForm({...bulkForm, message: e.target.value})}
                          placeholder="Введите текст..."
                          rows={3}
                          className="border-2 rounded-xl resize-none"
                        />
                      </div>
                    </div>
                    
                    {/* Кнопки отправки */}
                    <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-200">
                      <Button 
                        onClick={sendBulkNotifications}
                        disabled={!bulkForm.title || !bulkForm.message || selectedUsers.length === 0}
                        className="flex-1 h-12 bg-blue-500 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Отправить Push ({selectedUsers.length})
                      </Button>
                      
                      <Button 
                        onClick={sendBulkEmailNotifications}
                        disabled={!bulkForm.title || !bulkForm.message || selectedUsers.length === 0}
                        className="flex-1 h-12 bg-green-500 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <MailCheck className="mr-2 h-4 w-4" />
                        Отправить Email ({selectedUsers.length})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
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
                    Отправить напоминания пользователям о скором сроке возврата книг (может работать некорректно)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button 
                    onClick={() => sendAutomaticNotifications('due-reminders')} 
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Отправить напоминания (бета версия)
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
                    Отправить уведомления о просроченных книгах (может работать некорректно)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button 
                    onClick={() => sendAutomaticNotifications('overdue')} 
                    className="w-full bg-orange-500 hover:bg-orange-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Отправить уведомления (бета версия)
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
        onSelect={handleSingleFormUserSelect}
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
        open={showUserPicker}
        onOpenChange={setShowUserPicker}
        users={users}
        onSelect={handleSingleFormUserSelect}
        selectedUser={selectedUser}
      />

      {/* Модальное окно выбора книги */}
      <BookPickerModal
        open={showBookPicker}
        onOpenChange={setShowBookPicker}
        books={books}
        onSelect={handleBookSelect}
        selectedBook={selectedBook}
      />

      {/* Модальное окно выбора резервирования */}
      <ReservationPickerModal
        open={showReservationPicker}
        onOpenChange={setShowReservationPicker}
        reservations={reservations}
        onSelect={handleReservationSelect}
      />
    </div>
    </div>
  )
} 