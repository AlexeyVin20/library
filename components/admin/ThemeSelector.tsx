import React from 'react';

const ThemeSelector = () => {
  const renderIcon = () => {
    // Only glassmorphism icon is needed now
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v2"></path>
        <path d="M16 3v2"></path>
        <path d="M8 14h8"></path>
        <path d="M8 18h8"></path>
        <path d="M6 6h12v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6Z"></path>
      </svg>
    );
  };

  return (
    <div className="relative">
      <button 
        className="flex items-center gap-2 bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-lg px-3 py-2 hover:bg-white/20 dark:hover:bg-gray-700/20 transition-colors shadow-lg"
      >
        <span className="text-sm">Glass</span>
        {renderIcon()}
      </button>
      
      {/* Dropdown is hidden since we only have one theme now */}
      <div className="absolute right-0 mt-2 hidden z-20 backdrop-blur-xl bg-white/10 dark:bg-gray-800/10 rounded-lg border border-white/30 dark:border-gray-700/30 shadow-lg w-48">
        <ul className="py-1">
          <li>
            <button
              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 bg-blue-100/20 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            >
              {renderIcon()}
              Glass
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ThemeSelector;