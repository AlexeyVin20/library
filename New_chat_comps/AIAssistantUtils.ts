// AIAssistantUtils.ts
// Утилиты и хелперы для AI ассистента

import type { Tool, Message } from './AIAssistantTypes'

// T9 функциональность
export class T9Helper {
  private static keyMap: { [key: string]: string[] } = {
    '2': ['а', 'б', 'в', 'г'],
    '3': ['д', 'е', 'ё', 'ж', 'з'],
    '4': ['и', 'й', 'к', 'л'],
    '5': ['м', 'н', 'о', 'п'],
    '6': ['р', 'с', 'т', 'у'],
    '7': ['ф', 'х', 'ц', 'ч'],
    '8': ['ш', 'щ', 'ъ', 'ы'],
    '9': ['ь', 'э', 'ю', 'я']
  }

  private static commands = [
    'покажи всех пользователей',
    'покажи все книги',
    'покажи все резервирования',
    'создать пользователя',
    'создать книгу',
    'создать резервирование',
    'найти пользователя',
    'найти книгу',
    'статистика пользователей',
    'статистика книг',
    'статистика резервирований',
    'построить график',
    'создать отчет',
    'топ популярных книг',
    'просроченные резервирования',
    'активные резервирования',
    'одобрить резервирование',
    'отменить резервирование',
    'вернуть книгу',
    'выдать книгу',
    'назначить роль',
    'изменить пароль',
    'отправить уведомление'
  ]

  static getSuggestions(input: string): string[] {
    if (!input.trim()) return []
    
    const normalizedInput = input.toLowerCase().trim()
    
    // Поиск по началу строки
    const startsWith = this.commands.filter(cmd => 
      cmd.toLowerCase().startsWith(normalizedInput)
    )
    
    // Поиск по содержанию
    const contains = this.commands.filter(cmd => 
      cmd.toLowerCase().includes(normalizedInput) && 
      !cmd.toLowerCase().startsWith(normalizedInput)
    )
    
    // Нечеткий поиск
    const fuzzy = this.commands.filter(cmd => {
      const words = normalizedInput.split(' ')
      return words.every(word => cmd.toLowerCase().includes(word))
    }).filter(cmd => !startsWith.includes(cmd) && !contains.includes(cmd))
    
    return [...startsWith, ...contains, ...fuzzy].slice(0, 5)
  }

  static convertT9ToText(t9Input: string): string[] {
    if (!/^\d+$/.test(t9Input)) return []
    
    const possibilities: string[][] = []
    
    for (const digit of t9Input) {
      if (this.keyMap[digit]) {
        possibilities.push(this.keyMap[digit])
      } else {
        return []
      }
    }
    
    // Генерируем все возможные комбинации
    const combinations: string[] = []
    
    const generate = (current: string, index: number) => {
      if (index === possibilities.length) {
        combinations.push(current)
        return
      }
      
      for (const letter of possibilities[index]) {
        generate(current + letter, index + 1)
      }
    }
    
    generate('', 0)
    
    // Фильтруем по существующим командам
    return this.commands.filter(cmd => 
      combinations.some(combo => cmd.toLowerCase().includes(combo))
    ).slice(0, 3)
  }
}

// Утилиты для работы с API
export class APIUtils {
  static async makeRequest(
    endpoint: string, 
    method: string = 'GET', 
    data?: any
  ): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const token = localStorage.getItem('token')
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
    
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data)
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, config)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  }

  static formatApiError(error: any): string {
    if (error.message) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return 'Произошла неизвестная ошибка'
  }
}

// Утилиты для форматирования данных
export class DataFormatter {
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  static formatUserRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'Admin': 'Администратор',
      'Librarian': 'Библиотекарь',
      'User': 'Пользователь',
      'Student': 'Студент'
    }
    return roleMap[role] || role
  }

  static formatReservationStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Processing': 'Обрабатывается',
      'Approved': 'Одобрена',
      'Cancelled': 'Отменена',
      'Expired': 'Истекла',
      'Issued': 'Выдана',
      'Returned': 'Возвращена',
      'Overdue': 'Просрочена'
    }
    return statusMap[status] || status
  }

  static formatBookStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Available': 'Доступна',
      'Reserved': 'Зарезервирована',
      'Issued': 'Выдана',
      'Maintenance': 'На обслуживании',
      'Lost': 'Утеряна',
      'Damaged': 'Повреждена'
    }
    return statusMap[status] || status
  }
}

// Утилиты для работы с историей
export class HistoryManager {
  private static readonly STORAGE_KEY = 'ai_assistant_history'
  private static readonly MAX_HISTORY_SIZE = 100

  static saveToHistory(message: Message): void {
    try {
      const history = this.getHistory()
      history.unshift(message)
      
      // Ограничиваем размер истории
      if (history.length > this.MAX_HISTORY_SIZE) {
        history.splice(this.MAX_HISTORY_SIZE)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Ошибка сохранения в историю:', error)
    }
  }

  static getHistory(): Message[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Ошибка загрузки истории:', error)
      return []
    }
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Ошибка очистки истории:', error)
    }
  }

  static searchHistory(query: string): Message[] {
    const history = this.getHistory()
    const normalizedQuery = query.toLowerCase().trim()
    
    return history.filter(message => 
      message.content.toLowerCase().includes(normalizedQuery)
    ).slice(0, 10)
  }
}

// Утилиты для валидации
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  static isValidISBN(isbn: string): boolean {
    const cleanISBN = isbn.replace(/[\s\-]/g, '')
    return /^(\d{10}|\d{13})$/.test(cleanISBN)
  }

  static isValidGUID(guid: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return guidRegex.test(guid)
  }
}

// Утилиты для работы с командами
export class CommandUtils {
  static parseCommand(input: string): { command: string; params: string[] } {
    const parts = input.trim().split(/\s+/)
    const command = parts[0].toLowerCase()
    const params = parts.slice(1)
    
    return { command, params }
  }

  static isSystemCommand(input: string): boolean {
    const systemCommands = ['/help', '/clear', '/history', '/settings', '/stop']
    return systemCommands.some(cmd => input.toLowerCase().startsWith(cmd))
  }

  static executeSystemCommand(input: string): string | null {
    const { command } = this.parseCommand(input)
    
    switch (command) {
      case '/help':
        return 'Доступные команды:\n/help - показать справку\n/clear - очистить чат\n/history - показать историю\n/settings - настройки\n/stop - остановить ассистента'
      
      case '/clear':
        return 'CLEAR_CHAT'
      
      case '/history':
        return 'SHOW_HISTORY'
      
      case '/settings':
        return 'SHOW_SETTINGS'
      
      case '/stop':
        return 'STOP_ASSISTANT'
      
      default:
        return null
    }
  }
}

// Экспорт всех утилит
export {
  T9Helper,
  APIUtils,
  DataFormatter,
  HistoryManager,
  ValidationUtils,
  CommandUtils
}

