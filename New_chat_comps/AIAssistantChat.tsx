"use client"

import React, { useState, useRef, useEffect } from "react"
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
  Search,
  Zap,
  Brain,
  Settings,
  Activity,
  BookOpen,
  PenTool,
  Command,
  Calendar,
  Book,
  Users,
  Filter,
  UserCheck,
  UserX,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import TextareaAutosize from 'react-textarea-autosize'

// Импорты из разделенных файлов
import type { Message, Tool, OpenRouterHistoryMessage, UserType } from './AIAssistantTypes'
import { generateUniqueId, modelOptions, quickCommands } from './AIAssistantTypes'
import { getSystemInstructions, getUserTypeInstructions, USER_TYPES } from '../lib/AIAssistantInstructions'
import { T9Helper, APIUtils, DataFormatter, HistoryManager, ValidationUtils, CommandUtils } from './AIAssistantUtils'
import { CommandButton, ToolCallDisplay, UndoManager } from './AIAssistantComponents'
import { ToolSelectionDialog } from './ToolSelectionDialog'
import {
  TOOL_CATEGORIES,
  DEFAULT_TOOL_SELECTION_CONFIG,
  analyzeUserQuery,
  filterToolsByCategories,
  selectToolsForQuery,
  getToolUsageStats,
  createSelectionSummary,
} from "./tool_selection_logic"

