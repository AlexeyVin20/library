"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, BookOpen, Filter, SortAsc, SortDesc, X, Check, BookCopy } from "lucide-react"
import type { Book, Journal } from "@/lib/types"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BookSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  books: Book[]
  journals: Journal[]
  onSelect: (itemId: string, isJournal: boolean) => void
  shelfCategory?: string
}

type SortField = "title" | "authors" | "publisher" | "publicationYear"
type SortOrder = "asc" | "desc"

const BookSelectorModal = ({
  open,
  onOpenChange,
  books,
  journals,
  onSelect,
  shelfCategory,
}: BookSelectorModalProps) => {
  const [activeTab, setActiveTab] = useState("books")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [filteredJournals, setFilteredJournals] = useState<Journal[]>([])
  const [sortField, setSortField] = useState<SortField>("title")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [filters, setFilters] = useState({
    available: false,
    genre: "",
    year: "",
  })
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<string[]>([])

  // Extract unique genres and years for filtering
  const bookGenres: string[] = [...new Set(books.map((book) => book.genre).filter((g): g is string => Boolean(g)))]
  const bookYears: string[] = [...new Set(books.map((book) => book.publicationYear?.toString()).filter((y): y is string => Boolean(y)))].sort(
    (a, b) => Number(b) - Number(a),
  )

  // Filter and sort books
  useEffect(() => {
    let filtered = [...books]

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (book.authors && book.authors.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (book.isbn && book.isbn.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply filters
    if (filters.available) {
      filtered = filtered.filter((book) => book.availableCopies && book.availableCopies > 0)
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter((book) => book.genre && selectedGenres.includes(book.genre as string))
    }

    if (selectedYears.length > 0) {
      filtered = filtered.filter(
        (book) => book.publicationYear && selectedYears.includes(book.publicationYear.toString()),
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let fieldA: any = (a as any)[sortField]
      let fieldB: any = (b as any)[sortField]

      // Handle undefined values
      if (fieldA === undefined) fieldA = ""
      if (fieldB === undefined) fieldB = ""

      // Compare
      if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1
      if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredBooks(filtered)
  }, [books, searchTerm, sortField, sortOrder, filters, selectedGenres, selectedYears])

  // Filter and sort journals
  useEffect(() => {
    let filtered = [...journals]

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (journal) =>
          journal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (journal.publisher && journal.publisher.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (journal.issn && journal.issn.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let fieldA: any = (a as any)[sortField === "authors" ? "publisher" : sortField]
      let fieldB: any = (b as any)[sortField === "authors" ? "publisher" : sortField]

      // Handle undefined values
      if (fieldA === undefined) fieldA = ""
      if (fieldB === undefined) fieldB = ""

      // Compare
      if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1
      if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredJournals(filtered)
  }, [journals, searchTerm, sortField, sortOrder])

  // Toggle genre filter
  const toggleGenreFilter = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]))
  }

  // Toggle year filter
  const toggleYearFilter = (year: string) => {
    setSelectedYears((prev) => (prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]))
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({ available: false, genre: "", year: "" })
    setSelectedGenres([])
    setSelectedYears([])
    setSearchTerm("")
    setSortField("title")
    setSortOrder("asc")
  }

  // Handle close
  const handleClose = () => {
    onOpenChange(false)
    resetFilters()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-gray-200 border border-gray-100 rounded-2xl shadow-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookCopy className="h-6 w-6 text-blue-500" />
            Выберите элемент для добавления на полку
            {shelfCategory && (
              <Badge variant="outline" className="ml-2 bg-blue-300 text-blue-700 border-blue-500">
                {shelfCategory}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4">
          <Tabs defaultValue="books" onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <TabsList className="bg-gray-100 rounded-lg">
                <TabsTrigger value="books" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-800 rounded-lg">
                  Книги
                </TabsTrigger>
                <TabsTrigger value="journals" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-800 rounded-lg">
                  Журналы
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск..."
                    className="pl-10 bg-gray-100 border-gray-200 text-gray-800 placeholder:text-gray-500 rounded-lg"
                  />
                  {searchTerm && (
                    <button
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-800"
                      onClick={() => setSearchTerm("")}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Sort dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-white border-blue-500 text-blue-500 rounded-lg hover:bg-gray-100">
                      {sortOrder === "asc" ? <SortAsc size={18} /> : <SortDesc size={18} />}
                      <span className="ml-2 hidden sm:inline">Сортировка</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-gray-200 text-gray-800 rounded-lg">
                    <DropdownMenuLabel>Сортировать по</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-200" />
                    <DropdownMenuItem
                      className={sortField === "title" ? "bg-blue-100" : ""}
                      onClick={() => setSortField("title")}
                    >
                      <Check className={`mr-2 h-4 w-4 ${sortField === "title" ? "opacity-100" : "opacity-0"}`} />
                      Названию
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={sortField === "authors" ? "bg-blue-100" : ""}
                      onClick={() => setSortField("authors")}
                    >
                      <Check className={`mr-2 h-4 w-4 ${sortField === "authors" ? "opacity-100" : "opacity-0"}`} />
                      {activeTab === "books" ? "Автору" : "Издателю"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={sortField === "publicationYear" ? "bg-blue-100" : ""}
                      onClick={() => setSortField("publicationYear")}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${sortField === "publicationYear" ? "opacity-100" : "opacity-0"}`}
                      />
                      Году издания
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200" />
                    <DropdownMenuItem onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                      {sortOrder === "asc" ? "По возрастанию" : "По убыванию"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Filter dropdown - only for books tab */}
                {activeTab === "books" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className={`bg-blue-500 border-blue-500 text-white rounded-lg hover:bg-blue-700 ${
                          filters.available || selectedGenres.length > 0 || selectedYears.length > 0
                            ? "ring-2 ring-blue-300"
                            : ""
                        }`}
                      >
                        <Filter size={18} />
                        <span className="ml-2 hidden sm:inline">Фильтры</span>
                        {(() => {
                          const activeFilters = (filters.available ? 1 : 0) + selectedGenres.length + selectedYears.length;
                          return activeFilters > 0 ? (
                            <Badge className="ml-2 bg-blue-300 text-blue-700">{activeFilters}</Badge>
                          ) : null;
                        })()}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white border-blue-500/50 text-gray-800 rounded-lg">
                      <DropdownMenuLabel>Фильтры</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/20" />
                      <DropdownMenuItem
                        className={filters.available ? "bg-emerald-600/50" : ""}
                        onClick={() => setFilters({ ...filters, available: !filters.available })}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 mr-2 border rounded flex items-center justify-center ${
                              filters.available ? "bg-emerald-500 border-emerald-500" : "border-white/50"
                            }`}
                          >
                            {filters.available && <Check className="h-3 w-3 text-white" />}
                          </div>
                          Только доступные
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/20" />
                      <DropdownMenuLabel>Жанры</DropdownMenuLabel>
                      <ScrollArea className="h-40">
                        {bookGenres.map((genre) => (
                          <DropdownMenuItem
                            key={genre}
                            className={selectedGenres.includes(genre as string) ? "bg-emerald-600/50" : ""}
                            onClick={() => toggleGenreFilter(genre as string)}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-4 h-4 mr-2 border rounded flex items-center justify-center ${
                                  selectedGenres.includes(genre as string)
                                    ? "bg-emerald-500 border-emerald-500"
                                    : "border-white/50"
                                }`}
                              >
                                {selectedGenres.includes(genre as string) && <Check className="h-3 w-3 text-white" />}
                              </div>
                              {genre as string}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </ScrollArea>
                      <DropdownMenuSeparator className="bg-white/20" />
                      <DropdownMenuLabel>Год издания</DropdownMenuLabel>
                      <ScrollArea className="h-40">
                        {bookYears.map((year) => (
                          <DropdownMenuItem
                            key={year}
                            className={selectedYears.includes(year) ? "bg-emerald-600/50" : ""}
                            onClick={() => toggleYearFilter(year)}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-4 h-4 mr-2 border rounded flex items-center justify-center ${
                                  selectedYears.includes(year) ? "bg-emerald-500 border-emerald-500" : "border-white/50"
                                }`}
                              >
                                {selectedYears.includes(year) && <Check className="h-3 w-3 text-white" />}
                              </div>
                              {year}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </ScrollArea>
                      <DropdownMenuSeparator className="bg-white/20" />
                      <DropdownMenuItem onClick={resetFilters}>Сбросить все фильтры</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <TabsContent value="books" className="mt-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
                {filteredBooks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <BookOpen className="h-16 w-16 mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Книги не найдены</p>
                    <p className="text-sm mt-2">Попробуйте изменить параметры поиска или фильтры</p>
                    {(searchTerm || filters.available || selectedGenres.length > 0 || selectedYears.length > 0) && (
                      <Button variant="outline" className="mt-4 text-blue-500 border-blue-500 rounded-lg hover:bg-gray-100" onClick={resetFilters}>
                        Сбросить все фильтры
                      </Button>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {filteredBooks.map((book) => (
                        <motion.div
                          key={book.id}
                          className="bg-white hover:bg-blue-300 border border-gray-200 rounded-xl overflow-hidden shadow transition-all cursor-pointer"
                          whileHover={{ y: -4, boxShadow: "0 4px 16px rgba(59,130,246,0.10)" }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelect(book.id, false)}
                        >
                          <div className="flex p-3">
                            <div className="w-16 h-24 bg-blue-300 rounded-md overflow-hidden flex-shrink-0 mr-3">
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
                                  <BookOpen className="h-8 w-8 text-blue-500/50" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-800 truncate" title={book.title}>
                                {book.title}
                              </h3>
                              <p className="text-sm text-gray-500 truncate" title={book.authors || ""}>
                                {book.authors || "Автор не указан"}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {book.genre && (
                                  <Badge className="bg-blue-300 text-blue-700 text-xs">{book.genre}</Badge>
                                )}
                                {book.publicationYear && (
                                  <Badge className="bg-blue-500 text-white text-xs">{book.publicationYear}</Badge>
                                )}
                                {book.categorization && (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">{book.categorization}</Badge>
                                )}
                                {book.availableCopies !== undefined && (
                                  <Badge className="bg-gray-100 text-gray-800 text-xs border border-gray-300">
                                    {book.availableCopies} экз.
                                  </Badge>
                                )}
                                {book.availableCopies && book.availableCopies > 0 ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs border-l-4 border-green-500">Доступна</Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 text-xs border-l-4 border-red-500">Недоступна</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent value="journals" className="mt-2">
              <div className="bg-blue-300 rounded-xl border border-blue-500/30 overflow-hidden">
                {filteredJournals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <BookOpen className="h-16 w-16 mb-4 text-blue-500/50" />
                    <p className="text-lg font-medium">Журналы не найдены</p>
                    <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
                    {searchTerm && (
                      <Button variant="outline" className="mt-4 text-blue-500 border-blue-500 rounded-lg hover:bg-gray-100" onClick={() => setSearchTerm("")}>
                        Сбросить поиск
                      </Button>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {filteredJournals.map((journal) => (
                        <motion.div
                          key={journal.id}
                          className="bg-white hover:bg-blue-300 border border-blue-500/30 rounded-xl overflow-hidden shadow transition-all cursor-pointer"
                          whileHover={{ y: -4, boxShadow: "0 4px 16px rgba(59,130,246,0.10)" }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelect(journal.id.toString(), true)}
                        >
                          <div className="flex p-3">
                            <div className="w-16 h-24 bg-blue-300 rounded-md overflow-hidden flex-shrink-0 mr-3">
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
                                  <BookOpen className="h-8 w-8 text-blue-500/50" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-800 truncate" title={journal.title}>
                                {journal.title}
                              </h3>
                              <p className="text-sm text-gray-500 truncate" title={journal.publisher || ""}>
                                {journal.publisher || "Издатель не указан"}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {journal.issn && (
                                  <Badge className="bg-blue-500 text-white text-xs">ISSN: {journal.issn}</Badge>
                                )}
                                {(journal.publicationDate || journal.publicationYear) && (
                                  <Badge className="bg-blue-700 text-white text-xs">
                                    {journal.publicationYear ?? (journal.publicationDate ? new Date(journal.publicationDate).getFullYear() : "")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="bg-gray-100 p-4 border-t border-gray-200 rounded-b-2xl">
          <div className="flex justify-between w-full items-center">
            <div className="text-gray-500 text-sm">
              {activeTab === "books"
                ? `Найдено книг: ${filteredBooks.length} из ${books.length}`
                : `Найдено журналов: ${filteredJournals.length} из ${journals.length}`}
            </div>
            <Button variant="outline" onClick={handleClose} className="text-blue-500 border-blue-500 rounded-lg hover:bg-gray-100">
              Закрыть
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BookSelectorModal
