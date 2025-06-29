"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react"
import type { Book, Shelf, Journal } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface ShelfCanvasProps {
  shelves: Shelf[]
  books: Book[]
  journals: Journal[]
  loading: boolean
  isEditMode: boolean
  highlightedBookId: string | null
  onDragStart: (e: React.MouseEvent, shelf: Shelf) => void
  onDragMove: (e: React.MouseEvent) => void
  onDragEnd: () => void
  onShelfEdit: (shelf: Shelf) => void
  onShelfDelete: (id: number) => void
  onItemClick: (item: Book | Journal | null, isJournal: boolean, shelfId: number, position: number) => void
  onEmptySlotClick: (shelfId: number, position: number) => void
  overlappingShelfIds?: number[]
  getShelfSize: (capacity: number) => { width: number; height: number }
  draggedItem?: {
    item: Book | Journal;
    isJournal: boolean;
    sourceShelfId: number;
    sourcePosition: number;
  } | null
  dragOverSlot?: {
    shelfId: number;
    position: number;
  } | null
  isDraggingItem?: boolean
  onItemDragStart?: (item: Book | Journal, isJournal: boolean, shelfId: number, position: number, e: React.DragEvent) => void
  onSlotDragOver?: (shelfId: number, position: number, e: React.DragEvent) => void
  onSlotDragLeave?: () => void
  onItemDrop?: (targetShelfId: number, targetPosition: number, e: React.DragEvent) => void
  onItemDragEnd?: () => void
  aiArrangedBooks?: string[]
}

