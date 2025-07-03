'use client';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";

interface BookInstance {
  id: string;
  instanceCode: string;
  location?: string;
}

interface BookFormularData {
  id: string;
  title: string;
  authors: string;
  publicationYear?: number;
  pageCount?: number;
  categorization?: string;
  instances: BookInstance[];
}

function PrintFormularsContent() {
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<BookFormularData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooksData = async () => {
      try {
        const bookIds = searchParams.get('bookIds');
        if (!bookIds) {
          setError('Не указаны ID книг для печати');
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const bookIdsArray = bookIds.split(',');
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Токен авторизации не найден. Пожалуйста, войдите в систему заново.');
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        // Получаем данные всех выбранных книг
        const bookPromises = bookIdsArray.map(bookId => 
          fetch(`${baseUrl}/api/books/${bookId.trim()}`, { headers })
            .then(response => {
              if (!response.ok) {
                throw new Error(`Ошибка получения книги ${bookId}: ${response.statusText}`);
              }
              return response.json();
            })
        );

        // Получаем экземпляры для каждой книги
        const instancePromises = bookIdsArray.map(bookId => 
          fetch(`${baseUrl}/api/bookinstance/book/${bookId.trim()}`, { headers })
            .then(response => {
              if (!response.ok) {
                console.warn(`Не удалось получить экземпляры для книги ${bookId}`);
                return [];
              }
              return response.json();
            })
            .catch(() => [])
        );

        const [booksData, instancesData] = await Promise.all([
          Promise.all(bookPromises),
          Promise.all(instancePromises)
        ]);
        
        const formattedBooks: BookFormularData[] = booksData.map((book, index) => ({
          id: book.id,
          title: book.title || 'Без названия',
          authors: typeof book.authors === 'string' ? book.authors : (Array.isArray(book.authors) ? book.authors.join(', ') : 'Автор не указан'),
          publicationYear: book.publicationYear,
          pageCount: book.pageCount,
          categorization: book.categorization || book.genre,
          instances: instancesData[index] || []
        }));

        setBooks(formattedBooks);
      } catch (error) {
        console.error('Ошибка получения данных книг:', error);
        setError('Не удалось загрузить данные книг для печати');
      } finally {
        setLoading(false);
      }
    };

    fetchBooksData();
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных для печати...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  // Создаем формуляры для каждого экземпляра книги
  const allFormulars: Array<BookFormularData & { instance: BookInstance }> = [];
  books.forEach(book => {
    if (book.instances.length > 0) {
      book.instances.forEach(instance => {
        allFormulars.push({ ...book, instance });
      });
    } else {
      // Если нет экземпляров, создаем один формуляр без кода экземпляра
      allFormulars.push({ ...book, instance: { id: '', instanceCode: '', location: '' } });
    }
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Заголовок с кнопкой печати - скрывается при печати */}
      <div className="print:hidden p-6 bg-gray-50 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Формуляры для печати</h1>
            <p className="text-black">Количество формуляров: {allFormulars.length}</p>
            <p className="text-black text-sm">Книг: {books.length}, Экземпляров: {books.reduce((sum, book) => sum + book.instances.length, 0)}</p>
          </div>
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 font-medium"
          >
            <Printer className="w-5 h-5" />
            Печать
          </button>
        </div>
      </div>

      {/* Контейнер для формуляров внутри листа A4 */}
      <div className="flex flex-col items-center py-4 bg-white print:py-0">
        {(() => {
          const CARDS_PER_PAGE = 6; // 3×2 на страницу A4
          const pages: Array<Array<BookFormularData & { instance: BookInstance }>> = [];
          for (let i = 0; i < allFormulars.length; i += CARDS_PER_PAGE) {
            pages.push(allFormulars.slice(i, i + CARDS_PER_PAGE));
          }

          return pages.map((pageFormulars, pageIdx) => (
            <div
              key={pageIdx}
              className="a4-sheet border-2 border-gray-400 mb-4 print:mb-0 print:border-none relative print:w-full print:h-auto"
              style={{
                width: '21cm',
                height: '29.7cm',
                pageBreakAfter: pageIdx === pages.length - 1 ? 'auto' : 'always',
                boxSizing: 'border-box'
              }}
            >
              <div className="grid grid-cols-3 grid-rows-2 gap-1 p-[0.5cm] w-full h-full box-border print:p-2">
                {pageFormulars.map((formular, index) => {
                  const extraParts: string[] = [];
                  if (formular.publicationYear) extraParts.push(String(formular.publicationYear));
                  if (formular.pageCount) extraParts.push(`${formular.pageCount} стр.`);
                  if (formular.categorization) extraParts.push(formular.categorization);

                  // Формируем строку с кодом экземпляра и местоположением
                  const instanceInfo = formular.instance.instanceCode 
                    ? `${formular.instance.instanceCode}${formular.instance.location ? '-' + formular.instance.location : ''}`
                    : '';

                  return (
                    <div
                      key={`${formular.id}-${formular.instance.id}-${index}`}
                      className="formular-card border-2 border-gray-600 p-2 text-xs leading-tight bg-white flex flex-col text-black"
                      style={{
                        width: '7cm',
                        height: '14cm',
                        pageBreakInside: 'avoid',
                        boxSizing: 'border-box',
                        fontFamily: 'Arial, sans-serif'
                      }}
                    >
                      {/* Информация о книге */}
                      <div className="space-y-1 mb-2 flex-1">
                        {/* Код экземпляра и местоположение */}
                        {instanceInfo && (
                          <div className="text-xs break-words border-b border-gray-300 min-h-[1.5rem] pb-1 text-black font-medium">
                            {instanceInfo}
                          </div>
                        )}
                        {/* Авторы */}
                        <div className="text-xs break-words border-b border-gray-300 min-h-[1.5rem] pb-1 text-black">
                          {formular.authors}
                        </div>

                        {/* Название */}
                        <div className="text-xs break-words border-b border-gray-300 min-h-[2rem] pb-1 text-black">
                          {formular.title}
                        </div>

                        {/* Дополнительная строка */}
                        {extraParts.length > 0 && (
                          <div className="text-xs break-words border-b border-gray-300 min-h-[1.5rem] pb-1 text-black">
                            {extraParts.join(', ')}
                          </div>
                        )}
                      </div>

                      {/* Пустые строки для записей */}
                      <div className="border-t-2 border-gray-600 pt-1 flex flex-col flex-grow justify-between">
                        {[...Array(instanceInfo ? 11 : 12)].map((_, lineIndex) => (
                          <div key={lineIndex} className="border-b border-gray-400 h-[0.9rem]" />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Стили для печати */}
      <style jsx>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.5cm;
          }
          
          body {
            font-size: 9px;
            line-height: 1.1;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            background: white !important;
          }
          
          .formular-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 2px solid #000 !important;
          }
          
          .grid {
            page-break-after: auto;
          }
          
          .a4-sheet {
            border: none !important;
            background: white !important;
            box-shadow: none !important;
          }
          
          header,
          .fixed,
          nav {
            display: none !important;
          }
          
          .min-h-screen {
            background: white !important;
            min-height: auto !important;
          }
          
          .flex.flex-col.items-center {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
        
        .formular-card {
          font-family: 'Arial', sans-serif;
        }
        
        @media screen {
          .formular-card {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintFormularsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <PrintFormularsContent />
    </Suspense>
  );
} 