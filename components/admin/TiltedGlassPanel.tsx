import React, { useState, useRef, useEffect } from 'react';
import { TiltedGlassPanelProps } from './GlassMorphismTypes';

const TiltedGlassPanel: React.FC<TiltedGlassPanelProps> = ({
  children,
  className = '',
  tiltAngle = 5,
  maxTilt = 10,
  perspective = 1000,
  scale = 1.03,
  blur = 8,
  opacity = 0.25,
  isDarkMode = false,
  borderColor,
  interactive = true,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: `perspective(${perspective}px) rotateX(${tiltAngle}deg) rotateY(0deg) scale(1)`,
  });

  // Цвета для разных тем
  const bgColor = isDarkMode 
    ? 'rgba(30, 30, 35, 0.5)' 
    : 'rgba(255, 255, 255, 0.25)';

  const borderStyle = borderColor 
    ? { borderLeft: `4px solid ${borderColor}` } 
    : {};

  // Обработчик движения мыши для интерактивного наклона
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Рассчитываем наклон в зависимости от положения курсора
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    const rotateX = -((y - centerY) / centerY) * maxTilt;
    
    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
      transition: 'transform 0.1s ease-out',
    });
  };

  // Сброс наклона при уходе курсора
  const handleMouseLeave = () => {
    if (!interactive) return;
    
    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(${tiltAngle}deg) rotateY(0deg) scale(1)`,
      transition: 'transform 0.3s ease-out',
    });
  };

  // Установка начального наклона
  useEffect(() => {
    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(${tiltAngle}deg) rotateY(0deg) scale(1)`,
      transition: 'transform 0.3s ease-out',
    });
  }, [perspective, tiltAngle]);

  return (
    <div 
      ref={panelRef}
      className={`relative overflow-hidden rounded-xl shadow-lg ${className}`}
      style={{ 
        ...tiltStyle,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Эффект стекла */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: bgColor,
          backdropFilter: `blur(${blur}px)`,
          ...borderStyle,
          borderRadius: 'inherit',
          boxShadow: isDarkMode 
            ? 'inset 0 0 20px rgba(255, 255, 255, 0.04)' 
            : 'inset 0 0 20px rgba(0, 0, 0, 0.03)',
        }}
      />
      
      {/* Блики на стекле */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(to bottom right, rgba(255, 255, 255, ${opacity * 1.5}), rgba(255, 255, 255, 0) 80%)`,
          borderRadius: 'inherit',
          opacity: opacity,
        }}
      />
      
      {/* Контент */}
      <div 
        className="relative z-10 h-full"
        style={{ transform: 'translateZ(20px)' }}
      >
        {children}
      </div>
    </div>
  );
};

export default TiltedGlassPanel; 