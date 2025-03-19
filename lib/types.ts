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