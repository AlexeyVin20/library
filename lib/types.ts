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
  // Дополнительные сведения для расширенного отображения
  publisher?: string;
  publicationYear?: number;
  pageCount?: number;
  language?: string;
  description?: string;
  // Новые поля для работы с экземплярами
  instancesOnShelf?: number;
  instances?: BookInstance[];
}

export interface Journal {
  id: string;
  title: string;
  publisher?: string;
  issn?: string;
  coverImageUrl?: string;
  shelfId?: number;
  position?: number;
  publicationDate?: string;
  publicationYear?: number;
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
  | "BookReturned"
  | "BookReserved"
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

// Типы и утилиты для ролей пользователей
export interface UserRole {
  id: number;
  name: string;
  description: string;
  maxBooksAllowed: number;
  loanPeriodDays: number;
}

export const USER_ROLES = {
  ADMIN: { id: 1, name: 'Администратор', maxBooksAllowed: 100, loanPeriodDays: 365 },
  LIBRARIAN: { id: 2, name: 'Библиотекарь', maxBooksAllowed: 50, loanPeriodDays: 90 },
  EMPLOYEE: { id: 3, name: 'Сотрудник', maxBooksAllowed: 30, loanPeriodDays: 60 },
  GUEST: { id: 4, name: 'Гость', maxBooksAllowed: 5, loanPeriodDays: 14 }
} as const;

export function getRoleById(roleId: number): UserRole | null {
  const roleEntry = Object.values(USER_ROLES).find(role => role.id === roleId);
  return roleEntry ? { ...roleEntry, description: getRoleDescription(roleEntry.name) } : null;
}

export function getRoleDescription(roleName: string): string {
  switch (roleName) {
    case 'Администратор':
      return 'Полный доступ к системе, управление пользователями и настройками';
    case 'Библиотекарь':
      return 'Профессиональный работник библиотеки, до 50 книг на 90 дней';
    case 'Сотрудник':
      return 'Расширенные права на библиотечные операции, до 30 книг на 60 дней';
    case 'Гость':
      return 'Базовые права пользователя библиотеки, до 5 книг на 14 дней';
    default:
      return 'Пользователь системы';
  }
}

export function getDefaultRoleForContext(isAdminCreated: boolean): UserRole {
  return isAdminCreated ? 
    { ...USER_ROLES.EMPLOYEE, description: getRoleDescription(USER_ROLES.EMPLOYEE.name) } :
    { ...USER_ROLES.GUEST, description: getRoleDescription(USER_ROLES.GUEST.name) };
}

// Функция для получения роли с наивысшим приоритетом из списка ролей пользователя
export function getHighestPriorityRole(userRoles: string[]): UserRole {
  if (!userRoles || userRoles.length === 0) {
    return { ...USER_ROLES.GUEST, description: getRoleDescription(USER_ROLES.GUEST.name) };
  }

  // Проверяем роли в порядке приоритета (от 1 до 4)
  for (const roleConstant of Object.values(USER_ROLES)) {
    if (userRoles.includes(roleConstant.name)) {
      return { ...roleConstant, description: getRoleDescription(roleConstant.name) };
    }
  }

  // Если ни одна роль не найдена, возвращаем Гость
  return { ...USER_ROLES.GUEST, description: getRoleDescription(USER_ROLES.GUEST.name) };
}

// Функция для получения роли с наивысшим приоритетом из данных API
export function getHighestPriorityRoleFromApi(rolesData: Array<{roleId: number, roleName: string}>): UserRole {
  if (!rolesData || rolesData.length === 0) {
    return { ...USER_ROLES.GUEST, description: getRoleDescription(USER_ROLES.GUEST.name) };
  }

  // Находим роль с минимальным roleId (наивысшим приоритетом)
  const highestPriorityRole = rolesData.reduce((prev, current) => 
    (prev.roleId < current.roleId) ? prev : current
  );

  // Возвращаем соответствующую константу или создаем объект роли
  const roleConstant = Object.values(USER_ROLES).find(role => role.id === highestPriorityRole.roleId);
  if (roleConstant) {
    return { ...roleConstant, description: getRoleDescription(roleConstant.name) };
  }

  // Если роль не найдена в константах, создаем на основе данных API
  return {
    id: highestPriorityRole.roleId,
    name: highestPriorityRole.roleName,
    description: getRoleDescription(highestPriorityRole.roleName),
    maxBooksAllowed: USER_ROLES.GUEST.maxBooksAllowed, // Значения по умолчанию
    loanPeriodDays: USER_ROLES.GUEST.loanPeriodDays
  };
} 