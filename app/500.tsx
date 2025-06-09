import ErrorPage from "@/components/ui/error-page";

export default function InternalServerError() {
  return (
    <ErrorPage 
      errorCode="500"
      title="Сервер временно недоступен"
      description="Произошла техническая ошибка на сервере. Мы уже работаем над её устранением. Попробуйте обновить страницу через несколько минут."
    />
  );
} 