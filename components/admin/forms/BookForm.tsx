"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, Search, FileText, BookmarkIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { bookSchema } from "@/lib/validations";
import { BookInput } from "@/lib/admin/actions/book";

// Props for using the form in both create and update modes.
interface BookFormProps extends Partial<BookInput> {
  initialData?: Omit<BookInput, "id" | "dateAdded" | "dateModified">;
  onSubmit: (data: BookInput) => Promise<void>;
  isSubmitting: boolean;
  mode: "create" | "update";
}

const BookForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  mode,
  ...book
}: BookFormProps) => {
  const router = useRouter();

  // Local state for ISBN search
  const [isbn, setIsbn] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic-info");

  // Local state for cover preview (image URL) and file
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    setValue,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: initialData?.title || "",
      authors: initialData?.authors || "",
      genre: initialData?.genre || "",
      categorization: initialData?.categorization || "",
      isbn: initialData?.isbn || "",
      cover: initialData?.cover || "",
      description: initialData?.description || "",
      summary: initialData?.summary || "",
      publicationYear:
        initialData?.publicationYear || new Date().getFullYear(),
      publisher: initialData?.publisher || "",
      pageCount: initialData?.pageCount || 0,
      language: initialData?.language || "",
      availableCopies: initialData?.availableCopies || 1,
    },
  });

  // Watch form values for debugging
  const formValues = watch();

  // Set cover preview if initial data includes cover
  useEffect(() => {
    if (initialData?.cover) {
      setPreviewUrl(initialData.cover);
    }
    
    // Log initial data to verify
    console.log("Initial data:", initialData);
    console.log("Form values after init:", formValues);
  }, [initialData, setValue, formValues]);

  // Handler for ISBN lookup using Google Books API
  const handleFetchByISBN = async () => {
    if (!isbn) {
      toast({
        title: "Ошибка",
        description: "Введите ISBN для поиска",
        variant: "destructive",
      });
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
          bookData.publishedDate
            ? parseInt(bookData.publishedDate.substring(0, 4))
            : new Date().getFullYear()
        );
        if (bookData.authors && bookData.authors.length > 0) {
          setValue("authors", bookData.authors.join(", "));
        }
        if (bookData.imageLinks?.thumbnail) {
          setPreviewUrl(bookData.imageLinks.thumbnail);
        }
        toast({
          title: "Данные получены",
          description: "Информация о книге успешно заполнена",
        });
      } else {
        toast({
          title: "Книга не найдена",
          description: "Проверьте правильность ISBN",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Ошибка при поиске по ISBN",
        variant: "destructive",
      });
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Handler for cover file change
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

  // Remove cover image
  const handleRemoveCover = () => {
    setPreviewUrl(null);
    setValue("cover", "");
  };

  // On form submit
  const onFormSubmit = async (values: z.infer<typeof bookSchema>) => {
    await onSubmit(values);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8 shadow-lg border-t-4 border-t-blue-500">
        <CardHeader className="bg-gray-50 rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center">
            <BookOpen className="mr-2 h-6 w-6 text-blue-600" />
            {mode === "create" ? "Добавление новой книги" : "Редактирование книги"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* ISBN Search Card */}
          <Card className="mb-6 border border-blue-100 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex gap-2 items-end">
                <div className="w-full">
                  <label className="block text-base font-semibold mb-1 flex items-center">
                    <Search className="h-4 w-4 mr-2 text-blue-600" />
                    Поиск по ISBN
                  </label>
                  <Input
                    placeholder="Введите ISBN для автозаполнения данных"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    className="book-form_input focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleFetchByISBN}
                  className="whitespace-nowrap cursor-pointer pointer-events-auto z-10 bg-blue hover: bg-blue-100"
                  disabled={isSearchLoading}
                >
                  {isSearchLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Сканировать ISBN
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-8 w-full">
                <TabsTrigger value="basic-info" className="flex items-center justify-center bg-blue-200">
                  <BookmarkIcon className="h-4 w-4 mr-2" />
                  Основная информация
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center justify-center bg-blue-200">
                  <FileText className="h-4 w-4 mr-2" />
                  Детали книги
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic-info" className="space-y-6 ">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 border-transparent">
                    <label
                      htmlFor="title"
                      className="block text-base font-semibold"
                    >
                      Название книги *
                    </label>
                    <Input
                      id="title"
                      placeholder="Введите название книги"
                      {...register("title")}
                      className="book-form_input focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="authors"
                      className="block text-base font-semibold"
                    >
                      Авторы *
                    </label>
                    <Input
                      id="authors"
                      placeholder="Введите имена авторов через запятую"
                      {...register("authors")}
                      className="book-form_input focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.authors && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.authors.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="isbn"
                      className="block text-base font-semibold"
                    >
                      ISBN *
                    </label>
                    <Input
                      id="isbn"
                      placeholder="Введите ISBN книги"
                      {...register("isbn")}
                      className="book-form_input focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.isbn && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.isbn.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="genre"
                      className="block text-base font-semibold"
                    >
                      Жанр
                    </label>
                    <Input
                      id="genre"
                      placeholder="Введите жанр книги"
                      {...register("genre")}
                      className="book-form_input focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.genre && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.genre.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 flex justify-center">
                    <div>
                      <label
                        htmlFor="cover"
                        className="block text-base font-semibold text-center mb-2"
                      >
                        Обложка книги
                      </label>
                      <div className="flex flex-col items-center">
                        {previewUrl ? (
                          <div className="relative w-48 h-64 mb-4 shadow-lg rounded overflow-hidden">
                            <Image
                              src={previewUrl}
                              alt="Предпросмотр обложки"
                              fill
                              className="object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveCover}
                              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="w-48 h-64 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center mb-4 bg-gray-50 bg-transparent">
                            <span className="text-gray-500">Нет обложки</span>
                          </div>
                        )}
                        <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-flex items-center">
                          {previewUrl ? "Изменить обложку" : "Загрузить обложку"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="publicationYear"
                      className="block text-base font-semibold"
                    >
                      Год публикации
                    </label>
                    <Input
                      type="number"
                      id="publicationYear"
                      placeholder="Введите год публикации"
                      min={1000}
                      max={new Date().getFullYear()}
                      {...register("publicationYear", {
                        valueAsNumber: true,
                      })}
                      className="book-form_input focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.publicationYear && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.publicationYear.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="publisher"
                      className="block text-base font-semibold"
                    >
                      Издательство
                    </label>
                    <Input
                      id="publisher"
                      placeholder="Введите название издательства"
                      {...register("publisher")}
                      className="book-form_input focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.publisher && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.publisher.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="pageCount"
                      className="block text-base font-semibold"
                    >
                      Количество страниц
                    </label>
                    <Input
                      type="number"
                      id="pageCount"
                      placeholder="Введите количество страниц"
                      min={1}
                      {...register("pageCount", { valueAsNumber: true })}
                      className="book-form_input focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.pageCount && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.pageCount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="language"
                      className="block text-base font-semibold"
                    >
                      Язык
                    </label>
                    <Input
                      id="language"
                      placeholder="Введите язык книги"
                      {...register("language")}
                      className="book-form_input focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.language && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.language.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="availableCopies"
                    className="block text-base font-semibold"
                  >
                    Доступные экземпляры
                  </label>
                  <Input
                    type="number"
                    id="availableCopies"
                    placeholder="Введите количество доступных экземпляров"
                    min={0}
                    {...register("availableCopies", { valueAsNumber: true })}
                    className="book-form_input focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.availableCopies && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.availableCopies.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-base font-semibold"
                  >
                    Описание книги
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Введите описание книги"
                    {...register("description")}
                    rows={7}
                    className="book-form_input focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="summary"
                    className="block text-base font-semibold"
                  >
                    Резюме книги
                  </label>
                  <Textarea
                    id="summary"
                    placeholder="Введите резюме книги"
                    {...register("summary")}
                    rows={5}
                    className="book-form_input focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  {errors.summary && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.summary.message}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="pt-4 border-t">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="book-form_btn text-white cursor-pointer pointer-events-auto z-10 w-full py-4 text-lg bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-5 w-5 mr-2" />
                    {mode === "create"
                      ? "Добавить книгу в библиотеку"
                      : "Сохранить изменения"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookForm;