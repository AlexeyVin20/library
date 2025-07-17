// ToolSelectionDialog.tsx
// Диалог выбора инструментов

"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Check,
  Settings,
  Filter,
  Target,
  Sliders,
  Lightbulb,
  CheckCircle,
  BarChart3,
} from "lucide-react"

import type { ToolSelectionDialogProps } from './AIAssistantTypes'

import {
  TOOL_CATEGORIES,
  DEFAULT_TOOL_SELECTION_CONFIG,
  analyzeUserQuery,
  filterToolsByCategories,
  getToolUsageStats,
} from "./tool_selection_logic"

// Tool Selection Dialog
export const ToolSelectionDialog: React.FC<ToolSelectionDialogProps> = ({ 
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
    filterToolsByCategories(allTools, manualCategories, [], DEFAULT_TOOL_SELECTION_CONFIG),
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
        <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
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
              <div className="grid gap-3 grid-cols-2">
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
                <div className="grid gap-4 text-sm grid-cols-3">
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
        </div>
        
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
      </DialogContent>
    </Dialog>
  )
}

