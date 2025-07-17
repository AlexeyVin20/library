// tool_selection_logic.ts
// Логика выбора и фильтрации инструментов для оптимизированной отправки ИИ-ассистенту

export interface Tool {
  name: string
  description: string
  parameters: any
  apiMethod?: "GET" | "POST" | "PUT" | "DELETE"
  apiEndpoint?: string
}

export interface ToolCategory {
  id: string
  name: string
  description: string
  icon: string
  keywords: string[]
  priority: number // 1-5, где 1 - самый высокий приоритет
  tools: string[] // массив имен инструментов
  minUserLevel?: number // Минимальный уровень пользователя (1-новичок, 2-обычный, 3-эксперт)
}

export interface ToolSelectionConfig {
  maxToolsPerRequest: number
  alwaysIncludeCategories: string[]
  contextualSelection: boolean
  userLevel: number // 1-новичок, 2-обычный, 3-эксперт
  userPreferences?: {
    preferredCategories: string[]
    excludedCategories: string[]
  }
  // НОВЫЕ ОПТИМИЗАЦИИ
  isFinalResponse?: boolean // Флаг для детекции финального ответа
  hasToolExecutions?: boolean // Флаг наличия выполненных инструментов в истории
  hasMultipleEntities?: boolean // Флаг наличия множественных сущностей в запросе
  hasPasswordMention?: boolean // Флаг упоминания пароля в запросе
  // НОВЫЙ ПАРАМЕТР: Дополнение вместо замены
  appendToExisting?: boolean // Если true, дополняет существующие инструменты вместо замены
  existingTools?: Tool[] // Существующие инструменты для дополнения
}

// НОВЫЙ интерфейс для контекста истории выполнения
export interface ExecutionContext {
  hasExecutedTools: boolean
  executedToolNames: string[]
  lastIterationHadTools: boolean
  iterationCount: number
  isLikelyFinalResponse: boolean
}

// Типы пользователей
export const USER_LEVELS = {
  NOVICE: 1,
  INTERMEDIATE: 2,
  EXPERT: 3
} as const

// НОВЫЙ: Массив инструментов создания/изменения сущностей (исключаются при множественных сущностях)
const ENTITY_MODIFICATION_TOOLS = [
  'createUser', 'createBook', 'createReservation',
  'updateUser', 'updateBook', 'updateReservation',
  'deleteUser', 'deleteBook', 'deleteReservation',
  // Также включаем связанные CRUD
  'createBookInstance', 'updateBookInstance', 'deleteBookInstance',
  'assignRoleToUser', 'removeRoleFromUser', 'updateUserRole'
]

// НОВЫЙ: Массив инструментов работы с паролями (исключаются если пароль не упоминается)
const PASSWORD_TOOLS = [
  'changeUserPassword', 'resetUserPassword'
]

// НОВЫЙ: Минимальный набор инструментов для финального ответа
const FINAL_RESPONSE_TOOLS = [
  'searchUsers', 'searchBooks', 'searchReservations',
  'getUserById', 'getBookById', 'getReservationById',
  'getAllUsers', 'getAllBooks', 'getAllReservations',
  'systemContext', 'navigateToPage', 'stopAgent', 'cancelCurrentAction'
]

