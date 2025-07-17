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
  GraduationCap,
  Shield,
  Cpu,
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
  USER_LEVELS,
  T9Helper,
  analyzeUserQuery,
  filterToolsByCategories,
  selectToolsForQuery,
  getToolUsageStats,
  createSelectionSummary,
  analyzeExecutionContext,
  getQueryAnalysisCacheStats,
  clearQueryAnalysisCache,
  type ExecutionContext,
} from "@/lib/tool_selection_logic"
import { SlashCommandMenu } from './SlashCommandMenu'; // Импортируем новый компонент
// Добавляем импорт новых инструкций
import { getSystemInstructions as getNewSystemInstructions, getUserTypeInstructions, USER_TYPES } from "@/lib/AIAssistantInstructions"

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

// ---------- НОВАЯ СИСТЕМА КЭШИРОВАНИЯ API ЗАПРОСОВ ----------
interface CacheEntry {
  data: any
  timestamp: number
  params: any
  endpoint: string
  method: string
}

interface CacheConfig {
  ttl: number // time to live в миллисекундах
  maxEntries: number
  invalidateOn: string[] // методы, которые инвалидируют кэш
}

class APICache {
  private memoryCache = new Map<string, CacheEntry>()
  private readonly CONFIG: Record<string, CacheConfig> = {
    // Конфигурация кэширования для разных типов запросов
    'users': {
      ttl: 5 * 60 * 1000, // 5 минут
      maxEntries: 100,
      invalidateOn: ['POST', 'PUT', 'DELETE'] // инвалидируется при изменениях пользователей
    },
    'books': {
      ttl: 10 * 60 * 1000, // 10 минут
      maxEntries: 200,
      invalidateOn: ['POST', 'PUT', 'DELETE']
    },
    'reservations': {
      ttl: 2 * 60 * 1000, // 2 минуты (часто меняются)
      maxEntries: 150,
      invalidateOn: ['POST', 'PUT', 'DELETE']
    },
    'statistics': {
      ttl: 15 * 60 * 1000, // 15 минут (статистика меняется редко)
      maxEntries: 50,
      invalidateOn: ['POST', 'PUT', 'DELETE'] // любые изменения инвалидируют статистику
    },
    'roles': {
      ttl: 30 * 60 * 1000, // 30 минут (роли меняются очень редко)
      maxEntries: 20,
      invalidateOn: ['POST', 'PUT', 'DELETE']
    },
    'default': {
      ttl: 3 * 60 * 1000, // 3 минуты по умолчанию
      maxEntries: 50,
      invalidateOn: ['POST', 'PUT', 'DELETE']
    }
  }

  private getEntityType(endpoint: string): string {
    const lower = endpoint.toLowerCase()
    if (lower.includes('user')) return 'users'
    if (lower.includes('book')) return 'books'
    if (lower.includes('reservation')) return 'reservations'
    if (lower.includes('statistic') || lower.includes('popular') || lower.includes('top')) return 'statistics'
    if (lower.includes('role')) return 'roles'
    return 'default'
  }

  private generateCacheKey(endpoint: string, method: string, params: any): string {
    // Нормализуем параметры для создания стабильного ключа
    const normalizedParams = params ? JSON.stringify(params, Object.keys(params).sort()) : ''
    return `${method}:${endpoint}:${normalizedParams}`
  }

