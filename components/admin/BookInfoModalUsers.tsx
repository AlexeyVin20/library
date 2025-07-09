"use client"

import { useState, useEffect } from "react"
import { BookOpen, User, Calendar, Hash, Clock, CheckCircle, AlertCircle, X, MapPin } from "lucide-react"
import type { Book, Journal } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"

interface BookInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Book | Journal | null
  isJournal: boolean
  shelfNumber: number
  position: number
  onRemove: () => void
  onInstancesChange?: () => void
  isReaderMode?: boolean
}

const BookInfoModal = ({ open, onOpenChange, item, isJournal, shelfNumber, position, onRemove, onInstancesChange, isReaderMode = false }: BookInfoModalProps) => {
  const { user } = useAuth()
  const [userReservations, setUserReservations] = useState<any[]>([])
  const [userBorrowedBooks, setUserBorrowedBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Загружаем информацию о резервированиях и взятых книгах при открытии
  useEffect(() => {
    if (open && item && user) {
      fetchUserData()
    }
  }, [open, item, user])

  const fetchUserData = async () => {
    if (!user || !item) return

    try {
      setLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined")

      const token = localStorage.getItem('token')
      if (!token) return

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      // Загружаем резервирования пользователя
      const reservationsResponse = await fetch(`${baseUrl}/api/Reservation/user/${user.id}`, { headers })
      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json()
        console.log('Резервирования пользователя:', reservationsData)
        setUserReservations(reservationsData)
      }

      // Загружаем взятые книги
      const userResponse = await fetch(`${baseUrl}/api/User/${user.id}`, { headers })
      if (userResponse.ok) {
        const userData = await userResponse.json()
        console.log('Взятые книги пользователя:', userData.borrowedBooks)
        setUserBorrowedBooks(userData.borrowedBooks || [])
      }
    } catch (error) {
      console.error("Ошибка загрузки данных пользователя:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!item) return null

  // Находим активное резервирование для этой книги
  const activeReservation = userReservations.find(reservation => {
    const status = reservation.status.toLowerCase();
    return reservation.bookId === item.id && 
      (status === 'активна' || status === 'active' ||
       status === 'подтверждена' || status === 'confirmed' ||
       status === 'одобрена' || status === 'approved' ||
       status === 'выдана' || status === 'issued');
  })

  // Проверяем, взята ли книга пользователем
  const borrowedBook = userBorrowedBooks.find(borrowed => borrowed.bookId === item.id)

  const getStatusInfo = () => {
    if (borrowedBook) {
      return {
        status: 'borrowed',
        title: 'Книга выдана',
        description: 'Эта книга находится у вас на руках',
        color: 'blue',
        icon: CheckCircle
      }
    } else if (activeReservation) {
      // Определяем тип статуса резервирования для правильной подсказки
      const status = activeReservation.status.toLowerCase();
      if (status === 'выдана' || status === 'issued') {
        return {
          status: 'borrowed',
          title: 'Книга выдана',
          description: 'Эта книга находится у вас на руках',
          color: 'blue',
          icon: CheckCircle
        }
      } else {
        return {
          status: 'reserved',
          title: 'Книга зарезервирована',
          description: 'Вы можете забрать эту книгу в библиотеке',
          color: 'green',
          icon: Clock
        }
      }
    } else {
      return {
        status: 'unavailable',
        title: 'Недоступно',
        description: 'У вас нет доступа к этой книге',
        color: 'gray',
        icon: AlertCircle
      }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-blue-600" />
              <div>
                <div className="text-xl">{item.title}</div>
                <div className="text-sm font-normal text-gray-600 mt-1">
                  {(item as Book).authors || "Автор не указан"}
                </div>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-gray-500 hover:text-gray-800 hover:bg-white/50"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* Статус резервирования - главная информация */}
          <Card className={`mb-6 border-l-4 ${
            statusInfo.color === 'blue' ? 'border-blue-500 bg-blue-50' :
            statusInfo.color === 'green' ? 'border-green-500 bg-green-50' :
            'border-gray-400 bg-gray-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <StatusIcon className={`h-6 w-6 ${
                  statusInfo.color === 'blue' ? 'text-blue-600' :
                  statusInfo.color === 'green' ? 'text-green-600' :
                  'text-gray-600'
                }`} />
                <div>
                  <h3 className="font-semibold text-gray-800">{statusInfo.title}</h3>
                  <p className="text-sm text-gray-600">{statusInfo.description}</p>
                </div>
              </div>

              {/* Детали резервирования или выдачи */}
              {activeReservation && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Дата резервирования:</span>
                    <span className="font-medium">{new Date(activeReservation.reservationDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Статус:</span>
                    <Badge className={`${
                      statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activeReservation.status}
                    </Badge>
                  </div>
                  {activeReservation.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Действует до:</span>
                      <span className="font-medium">{new Date(activeReservation.expiryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              {borrowedBook && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Дата выдачи:</span>
                    <span className="font-medium">{new Date(borrowedBook.borrowDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Срок возврата:</span>
                    <span className="font-medium">{new Date(borrowedBook.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Расположение книги */}
          <Card className="mb-6 border-l-4 border-purple-500 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-800">Расположение</h3>
                  <p className="text-sm text-gray-600">
                    Полка #{shelfNumber}, Позиция {position + 1}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Краткая информация о книге */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {!isJournal && (item as Book).isbn && (
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">ISBN</p>
                    <p className="text-sm font-medium text-gray-800">{(item as Book).isbn}</p>
                  </div>
                </div>
              )}

              {(item as Book).publicationYear && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Год издания</p>
                    <p className="text-sm font-medium text-gray-800">{(item as Book).publicationYear}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {(item as Book).genre && (
                <div className="flex items-start gap-3">
                  <BookOpen className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Жанр</p>
                    <p className="text-sm font-medium text-gray-800">{(item as Book).genre}</p>
                  </div>
                </div>
              )}

              {(item as Book).publisher && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Издательство</p>
                    <p className="text-sm font-medium text-gray-800">{(item as Book).publisher}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Описание книги (если есть) */}
          {(item as Book).description && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Описание</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {(item as Book).description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex justify-end w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="bg-white hover:bg-gray-100"
            >
              Закрыть
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BookInfoModal 