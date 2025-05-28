"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookText, Calendar, FileText, Edit, Trash, ArrowLeft, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Интерфейс для модели выпуска
interface Issue {
  id: number;
  journalId: number;
  journalTitle: string;
  volumeNumber: number;
  issueNumber: number;
  publicationDate: string;
  pageCount: number;
  cover?: string | null;
  circulation?: number | null;
  specialTheme?: string | null;
  shelfId?: string | null;
  position?: string | null;
  articles?: ArticleShort[] | null;
}

// Интерфейс для краткой информации о статье
interface ArticleShort {
  id: number;
  title: string;
  authors: string[];
  startPage: number;
  endPage: number;
  DOI?: string | null;
}

// Получение стилей
const getThemeClasses = () => {
  return {
    card: "bg-white/70 dark:bg-neutral-200/70 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform hover:translate-y-[-5px] transition-all duration-300",
    statsCard: "bg-white/70 dark:bg-neutral-200/70 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform hover:translate-y-[-5px] transition-all duration-300",
    mainContainer: "bg-gradient-to-r from-brand-800/30 via-neutral-800/30 to-brand-900/30 dark:from-neutral-200 dark:via-brand-200 dark:to-neutral-300",
    button: "bg-primary-admin/90 hover:bg-primary-admin text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2 flex items-center gap-2"
  };
};

// Форматирование даты с проверкой
const formatDate = (dateString: string) => {
  try {
    if (!dateString) {
      return "Дата не указана";
    }
    const date = new Date(dateString);
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

// Компонент деталей выпуска
const IssueDetails = ({
  issue
}: {
  issue: Issue;
}) => {
  const themeClasses = getThemeClasses();
  const router = useRouter();
  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить этот выпуск?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/issues/${issue.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Ошибка при удалении выпуска');
      }
      toast({
        title: "Выпуск удален",
        description: "Выпуск был успешно удален"
      });
      router.push(`/admin/journals/${issue.journalId}`);
    } catch (error) {
      console.error("Ошибка при удалении выпуска:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить выпуск",
        variant: "destructive"
      });
    }
  };
  return <div className={`min-h-screen ${themeClasses.mainContainer} p-6`}>
      <div className="flex flex-col space-y-6">
        {/* Верхняя панель с кнопками */}
        <div className="flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center text-neutral-600 dark:text-neutral-300 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к журналу
          </button>
          
          <div className="flex space-x-3">
            <Link href={`/admin/journals/${issue.journalId}/issues/${issue.id}/update`}>
              <button className={themeClasses.button}>
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </button>
            </Link>
            <button onClick={handleDelete} className="bg-red-500/90 hover:bg-red-500 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2 flex items-center gap-2">
              <Trash className="h-4 w-4 mr-2" />
              Удалить
            </button>
          </div>
        </div>
        
        {/* Основной контент */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Левая колонка - обложка */}
          <div className="md:col-span-1">
            <div className={`${themeClasses.card} overflow-hidden aspect-[3/4] relative`}>
              {issue.cover ? <Image src={issue.cover} alt={`Том ${issue.volumeNumber}, Выпуск ${issue.issueNumber}`} fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <BookText className="h-20 w-20 text-gray-400" />
                </div>}
            </div>
          </div>
          
          {/* Правая колонка - информация о выпуске */}
          <div className="md:col-span-2 space-y-6">
            {/* Основная информация */}
            <div className={`${themeClasses.card} p-6`}>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                Том {issue.volumeNumber}, Выпуск {issue.issueNumber}
              </h1>
              
              <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-4">
                Журнал "{issue.journalTitle}"
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Дата публикации:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{formatDate(issue.publicationDate)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Количество страниц:</p>
                  <p className="text-neutral-800 dark:text-neutral-200">{issue.pageCount}</p>
                </div>
                
                {issue.circulation && <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Тираж:</p>
                    <p className="text-neutral-800 dark:text-neutral-200">{issue.circulation}</p>
                  </div>}
                
                {issue.specialTheme && <div className="md:col-span-2">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Специальная тема:</p>
                    <p className="text-neutral-800 dark:text-neutral-200">{issue.specialTheme}</p>
                  </div>}
                
                {issue.shelfId && <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">ID полки:</p>
                    <p className="text-neutral-800 dark:text-neutral-200">{issue.shelfId}</p>
                  </div>}
                
                {issue.position && <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Позиция:</p>
                    <p className="text-neutral-800 dark:text-neutral-200">{issue.position}</p>
                  </div>}
              </div>
            </div>
            
            {/* Статьи */}
            <div className={`${themeClasses.card} p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Статьи в выпуске
                </h2>
                <Link href={`/admin/journals/${issue.journalId}/issues/${issue.id}/articles/create`}>
                  <button className={themeClasses.button}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить статью
                  </button>
                </Link>
              </div>
              
              {issue.articles && issue.articles.length > 0 ? <div className="space-y-4">
                  {issue.articles.map(article => <Link href={`/admin/journals/${issue.journalId}/issues/${issue.id}/articles/${article.id}`} key={article.id}>
                      <div className="p-4 bg-white/50 dark:bg-neutral-800/50 rounded-lg hover:bg-white/80 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer">
                        <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
                          {article.title}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                          {article.authors.join(', ')}
                        </p>
                        <div className="flex justify-between items-center text-xs text-neutral-500">
                          <span>Страницы: {article.startPage}–{article.endPage}</span>
                          {article.DOI && <span>DOI: {article.DOI}</span>}
                        </div>
                      </div>
                    </Link>)}
                </div> : <div className="p-6 text-center bg-white/50 dark:bg-neutral-800/50 rounded-lg">
                  <p className="text-neutral-500 dark:text-neutral-400">
                    В этом выпуске пока нет статей
                  </p>
                  <div className="mt-4">
                    <Link href={`/admin/journals/${issue.journalId}/issues/${issue.id}/articles/create`}>
                      <button className={themeClasses.button}>
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить статью
                      </button>
                    </Link>
                  </div>
                </div>}
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default function IssueDetailPage({
  params
}: {
  params: Promise<{
    journalId: string;
    issueId: string;
  }>;
}) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Распарсим params
  const resolvedParams = use(params);
  useEffect(() => {
    const fetchIssue = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const response = await fetch(`${baseUrl}/api/issues/${resolvedParams.issueId}`);
        if (!response.ok) {
          throw new Error('Ошибка при получении выпуска');
        }
        const data = await response.json();
        setIssue(data);
      } catch (error) {
        console.error("Error fetching issue:", error);
        setIssue(null);
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [resolvedParams.issueId]);
  if (loading) return <div className="text-center text-neutral-500 dark:text-neutral-400">Загрузка...</div>;
  if (!issue) return <div className="text-center text-neutral-500 dark:text-neutral-400">Выпуск не найден</div>;
  return <IssueDetails issue={issue} />;
}