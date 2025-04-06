"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Calendar, BookText, Edit, Trash, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Интерфейс модели журнала
interface Journal {
  Id: number;
  Title: string;
  ISSN: string;
  RegistrationNumber?: string | null;
  Format: "Print" | "Electronic" | "Mixed";
  Periodicity: "Weekly" | "BiWeekly" | "Monthly" | "Quarterly" | "BiAnnually" | "Annually";
  PagesPerIssue: number;
  Description?: string | null;
  Publisher?: string | null;
  FoundationDate: string;
  Circulation: number;
  IsOpenAccess: boolean;
  Category: "Scientific" | "Popular" | "Entertainment" | "Professional" | "Educational" | "Literary" | "News";
  TargetAudience?: string | null;
  IsPeerReviewed: boolean;
  IsIndexedInRINTS: boolean;
  IsIndexedInScopus: boolean;
  IsIndexedInWebOfScience: boolean;
  PublicationDate: string;
  PageCount: number;
  Cover?: string | null;
}

// Theme classes
const getThemeClasses = () => {
  return {
    card: "bg-white/70 dark:bg-neutral-200/70 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform hover:translate-y-[-5px] transition-all duration-300",
    statsCard: "bg-white/70 dark:bg-neutral-200/70 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform hover:translate-y-[-5px] transition-all duration-300",
    mainContainer: "bg-gradient-to-r from-brand-800/30 via-neutral-800/30 to-brand-900/30 dark:from-neutral-200 dark:via-brand-200 dark:to-neutral-300",
    button: "bg-primary-admin/90 hover:bg-primary-admin text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2",
  };
};

// Компонент для отображения деталей журнала
const JournalDetails = ({ journal }: { journal: Journal }) => {
  const themeClasses = getThemeClasses();
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить этот журнал?")) return;
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
      
      const res = await fetch(`${baseUrl}/api/journals/${journal.Id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Ошибка при удалении журнала");
      }
      
      toast({
        title: "Журнал удален",
        description: "Журнал был успешно удален",
      });
      
      router.push("/admin/journals");
    } catch (error) {
      console.error("Ошибка при удалении журнала:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить журнал",
        variant: "destructive",
      });
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Преобразование перечислений в русский текст
  const formatEnum = (value: string, type: string) => {
    const formatMap = {
      format: {
        Print: "Печатный",
        Electronic: "Электронный",
        Mixed: "Смешанный",
      },
      periodicity: {
        Weekly: "Еженедельно",
        BiWeekly: "Раз в две недели",
        Monthly: "Ежемесячно",
        Quarterly: "Ежеквартально",
        BiAnnually: "Раз в полгода",
        Annually: "Ежегодно",
      },
      category: {
        Scientific: "Научный",
        Popular: "Популярный",
        Entertainment: "Развлекательный",
        Professional: "Профессиональный",
        Educational: "Образовательный",
        Literary: "Литературный",
        News: "Новостной",
      },
    };
    
    return formatMap[type][value] || value;
  };

  return (
    <div className={`min-h-screen ${themeClasses.mainContainer} p-6`}>
      <div className="flex flex-col space-y-6">
        {/* Верхняя панель с кнопками */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-neutral-600 dark:text-neutral-300 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </button>
          
          <div className="flex space-x-3">
            <Link href={`/admin/journals/${journal.Id}/update`}>
              <button className={themeClasses.button}>
                <Edit className="h-4 w-4 mr-2 inline" />
                Редактировать
              </button>
            </Link>
            <button 
              onClick={handleDelete}
              className="bg-red-500/90 hover:bg-red-500 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2"
            >
              <Trash className="h-4 w-4 mr-2 inline" />
              Удалить
            </button>
          </div>
        </div>
        
        {/* Основной контент */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Левая колонка - обложка */}
          <div className="md:col-span-1">
            <div className={`${themeClasses.card} overflow-hidden aspect-[3/4] relative`}>
              {journal.Cover ? (
                <Image
                  src={journal.Cover}
                  alt={journal.Title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <BookOpen className="h-20 w-20 text-gray-400" />
                </div>
              )}
            </div>
          </div>
          
          {/* Правая колонка - информация о журнале */}
          <div className="md:col-span-2 space-y-6">
            {/* Основная информация */}
            <div className={`${themeClasses.card} p-6`}>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                {journal.Title}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">ISSN:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{journal.ISSN}</p>
                </div>
                
                {journal.RegistrationNumber && (
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Регистрационный номер:</p>
                    <p className="text-neutral-800 dark:text-neutral-200">{journal.RegistrationNumber}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Формат:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{formatEnum(journal.Format, 'format')}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Категория:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{formatEnum(journal.Category, 'category')}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Издательство:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{journal.Publisher || "Не указано"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Дата основания:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{formatDate(journal.FoundationDate)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Периодичность:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{formatEnum(journal.Periodicity, 'periodicity')}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Тираж:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{journal.Circulation}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Страниц в выпуске:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{journal.PagesPerIssue}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Количество страниц:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{journal.PageCount}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Дата публикации:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{formatDate(journal.PublicationDate)}</p>
                </div>
                
                {journal.TargetAudience && (
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Целевая аудитория:</p>
                    <p className="text-neutral-800 dark:text-neutral-200">{journal.TargetAudience}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Дополнительная информация */}
            <div className={`${themeClasses.card} p-6`}>
              <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
                Дополнительная информация
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <div className={`h-5 w-5 rounded-full ${journal.IsOpenAccess ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Открытый доступ</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`h-5 w-5 rounded-full ${journal.IsPeerReviewed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Рецензируемый</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`h-5 w-5 rounded-full ${journal.IsIndexedInRINTS ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Индексируется в РИНЦ</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`h-5 w-5 rounded-full ${journal.IsIndexedInScopus ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Индексируется в Scopus</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`h-5 w-5 rounded-full ${journal.IsIndexedInWebOfScience ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Индексируется в Web of Science</span>
                </div>
              </div>
            </div>
            
            {/* Описание */}
              {journal.Description && (
              <div className={`${themeClasses.card} p-6`}>
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
                  Описание
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{journal.Description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function JournalDetailPage({
  params,
}: {
  params: Promise<{ journalId: string }>;
}) {
  const [journal, setJournal] = useState<Journal | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Распарсим params
  const resolvedParams = use(params);

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

        const res = await fetch(`${baseUrl}/api/journals/${resolvedParams.journalId}`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          setError(true);
          return;
        }

        const journalData = await res.json();
        setJournal(journalData);
      } catch (error) {
        console.error("Error fetching journal:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchJournal();
  }, [resolvedParams.journalId]);

  if (error) return notFound();
  if (loading) return <div className="text-center text-neutral-500 dark:text-neutral-400">Загрузка...</div>;
  if (!journal) return <div className="text-center text-neutral-500 dark:text-neutral-400">Журнал не найден</div>;

  return <JournalDetails journal={journal} />;
}
