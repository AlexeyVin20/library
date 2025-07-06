import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  Mouse, 
  MousePointer, 
  Maximize2, 
  Minimize2, 
  RotateCcw,
  Zap,
  ScrollText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedIframePreviewProps {
  route: string;
  isVisible: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
  enableScrollControl?: boolean;
  enableFullscreen?: boolean;
  enableZoom?: boolean;
  initialScrollMode?: boolean;
}

const getPositionClasses = (position: string) => {
  switch (position) {
    case 'top':
      return 'bottom-full mb-2';
    case 'left':
      return 'right-full mr-2';
    case 'right':
      return 'left-full ml-2';
    default:
      return 'top-full mt-2';
  }
};

export const EnhancedIframePreview: React.FC<EnhancedIframePreviewProps> = ({
  route,
  isVisible,
  position = 'bottom',
  className,
  delay = 800,
  enableScrollControl = true,
  enableFullscreen = true,
  enableZoom = true,
  initialScrollMode = false
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isScrollMode, setIsScrollMode] = useState(initialScrollMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.5);
  const [showControls, setShowControls] = useState(initialScrollMode);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isVisible) {
      timeoutId = setTimeout(() => {
        setShouldLoad(true);
      }, delay);
    } else {
      setShouldLoad(false);
      setIsLoading(true);
      setHasError(false);
      setIsScrollMode(false);
      setIsFullscreen(false);
      setZoomLevel(0.5);
      setShowControls(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isVisible, delay]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Функции управления скроллом
  const disableBodyScroll = () => {
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '15px';
  };

  const enableBodyScroll = () => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  };

  const enterScrollMode = () => {
    if (!enableScrollControl) return;
    
    setIsScrollMode(true);
    setShowControls(true);
    
    if (iframeRef.current) {
      iframeRef.current.style.pointerEvents = 'auto';
    }
  };

  const exitScrollMode = () => {
    if (!enableScrollControl) return;
    
    setIsScrollMode(false);
    setShowControls(false);
    
    if (iframeRef.current) {
      iframeRef.current.style.pointerEvents = 'none';
    }
  };

  const toggleFullscreen = () => {
    if (!enableFullscreen) return;
    
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      enterScrollMode();
    } else {
      exitScrollMode();
    }
    setZoomLevel(0.5);
  };

  const handleZoomIn = () => {
    if (!enableZoom) return;
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    if (!enableZoom) return;
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(0.5);
  };

  // Очистка при размонтировании
  useEffect(() => {
    if (isScrollMode) {
      disableBodyScroll();
    } else {
      enableBodyScroll();
    }
    return () => {
      enableBodyScroll();
    };
  }, [isScrollMode]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!enableScrollControl || isScrollMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    enterScrollMode();
  };

  // Обработчики клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isScrollMode && !isFullscreen) return;
      
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          }
          exitScrollMode();
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey && enableFullscreen) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case '+':
        case '=':
          if (e.ctrlKey && enableZoom) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey && enableZoom) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey && enableZoom) {
            e.preventDefault();
            resetZoom();
          }
          break;
      }
    };

    if (isScrollMode || isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isScrollMode, isFullscreen, enableFullscreen, enableZoom]);

  // Обработчик клика вне iframe
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if ((isScrollMode || isFullscreen) && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isFullscreen) {
          setIsFullscreen(false);
        }
        exitScrollMode();
      }
    };

    if (isScrollMode || isFullscreen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isScrollMode, isFullscreen]);

  const getContainerClasses = () => {
    if (isFullscreen) {
      return "fixed inset-4 w-auto h-auto z-[999]";
    }
    if (isScrollMode) {
      return "fixed inset-8 w-auto h-auto z-[999]";
    }
    return cn("absolute w-[800px] z-[500]", getPositionClasses(position));
  };

  const getCardClasses = () => {
    return cn(
      "backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-600 shadow-xl overflow-hidden transition-all duration-300",
      (isScrollMode || isFullscreen) && "border-blue-500 shadow-2xl"
    );
  };

  const getPreviewHeight = () => {
    if (isFullscreen) return "h-[calc(100vh-10rem)]";
    if (isScrollMode) return "h-[calc(100vh-12rem)]";
    return "h-[450px]";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
          animate={{ 
            opacity: 1, 
            scale: (isScrollMode || isFullscreen) ? 1.05 : 1, 
            y: 0,
            zIndex: (isScrollMode || isFullscreen) ? 999 : 500
          }}
          exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(getContainerClasses(), className)}
        >
          <Card className={getCardClasses()}>
            <CardContent className="p-0">
              {/* Enhanced Header */}
              <div className={cn(
                "p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 transition-all duration-300",
                (isScrollMode || isFullscreen) && "bg-blue-50 dark:bg-blue-900/50"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        (isScrollMode || isFullscreen) ? "bg-blue-500" : "bg-red-400"
                      )}></div>
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        (isScrollMode || isFullscreen) ? "bg-blue-400" : "bg-yellow-400"
                      )}></div>
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        (isScrollMode || isFullscreen) ? "bg-blue-300" : "bg-green-400"
                      )}></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {route}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Control buttons */}
                    {showControls && (
                      <div className="flex items-center gap-1">
                        {enableZoom && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={handleZoomOut}
                            >
                              <span className="text-xs">-</span>
                            </Button>
                            <span className="text-xs text-gray-500 min-w-10 text-center">
                              {Math.round(zoomLevel * 100)}%
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={handleZoomIn}
                            >
                              <span className="text-xs">+</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={resetZoom}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        
                        {enableFullscreen && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={toggleFullscreen}
                          >
                            {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Status indicators */}
                    {enableScrollControl && !isScrollMode && !isFullscreen && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MousePointer className="h-3 w-3" />
                        <span>Клик для скролла</span>
                      </div>
                    )}
                    
                    {(isScrollMode || isFullscreen) && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <Mouse className="h-3 w-3" />
                        <span>ESC для выхода</span>
                      </div>
                    )}
                    
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Enhanced Preview Content */}
              <div 
                className={cn(
                  "relative bg-gray-100 dark:bg-gray-800 transition-all duration-300",
                  getPreviewHeight()
                )}
                onClick={handleContainerClick}
                style={{ cursor: enableScrollControl && !isScrollMode && !isFullscreen ? 'pointer' : 'default' }}
              >
                {!shouldLoad ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Подготовка предварительного просмотра...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                        <div className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Загрузка страницы...
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {hasError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                        <div className="text-center">
                          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Не удалось загрузить предварительный просмотр
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <iframe
                      ref={iframeRef}
                      src={route}
                      className="w-full h-full border-none"
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                      style={{
                        transform: `scale(${(isScrollMode || isFullscreen) ? zoomLevel : 0.5})`,
                        transformOrigin: 'top left',
                        width: (isScrollMode || isFullscreen) ? `${100 / zoomLevel}%` : '200%',
                        height: (isScrollMode || isFullscreen) ? `${100 / zoomLevel}%` : '200%',
                        pointerEvents: (isScrollMode || isFullscreen) ? 'auto' : 'none',
                        transition: 'all 0.3s ease-out'
                      }}
                    />
                  </>
                )}
              </div>

              {/* Enhanced Footer */}
              {!isScrollMode && !isFullscreen && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {enableScrollControl ? 'Клик для скролла' : 'Предварительный просмотр'} 
                    {enableFullscreen && ' • F11 для полноэкранного режима'}
                  </div>
                </div>
              )}
              
              {/* Interactive Footer */}
              {(isScrollMode || isFullscreen) && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/50 border-t border-blue-200 dark:border-blue-600">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <ScrollText className="h-3 w-3" />
                      <span>
                        {isFullscreen ? 'Полноэкранный режим' : 'Интерактивный режим'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-500 dark:text-blue-300">
                      {enableZoom && (
                        <span>Ctrl + / - для масштаба</span>
                      )}
                      <span>ESC для выхода</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedIframePreview; 