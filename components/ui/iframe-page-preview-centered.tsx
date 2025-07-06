import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Loader2, AlertCircle, Mouse, Users, Tag, BookText, Calendar, Building, Info, GripVertical, Package, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookInstance } from '@/lib/types';

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "обрабатывается":
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    case "одобрена":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "отменена":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "истекла":
      return <XCircle className="w-4 h-4 text-gray-500" />;
    case "выдана":
      return <Package className="w-4 h-4 text-blue-500" />;
    case "возвращена":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "просрочена":
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case "отменена_пользователем":
      return <XCircle className="w-4 h-4 text-orange-500" />;
    default:
      return <Package className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "доступна":
        return "bg-green-100 text-green-800";
    case "выдана":
        return "bg-red-100 text-red-800";
    case "обрабатывается":
      return "bg-yellow-100 text-yellow-800";
    case "одобрена":
      return "bg-green-100 text-green-800";
    case "отменена":
      return "bg-red-100 text-red-800";
    case "истекла":
      return "bg-gray-100 text-gray-800";
    case "возвращена":
      return "bg-green-100 text-green-600";
    case "просрочена":
      return "bg-red-100 text-red-600";
    case "отменена_пользователем":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const translateStatus = (status: string) => {
    if (!status) return "Неизвестно";
    switch (status.toLowerCase()) {
      case "обрабатывается":
        return "Обрабатывается";
      case "одобрена":
        return "Одобрена";
      case "отменена":
        return "Отменена";
      case "истекла":
        return "Истекла";
      case "выдана":
        return "Выдана";
      case "возвращена":
        return "Возвращена";
      case "просрочена":
        return "Просрочена";
      case "отменена_пользователем":
        return "Отменена пользователем";
      default:
        return status;
    }
  };

interface Book {
  id: string;
  title: string;
  authors: string | string[];
  genre?: string;
  isbn?: string;
  publicationYear?: number;
  publisher?: string;
  availableCopies?: number;
  categorization?: string;
  instances?: BookInstance[];
}

