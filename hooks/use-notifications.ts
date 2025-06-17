"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import type { Notification, NotificationStats } from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:7139'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  stats: NotificationStats | null
  isLoading: boolean
  isConnected: boolean
  fetchNotifications: (isRead?: boolean, page?: number, pageSize?: number) => Promise<void>
  markAsRead: (notificationId: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  refreshStats: () => Promise<void>
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const [isPageVisible, setIsPageVisible] = useState(true)

  // Получение токена для авторизации
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token') || localStorage.getItem('accessToken')
  }, [])

  // Заголовки для API запросов
  const getHeaders = useCallback(() => {
    const token = getAuthToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    }
  }, [getAuthToken])

  // Получение уведомлений
  const fetchNotifications = useCallback(async (isRead?: boolean, page = 1, pageSize = 20) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (isRead !== undefined) params.append('isRead', isRead.toString())
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())

      const response = await fetch(`${API_BASE_URL}/api/Notification?${params}`, {
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setNotifications(data)
      
      // Обновляем счетчик непрочитанных из полученных данных
      if (Array.isArray(data)) {
        const unread = data.filter((n: Notification) => !n.isRead).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('Ошибка получения уведомлений:', error)
    } finally {
      setIsLoading(false)
    }
  }, [getHeaders])

  // Получение количества непрочитанных уведомлений
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Notification/unread-count`, {
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Ошибка получения количества непрочитанных уведомлений:', error)
    }
  }, [getHeaders])

  // Получение статистики уведомлений
  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Notification/stats`, {
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Статистика уведомлений:', data)
      
      // Безопасная установка данных с проверками
      const safeStats = {
        totalNotifications: data.totalNotifications || 0,
        unreadNotifications: data.unreadNotifications || 0,
        readNotifications: data.readNotifications || 0,
        deliveredNotifications: data.deliveredNotifications || 0,
        pendingNotifications: data.pendingNotifications || 0,
        notificationsByType: (data.notificationsByType && typeof data.notificationsByType === 'object') ? data.notificationsByType : {},
        notificationsByPriority: (data.notificationsByPriority && typeof data.notificationsByPriority === 'object') ? data.notificationsByPriority : {}
      }
      
      setStats(safeStats)
    } catch (error) {
      console.error('Ошибка получения статистики уведомлений:', error)
    }
  }, [getHeaders])

  // Отметка уведомления как прочитанного
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Notification/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Обновляем локальное состояние
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      )
      
      // Обновляем счетчик непрочитанных
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      return true
    } catch (error) {
      console.error('Ошибка отметки уведомления как прочитанного:', error)
      return false
    }
  }, [getHeaders])

  // Отметка всех уведомлений как прочитанных
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Notification/mark-all-read`, {
        method: 'PUT',
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Обновляем локальное состояние
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      
      // Сбрасываем счетчик непрочитанных
      setUnreadCount(0)
      
      return true
    } catch (error) {
      console.error('Ошибка отметки всех уведомлений как прочитанных:', error)
      return false
    }
  }, [getHeaders])

  // Настройка SignalR соединения
  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      console.log('SignalR: токен авторизации не найден')
      setIsConnected(false)
      return
    }

    console.log('SignalR: настройка соединения с', `${API_BASE_URL}/notificationHub`)

    let isCleanedUp = false

    // Добавляем небольшую задержку для избежания конфликтов при обновлении страницы
    const connectionTimeout = setTimeout(() => {
      if (isCleanedUp) return

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/notificationHub`, {
          accessTokenFactory: () => {
            const currentToken = getAuthToken()
            console.log('SignalR: получение токена для подключения, токен найден:', !!currentToken)
            return currentToken || ''
          },
          // Добавляем настройки для более стабильного соединения
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
          // Добавляем таймауты для более надежного соединения
          timeout: 30000, // 30 секунд таймаут
          // Настройки для обработки проблем с сетью
          headers: {
            "Connection": "keep-alive"
          }
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000, 60000]) // Добавляем больше попыток
        // Уменьшаем уровень логирования чтобы избежать лишнего шума
        .configureLogging(signalR.LogLevel.Warning)
        .build()

      connectionRef.current = connection

      // Обработчик получения новых уведомлений
      connection.on('ReceiveNotification', (notification: any) => {
        console.log('Получено новое уведомление:', notification)
        
        // Добавляем новое уведомление в список
        const newNotification: Notification = {
          id: crypto.randomUUID(), // Временный ID до обновления списка
          userId: '',
          title: notification.Title || notification.title,
          message: notification.Message || notification.message,
          type: notification.Type || notification.type || 'GeneralInfo',
          priority: notification.Priority || notification.priority || 'Normal',
          createdAt: notification.Timestamp || notification.createdAt || new Date().toISOString(),
          isRead: false,
          isDelivered: true,
          deliveredAt: notification.Timestamp || notification.createdAt || new Date().toISOString(),
        }

        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)

        // Показываем браузерное уведомление, если разрешено
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/icons/logo.svg',
          })
        }
      })

      // Запуск соединения с обработкой ошибок
      connection.start()
        .then(() => {
          if (!isCleanedUp) {
            console.log('SignalR соединение успешно установлено')
            setIsConnected(true)
          }
        })
        .catch((error) => {
          if (!isCleanedUp) {
            // Классифицируем ошибки для лучшей обработки
            const errorMessage = error.message || error.toString()
            
            if (errorMessage.includes('stopped during negotiation')) {
              console.log('SignalR: соединение прервано во время согласования (обычно при обновлении страницы)')
            } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('WebSocket closed')) {
              console.log('SignalR: проблема с сетевым соединением, попытка переподключения...')
              // Попытаемся переподключиться через некоторое время, только если страница видима
              setTimeout(() => {
                if (!isCleanedUp && !document.hidden && connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Disconnected) {
                  console.log('SignalR: попытка автоматического переподключения...')
                  connectionRef.current.start().catch(() => {
                    // Игнорируем ошибки при автоматическом переподключении
                  })
                }
              }, 5000)
            } else {
              console.error('SignalR: неожиданная ошибка подключения:', error)
            }
            setIsConnected(false)
          }
        })

      // Обработчики переподключения
      connection.onreconnecting((error) => {
        if (!isCleanedUp) {
          console.log('SignalR переподключение...', error)
          setIsConnected(false)
        }
      })

      connection.onreconnected((connectionId) => {
        if (!isCleanedUp) {
          console.log('SignalR переподключено, ID:', connectionId)
          setIsConnected(true)
        }
      })

      connection.onclose((error) => {
        if (!isCleanedUp) {
          if (error) {
            const errorMessage = error.message || error.toString()
            
            if (errorMessage.includes('stopped during negotiation')) {
              console.log('SignalR: соединение закрыто во время согласования')
            } else if (errorMessage.includes('WebSocket closed with status code: 1006')) {
              console.log('SignalR: соединение закрыто из-за бездействия или проблем с сетью')
              // Попытаемся переподключиться при аномальном закрытии, только если страница видима
              setTimeout(() => {
                if (!isCleanedUp && !document.hidden && connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Disconnected) {
                  console.log('SignalR: попытка переподключения после аномального закрытия...')
                  connectionRef.current.start().catch(() => {
                    // Игнорируем ошибки при переподключении
                  })
                }
              }, 3000)
            } else {
              console.log('SignalR: соединение закрыто с ошибкой:', error)
            }
          } else {
            console.log('SignalR: соединение закрыто нормально')
          }
          setIsConnected(false)
        }
      })
    }, 100) // Небольшая задержка в 100мс

    return () => {
      isCleanedUp = true
      clearTimeout(connectionTimeout)
      if (connectionRef.current) {
        console.log('SignalR: принудительное закрытие соединения')
        connectionRef.current.stop().catch(() => {
          // Игнорируем ошибки при закрытии
        })
      }
    }
  }, [getAuthToken])

  // Отслеживание видимости страницы для оптимизации подключений
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      setIsPageVisible(isVisible)
      
      if (isVisible) {
        console.log('SignalR: страница стала видимой, проверяем подключение...')
        // Проверяем состояние подключения при возвращении на страницу
        if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Disconnected) {
          const token = getAuthToken()
          if (token) {
            setTimeout(() => {
              connectionRef.current?.start().catch(() => {
                // Игнорируем ошибки при переподключении
              })
            }, 1000)
          }
        }
      } else {
        console.log('SignalR: страница скрыта')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [getAuthToken])

  // Запрос разрешения на браузерные уведомления
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Загрузка данных при монтировании
  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      console.log('Инициализация данных уведомлений')
      fetchNotifications()
      fetchUnreadCount()
      refreshStats()
    } else {
      console.log('Токен не найден, пропускаем загрузку уведомлений')
      // Сбрасываем состояние при отсутствии токена
      setNotifications([])
      setUnreadCount(0)
      setStats(null)
      setIsConnected(false)
    }
  }, [getAuthToken, fetchNotifications, fetchUnreadCount, refreshStats])

  return {
    notifications,
    unreadCount,
    stats,
    isLoading,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshStats,
  }
} 