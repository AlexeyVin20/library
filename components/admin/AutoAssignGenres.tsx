"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Check, X, Loader, AlertCircle, BookOpen, Tag, Layers, Info, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import type { Book } from "@/lib/types";

interface GenreAssignment {
  bookId: string;
  genre: string;
  originalGenre?: string;
  selected?: boolean;
  reason?: string;
}

interface CategorizationAssignment {
  bookId: string;
  categorization: string;
  originalCategorization?: string;
  selected?: boolean;
  reason?: string;
}

type AssignmentMode = 'genre' | 'categorization' | 'both';
type BookFilterMode = 'all' | 'missing-genre' | 'missing-categorization' | 'missing-both';

interface AutoAssignGenresProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  books: Book[];
  onAssignment: () => void; // Callback для обновления списка книг
}

const AutoAssignGenres: React.FC<AutoAssignGenresProps> = ({
  open,
  onOpenChange,
  books,
  onAssignment
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [genreAssignments, setGenreAssignments] = useState<GenreAssignment[]>([]);
  const [categorizationAssignments, setCategorizationAssignments] = useState<CategorizationAssignment[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignmentSummary, setAssignmentSummary] = useState<string>("");
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedCategorizations, setSelectedCategorizations] = useState<Set<string>>(new Set());
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('both');
  const [bookFilterMode, setBookFilterMode] = useState<BookFilterMode>('missing-both');
  const [webSearchInfo, setWebSearchInfo] = useState<{queries: string[], chunksCount: number} | null>(null);

  const analyzeAndAssignGenres = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("API ключ Gemini не настроен");
      }

      // Фильтруем книги в зависимости от выбранного режима
      let targetBooks: Book[];
      switch (bookFilterMode) {
        case 'missing-genre':
          targetBooks = books.filter(book => !book.genre || book.genre.trim() === '');
          break;
        case 'missing-categorization':
          targetBooks = books.filter(book => !book.categorization || book.categorization.trim() === '');
          break;
        case 'missing-both':
          targetBooks = books.filter(book => 
            (!book.genre || book.genre.trim() === '') || 
            (!book.categorization || book.categorization.trim() === '')
          );
          break;
        case 'all':
          targetBooks = books;
          break;
        default:
          targetBooks = books.filter(book => 
            (!book.genre || book.genre.trim() === '') || 
            (!book.categorization || book.categorization.trim() === '')
          );
      }

      if (targetBooks.length === 0) {
        throw new Error("Нет книг для обработки с выбранными критериями");
      }

      const booksData = targetBooks.map(book => ({
        id: book.id,
        title: book.title,
        authors: book.authors,
        description: book.description,
        publisher: book.publisher,
        publishedYear: book.publishedYear,
        isbn: book.isbn,
        currentGenre: book.genre || '',
        currentCategorization: book.categorization || ''
      }));

      // Формируем задачи для ИИ в зависимости от режима
      let taskDescription = "";
      switch (assignmentMode) {
        case 'genre':
          taskDescription = "назначить подходящие жанры для книг";
          break;
        case 'categorization':
          taskDescription = "назначить подходящую библиотечную категоризацию для книг";
          break;
        case 'both':
          taskDescription = "назначить подходящие жанры и библиотечную категоризацию для книг";
          break;
      }

      const prompt = `
Ты - эксперт библиотекарь и книговед. Твоя задача - ${taskDescription} на основе их метаданных с использованием актуальной информации из интернета.

ИНСТРУКЦИИ ПО ПОИСКУ:
1. Для каждой книги найди в интернете актуальную информацию о жанре, категории, обзорах
2. Ищи информацию о книге на сайтах библиотек, книжных магазинов, литературных порталах
3. Проверь актуальные классификации и стандарты жанров в 2024-2025 году
4. Используй найденную информацию для точного определения жанров и категоризации

КНИГИ ДЛЯ АНАЛИЗА:
${JSON.stringify(booksData, null, 2)}

ЗАДАЧИ:
${assignmentMode === 'genre' || assignmentMode === 'both' ? `
1. ЖАНРЫ: Найди в интернете и определи наиболее подходящий жанр для каждой книги. Используй актуальные литературные жанры:
   - Художественная литература: роман, повесть, рассказ, поэзия, драма, детектив, фантастика, фэнтези, триллер, мелодрама, приключения, исторический роман, антиутопия, постапокалипсис
   - Научная литература: учебник, монография, справочник, энциклопедия, научно-популярная литература, исследование
   - Техническая литература: руководство, инструкция, техническая документация, программирование
   - Детская литература: сказки, детские рассказы, развивающая литература, подростковая литература
   - Современные жанры: нон-фикшн, биографии, мемуары, путешествия, кулинария, спорт, религия, философия, бизнес-литература, саморазвитие
` : ''}
${assignmentMode === 'categorization' || assignmentMode === 'both' ? `
2. БИБЛИОТЕЧНАЯ КАТЕГОРИЗАЦИЯ: Найди актуальные стандарты и определи категоризацию согласно современным библиотечным системам:
   - Универсальная десятичная классификация (УДК): 0-Общий отдел, 1-Философия, 2-Религия, 3-Социальные науки, 4-Языкознание, 5-Математика и естественные науки, 6-Прикладные науки, 7-Искусство, 8-Языкознание и литература, 9-География и история
   - Современные тематические категории: Техника, Медицина, История, Литература, Искусство, Наука, Образование, Детская литература, Справочная литература, IT и программирование, Бизнес и экономика
` : ''}

ПРАВИЛА:
1. ОБЯЗАТЕЛЬНО используй веб-поиск для каждой книги для получения актуальной информации
2. Анализируй название, авторов, описание, издательство, год издания И найденную в интернете информацию
3. Для книг с существующими жанрами/категоризацией предлагай улучшения только если текущее значение явно неподходящее или устаревшее
4. Жанры должны быть краткими, точными и современными (1-3 слова)
5. Категоризация должна следовать актуальным библиотечным стандартам
6. Обоснуй каждое назначение со ссылкой на источник информации из интернета

ФОРМАТ ОТВЕТА (только JSON, без дополнительного текста):
{
  ${assignmentMode === 'genre' || assignmentMode === 'both' ? `"genreAssignments": [
    {
      "bookId": "id_книги",
      "genre": "предлагаемый_жанр",
      "reason": "краткое обоснование с указанием источника из веб-поиска"
    }
  ],` : ''}
  ${assignmentMode === 'categorization' || assignmentMode === 'both' ? `"categorizationAssignments": [
    {
      "bookId": "id_книги", 
      "categorization": "предлагаемая_категоризация",
      "reason": "краткое обоснование с указанием источника из веб-поиска"
    }
  ],` : ''}
  "summary": "краткое описание логики назначений с упоминанием использованных веб-источников"
}
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
          }],
          // Настройки генерации для лучшего качества анализа
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 32768,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка API Gemini: ${response.status}`);
      }

      const data = await response.json();
      
      // Обрабатываем информацию о веб-поиске (если есть)
      const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata) {
        const searchInfo = {
          queries: groundingMetadata.webSearchQueries || [],
          chunksCount: groundingMetadata.groundingChunks?.length || 0
        };
        setWebSearchInfo(searchInfo);
        console.log("Веб-поиск выполнен:", searchInfo);
      } else {
        setWebSearchInfo(null);
        console.log("Веб-поиск не выполнялся - возможно, использовались только базовые знания модели");
      }
      
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        throw new Error("Пустой ответ от ИИ");
      }

      // Парсим JSON ответ с улучшенной обработкой
      let parsedResponse;
      try {
        // Убираем markdown форматирование если есть
        const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
        parsedResponse = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Ошибка парсинга JSON:", parseError);
        console.log("Сырой ответ ИИ:", aiResponse);
        throw new Error("Не удалось распарсить ответ ИИ. Попробуйте еще раз.");
      }
      
      // Обрабатываем жанры
      if (assignmentMode === 'genre' || assignmentMode === 'both') {
        const validGenreAssignments: GenreAssignment[] = [];
        
        if (parsedResponse.genreAssignments && Array.isArray(parsedResponse.genreAssignments)) {
          for (const assignment of parsedResponse.genreAssignments) {
            const book = targetBooks.find(b => b.id === assignment.bookId);
            if (book && assignment.genre) {
              validGenreAssignments.push({
                bookId: book.id,
                genre: assignment.genre,
                originalGenre: book.genre || '',
                selected: true,
                reason: assignment.reason || "Автоматическое назначение жанра"
              });
            }
          }
        }
        
        setGenreAssignments(validGenreAssignments);
        setSelectedGenres(new Set(validGenreAssignments.map((ass, index) => `genre-${index}`)));
      }

      // Обрабатываем категоризацию
      if (assignmentMode === 'categorization' || assignmentMode === 'both') {
        const validCategorizationAssignments: CategorizationAssignment[] = [];
        
        if (parsedResponse.categorizationAssignments && Array.isArray(parsedResponse.categorizationAssignments)) {
          for (const assignment of parsedResponse.categorizationAssignments) {
            const book = targetBooks.find(b => b.id === assignment.bookId);
            if (book && assignment.categorization) {
              validCategorizationAssignments.push({
                bookId: book.id,
                categorization: assignment.categorization,
                originalCategorization: book.categorization || '',
                selected: true,
                reason: assignment.reason || "Автоматическое назначение категоризации"
              });
            }
          }
        }
        
        setCategorizationAssignments(validCategorizationAssignments);
        setSelectedCategorizations(new Set(validCategorizationAssignments.map((ass, index) => `cat-${index}`)));
      }

      setAssignmentSummary(parsedResponse.summary || "");
      setShowPreview(true);

      const totalAssignments = (assignmentMode === 'genre' || assignmentMode === 'both' ? genreAssignments.length : 0) + 
                               (assignmentMode === 'categorization' || assignmentMode === 'both' ? categorizationAssignments.length : 0);
      
      // Формируем сообщение с информацией о веб-поиске
      let description = `ИИ предлагает ${totalAssignments} назначений для ${targetBooks.length} книг`;
      if (groundingMetadata?.webSearchQueries?.length) {
        description += ` (использован веб-поиск: ${groundingMetadata.webSearchQueries.length} запросов)`;
      }
      
      toast({
        title: "Анализ завершен с веб-поиском",
        description
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

  const applyAssignments = async () => {
    const selectedGenreAssignments = genreAssignments.filter((ass, index) => 
      selectedGenres.has(`genre-${index}`)
    );
    
    const selectedCategorizationAssignments = categorizationAssignments.filter((ass, index) => 
      selectedCategorizations.has(`cat-${index}`)
    );
    
    const totalSelected = selectedGenreAssignments.length + selectedCategorizationAssignments.length;
    
    if (totalSelected === 0) {
      toast({
        title: "Нет выбранных назначений",
        description: "Выберите хотя бы одно назначение для применения",
        variant: "destructive"
      });
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      let successCount = 0;
      let errorCount = 0;

      // Применяем жанры
      for (const assignment of selectedGenreAssignments) {
        try {
          const response = await fetch(`${baseUrl}/api/books/${assignment.bookId}/genre`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ genre: assignment.genre })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      // Применяем категоризацию
      for (const assignment of selectedCategorizationAssignments) {
        try {
          const response = await fetch(`${baseUrl}/api/books/${assignment.bookId}/categorization`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ categorization: assignment.categorization })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Назначения применены",
          description: `Успешно применено ${successCount} назначений${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`
        });
        onAssignment(); // Обновляем список книг
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Ошибка применения",
          description: `Не удалось применить назначения: ${errorCount} ошибок`,
          variant: "destructive"
        });
      }

    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при применении назначений",
        variant: "destructive"
      });
    }

    setShowPreview(false);
    onOpenChange(false);
  };

  const cancelAssignments = () => {
    setGenreAssignments([]);
    setCategorizationAssignments([]);
    setSelectedGenres(new Set());
    setSelectedCategorizations(new Set());
    setAssignmentSummary("");
    setWebSearchInfo(null);
    setShowPreview(false);
    setError(null);
  };

  const toggleGenreSelection = (assignmentKey: string) => {
    setSelectedGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentKey)) {
        newSet.delete(assignmentKey);
      } else {
        newSet.add(assignmentKey);
      }
      return newSet;
    });
  };

  const toggleCategorizationSelection = (assignmentKey: string) => {
    setSelectedCategorizations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentKey)) {
        newSet.delete(assignmentKey);
      } else {
        newSet.add(assignmentKey);
      }
      return newSet;
    });
  };

  const selectAllAssignments = () => {
    if (assignmentMode === 'genre' || assignmentMode === 'both') {
      setSelectedGenres(new Set(genreAssignments.map((ass, index) => `genre-${index}`)));
    }
    if (assignmentMode === 'categorization' || assignmentMode === 'both') {
      setSelectedCategorizations(new Set(categorizationAssignments.map((ass, index) => `cat-${index}`)));
    }
  };

  const deselectAllAssignments = () => {
    setSelectedGenres(new Set());
    setSelectedCategorizations(new Set());
  };

  const getTargetBooksCount = () => {
    switch (bookFilterMode) {
      case 'missing-genre':
        return books.filter(book => !book.genre || book.genre.trim() === '').length;
      case 'missing-categorization':
        return books.filter(book => !book.categorization || book.categorization.trim() === '').length;
      case 'missing-both':
        return books.filter(book => 
          (!book.genre || book.genre.trim() === '') || 
          (!book.categorization || book.categorization.trim() === '')
        ).length;
      case 'all':
        return books.length;
      default:
        return 0;
    }
  };

  const getModeText = () => {
    switch (assignmentMode) {
      case 'genre':
        return "Назначить жанры";
      case 'categorization':
        return "Назначить категоризацию";
      case 'both':
        return "Назначить жанры и категоризацию";
      default:
        return "Запустить анализ";
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Автоматическое назначение жанров и категорий с помощью ИИ
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
                  <BookOpen className="h-12 w-12 text-purple-500 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Интеллектуальное назначение метаданных
                  </h3>
                  <p className="text-gray-600 mt-2">
                    ИИ проанализирует книги с использованием веб-поиска и предложит подходящие жанры и библиотечную категоризацию 
                    на основе названия, авторов, описания и актуальной информации из интернета.
                  </p>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 text-sm">
                      <Bot className="h-4 w-4" />
                      <span className="font-medium">Веб-поиск включен:</span>
                      ИИ будет искать актуальную информацию о книгах в интернете для более точного определения жанров
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Что назначать
                    </label>
                    <Select value={assignmentMode} onValueChange={(value: AssignmentMode) => setAssignmentMode(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип назначения" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Жанры и категоризацию
                          </div>
                        </SelectItem>
                        <SelectItem value="genre">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Только жанры
                          </div>
                        </SelectItem>
                        <SelectItem value="categorization">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            Только категоризацию
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Какие книги обрабатывать
                    </label>
                    <Select value={bookFilterMode} onValueChange={(value: BookFilterMode) => setBookFilterMode(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите критерий" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="missing-both">Без жанра или категоризации</SelectItem>
                        <SelectItem value="missing-genre">Только без жанра</SelectItem>
                        <SelectItem value="missing-categorization">Только без категоризации</SelectItem>
                        <SelectItem value="all">Все книги</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium">Без жанра</div>
                    <div className="text-2xl font-bold text-red-600">
                      {books.filter(book => !book.genre || book.genre.trim() === '').length}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium">Без категоризации</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {books.filter(book => !book.categorization || book.categorization.trim() === '').length}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium">С жанром</div>
                    <div className="text-2xl font-bold text-green-600">
                      {books.filter(book => book.genre && book.genre.trim() !== '').length}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium">Всего книг</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {books.length}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={analyzeAndAssignGenres}
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
                      <Brain className="h-4 w-4 mr-2" />
                      {getModeText()}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  Предложения ИИ по назначению метаданных
                  {assignmentSummary && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-purple-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-md">
                        <p className="text-sm">{assignmentSummary}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </h3>
                <p className="text-purple-700">
                  ИИ предлагает {genreAssignments.length + categorizationAssignments.length} назначений. 
                  Выберите предложения, которые хотите применить.
                </p>
                {webSearchInfo && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <div className="flex items-center gap-2 text-green-800">
                      <Bot className="h-3 w-3" />
                      <span className="font-medium">Веб-поиск выполнен:</span>
                      {webSearchInfo.queries.length} запросов, найдено {webSearchInfo.chunksCount} источников
                    </div>
                    {webSearchInfo.queries.length > 0 && (
                      <div className="mt-1 text-green-700">
                        Запросы: {webSearchInfo.queries.slice(0, 3).map(q => `"${q}"`).join(', ')}
                        {webSearchInfo.queries.length > 3 && ` и еще ${webSearchInfo.queries.length - 3}`}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={selectAllAssignments}
                    variant="outline"
                    size="sm"
                    className="text-purple-600"
                  >
                    Выбрать все
                  </Button>
                  <Button
                    onClick={deselectAllAssignments}
                    variant="outline"
                    size="sm"
                    className="text-purple-600"
                  >
                    Снять выбор
                  </Button>
                  <span className="text-sm text-purple-600 self-center ml-2">
                    Выбрано: {selectedGenres.size + selectedCategorizations.size} из {genreAssignments.length + categorizationAssignments.length}
                  </span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-4">
                {/* Назначения жанров */}
                {genreAssignments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-500" />
                      Жанры ({genreAssignments.length})
                    </h4>
                    <div className="space-y-2">
                      {genreAssignments.map((assignment, index) => {
                        const book = books.find(b => b.id === assignment.bookId);
                        const assignmentKey = `genre-${index}`;
                        const isSelected = selectedGenres.has(assignmentKey);
                        
                        return (
                          <motion.div
                            key={assignmentKey}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`border rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? "bg-blue-50 border-blue-300 shadow-sm" 
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => toggleGenreSelection(assignmentKey)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleGenreSelection(assignmentKey)}
                              className="flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {book?.title}
                              </div>
                              <div className="text-sm text-gray-600">
                                {book?.authors}
                              </div>
                              {assignment.reason && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-xs text-gray-600 mt-1 cursor-help hover:text-blue-600 transition-colors duration-200 flex items-start gap-1">
                                      <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                      <span className="line-clamp-2">
                                        {assignment.reason.length > 80 
                                          ? `${assignment.reason.substring(0, 80)}...` 
                                          : assignment.reason}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-md">
                                    <p className="text-sm">{assignment.reason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-medium text-blue-600">
                                {assignment.genre}
                              </div>
                              {assignment.originalGenre && (
                                <div className="text-sm text-gray-500">
                                  Было: {assignment.originalGenre || 'не указано'}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Назначения категоризации */}
                {categorizationAssignments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-green-500" />
                      Категоризация ({categorizationAssignments.length})
                    </h4>
                    <div className="space-y-2">
                      {categorizationAssignments.map((assignment, index) => {
                        const book = books.find(b => b.id === assignment.bookId);
                        const assignmentKey = `cat-${index}`;
                        const isSelected = selectedCategorizations.has(assignmentKey);
                        
                        return (
                          <motion.div
                            key={assignmentKey}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (genreAssignments.length + index) * 0.05 }}
                            className={`border rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? "bg-green-50 border-green-300 shadow-sm" 
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => toggleCategorizationSelection(assignmentKey)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleCategorizationSelection(assignmentKey)}
                              className="flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {book?.title}
                              </div>
                              <div className="text-sm text-gray-600">
                                {book?.authors}
                              </div>
                              {assignment.reason && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-xs text-gray-600 mt-1 cursor-help hover:text-green-600 transition-colors duration-200 flex items-start gap-1">
                                      <Info className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                      <span className="line-clamp-2">
                                        {assignment.reason.length > 80 
                                          ? `${assignment.reason.substring(0, 80)}...` 
                                          : assignment.reason}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-md">
                                    <p className="text-sm">{assignment.reason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-medium text-green-600">
                                {assignment.categorization}
                              </div>
                              {assignment.originalCategorization && (
                                <div className="text-sm text-gray-500">
                                  Было: {assignment.originalCategorization || 'не указано'}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={applyAssignments}
                  className="flex-1"
                  size="lg"
                  disabled={selectedGenres.size === 0 && selectedCategorizations.size === 0}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Применить выбранные ({selectedGenres.size + selectedCategorizations.size})
                </Button>
                <Button
                  onClick={cancelAssignments}
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

export default AutoAssignGenres; 