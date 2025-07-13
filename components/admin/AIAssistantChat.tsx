'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, User, Loader2, Code, RotateCcw, ChevronDown, Pause, BookOpen, CalendarDays, History as HistoryIcon, Check, XCircle, AlertTriangle, Undo2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  apiCall?: {
    method: string;
    endpoint: string;
    params?: any;
  };
}

interface Tool {
  name: string;
  description: string;
  parameters: any;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiEndpoint?: string;
}

// Типизация истории для OpenRouter function calling
type OpenRouterHistoryMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | { role: 'function'; name: string; content: string };

// Утилита для генерации уникальных идентификаторов (поднял повыше, чтобы использовать ниже)
const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// ====================== ToolCallDisplay =========================
const ToolCallDisplay: React.FC<{
  apiCall: Message['apiCall'];
  isLoading: boolean;
  onCancel: () => void;
}> = ({ apiCall, isLoading, onCancel }) => {
  if (!apiCall) return null;

  const [displayedToolName, setDisplayedToolName] = useState('');
  const { endpoint, params } = apiCall;

  const getFriendlyToolName = (toolName: string): string => {
    const lower = toolName.toLowerCase();
    if (lower.includes('book')) {
      if (lower.includes('create') || lower.includes('add')) return 'Добавление книги';
      if (lower.includes('update')) return 'Обновление книги';
      if (lower.includes('delete')) return 'Удаление книги';
      if (lower.includes('search') || lower.includes('get')) return 'Поиск книг';
      return 'Работа с книгами';
    }
    if (lower.includes('reservation')) {
      if (lower.includes('create') || lower.includes('add')) return 'Создание брони';
      if (lower.includes('get') || lower.includes('view')) return 'Просмотр брони';
      return 'Работа с бронированиями';
    }
    if (lower.includes('user')) {
      if (lower.includes('create') || lower.includes('add')) return 'Добавление пользователя';
      if (lower.includes('update')) return 'Изменение пользователя';
      if (lower.includes('delete')) return 'Удаление пользователя';
      if (lower.includes('get')) return 'Поиск пользователей';
      return 'Работа с пользователями';
    }
    if (lower.includes('navigate')) return 'Навигация';
    if (lower.includes('stopagent') || lower.includes('cancel')) return 'Остановка агента';

    const spacedName = toolName.replace(/([A-Z])/g, ' $1').trim();
    return spacedName.charAt(0).toUpperCase() + spacedName.slice(1);
  };

  const friendlyName = getFriendlyToolName(endpoint);

  useEffect(() => {
    setDisplayedToolName('');
    if (friendlyName) {
      let i = 0;
      const intervalId = setInterval(() => {
        if (i <= friendlyName.length) {
          setDisplayedToolName(friendlyName.substring(0, i));
          i += 1;
        } else {
          clearInterval(intervalId);
        }
      }, 50);
      return () => clearInterval(intervalId);
    }
  }, [friendlyName]);

  const isTyping = displayedToolName.length < (friendlyName?.length ?? 0);

  const getToolIcon = (toolName: string) => {
    const lowerToolName = toolName.toLowerCase();
    if (lowerToolName.includes('book')) return <BookOpen className="w-6 h-6 text-cyan-300 animate-bounce" />;
    if (lowerToolName.includes('reservation')) return <CalendarDays className="w-6 h-6 text-cyan-300" />;
    if (lowerToolName.includes('user')) return <User className="w-6 h-6 text-cyan-300" />;
    return <Code className="w-6 h-6 text-cyan-300" />;
  };

  return (
    <div className="p-3 bg-gradient-to-br from-indigo-700 via-gray-900 to-black text-white rounded-lg shadow-xl font-mono relative transition-all duration-300 ease-in-out transform hover:scale-[1.02] w-full">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-cyan-300" />
            <span className="text-sm font-bold text-cyan-300 tracking-wider">ВЫЗОВ ИНСТРУМЕНТА</span>
          </div>
          {isLoading && (
            <button
              onClick={onCancel}
              className="bg-red-500/50 hover:bg-red-500/80 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
              title="Отменить действие"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-start gap-4">
          <div className="pt-1">{getToolIcon(endpoint)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-lg text-white break-words h-7 font-semibold">
              {displayedToolName}
              {isTyping && <span className="animate-ping ml-1">_</span>}
            </p>
            {params && Object.keys(params).length > 0 && (
              <pre className="mt-2 text-gray-300 text-[11px] whitespace-pre-wrap break-all bg-black/40 p-2 rounded-md max-h-24 overflow-y-auto">
                {JSON.stringify(params, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================== UndoManager =========================
const UndoManager: React.FC<{
  historyItem: any;
  onUndoComplete: () => void;
}> = ({ historyItem, onUndoComplete }) => {
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoResult, setUndoResult] = useState<string | null>(null);

  const canUndo = () => {
    const { httpMethod, beforeState } = historyItem;
    // Можно отменить DELETE (восстановить) и PUT (откатить изменения)
    return (httpMethod === 'DELETE' && beforeState && beforeState !== 'null') ||
           (httpMethod === 'PUT' && beforeState && beforeState !== 'null');
  };

  const performUndo = async () => {
    if (!canUndo()) return;

    setIsUndoing(true);
    setUndoResult(null);

    try {
      const { httpMethod, endpoint, beforeState } = historyItem;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const token = localStorage.getItem('token');

      if (httpMethod === 'DELETE') {
        // Восстанавливаем удаленный объект через POST
        const beforeData = JSON.parse(beforeState);
        
        // Для пользователей добавляем пароль по умолчанию
        if (endpoint.includes('/api/User')) {
          beforeData.Password = 'DefaultPassword123!';
          console.log('[Undo] Добавлен пароль по умолчанию для восстановления пользователя');
        }
        
        // Убираем ID из эндпоинта для POST запроса
        // Например: /api/User/123 -> /api/User
        const baseEndpoint = endpoint.replace(/\/[^\/]+$/, '');
        
        const response = await fetch(`${baseUrl}${baseEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(beforeData),
        });

        if (response.ok) {
          setUndoResult('✅ Объект успешно восстановлен');
        } else {
          const errorText = await response.text();
          setUndoResult(`❌ Ошибка восстановления: ${response.status} ${errorText}`);
        }
      } else if (httpMethod === 'PUT') {
        // Откатываем изменения через PUT с beforeState
        const beforeData = JSON.parse(beforeState);
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(beforeData),
        });

        if (response.ok) {
          setUndoResult('✅ Изменения успешно отменены');
        } else {
          const errorText = await response.text();
          setUndoResult(`❌ Ошибка отмены: ${response.status} ${errorText}`);
        }
      }

      onUndoComplete();
    } catch (error) {
      setUndoResult(`❌ Критическая ошибка: ${(error as Error).message}`);
    } finally {
      setIsUndoing(false);
    }
  };

  if (!canUndo()) return null;

  return (
    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-700">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-medium">
            {historyItem.httpMethod === 'DELETE' ? 'Можно восстановить' : 'Можно откатить'}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={performUndo}
          disabled={isUndoing}
          className="text-orange-700 border-orange-300 hover:bg-orange-100"
        >
          {isUndoing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Undo2 className="w-3 h-3" />
          )}
          {historyItem.httpMethod === 'DELETE' ? 'Восстановить' : 'Откатить'}
        </Button>
      </div>
      {undoResult && (
        <div className="mt-2 text-xs">{undoResult}</div>
      )}
    </div>
  );
};

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  // conversationId создаётся единожды за сессию при первом монтировании
  const conversationIdRef = useRef<string>(generateUniqueId());
  const [isLoading, setIsLoading] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<'question' | 'action'>('action');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);
  const [streamedResponse, setStreamedResponse] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // История диалога
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  // Система принятия/отклонения последних изменений
  const [pendingChanges, setPendingChanges] = useState(false);
  const snapshotRef = useRef<Message[]>([]);
  const [lastOperation, setLastOperation] = useState<any>(null);

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  // Загрузка истории диалога при открытии окна
  useEffect(() => {
    if (isHistoryOpen) {
      (async () => {
        try {
          // Если нужно получить все диалоги, не добавляем conversationId
          const url = `${baseUrl}/api/DialogHistory`;
          console.log(`[History] Запрашиваю все диалоги: ${url}`);
          const res = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          console.log('[History] Ответ сервера:', res.status, res.statusText);

          if (res.ok) {
            const data = await res.json();
            setHistoryData(data);
            console.log('[History] История загружена:', data);
          } else {
            const errorText = await res.text();
            console.error(`[History] Ошибка загрузки истории: ${res.status}`, errorText);
            setHistoryData([{error: `Ошибка загрузки: ${res.status}`, details: errorText}]);
          }
        } catch (err) {
          console.error('[History] Критическая ошибка при загрузке истории:', err);
          setHistoryData([{error: 'Критическая ошибка сети', details: (err as Error).message }]);
        }
      })();
    }
  }, [isHistoryOpen, baseUrl]);
  // Функция для получения человекочитаемого описания действия
  const getActionDescription = (item: any) => {
    const { toolName, httpMethod, endpoint, parameters } = item;
    
    if (httpMethod === 'FRONT') {
      switch (toolName) {
        case 'navigateToPage':
          try {
            const params = JSON.parse(parameters || '{}');
            return `Переход на страницу: ${params.path || 'неизвестная'}`;
          } catch {
            return 'Навигация по страницам';
          }
        case 'stopAgent':
          return 'Остановка работы ассистента';
        case 'cancelCurrentAction':
          return 'Отмена текущего действия';
        default:
          return `Фронтовое действие: ${toolName}`;
      }
    }

    // Обработка API вызовов
    const method = httpMethod.toUpperCase();
    const lowerToolName = toolName.toLowerCase();
    
    if (lowerToolName.includes('user')) {
      if (method === 'POST') return '👤 Создание пользователя';
      if (method === 'PUT') return '👤 Обновление пользователя';
      if (method === 'DELETE') return '👤 Удаление пользователя';
      if (method === 'GET') return '👤 Поиск пользователей';
    }
    
    if (lowerToolName.includes('book')) {
      if (method === 'POST') return '📚 Добавление книги';
      if (method === 'PUT') return '📚 Обновление книги';
      if (method === 'DELETE') return '📚 Удаление книги';
      if (method === 'GET') return '📚 Поиск книг';
    }
    
    if (lowerToolName.includes('reservation')) {
      if (method === 'POST') return '📅 Создание бронирования';
      if (method === 'PUT') return '📅 Обновление бронирования';
      if (method === 'DELETE') return '📅 Отмена бронирования';
      if (method === 'GET') return '📅 Просмотр бронирований';
    }
    
    // Общие случаи
    switch (method) {
      case 'POST': return `➕ Создание через ${endpoint}`;
      case 'PUT': return `✏️ Обновление через ${endpoint}`;
      case 'DELETE': return `��️ Удаление через ${endpoint}`;
      case 'GET': return `🔍 Запрос к ${endpoint}`;
      default: return `${method} ${endpoint}`;
    }
  };

  // Функция для получения параметров в удобочитаемом виде
  const getReadableParameters = (parameters: string) => {
    if (!parameters || parameters === 'null') return null;
    
    try {
      const params = JSON.parse(parameters);
      if (typeof params !== 'object' || params === null) return parameters;
      
      // Скрываем пароли и другие чувствительные данные
      const filtered = Object.entries(params).reduce((acc, [key, value]) => {
        if (key.toLowerCase().includes('password')) {
          acc[key] = '***';
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      return filtered;
    } catch {
      return parameters;
    }
  };

  // Функция для логирования истории диалога
  const logDialogHistory = async (
    toolName: string,
    httpMethod: string,
    endpoint: string,
    parameters: any,
    beforeState: any,
    afterState: any
  ) => {
    try {
      console.log('[DialogHistory] Отправляю запрос:', {
        baseUrl,
        conversationId: conversationIdRef.current,
        toolName,
        httpMethod,
        endpoint
      });

      if (!baseUrl) {
        console.error('[DialogHistory] baseUrl не определен!');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[DialogHistory] Токен не найден в localStorage');
      }

      // Создаем DTO без навигационных свойств
      const requestBody = {
        conversationId: conversationIdRef.current,
        toolName,
        httpMethod,
        endpoint,
        parameters: typeof parameters === 'string' ? parameters : JSON.stringify(parameters ?? null),
        beforeState: typeof beforeState === 'string' ? beforeState : JSON.stringify(beforeState ?? null),
        afterState: typeof afterState === 'string' ? afterState : JSON.stringify(afterState ?? null),
      };

      console.log('[DialogHistory] Тело запроса:', requestBody);

      const response = await fetch(`${baseUrl}/api/DialogHistory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[DialogHistory] Ответ сервера:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DialogHistory] Ошибка сервера:', response.status, errorText);
      } else {
        const result = await response.json();
        console.log('[DialogHistory] Успешно сохранено:', result);
      }
    } catch (err) {
      console.error('[DialogHistory] Ошибка при отправке запроса:', err);
    }
  };

  useEffect(() => {
    const loadTools = async () => {
      try {
        setStatusMessage('Загрузка AI инструментов...');
        const response = await fetch('/wiseOwl.json');
        if (response.ok) {
          const data = await response.json();
          const enhancedTools = data.map((tool: any) => {
            const match = tool.description.match(/Использует API эндпоинт (GET|POST|PUT|DELETE) (\S+)/);
            if (match) {
              return { ...tool, apiMethod: match[1], apiEndpoint: match[2] };
            }
            return tool;
          });
          setTools(enhancedTools);
          if (enhancedTools.length === 0) {
            setStatusMessage('Ошибка: Не удалось загрузить инструменты. Список пуст.');
          } else {
            setStatusMessage(null); // All good
          }
        } else {
          setStatusMessage(`Ошибка загрузки AI инструментов: ${response.status}`);
          throw new Error(`Failed to load tools: ${response.status}`);
        }
      } catch (error) {
        console.error('Ошибка загрузки wiseOwl.json:', error);
        setStatusMessage(`Ошибка: Не удалось загрузить AI инструменты.`);
      }
    };

    if (isOpen && tools.length === 0) {
      loadTools();
    }
  }, [isOpen, tools.length]);

  // This effect scrolls to the bottom only when a new message is added.
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const buildGeminiHistory = (history: Message[]) => {
    const geminiHistory: any[] = [];
    // This function is complex because it reconstructs the turn-by-turn
    // conversation for the Gemini API, including prior function calls and their results.
    // For now, we will simplify and only pass the last few text messages for context.
    // A more robust implementation would require storing the full Gemini history separately.
    return history
      .filter(m => !m.apiCall) // Exclude "Thinking..." messages from history
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
  };

  const modelOptions = [
      { id: 'gemini-2.0-flash-streaming', name: '2.0 flash streaming' },
      { id: 'gemini-2.5-flash', name: '2.5 flash обычный режим' },
  ];

  const executeApiCall = async (apiCall: { toolName: string; method: string; endpoint: string; params: any }) => {
    const { toolName, method, endpoint, params } = apiCall;
    const url = new URL(endpoint, baseUrl);

    let beforeState: any = null;

    // Для PUT/DELETE сохраняем предыдущее состояние
    if ([ 'PUT', 'DELETE' ].includes(method.toUpperCase())) {
      try {
        const beforeRes = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (beforeRes.ok) {
          const ct = beforeRes.headers.get('content-type');
          beforeState = ct?.includes('application/json') ? await beforeRes.json() : await beforeRes.text();
        }
      } catch (err) {
        console.warn('Не удалось получить beforeState', err);
      }
    }

    const requestOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    };

    if (requestOptions.method === 'GET' && params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    } else if ([ 'POST', 'PUT', 'PATCH' ].includes(requestOptions.method) && params) {
      requestOptions.body = JSON.stringify(params);
    }

    const response = await fetch(url.toString(), requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call to ${endpoint} failed: ${response.status} ${errorText}`);
    }

    let afterState: any = null;

    if (response.status !== 204) {
      const contentType = response.headers.get('content-type');
      afterState = contentType?.includes('application/json') ? await response.json() : await response.text();
    }

    // Логируем историю и сохраняем последнюю операцию для быстрой отмены
    const operationRecord = {
      toolName,
      httpMethod: requestOptions.method,
      endpoint,
      parameters: typeof params === 'string' ? params : JSON.stringify(params ?? null),
      beforeState: typeof beforeState === 'string' ? beforeState : JSON.stringify(beforeState ?? null),
      afterState: typeof afterState === 'string' ? afterState : JSON.stringify(afterState ?? null),
      timestamp: new Date().toISOString(),
    };

    logDialogHistory(toolName, requestOptions.method, endpoint, params, beforeState, afterState);
    
    // Сохраняем операцию для быстрой отмены (только DELETE и PUT)
    if (['DELETE', 'PUT'].includes(requestOptions.method) && beforeState) {
      setLastOperation(operationRecord);
    }

    return afterState;
  };

  // Прерывание текущего запроса к Gemini
  const stopCurrentAgent = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStreamedResponse('');
  };

  // Обработка фронтовых инструментов без API эндпоинтов
  const handleFrontTool = async (toolName: string, args: any, context?: { openInNewTab?: boolean }) => {
    let result: { name: string; content: string };
    switch (toolName) {
      case 'stopAgent':
        stopCurrentAgent();
        result = { name: toolName, content: 'Агент остановлен.' };
        break;
      case 'cancelCurrentAction':
        stopCurrentAgent();
        result = { name: toolName, content: 'Действие отменено.' };
        break;
      case 'navigateToPage':
        if (args?.path) {
          if (context?.openInNewTab) {
            window.open(args.path, '_blank');
            result = { name: toolName, content: `Открыта новая вкладка: ${args.path}` };
          } else {
            router.push(args.path);
            result = { name: toolName, content: `Переход на страницу ${args.path}` };
          }
        } else {
          result = { name: toolName, content: 'Не указан путь.' };
        }
        break;
      default:
        result = { name: toolName, content: `Неизвестный инструмент ${toolName}` };
        break;
    }

    // Логируем вызов фронтового инструмента
    await logDialogHistory(
      toolName,
      'FRONT',
      toolName,
      args ? JSON.stringify(args) : null,
      null,
      result.content
    );

    return result;
  };

  const runConversation = async (conversationHistory: Message[], onStreamChunk?: (chunk: string) => void) => {
      // Streaming режим только для gemini-2.0-flash-streaming
      const isStreaming = selectedModel === 'gemini-2.0-flash-streaming';
      const modelForApi = selectedModel === 'gemini-2.0-flash-streaming' ? 'gemini-2.0-flash' : selectedModel;
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelForApi}:generateContent?key=${GEMINI_API_KEY}`;
      const availableTools = aiMode === 'question'
        ? tools.filter(tool => tool.apiMethod === 'GET' || !tool.apiMethod)
        : tools;
      const toolDeclarations = availableTools.map(({ apiMethod, apiEndpoint, ...rest }) => rest);
      let currentHistory = buildGeminiHistory(conversationHistory);
      let maxIterations = 10;
      if (isStreaming) {
        // Streaming fetch
        const requestBody = {
          contents: currentHistory,
          tools: [{ functionDeclarations: toolDeclarations }],
          systemInstruction: {
            parts: [{ text: `Текущая дата и время в UTC: ${new Date().toISOString()}. Используй это значение, когда в запросе упоминается 'сегодня' или 'текущая дата'. Ты работаешь от имени аутентифицированного пользователя. Все вызовы API, которые ты инициируешь, будут автоматически включать токен аутентификации. Тебе не нужно запрашивать токен или включать его в параметры вызова. Не спрашивай подтверждение своих действий, сразу выполняй. Форматируй свой ответ как обычный текст, без использования Markdown или специальных символов типа звездочек (*). Не завершай вызов инструментов, пока не выполнишь запрос до конца. Можно использовать до 10 инструментов без ограничений.` }]
          },
          stream: true
        };
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const response = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error(`Gemini API error: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let fullText = '';
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            // Gemini streaming API может отдавать несколько JSON-объектов через newlines
            const lines = chunk.split('\n').filter(Boolean);
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
                if (text) {
                  fullText += text;
                  if (onStreamChunk) onStreamChunk(fullText);
                }
              } catch {}
            }
          }
        }
        return fullText || 'Извините, я не смог обработать ваш запрос.';
      }
      // ... обычный не-стриминговый режим ...
      while (maxIterations > 0) {
        const requestBody = {
          contents: currentHistory,
          tools: [{ functionDeclarations: toolDeclarations }],
          systemInstruction: {
            parts: [{ text: `Текущая дата и время в UTC: ${new Date().toISOString()}. Используй это значение, когда в запросе упоминается 'сегодня' или 'текущая дата'. Ты работаешь от имени аутентифицированного пользователя. Все вызовы API, которые ты инициируешь, будут автоматически включать токен аутентификации. Тебе не нужно запрашивать токен или включать его в параметры вызова. Не спрашивай подтверждение своих действий, сразу выполняй. Форматируй свой ответ как обычный текст, без использования Markdown или специальных символов типа звездочек (*). Не завершай вызов инструментов, пока не выполнишь запрос до конца. Можно использовать до 10 инструментов без ограничений.` }]
          }
        };
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const response = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`);
        }
        const data = await response.json();
        const responseParts = data.candidates?.[0]?.content?.parts;
        if (!responseParts) {
            return "Извините, я не смог обработать ваш запрос.";
        }
        const functionCallParts = responseParts.filter((p: any) => p.functionCall);
        const textParts = responseParts.filter((p: any) => p.text);
        if (functionCallParts.length > 0) {
          const originalModelResponse = { role: 'model', parts: responseParts };
          
          const thinkingMessagesPromises = functionCallParts.map(async (part: any) => {
            const functionName = part.functionCall.name;
            const functionArgs = part.functionCall.args;
            
            const thinkingMessage: Message = {
                id: generateUniqueId(),
                content: `Думаю, нужно вызвать инструмент: ${functionName}...`,
                role: 'assistant',
                timestamp: new Date(),
                apiCall: {
                    method: 'TOOL',
                    endpoint: functionName,
                    params: functionArgs
                }
            };
            return thinkingMessage;
          });

          const thinkingMessages = await Promise.all(thinkingMessagesPromises);
          setMessages(prev => [...prev, ...thinkingMessages]);
          
          const hasMultipleNavigations = functionCallParts.filter(p => p.functionCall.name === 'navigateToPage').length > 1;

          const toolResponses = await Promise.all(
            functionCallParts.map(async (part: any) => {
              const functionCall = part.functionCall;
              const functionName = functionCall.name;
              const functionArgs = functionCall.args;
              const toolDef = tools.find(t => t.name === functionName);
              if (!toolDef || !toolDef.apiMethod || !toolDef.apiEndpoint) {
                const frontRes = await handleFrontTool(functionName, functionArgs, { openInNewTab: hasMultipleNavigations && functionName === 'navigateToPage' });
                return { functionResponse: frontRes };
              }
              let endpoint = toolDef.apiEndpoint;
              const mutableArgs = { ...functionArgs };
              Object.keys(mutableArgs).forEach(key => {
                  if (endpoint.includes(`{${key}}`)) {
                      endpoint = endpoint.replace(`{${key}}`, mutableArgs[key]);
                      delete mutableArgs[key];
                  }
              });
              const apiResponse = await executeApiCall({
                  toolName: functionName,
                  method: toolDef.apiMethod,
                  endpoint: endpoint,
                  params: mutableArgs,
              });
              return {
                functionResponse: { name: functionName, response: { name: functionName, content: apiResponse }}
              };
            })
          );
          currentHistory.push(originalModelResponse);
          currentHistory.push({ role: 'function', parts: toolResponses });
          maxIterations--;
          continue; 
        } else if (textParts.length > 0) {
          return textParts.map((p: any) => p.text).join("\n");
        } else {
          return "Извините, я не смог обработать ваш запрос.";
        }
      }
      return "Достигнуто максимальное количество итераций. Процесс остановлен.";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMessageText = inputValue;
    const userMessage: Message = {
      id: generateUniqueId(),
      content: userMessageText,
      role: 'user',
      timestamp: new Date(),
    };
    // Сохраняем снимок перед отправкой нового сообщения
    snapshotRef.current = [...messages];
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    setStreamedResponse('');
    try {
      if (selectedModel === 'gemini-2.0-flash-streaming') {
        // Стриминг-режим
        const assistantMessage: Message = {
          id: generateUniqueId(),
          content: '',
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        await runConversation(newMessages, (chunk) => {
          setStreamedResponse(chunk);
          setMessages(prev => prev.map(m => m.id === assistantMessage.id ? { ...m, content: chunk } : m));
        });
        setPendingChanges(true);
      } else {
        // Обычный режим
        const responseText = await runConversation(newMessages);
        const assistantMessage: Message = {
          id: generateUniqueId(),
          content: responseText,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setPendingChanges(true);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: `Извините, произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamedResponse('');
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setIsLoading(false);
    // statusMessage is related to endpoint loading, no need to reset here
    // as endpoints are not re-fetched on chat reset.
    prevMessagesLength.current = 0;
    setPendingChanges(false);
  };

  const handleAccept = () => {
    setPendingChanges(false);
    snapshotRef.current = [...messages];
  };

  const handleReject = () => {
    setMessages(snapshotRef.current);
    setPendingChanges(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} className="rounded-full w-14 h-14 bg-transparent hover:bg-blue-500 shadow-lg">
          <img src="/images/owl-svgrepo-com.svg" className="w-20 h-20" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[500px] h-[600px] shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <img src="/images/owl-svgrepo-com.svg" alt="Мудрая Сова" className="w-6 h-6" />
                  Мудрая Сова
                </CardTitle>
                <div className="flex items-center space-x-2 ml-4">
                  <Label htmlFor="ai-mode-switch" className={`text-sm ${aiMode === 'question' ? 'font-bold text-emerald-700' : 'text-gray-500'}`}>Вопрос</Label>
                  <Switch
                    id="ai-mode-switch"
                    checked={aiMode === 'action'}
                    onCheckedChange={(checked) => setAiMode(checked ? 'action' : 'question')}
                  />
                  <Label htmlFor="ai-mode-switch" className={`text-sm ${aiMode === 'action' ? 'font-bold text-emerald-700' : 'text-gray-500'}`}>Действие</Label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-1 text-gray-500 hover:text-gray-700 h-8 w-8">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={selectedModel} onValueChange={setSelectedModel}>
                      {modelOptions.map((model) => (
                        <DropdownMenuRadioItem key={model.id} value={model.id}>
                          {model.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center">
                <Button variant="ghost" size="sm" onClick={() => setIsHistoryOpen(true)} className="text-gray-500 hover:text-gray-700" title="История">
                  <HistoryIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleResetChat} className="text-gray-500 hover:text-gray-700" title="Сбросить чат">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700" title="Закрыть">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 flex flex-col h-[520px]">
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 && !statusMessage &&(
                <div className="text-center text-gray-500 mt-8">
                  <img src="/images/owl-svgrepo-com.svg" alt="Мудрая Сова" className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg font-medium">Привет! Я Мудрая Сова.</p>
                  <p className="text-base mt-2">Чем я могу вам помочь?</p>
                </div>
              )}
              {statusMessage && (
                 <div className="text-center text-gray-500 mt-8">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                    <p>{statusMessage}</p>
                 </div>
              )}
              
              {messages.map((message) => {
                if (message.apiCall && message.role === 'assistant') {
                  return (
                    <div key={message.id} className="mb-4 flex justify-start w-full">
                       <ToolCallDisplay
                          apiCall={message.apiCall}
                          isLoading={isLoading}
                          onCancel={stopCurrentAgent}
                      />
                    </div>
                  )
                }
                return (
                  <div key={message.id} className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-3 ${ message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <img src="/images/owl-svgrepo-com.svg" alt="Мудрая Сова" className="w-5 h-5" />}
                        <span className="text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="whitespace-pre-wrap text-base">{message.content}</div>
                      
                    </div>
                  </div>
                )
              })}
              
              {isLoading && !messages.some(m => m.apiCall) && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">Думаю...</span>
                  </div>
                </div>
              )}
              
              {streamedResponse && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">Отвечаю...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="p-4 border-t">
              {/* Кнопки принять / отклонить */}
              {pendingChanges && (
                <div className="flex gap-2 mb-2 justify-end">
                  <Button size="sm" variant="secondary" onClick={handleAccept} className="flex items-center gap-1">
                    <Check className="w-4 h-4" /> Принять
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleReject} className="flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Отклонить
                  </Button>
                </div>
              )}
              
              {/* Кнопка быстрой отмены последней операции */}
              {lastOperation && (
                <div className="mb-2">
                  <UndoManager 
                    historyItem={lastOperation} 
                    onUndoComplete={() => {
                      setLastOperation(null);
                    }} 
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={statusMessage || "Спросите что-нибудь..."}
                  disabled={isLoading || tools.length === 0}
                  className="flex-1"
                />
                <Button
                  onClick={isLoading ? stopCurrentAgent : handleSendMessage}
                  disabled={!isLoading && (!inputValue.trim() || tools.length === 0)}
                  className={isLoading ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                >
                  {isLoading ? <Pause className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            {/* Модальное окно истории */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>История диалога</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh]">
                  {historyData.length === 0 ? (
                    <p className="text-sm text-gray-500">История пуста</p>
                  ) : (
                    historyData.map((item, idx) => (
                      <div key={idx} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        {/* Заголовок действия */}
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            {getActionDescription(item)}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        
                        {/* Conversation ID */}
                        <div className="text-xs text-gray-600 mb-2">
                          Диалог: <code className="bg-white px-1 rounded">{item.conversationId}</code>
                        </div>
                        
                        {/* Параметры */}
                        {item.parameters && item.parameters !== 'null' && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-700">Параметры:</span>
                            <div className="mt-1 p-2 bg-white rounded border text-xs">
                              {(() => {
                                const params = getReadableParameters(item.parameters);
                                if (typeof params === 'object') {
                                  return Object.entries(params).map(([key, value]) => (
                                    <div key={key} className="flex">
                                      <span className="font-mono text-blue-600 min-w-0 mr-2">{key}:</span>
                                      <span className="text-gray-800 break-all">{String(value)}</span>
                                    </div>
                                  ));
                                }
                                return <span className="text-gray-600">{String(params)}</span>;
                              })()}
                            </div>
                          </div>
                        )}
                        
                        {/* Результат */}
                        {item.afterState && item.afterState !== 'null' && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-700">Результат:</span>
                            <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs">
                              {(() => {
                                try {
                                  const result = JSON.parse(item.afterState);
                                  if (typeof result === 'object' && result !== null) {
                                    // Показываем только ключевые поля
                                    const keyFields = ['id', 'fullName', 'email', 'title', 'name', 'status'];
                                    const summary = keyFields.reduce((acc, field) => {
                                      if (result[field] !== undefined) {
                                        acc[field] = result[field];
                                      }
                                      return acc;
                                    }, {} as any);
                                    
                                    return Object.keys(summary).length > 0 ? (
                                      Object.entries(summary).map(([key, value]) => (
                                        <div key={key} className="flex">
                                          <span className="font-mono text-green-700 min-w-0 mr-2">{key}:</span>
                                          <span className="text-gray-800 break-all">{String(value)}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-green-700">Операция выполнена успешно</span>
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
                        
                        {/* Компонент отмены операций */}
                        <UndoManager 
                          historyItem={item} 
                          onUndoComplete={() => {
                            // Перезагружаем историю после отмены
                            setIsHistoryOpen(false);
                            setTimeout(() => setIsHistoryOpen(true), 100);
                          }} 
                        />

                        {/* Техническая информация (скрытая по умолчанию) */}
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Техническая информация
                          </summary>
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                            <div><strong>Инструмент:</strong> {item.toolName}</div>
                            <div><strong>Метод:</strong> {item.httpMethod}</div>
                            <div><strong>Эндпоинт:</strong> {item.endpoint}</div>
                          </div>
                        </details>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 