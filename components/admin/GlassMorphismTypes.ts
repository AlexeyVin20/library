import { ReactNode } from 'react';

// Типы для GlassMorphism
export interface GlassMorphismProps {
  children: ReactNode;
  className?: string;
  width?: number | string;
  height?: number | string;
  rotationAngle?: number;
  blur?: number;
  opacity?: number;
  highlightOpacity?: number;
  borderRadius?: number;
  bgColor?: string;
  thickness?: number; // Новый параметр
  sideColor?: string; // Новый параметр
}

// Типы для GlassMorphismCard
export interface GlassMorphismCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  borderColor?: string;
  height?: string | number;
  rotationAngle?: number;
  blur?: number;
  opacity?: number;
  isDarkMode?: boolean;
}

// Типы для GlassMorphismContainer
export interface GlassMorphismContainerProps {
  children: ReactNode;
  className?: string;
  backgroundPattern?: boolean;
  isDarkMode?: boolean;
}

// Типы для TiltedGlassPanel
export interface TiltedGlassPanelProps {
  children: ReactNode;
  className?: string;
  tiltAngle?: number;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  blur?: number;
  opacity?: number;
  isDarkMode?: boolean;
  borderColor?: string;
  interactive?: boolean;
}