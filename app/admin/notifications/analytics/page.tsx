'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/calendar-range'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Calendar, Download, TrendingUp, TrendingDown, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { DateRange } from 'react-day-picker'

interface AnalyticsData {
  totalNotifications: number
  readRate: number
  avgResponseTime: number
  topTypes: Array<{
    type: string
    count: number
    percentage: number
  }>
  timeSeriesData: Array<{
    date: string
    sent: number
    read: number
    unread: number
  }>
  userEngagement: Array<{
    userId: string
    userName: string
    totalReceived: number
    readCount: number
    readRate: number
  }>
  priorityDistribution: Array<{
    priority: string
    count: number
    percentage: number
  }>
  responseTimeByType: Array<{
    type: string
    avgResponseTime: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function NotificationAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 дней назад
    to: new Date()
  })
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Моковые данные для демонстрации
      const mockAnalytics: AnalyticsData = {
        totalNotifications: 1247,
        readRate: 78.5,
        avgResponseTime: 4.2, // часы
        topTypes: [
          { type: 'BookDueSoon', count: 420, percentage: 33.7 },
          { type: 'BookOverdue', count: 315, percentage: 25.3 },
          { type: 'FineAdded', count: 198, percentage: 15.9 },
          { type: 'GeneralInfo', count: 187, percentage: 15.0 },
          { type: 'BookReturned', count: 89, percentage: 7.1 },
          { type: 'BookReserved', count: 38, percentage: 3.0 }
        ],
        timeSeriesData: generateTimeSeriesData(),
        userEngagement: [
          { userId: '1', userName: 'Иван Петров', totalReceived: 45, readCount: 42, readRate: 93.3 },
          { userId: '2', userName: 'Мария Сидорова', totalReceived: 38, readCount: 31, readRate: 81.6 },
          { userId: '3', userName: 'Алексей Козлов', totalReceived: 52, readCount: 35, readRate: 67.3 },
          { userId: '4', userName: 'Елена Волкова', totalReceived: 29, readCount: 28, readRate: 96.6 },
          { userId: '5', userName: 'Дмитрий Федоров', totalReceived: 41, readCount: 25, readRate: 61.0 }
        ],
        priorityDistribution: [
          { priority: 'Critical', count: 89, percentage: 7.1 },
          { priority: 'High', count: 312, percentage: 25.0 },
          { priority: 'Normal', count: 653, percentage: 52.4 },
          { priority: 'Low', count: 193, percentage: 15.5 }
        ],
        responseTimeByType: [
          { type: 'BookDueSoon', avgResponseTime: 2.3 },
          { type: 'BookOverdue', avgResponseTime: 5.7 },
          { type: 'FineAdded', avgResponseTime: 1.8 },
          { type: 'GeneralInfo', avgResponseTime: 8.2 },
          { type: 'BookReturned', avgResponseTime: 0.5 },
          { type: 'BookReserved', avgResponseTime: 1.2 }
        ]
      }
      
      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error)
    } finally {
      setLoading(false)
    }
  }

  function generateTimeSeriesData() {
    const data = []
    const days = 30
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const sent = Math.floor(Math.random() * 50) + 20
      const read = Math.floor(sent * (0.6 + Math.random() * 0.3))
      const unread = sent - read
      
      data.push({
        date: date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
        sent,
        read,
        unread
      })
    }
    
    return data
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    const today = new Date()
    let fromDate = new Date()
    
    switch (period) {
      case '7d':
        fromDate.setDate(today.getDate() - 7)
        break
      case '30d':
        fromDate.setDate(today.getDate() - 30)
        break
      case '90d':
        fromDate.setDate(today.getDate() - 90)
        break
      case '1y':
        fromDate.setFullYear(today.getFullYear() - 1)
        break
    }
    
    setDateRange({ from: fromDate, to: today })
  }

  const exportReport = () => {
    // Здесь будет логика экспорта отчета
    console.log('Экспорт отчета...')
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'GeneralInfo': 'Общая информация',
      'BookDueSoon': 'Скоро возврат',
      'BookOverdue': 'Просрочка',
      'FineAdded': 'Штраф',
      'BookReturned': 'Возврат книги',
      'BookReserved': 'Резерв'
    }
    return labels[type] || type
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Загрузка аналитики...</div>
  }

  if (!analytics) {
    return <div className="flex items-center justify-center h-96">Нет данных для отображения</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Аналитика уведомлений</h1>
          <p className="text-muted-foreground">
            Детальная аналитика эффективности системы уведомлений
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 дней</SelectItem>
              <SelectItem value="30d">30 дней</SelectItem>
              <SelectItem value="90d">90 дней</SelectItem>
              <SelectItem value="1y">1 год</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего отправлено</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalNotifications}</div>
            <p className="text-xs text-muted-foreground">
              +12% за выбранный период
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Процент прочтения</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.readRate}%</div>
            <p className="text-xs text-muted-foreground">
              +3.2% к предыдущему периоду
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Среднее время отклика</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgResponseTime}ч</div>
            <p className="text-xs text-muted-foreground">
              -0.8ч к предыдущему периоду
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.userEngagement.length}</div>
            <p className="text-xs text-muted-foreground">
              Пользователей с уведомлениями
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Временной график */}
      <Card>
        <CardHeader>
          <CardTitle>Динамика уведомлений</CardTitle>
          <CardDescription>
            Количество отправленных и прочитанных уведомлений по дням
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="sent" stackId="1" stroke="#8884d8" fill="#8884d8" name="Отправлено" />
              <Area type="monotone" dataKey="read" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Прочитано" />
              <Area type="monotone" dataKey="unread" stackId="2" stroke="#ffc658" fill="#ffc658" name="Не прочитано" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Распределение по типам */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение по типам</CardTitle>
            <CardDescription>
              Популярность различных типов уведомлений
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.topTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${getTypeLabel(type)} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  fontSize={11}
                >
                  {analytics.topTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, getTypeLabel(name as string)]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Время отклика по типам */}
        <Card>
          <CardHeader>
            <CardTitle>Время отклика по типам</CardTitle>
            <CardDescription>
              Среднее время от отправки до прочтения (часы)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.responseTimeByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="type" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickFormatter={getTypeLabel}
                />
                <YAxis />
                <Tooltip formatter={(value, name) => [`${value} ч`, 'Время отклика']} />
                <Bar dataKey="avgResponseTime" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Вовлеченность пользователей */}
      <Card>
        <CardHeader>
          <CardTitle>Топ пользователей по активности</CardTitle>
          <CardDescription>
            Пользователи с наибольшим количеством полученных уведомлений
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.userEngagement.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{user.userName}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.readCount} из {user.totalReceived} прочитано
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={user.readRate > 80 ? "default" : user.readRate > 60 ? "secondary" : "destructive"}
                  >
                    {user.readRate.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Распределение по приоритетам */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение по приоритетам</CardTitle>
          <CardDescription>
            Количество уведомлений по уровням приоритета
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.priorityDistribution.map((item, index) => (
              <div key={item.priority} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">{item.count}</div>
                <div className="text-sm font-medium mb-1">{item.priority}</div>
                <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                <div className="mt-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      backgroundColor: COLORS[index % COLORS.length],
                      width: `${item.percentage}%`,
                      minWidth: '10px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}