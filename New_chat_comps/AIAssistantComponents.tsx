// AIAssistantComponents.tsx
// UI компоненты для AI ассистента

"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  X,
  User,
  Loader2,
  Code,
  Undo2,
  Check,
  AlertTriangle,
  Settings,
  Sparkles,
  Activity,
  Command,
  Filter,
  Target,
  Sliders,
  Lightbulb,
  CheckCircle,
  BarChart3,
} from "lucide-react"

import type {
  CommandButtonProps,
  ToolCallDisplayProps,
  UndoManagerProps,
  ToolSelectionDialogProps,
  Tool
} from './AIAssistantTypes'

import {
  TOOL_CATEGORIES,
  DEFAULT_TOOL_SELECTION_CONFIG,
  analyzeUserQuery,
  filterToolsByCategories,
  getToolUsageStats,
} from "./tool_selection_logic"

// Command button component
export function CommandButton({ icon, label, isActive, onClick }: CommandButtonProps) {
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
export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ apiCall, isLoading, onCancel }) => {
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
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
export const UndoManager: React.FC<UndoManagerProps> = ({ historyItem, onUndoComplete }) => {
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

