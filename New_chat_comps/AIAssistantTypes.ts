// AIAssistantTypes.ts
// Типы и интерфейсы для AI ассистента

export interface Message {
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

export interface Tool {
  name: string
  description: string
  parameters: any
  apiMethod?: "GET" | "POST" | "PUT" | "DELETE"
  apiEndpoint?: string
}

export type OpenRouterHistoryMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "function"; name: string; content: string }

export interface CommandButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export interface ToolCallDisplayProps {
  apiCall: Message["apiCall"]
  isLoading: boolean
  onCancel: () => void
}

export interface UndoManagerProps {
  historyItem: any
  onUndoComplete: () => void
}

export interface ToolSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  allTools: Tool[]
  mode: 'auto' | 'manual'
  setMode: (mode: 'auto' | 'manual') => void
  manualCategories: string[]
  setManualCategories: React.Dispatch<React.SetStateAction<string[]>>
  lastQueryAnalysis: ReturnType<typeof analyzeUserQuery>
}

// Импорт типов из tool_selection_logic
import type { analyzeUserQuery } from './tool_selection_logic'

export const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

export const modelOptions = [
  { id: "gemini-2.0-flash-streaming", name: "2.0 Flash Streaming", icon: "⚡" },
  { id: "gemini-2.5-flash", name: "2.5 Flash Standard", icon: "🧠" },
]

export const quickCommands = {
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