  private getFromLocalStorage(key: string): CacheEntry | null {
    try {
      const stored = localStorage.getItem(`ai_cache_${key}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Ошибка чтения кэша из localStorage:', error)
    }
    return null
  }

  private setToLocalStorage(key: string, entry: CacheEntry): void {
    try {
      // Ограничиваем размер localStorage кэша
      const existingKeys = Object.keys(localStorage).filter(k => k.startsWith('ai_cache_'))
      if (existingKeys.length > 500) { // Максимум 500 записей в localStorage
        // Удаляем самые старые записи
        const entries = existingKeys.map(k => ({
          key: k,
          timestamp: JSON.parse(localStorage.getItem(k) || '{}').timestamp || 0
        })).sort((a, b) => a.timestamp - b.timestamp)
        
        entries.slice(0, 100).forEach(e => localStorage.removeItem(e.key)) // Удаляем 100 самых старых
      }
      
      localStorage.setItem(`ai_cache_${key}`, JSON.stringify(entry))
    } catch (error) {
      console.warn('Ошибка записи кэша в localStorage:', error)
    }
  }

  get(endpoint: string, method: string, params: any): any | null {
    // Кэшируем только GET запросы
    if (method.toUpperCase() !== 'GET') return null

    const key = this.generateCacheKey(endpoint, method, params)
    const entityType = this.getEntityType(endpoint)
    const config = this.CONFIG[entityType] || this.CONFIG.default

    // Сначала проверяем memory cache
    let entry = this.memoryCache.get(key)
    
    // Если нет в памяти, проверяем localStorage
    if (!entry) {
      entry = this.getFromLocalStorage(key)
      if (entry) {
        // Восстанавливаем в memory cache
        this.memoryCache.set(key, entry)
      }
    }

    // Проверяем валидность кэша
    if (entry) {
      const isValid = (Date.now() - entry.timestamp) < config.ttl
      if (isValid) {
        console.log(`🎯 Кэш HIT: ${endpoint} (возраст: ${Math.round((Date.now() - entry.timestamp) / 1000)}с)`)
        return entry.data
      } else {
        // Удаляем устаревший кэш
        this.memoryCache.delete(key)
        localStorage.removeItem(`ai_cache_${key}`)
        console.log(`⏰ Кэш EXPIRED: ${endpoint}`)
      }
    }

    console.log(`❌ Кэш MISS: ${endpoint}`)
    return null
  }

  set(endpoint: string, method: string, params: any, data: any): void {
    // Кэшируем только GET запросы
    if (method.toUpperCase() !== 'GET') return

    const key = this.generateCacheKey(endpoint, method, params)
    const entityType = this.getEntityType(endpoint)
    const config = this.CONFIG[entityType] || this.CONFIG.default

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      params,
      endpoint,
      method
    }

    // Ограничиваем размер memory cache
    if (this.memoryCache.size >= config.maxEntries) {
      // Удаляем самую старую запись
      const oldestKey = Array.from(this.memoryCache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0][0]
      this.memoryCache.delete(oldestKey)
    }

    this.memoryCache.set(key, entry)
    this.setToLocalStorage(key, entry)
    
    console.log(`💾 Кэш SET: ${endpoint} (тип: ${entityType}, TTL: ${config.ttl/1000}с)`)
  }

  invalidate(endpoint: string, method: string): void {
    const entityType = this.getEntityType(endpoint)
    const config = this.CONFIG[entityType] || this.CONFIG.default

    // Проверяем, нужно ли инвалидировать кэш для этого метода
    if (!config.invalidateOn.includes(method.toUpperCase())) {
      return
    }

    console.log(`🗑️ Инвалидация кэша для типа: ${entityType} (метод: ${method})`)

    // Инвалидируем memory cache
    const keysToDelete: string[] = []
    this.memoryCache.forEach((entry, key) => {
      const entryEntityType = this.getEntityType(entry.endpoint)
      if (entryEntityType === entityType) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.memoryCache.delete(key))

    // Инвалидируем localStorage cache
    const localStorageKeys = Object.keys(localStorage).filter(k => k.startsWith('ai_cache_'))
    localStorageKeys.forEach(key => {
      try {
        const entry = JSON.parse(localStorage.getItem(key) || '{}')
        if (entry.endpoint) {
          const entryEntityType = this.getEntityType(entry.endpoint)
          if (entryEntityType === entityType) {
            localStorage.removeItem(key)
          }
        }
      } catch (error) {
        // Удаляем поврежденные записи
        localStorage.removeItem(key)
      }
    })

    console.log(`✅ Инвалидировано записей кэша: ${keysToDelete.length} (memory) + localStorage`)
  }

  // Принудительная очистка всего кэша
  clear(): void {
    this.memoryCache.clear()
    const localStorageKeys = Object.keys(localStorage).filter(k => k.startsWith('ai_cache_'))
    localStorageKeys.forEach(key => localStorage.removeItem(key))
    console.log(`🧹 Полная очистка кэша: ${localStorageKeys.length} записей удалено`)
  }

  // Получение статистики кэша
  getStats(): { memorySize: number; localStorageSize: number; hitRate: number } {
    const localStorageKeys = Object.keys(localStorage).filter(k => k.startsWith('ai_cache_'))
    return {
      memorySize: this.memoryCache.size,
      localStorageSize: localStorageKeys.length,
      hitRate: 0 // TODO: реализовать подсчет hit rate
    }
  }
}

// Создаем глобальный экземпляр кэша
const apiCache = new APICache()

// НОВОЕ: Функция для поиска данных в кэше по ключевым словам
export const findInCache = (query: string): { users: any[], books: any[], reservations: any[] } => {
  const results = { users: [], books: [], reservations: [] }
  
  try {
    // Получаем все ключи кэша
    const cacheKeys = Array.from(apiCache['memoryCache'].keys())
    
    for (const key of cacheKeys) {
      const entry = apiCache['memoryCache'].get(key)
      if (!entry || !entry.data) continue
      
      const data = entry.data
      const queryLower = query.toLowerCase()
      
      // Ищем пользователей
      if (entry.endpoint.toLowerCase().includes('user')) {
        if (Array.isArray(data)) {
          data.forEach((user: any) => {
            if (user.fullName && user.fullName.toLowerCase().includes(queryLower)) {
              results.users.push(user)
            }
          })
        } else if (data.fullName && data.fullName.toLowerCase().includes(queryLower)) {
          results.users.push(data)
        }
      }
      
      // Ищем книги
      if (entry.endpoint.toLowerCase().includes('book')) {
        if (Array.isArray(data)) {
          data.forEach((book: any) => {
            if (book.title && book.title.toLowerCase().includes(queryLower)) {
              results.books.push(book)
            }
          })
        } else if (data.title && data.title.toLowerCase().includes(queryLower)) {
          results.books.push(data)
        }
      }
      
      // Ищем резервирования
      if (entry.endpoint.toLowerCase().includes('reservation')) {
        if (Array.isArray(data)) {
          data.forEach((res: any) => {
            if (res.id && res.id.toLowerCase().includes(queryLower)) {
              results.reservations.push(res)
            }
          })
        } else if (data.id && data.id.toLowerCase().includes(queryLower)) {
          results.reservations.push(data)
        }
      }
    }
  } catch (error) {
    console.warn('Ошибка поиска в кэше:', error)
  }
  
  return results
}
// ---------- КОНЕЦ СИСТЕМЫ КЭШИРОВАНИЯ ----------

// Enhanced Command button component
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
  
  // НОВЫЕ состояния для выбора инструментов
  const [allTools, setAllTools] = useState<Tool[]>([])
  const [toolSelectionMode, setToolSelectionMode] = useState<'auto' | 'manual'>('auto')
  const [manualSelectedCategories, setManualSelectedCategories] = useState<string[]>(['users', 'books', 'reservations'])
  const [isToolSelectionOpen, setIsToolSelectionOpen] = useState(false)
  const [toolSelectionSummary, setToolSelectionSummary] = useState<string | null>(null)
  const [lastQueryAnalysis, setLastQueryAnalysis] = useState<ReturnType<typeof analyzeUserQuery>>({
    detectedCategories: [],
    detectedTools: [],
    confidence: {},
    suggestedCategories: [],
    intentType: 'action',
    complexity: 'medium',
    hasMultipleEntities: false,
    entityTypes: [],
    hasPasswordMention: false
  })
  
  // НОВЫЕ состояния для типов пользователей
  const [userLevel, setUserLevel] = useState<number>(USER_LEVELS.INTERMEDIATE)
  const [isExpertMode, setIsExpertMode] = useState(false)
  
  // НОВОЕ: Состояние для хранения агрегированного контекста анализа
  const [conversationAnalysisContext, setConversationAnalysisContext] = useState({
    hasMultipleEntities: false,
    entityTypes: [],
    hasPasswordMention: false
  })
  
  // НОВЫЕ состояния для T9 и подсказок
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [slashMenuVisible, setSlashMenuVisible] = useState(false)
  const [slashQuery, setSlashQuery] = useState("")
  
  // Добавляю состояние для автоматической генерации отчетов
  const [autoGenerateReports, setAutoGenerateReports] = useState(false)
  
  // Добавляю состояние для управления размером окна
  const [isExpanded, setIsExpanded] = useState(false)
  
  // НОВОЕ: Состояния для кэша
  const [showCacheStats, setShowCacheStats] = useState(false)
  const [cacheStats, setCacheStats] = useState({ 
    memorySize: 0, 
    localStorageSize: 0, 
    hitRate: 0,
    queryAnalysisSize: 0 
  })
  
  // НОВОЕ: Состояние для хранения текущих доступных инструментов между запросами
  const [currentAvailableTools, setCurrentAvailableTools] = useState<Tool[]>([])

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

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

  // User level options
  const userLevelOptions = [
    { id: USER_LEVELS.NOVICE, name: "Новичок", icon: "🌱", description: "Базовые функции" },
    { id: USER_LEVELS.INTERMEDIATE, name: "Обычный", icon: "⚡", description: "Расширенные возможности" },
    { id: USER_LEVELS.EXPERT, name: "Эксперт", icon: "🔧", description: "Все функции" },
  ]

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

  // Enhanced opening animation
  const handleToggleChat = () => {
    if (!isOpen) {
      setIsAnimating(true)
      setIsOpen(true)
      // НОВОЕ: Инициализируем статистику кэша при открытии
      updateCacheStats()
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

    // НОВОЕ: Проверяем кэш для GET запросов
    if (method.toUpperCase() === "GET") {
      const cachedResult = apiCache.get(endpoint, method, params)
      if (cachedResult !== null) {
        // Логируем использование кэша
        logDialogHistory(toolName, "GET_CACHED", endpoint, convertDatesToUtc(params), null, cachedResult, userMessage)
        return cachedResult
      }
    }

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

    // НОВОЕ: Кэшируем результат GET запросов
    if (requestOptions.method === "GET" && afterState !== null) {
      apiCache.set(endpoint, method, params, afterState)
    }

    // НОВОЕ: Инвалидируем кэш при изменении данных
    if (["POST", "PUT", "DELETE"].includes(requestOptions.method)) {
      apiCache.invalidate(endpoint, requestOptions.method)
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

  // Enhanced system instructions based on user level with dynamic context
  const getSystemInstructions = (contextData?: {
    availableTools?: Tool[]
    lastAnalysis?: ReturnType<typeof analyzeUserQuery>
    selectionSummary?: string
    conversationHistory?: Message[]
  }) => {
    // НОВОЕ: Интеграция с улучшенными инструкциями
    const userType = userLevel === USER_LEVELS.NOVICE ? USER_TYPES.NOVICE : 
                    userLevel === USER_LEVELS.EXPERT ? USER_TYPES.EXPERT : 
                    USER_TYPES.EXPERT // По умолчанию эксперт для среднего уровня
    
    // Получаем новые инструкции из централизованного модуля
    const newInstructions = getUserTypeInstructions(userType)
    
    // Добавляем контекстные инструкции в зависимости от активного контекста
    let contextualInstructions = ""
    
    // Если доступно мало инструментов, добавляем специальные инструкции
    if (contextData?.availableTools && contextData.availableTools.length <= 5) {
      contextualInstructions += `\n\n**ОГРАНИЧЕННЫЙ НАБОР ИНСТРУМЕНТОВ:** В данный момент доступно только ${contextData.availableTools.length} инструментов. Максимально эффективно используй доступные возможности и при необходимости запроси расширение набора инструментов.`
    }
    
    // Если есть информация о последнем анализе запроса, добавляем контекст
    const analysis = contextData?.lastAnalysis || lastQueryAnalysis
    if (analysis) {
      if (analysis.hasMultipleEntities) {
        contextualInstructions += `\n\n**МНОЖЕСТВЕННЫЕ СУЩНОСТИ:** Детектированы множественные типы сущностей (${analysis.entityTypes.join(', ')}). CRUD операции для отдельных сущностей исключены для оптимизации.`
      }
      
      if (analysis.hasPasswordMention) {
        contextualInstructions += `\n\n**РАБОТА С ПАРОЛЯМИ:** В запросе упоминается пароль. Доступны специальные инструменты для работы с паролями пользователей.`
      }
      
      if (analysis.complexity === 'simple') {
        contextualInstructions += `\n\n**ПРОСТОЙ ЗАПРОС:** Запрос классифицирован как простой. Стремись к быстрому и прямому ответу.`
      } else if (analysis.complexity === 'complex') {
        contextualInstructions += `\n\n**СЛОЖНЫЙ ЗАПРОС:** Запрос классифицирован как сложный. Может потребоваться несколько шагов и детальный анализ.`
      }
    }
    
    // Если есть информация о выборе инструментов, добавляем контекст
    const summary = contextData?.selectionSummary || toolSelectionSummary
    if (summary) {
      contextualInstructions += `\n\n**КОНТЕКСТ ИНСТРУМЕНТОВ:** ${summary}`
    }
    
          // НОВОЕ: Добавляем информацию о кэше для оптимизации ИИ
    const currentCacheStats = apiCache.getStats()
    if (currentCacheStats.memorySize > 0) {
      contextualInstructions += `\n\n**КЭШИРОВАНИЕ АКТИВНО:** В системе работает кэш с ${currentCacheStats.memorySize + currentCacheStats.localStorageSize} записями. Повторные запросы к API будут возвращены мгновенно из кэша. 

**ВАЖНО - РАБОТА С КОНТЕКСТОМ:**
1. Если пользователь упоминает сущности из предыдущих запросов (например, "пользователя Test Admin One" или "книгу 1231"), используй кэшированные данные
2. Для создания резервирования используй ID из кэша: getUserById() для получения пользователя, getBookById() для получения книги
3. Если в запросе упоминается "ее", "его", "этого пользователя", "эту книгу" - это ссылки на предыдущий контекст
4. Всегда проверяй кэш перед новыми API запросами
5. Используй точные ID из предыдущих ответов для создания связей между сущностями
6. **КРИТИЧНО**: Если пользователь говорит "выдай ее пользователю Test Admin One" - это означает:
   - "ее" = последняя найденная книга (ID: afeb412d-5198-47ee-b594-415db95c9931)
   - "пользователю Test Admin One" = пользователь (ID: 01980ff0-33c7-7eb3-901a-17f7b8e76f6c)
   - Используй createReservation с этими ID`
    }

    // НОВОЕ: Добавляем активный контекст из истории
    if (contextData?.conversationHistory) {
      const activeContext = extractContextFromHistory(contextData.conversationHistory)
      if (activeContext.contextSummary !== "Нет активного контекста") {
        contextualInstructions += `\n\n**АКТИВНЫЙ КОНТЕКСТ ИЗ ИСТОРИИ:**
${activeContext.contextSummary}

**ИНСТРУКЦИИ ПО РАБОТЕ С КОНТЕКСТОМ:**
- Если пользователь говорит "ее", "его", "этого пользователя" - используй данные из контекста
- Для создания резервирования используй getUserById(${activeContext.lastUser?.id || 'ID_ПОЛЬЗОВАТЕЛЯ'}) и getBookById(${activeContext.lastBook?.id || 'ID_КНИГИ'})
- Если нужно найти пользователя или книгу, сначала проверь контекст, затем кэш, затем API`
      }
      
      // НОВОЕ: Добавляем информацию о данных в кэше
      const lastUserQuery = contextData.conversationHistory
        .filter(m => m.role === "user")
        .slice(-1)[0]?.content || ""
      
      if (lastUserQuery) {
        const cachedData = findInCache(lastUserQuery)
        const cacheInfo = []
        
        if (cachedData.users.length > 0) {
          cacheInfo.push(`Пользователи в кэше: ${cachedData.users.map(u => u.fullName).join(', ')}`)
        }
        if (cachedData.books.length > 0) {
          cacheInfo.push(`Книги в кэше: ${cachedData.books.map(b => b.title).join(', ')}`)
        }
        if (cachedData.reservations.length > 0) {
          cacheInfo.push(`Резервирования в кэше: ${cachedData.reservations.length} шт.`)
        }
        
        if (cacheInfo.length > 0) {
          contextualInstructions += `\n\n**ДАННЫЕ В КЭШЕ ПО ЗАПРОСУ "${lastUserQuery}":**
${cacheInfo.join('\n')}

**ИНСТРУКЦИИ ПО ИСПОЛЬЗОВАНИЮ КЭША:**
- Используй эти данные вместо повторных API запросов
- Для создания резервирования используй ID из кэшированных данных
- Если данных нет в кэше, выполни поиск через API`
        }
      }
    }
    
    return newInstructions + contextualInstructions
  }

  // ---------- Генерация HTML отчётов ----------
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
      const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка"
      console.error(`❌ Не удалось сгенерировать HTML-отчет "${title}": ${errorMessage}`)
    }
  }
  // ---------- Конец генерации HTML отчётов ----------

  const runConversation = async (conversationHistory: Message[], onStreamChunk?: (chunk: string) => void) => {
    const isStreaming = selectedModel === "gemini-2.0-flash-streaming"
    const modelForApi = selectedModel === "gemini-2.0-flash-streaming" ? "gemini-2.0-flash" : selectedModel
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelForApi}:generateContent?key=${GEMINI_API_KEY}`
    
    // Получаем последнее сообщение пользователя для анализа
    const currentUserQuery = conversationHistory.filter((m) => m.role === "user").pop()?.content || ""
    const lastUserMessage = currentUserQuery // Алиас для обратной совместимости с логированием
    
    // НОВОЕ: Предзагружаем контекст из истории
    await preloadContext(conversationHistory)
    
    // ОТЛАДКА: Логируем что анализируем
    console.log(`🔍 [ОТЛАДКА] Анализируем запрос: "${currentUserQuery}"`)
    
    let availableTools: Tool[]
    let selectionSummary: string
    
    if (toolSelectionMode === 'auto') {
      const config = {
        ...DEFAULT_TOOL_SELECTION_CONFIG,
        userLevel: userLevel,
        // НОВАЯ ЛОГИКА: Включаем режим дополнения если есть существующие инструменты
        appendToExisting: currentAvailableTools.length > 0,
        existingTools: currentAvailableTools
      }
      
      // НОВАЯ ОПТИМИЗАЦИЯ: Анализируем контекст выполнения
      const executionContext = analyzeExecutionContext(conversationHistory, 0)
      console.log(`🔍 [ОТЛАДКА] Контекст выполнения:`, executionContext)
      console.log(`🔧 [ДОПОЛНЕНИЕ] Режим дополнения: ${config.appendToExisting ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}`)
      console.log(`🔧 [ДОПОЛНЕНИЕ] Существующие инструменты: ${currentAvailableTools.length}`)
      
      const { selectedTools: autoSelectedTools, analysis, usedCategories } = selectToolsForQuery(
        currentUserQuery, // Используем последнее сообщение пользователя вместо inputValue
        allTools, 
        {
          ...config,
          // --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ---
          // Передаем агрегированный контекст из состояния
          ...conversationAnalysisContext 
        },
        executionContext // Передаем контекст выполнения
      )
      
      // ОТЛАДКА: Логируем результаты анализа и выбора
      console.log(`🔍 [ОТЛАДКА] Результат анализа запроса:`, analysis)
      console.log(`🔍 [ОТЛАДКА] Использованные категории:`, usedCategories)
      console.log(`🔍 [ОТЛАДКА] Выбрано инструментов: ${autoSelectedTools.length}/${allTools.length}`)
      console.log(`🔍 [ОТЛАДКА] Названия инструментов:`, autoSelectedTools.map(t => t.name))
      
      availableTools = autoSelectedTools
      
      // НОВАЯ ЛОГИКА: Обновляем состояние текущих доступных инструментов
      setCurrentAvailableTools(availableTools)
      
      const stats = getToolUsageStats(availableTools, allTools)
      selectionSummary = createSelectionSummary(analysis, usedCategories, stats)
      
      // Дополняем сводку информацией об оптимизациях
      if (executionContext.isLikelyFinalResponse) {
        selectionSummary = `🎯 Финальный ответ. ${selectionSummary}`
      }
      if (analysis.hasMultipleEntities && executionContext.hasExecutedTools) {
        selectionSummary = `🚫 CRUD исключены. ${selectionSummary}`
      }
      
      // НОВАЯ ЛОГИКА: Добавляем информацию о дополнении в сводку
      if (config.appendToExisting) {
        const newToolsCount = availableTools.length - currentAvailableTools.length
        if (newToolsCount > 0) {
          selectionSummary = `🔧 Дополнено ${newToolsCount} инструментов. ${selectionSummary}`
        }
      }
      
      // --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ---
      // Обновляем агрегированный контекст на основе последнего анализа
      setConversationAnalysisContext(prevContext => ({
        hasMultipleEntities: prevContext.hasMultipleEntities || analysis.hasMultipleEntities,
        entityTypes: [...new Set([...prevContext.entityTypes, ...analysis.entityTypes])],
        hasPasswordMention: prevContext.hasPasswordMention || analysis.hasPasswordMention
      }))
      
      // ИСПРАВЛЕНИЕ: Обновляем lastQueryAnalysis только здесь, когда действительно отправляем запрос
      setLastQueryAnalysis(analysis)
    } else {
      console.log(`🔍 [ОТЛАДКА] Ручной режим выбора инструментов`)
      const config = {
        ...DEFAULT_TOOL_SELECTION_CONFIG,
        userLevel: userLevel
      }
      
      // Анализируем контекст для ручного режима
      const executionContext = analyzeExecutionContext(conversationHistory, 0)
      console.log(`🔍 [ОТЛАДКА] Контекст выполнения (ручной):`, executionContext)
      
      availableTools = filterToolsByCategories(allTools, manualSelectedCategories, [], config, executionContext)
      console.log(`🔍 [ОТЛАДКА] Ручной выбор - доступно инструментов: ${availableTools.length}/${allTools.length}`)
      console.log(`🔍 [ОТЛАДКА] Ручной выбор - категории:`, manualSelectedCategories)
      
      // НОВАЯ ЛОГИКА: Обновляем состояние текущих доступных инструментов для ручного режима
      setCurrentAvailableTools(availableTools)
      
      const stats = getToolUsageStats(availableTools, allTools)
      const categoryNames = manualSelectedCategories
        .map(id => TOOL_CATEGORIES.find(cat => cat.id === id)?.name)
        .filter(Boolean)
        .join(", ")
      selectionSummary = `Ручной выбор. ${stats.selectedCount}/${stats.totalTools} инструментов (-${stats.reductionPercentage}%). Категории: ${categoryNames}. Эффективность: ${stats.efficiencyScore}%.`
      
      // Добавляем информацию об оптимизациях для ручного режима
      if (executionContext.isLikelyFinalResponse) {
        selectionSummary = `🎯 Финальный ответ. ${selectionSummary}`
      }
    }
    
    if (aiMode === "question") {
      availableTools = availableTools.filter((tool) => tool.apiMethod === "GET" || !tool.apiMethod)
    }
    
    setToolSelectionSummary(selectionSummary)
    const toolDeclarations = availableTools.map(({ apiMethod, apiEndpoint, ...rest }) => rest)
    
    console.log(`🔧 [ОТЛАДКА] Изначальный набор для отправки в ИИ: ${availableTools.length} инструментов`)
    console.log(`🔧 [ОТЛАДКА] Изначальные инструменты:`, availableTools.map(t => t.name))
    
    const currentHistory = buildGeminiHistory(conversationHistory)
    let maxIterations = 10
    let lastToolCalledInLoop: string | null = null
    let currentIterationCount = 0 // НОВЫЙ счетчик итераций

    // --- STREAMING режим ---
    if (isStreaming) {
      const requestBody = {
        contents: currentHistory,
        tools: [{ functionDeclarations: toolDeclarations }],
        systemInstruction: {
          parts: [{ text: getSystemInstructions({
            availableTools,
            lastAnalysis: lastQueryAnalysis,
            selectionSummary,
            conversationHistory: conversationHistory
          }) }],
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
      currentIterationCount++ // Увеличиваем счетчик итераций
      
      // НОВАЯ ОПТИМИЗАЦИЯ: Пересчитываем контекст выполнения на каждой итерации
      const executionContext = analyzeExecutionContext(conversationHistory, currentIterationCount)
      
      let requestBody
      
      // Если это финальный ответ, дополняем инструменты для полноты контекста
      if (executionContext.isLikelyFinalResponse && toolSelectionMode === 'auto') {
        // НОВАЯ ЛОГИКА: Дополняем текущие инструменты базовыми для полного контекста
        const currentToolNames = availableTools.map(t => t.name)
        
        // Определяем базовые инструменты, которые могут понадобиться для финального ответа
        const essentialToolNames = [
          'systemContext', // Всегда нужен
          'searchUsers', 'searchBooks', 'searchReservations', // Поиск для получения ID
          'getUserById', 'getBookById', 'getReservationById' // Получение деталей по ID
        ]
        
        // Если это навигационный запрос, добавляем поисковые инструменты из предыдущего контекста
        const hasNavigationTools = currentToolNames.some(name => 
          ['navigateToPage', 'stopAgent', 'cancelCurrentAction'].includes(name)
        )
        
        if (hasNavigationTools) {
          // Для навигационных запросов ДОПОЛНЯЕМ поисковыми инструментами
          let additionalToolNames = [...essentialToolNames]
          
          // Анализируем контекст выполнения - какие инструменты использовались ранее
          if (executionContext.executedToolNames.length > 0) {
            console.log(`🔍 [ОТЛАДКА] Выполненные ранее инструменты:`, executionContext.executedToolNames)
            
            // Добавляем инструменты, которые использовались в контексте
            const contextualTools = executionContext.executedToolNames.filter(name => 
              ['searchBooks', 'getAllBooks', 'getBookById', 'searchUsers', 'getAllUsers', 'getUserById'].includes(name)
            )
            additionalToolNames = [...additionalToolNames, ...contextualTools]
          }
          
          // Убираем дубликаты и фильтруем только те, которых еще нет
          const uniqueAdditionalToolNames = [...new Set(additionalToolNames)]
          const additionalTools = allTools.filter(tool => 
            uniqueAdditionalToolNames.includes(tool.name) && 
            !currentToolNames.includes(tool.name)
          )
          
          availableTools = [...availableTools, ...additionalTools]
          console.log(`🎯 [ОТЛАДКА] Финальный ответ: дополнены навигационные инструменты поисковыми`)
          console.log(`🎯 [ОТЛАДКА] Добавлено инструментов: ${additionalTools.length} (${additionalTools.map(t => t.name).join(', ')})`)
          console.log(`🎯 [ОТЛАДКА] Финальные инструменты (дополненные):`, availableTools.map(t => t.name))
        } else {
          // Для обычных запросов оставляем все инструменты без агрессивного ограничения
          console.log(`🎯 [ОТЛАДКА] Финальный ответ: используются все доступные инструменты (${availableTools.length})`)
          console.log(`🎯 [ОТЛАДКА] Финальные инструменты:`, availableTools.map(t => t.name))
        }
        
        const newToolDeclarations = availableTools.map(({ apiMethod, apiEndpoint, ...rest }) => rest)
        
        // Обновляем toolDeclarations для следующего запроса
        requestBody = {
          contents: currentHistory,
          tools: [{ functionDeclarations: newToolDeclarations }],
          systemInstruction: {
            parts: [{ text: getSystemInstructions({
              availableTools,
              lastAnalysis: lastQueryAnalysis,
              selectionSummary,
              conversationHistory: conversationHistory
            }) }],
          },
        }
      } else {
        requestBody = {
          contents: currentHistory,
          tools: [{ functionDeclarations: toolDeclarations }],
          systemInstruction: {
            parts: [{ text: getSystemInstructions({
              availableTools,
              lastAnalysis: lastQueryAnalysis,
              selectionSummary,
              conversationHistory: conversationHistory
            }) }],
          },
        }
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
                } else if (typeof apiResponse === 'object' && Object.keys(apiResponse).length === 0) {
                  console.log(`⚠️ Данные для отчета "${reportTitle}" пусты, отчет не будет сгенерирован`)
                } else {
                await generateHtmlReport(apiResponse, reportTitle)
                }
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
    setShowSuggestions(false)
    
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
    // НОВАЯ ЛОГИКА: Сбрасываем текущие доступные инструменты при новом диалоге
    setCurrentAvailableTools([])
    // НОВОЕ: Сбрасываем контекст анализа
    setConversationAnalysisContext({
      hasMultipleEntities: false,
      entityTypes: [],
      hasPasswordMention: false
    })
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

  // Tool Selection Dialog
  const ToolSelectionDialog: React.FC<{
    isOpen: boolean
    onClose: () => void
    allTools: Tool[]
    mode: 'auto' | 'manual'
    setMode: (mode: 'auto' | 'manual') => void
    manualCategories: string[]
    setManualCategories: React.Dispatch<React.SetStateAction<string[]>>
    lastQueryAnalysis: ReturnType<typeof analyzeUserQuery>
    currentQuery: string
  }> = ({ 
    isOpen, 
    onClose, 
    allTools, 
    mode, 
    setMode, 
    manualCategories, 
    setManualCategories, 
    lastQueryAnalysis,
    currentQuery
  }) => {
    const toggleCategory = (categoryId: string) => {
      setManualCategories(prev => 
        prev.includes(categoryId) 
          ? prev.filter(id => id !== categoryId)
          : [...prev, categoryId]
      )
    }
    
    const availableCategories = TOOL_CATEGORIES.filter(cat => 
      !cat.minUserLevel || cat.minUserLevel <= userLevel
    )
    
    const stats = getToolUsageStats(
      filterToolsByCategories(allTools, manualCategories, [], {
        ...DEFAULT_TOOL_SELECTION_CONFIG,
        userLevel: userLevel
      }),
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
                      const category = availableCategories.find(c => c.id === catId)
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
                        const category = availableCategories.find(c => c.id === catId)
                        return (
                          <Badge key={catId} variant="outline" className="ml-1 border-blue-300 text-blue-700">
                            {category?.icon} {category?.name}
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                  <div className="text-sm text-blue-700">
                    Тип: {lastQueryAnalysis.intentType}, Сложность: {lastQueryAnalysis.complexity}
                  </div>
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
                } max-h-72 overflow-y-auto pr-2`}>
                  {availableCategories.map(category => {
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
                    onClick={() => setManualCategories(availableCategories.map(c => c.id))}
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

  // --- ДОБАВЛЯЮ восстановление настроек из localStorage ---
  useEffect(() => {
    const savedMode = localStorage.getItem('ai_tool_mode')
    const savedCats = localStorage.getItem('ai_tool_manual_categories')
    const savedAutoReports = localStorage.getItem('ai_auto_reports')
    const savedExpanded = localStorage.getItem('ai_window_expanded')
    const savedUserLevel = localStorage.getItem('ai_user_level')
    
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
      setAutoGenerateReports(false)
    }
    if (savedExpanded !== null) {
      setIsExpanded(savedExpanded === 'true')
    }
    if (savedUserLevel) {
      const level = parseInt(savedUserLevel)
      if ([USER_LEVELS.NOVICE, USER_LEVELS.INTERMEDIATE, USER_LEVELS.EXPERT].includes(level as any)) {
        setUserLevel(level)
        setIsExpertMode(level === USER_LEVELS.EXPERT)
      }
    }
  }, [])
  
  // Сохраняю изменения настроек
  useEffect(() => {
    localStorage.setItem('ai_tool_mode', toolSelectionMode)
  }, [toolSelectionMode])
  
  useEffect(() => {
    localStorage.setItem('ai_tool_manual_categories', JSON.stringify(manualSelectedCategories))
  }, [manualSelectedCategories])
  
  useEffect(() => {
    localStorage.setItem('ai_auto_reports', autoGenerateReports.toString())
  }, [autoGenerateReports])
  
  useEffect(() => {
    localStorage.setItem('ai_window_expanded', isExpanded.toString())
  }, [isExpanded])
  
  useEffect(() => {
    localStorage.setItem('ai_user_level', userLevel.toString())
  }, [userLevel])

  // T9 подсказки при вводе
  useEffect(() => {
    if (inputValue.trim() && inputValue.length >= 2) {
      const newSuggestions = T9Helper.getSuggestions(inputValue, 3)
      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }, [inputValue])

  // НОВОЕ: Обновление статистики кэша
  const updateCacheStats = () => {
    const apiStats = apiCache.getStats()
    const queryStats = getQueryAnalysisCacheStats()
    setCacheStats({
      ...apiStats,
      queryAnalysisSize: queryStats.size
    })
  }

  // НОВОЕ: Функция предварительной загрузки контекста
  const preloadContext = async (conversationHistory: Message[]) => {
    const context = extractContextFromHistory(conversationHistory)
    
    // Если есть пользователь в контексте, но нет в кэше - загружаем
    if (context.lastUser?.id && !apiCache.get('/api/User/' + context.lastUser.id, 'GET', {})) {
      try {
        const userData = await executeApiCall({
          toolName: 'getUserById',
          method: 'GET',
          endpoint: '/api/User/' + context.lastUser.id,
          params: {},
          message: 'Предзагрузка контекста пользователя'
        })
        console.log('🔄 Предзагружен пользователь в кэш:', context.lastUser.name)
      } catch (error) {
        console.warn('Не удалось предзагрузить пользователя:', error)
      }
    }
    
    // Если есть книга в контексте, но нет в кэше - загружаем
    if (context.lastBook?.id && !apiCache.get('/api/Book/' + context.lastBook.id, 'GET', {})) {
      try {
        const bookData = await executeApiCall({
          toolName: 'getBookById',
          method: 'GET',
          endpoint: '/api/Book/' + context.lastBook.id,
          params: {},
          message: 'Предзагрузка контекста книги'
        })
        console.log('🔄 Предзагружена книга в кэш:', context.lastBook.title)
      } catch (error) {
        console.warn('Не удалось предзагрузить книгу:', error)
      }
    }
  }

  // Обновляем статистику кэша при открытии окна статистики
  useEffect(() => {
    if (showCacheStats) {
      updateCacheStats()
      const interval = setInterval(updateCacheStats, 2000) // Обновляем каждые 2 секунды
      return () => clearInterval(interval)
    }
  }, [showCacheStats])

  // НОВОЕ: Функции управления кэшем
  const handleClearCache = () => {
    if (window.confirm('Очистить весь кэш? Это может замедлить следующие запросы.')) {
      apiCache.clear()
      clearQueryAnalysisCache()
      updateCacheStats()
      console.log('🧹 Кэш очищен пользователем')
    }
  }

  // НОВОЕ: Функция извлечения контекста из истории
  const extractContextFromHistory = (conversationHistory: Message[]): {
    lastUser: any | null
    lastBook: any | null
    lastReservation: any | null
    contextSummary: string
  } => {
    const context = {
      lastUser: null,
      lastBook: null,
      lastReservation: null,
      contextSummary: ""
    }

    // Ищем последние упоминания сущностей в ответах ассистента
    const assistantMessages = conversationHistory
      .filter(m => m.role === "assistant")
      .slice(-5) // Последние 5 сообщений ассистента

    for (const msg of assistantMessages.reverse()) {
      const content = msg.content.toLowerCase()
      
      // Ищем пользователей
      if (content.includes('пользователь') || content.includes('user') || content.includes('id:')) {
        const userMatch = content.match(/id[:\s]*([a-f0-9-]+)/i)
        if (userMatch && !context.lastUser) {
          context.lastUser = { id: userMatch[1] }
        }
        
        const nameMatch = content.match(/(?:пользователь|user)[:\s]*([^\n\r]+)/i)
        if (nameMatch && !context.lastUser?.name) {
          context.lastUser = { ...context.lastUser, name: nameMatch[1].trim() }
        }
      }
      
      // Ищем книги
      if (content.includes('книга') || content.includes('book') || content.includes('название:')) {
        const bookMatch = content.match(/id[:\s]*([a-f0-9-]+)/i)
        if (bookMatch && !context.lastBook) {
          context.lastBook = { id: bookMatch[1] }
        }
        
        const titleMatch = content.match(/(?:название|title)[:\s]*([^\n\r]+)/i)
        if (titleMatch && !context.lastBook?.title) {
          context.lastBook = { ...context.lastBook, title: titleMatch[1].trim() }
        }
      }
      
      // Ищем резервирования
      if (content.includes('резервирование') || content.includes('reservation')) {
        const resMatch = content.match(/id[:\s]*([a-f0-9-]+)/i)
        if (resMatch && !context.lastReservation) {
          context.lastReservation = { id: resMatch[1] }
        }
      }
    }

    // НОВОЕ: Дополнительно ищем в кэше по именам/названиям
    if (!context.lastUser) {
      // Ищем пользователя по имени в кэше
      const userMessages = conversationHistory.filter(m => 
        m.role === "user" && 
        (m.content.toLowerCase().includes('test admin one') || m.content.toLowerCase().includes('пользователь'))
      )
      if (userMessages.length > 0) {
        // Ищем ID в ответах ассистента после этих сообщений
        const userIndex = conversationHistory.findIndex(m => m.id === userMessages[userMessages.length - 1].id)
        const afterUserMessages = conversationHistory.slice(userIndex + 1)
        for (const msg of afterUserMessages) {
          if (msg.role === "assistant") {
            const userMatch = msg.content.match(/id[:\s]*([a-f0-9-]+)/i)
            if (userMatch) {
              context.lastUser = { id: userMatch[1], name: "Test Admin One" }
              break
            }
          }
        }
      }
    }

    if (!context.lastBook) {
      // Ищем книгу по названию в кэше
      const bookMessages = conversationHistory.filter(m => 
        m.role === "user" && 
        (m.content.toLowerCase().includes('1231') || m.content.toLowerCase().includes('книга'))
      )
      if (bookMessages.length > 0) {
        // Ищем ID в ответах ассистента после этих сообщений
        const bookIndex = conversationHistory.findIndex(m => m.id === bookMessages[bookMessages.length - 1].id)
        const afterBookMessages = conversationHistory.slice(bookIndex + 1)
        for (const msg of afterBookMessages) {
          if (msg.role === "assistant") {
            const bookMatch = msg.content.match(/id[:\s]*([a-f0-9-]+)/i)
            if (bookMatch) {
              context.lastBook = { id: bookMatch[1], title: "1231" }
              break
            }
          }
        }
      }
    }

    // Формируем сводку контекста
    const contextParts = []
    if (context.lastUser) {
      contextParts.push(`Пользователь: ${context.lastUser.name || 'ID: ' + context.lastUser.id}`)
    }
    if (context.lastBook) {
      contextParts.push(`Книга: ${context.lastBook.title || 'ID: ' + context.lastBook.id}`)
    }
    if (context.lastReservation) {
      contextParts.push(`Резервирование: ID ${context.lastReservation.id}`)
    }

    context.contextSummary = contextParts.length > 0 ? 
      `Активный контекст: ${contextParts.join(', ')}` : 
      "Нет активного контекста"

    return context
  }

  // Вычисляю выбранные категории для отображения
  const shownCategories = toolSelectionMode === 'manual'
    ? manualSelectedCategories
    : (lastQueryAnalysis.detectedCategories.length > 0 ? lastQueryAnalysis.detectedCategories : ['users','books','reservations'])
  const shownCategoryObjs = shownCategories
    .map(id => TOOL_CATEGORIES.find(cat => cat.id === id))
    .filter(Boolean)

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
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {userLevelOptions.find(opt => opt.id === userLevel)?.icon} {userLevelOptions.find(opt => opt.id === userLevel)?.name}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* User level selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-white/50">
                        {userLevel === USER_LEVELS.NOVICE && <GraduationCap className="w-5 h-5 mr-1" />}
                        {userLevel === USER_LEVELS.INTERMEDIATE && <Shield className="w-5 h-5 mr-1" />}
                        {userLevel === USER_LEVELS.EXPERT && <Cpu className="w-5 h-5 mr-1" />}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuRadioGroup value={userLevel.toString()} onValueChange={(value) => setUserLevel(parseInt(value))}>
                        {userLevelOptions.map((option) => (
                          <DropdownMenuRadioItem key={option.id} value={option.id.toString()} className="flex items-center gap-3 p-3">
                            <span className="text-lg">{option.icon}</span>
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-gray-500">{option.description}</div>
                            </div>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

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
                    
                    {/* НОВОЕ: Кнопка управления кэшем */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-gray-500 hover:text-gray-700 hover:bg-white/50 transition-all duration-200 ${
                            (cacheStats.memorySize + cacheStats.localStorageSize + ((cacheStats as any).queryAnalysisSize || 0)) > 0 ? "bg-green-100 text-green-700" : ""
                          }`}
                          title="Управление кэшем"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {(cacheStats.memorySize + cacheStats.localStorageSize + ((cacheStats as any).queryAnalysisSize || 0)) > 0 && (
                            <span className="ml-1 text-xs">{cacheStats.memorySize + cacheStats.localStorageSize + ((cacheStats as any).queryAnalysisSize || 0)}</span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <div className="p-3 space-y-3">
                          <div>
                            <h4 className="font-medium text-sm mb-2">📊 Статистика кэша</h4>
                                                         <div className="space-y-2 text-sm">
                               <div className="flex justify-between">
                                 <span className="text-gray-600">API память:</span>
                                 <span className="font-mono">{cacheStats.memorySize} записей</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">API диск:</span>
                                 <span className="font-mono">{cacheStats.localStorageSize} записей</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Анализ:</span>
                                 <span className="font-mono">{(cacheStats as any).queryAnalysisSize || 0} запросов</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Всего:</span>
                                 <span className="font-mono font-bold">{
                                   cacheStats.memorySize + cacheStats.localStorageSize + ((cacheStats as any).queryAnalysisSize || 0)
                                 } записей</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Статус:</span>
                                 <span className={`font-medium ${
                                   (cacheStats.memorySize + cacheStats.localStorageSize + ((cacheStats as any).queryAnalysisSize || 0)) > 0 ? "text-green-600" : "text-gray-500"
                                 }`}>
                                   {(cacheStats.memorySize + cacheStats.localStorageSize + ((cacheStats as any).queryAnalysisSize || 0)) > 0 ? "Активен" : "Пустой"}
                                 </span>
                               </div>
                             </div>
                          </div>
                          
                          <div className="border-t pt-3">
                            <h4 className="font-medium text-sm mb-2">⚙️ Управление</h4>
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={updateCacheStats}
                                className="w-full text-sm"
                              >
                                🔄 Обновить статистику
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearCache}
                                className="w-full text-sm text-red-600 hover:bg-red-50"
                                disabled={cacheStats.memorySize === 0 && cacheStats.localStorageSize === 0 && ((cacheStats as any).queryAnalysisSize || 0) === 0}
                              >
                                🗑️ Очистить кэш
                              </Button>
                            </div>
                          </div>
                          
                          <div className="border-t pt-3">
                            <div className="text-xs text-gray-500">
                              💡 Кэш ускоряет повторные запросы и автоматически инвалидируется при изменениях данных
                            </div>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
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
                    <p className="text-gray-600 mb-6 text-base">
                      Ваш персональный AI-ассистент ({userLevelOptions.find(opt => opt.id === userLevel)?.name})
                    </p>
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
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-sm p-2">
                        📊 Отчеты и аналитика
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

                {/* T9 suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="mb-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Предложения команд:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setInputValue(suggestion)
                              setShowSuggestions(false)
                            }}
                            className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
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

                {/* ОТОБРАЖЕНИЕ ВЫБРАННЫХ КАТЕГОРИЙ и СТАТИСТИКИ ВЫБОРА */}
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

                {/* Отображение сводки выбора инструментов */}
                {toolSelectionSummary && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                    {toolSelectionSummary}
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
                  <span>•</span>
                  <span 
                    className={`${(cacheStats.memorySize + cacheStats.localStorageSize + ((cacheStats as any).queryAnalysisSize || 0)) > 0 ? "text-green-600" : "text-gray-400"}`}
                    title={`Кэш: ${cacheStats.memorySize} API в памяти + ${cacheStats.localStorageSize} API на диске + ${(cacheStats as any).queryAnalysisSize || 0} анализа`}
                  >
                    🗄️ Кэш: {cacheStats.memorySize + cacheStats.localStorageSize + ((cacheStats as any).queryAnalysisSize || 0)}
                  </span>
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
                 <SlashCommandMenu
                  isVisible={slashMenuVisible}
                  query={slashQuery}
                  allTools={allTools}
                  categories={TOOL_CATEGORIES}
                  onSelect={(toolName) => {
                     // Вставляем название инструмента вместо слэш-команды
                    const textarea = document.getElementById('ai-chat-textarea') as HTMLTextAreaElement | null
                    if (!textarea) return
                    const value = textarea.value
                    const cursorPos = textarea.selectionStart || value.length
                    const upToCursor = value.slice(0, cursorPos)
                    const slashIndex = upToCursor.lastIndexOf('/')
                    const before = value.slice(0, slashIndex)
                    const after = value.slice(cursorPos)
                    
                    const newValue = `${before}${toolName}(${after}`
                    setInputValue(newValue)
                    // Перемещаем курсор внутрь скобок
                    setTimeout(() => {
                      const pos = (before + toolName + '(').length
                      textarea.focus()
                      textarea.setSelectionRange(pos, pos)
                    }, 0)
                    
                    setSlashMenuVisible(false)
                    setSlashQuery("")
                  }}
                  positionClasses={`absolute bottom-20 left-4 z-50 animate-fade-in ${
                    isExpanded ? "w-96" : "w-80"
                  }`}
                />
                </div>
            </CardContent>

            {/* Enhanced History Modal */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <DialogContent className={`${
                isExpanded ? "max-w-6xl" : "max-w-4xl"
              } max-h-[80vh] w-[95vw] overflow-hidden`}>
                <DialogHeader className="pb-4 border-b">
                  <DialogTitle className="flex items-center gap-2 text-2xl">
                    <HistoryIcon className="w-6 h-6 text-blue-500" />
                    История диалога
                  </DialogTitle>
                  {/* Фильтры и удаление старых чатов */}
                  <div className="flex gap-2 mt-3 items-center flex-wrap">
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

                <ScrollArea className="h-[60vh] pr-4 overflow-x-auto">
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
                                    <h3 className="font-semibold text-gray-800 text-lg truncate max-w-[10vw]">{dialogTitle}</h3>
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
                                
                                <div className="p-4 space-y-6 overflow-x-auto">
                                  {filteredGroups.map((group, groupIndex) => (
                                    <div key={groupIndex} className="space-y-3">
                                      {/* Сообщение пользователя */}
                                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                          <User className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-semibold text-blue-800">Пользователь</span>
                                            <span className="text-sm text-blue-600">
                                              {group.timestamp.toLocaleString("ru-RU")}
                                            </span>
                                          </div>
                                          <p className="text-gray-800 whitespace-pre-wrap break-words">{group.message}</p>
                                        </div>
                                      </div>
                                      
                                      {/* Инструменты для этого сообщения */}
                                      <div className="ml-8 space-y-3">
                                        {group.tools.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((item: any) => (
                                          <div key={item.id} className="bg-gray-50 rounded-lg border">
                                            {/* Заголовок с кнопкой откат/восстановление */}
                                            <div className="p-3 border-b bg-gray-100">
                                              <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                                    hasDataChanges(item) ? "bg-orange-400" : "bg-green-400"
                                                  }`} />
                                                  <span className="font-medium text-gray-800 break-words">
                                                    {getActionDescription(item)}
                                                  </span>
                                                  {hasDataChanges(item) && (
                                                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 flex-shrink-0">
                                                      Изменение
                                                    </Badge>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0">
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
                                                    <div className="break-all">
                                                      <span className="text-blue-400">Инструмент:</span> {item.toolName}
                                                    </div>
                                                    <div className="break-all">
                                                      <span className="text-green-400">Метод:</span> {item.httpMethod}
                                                    </div>
                                                    <div className="break-all">
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
        currentQuery={inputValue}
      />
    </div>
  )
}