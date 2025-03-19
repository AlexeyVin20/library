import React from 'react';
import GlassMorphism from './GlassMorphism';
import { GlassMorphismCardProps } from './GlassMorphismTypes';

const GlassMorphismCard: React.FC<GlassMorphismCardProps> = ({
  children,
  className = '',
  title,
  borderColor,
  height = 'auto',
  rotationAngle = 3,
  blur = 10,
  opacity = 0.25,
  isDarkMode = false,
}) => {
  // Улучшенные цвета для светлой и темной темы с более выраженным эффектом стекла
  const bgColor = isDarkMode 
    ? 'rgba(23, 23, 28, 0.7)' 
    : 'rgba(255, 255, 255, 0.25)';
  
  // Улучшенные классы для стилей заголовка с более контрастным текстом
  const titleClasses = 'text-xl font-bold mb-4 border-b pb-2';
  const titleDarkClasses = isDarkMode 
    ? 'text-white border-neutral-700/30' 
    : 'text-neutral-900 border-white/30';

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Обертка для бордера слева с улучшенной видимостью */}
      {borderColor && (
        <div 
          className="absolute left-0 top-0 h-full w-1.5" 
          style={{ 
            backgroundColor: borderColor,
            borderTopLeftRadius: '0.75rem',
            borderBottomLeftRadius: '0.75rem',
            zIndex: 11,
            boxShadow: `0 0 10px ${borderColor}`
          }}
        />
      )}
      
      <GlassMorphism 
        rotationAngle={rotationAngle}
        blur={blur}
        opacity={opacity}
        bgColor={bgColor}
        borderRadius={12}
      >
        <div className="p-6 h-full flex flex-col">
          {title && (
            <h3 className={`${titleClasses} ${titleDarkClasses}`}>
              {title}
            </h3>
          )}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </GlassMorphism>
    </div>
  );
};

export default GlassMorphismCard; 