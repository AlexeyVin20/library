"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Heart, Eye, X, Book as BookIcon, Sparkles, Library } from "lucide-react"
import Image from "next/image"
import { Book } from "@/components/ui/book"

// Types
export interface Book {
  id: string
  title: string
  author?: string
  authors?: string
  cover?: string
  description?: string
  publishYear?: number
  pages?: number
  isbn?: string
}

export interface GenreBookGroupProps {
  genreName: string
  books: Book[]
  onBookClick?: (book: Book) => void
  onToggleFavorite?: (book: Book) => void
  favoriteBookIds?: Set<string>
  className?: string
}

// Floating background elements for the modal
const FloatingElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: Math.random() * 15 + 10,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 5,
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          {i % 3 === 0 ? (
            <BookOpen className="w-6 h-6 text-blue-300/30" />
          ) : i % 3 === 1 ? (
            <Sparkles className="w-5 h-5 text-purple-300/30" />
          ) : (
            <Library className="w-4 h-4 text-indigo-300/30" />
          )}
        </motion.div>
      ))}
    </div>
  )
}

// Individual book card component for the modal
const BookCard = ({
  book,
  onBookClick,
  onToggleFavorite,
  isFavorite,
}: {
  book: Book
  onBookClick?: (book: Book) => void
  onToggleFavorite?: (book: Book) => void
  isFavorite?: boolean
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="group cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="overflow-hidden bg-white/90 backdrop-blur-xl border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 relative">
        {/* Gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-0"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        <div className="relative flex items-center justify-center p-4">
          <div className="relative">
            <Book
              width={120}
              depth={2}
              illustration={
                book.cover ? (
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    className="object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-blue-500" />
                  </div>
                )
              }
            >
              <div />
            </Book>
            
            {/* Actions overlay */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center gap-2 z-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 20
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  size="sm"
                  className="bg-white/90 hover:bg-white text-gray-800 shadow-lg backdrop-blur-sm border-white/20 rounded-xl text-xs px-2 py-1"
                  onClick={() => onBookClick?.(book)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Подробнее
                </Button>
              </motion.div>
              {onToggleFavorite && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    size="sm"
                    className="bg-white/90 hover:bg-white text-gray-800 shadow-lg backdrop-blur-sm border-white/20 rounded-xl p-1"
                    onClick={() => onToggleFavorite(book)}
                  >
                    <Heart
                      className={`w-3 h-3 ${
                        isFavorite ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        <CardContent className="p-4 relative z-10">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-1 mb-2">
            {book.author || book.authors}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            {book.publishYear && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {book.publishYear}
              </Badge>
            )}
            {book.pages && (
              <span className="text-xs text-gray-500">{book.pages} стр.</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const GenreCoverCollage = ({
  books,
  isHovered,
}: {
  books: Book[]
  isHovered: boolean
}) => {
  const displayBooks = books.slice(0, 4)
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="relative w-full h-40 mx-auto" />
  }

  return (
    <div className="relative w-full h-40 mx-auto flex items-center justify-center">
      {displayBooks.length > 0 ? (
        displayBooks.map((book, index) => (
          <motion.div
            key={`${book.id}-${index}`}
            className="absolute w-24 h-32 rounded-md overflow-hidden shadow-lg border-2 border-white transform-gpu"
            style={{ originX: 0.5, originY: 1 }}
            initial={{
              rotate: (index - (displayBooks.length - 1) / 2) * 10,
              scale: 0.8,
            }}
            animate={{
              rotate: isHovered
                ? (index - (displayBooks.length - 1) / 2) * 20
                : (index - (displayBooks.length - 1) / 2) * 10,
              y: isHovered ? -15 : 0,
              scale: isHovered ? 0.85 : 0.8,
              x: (index - (displayBooks.length - 1) / 2) * (isHovered ? 30 : 20),
              zIndex:
                isHovered && index === Math.floor((displayBooks.length - 1) / 2)
                  ? 10
                  : index,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {book.cover ? (
              <Image
                src={book.cover}
                alt={book.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            )}
          </motion.div>
        ))
      ) : (
        <BookOpen className="w-20 h-20 text-gray-300" />
      )}
    </div>
  )
}

// Main GenreBookGroup component
export const GenreBookGroup: React.FC<GenreBookGroupProps> = ({
  genreName,
  books,
  onBookClick,
  onToggleFavorite,
  favoriteBookIds = new Set(),
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (books.length === 0) {
    return null
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <motion.div
          className={`group cursor-pointer ${className}`}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={isMounted ? { scale: 1.02 } : {}}
          whileTap={isMounted ? { scale: 0.98 } : {}}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col justify-between">
            <CardContent className="p-6 text-center flex-grow flex flex-col justify-center">
              <GenreCoverCollage books={books} isHovered={isHovered} />
              <div className="mt-8">
                <motion.h3
                  className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors"
                  animate={isMounted ? { y: isHovered ? -2 : 0 } : {}}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {genreName}
                </motion.h3>
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-blue-700 border-blue-200"
                >
                  {books.length}{" "}
                  {books.length === 1
                    ? "книга"
                    : books.length < 5
                      ? "книги"
                      : "книг"}
                </Badge>
              </div>
            </CardContent>
            <div className="p-4 text-center border-t border-gray-100">
              <motion.p
                className="text-sm text-gray-600 font-medium group-hover:text-blue-600"
                animate={isMounted ? { opacity: isHovered ? 1 : 0.7 } : { opacity: 0.7 }}
                transition={{ duration: 0.3 }}
              >
                Просмотреть все
              </motion.p>
            </div>
          </Card>
        </motion.div>
      </DialogTrigger>

      <AnimatePresence>
        {isModalOpen && (
          <DialogContent className="max-w-7xl max-h-[95vh] border-0 bg-white/80 p-0 shadow-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-blue-50/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl overflow-hidden"
            >
              <FloatingElements />
              
              {/* Header */}
              <DialogHeader className="relative z-10 bg-white/20 backdrop-blur-xl border-b border-white/20 p-8">
                <div className="flex items-center justify-between">
                  <motion.div 
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div 
                      className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <BookIcon className="w-8 h-8 text-white" />
                    </motion.div>
                    <div>
                      <DialogTitle className="text-3xl font-bold bg-blue-500 bg-clip-text text-transparent">
                        {genreName}
                      </DialogTitle>
                      <motion.p 
                        className="text-gray-600 text-lg mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {books.length}{" "}
                        {books.length === 1
                          ? "книга"
                          : books.length < 5
                            ? "книги"
                            : "книг"}{" "}
                        в коллекции
                      </motion.p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-full w-12 h-12 bg-white-500/80 hover:bg-white/90 shadow-lg backdrop-blur-sm border border-white/20"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </div>
              </DialogHeader>

              {/* Content */}
              <div className="relative z-10 p-8">
                <ScrollArea className="h-[calc(80vh-200px)]">
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {books.map((book, index) => (
                      <motion.div
                        key={`${book.id}-${index}`}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: 0.1 + index * 0.03,
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }}
                      >
                        <BookCard
                          book={book}
                          onBookClick={onBookClick}
                          onToggleFavorite={onToggleFavorite}
                          isFavorite={favoriteBookIds.has(book.id)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </ScrollArea>
              </div>

              {/* Footer */}
              <motion.div 
                className="relative z-10 bg-white/80 backdrop-blur-xl border-t border-white/20 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Library className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-700 font-medium">
                        Всего книг: {books.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <span className="text-gray-700 font-medium">
                        Жанр: {genreName}
                      </span>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setIsModalOpen(false)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl px-8 py-2 shadow-lg"
                    >
                      Закрыть
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}

export default GenreBookGroup
