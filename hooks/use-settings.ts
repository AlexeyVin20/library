import { useState, useEffect } from 'react'

export interface UserSettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  defaultViewMode: 'grid' | 'list' | 'compact'
  preferredGenres: string[]
  notifications: {
    email: {
      newBooks: boolean
      returnReminders: boolean
      recommendations: boolean
    }
    push: {
      newBooks: boolean
      returnReminders: boolean
      recommendations: boolean
    }
  }
}

const defaultSettings: UserSettings = {
  fontSize: 'medium',
  defaultViewMode: 'grid',
  preferredGenres: [],
  notifications: {
    email: {
      newBooks: true,
      returnReminders: true,
      recommendations: false
    },
    push: {
      newBooks: false,
      returnReminders: true,
      recommendations: false
    }
  }
}

const SETTINGS_KEY = 'library-user-settings'

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Загрузка настроек из localStorage при монтировании
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY)
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Сохранение настроек в localStorage
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings))
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error)
    }
  }

  // Сброс настроек к значениям по умолчанию
  const resetSettings = () => {
    setSettings(defaultSettings)
    try {
      localStorage.removeItem(SETTINGS_KEY)
    } catch (error) {
      console.error('Ошибка сброса настроек:', error)
    }
  }

  // Обновление конкретного поля уведомлений
  const updateNotificationSetting = (
    type: 'email' | 'push',
    setting: keyof UserSettings['notifications']['email'],
    value: boolean
  ) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [type]: {
          ...settings.notifications[type],
          [setting]: value
        }
      }
    })
  }

  return {
    settings,
    updateSettings,
    resetSettings,
    updateNotificationSetting,
    isLoaded
  }
} 