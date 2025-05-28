"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Calendar, BookText, Edit, Trash, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Интерфейс модели журнала
interface Journal {
  id: number;
  title: string;
  issn: string;
  registrationNumber?: string | null;
  format: "Print" | "Electronic" | "Mixed";
  periodicity: "Weekly" | "BiWeekly" | "Monthly" | "Quarterly" | "BiAnnually" | "Annually";
  pagesPerIssue: number;
  description?: string | null;
  publisher?: string | null;
  foundationDate: string;
  circulation: number;
  isOpenAccess: boolean;
  category: "Scientific" | "Popular" | "Entertainment" | "Professional" | "Educational" | "Literary" | "News";
  targetAudience?: string | null;
  isPeerReviewed: boolean;
  isIndexedInRINTS: boolean;
  isIndexedInScopus: boolean;
  isIndexedInWebOfScience: boolean;
  publicationDate: string;
  pageCount: number;
  coverImageUrl?: string | null;
  website?: string | null;
  editorInChief?: string | null;
  editorialBoard?: string[] | null;
  issues?: IssueShort[] | null;
}

// Интерфейс для API-модели журнала
interface ApiJournal {
  id: number;
  title: string;
  issn?: string;
  publisher?: string;
  startYear?: number;
  endYear?: number;
  description?: string;
  coverImage?: string;
  website?: string;
  issues?: IssueShort[];
}

// Интерфейс для краткой информации о выпуске
interface IssueShort {
  id: number;
  volumeNumber: number;
  issueNumber: number;
  publicationDate: string;
  cover?: string | null;
  specialTheme?: string | null;
}

// Функция для преобразования данных API к нашему интерфейсу
const adaptApiJournalToJournal = (apiJournal: ApiJournal): Journal => {
  return {
    id: apiJournal.id,
    title: apiJournal.title,
    issn: apiJournal.issn || '',
    registrationNumber: null,
    format: "Print" as const,
    periodicity: "Monthly" as const,
    pagesPerIssue: 0,
    description: apiJournal.description || null,
    publisher: apiJournal.publisher || null,
    foundationDate: apiJournal.startYear?.toString() || new Date().toISOString(),
    circulation: 0,
    isOpenAccess: false,
    category: "Scientific" as const,
    targetAudience: null,
    isPeerReviewed: false,
    isIndexedInRINTS: false,
    isIndexedInScopus: false,
    isIndexedInWebOfScience: false,
    publicationDate: apiJournal.startYear?.toString() || new Date().toISOString(),
    pageCount: 0,
    coverImageUrl: apiJournal.coverImage || null,
    website: apiJournal.website || null,
    editorInChief: null,
    editorialBoard: null,
    issues: apiJournal.issues || null
  };
};

// Theme classes
const getThemeClasses = () => {
  return {
    card: "bg-white/70 dark:bg-neutral-200/70 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform hover:translate-y-[-5px] transition-all duration-300",
    statsCard: "bg-white/70 dark:bg-neutral-200/70 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform hover:translate-y-[-5px] transition-all duration-300",
    mainContainer: "bg-gradient-to-r from-brand-800/30 via-neutral-800/30 to-brand-900/30 dark:from-neutral-200 dark:via-brand-200 dark:to-neutral-300",
    button: "bg-primary-admin/90 hover:bg-primary-admin text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2"
  };
};

