import { useState, useRef, useCallback, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  X,
  Loader2,
  ArrowUp,
  Mic,
  Paperclip,
  Command,
  Bot,
  Check,
  ChevronDown,
  ImageIcon,
  FileText,
  Code,
  BookOpen,
  PenTool,
  BrainCircuit,
  Search,
  Plus,
  FileUp,
  Figma,
  MonitorIcon,
} from "lucide-react";
import * as React from "react";

// Utils function
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Auto-resize textarea hook
interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

// Textarea component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showRing && isFocused && (
          <motion.span 
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

// Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    };
    
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Command suggestion interface
interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

// Message interface
interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Typing dots component
function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
          initial={{ opacity: 0.3 }}
          animate={{ 
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: "easeInOut",
          }}
          style={{
            boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)"
          }}
        />
      ))}
    </div>
  );
}

// Command button component
interface CommandButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function CommandButton({ icon, label, isActive, onClick }: CommandButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all",
        isActive
          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 shadow-sm"
          : "bg-background border-border hover:border-violet-300 dark:hover:border-violet-700"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={cn(
        "transition-colors",
        isActive ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-sm font-medium transition-colors",
        isActive ? "text-violet-700 dark:text-violet-300" : "text-foreground"
      )}>
        {label}
      </span>
    </motion.button>
  );
}

