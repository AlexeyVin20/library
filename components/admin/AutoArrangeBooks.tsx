"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Undo, Check, X, Loader, AlertCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import type { Book, Shelf } from "@/lib/types";

interface BookArrangement {
  bookId: string;
  shelfId: number;
  position: number;
  originalShelfId?: number;
  originalPosition?: number;
  selected?: boolean;
}

interface AutoArrangeBooksProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  books: Book[];
  shelves: Shelf[];
  onArrangement: (arrangements: BookArrangement[]) => void;
  onUndo: () => void;
}

const AutoArrangeBooks: React.FC<AutoArrangeBooksProps> = ({
  open,
  onOpenChange,
  books,
  shelves,
  onArrangement,
  onUndo
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [arrangements, setArrangements] = useState<BookArrangement[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArrangements, setSelectedArrangements] = useState<Set<string>>(new Set());

  const analyzeAndArrangeBooks = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("API ключ Gemini не настроен");
      }

      // Подготавливаем данные для ИИ
      const shelvesData = shelves.map(shelf => ({
        id: shelf.id,
        category: shelf.category,
        capacity: shelf.capacity,
        currentBooks: books.filter(book => book.shelfId === shelf.id).length,
        availableSlots: shelf.capacity - books.filter(book => book.shelfId === shelf.id).length
      }));

      const unplacedBooks = books.filter(book => !book.shelfId);
      
      const booksData = unplacedBooks.map(book => ({
        id: book.id,
        title: book.title,
        authors: book.authors,
        genre: book.genre,
        categorization: book.categorization,
        isbn: book.isbn
      }));

             const prompt = `
Ты - эксперт библиотекарь. Твоя задача - оптимально расставить книги по полкам библиотеки.

ПОЛКИ:
${JSON.stringify(shelvesData, null, 2)}

КНИГИ БЕЗ ПОЛКИ:
${JSON.stringify(booksData, null, 2)}

ПРАВИЛА РАССТАНОВКИ:
1. Размещай книги на полки согласно их тематике и рубрике полки
2. Учитывай категоризацию книг и ISBN для точного размещения
3. Группируй книги по жанрам и авторам
4. Не превышай вместимость полок
5. Приоритет: категоризация > жанр > автор > тематическое соответствие с полкой

ФОРМАТ ОТВЕТА (только JSON, без дополнительного текста):
{
  "arrangements": [
    {
      "bookId": "id_книги",
      "shelfId": номер_полки,
      "position": позиция_на_полке,
      "reason": "краткая причина размещения"
    }
  ],
  "summary": "краткое описание логики расстановки"
}

Важно: позиция должна быть от 1 до capacity полки, учитывай уже занятые места.
`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка API Gemini: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        throw new Error("Пустой ответ от ИИ");
      }

      // Парсим JSON ответ
      const parsedResponse = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, ''));
      
      if (!parsedResponse.arrangements || !Array.isArray(parsedResponse.arrangements)) {
        throw new Error("Некорректный формат ответа от ИИ");
      }

      // Валидируем предложения ИИ
      const validArrangements: BookArrangement[] = [];
      const occupiedPositions = new Map<number, Set<number>>();

      // Инициализируем занятые позиции
      shelves.forEach(shelf => {
        occupiedPositions.set(shelf.id, new Set());
        books.filter(book => book.shelfId === shelf.id).forEach(book => {
          if (book.position) {
            occupiedPositions.get(shelf.id)?.add(book.position);
          }
        });
      });

      for (const arrangement of parsedResponse.arrangements) {
        const book = unplacedBooks.find(b => b.id === arrangement.bookId);
        const shelf = shelves.find(s => s.id === arrangement.shelfId);
        
        if (!book || !shelf) continue;
        
        // Проверяем доступность позиции
        const shelfPositions = occupiedPositions.get(shelf.id);
        if (!shelfPositions) continue;
        
        let position = arrangement.position;
        // Если позиция занята, ищем ближайшую свободную
        while (position <= shelf.capacity && shelfPositions.has(position)) {
          position++;
        }
        
        if (position <= shelf.capacity) {
          shelfPositions.add(position);
          validArrangements.push({
            bookId: book.id,
            shelfId: shelf.id,
            position: position,
            originalShelfId: book.shelfId || undefined,
            originalPosition: book.position || undefined,
            selected: true
          });
        }
      }

      setArrangements(validArrangements);
      setSelectedArrangements(new Set(validArrangements.map(arr => `${arr.bookId}-${arr.shelfId}-${arr.position}`)));
      setShowPreview(true);

      toast({
        title: "Анализ завершен",
        description: `ИИ предлагает разместить ${validArrangements.length} книг из ${unplacedBooks.length}`
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ошибка при анализе книг";
      setError(errorMessage);
      toast({
        title: "Ошибка анализа",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyArrangements = () => {
    const selectedOnly = arrangements.filter(arr => 
      selectedArrangements.has(`${arr.bookId}-${arr.shelfId}-${arr.position}`)
    );
    
    if (selectedOnly.length === 0) {
      toast({
        title: "Нет выбранных предложений",
        description: "Выберите хотя бы одно предложение для применения",
        variant: "destructive"
      });
      return;
    }
    
    onArrangement(selectedOnly);
    setShowPreview(false);
    onOpenChange(false);
    toast({
      title: "Расстановка применена",
      description: `${selectedOnly.length} из ${arrangements.length} предложений применено`
    });
  };

  const cancelArrangements = () => {
    setArrangements([]);
    setSelectedArrangements(new Set());
    setShowPreview(false);
    setError(null);
  };

  const toggleArrangementSelection = (arrangementKey: string) => {
    setSelectedArrangements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(arrangementKey)) {
        newSet.delete(arrangementKey);
      } else {
        newSet.add(arrangementKey);
      }
      return newSet;
    });
  };

  const selectAllArrangements = () => {
    setSelectedArrangements(new Set(arrangements.map(arr => `${arr.bookId}-${arr.shelfId}-${arr.position}`)));
  };

  const deselectAllArrangements = () => {
    setSelectedArrangements(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            Автоматическая расстановка книг с помощью ИИ
          </DialogTitle>
        </DialogHeader>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}

        {!showPreview ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-4">
                <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Интеллектуальная расстановка книг
                </h3>
                <p className="text-gray-600 mt-2">
                  ИИ проанализирует все книги без полок и предложит оптимальное размещение 
                  на основе категоризации, жанров, авторов и тематики полок.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">Книги без полок</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {books.filter(book => !book.shelfId).length}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">Доступных полок</div>
                  <div className="text-2xl font-bold text-green-600">
                    {shelves.filter(shelf => 
                      books.filter(book => book.shelfId === shelf.id).length < shelf.capacity
                    ).length}
                  </div>
                </div>
              </div>

              <Button
                onClick={analyzeAndArrangeBooks}
                disabled={isAnalyzing || books.filter(book => !book.shelfId).length === 0}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Анализирую книги...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Запустить автоматическую расстановку
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                Предложения ИИ по расстановке
              </h3>
              <p className="text-blue-700">
                ИИ предлагает разместить {arrangements.length} книг. 
                Выберите предложения, которые хотите применить.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={selectAllArrangements}
                  variant="outline"
                  size="sm"
                  className="text-blue-600"
                >
                  Выбрать все
                </Button>
                <Button
                  onClick={deselectAllArrangements}
                  variant="outline"
                  size="sm"
                  className="text-blue-600"
                >
                  Снять выбор
                </Button>
                <span className="text-sm text-blue-600 self-center ml-2">
                  Выбрано: {selectedArrangements.size} из {arrangements.length}
                </span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {arrangements.map((arrangement, index) => {
                const book = books.find(b => b.id === arrangement.bookId);
                const shelf = shelves.find(s => s.id === arrangement.shelfId);
                const arrangementKey = `${arrangement.bookId}-${arrangement.shelfId}-${arrangement.position}`;
                const isSelected = selectedArrangements.has(arrangementKey);
                
                return (
                  <motion.div
                    key={arrangementKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? "bg-blue-50 border-blue-300 shadow-sm" 
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => toggleArrangementSelection(arrangementKey)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleArrangementSelection(arrangementKey)}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {book?.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {book?.authors} • Жанр: {book?.genre}
                      </div>
                      {(book?.categorization || book?.isbn) && (
                        <div className="text-xs text-gray-500">
                          {book.categorization && `Категоризация: ${book.categorization}`}
                          {book.categorization && book.isbn && " • "}
                          {book.isbn && `ISBN: ${book.isbn}`}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-medium text-blue-600">
                        {shelf?.category}
                      </div>
                      <div className="text-sm text-gray-600">
                        Полка #{shelf?.shelfNumber}, позиция {arrangement.position}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={applyArrangements}
                className="flex-1"
                size="lg"
                disabled={selectedArrangements.size === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Применить выбранные ({selectedArrangements.size})
              </Button>
              <Button
                onClick={cancelArrangements}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Отменить
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AutoArrangeBooks; 