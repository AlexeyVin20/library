import { 
  Bell, 
  BookOpen, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle, 
  Calendar, 
  Clock, 
  Info, 
  Shield, 
  ShieldCheck, 
  Settings,
  Sparkles
} from 'lucide-react'
import type { NotificationType, NotificationPriority } from '@/lib/types'

// Получение иконки для типа уведомления
export const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'BookDueSoon':
      return <Clock className="h-4 w-4 text-orange-500" />
    case 'BookOverdue':
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'FineAdded':
    case 'FineIncreased':
      return <DollarSign className="h-4 w-4 text-red-600" />
    case 'BookReturned':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'BookReserved':
      return <Calendar className="h-4 w-4 text-blue-500" />
    case 'ReservationExpired':
      return <Clock className="h-4 w-4 text-gray-500" />
    case 'NewBookAvailable':
      return <Sparkles className="h-4 w-4 text-purple-500" />
    case 'AccountBlocked':
      return <Shield className="h-4 w-4 text-red-500" />
    case 'AccountUnblocked':
      return <ShieldCheck className="h-4 w-4 text-green-500" />
    case 'SystemMaintenance':
      return <Settings className="h-4 w-4 text-yellow-500" />
    case 'GeneralInfo':
    default:
      return <Info className="h-4 w-4 text-blue-500" />
  }
}

// Получение цвета фона для приоритета
export const getPriorityColor = (priority: NotificationPriority): string => {
  switch (priority) {
    case 'Critical':
      return 'bg-red-50 border-red-200'
    case 'High':
      return 'bg-orange-50 border-orange-200'
    case 'Normal':
      return 'bg-blue-50 border-blue-200'
    case 'Low':
      return 'bg-gray-50 border-gray-200'
    default:
      return 'bg-blue-50 border-blue-200'
  }
}

// Получение цвета текста для приоритета
export const getPriorityTextColor = (priority: NotificationPriority): string => {
  switch (priority) {
    case 'Critical':
      return 'text-red-700'
    case 'High':
      return 'text-orange-700'
    case 'Normal':
      return 'text-blue-700'
    case 'Low':
      return 'text-gray-700'
    default:
      return 'text-blue-700'
  }
}

// Получение русского названия приоритета
export const getPriorityLabel = (priority: NotificationPriority): string => {
  switch (priority) {
    case 'Critical':
      return 'Критический'
    case 'High':
      return 'Высокий'
    case 'Normal':
      return 'Обычный'
    case 'Low':
      return 'Низкий'
    default:
      return 'Обычный'
  }
}

// Получение русского названия типа уведомления
export const getNotificationTypeLabel = (type: NotificationType): string => {
  switch (type) {
    case 'BookDueSoon':
      return 'Скоро возврат книги'
    case 'BookOverdue':
      return 'Просроченная книга'
    case 'FineAdded':
      return 'Начислен штраф'
    case 'FineIncreased':
      return 'Увеличен штраф'
    case 'BookReturned':
      return 'Книга возвращена'
    case 'BookReserved':
      return 'Книга зарезервирована'
    case 'ReservationExpired':
      return 'Резервация истекла'
    case 'NewBookAvailable':
      return 'Новая книга доступна'
    case 'AccountBlocked':
      return 'Аккаунт заблокирован'
    case 'AccountUnblocked':
      return 'Аккаунт разблокирован'
    case 'SystemMaintenance':
      return 'Техобслуживание'
    case 'GeneralInfo':
      return 'Общая информация'
    default:
      return 'Уведомление'
  }
}

// Форматирование относительного времени
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return 'Только что'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} мин. назад`
  } else if (diffInMinutes < 1440) { // 24 часа
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours} ч. назад`
  } else if (diffInMinutes < 10080) { // 7 дней
    const days = Math.floor(diffInMinutes / 1440)
    return `${days} дн. назад`
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
}

// Получение краткого описания уведомления
export const getNotificationDescription = (type: NotificationType): string => {
  switch (type) {
    case 'BookDueSoon':
      return 'Приближается срок возврата книги'
    case 'BookOverdue':
      return 'Просрочен срок возврата'
    case 'FineAdded':
      return 'На ваш счет начислен штраф'
    case 'FineIncreased':
      return 'Размер штрафа увеличен'
    case 'BookReturned':
      return 'Книга успешно возвращена'
    case 'BookReserved':
      return 'Книга забронирована для вас'
    case 'ReservationExpired':
      return 'Срок бронирования истек'
    case 'NewBookAvailable':
      return 'Появилась новая книга'
    case 'AccountBlocked':
      return 'Ваш аккаунт заблокирован'
    case 'AccountUnblocked':
      return 'Ваш аккаунт разблокирован'
    case 'SystemMaintenance':
      return 'Системное обслуживание'
    case 'GeneralInfo':
      return 'Информационное сообщение'
    default:
      return 'Новое уведомление'
  }
} 