// Определение категорий инструментов с учетом уровней пользователей
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "users",
    name: "Пользователи",
    description: "Управление пользователями библиотеки",
    icon: "👤",
    minUserLevel: 1,
    keywords: [
      "пользователь", "юзер", "клиент", "читатель", "студент", "человек", "люди",
      "пользователя", "пользователю", "пользователем", "пользователях", "пользователей",
      "создать пользователя", "добавить пользователя", "зарегистрировать",
      "найти пользователя", "показать пользователей", "список пользователей",
      "обновить пользователя", "изменить пользователя", "удалить пользователя",
      "профиль", "аккаунт", "регистрация", "авторизация", "рекомендации",
      "пароль", "сброс пароля", "изменить пароль", "штраф", "активность",
      "с книгами", "с просрочками", "активные резервирования", "просроченные",
      "статистика пользователей", "отчет по пользователям", "график пользователей",
      "кто", "какой пользователь", "показать людей"
    ],
    priority: 1,
    tools: [
      "getAllUsers",
      "getUserById", 
      "searchUsers",
      "createUser",
      "updateUser",
      "deleteUser",
      "changeUserPassword",
      "resetUserPassword",
      "getUserReservations",
      "getUserActiveReservations",
      "getUserOverdueReservations",
      "getUserRecommendations",
      "getUsersWithBooks",
      "getUsersWithFines",
      "getUserStatistics"
    ]
  },
  {
    id: "books",
    name: "Книги",
    description: "Управление каталогом книг",
    icon: "📚",
    minUserLevel: 1,
    keywords: [
      "книга", "книги", "литература", "издание", "том", "экземпляр", "каталог",
      "книгу", "книге", "книгой", "книгам", "книгами",
      "добавить книгу", "создать книгу", "новая книга", "загрузить книгу",
      "найти книгу", "поиск книг", "показать книги", "список книг", "каталог книг",
      "обновить книгу", "изменить книгу", "удалить книгу",
      "автор", "название", "жанр", "ISBN", "издательство", "год издания",
      "доступность", "экземпляры", "копии", "полка", "позиция", "состояние",
      "избранное", "рекомендации", "популярные", "статистика", "фонд",
      "статистика книг", "отчет по книгам", "график книг", "топ книг", "популярные книги",
      "что почитать", "найди книгу", "покажи книги"
    ],
    priority: 1,
    tools: [
      "getAllBooks",
      "getBookById",
      "searchBooks",
      "createBook",
      "updateBook",
      "deleteBook",
      "updateBookGenre",
      "updateBookCategorization",
      "addBookToFavorites",
      "removeBookFromFavorites",
      "getBookAvailability",
      "getBestAvailableBookInstance",
      "getAllBookInstances",
      "getBookInstanceById",
      "getBookInstancesByBookId",
      "createBookInstance",
      "updateBookInstance",
      "deleteBookInstance",
      "updateBookInstanceStatus",
      "getBookInstanceStats",
      "createMultipleBookInstances",
      "autoCreateBookInstances",
      "getBookInstanceReservation",
      "getInstanceStatusSummary",
      "bulkCreateBookInstances",
      "bulkUpdateBookInstanceStatuses",
      "getBookStatistics",
      "getTopPopularBooks"
    ]
  },
  {
    id: "reservations",
    name: "Резервирования",
    description: "Управление бронированием и выдачей книг",
    icon: "📅",
    minUserLevel: 1,
    keywords: [
      "резерв", "бронь", "бронирование", "резервирование", "заказ", "запрос",
      "резервирования", "резервированию", "резервированием", "резервированиях",
      "брони", "бронью",
      "забронировать", "зарезервировать", "заказать книгу", "взять книгу",
      "выдать книгу", "вернуть книгу", "продлить", "продление",
      "одобрить", "отклонить", "отменить", "статус", "срок",
      "просрочка", "штраф", "история выдач", "активные брони",
      "даты", "период", "массовое обновление", "просроченные",
      "статистика резервирований", "отчет по резервированиям", "график резервирований",
      "выдача", "возврат", "кто взял", "когда вернуть"
    ],
    priority: 1,
    tools: [
      "getAllReservations",
      "getReservationById",
      "searchReservations",
      "createReservation",
      "updateReservation",
      "deleteReservation",
      "getReservationDates",
      "getReservationDatesByBookId",
      "getReservationsByUserId",
      "bulkUpdateReservations",
      "getOverdueReservations",
      "getReservationStatistics"
    ]
  },
  {
    id: "roles",
    name: "Роли и права",
    description: "Управление ролями пользователей",
    icon: "👥",
    minUserLevel: 2, // Только для обычных пользователей и экспертов
    keywords: [
      "роль", "права", "доступ", "разрешения", "администратор", "библиотекарь",
      "назначить роль", "изменить роль", "права доступа", "полномочия",
      "группа", "статус пользователя", "уровень доступа", "удалить роль",
      "массовое назначение", "обновление ролей", "админ", "модератор"
    ],
    priority: 3,
    tools: [
      "getAllRoles",
      "assignRoleToUser",
      "assignRoleToMultipleUsers",
      "updateUserRole",
      "removeRoleFromUser",
      "removeRoleFromMultipleUsers"
    ]
  },
  {
    id: "reports",
    name: "Отчеты и аналитика",
    description: "Создание отчетов и графиков",
    icon: "📊",
    minUserLevel: 1,
    keywords: [
      "отчет", "статистика", "график", "диаграмма", "аналитика", "данные",
      "построить график", "создать отчет", "показать статистику",
      "анализ", "метрики", "KPI", "дашборд", "визуализация",
      "тренды", "динамика", "сводка", "сводный отчет", "популярные",
      "пользователи", "книги", "резервирования", "период", "группировка",
      "html отчет", "сгенерировать отчет", "excel отчет", "pdf отчет",
      "сколько", "когда", "где", "статистика по", "отчетность"
    ],
    priority: 2,
    tools: [
      "getUserStatistics",
      "getReservationStatistics", 
      "getBookStatistics",
      "getTopPopularBooks",
      "getAllUsers", // Для создания отчетов
      "getAllBooks",
      "getAllReservations",
      "searchUsers",
      "searchBooks",
      "getUserReservations",
      "getBookAvailability",
      "getOverdueReservations"
    ]
  },
  {
    id: "notifications",
    name: "Уведомления",
    description: "Отправка уведомлений пользователям",
    icon: "🔔",
    minUserLevel: 2, // Только для обычных пользователей и экспертов
    keywords: [
      "уведомление", "уведомления", "push", "email", "сообщение",
      "отправить", "оповестить", "информировать", "алерт", "предупреждение",
      "шаблон", "кастомное", "массовая рассылка", "тип уведомления",
      "напомнить", "напоминание", "письмо", "смс"
    ],
    priority: 4,
    tools: [
      "sendCustomPushNotification",
      "sendCustomSingleEmail", 
      "sendCustomEmailWithTemplate"
    ]
  },
  {
    id: "history",
    name: "История диалогов",
    description: "Работа с историей диалогов ИИ-ассистента",
    icon: "📝",
    minUserLevel: 2, // Только для обычных пользователей и экспертов
    keywords: [
      "история", "диалог", "чат", "сообщения", "поиск в истории",
      "конверсация", "разговор", "логи", "архив", "прошлые запросы",
      "что мы говорили", "найти разговор", "когда говорили"
    ],
    priority: 5,
    tools: [
      "getAllDialogHistory",
      "getDialogHistoryByConversationId",
      "searchDialogHistory"
    ]
  },
  {
    id: "navigation",
    name: "Навигация",
    description: "Переходы между страницами",
    icon: "🧭",
    minUserLevel: 1,
    keywords: [
      "перейти", "открыть страницу", "показать страницу", "навигация",
      "страница", "раздел", "меню", "переход", "ссылка", "URL",
      "главная", "каталог", "профиль", "настройки", "админка",
      "покажи", "открой", "веди на"
    ],
    priority: 5,
    tools: [
      "navigateToPage"
    ]
  },
  {
    id: "system",
    name: "Системные",
    description: "Управление работой ассистента",
    icon: "⚙️",
    minUserLevel: 1,
    keywords: [
      "стоп", "остановить", "отменить", "прервать", "отмена",
      "агент", "ассистент", "система", "сброс", "перезапуск",
      "контекст", "системный", "хватит", "довольно"
    ],
    priority: 1,
    tools: [
      "systemContext",
      "stopAgent",
      "cancelCurrentAction"
    ]
  },
  {
    id: "advanced",
    name: "Продвинутые",
    description: "Продвинутые операции для экспертов",
    icon: "🔧",
    minUserLevel: 3, // Только для экспертов
    keywords: [
      "массовое", "bulk", "пакетное", "автоматизация", "скрипт",
      "импорт", "экспорт", "миграция", "синхронизация", "backup",
      "API", "webhook", "интеграция", "кастомный", "advanced"
    ],
    priority: 4,
    tools: [
      "bulkUpdateReservations",
      "bulkCreateBookInstances",
      "bulkUpdateBookInstanceStatuses",
      "createMultipleBookInstances",
      "autoCreateBookInstances",
      "assignRoleToMultipleUsers",
      "removeRoleFromMultipleUsers"
    ]
  }
]

