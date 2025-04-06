"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, Search, FileText, BookmarkIcon, LayoutGrid, BookCopy, X } from "lucide-react";
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
import { Shelf } from "@/lib/types";

interface Position {
  x: number;
  y: number;
}

// Определение стилей glassmorphism, аналогичных главной странице
const getThemeClasses = () => {
  return {
    card: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300 h-full flex flex-col",
    statsCard: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between",
    mainContainer: "bg-gray-100/70 dark:bg-neutral-900/70 backdrop-blur-xl min-h-screen p-6",
    button: "bg-gradient-to-r from-primary-admin/90 to-primary-admin/70 dark:from-primary-admin/80 dark:to-primary-admin/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-5 py-3 flex items-center justify-center gap-2",
    input: "bg-white/40 dark:bg-neutral-300/40 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-4 py-2",
    textarea: "bg-white/40 dark:bg-neutral-300/40 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-4 py-2 resize-none",
    tab: "bg-white/20 dark:bg-neutral-200/20 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-lg",
    tabActive: "bg-primary-admin/90 text-white rounded-lg",
    select: "bg-white/40 dark:bg-neutral-300/40 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg",
    sectionTitle: "text-2xl font-bold mb-4 text-neutral-500 dark:text-white border-b pb-2 border-white/30 dark:border-neutral-700/30",
    statusBadge: {
      completed: "inline-block px-3 py-1 text-sm font-semibold text-white rounded-full bg-green-600/90 backdrop-blur-sm",
      processing: "inline-block px-3 py-1 text-sm font-semibold text-white rounded-full bg-yellow-600/90 backdrop-blur-sm",
      canceled: "inline-block px-3 py-1 text-sm font-semibold text-white rounded-full bg-red-600/90 backdrop-blur-sm",
    },
  };
};

interface BookFormProps extends Partial<BookInput> {
  initialData?: Omit<BookInput, "id" | "dateAdded" | "dateModified">;
  onSubmit: (data: BookInput) => Promise<void>;
  isSubmitting: boolean;
  mode: "create" | "update";
  shelves?: Shelf[];
}

const BookForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  mode,
  shelves = [],
}: BookFormProps) => {
  const router = useRouter();
  const themeClasses = getThemeClasses();

  const [showManualCoverInput, setShowManualCoverInput] = useState(false);
  const [manualCoverUrl, setManualCoverUrl] = useState("");
  const [isbn, setIsbn] = useState<string>(initialData?.ISBN || "");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [geminiImage, setGeminiImage] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [showShelvesModal, setShowShelvesModal] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<number | undefined>(
    initialData?.ShelfId !== undefined ? Number(initialData.ShelfId) : undefined
  );
  const [selectedPosition, setSelectedPosition] = useState<number | undefined>(
    initialData?.Position !== undefined ? Number(initialData.Position) : undefined
  );
  const [draggedShelf, setDraggedShelf] = useState<any | null>(null);
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
      Title: initialData?.Title || "",
      Authors: initialData?.Authors || "",
      ISBN: initialData?.ISBN || "",
      Genre: initialData?.Genre || "",
      Cover: initialData?.Cover || "",
      Description: initialData?.Description || "",
      PublicationYear: initialData?.PublicationYear || new Date().getFullYear(),
      Publisher: initialData?.Publisher || "",
      PageCount: initialData?.PageCount || 0,
      Language: initialData?.Language || "",
      Categorization: initialData?.Categorization || "",
      UDK: initialData?.UDK || "",
      BBK: initialData?.BBK || "",
      Summary: initialData?.Summary || "",
      AvailableCopies: initialData?.AvailableCopies || 1,
      ShelfId: initialData?.ShelfId || undefined,
      Position: initialData?.Position || undefined,
      Edition: initialData?.Edition || "",
      Price: initialData?.Price || undefined,
      Format: initialData?.Format || "",
      OriginalTitle: initialData?.OriginalTitle || "",
      OriginalLanguage: initialData?.OriginalLanguage || "",
      IsEbook: initialData?.IsEbook || false,
      Condition: initialData?.Condition || "",
    },
  });

  const IsEbook = watch("IsEbook");
  const formValues = watch();

  useEffect(() => {
    if (initialData) {
      setIsbn(initialData.ISBN || "");
      if (initialData.ShelfId !== undefined) {
        setSelectedShelf(Number(initialData.ShelfId));
      } 
      if (initialData.Position !== undefined) {
        setSelectedPosition(Number(initialData.Position));
      }
    }
    if (initialData?.Cover) setPreviewUrl(initialData.Cover);
  }, [initialData]);

  useEffect(() => {
    if (geminiImage) handleGeminiUpload();
  }, [geminiImage]);

  // Функция для дополнительной валидации формы
  const validateFormBeforeSubmit = () => {
    const requiredFields = ["Title", "Authors"];
    const missingFields = requiredFields.filter(field => !formValues[field as keyof typeof formValues]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Ошибка валидации",
        description: `Следующие поля обязательны: ${missingFields.join(", ")}`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

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
        setValue("Title", bookData.title || "");
        setValue("Description", bookData.description || "");
        setValue("Cover", bookData.imageLinks?.thumbnail || "");
        setValue("ISBN", isbn);
        setValue("Publisher", bookData.publisher || "");
        setValue("PageCount", bookData.pageCount || 0);
        setValue("Language", bookData.language || "");
        setValue(
          "PublicationYear",
          bookData.publishedDate ? parseInt(bookData.publishedDate.substring(0, 4)) : new Date().getFullYear()
        );
        if (bookData.authors && bookData.authors.length > 0) setValue("Authors", bookData.authors.join(", "));
        if (bookData.imageLinks?.thumbnail) setPreviewUrl(bookData.imageLinks.thumbnail);
        toast({ title: "Данные получены", description: "Информация о книге успешно заполнена" });
      } else {
        setValue("ISBN", isbn);
        toast({
          title: "Книга не найдена",
          description: "Проверьте правильность ISBN.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setValue("ISBN", isbn);
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
          setValue("Cover", event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCover = () => {
    setPreviewUrl(null);
    setValue("Cover", "");
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
      <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <FileText className="w-8 h-8 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">Перетащите файл сюда или нажмите для загрузки</p>
          {fileName && <p className="text-xs text-gray-400">{fileName}</p>}
        </div>
        <input type="file" accept="image/*" onChange={handleChange} className="absolute inset-0 opacity-0" />
      </label>
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
                text: "Отвечать пользователю по-русски. Отвечать в формате json без вступлений и заключений. Задача- заполнять поля у книг. Модель книги содержит следующие поля: Id(Guid), Title(строка 255), Authors(строка 500), ISBN(строка), Genre(строка 100), Categorization(строка 100), UDK(строка), BBK(строка 20), Cover всегда оставляй null, Description(строка), PublicationYear(число), Publisher(строка 100), PageCount(число), Language(строка 50), AvailableCopies(число), DateAdded(дата), DateModified(дата), Edition(строка 50), Price(decimal), format(строка 100), OriginalTitle(строка 255), OriginalLanguage(строка 50), IsEbook(boolean), Condition(строка 100), ShelfId(число). Если информации нет, оставь null, цену ставь = 0. Ищи в интернете жанры книги по названию и автору, и заполняй резюме книги(Summary). Не путай резюме(Summary) и описание(Description), которое написано в фото.",
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
        let Cover = null;

        if (parsedData.isbn) {
          try {
            const coverRes = await fetch(`https://bookcover.longitood.com/bookcover/${parsedData.ISBN}`);
            if (coverRes.ok) {
              const coverData = await coverRes.json();
              if (coverData.url) Cover = coverData.url;
            }
          } catch (error) {
            console.error("Ошибка при поиске обложки по ISBN:", error);
          }
        }

        if (!Cover && parsedData.Title && parsedData.Authors) {
          try {
            const coverRes = await fetch(
              `https://bookcover.longitood.com/bookcover?book_title=${encodeURIComponent(
                parsedData.Title
              )}&author_name=${encodeURIComponent(parsedData.Authors)}`
            );
            if (coverRes.ok) {
              const coverData = await coverRes.json();
              if (coverData.url) Cover = coverData.url;
            }
          } catch (error) {
            console.error("Ошибка при поиске обложки по названию и автору:", error);
          }
        }

        if (!Cover && (parsedData.ISBN || (parsedData.Title && parsedData.Authors))) {
          try {
            const query = parsedData.ISBN
              ? `ISBN:${parsedData.ISBN}`
              : `intitle:${parsedData.Title} inauthor:${parsedData.Authors}`;
            const googleBooksRes = await fetch(
              `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
            );
            if (googleBooksRes.ok) {
              const booksData = await googleBooksRes.json();
              if (booksData.items && booksData.items.length > 0 && booksData.items[0].volumeInfo?.imageLinks) {
                Cover =
                  booksData.items[0].volumeInfo.imageLinks.large ||
                  booksData.items[0].volumeInfo.imageLinks.medium ||
                  booksData.items[0].volumeInfo.imageLinks.thumbnail;
              }
            }
          } catch (error) {
            console.error("Ошибка при поиске обложки через Google Books API:", error);
          }
        }

        if (!Cover) {
          const query = encodeURIComponent(formValues.Title + " книга обложка");
          const searchUrl = `https://cse.google.com/cse?cx=b421413d1a0984f58#gsc.tab=0&gsc.q=${query}`;
          window.open(searchUrl, "_blank");
          setShowManualCoverInput(true);
          toast({
            title: "Обложка не найдена",
            description: "Поиск открыт в новой вкладке. Вставьте ссылку на обложку.",
            variant: "destructive",
          });
        } else {
          setValue("Cover", Cover);
          setPreviewUrl(Cover);
          toast({
            title: "Данные получены",
            description: "Обложка книги успешно получена.",
          });
        }

        if (parsedData.Title) setValue("Title", parsedData.Title);
        if (parsedData.Authors) setValue("Authors", parsedData.Authors);
        if (parsedData.Genre) setValue("Genre", parsedData.Genre);
        if (parsedData.Categorization) setValue("Categorization", parsedData.Categorization);
        if (parsedData.UDK) setValue("UDK", parsedData.UDK);
        if (parsedData.BBK) setValue("BBK", parsedData.BBK);
        if (parsedData.ISBN) setValue("ISBN", parsedData.ISBN);
        if (parsedData.Description) setValue("Description", parsedData.Description);
        if (parsedData.Summary) setValue("Summary", parsedData.Summary);
        if (parsedData.PublicationYear) setValue("PublicationYear", parsedData.PublicationYear);
        if (parsedData.Publisher) setValue("Publisher", parsedData.Publisher);
        if (parsedData.PageCount) setValue("PageCount", parsedData.PageCount);
        if (parsedData.Language) setValue("Language", parsedData.Language);
        if (parsedData.AvailableCopies) setValue("AvailableCopies", parsedData.AvailableCopies);
        if (parsedData.Edition) setValue("Edition", parsedData.Edition);
        if (parsedData.Price) setValue("Price", parsedData.Price);
        if (parsedData.Format) setValue("Format", parsedData.Format);
        if (parsedData.OriginalTitle) setValue("OriginalTitle", parsedData.OriginalTitle);
        if (parsedData.OriginalLanguage) setValue("OriginalLanguage", parsedData.OriginalLanguage);
        if (parsedData.IsEbook !== undefined) setValue("IsEbook", parsedData.IsEbook);
        if (parsedData.Condition) setValue("Condition", parsedData.Condition);
        if (parsedData.ShelfId) setValue("ShelfId", parsedData.ShelfId);
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

  const handleDragStart = (e: React.MouseEvent, shelf: any) => {
    const container = document.getElementById('shelf-editor');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    setMousePosition({
      x: e.clientX - rect.left - shelf.PosX,
      y: e.clientY - rect.top - shelf.PosY,
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
    
    setDraggedShelf({...draggedShelf, PosX: newX, PosY: newY});
  };

  const handleDragEnd = () => {
    setDraggedShelf(null);
  };

  const handleEmptySlotClick = (shelfId: number, position: number) => {
    setSelectedShelf(shelfId);
    setSelectedPosition(position);
    setValue("ShelfId", shelfId);
    setValue("Position", position);
    setShowShelvesModal(false);
  };

  const onFormSubmit = async (values: z.infer<typeof bookSchema>) => {
    try {
      if (!validateFormBeforeSubmit()) {
        return;
      }
      
      console.log("Отправка формы с данными:", values);
      await onSubmit(values);
    } catch (error) {
      console.error("Ошибка при отправке формы:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении книги",
        variant: "destructive",
      });
    }
  };

  const ShelvesModal = () => {
    return (
      <Dialog open={showShelvesModal} onOpenChange={setShowShelvesModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Выберите полку и позицию</DialogTitle>
            <DialogDescription>
              Нажмите на полку, затем выберите позицию для книги
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 my-4">
            <div className="grid gap-3">
              <Label>Доступные полки</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-2">
                {shelves && shelves.length > 0 ? (
                  shelves.map((shelf) => (
                    <div
                      key={shelf.Id}
                      className={`p-3 rounded-md border ${
                        selectedShelf === shelf.Id
                          ? "border-primary bg-primary/10"
                          : "border-border"
                      } cursor-pointer hover:bg-accent transition-colors`}
                      onClick={() => setSelectedShelf(shelf.Id)}
                    >
                      <div className="font-medium">{shelf.Category}</div>
                      <div className="text-sm text-muted-foreground">
                        Мест: {shelf.Capacity}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Категория: {shelf.Category || "Общая"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground col-span-full text-center py-4">
                    Нет доступных полок
                  </div>
                )}
              </div>
            </div>
            
            {selectedShelf && (
              <div className="grid gap-3">
                <Label>Выберите позицию на полке {shelves.find(s => s.Id === selectedShelf)?.Category || 'N/A'}</Label>
                <div className="flex flex-wrap gap-2 bg-accent/50 p-3 rounded-md max-h-[200px] overflow-y-auto">
                  {Array.from({ length: shelves.find(s => s.Id === selectedShelf)?.Capacity || 0 }).map((_, i) => {
                    // Проверяем занятость позиции (если в модели есть такой метод)
                    const isOccupied = false; // По умолчанию считаем позицию свободной
                    
                    // Проверяем, является ли это текущей редактируемой книгой
                    const isCurrentBook = 
                      initialData?.ShelfId === selectedShelf && 
                      initialData?.Position === i;
                      
                    return (
                      <div
                        key={`shelf-position-${selectedShelf}-${i}`}
                        className={`w-10 h-12 flex items-center justify-center rounded-md cursor-pointer transition-all ${
                          selectedPosition === i
                            ? "bg-primary text-primary-foreground"
                            : isOccupied && !isCurrentBook
                            ? "bg-red-500/30 cursor-not-allowed"
                            : "bg-background border border-border hover:bg-accent"
                        }`}
                        onClick={() => {
                          if (!isOccupied || isCurrentBook) {
                            setSelectedPosition(i);
                          }
                        }}
                      >
                        {i}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShelvesModal(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                if (selectedShelf !== undefined && selectedPosition !== undefined) {
                  setValue("ShelfId", selectedShelf);
                  setValue("Position", selectedPosition);
                  setShowShelvesModal(false);
                }
              }}
              disabled={selectedShelf === undefined || selectedPosition === undefined}
            >
              Выбрать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses.mainContainer}`}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/30 dark:bg-neutral-100/30 border-b border-white/20 dark:border-neutral-700/20 p-4 flex items-center justify-between shadow-sm mb-6">
        <h1 className="text-2xl font-bold text-neutral-500 dark:text-white">
          {mode === "create" ? "Добавление новой книги" : "Редактирование книги"}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto space-y-8 p-6">
        <Card className={themeClasses.card}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center text-neutral-500 dark:text-white">
              <BookOpen className="mr-2 h-6 w-6 text-primary-admin" />
              {mode === "create" ? "Добавление книги" : "Редактирование книги"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gemini AI Block */}
            <div className={`${themeClasses.statsCard}`}>
              <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                Загрузить изображение для сканирования обложки книги
              </label>
              <GeminiFileUpload onFileChange={handleGeminiFileChange} />
              {geminiLoading && (
                <div className="flex items-center mt-2">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Обработка изображения...</span>
                </div>
              )}
              {geminiImage && !geminiLoading && (
                <Button onClick={handleGeminiUpload} variant="outline" size="sm" className="mt-2">
                  Перезагрузить
                </Button>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 gap-4 mb-8 w-full bg-transparent h-12">
                  <TabsTrigger
                    value="basic-info"
                    className={`${themeClasses.tab} ${activeTab === "basic-info" ? themeClasses.tabActive : ""} flex items-center justify-center`}
                  >
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                    Основная информация
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className={`${themeClasses.tab} ${activeTab === "details" ? themeClasses.tabActive : ""} flex items-center justify-center`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Детальная информация
                  </TabsTrigger>
                  <TabsTrigger
                    value="rare-fields"
                    className={`${themeClasses.tab} ${activeTab === "rare-fields" ? themeClasses.tabActive : ""} flex items-center justify-center`}
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Дополнительно
                  </TabsTrigger>
                </TabsList>

                {/* Основная информация */}
                <TabsContent value="basic-info" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Название книги *
                      </label>
                      <Input
                        placeholder="Введите название книги"
                        {...register("Title")}
                        className={themeClasses.input}
                      />
                      {errors.Title && <p className="text-red-500 text-sm mt-1">{errors.Title.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Авторы *
                      </label>
                      <Input
                        placeholder="Введите имена авторов через запятую"
                        {...register("Authors")}
                        className={themeClasses.input}
                      />
                      {errors.Authors && <p className="text-red-500 text-sm mt-1">{errors.Authors.message}</p>}
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="isbn">ISBN</Label>
                      <div className="relative">
                        <Input
                          id="isbn"
                          placeholder="000-0000000000"
                          className={cn(
                            errors.ISBN && "focus-visible:ring-red-500"
                          )}
                          value={isbn}
                          {...register("ISBN", {
                            onChange: (e) => {
                              setIsbn(e.target.value);
                            },
                            value: isbn
                          })}
                        />
                        {errors.ISBN && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.ISBN.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Жанр
                      </label>
                      <Input
                        placeholder="Введите жанр книги"
                        {...register("Genre")}
                        className={themeClasses.input}
                      />
                      {errors.Genre && <p className="text-red-500 text-sm mt-1">{errors.Genre.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Год публикации
                      </label>
                      <Input
                        type="number"
                        placeholder="Введите год публикации"
                        min={1000}
                        max={new Date().getFullYear()}
                        {...register("PublicationYear", { valueAsNumber: true })}
                        className={themeClasses.input}
                      />
                      {errors.PublicationYear && (
                        <p className="text-red-500 text-sm mt-1">{errors.PublicationYear.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Издательство
                      </label>
                      <Input
                        placeholder="Введите название издательства"
                        {...register("Publisher")}
                        className={themeClasses.input}
                      />
                      {errors.Publisher && <p className="text-red-500 text-sm mt-1">{errors.Publisher.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                          id="IsEbook"
                          checked={IsEbook}
                          onCheckedChange={(checked) => setValue("IsEbook", checked === true)}
                        />
                        <label className="text-base font-semibold text-neutral-500 dark:text-white">
                          Электронная книга
                        </label>
                      </div>
                    </div>

                    {!IsEbook && (
                      <>
                        <div>
                          <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                            Доступные экземпляры
                          </label>
                          <Input
                            type="number"
                            placeholder="Введите количество доступных экземпляров"
                            min={0}
                            {...register("AvailableCopies", { valueAsNumber: true })}
                            className={themeClasses.input}
                          />
                          {errors.AvailableCopies && (
                            <p className="text-red-500 text-sm mt-1">{errors.AvailableCopies.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                            Состояние книги
                          </label>
                          <Select
                            onValueChange={(value) => setValue("Condition", value)}
                            defaultValue={initialData?.Condition || ""}
                          >
                            <SelectTrigger className={themeClasses.select}>
                              <SelectValue placeholder="Выберите состояние" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Новое">Новое</SelectItem>
                              <SelectItem value="Б/У">Б/У</SelectItem>
                              <SelectItem value="Не определено">Не определено</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.Condition && <p className="text-red-500 text-sm mt-1">{errors.Condition.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                            Расположение на полке
                          </label>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <Button
                                  type="button"
                                  onClick={() => setShowShelvesModal(true)}
                                  className={`${themeClasses.button} w-full flex items-center justify-center`}
                                >
                                  <BookCopy className="h-4 w-4 mr-2" />
                                  {selectedShelf && selectedPosition !== undefined 
                                    ? `Полка: ${shelves.find(s => s.Id === selectedShelf)?.Category || 'N/A'} #${shelves.find(s => s.Id === selectedShelf)?.ShelfNumber || 'N/A'}, Позиция: ${selectedPosition + 1}` 
                                    : "Выбрать расположение"}
                                </Button>
                              </div>
                              {selectedShelf && selectedPosition !== undefined && (
                                <Button
                                  type="button"
                                  onClick={() => {
                                    setSelectedShelf(undefined);
                                    setSelectedPosition(undefined);
                                    setValue("ShelfId", undefined);
                                    setValue("Position", undefined);
                                  }}
                                  variant="outline"
                                  className="px-3"
                                >
                                  <X size={16} />
                                </Button>
                              )}
                            </div>
                            <input type="hidden" {...register("ShelfId")} />
                            <input type="hidden" {...register("Position")} />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2 text-center">
                        Обложка книги
                      </label>
                      <div className="flex flex-row gap-4 justify-center">
                        <div className="flex flex-col items-center">
                          {previewUrl ? (
                            <div className="relative w-48 h-64 mb-4 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
                              <Image src={previewUrl} alt="Предпросмотр обложки" fill className="object-cover rounded-xl" />
                              <button
                                type="button"
                                onClick={handleRemoveCover}
                                className="absolute top-2 right-2 bg-red-500/90 text-white p-1 rounded-full hover:bg-red-500 transition-all duration-200"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`${themeClasses.card} w-48 h-64 mb-4 flex items-center justify-center text-neutral-500 dark:text-neutral-400`}
                            >
                              Нет обложки
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={() => document.getElementById("coverInput")?.click()}
                              className={themeClasses.button}
                            >
                              {previewUrl ? "Изменить обложку" : "Загрузить обложку"}
                            </Button>
                            <Button
                              type="button"
                              onClick={async () => {
                                setShowManualCoverInput(false);
                                if (formValues.ISBN || (formValues.Title && formValues.Authors)) {
                                  let coverUrl = null;
                                  if (formValues.ISBN) {
                                    try {
                                      const coverRes = await fetch(
                                        `https://bookcover.longitood.com/bookcover/${formValues.ISBN}`
                                      );
                                      if (coverRes.ok) {
                                        const coverData = await coverRes.json();
                                        coverUrl = coverData.url;
                                      }
                                    } catch (error) {
                                      console.error("Ошибка при поиске по ISBN:", error);
                                    }
                                  }
                                  if (!coverUrl && formValues.Title && formValues.Authors) {
                                    try {
                                      const coverRes = await fetch(
                                        `https://bookcover.longitood.com/bookcover?book_title=${encodeURIComponent(
                                          formValues.Title
                                        )}&author_name=${encodeURIComponent(formValues.Authors)}`
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
                                    setValue("Cover", coverUrl);
                                    setPreviewUrl(coverUrl);
                                    toast({ title: "Успех", description: "Обложка книги успешно обновлена" });
                                  } else {
                                    const query = encodeURIComponent(formValues.Title + " книга обложка");
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
                              className={themeClasses.button}
                            >
                              Обновить обложку
                            </Button>
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
                              <label className="block text-xs font-semibold text-neutral-500 dark:text-white mb-1">
                                Вставьте ссылку на обложку
                              </label>
                              <Input
                                placeholder="Ссылка на обложку"
                                value={manualCoverUrl}
                                onChange={(e) => {
                                  setManualCoverUrl(e.target.value);
                                  setValue("Cover", e.target.value);
                                  setPreviewUrl(e.target.value);
                                }}
                                className={`${themeClasses.input} text-xs h-8`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Детальная информация */}
                <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Описание книги
                      </label>
                      <Textarea
                        placeholder="Введите описание книги"
                        {...register("Description")}
                        rows={7}
                        className={themeClasses.textarea}
                      />
                      {errors.Description && <p className="text-red-500 text-sm mt-1">{errors.Description.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Количество страниц
                      </label>
                      <Input
                        type="number"
                        placeholder="Введите количество страниц"
                        min={1}
                        {...register("PageCount", { valueAsNumber: true })}
                        className={themeClasses.input}
                      />
                      {errors.PageCount && <p className="text-red-500 text-sm mt-1">{errors.PageCount.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Язык
                      </label>
                      <Input
                        placeholder="Введите язык книги"
                        {...register("Language")}
                        className={themeClasses.input}
                      />
                      {errors.Language && <p className="text-red-500 text-sm mt-1">{errors.Language.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Формат книги
                      </label>
                      <Select
                        onValueChange={(value) => setValue("Format", value)}
                        defaultValue={initialData?.Format || ""}
                      >
                        <SelectTrigger className={themeClasses.select}>
                          <SelectValue placeholder="Выберите формат" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Твердый переплет">Твердый переплет</SelectItem>
                          <SelectItem value="Мягкий переплет">Мягкий переплет</SelectItem>
                          <SelectItem value="Электронный">Электронный</SelectItem>
                          <SelectItem value="Аудиокнига">Аудиокнига</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.Format && <p className="text-red-500 text-sm mt-1">{errors.Format.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Цена
                      </label>
                      <Input
                        type="number"
                        placeholder="Введите цену книги"
                        min={0}
                        step="0.01"
                        {...register("Price", { valueAsNumber: true })}
                        className={themeClasses.input}
                      />
                      {errors.Price && <p className="text-red-500 text-sm mt-1">{errors.Price.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Категоризация
                      </label>
                      <Input
                        placeholder="Введите категоризацию"
                        {...register("Categorization")}
                        className={themeClasses.input}
                      />
                      {errors.Categorization && (
                        <p className="text-red-500 text-sm mt-1">{errors.Categorization.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        УДК
                      </label>
                      <Input
                        placeholder="Введите УДК"
                        {...register("UDK")}
                        className={themeClasses.input}
                      />
                      {errors.UDK && <p className="text-red-500 text-sm mt-1">{errors.UDK.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        ББК
                      </label>
                      <Input
                        placeholder="Введите ББК"
                        {...register("BBK")}
                        className={themeClasses.input}
                      />
                      {errors.BBK && <p className="text-red-500 text-sm mt-1">{errors.BBK.message}</p>}
                    </div>
                  </div>
                </TabsContent>

                {/* Дополнительные поля */}
                <TabsContent value="rare-fields" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Оригинальное название
                      </label>
                      <Input
                        placeholder="Введите оригинальное название книги"
                        {...register("OriginalTitle")}
                        className={themeClasses.input}
                      />
                      {errors.OriginalTitle && (
                        <p className="text-red-500 text-sm mt-1">{errors.OriginalTitle.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Оригинальный язык
                      </label>
                      <Input
                        placeholder="Введите оригинальный язык книги"
                        {...register("OriginalLanguage")}
                        className={themeClasses.input}
                      />
                      {errors.OriginalLanguage && (
                        <p className="text-red-500 text-sm mt-1">{errors.OriginalLanguage.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Издание
                      </label>
                      <Input
                        placeholder="Введите информацию об издании"
                        {...register("Edition")}
                        className={themeClasses.input}
                      />
                      {errors.Edition && <p className="text-red-500 text-sm mt-1">{errors.Edition.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Резюме книги
                      </label>
                      <Textarea
                        placeholder="Введите резюме книги"
                        {...register("Summary")}
                        rows={5}
                        className={themeClasses.textarea}
                      />
                      {errors.Summary && <p className="text-red-500 text-sm mt-1">{errors.Summary.message}</p>}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-4 border-t border-white/10 dark:border-neutral-700/30 flex flex-col md:flex-row gap-4">
                <Button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-neutral-500/90 hover:bg-neutral-500 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-3 md:w-1/3"
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  className={`${themeClasses.button} py-3 md:w-2/3`}
                  onClick={async () => {
                    // Логируем ошибки при нажатии кнопки для отладки
                    if (Object.keys(errors).length > 0) {
                      console.error("Ошибки валидации формы:", errors);
                      toast({
                        title: "Ошибка валидации",
                        description: "Исправьте ошибки в форме перед отправкой",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    if (!validateFormBeforeSubmit()) {
                      return;
                    }
                    
                    try {
                      const formData = {
                        Title: formValues.Title,
                        Authors: formValues.Authors,
                        ISBN: formValues.ISBN,
                        Genre: formValues.Genre,
                        Cover: formValues.Cover,
                        Description: formValues.Description,
                        PublicationYear: formValues.PublicationYear,
                        Publisher: formValues.Publisher,
                        PageCount: formValues.PageCount,
                        Language: formValues.Language,
                        Categorization: formValues.Categorization,
                        UDK: formValues.UDK,
                        BBK: formValues.BBK,
                        Summary: formValues.Summary,
                        AvailableCopies: formValues.AvailableCopies,
                        ShelfId: formValues.ShelfId,
                        Position: formValues.Position,
                        Edition: formValues.Edition,
                        Price: formValues.Price,
                        Format: formValues.Format,
                        OriginalTitle: formValues.OriginalTitle,
                        OriginalLanguage: formValues.OriginalLanguage,
                        IsEbook: formValues.IsEbook,
                        Condition: formValues.Condition,
                      };
                      
                      console.log("Отправка формы с данными (прямая отправка):", formData);
                      await onSubmit(formData);
                    } catch (error) {
                      console.error("Ошибка при отправке формы (прямая отправка):", error);
                      toast({
                        title: "Ошибка",
                        description: "Произошла ошибка при сохранении книги",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5 mr-2" />
                      {mode === "create" ? "Добавить книгу" : "Сохранить изменения"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Модальное окно для выбора полки */}
      <ShelvesModal />
    </div>
  );
};

export default BookForm;