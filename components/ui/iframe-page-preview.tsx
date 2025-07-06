import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Loader2, AlertCircle, Mouse, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IframePagePreviewProps {
  route: string;
  isVisible: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
  enableScrollControl?: boolean;
}

const getPositionClasses = (position: string) => {
  switch (position) {
    case 'top':
      return 'bottom-full mb-4';
    case 'left':
      return 'right-full mr-4';
    case 'right':
      return 'left-full ml-4';
    default:
      return 'top-full mt-4';
  }
};

export const IframePagePreview: React.FC<IframePagePreviewProps> = ({
  route,
  isVisible,
  position = 'bottom',
  className,
  delay = 800, // Задержка перед загрузкой iframe
  enableScrollControl = true
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dragControls = useDragControls();

  // Управляем скроллом основной страницы
  useEffect(() => {
    // Функция для блокировки скролла основной страницы
    const disableBodyScroll = () => {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Компенсация ширины скроллбара
    };

    // Функция для разблокировки скролла основной страницы
    const enableBodyScroll = () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
    
    if (isVisible && enableScrollControl) {
      disableBodyScroll();
    } else {
      enableBodyScroll();
    }
    
    // Очистка при размонтировании
    return () => enableBodyScroll();
  }, [isVisible, enableScrollControl]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isVisible) {
      // Загружаем iframe только после задержки
      timeoutId = setTimeout(() => {
        setShouldLoad(true);
      }, delay);
    } else {
      setShouldLoad(false);
      setIsLoading(true);
      setHasError(false);
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          drag
          dragListener={false}
          dragControls={dragControls}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
          animate={{ 
            opacity: 1, 
            scale: 1, // Размер остается стабильным
            y: 0,
            zIndex: 500 // Всегда наверху
          }}
          exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "absolute z-[500] w-[800px] h-[450px] transform-origin-top",
            getPositionClasses(position),
            className
          )}
        >
          <Card className={cn(
            "backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-600 shadow-xl overflow-hidden transition-all duration-300 h-full flex flex-col",
            "border-blue-500 shadow-2xl" // Всегда активный стиль
          )}>
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="drag-handle p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 cursor-move flex items-center justify-between text-xs select-none"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex gap-1.5 items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 font-mono truncate ml-2" title={route}>{route}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <Mouse className="h-4 w-4" />
                        <span>Скролл</span>
                    </div>
                    <a href={route} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500" title="Открыть в новой вкладке">
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>
            </div>
            <CardContent className="p-0 h-full flex flex-col">
              {/* Preview Content */}
              <div 
                className={cn(
                  "relative bg-gray-100 dark:bg-gray-800 transition-all duration-300 flex-1",
                )}
                style={{ cursor: 'default' }}
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
                      src={`${route}?preview=true`}
                      className="w-full h-full border-none"
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                      style={{
                        transform: 'scale(0.5)',
                        transformOrigin: 'top left',
                        width: '200%',
                        height: '200%',
                        pointerEvents: 'auto',
                        transition: 'transform 0.3s ease-out'
                      }}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IframePagePreview; 