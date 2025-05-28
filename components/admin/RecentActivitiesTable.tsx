"use client"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type Row,
  type HeaderGroup,
} from "@tanstack/react-table"
import { useState, useMemo, useEffect } from "react"
import { Cursor } from "@/components/ui/cursor";
import BookCover from "@/components/BookCover";

// Локальный компонент для статуса (аналогично app/admin/page.tsx)
const StatusBadge = ({ status }: { status: string }) => {
  let color = ""
  let label = ""

  if (status === "Выполнена") {
    color = "bg-emerald-500"
    label = "Выполнена"
  } else if (status === "Обрабатывается") {
    color = "bg-emerald-400"
    label = "В обработке"
  } else {
    color = "bg-gray-500"
    label = "Отменена"
  }

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-medium text-white rounded-full ${color} backdrop-blur-md shadow-sm`}
    >
      {label}
    </span>
  )
}

// Локальная функция форматирования даты (аналогично app/admin/journals/page.tsx)
const formatDate = (dateString: string) => {
  try {
    if (!dateString) {
      return "Дата не указана"
    }
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Некорректная дата"
    }
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  } catch (error) {
    return "Ошибка в дате"
  }
}

export interface RecentActivity {
  id: string
  user?: { fullName?: string }
  book?: { 
    id?: string;
    title?: string;
    cover?: string;
  }
  reservationDate: string
  status: string
}

export function RecentActivitiesTable({ data }: { data: RecentActivity[] }) {
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState<any[]>([])
  const [hoveredCover, setHoveredCover] = useState<string | null>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const [bookCoversCache, setBookCoversCache] = useState<Record<string, string | null>>({})
  const [loadingCover, setLoadingCover] = useState<string | null>(null)
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null)
  const [cursorVisible, setCursorVisible] = useState(false)

  // Эффект для очистки состояния при размонтировании компонента
  useEffect(() => {
    return () => {
      // Очистка состояний при размонтировании
      setHoveredCover(null)
      setCursorPos(null)
      setHoveredBookId(null)
      setCursorVisible(false)
    };
  }, []);

  // Функция для поиска по всем полям
  function fuzzyFilter(row: Row<RecentActivity>, columnId: string, value: string) {
    // Склеиваем все значения в строке в одну строку
    const rowString = Object.values(row.original)
      .map((v) => {
        if (typeof v === "object" && v !== null) {
          // Например, user: { fullName }
          return Object.values(v).join(" ")
        }
        return String(v ?? "")
      })
      .join(" ")
      .toLowerCase()
    return rowString.includes(value.toLowerCase())
  }

  const columns = useMemo<ColumnDef<RecentActivity, any>[]>(
    () => [
      {
        accessorKey: "action",
        header: "Действие",
        cell: () => "Резервирование",
      },
      {
        accessorKey: "user",
        header: "Пользователь",
        cell: (info: any) => info.row.original.user?.fullName || "Неизвестный пользователь",
      },
      {
        accessorKey: "book",
        header: "Книга",
        cell: (info: any) => {
          const book = info.row.original.book
          const title = book?.title || "Неизвестная книга"
          const bookId = book?.id
          
          const handleMouseEnter = async (event: React.MouseEvent) => {
            const reservationId = info.row.original.id
            if (!reservationId) return
          
            setHoveredBookId(reservationId)
            setCursorPos({ x: event.clientX, y: event.clientY })
            setCursorVisible(true)
          
            // Проверяем кэш по reservationId
            if (bookCoversCache[reservationId]) {
              setHoveredCover(bookCoversCache[reservationId])
              return
            }
          
            // Если уже грузится
            if (loadingCover === reservationId) return
          
            setLoadingCover(reservationId)
            setHoveredCover(null)
          
            try {
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
              
              // Сначала получаем данные резервирования
              const reservationResponse = await fetch(`${baseUrl}/api/Reservation/${reservationId}`)
              
              if (!reservationResponse.ok) {
                console.error(`Ошибка получения резервирования: ${reservationResponse.status} ${reservationResponse.statusText}`)
                setBookCoversCache(prev => ({ ...prev, [reservationId]: null }))
                return
              }
          
              const reservationData = await reservationResponse.json()
              
              const bookId = reservationData.bookId
              if (!bookId) {
                console.error("BookId не найден в резервировании")
                setBookCoversCache(prev => ({ ...prev, [reservationId]: null }))
                return
              }
          
              // Теперь получаем данные книги по bookId
              const bookResponse = await fetch(`${baseUrl}/api/books/${bookId}`)
              
              if (bookResponse.ok) {
                const bookData = await bookResponse.json()
                
                if (bookData) {
                  const coverUrl = 
                    bookData.cover ||
                    bookData.coverImage ||
                    bookData.coverImageUrl ||
                    bookData.image ||
                    bookData.coverUrl ||
                    bookData.imageUrl ||
                    "";
          
                  if (coverUrl) {
                    setBookCoversCache(prev => ({ ...prev, [reservationId]: coverUrl }))
                    setHoveredCover(coverUrl)
                  } else {
                    setBookCoversCache(prev => ({ ...prev, [reservationId]: null }))
                  }
                } else {
                  setBookCoversCache(prev => ({ ...prev, [reservationId]: null }))
                }
              } else {
                console.error(`Ошибка получения книги: ${bookResponse.status} ${bookResponse.statusText}`)
                setBookCoversCache(prev => ({ ...prev, [reservationId]: null }))
              }
            } catch (error) {
              console.error("Ошибка загрузки обложки:", error)
              setBookCoversCache(prev => ({ ...prev, [reservationId]: null }))
            } finally {
              setLoadingCover(null)
            }
          }
          
          const handleMouseMove = (event: React.MouseEvent) => {
            const reservationId = info.row.original.id
            if (reservationId && hoveredBookId === reservationId) {
              const newPos = { x: event.clientX, y: event.clientY };
              setCursorPos(newPos);
            }
          }
          
          const handleMouseLeave = () => {
            setHoveredCover(null)
            setHoveredBookId(null)
            setCursorPos(null)
            setCursorVisible(false)
          }
          
          return (
            <span
              style={{ position: "relative" }}
              onMouseEnter={handleMouseEnter}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative hover:underline cursor-none"
            >
              <a href={`/admin/books/${info.row.original.bookId}`}>{book?.title}</a>
            </span>
          )
        },
      },
      {
        accessorKey: "reservationDate",
        header: "Дата",
        cell: (info: any) => formatDate(info.getValue()),
      },
      {
        accessorKey: "status",
        header: "Статус",
        cell: (info: any) => <StatusBadge status={info.getValue()} />,
      },
      {
        id: "details",
        header: "",
        cell: (info: any) => (
          <button
            className="text-white hover:underline"
            onClick={() => (window.location.href = `/admin/reservations/${info.row.original.id}`)}
          >
            Подробнее
          </button>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: fuzzyFilter,
  })

  console.log('Table: Rendering, cursorPos:', cursorPos, 'hoveredBookId:', hoveredBookId, 'hoveredCover:', hoveredCover);
  return (
    <div className="p-2">
      {/* Кастомный курсор с обложкой */}
      {cursorPos && hoveredBookId && cursorVisible && (
        <Cursor
          className="pointer-events-none"
          springConfig={{ stiffness: 300, damping: 30 }}
          attachToParent={false}
          x={cursorPos.x - 100}
          y={cursorPos.y - 400}
          variants={{
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
          }}
          transition={{ duration: 0.15 }}
        >
          <div style={{ width: 120, height: 180, pointerEvents: "none", display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translate(-50%, -50%)' }}>
            {loadingCover === hoveredBookId && (
              <div className="animate-pulse text-white text-xs">Загрузка...</div>
            )}
            {hoveredCover && (
              <img
                src={hoveredCover}
                alt="Обложка книги"
                style={{
                  width: 120,
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 8,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.18)"
                }}
              />
            )}
          </div>
        </Cursor>
      )}
      <input
        value={globalFilter ?? ""}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Поиск..."
        className="mb-2 px-3 py-2 rounded w-full bg-emerald-600/30 text-white placeholder-white/70 border border-emerald-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400 outline-none transition"
      />
      <div className="overflow-x-auto rounded-xl border border-white/30 dark:border-gray-700/30 bg-white/10 dark:bg-gray-900/30">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-emerald-50/80 dark:bg-emerald-900/30 backdrop-blur-md">
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<RecentActivity>) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-semibold text-white uppercase tracking-wider cursor-pointer select-none bg-emerald-700/60"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? ' ▲' : header.column.getIsSorted() === 'desc' ? ' ▼' : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row: Row<RecentActivity>) => (
              <tr
                key={row.id}
                className="border-b border-white/20 dark:border-gray-700/30 hover:bg-emerald-100/40 dark:hover:bg-emerald-900/20"
              >
                {row.getVisibleCells().map((cell: any) => (
                  <td key={cell.id} className="px-4 py-3 bg-emerald-600/40 text-white">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.getRowModel().rows.length === 0 && (
          <div className="p-4 text-center text-gray-500">Нет данных</div>
        )}
      </div>
    </div>
  );
} 