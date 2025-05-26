"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  BookOpen,
  Search,
  FileText,
  BookmarkIcon,
  LayoutGrid,
  BookCopy,
  X,
  Upload,
  Download,
  Plus,
  Camera,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { bookSchema } from "@/lib/validations"
import type { BookInput } from "@/lib/admin/actions/book"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Book, Journal } from "@/lib/types"

interface Position {
  x: number
  y: number
}

// Компонент для анимированного появления
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5,
}: {
  children: React.ReactNode
  delay?: number
  duration?: number
}) => {
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

// Компонент для вкладок
const AnimatedTabsTrigger = ({
  value,
  icon,
  label,
  isActive,
}: {
  value: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}) => {
  return (
    <TabsTrigger value={value} className="relative data-[state=active]:bg-transparent">
      <div className="flex items-center gap-2 py-2 px-3">
        <span className={isActive ? "text-white" : "text-white"}>
          {icon}
        </span>
        <span className={isActive ? "text-white" : "text-white"}>
          {label}
        </span>
      </div>
      {isActive && (
        <motion.div
          layoutId="activeBookFormTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </TabsTrigger>
  )
}

// Компонент для группы полей формы
const FormSection = ({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) => {
  return (
    <div className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 rounded-xl p-5 border border-emerald-500/20 dark:border-emerald-700/40 shadow-sm">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// Компонент для поля формы
const FormField = ({
  label,
  error,
  required = false,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3 text-red-500" />
          <p className="text-red-500 text-xs">{error}</p>
        </div>
      )}
    </div>
  )
}

interface BookFormProps {
  initialData?: Partial<BookInput>
  onSubmit: (data: BookInput) => Promise<void>
  isSubmitting: boolean
  mode: "create" | "update"
}

const BookForm = ({ initialData, onSubmit, isSubmitting, mode }: BookFormProps) => {
  const router = useRouter()
  const [showManualCoverInput, setShowManualCoverInput] = useState(false)
  const [manualCoverUrl, setManualCoverUrl] = useState("")
  const [isbn, setIsbn] = useState(initialData?.isbn || "")
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic-info")
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.cover || null)
  const [geminiImage, setGeminiImage] = useState<string | null>(null)
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    trigger,
    reset,
  } = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: initialData?.title || "",
      authors: initialData?.authors || "",
      isbn: initialData?.isbn || "",
      genre: initialData?.genre || "",
      cover: initialData?.cover || "",
      description: initialData?.description || "",
      publicationYear: initialData?.publicationYear || new Date().getFullYear(),
      publisher: initialData?.publisher || "",
      pageCount: initialData?.pageCount || 0,
      language: initialData?.language || "",
      categorization: initialData?.categorization || "",
      udk: initialData?.udk || "",
      bbk: initialData?.bbk || "",
      summary: initialData?.summary || "",
      availableCopies: initialData?.availableCopies || 1,
      edition: initialData?.edition || "",
      price: initialData?.price || 0,
      format: initialData?.format || "",
      originalTitle: initialData?.originalTitle || "",
      originalLanguage: initialData?.originalLanguage || "",
      isEbook: initialData?.isEbook || false,
      condition: initialData?.condition || "",
    },
    mode: "onChange",
  })

  const isEbook = watch("isEbook")
  const formValues = watch()

  useEffect(() => {
    if (initialData) {
      setIsbn(initialData.isbn || "")
      if (initialData?.cover) setPreviewUrl(initialData.cover)
    }
  }, [initialData])

  useEffect(() => {
    if (geminiImage) handleGeminiUpload()
  }, [geminiImage])

  // Очистка сообщений об ошибках и успехе через 5 секунд
  useEffect(() => {
    if (formError) {
      const timer = setTimeout(() => setFormError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [formError])

  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => setFormSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [formSuccess])

  const handleFetchByISBN = async () => {
    if (!isbn) {
      setFormError("Введите ISBN для поиска")
      toast({ title: "Ошибка", description: "Введите ISBN для поиска", variant: "destructive" })
      return
    }

    setIsSearchLoading(true)
    setFormError(null)

    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
      )

      if (!res.ok) {
        throw new Error(`Ошибка API: ${res.status}`)
      }

      const data = await res.json()

      if (data.totalItems > 0) {
        const bookData = data.items[0].volumeInfo
        setValue("title", bookData.title || "")
        setValue("description", bookData.description || "")
        setValue("cover", bookData.imageLinks?.thumbnail || "")
        setValue("isbn", isbn)
        setValue("publisher", bookData.publisher || "")
        setValue("pageCount", bookData.pageCount || 0)
        setValue("language", bookData.language || "")
        setValue(
          "publicationYear",
          bookData.publishedDate ? Number.parseInt(bookData.publishedDate.substring(0, 4)) : new Date().getFullYear(),
        )
        if (bookData.authors && bookData.authors.length > 0) setValue("authors", bookData.authors.join(", "))
        if (bookData.imageLinks?.thumbnail) setPreviewUrl(bookData.imageLinks.thumbnail)

        setFormSuccess("Информация о книге успешно заполнена")
        toast({ title: "Данные получены", description: "Информация о книге успешно заполнена" })

        // Проверяем валидность полей после заполнения
        await trigger([
          "title",
          "authors",
          "isbn",
          "description",
          "publicationYear",
          "publisher",
          "pageCount",
          "language",
        ])
      } else {
        setValue("isbn", isbn)
        setFormError("Книга не найдена. Проверьте правильность ISBN.")
        toast({
          title: "Книга не найдена",
          description: "Проверьте правильность ISBN.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Ошибка при поиске по ISBN:", error)
      setValue("isbn", isbn)
      setFormError("Ошибка при поиске по ISBN. Пожалуйста, попробуйте позже.")
      toast({
        title: "Ошибка",
        description: "Ошибка при поиске по ISBN.",
        variant: "destructive",
      })
    } finally {
      setIsSearchLoading(false)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Проверка размера файла (не более 5 МБ)
      if (file.size > 5 * 1024 * 1024) {
        setFormError("Размер файла не должен превышать 5 МБ")
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 5 МБ",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setPreviewUrl(event.target.result)
          setValue("cover", event.target.result)
          setFormSuccess("Обложка книги успешно загружена")
        }
      }
      reader.onerror = () => {
        setFormError("Ошибка при чтении файла")
        toast({
          title: "Ошибка",
          description: "Не удалось прочитать файл",
          variant: "destructive",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveCover = () => {
    setPreviewUrl(null)
    setValue("cover", "")
    setFormSuccess("Обложка книги удалена")
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64String = reader.result.split(",")[1]
          resolve(base64String)
        } else {
          reject(new Error("Не удалось преобразовать файл в base64"))
        }
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const GeminiFileUpload = ({
    onFileChange,
  }: {
    onFileChange: (base64: string) => void
  }) => {
    const [fileName, setFileName] = useState("")
    const [dragActive, setDragActive] = useState(false)

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setFileName(file.name)
        if (file.size > 10 * 1024 * 1024) {
          setFormError("Размер файла не должен превышать 10 МБ")
          toast({
            title: "Ошибка",
            description: "Размер файла не должен превышать 10 МБ",
            variant: "destructive",
          })
          return
        }
        try {
          const base64 = await fileToBase64(file)
          onFileChange(base64)
        } catch (error) {
          setFormError("Ошибка при обработке файла")
          toast({
            title: "Ошибка",
            description: "Не удалось обработать файл",
            variant: "destructive",
          })
        }
      }
    }

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true)
      } else if (e.type === "dragleave") {
        setDragActive(false)
      }
    }

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        setFileName(file.name)
        if (file.size > 10 * 1024 * 1024) {
          setFormError("Размер файла не должен превышать 10 МБ")
          return
        }
        try {
          const base64 = await fileToBase64(file)
          onFileChange(base64)
        } catch (error) {
          setFormError("Ошибка при обработке файла")
        }
      }
    }

    return (
      <motion.div
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer backdrop-blur-xl transition-all ${
          dragActive
            ? "bg-emerald-500/20 border-emerald-500/50 dark:bg-emerald-500/40 dark:border-emerald-500/50"
            : "bg-emerald-500/5 dark:bg-emerald-900/10 border-emerald-500/40 dark:border-emerald-700/40 hover:bg-emerald-500/10 dark:hover:bg-emerald-900/20"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input type="file" className="hidden" accept="image/*" onChange={handleChange} id="gemini-file-input" />
        <label
          htmlFor="gemini-file-input"
          className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
        >
          <Camera className="w-10 h-10 mb-2 text-white" />
          <p className="mb-2 text-sm text-center text-white">
            Перетащите файл сюда или нажмите для загрузки
          </p>
          {fileName && <p className="text-xs text-white">{fileName}</p>}
        </label>
      </motion.div>
    )
  }

  const handleGeminiFileChange = (base64: string) => {
    setGeminiImage(base64)
    setFormSuccess("Изображение загружено и отправлено на обработку")
  }

  const handleGeminiUpload = async () => {
    if (!geminiImage) return

    setGeminiLoading(true)
    setFormError(null)

    try {
      const endpoint = "https://openrouter.ai/api/v1/chat/completions"
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY

      if (!apiKey) {
        throw new Error("API ключ не настроен")
      }

      const requestBody = {
        model: "google/gemini-2.0-flash-exp:free",
        webSearch: true,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Отвечать пользователю по-русски. Отвечать в формате json без вступлений и заключений. Задача- заполнять поля у книг. Модель книги содержит следующие поля: id(Guid), title(строка 255), authors(строка 500), isbn(строка), genre(строка 100), categorization(строка 100), udk(строка), bbk(строка 20), cover всегда оставляй null, description(строка), publicationYear(число), publisher(строка 100), pageCount(число), language(строка 50), availableCopies(число), dateAdded(дата), dateModified(дата), edition(строка 50), price(decimal), format(строка 100), originalTitle(строка 255), originalLanguage(строка 50), isEbook(boolean), condition(строка 100), shelfId(число) - shelfId всегда оставляй null. Если информации нет, оставь null, цену ставь = 0. Ищи в интернете жанры книги по названию и автору, и заполняй резюме книги(summary). Не путай резюме(summary) и описание(description), которое написано в фото.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${geminiImage}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
        },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const data = await res.json()
      const responseText = data?.choices?.[0]?.message?.content

      if (!responseText) {
        throw new Error("Пустой ответ от API")
      }

      let jsonString = responseText.trim()
      if (jsonString.startsWith("```json")) jsonString = jsonString.slice(7).trim()
      if (jsonString.endsWith("```")) jsonString = jsonString.slice(0, -3).trim()

      const parsedData = JSON.parse(jsonString)

      // Поиск обложки книги
      const coverUrl = await findBookCover(parsedData)

      // Заполнение полей формы данными из API
      fillFormWithApiData(parsedData, coverUrl)

      setFormSuccess("Данные книги успешно получены из изображения")
      toast({
        title: "Данные получены",
        description: "Информация о книге успешно извлечена из изображения",
      })

      // Проверяем валидность полей после заполнения
      await trigger()
    } catch (error) {
      console.error("Ошибка при обработке изображения:", error)
      setFormError("Ошибка при обработке изображения. Пожалуйста, попробуйте еще раз.")
      toast({
        title: "Ошибка",
        description: "Ошибка при вызове Gemini API.",
        variant: "destructive",
      })
    } finally {
      setGeminiLoading(false)
      setGeminiImage(null)
    }
  }

  // Функция для поиска обложки книги
  const findBookCover = async (bookData: any): Promise<string | null> => {
    let coverUrl = null

    // Поиск по ISBN
    if (bookData.isbn) {
      try {
        const coverRes = await fetch(`https://bookcover.longitood.com/bookcover/${bookData.isbn}`)
        if (coverRes.ok) {
          const coverData = await coverRes.json()
          if (coverData.url) coverUrl = coverData.url
        }
      } catch (error) {
        console.error("Ошибка при поиске обложки по ISBN:", error)
      }
    }

    // Поиск по названию и автору
    if (!coverUrl && bookData.title && bookData.authors) {
      try {
        const coverRes = await fetch(
          `https://bookcover.longitood.com/bookcover?book_title=${encodeURIComponent(
            bookData.title,
          )}&author_name=${encodeURIComponent(bookData.authors)}`,
        )
        if (coverRes.ok) {
          const coverData = await coverRes.json()
          if (coverData.url) coverUrl = coverData.url
        }
      } catch (error) {
        console.error("Ошибка при поиске обложки по названию и автору:", error)
      }
    }

    // Поиск через Google Books API
    if (!coverUrl && (bookData.isbn || (bookData.title && bookData.authors))) {
      try {
        const query = bookData.isbn ? `isbn:${bookData.isbn}` : `intitle:${bookData.title} inauthor:${bookData.authors}`
        const googleBooksRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`,
        )
        if (googleBooksRes.ok) {
          const booksData = await googleBooksRes.json()
          if (booksData.items && booksData.items.length > 0 && booksData.items[0].volumeInfo?.imageLinks) {
            coverUrl =
              booksData.items[0].volumeInfo.imageLinks.large ||
              booksData.items[0].volumeInfo.imageLinks.medium ||
              booksData.items[0].volumeInfo.imageLinks.thumbnail
          }
        }
      } catch (error) {
        console.error("Ошибка при поиске обложки через Google Books API:", error)
      }
    }

    // Если обложка не найдена, открываем поиск в Google
    if (!coverUrl && formValues.title) {
      const query = encodeURIComponent(formValues.title + " книга обложка")
      const searchUrl = `https://cse.google.com/cse?cx=b421413d1a0984f58#gsc.tab=0&gsc.q=${query}`
      window.open(searchUrl, "_blank")
      setShowManualCoverInput(true)
      toast({
        title: "Обложка не найдена",
        description: "Поиск открыт в новой вкладке. Вставьте ссылку на обложку.",
        variant: "destructive",
      })
    }

    return coverUrl
  }

  // Функция для заполнения формы данными из API
  const fillFormWithApiData = (data: any, coverUrl: string | null) => {
    if (data.title) setValue("title", data.title)
    if (data.authors) setValue("authors", data.authors)
    if (data.genre) setValue("genre", data.genre)
    if (data.categorization) setValue("categorization", data.categorization)
    if (data.udk) setValue("udk", data.udk)
    if (data.bbk) setValue("bbk", data.bbk)
    if (data.isbn) {
      setValue("isbn", data.isbn)
      setIsbn(data.isbn)
    }
    if (coverUrl) {
      setValue("cover", coverUrl)
      setPreviewUrl(coverUrl)
    }
    if (data.description) setValue("description", data.description)
    if (data.summary) setValue("summary", data.summary)
    if (data.publicationYear) setValue("publicationYear", data.publicationYear)
    if (data.publisher) setValue("publisher", data.publisher)
    if (data.pageCount) setValue("pageCount", data.pageCount)
    if (data.language) setValue("language", data.language)
    if (data.availableCopies) setValue("availableCopies", data.availableCopies)
    if (data.edition) setValue("edition", data.edition)
    if (data.price) setValue("price", data.price)
    if (data.format) setValue("format", data.format)
    if (data.originalTitle) setValue("originalTitle", data.originalTitle)
    if (data.originalLanguage) setValue("originalLanguage", data.originalLanguage)
    if (data.isEbook !== undefined) setValue("isEbook", data.isEbook)
    if (data.condition) setValue("condition", data.condition)
  }

  const fillFormFromJson = (data: any) => {
    try {
      if (data.Title) setValue("title", data.Title)
      if (data.Authors) setValue("authors", data.Authors)
      if (data.Genre) setValue("genre", data.Genre)
      if (data.Categorization) setValue("categorization", data.Categorization)
      if (data.UDK) setValue("udk", data.UDK)
      if (data.BBK) setValue("bbk", data.BBK)
      if (data.ISBN) {
        setValue("isbn", data.ISBN)
        setIsbn(data.ISBN)
      }
      if (data.Cover) {
        setValue("cover", data.Cover)
        setPreviewUrl(data.Cover)
      }
      if (data.Description) setValue("description", data.Description)
      if (data.Summary) setValue("summary", data.Summary)
      if (data.PublicationYear) setValue("publicationYear", data.PublicationYear)
      if (data.Publisher) setValue("publisher", data.Publisher)
      if (data.PageCount) setValue("pageCount", data.PageCount)
      if (data.Language) setValue("language", data.Language)
      if (data.AvailableCopies !== undefined) setValue("availableCopies", data.AvailableCopies)
      if (data.Edition) setValue("edition", data.Edition)
      if (data.Price !== undefined) setValue("price", data.Price)
      if (data.Format) setValue("format", data.Format)
      if (data.OriginalTitle) setValue("originalTitle", data.OriginalTitle)
      if (data.OriginalLanguage) setValue("originalLanguage", data.OriginalLanguage)
      if (data.IsEbook !== undefined) setValue("isEbook", data.IsEbook)
      if (data.Condition) setValue("condition", data.Condition)

      setFormSuccess("Информация из JSON успешно импортирована")
      toast({
        title: "Данные загружены",
        description: "Информация из JSON успешно импортирована",
      })

      // Проверяем валидность полей после заполнения
      trigger()
    } catch (error) {
      console.error("Ошибка при заполнении формы из JSON:", error)
      setFormError("Ошибка при импорте данных из JSON")
      toast({
        title: "Ошибка",
        description: "Не удалось импортировать данные из JSON",
        variant: "destructive",
      })
    }
  }



  


  const onFormSubmit = async (values: z.infer<typeof bookSchema>) => {
    setFormError(null)
    try {
      await onSubmit(values)
      setFormSuccess(mode === "create" ? "Книга успешно добавлена" : "Книга успешно обновлена")

      if (mode === "create") {
        // Сбрасываем форму после успешного создания
        reset()
        setPreviewUrl(null)
      }
    } catch (error) {
      console.error("Ошибка при отправке формы:", error)
      setFormError("Ошибка при сохранении книги. Пожалуйста, попробуйте еще раз.")
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить книгу",
        variant: "destructive",
      })
    }
  }



  // Функция для импорта данных полки из JSON
  const importShelfFromJson = async (data: any) => {
    if (!data || !data.Id) {
      setFormError("Неверный формат данных полки")
      toast({
        title: "Ошибка",
        description: "Неверный формат данных полки",
        variant: "destructive",
      })
      return
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined")

      const shelfData = {
        id: data.Id,
        category: data.Category,
        capacity: data.Capacity,
        shelfNumber: data.ShelfNumber,
        posX: data.PosX,
        posY: data.PosY,
      }

      const response = await fetch(`${baseUrl}/api/shelf/auto-position`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shelfData),
      })

      if (response.ok) {
        setFormSuccess(`Полка "${data.Category}" успешно обновлена`)
        toast({
          title: "Успех",
          description: `Полка "${data.Category}" обновлена`,
        })
      } else {
        const errorText = await response.text()
        setFormError(`Не удалось обновить полку: ${errorText}`)
        toast({
          title: "Ошибка",
          description: `Не удалось обновить полку: ${errorText}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Ошибка при обновлении полки:", error)
      setFormError("Не удалось обновить полку из-за ошибки сервера")
      toast({
        title: "Ошибка",
        description: "Не удалось обновить полку из-за ошибки сервера",
        variant: "destructive",
      })
    }
  }

  // Функция для импорта данных журнала из JSON
  const importJournalFromJson = async (data: any) => {
    if (!data || !data.Id) {
      setFormError("Неверный формат данных журнала")
      toast({
        title: "Ошибка",
        description: "Неверный формат данных журнала",
        variant: "destructive",
      })
      return
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined")

      const response = await fetch(`${baseUrl}/api/journals/${data.Id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setFormSuccess(`Журнал "${data.Title}" успешно обновлен`)
        toast({
          title: "Успех",
          description: `Журнал "${data.Title}" обновлен`,
        })
      } else {
        const errorText = await response.text()
        setFormError(`Не удалось обновить журнал: ${errorText}`)
        toast({
          title: "Ошибка",
          description: `Не удалось обновить журнал: ${errorText}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Ошибка при обновлении журнала:", error)
      setFormError("Не удалось обновить журнал из-за ошибки сервера")
      toast({
        title: "Ошибка",
        description: "Не удалось обновить журнал из-за ошибки сервера",
        variant: "destructive",
      })
    }
  }

  // Функция для импорта данных из буфера обмена
  const handleImportFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      try {
        const jsonData = JSON.parse(text)

        // Определение типа данных и выбор соответствующей функции импорта
        if (jsonData.Title !== undefined && jsonData.Authors !== undefined) {
          // Это книга
          fillFormFromJson(jsonData)
        } else if (
          jsonData.Category !== undefined &&
          jsonData.Capacity !== undefined &&
          jsonData.ShelfNumber !== undefined
        ) {
          // Это полка
          await importShelfFromJson(jsonData)
        } else if (jsonData.ISSN !== undefined || (jsonData.Title !== undefined && jsonData.Publisher !== undefined)) {
          // Это журнал
          await importJournalFromJson(jsonData)
        } else {
          setFormError("Формат JSON не распознан")
          toast({
            title: "Неизвестный формат",
            description: "Формат JSON не распознан. Поддерживаются: книги, полки, журналы",
            variant: "destructive",
          })
        }
      } catch (e) {
        setFormError("Не удалось распарсить JSON из буфера обмена")
        toast({
          title: "Ошибка",
          description: "Не удалось распарсить JSON из буфера обмена",
          variant: "destructive",
        })
      }
    } catch (e) {
      setFormError("Не удалось получить доступ к буферу обмена")
      toast({
        title: "Ошибка",
        description: "Не удалось получить доступ к буферу обмена",
        variant: "destructive",
      })
    }
  }, [])
  return (
    <div className="min-h-screen relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto p-6 relative z-10">
        {/* Header */}
        <FadeInView>
          <motion.div
            className="sticky top-0 z-10 backdrop-blur-xl bg-emerald-500/10 dark:bg-emerald-900/20 border-b border-emerald-500/20 dark:border-emerald-700/40 p-4 rounded-xl shadow-lg mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-white" />
              <h1 className="text-2xl font-bold text-white">
                {mode === "create" ? "Добавление новой книги" : "Редактирование книги"}
              </h1>
            </div>
          </motion.div>
        </FadeInView>

        {/* Уведомления */}
        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {formSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <Alert className="border-emerald-500/50 bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-white" />
                <AlertTitle className="text-white">Успех</AlertTitle>
                <AlertDescription className="text-white">
                  {formSuccess}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          <motion.div
            className="backdrop-blur-xl bg-emerald-500/10 dark:bg-emerald-900/20 rounded-2xl p-6 shadow-lg border border-emerald-500/20 dark:border-emerald-700/40"
            whileHover={{
              y: -5,
              boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Gemini AI Block */}
            <FadeInView delay={0.3}>
              <FormSection
                title="Сканирование обложки книги"
                icon={<Camera className="h-5 w-5 text-white" />}
              >
                <p className="text-sm text-white mb-3">
                  Загрузите изображение обложки книги для автоматического заполнения информации
                </p>
                <GeminiFileUpload onFileChange={handleGeminiFileChange} />
                {geminiLoading && (
                  <div className="flex items-center mt-2 text-white">
                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-white" />
                    <span>Обработка изображения...</span>
                  </div>
                )}
                {geminiImage && !geminiLoading && (
                  <motion.button
                    onClick={handleGeminiUpload}
                    className="mt-2 backdrop-blur-xl bg-emerald-500/10 dark:bg-emerald-900/20 border border-emerald-500/20 dark:border-emerald-700/40 text-white rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Перезагрузить
                  </motion.button>
                )}
              </FormSection>
            </FadeInView>

            {/* Form */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 mt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-green/40 dark:bg-green-800/40 backdrop-blur-md p-1 rounded-xl border border-white/20 dark:border-gray-700/40 shadow-md">
                  <AnimatedTabsTrigger
                    value="basic-info"
                    icon={<BookmarkIcon className="w-4 h-4" />}
                    label="Основная информация"
                    isActive={activeTab === "basic-info"}
                  />
                  <AnimatedTabsTrigger
                    value="details"
                    icon={<FileText className="w-4 h-4" />}
                    label="Детальная информация"
                    isActive={activeTab === "details"}
                  />
                  <AnimatedTabsTrigger
                    value="rare-fields"
                    icon={<LayoutGrid className="w-4 h-4" />}
                    label="Дополнительно"
                    isActive={activeTab === "rare-fields"}
                  />
                </TabsList>

                {/* Основная информация */}
                <TabsContent value="basic-info" className="space-y-6 mt-6">
                  <Card className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Название книги" error={errors.title?.message} required>
                          <Input
                            placeholder="Введите название книги"
                            {...register("title")}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="Авторы" error={errors.authors?.message} required>
                          <Input
                            placeholder="Введите имена авторов через запятую"
                            {...register("authors")}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="ISBN" error={errors.isbn?.message}>
                          <div className="relative flex items-center">
                            <Input
                              id="isbn"
                              placeholder="000-0000000000"
                              className={cn(
                                "backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg pr-16 px-4 text-white shadow-sm w-full h-12 placeholder:text-white",
                                errors.isbn && "focus-visible:ring-red-500",
                              )}
                              value={isbn}
                              {...register("isbn", {
                                onChange: (e) => {
                                  setIsbn(e.target.value)
                                },
                                value: isbn,
                              })}
                            />
                            <motion.button
                              type="button"
                              onClick={handleFetchByISBN}
                              disabled={isSearchLoading}
                              className="absolute right-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-white rounded-md px-3 py-1 flex items-center gap-1 transition-all"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isSearchLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4" />
                              )}
                              <span className="text-sm">Поиск</span>
                            </motion.button>
                          </div>
                        </FormField>

                        <FormField label="Жанр" error={errors.genre?.message}>
                          <Input
                            placeholder="Введите жанр книги"
                            {...register("genre")}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="Год публикации" error={errors.publicationYear?.message}>
                          <Input
                            type="number"
                            placeholder="Введите год публикации"
                            min={1000}
                            max={new Date().getFullYear()}
                            {...register("publicationYear", { valueAsNumber: true })}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="Издательство" error={errors.publisher?.message}>
                          <Input
                            placeholder="Введите название издательства"
                            {...register("publisher")}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <div className="md:col-span-2">
                          <div className="flex items-center space-x-2 mb-4">
                            <Checkbox
                              id="isEbook"
                              checked={isEbook}
                              onCheckedChange={(checked) => setValue("isEbook", checked === true)}
                              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <label
                              htmlFor="isEbook"
                              className="text-base font-medium text-white"
                            >
                              Электронная книга
                            </label>
                          </div>
                        </div>

                        {!isEbook && (
                          <>
                            <FormField label="Доступные экземпляры" error={errors.availableCopies?.message}>
                              <Input
                                type="number"
                                placeholder="Введите количество доступных экземпляров"
                                min={0}
                                {...register("availableCopies", { valueAsNumber: true })}
                                className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                              />
                            </FormField>

                            <FormField label="Состояние книги" error={errors.condition?.message}>
                              <Select
                                onValueChange={(value) => setValue("condition", value)}
                                defaultValue={initialData?.condition || ""}
                              >
                                <SelectTrigger className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12">
                                  <SelectValue placeholder="Выберите состояние" />
                                </SelectTrigger>
                                <SelectContent className="backdrop-blur-xl bg-emerald-100/90 dark:bg-emerald-900/90 border border-emerald-500/20 dark:border-emerald-700/40">
                                  <SelectItem value="Новое">Новое</SelectItem>
                                  <SelectItem value="Б/У">Б/У</SelectItem>
                                  <SelectItem value="Не определено">Не определено</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>

                            
                          </>
                        )}

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-white mb-2 text-center">
                            Обложка книги
                          </label>
                          <div className="flex flex-row gap-4 justify-center">
                            <div className="flex flex-col items-center">
                              {previewUrl ? (
                                <motion.div
                                  className="relative w-48 h-64 mb-4 rounded-xl shadow-lg overflow-hidden"
                                  whileHover={{ scale: 1.05, rotate: 1 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                >
                                  <Image
                                    src={previewUrl || "/placeholder.svg?height=256&width=192"}
                                    alt="Предпросмотр обложки"
                                    fill
                                    className="object-cover rounded-xl"
                                  />
                                  <motion.button
                                    type="button"
                                    onClick={handleRemoveCover}
                                    className="absolute top-2 right-2 bg-red-500/90 text-white p-1 rounded-full hover:bg-red-600 transition-all duration-200"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <X className="h-4 w-4" />
                                  </motion.button>
                                </motion.div>
                              ) : (
                                <motion.div
                                  className="w-48 h-64 mb-4 flex items-center justify-center backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 rounded-xl border border-emerald-500/20 dark:border-emerald-700/40 shadow-md text-white"
                                  whileHover={{ scale: 1.02 }}
                                >
                                  <BookOpen className="h-12 w-12" />
                                </motion.div>
                              )}
                              <div className="flex gap-2">
                                <motion.button
                                  type="button"
                                  onClick={() => document.getElementById("coverInput")?.click()}
                                  className="bg-emerald-600/90 hover:bg-emerald-700/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                                  whileHover={{ y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Upload className="h-4 w-4" />
                                  {previewUrl ? "Изменить обложку" : "Загрузить обложку"}
                                </motion.button>
                                <motion.button
                                  type="button"
                                  onClick={async () => {
                                    setShowManualCoverInput(false)
                                    if (formValues.isbn || (formValues.title && formValues.authors)) {
                                      const coverUrl = await findBookCover({
                                        isbn: formValues.isbn,
                                        title: formValues.title,
                                        authors: formValues.authors,
                                      })

                                      if (coverUrl) {
                                        setValue("cover", coverUrl)
                                        setPreviewUrl(coverUrl)
                                        setFormSuccess("Обложка книги успешно обновлена")
                                      }
                                    } else {
                                      setFormError("Необходимо указать ISBN или название и авторов книги")
                                      toast({
                                        title: "Ошибка",
                                        description: "Необходимо указать ISBN или название и авторов книги",
                                        variant: "destructive",
                                      })
                                    }
                                  }}                                  className="bg-emerald-600/90 hover:bg-emerald-700/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                                  whileHover={{ y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Search className="h-4 w-4" />
                                  Найти обложку
                                </motion.button>
                              </div>
                              <input
                                id="coverInput"
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                                className="hidden"
                              />
                            </div>
                            {showManualCoverInput && (
                              <div className="flex flex-col w-full max-w-xs">
                                <div className="mt-3">
                                  <label className="block text-xs font-medium text-white mb-1">
                                    Вставьте ссылку на обложку
                                  </label>
                                  <Input
                                    placeholder="Ссылка на обложку"
                                    value={manualCoverUrl}
                                    onChange={(e) => {
                                      setManualCoverUrl(e.target.value)
                                      setValue("cover", e.target.value)
                                      setPreviewUrl(e.target.value)
                                    }}
                                    className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm text-xs h-12 placeholder:text-white"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Детальная информация */}
                <TabsContent value="details" className="space-y-6 mt-6">
                  <Card className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <FormField label="Описание книги" error={errors.description?.message}>
                            <Textarea
                              placeholder="Введите описание книги"
                              {...register("description")}
                              rows={7}
                              className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-white shadow-sm resize-none placeholder:text-white"
                            />
                          </FormField>
                        </div>

                        <FormField label="Количество страниц" error={errors.pageCount?.message}>
                          <Input
                            type="number"
                            placeholder="Введите количество страниц"
                            min={1}
                            {...register("pageCount", { valueAsNumber: true })}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="Язык" error={errors.language?.message}>
                          <Input
                            placeholder="Введите язык книги"
                            {...register("language")}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="Формат книги" error={errors.format?.message}>
                          <Select
                            onValueChange={(value) => setValue("format", value)}
                            defaultValue={initialData?.format || ""}
                          >
                            <SelectTrigger className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12">
                              <SelectValue placeholder="Выберите формат" />
                            </SelectTrigger>
                            <SelectContent className="backdrop-blur-xl bg-emerald-100/90 dark:bg-emerald-900/90 border border-emerald-500/20 dark:border-emerald-700/40">
                              <SelectItem value="Твердый переплет">Твердый переплет</SelectItem>
                              <SelectItem value="Мягкий переплет">Мягкий переплет</SelectItem>
                              <SelectItem value="Электронный">Электронный</SelectItem>
                              <SelectItem value="Аудиокнига">Аудиокнига</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>

                        <FormField label="Цена" error={errors.price?.message}>
                          <Input
                            type="number"
                            placeholder="Введите цену книги"
                            min={0.00}
                            step="0.01"
                            {...register("price", { valueAsNumber: true })}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="Категоризация" error={errors.categorization?.message}>
                          <Input
                            placeholder="Введите категоризацию"
                            {...register("categorization")}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="УДК" error={errors.udk?.message}>
                          <Input
                            placeholder="Введите УДК"
                            {...register("udk")}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="ББК" error={errors.bbk?.message}>
                          <Input
                            placeholder="Введите ББК"
                            {...register("bbk")}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Дополнительные поля */}
                <TabsContent value="rare-fields" className="space-y-6 mt-6">
                  <Card className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Оригинальное название" error={errors.originalTitle?.message}>
                          <Input
                            placeholder="Введите оригинальное название книги"
                            {...register("originalTitle")}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="Оригинальный язык" error={errors.originalLanguage?.message}>
                          <Input
                            placeholder="Введите оригинальный язык книги"
                            {...register("originalLanguage")}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="Издание" error={errors.edition?.message}>
                          <Input
                            placeholder="Введите информацию об издании"
                            {...register("edition")}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 text-white shadow-sm h-12 placeholder:text-white"
                          />
                        </FormField>

                        <FormField label="Резюме книги" error={errors.summary?.message}>
                          <Textarea
                            placeholder="Введите резюме книги"
                            {...register("summary")}
                            rows={5}
                            className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/20 dark:border-emerald-700/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-white shadow-sm resize-none placeholder:text-white"
                          />
                        </FormField>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="pt-4 border-t border-emerald-500/20 dark:border-emerald-700/40 flex flex-col md:flex-row gap-4">
                <motion.button
                  type="button"
                  onClick={handleImportFromClipboard}
                  className="bg-emerald-600/90 hover:bg-emerald-700/90 text-white font-medium rounded-lg px-4 py-2 w-full md:w-1/3 flex items-center justify-center gap-2 shadow-md backdrop-blur-md"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="h-5 w-5" />
                  Импорт из JSON
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-gray-500/90 hover:bg-gray-600/90 text-white font-medium rounded-lg px-4 py-2 w-full md:w-1/3 flex items-center justify-center gap-2 shadow-md backdrop-blur-md"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="h-5 w-5" />
                  Отмена
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={isSubmitting || (!isDirty && mode === "update")}
                  className="bg-emerald-600/90 hover:bg-emerald-700/90 text-white font-medium rounded-lg px-4 py-2 w-full md:w-2/3 flex items-center justify-center gap-2 shadow-md backdrop-blur-md disabled:opacity-70 disabled:cursor-not-allowed"
                  whileHover={!isSubmitting ? { y: -3 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      {mode === "create" ? "Добавить книгу" : "Сохранить изменения"}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </FadeInView>
      </div>

    </div>
  )
}

export default BookForm
