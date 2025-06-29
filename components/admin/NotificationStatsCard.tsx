'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Bell, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'

interface NotificationStats {
  totalNotifications: number
  unreadNotifications: number
  readNotifications: number
  notificationsByType?: Record<string, number>
  notificationsByPriority?: Record<string, number>
}

interface NotificationStatsCardProps {
  stats: NotificationStats
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const typeLabels: Record<string, string> = {
  'GeneralInfo': 'Общая информация',
  'BookDueSoon': 'Скоро возврат',
  'BookOverdue': 'Просрочка',
  'FineAdded': 'Штраф',
  'BookReturned': 'Возврат книги',
  'BookReserved': 'Резерв'
}

const priorityLabels: Record<string, string> = {
  'Low': 'Низкий',
  'Normal': 'Обычный', 
  'High': 'Высокий',
  'Critical': 'Критический'
}

export default function NotificationStatsCard({ stats }: NotificationStatsCardProps) {
  // Безопасное преобразование данных с проверками
  const typeData = (stats.notificationsByType && typeof stats.notificationsByType === 'object') 
    ? Object.entries(stats.notificationsByType).map(([type, count]) => ({
        name: typeLabels[type] || type,
        value: count,
        originalType: type
      }))
    : []

  const priorityData = (stats.notificationsByPriority && typeof stats.notificationsByPriority === 'object')
    ? Object.entries(stats.notificationsByPriority).map(([priority, count]) => ({
        name: priorityLabels[priority] || priority,
        value: count,
        originalPriority: priority
      }))
    : []

  const readingRate = stats.totalNotifications > 0 
    ? Math.round((stats.readNotifications / stats.totalNotifications) * 100)
    : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Общая статистика */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotifications}</div>
              <p className="text-xs text-muted-foreground">уведомлений</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Непрочитанные</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
              <p className="text-xs text-muted-foreground">требуют внимания</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Прочитанные</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.readNotifications}</div>
              <p className="text-xs text-muted-foreground">обработаны</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Процент прочтения</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{readingRate}%</div>
              <p className="text-xs text-muted-foreground">эффективность</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Графики */}
      <div className="space-y-4">
        {/* График по типам */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Распределение по типам</CardTitle>
            <CardDescription>Количество уведомлений каждого типа</CardDescription>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Нет данных для отображения
              </div>
            )}
          </CardContent>
        </Card>

        {/* График по приоритетам */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Распределение по приоритету</CardTitle>
            <CardDescription>Важность отправленных уведомлений</CardDescription>
          </CardHeader>
          <CardContent>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    fontSize={12}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Нет данных для отображения
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Детализация по типам */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Детализация уведомлений</CardTitle>
          <CardDescription>Подробная информация по каждому типу</CardDescription>
        </CardHeader>
        <CardContent>
          {typeData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {typeData.map((item, index) => (
                <div key={item.originalType} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <Badge variant="secondary">{item.value}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Нет данных для отображения детализации
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 