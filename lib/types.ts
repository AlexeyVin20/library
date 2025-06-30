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

// Интерфейс для резервирований согласно новой модели
export interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  bookInstanceId?: string; // Связь с конкретным экземпляром книги
  reservationDate: string;
  expirationDate: string;
  actualReturnDate?: string; // Фактическая дата возврата
  status: ReservationStatus;
  notes?: string;
  user?: UserDto;
  book?: BookDto;
  bookInstance?: BookInstanceDto;
}

export interface ReservationDto {
  id: string;
  userId: string;
  bookId: string;
  bookInstanceId?: string;
  reservationDate: string;
  expirationDate: string;
  actualReturnDate?: string;
  status: string;
  notes?: string;
  user?: UserDto;
  book?: BookDto;
  bookInstance?: BookInstanceDto;
}

export interface ReservationCreateDto {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
}

export interface ReservationUpdateDto {
  id: string;
  userId: string;
  bookId: string;
  bookInstanceId?: string;
  reservationDate: string;
  expirationDate: string;
  actualReturnDate?: string;
  status: string;
  notes?: string;
}

export type ReservationStatus = 
  | "Обрабатывается"
  | "Одобрена"
  | "Отменена"
  | "Истекла"
  | "Выдана"
  | "Возвращена"
  | "Просрочена"
  | "Отменена_пользователем";

export interface UserDto {
  id?: string;
  fullName: string;
  email?: string;
  phone?: string;
}

export interface BookInstanceDto {
  id: string;
  bookId: string;
  instanceCode: string;
  status: string;
  condition: string;
  purchasePrice?: number;
  dateAcquired: string;
  dateLastChecked?: string;
  notes?: string;
  shelfId?: number;
  shelf?: ShelfDto;
  position?: number;
  location?: string;
  isActive: boolean;
  dateCreated: string;
  dateModified: string;
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

export interface BookInstance {
  id: string;
  bookId: string;
  book?: BookDto;
  instanceCode: string;
  status: string;
  condition: string;
  purchasePrice?: number;
  dateAcquired: string;
  dateLastChecked?: string;
  notes?: string;
  shelfId?: number;
  shelf?: ShelfDto;
  position?: number;
  location?: string;
  isActive: boolean;
  dateCreated: string;
  dateModified: string;
}

export interface BookDto {
  id: string;
  title: string;
  authors: string;
  isbn: string;
  genre?: string;
  publisher?: string;
  publicationYear?: number;
  description?: string;
  cover?: string;
}

export interface ShelfDto {
  id: number;
  category: string;
  shelfNumber: number;
}

export interface BookInstanceSimpleDto {
  id: string;
  bookId: string;
  instanceCode: string;
  status: string;
  condition: string;
  location?: string;
  isActive: boolean;
}

export interface BookInstanceCreateDto {
  bookId: string;
  instanceCode: string;
  status: string;
  condition: string;
  purchasePrice?: number;
  dateAcquired: string;
  notes?: string;
  shelfId?: number;
  position?: number;
  location?: string;
  isActive: boolean;
}

export interface BookInstanceUpdateDto {
  instanceCode: string;
  status: string;
  condition: string;
  purchasePrice?: number;
  dateAcquired: string;
  dateLastChecked?: string;
  notes?: string;
  shelfId?: number;
  position?: number;
  location?: string;
  isActive: boolean;
} 