// Конфигурация по умолчанию с поддержкой уровней пользователей
export const DEFAULT_TOOL_SELECTION_CONFIG: ToolSelectionConfig = {
  maxToolsPerRequest: 20,
  alwaysIncludeCategories: ["system"],
  contextualSelection: true,
  userLevel: USER_LEVELS.INTERMEDIATE, // По умолчанию обычный пользователь
  userPreferences: {
    preferredCategories: [],
    excludedCategories: []
  },
  // НОВЫЕ параметры оптимизации
  isFinalResponse: false,
  hasToolExecutions: false,
  hasMultipleEntities: false,
  hasPasswordMention: false
}

// НОВАЯ функция: Определение множественных сущностей в запросе
function detectMultipleEntities(query: string): { hasMultiple: boolean; entities: string[] } {
  const normalizedQuery = query.toLowerCase()
  
  // Паттерны для разных сущностей
  const entityPatterns = [
    { name: 'users', patterns: ['пользовател', 'юзер', 'читател', 'студент', 'люди', 'человек'] },
    { name: 'books', patterns: ['книг', 'литератур', 'издани', 'том', 'каталог'] },
    { name: 'reservations', patterns: ['резерв', 'брон', 'заказ', 'выдач', 'возврат'] }
  ]
  
  const detectedEntities: string[] = []
  
  entityPatterns.forEach(entity => {
    const hasEntity = entity.patterns.some(pattern => normalizedQuery.includes(pattern))
    if (hasEntity) {
      detectedEntities.push(entity.name)
    }
  })
  
  return {
    hasMultiple: detectedEntities.length >= 2,
    entities: detectedEntities
  }
}

// НОВАЯ функция: Проверка упоминания пароля в запросе
function hasPasswordMention(query: string): boolean {
  const normalizedQuery = query.toLowerCase()
  const passwordPatterns = [
    'парол', 'password', 'сменить пароль', 'изменить пароль', 'сбросить пароль',
    'новый пароль', 'старый пароль', 'забыл пароль', 'восстановить пароль',
    'обновить пароль', 'установить пароль', 'задать пароль'
  ]
  
  return passwordPatterns.some(pattern => normalizedQuery.includes(pattern))
}

// НОВАЯ функция: Анализ контекста выполнения для определения финального ответа
export function analyzeExecutionContext(
  conversationHistory: any[],
  currentIteration: number = 0
): ExecutionContext {
  // Анализируем последние сообщения в истории
  const recentMessages = conversationHistory.slice(-10) // Последние 10 сообщений
  
  const hasExecutedTools = recentMessages.some(msg => 
    msg.apiCall || 
    msg.content?.includes('Думаю, нужно вызвать инструмент') ||
    msg.content?.includes('⚡') ||
    msg.content?.includes('📚') ||
    msg.content?.includes('👤') ||
    msg.content?.includes('📅')
  )
  
  const executedToolNames: string[] = []
  recentMessages.forEach(msg => {
    if (msg.apiCall?.endpoint) {
      executedToolNames.push(msg.apiCall.endpoint)
    }
  })
  
  // Проверяем наличие инструментов в последней итерации
  const lastMessage = recentMessages[recentMessages.length - 1]
  const lastIterationHadTools = lastMessage?.apiCall !== undefined
  
  // Определяем, является ли это финальным ответом
  const isLikelyFinalResponse = hasExecutedTools && 
                                 !lastIterationHadTools && 
                                 currentIteration > 0 &&
                                 executedToolNames.length > 0
  
  return {
    hasExecutedTools,
    executedToolNames,
    lastIterationHadTools,
    iterationCount: currentIteration,
    isLikelyFinalResponse
  }
}

// ---------- КЭШИРОВАНИЕ РЕЗУЛЬТАТОВ АНАЛИЗА ЗАПРОСОВ ----------
interface QueryAnalysisCache {
  [queryHash: string]: {
    analysis: ReturnType<typeof analyzeUserQuery>
    timestamp: number
  }
}

// Простой кэш для результатов анализа запросов (в памяти)
const queryAnalysisCache: QueryAnalysisCache = {}
const QUERY_CACHE_TTL = 30 * 60 * 1000 // 30 минут

// Функция для создания хэша запроса
function getQueryHash(query: string, userLevel: number): string {
  return `${query.toLowerCase().trim()}_${userLevel}`
}

// Функция для очистки устаревших записей кэша
function cleanupQueryCache(): void {
  const now = Date.now()
  Object.keys(queryAnalysisCache).forEach(key => {
    if (now - queryAnalysisCache[key].timestamp > QUERY_CACHE_TTL) {
      delete queryAnalysisCache[key]
    }
  })
}
// ---------- КОНЕЦ КЭШИРОВАНИЯ АНАЛИЗА ЗАПРОСОВ ----------

