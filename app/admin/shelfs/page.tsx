"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Lock,
  Unlock,
  X,
  Search,
  Upload,
  BookOpen,
  Library,
  ChevronLeft,
  Edit,
  Trash2,
  AlertCircle,
  BookMarked,
  LayoutGrid,
  ArrowRight,
} from "lucide-react"
import type { Book, Shelf, Journal } from "@/lib/types"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ShelfItemContextMenu from "@/components/admin/ShelfItemContextMenu"

interface Position {
  x: number
  y: number
}

// Компонент для анимированного появления
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5,
}: { children: React.ReactNode; delay?: number; duration?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function ShelfsPage() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [draggedShelf, setDraggedShelf] = useState<Shelf | null>(null);
  const [mousePosition, setMousePosition] = useState<Position>({ x: 0, y: 0 });
  const [hoveredBook, setHoveredBook] = useState<Book | null>(null);
  const [highlightedBookId, setHighlightedBookId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentShelf, setCurrentShelf] = useState<Shelf | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredShelf, setHoveredShelf] = useState<Shelf | null>(null);
  const editorRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [selectedEmptySlot, setSelectedEmptySlot] = useState<{ shelfId: number, position: number } | null>(null);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [filteredJournals, setFilteredJournals] = useState<Journal[]>([]);
  const [isJournalTab, setIsJournalTab] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuData, setContextMenuData] = useState<{ item: Book | Journal | null; isJournal: boolean; position: { x: number; y: number }; shelfId: number; itemPosition: number } | null>(null);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [activeTab, setActiveTab] = useState("shelves");

  const [newShelf, setNewShelf] = useState({
    category: '',
    capacity: '',
    shelfNumber: '',
  });

  const [editShelfData, setEditShelfData] = useState({
    category: '',
    capacity: '',
    shelfNumber: '',
    posX: '',
    posY: '',
  });
  
  useEffect(() => {
    fetchShelves();
    fetchBooks();
    fetchJournals();
  }, []);

  const fetchShelves = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

      const response = await fetch(`${baseUrl}/api/Shelf`);
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      const data = await response.json();
      setShelves(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке полок');
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Ошибка при загрузке полок',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

      const response = await fetch(`${baseUrl}/api/Books`);
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      const data = await response.json();
      setBooks(data);
      setFilteredBooks(data);
    } catch (err) {
      console.error('Ошибка при загрузке книг:', err);
      toast({
        title: "Ошибка",
        description: 'Не удалось загрузить книги',
        variant: "destructive",
      });
    }
  };

  const fetchJournals = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

      const response = await fetch(`${baseUrl}/api/Journals`);
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      const data = await response.json();
      setJournals(data);
      setFilteredJournals(data);
    } catch (err) {
      console.error('Ошибка при загрузке журналов:', err);
      toast({
        title: "Ошибка",
        description: 'Не удалось загрузить журналы',
        variant: "destructive",
      });
    }
  };

  const handleNewShelfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewShelf(prev => ({ ...prev, [name]: value }));
  };

  const handleEditShelfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditShelfData(prev => ({ ...prev, [name]: value }));
  };

  const addShelf = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

      const response = await fetch(`${baseUrl}/api/shelfs/auto-position`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newShelf.category,
          capacity: Number.parseInt(newShelf.capacity),
          shelfNumber: Number.parseInt(newShelf.shelfNumber)
        }),
      });

      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      
      await fetchShelves();
      setShowAddForm(false);
      setNewShelf({ category: '', capacity: '', shelfNumber: '' });
      toast({
        title: "Успех",
        description: "Полка успешно добавлена",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении полки');
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Ошибка при добавлении полки',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookHover = (book: Book | null) => {
    setHoveredBook(book);
  };

  const handleBookFound = (bookId: string) => {
    setHighlightedBookId(bookId);
    
    setTimeout(() => {
      setHighlightedBookId(null);
    }, 5000);
    
    const bookWithShelf = books.find(b => b.id === bookId);
    if (bookWithShelf?.shelfId) {
      const shelf = shelves.find(s => s.id === bookWithShelf.shelfId);
      if (shelf) {
        const shelfElement = document.getElementById(`shelf-${shelf.id}`);
        shelfElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 1) {
      setShowSearchDropdown(true);
      
      const filteredResults = books.filter(b => 
        b.title.toLowerCase().includes(term.toLowerCase()) || 
        (b.authors && b.authors.toLowerCase().includes(term.toLowerCase()))
      );
      
      setFilteredBooks(filteredResults.slice(0, 5)); // Ограничиваем список до 5 элементов
    } else {
      setShowSearchDropdown(false);
    }
  };

  const animateHighlightedBook = (bookId: string) => {
    handleBookFound(bookId);
    setShowSearchDropdown(false);
    
    // Скроллим к книге
    const bookElement = document.querySelector(`[data-book-id="${bookId}"]`);
    if (bookElement) {
      // Найдем родительскую полку
      const book = books.find(b => b.id === bookId);
      if (book?.shelfId) {
        const shelfElement = document.getElementById(`shelf-${book.shelfId}`);
        if (shelfElement) {
          shelfElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Подсвечиваем книгу
          setHighlightedBookId(bookId);
          
          // Убираем подсветку через 5 секунд
          setTimeout(() => {
            setHighlightedBookId(null);
          }, 5000);
        }
      }
    }
  };
  
  const startEditShelf = (shelf: Shelf) => {
    setEditingShelf(shelf);
    setEditShelfData({
      category: shelf.category,
      capacity: String(shelf.capacity),
      shelfNumber: String(shelf.shelfNumber),
      posX: String(shelf.posX),
      posY: String(shelf.posY)
    });
  };

  const deleteShelf = async (id: number) => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const response = await fetch(`${baseUrl}/api/shelfs/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      
      setShelves(shelves.filter(shelf => shelf.id !== id));
      toast({
        title: "Успех",
        description: "Полка успешно удалена",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении полки');
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Ошибка при удалении полки',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShelf) return;
    
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const response = await fetch(`${baseUrl}/api/shelfs/${editingShelf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingShelf.id,
          category: editShelfData.category,
          capacity: Number.parseInt(editShelfData.capacity),
          shelfNumber: Number.parseInt(editShelfData.shelfNumber),
          posX: Number.parseFloat(editShelfData.posX),
          posY: Number.parseFloat(editShelfData.posY),
        }),
      });
      
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      
      await fetchShelves();
      setEditingShelf(null);
      toast({
        title: "Успех",
        description: "Полка успешно обновлена",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении полки');
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Ошибка при обновлении полки',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.MouseEvent, shelf: Shelf) => {
    if (!isEditMode) return;
    
    const container = document.getElementById('shelf-editor');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    setMousePosition({
      x: e.clientX - rect.left - shelf.posX,
      y: e.clientY - rect.top - shelf.posY,
    });
    
    setDraggedShelf(shelf);
    e.preventDefault();
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggedShelf) return;
    
    const container = document.getElementById('shelf-editor');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - mousePosition.x;
    const y = e.clientY - rect.top - mousePosition.y;
    
    // Ограничиваем перемещение в пределах контейнера
    const newX = Math.max(0, Math.min(rect.width - 250, x));
    const newY = Math.max(0, Math.min(rect.height - 150, y));
    
    setShelves(shelves.map(shelf => 
      shelf.id === draggedShelf.id
        ? { ...shelf, posX: newX, posY: newY }
        : shelf
    ));
  };

  const handleDragEnd = async () => {
    if (!draggedShelf) return;
    
    const draggedShelfNew = shelves.find(s => s.id === draggedShelf.id);
    if (draggedShelfNew) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
        
        await fetch(`${baseUrl}/api/shelfs/${draggedShelfNew.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draggedShelfNew)
        });
      } catch (error) {
        console.error('Ошибка при обновлении позиции полки:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить позицию полки",
          variant: "destructive",
        });
      }
    }
    
    setDraggedShelf(null);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    toast({
      title: isEditMode ? "Режим редактирования выключен" : "Режим редактирования включен",
      description: isEditMode 
        ? "Полки заблокированы от перемещения" 
        : "Теперь вы можете перемещать полки",
    });
  };

  const handleEmptySlotClick = (shelfId: number, position: number) => {
    setSelectedEmptySlot({ shelfId, position });
    setShowBookSelector(true);
  };

  const handleBookSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (isJournalTab) {
      const filtered = journals.filter(journal => 
        journal.title.toLowerCase().includes(term) || 
        (journal.publisher && journal.publisher.toLowerCase().includes(term))
      );
      setFilteredJournals(filtered);
    } else {
      const filtered = books.filter(book => 
        book.title.toLowerCase().includes(term) || 
        (book.authors && book.authors.toLowerCase().includes(term))
      );
      setFilteredBooks(filtered);
    }
  };

  const addItemToShelf = async (itemId: string, isJournal: boolean) => {
    if (!selectedEmptySlot) return;
    
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const endpoint = isJournal ? 'journals' : 'books';
      
      // Исправление: используем правильный эндпоинт для позиционирования
      const response = await fetch(`${baseUrl}/api/${endpoint}/${itemId}/position`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shelfId: selectedEmptySlot.shelfId,
          position: selectedEmptySlot.position
        }),
      });
      
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      
      // Обновляем данные
      if (isJournal) {
        await fetchJournals();
      } else {
        await fetchBooks();
      }
      
      setShowBookSelector(false);
      setSelectedEmptySlot(null);
      setSearchTerm('');
      
      toast({
        title: "Успех",
        description: isJournal 
          ? "Журнал успешно добавлен на полку" 
          : "Книга успешно добавлена на полку",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении на полку');
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Ошибка при добавлении на полку',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик для закрытия меню
  const handleCloseMenu = () => {
    setShowContextMenu(false);
    setContextMenuData(null);
  };

  // Обработчик для удаления элемента
  const handleRemoveItem = () => {
    if (contextMenuData) {
      const { shelfId, itemPosition, isJournal } = contextMenuData;
      removeItemFromShelf(shelfId, itemPosition, isJournal);
    }
  };

  const removeItemFromShelf = async (shelfId: number, position: number, isJournal: boolean) => {
    if (!contextMenuData) return;
    
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const itemId = contextMenuData.item?.id;
      const endpoint = isJournal ? 'journals' : 'books';
      
      const response = await fetch(`${baseUrl}/api/${endpoint}/${itemId}/position`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shelfId,
          position
        }),
      });
      
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      
      // Обновляем данные
      if (isJournal) {
        await fetchJournals();
      } else {
        await fetchBooks();
      }
      
      setShowContextMenu(false);
      setContextMenuData(null);
      
      toast({
        title: "Успех",
        description: isJournal 
          ? "Журнал успешно удален с полки" 
          : "Книга успешно удалена с полки",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении с полки');
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Ошибка при удалении с полки',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Добавляем обработчик клика для закрытия меню
  useEffect(() => {
    const handleClick = () => {
      if (showContextMenu) {
        handleCloseMenu();
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [showContextMenu]);

  // Функция для импорта данных полки из JSON
  const importShelfFromJson = async () => {
    try {
      let data;
      try {
        data = JSON.parse(jsonData);
      } catch (err) {
        setError('Неверный формат JSON');
        toast({
          title: "Ошибка",
          description: "Неверный формат JSON",
          variant: "destructive",
        });
        return;
      }
      
      if (!data || !data.Id) {
        setError('Неверный формат данных полки');
        toast({
          title: "Ошибка",
          description: "Неверный формат данных полки",
          variant: "destructive",
        });
        return;
      }
      
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const shelfData = {
        id: data.Id,
        category: data.Category,
        capacity: data.Capacity,
        shelfNumber: data.ShelfNumber,
        posX: data.PosX,
        posY: data.PosY
      };
      
      const response = await fetch(`${baseUrl}/api/shelfs/${data.Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shelfData)
      });
      
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      
      await fetchShelves();
      setShowJsonImport(false);
      setJsonData('');
      
      toast({
        title: "Успех",
        description: "Данные полки успешно импортированы",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при импорте данных полки');
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Ошибка при импорте данных полки',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const ShelfContent = ({ shelf }: { shelf: Shelf }) => {
    return (
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: shelf.capacity }).map((_, i) => {
          const book = books.find(b => b.shelfId === shelf.id && b.position === i);
          const journal = journals.find(j => j.shelfId === shelf.id && j.position === i);
          const item = book || journal;

          const getBackground = () => {
            if (item) {
              if (book) {
                // Проверяем, является ли книга подсвеченной
                const isHighlighted = book.id === highlightedBookId;
                if (isHighlighted) {
                  return 'bg-yellow-400 border-2 border-yellow-600 shadow-yellow-300/50 shadow-lg animate-pulse';
                }
                return book.availableCopies && book.availableCopies > 0 
                  ? 'bg-emerald-500 hover:scale-105 hover:shadow-md' 
                  : 'bg-red-500 hover:scale-105 hover:shadow-md';
              } else {
                return 'bg-blue-500 hover:scale-105 hover:shadow-md'; // Журналы
              }
            } 
            return 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
          };

          const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            if (item) {
              // Открываем контекстное меню с передачей данных
              setContextMenuData({ 
                item, 
                isJournal: !!journal, 
                position: { x: e.pageX, y: e.pageY },
                shelfId: shelf.id,
                itemPosition: i
              });
              setShowContextMenu(true);
            }
          };

          return (
            <motion.div
              key={i}
              data-book-id={book?.id || ''}
              title={item ? `${item.title} (${journal ? 'Журнал' : 'Книга'})${book?.authors ? ` - ${book.authors}` : ''}` : 'Пустое место'}
              className={`w-6 h-8 rounded transition-all cursor-pointer ${getBackground()}`}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (item) {
                  // Если место занято, открываем контекстное меню
                  handleContextMenu({ preventDefault: () => {}, pageX: window.innerWidth / 2, pageY: window.innerHeight / 2 } as React.MouseEvent);
                } else {
                  // Если место пустое, открываем селектор для добавления
                  handleEmptySlotClick(shelf.id, i);
                }
              }}
              onContextMenu={handleContextMenu}
            ></motion.div>
          );
        })}
      </div>
    );
  };

  const BookSelector = () => {
    return (
      <Dialog open={showBookSelector} onOpenChange={(open) => {
        if (!open) {
          setShowBookSelector(false);
          setSelectedEmptySlot(null);
          setSearchTerm('');
          setIsJournalTab(false);
        }
      }}>
        <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white">
              Выберите элемент для добавления на полку
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Найдите книгу или журнал, который хотите добавить на полку
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="books" onValueChange={(value) => setIsJournalTab(value === "journals")}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="books" className="relative">
                <div className="py-2 px-1">
                  <span>Книги</span>
                </div>
                {!isJournalTab && (
                  <motion.div
                    layoutId="activeBookSelectorTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </TabsTrigger>
              <TabsTrigger value="journals" className="relative">
                <div className="py-2 px-1">
                  <span>Журналы</span>
                </div>
                {isJournalTab && (
                  <motion.div
                    layoutId="activeBookSelectorTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="books" className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={handleBookSearch}
                  placeholder="Поиск книг..."
                  className="w-full pl-10 pr-4 py-2 backdrop-blur-sm bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-gray-700/30 rounded-lg"
                />
                <Search className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={18} />
              </div>
              
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {filteredBooks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <BookOpen className="mx-auto h-12 w-12 mb-3 text-gray-400 dark:text-gray-600" />
                    <p>Книги не найдены</p>
                  </div>
                ) : (
                  filteredBooks.map(book => (
                    <motion.div
                      key={book.id}
                      className="p-3 backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700/30 rounded-lg hover:bg-white/40 dark:hover:bg-gray-700/40 cursor-pointer flex items-start"
                      whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addItemToShelf(book.id, false)}
                    >
                      <div className="w-10 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-3 flex-shrink-0 overflow-hidden">
                        {book.cover ? (
                          <img src={book.cover || "/placeholder.svg"} alt={book.title} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <BookOpen className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">{book.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{book.authors || 'Автор не указан'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">ISBN: {book.isbn || 'Нет'}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="journals" className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={handleBookSearch}
                  placeholder="Поиск журналов..."
                  className="w-full pl-10 pr-4 py-2 backdrop-blur-sm bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-gray-700/30 rounded-lg"
                />
                <Search className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={18} />
              </div>
              
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {filteredJournals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <BookOpen className="mx-auto h-12 w-12 mb-3 text-gray-400 dark:text-gray-600" />
                    <p>Журналы не найдены</p>
                  </div>
                ) : (
                  filteredJournals.map(journal => (
                    <motion.div
                      key={journal.id}
                      className="p-3 backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700/30 rounded-lg hover:bg-white/40 dark:hover:bg-gray-700/40 cursor-pointer flex items-start"
                      whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addItemToShelf(journal.id.toString(), true)}
                    >
                      <div className="w-10 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3 flex-shrink-0">
                        {journal.coverImageUrl ? (
                          <img src={journal.coverImageUrl || "/placeholder.svg"} alt={journal.title} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <BookOpen className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">{journal.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{journal.publisher || 'Издатель не указан'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">ISSN: {journal.issn || 'Нет'}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowBookSelector(false);
                setSelectedEmptySlot(null);
                setSearchTerm('');
                setIsJournalTab(false);
              }}
            >
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto p-6 relative z-10">
        {/* Header */}
        <FadeInView>
          <div className="mb-8 flex items-center gap-4">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
              <Link
                href="/admin"
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Назад</span>
              </Link>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-bold text-gray-800 dark:text-white"
            >
              Управление полками библиотеки
            </motion.h1>
          </div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          <Tabs defaultValue="shelves" onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md p-1 rounded-xl border border-white/20 dark:border-gray-700/30 shadow-md">
              <TabsTrigger value="shelves" className="relative">
                <div className="flex items-center gap-2 py-2 px-1">
                  <Library className="w-4 h-4" />
                  <span>Полки</span>
                </div>
                {activeTab === "shelves" && (
                  <motion.div
                    layoutId="activeShelfTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="relative">
                <div className="flex items-center gap-2 py-2 px-1">
                  <LayoutGrid className="w-4 h-4" />
                  <span>Настройки</span>
                </div>
                {activeTab === "settings" && (
                  <motion.div
                    layoutId="activeShelfTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shelves" className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-xl bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center"
                >
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto" 
                    onClick={() => setError(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex-1">
                  {!showAddForm ? (
                    <motion.button
                      onClick={() => setShowAddForm(true)}
                      className="backdrop-blur-xl bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-3 flex items-center gap-2 shadow-md"
                      whileHover={{
                        y: -3,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="h-5 w-5" />
                      Добавить полку
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Добавить новую полку</h2>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowAddForm(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <form onSubmit={addShelf} className="space-y-4">
                        <div>
                          <Label htmlFor="category" className="text-gray-700 dark:text-gray-300">Рубрика</Label>
                          <Input
                            id="category"
                            name="category"
                            placeholder="Рубрика (например, Фантастика)"
                            value={newShelf.category}
                            onChange={handleNewShelfChange}
                            className="backdrop-blur-sm bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-gray-700/30"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="capacity" className="text-gray-700 dark:text-gray-300">Количество мест</Label>
                          <Input
                            id="capacity"
                            type="number"
                            name="capacity"
                            placeholder="Количество мест для книг/журналов"
                            value={newShelf.capacity}
                            onChange={handleNewShelfChange}
                            className="backdrop-blur-sm bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-gray-700/30"
                            min="1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="shelfNumber" className="text-gray-700 dark:text-gray-300">Номер полки</Label>
                          <Input
                            id="shelfNumber"
                            type="number"
                            name="shelfNumber"
                            placeholder="Номер полки"
                            value={newShelf.shelfNumber}
                            onChange={handleNewShelfChange}
                            className="backdrop-blur-sm bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-gray-700/30"
                            min="1"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowAddForm(false)}
                          >
                            Отмена
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={loading}
                            className="bg-emerald-500/90 hover:bg-emerald-600/90"
                          >
                            {loading ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                  className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                                />
                                Добавление...
                              </>
                            ) : (
                              <>Добавить полку</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Поиск книг по названию или автору..."
                      className="backdrop-blur-sm bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-gray-700/30 w-full pl-10"
                      value={searchTerm}
                      onChange={handleSearch}
                      onFocus={() => searchTerm.length > 1 && setShowSearchDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={18} />
                  </div>
                  
                  <AnimatePresence>
                    {showSearchDropdown && filteredBooks.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-1 w-full backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-lg max-h-60 overflow-auto border border-white/20 dark:border-gray-700/30"
                      >
                        {filteredBooks.map((book, index) => (
                          <motion.div 
                            key={book.id}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            className="px-4 py-2 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 cursor-pointer"
                            onMouseDown={() => animateHighlightedBook(book.id)}
                          >
                            <div className="font-medium text-gray-800 dark:text-gray-200">{book.title}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{book.authors || 'Автор не указан'}</div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {editingShelf && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Редактировать полку #{editingShelf.id}</h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingShelf(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <form onSubmit={updateShelf} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-category" className="text-gray-700 dark:text-gray-300">Рубрика</Label>
                        <Input
                          id="edit-category"
                          name="category"
                          placeholder="Рубрика"
                          value={editShelfData.category}
                          onChange={handleEditShelfChange}
                          className="backdrop-blur-sm bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-gray-700/30"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-capacity" className="text-gray-700 dark:text-gray-300">Количество мест</Label>
                        <Input
                          id="edit-capacity"
                          type="number"
                          name="capacity"
                          placeholder="Кол-во мест"
                          value={editShelfData.capacity}
                          onChange={handleEditShelfChange}
                          className="backdrop-blur-sm bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-gray-700/30"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-shelfNumber" className="text-gray-700 dark:text-gray-300">Номер полки</Label>
                        <Input
                          id="edit-shelfNumber"
                          type="number"
                          name="shelfNumber"
                          placeholder="Номер полки"
                          value={editShelfData.shelfNumber}
                          onChange={handleEditShelfChange}
                          className="backdrop-blur-sm bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-gray-700/30"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setEditingShelf(null)}
                      >
                        Отмена
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="bg-emerald-500/90 hover:bg-emerald-600/90"
                      >
                        {loading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            Сохранение...
                          </>
                        ) : (
                          <>Сохранить изменения</>
                        )}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl shadow-lg border border-white/20 dark:border-gray-700/30 overflow-hidden"
              >
                <div className="p-4 border-b border-white/20 dark:border-gray-700/30 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Library className="h-5 w-5 text-emerald-500" />
                    Визуальное расположение полок
                  </h2>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setShowJsonImport(true)}
                      className="backdrop-blur-sm bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-gray-700/30 text-gray-700 dark:text-gray-200 rounded-lg p-2 flex items-center justify-center"
                      whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                      whileTap={{ scale: 0.95 }}
                      title="Импорт данных полки из JSON"
                    >
                      <Upload size={18} />
                    </motion.button>
                    <motion.button
                      onClick={toggleEditMode}
                      className={`backdrop-blur-sm ${isEditMode ? 'bg-yellow-500/40 dark:bg-yellow-500/20' : 'bg-white/40 dark:bg-gray-700/40'} border border-white/20 dark:border-gray-700/30 text-gray-700 dark:text-gray-200 rounded-lg p-2 flex items-center justify-center`}
                      whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                      whileTap={{ scale: 0.95 }}
                      title={isEditMode ? "Заблокировать перемещение" : "Разблокировать перемещение"}
                    >
                      {isEditMode ? <Lock size={18} /> : <Unlock size={18} />}
                    </motion.button>
                  </div>
                </div>

                <div
                  id="shelf-editor"
                  ref={editorRef}
                  className="relative p-4 h-[600px]"
                  onMouseMove={draggedShelf ? handleDragMove : undefined}
                  onMouseUp={draggedShelf ? handleDragEnd : undefined}
                  onMouseLeave={draggedShelf ? handleDragEnd : undefined}
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full"
                      />
                    </div>
                  ) : shelves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <BookMarked className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-lg">Нет полок для отображения</p>
                      <p className="text-sm mt-2">Добавьте первую полку, используя кнопку выше</p>
                    </div>
                  ) : (
                    shelves.map((shelf) => (
                      <motion.div
                        key={shelf.id}
                        id={`shelf-${shelf.id}`}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-4 shadow-lg border border-white/20 dark:border-gray-700/30 absolute"
                        style={{
                          left: shelf.posX,
                          top: shelf.posY,
                          transition: draggedShelf?.id === shelf.id ? 'none' : 'all 0.2s ease',
                          zIndex: draggedShelf?.id === shelf.id ? 100 : 10,
                        }}
                        whileHover={{ 
                          boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)",
                          scale: draggedShelf?.id === shelf.id ? 1 : 1.02
                        }}
                        onMouseDown={isEditMode ? (e) => handleDragStart(e, shelf) : undefined}
                        onMouseEnter={() => setHoveredShelf(shelf)}
                        onMouseLeave={() => setTimeout(() => { if (!hoveredBook) setHoveredShelf(null); }, 100)}
                      >
                        <div className="shelf-container">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{shelf.category}</span>
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                              #{shelf.shelfNumber}
                            </span>
                          </div>
                          
                          <ShelfContent shelf={shelf} />
                          
                          <div className="mt-3 flex space-x-2">
                            <motion.button
                              onClick={() => startEditShelf(shelf)}
                              className="bg-amber-500/90 hover:bg-amber-600/90 text-white rounded-lg shadow-sm hover:shadow-md px-2 py-1 text-xs flex items-center gap-1"
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Edit className="h-3 w-3" />
                              Изменить
                            </motion.button>
                            <motion.button
                              onClick={() => { 
                                if (confirm('Вы уверены, что хотите удалить эту полку?')) 
                                  deleteShelf(shelf.id); 
                              }}
                              className="bg-red-500/90 hover:bg-red-600/90 text-white rounded-lg shadow-sm hover:shadow-md px-2 py-1 text-xs flex items-center gap-1"
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash2 className="h-3 w-3"/>
                              Удалить
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
              >
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Обозначения:</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center">
                    <div className="w-6 h-8 bg-emerald-500 mr-3 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">Книга доступна</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-8 bg-red-500 mr-3 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">Книга недоступна</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-8 bg-blue-500 mr-3 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">Журнал</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-8 bg-gray-200 dark:bg-gray-700 mr-3 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">Пустое место</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-8 bg-yellow-400 mr-3 rounded animate-pulse"></div>
                    <span className="text-gray-700 dark:text-gray-300">Найденная книга</span>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              {showJsonImport && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Импорт данных полки из JSON</h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowJsonImport(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <Textarea
                      rows={8}
                      value={jsonData}
                      onChange={(e) => setJsonData(e.target.value)}
                      placeholder='{"Id": 11, "Category": "Фантастика", ...}'
                      className="backdrop-blur-sm bg-white/40 dark:bg-gray-700/40 border border-white/20 dark:border-gray-700/30 font-mono text-sm"
                    />
                    <div className="flex justify-end gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowJsonImport(false)}
                      >
                        Отмена
                      </Button>
                      <Button 
                        onClick={importShelfFromJson}
                        disabled={loading}
                        className="bg-emerald-500/90 hover:bg-emerald-600/90"
                      >
                        {loading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            Импорт...
                          </>
                        ) : (
                          <>Импортировать данные</>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
              >
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Настройки отображения</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-mode" className="text-gray-700 dark:text-gray-300">Режим редактирования</Label>
                    <Button 
                      id="edit-mode"
                      variant={isEditMode ? "default" : "outline"}
                      onClick={toggleEditMode}
                      className={isEditMode ? "bg-emerald-500/90 hover:bg-emerald-600/90" : ""}
                    >
                      {isEditMode ? (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Включен
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Unlock className="h-4 w-4" />
                          Выключен
                        </div>
                      )}
                    </Button>
                  </div>
                  
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300 mb-2 block">Импорт/Экспорт</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowJsonImport(true)}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Импорт из JSON
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          // Простой экспорт всех полок в JSON
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shelves, null, 2));
                          const downloadAnchorNode = document.createElement('a');
                          downloadAnchorNode.setAttribute("href", dataStr);
                          downloadAnchorNode.setAttribute("download", "shelves.json");
                          document.body.appendChild(downloadAnchorNode);
                          downloadAnchorNode.click();
                          downloadAnchorNode.remove();
                          
                          toast({
                            title: "Экспорт выполнен",
                            description: "Данные полок экспортированы в JSON файл",
                          });
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                        Экспорт в JSON
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </FadeInView>
      </div>

      {/* Book Selector Modal */}
      <BookSelector />

      {/* Context Menu */}
      {showContextMenu && contextMenuData && (
        <ShelfItemContextMenu
          item={contextMenuData.item}
          isJournal={contextMenuData.isJournal}
          position={contextMenuData.position}
          onClose={handleCloseMenu}
          onRemove={handleRemoveItem}
        />
      )}
    </div>
  );
}

