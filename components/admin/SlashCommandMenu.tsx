"use client"

import React, { useState, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import type { Tool, ToolCategory } from '@/lib/tool_selection_logic';

interface SlashCommandMenuProps {
  isVisible: boolean;
  query: string;
  allTools: Tool[];
  categories: ToolCategory[];
  onSelect: (toolName: string) => void;
  positionClasses?: string;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  isVisible,
  query,
  allTools,
  categories,
  onSelect,
  positionClasses = "absolute bottom-full mb-2 left-0 z-50",
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    
    // Получаем маппинг из tool.name в tool.description
    const toolDescriptions = allTools.reduce((acc, tool) => {
      acc[tool.name] = tool.description;
      return acc;
    }, {} as Record<string, string>);

    return categories
      .map(category => {
        const filteredTools = category.tools
          .map(toolName => ({
            name: toolName,
            description: toolDescriptions[toolName] || 'Описание отсутствует',
          }))
          .filter(tool => 
            tool.description.toLowerCase().includes(lowerCaseQuery)
          );

        return {
          ...category,
          tools: filteredTools,
        };
      })
      .filter(category => category.tools.length > 0);
  }, [searchQuery, categories, allTools]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 w-80 flex flex-col ${positionClasses}`}>
      <div className="p-2 border-b flex-shrink-0">
        <Input
          type="text"
          placeholder="Поиск по описанию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9"
          autoFocus
        />
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
          {filteredData.length > 0 ? (
            filteredData.map(category => (
              <div key={category.id} className="mb-2 last:mb-0">
                <h4 className="flex items-center gap-2 px-2 py-1 text-sm font-semibold text-gray-500 bg-gray-50 rounded">
                  <span className="text-lg">{category.icon}</span>
                  {category.name}
                </h4>
                <div className="mt-1 space-y-1">
                  {category.tools.map(tool => (
                    <button
                      key={tool.name}
                      onClick={() => onSelect(tool.name)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-800 rounded-md hover:bg-blue-50 transition-colors flex flex-col"
                    >
                      <span className="font-medium text-gray-900">{tool.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-sm text-gray-500">
              Инструменты не найдены.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}; 