// Создание ключевых словосочетаний для точного выбора инструментов
const TOOL_PHRASE_MAPPINGS: Record<string, string[]> = {
  // Пользователи
  "создать пользователя": ["createUser"],
  "добавить пользователя": ["createUser"],
  "зарегистрировать пользователя": ["createUser"],
  "найти пользователя": ["searchUsers", "getUserById"],
  "показать пользователей": ["searchUsers"],
  "показать всех пользователей": ["getAllUsers"],
  "список пользователей": ["getAllUsers"],
  "все пользователи": ["getAllUsers"],
  "обновить пользователя": ["updateUser"],
  "изменить пользователя": ["updateUser"],
  "удалить пользователя": ["deleteUser"],
  "сменить пароль": ["changeUserPassword"],
  "сбросить пароль": ["resetUserPassword"],
  "резервирования пользователя": ["getUserReservations"],
  "активные резервирования пользователя": ["getUserActiveReservations"],
  "просроченные резервирования пользователя": ["getUserOverdueReservations"],
  "рекомендации для пользователя": ["getUserRecommendations"],
  "пользователи с книгами": ["getUsersWithBooks"],
  "пользователи со штрафами": ["getUsersWithFines"],
  "статистика пользователей": ["getUserStatistics"],

  // Книги
  "создать книгу": ["createBook"],
  "добавить книгу": ["createBook"],
  "новая книга": ["createBook"],
  "найти книгу": ["searchBooks", "getBookById"],
  "показать книги": ["searchBooks"],
  "показать все книги": ["getAllBooks"],
  "список книг": ["getAllBooks"],
  "все книги": ["getAllBooks"],
  "каталог книг": ["getAllBooks"],
  "обновить книгу": ["updateBook"],
  "изменить книгу": ["updateBook"],
  "удалить книгу": ["deleteBook"],
  "изменить жанр книги": ["updateBookGenre"],
  "категоризация книги": ["updateBookCategorization"],
  "добавить в избранное": ["addBookToFavorites"],
  "убрать из избранного": ["removeBookFromFavorites"],
  "доступность книги": ["getBookAvailability"],
  "лучший доступный экземпляр": ["getBestAvailableBookInstance"],
  "все экземпляры книги": ["getAllBookInstances"],
  "экземпляр книги": ["getBookInstanceById"],
  "экземпляры книги": ["getBookInstancesByBookId"],
  "создать экземпляр": ["createBookInstance"],
  "обновить экземпляр": ["updateBookInstance"],
  "удалить экземпляр": ["deleteBookInstance"],
  "изменить статус экземпляра": ["updateBookInstanceStatus"],
  "статистика экземпляров": ["getBookInstanceStats"],
  "создать несколько экземпляров": ["createMultipleBookInstances"],
  "автосоздание экземпляров": ["autoCreateBookInstances"],
  "резервирование экземпляра": ["getBookInstanceReservation"],
  "сводка статусов экземпляров": ["getInstanceStatusSummary"],
  "массовое создание экземпляров": ["bulkCreateBookInstances"],
  "массовое обновление статусов": ["bulkUpdateBookInstanceStatuses"],
  "статистика книг": ["getBookStatistics"],
  "топ популярных книг": ["getTopPopularBooks"],
  "популярные книги": ["getTopPopularBooks"],

  // Резервирования
  "создать резервирование": ["createReservation"],
  "создать бронирование": ["createReservation"],
  "создай резервирование": ["createReservation"],
  "создай бронирование": ["createReservation"],
  "забронировать книгу": ["createReservation"],
  "зарезервировать книгу": ["createReservation"],
  "найти резервирование": ["searchReservations", "getReservationById"],
  "показать резервирования": ["searchReservations"],
  "показать все резервирования": ["getAllReservations"],
  "список резервирований": ["getAllReservations"],
  "все резервирования": ["getAllReservations"],
  "обновить резервирование": ["updateReservation"],
  "изменить резервирование": ["updateReservation"],
  "удалить резервирование": ["deleteReservation"],
  "отменить резервирование": ["deleteReservation"],
  "даты резервирования": ["getReservationDates"],
  "даты резервирования книги": ["getReservationDatesByBookId"],
  "резервирования пользователя по id": ["getReservationsByUserId"],
  "массовое обновление резервирований": ["bulkUpdateReservations"],
  "просроченные резервирования": ["getOverdueReservations"],
  "статистика резервирований": ["getReservationStatistics"],

  // Роли
  "назначить роль": ["assignRoleToUser"],
  "изменить роль": ["updateUserRole"],
  "удалить роль": ["removeRoleFromUser"],
  "массовое назначение ролей": ["assignRoleToMultipleUsers"],
  "массовое удаление ролей": ["removeRoleFromMultipleUsers"],

  // Отчеты
  "создать отчет": ["getUserStatistics", "getReservationStatistics", "getBookStatistics"],
  "построить график": ["getUserStatistics", "getReservationStatistics", "getBookStatistics"],
  "статистика": ["getUserStatistics", "getReservationStatistics", "getBookStatistics"],
  "отчет": ["getUserStatistics", "getReservationStatistics", "getBookStatistics"],

  // Навигация
  "перейти на страницу": ["navigateToPage"],
  "открыть страницу": ["navigateToPage"],
  "показать страницу": ["navigateToPage"],

  // Системные
  "остановить агента": ["stopAgent"],
  "отменить действие": ["cancelCurrentAction"],
  "системный контекст": ["systemContext"]
}

