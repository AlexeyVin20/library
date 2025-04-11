"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Clock,
  X,
  BookOpen,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"

// Определение типов
export type CalendarEvent = {
  id: string
  userId: string
  bookId: string
  reservationDate: string
  expirationDate: string
  status: string
  notes?: string
  userName?: string
  bookTitle?: string
}

interface CalendarProps {
  initialEvents?: CalendarEvent[]
}

export default function Calendar({ initialEvents = [] }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  useEffect(() => {
    if (initialEvents.length === 0) {
      fetchReservations()
    }
  }, [initialEvents.length])

  useEffect(() => {
    // Close modal when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal()
      }
    }

    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showModal])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${baseUrl}/api/Reservation`, {
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error(`Ошибка при загрузке данных: ${response.status}`)
      }

      const data = await response.json()
      const calendarEvents = data.map((reservation: any) => ({
        id: reservation.id,
        userId: reservation.userId,
        bookId: reservation.bookId,
        reservationDate: new Date(reservation.reservationDate).toISOString().split("T")[0],
        expirationDate: new Date(reservation.expirationDate).toISOString().split("T")[0],
        status: reservation.status,
        notes: reservation.notes,
        userName: reservation.user?.fullName || "Неизвестный пользователь",
        bookTitle: reservation.book?.title || "Неизвестная книга",
      }))

      setEvents(calendarEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке резерваций")
      console.error("Ошибка при загрузке резерваций:", err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const generateDays = (month: Date) => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = new Date(year, monthIndex, 1)
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

    const days = []
    for (let i = 0; i < offset; i++) {
      days.push(null)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, monthIndex, d))
    }
    return days
  }

  const days = generateDays(currentMonth)

  const getEventColor = (status: string) => {
    switch (status) {
      case "Выполнена":
        return {
          bg: "bg-emerald-100/80 dark:bg-emerald-900/30",
          text: "text-emerald-800 dark:text-emerald-300",
          border: "border-emerald-500/70",
          icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
        }
      case "Отменена":
        return {
          bg: "bg-gray-100/80 dark:bg-gray-900/30",
          text: "text-black dark:text-gray-300",
          border: "border-gray-500/70",
          icon: <XCircle className="w-4 h-4 text-gray-500" />,
        }
      case "Истекла":
        return {
          bg: "bg-blue-100/80 dark:bg-blue-900/30",
          text: "text-blue-800 dark:text-blue-300",
          border: "border-blue-500/70",
          icon: <AlertCircle className="w-4 h-4 text-blue-500" />,
        }
      case "Обрабатывается":
      default:
        return {
          bg: "bg-emerald-50/80 dark:bg-emerald-900/20",
          text: "text-emerald-700 dark:text-emerald-300",
          border: "border-emerald-400/70",
          icon: <Clock className="w-4 h-4 text-emerald-400" />,
        }
    }
  }

  const getDayEvents = (day: Date) => {
    const dayStr = day.toISOString().split("T")[0]
    return events.filter((event) => event.expirationDate === dayStr)
  }

  const handleDayClick = (day: Date) => {
    const dayStr = day.toISOString().split("T")[0]
    const eventsOnDay = events.filter((event) => event.expirationDate === dayStr)
    setSelectedDay(day)
    setSelectedDayEvents(eventsOnDay)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedDay(null)
    setSelectedDayEvents([])
  }

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  // Animation variants
  const calendarVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  const dayVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (custom: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: custom * 0.01,
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
    hover: {
      y: -4,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    tap: {
      scale: 0.98,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      transition: {
        duration: 0.1,
      },
    },
  }

  const eventVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.1 + custom * 0.05,
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
    hover: {
      scale: 1.03,
      transition: {
        duration: 0.2,
      },
    },
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  const modalContentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1,
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  const buttonVariants = {
    hover: {
      y: -3,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    tap: {
      scale: 0.98,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      transition: {
        duration: 0.1,
      },
    },
  }

  return (
    <motion.div
      className="w-full h-full bg-green-500/20 dark:bg-green-800/30 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-700/30 overflow-hidden"
      variants={calendarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-black dark:text-gray-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-500" />
            {currentMonth.toLocaleString("ru-RU", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevMonth}
              className="p-2 rounded-full hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextMonth}
              className="p-2 rounded-full hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-black dark:text-gray-300">
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            const isCurrentMonth = day ? day.getMonth() === currentMonth.getMonth() : false
            const isToday = day ? day.toDateString() === new Date().toDateString() : false
            const hasEvents = day ? getDayEvents(day).length > 0 : false
            const dayEvents = day ? getDayEvents(day) : []

            return (
              <motion.div
                key={index}
                custom={index}
                variants={dayVariants}
                initial="hidden"
                animate="visible"
                whileHover={day && isCurrentMonth ? "hover" : {}}
                whileTap={day && isCurrentMonth ? "tap" : {}}
                onClick={() => day && isCurrentMonth && handleDayClick(day)}
                className={`relative h-20 md:h-20 p-1 rounded-lg border ${
                  day
                    ? isCurrentMonth
                      ? isToday
                        ? "bg-emerald-50/70 dark:bg-emerald-900/30 border-emerald-500/60 shadow-md"
                        : "bg-white/40 dark:bg-gray-800/30 backdrop-blur-sm border-white/20 dark:border-gray-700/30 cursor-pointer"
                      : "bg-gray-50/40 dark:bg-gray-800/40 text-black dark:text-gray-600 border-transparent"
                    : "border-transparent"
                }`}
              >
                {day && (
                  <>
                    <div
                      className={`text-sm ${
                        isCurrentMonth
                          ? isToday
                            ? "font-bold text-emerald-600 dark:text-emerald-400"
                            : "font-medium text-black dark:text-gray-100"
                          : "text-black dark:text-gray-600"
                      }`}
                    >
                      {day.getDate()}
                    </div>

                    {hasEvents && (
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event, eventIndex) => {
                          const colors = getEventColor(event.status)
                          return (
                            <motion.div
                              key={`${event.id}-${eventIndex}`}
                              className={`${colors.bg} ${colors.text} text-xs px-1.5 py-0.5 rounded truncate flex items-center shadow-sm`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 * eventIndex }}
                            >
                              {colors.icon}
                              <span className="ml-1 truncate">{event.bookTitle?.slice(0, 8) || "Книга"}</span>
                            </motion.div>
                          )
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-black dark:text-gray-300">+{dayEvents.length - 2}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {showModal && selectedDay && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              ref={modalRef}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-xl shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-black dark:text-gray-100">
                  {selectedDay.toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30 text-emerald-500 shadow-sm"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="space-y-3">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map((event, index) => {
                    const colors = getEventColor(event.status)
                    return (
                      <motion.div
                        key={event.id}
                        custom={index}
                        variants={eventVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        className={`p-3 rounded-lg ${colors.bg} border-l-4 ${colors.border} shadow-md`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center">
                              <BookOpen className="w-4 h-4 mr-2 text-black dark:text-gray-300" />
                              <h4 className={`font-medium ${colors.text}`}>{event.bookTitle}</h4>
                            </div>
                            <div className="mt-2 flex items-center">
                              <User className="w-4 h-4 mr-2 text-black dark:text-gray-300" />
                              <p className="text-sm text-black dark:text-gray-300">{event.userName}</p>
                            </div>
                            <div className="mt-1 text-xs text-black dark:text-gray-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>Срок возврата: {formatEventDate(event.expirationDate)}</span>
                            </div>
                          </div>
                          <div className="ml-2">{colors.icon}</div>
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <p className="text-black dark:text-gray-300 text-center py-4">Нет событий на этот день</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

