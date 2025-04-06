export interface Book {
  Id: string;
  Title: string;
  Authors?: string;
  ISBN?: string;
  Cover?: string;
  AvailableCopies?: number;
  ShelfId?: number;
  Position?: number;
  Genre?: string;
  Categorization?: string;
}

export interface Journal {
  Id: string;
  Title: string;
  Publisher?: string;
  ISSN?: string;
  CoverImageUrl?: string;
  ShelfId?: number;
  Position?: number;
}

export interface Shelf {
  Id: number;
  Category: string;
  Capacity: number;
  ShelfNumber: number;
  PosX: number;
  PosY: number;
  LastReorganized?: Date;
}

export interface User {
  Id: string;
  Name: string;
  Email: string;
  Role: string;
}

export interface Borrowing {
  Id: string;
  UserId: string;
  BookId: string;
  BorrowDate: Date;
  DueDate: Date;
  ReturnDate?: Date;
  Status: 'active' | 'returned' | 'overdue';
} 