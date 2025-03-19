import React from 'react';
import { GlassMorphismProps } from './GlassMorphismTypes';

const GlassMorphism: React.FC<GlassMorphismProps> = ({
  children,
  className = '',
  width = '100%',
  height = '100%',
  rotationAngle = 15,
  blur = 10,
  opacity = 0.3,
  highlightOpacity = 0.15,
  borderRadius = 16,
  bgColor = 'rgba(255, 255, 255, 0.1)',
  thickness = 0, // Новый параметр для толщины
}) => {
  const svgId = `glass-morphism-${Math.random().toString(36).substring(2, 9)}`;
  const filterId = `blur-filter-${Math.random().toString(36).substring(2, 9)}`;
  const gradientId = `glass-gradient-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* SVG для создания эффекта стекла */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        xmlns="http://www.w3.org/2000/svg"
        id={svgId}
        style={{
          transform: `perspective(1000px) rotateX(${rotationAngle}deg)`,
          transformOrigin: 'center bottom',
        }}
      >
        <defs>
          {/* Фильтр для размытия */}
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} />
          </filter>
          
          {/* Градиент для эффекта блеска стекла */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" stopOpacity={highlightOpacity} />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0)" stopOpacity="0" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.2)" stopOpacity={highlightOpacity / 2} />
          </linearGradient>
        </defs>
        
        {/* Основной прямоугольник стекла */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={bgColor}
          rx={borderRadius}
          ry={borderRadius}
          opacity={opacity}
          style={{ filter: `url(#${filterId})` }}
        />
        
        {/* Блик на стекле */}
        <rect
          x="5%"
          y="5%"
          width="90%"
          height="90%"
          fill={`url(#${gradientId})`}
          rx={borderRadius - 2}
          ry={borderRadius - 2}
        />
      </svg>
      
      {/* Контейнер для контента */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};

export default GlassMorphism;