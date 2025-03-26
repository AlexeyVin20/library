import React from 'react';
import GlassMorphism from './GlassMorphism';
import { GlassMorphismProps } from './GlassMorphismTypes';

interface GlassPanelWithThicknessProps extends GlassMorphismProps {
  thickness?: number;
  sideColor?: string;
}

const GlassPanelWithThickness: React.FC<GlassPanelWithThicknessProps> = ({
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
  thickness = 10,
  sideColor = 'rgba(255, 255, 255, 0.2)',
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
      {/* Боковая грань */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${thickness}px`,
          height: '100%',
          backgroundColor: sideColor,
          transform: `rotateY(-90deg) translateX(-${thickness / 2}px)`,
          transformOrigin: 'left',
          filter: `blur(${blur}px)`,
          opacity,
        }}
      />
      
      {/* Основная панель */}
      <GlassMorphism
        width={width}
        height={height}
        rotationAngle={rotationAngle}
        blur={blur}
        opacity={opacity}
        highlightOpacity={highlightOpacity}
        borderRadius={borderRadius}
        bgColor={bgColor}
        className="w-full h-full"
      >
        {children}
      </GlassMorphism>
    </div>
  );
};

export default GlassPanelWithThickness;