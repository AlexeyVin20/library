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

interface SystemEndpoint {
  controller: string;
  action: string;
  route: string;
  methods: string[];
  requiredRoles: string[];
  isAnonymous: boolean;
  parameters: {
    name: string;
    type: string;
    isOptional: boolean;
  }[];
}

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [endpoints, setEndpoints] = useState<SystemEndpoint[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
    if (isOpen && endpoints.length === 0) {
      loadSystemEndpoints();
    }
  }, [isOpen]);

  // This effect scrolls to the bottom only when a new message is added,
  // not when a message is updated (e.g., during streaming).
  // This prevents the view from jumping if the user has scrolled up.
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSystemEndpoints = async () => {
    try {
      setStatusMessage('Загрузка системных данных...');
      const response = await fetch(`${baseUrl}/api/system/endpoints`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const data = await response.json();
        const loadedEndpoints = data.endpoints || [];
        setEndpoints(loadedEndpoints);
        if (loadedEndpoints.length === 0) {
          setStatusMessage('Ошибка: Не удалось загрузить эндпоинты. Список пуст.');
        } else {
          setStatusMessage(null); // All good
        }
      } else {
        setStatusMessage(`Ошибка загрузки эндпоинтов: ${response.status}`);
        throw new Error(`Failed to load endpoints: ${response.status}`);
      }
    } catch (error) {
      console.error('Ошибка загрузки эндпоинтов:', error);
      setStatusMessage(`Ошибка: Не удалось загрузить системные данные.`);
    }
  };
  
  // This function now handles a streaming response by aggregating all chunks
  // and then parsing the complete response.
  const getApiCallFromGemini = async (userMessage: string, conversationHistory: Message[]) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}`;
    
    const simplifiedEndpoints = endpoints.map(ep => ({
      route: ep.route,
      methods: ep.methods,
      description: `Action: ${ep.action}, Controller: ${ep.controller}`,
      params: ep.parameters.map(p => `${p.name} (${p.type})${p.isOptional ? ' [optional]' : ''}`).join(', ') || 'none'
    }));

    const history = conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');

    const prompt = `
You are an intelligent AI assistant for a library management system called "Мудрая Сова". Your primary task is to translate a user's natural language request into a precise API call in JSON format.
Use the conversation history for context to understand follow-up questions. For example, if the user asks "show me all books" and then "now only the ones in the psychology genre", you should use the history to understand that the second request is a refinement of the first.

