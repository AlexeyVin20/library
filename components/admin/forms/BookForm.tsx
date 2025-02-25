"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { bookSchema } from "@/lib/validations";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/FileUpload";
import { BookInput } from "@/lib/admin/actions/book";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import AuthorSelector from "@/components/AuthorSelector";
import { Loader2, BookOpen, Search } from "lucide-react";

interface Author {
  id: string;
  fullName: string;
}

interface Props extends Partial<BookInput> {
  type?: "create" | "update";
  // Если в режиме редактирования у вас приходят данные о связанных авторах, желательно передавать их как массив ID,
  // но если API возвращает только строку, оставляем начальное значение пустым.
  authors?: Author[];
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

const BookForm = ({ type = "create", ...book }: Props) => {
  const router = useRouter();
  const [isbn, setIsbn] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Для редактирования, если book.authors как список ID доступен, можно preselect; иначе оставляем пустым
  const [selectedAuthors, setSelectedAuthors] = useState<Author[]>(book.authors || []);
  const [availableAuthors, setAvailableAuthors] = useState<Author[]>([]);
  const [activeTab, setActiveTab] = useState("basic-info");

  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: book.title || "",
      // Поле authors хранит массив ID. Если в режиме редактирования нет информации – оставляем пустым.
      authors: book.authors ? book.authors.map((a) => a.id) : [],
      genre: book.genre || "",
      categorization: book.categorization || "",
      isbn: book.isbn || "",
      cover: book.cover || "",
      description: book.description || "",
      summary: book.summary || "",
      publicationYear: book.publicationYear || new Date().getFullYear(),
      publisher: book.publisher || "",
      pageCount: book.pageCount || 0,
      language: book.language || "",
      availableCopies: book.availableCopies || 1,
    },
  });

  // Функция загрузки всех авторов из API
  const fetchAuthors = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/authors`);
      if (!res.ok) throw new Error(`Ошибка загрузки авторов: статус ${res.status}`);
      
      const data = await res.json();
      
      // Keep the full author objects with id and fullName
      const authors = Array.isArray(data) ? data.map(author => ({
        id: author.id,
        fullName: author.fullName
      })) : [];

      setAvailableAuthors(authors);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список авторов",
        variant: "destructive",
      });
      console.error("Ошибка загрузки авторов:", error);
    }
  };

  useEffect(() => {
    // Загружаем всех авторов при монтировании
    fetchAuthors();
    // Если в режиме редактирования у нас уже переданы выбранные авторы, устанавливаем их
    if (book.authors?.length) {
      form.setValue("authors", book.authors.map((a) => a.id));
      setSelectedAuthors(book.authors);
    }
  }, [book.authors]);

  const handleFetchByISBN = async () => {
    if (!isbn) {
      toast({
        title: "Ошибка",
        description: "Введите ISBN для поиска",
        variant: "destructive",
      });
      return;
    }
  
    setIsLoading(true);
  
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
      );
      const data = await res.json();
  
      if (data.totalItems > 0) {
        const bookData = data.items[0].volumeInfo;
        form.setValue("title", bookData.title || "");
        form.setValue("description", bookData.description || "");
        form.setValue("cover", bookData.imageLinks?.thumbnail || "");
        form.setValue("isbn", isbn);
        form.setValue("publisher", bookData.publisher || "");
        form.setValue("pageCount", bookData.pageCount || 0);
        form.setValue("language", bookData.language || "");
        form.setValue(
          "publicationYear",
          bookData.publishedDate
            ? parseInt(bookData.publishedDate.substring(0, 4))
            : new Date().getFullYear()
        );
  
        toast({
          title: "Данные получены",
          description: "Информация о книге успешно заполнена",
        });
  
        // Если данные книги содержат авторов
        if (bookData.authors && bookData.authors.length > 0) {
          // Локальные массивы для сбора ID и объектов выбранных авторов
          const selectedAuthorIds: string[] = [];
          const newSelectedAuthors: Author[] = [];
  
          for (const authorName of bookData.authors) {
            // Ищем автора по имени (без учета регистра)
            let existingAuthor = availableAuthors.find(
              (a) => a.fullName.toLowerCase() === authorName.toLowerCase()
            );
  
            // Если не найден, создаем нового автора
            if (!existingAuthor) {
              const createRes = await fetch(`${baseUrl}/api/authors`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName: authorName }),
              });
              if (createRes.ok) {
                existingAuthor = await createRes.json();
                // Добавляем нового автора в список availableAuthors
                setAvailableAuthors((prev) => [...prev, existingAuthor]);
              } else {
                toast({
                  title: "Ошибка",
                  description: `Не удалось создать автора: ${authorName}`,
                  variant: "destructive",
                });
                continue;
              }
            }
  
            if (existingAuthor) {
              selectedAuthorIds.push(existingAuthor.id);
              newSelectedAuthors.push(existingAuthor);
            }
          }
  
          // Обновляем значение поля authors в форме (теперь массив ID)
          form.setValue("authors", selectedAuthorIds);
          // Обновляем состояние выбранных авторов, чтобы они отображались автоматически
          setSelectedAuthors(newSelectedAuthors);
        }
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
      setIsLoading(false);
    }
  };
  

  const onSubmit = async (values: z.infer<typeof bookSchema>) => {
    if (!baseUrl) {
      toast({
        title: "Ошибка",
        description: "NEXT_PUBLIC_BASE_URL не определён",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Отправляем все значения формы, где поле authors – массив ID
      const bookRes = await fetch(`${baseUrl}/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!bookRes.ok) {
        throw new Error("Не удалось создать книгу");
      }

      const newBook = await bookRes.json();

      toast({
        title: "Успех",
        description: "Книга успешно создана",
      });

      router.push(`/admin/books/${newBook.id}`);
    } catch (error) {
      console.error("Ошибка при создании книги:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать книгу",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Функция добавления нового автора. Принимает имя автора и обновляет список авторов.
  const handleAddAuthor = async (authorName: string) => {
    if (!authorName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите имя нового автора",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${baseUrl}/api/authors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName: authorName }),
      });

      if (res.ok) {
        const newAuthor = await res.json();
        toast({
          title: "Успех",
          description: "Новый автор добавлен",
        });

        // Обновляем список авторов
        await fetchAuthors();
        // Автоматически добавляем нового автора в выбранных
        const updatedAuthorIds = [...form.getValues("authors"), newAuthor.id];
        handleAuthorChange(updatedAuthorIds);
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось добавить автора",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Ошибка при добавлении автора",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление выбранных авторов (field value хранит массив ID)
  const handleAuthorChange = (authorIds: string[]) => {
    form.setValue("authors", authorIds, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Filter selected authors from available authors
    const newSelectedAuthors = authorIds
      .map(id => availableAuthors.find(a => a.id === id))
      .filter((author): author is Author => author !== undefined);

    setSelectedAuthors(newSelectedAuthors);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {type === "create" ? "Добавление новой книги" : "Редактирование книги"}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-2 items-end">
                <div className="w-full">
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="text-base font-semibold">
                      Поиск по ISBN
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Введите ISBN для автозаполнения данных"
                        value={isbn}
                        onChange={(e) => setIsbn(e.target.value)}
                        className="book-form_input"
                      />
                    </FormControl>
                  </FormItem>
                </div>
                <Button
                  type="button"
                  onClick={handleFetchByISBN}
                  className="whitespace-nowrap cursor-pointer pointer-events-auto z-10"
                  disabled={isLoading}
                >
                  {isLoading ? (
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

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="basic-info">Основная информация</TabsTrigger>
              <TabsTrigger value="authors">Авторы</TabsTrigger>
              <TabsTrigger value="details">Детали книги</TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info" className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="text-base font-semibold">
                      Название книги *
                    </FormLabel>
                    <FormControl>
                      <Input
                        required
                        placeholder="Введите название книги"
                        {...field}
                        className="book-form_input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel className="text-base font-semibold">
                        Жанр
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Введите жанр книги"
                          {...field}
                          className="book-form_input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categorization"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel className="text-base font-semibold">
                        Категоризация
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Введите категоризацию книги"
                          {...field}
                          className="book-form_input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isbn"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="text-base font-semibold">
                      ISBN *
                    </FormLabel>
                    <FormControl>
                      <Input
                        required
                        placeholder="Введите ISBN книги"
                        {...field}
                        className="book-form_input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cover"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="text-base font-semibold">
                      Обложка книги
                    </FormLabel>
                    <FormControl>
                      <FileUpload
                        type="image"
                        accept="image/*"
                        placeholder="Загрузите обложку книги"
                        onFileChange={field.onChange}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="authors">
              <AuthorSelector
                isLoading={isLoading}
                selectedAuthors={selectedAuthors}
                availableAuthors={availableAuthors}
                onAuthorChange={handleAuthorChange}
                onAddNewAuthor={handleAddAuthor}
              />
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="publicationYear"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel className="text-base font-semibold">
                        Год публикации
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1000}
                          max={new Date().getFullYear()}
                          placeholder="Введите год публикации"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : "")
                          }
                          className="book-form_input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publisher"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel className="text-base font-semibold">
                        Издательство
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Введите название издательства"
                          {...field}
                          className="book-form_input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="pageCount"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel className="text-base font-semibold">
                        Количество страниц
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Введите количество страниц"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : "")
                          }
                          className="book-form_input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel className="text-base font-semibold">
                        Язык
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Введите язык книги"
                          {...field}
                          className="book-form_input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="availableCopies"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="text-base font-semibold">
                      Доступные экземпляры
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Введите количество доступных экземпляров"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : "")
                        }
                        className="book-form_input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="text-base font-semibold">
                      Описание книги
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Введите описание книги"
                        {...field}
                        rows={7}
                        className="book-form_input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="text-base font-semibold">
                      Резюме книги
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Введите резюме книги"
                        {...field}
                        rows={5}
                        className="book-form_input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>

          <Button
            type="submit"
            className="book-form_btn text-white cursor-pointer pointer-events-auto z-10 w-full py-6 text-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <BookOpen className="h-5 w-5 mr-2" />
                {type === "create" ? "Добавить книгу в библиотеку" : "Обновить книгу"}
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default BookForm;
