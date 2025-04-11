"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, BookOpen, Search, FileText, BookmarkIcon, LayoutGrid, BookCopy, X, ChevronRight, Upload, Download, Plus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { bookSchema } from "@/lib/validations";
import { BookInput } from "@/lib/admin/actions/book";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Position {
  x: number;
  y: number;
}

// Компонент для анимированного появления
const FadeInView = ({ children, delay = 0, duration = 0.5 }: { children: React.ReactNode; delay?: number; duration?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

// Компонент для вкладок
const AnimatedTabsTrigger = ({ value, icon, label, isActive }: { value: string; icon: React.ReactNode; label: string; isActive: boolean }) => {
  return (
    <TabsTrigger value={value} className="relative">
      <div className="flex items-center gap-2 py-2 px-1">
        <span className={isActive ? "text-emerald-500" : "text-gray-500 dark:text-gray-400"}>
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {isActive && (
        <motion.div
          layoutId="activeBookFormTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </TabsTrigger>
  );
};

interface BookFormProps {
  initialData?: Partial<BookInput>;
  onSubmit: (data: BookInput) => Promise<void>;
  isSubmitting: boolean;
  mode: "create" | "update";
  shelves?: Array<{ id: number; category: string; shelfNumber: number; capacity: number; posX: number; posY: number }>;
}

const BookForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  mode,
  shelves = [],
}: BookFormProps) => {
  const router = useRouter();
  const [showManualCoverInput, setShowManualCoverInput] = useState(false);
  const [manualCoverUrl, setManualCoverUrl] = useState("");
  const [isbn, setIsbn] = useState(initialData?.isbn || "");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.cover || null);
  const [geminiImage, setGeminiImage] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [showShelvesModal, setShowShelvesModal] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<number | undefined>(
    initialData?.shelfId !== undefined ? Number(initialData.shelfId) : undefined
  );
  const [selectedPosition, setSelectedPosition] = useState<number | undefined>(
    initialData?.position !== undefined ? Number(initialData.position) : undefined
  );
  const [draggedShelf, setDraggedShelf] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState<Position>({ x: 0, y: 0 });

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: initialData?.title || "",
      authors: initialData?.authors || "",
      isbn: initialData?.isbn || "",
      genre: initialData?.genre || "",
      cover: initialData?.cover || "",
      description: initialData?.description || "",
      publicationYear: initialData?.publicationYear || new Date().getFullYear(),
      publisher: initialData?.publisher || "",
      pageCount: initialData?.pageCount || 0,
      language: initialData?.language || "",
      categorization: initialData?.categorization || "",
      udk: initialData?.udk || "",
      bbk: initialData?.bbk || "",
      summary: initialData?.summary || "",
      availableCopies: initialData?.availableCopies || 1,
      shelfId: initialData?.shelfId || undefined,
      position: initialData?.position || undefined,
      edition: initialData?.edition || "",
      price: initialData?.price || 0,
      format: initialData?.format || "",
      originalTitle: initialData?.originalTitle || "",
      originalLanguage: initialData?.originalLanguage || "",
      isEbook: initialData?.isEbook || false,
      condition: initialData?.condition || "",
    },
  });

  const isEbook = watch("isEbook");
  const formValues = watch();

  useEffect(() => {
    if (initialData) {
      setIsbn(initialData.isbn || "");
      if (initialData.shelfId !== undefined) {
        setSelectedShelf(Number(initialData.shelfId));
      }
      if (initialData.position !== undefined) {
        setSelectedPosition(Number(initialData.position));
      }
      if (initialData?.cover) setPreviewUrl(initialData.cover);
    }
  }, [initialData]);

  useEffect(() => {
    if (geminiImage) handleGeminiUpload();
  }, [geminiImage]);

  const handleFetchByISBN = async () => {
    if (!isbn) {
      toast({ title: "Ошибка", description: "Введите ISBN для поиска", variant: "destructive" });
      return;
    }
    
    setIsSearchLoading(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
      );
      const data = await res.json();
      if (data.totalItems > 0) {
        const bookData = data.items[0].volumeInfo;
        setValue("title", bookData.title || "");
        setValue("description", bookData.description || "");
        setValue("cover", bookData.imageLinks?.thumbnail || "");
        setValue("isbn", isbn);
        setValue("publisher", bookData.publisher || "");
        setValue("pageCount", bookData.pageCount || 0);
        setValue("language", bookData.language || "");
        setValue(
          "publicationYear",
          bookData.publishedDate ? parseInt(bookData.publishedDate.substring(0, 4)) : new Date().getFullYear()
        );
        if (bookData.authors && bookData.authors.length > 0) setValue("authors", bookData.authors.join(", "));
        if (bookData.imageLinks?.thumbnail) setPreviewUrl(bookData.imageLinks.thumbnail);
        toast({ title: "Данные получены", description: "Информация о книге успешно заполнена" });
      } else {
        setValue("isbn", isbn);
        toast({
          title: "Книга не найдена",
          description: "Проверьте правильность ISBN.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setValue("isbn", isbn);
      toast({
        title: "Ошибка",
        description: "Ошибка при поиске по ISBN.",
        variant: "destructive",
      });
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setPreviewUrl(event.target.result);
          setValue("cover", event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCover = () => {
    setPreviewUrl(null);
    setValue("cover", "");
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64String = reader.result.split(",")[1];
          resolve(base64String);
        } else {
          reject(new Error("Не удалось преобразовать файл в base64"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const GeminiFileUpload = ({
    onFileChange,
  }: {
    onFileChange: (base64: string) => void;
  }) => {
    const [fileName, setFileName] = useState("");

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        if (file.size > 10 * 1024 * 1024) {
          alert("Размер файла не должен превышать 10 МБ");
          return;
        }
        const base64 = await fileToBase64(file);
        onFileChange(base64);
      }
    };

    return (
      <motion.div 
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all border-white/30 dark:border-gray-700/30"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          id="gemini-file-input"
        />
        <label htmlFor="gemini-file-input" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          <Upload className="w-10 h-10 mb-2 text-emerald-500" />
          <p className="mb-2 text-sm text-center text-gray-600 dark:text-gray-300">
            Перетащите файл сюда или нажмите для загрузки
          </p>
          {fileName && <p className="text-xs text-emerald-500">{fileName}</p>}
        </label>
      </motion.div>
    );
  };

  const handleGeminiFileChange = (base64: string) => {
    setGeminiImage(base64);
  };

  const handleGeminiUpload = async () => {
    if (!geminiImage) return;
    setGeminiLoading(true);
    try {
      const endpoint = "https://openrouter.ai/api/v1/chat/completions";
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
      const requestBody = {
        model: "google/gemini-2.0-flash-exp:free",
        webSearch: true,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Отвечать пользователю по-русски. Отвечать в формате json без вступлений и заключений. Задача- заполнять поля у книг. Модель книги содержит следующие поля: id(Guid), title(строка 255), authors(строка 500), isbn(строка), genre(строка 100), categorization(строка 100), udk(строка), bbk(строка 20), cover всегда оставляй null, description(строка), publicationYear(число), publisher(строка 100), pageCount(число), language(строка 50), availableCopies(число), dateAdded(дата), dateModified(дата), edition(строка 50), price(decimal), format(строка 100), originalTitle(строка 255), originalLanguage(строка 50), isEbook(boolean), condition(строка 100), shelfId(число). Если информации нет, оставь null, цену ставь = 0. Ищи в интернете жанры книги по названию и автору, и заполняй резюме книги(summary). Не путай резюме(summary) и описание(description), которое написано в фото.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${geminiImage}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const responseText = data?.choices?.[0]?.message?.content;

      if (responseText) {
        let jsonString = responseText.trim();
        if (jsonString.startsWith("```json")) jsonString = jsonString.slice(7).trim();
        if (jsonString.endsWith("```")) jsonString = jsonString.slice(0, -3).trim();
        const parsedData = JSON.parse(jsonString);

        let coverUrl = null;
        if (parsedData.isbn) {
          try {
            const coverRes = await fetch(`https://bookcover.longitood.com/bookcover/${parsedData.isbn}`);
            if (coverRes.ok) {
              const coverData = await coverRes.json();
              if (coverData.url) coverUrl = coverData.url;
            }
          } catch (error) {
            console.error("Ошибка при поиске обложки по ISBN:", error);
          }
        }

        if (!coverUrl && parsedData.title && parsedData.authors) {
          try {
            const coverRes = await fetch(
              `https://bookcover.longitood.com/bookcover?book_title=${encodeURIComponent(
                parsedData.title
              )}&author_name=${encodeURIComponent(parsedData.authors)}`
            );
            if (coverRes.ok) {
              const coverData = await coverRes.json();
              if (coverData.url) coverUrl = coverData.url;
            }
          } catch (error) {
            console.error("Ошибка при поиске обложки по названию и автору:", error);
          }
        }

        if (!coverUrl && (parsedData.isbn || (parsedData.title && parsedData.authors))) {
          try {
            const query = parsedData.isbn
              ? `isbn:${parsedData.isbn}`
              : `intitle:${parsedData.title} inauthor:${parsedData.authors}`;
            const googleBooksRes = await fetch(
              `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
            );
            if (googleBooksRes.ok) {
              const booksData = await googleBooksRes.json();
              if (booksData.items && booksData.items.length > 0 && booksData.items[0].volumeInfo?.imageLinks) {
                coverUrl =
                  booksData.items[0].volumeInfo.imageLinks.large ||
                  booksData.items[0].volumeInfo.imageLinks.medium ||
                  booksData.items[0].volumeInfo.imageLinks.thumbnail;
              }
            }
          } catch (error) {
            console.error("Ошибка при поиске обложки через Google Books API:", error);
          }
        }

        if (!coverUrl) {
          const query = encodeURIComponent(formValues.title + " книга обложка");
          const searchUrl = `https://cse.google.com/cse?cx=b421413d1a0984f58#gsc.tab=0&gsc.q=${query}`;
          window.open(searchUrl, "_blank");
          setShowManualCoverInput(true);
          toast({
            title: "Обложка не найдена",
            description: "Поиск открыт в новой вкладке. Вставьте ссылку на обложку.",
            variant: "destructive",
          });
        } else {
          setValue("cover", coverUrl);
          setPreviewUrl(coverUrl);
          toast({
            title: "Данные получены",
            description: "Обложка книги успешно получена.",
          });
        }

        if (parsedData.title) setValue("title", parsedData.title);
        if (parsedData.authors) setValue("authors", parsedData.authors);
        if (parsedData.genre) setValue("genre", parsedData.genre);
        if (parsedData.categorization) setValue("categorization", parsedData.categorization);
        if (parsedData.udk) setValue("udk", parsedData.udk);
        if (parsedData.bbk) setValue("bbk", parsedData.bbk);
        if (parsedData.isbn) setValue("isbn", parsedData.isbn);
        if (parsedData.description) setValue("description", parsedData.description);
        if (parsedData.summary) setValue("summary", parsedData.summary);
        if (parsedData.publicationYear) setValue("publicationYear", parsedData.publicationYear);
        if (parsedData.publisher) setValue("publisher", parsedData.publisher);
        if (parsedData.pageCount) setValue("pageCount", parsedData.pageCount);
        if (parsedData.language) setValue("language", parsedData.language);
        if (parsedData.availableCopies) setValue("availableCopies", parsedData.availableCopies);
        if (parsedData.edition) setValue("edition", parsedData.edition);
        if (parsedData.price) setValue("price", parsedData.price);
        if (parsedData.format) setValue("format", parsedData.format);
        if (parsedData.originalTitle) setValue("originalTitle", parsedData.originalTitle);
        if (parsedData.originalLanguage) setValue("originalLanguage", parsedData.originalLanguage);
        if (parsedData.isEbook !== undefined) setValue("isEbook", parsedData.isEbook);
        if (parsedData.condition) setValue("condition", parsedData.condition);
        if (parsedData.shelfId) setValue("shelfId", parsedData.shelfId);
      } else {
        toast({ title: "Ошибка", description: "Ответ от Gemini API не содержит данных.", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Ошибка", description: "Ошибка при вызове Gemini API.", variant: "destructive" });
    } finally {
      setGeminiLoading(false);
      setGeminiImage(null);
    }
  };

  const fillFormFromJson = (data: any) => {
    if (data.Title) setValue("title", data.Title);
    if (data.Authors) setValue("authors", data.Authors);
    if (data.Genre) setValue("genre", data.Genre);
    if (data.Categorization) setValue("categorization", data.Categorization);
    if (data.UDK) setValue("udk", data.UDK);
    if (data.BBK) setValue("bbk", data.BBK);
    if (data.ISBN) {
      setValue("isbn", data.ISBN);
      setIsbn(data.ISBN);
    }
    if (data.Cover) {
      setValue("cover", data.Cover);
      setPreviewUrl(data.Cover);
    }
    if (data.Description) setValue("description", data.Description);
    if (data.Summary) setValue("summary", data.Summary);
    if (data.PublicationYear) setValue("publicationYear", data.PublicationYear);
    if (data.Publisher) setValue("publisher", data.Publisher);
    if (data.PageCount) setValue("pageCount", data.PageCount);
    if (data.Language) setValue("language", data.Language);
    if (data.AvailableCopies !== undefined) setValue("availableCopies", data.AvailableCopies);
    if (data.Edition) setValue("edition", data.Edition);
    if (data.Price !== undefined) setValue("price", data.Price);
    if (data.Format) setValue("format", data.Format);
    if (data.OriginalTitle) setValue("originalTitle", data.OriginalTitle);
    if (data.OriginalLanguage) setValue("originalLanguage", data.OriginalLanguage);
    if (data.IsEbook !== undefined) setValue("isEbook", data.IsEbook);
    if (data.Condition) setValue("condition", data.Condition);
    if (data.ShelfId) {
      setValue("shelfId", Number(data.ShelfId));
      setSelectedShelf(Number(data.ShelfId));
    }
    if (data.Position !== undefined) {
      setValue("position", Number(data.Position));
      setSelectedPosition(Number(data.Position));
    }
    toast({ 
      title: "Данные загружены", 
      description: "Информация из JSON успешно импортирована" 
    });
  };

  const handleDragStart = (e: React.MouseEvent, shelf: any) => {
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
    setDraggedShelf({...draggedShelf, posX: newX, posY: newY});
  };

  const handleDragEnd = () => {
    setDraggedShelf(null);
  };

  const handleEmptySlotClick = (shelfId: number, position: number) => {
    setSelectedShelf(shelfId);
    setSelectedPosition(position);
    setValue("shelfId", shelfId);
    setValue("position", position);
    setShowShelvesModal(false);
  };

  const onFormSubmit = async (values: z.infer<typeof bookSchema>) => {
    await onSubmit(values);
  };

  const ShelvesModal = () => {
    return (
      <Dialog open={showShelvesModal} onOpenChange={setShowShelvesModal}>
        <DialogContent className="max-w-4xl backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-white">Выберите полку и позицию</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Нажмите на полку, затем выберите позицию для книги
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Доступные полки</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto p-2">
                {shelves && shelves.length > 0 ? (
                  shelves.map((shelf) => (
                    <motion.div
                      key={shelf.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all backdrop-blur-xl border ${
                        selectedShelf === shelf.id
                          ? "bg-emerald-500/20 border-emerald-500/50 dark:bg-emerald-500/10 dark:border-emerald-500/30"
                          : "bg-white/20 dark:bg-gray-800/20 border-white/20 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30"
                      }`}
                      onClick={() => setSelectedShelf(shelf.id)}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <h5 className="font-medium text-gray-700 dark:text-gray-200">{shelf.category}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Мест: {shelf.capacity}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Категория: {shelf.category || "Общая"}</p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">Нет доступных полок</p>
                )}
              </div>
            </div>
            {selectedShelf && (
              <div>
                <h4 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Выберите позицию на полке {shelves.find(s => s.id === selectedShelf)?.category || 'N/A'}</h4>
                <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto p-2">
                  {Array.from({ length: shelves.find(s => s.id === selectedShelf)?.capacity || 0 }).map((_, i) => {
                    // Проверяем занятость позиции
                    const isOccupied = false; // По умолчанию считаем позицию свободной
                    // Проверяем, является ли это текущей редактируемой книгой
                    const isCurrentBook =
                      initialData?.shelfId === selectedShelf &&
                      initialData?.position === i;

                    return (
                      <motion.div
                        key={i}
                        className={`aspect-square border rounded-lg flex items-center justify-center p-2 cursor-pointer transition-all ${
                          selectedPosition === i
                            ? "bg-emerald-500/20 border-emerald-500/50 dark:bg-emerald-500/10 dark:border-emerald-500/30"
                            : isOccupied && !isCurrentBook
                            ? "bg-gray-300/30 border-gray-400/30 cursor-not-allowed"
                            : "bg-white/20 dark:bg-gray-800/20 border-white/20 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30"
                        }`}
                        onClick={() => {
                          if (!isOccupied || isCurrentBook) {
                            setSelectedPosition(i);
                          }
                        }}
                        whileHover={!isOccupied || isCurrentBook ? { scale: 1.05 } : {}}
                        whileTap={!isOccupied || isCurrentBook ? { scale: 0.95 } : {}}
                      >
                        {i}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowShelvesModal(false)}
              className="bg-gray-500/90 hover:bg-gray-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
            >
              Отмена
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (selectedShelf !== undefined && selectedPosition !== undefined) {
                  setValue("shelfId", selectedShelf);
                  setValue("position", selectedPosition);
                  setShowShelvesModal(false);
                }
              }}
              disabled={selectedShelf === undefined || selectedPosition === undefined}
              className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md disabled:opacity-50"
            >
              Выбрать
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Функция для импорта данных полки из JSON
  const importShelfFromJson = async (data: any) => {
    if (!data || !data.Id) {
      toast({ 
        title: "Ошибка", 
        description: "Неверный формат данных полки", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
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
      
      const response = await fetch(`${baseUrl}/api/shelves/${data.Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shelfData)
      });
      
      if (response.ok) {
        toast({ 
          title: "Успех", 
          description: `Полка "${data.Category}" обновлена` 
        });
      } else {
        const errorText = await response.text();
        toast({ 
          title: "Ошибка", 
          description: `Не удалось обновить полку: ${errorText}`, 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Ошибка при обновлении полки:", error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось обновить полку из-за ошибки сервера", 
        variant: "destructive" 
      });
    }
  };
  
  // Функция для импорта данных журнала из JSON
  const importJournalFromJson = async (data: any) => {
    if (!data || !data.Id) {
      toast({ 
        title: "Ошибка", 
        description: "Неверный формат данных журнала", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const response = await fetch(`${baseUrl}/api/journals/${data.Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        toast({ 
          title: "Успех", 
          description: `Журнал "${data.Title}" обновлен` 
        });
      } else {
        const errorText = await response.text();
        toast({ 
          title: "Ошибка", 
          description: `Не удалось обновить журнал: ${errorText}`, 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Ошибка при обновлении журнала:", error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось обновить журнал из-за ошибки сервера", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto p-6 relative z-10">
        {/* Header */}
        <FadeInView>
          <motion.div 
            className="sticky top-0 z-10 backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 border-b border-white/20 dark:border-gray-700/30 p-4 rounded-xl shadow-lg mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-emerald-500" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {mode === "create" ? "Добавление новой книги" : "Редактирование книги"}
              </h1>
            </div>
          </motion.div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          <motion.div 
            className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
            whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)" }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-500" />
                {mode === "create" ? "Добавление книги" : "Редактирование книги"}
              </h2>
            </div>
            
            {/* Gemini AI Block */}
            <FadeInView delay={0.3}>
              <motion.div 
                className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-4 mb-6 border border-white/20 dark:border-gray-700/30 shadow-md"
                whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
              >
                <label className="block text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Загрузить изображение для сканирования обложки книги
                </label>
                <GeminiFileUpload onFileChange={handleGeminiFileChange} />
                {geminiLoading && (
                  <div className="flex items-center mt-2 text-gray-600 dark:text-gray-300">
                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-emerald-500" />
                    <span>Обработка изображения...</span>
                  </div>
                )}
                {geminiImage && !geminiLoading && (
                  <motion.button 
                    onClick={handleGeminiUpload} 
                    className="mt-2 backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Перезагрузить
                  </motion.button>
                )}
              </motion.div>
            </FadeInView>

            {/* Form */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md p-1 rounded-xl border border-white/20 dark:border-gray-700/30 shadow-md">
                  <AnimatedTabsTrigger 
                    value="basic-info" 
                    icon={<BookmarkIcon className="w-4 h-4" />} 
                    label="Основная информация" 
                    isActive={activeTab === "basic-info"} 
                  />
                  <AnimatedTabsTrigger 
                    value="details" 
                    icon={<FileText className="w-4 h-4" />} 
                    label="Детальная информация" 
                    isActive={activeTab === "details"} 
                  />
                  <AnimatedTabsTrigger 
                    value="rare-fields" 
                    icon={<LayoutGrid className="w-4 h-4" />} 
                    label="Дополнительно" 
                    isActive={activeTab === "rare-fields"} 
                  />
                </TabsList>

                {/* Основная информация */}
                <TabsContent value="basic-info" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Название книги *
                      </label>
                      <Input
                        placeholder="Введите название книги"
                        {...register("title")}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Авторы *
                      </label>
                      <Input
                        placeholder="Введите имена авторов через запятую"
                        {...register("authors")}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.authors && <p className="text-red-500 text-sm mt-1">{errors.authors.message}</p>}
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="isbn" className="text-gray-700 dark:text-gray-200">ISBN</Label>
                      <div className="relative">
                        <div className="flex">
                          <Input
                            id="isbn"
                            placeholder="000-0000000000"
                            className={cn(
                              "backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-l-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm flex-1",
                              errors.isbn && "focus-visible:ring-red-500"
                            )}
                            value={isbn}
                            {...register("isbn", {
                              onChange: (e) => {
                                setIsbn(e.target.value);
                              },
                              value: isbn
                            })}
                          />
                          <motion.button
                            type="button"
                            onClick={handleFetchByISBN}
                            disabled={isSearchLoading}
                            className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-r-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {isSearchLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                            Поиск
                          </motion.button>
                        </div>
                        {errors.isbn && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.isbn.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Жанр
                      </label>
                      <Input
                        placeholder="Введите жанр книги"
                        {...register("genre")}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.genre && <p className="text-red-500 text-sm mt-1">{errors.genre.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Год публикации
                      </label>
                      <Input
                        type="number"
                        placeholder="Введите год публикации"
                        min={1000}
                        max={new Date().getFullYear()}
                        {...register("publicationYear", { valueAsNumber: true })}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.publicationYear && (
                        <p className="text-red-500 text-sm mt-1">{errors.publicationYear.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Издательство
                      </label>
                      <Input
                        placeholder="Введите название издательства"
                        {...register("publisher")}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.publisher && <p className="text-red-500 text-sm mt-1">{errors.publisher.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                          id="isEbook"
                          checked={isEbook}
                          onCheckedChange={(checked) => setValue("isEbook", checked === true)}
                          className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <label htmlFor="isEbook" className="text-base font-medium text-gray-700 dark:text-gray-200">
                          Электронная книга
                        </label>
                      </div>
                    </div>

                    {!isEbook && (
                      <>
                        <div>
                          <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Доступные экземпляры
                          </label>
                          <Input
                            type="number"
                            placeholder="Введите количество доступных экземпляров"
                            min={0}
                            {...register("availableCopies", { valueAsNumber: true })}
                            className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                          />
                          {errors.availableCopies && (
                            <p className="text-red-500 text-sm mt-1">{errors.availableCopies.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Состояние книги
                          </label>
                          <Select
                            onValueChange={(value) => setValue("condition", value)}
                            defaultValue={initialData?.condition || ""}
                          >
                            <SelectTrigger className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm">
                              <SelectValue placeholder="Выберите состояние" />
                            </SelectTrigger>
                            <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 border border-white/20 dark:border-gray-700/30">
                              <SelectItem value="Новое">Новое</SelectItem>
                              <SelectItem value="Б/У">Б/У</SelectItem>
                              <SelectItem value="Не определено">Не определено</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Расположение на полке
                          </label>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <motion.button
                                  type="button"
                                  onClick={() => setShowShelvesModal(true)}
                                  className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 w-full flex items-center justify-center gap-2 shadow-md backdrop-blur-md"
                                  whileHover={{ y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <BookCopy className="h-4 w-4" />
                                  {selectedShelf && selectedPosition !== undefined 
                                    ? `Полка: ${shelves.find(s => s.id === selectedShelf)?.category || 'N/A'} #${shelves.find(s => s.id === selectedShelf)?.shelfNumber || 'N/A'}, Позиция: ${selectedPosition + 1}` 
                                    : "Выбрать расположение"}
                                </motion.button>
                              </div>
                              {selectedShelf && selectedPosition !== undefined && (
                                <motion.button
                                  type="button"
                                  onClick={() => {
                                    setSelectedShelf(undefined);
                                    setSelectedPosition(undefined);
                                    setValue("shelfId", undefined);
                                    setValue("position", undefined);
                                  }}
                                  className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 text-gray-700 dark:text-gray-200 rounded-lg p-2"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <X size={16} />
                                </motion.button>
                              )}
                            </div>
                            {(errors.shelfId) && (
                              <p className="text-red-500 text-sm mt-1">Выберите расположение на полке</p>
                            )}
                            <input type="hidden" {...register("shelfId")} />
                            <input type="hidden" {...register("position")} />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2 text-center">
                        Обложка книги
                      </label>
                      <div className="flex flex-row gap-4 justify-center">
                        <div className="flex flex-col items-center">
                          {previewUrl ? (
                            <motion.div 
                              className="relative w-48 h-64 mb-4 rounded-xl shadow-lg overflow-hidden"
                              whileHover={{ scale: 1.05, rotate: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            >
                              <Image src={previewUrl || "/placeholder.svg"} alt="Предпросмотр обложки" fill className="object-cover rounded-xl" />
                              <motion.button
                                type="button"
                                onClick={handleRemoveCover}
                                className="absolute top-2 right-2 bg-red-500/90 text-white p-1 rounded-full hover:bg-red-600 transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <X className="h-4 w-4" />
                              </motion.button>
                            </motion.div>
                          ) : (
                            <motion.div
                              className="w-48 h-64 mb-4 flex items-center justify-center backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl border border-white/20 dark:border-gray-700/30 shadow-md text-gray-500 dark:text-gray-400"
                              whileHover={{ scale: 1.02 }}
                            >
                              <BookOpen className="h-12 w-12" />
                            </motion.div>
                          )}
                          <div className="flex gap-2">
                            <motion.button
                              type="button"
                              onClick={() => document.getElementById("coverInput")?.click()}
                              className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Upload className="h-4 w-4" />
                              {previewUrl ? "Изменить обложку" : "Загрузить обложку"}
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={async () => {
                                setShowManualCoverInput(false);
                                if (formValues.isbn || (formValues.title && formValues.authors)) {
                                  let coverUrl = null;
                                  if (formValues.isbn) {
                                    try {
                                      const coverRes = await fetch(
                                        `https://bookcover.longitood.com/bookcover/${formValues.isbn}`
                                      );
                                      if (coverRes.ok) {
                                        const coverData = await coverRes.json();
                                        coverUrl = coverData.url;
                                      }
                                    } catch (error) {
                                      console.error("Ошибка при поиске по ISBN:", error);
                                    }
                                  }
                                  if (!coverUrl && formValues.title && formValues.authors) {
                                    try {
                                      const coverRes = await fetch(
                                        `https://bookcover.longitood.com/bookcover?book_title=${encodeURIComponent(
                                          formValues.title
                                        )}&author_name=${encodeURIComponent(formValues.authors)}`
                                      );
                                      if (coverRes.ok) {
                                        const coverData = await coverRes.json();
                                        coverUrl = coverData.url;
                                      }
                                    } catch (error) {
                                      console.error("Ошибка при поиске по названию и авторам:", error);
                                    }
                                  }
                                  if (coverUrl) {
                                    setValue("cover", coverUrl);
                                    setPreviewUrl(coverUrl);
                                    toast({ title: "Успех", description: "Обложка книги успешно обновлена" });
                                  } else {
                                    const query = encodeURIComponent(formValues.title + " книга обложка");
                                    const searchUrl = `https://cse.google.com/cse?cx=b421413d1a0984f58#gsc.tab=0&gsc.q=${query}`;
                                    window.open(searchUrl, "_blank");
                                    setShowManualCoverInput(true);
                                    toast({
                                      title: "Обложка не найдена",
                                      description: "Поиск открыт в новой вкладке. Вставьте ссылку на обложку.",
                                      variant: "destructive",
                                    });
                                  }
                                } else {
                                  toast({
                                    title: "Ошибка",
                                    description: "Необходимо указать ISBN или название и авторов книги",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Search className="h-4 w-4" />
                              Найти обложку
                            </motion.button>
                          </div>
                          <input
                            id="coverInput"
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="hidden"
                          />
                        </div>
                        {showManualCoverInput && (
                          <div className="flex flex-col w-full max-w-xs">
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                                Вставьте ссылку на обложку
                              </label>
                              <Input
                                placeholder="Ссылка на обложку"
                                value={manualCoverUrl}
                                onChange={(e) => {
                                  setManualCoverUrl(e.target.value);
                                  setValue("cover", e.target.value);
                                  setPreviewUrl(e.target.value);
                                }}
                                className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm text-xs h-8"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Детальная информация */}
                <TabsContent value="details" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Описание книги
                      </label>
                      <Textarea
                        placeholder="Введите описание книги"
                        {...register("description")}
                        rows={7}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm resize-none"
                      />
                      {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Количество страниц
                      </label>
                      <Input
                        type="number"
                        placeholder="Введите количество страниц"
                        min={1}
                        {...register("pageCount", { valueAsNumber: true })}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.pageCount && <p className="text-red-500 text-sm mt-1">{errors.pageCount.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Язык
                      </label>
                      <Input
                        placeholder="Введите язык книги"
                        {...register("language")}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.language && <p className="text-red-500 text-sm mt-1">{errors.language.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Формат книги
                      </label>
                      <Select
                        onValueChange={(value) => setValue("format", value)}
                        defaultValue={initialData?.format || ""}
                      >
                        <SelectTrigger className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm">
                          <SelectValue placeholder="Выберите формат" />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 border border-white/20 dark:border-gray-700/30">
                          <SelectItem value="Твердый переплет">Твердый переплет</SelectItem>
                          <SelectItem value="Мягкий переплет">Мягкий переплет</SelectItem>
                          <SelectItem value="Электронный">Электронный</SelectItem>
                          <SelectItem value="Аудиокнига">Аудиокнига</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.format && <p className="text-red-500 text-sm mt-1">{errors.format.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Цена
                      </label>
                      <Input
                        type="number"
                        placeholder="Введите цену книги"
                        min={0}
                        step="0.01"
                        {...register("price", { valueAsNumber: true })}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Категоризация
                      </label>
                      <Input
                        placeholder="Введите категоризацию"
                        {...register("categorization")}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.categorization && (
                        <p className="text-red-500 text-sm mt-1">{errors.categorization.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        УДК
                      </label>
                      <Input
                        placeholder="Введите УДК"
                        {...register("udk")}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.udk && <p className="text-red-500 text-sm mt-1">{errors.udk.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        ББК
                      </label>
                      <Input
                        placeholder="Введите ББК"
                        {...register("bbk")}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.bbk && <p className="text-red-500 text-sm mt-1">{errors.bbk.message}</p>}
                    </div>
                  </div>
                </TabsContent>

                {/* Дополнительные поля */}
                <TabsContent value="rare-fields" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Оригинальное название
                      </label>
                      <Input
                        placeholder="Введите оригинальное название книги"
                        {...register("originalTitle")}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.originalTitle && (
                        <p className="text-red-500 text-sm mt-1">{errors.originalTitle.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Оригинальный язык
                      </label>
                      <Input
                        placeholder="Введите оригинальный язык книги"
                        {...register("originalLanguage")}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.originalLanguage && (
                        <p className="text-red-500 text-sm mt-1">{errors.originalLanguage.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Издание
                      </label>
                      <Input
                        placeholder="Введите информацию об издании"
                        {...register("edition")}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
                      />
                      {errors.edition && <p className="text-red-500 text-sm mt-1">{errors.edition.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Резюме книги
                      </label>
                      <Textarea
                        placeholder="Введите резюме книги"
                        {...register("summary")}
                        rows={5}
                        className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm resize-none"
                      />
                      {errors.summary && <p className="text-red-500 text-sm mt-1">{errors.summary.message}</p>}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-4 border-t border-white/20 dark:border-gray-700/30 flex flex-col md:flex-row gap-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    try {
                      // Ожидаем, что пользователь скопировал JSON в буфер обмена
                      navigator.clipboard.readText().then(text => {
                        try {
                          const jsonData = JSON.parse(text);
                          
                          // Определение типа данных и выбор соответствующей функции импорта
                          if (jsonData.Title !== undefined && jsonData.Authors !== undefined) {
                            // Это книга
                            fillFormFromJson(jsonData);
                          } else if (jsonData.Category !== undefined && jsonData.Capacity !== undefined && jsonData.ShelfNumber !== undefined) {
                            // Это полка
                            importShelfFromJson(jsonData);
                          } else if (jsonData.ISSN !== undefined || (jsonData.Title !== undefined && jsonData.Publisher !== undefined)) {
                            // Это журнал
                            importJournalFromJson(jsonData);
                          } else {
                            toast({
                              title: "Неизвестный формат",
                              description: "Формат JSON не распознан. Поддерживаются: книги, полки, журналы",
                              variant: "destructive",
                            });
                          }
                        } catch (e) {
                          toast({
                            title: "Ошибка",
                            description: "Не удалось распарсить JSON из буфера обмена",
                            variant: "destructive",
                          });
                        }
                      });
                    } catch (e) {
                      toast({
                        title: "Ошибка",
                        description: "Не удалось получить доступ к буферу обмена",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 w-full md:w-1/3 flex items-center justify-center gap-2 shadow-md backdrop-blur-md"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="h-5 w-5" />
                  Импорт из JSON
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-gray-500/90 hover:bg-gray-600/90 text-white font-medium rounded-lg px-4 py-2 w-full md:w-1/3 flex items-center justify-center gap-2 shadow-md backdrop-blur-md"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="h-5 w-5" />
                  Отмена
                </motion.button>
                
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 w-full md:w-2/3 flex items-center justify-center gap-2 shadow-md backdrop-blur-md disabled:opacity-70"
                  whileHover={!isSubmitting ? { y: -3 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      {mode === "create" ? "Добавить книгу" : "Сохранить изменения"}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </FadeInView>
      </div>

      {/* Модальное окно для выбора полки */}
      <ShelvesModal />
    </div>
  );
};

export default BookForm;