// Улучшенный анализ запроса с поддержкой синонимов и контекста
export function analyzeUserQuery(query: string, userLevel: number = USER_LEVELS.INTERMEDIATE): {
  detectedCategories: string[]
  detectedTools: string[]
  confidence: Record<string, number>
  suggestedCategories: string[]
  intentType: 'question' | 'action' | 'report' | 'navigation'
  complexity: 'simple' | 'medium' | 'complex'
  // НОВЫЕ поля для оптимизации
  hasMultipleEntities: boolean
  entityTypes: string[]
  hasPasswordMention: boolean
} {
  // НОВОЕ: Проверяем кэш для этого запроса
  const queryHash = getQueryHash(query, userLevel)
  const cachedAnalysis = queryAnalysisCache[queryHash]
  
  if (cachedAnalysis && (Date.now() - cachedAnalysis.timestamp) < QUERY_CACHE_TTL) {
    console.log(`🎯 Кэш анализа HIT: "${query.substring(0, 50)}..."`)
    return cachedAnalysis.analysis
  }
  
  console.log(`❌ Кэш анализа MISS: "${query.substring(0, 50)}..."`)
  
  const normalizedQuery = query.toLowerCase().trim()
  const confidence: Record<string, number> = {}
  const detectedCategories: string[] = []
  const detectedTools: string[] = []

  // НОВАЯ логика: Анализ множественных сущностей
  const multipleEntitiesAnalysis = detectMultipleEntities(query)
  
  // НОВАЯ логика: Проверка упоминания пароля
  const passwordMention = hasPasswordMention(query)

  // Сначала проверяем точные словосочетания
  Object.entries(TOOL_PHRASE_MAPPINGS).forEach(([phrase, tools]) => {
    if (normalizedQuery.includes(phrase.toLowerCase())) {
      tools.forEach(tool => {
        if (!detectedTools.includes(tool)) {
          detectedTools.push(tool)
        }
      })
    }
  })

  // Определяем тип намерения
  let intentType: 'question' | 'action' | 'report' | 'navigation' = 'action'
  
  const questionWords = ['что', 'как', 'где', 'когда', 'сколько', 'кто', 'какой', 'какая', 'какие', 'почему']
  const actionWords = ['создать', 'добавить', 'удалить', 'изменить', 'обновить', 'назначить', 'отправить']
  const reportWords = ['отчет', 'статистика', 'график', 'показать', 'построить', 'сгенерировать']
  const navigationWords = ['перейти', 'открыть', 'показать страницу', 'веди']

  if (questionWords.some(word => normalizedQuery.includes(word))) {
    intentType = 'question'
  } else if (reportWords.some(word => normalizedQuery.includes(word))) {
    intentType = 'report'
  } else if (navigationWords.some(word => normalizedQuery.includes(word))) {
    intentType = 'navigation'
  } else if (actionWords.some(word => normalizedQuery.includes(word))) {
    intentType = 'action'
  }

  // Определяем сложность запроса
  const complexity = getQueryComplexity(normalizedQuery)

  // Фильтруем категории по уровню пользователя
  const availableCategories = TOOL_CATEGORIES.filter(category => 
    !category.minUserLevel || category.minUserLevel <= userLevel
  )

  // Анализируем каждую доступную категорию
  availableCategories.forEach(category => {
    let score = 0
    let matchCount = 0

    // Проверяем совпадения с ключевыми словами категории
    category.keywords.forEach(keyword => {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        const weight = keyword.split(" ").length
        score += weight
        matchCount++
      }
    })

    // Проверяем совпадения с именами инструментов
    category.tools.forEach(toolName => {
      const normalizedToolName = toolName.toLowerCase()
      if (normalizedQuery.includes(normalizedToolName) || 
          isToolNameVariant(normalizedQuery, toolName)) {
        score += 2
        matchCount++
        if (!detectedTools.includes(toolName)) {
          detectedTools.push(toolName)
        }
      }
    })

    // Дополнительные бонусы для определенных типов намерений
    if (intentType === 'report' && category.id === 'reports') {
      score += 1
    }
    if (intentType === 'navigation' && category.id === 'navigation') {
      score += 1
    }

    // Нормализуем счет
    if (matchCount > 0) {
      confidence[category.id] = score
      detectedCategories.push(category.id)
    }
  })

  // Сортируем по уверенности
  detectedCategories.sort((a, b) => (confidence[b] || 0) - (confidence[a] || 0))

  // Получаем предлагаемые категории
  const suggestedCategories = getSuggestedCategories(detectedCategories, normalizedQuery, intentType, userLevel)

  const result = {
    detectedCategories,
    detectedTools,
    confidence,
    suggestedCategories,
    intentType,
    complexity,
    // НОВЫЕ поля
    hasMultipleEntities: multipleEntitiesAnalysis.hasMultiple,
    entityTypes: multipleEntitiesAnalysis.entities,
    hasPasswordMention: passwordMention
  }
  
  // НОВОЕ: Кэшируем результат анализа
  queryAnalysisCache[queryHash] = {
    analysis: result,
    timestamp: Date.now()
  }
  
  // Периодически очищаем устаревшие записи (раз в 100 запросов)
  if (Object.keys(queryAnalysisCache).length % 100 === 0) {
    cleanupQueryCache()
  }
  
  return result
}

// Определение сложности запроса
function getQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
  const words = query.split(/\s+/).length
  const hasMultipleEntities = (query.match(/\b(пользовател|книг|резервирован)\w*\b/g) || []).length > 1
  const hasDateRanges = /\b(за\s+\w+|с\s+\d+|до\s+\d+|между\s+\d+)\b/.test(query)
  const hasConditions = /\b(если|когда|где|с условием)\b/.test(query)
  const hasSpecificActions = /\b(создать|добавить|удалить|изменить|обновить|назначить)\b/.test(query)
  
  // Простые запросы: короткие, одна сущность, без действий
  if (words <= 8 && !hasMultipleEntities && !hasSpecificActions && !hasDateRanges && !hasConditions) {
    return 'simple'
  }
  
  // Сложные запросы: длинные, с условиями, датами, множественными сущностями
  if (words > 15 || hasDateRanges || hasConditions || (hasMultipleEntities && hasSpecificActions)) {
    return 'complex'
  }
  
  return 'medium'
}

// Проверка вариантов имени инструмента
function isToolNameVariant(query: string, toolName: string): boolean {
  const variants = generateToolNameVariants(toolName)
  return variants.some(variant => query.includes(variant.toLowerCase()))
}

// Генерация вариантов имени инструмента
function generateToolNameVariants(toolName: string): string[] {
  const variants = [toolName]
  
  // Преобразования camelCase в читаемый вид
  const readable = toolName.replace(/([A-Z])/g, ' $1').trim().toLowerCase()
  variants.push(readable)
  
  // Специфичные замены
  const replacements = {
    'get': ['получить', 'показать', 'найти'],
    'create': ['создать', 'добавить'],
    'update': ['обновить', 'изменить'],
    'delete': ['удалить', 'убрать'],
    'all': ['все', 'всех'],
    'user': ['пользователь', 'юзер'],
    'book': ['книга', 'книги'],
    'reservation': ['резервирование', 'бронь']
  }
  
  let result = readable
  Object.entries(replacements).forEach(([eng, rus]) => {
    rus.forEach(r => {
      if (result.includes(eng)) {
        variants.push(result.replace(eng, r))
      }
    })
  })
  
  return variants
}

// Улучшенное получение предлагаемых категорий
function getSuggestedCategories(
  detectedCategories: string[], 
  query: string, 
  intentType: string,
  userLevel: number
): string[] {
  const suggestions: string[] = []

  // Фильтруем доступные категории по уровню пользователя
  const availableCategories = TOOL_CATEGORIES.filter(cat => 
    !cat.minUserLevel || cat.minUserLevel <= userLevel
  ).map(cat => cat.id)

  // Предложения на основе связанных категорий
  if (detectedCategories.includes("reservations")) {
    if (!detectedCategories.includes("users") && availableCategories.includes("users")) {
      suggestions.push("users")
    }
    if (!detectedCategories.includes("books") && availableCategories.includes("books")) {
      suggestions.push("books")
  }
  }

  if (detectedCategories.includes("users") &&
      (query.includes("роль") || query.includes("права")) &&
      availableCategories.includes("roles")) {
    if (!detectedCategories.includes("roles")) suggestions.push("roles")
  }

  // Предложения на основе типа намерения
  if (intentType === 'report' && !detectedCategories.includes("reports") && 
      availableCategories.includes("reports")) {
    suggestions.push("reports")
  }

  if (intentType === 'navigation' && !detectedCategories.includes("navigation") &&
      availableCategories.includes("navigation")) {
    suggestions.push("navigation")
}

  // Для новичков предлагаем базовые категории
  if (userLevel === USER_LEVELS.NOVICE && detectedCategories.length === 0) {
    return ["users", "books", "reservations"].filter(cat => 
      availableCategories.includes(cat) && !detectedCategories.includes(cat)
    )
  }

  return suggestions.filter(cat => availableCategories.includes(cat))
}

