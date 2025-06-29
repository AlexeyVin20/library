import { useEffect } from 'react'
import { useSettings } from './use-settings'

export function useFontSize() {
  const { settings, isLoaded } = useSettings()

  useEffect(() => {
    if (!isLoaded) return

    const root = document.documentElement

    // Устанавливаем CSS переменную для размера шрифта
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px', 
      'large': '18px',
      'extra-large': '20px'
    }

    const fontSize = fontSizeMap[settings.fontSize]
    root.style.setProperty('--user-font-size', fontSize)

    // Добавляем класс для более точного контроля
    const fontSizeClass = `font-size-${settings.fontSize}`
    
    // Удаляем все классы размера шрифта
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-extra-large')
    
    // Добавляем текущий класс
    root.classList.add(fontSizeClass)

  }, [settings.fontSize, isLoaded])

  return settings.fontSize
} 