export interface IframePagePreviewCenteredProps {
  route: string;
  isVisible: boolean;
  className?: string;
  delay?: number;
  enableScrollControl?: boolean;
  displayMode?: 'iframe' | 'api';
  coords: { top: number; left: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const IframePagePreviewCentered: React.FC<IframePagePreviewCenteredProps> = ({
  route,
  isVisible,
  className,
  delay = 800,
  enableScrollControl = true,
  displayMode = 'iframe',
  coords,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [bookData, setBookData] = useState<Book | null>(null);
  const [isFetchingBook, setIsFetchingBook] = useState(true);
  const dragControls = useDragControls();

  const bookId = route.split('/').pop();

  useEffect(() => {
    const disableBodyScroll = () => {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px';
    };
    const enableBodyScroll = () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
    if (isVisible && enableScrollControl) {
      disableBodyScroll();
    } else {
      enableBodyScroll();
    }
    return () => enableBodyScroll();
  }, [isVisible, enableScrollControl]);

  useEffect(() => {
    if (displayMode !== 'iframe' || !isVisible) {
      setShouldLoad(false);
      setIsLoading(true);
      setHasError(false);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    if (isVisible) {
      timeoutId = setTimeout(() => {
        setShouldLoad(true);
      }, delay);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, delay, displayMode]);

  useEffect(() => {
    if (displayMode === 'api' && isVisible && bookId) {
      setIsFetchingBook(true);
      const fetchBookWithInstances = async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
          
          const token = localStorage.getItem('token');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const [bookResponse, instancesResponse] = await Promise.all([
            fetch(`${baseUrl}/api/books/${bookId}`, { headers }),
            fetch(`${baseUrl}/api/BookInstance?bookId=${bookId}`, { headers })
          ]);

          if (bookResponse.ok) {
            const bookData = await bookResponse.json();
            let bookInstances = [];
            if (instancesResponse.ok) {
                bookInstances = await instancesResponse.json();
            }
            setBookData({ ...bookData, instances: bookInstances });
          } else {
            setBookData(null);
          }
        } catch (error) {
          console.error("Failed to fetch book data for preview:", error);
          setBookData(null);
        } finally {
          setIsFetchingBook(false);
        }
      };
      fetchBookWithInstances();
    }
  }, [displayMode, isVisible, bookId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };
  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          drag
          dragListener={false}
          dragControls={dragControls}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, zIndex: 9999 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={cn(
            'z-[9999] w-[800px] h-[750px] transform-gpu',
            className
          )}
        >
          <Card className="backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-600 shadow-xl overflow-hidden transition-all duration-300 h-full flex flex-col border-blue-500 shadow-2xl">
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="drag-handle p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 cursor-move flex items-center justify-between text-xs select-none"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex gap-1.5 items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 font-mono truncate ml-2" title={route}>{route}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <a href={route} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500" title="Открыть в новой вкладке">
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>
            </div>
            <CardContent className="p-0 h-full flex flex-col">
              {displayMode === 'api' && (
                <div className="p-6 h-full overflow-y-auto bg-white">
                  {isFetchingBook ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : bookData ? (
                    <div className="space-y-4 text-gray-800">
                      <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">{bookData.title}</h3>
                      
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-600">Авторы:</span>
                          <p className="text-gray-800">{Array.isArray(bookData.authors) ? bookData.authors.join(', ') : bookData.authors}</p>
                        </div>
                      </div>
                      
                      {bookData.genre && (<div className="flex items-start gap-3">
                        <Tag className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-600">Жанр:</span>
                          <p className="text-gray-800">{bookData.genre}</p>
                        </div>
                      </div>)}
                      
                      {bookData.isbn && (<div className="flex items-start gap-3">
                        <BookText className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-600">ISBN:</span>
                          <p className="text-gray-800">{bookData.isbn}</p>
                        </div>
                      </div>)}

                      {bookData.publisher && (<div className="flex items-start gap-3">
                        <Building className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-600">Издательство:</span>
                          <p className="text-gray-800">{bookData.publisher}</p>
                        </div>
                      </div>)}
                      
                      {bookData.publicationYear && (<div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-600">Год издания:</span>
                          <p className="text-gray-800">{bookData.publicationYear}</p>
                        </div>
                      </div>)}
                      
                      {bookData.categorization && (<div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-600">Категоризация:</span>
                          <p className="text-gray-800">{bookData.categorization}</p>
                        </div>
                      </div>)}

                      {bookData.instances && bookData.instances.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-600 mt-4 border-t pt-3">Экземпляры ({bookData.instances.length}):</h4>
                          <div className="max-h-64 overflow-y-auto mt-2 space-y-2 pr-2">
                            {bookData.instances.map(inst => (
                              <div key={inst.id} className="text-sm p-2 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between font-mono text-base mb-2">
                                    <span className="font-bold text-gray-800">{inst.instanceCode}</span>
                                    <div className="flex items-center gap-1.5">
                                        {getStatusIcon(inst.status)}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inst.status)}`}>
                                            {translateStatus(inst.status)}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                        <Info className="w-3 h-3 text-gray-400" />
                                        <span>Состояние: <strong>{inst.condition}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span>Получена: <strong>{new Date(inst.dateAcquired).toLocaleDateString()}</strong></span>
                                    </div>
                                    {inst.location && (
                                        <div className="flex items-center gap-1.5 col-span-2">
                                            <Tag className="w-3 h-3 text-gray-400" />
                                            <span>Расположение: <strong>{inst.location}</strong></span>
                                        </div>
                                    )}
                                </div>
                                {inst.notes && (
                                    <div className="mt-1.5 pt-1.5 border-t border-gray-200 text-xs text-gray-500 italic">
                                        "{inst.notes}"
                                    </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!bookData.instances || bookData.instances.length === 0 && (
                        <div className="mt-4 border-t pt-3">
                            <p className="text-sm text-gray-500">Нет доступных экземпляров для этой книги.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-red-500">
                      <AlertCircle className="w-6 h-6 mr-2" />
                      <span>Не удалось загрузить информацию о книге.</span>
                    </div>
                  )}
                </div>
              )}

              {displayMode === 'iframe' && (
                <div className="relative bg-gray-100 dark:bg-gray-800 flex-1">
                  {!shouldLoad ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Подготовка предварительного просмотра...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                          <div className="text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Загрузка страницы...
                            </p>
                          </div>
                        </div>
                      )}
                      {hasError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                          <div className="text-center">
                            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Не удалось загрузить предварительный просмотр
                            </p>
                          </div>
                        </div>
                      )}
                      <iframe
                        ref={iframeRef}
                        src={`${route}?preview=true`}
                        className="w-full h-full border-none"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        style={{
                          transform: 'scale(0.5)',
                          transformOrigin: 'top left',
                          width: '200%',
                          height: '200%',
                          pointerEvents: 'auto',
                          transition: 'transform 0.3s ease-out'
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IframePagePreviewCentered; 