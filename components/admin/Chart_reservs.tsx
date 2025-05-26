"use client"

import { TrendingUp, Calendar, BarChart3 } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useMemo, useState } from "react"
import { motion } from "framer-motion"

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
    label: "В обработке",
    color: "#fbbf24",
    bgColor: "rgba(251, 191, 36, 0.1)",
    statuses: ["Обрабатывается"],
  },
  approved: {
    label: "Одобрены",
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.1)",
    statuses: ["Выполнена"],
  },
  issued: {
    label: "Выданы",
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.1)",
    statuses: ["Выдана"],
  },
  returned: {
    label: "Возвращены",
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.1)",
    statuses: ["Возвращена"],
  },
  expired: {
    label: "Истекшие",
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.1)",
    statuses: ["Истекла"],
  },
  cancelled: {
    label: "Отменены",
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
    statuses: ["Отменена", "Отклонена"],
  },
}

// Компонент для анимированного счетчика
const CountUp = ({ end, duration = 1.5 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0)

  useState(() => {
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
  })

  return <span>{count}</span>
}

// Компонент для статистической карточки
const StatCard = ({
  label,
  value,
  color,
  bgColor,
  delay = 0,
}: {
  label: string
  value: number
  color: string
  bgColor: string
  delay?: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="backdrop-blur-xl bg-white/10 rounded-xl p-4 border border-white/20 hover:border-white/30 transition-all duration-300"
    whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white/80 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">
          <CountUp end={value} />
        </p>
      </div>
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  </motion.div>
)

// Кастомный тултип
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-xl p-4 shadow-lg"
      >
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white/90 text-sm">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </motion.div>
    )
  }
  return null
}

// Кастомная легенда
const CustomLegend = ({ payload }: any) => (
  <div className="flex flex-wrap gap-4 justify-center mt-6">
    {payload.map((entry: any, index: number) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="flex items-center gap-2 backdrop-blur-xl bg-white/10 rounded-lg px-3 py-2 border border-white/20"
      >
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
        <span className="text-white/90 text-sm font-medium">{entry.value}</span>
      </motion.div>
    ))}
  </div>
)

export function ReservationsChart({ reservations }: ReservationsChartProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Агрегируем данные по месяцам и статусам
  const { chartData, totalStats } = useMemo(() => {
    // Массив на 12 месяцев
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: monthNames[i],
      shortMonth: monthNames[i].slice(0, 3),
      processing: 0,
      approved: 0,
      issued: 0,
      returned: 0,
      expired: 0,
      cancelled: 0,
    }))

    const stats = {
      processing: 0,
      approved: 0,
      issued: 0,
      returned: 0,
      expired: 0,
      cancelled: 0,
    }

    reservations.forEach((r) => {
      const date = new Date(r.reservationDate)
      if (date.getFullYear() !== selectedYear) return // Только выбранный год
      const m = date.getMonth()

      for (const key in statusConfig) {
        const config = statusConfig[key as keyof typeof statusConfig]
        if (config.statuses.includes(r.status)) {
          months[m][key as keyof (typeof months)[0]]++
          stats[key as keyof typeof stats]++
        }
      }
    })

    return { chartData: months, totalStats: stats }
  }, [reservations, selectedYear])

  const totalReservations = Object.values(totalStats).reduce((sum, val) => sum + val, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Статистика резерваций</h3>
            <p className="text-white/70 text-sm">Динамика по месяцам и статусам</p>
          </div>
        </div>

        {/* Селектор года */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/70" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-400"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i
              return (
                <option key={year} value={year} className="bg-gray-800">
                  {year}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {Object.entries(statusConfig).map(([key, config], index) => (
          <StatCard
            key={key}
            label={config.label}
            value={totalStats[key as keyof typeof totalStats]}
            color={config.color}
            bgColor={config.bgColor}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* График */}
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              {Object.entries(statusConfig).map(([key, config]) => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />

            <XAxis
              dataKey="shortMonth"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255, 255, 255, 0.8)", fontSize: 12 }}
              tickMargin={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255, 255, 255, 0.8)", fontSize: 12 }}
              tickMargin={10}
            />

            <Tooltip content={<CustomTooltip />} />

            {Object.entries(statusConfig).map(([key, config]) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={config.color}
                fill={`url(#gradient-${key})`}
                strokeWidth={2}
                name={config.label}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Легенда */}
      <CustomLegend
        payload={Object.entries(statusConfig).map(([key, config]) => ({
          value: config.label,
          color: config.color,
        }))}
      />

      {/* Футер с общей статистикой */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex items-center justify-between mt-6 pt-6 border-t border-white/20"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span className="text-white font-medium">
            Всего резерваций за {selectedYear}: <CountUp end={totalReservations} />
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
