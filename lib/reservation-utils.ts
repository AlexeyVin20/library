// Утилиты для работы с резервированиями и проверки доступа к книгам

// Статусы резервирований, которые дают доступ к просмотру полок
export const APPROVED_RESERVATION_STATUSES = [
  'активна',
  'подтверждена', 
  'одобрена',
  'выдана'
] as const;

// Статусы для группировки в статистике
export const RESERVATION_STATUS_GROUPS = {
  active: ['активна', 'подтверждена', 'обрабатывается', 'одобрена', 'выдана'],
  returned: ['возвращена'],
  cancelled: ['отменена', 'отменена_пользователем', 'истекла', 'просрочена']
} as const;

// Интерфейс для резервирования
export interface ReservationAccess {
  id: string;
  bookId: string;
  userId: string;
  status: string;
  reservationDate: string;
  expirationDate: string;
}

// Интерфейс для взятой книги
export interface BorrowedBookAccess {
  id: string;
  title: string;
  authors?: string;
  dueDate?: string;
  borrowDate?: string;
}

/**
 * Проверяет, имеет ли пользователь доступ к книге для просмотра её расположения
 * @param bookId - ID книги
 * @param userId - ID пользователя
 * @param reservations - список резервирований пользователя
 * @param borrowedBooks - список взятых пользователем книг
 * @returns boolean - имеет ли пользователь доступ
 */
export function hasBookAccess(
  bookId: string,
  userId: string,
  reservations: ReservationAccess[],
  borrowedBooks: BorrowedBookAccess[]
): boolean {
  // Проверяем активные резервирования
  const hasActiveReservation = reservations.some(reservation => 
    reservation.bookId === bookId && 
    reservation.userId === userId &&
    APPROVED_RESERVATION_STATUSES.includes(reservation.status.toLowerCase() as any)
  );

  // Проверяем взятые книги
  const hasBorrowedBook = borrowedBooks.some(book => book.id === bookId);

  return hasActiveReservation || hasBorrowedBook;
}

/**
 * Фильтрует список книг, оставляя только те, к которым у пользователя есть доступ
 * @param books - список книг
 * @param userId - ID пользователя
 * @param reservations - список резервирований
 * @param borrowedBooks - список взятых книг
 * @returns отфильтрованный список книг
 */
export function filterBooksWithAccess<T extends { id: string }>(
  books: T[],
  userId: string,
  reservations: ReservationAccess[],
  borrowedBooks: BorrowedBookAccess[]
): T[] {
  return books.filter(book => 
    hasBookAccess(book.id, userId, reservations, borrowedBooks)
  );
}

/**
 * Проверяет статус резервирования
 * @param status - статус резервирования
 * @returns объект с информацией о статусе
 */
export function getReservationStatusInfo(status: string) {
  const statusLower = status.toLowerCase();
  
  if (RESERVATION_STATUS_GROUPS.active.includes(statusLower as any)) {
    return {
      group: 'active',
      label: 'Активная',
      color: 'green',
      allowsShelfAccess: true
    };
  }
  
  if (RESERVATION_STATUS_GROUPS.returned.includes(statusLower as any)) {
    return {
      group: 'returned',
      label: 'Возвращена',
      color: 'blue',
      allowsShelfAccess: false
    };
  }
  
  if (RESERVATION_STATUS_GROUPS.cancelled.includes(statusLower as any)) {
    return {
      group: 'cancelled',
      label: 'Отменена',
      color: 'red',
      allowsShelfAccess: false
    };
  }
  
  return {
    group: 'unknown',
    label: 'Неизвестный',
    color: 'gray',
    allowsShelfAccess: false
  };
}

/**
 * Проверяет, истекает ли скоро резервирование
 * @param expirationDate - дата окончания резервирования
 * @param daysThreshold - количество дней до истечения (по умолчанию 3)
 * @returns true, если резервирование истекает скоро
 */
export function isReservationExpiringSoon(
  expirationDate: string,
  daysThreshold: number = 3
): boolean {
  const expDate = new Date(expirationDate);
  const today = new Date();
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= daysThreshold && diffDays > 0;
}

/**
 * Группирует резервирования по статусам
 * @param reservations - список резервирований
 * @returns объект с группированными резервированиями
 */
export function groupReservationsByStatus(reservations: ReservationAccess[]) {
  const grouped = {
    active: [] as ReservationAccess[],
    returned: [] as ReservationAccess[],
    cancelled: [] as ReservationAccess[]
  };
  
  reservations.forEach(reservation => {
    const statusInfo = getReservationStatusInfo(reservation.status);
    if (statusInfo.group !== 'unknown') {
      grouped[statusInfo.group as keyof typeof grouped].push(reservation);
    }
  });
  
  return grouped;
} 