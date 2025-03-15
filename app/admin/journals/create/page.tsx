"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JournalForm from "@/components/admin/forms/JournalForm";

// Интерфейс Journal
interface JournalInput {
  title: string;
  issn: string;
  registrationNumber?: string | null;
  format: "Print" | "Electronic" | "Mixed";
  periodicity: "Weekly" | "BiWeekly" | "Monthly" | "Quarterly" | "BiAnnually" | "Annually";
  pagesPerIssue: number;
  description?: string | null;
  publisher?: string | null;
  foundationDate: Date;
  circulation: number;
  isOpenAccess: boolean;
  category: "Scientific" | "Popular" | "Entertainment" | "Professional" | "Educational" | "Literary" | "News";
  targetAudience?: string | null;
  isPeerReviewed: boolean;
  isIndexedInRINTS: boolean;
  isIndexedInScopus: boolean;
  isIndexedInWebOfScience: boolean;
  publicationDate: Date;
  pageCount: number;
  coverImageUrl?: string | null;
}

export default function JournalCreatePage() {
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (journalData: JournalInput) => {
    setCreating(true);
    setCreateError(null);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");

      const res = await fetch(`${baseUrl}/api/journals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(journalData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Не удалось создать журнал");
      }

      const newJournal = await res.json();
      
      // Перенаправляем на страницу деталей журнала после успешного создания
      router.push(`/admin/journals/${newJournal.id}`);
      router.refresh(); // Обновляем кэш Next.js
    } catch (error) {
      console.error("Error creating journal:", error);
      setCreateError(error instanceof Error ? error.message : "Произошла ошибка при создании журнала");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Создание нового журнала</h1>
      
      {createError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {createError}
        </div>
      )}
      
      <JournalForm 
        onSubmit={handleSubmit} 
        isSubmitting={creating} 
        mode="create"
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
