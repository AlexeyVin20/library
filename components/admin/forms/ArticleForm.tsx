"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2, FileText } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// Схема валидации для статьи
const articleSchema = z.object({
  issueId: z.number(),
  title: z.string().min(1, "Заголовок обязателен"),
  authors: z.array(z.string()).min(1, "Требуется указать хотя бы одного автора"),
  abstract: z.string().optional().nullable(),
  startPage: z.number().int().positive("Начальная страница должна быть положительным числом"),
  endPage: z.number().int().positive("Конечная страница должна быть положительным числом"),
  keywords: z.array(z.string()).optional().nullable(),
  DOI: z.string().optional().nullable(),
  type: z.enum(["Research", "Review", "CaseStudy", "ShortCommunication", "Editorial", "Commentary", "Letter", "Other"]),
  fullText: z.string().optional().nullable(),
});

export type ArticleInput = z.infer<typeof articleSchema>;

interface ArticleFormProps {
  initialData?: ArticleInput;
  onSubmit: (data: ArticleInput) => Promise<void>;
  isSubmitting: boolean;
  mode: "create" | "update";
  issueId: number;
  issueInfo?: {
    title: string;
    volumeNumber: number;
    issueNumber: number;
  };
}

// Стили
const getThemeClasses = () => {
  return {
    card: "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
    button: "bg-primary-admin hover:bg-primary-admin/80 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2 w-full",
    secondaryButton: "bg-neutral-500/90 hover:bg-neutral-500 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2 w-full",
    input: "bg-white/50 dark:bg-neutral-800/50 border border-white/30 dark:border-neutral-700/30 rounded-lg",
    textarea: "bg-white/50 dark:bg-neutral-800/50 border border-white/30 dark:border-neutral-700/30 rounded-lg min-h-[100px]",
    select: "bg-white/50 dark:bg-neutral-800/50 border border-white/30 dark:border-neutral-700/30 rounded-lg",
  };
};

const articleTypes = [
  { value: "Research", label: "Научная статья" },
  { value: "Review", label: "Обзорная статья" },
  { value: "CaseStudy", label: "Клинический случай" },
  { value: "ShortCommunication", label: "Краткое сообщение" },
  { value: "Editorial", label: "Редакционная статья" },
  { value: "Commentary", label: "Комментарий" },
  { value: "Letter", label: "Письмо в редакцию" },
  { value: "Other", label: "Другое" },
];

const ArticleForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  mode,
  issueId,
  issueInfo,
}: ArticleFormProps) => {
  const router = useRouter();
  const themeClasses = getThemeClasses();
  const [authorsString, setAuthorsString] = useState<string>("");
  const [keywordsString, setKeywordsString] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ArticleInput>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      issueId: initialData?.issueId || issueId,
      title: initialData?.title || "",
      authors: initialData?.authors || [],
      abstract: initialData?.abstract || "",
      startPage: initialData?.startPage || 1,
      endPage: initialData?.endPage || 1,
      keywords: initialData?.keywords || [],
      DOI: initialData?.DOI || "",
      type: initialData?.type || "Research",
      fullText: initialData?.fullText || "",
    },
  });

  useEffect(() => {
    if (initialData?.authors) {
      setAuthorsString(initialData.authors.join("\n"));
    }
    if (initialData?.keywords) {
      setKeywordsString(initialData.keywords.join(", "));
    }
  }, [initialData]);

  // Обновление авторов при изменении текстового поля
  useEffect(() => {
    const authors = authorsString
      .split("\n")
      .map(author => author.trim())
      .filter(author => author !== "");
    setValue("authors", authors);
  }, [authorsString, setValue]);

  // Обновление ключевых слов при изменении текстового поля
  useEffect(() => {
    const keywords = keywordsString
      .split(",")
      .map(keyword => keyword.trim())
      .filter(keyword => keyword !== "");
    setValue("keywords", keywords);
  }, [keywordsString, setValue]);

  const onFormSubmit = async (data: ArticleInput) => {
    await onSubmit(data);
  };

  return (
    <Card className={themeClasses.card}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center">
          <FileText className="mr-2 h-6 w-6 text-primary-admin" />
          {mode === "create" ? "Добавление статьи" : "Редактирование статьи"}
          {issueInfo && (
            <span className="ml-2 text-lg font-normal text-neutral-500">
              Том {issueInfo.volumeNumber}, Выпуск {issueInfo.issueNumber}
              {issueInfo.title && ` «${issueInfo.title}»`}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <input type="hidden" {...register("issueId")} />

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Заголовок статьи *
              </label>
              <Input
                {...register("title")}
                className={themeClasses.input}
                placeholder="Введите заголовок статьи"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Авторы * (каждый автор с новой строки)
              </label>
              <Textarea
                value={authorsString}
                onChange={(e) => setAuthorsString(e.target.value)}
                className={themeClasses.textarea}
                placeholder="Иванов И.И.&#10;Петров П.П."
                rows={3}
              />
              {errors.authors && (
                <p className="text-red-500 text-sm mt-1">{errors.authors.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Аннотация
              </label>
              <Textarea
                {...register("abstract")}
                className={themeClasses.textarea}
                placeholder="Введите аннотацию статьи"
                rows={5}
              />
              {errors.abstract && (
                <p className="text-red-500 text-sm mt-1">{errors.abstract.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Начальная страница *
                </label>
                <Input
                  type="number"
                  min={1}
                  {...register("startPage", { valueAsNumber: true })}
                  className={themeClasses.input}
                />
                {errors.startPage && (
                  <p className="text-red-500 text-sm mt-1">{errors.startPage.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Конечная страница *
                </label>
                <Input
                  type="number"
                  min={1}
                  {...register("endPage", { valueAsNumber: true })}
                  className={themeClasses.input}
                />
                {errors.endPage && (
                  <p className="text-red-500 text-sm mt-1">{errors.endPage.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Ключевые слова (через запятую)
              </label>
              <Input
                value={keywordsString}
                onChange={(e) => setKeywordsString(e.target.value)}
                className={themeClasses.input}
                placeholder="наука, исследование, метод"
              />
              {errors.keywords && (
                <p className="text-red-500 text-sm mt-1">{errors.keywords.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                DOI
              </label>
              <Input
                {...register("DOI")}
                className={themeClasses.input}
                placeholder="10.1234/journal.article.2023"
              />
              {errors.DOI && (
                <p className="text-red-500 text-sm mt-1">{errors.DOI.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Тип статьи *
              </label>
              <Select
                onValueChange={(value) => setValue("type", value as any)}
                defaultValue={watch("type")}
              >
                <SelectTrigger className={themeClasses.select}>
                  <SelectValue placeholder="Выберите тип статьи" />
                </SelectTrigger>
                <SelectContent>
                  {articleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Полный текст
              </label>
              <Textarea
                {...register("fullText")}
                className={themeClasses.textarea}
                placeholder="Введите полный текст статьи или ссылку на документ"
                rows={10}
              />
              {errors.fullText && (
                <p className="text-red-500 text-sm mt-1">{errors.fullText.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-neutral-800 flex flex-col md:flex-row gap-4">
            <Button
              type="button"
              onClick={() => router.back()}
              className={themeClasses.secondaryButton}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={themeClasses.button}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {mode === "create" ? "Создание..." : "Сохранение..."}
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-2" />
                  {mode === "create" ? "Создать статью" : "Сохранить изменения"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ArticleForm;