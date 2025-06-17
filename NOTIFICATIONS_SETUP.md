# Настройка системы уведомлений

## Описание
Система уведомлений состоит из:
- **Backend API** - ASP.NET Core API с SignalR Hub
- **Frontend** - Next.js с React hooks и SignalR клиентом
- **Real-time обновления** через SignalR
- **Интеграция с токенами JWT** для авторизации

## Компоненты

### Backend (ASP.NET Core)
- `NotificationController.cs` - REST API для работы с уведомлениями
- `NotificationHub.cs` - SignalR Hub для real-time уведомлений  
- `NotificationService.cs` - Бизнес-логика системы уведомлений
- `Notification.cs` - Модель данных
- `NotificationDto.cs` - DTO для API

### Frontend (Next.js)
- `hooks/use-notifications.ts` - React Hook для работы с уведомлениями
- `lib/notification-utils.tsx` - Утилиты для форматирования и иконок
- `lib/types.ts` - TypeScript типы
- `components/admin/New-top-navigation.tsx` - UI компонент с уведомлениями

## Установка

### 1. Установка зависимостей
```bash
npm install @microsoft/signalr
```

### 2. Переменные среды
Добавьте в `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://localhost:7139
```

### 3. Конфигурация Backend
Убедитесь, что в ASP.NET Core API настроены:
- SignalR Hub по адресу `/notificationHub`
- JWT авторизация для SignalR
- CORS для фронтенда

## Использование

### Получение уведомлений
```tsx
import { useNotifications } from '@/hooks/use-notifications'

function MyComponent() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead
  } = useNotifications()

  return (
    <div>
      <p>Непрочитанных: {unreadCount}</p>
      <p>Статус: {isConnected ? 'Подключен' : 'Отключен'}</p>
      
      {notifications.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  )
}
```

### Отправка уведомлений (Backend)
```csharp
// Через NotificationService
await _notificationService.CreateNotificationAsync(new NotificationCreateDto
{
    UserId = userId,
    Title = "Заголовок",
    Message = "Сообщение",
    Type = NotificationType.GeneralInfo,
    Priority = NotificationPriority.Normal
});
```

## API Endpoints

### GET /api/Notification
Получить уведомления пользователя
- `?isRead=false` - только непрочитанные
- `?page=1&pageSize=20` - пагинация

### GET /api/Notification/unread-count
Количество непрочитанных уведомлений

### PUT /api/Notification/{id}/mark-read
Отметить уведомление как прочитанное

### PUT /api/Notification/mark-all-read
Отметить все как прочитанные

### POST /api/Notification/send
Отправить уведомление (только Admin/Librarian)

## SignalR Events

### Клиент получает
- `ReceiveNotification` - новое уведомление

### Клиент отправляет  
- `JoinUserGroup` - присоединиться к группе пользователя
- `ConfirmNotificationReceived` - подтвердить получение
- `MarkNotificationAsRead` - отметить как прочитанное

## Типы уведомлений

- `BookDueSoon` - скоро возврат книги
- `BookOverdue` - просроченная книга  
- `FineAdded` - начислен штраф
- `BookReturned` - книга возвращена
- `BookReserved` - книга зарезервирована
- `GeneralInfo` - общая информация
- И другие...

## Приоритеты

- `Low` - низкий
- `Normal` - обычный  
- `High` - высокий
- `Critical` - критический

## Особенности

1. **Автоматическое переподключение** SignalR при обрыве связи
2. **Браузерные уведомления** (требуется разрешение пользователя)
3. **Авторизация через JWT** токены
4. **Real-time обновления** счетчика непрочитанных
5. **Анимации** и плавные переходы
6. **Адаптивный дизайн** для мобильных устройств

## Troubleshooting

### SignalR не подключается
1. Проверьте CORS настройки на backend
2. Убедитесь что токен JWT валидный  
3. Проверьте URL в переменных среды

### Уведомления не приходят
1. Убедитесь что пользователь авторизован
2. Проверьте что SignalR Hub запущен
3. Посмотрите консоль браузера на ошибки

### Стили не применяются
1. Добавьте CSS класс `.line-clamp-2` в globals.css
2. Проверьте что Tailwind CSS настроен правильно 