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
  Target,
  Sliders,
  Lightbulb,
  CheckCircle,
  BarChart3,
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
import {
  TOOL_CATEGORIES,
  DEFAULT_TOOL_SELECTION_CONFIG,
  analyzeUserQuery,
  filterToolsByCategories,
  selectToolsForQuery,
  getToolUsageStats,
  createSelectionSummary,
} from "@/lib/tool_selection_logic"

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

interface Tool {
  name: string
  description: string
  parameters: any
  apiMethod?: "GET" | "POST" | "PUT" | "DELETE"
  apiEndpoint?: string
}

type OpenRouterHistoryMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "function"; name: string; content: string }

const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

// Command button component
interface CommandButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function CommandButton({ icon, label, isActive, onClick }: CommandButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 hover:scale-105 ${
        isActive
          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 shadow-sm"
          : "bg-background border-border hover:border-violet-300 dark:hover:border-violet-700"
      }`}
    >
      <div className={`transition-colors ${
        isActive ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"
      }`}>
        {icon}
      </div>
      <span className={`text-xs font-medium transition-colors ${
        isActive ? "text-violet-700 dark:text-violet-300" : "text-foreground"
      }`}>
        {label}
      </span>
    </button>
  );
}

// Enhanced Tool Call Display with better animations
const ToolCallDisplay: React.FC<{
  apiCall: Message["apiCall"]
  isLoading: boolean
  onCancel: () => void
}> = ({ apiCall, isLoading, onCancel }) => {
  if (!apiCall) return null

  const [displayedToolName, setDisplayedToolName] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const { endpoint, params } = apiCall

  const getFriendlyToolName = (toolName: string): string => {
    const lower = toolName.toLowerCase()
    if (lower.includes("book")) {
      if (lower.includes("create") || lower.includes("add")) return "📚 Добавление книги"
      if (lower.includes("update")) return "📚 Обновление книги"
      if (lower.includes("delete")) return "📚 Удаление книги"
      if (lower.includes("search") || lower.includes("get")) return "📚 Поиск книг"
      return "📚 Работа с книгами"
    }
    if (lower.includes("reservation")) {
      if (lower.includes("create") || lower.includes("add")) return "📅 Создание брони"
      if (lower.includes("get") || lower.includes("view")) return "📅 Просмотр брони"
      return "📅 Работа с бронированиями"
    }
    if (lower.includes("user")) {
      if (lower.includes("create") || lower.includes("add")) return "👤 Добавление пользователя"
      if (lower.includes("update")) return "👤 Изменение пользователя"
      if (lower.includes("delete")) return "👤 Удаление пользователя"
      if (lower.includes("get")) return "👤 Поиск пользователей"
      return "👤 Работа с пользователями"
    }
    if (lower.includes("navigate")) return "🧭 Навигация"
    if (lower.includes("stopagent") || lower.includes("cancel")) return "⏹️ Остановка агента"
    if (lower.includes("generatereportwithcharts")) return "📊 Создание отчета с графиками"
    if (lower.includes("role")) {
      if (lower.includes("get")) return "👥 Просмотр ролей"
      if (lower.includes("assign")) return "👥 Назначение ролей"
      return "👥 Работа с ролями"
    }
    if (lower.includes("dialog")) return "🔍 Вспоминаю прошлые диалоги"

    const spacedName = toolName.replace(/([A-Z])/g, " $1").trim()
    return `⚡ ${spacedName.charAt(0).toUpperCase() + spacedName.slice(1)}`
  }

  const friendlyName = getFriendlyToolName(endpoint)

  useEffect(() => {
    setIsVisible(true)
    setDisplayedToolName("")
    if (friendlyName) {
      let i = 0
      const intervalId = setInterval(() => {
        if (i <= friendlyName.length) {
          setDisplayedToolName(friendlyName.substring(0, i))
          i += 1
        } else {
          clearInterval(intervalId)
        }
      }, 30)
      return () => clearInterval(intervalId)
    }
  }, [friendlyName])

  const isTyping = displayedToolName.length < (friendlyName?.length ?? 0)

  return (
    <div
      className={`transform transition-all duration-500 ease-out ${
        isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
      }`}
    >
      <div className="relative p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white rounded-xl shadow-2xl font-medium overflow-hidden group hover:shadow-3xl transition-all duration-300">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${20 + i * 30}%`,
                top: `${10 + i * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: "2s",
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
              <p className="text-lg text-white font-semibold min-h-[28px] flex items-center">
                {displayedToolName}
                {isTyping && <span className="ml-2 w-0.5 h-5 bg-white animate-pulse" />}
              </p>
            </div>
            {isLoading && (
              <button
                onClick={onCancel}
                className="bg-red-500/80 hover:bg-red-500 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110"
                title="Отменить действие"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Параметры инструмента */}
          {params && Object.keys(params).length > 0 && (
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-3 h-3 text-gray-300" />
                <span className="text-xs text-gray-300 font-medium">Параметры</span>
              </div>
              <pre className="text-gray-200 text-xs whitespace-pre-wrap break-all max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                {JSON.stringify(params, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Progress bar animation */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 animate-pulse"
            style={{ width: isLoading ? "100%" : "0%", transition: "width 2s ease-in-out" }}
          />
        </div>
      </div>
    </div>
  )
}

// Enhanced Undo Manager
const UndoManager: React.FC<{
  historyItem: any
  onUndoComplete: () => void
}> = ({ historyItem, onUndoComplete }) => {
  const [isUndoing, setIsUndoing] = useState(false)
  const [undoResult, setUndoResult] = useState<string | null>(null)

  const canUndo = () => {
    const { httpMethod, beforeState } = historyItem
    return (
      (httpMethod === "DELETE" && beforeState && beforeState !== "null") ||
      (httpMethod === "PUT" && beforeState && beforeState !== "null")
    )
  }

  const performUndo = async () => {
    if (!canUndo()) return
    setIsUndoing(true)
    setUndoResult(null)

    try {
      const { httpMethod, endpoint, beforeState } = historyItem
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      const token = localStorage.getItem("token")

      if (httpMethod === "DELETE") {
        const beforeData = JSON.parse(beforeState)
        if (endpoint.includes("/api/User")) {
          beforeData.Password = "DefaultPassword123!"
        }
        const baseEndpoint = endpoint.replace(/\/[^/]+$/, "")

        const response = await fetch(`${baseUrl}${baseEndpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(beforeData),
        })

        if (response.ok) {
          setUndoResult("✅ Объект успешно восстановлен")
        } else {
          const errorText = await response.text()
          setUndoResult(`❌ Ошибка восстановления: ${response.status} ${errorText}`)
        }
      } else if (httpMethod === "PUT") {
        const beforeData = JSON.parse(beforeState)
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(beforeData),
        })

        if (response.ok) {
          setUndoResult("✅ Изменения успешно отменены")
        } else {
          const errorText = await response.text()
          setUndoResult(`❌ Ошибка отмены: ${response.status} ${errorText}`)
        }
      }
      onUndoComplete()
    } catch (error) {
      setUndoResult(`❌ Критическая ошибка: ${(error as Error).message}`)
    } finally {
      setIsUndoing(false)
    }
  }

  if (!canUndo()) return null

  return (
    <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-700">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">
            {historyItem.httpMethod === "DELETE" ? "🔄 Можно восстановить" : "↩️ Можно откатить"}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={performUndo}
          disabled={isUndoing}
          className="text-orange-700 border-orange-300 hover:bg-orange-100 transition-all duration-200 hover:scale-105 bg-transparent"
        >
          {isUndoing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Undo2 className="w-3 h-3 mr-1" />}
          {historyItem.httpMethod === "DELETE" ? "Восстановить" : "Откатить"}
        </Button>
      </div>
      {undoResult && (
        <div className="mt-2 text-sm p-2 bg-white/50 rounded border-l-4 border-orange-400">{undoResult}</div>
      )}
    </div>
  )
}

