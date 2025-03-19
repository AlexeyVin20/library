"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { CreditCard, Box, BookOpen } from "lucide-react";
import "@/styles/admin.css";
import GlassMorphismContainer from '@/components/admin/GlassMorphismContainer';

// Интерфейс для модели журнала
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
}

/**
 * Theme classes aligned with DashboardPage's "cosmic" theme
 */
const getThemeClasses = () => {
  return {
    card: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300 h-full flex flex-col",
    statsCard: "bg-gradient-to-br from-white/30 to-white/20 dark:from-neutral-800/30 dark:to-neutral-900/20 backdrop-blur-xl border border-white/30 dark:border-neutral-700/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between",
    mainContainer: "bg-gray-100/70 dark:bg-neutral-900/70 backdrop-blur-xl min-h-screen p-6",
    button: "bg-gradient-to-r from-primary-admin/90 to-primary-admin/70 dark:from-primary-admin/80 dark:to-primary-admin/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-5 py-3 flex items-center justify-center gap-2",
    input: "max-w-xs bg-white/40 dark:bg-neutral-700/40 backdrop-blur-sm border border-white/30 dark:border-neutral-700/30 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg px-4 py-2",
    menu: "backdrop-blur-xl bg-white/80 dark:bg-neutral-800/80 p-3 rounded-lg border border-white/20 dark:border-neutral-700/20 shadow-lg",
    menuItem: "block p-2 rounded-md hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors",
    sectionTitle: "text-2xl font-bold mb-4 text-neutral-500 dark:text-white border-b pb-2 border-white/30 dark:border-neutral-700/30",
  };
};

/**
 * JournalImage component with DashboardPage-style hover effects
 */
