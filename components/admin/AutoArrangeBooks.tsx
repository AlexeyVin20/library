"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Undo, Check, X, Loader, AlertCircle, BookOpen, Shuffle, PlusCircle, Layers, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import type { Book, Shelf } from "@/lib/types";

interface BookArrangement {
  bookId: string;
  shelfId: number;
  position: number;
  originalShelfId?: number;
  originalPosition?: number;
  selected?: boolean;
  reason?: string;
}

interface ShelfSuggestion {
  category: string;
  shelfNumber: number;
  capacity?: number;
  posX?: number;
  posY?: number;
  reason: string;
  action: 'create' | 'delete';
  selected?: boolean;
}

type ArrangementMode = 'unplaced' | 'placed' | 'all';
type PriorityParameter = 'categorization' | 'genre' | 'author' | 'isbn' | 'mixed';
type OperationMode = 'arrange' | 'suggest-shelves';

interface AutoArrangeBooksProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  books: Book[];
  shelves: Shelf[];
  onArrangement: (arrangements: BookArrangement[]) => void;
  onShelfSuggestion?: (suggestions: ShelfSuggestion[]) => void;
  onUndo: () => void;
}

const AutoArrangeBooks: React.FC<AutoArrangeBooksProps> = ({
  open,
  onOpenChange,
  books,
  shelves,
  onArrangement,
  onShelfSuggestion,
  onUndo
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [arrangements, setArrangements] = useState<BookArrangement[]>([]);
  const [shelfSuggestions, setShelfSuggestions] = useState<ShelfSuggestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [arrangementSummary, setArrangementSummary] = useState<string>("");
  const [shelfSuggestionSummary, setShelfSuggestionSummary] = useState<string>("");
  const [selectedArrangements, setSelectedArrangements] = useState<Set<string>>(new Set());
  const [selectedShelfSuggestions, setSelectedShelfSuggestions] = useState<Set<string>>(new Set());
  const [arrangementMode, setArrangementMode] = useState<ArrangementMode>('unplaced');
  const [priorityParameter, setPriorityParameter] = useState<PriorityParameter>('mixed');
  const [operationMode, setOperationMode] = useState<OperationMode>('arrange');
  const [newShelvesCount, setNewShelvesCount] = useState(3);

  const analyzeAndSuggestShelves = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("API ключ Gemini не настроен");
      }

      // Подготавливаем данные о существующих полках
      const existingShelvesData = shelves.map(shelf => ({
        id: shelf.id,
        category: shelf.category,
        shelfNumber: shelf.shelfNumber,
        capacity: shelf.capacity,
        posX: shelf.posX,
        posY: shelf.posY,
        currentBooks: books.filter(book => book.shelfId === shelf.id).length,
        availableSlots: shelf.capacity - books.filter(book => book.shelfId === shelf.id).length
      }));

      // Анализируем книги без полок и их характеристики
      const booksWithInstances = books.filter(book => 
        book.instances && book.instances.length > 0
      );

      const unplacedBooksData = booksWithInstances.filter(book => !book.shelfId).map(book => ({
        id: book.id,
        title: book.title,
        authors: book.authors,
        genre: book.genre,
        categorization: book.categorization,
        isbn: book.isbn,
        instancesCount: book.instances ? book.instances.length : 0
      }));

      // Группируем книги по категориям
      const genreStats: Record<string, number> = {};
      const categorizationStats: Record<string, number> = {};
      
      unplacedBooksData.forEach(book => {
        if (book.genre) {
          genreStats[book.genre] = (genreStats[book.genre] || 0) + book.instancesCount;
        }
        if (book.categorization) {
          categorizationStats[book.categorization] = (categorizationStats[book.categorization] || 0) + book.instancesCount;
        }
      });

      const prompt = `
Ты - эксперт библиотекарь и дизайнер библиотечного пространства. Твоя задача - предложить оптимальную организацию новых полок для библиотеки.

СУЩЕСТВУЮЩИЕ ПОЛКИ:
${JSON.stringify(existingShelvesData, null, 2)}

КНИГИ БЕЗ ПОЛОК (требующие размещения):
${JSON.stringify(unplacedBooksData, null, 2)}

СТАТИСТИКА ПО ЖАНРАМ:
${JSON.stringify(genreStats, null, 2)}

СТАТИСТИКА ПО КАТЕГОРИЗАЦИИ:
${JSON.stringify(categorizationStats, null, 2)}

ТРЕБОВАНИЯ:
1. Предложи ${newShelvesCount} новых полок для оптимальной организации библиотеки
2. Учитывай количество книг по жанрам и категориям
3. Полки должны быть тематически связанными
4. Номера полок должны быть уникальными (не пересекаться с существующими) shelfNumber должен быть уникальным
5. Вместимость полки должна соответствовать количеству книг данной категории, но не менее 5 книг
6. Координаты posX, posY должны быть логично расположены (от 0 до 800 для каждой оси)
7. Размещай новые полки так, чтобы не пересекаться с существующими

ФОРМАТ ОТВЕТА (только JSON, без дополнительного текста):
{
  "suggestions": [
    {
      "category": "название_категории_полки",
      "shelfNumber": уникальный_номер_полки,
      "capacity": вместимость_полки,
      "posX": координата_X,
      "posY": координата_Y,
      "reason": "краткое обоснование создания этой полки"
    }
  ],
  "summary": "краткое описание логики организации полок"
}

Важно: учитывай существующие полки и их расположение, не размещай новые полки слишком близко к существующим.
`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
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
      
      if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
        throw new Error("Некорректный формат ответа от ИИ");
      }

      // Валидируем предложения ИИ
      const validSuggestions: ShelfSuggestion[] = [];
      const usedShelfNumbers = new Set(shelves.map(shelf => shelf.shelfNumber));

      for (const rawSuggestion of parsedResponse.suggestions) {
        const action: 'create' | 'delete' = rawSuggestion.action === 'delete' ? 'delete' : 'create';

        if (action === 'create') {
          // Проверяем уникальность номера полки
          if (usedShelfNumbers.has(rawSuggestion.shelfNumber)) {
            continue;
          }

          // Проверяем разумность параметров
          if (rawSuggestion.capacity < 1 || rawSuggestion.capacity > 200) {
            continue;
          }

          if (rawSuggestion.posX < 0 || rawSuggestion.posX > 800 || rawSuggestion.posY < 0 || rawSuggestion.posY > 800) {
            continue;
          }

          validSuggestions.push({
            category: rawSuggestion.category,
            shelfNumber: rawSuggestion.shelfNumber,
            capacity: rawSuggestion.capacity,
            posX: rawSuggestion.posX,
            posY: rawSuggestion.posY,
            reason: rawSuggestion.reason,
            action,
            selected: true
          });

          usedShelfNumbers.add(rawSuggestion.shelfNumber);
        } else {
          // action delete
          // ensure shelf exists
          const shelfToDelete = shelves.find(s => s.shelfNumber === rawSuggestion.shelfNumber);
          if (!shelfToDelete) continue;

          validSuggestions.push({
            category: shelfToDelete.category,
            shelfNumber: shelfToDelete.shelfNumber,
            capacity: shelfToDelete.capacity,
            reason: rawSuggestion.reason || 'Удалить пустую/неэффективную полку',
            action,
            selected: true
          });
        }
      }

      setShelfSuggestions(validSuggestions);
      setSelectedShelfSuggestions(new Set(validSuggestions.map((sug, index) => `shelf-${index}`)));
      setShelfSuggestionSummary(parsedResponse.summary || "");
      setShowPreview(true);

      toast({
        title: "Анализ завершен",
        description: `ИИ предлагает создать ${validSuggestions.length} новых полок`
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ошибка при анализе";
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

      // Сначала фильтруем книги, у которых есть экземпляры
      const booksWithInstances = books.filter(book => 
        book.instances && book.instances.length > 0
      );

      if (booksWithInstances.length === 0) {
        throw new Error("Нет книг с экземплярами для расстановки");
      }

      // Выбираем книги в зависимости от режима
      let targetBooks: Book[];
      switch (arrangementMode) {
        case 'unplaced':
          targetBooks = booksWithInstances.filter(book => !book.shelfId);
          break;
        case 'placed':
          targetBooks = booksWithInstances.filter(book => book.shelfId);
          break;
        case 'all':
          targetBooks = booksWithInstances;
          break;
        default:
          targetBooks = booksWithInstances.filter(book => !book.shelfId);
      }

      if (targetBooks.length === 0) {
        const modeText = arrangementMode === 'unplaced' ? 'без полок' : 
                        arrangementMode === 'placed' ? 'размещенных на полках' : 
                        'доступных для расстановки';
        throw new Error(`Нет книг с экземплярами ${modeText}`);
      }
      
      const booksData = targetBooks.map(book => ({
        id: book.id,
        title: book.title,
        authors: book.authors,
        genre: book.genre,
        categorization: book.categorization,
        isbn: book.isbn,
        currentShelfId: book.shelfId,
        currentPosition: book.position,
        instancesCount: book.instances ? book.instances.length : 0,
        activeInstancesCount: book.instances ? book.instances.filter(inst => inst.isActive).length : 0
      }));

      // Формируем приоритеты для ИИ на основе выбранного параметра
      let priorityRules = "";
      switch (priorityParameter) {
        case 'categorization':
          priorityRules = "1. ГЛАВНЫЙ ПРИОРИТЕТ: категоризация книг (если указана)\n2. Жанр книги\n3. Автор\n4. ISBN\n5. Тематическое соответствие с полкой";
          break;
        case 'genre':
          priorityRules = "1. ГЛАВНЫЙ ПРИОРИТЕТ: жанр книги\n2. Категоризация (если указана)\n3. Автор\n4. ISBN\n5. Тематическое соответствие с полкой";
          break;
        case 'author':
          priorityRules = "1. ГЛАВНЫЙ ПРИОРИТЕТ: группировка по авторам\n2. Жанр книги\n3. Категоризация (если указана)\n4. ISBN\n5. Тематическое соответствие с полкой";
          break;
        case 'isbn':
          priorityRules = "1. ГЛАВНЫЙ ПРИОРИТЕТ: ISBN классификация\n2. Категоризация (если указана)\n3. Жанр книги\n4. Автор\n5. Тематическое соответствие с полкой";
          break;
        case 'mixed':
        default:
          priorityRules = "1. Категоризация книг (если указана)\n2. Жанр книги\n3. Автор\n4. ISBN\n5. Тематическое соответствие с полкой";
      }

      const modeDescription = arrangementMode === 'unplaced' ? 'БЕЗ ПОЛКИ' : 
                            arrangementMode === 'placed' ? 'УЖЕ РАЗМЕЩЕННЫЕ НА ПОЛКАХ' : 
                            'ВСЕ';

      const prompt = `
Ты - эксперт библиотекарь. Твоя задача - оптимально расставить книги по полкам библиотеки.

ПОЛКИ:
${JSON.stringify(shelvesData, null, 2)}

КНИГИ ${modeDescription}:
${JSON.stringify(booksData, null, 2)}

РЕЖИМ РАБОТЫ: ${arrangementMode === 'unplaced' ? 'Размещение книг без полок' : 
                arrangementMode === 'placed' ? 'Перестановка уже размещенных книг для оптимизации' : 
                'Полная оптимизация всех книг'}

ПРАВИЛА РАССТАНОВКИ (по приоритету):
${priorityRules}
6. Не превышай вместимость полок
7. ${arrangementMode === 'placed' || arrangementMode === 'all' ? 'При перестановке учитывай текущее размещение и предлагай изменения только при значительном улучшении' : 'Размещай книги эффективно'}
8. ВАЖНО: Перемещать можно ТОЛЬКО книги, у которых есть экземпляры (instancesCount > 0 и activeInstancesCount > 0). Книги без экземпляров физически не существуют в библиотеке.

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

Важно: позиция должна быть от 0 до capacity полки, учитывай уже занятые места.
`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
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
        const book = targetBooks.find((b: Book) => b.id === arrangement.bookId);
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
            selected: true,
            reason: arrangement.reason || "Автоматическое размещение"
          });
        }
      }

      setArrangements(validArrangements);
      setSelectedArrangements(new Set(validArrangements.map(arr => `${arr.bookId}-${arr.shelfId}-${arr.position}`)));
      setArrangementSummary(parsedResponse.summary || "");
      setShowPreview(true);

      toast({
        title: "Анализ завершен",
        description: `ИИ предлагает разместить ${validArrangements.length} книг из ${targetBooks.length}`
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

  const applyShelfSuggestions = () => {
    const selectedOnly = shelfSuggestions.filter((sug, index) => 
      selectedShelfSuggestions.has(`shelf-${index}`)
    );
    
    if (selectedOnly.length === 0) {
      toast({
        title: "Нет выбранных предложений",
        description: "Выберите хотя бы одно предложение для применения",
        variant: "destructive"
      });
      return;
    }
    
    if (onShelfSuggestion) {
      onShelfSuggestion(selectedOnly);
    }
    setShowPreview(false);
    onOpenChange(false);
    toast({
      title: "Полки созданы",
      description: `${selectedOnly.length} из ${shelfSuggestions.length} предложенных полок создано`
    });
  };

  const cancelArrangements = () => {
    setArrangements([]);
    setShelfSuggestions([]);
    setSelectedArrangements(new Set());
    setSelectedShelfSuggestions(new Set());
    setArrangementSummary("");
    setShelfSuggestionSummary("");
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
    if (operationMode === 'arrange') {
      setSelectedArrangements(new Set(arrangements.map(arr => `${arr.bookId}-${arr.shelfId}-${arr.position}`)));
    } else {
      setSelectedShelfSuggestions(new Set(shelfSuggestions.map((sug, index) => `shelf-${index}`)));
    }
  };

  const deselectAllArrangements = () => {
    if (operationMode === 'arrange') {
      setSelectedArrangements(new Set());
    } else {
      setSelectedShelfSuggestions(new Set());
    }
  };

  const toggleShelfSuggestionSelection = (suggestionKey: string) => {
    setSelectedShelfSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionKey)) {
        newSet.delete(suggestionKey);
      } else {
        newSet.add(suggestionKey);
      }
      return newSet;
    });
  };

  const getTargetBooksCount = () => {
    if (operationMode === 'suggest-shelves') {
      // Для предложения полок считаем книги без полок с экземплярами
      return books.filter(book => 
        !book.shelfId && book.instances && book.instances.length > 0
      ).length;
    }
    
    // Фильтруем книги, у которых есть экземпляры
    const booksWithInstances = books.filter(book => 
      book.instances && book.instances.length > 0
    );
    
    switch (arrangementMode) {
      case 'unplaced':
        return booksWithInstances.filter(book => !book.shelfId).length;
      case 'placed':
        return booksWithInstances.filter(book => book.shelfId).length;
      case 'all':
        return booksWithInstances.length;
      default:
        return 0;
    }
  };

  const getModeIcon = () => {
    if (operationMode === 'suggest-shelves') {
      return <PlusCircle className="h-4 w-4 mr-2" />;
    }
    
    switch (arrangementMode) {
      case 'unplaced':
        return <BookOpen className="h-4 w-4 mr-2" />;
      case 'placed':
        return <Shuffle className="h-4 w-4 mr-2" />;
      case 'all':
        return <Bot className="h-4 w-4 mr-2" />;
      default:
        return <Bot className="h-4 w-4 mr-2" />;
    }
  };

  const getModeText = () => {
    if (operationMode === 'suggest-shelves') {
      return "Предложить новые полки";
    }
    
    switch (arrangementMode) {
      case 'unplaced':
        return "Разместить книги без полок";
      case 'placed':
        return "Оптимизировать размещенные книги";
      case 'all':
        return "Полная оптимизация всех книг";
      default:
        return "Запустить автоматическую расстановку";
    }
  };

  return (
    <TooltipProvider>
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
                  ИИ проанализирует книги и предложит оптимальное размещение 
                  на основе выбранных параметров и приоритетов.
                </p>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <strong>Важно:</strong> Перемещать можно только книги, у которых есть экземпляры. Книги без экземпляров физически не существуют в библиотеке.
                  </div>
                </div>
              </div>

              {/* Выбор типа операции */}
              <div className="mb-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="arrange-mode"
                      name="operation-mode"
                      checked={operationMode === 'arrange'}
                      onChange={() => setOperationMode('arrange')}
                      className="text-blue-600"
                    />
                    <label htmlFor="arrange-mode" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Расстановка книг
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="suggest-shelves-mode"
                      name="operation-mode"
                      checked={operationMode === 'suggest-shelves'}
                      onChange={() => setOperationMode('suggest-shelves')}
                      className="text-blue-600"
                    />
                    <label htmlFor="suggest-shelves-mode" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Предложение новых полок
                    </label>
                  </div>
                </div>
              </div>

              {/* Настройки в зависимости от режима */}
              {operationMode === 'arrange' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Режим работы
                    </label>
                    <Select value={arrangementMode} onValueChange={(value: ArrangementMode) => setArrangementMode(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите режим" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unplaced">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Только книги без полок
                          </div>
                        </SelectItem>
                        <SelectItem value="placed">
                          <div className="flex items-center gap-2">
                            <Shuffle className="h-4 w-4" />
                            Перестановка размещенных книг
                          </div>
                        </SelectItem>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            Полная оптимизация всех книг
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Приоритетный параметр
                    </label>
                    <Select value={priorityParameter} onValueChange={(value: PriorityParameter) => setPriorityParameter(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите приоритет" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mixed">Смешанный (универсальный)</SelectItem>
                        <SelectItem value="categorization">Категоризация</SelectItem>
                        <SelectItem value="genre">Жанр</SelectItem>
                        <SelectItem value="author">Автор</SelectItem>
                        <SelectItem value="isbn">ISBN классификация</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Количество новых полок
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newShelvesCount}
                      onChange={(e) => setNewShelvesCount(parseInt(e.target.value) || 3)}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">От 1 до 10 полок</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Базовые критерии
                    </label>
                    <Select value={priorityParameter} onValueChange={(value: PriorityParameter) => setPriorityParameter(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите критерий" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mixed">Смешанный анализ</SelectItem>
                        <SelectItem value="categorization">По категоризации</SelectItem>
                        <SelectItem value="genre">По жанрам</SelectItem>
                        <SelectItem value="author">По авторам</SelectItem>
                        <SelectItem value="isbn">По ISBN классификации</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">Книги без полок</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {books.filter(book => !book.shelfId && book.instances && book.instances.length > 0).length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">с экземплярами</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">Размещенные книги</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {books.filter(book => book.shelfId && book.instances && book.instances.length > 0).length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">с экземплярами</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">Книги без экземпляров</div>
                  <div className="text-2xl font-bold text-red-600">
                    {books.filter(book => !book.instances || book.instances.length === 0).length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">нельзя перемещать</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">Доступных полок</div>
                  <div className="text-2xl font-bold text-green-600">
                    {shelves.filter(shelf => 
                      books.filter(book => book.shelfId === shelf.id).length < shelf.capacity
                    ).length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">для размещения</div>
                </div>
              </div>

              <Button
                onClick={operationMode === 'arrange' ? analyzeAndArrangeBooks : analyzeAndSuggestShelves}
                disabled={isAnalyzing || getTargetBooksCount() === 0}
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
                    {getModeIcon()}
                    {getModeText()}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                {operationMode === 'arrange' ? 'Предложения ИИ по расстановке' : 'Предложения ИИ по созданию полок'}
                {(operationMode === 'arrange' ? arrangementSummary : shelfSuggestionSummary) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-blue-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-md">
                      <p className="text-sm">{operationMode === 'arrange' ? arrangementSummary : shelfSuggestionSummary}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </h3>
              <p className="text-blue-700">
                {operationMode === 'arrange' 
                  ? `ИИ предлагает разместить ${arrangements.length} книг. Выберите предложения, которые хотите применить.`
                  : `ИИ предлагает создать ${shelfSuggestions.length} новых полок. Выберите предложения, которые хотите применить.`
                }
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
                  Выбрано: {operationMode === 'arrange' ? selectedArrangements.size : selectedShelfSuggestions.size} из {operationMode === 'arrange' ? arrangements.length : shelfSuggestions.length}
                </span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {operationMode === 'arrange' ? (
                arrangements.map((arrangement, index) => {
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
                        {arrangement.reason && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs text-gray-600 mt-1 cursor-help hover:text-blue-600 transition-colors duration-200 flex items-start gap-1">
                                <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">
                                  {arrangement.reason.length > 80 
                                    ? `${arrangement.reason.substring(0, 80)}...` 
                                    : arrangement.reason}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-md">
                              <p className="text-sm">{arrangement.reason}</p>
                            </TooltipContent>
                          </Tooltip>
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
                })
              ) : (
                shelfSuggestions.map((suggestion, index) => {
                  const suggestionKey = `shelf-${index}`;
                  const isSelected = selectedShelfSuggestions.has(suggestionKey);
                  
                  return (
                    <motion.div
                      key={suggestionKey}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? "bg-blue-50 border-blue-300 shadow-sm" 
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => toggleShelfSuggestionSelection(suggestionKey)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleShelfSuggestionSelection(suggestionKey)}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 flex items-center gap-2">
                          {suggestion.action === 'delete' ? (
                            <X className="h-4 w-4 text-red-500" />
                          ) : (
                            <Layers className="h-4 w-4 text-blue-500" />
                          )}
                          {suggestion.action === 'delete' ? `Удалить полку #${suggestion.shelfNumber}` : suggestion.category}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm text-gray-600 mt-1 cursor-help hover:text-blue-600 transition-colors duration-200 flex items-start gap-1">
                              <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">
                                {suggestion.reason.length > 100 
                                  ? `${suggestion.reason.substring(0, 100)}...` 
                                  : suggestion.reason}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-md">
                            <p className="text-sm">{suggestion.reason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`font-medium ${suggestion.action === 'delete' ? 'text-red-600' : 'text-blue-600'}`}>
                          Полка #{suggestion.shelfNumber}
                        </div>
                        {suggestion.action === 'create' && (
                          <>
                            <div className="text-sm text-gray-600">
                              Вместимость: {suggestion.capacity}
                            </div>
                            <div className="text-xs text-gray-500">
                              Позиция: ({suggestion.posX}, {suggestion.posY})
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={operationMode === 'arrange' ? applyArrangements : applyShelfSuggestions}
                className="flex-1"
                size="lg"
                disabled={operationMode === 'arrange' ? selectedArrangements.size === 0 : selectedShelfSuggestions.size === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                {operationMode === 'arrange' 
                  ? `Применить выбранные (${selectedArrangements.size})`
                  : `Создать полки (${selectedShelfSuggestions.size})`
                }
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
    </TooltipProvider>
  );
};

export default AutoArrangeBooks; 