**Instructions:**
1.  **Analyze the Request:** First, identify the main subject of the user's request (e.g., books, users, journals). Then, identify any filters or keywords (e.g., a specific genre, an author's name, a year).
2.  **Select the Best Endpoint:** From the list of available endpoints, choose the one that most closely matches the user's intent. Pay close attention to the endpoint's controller and action. For a request about "books", you must choose an endpoint from the 'Books' controller, not 'Journals' or 'Articles'.
3.  **Map Parameters:** If the chosen endpoint has parameters, extract the relevant keywords from the user's request and map them to the correct parameter names. For example, if the user asks for "книги в жанре здоровье" and the endpoint has a "genre" parameter, you should create a parameter \`{ "genre": "здоровье" }\`. Do not pass the entire user query as a single parameter unless it's a generic search.
4.  **Format Output:** Your final output must be ONLY the JSON object for the API call. Do not add any other text, explanations, or markdown formatting like \`\`\`json.

**Example 1:**
User Request: "покажи мне все книги"
Your JSON response:
{
  "method": "GET",
  "endpoint": "api/books",
  "params": null
}

**Example 2:**
User Request: "книги по психологии за 2020 год"
Your JSON response (this assumes a suitable endpoint exists):
{
  "method": "GET",
  "endpoint": "api/books/search",
  "params": {
    "genre": "психология",
    "year": 2020
  }
}

**Available Endpoints:**
${JSON.stringify(simplifiedEndpoints, null, 2)}

**Conversation History:**
${history}

**User Request:** "${userMessage}"

**Your JSON response:**
`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) throw new Error(`Gemini API error (getApiCall): ${response.status}`);
    if (!response.body) throw new Error("Response body is null");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponseText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullResponseText += decoder.decode(value, { stream: true });
    }
    
    try {
      // The stream returns a string that is a JSON array of response chunks.
      const responseArray = JSON.parse(fullResponseText);
      let aggregatedText = '';
      
      // Concatenate the 'text' part from each chunk in the array.
      for (const chunk of responseArray) {
          const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
              aggregatedText += text;
          }
      }

      // Now, parse the final JSON object from the aggregated text content.
      const jsonMatch = aggregatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
          throw new Error("No valid JSON object found in Gemini's aggregated response.");
      }
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse Gemini's JSON response:", fullResponseText);
      throw new Error("Ассистент вернул неверный формат данных для API вызова.");
    }
  };

  const executeApiCall = async (apiCall: { method: string; endpoint:string; params: any }) => {
    // Use the URL constructor for safer URL building
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

  const streamSummaryFromGemini = async (
    userMessage: string, 
    apiResponse: any, 
    onChunk: (chunk: string) => void,
    conversationHistory: Message[]
  ) => {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}`;
      
      const history = conversationHistory
        .map(msg => {
          let content = msg.content;
          if (content.startsWith('Думаю')) return null;

          if (msg.apiCall) {
            content += ` (API: ${msg.apiCall.method} ${msg.apiCall.endpoint})`;
          }
          return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${content}`;
        })
        .filter(Boolean)
        .join('\n\n');
      
      const prompt = `
You are a helpful library assistant called "Мудрая Сова". You have received data from an API call made to answer a user's request.
Your task is to present this data to the user in a clear, friendly, and concise way in Russian.
Use the provided conversation history to maintain context and provide relevant answers to follow-up questions.

**VERY IMPORTANT:** Your response MUST be plain text. Do NOT use any markdown formatting.
- Do NOT use asterisks (*) for lists.
- Do NOT use asterisks for bolding (**text**).
- Do NOT use any other markdown elements.
Present lists as simple, un-bulleted text paragraphs.

**Conversation History:**
${history}

Original User Request: "${userMessage}"
Data Received from API:
${JSON.stringify(apiResponse, null, 2)}
Formulate a helpful response. If the data is a list, format it nicely as plain text paragraphs. If it's a single object, describe it. If the data is empty or the API returned no content, inform the user that nothing was found or the action was completed.
Do not just dump the raw JSON.
`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!response.ok) throw new Error(`Gemini API error (summarize): ${response.status}`);
      if (!response.body) throw new Error("Response body is null");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // The Gemini stream sends a string that is a JSON array. We need to parse it.
      // However, to provide a real-time streaming effect, we can't wait for the full array.
      // We will process the stream as text and look for the 'text' fields to stream to the user.
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });

          // This is a simplified parser for the stream. It looks for text chunks inside the buffer.
          let textMatch;
          const regex = /"text":\s*"((?:\\"|[^"])*)"/g;

          while ((textMatch = regex.exec(buffer)) !== null) {
              const text = JSON.parse(`"${textMatch[1]}"`); // Properly unescape the text
              onChunk(text);
          }
          
          // To avoid re-processing, we can clear the buffer, but a more robust solution
          // would clear only the processed parts. For now, this is a pragmatic approach.
          // Let's find the last fully formed JSON object in the buffer to avoid clearing partial data.
          const lastCompleteObjectEnd = buffer.lastIndexOf('}');
          if (lastCompleteObjectEnd !== -1) {
            buffer = buffer.substring(lastCompleteObjectEnd + 1);
          }
      }
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

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiCall = await getApiCallFromGemini(userMessageText, messages);

      const thinkingMessage: Message = {
        id: generateUniqueId(),
        content: `Думаю, нужно сделать запрос...`,
        role: 'assistant',
        timestamp: new Date(),
        apiCall: apiCall
      };
      setMessages(prev => [...prev, thinkingMessage]);
      
      const apiResponse = await executeApiCall(apiCall);

      const assistantMessageId = generateUniqueId();
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        apiCall: apiCall
      };
      setMessages(prev => [...prev, assistantMessage]);

      await streamSummaryFromGemini(userMessageText, apiResponse, (chunk) => {
        setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + chunk }
              : msg
        ));
      }, messages);

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
                  disabled={isLoading || endpoints.length === 0}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim() || endpoints.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
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