export default function AIAssistantChat() {
  const router = useRouter()
  
  // Основные состояния
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-streaming")
  const [allTools, setAllTools] = useState<Tool[]>([])
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  
  // Новые состояния для типов пользователей
  const [userType, setUserType] = useState<UserType>(USER_TYPES.NOVICE)
  const [isExpertMode, setIsExpertMode] = useState(false)
  
  // Состояния для выбора инструментов
  const [toolSelectionMode, setToolSelectionMode] = useState<'auto' | 'manual'>('auto')
  const [manualCategories, setManualCategories] = useState<string[]>([])
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false)
  const [lastQueryAnalysis, setLastQueryAnalysis] = useState<ReturnType<typeof analyzeUserQuery>>({
    detectedCategories: [],
    detectedTools: [],
    confidence: {},
    suggestedCategories: []
  })
  
  // Состояния для T9 и команд
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeCommand, setActiveCommand] = useState<string | null>(null)
  
  // Состояния для истории и отмены действий
  const [actionHistory, setActionHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  
  // Рефы
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Загрузка инструментов при монтировании
  useEffect(() => {
    const loadTools = async () => {
      try {
        const response = await fetch('/wiseOwl.json')
        const data = await response.json()
        setAllTools(data)
      } catch (error) {
        console.error('Ошибка загрузки инструментов:', error)
      }
    }
    loadTools()
  }, [])

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Обработка ввода для T9 и предложений
  useEffect(() => {
    if (input.trim()) {
      const newSuggestions = T9Helper.getSuggestions(input)
      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
      
      // Анализ запроса для выбора инструментов
      const analysis = analyzeUserQuery(input)
      setLastQueryAnalysis(analysis)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }, [input])

  // Переключение типа пользователя
  const toggleUserType = () => {
    const newUserType = userType === USER_TYPES.NOVICE ? USER_TYPES.EXPERT : USER_TYPES.NOVICE
    setUserType(newUserType)
    setIsExpertMode(newUserType === USER_TYPES.EXPERT)
  }

  // Обработка системных команд
  const handleSystemCommand = (command: string): boolean => {
    const result = CommandUtils.executeSystemCommand(command)
    
    if (result) {
      switch (result) {
        case 'CLEAR_CHAT':
          setMessages([])
          break
        case 'SHOW_HISTORY':
          setShowHistory(true)
          break
        case 'SHOW_SETTINGS':
          setIsToolDialogOpen(true)
          break
        case 'STOP_ASSISTANT':
          if (abortController) {
            abortController.abort()
            setIsLoading(false)
          }
          break
        default:
          addMessage(result, 'assistant')
      }
      return true
    }
    return false
  }

  // Добавление сообщения
  const addMessage = (content: string, role: "user" | "assistant", apiCall?: Message["apiCall"]) => {
    const newMessage: Message = {
      id: generateUniqueId(),
      content,
      role,
      timestamp: new Date(),
      apiCall
    }
    setMessages(prev => [...prev, newMessage])
    
    // Сохранение в историю
    HistoryManager.saveToHistory(newMessage)
    
    return newMessage
  }

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setShowSuggestions(false)

    // Проверка системных команд
    if (handleSystemCommand(userMessage)) {
      return
    }

    addMessage(userMessage, "user")
    setIsLoading(true)

    const controller = new AbortController()
    setAbortController(controller)

    try {
      // Выбор инструментов
      let selectedTools: Tool[]
      if (toolSelectionMode === 'auto') {
        const selection = selectToolsForQuery(userMessage, allTools, DEFAULT_TOOL_SELECTION_CONFIG)
        selectedTools = selection.selectedTools
        
        // Показываем статистику в экспертном режиме
        if (isExpertMode) {
          const stats = getToolUsageStats(selectedTools, allTools)
          const summary = createSelectionSummary(selection.analysis, selection.usedCategories, stats)
          console.log('Выбор инструментов:', summary)
        }
      } else {
        selectedTools = filterToolsByCategories(allTools, manualCategories, [], DEFAULT_TOOL_SELECTION_CONFIG)
      }

      // Подготовка истории для OpenRouter
      const openRouterHistory: OpenRouterHistoryMessage[] = [
        { role: "system", content: getUserTypeInstructions(userType) },
        ...messages.slice(-10).map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })),
        { role: "user", content: userMessage }
      ]

      // Отправка запроса к OpenRouter
      const response = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: openRouterHistory,
          model: selectedModel,
          tools: selectedTools,
          stream: true
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("Нет доступа к потоку ответа")

      let assistantMessage = ""
      let currentApiCall: Message["apiCall"] | undefined

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.choices?.[0]?.delta?.content) {
                assistantMessage += parsed.choices[0].delta.content
              }

              if (parsed.choices?.[0]?.delta?.tool_calls) {
                const toolCall = parsed.choices[0].delta.tool_calls[0]
                if (toolCall?.function) {
                  currentApiCall = {
                    method: "POST",
                    endpoint: toolCall.function.name,
                    params: toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : undefined
                  }
                }
              }
            } catch (e) {
              console.warn('Ошибка парсинга SSE:', e)
            }
          }
        }
      }

      // Добавляем ответ ассистента
      if (assistantMessage || currentApiCall) {
        addMessage(assistantMessage || "Выполняю действие...", "assistant", currentApiCall)
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Ошибка отправки сообщения:', error)
        addMessage(`Ошибка: ${APIUtils.formatApiError(error)}`, "assistant")
      }
    } finally {
      setIsLoading(false)
      setAbortController(null)
    }
  }

  // Отмена текущего запроса
  const handleCancelRequest = () => {
    if (abortController) {
      abortController.abort()
      setIsLoading(false)
      setAbortController(null)
    }
  }

  // Обработка нажатия Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Выбор предложения
  const selectSuggestion = (suggestion: string) => {
    setInput(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  // Быстрые команды
  const getQuickCommandsForCategory = (category: string) => {
    return quickCommands[category as keyof typeof quickCommands] || []
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Заголовок с переключателем типа пользователя */}
      <div className="flex-shrink-0 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                WiseOwl AI Assistant
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userType === USER_TYPES.EXPERT ? "Экспертный режим" : "Режим новичка"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Переключатель типа пользователя */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleUserType}
              className={`transition-all ${
                isExpertMode 
                  ? "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" 
                  : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              }`}
            >
              {isExpertMode ? <UserCheck className="w-4 h-4 mr-2" /> : <UserX className="w-4 h-4 mr-2" />}
              {isExpertMode ? "Эксперт" : "Новичок"}
            </Button>

            {/* Настройки инструментов */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsToolDialogOpen(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Инструменты
            </Button>

            {/* Выбор модели */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Brain className="w-4 h-4 mr-2" />
                  {modelOptions.find(m => m.id === selectedModel)?.name}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup value={selectedModel} onValueChange={setSelectedModel}>
                  {modelOptions.map(model => (
                    <DropdownMenuRadioItem key={model.id} value={model.id}>
                      <span className="mr-2">{model.icon}</span>
                      {model.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Быстрые команды */}
      {!isLoading && messages.length === 0 && (
        <div className="flex-shrink-0 p-4 bg-white/50 dark:bg-slate-800/50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <CommandButton
              icon={<Users className="w-5 h-5" />}
              label="Пользователи"
              isActive={activeCommand === "users"}
              onClick={() => setActiveCommand(activeCommand === "users" ? null : "users")}
            />
            <CommandButton
              icon={<Book className="w-5 h-5" />}
              label="Книги"
              isActive={activeCommand === "books"}
              onClick={() => setActiveCommand(activeCommand === "books" ? null : "books")}
            />
            <CommandButton
              icon={<Calendar className="w-5 h-5" />}
              label="Резервирования"
              isActive={activeCommand === "reservations"}
              onClick={() => setActiveCommand(activeCommand === "reservations" ? null : "reservations")}
            />
            <CommandButton
              icon={<Activity className="w-5 h-5" />}
              label="Статистика"
              isActive={activeCommand === "stats"}
              onClick={() => setActiveCommand(activeCommand === "stats" ? null : "stats")}
            />
            <CommandButton
              icon={<Search className="w-5 h-5" />}
              label="Поиск"
              isActive={activeCommand === "search"}
              onClick={() => setActiveCommand(activeCommand === "search" ? null : "search")}
            />
            <CommandButton
              icon={<PenTool className="w-5 h-5" />}
              label="Создать"
              isActive={activeCommand === "create"}
              onClick={() => setActiveCommand(activeCommand === "create" ? null : "create")}
            />
            <CommandButton
              icon={<HistoryIcon className="w-5 h-5" />}
              label="История"
              isActive={showHistory}
              onClick={() => setShowHistory(!showHistory)}
            />
            <CommandButton
              icon={<Settings className="w-5 h-5" />}
              label="Настройки"
              isActive={isToolDialogOpen}
              onClick={() => setIsToolDialogOpen(true)}
            />
          </div>

          {/* Быстрые команды для активной категории */}
          {activeCommand && (
            <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg border">
              <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Быстрые команды - {activeCommand}
              </h3>
              <div className="flex flex-wrap gap-2">
                {getQuickCommandsForCategory(activeCommand).map((command, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput(command)
                      setActiveCommand(null)
                      inputRef.current?.focus()
                    }}
                    className="text-xs"
                  >
                    {command}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Область сообщений */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white ml-4"
                        : "bg-white dark:bg-slate-800 border shadow-sm mr-4"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {message.role === "user" ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Brain className="w-4 h-4 text-violet-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {message.content}
                        </div>
                        <div className="text-xs opacity-70 mt-2">
                          {DataFormatter.formatDate(message.timestamp.toISOString())}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Отображение вызова инструмента */}
                  {message.apiCall && (
                    <div className="mt-2 mr-4">
                      <ToolCallDisplay
                        apiCall={message.apiCall}
                        isLoading={isLoading}
                        onCancel={handleCancelRequest}
                      />
                    </div>
                  )}

                  {/* Менеджер отмены действий */}
                  {message.role === "assistant" && actionHistory.length > 0 && (
                    <UndoManager
                      historyItem={actionHistory[actionHistory.length - 1]}
                      onUndoComplete={() => {
                        // Обновляем историю после отмены
                        setActionHistory(prev => prev.slice(0, -1))
                      }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Индикатор загрузки */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white dark:bg-slate-800 border shadow-sm rounded-2xl px-4 py-3 mr-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ИИ думает...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Область ввода */}
      <div className="flex-shrink-0 border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="p-4 max-w-4xl mx-auto">
          {/* Предложения T9 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => selectSuggestion(suggestion)}
                  className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <TextareaAutosize
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  userType === USER_TYPES.EXPERT 
                    ? "Введите команду или запрос (поддерживаются системные команды /help, /clear, /settings)..."
                    : "Опишите, что вы хотите сделать..."
                }
                className="w-full resize-none border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 dark:border-slate-600"
                minRows={1}
                maxRows={6}
                disabled={isLoading}
              />
            </div>
            
            <Button
              onClick={isLoading ? handleCancelRequest : handleSendMessage}
              disabled={!input.trim() && !isLoading}
              className={`px-4 py-3 rounded-xl transition-all ${
                isLoading
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
              }`}
            >
              {isLoading ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Статистика для экспертного режима */}
          {isExpertMode && allTools.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
              <span>Режим: {toolSelectionMode === 'auto' ? 'Автоматический' : 'Ручной'}</span>
              <span>Инструментов: {
                toolSelectionMode === 'auto' 
                  ? selectToolsForQuery(input || "test", allTools).selectedTools.length
                  : filterToolsByCategories(allTools, manualCategories, []).length
              } / {allTools.length}</span>
              {lastQueryAnalysis.detectedCategories.length > 0 && (
                <span>Категории: {lastQueryAnalysis.detectedCategories.join(', ')}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Диалог выбора инструментов */}
      <ToolSelectionDialog
        isOpen={isToolDialogOpen}
        onClose={() => setIsToolDialogOpen(false)}
        allTools={allTools}
        mode={toolSelectionMode}
        setMode={setToolSelectionMode}
        manualCategories={manualCategories}
        setManualCategories={setManualCategories}
        lastQueryAnalysis={lastQueryAnalysis}
      />
    </div>
  )
}

