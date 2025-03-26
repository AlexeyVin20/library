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
  thickness = 0,
}) => {
  return (
    <div
      className={`relative ${className}`}
      style={{
        width,
        height,
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Основной контейнер с эффектом стекла */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: bgColor,
          borderRadius: `${borderRadius}px`,
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`, // Поддержка Safari
          opacity,
          transform: `rotateX(${rotationAngle}deg)`,
          transformOrigin: 'center bottom',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Блик */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, rgba(255, 255, 255, ${highlightOpacity}) 0%, transparent 50%, rgba(255, 255, 255, ${highlightOpacity / 2}) 100%)`,
            borderRadius: `${borderRadius}px`,
            pointerEvents: 'none',
          }}
        />
        {/* Контент */}
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    </div>
  );
};

export default GlassMorphism;