"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronDownIcon,
  CheckIcon,
  Search,
  Book,
  User,
  FileText,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Dialog as PickerDialog, DialogContent as PickerDialogContent, DialogHeader as PickerDialogHeader, DialogTitle as PickerDialogTitle } from "@/components/ui/dialog";

// TYPES ----------------------------------------------------------------------
interface UserType {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  loanPeriodDays?: number;
}

interface BookType {
  id: string;
  title: string;
  authors?: string;
  availableCopies: number;
  cover?: string;
  isEbook?: boolean;
}

interface CreateReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateReservation: (reservation: any) => Promise<void>;
  selectedBookId?: string;
}

// COMPONENT ------------------------------------------------------------------
export function CreateReservationDialog({
  open,
  onOpenChange,
  onCreateReservation,
  selectedBookId,
}: CreateReservationDialogProps) {
  // ───────────────────────── state ─────────────────────────
  const [formData, setFormData] = useState({
    userId: "",
    bookId: "",
    reservationDate: new Date(),
    expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    notes: "",
  });

  const [users, setUsers] = useState<UserType[]>([]);
  const [books, setBooks] = useState<BookType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showBookPicker, setShowBookPicker] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [isExpirationDateManuallySet, setIsExpirationDateManuallySet] = useState(false);

  const userSearchInputRef = useRef<HTMLInputElement>(null);
  const bookSearchInputRef = useRef<HTMLInputElement>(null);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [bookModalOpen, setBookModalOpen] = useState(false);

  // ───────────────────────── effects ─────────────────────────
  useEffect(() => {
    if (open) {
      fetchData();
      setShowUserPicker(false);
      setShowBookPicker(false);
      setIsExpirationDateManuallySet(false);
    }
  }, [open]);

  useEffect(() => {
    if (showUserPicker && userSearchInputRef.current) {
      userSearchInputRef.current.focus();
    }
  }, [showUserPicker]);

  useEffect(() => {
    if (showBookPicker && bookSearchInputRef.current) {
      bookSearchInputRef.current.focus();
    }
  }, [showBookPicker]);

  // Автовыбор книги по selectedBookId
  useEffect(() => {
    if (open && selectedBookId && books.length > 0) {
      const found = books.find(b => b.id === selectedBookId);
      if (found) {
        setSelectedBook(found);
        setFormData((p) => ({ ...p, bookId: found.id }));
      }
    }
  }, [open, selectedBookId, books]);

  // при выборе книги автоматически заполняем даты/примечания
  useEffect(() => {
    if (!selectedBook) return;

    (async () => {
      // убираем старое примечание о очереди
      const queueNoteRegex =
        /\s*\(В очереди, доступна после: [0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4}\)\s*/g;

      let newNotes = formData.notes.replace(queueNoteRegex, "").trim();

      // если копий нет, ставим бронь в очередь
      if (selectedBook.availableCopies === 0) {
        try {
          const res = await fetch(
            `${baseUrl}/api/Reservation/book/${selectedBook.id}`
          );
          if (res.ok) {
            const reservations = await res.json();
            if (reservations.length) {
              const earliest = reservations.reduce((earliest: any, cur: any) =>
                new Date(cur.expirationDate) < new Date(earliest.expirationDate)
                  ? cur
                  : earliest
              );

              const nextAvailable = new Date(earliest.expirationDate);
              const expiration = new Date(nextAvailable);
              expiration.setDate(nextAvailable.getDate() + 14);

              const note = `(В очереди, доступна после: ${nextAvailable.toLocaleDateString(
                "ru-RU"
              )})`;
              newNotes = (newNotes ? newNotes + " " : "") + note;

              setFormData((p) => ({
                ...p,
                bookId: selectedBook.id,
                reservationDate: nextAvailable,
                expirationDate: expiration,
                notes: newNotes.trim(),
              }));
              return;
            }
          }
        } catch (e) {
          console.error("Ошибка загрузки дат возврата:", e);
        }
      }

      // есть свободные экземпляры
      setFormData((p) => ({ ...p, bookId: selectedBook.id, notes: newNotes }));
    })();
  }, [selectedBook]);

  // ───────────────────────── helpers ─────────────────────────
  const calculateExpirationDate = (startDate: Date, loanPeriodDays: number = 14): Date => {
    const expiration = new Date(startDate);
    expiration.setDate(startDate.getDate() + loanPeriodDays);
    return expiration;
  };

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [uRes, bRes] = await Promise.all([
        fetch(`${baseUrl}/api/User`),
        fetch(`${baseUrl}/api/Books`),
      ]);
      if (!uRes.ok || !bRes.ok) throw new Error("Fetch error");

      const [u, b] = await Promise.all([uRes.json(), bRes.json()]);
      setUsers(u);
      setBooks(b);
    } catch (e) {
      console.error("Ошибка при загрузке данных:", e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field === "reservationDate" && !isExpirationDateManuallySet && selectedUser) {
      // Автоматически пересчитываем дату окончания при изменении даты начала
      const loanPeriod = selectedUser.loanPeriodDays || 14;
      const newExpirationDate = calculateExpirationDate(value, loanPeriod);
      setFormData((p) => ({ 
        ...p, 
        [field]: value, 
        expirationDate: newExpirationDate 
      }));
    } else if (field === "expirationDate") {
      // Если пользователь вручную изменяет дату окончания, запоминаем это
      setIsExpirationDateManuallySet(true);
      setFormData((p) => ({ ...p, [field]: value }));
    } else {
      setFormData((p) => ({ ...p, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onCreateReservation({
        userId: formData.userId,
        bookId: formData.bookId,
        reservationDate: formData.reservationDate.toISOString(),
        expirationDate: formData.expirationDate.toISOString(),
        notes: formData.notes || null,
        status: selectedBook?.availableCopies === 0 ? "Обрабатывается" : "Обрабатывается",
      });

      // reset
      setFormData({
        userId: "",
        bookId: "",
        reservationDate: new Date(),
        expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        notes: "",
      });
      setSelectedUser(null);
      setSelectedBook(null);
      setUserSearch("");
      setBookSearch("");
      setIsExpirationDateManuallySet(false);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = async (user: UserType) => {
    try {
      // Загружаем полную информацию о пользователе для получения loanPeriodDays
      const response = await fetch(`${baseUrl}/api/User/${user.id}`);
      if (response.ok) {
        const fullUserData = await response.json();
        const userWithLoanPeriod = {
          ...user,
          loanPeriodDays: fullUserData.loanPeriodDays || 14
        };
        
        setSelectedUser(userWithLoanPeriod);
        
        // Если дата окончания еще не была изменена вручную, пересчитываем её
        if (!isExpirationDateManuallySet) {
          const newExpirationDate = calculateExpirationDate(
            formData.reservationDate, 
            userWithLoanPeriod.loanPeriodDays
          );
          setFormData((p) => ({ 
            ...p, 
            userId: user.id,
            expirationDate: newExpirationDate
          }));
        } else {
          setFormData((p) => ({ ...p, userId: user.id }));
        }
      } else {
        // Если не удалось загрузить полные данные, используем базовые
        setSelectedUser(user);
        setFormData((p) => ({ ...p, userId: user.id }));
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных пользователя:", error);
      setSelectedUser(user);
      setFormData((p) => ({ ...p, userId: user.id }));
    }
    setShowUserPicker(false);
  };

  const handleBookSelect = (book: BookType) => {
    setSelectedBook(book);
    setShowBookPicker(false);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      (b.authors && b.authors.toLowerCase().includes(bookSearch.toLowerCase()))
  );

  // ───────────────────────── render ─────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-2xl gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b px-6 py-4 pt-5">
          <DialogTitle>Создать резервирование</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 p-6">
            {loadingData ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* USER PICKER */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Пользователь *
                  </Label>
                  <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setUserModalOpen(true)}>
                    {selectedUser ? selectedUser.fullName : "Выберите пользователя"}
                    <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                  <UserPickerModal open={userModalOpen} onOpenChange={setUserModalOpen} users={users} onSelect={handleUserSelect} selectedUser={selectedUser} />
                </div>

                {/* BOOK PICKER */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Book className="h-4 w-4" /> Книга *
                  </Label>
                  <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setBookModalOpen(true)}>
                    {selectedBook ? selectedBook.title : "Выберите книгу"}
                    <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                  <BookPickerModal open={bookModalOpen} onOpenChange={setBookModalOpen} books={books} onSelect={handleBookSelect} selectedBook={selectedBook} />
                </div>

                {/* WARNING WHEN NO COPIES ------------------------------------- */}
                {selectedBook && selectedBook.availableCopies === 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg
                          className="w-4 h-4 text-orange-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01M4.062 19h15.876c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-orange-800">
                          Книга недоступна
                        </h4>
                        <p className="text-sm text-orange-700 mt-1">
                          Все экземпляры книги "{selectedBook.title}" заняты. Резервирование
                          будет поставлено в очередь.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* DATES ------------------------------------------------------- */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Дата резервирования</Label>
                    <Popover modal>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.reservationDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.reservationDate, "dd.MM.yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.reservationDate}
                          onSelect={(d) => handleChange("reservationDate", d || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Дата окончания
                      {selectedUser && selectedUser.loanPeriodDays && !isExpirationDateManuallySet && (
                        <span className="text-xs text-blue-600 ml-1">
                          (срок займа: {selectedUser.loanPeriodDays} дн.)
                        </span>
                      )}
                    </Label>
                    <Popover modal>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.expirationDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.expirationDate, "dd.MM.yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.expirationDate}
                          onSelect={(d) => handleChange("expirationDate", d || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {selectedUser && selectedUser.loanPeriodDays && !isExpirationDateManuallySet && (
                      <p className="text-xs text-gray-500">
                        Дата рассчитана автоматически на основе срока займа пользователя
                      </p>
                    )}
                    {isExpirationDateManuallySet && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-amber-600">
                          Дата изменена вручную
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => {
                            if (selectedUser && selectedUser.loanPeriodDays) {
                              const newExpirationDate = calculateExpirationDate(
                                formData.reservationDate, 
                                selectedUser.loanPeriodDays
                              );
                              setFormData(p => ({ ...p, expirationDate: newExpirationDate }));
                              setIsExpirationDateManuallySet(false);
                            }
                          }}
                        >
                          Восстановить автоматический расчет
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* NOTES ------------------------------------------------------ */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Примечания
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="Дополнительные примечания..."
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* FOOTER BUTTONS ---------------------------------------------------- */}
          <div className="flex items-center justify-end border-t p-4 space-x-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.userId || !formData.bookId}
            >
              {isLoading ? "Создание..." : "Создать резервирование"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 2. Новый компонент выбора пользователя
function UserPickerModal({ open, onOpenChange, users, onSelect, selectedUser }: { open: boolean; onOpenChange: (open: boolean) => void; users: UserType[]; onSelect: (u: UserType) => void; selectedUser: UserType | null; }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);
  const filtered = users.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()) || (u.email && u.email.toLowerCase().includes(search.toLowerCase())));
  return (
    <PickerDialog open={open} onOpenChange={onOpenChange}>
      <PickerDialogContent className="w-[400px] p-0">
        <PickerDialogHeader className="border-b px-6 py-4 pt-5">
          <PickerDialogTitle>Выберите пользователя</PickerDialogTitle>
        </PickerDialogHeader>
        <div className="p-3">
          <div className="flex items-center border rounded-md px-3">
            <Search className="mr-2 h-4 w-4 opacity-50" />
            <Input ref={inputRef} placeholder="Поиск пользователя..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Пользователи не найдены</div>
          ) : (
            filtered.map(u => (
              <div key={u.id} className="flex cursor-pointer items-center p-3 hover:bg-gray-100 border-b last:border-b-0" onClick={() => { onSelect(u); onOpenChange(false); }}>
                <div className="flex-1">
                  <div className="font-medium">{u.fullName}</div>
                  {u.email && <div className="text-sm text-gray-500">{u.email}</div>}
                  {u.phone && <div className="text-sm text-gray-500">{u.phone}</div>}
                </div>
                {selectedUser && selectedUser.id === u.id && <CheckIcon className="h-4 w-4 text-blue-500" />}
              </div>
            ))
          )}
        </div>
      </PickerDialogContent>
    </PickerDialog>
  );
}

// 3. Новый компонент выбора книги
function BookPickerModal({ open, onOpenChange, books, onSelect, selectedBook }: { open: boolean; onOpenChange: (open: boolean) => void; books: BookType[]; onSelect: (b: BookType) => void; selectedBook: BookType | null; }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);
  const filtered = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || (b.authors && b.authors.toLowerCase().includes(search.toLowerCase())));
  return (
    <PickerDialog open={open} onOpenChange={onOpenChange}>
      <PickerDialogContent className="w-[500px] p-0">
        <PickerDialogHeader className="border-b px-6 py-4 pt-5">
          <PickerDialogTitle>Выберите книгу</PickerDialogTitle>
        </PickerDialogHeader>
        <div className="p-3">
          <div className="flex items-center border rounded-md px-3">
            <Search className="mr-2 h-4 w-4 opacity-50" />
            <Input ref={inputRef} placeholder="Поиск книги..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Книги не найдены</div>
          ) : (
            filtered.map(b => (
              <div key={b.id} className={cn("flex cursor-pointer items-center p-3 hover:bg-gray-100 border-b last:border-b-0", b.availableCopies === 0 && !b.isEbook && "bg-orange-50")}
                onClick={() => { onSelect(b); onOpenChange(false); }}>
                {b.cover && <div className="relative mr-3 h-12 w-8"><Image src={b.cover} alt={b.title} fill className="object-cover rounded" /></div>}
                <div className="flex-1">
                  <div className="font-medium">{b.title}</div>
                  {b.authors && <div className="text-sm text-gray-500">{b.authors}</div>}
                  <div className={cn("text-sm", b.isEbook ? "text-blue-600" : b.availableCopies > 0 ? "text-green-600" : "text-orange-600")}>{b.isEbook ? "Электронная книга" : (b.availableCopies > 0 ? `${b.availableCopies} доступно` : "Нет в наличии")}</div>
                </div>
                {selectedBook && selectedBook.id === b.id && <CheckIcon className="h-4 w-4 text-blue-500" />}
              </div>
            ))
          )}
        </div>
      </PickerDialogContent>
    </PickerDialog>
  );
}
