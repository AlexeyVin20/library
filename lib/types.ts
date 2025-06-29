export interface Book {
  id: string;
  title: string;
  authors?: string;
  isbn?: string;
  cover?: string;
  availableCopies?: number;
  shelfId?: number;
  position?: number;
  genre?: string;
  categorization?: string;
}

export interface Journal {
  id: string;
  title: string;
  publisher?: string;
  issn?: string;
  coverImageUrl?: string;
  shelfId?: number;
  position?: number;
}

export interface Shelf {
  id: number;
  category: string;
  capacity: number;
  shelfNumber: number;
  posX: number;
  posY: number;
  lastReorganized?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Borrowing {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: 'active' | 'returned' | 'overdue';
}

// Типы для системы уведомлений
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  createdAt: string
  isRead: boolean
  readAt?: string
  isDelivered: boolean
  deliveredAt?: string
  additionalData?: string
  bookId?: string
  borrowedBookId?: string
  bookTitle?: string
  bookAuthors?: string
  bookCover?: string
}

export type NotificationType = 
  | "BookDueSoon"
  | "BookOverdue" 
  | "FineAdded"
  | "FineIncreased"
  | "BookReturned"
  | "BookReserved"
  | "ReservationExpired"
  | "NewBookAvailable"
  | "AccountBlocked"
  | "AccountUnblocked"
  | "SystemMaintenance"
  | "GeneralInfo"

export type NotificationPriority = "Low" | "Normal" | "High" | "Critical"

export interface NotificationStats {
  totalNotifications: number
  unreadNotifications: number
  readNotifications: number
  deliveredNotifications: number
  pendingNotifications: number
  notificationsByType: Record<string, number>
  notificationsByPriority: Record<string, number>
}

export interface NotificationCreateDto {
  userId: string
  title: string
  message: string
  type: NotificationType
  priority?: NotificationPriority
  additionalData?: string
  bookId?: string
  borrowedBookId?: string
} 