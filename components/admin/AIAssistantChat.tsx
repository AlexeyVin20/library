'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, User, Database, Loader2, Code, RotateCcw } from 'lucide-react';

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

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

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

  const executeApiCall = async (apiCall: { method: string; endpoint:string; params: any }) => {
    const url = new URL(apiCall.endpoint, baseUrl);
    
    const options: RequestInit = {
      method: apiCall.method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    };

    if (options.method === 'GET' && apiCall.params) {
      Object.keys(apiCall.params).forEach(key => url.searchParams.append(key, apiCall.params[key]));
    } else if (['POST', 'PUT', 'PATCH'].includes(options.method) && apiCall.params) {
      options.body = JSON.stringify(apiCall.params);
    }

    const response = await fetch(url.toString(), options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call to ${apiCall.endpoint} failed: ${response.status} ${errorText}`);
    }

    if (response.status === 204) return null; // No Content
    
    const contentType = response.headers.get("content-type");
    return contentType?.includes("application/json") ? response.json() : response.text();
  };

  const runConversation = async (conversationHistory: Message[]) => {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      // We pass the declarations, but without our custom fields `apiMethod` and `apiEndpoint`.
      const toolDeclarations = tools.map(({ apiMethod, apiEndpoint, ...rest }) => rest);

      let currentHistory = buildGeminiHistory(conversationHistory);
      let maxIterations = 10; // Prevent infinite loops
      
      while (maxIterations > 0) {
        const requestBody = {
          contents: currentHistory,
          tools: [{ functionDeclarations: toolDeclarations }],
          systemInstruction: {
            parts: [{ text: `Текущая дата и время в UTC: ${new Date().toISOString()}. Используй это значение, когда в запросе упоминается 'сегодня' или 'текущая дата'. Не спрашивай подтверждение своих действий, сразу выполняй.` }]
          }
        };

        const response = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`);
        }
        
        // Handle regular (non-streaming) response
        const data = await response.json();
        const part = data.candidates?.[0]?.content?.parts[0];
        
        if (part?.functionCall) {
          const functionCall = part.functionCall;
          const functionName = functionCall.name;
          const functionArgs = functionCall.args;
          
          const toolDef = tools.find(t => t.name === functionName);
          if (!toolDef || !toolDef.apiMethod || !toolDef.apiEndpoint) {
            throw new Error(`Tool definition not found or is misconfigured for: ${functionName}`);
          }

          // Add a "Thinking..." message to the UI
          const thinkingMessage: Message = {
              id: generateUniqueId(),
              content: `Думаю, нужно вызвать инструмент: ${functionName}...`,
              role: 'assistant',
              timestamp: new Date(),
              apiCall: {
                  method: toolDef.apiMethod,
                  endpoint: functionName,
                  params: functionArgs
              }
          };
          setMessages(prev => [...prev, thinkingMessage]);

          // Execute the actual API call
          let endpoint = toolDef.apiEndpoint;
          const mutableArgs = { ...functionArgs };
          Object.keys(mutableArgs).forEach(key => {
              if (endpoint.includes(`{${key}}`)) {
                  endpoint = endpoint.replace(`{${key}}`, mutableArgs[key]);
                  delete mutableArgs[key];
              }
          });

          const apiResponse = await executeApiCall({
              method: toolDef.apiMethod,
              endpoint: endpoint,
              params: mutableArgs,
          });

          // Add the function call and result to history for the next iteration
          currentHistory = [
              ...currentHistory,
              { role: 'model', parts: [part] }, // Add Gemini's function call request
              { // Add our function call result
                  role: 'function',
                  parts: [{
                      functionResponse: {
                          name: functionName,
                          response: {
                              name: functionName,
                              content: apiResponse,
                          }
                      }
                  }]
              }
          ];
          
          maxIterations--;
          continue; // Continue the loop to see if Gemini wants to call more functions

        } else if (part?.text) {
          // The model responded with text directly - we're done
          return part.text;
        } else {
          return "Извините, я не смог обработать ваш запрос.";
        }
      }
      
      return "Достигнуто максимальное количество итераций. Процесс остановлен.";
  };

  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessageText = inputValue;
    const userMessage: Message = {
      id: generateUniqueId(),
      content: userMessageText,
      role: 'user',
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await runConversation(newMessages);

      const assistantMessage: Message = {
        id: generateUniqueId(),
        content: responseText,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

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
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setIsLoading(false);
    // statusMessage is related to endpoint loading, no need to reset here
    // as endpoints are not re-fetched on chat reset.
    prevMessagesLength.current = 0;
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
        <Button onClick={() => setIsOpen(true)} className="rounded-full w-14 h-14 bg-emerald-600 hover:bg-emerald-700 shadow-lg">
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[500px] h-[600px] shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <img src="/images/owl-svgrepo-com.svg" alt="Мудрая Сова" className="w-6 h-6" />
                Мудрая Сова
              </CardTitle>
              <div className="flex items-center">
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
              
              {messages.map((message) => (
                <div key={message.id} className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 ${ message.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <img src="/images/owl-svgrepo-com.svg" alt="Мудрая Сова" className="w-5 h-5" />}
                      <span className="text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                    
                    <div className="whitespace-pre-wrap text-base">{message.content}</div>
                    
                    {message.apiCall && (
                      <div className="mt-2 p-2 bg-gray-800 text-cyan-400 rounded text-xs font-mono">
                        <div className="flex items-center gap-1 mb-1">
                          <Code className="w-3 h-3" />
                          <span>API Call:</span>
                        </div>
                        {`${message.apiCall.method} ${message.apiCall.endpoint}`}
                        {message.apiCall.params && <pre className="mt-1 text-gray-300 text-[10px] whitespace-pre-wrap break-all">{JSON.stringify(message.apiCall.params)}</pre>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">Думаю...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={statusMessage || "Спросите что-нибудь..."}
                  disabled={isLoading || tools.length === 0}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim() || tools.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 