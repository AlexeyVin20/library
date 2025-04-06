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
  Title: z.string().min(1, "Название обязательно").max(200, "Максимальная длина - 200 символов"),
  ISSN: z.string().max(20, "Максимальная длина - 20 символов").optional().nullable(),
  RegistrationNumber: z.string().max(50, "Максимальная длина - 50 символов").optional().nullable(),
  Format: z.enum(["Print", "Electronic", "Mixed"]),
  Periodicity: z.enum(["Weekly", "BiWeekly", "Monthly", "Quarterly", "BiAnnually", "Annually"]),
  PagesPerIssue: z.number().int().nonnegative(),
  Description: z.string().max(500, "Максимальная длина - 500 символов").optional().nullable(),
  Publisher: z.string().max(100, "Максимальная длина - 100 символов").optional().nullable(),
  FoundationDate: z.date(),
  Circulation: z.number().int().nonnegative(),
  IsOpenAccess: z.boolean(),
  Category: z.enum(["Scientific", "Popular", "Entertainment", "Professional", "Educational", "Literary", "News"]),
  TargetAudience: z.string().max(100, "Максимальная длина - 100 символов").optional().nullable(),
  IsPeerReviewed: z.boolean(),
  IsIndexedInRINTS: z.boolean(),
  IsIndexedInScopus: z.boolean(),
  IsIndexedInWebOfScience: z.boolean(),
  PublicationDate: z.date(),
  PageCount: z.number().int().nonnegative(),
  Cover: z.string().optional().nullable(),
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
      Title: initialData?.Title || "",
      ISSN: initialData?.ISSN || "",
      RegistrationNumber: initialData?.RegistrationNumber || "",
      Format: initialData?.Format || "Print",
      Periodicity: initialData?.Periodicity || "Monthly",
      PagesPerIssue: initialData?.PagesPerIssue || 0,
      Description: initialData?.Description || "",
      Publisher: initialData?.Publisher || "",
      FoundationDate: initialData?.FoundationDate || new Date(),
      Circulation: initialData?.Circulation || 0,
      IsOpenAccess: initialData?.IsOpenAccess || false,
      Category: initialData?.Category || "Scientific",
      TargetAudience: initialData?.TargetAudience || "",
      IsPeerReviewed: initialData?.IsPeerReviewed || false,
      IsIndexedInRINTS: initialData?.IsIndexedInRINTS || false,
      IsIndexedInScopus: initialData?.IsIndexedInScopus || false,
      IsIndexedInWebOfScience: initialData?.IsIndexedInWebOfScience || false,
      PublicationDate: initialData?.PublicationDate || new Date(),
      PageCount: initialData?.PageCount || 0,
      Cover: initialData?.Cover || "",
    },
  });

  const formValues = watch();
  const IsOpenAccess = watch("IsOpenAccess");

  useEffect(() => {
    if (initialData?.Cover) setPreviewUrl(initialData.Cover);
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
        setValue("Title", journalData.title || "");
        setValue("ISSN", issn);
        setValue("Publisher", journalData.publisher || "");
        if (journalData.subjects) setValue("Category", mapSubjectToCategory(journalData.subjects[0]));
        setValue("Format", "Print");
        setValue("Periodicity", "Monthly");
        toast({ title: "Данные получены", description: "Информация о журнале успешно заполнена" });
        handleFindCover();
      } else {
        setValue("ISSN", issn);
        toast({
          title: "Журнал не найден",
          description: "Проверьте правильность ISSN.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setValue("ISSN", issn);
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
                text: "Отвечать пользователю по-русски. Отвечать в формате json без вступлений и заключений. Задача- заполнять поля у журналов. Модель журнала содержит следующие поля: id(int), title(строка 200), issn(строка 20), registrationNumber(строка 50), format(Print/Electronic/Mixed), periodicity(Weekly/BiWeekly/Monthly/Quarterly/BiAnnually/Annually), pagesPerIssue(число), description(строка 500), publisher(строка 100), foundationDate(дата), circulation(число), isOpenAccess(boolean), category(Scientific/Popular/Entertainment/Professional/Educational/Literary/News), targetAudience(строка 100), isPeerReviewed(boolean), isIndexedInRINTS(boolean), isIndexedInScopus(boolean), isIndexedInWebOfScience(boolean), publicationDate(дата), pageCount(число), Cover - всегда оставляй null. Если информации нет, оставляй null",
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
          setValue("Cover", coverUrl);
          setPreviewUrl(coverUrl);
          toast({ title: "Данные получены", description: "Обложка журнала успешно получена." });
        }

        if (parsedData.Title) setValue("Title", parsedData.Title);
        if (parsedData.ISSN) setValue("ISSN", parsedData.ISSN);
        if (parsedData.RegistrationNumber) setValue("RegistrationNumber", parsedData.RegistrationNumber);
        if (parsedData.Format) setValue("Format", parsedData.Format);
        if (parsedData.Periodicity) setValue("Periodicity", parsedData.Periodicity);
        if (parsedData.PagesPerIssue) setValue("PagesPerIssue", parsedData.PagesPerIssue);
        if (parsedData.Description) setValue("Description", parsedData.Description);
        if (parsedData.Publisher) setValue("Publisher", parsedData.Publisher);
        if (parsedData.FoundationDate) setValue("FoundationDate", new Date(parsedData.FoundationDate));
        if (parsedData.Circulation) setValue("Circulation", parsedData.Circulation);
        if (parsedData.IsOpenAccess !== undefined) setValue("IsOpenAccess", parsedData.IsOpenAccess);
        if (parsedData.Category) setValue("Category", parsedData.Category);
        if (parsedData.TargetAudience) setValue("TargetAudience", parsedData.TargetAudience);
        if (parsedData.IsPeerReviewed !== undefined) setValue("IsPeerReviewed", parsedData.IsPeerReviewed);
        if (parsedData.IsIndexedInRINTS !== undefined) setValue("IsIndexedInRINTS", parsedData.IsIndexedInRINTS);
        if (parsedData.IsIndexedInScopus !== undefined) setValue("IsIndexedInScopus", parsedData.IsIndexedInScopus);
        if (parsedData.IsIndexedInWebOfScience !== undefined) setValue("IsIndexedInWebOfScience", parsedData.IsIndexedInWebOfScience);
        if (parsedData.PublicationDate) setValue("PublicationDate", new Date(parsedData.PublicationDate));
        if (parsedData.PageCount) setValue("PageCount", parsedData.PageCount);
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
    if (formValues.ISSN || (formValues.Title && formValues.Publisher)) {
      let coverUrl = null;
      if (formValues.ISSN) {
        try {
          const coverRes = await fetch(`https://api.altmetric.com/v1/doi/${formValues.ISSN}`);
          if (coverRes.ok) {
            const coverData = await coverRes.json();
            if (coverData.images?.small) coverUrl = coverData.images.small;
          }
        } catch (error) {
          console.error("Ошибка при поиске по ISSN:", error);
        }
      }
      if (!coverUrl && formValues.Title && formValues.Publisher) {
        try {
          const query = encodeURIComponent(`${formValues.Title} ${formValues.Publisher} journal cover`);
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
        setValue("Cover", coverUrl);
        setPreviewUrl(coverUrl);
        toast({ title: "Успех", description: "Обложка журнала успешно обновлена" });
      } else {
        const query = encodeURIComponent(formValues.Title + " журнал обложка");
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
                      <Input placeholder="Введите название журнала" {...register("Title")} className={themeClasses.input} />
                      {errors.Title && <p className="text-red-500 text-sm mt-1">{errors.Title.message}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">ISSN *</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Введите ISSN журнала"
                          {...register("ISSN")}
                          className={themeClasses.input}
                          onChange={(e) => setIssn(e.target.value)}
                          value={watch("ISSN") || ""}
                        />
                        <Button type="button" onClick={handleFetchByISSN} className={themeClasses.button} disabled={isSearchLoading}>
                          {isSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.ISSN && <p className="text-red-500 text-sm mt-1">{errors.ISSN.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Регистрационный номер</label>
                      <Input placeholder="Введите регистрационный номер" {...register("RegistrationNumber")} className={themeClasses.input} />
                      {errors.RegistrationNumber && <p className="text-red-500 text-sm mt-1">{errors.RegistrationNumber.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Издательство</label>
                      <Input placeholder="Введите название издательства" {...register("Publisher")} className={themeClasses.input} />
                      {errors.Publisher && <p className="text-red-500 text-sm mt-1">{errors.Publisher.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Дата основания</label>
                      <Input type="date" {...register("FoundationDate", { setValueAs: (v) => (v ? new Date(v) : null) })} className={themeClasses.input} />
                      {errors.FoundationDate && <p className="text-red-500 text-sm mt-1">{errors.FoundationDate.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Дата публикации</label>
                      <Input type="date" {...register("PublicationDate", { setValueAs: (v) => (v ? new Date(v) : null) })} className={themeClasses.input} />
                      {errors.PublicationDate && <p className="text-red-500 text-sm mt-1">{errors.PublicationDate.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Категория</label>
                      <Select onValueChange={(value) => setValue("Category", value as any)} defaultValue={initialData?.Category || "Scientific"}>
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
                      {errors.Category && <p className="text-red-500 text-sm mt-1">{errors.Category.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Формат</label>
                      <Select onValueChange={(value) => setValue("Format", value as any)} defaultValue={initialData?.Format || "Print"}>
                        <SelectTrigger className={themeClasses.select}><SelectValue placeholder="Выберите формат" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Print">Печатный</SelectItem>
                          <SelectItem value="Electronic">Электронный</SelectItem>
                          <SelectItem value="Mixed">Смешанный</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.Format && <p className="text-red-500 text-sm mt-1">{errors.Format.message}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2 mb-4">
                        <Checkbox id="IsOpenAccess" checked={watch("IsOpenAccess")} onCheckedChange={(checked) => setValue("IsOpenAccess", checked === true)} />
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
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Описание журнала</label>
                      <Textarea placeholder="Введите описание журнала" {...register("Description")} rows={7} className={themeClasses.textarea} />
                      {errors.Description && <p className="text-red-500 text-sm mt-1">{errors.Description.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Страниц в выпуске</label>
                      <Input type="number" placeholder="Введите количество страниц" min={0} {...register("PagesPerIssue", { valueAsNumber: true })} className={themeClasses.input} />
                      {errors.PagesPerIssue && <p className="text-red-500 text-sm mt-1">{errors.PagesPerIssue.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Количество страниц</label>
                      <Input type="number" placeholder="Введите общее количество страниц" min={0} {...register("PageCount", { valueAsNumber: true })} className={themeClasses.input} />
                      {errors.PageCount && <p className="text-red-500 text-sm mt-1">{errors.PageCount.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Тираж</label>
                      <Input type="number" placeholder="Введите тираж журнала" min={0} {...register("Circulation", { valueAsNumber: true })} className={themeClasses.input} />
                      {errors.Circulation && <p className="text-red-500 text-sm mt-1">{errors.Circulation.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Периодичность</label>
                      <Select onValueChange={(value) => setValue("Periodicity", value as any)} defaultValue={initialData?.Periodicity || "Monthly"}>
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
                      {errors.Periodicity && <p className="text-red-500 text-sm mt-1">{errors.Periodicity.message}</p>}
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-neutral-500 dark:text-white mb-2">Целевая аудитория</label>
                      <Input placeholder="Введите целевую аудиторию" {...register("TargetAudience")} className={themeClasses.input} />
                      {errors.TargetAudience && <p className="text-red-500 text-sm mt-1">{errors.TargetAudience.message}</p>}
                    </div>
                  </div>
                </TabsContent>

                {/* Дополнительные поля */}
                <TabsContent value="rare-fields" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="IsPeerReviewed" checked={watch("IsPeerReviewed")} onCheckedChange={(checked) => setValue("IsPeerReviewed", checked === true)} />
                      <label className="text-base font-semibold text-neutral-500 dark:text-white">Рецензируемый</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="IsIndexedInRINTS" checked={watch("IsIndexedInRINTS")} onCheckedChange={(checked) => setValue("IsIndexedInRINTS", checked === true)} />
                      <label className="text-base font-semibold text-neutral-500 dark:text-white">Индексируется в РИНЦ</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="IsIndexedInScopus" checked={watch("IsIndexedInScopus")} onCheckedChange={(checked) => setValue("IsIndexedInScopus", checked === true)} />
                      <label className="text-base font-semibold text-neutral-500 dark:text-white">Индексируется в Scopus</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="IsIndexedInWebOfScience" checked={watch("IsIndexedInWebOfScience")} onCheckedChange={(checked) => setValue("IsIndexedInWebOfScience", checked === true)} />
                      <label className="text-base font-semibold text-neutral-500 dark:text-white">Индексируется в Web of Science</label>
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