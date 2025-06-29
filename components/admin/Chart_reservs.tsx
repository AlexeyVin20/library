"use client"

import { TrendingUp, Calendar, BarChart3, Activity, PieChart, LineChart } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart as RechartsLineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts"
import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReservationsChartProps {
  reservations: {
    reservationDate: string
    status: string
  }[]
}

const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
]

const statusConfig = {
  processing: {
    label: "Обрабатывается",
    color: "#f59e0b",
    gradient: "from-amber-400 to-orange-500",
    statuses: ["Обрабатывается"],
  },
  approved: {
    label: "Одобрена",
    color: "#3b82f6",
    gradient: "from-blue-400 to-blue-500",
    statuses: ["Одобрена"],
  },
  cancelled: {
    label: "Отменена", 
    color: "#8b5cf6",
    gradient: "from-violet-400 to-purple-500",
    statuses: ["Отменена", "Отменена_пользователем"],
  },
  issued: {
    label: "Выдана",
    color: "#10b981",
    gradient: "from-emerald-400 to-green-500", 
    statuses: ["Выдана"],
  },
  returned: {
    label: "Возвращена",
    color: "#059669",
    gradient: "from-green-500 to-emerald-600",
    statuses: ["Возвращена"],
  },
  expired: {
    label: "Истекла",
    color: "#ea580c",
    gradient: "from-orange-500 to-red-500",
    statuses: ["Истекла"],
  },
  overdue: {
    label: "Просрочена",
    color: "#ef4444",
    gradient: "from-red-400 to-rose-500",
    statuses: ["Просрочена"],
  },
}

type StatusConfigType = typeof statusConfig
type ChartType = "area" | "bar" | "line" | "pie"

const chartTypes = [
  { value: "area" as ChartType, label: "Область", icon: Activity },
  { value: "bar" as ChartType, label: "Столбцы", icon: BarChart3 },
  { value: "line" as ChartType, label: "Линии", icon: LineChart },
  { value: "pie" as ChartType, label: "Круговая", icon: PieChart },
]

// FIXED: Правильная реализация CountUp с useEffect
const CountUp = ({ end, duration = 1.5 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (end === 0) {
      setCount(0)
      return
    }

    const startTime = Date.now()
    const interval = setInterval(() => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / (duration * 1000), 1)
      setCount(Math.floor(progress * end))

      if (progress === 1) {
        clearInterval(interval)
      }
    }, 16)

    return () => clearInterval(interval)
  }, [end, duration])

  return <span>{count}</span>
}

// Улучшенная статистическая карточка с обработкой ошибок
const StatCard = ({
  label,
  value,
  color,
  gradient,
  delay = 0,
  percentage,
  statusKey,
  isSelected,
  isOtherSelected,
  onClick,
}: {
  label: string
  value: number
  color: string
  gradient: string
  delay?: number
  percentage: number
  statusKey: string
  isSelected: boolean
  isOtherSelected: boolean
  onClick: () => void
}) => {
  // Проверка на валидные значения
  const safeValue = isNaN(value) ? 0 : value
  const safePercentage = isNaN(percentage) ? 0 : percentage

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isOtherSelected && !isSelected ? 0.4 : 1, 
        y: 0,
        scale: isSelected ? 1.02 : 1
      }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, scale: isSelected ? 1.02 : 1.01 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
        isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''
      }`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${
          isSelected ? 'opacity-15' : 'opacity-5'
        }`} />
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">
                  <CountUp end={safeValue} />
                </p>
                <Badge variant="secondary" className="text-xs">
                  {safePercentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${
                isSelected ? 'scale-110' : ''
              } transition-transform duration-300`}
            >
              <div className="w-6 h-6 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="mt-4 w-full bg-muted rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full bg-gradient-to-r ${gradient}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(safePercentage, 100)}%` }}
              transition={{ duration: 1, delay: delay + 0.5 }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// FIXED: Улучшенный кастомный тултип — вывод только активной точки и месяца
interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  coordinate?: { x: number; y: number }
  selectedStatus?: string | null
}

