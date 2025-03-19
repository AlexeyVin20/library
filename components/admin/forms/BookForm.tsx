"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, Search, FileText, BookmarkIcon, LayoutGrid } from "lucide-react";
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
  shelves?: Array<{ id: number; category: string; shelfNumber: number }>;
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
  const [isbn, setIsbn] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [geminiImage, setGeminiImage] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

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
      edition: initialData?.edition || "",
      price: initialData?.price || undefined,
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
    if (initialData?.cover) setPreviewUrl(initialData.cover);
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

  const onFormSubmit = async (values: z.infer<typeof bookSchema>) => {
    await onSubmit(values);
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
                        {...register("title")}
                        className={themeClasses.input}
                      />
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Авторы *
                      </label>
                      <Input
                        placeholder="Введите имена авторов через запятую"
                        {...register("authors")}
                        className={themeClasses.input}
                      />
                      {errors.authors && <p className="text-red-500 text-sm mt-1">{errors.authors.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        ISBN *
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Введите ISBN книги"
                          {...register("isbn")}
                          className={themeClasses.input}
                          onChange={(e) => setIsbn(e.target.value)}
                          value={watch("isbn")}
                        />
                        <Button
                          type="button"
                          onClick={handleFetchByISBN}
                          className={themeClasses.button}
                          disabled={isSearchLoading}
                        >
                          {isSearchLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errors.isbn && <p className="text-red-500 text-sm mt-1">{errors.isbn.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Жанр
                      </label>
                      <Input
                        placeholder="Введите жанр книги"
                        {...register("genre")}
                        className={themeClasses.input}
                      />
                      {errors.genre && <p className="text-red-500 text-sm mt-1">{errors.genre.message}</p>}
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
                        {...register("publicationYear", { valueAsNumber: true })}
                        className={themeClasses.input}
                      />
                      {errors.publicationYear && (
                        <p className="text-red-500 text-sm mt-1">{errors.publicationYear.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Издательство
                      </label>
                      <Input
                        placeholder="Введите название издательства"
                        {...register("publisher")}
                        className={themeClasses.input}
                      />
                      {errors.publisher && <p className="text-red-500 text-sm mt-1">{errors.publisher.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                          id="isEbook"
                          checked={isEbook}
                          onCheckedChange={(checked) => setValue("isEbook", checked === true)}
                        />
                        <label className="text-base font-semibold text-neutral-500 dark:text-white">
                          Электронная книга
                        </label>
                      </div>
                    </div>

                    {!isEbook && (
                      <>
                        <div>
                          <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                            Доступные экземпляры
                          </label>
                          <Input
                            type="number"
                            placeholder="Введите количество доступных экземпляров"
                            min={0}
                            {...register("availableCopies", { valueAsNumber: true })}
                            className={themeClasses.input}
                          />
                          {errors.availableCopies && (
                            <p className="text-red-500 text-sm mt-1">{errors.availableCopies.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                            Состояние книги
                          </label>
                          <Select
                            onValueChange={(value) => setValue("condition", value)}
                            defaultValue={initialData?.condition || ""}
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
                          {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition.message}</p>}
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
                                  setValue("cover", e.target.value);
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
                        {...register("description")}
                        rows={7}
                        className={themeClasses.textarea}
                      />
                      {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Количество страниц
                      </label>
                      <Input
                        type="number"
                        placeholder="Введите количество страниц"
                        min={1}
                        {...register("pageCount", { valueAsNumber: true })}
                        className={themeClasses.input}
                      />
                      {errors.pageCount && <p className="text-red-500 text-sm mt-1">{errors.pageCount.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Язык
                      </label>
                      <Input
                        placeholder="Введите язык книги"
                        {...register("language")}
                        className={themeClasses.input}
                      />
                      {errors.language && <p className="text-red-500 text-sm mt-1">{errors.language.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Формат книги
                      </label>
                      <Select
                        onValueChange={(value) => setValue("format", value)}
                        defaultValue={initialData?.format || ""}
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
                      {errors.format && <p className="text-red-500 text-sm mt-1">{errors.format.message}</p>}
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
                        {...register("price", { valueAsNumber: true })}
                        className={themeClasses.input}
                      />
                      {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Категоризация
                      </label>
                      <Input
                        placeholder="Введите категоризацию"
                        {...register("categorization")}
                        className={themeClasses.input}
                      />
                      {errors.categorization && (
                        <p className="text-red-500 text-sm mt-1">{errors.categorization.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        УДК
                      </label>
                      <Input
                        placeholder="Введите УДК"
                        {...register("udk")}
                        className={themeClasses.input}
                      />
                      {errors.udk && <p className="text-red-500 text-sm mt-1">{errors.udk.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        ББК
                      </label>
                      <Input
                        placeholder="Введите ББК"
                        {...register("bbk")}
                        className={themeClasses.input}
                      />
                      {errors.bbk && <p className="text-red-500 text-sm mt-1">{errors.bbk.message}</p>}
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
                        {...register("originalTitle")}
                        className={themeClasses.input}
                      />
                      {errors.originalTitle && (
                        <p className="text-red-500 text-sm mt-1">{errors.originalTitle.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Оригинальный язык
                      </label>
                      <Input
                        placeholder="Введите оригинальный язык книги"
                        {...register("originalLanguage")}
                        className={themeClasses.input}
                      />
                      {errors.originalLanguage && (
                        <p className="text-red-500 text-sm mt-1">{errors.originalLanguage.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Издание
                      </label>
                      <Input
                        placeholder="Введите информацию об издании"
                        {...register("edition")}
                        className={themeClasses.input}
                      />
                      {errors.edition && <p className="text-red-500 text-sm mt-1">{errors.edition.message}</p>}
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                        Резюме книги
                      </label>
                      <Textarea
                        placeholder="Введите резюме книги"
                        {...register("summary")}
                        rows={5}
                        className={themeClasses.textarea}
                      />
                      {errors.summary && <p className="text-red-500 text-sm mt-1">{errors.summary.message}</p>}
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
                  type="submit"
                  disabled={isSubmitting}
                  className={`${themeClasses.button} py-3 md:w-2/3`}
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
    </div>
  );
};

export default BookForm;