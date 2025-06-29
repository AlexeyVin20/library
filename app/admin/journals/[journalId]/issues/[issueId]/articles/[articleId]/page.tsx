"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookText, ArrowLeft, Edit, Trash, Tag, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Интерфейс для полной модели статьи
interface Article {
  id: number;
  issueId: number;
  journalId: number;
  journalTitle: string;
  issueVolumeNumber: number;
  issueNumber: number;
  title: string;
  authors: string[];
  abstract: string;
  startPage: number;
  endPage: number;
  keywords: string[];
  DOI?: string | null;
  type?: string | null;
  fullText?: string | null;
}

// Получение стилей
const getThemeClasses = () => {
  return {
    card: "bg-white/70 dark:bg-neutral-200/70 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform hover:translate-y-[-5px] transition-all duration-300",
    mainContainer: "bg-gradient-to-r from-brand-800/30 via-neutral-800/30 to-brand-900/30 dark:from-neutral-200 dark:via-brand-200 dark:to-neutral-300",
    button: "bg-primary-admin/90 hover:bg-primary-admin text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2 flex items-center gap-2"
  };
};

// Компонент деталей статьи
const ArticleDetails = ({
  article
}: {
  article: Article;
}) => {
  const themeClasses = getThemeClasses();
  const router = useRouter();
  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить эту статью?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/articles/${article.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Ошибка при удалении статьи');
      }
      toast({
        title: "Статья удалена",
        description: "Статья была успешно удалена"
      });
      router.push(`/admin/journals/${article.journalId}/issues/${article.issueId}`);
    } catch (error) {
      console.error("Ошибка при удалении статьи:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить статью",
        variant: "destructive"
      });
    }
  };
  return <div className={`min-h-screen ${themeClasses.mainContainer} p-6`}>
      <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
        {/* Верхняя панель с кнопками */}
        <div className="flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center text-neutral-600 dark:text-neutral-300 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к выпуску
          </button>
          
          <div className="flex space-x-3">
            <Link href={`/admin/journals/${article.journalId}/issues/${article.issueId}/articles/${article.id}/update`}>
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
        
        {/* Основная информация о статье */}
        <div className={`${themeClasses.card} p-6`}>
          <div className="mb-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Журнал "{article.journalTitle}"
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
              Том {article.issueVolumeNumber}, Выпуск {article.issueNumber}, стр. {article.startPage}–{article.endPage}
            </p>
          </div>
          
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
            {article.title}
          </h1>
          
          <div className="mb-4">
            <p className="text-lg text-neutral-600 dark:text-neutral-300">
              {article.authors.join(', ')}
            </p>
          </div>
          
          {article.DOI && <div className="bg-neutral-100 dark:bg-neutral-700 p-2 rounded text-sm mb-6">
              <span className="font-semibold">DOI: </span>
              <span className="text-blue-600 dark:text-blue-400 underline">{article.DOI}</span>
            </div>}
          
          {article.type && <div className="mb-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-semibold">Тип статьи:</p>
              <div className="flex items-center mt-1">
                <Tag className="h-4 w-4 mr-2 text-neutral-600 dark:text-neutral-300" />
                <span className="text-neutral-700 dark:text-neutral-200">{article.type}</span>
              </div>
            </div>}
          
          {article.keywords && article.keywords.length > 0 && <div className="mb-6">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-semibold mb-2">Ключевые слова:</p>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword, index) => <span key={index} className="inline-block bg-primary-admin/20 text-primary-admin/90 py-1 px-3 rounded-full text-xs">
                    {keyword}
                  </span>)}
              </div>
            </div>}
          
          <div className="mb-6">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-semibold mb-2">Аннотация:</p>
            <div className="bg-white/50 dark:bg-neutral-800/50 p-4 rounded-lg">
              <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed">
                {article.abstract}
              </p>
            </div>
          </div>
          
          {article.fullText && <div>
              <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Полный текст
              </h2>
              <div className="bg-white/50 dark:bg-neutral-800/50 p-4 rounded-lg">
                <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  {article.fullText}
                </p>
              </div>
            </div>}
        </div>
      </div>
    </div>;
};
export default function ArticleDetailPage({
  params
}: {
  params: Promise<{
    journalId: string;
    issueId: string;
    articleId: string;
  }>;
}) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Распарсим params
  const resolvedParams = use(params);
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const response = await fetch(`${baseUrl}/api/articles/${resolvedParams.articleId}`);
        if (!response.ok) {
          throw new Error('Ошибка при получении статьи');
        }
        const data = await response.json();
        setArticle(data);
      } catch (error) {
        console.error("Error fetching article:", error);
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [resolvedParams.articleId]);
  if (loading) return <div className="text-center text-neutral-500 dark:text-neutral-400">Загрузка...</div>;
  if (!article) return <div className="text-center text-neutral-500 dark:text-neutral-400">Статья не найдена</div>;
  return <ArticleDetails article={article} />;
}