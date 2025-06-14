"use client"

import { TrendingUp, Calendar, BarChart3 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
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
    label: "Обрабатывается",
    color: "#e5f012",
    bgColor: "rgba(229, 240, 18, 0.35)",
    statuses: ["Обрабатывается"],
  },
  cancelled: {
    label: "Отменена",
    color: "#1563e1",
    bgColor: "rgba(21, 99, 225, 0.35)",
    statuses: ["Отменена"],
  },
  issued: {
    label: "Выдана",
    color: "#46e11b",
    bgColor: "rgba(32, 226, 21, 0.35)",
    statuses: ["Выдана"],
  },
  overdue: {
    label: "Просрочена",
    color: "#f11216",
    bgColor: "rgba(241, 18, 22, 0.35)",
    statuses: ["Просрочена"],
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
    className="bg-white rounded-xl p-4 border-2 border-blue-500 hover:shadow-lg transition-all duration-300"
    whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">
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
        className="bg-white border-2 border-blue-500 rounded-xl p-4 shadow-lg"
      >
        <p className="text-gray-800 font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-500 text-sm">
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
        className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border-2 border-blue-500"
      >
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
        <span className="text-gray-500 text-sm font-medium">{entry.value}</span>
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
      cancelled: 0,
      issued: 0,
      overdue: 0,
    }))

    const stats = {
      processing: 0,
      cancelled: 0,
      issued: 0,
      overdue: 0,
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
      className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-500"
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Статистика резервирований</h3>
            <p className="text-gray-500 text-sm">Динамика по месяцам и статусам</p>
          </div>
        </div>

        {/* Селектор года */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white border-2 border-blue-500 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i
              return (
                <option key={year} value={year} className="bg-white">
                  {year}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />

            <XAxis
              dataKey="shortMonth"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              tickMargin={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              tickMargin={10}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />

            {Object.entries(statusConfig).map(([key, config]) => (
              <Bar
                key={key}
                dataKey={key}
                fill={config.color}
                name={config.label}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                opacity={0.8}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Футер с общей статистикой */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex items-center justify-between mt-6 pt-6 border-t-2 border-blue-500"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <span className="text-gray-800 font-medium">
            Всего резервирований за {selectedYear}: <CountUp end={totalReservations} />
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
