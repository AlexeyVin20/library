"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Heart, Eye, X } from 'lucide-react'
import Image from "next/image"

// Custom Paper Sheet Icon Component
const PaperSheet = ({ className, isOpen = false }: { className?: string, isOpen?: boolean }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main paper sheet */}
      <path
        d="M20 10 L70 10 L85 25 L85 90 L20 90 Z"
        fill={isOpen ? "rgba(59, 130, 246, 0.8)" : "rgba(37, 99, 235, 0.7)"}
        stroke="rgba(29, 78, 216, 0.9)"
        strokeWidth="2"
      />
      
      {/* Folded corner */}
      <path
        d="M70 10 L70 25 L85 25"
        fill="rgba(29, 78, 216, 0.6)"
        stroke="rgba(29, 78, 216, 0.9)"
        strokeWidth="2"
      />
      
      {/* Folded corner shadow */}
      <path
        d="M70 10 L70 25 L85 25"
        fill="rgba(0,0,0,0.1)"
      />
      
      {/* Paper lines for detail */}
      <line x1="30" y1="35" x2="75" y2="35" stroke="rgba(29, 78, 216, 0.5)" strokeWidth="1" opacity="0.4"/>
      <line x1="30" y1="45" x2="75" y2="45" stroke="rgba(29, 78, 216, 0.5)" strokeWidth="1" opacity="0.4"/>
      <line x1="30" y1="55" x2="75" y2="55" stroke="rgba(29, 78, 216, 0.5)" strokeWidth="1" opacity="0.4"/>
      <line x1="30" y1="65" x2="65" y2="65" stroke="rgba(29, 78, 216, 0.5)" strokeWidth="1" opacity="0.4"/>
    </svg>
  )
}

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

// Individual book card component for the modal
const BookCard = ({ 
  book, 
  onBookClick, 
  onToggleFavorite, 
  isFavorite 
}: {
  book: Book
  onBookClick?: (book: Book) => void
  onToggleFavorite?: (book: Book) => void
  isFavorite?: boolean
}) => {
  return (
    <motion.div
      className="group cursor-pointer"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="relative aspect-[3/4] overflow-hidden">
          {book.cover ? (
            <Image
              src={book.cover || "/placeholder.svg"}
              alt={book.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-blue-500" />
            </div>
          )}
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white text-gray-800"
              onClick={() => onBookClick?.(book)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Подробнее
            </Button>
            {onToggleFavorite && (
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 hover:bg-white text-gray-800"
                onClick={() => onToggleFavorite(book)}
              >
                <Heart 
                  className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                />
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-1 mb-2">{book.author || book.authors}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            {book.publishYear && <span>{book.publishYear}</span>}
            {book.pages && <span>{book.pages} стр.</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Folder component with animated books
const AnimatedFolder = ({ 
  books, 
  isHovered, 
  isOpen 
}: { 
  books: Book[]
  isHovered: boolean
  isOpen: boolean
}) => {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const displayBooks = books.slice(0, 4)
  
  return (
    <div className="relative w-32 h-32 mx-auto">
      {/* Paper sheet base */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={isMounted ? { 
          scale: isHovered ? 1.1 : 1,
          rotateY: isHovered ? 5 : 0
        } : {}}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <PaperSheet className="w-24 h-24 drop-shadow-lg" isOpen={isOpen} />
      </motion.div>

      {/* Book thumbnails inside folder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-1 w-12 h-12 mt-2">
          {displayBooks.map((book, index) => (
            <motion.div
              key={book.id}
              className="relative w-5 h-6 rounded-sm overflow-hidden shadow-sm"
              initial={{ scale: 0, opacity: 0 }}
              animate={isMounted ? { 
                scale: isHovered ? 1.1 : 1, 
                opacity: 1,
                y: isHovered ? -2 : 0
              } : { scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.1,
                type: "spring",
                stiffness: 300
              }}
            >
              {book.cover ? (
                <Image
                  src={book.cover || "/placeholder.svg"}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${
                  index % 4 === 0 ? 'from-blue-400 to-blue-600' :
                  index % 4 === 1 ? 'from-green-400 to-green-600' :
                  index % 4 === 2 ? 'from-purple-400 to-purple-600' :
                  'from-pink-400 to-pink-600'
                }`} />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating count badge */}
      <motion.div
        className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
        animate={isMounted ? { 
          scale: isHovered ? 1.2 : 1,
          rotate: isHovered ? 360 : 0
        } : {}}
        transition={{ duration: 0.6 }}
      >
        {books.length}
      </motion.div>
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
  className = ""
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
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardContent className="p-6 text-center">
              {/* Animated folder with books */}
              <AnimatedFolder 
                books={books} 
                isHovered={isHovered} 
                isOpen={isModalOpen}
              />

              {/* Genre name */}
              <motion.h3
                className="text-lg font-bold text-gray-800 mt-4 mb-2 group-hover:text-blue-600 transition-colors"
                animate={isMounted ? { y: isHovered ? -2 : 0 } : {}}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {genreName}
              </motion.h3>

              {/* Book count and description */}
              <div className="space-y-2">
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-700 border-blue-200"
                >
                  {books.length} {books.length === 1 ? 'книга' : books.length < 5 ? 'книги' : 'книг'}
                </Badge>
                
                <motion.p
                  className="text-sm text-gray-600"
                  animate={isMounted ? { opacity: isHovered ? 1 : 0.7 } : { opacity: 0.7 }}
                  transition={{ duration: 0.3 }}
                >
                  Нажмите, чтобы просмотреть все книги
                </motion.p>
              </div>

              {/* Hover effect overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg"
                initial={{ opacity: 0 }}
                animate={isMounted ? { opacity: isHovered ? 1 : 0 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </CardContent>
          </Card>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[90vh] bg-white/95 backdrop-blur-xl border-white/20">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <PaperSheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-800">
                  {genreName}
                </DialogTitle>
                <p className="text-gray-600">
                  {books.length} {books.length === 1 ? 'книга' : books.length < 5 ? 'книги' : 'книг'} в коллекции
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, staggerChildren: 0.05 }}
          >
            {books.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
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

        {/* Modal footer with stats */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Всего книг: {books.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl"
              >
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default GenreBookGroup
