"use client";

import { useState } from "react";
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
import ColorPicker from "@/components/admin/ColorPicker";
import { BookInput } from "@/lib/admin/actions/book";
import { toast } from "@/hooks/use-toast";

interface Props extends Partial<BookInput> {
    type?: "create" | "update";
}

const BookForm = ({ type = "create", ...book }: Props) => {
    const router = useRouter();
    const [isbn, setIsbn] = useState("");
    const [formStyle, setFormStyle] = useState("default");

    const form = useForm<z.infer<typeof bookSchema>>({
        resolver: zodResolver(bookSchema),
        defaultValues: {
            title: book.title || "",
            description: book.description || "",
            author: book.author || "",
            genre: book.genre || "",
            rating: book.rating || 1,
            totalCopies: book.totalCopies || 1,
            coverUrl: book.coverUrl || "",
            coverColor: book.coverColor || "",
            summary: book.summary || "",
            isbn: book.isbn || "",
            googleBooksId: book.googleBooksId || "",
        },
    });

    const handleFetchByISBN = async () => {
        if (!isbn) {
            toast({
                title: "Ошибка",
                description: "Введите ISBN для поиска",
                variant: "destructive",
            });
            return;
        }
        try {
            const res = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
            );
            const data = await res.json();
            if (data.totalItems > 0) {
                const bookData = data.items[0].volumeInfo;
                form.setValue("title", bookData.title || "");
                form.setValue("author", bookData.authors ? bookData.authors.join(", ") : "");
                form.setValue("description", bookData.description || "");
                form.setValue("coverUrl", bookData.imageLinks?.thumbnail || "");
                form.setValue("isbn", isbn);
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
        }
    };

    const onSubmit = async (values: z.infer<typeof bookSchema>) => {
        const endpoint = type === "create" ? "/api/books" : `/api/books/${book.id}`;
        const method = type === "create" ? "POST" : "PUT";

        try {
            const res = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (res.ok) {
                const data = await res.json();
                toast({
                    title: "Успех",
                    description: `Книга успешно ${type === "create" ? "добавлена" : "обновлена"}`,
                });
                router.push(`/admin/books/${data.id}`);
            } else {
                throw new Error();
            }
        } catch (error) {
            toast({
                title: "Ошибка",
                description: `Не удалось ${type === "create" ? "добавить" : "обновить"} книгу`,
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            <div className="mb-6">
                <ViewModeMenu viewMode={formStyle} setViewMode={setFormStyle} />
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="flex gap-2 items-end">
                        <div className="w-full">
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel className="text-base font-normal text-dark-500">
                                    ISBN
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Введите ISBN книги"
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
                        >
                            Добавить по ISBN
                        </Button>
                    </div>

                    <FormField
                        control={form.control}
                        name={"title"}
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel className="text-base font-normal text-dark-500">
                                    Название книги
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

                    <FormField
                        control={form.control}
                        name={"author"}
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel className="text-base font-normal text-dark-500">
                                    Автор
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        required
                                        placeholder="Введите имя автора"
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
                        name={"genre"}
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel className="text-base font-normal text-dark-500">
                                    Жанр
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        required
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
                        name={"rating"}
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel className="text-base font-normal text-dark-500">
                                    Рейтинг
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={5}
                                        placeholder="Введите рейтинг книги"
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
                        name={"totalCopies"}
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel className="text-base font-normal text-dark-500">
                                    Общее количество экземпляров
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10000}
                                        placeholder="Введите количество экземпляров"
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
                        name={"coverUrl"}
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel className="text-base font-normal text-dark-500">
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

                    <FormField
                        control={form.control}
                        name={"coverColor"}
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel className="text-base font-normal text-dark-500">
                                    Основной цвет
                                </FormLabel>
                                <FormControl>
                                    <ColorPicker onPickerChange={field.onChange} value={field.value} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name={"description"}
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel className="text-base font-normal text-dark-500">
                                    Описание книги
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Введите описание книги"
                                        {...field}
                                        rows={10}
                                        className="book-form_input"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name={"summary"}
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel className="text-base font-normal text-dark-500">
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

                    <Button
                        type="submit"
                        className="book-form_btn text-white cursor-pointer pointer-events-auto z-10"
                    >
                        {type === "create" ? "Добавить книгу в библиотеку" : "Обновить книгу"}
                    </Button>
                </form>
            </Form>
        </div>
    );
};

const ViewModeMenu = ({
    viewMode,
    setViewMode,
}: {
    viewMode: string;
    setViewMode: (mode: string) => void;
}) => {
    return (
        <div className="flex gap-2">
            <button
                onClick={() => setViewMode("compact")}
                className={`px-3 py-1 rounded ${viewMode === "compact" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
            >
                Компактно
            </button>
            <button
                onClick={() => setViewMode("default")}
                className={`px-3 py-1 rounded ${viewMode === "default" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
            >
                По умолчанию
            </button>
            <button
                onClick={() => setViewMode("expanded")}
                className={`px-3 py-1 rounded ${viewMode === "expanded" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
            >
                Расширено
            </button>
        </div>
    );
};

export default BookForm;