export default function EnhancedAIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const conversationIdRef = useRef<string>(generateUniqueId())
  const [isLoading, setIsLoading] = useState(false)
  const [tools, setTools] = useState<Tool[]>([])
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
  // Добавляю состояние для фильтров истории
  const [historyFilter, setHistoryFilter] = useState<"all" | "changes" | "reads">("all")
  // --- ДОБАВЛЯЮ состояния для выбора инструментов ---
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
  // Добавляю состояния для slash-меню инструментов
  const [slashMenuVisible, setSlashMenuVisible] = useState(false)
  const [slashQuery, setSlashQuery] = useState("")
  // Добавляю состояние для автоматической генерации отчетов
  const [autoGenerateReports, setAutoGenerateReports] = useState(false)
  // Добавляю состояние для управления размером окна
  const [isExpanded, setIsExpanded] = useState(false)

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  // ---------- Функция для конвертации дат в UTC формат ----------
  const convertDatesToUtc = (obj: any): any => {
    if (obj === null || obj === undefined) return obj
    
    if (typeof obj === 'string') {
      // Проверяем, является ли строка датой
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      if (dateRegex.test(obj)) {
        return new Date(obj).toISOString()
      }
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(convertDatesToUtc)
    }
    
    if (typeof obj === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        // Обрабатываем специальные поля с датами
        if (typeof value === 'string' && (
          key.toLowerCase().includes('date') || 
          key.toLowerCase().includes('time') ||
          key.toLowerCase().includes('created') ||
          key.toLowerCase().includes('updated') ||
          key.toLowerCase().includes('expires') ||
          key.toLowerCase().includes('start') ||
          key.toLowerCase().includes('end')
        )) {
          try {
            const date = new Date(value)
            if (!isNaN(date.getTime())) {
              result[key] = date.toISOString()
              continue
            }
          } catch {}
        }
        result[key] = convertDatesToUtc(value)
      }
      return result
    }
    
    return obj
  }
  // ---------- Конец функции конвертации дат ----------

  // Новый массив быстрых команд с плейсхолдерами
  const quickCommands = {
    reservations: [
      "Покажи все бронирования за {период}",
      "Сколько активных бронирований у пользователя {имя}",
      "Покажи бронирования со статусом {статус}",
      "Построй график бронирований по дням"
    ],
    users: [
      "Покажи всех пользователей с ролью {роль}",
      "Сколько пользователей зарегистрировано за {период}",
      "Покажи пользователей с просроченными книгами",
      "Построй график активности пользователей"
    ],
    books: [
      "Покажи книги в жанре {жанр}",
      "Покажи топ-{N} популярных книг",
      "Покажи книги автора {автор}",
      "Построй график выдачи книг по жанрам"
    ]
  }

  // Enhanced opening animation
  const handleToggleChat = () => {
    if (!isOpen) {
      setIsAnimating(true)
      setIsOpen(true)
      setTimeout(() => setIsAnimating(false), 600)
    } else {
      setIsAnimating(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsAnimating(false)
      }, 300)
    }
  }

  // Load history when modal opens
  useEffect(() => {
    if (isHistoryOpen) {
      ;(async () => {
        try {
          setConnectionStatus("connecting")
          const url = `${baseUrl}/api/DialogHistory`
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })

          if (res.ok) {
            const data = await res.json()
            setHistoryData(data)
            setConnectionStatus("connected")
          } else {
            const errorText = await res.text()
            setHistoryData([{ error: `Ошибка загрузки: ${res.status}`, details: errorText }])
            setConnectionStatus("disconnected")
          }
        } catch (err) {
          setHistoryData([{ error: "Критическая ошибка сети", details: (err as Error).message }])
          setConnectionStatus("disconnected")
        }
      })()
    }
  }, [isHistoryOpen, baseUrl])

  const getActionDescription = (item: any) => {
    const { toolName, httpMethod, endpoint, parameters } = item

    if (httpMethod === "FRONT") {
      switch (toolName) {
        case "navigateToPage":
          try {
            const params = JSON.parse(parameters || "{}")
            return `🧭 Переход на страницу: ${params.path || "неизвестная"}`
          } catch {
            return "🧭 Навигация по страницам"
          }
        case "stopAgent":
          return "⏹️ Остановка работы ассистента"
        case "cancelCurrentAction":
          return "❌ Отмена текущего действия"
        default:
          return `⚡ Фронтовое действие: ${toolName}`
      }
    }

    const method = httpMethod.toUpperCase()
    const lowerToolName = toolName.toLowerCase()

    if (lowerToolName.includes("user")) {
      if (method === "POST") return "👤 Создание пользователя"
      if (method === "PUT") return "👤 Обновление пользователя"
      if (method === "DELETE") return "👤 Удаление пользователя"
      if (method === "GET") return "👤 Поиск пользователей"
    }

    if (lowerToolName.includes("book")) {
      if (method === "POST") return "📚 Добавление книги"
      if (method === "PUT") return "📚 Обновление книги"
      if (method === "DELETE") return "📚 Удаление книги"
      if (method === "GET") return "📚 Поиск книг"
    }

    if (lowerToolName.includes("reservation")) {
      if (method === "POST") return "📅 Создание бронирования"
      if (method === "PUT") return "📅 Обновление бронирования"
      if (method === "DELETE") return "📅 Отмена бронирования"
      if (method === "GET") return "📅 Просмотр бронирований"
    }

    switch (method) {
      case "POST":
        return `➕ Создание через ${endpoint}`
      case "PUT":
        return `✏️ Обновление через ${endpoint}`
      case "DELETE":
        return `🗑️ Удаление через ${endpoint}`
      case "GET":
        return `🔍 Запрос к ${endpoint}`
      default:
        return `${method} ${endpoint}`
    }
  }

  const getReadableParameters = (parameters: string) => {
    if (!parameters || parameters === "null") return null

    try {
      const params = JSON.parse(parameters)
      if (typeof params !== "object" || params === null) return parameters

      const filtered = Object.entries(params).reduce((acc, [key, value]) => {
        if (key.toLowerCase().includes("password")) {
          acc[key] = "***"
        } else {
          acc[key] = value
        }
        return acc
      }, {} as any)

      return filtered
    } catch {
      return parameters
    }
  }

  const logDialogHistory = async (
    toolName: string,
    httpMethod: string,
    endpoint: string,
    parameters: any,
    beforeState: any,
    afterState: any,
    message: string,
  ) => {
    try {
      if (!baseUrl) return

      const token = localStorage.getItem("token")
      const requestBody = {
        conversationId: conversationIdRef.current,
        toolName,
        httpMethod,
        endpoint,
        parameters: typeof parameters === "string" ? parameters : JSON.stringify(parameters ?? null),
        beforeState: typeof beforeState === "string" ? beforeState : JSON.stringify(beforeState ?? null),
        afterState: typeof afterState === "string" ? afterState : JSON.stringify(afterState ?? null),
        message: message,
      }

      const response = await fetch(`${baseUrl}/api/DialogHistory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[DialogHistory] Ошибка сервера:", response.status, errorText)
      }
    } catch (err) {
      console.error("[DialogHistory] Ошибка при отправке запроса:", err)
    }
  }

  // Load tools with enhanced status
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

          // ОТЛАДКА: Добавляем логирование загрузки инструментов
          console.log('🔍 ОТЛАДКА ЗАГРУЗКИ ИНСТРУМЕНТОВ:')
          console.log('📚 Всего загружено инструментов:', enhancedTools.length)
          
          // Проверяем инструменты для книг
          const bookTools = enhancedTools.filter(t => 
            t.name.includes('Book') || 
            t.name.includes('book') ||
            t.name === 'getAllBooks' ||
            t.name === 'searchBooks' ||
            t.name === 'createBook' ||
            t.name === 'updateBook' ||
            t.name === 'deleteBook'
          )
          console.log('📚 Инструменты для книг загружены:', bookTools.length)
          console.log('📋 Имена инструментов для книг:', bookTools.map(t => t.name))
          
          // Проверяем все инструменты по категориям
          const userTools = enhancedTools.filter(t => t.name.includes('User') || t.name.includes('user'))
          const reservationTools = enhancedTools.filter(t => t.name.includes('Reservation') || t.name.includes('reservation'))
          console.log('👤 Инструменты для пользователей:', userTools.length)
          console.log('📅 Инструменты для резервирований:', reservationTools.length)

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
        console.error('❌ Ошибка загрузки инструментов:', error)
      }
    }

    if (isOpen && allTools.length === 0) {
      loadTools()
    }
  }, [isOpen, allTools.length])

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom()
    }
    prevMessagesLength.current = messages.length
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const buildGeminiHistory = (history: Message[]) => {
    return history
      .filter((m) => !m.apiCall)
      .map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }))
  }

  const modelOptions = [
    { id: "gemini-2.0-flash-streaming", name: "2.0 Flash Streaming", icon: "⚡" },
    { id: "gemini-2.5-flash", name: "2.5 Flash Standard", icon: "🧠" },
  ]

  const executeApiCall = async (apiCall: { toolName: string; method: string; endpoint: string; params: any; message: string }) => {
    const { toolName, method, endpoint, params } = apiCall
    const url = new URL(endpoint, baseUrl)
    let beforeState: any = null
    const userMessage = apiCall.message || ""

    if (["PUT", "DELETE"].includes(method.toUpperCase())) {
      try {
        const beforeRes = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        if (beforeRes.ok) {
          const ct = beforeRes.headers.get("content-type")
          beforeState = ct?.includes("application/json") ? await beforeRes.json() : await beforeRes.text()
        }
      } catch (err) {
        console.warn("Не удалось получить beforeState", err)
      }
    }

    const requestOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }

    if (requestOptions.method === "GET" && params) {
      // Конвертируем даты в UTC формат для GET параметров
      const utcParams = convertDatesToUtc(params)
      Object.keys(utcParams).forEach((key) => url.searchParams.append(key, utcParams[key]))
    } else if (["POST", "PUT", "PATCH"].includes(requestOptions.method) && params) {
      // Конвертируем даты в UTC формат перед отправкой
      const utcParams = convertDatesToUtc(params)
      requestOptions.body = JSON.stringify(utcParams)
    }

    const response = await fetch(url.toString(), requestOptions)
    if (!response.ok) {
      const errorText = await response.text()
      // Не выбрасываем ошибку для инструментов навигации, так как они могут работать успешно даже при 400
      if (toolName === "navigateToPage") {
        console.warn(`Navigation completed with status ${response.status}`)
        return { success: true, message: "Навигация выполнена" }
      }
      throw new Error(`API call to ${endpoint} failed: ${response.status} ${errorText}`)
    }

    let afterState: any = null
    if (response.status !== 204) {
      const contentType = response.headers.get("content-type")
      afterState = contentType?.includes("application/json") ? await response.json() : await response.text()
    }

    const operationRecord = {
      toolName,
      httpMethod: requestOptions.method,
      endpoint,
      parameters: typeof params === "string" ? params : JSON.stringify(params ?? null),
      beforeState: typeof beforeState === "string" ? beforeState : JSON.stringify(beforeState ?? null),
      afterState: typeof afterState === "string" ? afterState : JSON.stringify(afterState ?? null),
      timestamp: new Date().toISOString(),
    }

    logDialogHistory(toolName, requestOptions.method, endpoint, convertDatesToUtc(params), beforeState, afterState, userMessage)

    if (["DELETE", "PUT"].includes(requestOptions.method) && beforeState) {
      setLastOperation(operationRecord)
    }

    return afterState
  }

  const stopCurrentAgent = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    setStreamedResponse("")
  }

  const handleFrontTool = async (
    toolName: string,
    args: any,
    context?: { openInNewTab?: boolean },
    message: string = "",
  ) => {
    let result: { name: string; content: string }

    switch (toolName) {
      case "stopAgent":
        stopCurrentAgent()
        result = { name: toolName, content: "⏹️ Агент остановлен" }
        break
      case "cancelCurrentAction":
        stopCurrentAgent()
        result = { name: toolName, content: "❌ Действие отменено" }
        break
      case "navigateToPage":
        if (args?.path) {
          if (context?.openInNewTab) {
            window.open(args.path, "_blank")
            result = { name: toolName, content: `🔗 Открыта новая вкладка: ${args.path}` }
          } else {
            router.push(args.path)
            result = { name: toolName, content: `🧭 Переход на страницу ${args.path}` }
          }
        } else {
          result = { name: toolName, content: "❌ Не указан путь" }
        }
        break
      default:
        result = { name: toolName, content: `❓ Неизвестный инструмент ${toolName}` }
        break
    }

    logDialogHistory(toolName, "FRONT", toolName, args ? JSON.stringify(convertDatesToUtc(args)) : null, null, result.content, message)
    return result
  }

  const runConversation = async (conversationHistory: Message[], onStreamChunk?: (chunk: string) => void) => {
    const isStreaming = selectedModel === "gemini-2.0-flash-streaming"
    const modelForApi = selectedModel === "gemini-2.0-flash-streaming" ? "gemini-2.0-flash" : selectedModel
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelForApi}:generateContent?key=${GEMINI_API_KEY}`
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
      
      // ОТЛАДКА: Добавляем логирование
      console.log('🔍 ОТЛАДКА ВЫБОРА ИНСТРУМЕНТОВ:')
      console.log('📝 Запрос пользователя:', inputValue)
      console.log('📊 Анализ запроса:', analysis)
      console.log('📚 Всего инструментов:', allTools.length)
      console.log('✅ Выбранные инструменты:', availableTools.length)
      console.log('📋 Имена выбранных инструментов:', availableTools.map(t => t.name))
      console.log('📂 Используемые категории:', usedCategories)
      console.log('📈 Статистика:', stats)
      
      // Проверяем инструменты для книг
      const bookTools = availableTools.filter(t => 
        t.name.includes('Book') || 
        t.name.includes('book') ||
        t.name === 'getAllBooks' ||
        t.name === 'searchBooks' ||
        t.name === 'createBook' ||
        t.name === 'updateBook' ||
        t.name === 'deleteBook'
      )
      console.log('📚 Инструменты для книг в выбранных:', bookTools.map(t => t.name))
      
    } else {
      availableTools = filterToolsByCategories(allTools, manualSelectedCategories, DEFAULT_TOOL_SELECTION_CONFIG)
      const stats = getToolUsageStats(availableTools, allTools)
      const categoryNames = manualSelectedCategories
        .map(id => TOOL_CATEGORIES.find(cat => cat.id === id)?.name)
        .filter(Boolean)
        .join(", ")
      selectionSummary = `Ручной выбор. ${stats.selectedCount}/${stats.totalTools} инструментов (-${stats.reductionPercentage}%). Категории: ${categoryNames}.`
      
      // ОТЛАДКА: Добавляем логирование для ручного режима
      console.log('🔍 ОТЛАДКА РУЧНОГО ВЫБОРА:')
      console.log('📝 Ручные категории:', manualSelectedCategories)
      console.log('📚 Всего инструментов:', allTools.length)
      console.log('✅ Выбранные инструменты:', availableTools.length)
      console.log('📋 Имена выбранных инструментов:', availableTools.map(t => t.name))
      
      // Проверяем инструменты для книг
      const bookTools = availableTools.filter(t => 
        t.name.includes('Book') || 
        t.name.includes('book') ||
        t.name === 'getAllBooks' ||
        t.name === 'searchBooks' ||
        t.name === 'createBook' ||
        t.name === 'updateBook' ||
        t.name === 'deleteBook'
      )
      console.log('📚 Инструменты для книг в выбранных:', bookTools.map(t => t.name))
    }
    if (aiMode === "question") {
      availableTools = availableTools.filter((tool) => tool.apiMethod === "GET" || !tool.apiMethod)
      console.log('🔍 РЕЖИМ ВОПРОСА: Отфильтровано до', availableTools.length, 'инструментов')
    }
    setToolSelectionSummary(selectionSummary)
    const toolDeclarations = availableTools.map(({ apiMethod, apiEndpoint, ...rest }) => rest)
    
    // ОТЛАДКА: Проверяем финальные декларации инструментов
    console.log('🔍 ФИНАЛЬНЫЕ ДЕКЛАРАЦИИ ИНСТРУМЕНТОВ:', toolDeclarations.length)
    console.log('📋 Имена инструментов в декларациях:', toolDeclarations.map(t => t.name))
    
    const currentHistory = buildGeminiHistory(conversationHistory)
    let maxIterations = 10
    let lastToolCalledInLoop: string | null = null
    const lastUserMessage = conversationHistory.filter((m) => m.role === "user").pop()?.content || ""

    // --- ДОБАВЛЯЮ обработку tool_code и print(...) ---
    function parseToolCodeOrPrint(text: string) {
      // Пример: print(getAllReservations()) или print(getUserById({id: "..."}))
      const printMatch = text.match(/print\((.*?)\)/)
      if (printMatch) {
        const call = printMatch[1]
        // getAllReservations() или getUserById({id: "..."})
        const fnMatch = call.match(/(\w+)\((.*)\)/)
        if (fnMatch) {
          const toolName = fnMatch[1]
          let params = {}
          try {
            params = fnMatch[2] ? JSON.parse(fnMatch[2]) : {}
          } catch {
            // если не json, возможно просто строка
            params = {}
          }
          return { toolName, params }
        } else {
          // getAllReservations без скобок
          return { toolName: call.trim(), params: {} }
        }
      }
      // Если просто getAllReservations()
      const fnMatch = text.match(/(\w+)\((.*)\)/)
      if (fnMatch) {
        const toolName = fnMatch[1]
        let params = {}
        try {
          params = fnMatch[2] ? JSON.parse(fnMatch[2]) : {}
        } catch {
          params = {}
        }
        return { toolName, params }
      }
      // Если просто getAllReservations
      if (/^\w+$/.test(text.trim())) {
        return { toolName: text.trim(), params: {} }
      }
      return null
    }

    // --- STREAMING режим ---
    if (isStreaming) {
      const requestBody = {
        contents: currentHistory,
        tools: [{ functionDeclarations: toolDeclarations }],
        systemInstruction: {
          parts: [
            {
              text: `Текущая дата и время в UTC: ${new Date().toISOString()}.
Используй это значение, когда в запросе упоминается 'сегодня' или 'текущая дата'.
+ВАЖНО: Все даты для резервирований, статистики и отчетов должны быть в формате UTC (DateTimeKind.Utc).
+При создании или обновлении резервирований всегда используй даты в UTC формате (ISO 8601 с 'Z' в конце).
+При запросах статистики и отчетов убедись, что все временные параметры передаются в UTC.
+
Ты — высокоэффективный ИИ-ассистент для управления библиотекой WiseOwl.
Твоя основная задача — точно и оперативно выполнять запросы пользователей, используя предоставленные инструменты API.
Стремись максимально использовать доступные инструменты, а также выявлять возможности для параллельного выполнения операций, если это логически обосновано и не приводит к конфликтам данных.
Если для выполнения запроса требуется несколько шагов, планируй их последовательно, но всегда ищи возможности для одновременного вызова нескольких инструментов, если их выполнение не зависит друг от друга.

**ТЕРМИНЫ:** Слова 'резервирование', 'резерв', 'бронирование', 'бронь' являются синонимами и означают одну и ту же сущность.

**СТАТУСЫ РЕЗЕРВИРОВАНИЙ:** 'Обрабатывается' (новое резервирование), 'Одобрена' (резервирование одобрено), 'Отменена' (отменено), 'Истекла' (время истекло), 'Выдана' (книга выдана), 'Возвращена' (книга возвращена), 'Просрочена' (просрочено).

**ВАЖНО ПРИ РАБОТЕ С ID:** Все операции с резервированиями, пользователями, книгами и экземплярами книг требуют точных GUID.
Всегда сначала получай список сущностей или детали конкретной сущности, чтобы получить правильный ID, а затем используй его для операций обновления/удаления.
Никогда не предполагай ID.

**ЭФФЕКТИВНЫЙ ПОИСК:**
*   **Приоритет поиска:** При поиске сущностей (пользователей, книг) всегда отдавай предпочтение инструментам поиска (\`searchUsers\`, \`searchBooks\`) перед получением полного списка (\`getAllUsers\`, \`getAllBooks\`). Полный список используй только если поиск не дал результатов или если пользователь явно просит показать "всех".
*   **Неоднозначный поиск:** Если пользователь предоставляет информацию, которая может соответствовать нескольким полям (например, строка 'Иванов' может быть частью \`fullName\` или \`username\`), используй инструмент поиска, указывая эту строку в обоих полях (\`fullName: 'Иванов', username: 'Иванов'\`). Это повысит шансы на успешный поиск.
*   **Комбинированный поиск:** Если пользователь предоставляет несколько критериев (например, 'найди книгу "Война и мир" автора Толстого'), используй инструмент поиска с несколькими параметрами (\`searchBooks({title: 'Война и мир', authors: 'Толстой'})\`).

**СЦЕНАРИИ РАБОТЫ С РЕЗЕРВИРОВАНИЯМИ:**
*   **Выдача книги:** Если пользователь просит 'Дай книгу {название} пользователю {имя}', необходимо:
    1.  Найти ID книги по названию (getAllBooks, затем фильтрация или getBookById, если название уникально).
    2.  Найти ID пользователя по имени (getAllUsers, затем фильтрация или getUserById).
    3.  Найти лучший доступный экземпляр книги (getBestAvailableBookInstance).
    4.  Создать новое резервирование (createReservation) с указанием ID книги, ID пользователя, ID экземпляра и статусом 'Выдана'.
*   **Возврат книги:** Если пользователь говорит '{имя} вернул книгу {название}' или '{имя} вернул все книги', необходимо:
    1.  Найти ID пользователя по имени (getAllUsers, затем фильтрация или getUserById).
    2.  Получить все активные резервирования ('Выдана', 'Просрочена') для данного пользователя (getUserReservations).
    3.  Для каждого найденного резервирования (или конкретного резервирования, если указана книга) изменить его статус на 'Возвращена' (updateReservation). Эти операции могут выполняться параллельно для разных резервирований.
*   **Одобрение резервирований:** При запросе 'Одобри все резервирования' или 'Одобри все резервирования для пользователя {имя}', необходимо:
    1.  Получить все резервирования со статусом 'Обрабатывается' (getAllReservations или getUserReservations).
    2.  Для каждого найденного резервирования изменить его статус на 'Одобрена' (updateReservation). Эти операции могут выполняться параллельно для разных резервирований.

**ОБРАБОТКА НЕОПРЕДЕЛЕННОСТИ:** Если для выполнения запроса не хватает информации (например, не указан ID, или не найдена сущность по предоставленным данным), запроси уточнение у пользователя, предложив варианты, если это возможно.

**ОБРАБОТКА ОШИБОК:** В случае ошибки при вызове инструмента, сообщи пользователю о проблеме и предложи возможные пути решения или альтернативные действия.

**ПРИМЕР ПАРАЛЛЕЛЬНОГО ВЫПОЛНЕНИЯ:** Если пользователь просит 'Покажи всех пользователей и все доступные книги', ты можешь одновременно вызвать \`getAllUsers\` и \`getAllBooks\`, а затем объединить результаты.

Всегда стремись к максимальной автоматизации и минимизации шагов, но при этом обеспечивай точность и надежность выполнения операций.`,
            },
          ],
        },
        stream: true,
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      const response = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let done = false
      let fullText = ""

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading

        if (value) {
          const chunk = decoder.decode(value, { stream: !done })
          const lines = chunk.split("\n").filter(Boolean)

          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || ""
              if (text) {
                fullText += text
                if (onStreamChunk) onStreamChunk(fullText)
              }
            } catch {}
          }
        }
      }

      return fullText || "Извините, я не смог обработать ваш запрос."
    }

    // --- NON-STREAMING режим ---
    while (maxIterations > 0) {
      const requestBody = {
        contents: currentHistory,
        tools: [{ functionDeclarations: toolDeclarations }],
        systemInstruction: {
          parts: [
            {
              text: `Текущая дата и время в UTC: ${new Date().toISOString()}.
Используй это значение, когда в запросе упоминается 'сегодня' или 'текущая дата'.
+ВАЖНО: Все даты для резервирований, статистики и отчетов должны быть в формате UTC (DateTimeKind.Utc).
+При создании или обновлении резервирований всегда используй даты в UTC формате (ISO 8601 с 'Z' в конце).
+При запросах статистики и отчетов убедись, что все временные параметры передаются в UTC.
+
Ты — высокоэффективный ИИ-ассистент для управления библиотекой WiseOwl.
Твоя основная задача — точно и оперативно выполнять запросы пользователей, используя предоставленные инструменты API.
Стремись максимально использовать доступные инструменты, а также выявлять возможности для параллельного выполнения операций, если это логически обосновано и не приводит к конфликтам данных.
Если для выполнения запроса требуется несколько шагов, планируй их последовательно, но всегда ищи возможности для одновременного вызова нескольких инструментов, если их выполнение не зависит друг от друга.

**ТЕРМИНЫ:** Слова 'резервирование', 'резерв', 'бронирование', 'бронь' являются синонимами и означают одну и ту же сущность.

**СТАТУСЫ РЕЗЕРВИРОВАНИЙ:** 'Обрабатывается' (новое резервирование), 'Одобрена' (резервирование одобрено), 'Отменена' (отменено), 'Истекла' (время истекло), 'Выдана' (книга выдана), 'Возвращена' (книга возвращена), 'Просрочена' (просрочено).

**ВАЖНО ПРИ РАБОТЕ С ID:** Все операции с резервированиями, пользователями, книгами и экземплярами книг требуют точных GUID.
Всегда сначала получай список сущностей или детали конкретной сущности, чтобы получить правильный ID, а затем используй его для операций обновления/удаления.
Никогда не предполагай ID.

**ЭФФЕКТИВНЫЙ ПОИСК:**
*   **Приоритет поиска:** При поиске сущностей (пользователей, книг) всегда отдавай предпочтение инструментам поиска (\`searchUsers\`, \`searchBooks\`) перед получением полного списка (\`getAllUsers\`, \`getAllBooks\`). Полный список используй только если поиск не дал результатов или если пользователь явно просит показать "всех".
*   **Неоднозначный поиск:** Если пользователь предоставляет информацию, которая может соответствовать нескольким полям (например, строка 'Иванов' может быть частью \`fullName\` или \`username\`), используй инструмент поиска, указывая эту строку в обоих полях (\`fullName: 'Иванов', username: 'Иванов'\`). Это повысит шансы на успешный поиск.
*   **Комбинированный поиск:** Если пользователь предоставляет несколько критериев (например, 'найди книгу "Война и мир" автора Толстого'), используй инструмент поиска с несколькими параметрами (\`searchBooks({title: 'Война и мир', authors: 'Толстой'})\`).

**СЦЕНАРИИ РАБОТЫ С РЕЗЕРВИРОВАНИЯМИ:**
*   **Выдача книги:** Если пользователь просит 'Дай книгу {название} пользователю {имя}', необходимо:
    1.  Найти ID книги по названию (getAllBooks, затем фильтрация или getBookById, если название уникально).
    2.  Найти ID пользователя по имени (getAllUsers, затем фильтрация или getUserById).
    3.  Найти лучший доступный экземпляр книги (getBestAvailableBookInstance).
    4.  Создать новое резервирование (createReservation) с указанием ID книги, ID пользователя, ID экземпляра и статусом 'Выдана'.
*   **Возврат книги:** Если пользователь говорит '{имя} вернул книгу {название}' или '{имя} вернул все книги', необходимо:
    1.  Найти ID пользователя по имени (getAllUsers, затем фильтрация или getUserById).
    2.  Получить все активные резервирования ('Выдана', 'Просрочена') для данного пользователя (getUserReservations).
    3.  Для каждого найденного резервирования (или конкретного резервирования, если указана книга) изменить его статус на 'Возвращена' (updateReservation). Эти операции могут выполняться параллельно для разных резервирований.
*   **Одобрение резервирований:** При запросе 'Одобри все резервирования' или 'Одобри все резервирования для пользователя {имя}', необходимо:
    1.  Получить все резервирования со статусом 'Обрабатывается' (getAllReservations или getUserReservations).
    2.  Для каждого найденного резервирования изменить его статус на 'Одобрена' (updateReservation). Эти операции могут выполняться параллельно для разных резервирований.

**ОБРАБОТКА НЕОПРЕДЕЛЕННОСТИ:** Если для выполнения запроса не хватает информации (например, не указан ID, или не найдена сущность по предоставленным данным), запроси уточнение у пользователя, предложив варианты, если это возможно.

**ОБРАБОТКА ОШИБОК:** В случае ошибки при вызове инструмента, сообщи пользователю о проблеме и предложи возможные пути решения или альтернативные действия.

**ПРИМЕР ПАРАЛЛЕЛЬНОГО ВЫПОЛНЕНИЯ:** Если пользователь просит 'Покажи всех пользователей и все доступные книги', ты можешь одновременно вызвать \`getAllUsers\` и \`getAllBooks\`, а затем объединить результаты.

Всегда стремись к максимальной автоматизации и минимизации шагов, но при этом обеспечивай точность и надежность выполнения операций.`,
            },
          ],
        },
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      const response = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      const responseParts = data.candidates?.[0]?.content?.parts

      if (!responseParts) {
        return "Извините, я не смог обработать ваш запрос."
      }

      const functionCallParts = responseParts.filter((p: any) => p.functionCall)
      const textParts = responseParts.filter((p: any) => p.text)
      // --- ДОБАВЛЯЮ обработку tool_code и print(...) ---
      const toolCodeParts = responseParts.filter((p: any) => p.type === 'tool_code' || (p.text && /print\(/.test(p.text)))
      if (functionCallParts.length > 0) {
        const calledToolNames = functionCallParts.map((p: any) => p.functionCall.name)
        if (calledToolNames.includes("navigateToPage")) {
          lastToolCalledInLoop = "navigateToPage"
        } else if (calledToolNames.length === 1) {
          lastToolCalledInLoop = calledToolNames[0]
        } else {
          lastToolCalledInLoop = "multiple"
        }

        const originalModelResponse = { role: "model", parts: responseParts }

        const thinkingMessagesPromises = functionCallParts.map(async (part: any) => {
          const functionName = part.functionCall.name
          const functionArgs = part.functionCall.args

          const thinkingMessage: Message = {
            id: generateUniqueId(),
            content: `Думаю, нужно вызвать инструмент: ${functionName}...`,
            role: "assistant",
            timestamp: new Date(),
            apiCall: {
              method: "TOOL",
              endpoint: functionName,
              params: functionArgs,
            },
          }
          return thinkingMessage
        })

        const thinkingMessages = await Promise.all(thinkingMessagesPromises)
        setMessages((prev) => [...prev, ...thinkingMessages])

        const hasMultipleNavigations =
          functionCallParts.filter((p) => p.functionCall.name === "navigateToPage").length > 1

        const toolResponses = await Promise.all(
          functionCallParts.map(async (part: any) => {
            const functionCall = part.functionCall
            const functionName = functionCall.name
            const functionArgs = functionCall.args
            const toolDef = allTools.find((t) => t.name === functionName)

            if (!toolDef || !toolDef.apiMethod || !toolDef.apiEndpoint) {
              const frontRes = await handleFrontTool(
                functionName,
                functionArgs,
                {
                  openInNewTab: hasMultipleNavigations && functionName === "navigateToPage",
                },
                lastUserMessage,
              )
              return { functionResponse: frontRes }
            }

            let endpoint = toolDef.apiEndpoint
            const mutableArgs = { ...functionArgs }

            Object.keys(mutableArgs).forEach((key) => {
              if (endpoint.includes(`{${key}}`)) {
                endpoint = endpoint.replace(`{${key}}`, mutableArgs[key])
                delete mutableArgs[key]
              }
            })

            const apiResponse = await executeApiCall({
              toolName: functionName,
              method: toolDef.apiMethod,
              endpoint: endpoint,
              params: convertDatesToUtc(mutableArgs),
              message: lastUserMessage,
            })

            // Если инструмент предназначен для генерации HTML-отчёта, запускаем процесс отчёта
            if (autoGenerateReports && (
                functionName === "getUserStatistics" ||
                functionName === "getReservationStatistics" ||
                functionName === "getBookStatistics" ||
                functionName === "getTopPopularBooks" ||
                functionName === "getAllUsers" ||
                functionName === "getAllBooks" ||
                functionName === "getAllReservations" ||
                functionName === "searchUsers" ||
                functionName === "searchBooks" ||
                functionName === "getUserReservations" ||
                functionName === "getBookAvailability" ||
                functionName === "getOverdueReservations")) {
              
              // Определяем заголовок отчета на основе типа инструмента
              let reportTitle = "Отчёт WiseOwl"
              if (functionName === "getUserStatistics") {
                reportTitle = "Статистика пользователей"
              } else if (functionName === "getReservationStatistics") {
                reportTitle = "Статистика резервирований"
              } else if (functionName === "getBookStatistics") {
                reportTitle = "Статистика книг"
              } else if (functionName === "getTopPopularBooks") {
                reportTitle = "Топ популярных книг"
              } else if (functionName === "getAllUsers") {
                reportTitle = "Список всех пользователей"
              } else if (functionName === "getAllBooks") {
                reportTitle = "Каталог всех книг"
              } else if (functionName === "getAllReservations") {
                reportTitle = "Все резервирования"
              } else if (functionName === "searchUsers") {
                reportTitle = "Результаты поиска пользователей"
              } else if (functionName === "searchBooks") {
                reportTitle = "Результаты поиска книг"
              } else if (functionName === "getUserReservations") {
                reportTitle = "Резервирования пользователя"
              } else if (functionName === "getBookAvailability") {
                reportTitle = "Доступность книги"
              } else if (functionName === "getOverdueReservations") {
                reportTitle = "Просроченные резервирования"
              }
              
              // Проверяем, что данные подходят для генерации отчета
              if (apiResponse && (typeof apiResponse === 'object' || Array.isArray(apiResponse))) {
                // Дополнительная проверка на пустые данные
                if (Array.isArray(apiResponse) && apiResponse.length === 0) {
                  console.log(`⚠️ Данные для отчета "${reportTitle}" пусты, отчет не будет сгенерирован`)
                  return
                }
                
                if (typeof apiResponse === 'object' && Object.keys(apiResponse).length === 0) {
                  console.log(`⚠️ Данные для отчета "${reportTitle}" пусты, отчет не будет сгенерирован`)
                  return
                }
                
                await generateHtmlReport(apiResponse, reportTitle)
              } else {
                console.log(`⚠️ Данные для отчета "${reportTitle}" не подходят для генерации HTML-отчета`)
              }
            }

            return {
              functionResponse: { name: functionName, response: { name: functionName, content: apiResponse } },
            }
          }),
        )

        currentHistory.push(originalModelResponse)
        currentHistory.push({ role: "function", parts: toolResponses })
        maxIterations--
        continue
      } else if (toolCodeParts.length > 0) {
        // Парсим и вызываем инструменты
        let toolResults: string[] = []
        for (const part of toolCodeParts) {
          let code = part.text || part.code || ''
          const parsed = parseToolCodeOrPrint(code)
          if (parsed) {
            const toolDef = allTools.find(t => t.name === parsed.toolName)
            if (toolDef) {
              let endpoint = toolDef.apiEndpoint
              const mutableArgs = { ...parsed.params }
              Object.keys(mutableArgs).forEach((key) => {
                if (endpoint.includes(`{${key}}`)) {
                  endpoint = endpoint.replace(`{${key}}`, mutableArgs[key])
                  delete mutableArgs[key]
                }
              })
              const apiResponse = await executeApiCall({
                toolName: parsed.toolName,
                method: toolDef.apiMethod!,
                endpoint: endpoint!,
                params: convertDatesToUtc(mutableArgs),
                message: lastUserMessage,
              })
              toolResults.push(`${parsed.toolName}: ${typeof apiResponse === 'string' ? apiResponse : JSON.stringify(apiResponse, null, 2)}`)
            } else {
              toolResults.push(`Неизвестный инструмент: ${parsed.toolName}`)
            }
          } else {
            toolResults.push(`Не удалось распознать вызов инструмента: ${code}`)
          }
        }
        return toolResults.join('\n')
      } else if (textParts.length > 0) {
        if (lastToolCalledInLoop === "navigateToPage") {
          return ""
        }
        return textParts.map((p: any) => p.text).join("\n")
      } else {
        // Если последний инструмент был navigateToPage, не показываем ошибку
        if (lastToolCalledInLoop === "navigateToPage") {
          return ""
        }
        return "Извините, я не смог обработать ваш запрос."
      }
    }

    return "Достигнуто максимальное количество итераций. Процесс остановлен."
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    // Закрываем slash-меню при отправке
    setSlashMenuVisible(false)
    setSlashQuery("")
    
    const userMessageText = inputValue
    const userMessage: Message = {
      id: generateUniqueId(),
      content: userMessageText,
      role: "user",
      timestamp: new Date(),
    }

    snapshotRef.current = [...messages]
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue("")
    setIsLoading(true)
    setStreamedResponse("")
    let lastToolCalled: string | null = null

    try {
      if (selectedModel === "gemini-2.0-flash-streaming") {
        const assistantMessage: Message = {
          id: generateUniqueId(),
          content: "",
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])

        await runConversation(newMessages, (chunk) => {
          setStreamedResponse(chunk)
          setMessages((prev) => prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: chunk } : m)))
        })

        logDialogHistory("user", "USER", "user", null, null, null, userMessageText)
      } else {
        const responseText = await runConversation(newMessages)
        if (responseText && responseText.trim()) {
          const assistantMessage: Message = {
            id: generateUniqueId(),
            content: responseText,
            role: "assistant",
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, assistantMessage])
        }
        logDialogHistory("user", "USER", "user", null, null, null, userMessageText)
      }
    } catch (error) {
      // Проверяем, был ли последний инструмент navigateToPage
      const recentMessages = messages.slice(-10) // Берем последние 10 сообщений
      const hasNavigateToPage = recentMessages.some(msg => 
        msg.apiCall?.endpoint === "navigateToPage" || 
        msg.content.includes("navigateToPage") ||
        msg.content.includes("🧭 Переход на страницу") ||
        msg.content.includes("🔗 Открыта новая вкладка")
      )
      
      // Не показываем ошибку, если недавно был вызван navigateToPage
      if (!hasNavigateToPage) {
        const errorMessage: Message = {
          id: generateUniqueId(),
          content: `❌ Извините, произошла ошибка: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } finally {
      setIsLoading(false)
      setStreamedResponse("")
    }
  }

  const handleResetChat = () => {
    setMessages([])
    setIsLoading(false)
    prevMessagesLength.current = 0
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const selectQuickCommand = (command: string) => {
    setInputValue(command)
    setActiveCommandCategory(null)
    setShowQuickCommands(false)
  }

  // Функция для вставки шаблона команды с плейсхолдером в textarea
  const insertCommandTemplate = (template: string) => {
    // Найти первый плейсхолдер вида {текст}
    const match = template.match(/\{([^}]+)\}/)
    if (match) {
      // Заменить плейсхолдер на выделенный <mark> или спец. символы
      const before = template.slice(0, match.index)
      const placeholder = match[0]
      const after = template.slice((match.index || 0) + placeholder.length)
      setInputValue(before + match[1] + after)
      // Через setTimeout выделить плейсхолдер
      setTimeout(() => {
        const textarea = document.getElementById('ai-chat-textarea') as HTMLTextAreaElement
        if (textarea) {
          const start = before.length
          const end = before.length + match[1].length
          textarea.focus()
          textarea.setSelectionRange(start, end)
        }
      }, 0)
    } else {
      setInputValue(template)
      setTimeout(() => {
        const textarea = document.getElementById('ai-chat-textarea') as HTMLTextAreaElement
        if (textarea) textarea.focus()
      }, 0)
    }
    setActiveCommandCategory(null)
    setShowQuickCommands(false)
  }

  // --- НАЧАЛО: вспомогательные функции для истории ---

  // Определение категории по item
  function getDialogCategory(item: any) {
    const method = (item.httpMethod || "").toUpperCase();
    const tool = (item.toolName || "").toLowerCase();
    const endpoint = (item.endpoint || "").toLowerCase();
    if (method === "GET") return "Информационные";
    if (tool.includes("user") || endpoint.includes("user")) return "Пользователи";
    if (tool.includes("reservation") || endpoint.includes("reservation")) return "Бронирования";
    if (tool.includes("book") || endpoint.includes("book")) return "Книги";
    return "Прочее";
  }

  // Получить первое user-сообщение для диалога
  function getFirstUserMessage(items: any[]) {
    const userMsg = items.find((i) => i.message && i.toolName === "user" && i.httpMethod === "USER");
    if (userMsg && userMsg.message) return userMsg.message;
    // fallback: ищем любой message
    const anyMsg = items.find((i) => i.message);
    if (anyMsg && anyMsg.message) return anyMsg.message;
    return items[0]?.conversationId || "Без названия";
  }

  // Группировка диалогов по категориям
  function groupDialogsByCategory(dialogs: Record<string, any[]>): Record<string, { convId: string, items: any[] }[]> {
    const result: Record<string, { convId: string, items: any[] }[]> = {
      "Информационные": [],
      "Пользователи": [],
      "Бронирования": [],
      "Книги": [],
      "Прочее": [],
    };
    Object.entries(dialogs).forEach(([convId, items]) => {
      // Категория по первому действию (или по большинству)
      const cats = items.map(getDialogCategory);
      const mainCat = cats.sort((a,b) => cats.filter(v=>v===a).length - cats.filter(v=>v===b).length).pop() || "Прочее";
      result[mainCat] = result[mainCat] || [];
      // ВАЖНО: группируем только по conversationId, не разбиваем!
      result[mainCat].push({ convId, items });
    });
    return result;
  }

  // Новая функция: группировка по сообщениям пользователя
  function groupByUserMessages(items: any[]) {
    const groups: { message: string, tools: any[], timestamp: Date }[] = [];
    let currentGroup: any[] = [];
    let currentMessage = "";
    
    // Сортируем по времени
    const sortedItems = items.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    for (const item of sortedItems) {
      if (item.message && item.message !== currentMessage) {
        // Новое сообщение пользователя
        if (currentGroup.length > 0) {
          groups.push({
            message: currentMessage,
            tools: currentGroup,
            timestamp: new Date(currentGroup[0].timestamp)
          });
        }
        currentMessage = item.message;
        currentGroup = [item];
      } else {
        // Инструмент для текущего сообщения
        currentGroup.push(item);
      }
    }
    
    // Добавляем последнюю группу
    if (currentGroup.length > 0) {
      groups.push({
        message: currentMessage,
        tools: currentGroup,
        timestamp: new Date(currentGroup[0].timestamp)
      });
    }
    
    return groups.reverse(); // Последние сверху
  }

  // Проверка, есть ли изменения данных
  function hasDataChanges(item: any) {
    const method = (item.httpMethod || "").toUpperCase();
    return ["POST", "PUT", "DELETE"].includes(method);
  }

  // --- КОНЕЦ: вспомогательные функции для истории ---

  // --- МОДАЛЬНОЕ ОКНО выбора инструментов ---
  const ToolSelectionDialog: React.FC<{
    isOpen: boolean
    onClose: () => void
    allTools: Tool[]
    mode: 'auto' | 'manual'
    setMode: (mode: 'auto' | 'manual') => void
    manualCategories: string[]
    setManualCategories: React.Dispatch<React.SetStateAction<string[]>>
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
        <DialogContent className={`${
          isExpanded ? "max-w-6xl" : "max-w-4xl"
        } max-h-[80vh] overflow-hidden`}>
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
                <div className={`grid gap-3 ${
                  isExpanded ? "grid-cols-4" : "grid-cols-2"
                }`}>
                  {TOOL_CATEGORIES.map(category => {
                    const isSelected = manualCategories.includes(category.id)
                    const toolCount = category.tools.length
                    return (
                      <Card
                        key={category.id}
                        className={`transition-all ${
                          isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div onClick={() => toggleCategory(category.id)} className="p-4 cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium flex items-center gap-2">
                                <span className="text-lg">{category.icon}</span>
                                {category.name}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                            </div>
                          </div>
                        </div>
                        <details className="px-4 pb-4 -mt-4 ml-8" onClick={e => e.stopPropagation()}>
                          <summary className="text-xs text-gray-500 cursor-pointer select-none hover:text-gray-800">
                            {toolCount} инструментов
                          </summary>
                          <div className="max-h-32 overflow-y-auto mt-2 pr-2">
                            <ul className="pl-4 border-l border-gray-200 space-y-1">
                              {category.tools.map(toolName => (
                                <li key={toolName} className="text-xs text-gray-600 font-mono">
                                  {toolName}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </details>
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
                  <div className={`grid gap-4 text-sm ${
                    isExpanded ? "grid-cols-6" : "grid-cols-3"
                  }`}>
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
  // --- МОДАЛЬНОЕ ОКНО выбора инструментов ---

  // --- ДОБАВЛЯЮ восстановление режима и категорий из localStorage ---
  useEffect(() => {
    const savedMode = localStorage.getItem('ai_tool_mode')
    const savedCats = localStorage.getItem('ai_tool_manual_categories')
    const savedAutoReports = localStorage.getItem('ai_auto_reports')
    const savedExpanded = localStorage.getItem('ai_window_expanded')
    
    if (savedMode === 'manual' || savedMode === 'auto') {
      setToolSelectionMode(savedMode)
    }
    if (savedCats) {
      try {
        const arr = JSON.parse(savedCats)
        if (Array.isArray(arr)) setManualSelectedCategories(arr)
      } catch {}
    }
    if (savedAutoReports !== null) {
      setAutoGenerateReports(savedAutoReports === 'true')
    } else {
      // По умолчанию отключаем авто-генерацию отчетов
      setAutoGenerateReports(false)
    }
    if (savedExpanded !== null) {
      setIsExpanded(savedExpanded === 'true')
    }
  }, [])
  // --- Сохраняю изменения режима и категорий ---
  useEffect(() => {
    localStorage.setItem('ai_tool_mode', toolSelectionMode)
  }, [toolSelectionMode])
  useEffect(() => {
    localStorage.setItem('ai_tool_manual_categories', JSON.stringify(manualSelectedCategories))
  }, [manualSelectedCategories])
  
  // Сохраняю настройку автоматической генерации отчетов
  useEffect(() => {
    localStorage.setItem('ai_auto_reports', autoGenerateReports.toString())
  }, [autoGenerateReports])
  
  // Сохраняю состояние расширения окна
  useEffect(() => {
    localStorage.setItem('ai_window_expanded', isExpanded.toString())
  }, [isExpanded])
  // ... существующий код ...

  // --- ВСТАВЛЯЮ вычисление выбранных категорий для отображения ---
  const shownCategories = toolSelectionMode === 'manual'
    ? manualSelectedCategories
    : (lastQueryAnalysis.detectedCategories.length > 0 ? lastQueryAnalysis.detectedCategories : ['users','books','reservations'])
  const shownCategoryObjs = shownCategories
    .map(id => TOOL_CATEGORIES.find(cat => cat.id === id))
    .filter(Boolean)
  // ... существующий код ...

  // ---------- Генерация HTML отчётов с графиками ----------
  const generateHtmlReport = async (reportData: any, title: string = "Отчёт WiseOwl") => {
    try {
      // Анализируем данные для определения типа отчета
      let reportType = "general"
      let dataDescription = ""
      let specificInstructions = ""
      
      if (title.includes("пользователей")) {
        reportType = "users"
        dataDescription = "статистика пользователей библиотеки"
        specificInstructions = "Создай диаграммы: распределение по ролям, активность пользователей, статистика штрафов, топ активных пользователей"
      } else if (title.includes("резервирований")) {
        reportType = "reservations" 
        dataDescription = "статистика резервирований и выдачи книг"
        specificInstructions = "Создай диаграммы: статусы резервирований, динамика по времени, популярные книги, эффективность обработки"
      } else if (title.includes("книг")) {
        reportType = "books"
        dataDescription = "статистика книжного фонда"
        specificInstructions = "Создай диаграммы: распределение по жанрам, доступность книг, популярные авторы, состояние фонда"
      } else if (title.includes("популярных")) {
        reportType = "popular"
        dataDescription = "рейтинг популярности книг"
        specificInstructions = "Создай диаграммы: топ популярных книг, рейтинг по жанрам, динамика популярности"
      } else if (title.includes("Список всех")) {
        reportType = "list"
        dataDescription = "список всех записей"
        specificInstructions = "Создай таблицу с данными и диаграммы распределения по основным параметрам"
      }

      // Создаем расширенный промпт в зависимости от типа данных
      const prompt = `Создай полноценную HTML-страницу (<!DOCTYPE html> … </html>) с встроенным CDN-скриптом Chart.js (https://cdn.jsdelivr.net/npm/chart.js) на русском языке.

ТРЕБОВАНИЯ К СТРАНИЦЕ:
1. В шапке h1 укажи «${title}»
2. Добавь дату и время генерации отчета в формате "Сгенерировано: [дата] [время]"
3. Создай несколько интерактивных диаграмм на основе переданных данных
4. Используй подходящие типы диаграмм:
   - Bar charts для сравнения количеств
   - Pie charts для распределения по категориям
   - Line charts для временных рядов
   - Doughnut charts для процентных соотношений
   - Table для отображения списков данных
5. Под каждым графиком добавь краткое текстовое описание на русском языке
6. Добавь общую сводку в начале отчета с ключевыми цифрами
7. Используй современный дизайн с градиентами и тенями
8. Добавь адаптивность для мобильных устройств
9. Не добавляй внешних зависимостей, кроме Chart.js CDN
10. Используй цветовую схему: синий, зеленый, оранжевый, фиолетовый

ТИП ОТЧЕТА: ${reportType}
ОПИСАНИЕ: ${dataDescription}
СПЕЦИФИЧЕСКИЕ ИНСТРУКЦИИ: ${specificInstructions}

Возврати только чистый HTML-код без дополнительных комментариев.`

      // Подготавливаем данные для отчета
      let processedData = reportData
      
      // Если данные - это массив, добавляем метаинформацию
      if (Array.isArray(reportData)) {
        processedData = {
          totalCount: reportData.length,
          data: reportData,
          generatedAt: new Date().toISOString(),
          dataType: reportType
        }
      }
      
      // Если данные - это объект, добавляем метаинформацию
      if (typeof reportData === 'object' && reportData !== null && !Array.isArray(reportData)) {
        processedData = {
          ...reportData,
          generatedAt: new Date().toISOString(),
          dataType: reportType
        }
      }

      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
      const body = {
        contents: [
          {
            parts: [{ text: prompt }, { text: JSON.stringify(processedData, null, 2) }],
            role: "user",
          },
        ],
      }

      const res = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Gemini API error ${res.status}: ${errorText}`)
      }
      
      const data = await res.json()
      const html = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "<html><body>Ошибка генерации отчёта</body></html>"

      // Проверяем, что HTML содержит необходимые элементы
      if (!html.includes('<html') || !html.includes('</html>')) {
        throw new Error('Сгенерированный HTML не содержит необходимых элементов')
      }

      // Открываем отчёт в новой вкладке через Blob
      const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }))
      window.open(blobUrl, "_blank")
      
      // Показываем уведомление об успешной генерации
      console.log(`✅ HTML-отчет "${title}" успешно сгенерирован и открыт в новой вкладке`)
    } catch (err) {
      console.error("Ошибка генерации отчёта:", err)
      // Показываем более информативное сообщение об ошибке
      const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка"
      console.error(`❌ Не удалось сгенерировать HTML-отчет "${title}": ${errorMessage}`)
      
      // Не показываем alert, чтобы не прерывать работу ассистента
      // alert(`Не удалось сгенерировать HTML отчёт: ${errorMessage}`)
    }
  }
  // ---------- Конец генерации HTML отчётов ----------

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Enhanced floating button with animation */}
      {!isOpen && (
        <div className="relative">
          <Button
            onClick={handleToggleChat}
            className="rounded-full w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 shadow-2xl border-0 transition-all duration-300 hover:scale-110 group overflow-hidden"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Owl icon with animation */}
            <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
              <img
                src="/images/owl-svgrepo-com.svg"
                className="w-8 h-8"
                alt="AI Assistant"
              />
            </div>

            {/* Pulse effect */}
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
          </Button>

          {/* Status indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white shadow-sm">
            <div className="w-full h-full rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>
      )}

      {/* Enhanced chat window */}
      {isOpen && (
        <motion.div
          className={`transform transition-all duration-500 ease-out ${
            isAnimating ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
          }`}
          animate={{
            scale: isExpanded ? 1.05 : 1,
            transition: { duration: 0.3, ease: "easeInOut" }
          }}
        >
          <Card className={`${
            isExpanded ? "w-[1200px] h-[900px]" : "w-[600px] h-[750px]"
          } shadow-2xl bg-white/95 backdrop-blur-xl border-0 overflow-hidden transition-all duration-300 ease-in-out`}>
            {/* Enhanced header */}
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src="/images/owl-svgrepo-com.svg" alt="Мудрая Сова" className="w-6 h-6" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 border border-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-800 text-xl font-bold">
                      Мудрая Сова
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Model selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-white/50">
                        <Brain className="w-5 h-5 mr-1" />
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuRadioGroup value={selectedModel} onValueChange={setSelectedModel}>
                        {modelOptions.map((model) => (
                          <DropdownMenuRadioItem key={model.id} value={model.id} className="flex items-center gap-3 p-3">
                            <span className="text-lg">{model.icon}</span>
                            <span className="text-base">{model.name}</span>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className={`text-gray-500 hover:text-gray-700 hover:bg-white/50 transition-all duration-200 ${
                        isExpanded ? "bg-blue-100 text-blue-700" : ""
                      }`}
                      title={isExpanded ? "Уменьшить окно" : "Увеличить окно"}
                    >
                      {isExpanded ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      )}
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

            <CardContent className={`p-0 flex flex-col ${
              isExpanded ? "h-[820px]" : "h-[670px]"
            }`}>
              <ScrollArea className="flex-1 p-4">
                {/* Welcome message with animation */}
                {messages.length === 0 && !statusMessage && (
                  <div className="text-center mt-12 animate-fade-in">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
                        <img src="/images/owl-svgrepo-com.svg" alt="Мудрая Сова" className="w-12 h-12" />
                      </div>
                      <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Привет! Я Мудрая Сова 🦉</h3>
                    <p className="text-gray-600 mb-6 text-base">Ваш персональный AI-ассистент</p>
                    <div className={`flex flex-wrap gap-3 justify-center ${
                      isExpanded ? "grid grid-cols-2 gap-3" : ""
                    }`}>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-sm p-2">
                        📚 Управление книгами
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-sm p-2">
                        👤 Работа с пользователями
                      </Badge>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-sm p-2">
                        📅 Резервирования
                      </Badge>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-sm p-2">
                        🔍 Работа со страницами
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Status message with enhanced styling */}
                {statusMessage && (
                  <div className="text-center mt-12">
                    <div className="inline-flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100">
                      <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                      <span className="text-blue-700 font-medium text-base">{statusMessage}</span>
                    </div>
                  </div>
                )}

                {/* Enhanced message display */}
                {messages.map((message) => {
                  if (message.apiCall && message.role === "assistant") {
                    return (
                      <div key={message.id} className="mb-6 flex justify-start w-full">
                        <ToolCallDisplay apiCall={message.apiCall} isLoading={isLoading} onCancel={stopCurrentAgent} />
                      </div>
                    )
                  }

                  return (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`${
                          isExpanded ? "max-w-[70%]" : "max-w-[85%]"
                        } rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
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

                {/* Enhanced loading indicator */}
                {isLoading && !messages.some((m) => m.apiCall) && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                      <span className="text-base text-gray-600 font-medium">Думаю...</span>
                    </div>
                  </div>
                )}

                {/* Streaming indicator */}
                {streamedResponse && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-blue-200">
                      <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
                      <span className="text-base text-blue-700 font-medium">Отвечаю в реальном времени...</span>
                    </div>
                  </div>
                )}

                {/* Индикатор режима команд */}
                {showQuickCommands && (
                  <div className="flex items-center gap-2 mb-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg shadow text-yellow-900 text-base font-semibold animate-pulse">
                    <Command className="w-5 h-5 text-yellow-600" />
                    Режим команд активен — выберите шаблон или введите свой запрос
                  </div>
                )}

                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Quick commands section */}
              <AnimatePresence>
                {showQuickCommands && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="mb-4">
                        <div className={`grid gap-3 mb-4 ${
                          isExpanded ? "grid-cols-6" : "grid-cols-3"
                        }`}>
                          <CommandButton
                            icon={<Calendar className="w-4 h-4" />}
                            label="Бронирования"
                            isActive={activeCommandCategory === "reservations"}
                            onClick={() =>
                              setActiveCommandCategory(
                                activeCommandCategory === "reservations" ? null : "reservations"
                              )
                            }
                          />
                          <CommandButton
                            icon={<Users className="w-4 h-4" />}
                            label="Пользователи"
                            isActive={activeCommandCategory === "users"}
                            onClick={() =>
                              setActiveCommandCategory(
                                activeCommandCategory === "users" ? null : "users"
                              )
                            }
                          />
                          <CommandButton
                            icon={<Book className="w-4 h-4" />}
                            label="Книги"
                            isActive={activeCommandCategory === "books"}
                            onClick={() =>
                              setActiveCommandCategory(
                                activeCommandCategory === "books" ? null : "books"
                              )
                            }
                          />
                        </div>

                        <AnimatePresence>
                          {activeCommandCategory && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white/80 backdrop-blur-sm rounded-xl border p-4 shadow-sm">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">
                                  {activeCommandCategory === "reservations"
                                    ? "Быстрые команды по бронированиям"
                                    : activeCommandCategory === "users"
                                    ? "Быстрые команды по пользователям"
                                    : "Быстрые команды по книгам"}
                                </h3>
                                <div className="space-y-2">
                                  {quickCommands[activeCommandCategory as keyof typeof quickCommands].map((command, index) => (
                                    <motion.button
                                      key={index}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.05 }}
                                      onClick={() => insertCommandTemplate(command)}
                                      className="w-full text-left p-3 rounded-lg hover:bg-blue-50 transition-colors text-sm border border-transparent hover:border-blue-200 font-mono"
                                      dangerouslySetInnerHTML={{ __html: command.replace(/\{([^}]+)\}/g, '<span class="bg-yellow-200 text-yellow-900 font-semibold">$1</span>') }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced input area */}
              <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white/50 relative">
                {/* Quick undo for last operation */}
                {lastOperation && (
                  <div className="mb-3">
                    <UndoManager historyItem={lastOperation} onUndoComplete={() => setLastOperation(null)} />
                  </div>
                )}

                {/* Action and Command buttons */}
                <div className={`flex items-center gap-2 mb-3 ${
                  isExpanded ? "flex-wrap" : ""
                }`}>
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
                  {/* КНОПКА ВЫБОРА РЕЖИМА ИНСТРУМЕНТОВ */}
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
                  
                  {/* КНОПКА УПРАВЛЕНИЯ АВТОМАТИЧЕСКОЙ ГЕНЕРАЦИЕЙ ОТЧЕТОВ */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAutoGenerateReports(!autoGenerateReports)}
                    className={`h-9 px-4 text-sm transition-all duration-200 rounded-md ${
                      autoGenerateReports
                        ? "bg-green-100 text-green-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                    title="Автоматическая генерация отчетов"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {autoGenerateReports ? 'Авто-отчеты' : 'Отчеты'}
                  </Button>
                </div>

                {/* Строка ввода — textarea с авто-расширением */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <TextareaAutosize
                      id="ai-chat-textarea"
                      value={inputValue}
                      onChange={(e) => {
                        const value = e.target.value
                        setInputValue(value)

                        // --- Slash-меню ---
                        const cursorPos = e.target.selectionStart || value.length
                        const upToCursor = value.slice(0, cursorPos)
                        const slashIndex = upToCursor.lastIndexOf("/")
                        if (slashIndex >= 0) {
                          // Проверяем, начинается ли слэш-команда либо после пробела/начала строки
                          if (slashIndex === 0 || /\s/.test(upToCursor[slashIndex - 1])) {
                            const query = upToCursor.slice(slashIndex + 1)
                            // Если до пробела или перевода строки нет, продолжаем
                            if (!/[\s\n]/.test(query)) {
                              setSlashMenuVisible(true)
                              setSlashQuery(query)
                            } else {
                              setSlashMenuVisible(false)
                              setSlashQuery("")
                            }
                          } else {
                            setSlashMenuVisible(false)
                            setSlashQuery("")
                          }
                        } else {
                          setSlashMenuVisible(false)
                          setSlashQuery("")
                        }

                        if (toolSelectionMode === 'auto' && value.trim()) {
                          setLastQueryAnalysis(analyzeUserQuery(value))
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

                {/* ОТОБРАЖЕНИЕ ВЫБРАННЫХ КАТЕГОРИЙ */}
                {toolSelectionMode === 'manual' && shownCategoryObjs.length > 0 && (
                  <div className={`flex flex-wrap gap-2 mt-2 mb-1 ${
                    isExpanded ? "grid grid-cols-3 gap-2" : ""
                  }`} title="Выбранные категории инструментов">
                    {shownCategoryObjs.map(cat => (
                      <span key={cat.id} className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
                        <span className="text-lg">{cat.icon}</span> {cat.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Status bar */}
                <div className={`flex items-center justify-between mt-2 text-sm text-gray-500 ${
                  isExpanded ? "flex-col gap-2 items-start" : ""
                }`}>
                                  <div className="flex items-center gap-2">
                  <span>Режим: {aiMode === "action" ? "⚡ Действие" : "🔍 Вопрос"}</span>
                  <span>•</span>
                  <span>
                    Модель: {modelOptions.find((m) => m.id === selectedModel)?.icon}{" "}
                    {selectedModel.includes("streaming") ? "Streaming" : "Standard"}
                  </span>
                  <span>•</span>
                  <span>Отчеты: {autoGenerateReports ? "✅" : "❌"}</span>
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
                    <span>{allTools.length} инструментов</span>
                  </div>
                </div>

                {/* Slash-меню инструментов */}
                {slashMenuVisible && allTools.length > 0 && (
                  <div className={`absolute bottom-20 left-4 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 animate-fade-in ${
                    isExpanded ? "w-96" : "w-72"
                  }`}>
                    {/* Специальные команды отчетов */}
                    {slashQuery.toLowerCase().includes('отчет') || slashQuery.toLowerCase().includes('report') ? (
                      <div>
                        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm font-medium text-blue-800">
                          📊 Команды отчетов
                        </div>
                        {[
                          { name: 'report_users', description: 'Статистика пользователей' },
                          { name: 'report_reservations', description: 'Статистика резервирований' },
                          { name: 'report_books', description: 'Статистика книг' },
                          { name: 'report_popular', description: 'Топ популярных книг' },
                          { name: 'report_all_users', description: 'Список всех пользователей' },
                          { name: 'report_all_books', description: 'Каталог всех книг' },
                          { name: 'report_all_reservations', description: 'Все резервирования' },
                          { name: 'report_overdue', description: 'Просроченные резервирования' }
                        ]
                        .filter(t => t.name.toLowerCase().includes(slashQuery.toLowerCase()) || 
                                   t.description.toLowerCase().includes(slashQuery.toLowerCase()))
                        .map(tool => (
                          <button
                            key={tool.name}
                            onClick={() => {
                              // Вставляем название инструмента вместо слэш-команды
                              const textarea = document.getElementById('ai-chat-textarea') as HTMLTextAreaElement | null
                              if (!textarea) return
                              const value = textarea.value
                              const cursorPos = textarea.selectionStart || value.length
                              const upToCursor = value.slice(0, cursorPos)
                              const slashIndex = upToCursor.lastIndexOf('/')
                              const before = value.slice(0, slashIndex)
                              const after = value.slice(cursorPos)
                              
                              // Специальная обработка для отчетов
                              const reportType = tool.name.replace('report_', '')
                              const newValue = `${before}Создай HTML-отчет для ${reportType}${after}`
                              setInputValue(newValue)
                              
                              setSlashMenuVisible(false)
                              setSlashQuery("")
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 flex flex-col"
                          >
                            <span className="font-medium text-gray-900">{tool.name}</span>
                            <span className="text-xs text-gray-600 truncate">{tool.description?.slice(0, 120)}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      allTools
                        .filter(t => t.name.toLowerCase().includes(slashQuery.toLowerCase()))
                        .slice(0, 30)
                        .map(tool => (
                          <button
                            key={tool.name}
                            onClick={() => {
                              // Вставляем название инструмента вместо слэш-команды
                              const textarea = document.getElementById('ai-chat-textarea') as HTMLTextAreaElement | null
                              if (!textarea) return
                              const value = textarea.value
                              const cursorPos = textarea.selectionStart || value.length
                              const upToCursor = value.slice(0, cursorPos)
                              const slashIndex = upToCursor.lastIndexOf('/')
                              const before = value.slice(0, slashIndex)
                              const after = value.slice(cursorPos)
                              
                              const newValue = `${before}${tool.name}(${after}`
                              setInputValue(newValue)
                              // Перемещаем курсор внутрь скобок
                              setTimeout(() => {
                                const pos = (before + tool.name + '(').length
                                textarea.focus()
                                textarea.setSelectionRange(pos, pos)
                              }, 0)
                              
                              setSlashMenuVisible(false)
                              setSlashQuery("")
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 flex flex-col"
                          >
                            <span className="font-medium text-gray-900">{tool.name}</span>
                            <span className="text-xs text-gray-600 truncate">{tool.description?.slice(0, 120)}</span>
                          </button>
                        ))
                    )}
                  </div>
                )}
                </div>
            </CardContent>

            {/* Enhanced History Modal */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <DialogContent className={`${
                isExpanded ? "max-w-6xl" : "max-w-4xl"
              } max-h-[80vh] overflow-hidden`}>
                <DialogHeader className="pb-4 border-b">
                  <DialogTitle className="flex items-center gap-2 text-2xl">
                    <HistoryIcon className="w-6 h-6 text-blue-500" />
                    История диалога
                  </DialogTitle>
                  {/* Фильтры и удаление старых чатов */}
                  <div className="flex gap-2 mt-3 items-center">
                    <Button
                      variant={historyFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHistoryFilter("all")}
                      className="text-sm"
                    >
                      🔍 Все
                    </Button>
                    <Button
                      variant={historyFilter === "changes" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHistoryFilter("changes")}
                      className="text-sm"
                    >
                      ✏️ Изменения
                    </Button>
                    <Button
                      variant={historyFilter === "reads" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHistoryFilter("reads")}
                      className="text-sm"
                    >
                      👁️ Чтение
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-4 text-sm"
                      onClick={async () => {
                        if (!window.confirm('Удалить все чаты старше 60 дней?')) return;
                        try {
                          const token = localStorage.getItem("token");
                          const res = await fetch(`${baseUrl}/api/DialogHistory/delete-old`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (res.ok) {
                            const data = await res.json();
                            alert(`Удалено чатов: ${data.deletedCount || data}`);
                            setIsHistoryOpen(false);
                            setTimeout(() => setIsHistoryOpen(true), 100);
                          } else {
                            alert("Ошибка удаления старых чатов");
                          }
                        } catch (e) {
                          alert("Ошибка удаления старых чатов");
                        }
                      }}
                    >
                      🗑️ Удалить чаты старше 60 дней
                    </Button>
                  </div>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                  {(() => {
                    if (historyData.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <HistoryIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium text-base">История пуста</p>
                          <p className="text-sm text-gray-400 mt-1">Начните диалог, чтобы увидеть историю</p>
                        </div>
                      );
                    }
                    
                    // Группируем по conversationId
                    const dialogsById = (historyData as any[]).reduce((acc: Record<string, any[]>, item: any) => {
                      const id = item.conversationId;
                      if (!acc[id]) acc[id] = [];
                      acc[id].push(item);
                      return acc;
                    }, {});
                    
                    return (
                      <div className="space-y-6">
                        {Object.entries(dialogsById)
                          .sort(([,itemsA], [,itemsB]) => {
                            // Последние диалоги сверху
                            const timeA = Math.max(...(itemsA as any[]).map((i: any) => new Date(i.timestamp).getTime()));
                            const timeB = Math.max(...(itemsB as any[]).map((i: any) => new Date(i.timestamp).getTime()));
                            return timeB - timeA;
                          })
                          .map(([convId, items]) => {
                            const messageGroups = groupByUserMessages(items as any[]);
                            const dialogTitle = getFirstUserMessage(items as any[]);
                            
                            // Применяем фильтр
                            const filteredGroups = messageGroups.map(group => ({
                              ...group,
                              tools: group.tools.filter(item => {
                                if (historyFilter === "changes") return hasDataChanges(item);
                                if (historyFilter === "reads") return !hasDataChanges(item);
                                return true;
                              })
                            })).filter(group => group.tools.length > 0);
                            
                            if (filteredGroups.length === 0) return null;
                            
                            return (
                              <details key={convId} className="border border-gray-200 rounded-xl bg-white shadow-sm" open={false}>
                                <summary className="flex justify-between items-center p-4 border-b cursor-pointer select-none hover:bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-gray-800 text-lg truncate max-w-[60vw]">{dialogTitle}</h3>
                                    <div className="flex gap-2">
                                      {filteredGroups.some(g => g.tools.some(hasDataChanges)) && (
                                        <Badge variant="destructive" className="text-xs">
                                          ✏️ Есть изменения
                                        </Badge>
                                      )}
                                      <Badge variant="secondary" className="text-xs">
                                        {filteredGroups.length} сообщений
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="opacity-50 hover:opacity-100 transition-opacity"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      try {
                                        const token = localStorage.getItem("token");
                                        await fetch(`${baseUrl}/api/DialogHistory?conversationId=${convId}`, {
                                          method: "DELETE",
                                          headers: { Authorization: `Bearer ${token}` },
                                        });
                                        setIsHistoryOpen(false);
                                        setTimeout(() => setIsHistoryOpen(true), 100);
                                      } catch (e) {
                                        alert("Ошибка удаления истории диалога");
                                      }
                                    }}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Удалить
                                  </Button>
                                </summary>
                                
                                <div className="p-4 space-y-6">
                                  {filteredGroups.map((group, groupIndex) => (
                                    <div key={groupIndex} className="space-y-3">
                                      {/* Сообщение пользователя */}
                                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                          <User className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-blue-800">Пользователь</span>
                                            <span className="text-sm text-blue-600">
                                              {group.timestamp.toLocaleString("ru-RU")}
                                            </span>
                                          </div>
                                          <p className="text-gray-800 whitespace-pre-wrap">{group.message}</p>
                                        </div>
                                      </div>
                                      
                                      {/* Инструменты для этого сообщения */}
                                      <div className="ml-8 space-y-3">
                                        {group.tools.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((item: any) => (
                                          <div key={item.id} className="bg-gray-50 rounded-lg border">
                                            {/* Заголовок с кнопкой откат/восстановление */}
                                            <div className="p-3 border-b bg-gray-100">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                  <div className={`w-3 h-3 rounded-full ${
                                                    hasDataChanges(item) ? "bg-orange-400" : "bg-green-400"
                                                  }`} />
                                                  <span className="font-medium text-gray-800">
                                                    {getActionDescription(item)}
                                                  </span>
                                                  {hasDataChanges(item) && (
                                                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                                      Изменение
                                                    </Badge>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                  <span className="text-sm text-gray-500">
                                                    {new Date(item.timestamp).toLocaleTimeString("ru-RU")}
                                                  </span>
                                                  {/* Кнопка откат/восстановление прямо в заголовке */}
                                                  {hasDataChanges(item) && (
                                                    <UndoManager
                                                      historyItem={item}
                                                      onUndoComplete={() => {
                                                        setIsHistoryOpen(false);
                                                        setTimeout(() => setIsHistoryOpen(true), 100);
                                                      }}
                                                    />
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {/* Содержимое - скрываемое под details */}
                                            <details className="bg-white" open={false}>
                                              <summary className="p-3 cursor-pointer select-none hover:bg-gray-50 text-sm text-gray-600 flex items-center gap-2">
                                                <Code className="w-4 h-4" />
                                                Показать детали операции
                                              </summary>
                                              
                                              <div className="p-3 border-t bg-white">
                                                {/* Параметры */}
                                                {item.parameters && item.parameters !== "null" && (
                                                  <div className="mb-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <Settings className="w-4 h-4 text-blue-500" />
                                                      <span className="text-sm font-medium text-gray-700">Параметры</span>
                                                    </div>
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                                                      {(() => {
                                                        const params = getReadableParameters(item.parameters);
                                                        if (typeof params === "object") {
                                                          return (
                                                            <div className="space-y-1">
                                                              {Object.entries(params).map(([key, value]) => (
                                                                <div key={key} className="flex items-start gap-2">
                                                                  <span className="font-mono text-blue-700 min-w-0 font-medium">
                                                                    {key}:
                                                                  </span>
                                                                  <span className="text-gray-800 break-all">
                                                                    {String(value)}
                                                                  </span>
                                                                </div>
                                                              ))}
                                                            </div>
                                                          );
                                                        }
                                                        return <span className="text-gray-600">{String(params)}</span>;
                                                      })()}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {/* До изменения */}
                                                {item.beforeState && item.beforeState !== "null" && hasDataChanges(item) && (
                                                  <div className="mb-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                                                      <span className="text-sm font-medium text-gray-700">До изменения</span>
                                                    </div>
                                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm font-mono max-h-32 overflow-y-auto">
                                                      <pre className="whitespace-pre-wrap text-gray-700">{item.beforeState}</pre>
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {/* Результат */}
                                                {item.afterState && item.afterState !== "null" && (
                                                  <div className="mb-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <Check className="w-4 h-4 text-green-500" />
                                                      <span className="text-sm font-medium text-gray-700">
                                                        {hasDataChanges(item) ? "После изменения" : "Результат"}
                                                      </span>
                                                    </div>
                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                                                      {(() => {
                                                        try {
                                                          const result = JSON.parse(item.afterState);
                                                          if (typeof result === "object" && result !== null) {
                                                            const keyFields = ["id", "fullName", "email", "title", "name", "status"];
                                                            const summary = keyFields.reduce((acc, field) => {
                                                              if (result[field] !== undefined) {
                                                                acc[field] = result[field];
                                                              }
                                                              return acc;
                                                            }, {} as any);
                                                            return Object.keys(summary).length > 0 ? (
                                                              <div className="space-y-1">
                                                                {Object.entries(summary).map(([key, value]) => (
                                                                  <div key={key} className="flex items-start gap-2">
                                                                    <span className="font-mono text-green-700 min-w-0 font-medium">
                                                                      {key}:
                                                                    </span>
                                                                    <span className="text-gray-800 break-all">
                                                                      {String(value)}
                                                                    </span>
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            ) : (
                                                              <span className="text-green-700 font-medium">
                                                                ✅ Операция выполнена успешно
                                                              </span>
                                                            );
                                                          }
                                                          return <span className="text-green-700">{String(result)}</span>;
                                                        } catch {
                                                          return <span className="text-green-700">{item.afterState}</span>;
                                                        }
                                                      })()}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {/* Technical details */}
                                                <details className="mt-3">
                                                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                                                    <Code className="w-4 h-4" />
                                                    Техническая информация
                                                  </summary>
                                                  <div className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono space-y-1">
                                                    <div>
                                                      <span className="text-blue-400">Инструмент:</span> {item.toolName}
                                                    </div>
                                                    <div>
                                                      <span className="text-green-400">Метод:</span> {item.httpMethod}
                                                    </div>
                                                    <div>
                                                      <span className="text-yellow-400">Эндпоинт:</span> {item.endpoint}
                                                    </div>
                                                  </div>
                                                </details>
                                              </div>
                                            </details>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            );
                          })
                          .filter(Boolean)}
                      </div>
                    );
                  })()}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </Card>
        </motion.div>
      )}
      {/* --- ВСТРАИВАЮ ToolSelectionDialog и UI в return --- */}
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
    </div>
  )
}
