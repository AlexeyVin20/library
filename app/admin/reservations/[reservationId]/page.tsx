"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronLeft, CheckCircle, XCircle, Clock, Book, User, Calendar, FileText, Printer, Mail, Phone, BookOpen, Download } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

interface Reservation {
  id: string
  userId: string
  bookId: string
  reservationDate: string
  expirationDate: string
  status: string
  notes?: string
  user?: {
    fullName: string
    email?: string
    phone?: string
    address?: string
    registrationDate?: string
  }
  book?: {
    title: string
    authors?: string
    isbn?: string
    publishYear?: number
    category?: string
    cover?: string
  }
}

// Компонент для анимированного появления
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5,
}: { children: React.ReactNode; delay?: number; duration?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Компонент для информационного поля
const InfoField = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => {
  return (
    <motion.div
      className="backdrop-blur-xl bg-green-500/10 rounded-xl p-3 border border-white/10 dark:border-gray-700/10 shadow-sm"
      whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="font-medium text-white">{label}</span>
      </div>
      <span className="text-white">{value}</span>
    </motion.div>
  )
}

// Компонент для вкладок (анимированный, как на главной)
const AnimatedTabsTrigger = ({
  value,
  icon,
  label,
  isActive,
}: { value: string; icon: React.ReactNode; label: string; isActive: boolean }) => {
  return (
    <TabsTrigger
      value={value}
      className={`relative transition-colors
        ${isActive ? 'bg-transparent text-white shadow-md' : ''}
        rounded-lg px-3 py-2
      `}
    >
      <div className="flex items-center gap-2">
        <span className={isActive ? "text-emerald-300" : "text-gray-300 dark:text-gray-400"}>{icon}</span>
        <span>{label}</span>
      </div>
      {isActive && (
        <motion.div
          layoutId="activeReservationTabDetails"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </TabsTrigger>
  );
};

export default function ReservationDetailsPage({ params }: { params: Promise<{ reservationId: string }> }) {
  const router = useRouter()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  // Получаем params через React.use
  const actualParams = React.use(params)
  const reservationId = actualParams.reservationId

  useEffect(() => {
    if (reservationId) {
      fetchReservation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId])

  const fetchReservation = async () => {
    try {
      setLoading(true)
      setError(null) // Сброс ошибки

      // 1. Получаем базовое резервирование
      const response = await fetch(`${baseUrl}/api/Reservation/${reservationId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Резервирование не найдено")
        }
        throw new Error("Ошибка при загрузке резервирования")
      }
      const baseReservation: Reservation = await response.json()

      let finalReservation = { ...baseReservation }
      let bookDetails = null
      let userDetails = null

      try {
        // 2. Запрашиваем полные детали книги
        if (baseReservation.bookId) {
          const bookRes = await fetch(`${baseUrl}/api/books/${baseReservation.bookId}`)
          if (bookRes.ok) {
            bookDetails = await bookRes.json()
          } else {
            console.warn(`Не удалось загрузить книгу ${baseReservation.bookId}`)
          }
        }

        // 3. Запрашиваем полные детали пользователя
        if (baseReservation.userId) {
          const userRes = await fetch(`${baseUrl}/api/users/${baseReservation.userId}`)
          if (userRes.ok) {
            userDetails = await userRes.json()
          } else {
            console.warn(`Не удалось загрузить пользователя ${baseReservation.userId}`)
          }
        }
        
        // 4. Объединяем все данные
        finalReservation = {
          ...baseReservation,
          book: bookDetails ? { ...baseReservation.book, ...bookDetails } : baseReservation.book,
          user: userDetails ? { ...baseReservation.user, ...userDetails } : baseReservation.user,
        }

      } catch (err) {
        console.error(`Ошибка при дозагрузке данных для резервирования ${reservationId}:`, err)
        // Если дозагрузка не удалась, показываем хотя бы базовые данные
      }
      
      setReservation(finalReservation)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке резервирования")
      setReservation(null) // Сбрасываем резервирование в случае ошибки
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!reservation) return

    try {
      const updatedReservation = {
        ...reservation,
        reservationDate: new Date(reservation.reservationDate).toISOString(),
        expirationDate: new Date(reservation.expirationDate).toISOString(),
        status: newStatus,
      }

      const response = await fetch(`${baseUrl}/api/Reservation/${reservation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReservation),
      })

      if (!response.ok) throw new Error("Ошибка при обновлении статуса")
      setReservation({ ...reservation, status: newStatus })
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err)
      alert(err instanceof Error ? err.message : "Ошибка при обновлении статуса")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Выполнена":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case "Отменена":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "Обрабатывается":
        return <Clock className="w-5 h-5 text-amber-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Выполнена":
        return "bg-emerald-500/90 hover:bg-emerald-600/90"
      case "Отменена":
        return "bg-red-500/90 hover:bg-red-600/90"
      case "Обрабатывается":
        return "bg-amber-500/90 hover:bg-amber-600/90"
      default:
        return "bg-gray-500/90 hover:bg-gray-600/90"
    }
  }

  // Функция для генерации и скачивания HTML документа
  const generateFormular = async () => {
    if (!reservation) return;

    // Получаем актуальные данные о пользователе через API
    let userData = null;
    try {
      const userResponse = await fetch(`${baseUrl}/api/user/${reservation.userId}`);
      if (userResponse.ok) {
        userData = await userResponse.json();
      } else {
        console.warn(`Не удалось загрузить данные пользователя для формуляра: ${reservation.userId}`);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных пользователя:', error);
    }

    // Используем полученные данные или данные из резервирования
    const user = userData || reservation.user || {};

    // Стилизация, приближенная к дизайну приложения
    const styles = `
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #333;
          background-color: #f0fdf4;
          padding: 20px;
          max-width: 550px; /* Уменьшенная ширина для формата A5 */
          margin: 0 auto;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          font-size: 12px; /* Меньший размер шрифта для A5 */
        }
        h1, h2, h3 {
          color: #047857;
        }
        h1 {
          text-align: center;
          border-bottom: 2px solid #047857;
          padding-bottom: 5px;
          margin-bottom: 10px;
          font-size: 16px;
        }
        h2 {
          background-color: #d1fae5;
          padding: 3px 8px;
          border-radius: 5px;
          display: inline-block;
          font-size: 14px;
        }
        h3 {
          margin-top: 10px;
          margin-bottom: 5px;
          border-bottom: 1px solid #a7f3d0;
          padding-bottom: 3px;
          font-size: 13px;
        }
        p {
          margin: 3px 0;
          line-height: 1.3;
        }
        strong {
          color: #059669;
        }
        .section {
          margin-bottom: 10px;
          padding: 8px;
          background-color: #ffffff;
          border: 1px solid #d1fae5;
          border-radius: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .signature-section {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #a7f3d0;
          display: flex;
          justify-content: space-between;
        }
        .signature-block {
          width: 45%;
        }
        .signature-line {
          margin-top: 30px;
          border-top: 1px solid #aaa;
          padding-top: 3px;
        }
        .header-info {
          text-align: right;
          font-size: 10px;
          margin-bottom: 10px;
          color: #666;
        }
        @media print {
          @page {
            size: A5; /* Установка формата A5 для печати */
            margin: 10mm;
          }
          body {
            background-color: white;
            border: none;
            padding: 10px;
            width: 100%;
            height: 100%;
          }
          .no-print {
            display: none;
          }
          .section {
            border: 1px solid #eee;
            box-shadow: none;
          }
          .header-info {
            display: none; /* Скрываем ID и дату при печати */
          }
          button {
            display: none;
          }
        }
      </style>
    `;

    // HTML содержимое
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <title>Формуляр книги #${reservation.id}</title>
        ${styles}
      </head>
      <body>
        <div class="header-info no-print">
          <p>Дата формирования: ${new Date().toLocaleString("ru-RU")}</p>
        </div>

        <h1>Формуляр книги</h1>

        <div class="section">
          <h3>Информация о книге</h3>
          <p><strong>Название:</strong> ${reservation.book?.title || "Не указано"}</p>
          <p><strong>Автор:</strong> ${reservation.book?.authors || "Не указан"}</p>
          ${reservation.book?.isbn ? `<p><strong>ISBN:</strong> ${reservation.book.isbn}</p>` : ''}
          ${reservation.book?.publishYear ? `<p><strong>Год издания:</strong> ${reservation.book.publishYear}</p>` : ''}
          ${reservation.book?.category ? `<p><strong>Категория:</strong> ${reservation.book.category}</p>` : ''}
        </div>

        <div class="section">
          <h3>Информация о читателе</h3>
          <p><strong>ФИО:</strong> ${user.fullName || "Не указано"}</p>
          <p><strong>Email:</strong> ${user.email || "Не указано"}</p>
          <p><strong>Телефон:</strong> ${user.phone || "Не указано"}</p>
          ${user.address ? `<p><strong>Адрес:</strong> ${user.address}</p>` : ''}
        </div>

        <div class="section">
          <h3>Детали выдачи</h3>
          <p><strong>Дата выдачи:</strong> ${formatDate(reservation.reservationDate)}</p>
          <p><strong>Дата возврата:</strong> ${formatDate(reservation.expirationDate)}</p>
        </div>

        <div class="section no-print">
          <h3>Примечания</h3>
          <p>${reservation.notes || "Нет дополнительных примечаний"}</p>
        </div>

        <div class="signature-section">
          <div class="signature-block">
            <p>Библиотекарь:</p>
            <div class="signature-line"></div>
            <p>______________________</p>
          </div>
          <div class="signature-block">
            <p>Читатель:</p>
            <div class="signature-line"></div>
            <p>${user.fullName || "______________________"}</p>
          </div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="background-color: #059669; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
            Распечатать формуляр
          </button>
        </div>
      </body>
      </html>
    `;

    // Создаем Blob с HTML содержимым
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    
    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Формуляр_книги_${reservation.id}.html`;
    
    // Имитируем клик для запуска скачивания
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto p-6 relative z-10">
        {/* Header */}
        <FadeInView>
          <div className="mb-8 flex items-center gap-4">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
              <Link
                href="/admin/reservations"
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium text-white">Назад к резервированиям</span>
              </Link>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-bold text-white"
            >
              Детали резервирования
            </motion.h1>
          </div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-red-500/20 border border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full"
              />
            </div>
          ) : !reservation ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-yellow-500/20 border border-yellow-200/50 dark:border-yellow-800/30 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg"
            >
              Резервирование не найдено
            </motion.div>
          ) : (
            <motion.div
              className="backdrop-blur-xl bg-green-500/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/30"
              whileHover={{
                boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`${getStatusColor(reservation.status)} text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md`}
                  >
                    {getStatusIcon(reservation.status)}
                    <span>{reservation.status}</span>
                  </motion.div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    onClick={generateFormular}
                    className="bg-green-500/90 hover:bg-green-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Printer className="h-4 w-4" />
                    <span>Печать формуляра</span>
                  </motion.button>
                  
                  {reservation.status !== "Выполнена" && (
                    <motion.button
                      onClick={() => handleStatusChange("Выполнена")}
                      className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Выполнить</span>
                    </motion.button>
                  )}
                  {reservation.status !== "Отменена" && (
                    <motion.button
                      onClick={() => handleStatusChange("Отменена")}
                      className="bg-red-500/90 hover:bg-red-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Отменить</span>
                    </motion.button>
                  )}
                </div>
              </div>

              <Tabs
                defaultValue={activeTab}
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full mb-6"
              >
                <TabsList className="bg-transparent backdrop-blur-md p-1 rounded-xl border border-white/20 dark:border-gray-700/30 shadow-md text-white">
                  <AnimatedTabsTrigger
                    value="details"
                    icon={<Book className="w-4 h-4" />}
                    label="Детали книги"
                    isActive={activeTab === "details"}
                  />
                  <AnimatedTabsTrigger
                    value="user"
                    icon={<User className="w-4 h-4" />}
                    label="Пользователь"
                    isActive={activeTab === "user"}
                  />
                </TabsList>

                <TabsContent value="details" className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h2 className="text-xl font-bold mb-2 text-white">{reservation.book?.title || "Книга не указана"}</h2>
                      <p className="text-white mb-4">{reservation.book?.authors || "Автор не указан"}</p>

                      <div className="grid grid-cols-1 gap-4">
                        <InfoField
                          label="ID резервирования"
                          value={reservation.id}
                          icon={<FileText className="h-4 w-4 text-emerald-300" />}
                        />
                        <InfoField
                          label="Дата резервирования"
                          value={formatDate(reservation.reservationDate)}
                          icon={<Calendar className="h-4 w-4 text-emerald-300" />}
                        />
                        <InfoField
                          label="Дата окончания"
                          value={formatDate(reservation.expirationDate)}
                          icon={<Calendar className="h-4 w-4 text-emerald-300" />}
                        />
                        {reservation.book?.isbn && (
                          <InfoField
                            label="ISBN"
                            value={reservation.book.isbn}
                            icon={<BookOpen className="h-4 w-4 text-emerald-300" />}
                          />
                        )}
                        {reservation.book?.publishYear && (
                          <InfoField
                            label="Год издания"
                            value={reservation.book.publishYear.toString()}
                            icon={<Calendar className="h-4 w-4 text-emerald-300" />}
                          />
                        )}
                        {reservation.book?.category && (
                          <InfoField
                            label="Категория"
                            value={reservation.book.category}
                            icon={<Book className="h-4 w-4 text-emerald-300" />}
                          />
                        )}
                      </div>
                      <div className="backdrop-blur-xl bg-green-500/10 rounded-xl p-4 border border-white/10 dark:border-gray-700/10 h-auto mt-4">
                        <h3 className="text-lg font-medium mb-3 text-white">Примечания</h3>
                        <p className="text-white text-sm">
                          {reservation.notes || "Нет дополнительных примечаний"}
                        </p>
                      </div>
                    </div>

                    <div>
                      {reservation.book?.cover && (
                        <div className="mb-4 rounded-lg overflow-hidden shadow-lg relative" style={{ height: "34.5rem", width: "24.5rem" }}>
                          <Image
                            src={reservation.book.cover}
                            alt={reservation.book.title || "Обложка книги"}
                            fill
                            style={{ objectFit: "cover" }}
                            className="rounded-lg transition-all duration-300 hover:scale-105"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="user" className="pt-6">
                  <div className="backdrop-blur-xl bg-green-500/10 rounded-xl p-6 border border-white/10 dark:border-gray-700/10 mb-6">
                    <h2 className="text-xl font-bold mb-2 text-white">
                      {reservation.user?.fullName || "Пользователь не указан"}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {reservation.user?.email && (
                        <InfoField
                          label="Email"
                          value={reservation.user.email}
                          icon={<Mail className="h-4 w-4 text-emerald-300" />}
                        />
                      )}
                      {reservation.user?.phone && (
                        <InfoField
                          label="Телефон"
                          value={reservation.user.phone}
                          icon={<Phone className="h-4 w-4 text-emerald-300" />}
                        />
                      )}
                      {reservation.user?.address && (
                        <InfoField
                          label="Адрес"
                          value={reservation.user.address}
                          icon={<FileText className="h-4 w-4 text-emerald-300" />}
                        />
                      )}
                      {reservation.user?.registrationDate && (
                        <InfoField
                          label="Дата регистрации"
                          value={formatDate(reservation.user.registrationDate)}
                          icon={<Calendar className="h-4 w-4 text-emerald-300" />}
                        />
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <motion.button
                        onClick={() => router.push(`/admin/users/${reservation.userId}`)}
                        className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <User className="h-4 w-4" />
                        <span>Перейти к профилю пользователя</span>
                      </motion.button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </FadeInView>
      </div>
    </div>
  )
}
