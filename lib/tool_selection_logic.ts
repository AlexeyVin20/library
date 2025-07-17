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
      "с книгами", "с просрочками", "активные резервирования", "просроченные"
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
      "getUsersWithFines"
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
      "избранное", "рекомендации", "популярные", "статистика"
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
      "bulkUpdateBookInstanceStatuses"
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
      "даты", "период", "массовое обновление", "просроченные"
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
      "getOverdueReservations"
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
      "пользователи", "книги", "резервирования", "период", "группировка"
    ],
    priority: 4,
    tools: [
      "getUserStatistics",
      "getReservationStatistics", 
      "getBookStatistics",
      "getTopPopularBooks"
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
  maxToolsPerRequest: 25, // Максимум инструментов в одном запросе (увеличено с 15)
  alwaysIncludeCategories: ["system"], // Всегда включать системные инструменты
  contextualSelection: true, // Включить контекстуальный выбор
  userPreferences: {
    preferredCategories: [],
    excludedCategories: []
  }
}

// Анализ запроса пользователя для определения релевантных категорий
export function analyzeUserQuery(query: string): {
  detectedCategories: string[]
  confidence: Record<string, number>
  suggestedCategories: string[]
} {
  const normalizedQuery = query.toLowerCase().trim()
  const confidence: Record<string, number> = {}
  const detectedCategories: string[] = []

  // ОТЛАДКА: Добавляем логирование
  console.log('🔍 ОТЛАДКА analyzeUserQuery:')
  console.log('📝 Нормализованный запрос:', normalizedQuery)

  // Анализируем каждую категорию
  TOOL_CATEGORIES.forEach(category => {
    let score = 0
    let matchCount = 0
    const matchedKeywords: string[] = []

    // Проверяем совпадения с ключевыми словами
    category.keywords.forEach(keyword => {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        // Более длинные фразы получают больший вес
        const weight = keyword.split(' ').length
        score += weight
        matchCount++
        matchedKeywords.push(keyword)
      }
    })

    // Нормализуем счет
    if (matchCount > 0) {
      confidence[category.id] = Math.min(score / category.keywords.length, 1.0)

      // Добавляем в обнаруженные, если уверенность выше порога
      if (confidence[category.id] > 0.05) {
        detectedCategories.push(category.id)
      }
      
      console.log(`📂 Категория "${category.name}" (${category.id}):`)
      console.log(`   - Совпадения: ${matchCount}/${category.keywords.length}`)
      console.log(`   - Счет: ${score}`)
      console.log(`   - Уверенность: ${confidence[category.id].toFixed(3)}`)
      console.log(`   - Найденные ключевые слова:`, matchedKeywords)
      console.log(`   - Добавлена в обнаруженные: ${confidence[category.id] > 0.1}`)
    }
  })

  // Сортируем по уверенности
  detectedCategories.sort((a, b) => (confidence[b] || 0) - (confidence[a] || 0))

  // Предлагаем дополнительные категории на основе контекста
  const suggestedCategories = getSuggestedCategories(detectedCategories, normalizedQuery)
  
  console.log('📊 РЕЗУЛЬТАТ АНАЛИЗА:')
  console.log('📂 Обнаруженные категории:', detectedCategories)
  console.log('📈 Уверенность по категориям:', confidence)
  console.log('💡 Предлагаемые категории:', suggestedCategories)

  return {
    detectedCategories,
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
  const questionWords = ["сколько", "какой", "какая", "какие", "где", "когда", "статистика"]
  if (questionWords.some(word => query.includes(word)) &&
      !detectedCategories.includes("reports")) {
    suggestions.push("reports")
  }

  // ДОПОЛНИТЕЛЬНАЯ ЛОГИКА: Если запрос содержит слова, связанные с книгами, но категория books не обнаружена
  const bookRelatedWords = ["книга", "книги", "литература", "издание", "автор", "название", "жанр", "ISBN", "издательство", "каталог", "библиотека"]
  if (bookRelatedWords.some(word => query.includes(word)) && !detectedCategories.includes("books")) {
    suggestions.push("books")
  }

  // ДОПОЛНИТЕЛЬНАЯ ЛОГИКА: Если запрос содержит слова, связанные с пользователями, но категория users не обнаружена
  const userRelatedWords = ["пользователь", "юзер", "клиент", "читатель", "студент", "человек", "люди", "имя", "email", "телефон"]
  if (userRelatedWords.some(word => query.includes(word)) && !detectedCategories.includes("users")) {
    suggestions.push("users")
  }

  // ДОПОЛНИТЕЛЬНАЯ ЛОГИКА: Если запрос содержит слова, связанные с резервированиями, но категория reservations не обнаружена
  const reservationRelatedWords = ["резерв", "бронь", "бронирование", "резервирование", "заказ", "запрос", "выдать", "вернуть", "взять"]
  if (reservationRelatedWords.some(word => query.includes(word)) && !detectedCategories.includes("reservations")) {
    suggestions.push("reservations")
  }

  console.log('💡 ПРЕДЛАГАЕМЫЕ КАТЕГОРИИ:')
  console.log('📝 Запрос:', query)
  console.log('📂 Обнаруженные категории:', detectedCategories)
  console.log('💡 Предложения:', suggestions)

  return suggestions
}

