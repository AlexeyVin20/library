"use client"

import type React from "react"
import { useEffect, useState, useMemo, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarClock,
  Info,
  ListChecks,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  BookOpen,
  TrendingUp,
  BarChart3,
  Activity,
  PieChart,
  LineChart as LucideLineChart,
} from "lucide-react"
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
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { Book } from "@/components/ui/book"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface Reservation {
  id: string
  bookId: string
  userId: string
  reservationDate: string
  expirationDate: string
  status: string
  notes?: string
  user?: {
    fullName?: string
    email?: string
    phone?: string
  }
  book?: {
    title?: string
    authors?: string
    cover?: string
    genre?: string
    availableCopies?: number
  }
}

// Floating background elements
const FloatingElements = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: Math.random() * 20 + 15,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 5,
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          {i % 3 === 0 ? (
            <BookOpenCheck className="w-6 h-6 text-blue-300" />
          ) : i % 3 === 1 ? (
            <Calendar className="w-5 h-5 text-green-300" />
          ) : (
            <Clock className="w-4 h-4 text-purple-300" />
          )}
        </motion.div>
      ))}
    </div>
  )
}

// Enhanced loading component
const EnhancedLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 relative overflow-hidden">
      <FloatingElements />

      <motion.div
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 flex flex-col items-center border border-white/20 relative z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="relative mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full"></div>
          <motion.div
            className="absolute inset-2 border-4 border-purple-200 border-t-purple-500 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Загружаем бронирования</h3>
          <p className="text-gray-600">Собираем информацию о ваших резервациях...</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Status icon component
const StatusIcon = ({ status }: { status: string }) => {
  const statusLower = status.toLowerCase()

  if (["активна", "подтверждена", "обрабатывается", "одобрена"].includes(statusLower)) {
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }
  if (["выдана"].includes(statusLower)) {
    return <BookOpenCheck className="w-5 h-5 text-blue-700" />
  }
  if (["возвращена"].includes(statusLower)) {
    return <CheckCircle className="w-5 h-5 text-green-600" />
  }
  if (["отменена", "отменена_пользователем"].includes(statusLower)) {
    return <XCircle className="w-5 h-5 text-red-500" />
  }
  if (["истекла", "просрочена"].includes(statusLower)) {
    return <XCircle className="w-5 h-5 text-red-600" />
  }
  return <Clock className="w-5 h-5 text-gray-500" />
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
  active: {
    label: "Активные",
    color: "#3b82f6",
    gradient: "from-blue-400 to-blue-500",
    statuses: ["активна", "подтверждена", "обрабатывается", "одобрена", "выдана"],
  },
  returned: {
    label: "Возвращенные",
    color: "#10b981",
    gradient: "from-emerald-400 to-green-500",
    statuses: ["возвращена"],
  },
  cancelled: {
    label: "Отмененные",
    color: "#ef4444",
    gradient: "from-red-400 to-rose-500",
    statuses: ["отменена", "отменена_пользователем", "истекла", "просрочена"],
  },
}

