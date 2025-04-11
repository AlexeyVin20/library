"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import IssueForm, { IssueInput } from "@/components/admin/forms/IssueForm";

// Получение стилей
const getThemeClasses = () => {
  return {
    mainContainer: "bg-gradient-to-r from-brand-800/30 via-neutral-800/30 to-brand-900/30 dark:from-neutral-200 dark:via-brand-200 dark:to-neutral-300",
  };
};

export default function CreateIssuePage({
  params,
}: {
  params: Promise<{ journalId: string }>;
}) {
  const router = useRouter();
  const themeClasses = getThemeClasses();
  
  // Распарсим params
  const resolvedParams = use(params);
  const journalId = parseInt(resolvedParams.journalId);

  const initialIssue: IssueInput = {
    journalId: journalId,
    volumeNumber: 1,
    issueNumber: 1,
    publicationDate: new Date().toISOString().split("T")[0],
    pageCount: 1,
    cover: null,
    circulation: null,
    specialTheme: null,
    shelfId: null,
    position: null
  };

  const handleSubmit = async (issueData: IssueInput) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...issueData,
          journalId: journalId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при создании выпуска');
      }
      
      const data = await response.json();
      
      toast({
        title: "Выпуск создан",
        description: "Выпуск был успешно создан"
      });
      
      router.push(`/admin/journals/${journalId}/issues/${data.id}`);
    } catch (error) {
      console.error("Ошибка при создании выпуска:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать выпуск",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses.mainContainer} p-6`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-neutral-600 dark:text-neutral-300 hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к журналу
          </button>
          
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-6">
            Добавление нового выпуска
          </h1>
        </div>
        
        <IssueForm 
          initialData={initialIssue} 
          onSubmit={handleSubmit} 
          isSubmitting={false}
          mode="create"
          journalId={journalId}
        />
      </div>
    </div>
  );
}