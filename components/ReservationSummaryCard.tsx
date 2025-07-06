"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpenCheck, ArrowRight, Hourglass } from "lucide-react"
import Image from "next/image"

interface Reservation {
  id: string
  status: string
  bookId: string
  reservationDate: string
  expirationDate: string
  book?: {
    title?: string
    authors?: string
    cover?: string
  }
}

const ReservationSummaryCard = ({ userId }: { userId?: string }) => {
  const [summary, setSummary] = useState<{ count: number; next: Reservation | null }>({
    count: 0,
    next: null,
  })
  const [loading, setLoading] = useState(true)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  const ref = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    ["17.5deg", "-17.5deg"],
  )
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    ["-17.5deg", "17.5deg"],
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchReservations = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${baseUrl}/api/Reservation/user/${userId}`)
        if (response.ok) {
          const reservations: Reservation[] = await response.json()
          if (Array.isArray(reservations)) {
            const activeReservations = reservations
              .filter((r) =>
                ["активна", "подтверждена", "обрабатывается", "одобрена", "выдана"].includes(
                  r.status.toLowerCase(),
                ),
              )
              .sort(
                (a, b) =>
                  new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime(),
              )

            const activeCount = activeReservations.length
            let nextReservation: Reservation | null = null

            if (activeCount > 0) {
              const reservationToFeature = activeReservations[0]

              if (reservationToFeature.bookId) {
                const bookRes = await fetch(`${baseUrl}/api/books/${reservationToFeature.bookId}`)
                if (bookRes.ok) {
                  reservationToFeature.book = await bookRes.json()
                }
              }
              nextReservation = reservationToFeature
            }
            setSummary({ count: activeCount, next: nextReservation })
          } else {
            setSummary({ count: 0, next: null })
          }
        } else {
          setSummary({ count: 0, next: null })
        }
      } catch (error) {
        console.error("Failed to fetch reservations summary", error)
        setSummary({ count: 0, next: null })
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [userId, baseUrl])

  if (!userId) {
    return null
  }

  const getPluralizedReservations = (count: number) => {
    if (count % 10 === 1 && count % 100 !== 11) {
      return "бронирование"
    }
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
      return "бронирования"
    }
    return "бронирований"
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative h-64 w-full max-w-2xl mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600"
    >
      <div
        style={{
          transform: "translateZ(75px)",
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-4 grid place-content-center rounded-xl bg-white/80 backdrop-blur-md shadow-lg"
      >
        <div style={{ transform: "translateZ(50px)" }} className="p-4 w-full">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Hourglass className="w-10 h-10 text-slate-500 animate-spin" />
              <p className="text-slate-600 font-medium">Загрузка данных...</p>
            </div>
          ) : summary.count > 0 && summary.next ? (
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start gap-4">
                <div
                  style={{ transform: "translateZ(25px)" }}
                  className="relative h-36 w-24 flex-shrink-0"
                >
                  <Image
                    src={summary.next.book?.cover || "/placeholder.svg"}
                    alt={summary.next.book?.title || "Обложка"}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg shadow-lg"
                  />
                </div>
                <div className="flex-grow text-left" style={{ transform: "translateZ(35px)" }}>
                  <p className="font-medium text-sm text-slate-600">Ближайшее бронирование</p>
                  <h3 className="mt-1 font-bold text-xl text-slate-900 line-clamp-2">
                    {summary.next.book?.title}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    <p>
                      <strong>Бронь до:</strong>{" "}
                      {new Date(summary.next.expirationDate).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  {summary.count > 1 && (
                    <p className="mt-2 text-xs text-slate-500">
                      + еще {summary.count - 1} {getPluralizedReservations(summary.count - 1)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <Link href="/readers/history">
                  <Button
                    className="group rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    style={{ transform: "translateZ(25px)" }}
                  >
                    Все бронирования{" "}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <BookOpenCheck className="w-12 h-12 mx-auto text-slate-800 mb-4" />
              <p className="text-2xl font-bold text-slate-900">Нет активных бронирований</p>
              <p className="text-slate-600 my-2">Самое время найти что-то интересное!</p>
              <Link href="/readers/books">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg group">
                  Искать книги{" "}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default ReservationSummaryCard 