// Улучшенная фильтрация инструментов с учетом уровня пользователя И НОВЫХ ОПТИМИЗАЦИЙ
export function filterToolsByCategories(
  allTools: Tool[],
  selectedCategories: string[],
  specificTools: string[] = [],
  config: ToolSelectionConfig = DEFAULT_TOOL_SELECTION_CONFIG,
  executionContext?: ExecutionContext
): Tool[] {
  // ... (логика для isFinalResponse остается без изменений)
  if (config.isFinalResponse || executionContext?.isLikelyFinalResponse) {
    // Проверяем, есть ли в категориях навигация - если да, то не ограничиваем FINAL_RESPONSE_TOOLS
    const hasNavigationCategory = selectedCategories.includes('navigation')
    const hasSystemCategory = selectedCategories.includes('system')
    
    if (hasNavigationCategory || hasSystemCategory) {
      // Для навигационных/системных запросов не применяем ограничение FINAL_RESPONSE_TOOLS
      console.log(`🎯 Финальный ответ (навигация/система): без ограничений FINAL_RESPONSE_TOOLS`)
    } else {
      // Для остальных запросов применяем ограничение
      const finalTools = allTools.filter(tool => 
        FINAL_RESPONSE_TOOLS.includes(tool.name) ||
        specificTools.includes(tool.name)
      )
      console.log(`🎯 Детекция финального ответа: отправлено ${finalTools.length}/${allTools.length} инструментов`)
      return finalTools.slice(0, 8) // Максимум 8 инструментов для финального ответа
    }
  }

  const availableCategories = TOOL_CATEGORIES.filter(cat => 
    !cat.minUserLevel || cat.minUserLevel <= config.userLevel
  );

  const categoriesToInclude = new Set([
    ...selectedCategories,
    ...config.alwaysIncludeCategories.filter(cat => 
      availableCategories.some(avail => avail.id === cat)
    )
  ]);

  if (config.userPreferences?.excludedCategories) {
    config.userPreferences.excludedCategories.forEach(cat =>
      categoriesToInclude.delete(cat)
    );
  }

  const toolNamesToInclude = new Set<string>();

  availableCategories.forEach(category => {
    if (categoriesToInclude.has(category.id)) {
      category.tools.forEach(toolName => {
        toolNamesToInclude.add(toolName);
      });
    }
  });

  specificTools.forEach(toolName => toolNamesToInclude.add(toolName));

  let filteredTools = allTools.filter(tool =>
    toolNamesToInclude.has(tool.name)
  );

  // --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ 1: Более строгая и централизованная фильтрация ---
  // Применяем фильтрацию по флагам ко всему набору выбранных инструментов.

  if (config.hasMultipleEntities) {
    const initialCount = filteredTools.length;
    filteredTools = filteredTools.filter(tool => {
      // Исключаем все инструменты, которые модифицируют сущности
      if (ENTITY_MODIFICATION_TOOLS.includes(tool.name)) {
        // Исключение: createReservation может быть нужен в контексте user+book
        if (tool.name === 'createReservation') {
          return true;
        }
        return false;
      }
      return true;
    });
    console.log(`🚫 [Оптимизация] Множественные сущности: Удалено ${initialCount - filteredTools.length} CRUD инструментов.`);
  }

  // ... (ограничение количества и сортировка остаются без изменений)
  if (filteredTools.length > config.maxToolsPerRequest) {
    const priorityMap = new Map<string, number>()
    availableCategories.forEach(cat => {
      cat.tools.forEach(toolName => {
        if (!priorityMap.has(toolName) || priorityMap.get(toolName)! > cat.priority) {
          priorityMap.set(toolName, cat.priority)
        }
      })
    })

    filteredTools = filteredTools
      .sort((a, b) => {
        const aInSpecific = specificTools.includes(a.name) ? -100 : 0
        const bInSpecific = specificTools.includes(b.name) ? -100 : 0
        if (aInSpecific !== bInSpecific) return aInSpecific - bInSpecific
        return (priorityMap.get(a.name) || 999) - (priorityMap.get(b.name) || 999)
      })
      .slice(0, config.maxToolsPerRequest)
  }

  return filteredTools;
}

// ---------- КЭШИРОВАНИЕ РЕЗУЛЬТАТОВ ВЫБОРА ИНСТРУМЕНТОВ ----------
interface ToolSelectionCache {
  [selectionHash: string]: {
    result: {
      selectedTools: Tool[]
      analysis: ReturnType<typeof analyzeUserQuery>
      usedCategories: string[]
    }
    timestamp: number
  }
}

const toolSelectionCache: ToolSelectionCache = {}
const TOOL_SELECTION_CACHE_TTL = 10 * 60 * 1000 // 10 минут

function getToolSelectionHash(query: string, config: ToolSelectionConfig, executionContext?: ExecutionContext): string {
  const contextStr = executionContext ? JSON.stringify({
    hasExecutedTools: executionContext.hasExecutedTools,
    iterationCount: executionContext.iterationCount,
    isLikelyFinalResponse: executionContext.isLikelyFinalResponse
  }) : ''
  
  // НОВОЕ: Добавляем параметры дополнения в хэш
  const appendStr = config.appendToExisting ? 
    `_append_${config.existingTools?.map(t => t.name).join(',') || ''}` : ''
  
  return `${query.toLowerCase().trim()}_${config.userLevel}_${config.maxToolsPerRequest}_${contextStr}${appendStr}`
}
// ---------- КОНЕЦ КЭШИРОВАНИЯ ВЫБОРА ИНСТРУМЕНТОВ ----------

