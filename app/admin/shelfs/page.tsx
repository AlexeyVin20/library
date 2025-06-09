"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Lock, Unlock, X, Search, Upload, Library, ChevronLeft, AlertCircle } from "lucide-react";
import type { Book, Shelf, Journal } from "@/lib/types";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ShelfItemContextMenu from "@/components/admin/ShelfItemContextMenu";
// Update the imports to include the new components
import ShelfCanvas from "@/components/admin/ShelfCanvas";
import BookSelectorModal from "@/components/admin/BookSelectorModal";
import BookInfoModal from "@/components/admin/BookInfoModal";
interface Position {
  x: number;
  y: number;
}

// Компонент для анимированного появления
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) => {
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration,
    delay,
    ease: [0.22, 1, 0.36, 1]
  }}>
      {children}
    </motion.div>;
};
export default function ShelfsPage() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [draggedShelf, setDraggedShelf] = useState<Shelf | null>(null);
  const [mousePosition, setMousePosition] = useState<Position>({
    x: 0,
    y: 0
  });
  const [hoveredBook, setHoveredBook] = useState<Book | null>(null);
  const [highlightedBookId, setHighlightedBookId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentShelf, setCurrentShelf] = useState<Shelf | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredShelf, setHoveredShelf] = useState<Shelf | null>(null);
  const editorRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [selectedEmptySlot, setSelectedEmptySlot] = useState<{
    shelfId: number;
    position: number;
  } | null>(null);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [filteredJournals, setFilteredJournals] = useState<Journal[]>([]);
  const [isJournalTab, setIsJournalTab] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuData, setContextMenuData] = useState<{
    item: Book | Journal | null;
    isJournal: boolean;
    position: {
      x: number;
      y: number;
    };
    shelfId: number;
    itemPosition: number;
  } | null>(null);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonData, setJsonData] = useState("");
  const [activeTab, setActiveTab] = useState("shelves");
  // Add these state variables to the main component function, after the existing state declarations
  const [showBookInfoModal, setShowBookInfoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Book | Journal | null>(null);
  const [selectedItemIsJournal, setSelectedItemIsJournal] = useState(false);
  const [selectedItemShelfId, setSelectedItemShelfId] = useState<number>(0);
  const [selectedItemPosition, setSelectedItemPosition] = useState<number>(0);
  const [newShelf, setNewShelf] = useState({
    category: "",
    capacity: "",
    shelfNumber: ""
  });
  const [editShelfData, setEditShelfData] = useState({
    category: "",
    capacity: "",
    shelfNumber: "",
    posX: "",
    posY: ""
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
      setError(err instanceof Error ? err.message : "Ошибка при загрузке полок");
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при загрузке полок",
        variant: "destructive"
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
      console.error("Ошибка при загрузке книг:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить книги",
        variant: "destructive"
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
      console.error("Ошибка при загрузке журналов:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить журналы",
        variant: "destructive"
      });
    }
  };
  const handleNewShelfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setNewShelf(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleEditShelfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setEditShelfData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const addShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      const response = await fetch(`${baseUrl}/api/shelf/auto-position`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: newShelf.category,
          capacity: Number.parseInt(newShelf.capacity),
          shelfNumber: Number.parseInt(newShelf.shelfNumber)
        })
      });
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      await fetchShelves();
      setShowAddForm(false);
      setNewShelf({
        category: "",
        capacity: "",
        shelfNumber: ""
      });
      toast({
        title: "Успех",
        description: "Полка успешно добавлена"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при добавлении полки");
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при добавлении полки",
        variant: "destructive"
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
        shelfElement?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }
  };
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 1) {
      setShowSearchDropdown(true);
      const filteredResults = books.filter(b => b.title.toLowerCase().includes(term.toLowerCase()) || b.authors && b.authors.toLowerCase().includes(term.toLowerCase()));
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
          shelfElement.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

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
      const response = await fetch(`${baseUrl}/api/shelf/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      setShelves(shelves.filter(shelf => shelf.id !== id));
      toast({
        title: "Успех",
        description: "Полка успешно удалена"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при удалении полки");
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при удалении полки",
        variant: "destructive"
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
      const response = await fetch(`${baseUrl}/api/shelf/${editingShelf.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: editingShelf.id,
          category: editShelfData.category,
          capacity: Number.parseInt(editShelfData.capacity),
          shelfNumber: Number.parseInt(editShelfData.shelfNumber),
          posX: Number.parseFloat(editShelfData.posX),
          posY: Number.parseFloat(editShelfData.posY)
        })
      });
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      await fetchShelves();
      setEditingShelf(null);
      toast({
        title: "Успех",
        description: "Полка успешно обновлена"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при обновлении полки");
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при обновлении полки",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDragStart = (e: React.MouseEvent, shelf: Shelf) => {
    if (!isEditMode) return;
    const container = document.getElementById("shelf-editor");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left - shelf.posX,
      y: e.clientY - rect.top - shelf.posY
    });
    setDraggedShelf(shelf);
    e.preventDefault();
  };
  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggedShelf) return;
    const container = document.getElementById("shelf-editor");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - mousePosition.x;
    const y = e.clientY - rect.top - mousePosition.y;

    // Ограничиваем перемещение в пределах контейнера
    const newX = Math.max(0, Math.min(rect.width - 250, x));
    const newY = Math.max(0, Math.min(rect.height - 150, y));
    setShelves(shelves.map(shelf => shelf.id === draggedShelf.id ? {
      ...shelf,
      posX: newX,
      posY: newY
    } : shelf));
  };
  const handleDragEnd = async () => {
    // The API call to update the shelf position is moved to toggleEditMode
    // when the edit mode is turned off.
    setDraggedShelf(null);
  };
  const toggleEditMode = async () => {
    const newIsEditMode = !isEditMode;
    if (isEditMode) {
      // Turning OFF edit mode (current isEditMode is true)
      setIsEditMode(false); // Visually lock shelves immediately
      setLoading(true);
      toast({
        title: "Режим редактирования выключен",
        description: "Сохранение измененных позиций полок..."
      });
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) {
        toast({
          title: "Ошибка конфигурации",
          description: "NEXT_PUBLIC_BASE_URL не определен. Сохранение невозможно.",
          variant: "destructive"
        });
        setError("NEXT_PUBLIC_BASE_URL is not defined");
        setLoading(false);
        return;
      }
      if (shelves.length > 0) {
        const updatePromises = shelves.map(shelf => fetch(`${baseUrl}/api/shelf/${shelf.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: shelf.id,
            category: shelf.category,
            capacity: shelf.capacity,
            shelfNumber: shelf.shelfNumber,
            posX: shelf.posX,
            posY: shelf.posY
          })
        }).then(async response => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return Promise.reject({
              shelfId: shelf.id,
              status: response.status,
              message: errorData.message || `Ошибка API: ${response.status}`
            });
          }
          return response.json();
        }));
        const results = await Promise.allSettled(updatePromises);
        const failedUpdates = results.filter(result => result.status === "rejected");
        if (failedUpdates.length > 0) {
          const errorMessages = (failedUpdates as PromiseRejectedResult[]).map(f => `Полка #${f.reason.shelfId}: ${f.reason.message}`).join("; ");
          toast({
            title: "Ошибка сохранения позиций",
            description: `Не удалось обновить ${failedUpdates.length} из ${shelves.length} полок. ${errorMessages}`,
            variant: "destructive",
            duration: 7000
          });
          setError(`Не удалось сохранить позиции для ${failedUpdates.length} полок.`);
        } else {
          toast({
            title: "Позиции сохранены",
            description: "Все изменения позиций полок успешно сохранены на сервере."
          });
          setError(null); // Clear error on successful save
        }
      } else {
        // No shelves to save, consider it a success in terms of saving operation
        toast({
          title: "Позиции сохранены",
          description: "Нет полок для сохранения позиций."
        });
        setError(null);
      }
      setLoading(false);
    } else {
      // Turning ON edit mode
      setIsEditMode(true);
      toast({
        title: "Режим редактирования включен",
        description: "Теперь вы можете перемещать полки."
      });
    }
  };
  const handleEmptySlotClick = (shelfId: number, position: number) => {
    setSelectedEmptySlot({
      shelfId,
      position
    });
    setShowBookSelector(true);
  };
  const handleBookSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (isJournalTab) {
      const filtered = journals.filter(journal => journal.title.toLowerCase().includes(term) || journal.publisher && journal.publisher.toLowerCase().includes(term));
      setFilteredJournals(filtered);
    } else {
      const filtered = books.filter(book => book.title.toLowerCase().includes(term) || book.authors && book.authors.toLowerCase().includes(term));
      setFilteredBooks(filtered);
    }
  };
  const addItemToShelf = async (itemId: string, isJournal: boolean) => {
    if (!selectedEmptySlot) return;
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      const endpoint = isJournal ? "journals" : "books";

      // Исправление: используем правильный эндпоинт для позиционирования
      const response = await fetch(`${baseUrl}/api/${endpoint}/${itemId}/position`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          shelfId: selectedEmptySlot.shelfId,
          position: selectedEmptySlot.position
        })
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
      setSearchTerm("");
      toast({
        title: "Успех",
        description: isJournal ? "Журнал успешно добавлен на полку" : "Книга успешно добавлена на полку"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при добавлении на полку");
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при добавлении на полку",
        variant: "destructive"
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
      const {
        shelfId,
        itemPosition,
        isJournal
      } = contextMenuData;
      removeItemFromShelf(shelfId, itemPosition, isJournal);
    }
  };
  const removeItemFromShelf = async (shelfId: number, position: number, isJournal: boolean) => {
    if (!contextMenuData && !selectedItem) {
      // Если нет данных ни из контекстного меню, ни из выбранного элемента, выходим.
      // Это важно, так как selectedItem используется, если contextMenuData отсутствует (например, при удалении из BookInfoModal)
      console.error("removeItemFromShelf: Нет данных для удаления элемента.");
      return;
    }

    // Определяем itemId и isJournal приоритетно из contextMenuData, если оно есть,
    // иначе используем selectedItem (для удаления из BookInfoModal).
    const currentItem = contextMenuData?.item || selectedItem;
    const currentIsJournal = contextMenuData ? contextMenuData.isJournal : selectedItemIsJournal;
    if (!currentItem) {
      console.error("removeItemFromShelf: Не удалось определить элемент для удаления.");
      return;
    }
    const itemId = currentItem.id;
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      const apiResource = currentIsJournal ? "Journals" : "Books"; // Используем заглавные буквы для ресурса

      // Используем новый эндпоинт и метод PUT
      const response = await fetch(`${baseUrl}/api/${apiResource}/${itemId}/shelf/remove`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        }
        // Тело запроса больше не нужно
      });
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);

      // Обновляем данные
      if (currentIsJournal) {
        await fetchJournals();
      } else {
        await fetchBooks();
      }
      setShowContextMenu(false);
      setContextMenuData(null);
      // Также закрываем BookInfoModal, если удаление было инициировано оттуда
      if (selectedItem && selectedItem.id === itemId) {
        setShowBookInfoModal(false);
        setSelectedItem(null);
      }
      toast({
        title: "Успех",
        description: currentIsJournal ? "Журнал успешно удален с полки" : "Книга успешно удалена с полки"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при удалении с полки");
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при удалении с полки",
        variant: "destructive"
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
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [showContextMenu]);

  // Replace the existing ShelfContent component with a stub since it's now handled in ShelfCanvas
  const ShelfContent = ({
    shelf
  }: {
    shelf: Shelf;
  }) => {
    return null; // This is now handled in ShelfCanvas
  };

  // Replace the existing BookSelector component with a stub since we're using the new BookSelectorModal
  const BookSelector = () => {
    return null; // This is now handled by BookSelectorModal
  };

  // Add a function to handle item click (book or journal)
  const handleItemClick = (item: Book | Journal | null, isJournal: boolean, shelfId: number, position: number) => {
    setSelectedItem(item);
    setSelectedItemIsJournal(isJournal);
    setSelectedItemShelfId(shelfId);
    setSelectedItemPosition(position);
    setShowBookInfoModal(true);
  };
  return <div className="min-h-screen bg-gray-200">
      <div className="container mx-auto p-6">
        {/* Header */}
        <FadeInView>
          <div className="mb-8 flex items-center gap-4">
            <motion.div initial={{
            x: -20,
            opacity: 0
          }} animate={{
            x: 0,
            opacity: 1
          }} transition={{
            duration: 0.5
          }}>
              <Link href="/admin" className="flex items-center gap-2 text-blue-700 hover:text-blue-500 transition-colors">
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Назад</span>
              </Link>
            </motion.div>

            <motion.h1 initial={{
            opacity: 0,
            y: -20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.1
          }} className="text-3xl font-bold text-gray-800">
              Управление полками библиотеки
            </motion.h1>
          </div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          <Tabs defaultValue="shelves" onValueChange={setActiveTab} className="space-y-8">
            <TabsContent value="shelves" className="space-y-6">
              {error && <motion.div initial={{
              opacity: 0,
              y: -10
            }} animate={{
              opacity: 1,
              y: 0
            }} className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex-1">
                  {!showAddForm ? <motion.button onClick={() => setShowAddForm(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-3 flex items-center gap-2 shadow-md" whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                }} whileTap={{
                  scale: 0.98
                }}>
                      <Plus className="h-5 w-5" />
                      Добавить полку
                    </motion.button> : <motion.div initial={{
                  opacity: 0,
                  y: 20
                }} animate={{
                  opacity: 1,
                  y: 0
                }} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Добавить новую полку</h2>
                        <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <form onSubmit={addShelf} className="space-y-4">
                        <div>
                          <Label htmlFor="category" className="text-gray-500">
                            Рубрика
                          </Label>
                          <Input id="category" name="category" placeholder="Рубрика (например, Фантастика)" value={newShelf.category} onChange={handleNewShelfChange} className="bg-gray-100 border border-gray-200" required />
                        </div>

                        <div>
                          <Label htmlFor="capacity" className="text-gray-500">
                            Количество мест
                          </Label>
                          <Input id="capacity" type="number" name="capacity" placeholder="Количество мест для книг/журналов" value={newShelf.capacity} onChange={handleNewShelfChange} className="bg-gray-100 border border-gray-200" min="1" required />
                        </div>
                        <div>
                          <Label htmlFor="shelfNumber" className="text-gray-500">
                            Номер полки
                          </Label>
                          <Input id="shelfNumber" type="number" name="shelfNumber" placeholder="Номер полки" value={newShelf.shelfNumber} onChange={handleNewShelfChange} className="bg-gray-100 border border-gray-200" min="1" required />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                            Отмена
                          </Button>
                          <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-700">
                            {loading ? <>
                                <motion.div animate={{
                            rotate: 360
                          }} transition={{
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear"
                          }} className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                Добавление...
                              </> : <>Добавить полку</>}
                          </Button>
                        </div>
                      </form>
                    </motion.div>}
                </div>

                <div className="flex-1">
                  <div className="relative">
                    <Input type="text" placeholder="Поиск книг по названию или автору..." className="bg-gray-100 border border-gray-200 w-full pl-10" value={searchTerm} onChange={handleSearch} onFocus={() => searchTerm.length > 1 && setShowSearchDropdown(true)} onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)} />
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                  </div>

                  <AnimatePresence>
                    {showSearchDropdown && filteredBooks.length > 0 && <motion.div initial={{
                    opacity: 0,
                    y: -10,
                    scale: 0.95
                  }} animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1
                  }} exit={{
                    opacity: 0,
                    y: -10,
                    scale: 0.95
                  }} transition={{
                    duration: 0.2
                  }} className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-auto border border-gray-200">
                        {filteredBooks.map((book, index) => <motion.div key={book.id} initial={{
                      opacity: 0,
                      x: -5
                    }} animate={{
                      opacity: 1,
                      x: 0
                    }} transition={{
                      delay: index * 0.05,
                      duration: 0.2
                    }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => animateHighlightedBook(book.id)}>
                            <div className="font-medium text-gray-800">{book.title}</div>
                            <div className="text-sm text-gray-500">{book.authors || "Автор не указан"}</div>
                          </motion.div>)}
                      </motion.div>}
                  </AnimatePresence>
                </div>
              </div>

              {editingShelf && <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Редактировать полку #{editingShelf.id}</h2>
                    <Button variant="ghost" size="sm" onClick={() => setEditingShelf(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <form onSubmit={updateShelf} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-category" className="text-gray-500">
                          Рубрика
                        </Label>
                        <Input id="edit-category" name="category" placeholder="Рубрика" value={editShelfData.category} onChange={handleEditShelfChange} className="bg-gray-100 border border-gray-200" required />
                      </div>
                      <div>
                        <Label htmlFor="edit-capacity" className="text-gray-500">
                          Количество мест
                        </Label>
                        <Input id="edit-capacity" type="number" name="capacity" placeholder="Кол-во мест" value={editShelfData.capacity} onChange={handleEditShelfChange} className="bg-gray-100 border border-gray-200" min="1" required />
                      </div>
                      <div>
                        <Label htmlFor="edit-shelfNumber" className="text-gray-500">
                          Номер полки
                        </Label>
                        <Input id="edit-shelfNumber" type="number" name="shelfNumber" placeholder="Номер полки" value={editShelfData.shelfNumber} onChange={handleEditShelfChange} className="bg-gray-100 border border-gray-200" min="1" required />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setEditingShelf(null)}>
                        Отмена
                      </Button>
                      <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-700">
                        {loading ? <>
                            <motion.div animate={{
                        rotate: 360
                      }} transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear"
                      }} className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Сохранение...
                          </> : <>Сохранить изменения</>}
                      </Button>
                    </div>
                  </form>
                </motion.div>}

              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.3
            }} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Library className="h-5 w-5 text-blue-500" />
                    Визуальное расположение полок
                  </h2>
                  <div className="flex gap-2">
                    <motion.button onClick={toggleEditMode} className={`${isEditMode ? "bg-yellow-400" : "bg-blue-500"} border border-gray-200 text-white rounded-lg p-2 flex items-center justify-center`} whileHover={{
                    y: -2,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                  }} whileTap={{
                    scale: 0.95
                  }} title={isEditMode ? "Заблокировать перемещение" : "Разблокировать перемещение"}>
                      {isEditMode ? <Lock size={18} /> : <Unlock size={18} />}
                    </motion.button>
                  </div>
                </div>

                <ShelfCanvas shelves={shelves} books={books} journals={journals} loading={loading} isEditMode={isEditMode} highlightedBookId={highlightedBookId} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd} onShelfEdit={startEditShelf} onShelfDelete={deleteShelf} onItemClick={handleItemClick} onEmptySlotClick={handleEmptySlotClick} />
              </motion.div>

              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.4
            }} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Обозначения:</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center">
                    <div className="w-6 h-8 bg-green-500 mr-3 rounded"></div>
                    <span className="text-gray-500">Книга доступна</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-8 bg-red-500 mr-3 rounded"></div>
                    <span className="text-gray-500">Книга недоступна</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-8 bg-blue-500 mr-3 rounded"></div>
                    <span className="text-gray-500">Журнал</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-8 bg-gray-200 mr-3 rounded"></div>
                    <span className="text-gray-500">Пустое место</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-8 bg-yellow-400 mr-3 rounded animate-pulse"></div>
                    <span className="text-gray-500">Найденная книга</span>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {showJsonImport && <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                </div>
                <div className="space-y-4">
                  <Textarea rows={8} value={jsonData} onChange={e => setJsonData(e.target.value)} placeholder='{"Id": 11, "Category": "Фантастика", ...}' className="bg-gray-100 border border-gray-200 font-mono text-sm" />
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowJsonImport(false)}>
                      Отмена
                    </Button>
                    
                  </div>
                </div>
              </motion.div>}
          </Tabs>
        </FadeInView>
      </div>
      {/* Book Selector Modal */}
      <BookSelectorModal open={showBookSelector} onOpenChange={setShowBookSelector} books={books.filter(b => !b.shelfId)} // Only show books that aren't already on shelves
    journals={journals.filter(j => !j.shelfId)} // Only show journals that aren't already on shelves
    onSelect={(itemId, isJournal) => addItemToShelf(itemId, isJournal)} shelfCategory={selectedEmptySlot ? shelves.find(s => s.id === selectedEmptySlot.shelfId)?.category : undefined} />
      {/* Book Info Modal */}
      <BookInfoModal open={showBookInfoModal} onOpenChange={setShowBookInfoModal} item={selectedItem} isJournal={selectedItemIsJournal} shelfId={selectedItemShelfId} position={selectedItemPosition} onRemove={() => {
      if (selectedItem) {
        removeItemFromShelf(selectedItemShelfId, selectedItemPosition, selectedItemIsJournal);
      }
    }} />
      {/* Context Menu */}
      {showContextMenu && contextMenuData && <ShelfItemContextMenu item={contextMenuData.item} isJournal={contextMenuData.isJournal} position={contextMenuData.position} onClose={handleCloseMenu} onRemove={handleRemoveItem} />}
    </div>;
}