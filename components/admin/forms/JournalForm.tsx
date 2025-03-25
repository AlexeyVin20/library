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

// Определение стилей с эффектом гласморфизма
const getThemeClasses = () => {
  return {
    card: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300",
    statsCard: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300",
    mainContainer: "bg-gray-100/70 dark:bg-neutral-900/70 backdrop-blur-xl min-h-screen p-6",
    button: "bg-gradient-to-r from-primary-admin/90 to-primary-admin/70 dark:from-primary-admin/80 dark:to-primary-admin/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-5 py-3 flex items-center justify-center gap-2",
    input: "bg-white/40 dark:bg-neutral-300/40 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-4 py-2",
    textarea: "bg-white/40 dark:bg-neutral-300/40 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-4 py-2 resize-none",
    tab: "bg-white/20 dark:bg-neutral-200/20 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-lg",
    tabActive: "bg-primary-admin/90 text-white rounded-lg",
    select: "bg-white/40 dark:bg-neutral-300/40 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg",
    sectionTitle: "text-2xl font-bold mb-4 text-neutral-500 dark:text-white border-b pb-2 border-white/30 dark:border-neutral-700/30",
  };
};

// Zod-схема для журнала
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

export type JournalInput = z.infer<typeof journalSchema>;

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

  useEffect(() => {
    if (initialData?.coverImageUrl) setPreviewUrl(initialData.coverImageUrl);
  }, [initialData]);

  useEffect(() => {
    if (geminiImage) handleGeminiUpload();
  }, [geminiImage]);

  // Поиск журнала по ISSN
  const handleFetchByISSN = async () => {
    if (!issn) {
      toast({ title: "Ошибка", description: "Введите ISSN для поиска", variant: "destructive" });
      return;
    }
    setIsSearchLoading(true);
    try {
      const res = await fetch(`https://api.crossref.org/journals/${issn}`);
      const data = await res.json();
      if (data.status === "ok" && data.message) {
        const journalData = data.message;
        setValue("title", journalData.title || "");
        setValue("issn", issn);
        setValue("publisher", journalData.publisher || "");
        if (journalData.subjects) setValue("category", mapSubjectToCategory(journalData.subjects[0]));
        setValue("format", "Print");
        setValue("periodicity", "Monthly");
        toast({ title: "Данные получены", description: "Информация о журнале успешно заполнена" });
        handleFindCover();
      } else {
        setValue("issn", issn);
        toast({
          title: "Журнал не найден",
          description: "Проверьте правильность ISSN.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setValue("issn", issn);
      toast({ title: "Ошибка", description: "Ошибка при поиске по ISSN.", variant: "destructive" });
    } finally {
      setIsSearchLoading(false);
    }
  };

  const mapSubjectToCategory = (subject: string): "Scientific" | "Popular" | "Entertainment" | "Professional" | "Educational" | "Literary" | "News" => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes("science") || subjectLower.includes("research")) return "Scientific";
    if (subjectLower.includes("education")) return "Educational";
    if (subjectLower.includes("news")) return "News";
    if (subjectLower.includes("literature") || subjectLower.includes("art")) return "Literary";
    if (subjectLower.includes("professional")) return "Professional";
    if (subjectLower.includes("entertainment")) return "Entertainment";
    return "Popular";
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

  const handleRemoveCover = () => {
    setPreviewUrl(null);
    setValue("coverImageUrl", "");
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result.split(",")[1]);
        else reject(new Error("Не удалось преобразовать файл в base64"));
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const GeminiFileUpload = ({ onFileChange }: { onFileChange: (base64: string) => void }) => {
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
        <input type="file" accept="image/*" onChange={handleChange} className="hidden" id="geminiFileInput" />
        <label htmlFor="geminiFileInput" className="cursor-pointer text-center text-gray-500">
          Перетащите файл сюда или нажмите для загрузки
        </label>
        {fileName && <p className="mt-2 text-sm text-gray-500">{fileName}</p>}
      </div>
    );
  };

  const handleGeminiFileChange = (base64: string) => setGeminiImage(base64);

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
              { inlineData: { mimeType: "image/jpeg", data: geminiImage } },
            ],
          },
        ],
      };
      const res = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) {
        let jsonString = responseText.trim().replace(/^```json|```$/g, "").trim();
        const parsedData = JSON.parse(jsonString);
        let coverUrl = null;

        if (parsedData.issn) {
          try {
            const coverRes = await fetch(`https://api.altmetric.com/v1/doi/${parsedData.issn}`);
            if (coverRes.ok) {
              const coverData = await coverRes.json();
              if (coverData.images?.small) coverUrl = coverData.images.small;
            }
          } catch (error) {
            console.error("Ошибка при поиске обложки по ISSN:", error);
          }
        }

        if (!coverUrl && parsedData.title && parsedData.publisher) {
          try {
            const query = encodeURIComponent(`${parsedData.title} ${parsedData.publisher} journal cover`);
            const googleImages = await fetch(
              `https://www.googleapis.com/customsearch/v1?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&cx=YOUR_CUSTOM_SEARCH_ENGINE_ID&q=${query}&searchType=image&num=1`
            );
            if (googleImages.ok) {
              const imageData = await googleImages.json();
              if (imageData.items?.length) coverUrl = imageData.items[0].link;
            }
          } catch (error) {
            console.error("Ошибка при поиске обложки через Google:", error);
          }
        }

        if (!coverUrl) {
          const query = encodeURIComponent(parsedData.title + " журнал обложка");
          window.open(`https://cse.google.com/cse?cx=b421413d1a0984f58#gsc.tab=0&gsc.q=${query}`, "_blank");
          setShowManualCoverInput(true);
          toast({
            title: "Обложка не найдена",
            description: "Поиск открыт в новой вкладке. Вставьте ссылку на обложку.",
            variant: "destructive",
          });
        } else {
          setValue("coverImageUrl", coverUrl);
          setPreviewUrl(coverUrl);
          toast({ title: "Данные получены", description: "Обложка журнала успешно получена." });
        }

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

  const handleFindCover = async () => {
    setShowManualCoverInput(false);
    if (formValues.issn || (formValues.title && formValues.publisher)) {
      let coverUrl = null;
      if (formValues.issn) {
        try {
          const coverRes = await fetch(`https://api.altmetric.com/v1/doi/${formValues.issn}`);
          if (coverRes.ok) {
            const coverData = await coverRes.json();
            if (coverData.images?.small) coverUrl = coverData.images.small;
          }
        } catch (error) {
          console.error("Ошибка при поиске по ISSN:", error);
        }
      }
      if (!coverUrl && formValues.title && formValues.publisher) {
        try {
          const query = encodeURIComponent(`${formValues.title} ${formValues.publisher} journal cover`);
          const googleImages = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&cx=YOUR_CUSTOM_SEARCH_ENGINE_ID&q=${query}&searchType=image&num=1`
          );
          if (googleImages.ok) {
            const imageData = await googleImages.json();
            if (imageData.items?.length) coverUrl = imageData.items[0].link;
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
        window.open(`https://cse.google.com/cse?cx=b421413d1a0984f58#gsc.tab=0&gsc.q=${query}`, "_blank");
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
        description: "Укажите ISSN или название и издателя журнала",
        variant: "destructive",
      });
    }
  };

  // Функция для импорта данных журнала из JSON
  const fillFormFromJson = (data: any) => {
    if (data.Title) setValue("title", data.Title);
    if (data.ISSN) setValue("issn", data.ISSN);
    if (data.RegistrationNumber) setValue("registrationNumber", data.RegistrationNumber);
    if (data.Format) {
      // Преобразуем числовой формат в строковый
      let formatValue: "Print" | "Electronic" | "Mixed" = "Print";
      if (data.Format === "3" || data.Format === 3) formatValue = "Mixed";
      else if (data.Format === "2" || data.Format === 2) formatValue = "Electronic";
      setValue("format", formatValue);
    }
    if (data.Periodicity) {
      // Преобразуем числовой формат в строковый
      let periodicityValue: "Weekly" | "BiWeekly" | "Monthly" | "Quarterly" | "BiAnnually" | "Annually" = "Monthly";
      
      // Если это число или строка с числом, определяем значение
      if (data.Periodicity === "1" || data.Periodicity === 1) periodicityValue = "Weekly";
      else if (data.Periodicity === "2" || data.Periodicity === 2) periodicityValue = "BiWeekly";
      else if (data.Periodicity === "3" || data.Periodicity === 3) periodicityValue = "Monthly";
      else if (data.Periodicity === "4" || data.Periodicity === 4) periodicityValue = "Quarterly";
      else if (data.Periodicity === "5" || data.Periodicity === 5) periodicityValue = "BiAnnually";
      else if (data.Periodicity === "6" || data.Periodicity === 6) periodicityValue = "Annually";
      
      setValue("periodicity", periodicityValue);
    }
    if (data.PagesPerIssue !== undefined) setValue("pagesPerIssue", data.PagesPerIssue);
    if (data.Description) setValue("description", data.Description);
    if (data.Publisher) setValue("publisher", data.Publisher);
    if (data.FoundationDate) setValue("foundationDate", new Date(data.FoundationDate));
    if (data.Circulation !== undefined) setValue("circulation", data.Circulation);
    if (data.IsOpenAccess !== undefined) setValue("isOpenAccess", data.IsOpenAccess);
    if (data.Category) {
      // Преобразуем строковое числовое значение в категорию
      let categoryValue: "Scientific" | "Popular" | "Entertainment" | "Professional" | "Educational" | "Literary" | "News" = "Scientific";
      
      // Если категория пришла в виде числа или строки с числом
      if (data.Category === "1" || data.Category === 1) categoryValue = "Scientific";
      else if (data.Category === "2" || data.Category === 2) categoryValue = "Popular";
      else if (data.Category === "3" || data.Category === 3) categoryValue = "Entertainment";
      else if (data.Category === "4" || data.Category === 4) categoryValue = "Professional";
      else if (data.Category === "5" || data.Category === 5) categoryValue = "Educational";
      else if (data.Category === "6" || data.Category === 6) categoryValue = "Literary";
      else if (data.Category === "7" || data.Category === 7) categoryValue = "News";
      // Если пришло значение не из списка, используем Scientific
      else if (typeof data.Category === "string" && !isNaN(Number(data.Category))) {
        // Дополнительная обработка для значений, которые не в диапазоне 1-7
        categoryValue = "Scientific";
      }
      
      setValue("category", categoryValue);
    }
    if (data.TargetAudience) setValue("targetAudience", data.TargetAudience);
    if (data.IsPeerReviewed !== undefined) setValue("isPeerReviewed", data.IsPeerReviewed);
    if (data.IsIndexedInRINTS !== undefined) setValue("isIndexedInRINTS", data.IsIndexedInRINTS);
    if (data.IsIndexedInScopus !== undefined) setValue("isIndexedInScopus", data.IsIndexedInScopus);
    if (data.IsIndexedInWebOfScience !== undefined) setValue("isIndexedInWebOfScience", data.IsIndexedInWebOfScience);
    if (data.PublicationDate) setValue("publicationDate", new Date(data.PublicationDate));
    if (data.PageCount !== undefined) setValue("pageCount", data.PageCount);
    if (data.Cover) {
      setValue("coverImageUrl", data.Cover);
      setPreviewUrl(data.Cover);
    }
    
    toast({ 
      title: "Данные загружены", 
      description: "Информация из JSON успешно импортирована" 
    });
  };

  const onFormSubmit = async (values: z.infer<typeof journalSchema>) => await onSubmit(values);

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses.mainContainer}`}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/30 dark:bg-neutral-900/30 border-b border-white/20 dark:border-neutral-700/20 p-4 flex items-center justify-between shadow-sm mb-6">
        <h1 className="text-2xl font-bold text-neutral-500 dark:text-white">
          {mode === "create" ? "Добавление журнала" : "Редактирование журнала"}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto space-y-8 p-6">
        <Card className={themeClasses.card}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center text-neutral-500 dark:text-white">
              <BookOpen className="mr-2 h-6 w-6 text-primary-admin" />
              {mode === "create" ? "Добавление журнала" : "Редактирование журнала"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Блок для Gemini AI */}
            <div className={themeClasses.statsCard}>
              <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">
                Загрузить изображение для сканирования обложки журнала
              </label>
              <GeminiFileUpload onFileChange={handleGeminiFileChange} />
              {geminiLoading && (
                <div className="flex items-center mt-2">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Обработка изображения...</span>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 gap-4 mb-8 w-full bg-transparent h-12">
                  <TabsTrigger value="basic-info" className={`${themeClasses.tab} ${activeTab === "basic-info" ? themeClasses.tabActive : ""} flex items-center justify-center`}>
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                    Основная информация
                  </TabsTrigger>
                  <TabsTrigger value="details" className={`${themeClasses.tab} ${activeTab === "details" ? themeClasses.tabActive : ""} flex items-center justify-center`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Детальная информация
                  </TabsTrigger>
                  <TabsTrigger value="rare-fields" className={`${themeClasses.tab} ${activeTab === "rare-fields" ? themeClasses.tabActive : ""} flex items-center justify-center`}>
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Дополнительно
                  </TabsTrigger>
                </TabsList>

                {/* Основная информация */}
                <TabsContent value="basic-info" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Название журнала *</label>
                      <Input placeholder="Введите название журнала" {...register("title")} className={themeClasses.input} />
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">ISSN *</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Введите ISSN журнала"
                          {...register("issn")}
                          className={themeClasses.input}
                          onChange={(e) => setIssn(e.target.value)}
                          value={watch("issn") || ""}
                        />
                        <Button type="button" onClick={handleFetchByISSN} className={themeClasses.button} disabled={isSearchLoading}>
                          {isSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.issn && <p className="text-red-500 text-sm mt-1">{errors.issn.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Регистрационный номер</label>
                      <Input placeholder="Введите регистрационный номер" {...register("registrationNumber")} className={themeClasses.input} />
                      {errors.registrationNumber && <p className="text-red-500 text-sm mt-1">{errors.registrationNumber.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Издательство</label>
                      <Input placeholder="Введите название издательства" {...register("publisher")} className={themeClasses.input} />
                      {errors.publisher && <p className="text-red-500 text-sm mt-1">{errors.publisher.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Дата основания</label>
                      <Input type="date" {...register("foundationDate", { setValueAs: (v) => (v ? new Date(v) : null) })} className={themeClasses.input} />
                      {errors.foundationDate && <p className="text-red-500 text-sm mt-1">{errors.foundationDate.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Дата публикации</label>
                      <Input type="date" {...register("publicationDate", { setValueAs: (v) => (v ? new Date(v) : null) })} className={themeClasses.input} />
                      {errors.publicationDate && <p className="text-red-500 text-sm mt-1">{errors.publicationDate.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Категория</label>
                      <Select onValueChange={(value) => setValue("category", value as any)} defaultValue={initialData?.category || "Scientific"}>
                        <SelectTrigger className={themeClasses.select}><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
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
                      {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Формат</label>
                      <Select onValueChange={(value) => setValue("format", value as any)} defaultValue={initialData?.format || "Print"}>
                        <SelectTrigger className={themeClasses.select}><SelectValue placeholder="Выберите формат" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Print">Печатный</SelectItem>
                          <SelectItem value="Electronic">Электронный</SelectItem>
                          <SelectItem value="Mixed">Смешанный</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.format && <p className="text-red-500 text-sm mt-1">{errors.format.message}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2 mb-4">
                        <Checkbox id="isOpenAccess" checked={isOpenAccess} onCheckedChange={(checked) => setValue("isOpenAccess", checked === true)} />
                        <label className="text-base font-semibold text-neutral-500 dark:text-white">Открытый доступ</label>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2 text-center">Обложка журнала</label>
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
                            <div className={`${themeClasses.card} w-48 h-64 mb-4 flex items-center justify-center text-neutral-500 dark:text-neutral-400`}>
                              Нет обложки
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button type="button" onClick={() => document.getElementById("coverInput")?.click()} className={themeClasses.button}>
                              {previewUrl ? "Изменить обложку" : "Загрузить обложку"}
                            </Button>
                            <Button type="button" onClick={handleFindCover} className={themeClasses.button}>
                              Обновить обложку
                            </Button>
                          </div>
                          <input id="coverInput" type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                        </div>
                        {showManualCoverInput && (
                          <div className="flex flex-col w-full max-w-xs">
                            <div className="mt-3">
                              <label className="block text-xs font-semibold text-neutral-500 dark:text-white mb-1">Вставьте ссылку на обложку</label>
                              <Input
                                placeholder="Ссылка на обложку"
                                value={manualCoverUrl}
                                onChange={(e) => {
                                  setManualCoverUrl(e.target.value);
                                  setValue("coverImageUrl", e.target.value);
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
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Описание журнала</label>
                      <Textarea placeholder="Введите описание журнала" {...register("description")} rows={7} className={themeClasses.textarea} />
                      {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Страниц в выпуске</label>
                      <Input type="number" placeholder="Введите количество страниц" min={0} {...register("pagesPerIssue", { valueAsNumber: true })} className={themeClasses.input} />
                      {errors.pagesPerIssue && <p className="text-red-500 text-sm mt-1">{errors.pagesPerIssue.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Количество страниц</label>
                      <Input type="number" placeholder="Введите общее количество страниц" min={0} {...register("pageCount", { valueAsNumber: true })} className={themeClasses.input} />
                      {errors.pageCount && <p className="text-red-500 text-sm mt-1">{errors.pageCount.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Тираж</label>
                      <Input type="number" placeholder="Введите тираж журнала" min={0} {...register("circulation", { valueAsNumber: true })} className={themeClasses.input} />
                      {errors.circulation && <p className="text-red-500 text-sm mt-1">{errors.circulation.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Периодичность</label>
                      <Select onValueChange={(value) => setValue("periodicity", value as any)} defaultValue={initialData?.periodicity || "Monthly"}>
                        <SelectTrigger className={themeClasses.select}><SelectValue placeholder="Выберите периодичность" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Weekly">Еженедельно</SelectItem>
                          <SelectItem value="BiWeekly">Раз в две недели</SelectItem>
                          <SelectItem value="Monthly">Ежемесячно</SelectItem>
                          <SelectItem value="Quarterly">Ежеквартально</SelectItem>
                          <SelectItem value="BiAnnually">Раз в полгода</SelectItem>
                          <SelectItem value="Annually">Ежегодно</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.periodicity && <p className="text-red-500 text-sm mt-1">{errors.periodicity.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Целевая аудитория</label>
                      <Input placeholder="Введите целевую аудиторию" {...register("targetAudience")} className={themeClasses.input} />
                      {errors.targetAudience && <p className="text-red-500 text-sm mt-1">{errors.targetAudience.message}</p>}
                    </div>
                  </div>
                </TabsContent>

                {/* Дополнительные поля */}
                <TabsContent value="rare-fields" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="isPeerReviewed" checked={watch("isPeerReviewed")} onCheckedChange={(checked) => setValue("isPeerReviewed", checked === true)} />
                      <label className="text-base font-semibold text-neutral-500 dark:text-white">Рецензируемый</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="isIndexedInRINTS" checked={watch("isIndexedInRINTS")} onCheckedChange={(checked) => setValue("isIndexedInRINTS", checked === true)} />
                      <label className="text-base font-semibold text-neutral-500 dark:text-white">Индексируется в РИНЦ</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="isIndexedInScopus" checked={watch("isIndexedInScopus")} onCheckedChange={(checked) => setValue("isIndexedInScopus", checked === true)} />
                      <label className="text-base font-semibold text-neutral-500 dark:text-white">Индексируется в Scopus</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="isIndexedInWebOfScience" checked={watch("isIndexedInWebOfScience")} onCheckedChange={(checked) => setValue("isIndexedInWebOfScience", checked === true)} />
                      <label className="text-base font-semibold text-neutral-500 dark:text-white">Индексируется в Web of Science</label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-4 border-t border-white/10 dark:border-neutral-700/30 flex flex-col md:flex-row gap-4">
                <Button
                  type="button"
                  onClick={() => {
                    try {
                      // Ожидаем, что пользователь скопировал JSON в буфер обмена
                      navigator.clipboard.readText().then(text => {
                        try {
                          const jsonData = JSON.parse(text);
                          fillFormFromJson(jsonData);
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
                  className={`${themeClasses.button} py-3 w-full md:w-1/3`}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Импорт из JSON
                </Button>
                <Button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-neutral-500/90 hover:bg-neutral-500 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-3 md:w-1/3"
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={isSubmitting} className={`${themeClasses.button} py-3 md:w-2/3`}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5 mr-2" />
                      {mode === "create" ? "Добавить журнал" : "Сохранить изменения"}
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

export default JournalForm;