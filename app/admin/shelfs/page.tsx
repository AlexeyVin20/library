"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent, MouseEvent } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Book {
  id: number;
  title: string;
  authors: string;
  availableCopies?: number;
}

interface Shelf {
  id: number;
  category: string;
  capacity: number;
  shelfNumber: number;
  posX: number;
  posY: number;
  books?: Book[];
}

interface ShelfFormData {
  category: string;
  capacity: string;
  shelfNumber: string;
  posX: string;
  posY: string;
}

const EditorPage: React.FC = () => {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [newShelf, setNewShelf] = useState<ShelfFormData>({
    category: '',
    capacity: '',
    shelfNumber: '',
    posX: '',
    posY: '',
  });
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [editShelfData, setEditShelfData] = useState<ShelfFormData>({
    category: '',
    capacity: '',
    shelfNumber: '',
    posX: '',
    posY: '',
  });
  const [hoveredShelf, setHoveredShelf] = useState<Shelf | null>(null);
  const [hoveredBook, setHoveredBook] = useState<Book | null>(null);
  const [draggedShelf, setDraggedShelf] = useState<Shelf | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [positionError, setPositionError] = useState<string | null>(null);

  // URL вашего ASP.NET Core API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:5001';

  // Загрузка списка полок с API
  const fetchShelves = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/shelf`);
      
      if (!res.ok) {
        throw new Error(`API ответил с кодом: ${res.status}`);
      }
      
      const data: Shelf[] = await res.json();
      setShelves(data);
      setError(null);
    } catch (err) {
      setError(`Ошибка загрузки полок: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      console.error('Ошибка при загрузке полок:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelves();
  }, []);

  const handleNewShelfChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewShelf(prev => ({ ...prev, [name]: value }));
    
    // Проверка позиции полки при изменении координат
    if (name === 'posX' || name === 'posY') {
      checkShelfPosition({
        ...newShelf,
        [name]: value
      });
    }
  };

  const handleEditShelfChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditShelfData(prev => ({ ...prev, [name]: value }));
    
    // Проверка позиции при редактировании
    if (name === 'posX' || name === 'posY') {
      checkShelfPosition({
        ...editShelfData,
        [name]: value
      }, editingShelf?.id);
    }
  };

  // Проверка, не занята ли позиция другой полкой
  const checkShelfPosition = (formData: ShelfFormData, excludeId?: number) => {
    if (!formData.posX || !formData.posY) return;
    
    const newX = parseFloat(formData.posX);
    const newY = parseFloat(formData.posY);
    
    // Размеры полки для проверки пересечения
    const shelfWidth = 150;
    const shelfHeight = 100;
    
    // Проверяем, не перекрывается ли новая позиция с существующими полками
    const isOverlapping = shelves.some(shelf => {
      // Пропускаем текущую редактируемую полку
      if (excludeId && shelf.id === excludeId) return false;
      
      // Проверка пересечения прямоугольников
      const overlapsX = Math.abs(shelf.posX - newX) < shelfWidth;
      const overlapsY = Math.abs(shelf.posY - newY) < shelfHeight;
      
      return overlapsX && overlapsY;
    });
    
    if (isOverlapping) {
      setPositionError("Эта позиция уже занята другой полкой");
    } else {
      setPositionError(null);
    }
    
    return isOverlapping;
  };

  const addShelf = async (e: FormEvent) => {
    e.preventDefault();
    
    // Проверяем, не занята ли позиция
    if (checkShelfPosition(newShelf)) {
      return;
    }
    
    try {
      const res = await fetch(`${baseUrl}/api/shelf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newShelf.category,
          capacity: parseInt(newShelf.capacity, 10),
          shelfNumber: parseInt(newShelf.shelfNumber, 10),
          posX: parseFloat(newShelf.posX),
          posY: parseFloat(newShelf.posY),
        }),
      });
      
      if (!res.ok) {
        throw new Error(`API ответил с кодом: ${res.status}`);
      }
      
      fetchShelves();
      setNewShelf({ category: '', capacity: '', shelfNumber: '', posX: '', posY: '' });
      setShowAddForm(false);
    } catch (err) {
      setError(`Ошибка добавления полки: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      console.error('Ошибка при добавлении полки:', err);
    }
  };

  const startEditShelf = (shelf: Shelf) => {
    setEditingShelf(shelf);
    setEditShelfData({
      category: shelf.category,
      capacity: shelf.capacity.toString(),
      shelfNumber: shelf.shelfNumber.toString(),
      posX: shelf.posX.toString(),
      posY: shelf.posY.toString(),
    });
  };

  const updateShelf = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingShelf) return;
    
    // Проверяем, не занята ли позиция
    if (checkShelfPosition(editShelfData, editingShelf.id)) {
      return;
    }
    
    try {
      const res = await fetch(`${baseUrl}/api/shelf/${editingShelf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingShelf.id,
          category: editShelfData.category,
          capacity: parseInt(editShelfData.capacity, 10),
          shelfNumber: parseInt(editShelfData.shelfNumber, 10),
          posX: parseFloat(editShelfData.posX),
          posY: parseFloat(editShelfData.posY),
          // Не отправляем свойство books
        }),
      });
      
      if (!res.ok) {
        throw new Error(`API ответил с кодом: ${res.status}`);
      }
      
      fetchShelves();
      setEditingShelf(null);
    } catch (err) {
      setError(`Ошибка обновления полки: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      console.error('Ошибка при обновлении полки:', err);
    }
  };

  const deleteShelf = async (id: number) => {
    try {
      const res = await fetch(`${baseUrl}/api/shelf/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error(`API ответил с кодом: ${res.status}`);
      }
      
      fetchShelves();
    } catch (err) {
      setError(`Ошибка удаления полки: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      console.error('Ошибка при удалении полки:', err);
    }
  };

  // Обработчики перетаскивания полок
  const handleDragStart = (e: MouseEvent, shelf: Shelf) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggedShelf(shelf);
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!draggedShelf) return;

    const editorRect = document.getElementById('shelf-editor')?.getBoundingClientRect();
    if (!editorRect) return;

    // Рассчитываем новые координаты с учетом смещения
    const newX = e.clientX - editorRect.left - dragOffset.x;
    const newY = e.clientY - editorRect.top - dragOffset.y;

    // Ограничиваем координаты, чтобы не выходить за границы
    const boundedX = Math.max(0, Math.min(editorRect.width - 150, newX));
    const boundedY = Math.max(0, Math.min(editorRect.height - 100, newY));

    // Проверяем перекрытие с другими полками
    const isOverlapping = shelves.some(shelf => {
      if (shelf.id === draggedShelf.id) return false;
      
      // Простая проверка - расстояние между центрами полок
      const distance = Math.sqrt(
        Math.pow(shelf.posX - boundedX, 2) + 
        Math.pow(shelf.posY - boundedY, 2)
      );
      
      return distance < 75; // Минимальное расстояние между полками
    });
    
    if (isOverlapping) {
      setPositionError("Нельзя разместить полку на этой позиции");
    } else {
      setPositionError(null);
      
      // Обновляем положение полки в состоянии
      setShelves(prevShelves => 
        prevShelves.map(s => 
          s.id === draggedShelf.id 
            ? { ...s, posX: boundedX, posY: boundedY } 
            : s
        )
      );
    }
  };

  const handleDragEnd = async () => {
    if (!draggedShelf) return;

    // Проверяем, не появился ли конфликт позиций
    if (positionError) {
      fetchShelves(); // Возвращаем полку на исходную позицию
      setPositionError(null);
      setDraggedShelf(null);
      return;
    }

    // Получаем обновленную полку из состояния
    const updatedShelf = shelves.find(s => s.id === draggedShelf.id);
    if (!updatedShelf) return;

    try {
      // Создаем новый объект без свойства books
      const shelfToUpdate = {
        id: updatedShelf.id,
        category: updatedShelf.category,
        capacity: updatedShelf.capacity,
        shelfNumber: updatedShelf.shelfNumber,
        posX: updatedShelf.posX,
        posY: updatedShelf.posY
      };

      // Отправляем обновленные координаты на сервер
      const res = await fetch(`${baseUrl}/api/shelf/${draggedShelf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shelfToUpdate),
      });
      
      if (!res.ok) {
        throw new Error(`API ответил с кодом: ${res.status}`);
      }
    } catch (err) {
      setError(`Ошибка сохранения позиции: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      console.error('Ошибка при сохранении позиции полки:', err);
      fetchShelves();
    } finally {
      setDraggedShelf(null);
    }
  };

  // SVG-компонент для отрисовки полки в виде шкафчика
  const ShelfSVG: React.FC<{ 
    shelf: Shelf, 
    handleMouseDown: (e: MouseEvent, shelf: Shelf) => void 
  }> = ({ shelf, handleMouseDown }) => {
    const shelfWidth = 150;
    const shelfHeight = 80;
    const bookWidth = (shelfWidth - 20) / shelf.capacity;
    const bookHeight = 20;
    
    return (
      <svg 
        width={shelfWidth} 
        height={shelfHeight} 
        viewBox={`0 0 ${shelfWidth} ${shelfHeight}`}
        onMouseDown={(e) => handleMouseDown(e, shelf)}
        className="cursor-move"
      >
        {/* Основа шкафчика - прямоугольник */}
        <rect x="0" y="0" width={shelfWidth} height={shelfHeight - 20} fill="#8B4513" stroke="#5D4037" strokeWidth="2" />
        
        {/* Верхняя полка */}
        <rect x="5" y="5" width={shelfWidth - 10} height="5" fill="#A0522D" />
        
        {/* Средняя полка */}
        <rect x="5" y={(shelfHeight - 20) / 2} width={shelfWidth - 10} height="5" fill="#A0522D" />
        
        {/* Нижняя полка */}
        <rect x="5" y={shelfHeight - 25} width={shelfWidth - 10} height="5" fill="#A0522D" />
        
        {/* Места для книг на верхней полке */}
        <g>
          {Array.from({ length: shelf.capacity }).map((_, index) => {
            const bookX = 10 + index * bookWidth;
            const hasBook = shelf.books && index < shelf.books.length;
            const book = hasBook ? shelf.books![index] : null;
            
            // Определяем цвет книги в зависимости от доступности копий
            let bookColor = "#f5f5f5"; // По умолчанию - светло-серый (нет книги)
            if (hasBook) {
              if (book?.availableCopies === 0) {
                bookColor = "#FF5252"; // Красный - нет доступных копий
              } else {
                bookColor = "#4CAF50"; // Зеленый - есть доступные копии
              }
            }
            
            return (
              <rect 
                key={index}
                x={bookX}
                y="10"
                width={bookWidth - 2}
                height={bookHeight}
                fill={bookColor}
                stroke="#ddd"
                strokeWidth="1"
                onMouseEnter={() => hasBook && setHoveredBook(shelf.books![index])}
                onMouseLeave={() => setHoveredBook(null)}
              />
            );
          })}
        </g>
        
        {/* Текст-заголовок полки */}
        <text x="5" y={shelfHeight - 5} fontSize="12" fill="#333">
          {shelf.category} — #{shelf.shelfNumber}
        </text>
      </svg>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Редактор полок</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-2 text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}
      
      {positionError && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
          {positionError}
          <button 
            onClick={() => setPositionError(null)} 
            className="ml-2 text-yellow-800 font-bold"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Кнопка добавления новой полки */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="mb-4 flex items-center bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
        >
          <Plus size={20} className="mr-1" />
          <span>Добавить полку</span>
        </button>
      ) : (
        /* Форма для добавления новой полки */
        <form onSubmit={addShelf} className="mb-4 p-4 bg-gray-50 rounded shadow">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Добавить новую полку</h2>
            <button 
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              name="category"
              placeholder="Рубрика"
              value={newShelf.category}
              onChange={handleNewShelfChange}
              className="p-2 border rounded"
              required
            />
            <input
              type="number"
              name="capacity"
              placeholder="Кол-во мест"
              value={newShelf.capacity}
              onChange={handleNewShelfChange}
              className="p-2 border rounded"
              min="1"
              required
            />
            <input
              type="number"
              name="shelfNumber"
              placeholder="Номер полки"
              value={newShelf.shelfNumber}
              onChange={handleNewShelfChange}
              className="p-2 border rounded"
              min="1"
              required
            />
            <div className="flex space-x-2">
              <input
                type="number"
                name="posX"
                placeholder="Позиция X"
                value={newShelf.posX}
                onChange={handleNewShelfChange}
                className="p-2 border rounded w-1/2"
                required
              />
              <input
                type="number"
                name="posY"
                placeholder="Позиция Y"
                value={newShelf.posY}
                onChange={handleNewShelfChange}
                className="p-2 border rounded w-1/2"
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="mt-3 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
            disabled={!!positionError}
          >
            Добавить полку
          </button>
        </form>
      )}

      {/* Форма для редактирования полки */}
      {editingShelf && (
        <form onSubmit={updateShelf} className="mb-4 border p-4 rounded shadow bg-yellow-50">
          <h2 className="text-xl font-semibold mb-3">Редактировать полку #{editingShelf.id}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              name="category"
              placeholder="Рубрика"
              value={editShelfData.category}
              onChange={handleEditShelfChange}
              className="p-2 border rounded"
              required
            />
            <input
              type="number"
              name="capacity"
              placeholder="Кол-во мест"
              value={editShelfData.capacity}
              onChange={handleEditShelfChange}
              className="p-2 border rounded"
              min="1"
              required
            />
            <input
              type="number"
              name="shelfNumber"
              placeholder="Номер полки"
              value={editShelfData.shelfNumber}
              onChange={handleEditShelfChange}
              className="p-2 border rounded"
              min="1"
              required
            />
            <div className="flex space-x-2">
              <input
                type="number"
                name="posX"
                placeholder="Позиция X"
                value={editShelfData.posX}
                onChange={handleEditShelfChange}
                className="p-2 border rounded w-1/2"
                required
              />
              <input
                type="number"
                name="posY"
                placeholder="Позиция Y"
                value={editShelfData.posY}
                onChange={handleEditShelfChange}
                className="p-2 border rounded w-1/2"
                required
              />
            </div>
          </div>
          <div className="flex space-x-2 mt-3">
            <button 
              type="submit" 
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded"
              disabled={!!positionError}
            >
              Сохранить изменения
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingShelf(null);
                setPositionError(null);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Область редактора с обработкой перетаскивания */}
      <div 
        id="shelf-editor"
        className="relative border p-4 h-96 bg-gray-100 rounded shadow-inner mb-4"
        onMouseMove={draggedShelf ? handleDragMove : undefined}
        onMouseUp={draggedShelf ? handleDragEnd : undefined}
        onMouseLeave={draggedShelf ? handleDragEnd : undefined}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {shelves.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Нет полок для отображения. Добавьте первую полку.
              </div>
            ) : (
              shelves.map((shelf) => (
                <div
                  key={shelf.id}
                  className="absolute bg-white p-2 rounded shadow"
                  style={{ 
                    left: shelf.posX, 
                    top: shelf.posY,
                    transition: draggedShelf?.id === shelf.id ? 'none' : 'all 0.2s ease',
                    zIndex: draggedShelf?.id === shelf.id ? 100 : 10
                  }}
                  onMouseEnter={() => setHoveredShelf(shelf)}
                  onMouseLeave={() => {
                    setTimeout(() => {
                      if (hoveredBook) return;
                      setHoveredShelf(null);
                    }, 100);
                  }}
                >
                  {/* SVG визуализация полки в виде шкафчика */}
                  <ShelfSVG 
                    shelf={shelf} 
                    handleMouseDown={(e) => handleDragStart(e, shelf)} 
                  />
                  
                  {/* Кнопки управления */}
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => startEditShelf(shelf)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Вы уверены, что хотите удалить эту полку?')) {
                          deleteShelf(shelf.id);
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* При наведении на книгу - информация о книге */}
        {hoveredBook && (
          <div
            className="absolute bg-white border p-3 rounded shadow-lg z-30"
            style={{ 
              left: hoveredShelf ? hoveredShelf.posX + 0 : 0, 
              top: hoveredShelf ? hoveredShelf.posY -100 : 0,
              minWidth: '250px'
            }}
          >
            <h3 className="font-bold mb-1">{hoveredBook.title}</h3>
            <p className="text-gray-600 mb-2">Автор: {hoveredBook.authors || 'Не указан'}</p>
            <p className={`mb-2 ${hoveredBook.availableCopies === 0 ? 'text-red-600 font-bold' : 'text-green-600'}`}>
              Доступно: {hoveredBook.availableCopies !== undefined ? hoveredBook.availableCopies : 'Нет данных'}
            </p>
            <Link 
              href={`/admin/books/${hoveredBook.id}`}
              className="text-blue-500 hover:text-blue-700 underline block mt-2"
            >
              Перейти на страницу книги
            </Link>
          </div>
        )}
      </div>

      {/* Легенда цветов книг */}
      <div className="p-3 bg-white rounded shadow mb-4">
        <h3 className="font-semibold mb-2">Обозначения:</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 mr-2"></div>
            <span>Книга доступна</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 mr-2"></div>
            <span>Книга недоступна</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 mr-2"></div>
            <span>Нет книги</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;