// Компонент для отображения деталей журнала
const JournalDetails = ({
  journal
}: {
  journal: Journal;
}) => {
  const themeClasses = getThemeClasses();
  const router = useRouter();
  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить этот журнал?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const res = await fetch(`${baseUrl}/api/journals/${journal.id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        throw new Error("Ошибка при удалении журнала");
      }
      toast({
        title: "Журнал удален",
        description: "Журнал был успешно удален"
      });
      router.push("/admin/journals");
    } catch (error) {
      console.error("Ошибка при удалении журнала:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить журнал",
        variant: "destructive"
      });
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    try {
      // Проверяем, что dateString не пустая и не null
      if (!dateString) {
        return "Дата не указана";
      }
      const date = new Date(dateString);

      // Проверяем валидность даты (NaN возвращается, если дата невалидна)
      if (isNaN(date.getTime())) {
        return "Некорректная дата";
      }
      return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error("Ошибка форматирования даты:", error);
      return "Ошибка в дате";
    }
  };

  // Преобразование перечислений в русский текст
  const formatEnum = (value: string, type: 'format' | 'periodicity' | 'category') => {
    const formatMap = {
      format: {
        Print: "Печатный",
        Electronic: "Электронный",
        Mixed: "Смешанный"
      },
      periodicity: {
        Weekly: "Еженедельно",
        BiWeekly: "Раз в две недели",
        Monthly: "Ежемесячно",
        Quarterly: "Ежеквартально",
        BiAnnually: "Раз в полгода",
        Annually: "Ежегодно"
      },
      category: {
        Scientific: "Научный",
        Popular: "Популярный",
        Entertainment: "Развлекательный",
        Professional: "Профессиональный",
        Educational: "Образовательный",
        Literary: "Литературный",
        News: "Новостной"
      }
    } as const;
    return formatMap[type][value as keyof typeof formatMap[typeof type]] || value;
  };
  return <div className={`min-h-screen ${themeClasses.mainContainer} p-6`}>
      <div className="flex flex-col space-y-6">
        {/* Верхняя панель с кнопками */}
        <div className="flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center text-neutral-600 dark:text-neutral-300 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </button>
          
          <div className="flex space-x-3">
            <Link href={`/admin/journals/${journal.id}/update`}>
              <button className={themeClasses.button}>
                <Edit className="h-4 w-4 mr-2 inline" />
                Редактировать
              </button>
            </Link>
            <button onClick={handleDelete} className="bg-red-500/90 hover:bg-red-500 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2">
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
              {journal.coverImageUrl ? <Image src={journal.coverImageUrl} alt={journal.title} fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <BookOpen className="h-20 w-20 text-gray-400" />
                </div>}
            </div>
          </div>
          
          {/* Правая колонка - информация о журнале */}
          <div className="md:col-span-2 space-y-6">
            {/* Основная информация */}
            <div className={`${themeClasses.card} p-6`}>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                {journal.title}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">ISSN:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{journal.issn}</p>
                </div>
                
                {journal.registrationNumber && <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Регистрационный номер:</p>
                    <p className="text-neutral-800 dark:text-neutral-200">{journal.registrationNumber}</p>
                  </div>}
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Формат:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{formatEnum(journal.format, 'format')}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Категория:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{formatEnum(journal.category, 'category')}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Издательство:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{journal.publisher || "Не указано"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Дата основания:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{formatDate(journal.foundationDate)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Периодичность:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{formatEnum(journal.periodicity, 'periodicity')}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Тираж:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{journal.circulation}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Страниц в выпуске:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{journal.pagesPerIssue}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Количество страниц:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{journal.pageCount}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Дата публикации:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{formatDate(journal.publicationDate)}</p>
                </div>
                
                {journal.targetAudience && <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Целевая аудитория:</p>
                    <p className="text-neutral-800 dark:text-neutral-200">{journal.targetAudience}</p>
                  </div>}
                
                {journal.website && <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Веб-сайт:</p>
                    <a href={journal.website} target="_blank" rel="noopener noreferrer" className="text-primary-admin hover:text-primary-admin/80 dark:text-primary-admin dark:hover:text-primary-admin/80">
                      {journal.website}
                    </a>
                  </div>}
                
                {journal.editorInChief && <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Главный редактор:</p>
                    <p className="text-neutral-800 dark:text-neutral-200">{journal.editorInChief}</p>
                  </div>}
              </div>
            </div>
            
            {/* Дополнительная информация */}
            <div className={`${themeClasses.card} p-6`}>
              <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
                Индексация журнала
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${journal.isPeerReviewed ? "bg-green-100 dark:bg-green-800/20" : "bg-red-100 dark:bg-red-800/20"} p-3 rounded-lg`}>
                  <p className="text-center font-medium">Рецензируемый</p>
                  <p className="text-center text-2xl font-bold">{journal.isPeerReviewed ? "Да" : "Нет"}</p>
                </div>
                <div className={`${journal.isIndexedInRINTS ? "bg-green-100 dark:bg-green-800/20" : "bg-red-100 dark:bg-red-800/20"} p-3 rounded-lg`}>
                  <p className="text-center font-medium">РИНЦ</p>
                  <p className="text-center text-2xl font-bold">{journal.isIndexedInRINTS ? "Да" : "Нет"}</p>
                </div>
                <div className={`${journal.isIndexedInScopus ? "bg-green-100 dark:bg-green-800/20" : "bg-red-100 dark:bg-red-800/20"} p-3 rounded-lg`}>
                  <p className="text-center font-medium">Scopus</p>
                  <p className="text-center text-2xl font-bold">{journal.isIndexedInScopus ? "Да" : "Нет"}</p>
                </div>
                <div className={`${journal.isIndexedInWebOfScience ? "bg-green-100 dark:bg-green-800/20" : "bg-red-100 dark:bg-red-800/20"} p-3 rounded-lg md:col-start-2`}>
                  <p className="text-center font-medium">Web of Science</p>
                  <p className="text-center text-2xl font-bold">{journal.isIndexedInWebOfScience ? "Да" : "Нет"}</p>
                </div>
              </div>
            </div>
            
            {/* Редакционная коллегия */}
            {journal.editorialBoard && journal.editorialBoard.length > 0 && <div className={`${themeClasses.card} p-6`}>
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
                  Редакционная коллегия
                </h2>
                <ul className="list-disc list-inside">
                  {journal.editorialBoard.map((member, index) => <li key={index} className="mb-1 text-neutral-800 dark:text-neutral-200">{member}</li>)}
                </ul>
              </div>}
            
            {/* Выпуски */}
            {journal.issues && journal.issues.length > 0 && <div className={`${themeClasses.card} p-6`}>
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Выпуски журнала
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {journal.issues.map(issue => <Link href={`/admin/journals/${journal.id}/issues/${issue.id}`} key={issue.id}>
                      <div className={`${themeClasses.statsCard} h-full cursor-pointer`}>
                        <div className="relative w-full aspect-[3/4] mb-2 rounded overflow-hidden">
                          {issue.cover ? <Image src={issue.cover} alt={`Выпуск ${issue.volumeNumber}.${issue.issueNumber}`} fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <BookText className="h-12 w-12 text-gray-400" />
                            </div>}
                        </div>
                        <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
                          Том {issue.volumeNumber}, Выпуск {issue.issueNumber}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          {formatDate(issue.publicationDate)}
                        </p>
                        {issue.specialTheme && <p className="text-sm text-neutral-800 dark:text-neutral-300 mt-1">
                            {issue.specialTheme}
                          </p>}
                      </div>
                    </Link>)}
                </div>
                <div className="mt-4 flex justify-center">
                  <Link href={`/admin/journals/${journal.id}/issues/create`}>
                    <button className={`${themeClasses.button} w-full md:w-auto`}>
                      <BookText className="h-4 w-4 mr-2" />
                      Добавить выпуск
                    </button>
                  </Link>
                </div>
              </div>}
            
            {(!journal.issues || journal.issues.length === 0) && <div className={`${themeClasses.card} p-6 text-center`}>
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4 flex items-center justify-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Выпуски журнала
                </h2>
                <p className="text-neutral-500 mb-4">У этого журнала пока нет выпусков</p>
                <Link href={`/admin/journals/${journal.id}/issues/create`}>
                  <button className={themeClasses.button}>
                    <BookText className="h-4 w-4 mr-2" />
                    Добавить выпуск
                  </button>
                </Link>
              </div>}
            
            {/* Описание журнала */}
            {journal.description && <div className={`${themeClasses.card} p-6`}>
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
                  Описание
                </h2>
                <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-line">
                  {journal.description}
                </p>
              </div>}
          </div>
        </div>
      </div>
    </div>;
};
export default function JournalDetailPage({
  params
}: {
  params: {
    journalId: string;
  };
}) {
  const journalId = params.journalId;
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const fetchJournal = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const response = await fetch(`${baseUrl}/api/journals/${journalId}`);
        if (!response.ok) {
          throw new Error('Журнал не найден');
        }
        const journalData = await response.json();
        if (journalData) {
          setJournal(adaptApiJournalToJournal(journalData));
        } else {
          setJournal(null);
        }
      } catch (error) {
        console.error("Error fetching journal:", error);
        setJournal(null);
      } finally {
        setLoading(false);
      }
    };
    fetchJournal();
  }, [journalId]);
  if (loading) return <div className="text-center text-neutral-500 dark:text-neutral-400">Загрузка...</div>;
  if (!journal) return <div className="text-center text-neutral-500 dark:text-neutral-400">Журнал не найден</div>;
  return <JournalDetails journal={journal} />;
}