// Автоматический выбор инструментов с улучшенной логикой И НОВЫМИ ОПТИМИЗАЦИЯМИ
export function selectToolsForQuery(
  query: string,
  allTools: Tool[],
  config: ToolSelectionConfig = DEFAULT_TOOL_SELECTION_CONFIG,
  executionContext?: ExecutionContext // НОВЫЙ параметр
): {
  selectedTools: Tool[]
  analysis: ReturnType<typeof analyzeUserQuery>
  usedCategories: string[]
} {
  // НОВОЕ: Проверяем кэш выбора инструментов
  const selectionHash = getToolSelectionHash(query, config, executionContext)
  const cachedSelection = toolSelectionCache[selectionHash]
  
  if (cachedSelection && (Date.now() - cachedSelection.timestamp) < TOOL_SELECTION_CACHE_TTL) {
    console.log(`🎯 Кэш выбора инструментов HIT: "${query.substring(0, 50)}..."`)
    return cachedSelection.result
  }
  
  console.log(`❌ Кэш выбора инструментов MISS: "${query.substring(0, 50)}..."`)
  
  const analysis = analyzeUserQuery(query, config.userLevel)
  let categoriesToUse = [...analysis.detectedCategories]
  let specificTools = [...analysis.detectedTools]

  // --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ 2: Передаем агрегированные флаги из config ---
  const enhancedConfig = {
    ...config,
    hasToolExecutions: executionContext?.hasExecutedTools || false,
    isFinalResponse: executionContext?.isLikelyFinalResponse || false,
    // Используем флаги из config (агрегированные) ИЛИ из текущего анализа
    hasMultipleEntities: config.hasMultipleEntities || analysis.hasMultipleEntities,
    hasPasswordMention: config.hasPasswordMention || analysis.hasPasswordMention
  };
  
  console.log("🔧 Конфигурация для выбора:", { 
      hasMultipleEntities: enhancedConfig.hasMultipleEntities, 
      hasPasswordMention: enhancedConfig.hasPasswordMention,
      appendToExisting: enhancedConfig.appendToExisting
  });

  // --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ 3: Умное дополнение ---
  if (enhancedConfig.appendToExisting && enhancedConfig.existingTools) {
    // 1. Начинаем с уже существующих инструментов
    const existingToolNames = enhancedConfig.existingTools.map(t => t.name);
    specificTools = [...new Set([...existingToolNames, ...specificTools])];
    
    // 2. Определяем категории, которые уже были активны
    const existingCategories = TOOL_CATEGORIES
      .filter(cat => cat.tools.some(toolName => existingToolNames.includes(toolName)))
      .map(cat => cat.id);
      
    // 3. Объединяем старые и новые категории
    categoriesToUse = [...new Set([...existingCategories, ...categoriesToUse])];
    
    console.log(`🔧 [ДОПОЛНЕНИЕ] Существующие инструменты (${existingToolNames.length}) и категории (${existingCategories.join(', ')}) сохранены.`);
  }

  // Если ключевых слов не найдено, отправляем только системные инструменты
  if (analysis.detectedCategories.length === 0 && analysis.detectedTools.length === 0) {
      categoriesToUse = [];
  } else if (analysis.intentType === 'navigation' && analysis.complexity === 'simple') {
    // Для простых навигационных запросов отправляем минимальный набор
    categoriesToUse = ['navigation']; // 'system' добавится автоматически через alwaysIncludeCategories
  } else {
    // Добавляем предлагаемые категории
    analysis.suggestedCategories.forEach(cat => {
      if (!categoriesToUse.includes(cat)) {
        categoriesToUse.push(cat);
      }
    });

    // Обычная логика для новых запросов
    if (categoriesToUse.includes('users') && !specificTools.includes('searchUsers')) {
      specificTools.push('searchUsers');
    }
    if (categoriesToUse.includes('books') && !specificTools.includes('searchBooks')) {
      specificTools.push('searchBooks');
    }
    if (categoriesToUse.includes('reservations') && !specificTools.includes('searchReservations')) {
      specificTools.push('searchReservations');
    }
  }

  // Если после всей логики ничего не выбрано (кроме системных), используем базовый набор
  if (categoriesToUse.length === 0 && specificTools.length === 0) {
    // Эта проверка нужна, чтобы пустой запрос не вызывал дефолтный набор
    const queryHasKeywords = TOOL_CATEGORIES.some(cat => cat.keywords.some(kw => query.includes(kw)));
    if (queryHasKeywords || query.length > 10) { // Если есть ключевые слова или запрос длинный
        if (enhancedConfig.userLevel === USER_LEVELS.NOVICE) {
          categoriesToUse = ["users", "books", "reservations"];
        } else {
          categoriesToUse = ["users", "books", "reservations", "reports"];
        }
    }
  }

  // Применяем пользовательские предпочтения
  if (enhancedConfig.userPreferences?.preferredCategories) {
    enhancedConfig.userPreferences.preferredCategories.forEach(cat => {
      if (!categoriesToUse.includes(cat)) {
        categoriesToUse.push(cat)
      }
    })
  }



  // Динамическая настройка максимального количества инструментов
  let maxTools: number;
  
  // НОВАЯ ОПТИМИЗАЦИЯ: Для финального ответа резко сокращаем количество
  if (enhancedConfig.isFinalResponse) {
    maxTools = 6;
  } else {
    switch (analysis.complexity) {
      case 'simple':
        // Для простых запросов минимум инструментов
        maxTools = categoriesToUse.length <= 1 ? 4 : 6;
        break;
      case 'medium':
        // Для средних запросов умеренное количество
        maxTools = enhancedConfig.hasMultipleEntities ? 8 : 10;
        break;
      case 'complex':
      default:
        // Для сложных запросов максимум инструментов
        maxTools = 15;
        break;
    }
  }
  

  
  const dynamicConfig = {
      ...enhancedConfig,
      maxToolsPerRequest: maxTools
  };

  const selectedTools = filterToolsByCategories(allTools, categoriesToUse, specificTools, dynamicConfig, executionContext)

  const result = {
    selectedTools,
    analysis,
    // Пересчитываем использованные категории из финального списка инструментов для точности
    usedCategories: [...new Set(TOOL_CATEGORIES
        .filter(cat => selectedTools.some(tool => cat.tools.includes(tool.name)))
        .map(cat => cat.id))]
  }
  
  // НОВОЕ: Кэшируем результат выбора инструментов
  toolSelectionCache[selectionHash] = {
    result,
    timestamp: Date.now()
  }
  
  // Периодически очищаем устаревшие записи кэша (раз в 50 запросов)
  if (Object.keys(toolSelectionCache).length % 50 === 0) {
    const now = Date.now()
    Object.keys(toolSelectionCache).forEach(key => {
      if (now - toolSelectionCache[key].timestamp > TOOL_SELECTION_CACHE_TTL) {
        delete toolSelectionCache[key]
      }
    })
  }
  
  return result
}

