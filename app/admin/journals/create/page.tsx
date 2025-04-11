"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JournalForm, { JournalInput } from "@/components/admin/forms/JournalForm";

// Интерфейс для данных создания журнала
interface JournalCreateDto {
  title: string;
  issn: string;
  publisher: string;
  startYear: number;
  endYear?: number;
  frequency?: string;
  description: string;
  coverImage?: string;
  website?: string;
}

// Адаптер для преобразования JournalInput в JournalCreateDto
const adaptInputToApiDto = (input: JournalInput): JournalCreateDto => {
  return {
    title: input.title,
    issn: input.issn || '',
    publisher: input.publisher || '',
    startYear: input.foundationDate ? new Date(input.foundationDate).getFullYear() : new Date().getFullYear(),
    endYear: undefined,
    frequency: input.periodicity || 'Monthly',
    description: input.description || '',
    coverImage: input.coverImageUrl || undefined,
    website: input.website || undefined
  };
};

export default function JournalCreatePage() {
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (journalData: JournalInput) => {
    setCreating(true);
    setCreateError(null);
    
    try {
      // Преобразуем данные в формат API
      const apiData = adaptInputToApiDto(journalData);
      
      // Используем fetch вместо API-утилиты
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/journals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не удалось создать журнал');
      }
      
      const newJournal = await response.json();
      
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