// Main AI Assistant component
export function ModernAIAssistant() {
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeCommandCategory, setActiveCommandCategory] = useState<string | null>(null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
  const [reasonEnabled, setReasonEnabled] = useState(false);
  
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });
  
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const commandSuggestions: CommandSuggestion[] = [
    { 
      icon: <ImageIcon className="w-4 h-4" />, 
      label: "Clone UI", 
      description: "Generate a UI from a screenshot", 
      prefix: "/clone" 
    },
    { 
      icon: <Figma className="w-4 h-4" />, 
      label: "Import Figma", 
      description: "Import a design from Figma", 
      prefix: "/figma" 
    },
    { 
      icon: <MonitorIcon className="w-4 h-4" />, 
      label: "Create Page", 
      description: "Generate a new web page", 
      prefix: "/page" 
    },
    { 
      icon: <Sparkles className="w-4 h-4" />, 
      label: "Improve", 
      description: "Improve existing UI design", 
      prefix: "/improve" 
    },
  ];

  const quickCommands = {
    learn: [
      "Explain quantum computing principles",
      "How does machine learning work?",
      "What are design patterns?",
      "Explain blockchain technology",
      "How does React work internally?",
    ],
    code: [
      "Create a React component with TypeScript",
      "Write a Python API with FastAPI",
      "Build a responsive CSS grid layout",
      "Implement authentication with JWT",
      "Create a database schema for e-commerce",
    ],
    write: [
      "Write a technical blog post",
      "Create API documentation",
      "Draft a project proposal",
      "Write user stories for a feature",
      "Create a product requirements document",
    ],
  };

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Command palette logic
  useEffect(() => {
    if (value.startsWith('/') && !value.includes(' ')) {
      setShowCommandPalette(true);
      
      const matchingSuggestionIndex = commandSuggestions.findIndex(
        (cmd) => cmd.prefix.startsWith(value)
      );
      
      if (matchingSuggestionIndex >= 0) {
        setActiveSuggestion(matchingSuggestionIndex);
      } else {
        setActiveSuggestion(-1);
      }
    } else {
      setShowCommandPalette(false);
    }
  }, [value]);

  // Click outside handler for command palette
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector('[data-command-button]');
      
      if (commandPaletteRef.current && 
          !commandPaletteRef.current.contains(target) && 
          !commandButton?.contains(target)) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < commandSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev > 0 ? prev - 1 : commandSuggestions.length - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const selectedCommand = commandSuggestions[activeSuggestion];
          setValue(selectedCommand.prefix + ' ');
          setShowCommandPalette(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = () => {
    if (value.trim()) {
      const userMessage: Message = {
        text: value,
        isUser: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setValue("");
      adjustHeight(true);
      
      // Simulate AI response
      setIsTyping(true);
      setTimeout(() => {
        const aiResponse: Message = {
          text: generateAIResponse(userMessage.text),
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 2000 + Math.random() * 1000);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      "I understand your request. Let me help you with that by providing a comprehensive solution that addresses your specific needs.",
      "That's an excellent question! Based on current best practices and modern approaches, here's what I recommend...",
      "I can definitely assist you with this. Let me break this down into actionable steps that you can implement right away.",
      "Great idea! Here's a modern approach that incorporates the latest technologies and design patterns for optimal results.",
      "I'd be happy to help you explore this topic. Let me provide you with both theoretical background and practical examples."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleAttachFile = () => {
    const mockFileName = `document-${Math.floor(Math.random() * 1000)}.pdf`;
    setAttachments(prev => [...prev, mockFileName]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index];
    setValue(selectedCommand.prefix + ' ');
    setShowCommandPalette(false);
  };

  const selectQuickCommand = (command: string) => {
    setValue(command);
    setActiveCommandCategory(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-background via-background to-violet-50/20 dark:to-violet-950/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/5 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 w-16 h-16 mx-auto relative">
            <motion.div
              className="w-full h-full rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 mb-3">
            AI Assistant
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your intelligent companion for coding, learning, and creative tasks
          </p>
        </motion.div>

        {/* Messages area */}
        <div className="flex-1 mb-6">
          {messages.length === 0 ? (
            <motion.div 
              className="flex flex-col items-center justify-center h-64 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">How can I help you today?</h3>
              <p className="text-muted-foreground max-w-sm">
                Ask me anything, use commands, or try one of the suggestions below
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "flex",
                    msg.isUser ? "justify-end" : "justify-start"
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-2xl",
                    msg.isUser
                      ? "bg-violet-600 text-white rounded-tr-none"
                      : "bg-muted rounded-tl-none border"
                  )}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div 
                  className="flex justify-start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="max-w-[80%] p-4 rounded-2xl bg-muted rounded-tl-none border">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-violet-600" />
                      <span className="text-sm text-muted-foreground">Thinking</span>
                      <TypingDots />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <motion.div 
          className="relative backdrop-blur-xl bg-background/80 rounded-2xl border shadow-lg"
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Command palette */}
          <AnimatePresence>
            {showCommandPalette && (
              <motion.div 
                ref={commandPaletteRef}
                className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-background/95 rounded-lg z-50 shadow-lg border overflow-hidden"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                <div className="py-1">
                  {commandSuggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.prefix}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm transition-colors cursor-pointer",
                        activeSuggestion === index 
                          ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300" 
                          : "text-foreground hover:bg-muted"
                      )}
                      onClick={() => selectCommandSuggestion(index)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <div className="w-5 h-5 flex items-center justify-center text-violet-600 dark:text-violet-400">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{suggestion.label}</div>
                        <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {suggestion.prefix}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask me anything or type '/' for commands..."
              containerClassName="w-full"
              className={cn(
                "w-full px-4 py-3",
                "resize-none",
                "bg-transparent",
                "border-none",
                "text-foreground text-sm",
                "focus:outline-none",
                "placeholder:text-muted-foreground",
                "min-h-[60px]"
              )}
              style={{ overflow: "hidden" }}
              showRing={false}
            />
          </div>

          {/* Attachments */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div 
                className="px-4 pb-3 flex gap-2 flex-wrap"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {attachments.map((file, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2 text-xs bg-muted py-1.5 px-3 rounded-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <FileText className="w-3 h-3" />
                    <span>{file}</span>
                    <button 
                      onClick={() => removeAttachment(index)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="p-4 border-t flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAttachFile}
                className="h-8 px-2"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                data-command-button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCommandPalette(prev => !prev);
                }}
                className={cn(
                  "h-8 px-2",
                  showCommandPalette && "bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                )}
              >
                <Command className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchEnabled(!searchEnabled)}
                  className={cn(
                    "h-8 px-2 text-xs",
                    searchEnabled && "bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                  )}
                >
                  <Search className="w-3 h-3 mr-1" />
                  Search
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReasonEnabled(!reasonEnabled)}
                  className={cn(
                    "h-8 px-2 text-xs",
                    reasonEnabled && "bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                  )}
                >
                  <BrainCircuit className="w-3 h-3 mr-1" />
                  Reason
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="h-8 px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                onClick={handleSendMessage}
                disabled={isTyping || !value.trim()}
                className={cn(
                  "h-8 px-4 text-sm",
                  value.trim()
                    ? "bg-violet-600 hover:bg-violet-700 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
                <span className="ml-1">Send</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick commands */}
        <div className="mt-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <CommandButton
              icon={<BookOpen className="w-5 h-5" />}
              label="Learn"
              isActive={activeCommandCategory === "learn"}
              onClick={() =>
                setActiveCommandCategory(
                  activeCommandCategory === "learn" ? null : "learn"
                )
              }
            />
            <CommandButton
              icon={<Code className="w-5 h-5" />}
              label="Code"
              isActive={activeCommandCategory === "code"}
              onClick={() =>
                setActiveCommandCategory(
                  activeCommandCategory === "code" ? null : "code"
                )
              }
            />
            <CommandButton
              icon={<PenTool className="w-5 h-5" />}
              label="Write"
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
                className="overflow-hidden"
              >
                <div className="bg-background/80 backdrop-blur-sm rounded-xl border p-4">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    {activeCommandCategory === "learn"
                      ? "Learning suggestions"
                      : activeCommandCategory === "code"
                      ? "Coding suggestions"
                      : "Writing suggestions"}
                  </h3>
                  <div className="space-y-2">
                    {quickCommands[activeCommandCategory as keyof typeof quickCommands].map((command, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => selectQuickCommand(command)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors text-sm"
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

      {/* Interactive cursor effect */}
      {inputFocused && (
        <motion.div 
          className="fixed w-96 h-96 rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
          animate={{
            x: mousePosition.x - 192,
            y: mousePosition.y - 192,
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 150,
            mass: 0.5,
          }}
        />
      )}
    </div>
  );
}

export default function Demo() {
  return <ModernAIAssistant />;
}