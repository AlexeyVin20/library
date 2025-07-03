'use client';
import ErrorPage from "@/components/ui/error-page";

export default function NotFound() {
  return (
    <ErrorPage 
      errorCode="404"
      title="Книга не найдена"
      description="Возможно, книга была удалена из библиотеки или вы перешли по неверной ссылке."
    />
  );
} 