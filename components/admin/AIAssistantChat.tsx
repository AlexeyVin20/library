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
    if (lower.includes("role")) {
      if (lower.includes("get")) return "👥 Просмотр ролей"
      if (lower.includes("assign")) return "👥 Назначение ролей"
      return "👥 Работа с ролями"
    }

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
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Activity className="w-4 h-4 text-cyan-200 animate-pulse" />
              </div>
              <div>
                <span className="text-sm font-bold text-cyan-200 tracking-wider uppercase">Выполняется</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-white/80">Активно</span>
                </div>
              </div>
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

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
              <p className="text-lg text-white font-semibold min-h-[28px] flex items-center">
                {displayedToolName}
                {isTyping && <span className="ml-2 w-0.5 h-5 bg-white animate-pulse" />}
              </p>
            </div>

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

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const quickCommands = {
    learn: [
      "Зачем нужны полки в системе?",
      "Как создать пользователя?",
      "Как создать резервирование?",
      "Покажи страницу статистики",
    ],
    code: [
      "Покажи всех пользователей с ролью 'Сотрудник'",
      "Покажи все выданные бронирования",
      "Покажи все выданные экземпляры",
      "Покажи всех пользователей с книгами на руках",
    ],
    write: [
      "Создай отчет по выданным книгам",
      "Напиши уведомление о просроченной книге",
      "Составь список популярных книг",
      "Составь график резервирований",
    ],
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

          setTools(enhancedTools)
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

    if (isOpen && tools.length === 0) {
      loadTools()
    }
  }, [isOpen, tools.length])

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
      Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]))
    } else if (["POST", "PUT", "PATCH"].includes(requestOptions.method) && params) {
      requestOptions.body = JSON.stringify(params)
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

    logDialogHistory(toolName, requestOptions.method, endpoint, params, beforeState, afterState, userMessage)

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

    logDialogHistory(toolName, "FRONT", toolName, args ? JSON.stringify(args) : null, null, result.content, message)
    return result
  }

  const runConversation = async (conversationHistory: Message[], onStreamChunk?: (chunk: string) => void) => {
    const isStreaming = selectedModel === "gemini-2.0-flash-streaming"
    const modelForApi = selectedModel === "gemini-2.0-flash-streaming" ? "gemini-2.0-flash" : selectedModel
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelForApi}:generateContent?key=${GEMINI_API_KEY}`

    const availableTools =
      aiMode === "question" ? tools.filter((tool) => tool.apiMethod === "GET" || !tool.apiMethod) : tools

    const toolDeclarations = availableTools.map(({ apiMethod, apiEndpoint, ...rest }) => rest)
    const currentHistory = buildGeminiHistory(conversationHistory)
    let maxIterations = 10
    let lastToolCalledInLoop: string | null = null
    const lastUserMessage = conversationHistory.filter((m) => m.role === "user").pop()?.content || ""

    if (isStreaming) {
      const requestBody = {
        contents: currentHistory,
        tools: [{ functionDeclarations: toolDeclarations }],
        systemInstruction: {
          parts: [
            {
              text: `Текущая дата и время в UTC: ${new Date().toISOString()}. Используй это значение, когда в запросе упоминается 'сегодня' или 'текущая дата'. Ты работаешь от имени аутентифицированного пользователя. Все вызовы API, которые ты инициируешь, будут автоматически включать токен аутентификации. Тебе не нужно запрашивать токен или включать его в параметры вызова. Не спрашивай подтверждение своих действий, сразу выполняй. Форматируй свой ответ как обычный текст, без использования Markdown или специальных символов типа звездочек (*). Не завершай вызов инструментов, пока не выполнишь запрос до конца. Можно использовать до 10 инструментов без ограничений.`,
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

    // Non-streaming mode
    while (maxIterations > 0) {
      const requestBody = {
        contents: currentHistory,
        tools: [{ functionDeclarations: toolDeclarations }],
        systemInstruction: {
          parts: [
            {
              text: `Текущая дата и время в UTC: ${new Date().toISOString()}. Используй это значение, когда в запросе упоминается 'сегодня' или 'текущая дата'. Ты работаешь от имени аутентифицированного пользователя. Все вызовы API, которые ты инициируешь, будут автоматически включать токен аутентификации. Тебе не нужно запрашивать токен или включать его в параметры вызова. Не спрашивай подтверждение своих действий, сразу выполняй. Форматируй свой ответ как обычный текст, без использования Markdown или специальных символов типа звездочек (*). Не завершай вызов инструментов, пока не выполнишь запрос до конца. Можно использовать до 10 инструментов без ограничений.`,
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
            const toolDef = tools.find((t) => t.name === functionName)

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
              params: mutableArgs,
              message: lastUserMessage,
            })

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
        <div
          className={`transform transition-all duration-500 ease-out ${
            isAnimating ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
          }`}
        >
          <Card className="w-[520px] h-[650px] shadow-2xl bg-white/95 backdrop-blur-xl border-0 overflow-hidden">
            {/* Enhanced header */}
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src="/images/owl-svgrepo-com.svg" alt="Мудрая Сова" className="w-6 h-6" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 border border-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-800 text-xl font-bold">Мудрая Сова</CardTitle>
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
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-sm p-2">
                        📚 Управление книгами
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-sm p-2">
                        👤 Работа с пользователями
                      </Badge>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-sm p-2">
                        📅 Бронирования
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
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <CommandButton
                            icon={<BookOpen className="w-4 h-4" />}
                            label="Изучить"
                            isActive={activeCommandCategory === "learn"}
                            onClick={() =>
                              setActiveCommandCategory(
                                activeCommandCategory === "learn" ? null : "learn"
                              )
                            }
                          />
                          <CommandButton
                            icon={<Code className="w-4 h-4" />}
                            label="Действие"
                            isActive={activeCommandCategory === "code"}
                            onClick={() =>
                              setActiveCommandCategory(
                                activeCommandCategory === "code" ? null : "code"
                              )
                            }
                          />
                          <CommandButton
                            icon={<PenTool className="w-4 h-4" />}
                            label="Создать"
                            isActive={activeCommandCategory === "write"}
                            onClick={() =>
                              setActiveCommandCategory(
                                activeCommandCategory === "write" ? null : "write"
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
                                  {activeCommandCategory === "learn"
                                    ? "Вопросы для изучения"
                                    : activeCommandCategory === "code"
                                    ? "Команды действий"
                                    : "Создание контента"}
                                </h3>
                                <div className="space-y-2">
                                  {quickCommands[activeCommandCategory as keyof typeof quickCommands].map((command, index) => (
                                    <motion.button
                                      key={index}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.05 }}
                                      onClick={() => selectQuickCommand(command)}
                                      className="w-full text-left p-3 rounded-lg hover:bg-blue-50 transition-colors text-sm border border-transparent hover:border-blue-200"
                                    >
                                      {command}
                                    </motion.button>
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
              <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white/50">
                {/* Quick undo for last operation */}
                {lastOperation && (
                  <div className="mb-3">
                    <UndoManager historyItem={lastOperation} onUndoComplete={() => setLastOperation(null)} />
                  </div>
                )}

                {/* Action and Command buttons */}
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
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={statusMessage || "Напишите ваш вопрос или запрос..."}
                      disabled={isLoading || tools.length === 0}
                      className="pr-12 py-3 rounded-xl border-gray-200 focus:border-blue-300 focus:ring-blue-200 bg-white/80 backdrop-blur-sm text-base"
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
                    disabled={!isLoading && (!inputValue.trim() || tools.length === 0)}
                    className={`px-4 py-3 rounded-xl transition-all duration-200 ${
                      isLoading
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl hover:scale-105"
                    }`}
                  >
                    {isLoading ? <Pause className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>Режим: {aiMode === "action" ? "⚡ Действие" : "🔍 Вопрос"}</span>
                    <span>•</span>
                    <span>
                      Модель: {modelOptions.find((m) => m.id === selectedModel)?.icon}{" "}
                      {selectedModel.includes("streaming") ? "Streaming" : "Standard"}
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
                    <span>{tools.length} инструментов</span>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Enhanced History Modal */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader className="pb-4 border-b">
                  <DialogTitle className="flex items-center gap-2 text-2xl">
                    <HistoryIcon className="w-6 h-6 text-blue-500" />
                    История диалога
                  </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                  {historyData.length > 0 && (
                    <div className="flex justify-end mb-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem("token")
                            await fetch(`${baseUrl}/api/DialogHistory?conversationId=${conversationIdRef.current}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` },
                            })
                            setIsHistoryOpen(false)
                            setTimeout(() => setIsHistoryOpen(true), 100)
                          } catch (e) {
                            alert("Ошибка удаления истории диалога")
                          }
                        }}
                        className="shadow-sm hover:shadow-md transition-shadow"
                      >
                        🗑️ Удалить весь диалог
                      </Button>
                    </div>
                  )}

                  {historyData.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <HistoryIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium text-base">История пуста</p>
                      <p className="text-sm text-gray-400 mt-1">Начните диалог, чтобы увидеть историю</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(
                        (historyData as any[]).reduce((acc: Record<string, any[]>, item: any) => {
                          const id = item.conversationId
                          if (!acc[id]) {
                            acc[id] = []
                          }
                          acc[id].push(item)
                          return acc
                        }, {}),
                      ).map(([conversationId, items]: [string, any[]]) => (
                        <div key={conversationId} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                          <div className="flex justify-between items-center mb-4 pb-2 border-b">
                            <h3 className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Диалог: {conversationId}
                            </h3>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="opacity-50 hover:opacity-100 transition-opacity"
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem("token")
                                  await fetch(`${baseUrl}/api/DialogHistory?conversationId=${conversationId}`, {
                                    method: "DELETE",
                                    headers: { Authorization: `Bearer ${token}` },
                                  })
                                  setIsHistoryOpen(false)
                                  setTimeout(() => setIsHistoryOpen(true), 100)
                                } catch (e) {
                                  alert("Ошибка удаления истории диалога")
                                }
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Удалить диалог
                            </Button>
                          </div>

                          <div className="space-y-4">
                            {items.map((item: any) => (
                              <div
                                key={item.id}
                                className="p-3 bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-all duration-200 group rounded-lg border"
                              >
                                {/* Action header */}
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-gray-800 flex items-center gap-2 text-lg">
                                    {getActionDescription(item)}
                                  </h4>
                                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {new Date(item.timestamp).toLocaleString("ru-RU")}
                                  </span>
                                </div>

                                {/* Parameters */}
                                {item.parameters && item.parameters !== "null" && (
                                  <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Settings className="w-5 h-5 text-blue-500" />
                                      <span className="text-base font-medium text-gray-700">Параметры</span>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      {(() => {
                                        const params = getReadableParameters(item.parameters)
                                        if (typeof params === "object") {
                                          return (
                                            <div className="space-y-1">
                                              {Object.entries(params).map(([key, value]) => (
                                                <div key={key} className="flex items-start gap-2">
                                                  <span className="font-mono text-blue-700 text-base min-w-0 font-medium">
                                                    {key}:
                                                  </span>
                                                  <span className="text-gray-800 text-base break-all">
                                                    {String(value)}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          )
                                        }
                                        return <span className="text-gray-600 text-base">{String(params)}</span>
                                      })()}
                                    </div>
                                  </div>
                                )}

                                {/* Result */}
                                {item.afterState && item.afterState !== "null" && (
                                  <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Check className="w-5 h-5 text-green-500" />
                                      <span className="text-base font-medium text-gray-700">Результат</span>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                      {(() => {
                                        try {
                                          const result = JSON.parse(item.afterState)
                                          if (typeof result === "object" && result !== null) {
                                            const keyFields = ["id", "fullName", "email", "title", "name", "status"]
                                            const summary = keyFields.reduce((acc, field) => {
                                              if (result[field] !== undefined) {
                                                acc[field] = result[field]
                                              }
                                              return acc
                                            }, {} as any)

                                            return Object.keys(summary).length > 0 ? (
                                              <div className="space-y-1">
                                                {Object.entries(summary).map(([key, value]) => (
                                                  <div key={key} className="flex items-start gap-2">
                                                    <span className="font-mono text-green-700 text-base min-w-0 font-medium">
                                                      {key}:
                                                    </span>
                                                    <span className="text-gray-800 text-base break-all">
                                                      {String(value)}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="text-green-700 font-medium text-base">
                                                ✅ Операция выполнена успешно
                                              </span>
                                            )
                                          }
                                          return <span className="text-green-700 text-base">{String(result)}</span>
                                        } catch {
                                          return <span className="text-green-700 text-base">{item.afterState}</span>
                                        }
                                      })()}
                                    </div>
                                  </div>
                                )}

                                {/* Undo component */}
                                <UndoManager
                                  historyItem={item}
                                  onUndoComplete={() => {
                                    setIsHistoryOpen(false)
                                    setTimeout(() => setIsHistoryOpen(true), 100)
                                  }}
                                />

                                {/* Technical details (collapsible) */}
                                <details className="mt-3">
                                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                                    <Code className="w-4 h-4" />
                                    Техническая информация
                                  </summary>
                                  <div className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono space-y-1">
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
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </Card>
        </div>
      )}
    </div>
  )
}