type StatusConfigType = typeof statusConfig

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
  const safeValue = isNaN(value) ? 0 : value
  const safePercentage = isNaN(percentage) ? 0 : percentage

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isOtherSelected && !isSelected ? 0.4 : 1,
        y: 0,
        scale: isSelected ? 1.02 : 1,
      }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, scale: isSelected ? 1.02 : 1.01 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card
        className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
          isSelected ? "ring-2 ring-offset-2 ring-blue-500" : ""
        }`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} ${
            isSelected ? "opacity-15" : "opacity-5"
          }`}
        />
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
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
                isSelected ? "scale-110" : ""
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

  if (selectedStatus) {
    activeEntry = payload.find((entry) => entry.dataKey === selectedStatus)
    if (!activeEntry || activeEntry.value === 0) {
      return null
    }
  } else {
    const nonZeroEntries = payload.filter((entry) => entry.value > 0)
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

const ChartRenderer = ({
  type,
  data,
  statusConfig,
  width,
  height,
  selectedStatus,
}: {
  type: "area"
  data: any[]
  statusConfig: StatusConfigType
  width?: number
  height?: number
  selectedStatus?: string | null
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Нет данных для отображения</p>
      </div>
    )
  }

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
    return (
      <AreaChart data={data} width={width} height={height} {...commonProps}>
        <defs>
          {Object.entries(statusConfig).map(([key, config]) => (
            <linearGradient key={key} id={`user-gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
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
          cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
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
              fill={`url(#user-gradient-${key})`}
              strokeWidth={isSelected ? 3 : 2}
              style={{ opacity }}
            />
          )
        })}
      </AreaChart>
    )
  } catch (error) {
    console.error("Chart rendering error:", error)
    return (
      <div className="flex items-center justify-center h-full">
        <Alert>
          <AlertDescription>
            Ошибка при отображении графика. Проверьте консоль для деталей.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}

function ReservationsHistoryChart({ reservations }: { reservations: Reservation[] }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const { chartData, totalStats, hasData } = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: monthNames[i],
      shortMonth: monthNames[i].slice(0, 3),
      active: 0,
      returned: 0,
      cancelled: 0,
    }))

    const stats = {
      active: 0,
      returned: 0,
      cancelled: 0,
    }

    let processedCount = 0

    if (!reservations || !Array.isArray(reservations) || reservations.length === 0) {
      return {
        chartData: months,
        totalStats: stats,
        hasData: false,
      }
    }

    reservations.forEach((r) => {
      try {
        if (!r || !r.reservationDate || !r.status) return
        const date = new Date(r.reservationDate)
        if (isNaN(date.getTime()) || date.getFullYear() !== selectedYear) return

        const monthIndex = date.getMonth()
        let statusMatched = false

        for (const [key, config] of Object.entries(statusConfig)) {
          if (config.statuses.includes(r.status.toLowerCase())) {
            months[monthIndex][key as keyof (typeof months)[0]]++
            stats[key as keyof typeof stats]++
            statusMatched = true
            processedCount++
            break
          }
        }
      } catch (error) {
        console.error(`Error processing reservation`, error)
      }
    })

    return {
      chartData: months,
      totalStats: stats,
      hasData: processedCount > 0,
    }
  }, [reservations, selectedYear])

  const totalReservations = Object.values(totalStats).reduce((sum, val) => sum + val, 0)

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
        /* ignore */
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
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Статистика бронирований</CardTitle>
              <p className="text-muted-foreground">Анализ динамики по месяцам и статусам</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {selectedStatus && selectedStatus in statusConfig && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: statusConfig[selectedStatus as keyof typeof statusConfig].color,
                    }}
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

              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number(value))}
              >
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
            </div>
          </div>
        </CardHeader>
      </Card>

      {!hasData && (
        <Alert>
          <AlertDescription>
            Нет данных для отображения за выбранный год ({selectedYear}). Попробуйте выбрать другой год.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ChartRenderer
                type="area"
                data={chartData}
                statusConfig={statusConfig}
                selectedStatus={selectedStatus}
              />
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Enhanced reservation item component
const ReservationItem: React.FC<{
  reservation: Reservation
  index: number
}> = ({ reservation, index }) => {
  const router = useRouter()

  const formattedReservationDate = new Date(reservation.reservationDate).toLocaleDateString("ru-RU")
  const formattedExpirationDate = new Date(reservation.expirationDate).toLocaleDateString("ru-RU")

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "активна":
      case "подтверждена":
      case "обрабатывается":
      case "одобрена":
        return "bg-green-100 text-green-700 border-green-200"
      case "выдана":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "возвращена":
        return "bg-green-100 text-green-600 border-green-200"
      case "отменена":
      case "отменена_пользователем":
        return "bg-red-100 text-red-700 border-red-200"
      case "истекла":
      case "просрочена":
        return "bg-red-100 text-red-600 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const isExpiringSoon = () => {
    const expirationDate = new Date(reservation.expirationDate)
    const today = new Date()
    const diffTime = expirationDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays > 0 && ["активна", "подтверждена", "обрабатывается", "одобрена", "выдана"].includes(reservation.status.toLowerCase())
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="group"
    >
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg group-hover:shadow-2xl transition-all duration-300 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Book cover */}
            <div className="relative md:w-56 h-auto flex-shrink-0 flex items-center justify-center p-6">
              <div className="relative">
                <Book
                  width={150}
                  illustration={
                    reservation.book?.cover ? (
                      <Image
                        src={reservation.book.cover}
                        alt={reservation.book.title || "Обложка книги"}
                        fill
                        className="object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-blue-500" />
                      </div>
                    )
                  }
                >
                  <div />
                </Book>
                {/* Status overlay */}
                <div className="absolute top-2 left-2 z-20">
                  <motion.div
                    className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <StatusIcon status={reservation.status} />
                    <span className="text-sm font-medium text-gray-800">{reservation.status}</span>
                  </motion.div>
                </div>
                {/* Expiring soon warning */}
                {isExpiringSoon() && (
                  <motion.div
                    className="absolute top-2 right-2 z-20 bg-orange-500 text-white rounded-full px-2 py-1 text-xs font-bold flex items-center gap-1"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Скоро истекает
                  </motion.div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 pl-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="mb-4">
                  <motion.h3
                    className="text-xl md:text-2xl font-bold text-gray-800 mb-2 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
                    onClick={() => router.push(`/readers/books/${reservation.bookId}`)}
                    whileHover={{ scale: 1.02 }}
                  >
                    {reservation.book?.title || "Название неизвестно"}
                  </motion.h3>

                  {reservation.book?.authors && (
                    <p className="text-gray-600 flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      {reservation.book.authors}
                    </p>
                  )}

                  {reservation.book?.genre && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                      {reservation.book.genre}
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4 flex-1">
                  <motion.div
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-r-xl p-4"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-600">Забронировано</p>
                          <p className="font-semibold text-gray-800">{formattedReservationDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <div>
                          <p className="text-xs text-gray-600">Действительно до</p>
                          <p className="font-semibold text-gray-800">{formattedExpirationDate}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-600">Статус:</span>
                      <Badge className={`${getStatusColor(reservation.status)} border`}>
                        {reservation.status}
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/readers/books/${reservation.bookId}`)}
                      className="rounded-xl hover:bg-blue-50 hover:border-blue-200"
                    >
                      Подробнее
                    </Button>
                  </div>

                  {reservation.notes && (
                    <motion.div
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-r-xl p-4"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-yellow-700 font-medium mb-1">Заметка</p>
                          <p className="text-yellow-800 text-sm">{reservation.notes}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Empty state component
const EmptyState = ({ icon: Icon, title, description, actionText, actionHref }: any) => {
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-md mx-auto border border-white/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />

        <motion.div
          className="relative z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon className="w-10 h-10 text-blue-500" />
          </motion.div>

          <h3 className="text-2xl font-bold text-gray-800 mb-3">{title}</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">{description}</p>

          <Link href={actionHref}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl px-8 py-3 font-semibold shadow-lg">
                {actionText}
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function ReservationHistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  const overdueReservations = useMemo(
    () => reservations.filter((r) => ["просрочена", "истекла"].includes(r.status.toLowerCase())),
    [reservations],
  )

  const nonOverdueReservations = useMemo(
    () => reservations.filter((r) => !["просрочена", "истекла"].includes(r.status.toLowerCase())),
    [reservations],
  )

  useEffect(() => {
    if (user === undefined) {
      return
    }

    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы просмотреть историю бронирований.",
        variant: "default",
      })
      router.push("/auth/login")
      setLoading(false)
      return
    }

    const fetchReservations = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${baseUrl}/api/Reservation/user/${user.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setReservations([])
          } else {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(
              errorData.message || `Не удалось загрузить историю бронирований. Статус: ${response.status}`,
            )
          }
        } else {
          const baseReservations: Reservation[] = await response.json()

          // Запрашиваем детали для каждой книги и пользователя
          const enrichedReservations = await Promise.all(baseReservations.map(async reservation => {
            let bookDetails = null
            let userDetails = null
            try {
              // Запрос деталей книги
              if (reservation.bookId) {
                const bookRes = await fetch(`${baseUrl}/api/books/${reservation.bookId}`)
                if (bookRes.ok) {
                  bookDetails = await bookRes.json()
                } else {
                  console.warn(`Не удалось загрузить книгу ${reservation.bookId} для резервирования ${reservation.id}`)
                }
              }
              // Запрос деталей пользователя
              if (reservation.userId) {
                const userRes = await fetch(`${baseUrl}/api/User/${reservation.userId}`)
                if (userRes.ok) {
                  userDetails = await userRes.json()
                } else {
                  console.warn(`Не удалось загрузить пользователя ${reservation.userId} для резервирования ${reservation.id}`)
                }
              }
            } catch (err) {
              console.error(`Ошибка при дозагрузке данных для резервирования ${reservation.id}:`, err)
            }
            return {
              ...reservation,
              book: bookDetails ? {
                ...reservation.book,
                ...bookDetails,
                genre: bookDetails.genre || ["Фантастика", "Детектив", "Роман", "Научная литература"][Math.floor(Math.random() * 4)]
              } : reservation.book,
              user: userDetails ? {
                ...reservation.user,
                ...userDetails
              } : reservation.user
            }
          }))

          // Sort reservations
          enrichedReservations.sort((a, b) => {
            const activeStatuses = ["активна", "подтверждена", "обрабатывается"]
            const aIsActive = activeStatuses.includes(a.status.toLowerCase())
            const bIsActive = activeStatuses.includes(b.status.toLowerCase())

            if (aIsActive && !bIsActive) return -1
            if (!aIsActive && bIsActive) return 1
            return new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime()
          })

          setReservations(enrichedReservations)
          setFilteredReservations(enrichedReservations)
        }
      } catch (err) {
        console.error("Ошибка при загрузке истории бронирований:", err)
        const errorMessage = err instanceof Error ? err.message : "Произошла неизвестная ошибка."
        setError(errorMessage)
        toast({
          title: "Ошибка загрузки",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [user, router, baseUrl])

  // Filter reservations
  useEffect(() => {
    let filtered = nonOverdueReservations

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (reservation) =>
          (reservation.book?.title && reservation.book.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (reservation.book?.authors && reservation.book.authors.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((reservation) => reservation.status.toLowerCase() === statusFilter)
    }

    setFilteredReservations(filtered)
  }, [nonOverdueReservations, searchQuery, statusFilter])

  if (user === undefined) {
    return <EnhancedLoading />
  }

  if (loading) {
    return <EnhancedLoading />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <FloatingElements />
        <EmptyState
          icon={AlertTriangle}
          title="Ошибка загрузки"
          description={error}
          actionText="Попробовать снова"
          actionHref="/readers/reservations"
        />
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <FloatingElements />
        <EmptyState
          icon={BookOpenCheck}
          title="Нет бронирований"
          description="У вас пока нет бронирований. Начните исследовать нашу коллекцию книг и сделайте первое бронирование!"
          actionText="Найти книги"
          actionHref="/readers/books"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      <FloatingElements />

      <div className="container mx-auto py-8 px-4 max-w-6xl relative z-10">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            className="bg-white/80 backdrop-blur-sm hover:bg-white border border-white/20 text-gray-800 rounded-2xl px-6 py-3 shadow-lg"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-4 mb-6">
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <BookOpenCheck className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    История бронирований
                  </h1>
                  <p className="text-xl text-gray-600 mt-2">
                    Управляйте своими резервациями и отслеживайте статус книг
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Input
                    type="search"
                    placeholder="Поиск по названию или автору..."
                    className="pl-12 pr-4 py-3 rounded-2xl border-white/30 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-white/30 bg-white/50 backdrop-blur-sm text-sm font-medium focus:bg-white/80 transition-all"
                  >
                    <option value="all">Все статусы</option>
                    <option value="активна">Активные</option>
                    <option value="подтверждена">Подтвержденные</option>
                    <option value="возвращена">Возвращенные</option>
                    <option value="отменена">Отмененные</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overdue Section */}
        {overdueReservations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="my-8"
          >
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Просроченные бронирования ({overdueReservations.length})</AlertTitle>
              <AlertDescription>
                Пожалуйста, верните следующие книги как можно скорее, чтобы избежать штрафов.
              </AlertDescription>
            </Alert>
            <div className="space-y-6">
              {overdueReservations.map((reservation, index) => (
                <ReservationItem key={reservation.id} reservation={reservation} index={index} />
              ))}
            </div>
            <Separator className="my-8" />
          </motion.div>
        )}

        {/* Stats Chart */}
        <ReservationsHistoryChart reservations={reservations} />

        {/* Reservations list */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {filteredReservations.length === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-12 max-w-md mx-auto border border-white/20">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Ничего не найдено</h3>
                  <p className="text-gray-600">Попробуйте изменить фильтры или поисковый запрос</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                className="space-y-6"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
                initial="hidden"
                animate="show"
              >
                {filteredReservations.map((reservation, index) => (
                  <ReservationItem key={reservation.id} reservation={reservation} index={index} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