// Фильтрация инструментов на основе выбранных категорий
export function filterToolsByCategories(
  allTools: Tool[],
  selectedCategories: string[],
  config: ToolSelectionConfig = DEFAULT_TOOL_SELECTION_CONFIG
): Tool[] {
  // ОТЛАДКА: Добавляем логирование
  console.log('🔍 ОТЛАДКА filterToolsByCategories:')
  console.log('📚 Всего инструментов:', allTools.length)
  console.log('📂 Выбранные категории:', selectedCategories)
  
  // Всегда включаем обязательные категории
  const categoriesToInclude = new Set([
    ...selectedCategories,
    ...config.alwaysIncludeCategories
  ])
  
  console.log('📂 Категории для включения:', Array.from(categoriesToInclude))

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
      console.log(`📂 Категория "${category.name}" (${category.id}):`, category.tools.length, 'инструментов')
      category.tools.forEach(toolName => toolNamesToInclude.add(toolName))
    }
  })
  
  console.log('📋 Имена инструментов для включения:', Array.from(toolNamesToInclude))

  // Фильтруем инструменты
  const filteredTools = allTools.filter(tool =>
    toolNamesToInclude.has(tool.name)
  )
  
  console.log('✅ Отфильтровано инструментов:', filteredTools.length)
  console.log('📋 Имена отфильтрованных инструментов:', filteredTools.map(t => t.name))
  
  // Проверяем инструменты для книг
  const bookTools = filteredTools.filter(t => 
    t.name.includes('Book') || 
    t.name.includes('book') ||
    t.name === 'getAllBooks' ||
    t.name === 'searchBooks' ||
    t.name === 'createBook' ||
    t.name === 'updateBook' ||
    t.name === 'deleteBook'
  )
  console.log('📚 Инструменты для книг в отфильтрованных:', bookTools.map(t => t.name))

  // Ограничиваем количество инструментов
  if (filteredTools.length > config.maxToolsPerRequest) {
    // Сортируем по приоритету категорий
    const priorityMap = new Map<string, number>()
    TOOL_CATEGORIES.forEach(cat => {
      cat.tools.forEach(toolName => {
        if (!priorityMap.has(toolName) || priorityMap.get(toolName)! > cat.priority) {
          priorityMap.set(toolName, cat.priority)
        }
      })
    })

    const limitedTools = filteredTools
      .sort((a, b) => (priorityMap.get(a.name) || 999) - (priorityMap.get(b.name) || 999))
      .slice(0, config.maxToolsPerRequest)
      
    console.log('📏 Ограничено до', config.maxToolsPerRequest, 'инструментов')
    console.log('📋 Имена ограниченных инструментов:', limitedTools.map(t => t.name))
    
    // Проверяем инструменты для книг после ограничения
    const limitedBookTools = limitedTools.filter(t => 
      t.name.includes('Book') || 
      t.name.includes('book') ||
      t.name === 'getAllBooks' ||
      t.name === 'searchBooks' ||
      t.name === 'createBook' ||
      t.name === 'updateBook' ||
      t.name === 'deleteBook'
    )
    console.log('📚 Инструменты для книг после ограничения:', limitedBookTools.map(t => t.name))
    
    return limitedTools
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
  console.log('🔍 ОТЛАДКА selectToolsForQuery:')
  console.log('📝 Запрос:', query)
  console.log('📚 Всего инструментов:', allTools.length)
  
  const analysis = analyzeUserQuery(query)

  // Определяем категории для включения
  let categoriesToUse = [...analysis.detectedCategories]
  console.log('📂 Изначальные категории:', categoriesToUse)

  // Если ничего не обнаружено, используем базовый набор
  if (categoriesToUse.length === 0) {
    categoriesToUse = ["users", "books", "reservations"] // Базовые категории
    console.log('📂 Используем базовый набор:', categoriesToUse)
  }

  // Добавляем предлагаемые категории с высокой уверенностью
  analysis.suggestedCategories.forEach(cat => {
    if (!categoriesToUse.includes(cat)) {
      categoriesToUse.push(cat)
      console.log('💡 Добавлена предлагаемая категория:', cat)
    }
  })

  // Применяем пользовательские предпочтения
  if (config.userPreferences?.preferredCategories) {
    config.userPreferences.preferredCategories.forEach(cat => {
      if (!categoriesToUse.includes(cat)) {
        categoriesToUse.push(cat)
        console.log('⭐ Добавлена предпочтительная категория:', cat)
      }
    })
  }

  console.log('📂 Финальные категории для использования:', categoriesToUse)

  const selectedTools = filterToolsByCategories(allTools, categoriesToUse, config)
  
  console.log('✅ РЕЗУЛЬТАТ selectToolsForQuery:')
  console.log('📚 Выбрано инструментов:', selectedTools.length)
  console.log('📋 Имена выбранных инструментов:', selectedTools.map(t => t.name))
  console.log('📂 Используемые категории:', categoriesToUse)

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
    reductionPercentage: Math.round((1 - selectedTools.length / allTools.length) * 100),
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

  return `${detectedText}. Отправлено ${stats.selectedCount} из ${stats.totalTools} инструментов (${stats.reductionPercentage}% экономии). Активные категории: ${categoryNames}.`
}

// Экспорт для использования в React компоненте
export {
  TOOL_CATEGORIES as toolCategories,
  DEFAULT_TOOL_SELECTION_CONFIG as defaultConfig
}

 