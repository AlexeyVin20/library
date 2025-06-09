"use client"

import { useState } from "react"
import { BookOpen, User, Calendar, Hash, BookCopy, Languages, Bookmark, FileText, X, ExternalLink } from "lucide-react"
import type { Book, Journal } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BookInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Book | Journal | null
  isJournal: boolean
  shelfId: number
  position: number
  onRemove: () => void
}

const BookInfoModal = ({ open, onOpenChange, item, isJournal, shelfId, position, onRemove }: BookInfoModalProps) => {
  const [activeTab, setActiveTab] = useState("info")

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
            <div className="w-48 h-64 bg-gray-100 rounded-lg overflow-hidden shadow-lg mb-4">
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
              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <p className="text-gray-500 text-sm">Статус</p>
                <p className="text-lg font-medium text-gray-800">
                  {book.availableCopies && book.availableCopies > 0 ? "Доступна" : "Недоступна"}
                </p>
              </div>

              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <p className="text-gray-500 text-sm">Расположение</p>
                <p className="text-lg font-medium text-gray-800">
                  Полка #{shelfId}, Позиция {position + 1}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <Tabs defaultValue="info" onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-emerald-700/50 w-full">
                <TabsTrigger value="info" className="flex-1 data-[state=active]:bg-emerald-500 text-white">
                  Информация
                </TabsTrigger>
                <TabsTrigger value="description" className="flex-1 data-[state=active]:bg-emerald-500 text-white">
                  Описание
                </TabsTrigger>
                <TabsTrigger value="details" className="flex-1 data-[state=active]:bg-emerald-500 text-white">
                  Детали
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/80 text-sm">Автор</p>
                      <p className="text-white font-medium">{book.authors || "Не указан"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/80 text-sm">Год публикации</p>
                      <p className="text-white font-medium">{book.publicationYear || "Не указан"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/80 text-sm">ISBN</p>
                      <p className="text-white font-medium">{book.isbn || "Не указан"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <BookCopy className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/80 text-sm">Издательство</p>
                      <p className="text-white font-medium">{book.publisher || "Не указано"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Languages className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/80 text-sm">Язык</p>
                      <p className="text-white font-medium">{book.language || "Не указан"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Bookmark className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/80 text-sm">Жанр</p>
                      <p className="text-white font-medium">{book.genre || "Не указан"}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="description" className="mt-4">
                <ScrollArea className="h-[300px] pr-4">
                  {book.description ? (
                    <div className="text-white space-y-4">
                      <p>{book.description}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-white/80">
                      <FileText className="h-12 w-12 mb-2 text-white/50" />
                      <p>Описание отсутствует</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-700/30 p-3 rounded-lg">
                        <p className="text-white/80 text-sm">Количество страниц</p>
                        <p className="text-white font-medium">{book.pageCount || "Не указано"}</p>
                      </div>

                      <div className="bg-emerald-700/30 p-3 rounded-lg">
                        <p className="text-white/80 text-sm">Формат</p>
                        <p className="text-white font-medium">{book.format || "Не указан"}</p>
                      </div>

                      <div className="bg-emerald-700/30 p-3 rounded-lg">
                        <p className="text-white/80 text-sm">Доступные экземпляры</p>
                        <p className="text-white font-medium">{book.availableCopies || 0}</p>
                      </div>

                      <div className="bg-emerald-700/30 p-3 rounded-lg">
                        <p className="text-white/80 text-sm">Электронная книга</p>
                        <p className="text-white font-medium">{book.isEbook ? "Да" : "Нет"}</p>
                      </div>

                      {book.udk && (
                        <div className="bg-emerald-700/30 p-3 rounded-lg">
                          <p className="text-white/80 text-sm">УДК</p>
                          <p className="text-white font-medium">{book.udk}</p>
                        </div>
                      )}

                      {book.bbk && (
                        <div className="bg-emerald-700/30 p-3 rounded-lg">
                          <p className="text-white/80 text-sm">ББК</p>
                          <p className="text-white font-medium">{book.bbk}</p>
                        </div>
                      )}

                      {book.originalTitle && (
                        <div className="bg-emerald-700/30 p-3 rounded-lg">
                          <p className="text-white/80 text-sm">Оригинальное название</p>
                          <p className="text-white font-medium">{book.originalTitle}</p>
                        </div>
                      )}

                      {book.originalLanguage && (
                        <div className="bg-emerald-700/30 p-3 rounded-lg">
                          <p className="text-white/80 text-sm">Оригинальный язык</p>
                          <p className="text-white font-medium">{book.originalLanguage}</p>
                        </div>
                      )}
                    </div>

                    {book.summary && (
                      <div className="bg-emerald-700/30 p-3 rounded-lg">
                        <p className="text-white/80 text-sm mb-2">Резюме</p>
                        <p className="text-white">{book.summary}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
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
            <div className="w-48 h-64 bg-blue-700/50 rounded-lg overflow-hidden shadow-lg mb-4">
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
                  <BookOpen className="h-16 w-16 text-white/50" />
                </div>
              )}
            </div>

            <div className="space-y-2 w-full">
              <div className="bg-blue-700/40 rounded-lg p-3 text-center">
                <p className="text-white/80 text-sm">Расположение</p>
                <p className="text-lg font-medium text-white">
                  Полка #{shelfId}, Позиция {position + 1}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <BookCopy className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/80 text-sm">Издатель</p>
                  <p className="text-white font-medium">{journal.publisher || "Не указан"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/80 text-sm">Дата публикации</p>
                  <p className="text-white font-medium">
                    {journal.publicationDate ? new Date(journal.publicationDate).toLocaleDateString() : "Не указана"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/80 text-sm">ISSN</p>
                  <p className="text-white font-medium">{journal.issn || "Не указан"}</p>
                </div>
              </div>

              {journal.description && (
                <div className="bg-blue-700/30 p-4 rounded-lg mt-4">
                  <p className="text-white/80 text-sm mb-2">Описание</p>
                  <ScrollArea className="h-[200px] pr-4">
                    <p className="text-white">{journal.description}</p>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl bg-white border border-gray-100 rounded-xl shadow-lg p-0 overflow-hidden"
      >
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className={`h-6 w-6 ${isJournal ? "text-blue-500" : "text-blue-500"}`} />
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
              <Badge className="bg-blue-100 text-blue-800">Журнал</Badge>
            ) : (
              <Badge className="bg-blue-100 text-blue-800">Книга</Badge>
            )}
            {!isJournal && (item as Book).genre && (
              <Badge className="bg-gray-100 text-gray-800">{(item as Book).genre}</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 pt-0">{isJournal ? renderJournalContent() : renderBookContent()}</div>

        <DialogFooter className="bg-gray-100 p-4 border-t border-gray-200">
          <div className="flex justify-between w-full">
            <Button
              variant="destructive"
              onClick={handleRemove}
              className="bg-red-500 hover:bg-red-700 text-white"
            >
              Удалить с полки
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-gray-800 border-gray-200"
                onClick={() => window.open(`/admin/books/${item.id}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть карточку
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="text-gray-800 border-gray-200">
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
