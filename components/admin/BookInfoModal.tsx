"use client"

import { useState, useEffect } from "react"
import { BookOpen, User, Calendar, Hash, BookCopy, Languages, Bookmark, FileText, X, ExternalLink, Package } from "lucide-react"
import type { Book, Journal, BookInstance } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"

interface BookInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Book | Journal | null
  isJournal: boolean
  shelfNumber: number
  position: number
  onRemove: () => void
  onInstancesChange?: () => void // Колбэк для обновления данных родительского компонента
}

const BookInfoModal = ({ open, onOpenChange, item, isJournal, shelfNumber, position, onRemove, onInstancesChange }: BookInfoModalProps) => {
  const [activeTab, setActiveTab] = useState("info")
  const [instances, setInstances] = useState<BookInstance[]>([])
  const [loadingInstances, setLoadingInstances] = useState(false)

  // Загружаем экземпляры книги при открытии модального окна
  useEffect(() => {
    if (open && item && !isJournal) {
      fetchBookInstances()
    }
  }, [open, item, isJournal])

  // Слушаем события обновления экземпляров
  useEffect(() => {
    const handleInstanceUpdate = () => {
      if (open && item && !isJournal) {
        fetchBookInstances()
        if (onInstancesChange) {
          onInstancesChange()
        }
      }
    }

    window.addEventListener('instanceStatusUpdate', handleInstanceUpdate)
    window.addEventListener('bookInstancesUpdated', handleInstanceUpdate)

    return () => {
      window.removeEventListener('instanceStatusUpdate', handleInstanceUpdate)
      window.removeEventListener('bookInstancesUpdated', handleInstanceUpdate)
    }
  }, [open, item, isJournal, onInstancesChange])

  const fetchBookInstances = async () => {
    if (!item || isJournal) return

    try {
      setLoadingInstances(true)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined")

      // Получаем токен авторизации
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Ошибка авторизации",
          description: "Токен авторизации не найден. Пожалуйста, войдите в систему заново.",
          variant: "destructive"
        });
        setLoadingInstances(false);
        return;
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${baseUrl}/api/BookInstance?bookId=${item.id}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setInstances(data)
      } else {
        console.warn('Не удалось загрузить экземпляры книги')
        setInstances([])
      }
    } catch (error) {
      console.error("Ошибка загрузки экземпляров", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить экземпляры книги",
        variant: "destructive"
      })
    } finally {
      setLoadingInstances(false)
    }
  }

  if (!item) return null

  const handleRemove = () => {
    if (confirm(`Вы уверены, что хотите удалить ${isJournal ? "журнал" : "книгу"} с полки?`)) {
      onRemove()
      onOpenChange(false)
    }
  }

  const renderBookContent = () => {
    const book = item as Book
    return (
      <>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="w-48 h-64 bg-gray-100 rounded-xl overflow-hidden shadow-lg mb-4">
              {book.cover ? (
                <img
                  src={book.cover || "/placeholder.svg"}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            <div className="space-y-2 w-full">
              <div className="bg-gray-100 rounded-xl p-3 text-center border-l-4 border-blue-500">
                <p className="text-gray-500 text-sm">Статус</p>
                <p className="text-lg font-medium text-gray-800">
                  {book.availableCopies && book.availableCopies > 0 ? "Доступна" : "Недоступна"}
                </p>
              </div>

              <div className="bg-gray-100 rounded-xl p-3 text-center border-l-4 border-blue-500">
                <p className="text-gray-500 text-sm">Расположение</p>
                <p className="text-lg font-medium text-gray-800">
                  Полка #{shelfNumber}, Позиция {instances.length > 1 ? `1-${instances.length}` : '1'}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <Tabs defaultValue="info" onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-blue-300 w-full rounded-xl">
                <TabsTrigger value="info" className="flex-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white text-blue-500 rounded-xl">Информация</TabsTrigger>
                <TabsTrigger value="description" className="flex-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white text-blue-500 rounded-xl">Описание</TabsTrigger>
                <TabsTrigger value="details" className="flex-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white text-blue-500 rounded-xl">Детали</TabsTrigger>
                {!isJournal && (
                  <TabsTrigger value="instances" className="flex-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white text-blue-500 rounded-xl">Экземпляры</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="info" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-sm">Автор</p>
                      <p className="text-gray-800 font-medium">{book.authors || "Не указан"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-sm">Год публикации</p>
                      <p className="text-gray-800 font-medium">{book.publicationYear ?? 'Нет данных'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-sm">ISBN</p>
                      <p className="text-gray-800 font-medium">{book.isbn || "Не указан"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <BookCopy className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-sm">Издательство</p>
                      <p className="text-gray-800 font-medium">{book.publisher ?? 'Нет данных'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Languages className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-sm">Язык</p>
                      <p className="text-gray-800 font-medium">{book.language ?? 'Нет данных'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Bookmark className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-sm">Жанр</p>
                      <p className="text-gray-800 font-medium">{book.genre || "Не указан"}</p>
                    </div>
                  </div>

                  {book.categorization && (
                    <div className="flex items-start gap-3">
                      <Bookmark className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-sm">Классификация (УДК/ББК)</p>
                        <p className="text-gray-800 font-medium">{book.categorization}</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="description" className="mt-4">
                {book.description ? (
                  <p className="text-gray-800 whitespace-pre-line">{book.description}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-gray-500">
                    <FileText className="h-12 w-12 mb-2 text-gray-400" />
                    <p>Описание отсутствует</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-xl border-l-4 border-blue-500 shadow">
                        <p className="text-gray-500 text-sm">Количество страниц</p>
                        <p className="text-gray-800 font-medium">{book.pageCount ?? 'Нет данных'}</p>
                      </div>

                      <div className="bg-white p-3 rounded-xl border-l-4 border-blue-500 shadow">
                        <p className="text-gray-500 text-sm">Формат</p>
                        <p className="text-gray-800 font-medium">{'Нет данных'}</p>
                      </div>

                      <div className="bg-white p-3 rounded-xl border-l-4 border-blue-500 shadow">
                        <p className="text-gray-500 text-sm">Доступные экземпляры</p>
                        <p className="text-gray-800 font-medium">{book.availableCopies || 0}</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="instances" className="mt-4">
                <div className="space-y-4">
                  {/* Header с статистикой */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-500" />
                      <h4 className="font-medium text-gray-800">Экземпляры книги</h4>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                        {instances.length}
                      </span>
                    </div>
                  </div>

                  {/* Статистика экземпляров */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-center text-sm">
                      <div className="font-bold">{instances.filter(i => i.status.toLowerCase() === 'доступна' && i.isActive).length}</div>
                      <div className="text-xs">Доступно</div>
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-center text-sm">
                      <div className="font-bold">{instances.filter(i => i.status.toLowerCase() === 'выдана' && i.isActive).length}</div>
                      <div className="text-xs">Выдано</div>
                    </div>
                    <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-center text-sm">
                      <div className="font-bold">{instances.filter(i => i.status.toLowerCase() === 'зарезервирована' && i.isActive).length}</div>
                      <div className="text-xs">Зарезервировано</div>
                    </div>
                    <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-center text-sm">
                      <div className="font-bold">{instances.filter(i => !i.isActive).length}</div>
                      <div className="text-xs">Неактивно</div>
                    </div>
                  </div>

                  {/* Список экземпляров */}
                  <ScrollArea className="h-[250px] pr-4">
                    {loadingInstances ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : instances.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p>Нет экземпляров для этой книги</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {instances.map((instance) => (
                          <div
                            key={instance.id}
                            className={`p-3 rounded-lg border-l-4 ${
                              !instance.isActive
                                ? 'bg-gray-50 border-gray-400'
                                : instance.status.toLowerCase() === 'доступна'
                                ? 'bg-green-50 border-green-500'
                                : instance.status.toLowerCase() === 'выдана'
                                ? 'bg-yellow-50 border-yellow-500'
                                : instance.status.toLowerCase() === 'зарезервирована'
                                ? 'bg-purple-50 border-purple-500'
                                : 'bg-blue-50 border-blue-500'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-800">{instance.instanceCode}</span>
                                  <Badge 
                                    className={`text-xs ${
                                      !instance.isActive
                                        ? 'bg-gray-200 text-gray-700'
                                        : instance.status.toLowerCase() === 'доступна'
                                        ? 'bg-green-200 text-green-800'
                                        : instance.status.toLowerCase() === 'выдана'
                                        ? 'bg-yellow-200 text-yellow-800'
                                        : instance.status.toLowerCase() === 'зарезервирована'
                                        ? 'bg-purple-200 text-purple-800'
                                        : 'bg-blue-200 text-blue-800'
                                    }`}
                                  >
                                    {instance.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">Состояние: {instance.condition}</p>
                                {instance.location && (
                                  <p className="text-sm text-gray-600">Местоположение: {instance.location}</p>
                                )}
                                {instance.dateAcquired && (
                                  <p className="text-xs text-gray-500">
                                    Поступила: {new Date(instance.dateAcquired).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </>
    )
  }

  const renderJournalContent = () => {
    const journal = item as Journal
    return (
      <>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="w-48 h-64 bg-blue-300 rounded-xl overflow-hidden shadow-lg mb-4">
              {journal.coverImageUrl ? (
                <img
                  src={journal.coverImageUrl || "/placeholder.svg"}
                  alt={journal.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-blue-500/50" />
                </div>
              )}
            </div>

            <div className="space-y-2 w-full">
              <div className="bg-blue-300 rounded-xl p-3 text-center border-l-4 border-blue-500">
                <p className="text-blue-700 text-sm">Расположение</p>
                <p className="text-lg font-medium text-gray-800">
                  Полка #{shelfNumber}, Позиция {position + 1}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <BookCopy className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-sm">Издатель</p>
                  <p className="text-gray-800 font-medium">{journal.publisher || "Не указан"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-sm">Дата публикации</p>
                  <p className="text-gray-800 font-medium">Нет данных</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-sm">ISSN</p>
                  <p className="text-gray-800 font-medium">{journal.issn || "Не указан"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl bg-gray-200 border border-gray-100 rounded-2xl shadow-lg p-0 overflow-hidden"
      >
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className={`h-6 w-6 text-blue-500`} />
              {item.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {isJournal ? (
              <Badge className="bg-blue-300 text-blue-700 rounded-xl">Журнал</Badge>
            ) : (
              <Badge className="bg-blue-300 text-blue-700 rounded-xl">Книга</Badge>
            )}
            {!isJournal && (item as Book).genre && (
              <Badge className="bg-gray-100 text-blue-500 border-l-4 border-blue-500 rounded-xl">{(item as Book).genre}</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 pt-0">{isJournal ? renderJournalContent() : renderBookContent()}</div>

        <DialogFooter className="bg-gray-100 p-4 border-t border-gray-200 rounded-b-2xl">
          <div className="flex justify-between w-full">
            <Button
              variant="destructive"
              onClick={handleRemove}
              className="bg-red-100 hover:bg-red-800 text-red-800 border-l-4 border-red-500 rounded-lg"
            >
              Удалить с полки
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-white text-blue-500 border-2 border-blue-500 rounded-lg hover:bg-gray-100"
                onClick={() => window.open(`/admin/books/${item.id}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть карточку
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-white text-blue-500 border-2 border-blue-500 rounded-lg hover:bg-gray-100">
                Закрыть
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BookInfoModal