const JournalImage = ({ src, alt, journalId }: { src: string | null | undefined; alt: string; journalId: number }) => {
  const [error, setError] = useState(false);
  const themeClasses = getThemeClasses();

  if (error || !src) {
    return (
      <div className={`${themeClasses.card} w-full h-48 flex items-center justify-center`}>
        <BookOpen className="text-neutral-500 dark:text-neutral-700 w-12 h-12" />
      </div>
    );
  }

  const imageElement = (
    <div className="overflow-hidden rounded-xl group">
      <Image
        src={src}
        alt={alt}
        width={192}
        height={192}
        className="w-full h-48 object-cover transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );

  return journalId ? (
    <Link href={`/admin/journals/${journalId}`}>{imageElement}</Link>
  ) : (
    imageElement
  );
};

/**
 * CardsView with DashboardPage-style cards
 */
const CardsView = ({ journals, onDelete, themeClasses }: { journals: Journal[]; onDelete: (id: number) => Promise<void>; themeClasses: ReturnType<typeof getThemeClasses> }) => {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {journals.map((journal: Journal) => (
        <li key={journal.id} className={`${themeClasses.card} flex overflow-hidden`}>
          <div className="w-1/3 p-4">
            <JournalImage src={journal.coverImageUrl} alt={journal.title} journalId={journal.id} />
          </div>
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-500 dark:text-neutral-100">{journal.title}</h3>
              <p className="text-sm text-neutral-400 dark:text-neutral-300">ISSN: {journal.issn}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{journal.publisher || ""}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {journal.category && `${journal.category}`}
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Link href={`/admin/journals/${journal.id}/update`}>
                <button className={themeClasses.button}>Редактировать</button>
              </Link>
              <button
                onClick={() => onDelete(journal.id)}
                className="bg-red-500/90 hover:bg-red-500 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2"
              >
                Удалить
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

/**
 * ThreeDJournalView with DashboardPage-style 3D effects
 */
const ThreeDJournalView = ({ journals, onDelete, themeClasses }: { journals: Journal[]; onDelete: (id: number) => Promise<void>; themeClasses: ReturnType<typeof getThemeClasses> }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
      {journals.map((journal) => (
        <div key={journal.id} className="group text-neutral-900 dark:text-neutral-100">
          <div className="relative w-full h-96 overflow-visible" style={{ perspective: "1000px" }}>
            <div className="absolute inset-0 transform-gpu transition-all duration-500 group-hover:rotate-y-0 rotate-y-[15deg] preserve-3d group-hover:scale-105">
              <Link href={`/admin/journals/${journal.id}`}>
                <div className={`${themeClasses.card} w-full h-full overflow-hidden`}>
                  {journal.coverImageUrl ? (
                    <Image
                      src={journal.coverImageUrl}
                      alt={journal.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>
          <div className={`${themeClasses.card} mt-2 text-center p-3`}>
            <p className="font-semibold line-clamp-1">
              <span className="font-normal text-neutral-500 dark:text-neutral-300">{journal.title}</span>
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-300">ISSN: {journal.issn}</p>
            {journal.publisher && (
              <p className="text-sm text-neutral-400 dark:text-neutral-400">{journal.publisher}</p>
            )}
          </div>
          <div className="mt-2 flex justify-center gap-2">
            <Link href={`/admin/journals/${journal.id}/update`}>
              <button className={themeClasses.button}>Редактировать</button>
            </Link>
            <button
              onClick={() => onDelete(journal.id)}
              className="bg-red-500/90 hover:bg-red-500 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * ViewModeMenu with DashboardPage-style navigation
 */
const ViewModeMenu = ({ viewMode, setViewMode, themeClasses }: { viewMode: string; setViewMode: (mode: string) => void; themeClasses: ReturnType<typeof getThemeClasses> }) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent hover:bg-white/20 dark:hover:bg-neutral-300/20">
            {viewMode === "cards" && <CreditCard className="mr-2 h-4 w-4" />}
            {viewMode === "3d" && <Box className="mr-2 h-4 w-4" />}
            Вид
          </NavigationMenuTrigger>
          <NavigationMenuContent className={themeClasses.menu}>
            <div className="grid gap-2 p-1 min-w-40">
              <button onClick={() => setViewMode("cards")} className={themeClasses.menuItem}>
                <CreditCard className="h-4 w-4 mr-2 inline" />
                Карточки
              </button>
              <button onClick={() => setViewMode("3d")} className={themeClasses.menuItem}>
                <Box className="h-4 w-4 mr-2 inline" />
                3D вид
              </button>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

/**
 * Main JournalsPage component
 */
export default function JournalsPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("cards");
  const themeClasses = getThemeClasses();

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
        const res = await fetch(`${baseUrl}/api/journals`);
        if (res.ok) {
          const data = await res.json();
          setJournals(data);
        } else {
          console.error("Ошибка получения журналов");
        }
      } catch (error) {
        console.error("Ошибка получения журналов", error);
      }
    };

    fetchJournals();
  }, []);

  const filteredJournals = journals.filter((journal) =>
    journal.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedJournals = filteredJournals.sort((a, b) =>
    sortOrder === "asc"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  );

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот журнал?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseUrl}/api/journals/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({
          title: "Журнал удален",
          description: "Журнал успешно удален",
        });
        setJournals((prev) => prev.filter((journal) => journal.id !== id));
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить журнал",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении журнала:", error);
      toast({
        title: "Ошибка",
        description: "Ошибка при удалении журнала",
        variant: "destructive",
      });
    }
  };

  return (
    <GlassMorphismContainer
      backgroundPattern={true}
      isDarkMode={false}
    >
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/30 dark:bg-neutral-800/30 border-b border-white/20 dark:border-neutral-700/20 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-sm mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Link href="/admin/journals/create">
              <button className={themeClasses.button}>Добавить журнал</button>
            </Link>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className={themeClasses.button}
            >
              Сортировка {sortOrder === "asc" ? "▲" : "▼"}
            </button>
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={themeClasses.input}
            />
            <ViewModeMenu viewMode={viewMode} setViewMode={setViewMode} themeClasses={themeClasses} />
          </div>
        </header>

        <main className="flex-1 space-y-8">
          {sortedJournals.length === 0 ? (
            <div className={`${themeClasses.card} py-20 text-center`}>
              <p className="text-xl text-neutral-500 dark:text-white">Журналы не найдены</p>
              <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                Попробуйте изменить параметры поиска или добавьте новый журнал
              </p>
            </div>
          ) : (
            <div className={themeClasses.card}>
              {viewMode === "cards" && (
                <CardsView journals={sortedJournals} onDelete={handleDelete} themeClasses={themeClasses} />
              )}
              {viewMode === "3d" && (
                <ThreeDJournalView journals={sortedJournals} onDelete={handleDelete} themeClasses={themeClasses} />
              )}
            </div>
          )}
        </main>
      </div>
    </GlassMorphismContainer>
  );
}