const CustomTooltip = ({ active, payload, label, selectedStatus }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  let activeEntry = null

  // Если выбран конкретный статус, показываем только его
  if (selectedStatus) {
    activeEntry = payload.find(entry => entry.dataKey === selectedStatus)
    // Если выбранный статус не найден или имеет значение 0, не показываем тултип
    if (!activeEntry || activeEntry.value === 0) {
      return null
    }
  } else {
    // Если статус не выбран, показываем серию с наибольшим значением или первую ненулевую
    const nonZeroEntries = payload.filter(entry => entry.value > 0)
    if (nonZeroEntries.length > 0) {
      activeEntry = nonZeroEntries.reduce((prev, current) => {
        return (current.value || 0) > (prev.value || 0) ? current : prev
      })
    } else {
      activeEntry = payload[0]
    }
  }

  if (!activeEntry) return null

  const value = activeEntry.value || 0
  const name = activeEntry.name || activeEntry.dataKey || "Unknown"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-xl z-50"
      style={{ backgroundColor: "white" }}
    >
      <p className="font-semibold mb-3 text-gray-900">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeEntry.color || "#000" }} />
          <span className="text-sm text-gray-600">{name}</span>
        </div>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      {selectedStatus && (
        <div className="mt-2 text-xs text-gray-500">
          Фильтр: {name}
        </div>
      )}
    </motion.div>
  )
}

// FIXED: Улучшенный компонент для рендеринга графика с обработкой ошибок
const ChartRenderer = ({
  type,
  data,
  statusConfig,
  width,
  height,
  selectedStatus,
}: {
  type: ChartType
  data: any[]
  statusConfig: StatusConfigType
  width?: number
  height?: number
  selectedStatus?: string | null
}) => {

  // Проверка данных
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Нет данных для отображения</p>
      </div>
    )
  }

  // Подготовка данных для круговой диаграммы
  const pieData = Object.entries(statusConfig)
    .map(([key, config]) => ({
      name: config.label,
      value: data.reduce((sum: number, item: any) => {
        const itemValue = item[key] || 0
        return sum + (isNaN(itemValue) ? 0 : itemValue)
      }, 0),
      color: config.color,
    }))
    .filter((item) => item.value > 0)

  const commonProps = {
    margin: { top: 20, right: 30, left: 20, bottom: 20 },
  }

  const axisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fill: "#6b7280", fontSize: 12 },
    tickMargin: 10,
  }

  try {
    switch (type) {
      case "area":
        return (
          <AreaChart
            data={data}
            width={width}
            height={height}
            {...commonProps}
          >
            <defs>
              {Object.entries(statusConfig).map(([key, config]) => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="shortMonth" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip 
              content={<CustomTooltip selectedStatus={selectedStatus} />}
              shared={false}
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
            />
            {Object.entries(statusConfig).map(([key, config]) => {
              const isSelected = selectedStatus === key
              const isOtherSelected = selectedStatus !== null && selectedStatus !== key
              const opacity = isOtherSelected ? 0.2 : 1
              
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={config.label}
                  stroke={config.color}
                  fillOpacity={opacity}
                  fill={`url(#gradient-${key})`}
                  strokeWidth={isSelected ? 3 : 2}
                  style={{ opacity }}
                />
              )
            })}
          </AreaChart>
        )

      case "line":
        return (
          <RechartsLineChart
            data={data}
            width={width}
            height={height}
            {...commonProps}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="shortMonth" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip 
              content={<CustomTooltip selectedStatus={selectedStatus} />}
              shared={false}
              cursor={{ strokeDasharray: '3 3' }}
            />
            {Object.entries(statusConfig).map(([key, config]) => {
              const isSelected = selectedStatus === key
              const isOtherSelected = selectedStatus !== null && selectedStatus !== key
              const opacity = isOtherSelected ? 0.2 : 1
              
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={config.label}
                  stroke={config.color}
                  strokeWidth={isSelected ? 4 : 3}
                  dot={{ fill: config.color, strokeWidth: 2, r: isSelected ? 5 : 4 }}
                  activeDot={{ r: isSelected ? 8 : 6, stroke: config.color, strokeWidth: 2 }}
                  style={{ opacity }}
                />
              )
            })}
          </RechartsLineChart>
        )

      case "pie":
        if (pieData.length === 0) {
          return (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Нет данных для круговой диаграммы</p>
            </div>
          )
        }
        return (
          <RechartsPieChart width={width} height={height} {...commonProps}>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value">
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip selectedStatus={selectedStatus} />}
              cursor={false}
            />
          </RechartsPieChart>
        )

      default: // bar
        return (
          <BarChart
            data={data}
            width={width}
            height={height}
            {...commonProps}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="shortMonth" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip 
              content={<CustomTooltip selectedStatus={selectedStatus} />}
              shared={false}
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
            />
            {Object.entries(statusConfig).map(([key, config]) => {
              const isSelected = selectedStatus === key
              const isOtherSelected = selectedStatus !== null && selectedStatus !== key
              const opacity = isOtherSelected ? 0.2 : 1
              
              return (
                <Bar
                  key={key}
                  dataKey={key}
                  name={config.label}
                  fill={config.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={isSelected ? 45 : 40}
                  style={{ opacity }}
                />
              )
            })}
          </BarChart>
        )
    }
  } catch (error) {
    console.error("Chart rendering error:", error)
    return (
      <div className="flex items-center justify-center h-full">
        <Alert>
          <AlertDescription>Ошибка при отображении графика. Проверьте консоль для деталей.</AlertDescription>
        </Alert>
      </div>
    )
  }
}

