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
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, ${
                isDarkMode ? '#1f2937' : '#e5e7eb'
              } 1px, transparent 1px)`,
              backgroundSize: '16px 16px',
            }}
          />
        )}
        
        {/* Основной контент */}
        <div
          className="relative z-10 min-h-screen p-6"
          style={{
            backgroundColor: isDarkMode
              ? 'rgba(23, 23, 28, 0.7)'
              : 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default GlassMorphismContainer;