const ShelfCanvas = ({
  shelves,
  books,
  journals,
  loading,
  isEditMode,
  highlightedBookId,
  onDragStart,
  onDragMove,
  onDragEnd,
  onShelfEdit,
  onShelfDelete,
  onItemClick,
  onEmptySlotClick,
  overlappingShelfIds = [],
  getShelfSize,
  draggedItem,
  dragOverSlot,
  isDraggingItem,
  onItemDragStart,
  onSlotDragOver,
  onSlotDragLeave,
  onItemDrop,
  onItemDragEnd,
  aiArrangedBooks = [],
}: ShelfCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 1500 })
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Calculate the bounds of all shelves to determine canvas size
  useEffect(() => {
    if (shelves.length === 0) return

    let maxX = 0
    let maxY = 0

    shelves.forEach((shelf) => {
      const { width, height } = getShelfSize(shelf.capacity);
      const shelfRight = shelf.posX + width;
      const shelfBottom = shelf.posY + height;
      if (shelfRight > maxX) maxX = shelfRight;
      if (shelfBottom > maxY) maxY = shelfBottom;
    })

    // Add padding and set minimum size
    setCanvasSize({
      width: Math.max(1200, maxX + 100),
      height: Math.max(800, maxY + 100),
    })
  }, [shelves])

  // Update viewport size on resize
  useEffect(() => {
    const updateViewportSize = () => {
      if (canvasRef.current) {
        setViewportSize({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        })
      }
    }

    updateViewportSize()
    window.addEventListener("resize", updateViewportSize)
    return () => window.removeEventListener("resize", updateViewportSize)
  }, [])

  // Handle canvas dragging for navigation
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only allow canvas dragging with middle mouse button or when holding space
    if (e.button === 1 || e.altKey) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
      e.preventDefault()
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Calculate bounds to prevent scrolling too far
      const minX = Math.min(0, viewportSize.width - canvasSize.width * zoom)
      const minY = Math.min(0, viewportSize.height - canvasSize.height * zoom)

      setPosition({
        x: Math.max(minX, Math.min(0, newX)),
        y: Math.max(minY, Math.min(0, newY)),
      })
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(2, prev + 0.1))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, prev - 0.1))
  }

  // Navigation controls
  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    const moveStep = 100
    setPosition((prev) => {
      const minX = Math.min(0, viewportSize.width - canvasSize.width * zoom)
      const minY = Math.min(0, viewportSize.height - canvasSize.height * zoom)

      switch (direction) {
        case "up":
          return { ...prev, y: Math.min(0, prev.y + moveStep) }
        case "down":
          return { ...prev, y: Math.max(minY, prev.y - moveStep) }
        case "left":
          return { ...prev, x: Math.min(0, prev.x + moveStep) }
        case "right":
          return { ...prev, x: Math.max(minX, prev.x - moveStep) }
        default:
          return prev
      }
    })
  }

  // Reset view to center
  const handleResetView = () => {
    setPosition({ x: 0, y: 0 })
    setZoom(1)
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Render shelf items (books and journals)
  const renderShelfContent = (shelf: Shelf) => {
    return (
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: shelf.capacity }).map((_, i) => {
          const book = books.find((b) => b.shelfId === shelf.id && b.position === i)
          const journal = journals.find((j) => j.shelfId === shelf.id && j.position === i)
          const item = book || journal

          const getBackground = () => {
            // Check if this slot is being hovered during drag
            const isDropTarget = dragOverSlot?.shelfId === shelf.id && dragOverSlot?.position === i
            const isDraggedSource = draggedItem?.sourceShelfId === shelf.id && draggedItem?.sourcePosition === i
            
            if (isDraggedSource) {
              return "bg-gray-300 opacity-50 border-2 border-dashed border-gray-400"
            }
            
            if (isDropTarget) {
              return "bg-yellow-200 border-2 border-yellow-400 animate-pulse"
            }

            if (item) {
              if (book) {
                // Check if this book was arranged by AI
                const isAiArranged = aiArrangedBooks.includes(book.id)
                
                // Highlight the book if it matches the highlighted ID
                const isHighlighted = book.id === highlightedBookId
                if (isHighlighted) {
                  return "bg-yellow-400 border-2 border-yellow-600 shadow-lg animate-pulse"
                }
                
                // Special styling for AI-arranged books
                if (isAiArranged) {
                  return book.availableCopies && book.availableCopies > 0
                    ? "bg-gradient-to-br from-green-400 to-blue-500 border-2 border-purple-400 shadow-lg hover:scale-105 hover:shadow-md animate-pulse"
                    : "bg-gradient-to-br from-red-400 to-blue-500 border-2 border-purple-400 shadow-lg hover:scale-105 hover:shadow-md animate-pulse"
                }
                
                return book.availableCopies && book.availableCopies > 0
                  ? "bg-green-500 hover:scale-105 hover:shadow-md"
                  : "bg-red-500 hover:scale-105 hover:shadow-md"
              } else {
                // Check if this journal was arranged by AI (journals can also be arranged)
                const isAiArranged = aiArrangedBooks.includes(journal!.id)
                if (isAiArranged) {
                  return "bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-purple-400 shadow-lg hover:scale-105 hover:shadow-md animate-pulse"
                }
                return "bg-blue-500 hover:scale-105 hover:shadow-md" // Journals
              }
            }
            return "bg-gray-200 hover:bg-gray-300"
          }

          return (
            <div
              key={i}
              data-book-id={book?.id || ""}
              title={
                item
                  ? `${item.title} (${journal ? "Журнал" : "Книга"})${book?.authors ? ` - ${book.authors}` : ""}`
                  : "Пустое место"
              }
              className={`w-6 h-8 rounded transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5 active:scale-95 ${getBackground()}`}
              style={{
                cursor: item && !isEditMode ? (isDraggingItem ? 'grabbing' : 'grab') : 'pointer'
              }}
              draggable={item && !isEditMode}
              onDragStart={(e) => {
                if (item && !isEditMode && onItemDragStart) {
                  onItemDragStart(item, !!journal, shelf.id, i, e)
                  // Add visual feedback
                  e.currentTarget.style.opacity = '0.5'
                }
              }}
              onDragEnd={(e) => {
                // Reset visual feedback
                e.currentTarget.style.opacity = '1'
                if (onItemDragEnd) {
                  onItemDragEnd()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (onSlotDragOver) {
                  onSlotDragOver(shelf.id, i, e)
                }
              }}
              onDragLeave={() => {
                if (onSlotDragLeave) {
                  onSlotDragLeave()
                }
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (onItemDrop) {
                  onItemDrop(shelf.id, i, e)
                }
              }}
              onClick={(e) => {
                // Only handle click if not in middle of dragging
                if (!isDraggingItem) {
                  if (item) {
                    onItemClick(item, !!journal, shelf.id, i)
                  } else {
                    onEmptySlotClick(shelf.id, i)
                  }
                }
                e.stopPropagation()
              }}
            ></div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="relative h-[600px] overflow-x-auto overflow-y-hidden rounded-xl border border-gray-100">
      {/* Navigation controls */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          className="bg-blue-500 hover:bg-blue-700 text-white"
          onClick={handleZoomIn}
          title="Увеличить"
        >
          <ZoomIn size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="bg-blue-500 hover:bg-blue-700 text-white"
          onClick={handleZoomOut}
          title="Уменьшить"
        >
          <ZoomOut size={18} />
        </Button>
        <div className="h-px bg-gray-200 my-1"></div>
        <Button
          variant="ghost"
          size="icon"
          className="bg-blue-500 hover:bg-blue-700 text-white"
          onClick={() => handleMove("up")}
          title="Вверх"
        >
          <ArrowUp size={18} />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-blue-500 hover:bg-blue-700 text-white"
            onClick={() => handleMove("left")}
            title="Влево"
          >
            <ArrowLeft size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-blue-500 hover:bg-blue-700 text-white"
            onClick={() => handleMove("right")}
            title="Вправо"
          >
            <ArrowRight size={18} />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="bg-blue-500 hover:bg-blue-700 text-white"
          onClick={() => handleMove("down")}
          title="Вниз"
        >
          <ArrowDown size={18} />
        </Button>
        <div className="h-px bg-gray-200 my-1"></div>
        <Button
          variant="ghost"
          size="icon"
          className="bg-blue-500 hover:bg-blue-700 text-white"
          onClick={handleResetView}
          title="Сбросить вид"
        >
          <Maximize2 size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="bg-blue-500 hover:bg-blue-700 text-white"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </Button>
      </div>

      {/* Canvas area */}
      <div
        ref={canvasRef}
        id="shelf-editor"
        className="relative w-full h-full bg-gray-100 cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={(e) => {
          handleCanvasMouseMove(e)
          if (!isDragging) onDragMove(e)
        }}
        onMouseUp={() => {
          handleCanvasMouseUp()
          onDragEnd()
          // Reset item drag state if dragging was in progress
          if (isDraggingItem && onSlotDragLeave) {
            onSlotDragLeave()
          }
        }}
        onMouseLeave={() => {
          handleCanvasMouseUp()
          onDragEnd()
          // Reset item drag state if dragging was in progress
          if (isDraggingItem && onSlotDragLeave) {
            onSlotDragLeave()
          }
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full"
            />
          </div>
        ) : (
          <motion.div
            className="absolute origin-top-left"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              width: canvasSize.width,
              height: canvasSize.height,
            }}
          >
            {/* Grid background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(107, 114, 128, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(107, 114, 128, 0.1) 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }}
            ></div>

            {/* Shelves */}
            {shelves.map((shelf) => {
              const { width, height } = getShelfSize(shelf.capacity);
              return (
                <motion.div
                  key={shelf.id}
                  id={`shelf-${shelf.id}`}
                  className={`bg-white rounded-xl p-4 shadow-lg border border-gray-100 absolute ${overlappingShelfIds.includes(shelf.id) ? 'border-4 border-red-500 animate-pulse' : ''}`}
                  style={{
                    left: shelf.posX,
                    top: shelf.posY,
                    width: width,
                    height: height,
                    transition: "all 0.2s ease",
                    zIndex: 10,
                  }}
                  whileHover={{
                    boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)",
                    scale: 1.02,
                  }}
                  onMouseDown={(e) => isEditMode && onDragStart(e, shelf)}
                >
                  <div className="shelf-container">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-800">{shelf.category}</span>
                      <span className="bg-blue-100 px-2 py-1 rounded-lg text-xs text-blue-800">
                        #{shelf.shelfNumber}
                      </span>
                    </div>

                    {renderShelfContent(shelf)}

                    <div className="mt-3 flex space-x-2">
                      <motion.button
                        onClick={() => onShelfEdit(shelf)}
                        className="bg-yellow-400 hover:bg-yellow-600 text-gray-800 rounded-lg shadow-sm hover:shadow-md px-2 py-1 text-xs flex items-center gap-1"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Изменить
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          if (confirm("Вы уверены, что хотите удалить эту полку?")) onShelfDelete(shelf.id)
                        }}
                        className="bg-red-500 hover:bg-red-700 text-white rounded-lg shadow-sm hover:shadow-md px-2 py-1 text-xs flex items-center gap-1"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Удалить
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Help text */}
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-200 shadow-md">
          <p>Используйте Alt + перетаскивание для навигации по холсту</p>
          <p>Используйте кнопки справа для масштабирования и перемещения</p>
          <p>Удерживайте и перетаскивайте книги/журналы для перемещения между местами</p>
          <p>При перемещении на занятое место элементы поменяются местами</p>
        </div>
      </div>
    </div>
  )
}

export default ShelfCanvas
