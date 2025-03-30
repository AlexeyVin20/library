"use client";

import { useState, useEffect, MouseEvent, useRef } from 'react';
import { Plus, Lock, Unlock, X, Search, Upload } from 'lucide-react';
import { Book, Shelf, Journal } from '@/lib/types';
import Link from 'next/link';
import Modal from '@/components/Modal';
import ShelfItemContextMenu from '@/components/admin/ShelfItemContextMenu';

interface Position {
  x: number;
  y: number;
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

  const getThemeClasses = () => {
    return {
      card: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] h-full flex flex-col",
      shelfCard: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)]",
      statsCard: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] h-full flex flex-col justify-between",
      mainContainer: "bg-gray-100/70 dark:bg-neutral-900/70 backdrop-blur-xl min-h-screen p-6",
      button: "bg-gradient-to-r from-primary-admin/90 to-primary-admin/70 dark:from-primary-admin/80 dark:to-primary-admin/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-5 py-3 flex items-center justify-center gap-2",
      iconButton: "flex items-center justify-center p-2 rounded-lg bg-gradient-to-r from-gray-200/90 to-gray-300/70 dark:from-gray-700/80 dark:to-gray-800/60 backdrop-blur-xl text-gray-700 dark:text-gray-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300",
      input: "max-w-xs bg-white/40 dark:bg-neutral-700/40 backdrop-blur-sm border border-white/30 dark:border-neutral-700/30 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg px-4 py-2",
      menu: "backdrop-blur-xl bg-white/80 dark:bg-neutral-800/80 p-3 rounded-lg border border-white/20 dark:border-neutral-700/20 shadow-lg",
      menuItem: "block p-2 rounded-md hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors",
      editorArea: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden min-h-[500px] relative",
      bookOnShelf: "w-6 h-8 rounded transition-all cursor-pointer",
      searchDropdown: "absolute z-50 mt-1 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-md shadow-lg max-h-60 overflow-auto",
      searchItem: "px-4 py-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 cursor-pointer",
      highlightedBook: "animate-pulse border-2 border-yellow-400 shadow-lg shadow-yellow-300/50",
      sectionTitle: "text-2xl font-bold mb-4 text-neutral-500 dark:text-white border-b pb-2 border-white/30 dark:border-neutral-700/30",
    };
  };
  
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
          capacity: parseInt(newShelf.capacity),
          shelfNumber: parseInt(newShelf.shelfNumber)
        }),
      });

      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      
      await fetchShelves();
      setShowAddForm(false);
      setNewShelf({ category: '', capacity: '', shelfNumber: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении полки');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении полки');
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
          capacity: parseInt(editShelfData.capacity),
          shelfNumber: parseInt(editShelfData.shelfNumber),
          posX: parseFloat(editShelfData.posX),
          posY: parseFloat(editShelfData.posY),
        }),
      });
      
      if (!response.ok) throw new Error(`API ответил с кодом: ${response.status}`);
      
      await fetchShelves();
      setEditingShelf(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении полки');
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
      }
    }
    
    setDraggedShelf(null);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
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
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении на полку');
    } finally {
      setLoading(false);
    }
  };
  

  const BookSelector = () => {
    return (
      <Modal
        isOpen={showBookSelector}
        onClose={() => {
          setShowBookSelector(false);
          setSelectedEmptySlot(null);
          setSearchTerm('');
          setIsJournalTab(false);
        }}
        title="Выберите элемент для добавления на полку"
      >
        <div className="p-4">
  <div className="flex mb-4">
    <button
      className={`px-4 py-2 rounded-l-lg ${!isJournalTab ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-900'}`}
      onClick={() => setIsJournalTab(false)}
    >
      Книги
    </button>
    <button
      className={`px-4 py-2 rounded-r-lg ${isJournalTab ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-900'}`}
      onClick={() => setIsJournalTab(true)}
    >
      Журналы
    </button>
  </div>
  
  <div className="mb-4">
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={handleBookSearch}
        placeholder={isJournalTab ? "Поиск журналов..." : "Поиск книг..."}
        className="w-full px-4 py-2 border rounded-lg pr-10 text-gray-900"
      />
      <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
    </div>
  </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {isJournalTab ? (
              filteredJournals.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Журналы не найдены</div>
              ) : (
                filteredJournals.map(journal => (
                  <div
                    key={journal.id}
                    className="p-3 border-b hover:bg-gray-100 cursor-pointer flex items-start"
                    onClick={() => addItemToShelf(journal.id.toString(), true)}
                  >
                    <div className="w-10 h-14 bg-blue-200 rounded mr-3 flex-shrink-0">
                      {journal.coverImageUrl ? (
                        <img src={journal.coverImageUrl} alt={journal.title} className="w-full h-full object-cover rounded" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-700 text-sm">
                          Журнал
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{journal.title}</h3>
                      <p className="text-sm text-gray-600">{journal.publisher || 'Издатель не указан'}</p>
                      <p className="text-xs text-gray-500">ISSN: {journal.issn || 'Нет'}</p>
                    </div>
                  </div>
                ))
              )
            ) : (
              filteredBooks.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Книги не найдены</div>
              ) : (
                filteredBooks.map(book => (
                  <div
                    key={book.id}
                    className="p-3 border-b hover:bg-gray-100 cursor-pointer flex items-start"
                    onClick={() => addItemToShelf(book.id, false)}
                  >
                    <div className="w-10 h-14 bg-green-200 rounded mr-3 flex-shrink-0">
                      {book.cover ? (
                        <img src={book.cover} alt={book.title} className="w-full h-full object-cover rounded" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-green-700 text-sm">
                          Книга
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{book.title}</h3>
                      <p className="text-sm text-gray-600">{book.authors || 'Автор не указан'}</p>
                      <p className="text-xs text-gray-500">ISBN: {book.isbn || 'Нет'}</p>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </Modal>
    );
  };

  const themeClasses = getThemeClasses();

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
                  ? 'bg-green-500 hover:scale-105 hover:shadow-md' 
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
            <div
              key={i}
              data-book-id={book?.id || ''}
              title={item ? `${item.title} (${journal ? 'Журнал' : 'Книга'})${book?.authors ? ` - ${book.authors}` : ''}` : 'Пустое место'}
              className={`${themeClasses.bookOnShelf} ${getBackground()}`}
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
            ></div>
          );
        })}
      </div>
    );
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
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении с полки');
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
        return;
      }
      
      if (!data || !data.Id) {
        setError('Неверный формат данных полки');
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
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при импорте данных полки');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex flex-col">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-neutral-500 dark:text-white">Управление полками библиотеки</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowJsonImport(true)}
                className={`${themeClasses.iconButton}`}
                title="Импорт данных полки из JSON"
              >
                <Upload size={18} />
              </button>
              <button
                onClick={toggleEditMode}
                className={`${themeClasses.iconButton} ${isEditMode ? 'bg-yellow-200/80 dark:bg-yellow-700/80' : ''}`}
                title={isEditMode ? "Заблокировать перемещение" : "Разблокировать перемещение"}
              >
                {isEditMode ? <Lock size={18} /> : <Unlock size={18} />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          {error && (
            <div className={`${themeClasses.card} p-4 flex justify-between items-center text-red-700`}>
              {error}
              <button onClick={() => setError(null)} className="text-red-700 font-bold">×</button>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 max-w-xl">
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className={`${themeClasses.button} flex items-center`}
                >
                  <Plus size={20} className="mr-2" />
                  Добавить полку
                </button>
              ) : (
                <form onSubmit={addShelf} className={themeClasses.card}>
                  <div className="flex justify-between items-center p-4 border-b border-primary-300/30 dark:border-primary-700/30">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Добавить новую полку</h2>
                    <button type="button" onClick={() => setShowAddForm(false)} className="text-neutral-500 hover:text-neutral-700">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">Рубрика</label>
                      <input
                        type="text"
                        name="category"
                        placeholder="Рубрика (например, Фантастика)"
                        value={newShelf.category}
                        onChange={handleNewShelfChange}
                        className={`${themeClasses.input} text-gray-900 dark:text-gray-100`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Количество мест</label>
                      <input
                        type="number"
                        name="capacity"
                        placeholder="Количество мест для книг/журналов"
                        value={newShelf.capacity}
                        onChange={handleNewShelfChange}
                        className={themeClasses.input}
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Номер полки</label>
                      <input
                        type="number"
                        name="shelfNumber"
                        placeholder="Номер полки"
                        value={newShelf.shelfNumber}
                        onChange={handleNewShelfChange}
                        className={themeClasses.input}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="p-4 border-t border-primary-300/30 dark:border-primary-700/30">
                    <button type="submit" className={themeClasses.button}>
                      Добавить полку
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex-1 relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск книг по названию или автору..."
                  className={`${themeClasses.input} w-full pl-10 text-gray-900 dark:text-gray-100`}
                  value={searchTerm}
                  onChange={handleSearch}
                  onFocus={() => searchTerm.length > 1 && setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
              </div>
              
              {showSearchDropdown && filteredBooks.length > 0 && (
                <div className={themeClasses.searchDropdown}>
                  {filteredBooks.map(book => (
                    <div 
                      key={book.id}
                      className={themeClasses.searchItem}
                      onMouseDown={() => animateHighlightedBook(book.id)}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{book.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{book.authors || 'Автор не указан'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {editingShelf && (
            <form onSubmit={updateShelf} className={themeClasses.card}>
              <div className="p-4 border-b border-primary-300/30 dark:border-primary-700/30">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Редактировать полку #{editingShelf.id}</h2>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Рубрика</label>
                  <input
                    type="text"
                    name="category"
                    placeholder="Рубрика"
                    value={editShelfData.category}
                    onChange={handleEditShelfChange}
                    className={themeClasses.input}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Количество мест</label>
                  <input
                    type="number"
                    name="capacity"
                    placeholder="Кол-во мест"
                    value={editShelfData.capacity}
                    onChange={handleEditShelfChange}
                    className={themeClasses.input}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Номер полки</label>
                  <input
                    type="number"
                    name="shelfNumber"
                    placeholder="Номер полки"
                    value={editShelfData.shelfNumber}
                    onChange={handleEditShelfChange}
                    className={themeClasses.input}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="p-4 border-t border-primary-300/30 dark:border-primary-700/30 flex space-x-4">
                <button type="submit" className={themeClasses.button}>
                  Сохранить изменения
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingShelf(null); }}
                  className="bg-neutral-500/90 hover:bg-neutral-500 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}

          {showJsonImport && (
            <div className={themeClasses.card}>
              <div className="flex justify-between items-center p-4 border-b border-primary-300/30 dark:border-primary-700/30">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Импорт данных полки из JSON</h2>
                <button type="button" onClick={() => setShowJsonImport(false)} className="text-neutral-500 hover:text-neutral-700">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <textarea
                  rows={8}
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder='{"Id": 11, "Category": "Фантастика", ...}'
                  className={`${themeClasses.input} w-full font-mono text-sm`}
                />
              </div>
              <div className="p-4 border-t border-primary-300/30 dark:border-primary-700/30">
                <button 
                  type="button" 
                  onClick={importShelfFromJson}
                  className={themeClasses.button}
                >
                  Импортировать данные
                </button>
              </div>
            </div>
          )}

          <div
            id="shelf-editor"
            ref={editorRef}
            className={`${themeClasses.editorArea} relative p-4 h-[600px]`}
            onMouseMove={draggedShelf ? handleDragMove : undefined}
            onMouseUp={draggedShelf ? handleDragEnd : undefined}
            onMouseLeave={draggedShelf ? handleDragEnd : undefined}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : shelves.length === 0 ? (
              <div className="flex items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
                Нет полок для отображения. Добавьте первую полку.
              </div>
            ) : (
              shelves.map((shelf) => (
                <div
                  key={shelf.id}
                  id={`shelf-${shelf.id}`}
                  className={`${themeClasses.shelfCard} absolute p-3 ${isEditMode ? 'cursor-move' : ''}`}
                  style={{
                    left: shelf.posX,
                    top: shelf.posY,
                    transition: draggedShelf?.id === shelf.id ? 'none' : 'all 0.2s ease',
                    zIndex: draggedShelf?.id === shelf.id ? 100 : 10,
                  }}
                  onMouseDown={isEditMode ? (e) => handleDragStart(e, shelf) : undefined}
                  onMouseEnter={() => setHoveredShelf(shelf)}
                  onMouseLeave={() => setTimeout(() => { if (!hoveredBook) setHoveredShelf(null); }, 100)}
                >
                  <div className="shelf-container">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-blue-900 dark:text-blue-300">{shelf.category}</span>
                      <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs text-blue-800 dark:text-blue-200">
                        #{shelf.shelfNumber}
                      </span>
                    </div>
                    
                    <ShelfContent shelf={shelf} />
                    
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => startEditShelf(shelf)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-sm hover:shadow-md px-2 py-1 text-xs"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => { if (confirm('Вы уверены, что хотите удалить эту полку?')) deleteShelf(shelf.id); }}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm hover:shadow-md px-2 py-1 text-xs"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={themeClasses.card}>
            <div className="p-4">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Обозначения:</h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 mr-2 rounded"></div>
                  <span className="text-neutral-700 dark:text-neutral-300">Книга доступна</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 mr-2 rounded"></div>
                  <span className="text-neutral-700 dark:text-neutral-300">Книга недоступна</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 mr-2 rounded"></div>
                  <span className="text-neutral-700 dark:text-neutral-300">Журнал</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 mr-2 rounded"></div>
                  <span className="text-neutral-700 dark:text-neutral-300">Пустое место (кликните, чтобы добавить)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-300 mr-2 rounded"></div>
                  <span className="text-neutral-700 dark:text-neutral-300">Найденная книга</span>
                </div>
              </div>
            </div>
          </div>
        </main>
        <BookSelector />

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