// Получение статистики использования инструментов
export function getToolUsageStats(selectedTools: Tool[], allTools: Tool[]): {
  totalTools: number
  selectedCount: number
  reductionPercentage: number
  categoriesUsed: string[]
  efficiencyScore: number
} {
  const selectedNames = new Set(selectedTools.map(t => t.name))
  const categoriesUsed = TOOL_CATEGORIES
    .filter(cat => cat.tools.some(toolName => selectedNames.has(toolName)))
    .map(cat => cat.id)

  const reductionPercentage = allTools.length > 0 ? 
    Math.round((1 - selectedTools.length / allTools.length) * 100) : 0

  // Вычисляем оценку эффективности (чем больше сокращение, тем лучше)
  const efficiencyScore = Math.min(100, reductionPercentage + categoriesUsed.length * 5)

  return {
    totalTools: allTools.length,
    selectedCount: selectedTools.length,
    reductionPercentage,
    categoriesUsed,
    efficiencyScore
  }
}

// Создание человекочитаемого описания выбора инструментов
export function createSelectionSummary(
  analysis: ReturnType<typeof analyzeUserQuery>,
  usedCategories: string[],
  stats: ReturnType<typeof getToolUsageStats>
): string {
  const categoryNames = usedCategories
    .map(id => TOOL_CATEGORIES.find(cat => cat.id === id)?.name)
    .filter(Boolean)
    .join(", ")

  const intentText = {
    'question': 'Вопрос',
    'action': 'Действие', 
    'report': 'Отчет',
    'navigation': 'Навигация'
  }[analysis.intentType] || 'Запрос'

  const complexityText = {
    'simple': 'простой',
    'medium': 'средний',
    'complex': 'сложный'
  }[analysis.complexity] || 'обычный'

  const detectedText = analysis.detectedCategories.length > 0
    ? `Обнаружены: ${analysis.detectedCategories.map(id =>
        TOOL_CATEGORIES.find(cat => cat.id === id)?.name
      ).join(", ")}`
    : "Используется базовый набор"

  const specificToolsText = analysis.detectedTools.length > 0
    ? ` (+ ${analysis.detectedTools.length} конкретных инструментов)`
    : ""

  let optimizationText = ""
  if (analysis.hasMultipleEntities) {
    optimizationText += " 🚫 CRUD исключены для множественных сущностей."
  }
  if (!analysis.hasPasswordMention) {
    optimizationText += " 🔒 Инструменты паролей исключены."
  }

  return `${intentText} (${complexityText}). ${detectedText}${specificToolsText}.${optimizationText} Отправлено ${stats.selectedCount}/${stats.totalTools} инструментов (-${stats.reductionPercentage}%). Категории: ${categoryNames}. Эффективность: ${stats.efficiencyScore}%.`
}

// T9 функциональность для поддержки команд
export class T9Helper {
  private static keyMap: { [key: string]: string[] } = {
    '2': ['а', 'б', 'в', 'г'],
    '3': ['д', 'е', 'ё', 'ж', 'з'],
    '4': ['и', 'й', 'к', 'л'],
    '5': ['м', 'н', 'о', 'п'],
    '6': ['р', 'с', 'т', 'у'],
    '7': ['ф', 'х', 'ц', 'ч'],
    '8': ['ш', 'щ', 'ъ', 'ы'],
    '9': ['ь', 'э', 'ю', 'я']
  }

  private static commands = [
    'покажи всех пользователей', 'покажи все книги', 'покажи все резервирования',
    'создать пользователя', 'создать книгу', 'создать резервирование',
    'найти пользователя', 'найти книгу', 'статистика пользователей',
    'статистика книг', 'статистика резервирований', 'построить график',
    'создать отчет', 'топ популярных книг', 'просроченные резервирования',
    'активные резервирования', 'одобрить резервирование', 'отменить резервирование',
    'вернуть книгу', 'выдать книгу', 'назначить роль', 'изменить пароль',
    'отправить уведомление', 'перейти на страницу', 'открыть каталог'
  ]

  static getSuggestions(input: string, maxSuggestions: number = 5): string[] {
    if (!input.trim()) return []
    
    const normalizedInput = input.toLowerCase().trim()
    
    const startsWith = this.commands.filter(cmd => 
      cmd.toLowerCase().startsWith(normalizedInput)
    )
    
    const contains = this.commands.filter(cmd => 
      cmd.toLowerCase().includes(normalizedInput) && 
      !cmd.toLowerCase().startsWith(normalizedInput)
    )
    
    const fuzzy = this.commands.filter(cmd => {
      const words = normalizedInput.split(' ')
      return words.every(word => cmd.toLowerCase().includes(word))
    }).filter(cmd => !startsWith.includes(cmd) && !contains.includes(cmd))
    
    return [...startsWith, ...contains, ...fuzzy].slice(0, maxSuggestions)
  }
}

// НОВОЕ: Функции для управления кэшем анализа
export function getQueryAnalysisCacheStats(): { size: number; oldestEntry: number; newestEntry: number } {
  const entries = Object.values(queryAnalysisCache)
  const timestamps = entries.map(e => e.timestamp)
  
  return {
    size: entries.length,
    oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
    newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
  }
}

export function clearQueryAnalysisCache(): void {
  Object.keys(queryAnalysisCache).forEach(key => delete queryAnalysisCache[key])
  Object.keys(toolSelectionCache).forEach(key => delete toolSelectionCache[key])
  console.log('🧹 Кэш анализа запросов и выбора инструментов очищен')
}

// Экспорт для использования в React компоненте
export {
  TOOL_CATEGORIES as toolCategories,
  DEFAULT_TOOL_SELECTION_CONFIG as defaultConfig,
  USER_LEVELS as userLevels
}


