"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, BookText } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

// Схема валидации для выпуска
const issueSchema = z.object({
  journalId: z.number(),
  volumeNumber: z.number().int().positive("Номер тома должен быть положительным числом"),
  issueNumber: z.number().int().positive("Номер выпуска должен быть положительным числом"),
  publicationDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Некорректная дата публикации",
  }),
  pageCount: z.number().int().positive("Количество страниц должно быть положительным числом"),
  cover: z.string().optional().nullable(),
  circulation: z.number().int().positive("Тираж должен быть положительным числом").optional().nullable(),
  specialTheme: z.string().optional().nullable(),
  shelfId: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
});

export type IssueInput = z.infer<typeof issueSchema>;

interface IssueFormProps {
  initialData?: IssueInput;
  onSubmit: (data: IssueInput) => Promise<void>;
  isSubmitting: boolean;
  mode: "create" | "update";
  journalId: number;
  journalTitle?: string;
}

// Стили
const getThemeClasses = () => {
  return {
    card: "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
    button: "bg-primary-admin hover:bg-primary-admin/80 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2 w-full",
    secondaryButton: "bg-neutral-500/90 hover:bg-neutral-500 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2 w-full",
    input: "bg-white/50 dark:bg-neutral-800/50 border border-white/30 dark:border-neutral-700/30 rounded-lg",
    textarea: "bg-white/50 dark:bg-neutral-800/50 border border-white/30 dark:border-neutral-700/30 rounded-lg min-h-[100px]",
  };
};

const IssueForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  mode,
  journalId,
  journalTitle,
}: IssueFormProps) => {
  const router = useRouter();
  const themeClasses = getThemeClasses();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<IssueInput>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      journalId: initialData?.journalId || journalId,
      volumeNumber: initialData?.volumeNumber || 1,
      issueNumber: initialData?.issueNumber || 1,
      publicationDate: initialData?.publicationDate || new Date().toISOString().split('T')[0],
      pageCount: initialData?.pageCount || 100,
      cover: initialData?.cover || null,
      circulation: initialData?.circulation || 1000,
      specialTheme: initialData?.specialTheme || null,
      shelfId: initialData?.shelfId || null,
      position: initialData?.position || null,
    },
  });

  useEffect(() => {
    if (initialData?.cover) {
      setPreviewUrl(initialData.cover);
    }
  }, [initialData]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = event => {
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
    setValue("cover", null);
  };

  const onFormSubmit = async (data: IssueInput) => {
    await onSubmit(data);
  };

  return (
    <Card className={themeClasses.card}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center">
          <BookText className="mr-2 h-6 w-6 text-primary-admin" />
          {mode === "create" ? "Добавление выпуска журнала" : "Редактирование выпуска журнала"}
          {journalTitle && <span className="ml-2 text-lg font-normal text-neutral-500">«{journalTitle}»</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <input type="hidden" {...register("journalId")} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Номер тома *
              </label>
              <Input
                type="number"
                min={1}
                {...register("volumeNumber", { valueAsNumber: true })}
                className={themeClasses.input}
              />
              {errors.volumeNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.volumeNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Номер выпуска *
              </label>
              <Input
                type="number"
                min={1}
                {...register("issueNumber", { valueAsNumber: true })}
                className={themeClasses.input}
              />
              {errors.issueNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.issueNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Дата публикации *
              </label>
              <Input
                type="date"
                {...register("publicationDate")}
                className={themeClasses.input}
              />
              {errors.publicationDate && (
                <p className="text-red-500 text-sm mt-1">{errors.publicationDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Количество страниц *
              </label>
              <Input
                type="number"
                min={1}
                {...register("pageCount", { valueAsNumber: true })}
                className={themeClasses.input}
              />
              {errors.pageCount && (
                <p className="text-red-500 text-sm mt-1">{errors.pageCount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Тираж
              </label>
              <Input
                type="number"
                min={1}
                {...register("circulation", { valueAsNumber: true })}
                className={themeClasses.input}
              />
              {errors.circulation && (
                <p className="text-red-500 text-sm mt-1">{errors.circulation.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Специальная тема
              </label>
              <Input
                {...register("specialTheme")}
                className={themeClasses.input}
              />
              {errors.specialTheme && (
                <p className="text-red-500 text-sm mt-1">{errors.specialTheme.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                ID полки
              </label>
              <Input
                {...register("shelfId")}
                className={themeClasses.input}
              />
              {errors.shelfId && (
                <p className="text-red-500 text-sm mt-1">{errors.shelfId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Позиция
              </label>
              <Input
                {...register("position")}
                className={themeClasses.input}
              />
              {errors.position && (
                <p className="text-red-500 text-sm mt-1">{errors.position.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Обложка выпуска
              </label>

              <div className="flex gap-6 items-start">
                <div className="w-32 h-40 rounded overflow-hidden bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={previewUrl}
                        alt="Обложка выпуска"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <BookText className="h-10 w-10 text-gray-400" />
                  )}
                </div>

                <div>
                  <input
                    id="coverInput"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="coverInput"
                    className="cursor-pointer inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {previewUrl ? "Изменить обложку" : "Загрузить обложку"}
                  </label>
                </div>
              </div>
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
                  <BookText className="h-5 w-5 mr-2" />
                  {mode === "create" ? "Создать выпуск" : "Сохранить изменения"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default IssueForm;