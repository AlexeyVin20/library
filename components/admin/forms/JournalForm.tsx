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

// Theme classes
const getThemeClasses = () => {
  return {
    card: "bg-white/70 dark:bg-neutral-200/70 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform hover:translate-y-[-5px] transition-all duration-300",
    statsCard: "bg-white/70 dark:bg-neutral-200/70 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform hover:translate-y-[-5px] transition-all duration-300",
    mainContainer: "bg-gradient-to-r from-brand-800/30 via-neutral-800/30 to-brand-900/30 dark:from-neutral-200 dark:via-brand-200 dark:to-neutral-300",
    button: "bg-primary-admin/90 hover:bg-primary-admin text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2",
    input: "bg-white/40 dark:bg-neutral-300/40 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-4 py-2",
    textarea: "bg-white/40 dark:bg-neutral-300/40 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-4 py-2 resize-none",
    tab: "bg-white/20 dark:bg-neutral-200/20 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-lg",
    tabActive: "bg-primary-admin/90 text-white rounded-lg",
    select: "bg-white/40 dark:bg-neutral-300/40 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg",
  };
};

// Определяем Zod-схему для журнала
const journalSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(200, "Максимальная длина - 200 символов"),
  issn: z.string().max(20, "Максимальная длина - 20 символов").optional().nullable(),
  registrationNumber: z.string().max(50, "Максимальная длина - 50 символов").optional().nullable(),
  format: z.enum(["Print", "Electronic", "Mixed"]),
  periodicity: z.enum(["Weekly", "BiWeekly", "Monthly", "Quarterly", "BiAnnually", "Annually"]),
  pagesPerIssue: z.number().int().nonnegative(),
  description: z.string().max(500, "Максимальная длина - 500 символов").optional().nullable(),
  publisher: z.string().max(100, "Максимальная длина - 100 символов").optional().nullable(),
  foundationDate: z.date(),
  circulation: z.number().int().nonnegative(),
  isOpenAccess: z.boolean(),
  category: z.enum(["Scientific", "Popular", "Entertainment", "Professional", "Educational", "Literary", "News"]),
  targetAudience: z.string().max(100, "Максимальная длина - 100 символов").optional().nullable(),
  isPeerReviewed: z.boolean(),
  isIndexedInRINTS: z.boolean(),
  isIndexedInScopus: z.boolean(),
  isIndexedInWebOfScience: z.boolean(),
  publicationDate: z.date(),
  pageCount: z.number().int().nonnegative(),
  coverImageUrl: z.string().optional().nullable(),
});

// Тип для входных данных формы журнала
export type JournalInput = z.infer<typeof journalSchema>;

// Интерфейс для свойств компонента
interface JournalFormProps {
  initialData?: JournalInput;
  onSubmit: (data: JournalInput) => Promise<void>;
  isSubmitting: boolean;
  mode: "create" | "update";
}

const JournalForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  mode,
}: JournalFormProps) => {
  const router = useRouter();
  const themeClasses = getThemeClasses();

  // Состояния
  const [issn, setIssn] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showManualCoverInput, setShowManualCoverInput] = useState(false);
  const [manualCoverUrl, setManualCoverUrl] = useState("");
  
  // Состояния для Gemini AI
  const [geminiImage, setGeminiImage] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

  // Инициализация формы
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<JournalInput>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: initialData?.title || "",
      issn: initialData?.issn || "",
      registrationNumber: initialData?.registrationNumber || "",
      format: initialData?.format || "Print",
      periodicity: initialData?.periodicity || "Monthly",
      pagesPerIssue: initialData?.pagesPerIssue || 0,
      description: initialData?.description || "",
      publisher: initialData?.publisher || "",
      foundationDate: initialData?.foundationDate || new Date(),
      circulation: initialData?.circulation || 0,
      isOpenAccess: initialData?.isOpenAccess || false,
      category: initialData?.category || "Scientific",
      targetAudience: initialData?.targetAudience || "",
      isPeerReviewed: initialData?.isPeerReviewed || false,
      isIndexedInRINTS: initialData?.isIndexedInRINTS || false,
      isIndexedInScopus: initialData?.isIndexedInScopus || false,
      isIndexedInWebOfScience: initialData?.isIndexedInWebOfScience || false,
      publicationDate: initialData?.publicationDate || new Date(),
      pageCount: initialData?.pageCount || 0,
      coverImageUrl: initialData?.coverImageUrl || "",
    },
  });

  const formValues = watch();
  const isOpenAccess = watch("isOpenAccess");

  // Инициализация предпросмотра обложки при загрузке компонента
  useEffect(() => {
    if (initialData?.coverImageUrl) setPreviewUrl(initialData.coverImageUrl);
  }, [initialData]);

  // Обработка изображения от Gemini
  useEffect(() => {
    if (geminiImage) {
      handleGeminiUpload();
    }
  }, [geminiImage]);

  // Поиск журнала по ISSN
  const handleFetchByISSN = async () => {
    if (!issn) {
      toast({ title: "Ошибка", description: "Введите ISSN для поиска", variant: "destructive" });
      return;
    }

    setIsSearchLoading(true);
    try {
      // Используем CrossRef API для поиска журнала по ISSN
      const res = await fetch(`https://api.crossref.org/journals/${issn}`);
      const data = await res.json();
      
      if (data.status === "ok" && data.message) {
        const journalData = data.message;
        
        setValue("title", journalData.title || "");
        setValue("issn", issn);
        setValue("publisher", journalData.publisher || "");
        
        // Используем дополнительные поля, если они доступны
        if (journalData.subjects) {
          const category = mapSubjectToCategory(journalData.subjects[0]);
          setValue("category", category);
        }
        
        // Задаем значение по умолчанию для формата и периодичности
        setValue("format", "Print");
        setValue("periodicity", "Monthly");
        
        toast({ title: "Данные получены", description: "Информация о журнале успешно заполнена" });
        
        // Поиск обложки
        handleFindCover();
      } else {
        setValue("issn", issn);
        toast({
          title: "Журнал не найден",
          description: "Проверьте правильность ISSN. Значение поля ISSN установлено из введенного значения.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setValue("issn", issn);
      toast({
        title: "Ошибка",
        description: "Ошибка при поиске по ISSN. Значение поля ISSN установлено из введенного значения.",
        variant: "destructive",
      });
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Маппинг предметной области в категорию журнала
  const mapSubjectToCategory = (subject: string): "Scientific" | "Popular" | "Entertainment" | "Professional" | "Educational" | "Literary" | "News" => {
    const subjectLower = subject.toLowerCase();
    
    if (subjectLower.includes("science") || subjectLower.includes("research")) {
      return "Scientific";
    } else if (subjectLower.includes("education")) {
      return "Educational";
    } else if (subjectLower.includes("news")) {
      return "News";
    } else if (subjectLower.includes("literature") || subjectLower.includes("art")) {
      return "Literary";
    } else if (subjectLower.includes("professional")) {
      return "Professional";
    } else if (subjectLower.includes("entertainment")) {
      return "Entertainment";
    } else {
      return "Popular";
    }
  };

  // Обработка изменения обложки
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setPreviewUrl(event.target.result);
          setValue("coverImageUrl", event.target.result);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Удаление обложки
  const handleRemoveCover = () => {
    setPreviewUrl(null);
    setValue("coverImageUrl", "");
  };

  // Конвертация файла в Base64
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

  // Компонент для загрузки файла для Gemini AI
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
      <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          id="geminiFileInput"
        />
        <label
          htmlFor="geminiFileInput"
          className="cursor-pointer text-center text-gray-500"
        >
          Перетащите файл сюда или нажмите для загрузки
        </label>
        {fileName && <p className="mt-2 text-sm text-gray-500">{fileName}</p>}
      </div>
    );
  };

  // Обработка файла для Gemini
  const handleGeminiFileChange = (base64: string) => {
    setGeminiImage(base64);
  };

  // Обработка загрузки в Gemini AI
  const handleGeminiUpload = async () => {
    if (!geminiImage) return;
    setGeminiLoading(true);

    try {
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      const apiKey = "AIzaSyDy4Otvq7kKpQYkcTdIhP4rvZxpMEnuQ7M";

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Отвечать пользователю по-русски. Отвечать в формате json без вступлений и заключений. Задача- заполнять поля у журналов. Модель журнала содержит следующие поля: id(int), title(строка 200), issn(строка 20), registrationNumber(строка 50), format(Print/Electronic/Mixed), periodicity(Weekly/BiWeekly/Monthly/Quarterly/BiAnnually/Annually), pagesPerIssue(число), description(строка 500), publisher(строка 100), foundationDate(дата), circulation(число), isOpenAccess(boolean), category(Scientific/Popular/Entertainment/Professional/Educational/Literary/News), targetAudience(строка 100), isPeerReviewed(boolean), isIndexedInRINTS(boolean), isIndexedInScopus(boolean), isIndexedInWebOfScience(boolean), publicationDate(дата), pageCount(число), coverImageUrl - всегда оставляй null. Если информации нет, оставляй null",
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: geminiImage,
                },
              },
            ],
          },
        ],
      };

      const res = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (responseText) {
        let jsonString = responseText.trim();
        if (jsonString.startsWith("```json")) {
          jsonString = jsonString.slice(7).trim();
        }
        if (jsonString.endsWith("```")) {
          jsonString = jsonString.slice(0, -3).trim();
        }

        const parsedData = JSON.parse(jsonString);
        let coverUrl = null;

        // Метод 1: Поиск по ISSN
        if (parsedData.issn) {
          try {
            const coverRes = await fetch(`https://api.altmetric.com/v1/doi/${parsedData.issn}`);
            if (coverRes.ok) {
              const coverData = await coverRes.json();
              if (coverData.images && coverData.images.small) {
                coverUrl = coverData.images.small;
                console.log("Обложка найдена по ISSN через API");
              }
            }
          } catch (error) {
            console.error("Ошибка при поиске обложки по ISSN:", error);
          }
        }

        // Метод 2: Поиск по названию и издателю
        if (!coverUrl && parsedData.title && parsedData.publisher) {
          try {
            const query = encodeURIComponent(`${parsedData.title} ${parsedData.publisher} journal cover`);
            const googleImages = await fetch(
              `https://www.googleapis.com/customsearch/v1?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&cx=YOUR_CUSTOM_SEARCH_ENGINE_ID&q=${query}&searchType=image&num=1`
            );
            
            if (googleImages.ok) {
              const imageData = await googleImages.json();
              if (imageData.items && imageData.items.length > 0) {
                coverUrl = imageData.items[0].link;
                console.log("Обложка найдена через Google Images API");
              }
            }
          } catch (error) {
            console.error("Ошибка при поиске обложки через Google:", error);
          }
        }

        // Метод 4: Если обложка не найдена, открываем поиск
        if (!coverUrl) {
          const query = encodeURIComponent(parsedData.title + " журнал обложка");
          const searchUrl = `https://cse.google.com/cse?cx=b421413d1a0984f58#gsc.tab=0&gsc.q=${query}`;
          window.open(searchUrl, '_blank');
          setShowManualCoverInput(true);
          toast({
            title: "Обложка не найдена",
            description: "Поиск открыт в новой вкладке. Найдите подходящую обложку и вставьте ссылку на неё.",
            variant: "destructive",
          });
        } else {
          setValue("coverImageUrl", coverUrl);
          setPreviewUrl(coverUrl);
          toast({
            title: "Данные получены",
            description: "Обложка журнала успешно получена.",
            variant: "default",
          });
        }

        // Заполнение остальных полей, если они есть
        if (parsedData.title) setValue("title", parsedData.title);
        if (parsedData.issn) setValue("issn", parsedData.issn);
        if (parsedData.registrationNumber) setValue("registrationNumber", parsedData.registrationNumber);
        if (parsedData.format) setValue("format", parsedData.format);
        if (parsedData.periodicity) setValue("periodicity", parsedData.periodicity);
        if (parsedData.pagesPerIssue) setValue("pagesPerIssue", parsedData.pagesPerIssue);
        if (parsedData.description) setValue("description", parsedData.description);
        if (parsedData.publisher) setValue("publisher", parsedData.publisher);
        if (parsedData.foundationDate) setValue("foundationDate", new Date(parsedData.foundationDate));
        if (parsedData.circulation) setValue("circulation", parsedData.circulation);
        if (parsedData.isOpenAccess !== undefined) setValue("isOpenAccess", parsedData.isOpenAccess);
        if (parsedData.category) setValue("category", parsedData.category);
        if (parsedData.targetAudience) setValue("targetAudience", parsedData.targetAudience);
        if (parsedData.isPeerReviewed !== undefined) setValue("isPeerReviewed", parsedData.isPeerReviewed);
        if (parsedData.isIndexedInRINTS !== undefined) setValue("isIndexedInRINTS", parsedData.isIndexedInRINTS);
        if (parsedData.isIndexedInScopus !== undefined) setValue("isIndexedInScopus", parsedData.isIndexedInScopus);
        if (parsedData.isIndexedInWebOfScience !== undefined) setValue("isIndexedInWebOfScience", parsedData.isIndexedInWebOfScience);
        if (parsedData.publicationDate) setValue("publicationDate", new Date(parsedData.publicationDate));
        if (parsedData.pageCount) setValue("pageCount", parsedData.pageCount);
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

  // Поиск обложки
  const handleFindCover = async () => {
    const formValues = watch();
    setShowManualCoverInput(false);

    if (formValues.issn || (formValues.title && formValues.publisher)) {
      let coverUrl = null;

      // Метод 1: Поиск по ISSN
      if (formValues.issn) {
        try {
          const coverRes = await fetch(`https://api.altmetric.com/v1/doi/${formValues.issn}`);
          if (coverRes.ok) {
            const coverData = await coverRes.json();
            if (coverData.images && coverData.images.small) {
              coverUrl = coverData.images.small;
            }
          }
        } catch (error) {
          console.error("Ошибка при поиске по ISSN:", error);
        }
      }

      // Метод 2: Поиск по названию и издателю
      if (!coverUrl && formValues.title && formValues.publisher) {
        try {
          const query = encodeURIComponent(`${formValues.title} ${formValues.publisher} journal cover`);
          const googleImages = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&cx=YOUR_CUSTOM_SEARCH_ENGINE_ID&q=${query}&searchType=image&num=1`
          );
          
          if (googleImages.ok) {
            const imageData = await googleImages.json();
            if (imageData.items && imageData.items.length > 0) {
              coverUrl = imageData.items[0].link;
            }
          }
        } catch (error) {
          console.error("Ошибка при поиске по названию и издателю:", error);
        }
      }

      if (coverUrl) {
        setValue("coverImageUrl", coverUrl);
        setPreviewUrl(coverUrl);
        toast({ title: "Успех", description: "Обложка журнала успешно обновлена" });
      } else {
        const query = encodeURIComponent(formValues.title + " журнал обложка");
        const searchUrl = `https://cse.google.com/cse?cx=b421413d1a0984f58#gsc.tab=0&gsc.q=${query}`;
        window.open(searchUrl, '_blank');
        setShowManualCoverInput(true);
        toast({
          title: "Обложка не найдена",
          description: "Поиск открыт в новой вкладке. Найдите подходящую обложку и вставьте ссылку на неё.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Ошибка",
        description: "Необходимо указать ISSN или название и издателя журнала",
        variant: "destructive"
      });
    }
  };

  // Обработка отправки формы
  const onFormSubmit = async (values: z.infer<typeof journalSchema>) => {
    await onSubmit(values);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          {mode === "create" ? "Добавление журнала" : "Редактирование журнала"}
        </h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* ISSN Search */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex-grow">
            <label className="block text-sm font-medium mb-1">Поиск по ISSN</label>
            <Input
              type="text"
              value={issn}
              onChange={(e) => setIssn(e.target.value)}
              className={themeClasses.input}
            />
          </div>
          <Button
            onClick={handleFetchByISSN}
            className={themeClasses.button}
            disabled={isSearchLoading}
          >
            {isSearchLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Поиск по ISSN
              </>
            )}
          </Button>
        </div>

        {/* Блок для Gemini AI */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Загрузить изображение для сканирования обложки журнала</h3>
          <GeminiFileUpload onFileChange={handleGeminiFileChange} />
          
          {geminiLoading && (
            <div className="mt-3 flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Обработка изображения...</span>
            </div>
          )}
          
          {geminiImage && !geminiLoading && (
            <Button
              onClick={() => setGeminiImage(null)}
              className="mt-3 bg-purple-500 hover:bg-purple-600"
            >
              Перезагрузить
            </Button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Tabs defaultValue="basic-info" className="space-y-6">
            <TabsList className="grid grid-cols-3 gap-4">
              <TabsTrigger value="basic-info" className={activeTab === "basic-info" ? themeClasses.tabActive : themeClasses.tab}>
                <FileText className="mr-2 h-4 w-4" />
                Основная информация
              </TabsTrigger>
              <TabsTrigger value="detailed-info" className={activeTab === "detailed-info" ? themeClasses.tabActive : themeClasses.tab}>
                <BookOpen className="mr-2 h-4 w-4" />
                Детальная информация
              </TabsTrigger>
              <TabsTrigger value="additional-info" className={activeTab === "additional-info" ? themeClasses.tabActive : themeClasses.tab}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Дополнительно
              </TabsTrigger>
            </TabsList>

            {/* Основная информация */}
            <TabsContent value="basic-info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">Название журнала *</label>
                  <Input
                    id="title"
                    {...register("title")}
                    className={themeClasses.input}
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label htmlFor="issn" className="block text-sm font-medium mb-1">ISSN *</label>
                  <Input
                    id="issn"
                    {...register("issn")}
                    className={themeClasses.input}
                  />
                  {errors.issn && <p className="text-red-500 text-xs mt-1">{errors.issn.message}</p>}
                </div>

                <div>
                  <label htmlFor="registrationNumber" className="block text-sm font-medium mb-1">Регистрационный номер</label>
                  <Input
                    id="registrationNumber"
                    {...register("registrationNumber")}
                    className={themeClasses.input}
                  />
                  {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber.message}</p>}
                </div>

                <div>
                  <label htmlFor="publisher" className="block text-sm font-medium mb-1">Издательство</label>
                  <Input
                    id="publisher"
                    {...register("publisher")}
                    className={themeClasses.input}
                  />
                  {errors.publisher && <p className="text-red-500 text-xs mt-1">{errors.publisher.message}</p>}
                </div>

                <div>
                  <label htmlFor="foundationDate" className="block text-sm font-medium mb-1">Дата основания</label>
                  <Input
                    id="foundationDate"
                    type="date"
                    {...register("foundationDate", {
                      setValueAs: (v) => v ? new Date(v) : null,
                    })}
                    className={themeClasses.input}
                  />
                  {errors.foundationDate && <p className="text-red-500 text-xs mt-1">{errors.foundationDate.message}</p>}
                </div>

                <div>
                  <label htmlFor="publicationDate" className="block text-sm font-medium mb-1">Дата публикации</label>
                  <Input
                    id="publicationDate"
                    type="date"
                    {...register("publicationDate", {
                      setValueAs: (v) => v ? new Date(v) : null,
                    })}
                    className={themeClasses.input}
                  />
                  {errors.publicationDate && <p className="text-red-500 text-xs mt-1">{errors.publicationDate.message}</p>}
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-1">Категория</label>
                  <Select
                    onValueChange={(value) => setValue("category", value as any)}
                    defaultValue={initialData?.category || "Scientific"}
                  >
                    <SelectTrigger className={themeClasses.select}>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scientific">Научный</SelectItem>
                      <SelectItem value="Popular">Популярный</SelectItem>
                      <SelectItem value="Entertainment">Развлекательный</SelectItem>
                      <SelectItem value="Professional">Профессиональный</SelectItem>
                      <SelectItem value="Educational">Образовательный</SelectItem>
                      <SelectItem value="Literary">Литературный</SelectItem>
                      <SelectItem value="News">Новостной</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                </div>

                <div>
                  <label htmlFor="format" className="block text-sm font-medium mb-1">Формат</label>
                  <Select
                    onValueChange={(value) => setValue("format", value as any)}
                    defaultValue={initialData?.format || "Print"}
                  >
                    <SelectTrigger className={themeClasses.select}>
                      <SelectValue placeholder="Выберите формат" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Print">Печатный</SelectItem>
                      <SelectItem value="Electronic">Электронный</SelectItem>
                      <SelectItem value="Mixed">Смешанный</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.format && <p className="text-red-500 text-xs mt-1">{errors.format.message}</p>}
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="isOpenAccess"
                    checked={isOpenAccess}
                    onCheckedChange={(checked) => setValue("isOpenAccess", checked as boolean)}
                  />
                  <label
                    htmlFor="isOpenAccess"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Открытый доступ
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Обложка журнала</h3>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  {/* Предпросмотр обложки */}
                  <div className="w-full md:w-1/3 aspect-[3/4] relative bg-gray-100 rounded-lg overflow-hidden">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Обложка журнала"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-400">Нет обложки</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 w-full md:w-2/3">
                    <input
                      type="file"
                      id="coverInput"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                    
                    <Button
                      type="button"
                      onClick={() => document.getElementById("coverInput")?.click()}
                      className={themeClasses.button}
                    >
                      {previewUrl ? "Изменить обложку" : "Загрузить обложку"}
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={handleFindCover}
                      className={themeClasses.button}
                    >
                      Обновить обложку
                    </Button>
                    
                    {previewUrl && (
                      <Button
                        type="button"
                        onClick={handleRemoveCover}
                        variant="destructive"
                      >
                        Удалить обложку
                      </Button>
                    )}

                    {/* Поле для ручного ввода ссылки */}
                    {showManualCoverInput && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium mb-1">Вставьте ссылку на обложку</label>
                        <Input
                          type="text"
                          value={manualCoverUrl}
                          onChange={(e) => {
                            setManualCoverUrl(e.target.value);
                            setValue("coverImageUrl", e.target.value);
                            setPreviewUrl(e.target.value);
                          }}
                          className={themeClasses.input + " text-xs h-8"}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Детальная информация */}
            <TabsContent value="detailed-info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium mb-1">Описание журнала</label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    className={themeClasses.textarea}
                    rows={5}
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div>
                  <label htmlFor="pagesPerIssue" className="block text-sm font-medium mb-1">Страниц в выпуске</label>
                  <Input
                    id="pagesPerIssue"
                    type="number"
                    {...register("pagesPerIssue", { valueAsNumber: true })}
                    className={themeClasses.input}
                  />
                  {errors.pagesPerIssue && <p className="text-red-500 text-xs mt-1">{errors.pagesPerIssue.message}</p>}
                </div>

                <div>
                  <label htmlFor="pageCount" className="block text-sm font-medium mb-1">Количество страниц</label>
                  <Input
                    id="pageCount"
                    type="number"
                    {...register("pageCount", { valueAsNumber: true })}
                    className={themeClasses.input}
                  />
                  {errors.pageCount && <p className="text-red-500 text-xs mt-1">{errors.pageCount.message}</p>}
                </div>

                <div>
                  <label htmlFor="circulation" className="block text-sm font-medium mb-1">Тираж</label>
                  <Input
                    id="circulation"
                    type="number"
                    {...register("circulation", { valueAsNumber: true })}
                    className={themeClasses.input}
                  />
                  {errors.circulation && <p className="text-red-500 text-xs mt-1">{errors.circulation.message}</p>}
                </div>

                <div>
                  <label htmlFor="periodicity" className="block text-sm font-medium mb-1">Периодичность</label>
                  <Select
                    onValueChange={(value) => setValue("periodicity", value as any)}
                    defaultValue={initialData?.periodicity || "Monthly"}
                  >
                    <SelectTrigger className={themeClasses.select}>
                      <SelectValue placeholder="Выберите периодичность" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Еженедельно</SelectItem>
                      <SelectItem value="BiWeekly">Раз в две недели</SelectItem>
                      <SelectItem value="Monthly">Ежемесячно</SelectItem>
                      <SelectItem value="Quarterly">Ежеквартально</SelectItem>
                      <SelectItem value="BiAnnually">Раз в полгода</SelectItem>
                      <SelectItem value="Annually">Ежегодно</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.periodicity && <p className="text-red-500 text-xs mt-1">{errors.periodicity.message}</p>}
                </div>

                <div>
                  <label htmlFor="targetAudience" className="block text-sm font-medium mb-1">Целевая аудитория</label>
                  <Input
                    id="targetAudience"
                    {...register("targetAudience")}
                    className={themeClasses.input}
                  />
                  {errors.targetAudience && <p className="text-red-500 text-xs mt-1">{errors.targetAudience.message}</p>}
                </div>
              </div>
            </TabsContent>

            {/* Дополнительная информация */}
            <TabsContent value="additional-info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPeerReviewed"
                    checked={watch("isPeerReviewed")}
                    onCheckedChange={(checked) => setValue("isPeerReviewed", checked as boolean)}
                  />
                  <label
                    htmlFor="isPeerReviewed"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Рецензируемый
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isIndexedInRINTS"
                    checked={watch("isIndexedInRINTS")}
                    onCheckedChange={(checked) => setValue("isIndexedInRINTS", checked as boolean)}
                  />
                  <label
                    htmlFor="isIndexedInRINTS"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Индексируется в РИНЦ
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isIndexedInScopus"
                    checked={watch("isIndexedInScopus")}
                    onCheckedChange={(checked) => setValue("isIndexedInScopus", checked as boolean)}
                  />
                  <label
                    htmlFor="isIndexedInScopus"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Индексируется в Scopus
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isIndexedInWebOfScience"
                    checked={watch("isIndexedInWebOfScience")}
                    onCheckedChange={(checked) => setValue("isIndexedInWebOfScience", checked as boolean)}
                  />
                  <label
                    htmlFor="isIndexedInWebOfScience"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Индексируется в Web of Science
                  </label>
                </div>
              </div>
            </TabsContent>

            <div className="flex flex-col md:flex-row gap-4 mt-6">
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
                className={themeClasses.button + " md:w-2/3 py-3"}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    {mode === "create" ? "Добавить журнал" : "Сохранить изменения"}
                  </>
                )}
              </Button>
            </div>
          </Tabs>
        </form>
      </div>
    </div>
  );
};

export default JournalForm;
