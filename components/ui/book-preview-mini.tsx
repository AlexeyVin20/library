import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Loader2, AlertCircle, Users, Tag, BookText, Calendar, Building, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export interface BookPreviewMiniProps {
  bookId: string;
  isVisible: boolean;
  className?: string;
  coords: { top: number; left: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const BookPreviewMini: React.FC<BookPreviewMiniProps> = ({
  bookId,
  isVisible,
  className,
  coords,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [bookData, setBookData] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isVisible || !bookId) {
      setBookData(null);
      setIsLoading(true);
      return;
    }

    const fetchBookData = async () => {
      setIsLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${baseUrl}/api/books/${bookId}`, { headers });
        
        if (response.ok) {
          const data = await response.json();
          setBookData(data);
        } else {
          setBookData(null);
        }
      } catch (error) {
        console.error("Failed to fetch book data for mini preview:", error);
        setBookData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookData();
  }, [isVisible, bookId]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: coords?.top || 0,
            left: coords?.left || 0,
            zIndex: 9999,
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={cn('w-[350px] max-h-[400px]', className)}
        >
          <Card className="overflow-hidden backdrop-blur-xl bg-white/98 dark:bg-gray-900/98 border border-blue-200 dark:border-blue-700 shadow-xl shadow-blue-500/20 rounded-xl">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Информация о книге
                </h3>
                <a
                  href={`/readers/books/${bookId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                  title="Открыть страницу книги"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="max-h-[350px] overflow-y-auto bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : bookData ? (
                  <div className="p-4 space-y-3">
                    {/* Заголовок книги */}
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-700/50">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                        {bookData.title}
                      </h3>
                      
                      {/* Авторы */}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-gray-800 dark:text-gray-200">
                          {Array.isArray(bookData.authors) ? bookData.authors.join(', ') : bookData.authors}
                        </span>
                      </div>
                    </div>

                    {/* Основная информация */}
                    <div className="space-y-2 text-sm">
                      {bookData.genre && (
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">Жанр:</span>
                          <span className="text-gray-800 dark:text-gray-200 font-medium">{bookData.genre}</span>
                        </div>
                      )}

                      {bookData.publicationYear && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">Год:</span>
                          <span className="text-gray-800 dark:text-gray-200 font-medium">{bookData.publicationYear}</span>
                        </div>
                      )}

                      {bookData.publisher && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-orange-600 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">Издательство:</span>
                          <span className="text-gray-800 dark:text-gray-200 font-medium">{bookData.publisher}</span>
                        </div>
                      )}

                      {bookData.isbn && (
                        <div className="flex items-center gap-2">
                          <BookText className="w-4 h-4 text-teal-600 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">ISBN:</span>
                          <span className="text-gray-800 dark:text-gray-200 font-medium font-mono text-xs">{bookData.isbn}</span>
                        </div>
                      )}

                      {bookData.categorization && (
                        <div className="flex items-start gap-2">
                          <Tag className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-gray-600 dark:text-gray-400">Категория:</span>
                            <div className="text-gray-800 dark:text-gray-200 font-medium">{bookData.categorization}</div>
                          </div>
                        </div>
                      )}

                      {typeof bookData.availableCopies === 'number' && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-2 mt-3">
                          <div className="flex items-center justify-center gap-2">
                            <BookOpen className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Доступно экземпляров:</span>
                            <span className="text-lg font-bold text-green-600">{bookData.availableCopies}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-red-500">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm">Не удалось загрузить информацию</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookPreviewMini; 