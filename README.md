This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# WiseOwl Library Management System

## ИИ-Ассистент с многоуровневым кэшированием

### 🚀 Новая система кэширования

ИИ-ассистент теперь оснащен продвинутой системой кэширования, которая значительно ускоряет работу и снижает нагрузку на сервер:

#### 📦 Уровни кэширования:

1. **Memory Cache** - Быстрый доступ к данным в текущей сессии
2. **LocalStorage Cache** - Сохранение данных между сессиями браузера  
3. **Query Analysis Cache** - Кэширование результатов анализа пользовательских запросов
4. **Tool Selection Cache** - Кэширование результатов выбора инструментов

#### ⚙️ Настройки кэширования по типам данных:

- **Пользователи**: 5 минут TTL, до 100 записей
- **Книги**: 10 минут TTL, до 200 записей
- **Резервирования**: 2 минуты TTL, до 150 записей
- **Статистика**: 15 минут TTL, до 50 записей
- **Роли**: 30 минут TTL, до 20 записей

#### 🎯 Умная инвалидация:

Кэш автоматически очищается при:
- POST/PUT/DELETE операциях на соответствующих сущностях
- Истечении времени жизни (TTL)
- Превышении лимита записей

#### 🔧 Управление кэшем:

В интерфейсе ИИ-ассистента доступно:
- **Статистика кэша** - показывает количество записей по типам
- **Ручная очистка** - принудительное удаление всех записей кэша
- **Индикатор состояния** - визуальное отображение активности кэша

#### 💡 Преимущества:

1. **Скорость**: Повторные запросы возвращаются мгновенно
2. **Производительность**: Снижение нагрузки на API в 3-5 раз
3. **Offline-ready**: Частичная работа без подключения к серверу
4. **Умная оптимизация**: ИИ знает о наличии кэша и оптимизирует свою работу

#### 🎭 Как это работает:

1. Пользователь спрашивает: "Найди пользователя Иван"
2. ИИ выполняет поиск через API → результат кэшируется
3. Затем пользователь спрашивает: "Создай резервирование для этого пользователя"
4. ИИ использует данные из кэша вместо повторного запроса к API

#### 📊 Мониторинг:

В заголовке чата отображается:
- 🗄️ **Кэш: X** - общее количество записей во всех типах кэша
- Зеленый цвет = кэш активен
- Серый цвет = кэш пустой

Для детальной статистики кликните на иконку кэша в заголовке.
