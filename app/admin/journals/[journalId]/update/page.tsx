"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import JournalForm from "@/components/admin/forms/JournalForm";

// Интерфейс Journal
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

export default function JournalUpdatePage({
  params,
}: {
  params: Promise<{ journalId: string }>;
}) {
  const [journal, setJournal] = useState<Journal | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const router = useRouter();

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
        setJournal({
          ...journalData,
          foundationDate: journalData.foundationDate ? new Date(journalData.foundationDate) : new Date(),
          publicationDate: journalData.publicationDate ? new Date(journalData.publicationDate) : new Date(),
        });
      } catch (error) {
        console.error("Error fetching journal:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchJournal();
  }, [resolvedParams.journalId]);

  const handleSubmit = async (updatedJournal: any) => {
    if (!journal) return;
    
    setUpdating(true);
    setUpdateError(null);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

      const res = await fetch(`${baseUrl}/api/journals/${journal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedJournal),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Не удалось обновить журнал");
      }

      // Перенаправляем на страницу деталей журнала после успешного обновления
      router.push(`/admin/journals/${journal.id}`);
      router.refresh(); // Обновляем кэш Next.js
    } catch (error) {
      console.error("Error updating journal:", error);
      setUpdateError(error instanceof Error ? error.message : "Произошла ошибка при обновлении журнала");
    } finally {
      setUpdating(false);
    }
  };

  if (error) return notFound();
  if (loading) return <div>Загрузка...</div>;
  if (!journal) return <div>Журнал не найден</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Редактирование журнала</h1>
      
      {updateError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {updateError}
        </div>
      )}
      
      <JournalForm 
        initialData={journal} 
        onSubmit={handleSubmit} 
        isSubmitting={updating} 
        mode="update"
      />
      
      <div className="mt-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
