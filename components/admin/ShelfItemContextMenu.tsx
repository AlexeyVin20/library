// Определяем типы локально, так как есть проблемы с импортом
interface Book {
  id: string;
  title: string;
  authors?: string;
  isbn?: string;
  cover?: string;
  availableCopies?: number;
  shelfId?: number;
  position?: number;
}

interface Journal {
  id: string;
  title: string;
  publisher?: string;
  issn?: string;
  coverImageUrl?: string;
  shelfId?: number;
  position?: number;
}

import Link from 'next/link';
import { X, Trash, ExternalLink, BookOpen, BookCopy } from 'lucide-react';

interface ShelfItemContextMenuProps {
  item: Book | Journal | null;
  isJournal: boolean;
  position: { x: number, y: number };
  onClose: () => void;
  onRemove: () => void;
}

const ShelfItemContextMenu = ({ 
  item, 
  isJournal, 
  position, 
  onClose, 
  onRemove 
}: ShelfItemContextMenuProps) => {
  // Проверяем, что item не null
  if (!item) {
    return null;
  }
  
  // Определяем тип элемента для корректного отображения
  const itemType = isJournal ? 'журнала' : 'книги';
  const detailsPath = isJournal 
    ? `/admin/journals/${item.id}`
    : `/admin/books/${item.id}`;

  return (
    <div 
      className="fixed z-50 w-64 rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      style={{ 
        left: position.x, 
        top: position.y,
        maxWidth: '300px'
      }}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">
          {isJournal ? 'Журнал' : 'Книга'}
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="p-3 space-y-2">
        <div className="mb-2">
          <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{item.title}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {isJournal 
              ? `Издатель: ${(item as Journal).publisher || 'Не указан'}` 
              : `Автор: ${(item as Book).authors || 'Не указан'}`
            }
          </p>
          {!isJournal && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              ISBN: {(item as Book).isbn || 'Не указан'}
            </p>
          )}
          {isJournal && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              ISSN: {(item as Journal).issn || 'Не указан'}
            </p>
          )}
          
          {!isJournal && (
            <p className={`text-xs mt-1 font-medium ${
              typeof (item as Book).availableCopies === 'number' && (item as Book).availableCopies > 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {typeof (item as Book).availableCopies === 'number' && (item as Book).availableCopies > 0 
                ? `Доступно: ${(item as Book).availableCopies}` 
                : 'Нет в наличии'
              }
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Link 
            href={detailsPath}
            className="flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-800/50"
          >
            <ExternalLink size={14} className="mr-1" />
            Подробнее
          </Link>
          
          <button 
            onClick={onRemove}
            className="flex items-center justify-center px-3 py-2 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-800/50"
          >
            <Trash size={14} className="mr-1" />
            Убрать
          </button>
        </div>
        
        {!isJournal && (
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Link 
              href={`/books/${item.id}`}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 dark:text-green-300 dark:bg-green-900/30 dark:hover:bg-green-800/50"
            >
              <BookOpen size={14} className="mr-1" />
              Открыть в каталоге
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShelfItemContextMenu; 