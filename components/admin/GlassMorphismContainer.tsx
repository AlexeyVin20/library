import React from 'react';

interface GlassMorphismContainerProps {
  children: React.ReactNode;
  backgroundPattern?: boolean;
  isDarkMode?: boolean;
}

const GlassMorphismContainer: React.FC<GlassMorphismContainerProps> = ({
  children,
  backgroundPattern = true,
  isDarkMode = false,
}) => {
  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen">
        {/* Фоновый паттерн */}
        {backgroundPattern && (
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
        )}
        
        {/* Основной контент */}
        <div className="relative z-10 bg-gray-100/70 dark:bg-neutral-900/70 backdrop-blur-xl min-h-screen p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default GlassMorphismContainer;