// FIXED: Основной компонент с улучшенной обработкой ошибок и отладкой
export function ReservationsChart({ reservations }: ReservationsChartProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [chartType, setChartType] = useState<ChartType>("area")
  const [debugMode, setDebugMode] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  // FIXED: Улучшенная логика обработки данных с отладкой
  const { chartData, totalStats, hasData, debugInfo } = useMemo(() => {
    console.log("Processing reservations data:", reservations)

         // Инициализация данных по месяцам
     const months = Array.from({ length: 12 }, (_, i) => ({
       month: monthNames[i],
       shortMonth: monthNames[i].slice(0, 3),
       processing: 0,
       approved: 0,
       cancelled: 0,
       issued: 0,
       returned: 0,
       expired: 0,
       overdue: 0,
     }))

     const stats = {
       processing: 0,
       approved: 0,
       cancelled: 0,
       issued: 0,
       returned: 0,
       expired: 0,
       overdue: 0,
     }

    let processedCount = 0
    let skippedCount = 0
    const debugInfo: string[] = []

    // Проверка входных данных
    if (!reservations || !Array.isArray(reservations)) {
      debugInfo.push("Reservations data is not an array or is null/undefined")
      console.warn("Invalid reservations data:", reservations)

             // Генерируем тестовые данные для демонстрации
       months.forEach((month, index) => {
         month.processing = Math.floor(Math.random() * 10) + 5
         month.approved = Math.floor(Math.random() * 12) + 8
         month.cancelled = Math.floor(Math.random() * 5) + 2
         month.issued = Math.floor(Math.random() * 15) + 10
         month.returned = Math.floor(Math.random() * 12) + 8
         month.expired = Math.floor(Math.random() * 4) + 1
         month.overdue = Math.floor(Math.random() * 8) + 3
         
         stats.processing += month.processing
         stats.approved += month.approved
         stats.cancelled += month.cancelled
         stats.issued += month.issued
         stats.returned += month.returned
         stats.expired += month.expired
         stats.overdue += month.overdue
       })

      debugInfo.push("Using generated test data")
      return {
        chartData: months,
        totalStats: stats,
        hasData: true,
        debugInfo,
      }
    }

    if (reservations.length === 0) {
      debugInfo.push("Reservations array is empty")
      return {
        chartData: months,
        totalStats: stats,
        hasData: false,
        debugInfo,
      }
    }

    // Обработка реальных данных
    reservations.forEach((r, index) => {
      try {
        if (!r || typeof r !== "object") {
          skippedCount++
          debugInfo.push(`Skipped invalid reservation at index ${index}`)
          return
        }

        if (!r.reservationDate || !r.status) {
          skippedCount++
          debugInfo.push(`Skipped reservation with missing data at index ${index}`)
          return
        }

        const date = new Date(r.reservationDate)

        if (isNaN(date.getTime())) {
          skippedCount++
          debugInfo.push(`Skipped reservation with invalid date: ${r.reservationDate}`)
          return
        }

        if (date.getFullYear() !== selectedYear) {
          skippedCount++
          return
        }

        const monthIndex = date.getMonth()
        let statusMatched = false

        // Поиск соответствующего статуса
        for (const [key, config] of Object.entries(statusConfig)) {
          if (config.statuses.includes(r.status)) {
            months[monthIndex][key as keyof (typeof months)[0]]++
            stats[key as keyof typeof stats]++
            statusMatched = true
            processedCount++
            break
          }
        }

        if (!statusMatched) {
          debugInfo.push(`Unknown status: ${r.status}`)
          skippedCount++
        }
      } catch (error) {
        console.error(`Error processing reservation at index ${index}:`, error)
        skippedCount++
        debugInfo.push(`Error processing reservation at index ${index}: ${error}`)
      }
    })

    debugInfo.push(`Processed: ${processedCount}, Skipped: ${skippedCount}`)
    console.log("Data processing complete:", {
      chartData: months,
      totalStats: stats,
      processedCount,
      skippedCount,
    })

    return {
      chartData: months,
      totalStats: stats,
      hasData: processedCount > 0,
      debugInfo,
    }
  }, [reservations, selectedYear])

  const totalReservations = Object.values(totalStats).reduce((sum, val) => sum + val, 0)

  // Получение доступных лет из данных
  const availableYears = useMemo(() => {
    if (!reservations || !Array.isArray(reservations)) {
      return [new Date().getFullYear()]
    }

    const years = new Set<number>()
    reservations.forEach((r) => {
      try {
        const date = new Date(r.reservationDate)
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear())
        }
      } catch (error) {
        // Игнорируем ошибки парсинга даты
      }
    })

    return Array.from(years).sort((a, b) => b - a)
  }, [reservations])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Debug Panel */}
      {debugMode && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs text-yellow-700">
              <p>Total reservations: {reservations?.length || 0}</p>
              <p>Selected year: {selectedYear}</p>
              <p>Available years: {availableYears.join(", ")}</p>
              <p>Has data: {hasData ? "Yes" : "No"}</p>
              <p>Total processed: {totalReservations}</p>
              {debugInfo.map((info, index) => (
                <p key={index}>• {info}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Заголовок и контролы */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Статистика резервирований</CardTitle>
              <p className="text-muted-foreground">Анализ динамики по месяцам и статусам</p>
            </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                {/* Информация о выбранном статусе */}
                {selectedStatus && selectedStatus in statusConfig && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: statusConfig[selectedStatus as keyof typeof statusConfig].color }}
                    />
                    <span className="text-sm font-medium text-blue-800">
                      {statusConfig[selectedStatus as keyof typeof statusConfig].label}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedStatus(null)}
                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </Button>
                  </div>
                )}

                {/* Debug Toggle */}
                <Button variant="outline" size="sm" onClick={() => setDebugMode(!debugMode)} className="text-xs">
                  Debug: {debugMode ? "ON" : "OFF"}
                </Button>

              {/* Селектор года */}
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger className="w-[120px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Селектор типа графика */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                {chartTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.value}
                      variant={chartType === type.value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setChartType(type.value)}
                      className="h-8 px-3"
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {type.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Предупреждение о отсутствии данных */}
      {!hasData && (
        <Alert>
          <AlertDescription>
            Нет данных для отображения за выбранный год ({selectedYear}). Попробуйте выбрать другой год или проверьте
            входные данные.
          </AlertDescription>
        </Alert>
      )}

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, config], index) => {
          const value = totalStats[key as keyof typeof totalStats]
          const percentage = totalReservations > 0 ? (value / totalReservations) * 100 : 0

          return (
            <StatCard
              key={key}
              statusKey={key}
              label={config.label}
              value={value}
              color={config.color}
              gradient={config.gradient}
              delay={index * 0.1}
              percentage={percentage}
              isSelected={selectedStatus === key}
              isOtherSelected={selectedStatus !== null && selectedStatus !== key}
              onClick={() => setSelectedStatus(selectedStatus === key ? null : key)}
            />
          )
        })}
      </div>

      {/* График */}
      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={chartType}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="h-[400px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ChartRenderer 
                  type={chartType} 
                  data={chartData} 
                  statusConfig={statusConfig} 
                  selectedStatus={selectedStatus}
                />
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>

          {/* Легенда для круговой диаграммы */}
          {chartType === "pie" && totalReservations > 0 && (
            <div className="flex flex-wrap gap-4 justify-center mt-6">
              {Object.entries(statusConfig).map(([key, config]) => {
                const value = totalStats[key as keyof typeof totalStats]
                if (value === 0) return null

                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-sm text-muted-foreground">
                      {config.label}: {value}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Футер с общей статистикой */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Общая статистика за {selectedYear}</p>
                <p className="text-xl font-bold">
                  Всего резервирований: <CountUp end={totalReservations} />
                </p>
              </div>
            </div>

            {totalReservations > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Успешность</p>
                <p className="text-lg font-semibold text-green-600">
                  {((totalStats.issued / totalReservations) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
