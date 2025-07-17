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
}

export interface ToolSelectionConfig {
  maxToolsPerRequest: number
  alwaysIncludeCategories: string[]
  contextualSelection: boolean
  userPreferences?: {
    preferredCategories: string[]
    excludedCategories: string[]
  }
}

// Определение категорий инструментов
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "users",
    name: "Пользователи",
    description: "Управление пользователями библиотеки",
    icon: "👤",
    keywords: [
      "пользователь", "юзер", "клиент", "читатель", "студент", "человек", "люди",
      "создать пользователя", "добавить пользователя", "зарегистрировать",
      "найти пользователя", "показать пользователей", "список пользователей",
      "обновить пользователя", "изменить пользователя", "удалить пользователя",
      "профиль", "аккаунт", "регистрация", "авторизация", "рекомендации",
      "пароль", "сброс пароля", "изменить пароль", "штраф", "активность",
      "с книгами", "с просрочками", "активные резервирования", "просроченные",
      "статистика пользователей", "отчет по пользователям", "график пользователей"
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
      "getUserStatistics" // Добавлен инструмент статистики пользователей
    ]
  },
  {
    id: "books",
    name: "Книги",
    description: "Управление каталогом книг",
    icon: "📚",
    keywords: [
      "книга", "книги", "литература", "издание", "том", "экземпляр", "каталог",
      "добавить книгу", "создать книгу", "новая книга", "загрузить книгу",
      "найти книгу", "поиск книг", "показать книги", "список книг",
      "обновить книгу", "изменить книгу", "удалить книгу",
      "автор", "название", "жанр", "ISBN", "издательство", "год издания",
      "доступность", "экземпляры", "копии", "полка", "позиция", "состояние",
      "избранное", "рекомендации", "популярные", "статистика",
      "статистика книг", "отчет по книгам", "график книг", "топ книг", "популярные книги"
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
      "getBookStatistics", // Добавлен инструмент статистики книг
      "getTopPopularBooks" // Добавлен инструмент популярных книг
    ]
  },
  {
    id: "reservations",
    name: "Резервирования",
    description: "Управление бронированием и выдачей книг",
    icon: "📅",
    keywords: [
      "резерв", "бронь", "бронирование", "резервирование", "заказ", "запрос",
      "забронировать", "зарезервировать", "заказать книгу", "взять книгу",
      "выдать книгу", "вернуть книгу", "продлить", "продление",
      "одобрить", "отклонить", "отменить", "статус", "срок",
      "просрочка", "штраф", "история выдач", "активные брони",
      "даты", "период", "массовое обновление", "просроченные",
      "статистика резервирований", "отчет по резервированиям", "график резервирований"
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
      "getReservationStatistics" // Добавлен инструмент статистики резервирований
    ]
  },
  {
    id: "roles",
    name: "Роли и права",
    description: "Управление ролями пользователей",
    icon: "👥",
    keywords: [
      "роль", "права", "доступ", "разрешения", "администратор", "библиотекарь",
      "назначить роль", "изменить роль", "права доступа", "полномочия",
      "группа", "статус пользователя", "уровень доступа", "удалить роль",
      "массовое назначение", "обновление ролей"
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
    keywords: [
      "отчет", "статистика", "график", "диаграмма", "аналитика", "данные",
      "построить график", "создать отчет", "показать статистику",
      "анализ", "метрики", "KPI", "дашборд", "визуализация",
      "тренды", "динамика", "сводка", "сводный отчет", "популярные",
      "пользователи", "книги", "резервирования", "период", "группировка",
      "html отчет", "сгенерировать отчет"
    ],
    priority: 2, // Повышен приоритет для отчетов
    tools: [
      "getUserStatistics",
      "getReservationStatistics", 
      "getBookStatistics",
      "getTopPopularBooks",
      // Дополнительные инструменты, которые могут быть использованы для отчетов
      "getAllUsers",
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
    keywords: [
      "уведомление", "уведомления", "push", "email", "сообщение",
      "отправить", "оповестить", "информировать", "алерт", "предупреждение",
      "шаблон", "кастомное", "массовая рассылка", "тип уведомления"
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
    keywords: [
      "история", "диалог", "чат", "сообщения", "поиск в истории",
      "конверсация", "разговор", "логи", "архив", "прошлые запросы"
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
    keywords: [
      "перейти", "открыть страницу", "показать страницу", "навигация",
      "страница", "раздел", "меню", "переход", "ссылка", "URL",
      "главная", "каталог", "профиль", "настройки", "админка"
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
    keywords: [
      "стоп", "остановить", "отменить", "прервать", "отмена",
      "агент", "ассистент", "система", "сброс", "перезапуск",
      "контекст", "системный"
    ],
    priority: 1,
    tools: [
      "systemContext",
      "stopAgent",
      "cancelCurrentAction"
    ]
  }
]

// Конфигурация по умолчанию
export const DEFAULT_TOOL_SELECTION_CONFIG: ToolSelectionConfig = {
  maxToolsPerRequest: 15, // Максимум инструментов в одном запросе
  alwaysIncludeCategories: ["system"], // Всегда включать системные инструменты
  contextualSelection: true, // Включить контекстуальный выбор
  userPreferences: {
    preferredCategories: [],
    excludedCategories: []
  }
}

// Анализ запроса пользователя для определения релевантных категорий и отдельных инструментов
export function analyzeUserQuery(query: string): {
  detectedCategories: string[]
  detectedTools: string[] // Добавлено: обнаруженные конкретные инструменты
  confidence: Record<string, number>
  suggestedCategories: string[]
} {
  const normalizedQuery = query.toLowerCase().trim()
  const confidence: Record<string, number> = {}
  const detectedCategories: string[] = []
  const detectedTools: string[] = []

  // Анализируем каждую категорию
  TOOL_CATEGORIES.forEach(category => {
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

    // Проверяем совпадения с именами инструментов внутри категории
    category.tools.forEach(toolName => {
      const normalizedToolName = toolName.toLowerCase()
      if (normalizedQuery.includes(normalizedToolName)) {
        // Увеличиваем счет и добавляем инструмент в detectedTools
        score += 2 // Больший вес для прямого совпадения с именем инструмента
        matchCount++
        if (!detectedTools.includes(toolName)) {
          detectedTools.push(toolName)
        }
      }
    })

    // Нормализуем счет
    if (matchCount > 0) {
      confidence[category.id] = Math.min(score / (category.keywords.length + category.tools.length), 1.0)

      // Добавляем в обнаруженные категории, если уверенность выше порога
      if (confidence[category.id] > 0.1) {
        detectedCategories.push(category.id)
      }
    }
  })

  // Сортируем по уверенности
  detectedCategories.sort((a, b) => (confidence[b] || 0) - (confidence[a] || 0))

  // Предлагаем дополнительные категории на основе контекста
  const suggestedCategories = getSuggestedCategories(detectedCategories, normalizedQuery)

  return {
    detectedCategories,
    detectedTools,
    confidence,
    suggestedCategories
  }
}

// Получение предлагаемых категорий на основе контекста
function getSuggestedCategories(detectedCategories: string[], query: string): string[] {
  const suggestions: string[] = []

  // Если обнаружены резервирования, предлагаем пользователей и книги
  if (detectedCategories.includes("reservations")) {
    if (!detectedCategories.includes("users")) suggestions.push("users")
    if (!detectedCategories.includes("books")) suggestions.push("books")
  }

  // Если обнаружены пользователи и упоминаются роли
  if (detectedCategories.includes("users") &&
      (query.includes("роль") || query.includes("права") || query.includes("администратор"))) {
    if (!detectedCategories.includes("roles")) suggestions.push("roles")
  }

  // Если запрос содержит вопросительные слова, предлагаем отчеты
  const questionWords = ["сколько", "какой", "какая", "какие", "где", "когда", "статистика", "отчет", "график"]
  if (questionWords.some(word => query.includes(word)) &&
      !detectedCategories.includes("reports")) {
    suggestions.push("reports")
  }

  return suggestions
}

// Фильтрация инструментов на основе выбранных категорий и конкретных инструментов
export function filterToolsByCategories(
  allTools: Tool[],
  selectedCategories: string[],
  specificTools: string[], // Добавлено: конкретные инструменты для включения
  config: ToolSelectionConfig = DEFAULT_TOOL_SELECTION_CONFIG
): Tool[] {
  // Всегда включаем обязательные категории
  const categoriesToInclude = new Set([
    ...selectedCategories,
    ...config.alwaysIncludeCategories
  ])

  // Исключаем нежелательные категории
  if (config.userPreferences?.excludedCategories) {
    config.userPreferences.excludedCategories.forEach(cat =>
      categoriesToInclude.delete(cat)
    )
  }

  // Собираем имена инструментов из выбранных категорий
  const toolNamesToInclude = new Set<string>()

  TOOL_CATEGORIES.forEach(category => {
    if (categoriesToInclude.has(category.id)) {
      category.tools.forEach(toolName => toolNamesToInclude.add(toolName))
    }
  })

  // Добавляем конкретные инструменты, обнаруженные в запросе
  specificTools.forEach(toolName => toolNamesToInclude.add(toolName))

  // Фильтруем инструменты
  let filteredTools = allTools.filter(tool =>
    toolNamesToInclude.has(tool.name)
  )

  // Ограничиваем количество инструментов, если их слишком много
  if (filteredTools.length > config.maxToolsPerRequest) {
    // Сортируем по приоритету категорий, затем по наличию в specificTools
    const priorityMap = new Map<string, number>()
    TOOL_CATEGORIES.forEach(cat => {
      cat.tools.forEach(toolName => {
        if (!priorityMap.has(toolName) || priorityMap.get(toolName)! > cat.priority) {
          priorityMap.set(toolName, cat.priority)
        }
      })
    })

    filteredTools = filteredTools
      .sort((a, b) => {
        const aInSpecific = specificTools.includes(a.name) ? -100 : 0; // Приоритет для конкретных
        const bInSpecific = specificTools.includes(b.name) ? -100 : 0;
        if (aInSpecific !== bInSpecific) return aInSpecific - bInSpecific;
        return (priorityMap.get(a.name) || 999) - (priorityMap.get(b.name) || 999);
      })
      .slice(0, config.maxToolsPerRequest)
  }

  return filteredTools
}

// Автоматический выбор инструментов на основе запроса
export function selectToolsForQuery(
  query: string,
  allTools: Tool[],
  config: ToolSelectionConfig = DEFAULT_TOOL_SELECTION_CONFIG
): {
  selectedTools: Tool[]
  analysis: ReturnType<typeof analyzeUserQuery>
  usedCategories: string[]
} {
  const analysis = analyzeUserQuery(query)

  // Определяем категории для включения
  let categoriesToUse = [...analysis.detectedCategories]

  // Если ничего не обнаружено, используем базовый набор
  if (categoriesToUse.length === 0) {
    categoriesToUse = ["users", "books", "reservations"] // Базовые категории
  }

  // Добавляем предлагаемые категории с высокой уверенностью
  analysis.suggestedCategories.forEach(cat => {
    if (!categoriesToUse.includes(cat)) {
      categoriesToUse.push(cat)
    }
  })

  // Применяем пользовательские предпочтения
  if (config.userPreferences?.preferredCategories) {
    config.userPreferences.preferredCategories.forEach(cat => {
      if (!categoriesToUse.includes(cat)) {
        categoriesToUse.push(cat)
      }
    })
  }

  const selectedTools = filterToolsByCategories(allTools, categoriesToUse, analysis.detectedTools, config)

  return {
    selectedTools,
    analysis,
    usedCategories: categoriesToUse
  }
}

// Получение статистики использования инструментов
export function getToolUsageStats(selectedTools: Tool[], allTools: Tool[]): {
  totalTools: number
  selectedCount: number
  reductionPercentage: number
  categoriesUsed: string[]
} {
  const selectedNames = new Set(selectedTools.map(t => t.name))
  const categoriesUsed = TOOL_CATEGORIES
    .filter(cat => cat.tools.some(toolName => selectedNames.has(toolName)))
    .map(cat => cat.id)

  return {
    totalTools: allTools.length,
    selectedCount: selectedTools.length,
    reductionPercentage: allTools.length > 0 ? Math.round((1 - selectedTools.length / allTools.length) * 100) : 0,
    categoriesUsed
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

  const detectedText = analysis.detectedCategories.length > 0
    ? `Обнаружены категории: ${analysis.detectedCategories.map(id =>
        TOOL_CATEGORIES.find(cat => cat.id === id)?.name
      ).join(", ")}`
    : "Категории не обнаружены, используется базовый набор"

  const specificToolsText = analysis.detectedTools.length > 0
    ? ` (включая конкретные инструменты: ${analysis.detectedTools.join(", ")})`
    : ""

  return `${detectedText}${specificToolsText}. Отправлено ${stats.selectedCount} из ${stats.totalTools} инструментов (${stats.reductionPercentage}% экономии). Активные категории: ${categoryNames}.`
}

// Экспорт для использования в React компоненте
export {
  TOOL_CATEGORIES as toolCategories,
  DEFAULT_TOOL_SELECTION_CONFIG as defaultConfig
}


