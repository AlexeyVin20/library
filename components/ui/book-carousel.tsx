"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Book as BookComponent } from "@/components/ui/book"
import Link from "next/link"

interface Book {
  id: string
  isbn: string
  title: string
  author: string
  cover: string
  rating: number
  category: string
  year: number
  description: string
}

interface BookCarouselProps {
  books: Book[]
}

export default function BookCarousel({ books }: BookCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const numVisible = 5
  const canScroll = books.length > numVisible

  const paginate = (direction: number) => {
    if (!canScroll) return
    setCurrentIndex(prevIndex => {
      const newIndex = prevIndex + direction
      if (newIndex < 0) {
        return books.length - numVisible
      }
      if (newIndex > books.length - numVisible) {
        return 0
      }
      return newIndex
    })
  }

  useEffect(() => {
    if (!canScroll) return

    const interval = setInterval(() => {
      paginate(1)
    }, 5000)

    const carouselElement = carouselRef.current
    const handleMouseEnter = () => clearInterval(interval)
    const handleMouseLeave = () => {
        const newInterval = setInterval(() => {
            paginate(1)
        }, 5000)
        ;(carouselElement as any).interval = newInterval
    }

    if (carouselElement) {
        carouselElement.addEventListener('mouseenter', handleMouseEnter)
        carouselElement.addEventListener('mouseleave', handleMouseLeave)
        ;(carouselElement as any).interval = interval
    }

    return () => {
      if (carouselElement) {
        carouselElement.removeEventListener('mouseenter', handleMouseEnter)
        carouselElement.removeEventListener('mouseleave',handleMouseLeave)
      }
      clearInterval((carouselElement as any)?.interval || interval)
    }
  }, [canScroll, currentIndex])
  
  if (!books || books.length === 0) {
    return (
        <Card className="bg-transparent rounded-3xl">
            <CardContent className="p-8 flex items-center justify-center h-96">
                <p className="text-white">Нет книг для отображения.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="bg-transparent rounded-3xl" ref={carouselRef}>
      <CardContent className="p-8">
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                width: `${(books.length / numVisible) * 100}%`,
                transform: `translateX(-${(currentIndex * 100) / books.length}%)`,
              }}
            >
              {books.map((book) => (
                <div key={`${book.title}-${book.isbn || ''}`} className="px-2" style={{ width: `${100 / books.length}%` }}>
                  <Link href={`/readers/books/${book.id}`} className="block h-full">
                    <BookComponent>
                      <div className="flex flex-col items-center justify-center h-full">
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-full h-80 object-cover rounded-md"
                        />
                        <div className="text-center mt-2">
                          <p className="font-semibold truncate">{book.title}</p>
                          <p className="text-sm text-gray-400">{book.author}</p>
                        </div>
                      </div>
                    </BookComponent>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {canScroll && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8 bg-white/30 border-white/30 hover:bg-white/50 rounded-full w-12 h-12 z-40"
                onClick={() => paginate(-1)}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-8 bg-white/30 border-white/30 hover:bg-white/50 rounded-full w-12 h-12 z-40"
                onClick={() => paginate(1)}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
