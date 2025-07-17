"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  X,
  User,
  Loader2,
  Code,
  RotateCcw,
  ChevronDown,
  Pause,
  HistoryIcon,
  Check,
  AlertTriangle,
  Undo2,
  Search,
  Zap,
  Brain,
  Settings,
  Sparkles,
  Activity,
  BookOpen,
  PenTool,
  Command,
  Calendar,
  Book,
  Users,
  Filter,
  Sliders,
  Target,
  BarChart3,
  Navigation,
  Cog,
  CheckCircle,
  Circle,
  Info,
  Lightbulb,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import TextareaAutosize from 'react-textarea-autosize'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

// Импорт логики выбора инструментов
interface Tool {
  name: string
  description: string
  parameters: any
  apiMethod?: "GET" | "POST" | "PUT" | "DELETE"
  apiEndpoint?: string
}

interface ToolCategory {
  id: string
  name: string
  description: string
  icon: string
  keywords: string[]
  priority: number
  tools: string[]
}

interface ToolSelectionConfig {
  maxToolsPerRequest: number
  alwaysIncludeCategories: string[]
  contextualSelection: boolean
  userPreferences?: {
    preferredCategories: string[]
    excludedCategories: string[]
  }
}

// Определение категорий инструментов
const TOOL_CATEGORIES: ToolCategory[] = [
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
      "профиль", "аккаунт", "регистрация", "авторизация"
    ],
    priority: 2,
    tools: [
      "getAllUsers",
      "getUserById", 
      "createUser",
      "updateUser",
      "deleteUser",
      "getUserReservations"
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
      "доступность", "экземпляры", "копии"
    ],
    priority: 2,
    tools: [
      "getAllBooks",
      "getBookById",
      "createBook", 
      "updateBook",
      "deleteBook",
      "getBestAvailableBookInstance",
      "getAllBookInstances",
      "getBookInstanceById",
      "createBookInstance",
      "updateBookInstance", 
      "deleteBookInstance"
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
      "просрочка", "штраф", "история выдач", "активные брони"
    ],
    priority: 1,
    tools: [
      "getAllReservations",
      "getReservationById",
      "createReservation",
      "updateReservation", 
      "deleteReservation"
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
      "группа", "статус пользователя", "уровень доступа"
    ],
    priority: 3,
    tools: [
      "getAllRoles",
      "getRoleById", 
      "assignRoleToUser"
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
      "тренды", "динамика", "сводка", "сводный отчет"
    ],
    priority: 4,
    tools: [
      "generateReportWithCharts"
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
      "агент", "ассистент", "система", "сброс", "перезапуск"
    ],
    priority: 1,
    tools: [
      "stopAgent",
      "cancelCurrentAction"
    ]
  }
]

const DEFAULT_TOOL_SELECTION_CONFIG: ToolSelectionConfig = {
  maxToolsPerRequest: 15,
  alwaysIncludeCategories: ["system"],
  contextualSelection: true,
  userPreferences: {
    preferredCategories: [],
    excludedCategories: []
  }
}

// Функции анализа и выбора инструментов
function analyzeUserQuery(query: string): {
  detectedCategories: string[]
  confidence: Record<string, number>
  suggestedCategories: string[]
} {
  const normalizedQuery = query.toLowerCase().trim()
  const confidence: Record<string, number> = {}
  const detectedCategories: string[] = []
  
  TOOL_CATEGORIES.forEach(category => {
    let score = 0
    let matchCount = 0
    
    category.keywords.forEach(keyword => {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        const weight = keyword.split(' ').length
        score += weight
        matchCount++
      }
    })
    
    if (matchCount > 0) {
      confidence[category.id] = Math.min(score / category.keywords.length, 1.0)
      
      if (confidence[category.id] > 0.1) {
        detectedCategories.push(category.id)
      }
    }
  })
  
  detectedCategories.sort((a, b) => (confidence[b] || 0) - (confidence[a] || 0))
  
  const suggestedCategories = getSuggestedCategories(detectedCategories, normalizedQuery)
  
  return {
    detectedCategories,
    confidence,
    suggestedCategories
  }
}

function getSuggestedCategories(detectedCategories: string[], query: string): string[] {
  const suggestions: string[] = []
  
  if (detectedCategories.includes("reservations")) {
    if (!detectedCategories.includes("users")) suggestions.push("users")
    if (!detectedCategories.includes("books")) suggestions.push("books")
  }
  
  if (detectedCategories.includes("users") && 
      (query.includes("роль") || query.includes("права") || query.includes("администратор"))) {
    if (!detectedCategories.includes("roles")) suggestions.push("roles")
  }
  
  const questionWords = ["сколько", "какой", "какая", "какие", "где", "когда", "статистика"]
  if (questionWords.some(word => query.includes(word)) && 
      !detectedCategories.includes("reports")) {
    suggestions.push("reports")
  }
  
  return suggestions
}

function filterToolsByCategories(
  allTools: Tool[],
  selectedCategories: string[],
  config: ToolSelectionConfig = DEFAULT_TOOL_SELECTION_CONFIG
): Tool[] {
  const categoriesToInclude = new Set([
    ...selectedCategories,
    ...config.alwaysIncludeCategories
  ])
  
  if (config.userPreferences?.excludedCategories) {
    config.userPreferences.excludedCategories.forEach(cat => 
      categoriesToInclude.delete(cat)
    )
  }
  
  const toolNamesToInclude = new Set<string>()
  
  TOOL_CATEGORIES.forEach(category => {
    if (categoriesToInclude.has(category.id)) {
      category.tools.forEach(toolName => toolNamesToInclude.add(toolName))
    }
  })
  
  const filteredTools = allTools.filter(tool => 
    toolNamesToInclude.has(tool.name)
  )
  
  if (filteredTools.length > config.maxToolsPerRequest) {
    const priorityMap = new Map<string, number>()
    TOOL_CATEGORIES.forEach(cat => {
      cat.tools.forEach(toolName => {
        if (!priorityMap.has(toolName) || priorityMap.get(toolName)! > cat.priority) {
          priorityMap.set(toolName, cat.priority)
        }
      })
    })
    
    return filteredTools
      .sort((a, b) => (priorityMap.get(a.name) || 999) - (priorityMap.get(b.name) || 999))
      .slice(0, config.maxToolsPerRequest)
  }
  
  return filteredTools
}

function selectToolsForQuery(
  query: string,
  allTools: Tool[],
  config: ToolSelectionConfig = DEFAULT_TOOL_SELECTION_CONFIG
): {
  selectedTools: Tool[]
  analysis: ReturnType<typeof analyzeUserQuery>
  usedCategories: string[]
} {
  const analysis = analyzeUserQuery(query)
  
  let categoriesToUse = [...analysis.detectedCategories]
  
  if (categoriesToUse.length === 0) {
    categoriesToUse = ["users", "books", "reservations"]
  }
  
  analysis.suggestedCategories.forEach(cat => {
    if (!categoriesToUse.includes(cat)) {
      categoriesToUse.push(cat)
    }
  })
  
  if (config.userPreferences?.preferredCategories) {
    config.userPreferences.preferredCategories.forEach(cat => {
      if (!categoriesToUse.includes(cat)) {
        categoriesToUse.push(cat)
      }
    })
  }
  
  const selectedTools = filterToolsByCategories(allTools, categoriesToUse, config)
  
  return {
    selectedTools,
    analysis,
    usedCategories: categoriesToUse
  }
}

function getToolUsageStats(selectedTools: Tool[], allTools: Tool[]): {
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

function createSelectionSummary(
  analysis: ReturnType<typeof analyzeUserQuery>,
  usedCategories: string[],
  stats: ReturnType<typeof getToolUsageStats>
): string {
  const categoryNames = usedCategories
    .map(id => TOOL_CATEGORIES.find(cat => cat.id === id)?.name)
    .filter(Boolean)
    .join(", ")
  
  const detectedText = analysis.detectedCategories.length > 0
    ? `Обнаружены: ${analysis.detectedCategories.map(id => 
        TOOL_CATEGORIES.find(cat => cat.id === id)?.name
      ).join(", ")}`
    : "Базовый набор"
  
  return `${detectedText}. ${stats.selectedCount}/${stats.totalTools} инструментов (-${stats.reductionPercentage}%). Категории: ${categoryNames}.`
}

// Остальные интерфейсы и типы
interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  apiCall?: {
    method: string
    endpoint: string
    params?: any
    message?: string
  }
}

type OpenRouterHistoryMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "function"; name: string; content: string }

const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

// Компонент диалога выбора инструментов
const ToolSelectionDialog: React.FC<{
  isOpen: boolean
  onClose: () => void
  allTools: Tool[]
  mode: 'auto' | 'manual'
  setMode: (mode: 'auto' | 'manual') => void
  manualCategories: string[]
  setManualCategories: (categories: string[]) => void
  lastQueryAnalysis: ReturnType<typeof analyzeUserQuery>
}> = ({ 
  isOpen, 
  onClose, 
  allTools, 
  mode, 
  setMode, 
  manualCategories, 
  setManualCategories, 
  lastQueryAnalysis 
}) => {
  const toggleCategory = (categoryId: string) => {
    setManualCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const stats = getToolUsageStats(
    filterToolsByCategories(allTools, manualCategories),
    allTools
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Filter className="w-6 h-6 text-blue-500" />
            Настройка инструментов ИИ-ассистента
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Режим выбора */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Режим выбора инструментов
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className={`cursor-pointer transition-all ${mode === 'auto' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setMode('auto')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${mode === 'auto' ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} />
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Автоматический
                      </h4>
                      <p className="text-sm text-gray-600">ИИ анализирует запрос и выбирает нужные инструменты</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`cursor-pointer transition-all ${mode === 'manual' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setMode('manual')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${mode === 'manual' ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} />
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Sliders className="w-4 h-4" />
                        Ручной
                      </h4>
                      <p className="text-sm text-gray-600">Вы выбираете категории инструментов вручную</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Анализ последнего запроса */}
          {mode === 'auto' && lastQueryAnalysis.detectedCategories.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Анализ текущего запроса
              </h4>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {lastQueryAnalysis.detectedCategories.map(catId => {
                    const category = TOOL_CATEGORIES.find(c => c.id === catId)
                    const confidence = Math.round((lastQueryAnalysis.confidence[catId] || 0) * 100)
                    return (
                      <Badge key={catId} variant="secondary" className="bg-blue-100 text-blue-800">
                        {category?.icon} {category?.name} ({confidence}%)
                      </Badge>
                    )
                  })}
                </div>
                {lastQueryAnalysis.suggestedCategories.length > 0 && (
                  <div>
                    <span className="text-sm text-blue-700">Предлагаемые: </span>
                    {lastQueryAnalysis.suggestedCategories.map(catId => {
                      const category = TOOL_CATEGORIES.find(c => c.id === catId)
                      return (
                        <Badge key={catId} variant="outline" className="ml-1 border-blue-300 text-blue-700">
                          {category?.icon} {category?.name}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ручной выбор категорий */}
          {mode === 'manual' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Выберите категории инструментов
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {TOOL_CATEGORIES.map(category => {
                  const isSelected = manualCategories.includes(category.id)
                  const toolCount = category.tools.length
                  
                  return (
                    <Card 
                      key={category.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium flex items-center gap-2">
                              <span className="text-lg">{category.icon}</span>
                              {category.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                            <Badge variant="outline" className="text-xs">
                              {toolCount} инструментов
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Статистика выбора */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Статистика выбора
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Выбрано инструментов:</span>
                    <div className="font-semibold text-lg">{stats.selectedCount}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Всего доступно:</span>
                    <div className="font-semibold text-lg">{stats.totalTools}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Экономия контекста:</span>
                    <div className="font-semibold text-lg text-green-600">{stats.reductionPercentage}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <div className="flex gap-2">
              {mode === 'manual' && (
                <Button 
                  variant="outline" 
                  onClick={() => setManualCategories(TOOL_CATEGORIES.map(c => c.id))}
                >
                  Выбрать все
                </Button>
              )}
              <Button onClick={onClose}>
                Применить настройки
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Остальные компоненты (ToolCallDisplay, UndoManager, CommandButton) остаются без изменений
// ... (код этих компонентов)

// Основной компонент с интегрированной логикой выбора инструментов
export default function EnhancedAIAssistantChat() {
  // Существующие состояния
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const conversationIdRef = useRef<string>(generateUniqueId())
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [aiMode, setAiMode] = useState<"question" | "action">("action")
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessagesLength = useRef(messages.length)
  const [streamedResponse, setStreamedResponse] = useState("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const router = useRouter()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([])
  const snapshotRef = useRef<Message[]>([])
  const [lastOperation, setLastOperation] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connected")
  const [showQuickCommands, setShowQuickCommands] = useState(false)
  const [activeCommandCategory, setActiveCommandCategory] = useState<string | null>(null)
  const [historyFilter, setHistoryFilter] = useState<"all" | "changes" | "reads">("all")

  // Новые состояния для управления инструментами
  const [allTools, setAllTools] = useState<Tool[]>([])
  const [toolSelectionMode, setToolSelectionMode] = useState<'auto' | 'manual'>('auto')
  const [manualSelectedCategories, setManualSelectedCategories] = useState<string[]>(['users', 'books', 'reservations'])
  const [isToolSelectionOpen, setIsToolSelectionOpen] = useState(false)
  const [toolSelectionSummary, setToolSelectionSummary] = useState<string | null>(null)
  const [lastQueryAnalysis, setLastQueryAnalysis] = useState<ReturnType<typeof analyzeUserQuery>>({
    detectedCategories: [],
    confidence: {},
    suggestedCategories: []
  })

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  // Обновленная загрузка инструментов
  useEffect(() => {
    const loadTools = async () => {
      try {
        setStatusMessage("🔄 Инициализация AI системы...")
        setConnectionStatus("connecting")

        const response = await fetch("/wiseOwl.json")
        if (response.ok) {
          const data = await response.json()
          const enhancedTools = data.map((tool: any) => {
            const match = tool.description.match(/Использует API эндпоинт (GET|POST|PUT|DELETE) (\S+)/)
            if (match) {
              return { ...tool, apiMethod: match[1], apiEndpoint: match[2] }
            }
            return tool
          })

          setAllTools(enhancedTools)
          setConnectionStatus("connected")

          if (enhancedTools.length === 0) {
            setStatusMessage("❌ Ошибка: Не удалось загрузить инструменты")
            setConnectionStatus("disconnected")
          } else {
            setStatusMessage(null)
          }
        } else {
          setStatusMessage(`❌ Ошибка загрузки: ${response.status}`)
          setConnectionStatus("disconnected")
        }
      } catch (error) {
        setStatusMessage("❌ Не удалось подключиться к AI системе")
        setConnectionStatus("disconnected")
      }
    }

    if (isOpen && allTools.length === 0) {
      loadTools()
    }
  }, [isOpen, allTools.length])

  // Обновленная функция runConversation с логикой выбора инструментов
  const runConversation = async (conversationHistory: Message[], onStreamChunk?: (chunk: string) => void) => {
    const isStreaming = selectedModel === "gemini-2.0-flash-streaming"
    const modelForApi = selectedModel === "gemini-2.0-flash-streaming" ? "gemini-2.0-flash" : selectedModel
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelForApi}:generateContent?key=${GEMINI_API_KEY}`

    // Выбор инструментов на основе режима
    let availableTools: Tool[]
    let selectionSummary: string

    if (toolSelectionMode === 'auto') {
      const { selectedTools: autoSelectedTools, analysis, usedCategories } = selectToolsForQuery(
        inputValue, 
        allTools, 
        DEFAULT_TOOL_SELECTION_CONFIG
      )
      availableTools = autoSelectedTools
      const stats = getToolUsageStats(availableTools, allTools)
      selectionSummary = createSelectionSummary(analysis, usedCategories, stats)
      setLastQueryAnalysis(analysis)
    } else {
      availableTools = filterToolsByCategories(allTools, manualSelectedCategories, DEFAULT_TOOL_SELECTION_CONFIG)
      const stats = getToolUsageStats(availableTools, allTools)
      const categoryNames = manualSelectedCategories
        .map(id => TOOL_CATEGORIES.find(cat => cat.id === id)?.name)
        .filter(Boolean)
        .join(", ")
      selectionSummary = `Ручной выбор. ${stats.selectedCount}/${stats.totalTools} инструментов (-${stats.reductionPercentage}%). Категории: ${categoryNames}.`
    }

    // Фильтрация по режиму AI (вопрос/действие)
    if (aiMode === "question") {
      availableTools = availableTools.filter((tool) => tool.apiMethod === "GET" || !tool.apiMethod)
    }

    setToolSelectionSummary(selectionSummary)

    const toolDeclarations = availableTools.map(({ apiMethod, apiEndpoint, ...rest }) => rest)
    const currentHistory = buildGeminiHistory(conversationHistory)
    let maxIterations = 10
    let lastToolCalledInLoop: string | null = null
    const lastUserMessage = conversationHistory.filter((m) => m.role === "user").pop()?.content || ""

    // Остальная логика runConversation остается без изменений
    // ... (весь остальной код функции)
  }

  // Остальные функции остаются без изменений
  // ... (все остальные функции)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Кнопка открытия чата */}
      {!isOpen && (
        <div className="relative">
          <Button
            onClick={handleToggleChat}
            className="rounded-full w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 shadow-2xl border-0 transition-all duration-300 hover:scale-110 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
              <img
                src="/images/owl-svgrepo-com.svg"
                className="w-8 h-8"
                alt="AI Assistant"
              />
            </div>
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
          </Button>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white shadow-sm">
            <div className="w-full h-full rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>
      )}

      {/* Окно чата */}
      {isOpen && (
        <div
          className={`transform transition-all duration-500 ease-out ${
            isAnimating ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
          }`}
        >
          <Card className="w-[520px] h-[650px] shadow-2xl bg-white/95 backdrop-blur-xl border-0 overflow-hidden">
            {/* Заголовок */}
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src="/images/owl-svgrepo-com.svg" alt="Мудрая Сова" className="w-6 h-6" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 border border-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-800 text-xl font-bold">Мудрая Сова</CardTitle>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Селектор модели */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-white/50">
                        <Brain className="w-5 h-5 mr-1" />
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuRadioGroup value={selectedModel} onValueChange={setSelectedModel}>
                        <DropdownMenuRadioItem value="gemini-2.0-flash-streaming" className="flex items-center gap-3 p-3">
                          <span className="text-lg">⚡</span>
                          <span className="text-base">2.0 Flash Streaming</span>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="gemini-2.5-flash" className="flex items-center gap-3 p-3">
                          <span className="text-lg">🧠</span>
                          <span className="text-base">2.5 Flash Standard</span>
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Кнопки действий */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsToolSelectionOpen(true)}
                      className="text-gray-500 hover:text-gray-700 hover:bg-white/50"
                      title="Настройка инструментов"
                    >
                      <Filter className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsHistoryOpen(true)}
                      className="text-gray-500 hover:text-gray-700 hover:bg-white/50"
                      title="История"
                    >
                      <HistoryIcon className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetChat}
                      className="text-gray-500 hover:text-gray-700 hover:bg-white/50"
                      title="Сбросить чат"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleChat}
                      className="text-gray-500 hover:text-gray-700 hover:bg-white/50"
                      title="Закрыть"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex flex-col h-[570px]">
              {/* Область сообщений */}
              <ScrollArea className="flex-1 p-4">
                {/* Приветственное сообщение */}
                {messages.length === 0 && !statusMessage && (
                  <div className="text-center mt-12 animate-fade-in">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
                        <img src="/images/owl-svgrepo-com.svg" alt="Мудрая Сова" className="w-12 h-12" />
                      </div>
                      <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Привет! Я Мудрая Сова 🦉</h3>
                    <p className="text-gray-600 mb-6 text-base">Ваш персональный AI-ассистент с оптимизированным выбором инструментов</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-sm p-2">
                        📚 Управление книгами
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-sm p-2">
                        👤 Работа с пользователями
                      </Badge>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-sm p-2">
                        📅 Резервирования
                      </Badge>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-sm p-2">
                        🎯 Умный выбор инструментов
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Сообщения об ошибках */}
                {statusMessage && (
                  <div className="text-center mt-12">
                    <div className="inline-flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100">
                      <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                      <span className="text-blue-700 font-medium text-base">{statusMessage}</span>
                    </div>
                  </div>
                )}

                {/* Сообщения */}
                {messages.map((message) => {
                  // Отображение вызовов инструментов
                  if (message.apiCall && message.role === "assistant") {
                    return (
                      <div key={message.id} className="mb-6 flex justify-start w-full">
                        {/* ToolCallDisplay компонент */}
                      </div>
                    )
                  }

                  return (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                          message.role === "user"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                            : "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {message.role === "user" ? (
                            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                              <img src="/images/owl-svgrepo-com.svg" alt="AI" className="w-3 h-3" />
                            </div>
                          )}
                          <span className="text-sm opacity-70 font-medium">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</div>
                      </div>
                    </div>
                  )
                })}

                {/* Индикатор загрузки */}
                {isLoading && !messages.some((m) => m.apiCall) && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-base text-gray-600 font-medium">Думаю...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Область ввода */}
              <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white/50">
                {/* Сводка по выбору инструментов */}
                {toolSelectionSummary && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Info className="w-4 h-4" />
                      <span className="font-medium">Выбор инструментов:</span>
                      <span>{toolSelectionSummary}</span>
                    </div>
                  </div>
                )}

                {/* Кнопки режимов */}
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiMode(aiMode === "action" ? "question" : "action")}
                    className={`h-9 px-4 text-sm transition-all duration-200 rounded-md ${
                      aiMode === "action"
                        ? "bg-violet-100 text-violet-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Действие
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickCommands(!showQuickCommands)}
                    className={`h-9 px-4 text-sm transition-all duration-200 rounded-md ${
                      showQuickCommands
                        ? "bg-violet-100 text-violet-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                    title="Быстрые команды"
                  >
                    <Command className="w-4 h-4 mr-2" />
                    Команды
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsToolSelectionOpen(true)}
                    className={`h-9 px-4 text-sm transition-all duration-200 rounded-md ${
                      toolSelectionMode === 'manual'
                        ? "bg-orange-100 text-orange-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                    title="Настройка инструментов"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {toolSelectionMode === 'auto' ? 'Авто' : 'Ручной'}
                  </Button>
                </div>

                {/* Поле ввода */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <TextareaAutosize
                      id="ai-chat-textarea"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value)
                        // Обновляем анализ запроса в реальном времени
                        if (toolSelectionMode === 'auto' && e.target.value.trim()) {
                          setLastQueryAnalysis(analyzeUserQuery(e.target.value))
                        }
                      }}
                      onKeyDown={handleKeyPress}
                      minRows={2}
                      maxRows={8}
                      placeholder={statusMessage || "Напишите ваш вопрос или запрос..."}
                      disabled={isLoading || allTools.length === 0}
                      className="pr-12 py-3 rounded-xl border-gray-200 focus:border-blue-300 focus:ring-blue-200 bg-white/80 backdrop-blur-sm text-base w-full resize-none transition-all"
                    />
                    {inputValue && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInputValue("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={isLoading ? stopCurrentAgent : handleSendMessage}
                    disabled={!isLoading && (!inputValue.trim() || allTools.length === 0)}
                    className={`px-4 py-3 rounded-xl transition-all duration-200 ${
                      isLoading
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl hover:scale-105"
                    }`}
                  >
                    {isLoading ? <Pause className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>

                {/* Статус бар */}
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>Режим: {aiMode === "action" ? "⚡ Действие" : "🔍 Вопрос"}</span>
                    <span>•</span>
                    <span>Инструменты: {toolSelectionMode === 'auto' ? '🎯 Авто' : '✋ Ручной'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        connectionStatus === "connected"
                          ? "bg-green-400"
                          : connectionStatus === "connecting"
                            ? "bg-yellow-400"
                            : "bg-red-400"
                      }`}
                    />
                    <span>{allTools.length} доступно</span>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Диалог выбора инструментов */}
            <ToolSelectionDialog
              isOpen={isToolSelectionOpen}
              onClose={() => setIsToolSelectionOpen(false)}
              allTools={allTools}
              mode={toolSelectionMode}
              setMode={setToolSelectionMode}
              manualCategories={manualSelectedCategories}
              setManualCategories={setManualSelectedCategories}
              lastQueryAnalysis={lastQueryAnalysis}
            />

            {/* Остальные диалоги (история и т.д.) остаются без изменений */}
            {/* ... */}
          </Card>
        </div>
      )}
    </div>
  )
}

