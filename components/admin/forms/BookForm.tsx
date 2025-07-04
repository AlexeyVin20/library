'use client';

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

import Loader from "@/components/ui/3d-box-loader-animation"
import { useImageUpload } from "@/components/ui/use-image-upload"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { bookSchema } from "@/lib/validations"
import type { BookInput } from "@/lib/admin/actions/book"
import { minioCovers } from "@/lib/minio-client"
import { useMinIOUpload } from "@/hooks/use-minio-upload"
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
import type { Book, Journal, Shelf } from "@/lib/types"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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
        <span className={isActive ? "text-white" : "text-gray-800"}>
          {icon}
        </span>
        <span className={isActive ? "text-white" : "text-gray-800"}>
          {label}
        </span>
      </div>
      {isActive && (
        <motion.div
          layoutId="activeBookFormTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
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
    <div className="bg-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
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
      <label className="block text-sm font-medium text-gray-800">
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
  shelves?: Shelf[]
}

const BookForm = ({ initialData, onSubmit, isSubmitting, mode, shelves }: BookFormProps) => {
  const router = useRouter()
  const [showManualCoverInput, setShowManualCoverInput] = useState(false)
  const [manualCoverUrl, setManualCoverUrl] = useState("")
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic-info")
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.cover || null)
  const [geminiImage, setGeminiImage] = useState<string | null>(null)
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  // Переключатель простого/расширенного режима
  const [isAdvancedMode, setIsAdvancedMode] = useState(true)
  
  // Хук для работы с MinIO
  const { uploadFile, isUploading } = useMinIOUpload({
    onSuccess: (url) => {
      setPreviewUrl(url)
      setValue("cover", url)
      setFormSuccess("Обложка успешно загружена")
    }
  })
  // Переключатель ИИ модели
  const [aiModel, setAiModel] = useState<'openrouter' | 'gemini'>('openrouter')

  // Хук для загрузки изображений
  const imageUpload = useImageUpload({
    onUpload: (url: string) => {
      // Конвертируем blob URL в base64 для обработки
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader()
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              const base64String = reader.result.split(',')[1]
              setGeminiImage(base64String)
              setFormSuccess("Изображение загружено и отправлено на обработку")
            }
          }
          reader.readAsDataURL(blob)
        })
        .catch(error => {
          console.error('Ошибка при конвертации изображения:', error)
          setFormError("Ошибка при обработке изображения")
        })
    }
  })

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
      availableCopies: initialData?.availableCopies || 0,
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
    if (initialData?.cover) {
      setPreviewUrl(initialData.cover)
    }
  }, [initialData])

  // Удалена функция поиска обложки в MinIO

  useEffect(() => {
    if (geminiImage) handleGeminiUpload()
  }, [geminiImage])

  // Удален автоматический поиск обложки в MinIO

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

  // Сброс активной вкладки, если выключен расширенный режим
  useEffect(() => {
    if (!isAdvancedMode && (activeTab === "details" || activeTab === "rare-fields")) {
      setActiveTab("basic-info")
    }
  }, [isAdvancedMode, activeTab])

  const handleFetchByISBN = async () => {
    const isbn = formValues.isbn;
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

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const bookId = initialData?.id
      const currentIsbn = formValues.isbn || initialData?.isbn
      
      await uploadFile(file, bookId, currentIsbn)
    }
  }

  const handleRemoveCover = () => {
    setPreviewUrl(null)
    setValue("cover", "")
    setFormSuccess("Обложка книги удалена")
  }

  const GeminiFileUpload = () => {
    return (
      <motion.div
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
          imageUpload.isDragOver 
            ? 'bg-blue-100 border-blue-400 scale-105' 
            : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
        }`}
        whileHover={{ scale: imageUpload.isDragOver ? 1.05 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={imageUpload.handleThumbnailClick}
        onDragEnter={imageUpload.handleDragEnter}
        onDragLeave={imageUpload.handleDragLeave}
        onDragOver={imageUpload.handleDragOver}
        onDrop={imageUpload.handleDrop}
      >
        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          ref={imageUpload.fileInputRef}
          onChange={imageUpload.handleFileChange}
        />
        <Camera className={`w-10 h-10 mb-2 transition-colors ${
          imageUpload.isDragOver ? 'text-blue-600' : 'text-gray-800'
        }`} />
        <p className={`mb-2 text-sm text-center transition-colors ${
          imageUpload.isDragOver ? 'text-blue-600 font-medium' : 'text-gray-800'
        }`}>
          {imageUpload.isDragOver 
            ? 'Отпустите файл для загрузки' 
            : 'Перетащите файл сюда или нажмите для загрузки'
          }
        </p>
        {imageUpload.fileName && (
          <p className={`text-xs transition-colors ${
            imageUpload.isDragOver ? 'text-blue-600' : 'text-gray-800'
          }`}>
            {imageUpload.fileName}
          </p>
        )}
      </motion.div>
    )
  }

  const handleGeminiUpload = async (useBackupModel = false) => {
    if (!geminiImage) return

    setGeminiLoading(true)
    setFormError(null)

    try {
      if (aiModel === 'gemini') {
        return await handleGoogleGeminiUpload()
      }

      const endpoint = "https://openrouter.ai/api/v1/chat/completions"
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY

      if (!apiKey) {
        throw new Error("API ключ не настроен")
      }

      const model = useBackupModel ? "google/gemma-3-27b-it:free" : "google/gemini-2.0-flash-exp:free"

      const requestBody = {
        model,
        webSearch: !useBackupModel, // Отключаем веб-поиск для резервной модели
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

      // Если получили ошибку 429 и еще не использовали резервную модель
      if (res.status === 429 && !useBackupModel) {
        console.log("Получена ошибка 429, переключаемся на резервную модель...")
        toast({
          title: "Переключение модели",
          description: "Основная модель недоступна, используем резервную...",
        })
        return await handleGeminiUpload(true)
      }

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

      const modelName = useBackupModel ? "резервной модели OpenRouter" : "основной модели OpenRouter"
      setFormSuccess(`Данные книги успешно получены из изображения (${modelName})`)
      toast({
        title: "Данные получены",
        description: `Информация о книге успешно извлечена из изображения с помощью ${modelName}`,
      })

      // Проверяем валидность полей после заполнения
      await trigger()
    } catch (error) {
      console.error("Ошибка при обработке изображения:", error)
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"
      
      if (errorMessage.includes("429") && !useBackupModel) {
        console.log("Обнаружена ошибка 429 в catch блоке, переключаемся на резервную модель...")
        toast({
          title: "Переключение модели",
          description: "Основная модель недоступна, используем резервную...",
        })
        return await handleGeminiUpload(true)
      }

      setFormError(`Ошибка при обработке изображения: ${errorMessage}`)
      toast({
        title: "Ошибка",
        description: useBackupModel 
          ? "Ошибка при вызове резервной модели API." 
          : "Ошибка при вызове основной модели API.",
        variant: "destructive",
      })
    } finally {
      setGeminiLoading(false)
      setGeminiImage(null)
    }
  }

  const handleGoogleGeminiUpload = async () => {
    if (!geminiImage) return

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY

      if (!apiKey) {
        throw new Error("Google API ключ не настроен")
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Отвечать пользователю по-русски. Отвечать в формате json без вступлений и заключений. Задача- заполнять поля у книг. Модель книги содержит следующие поля: id(Guid), title(строка 255), authors(строка 500), isbn(строка), genre(строка 100), categorization(строка 100), udk(строка), bbk(строка 20), cover всегда оставляй null, description(строка), publicationYear(число), publisher(строка 100), pageCount(число), language(строка 50), availableCopies(число), dateAdded(дата), dateModified(дата), edition(строка 50), price(decimal), format(строка 100), originalTitle(строка 255), originalLanguage(строка 50), isEbook(boolean), condition(строка 100), shelfId(число) - shelfId всегда оставляй null. Если информации нет, оставь null, цену ставь = 0. Ищи в интернете жанры книги по названию и автору, и заполняй резюме книги(summary). Не путай резюме(summary) и описание(description), которое написано в фото."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: geminiImage
                }
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.1
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Google Gemini API error: ${res.status} - ${errorText}`)
      }

      const data = await res.json()
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!responseText) {
        throw new Error("Пустой ответ от Google Gemini API")
      }

      let jsonString = responseText.trim()
      if (jsonString.startsWith("```json")) jsonString = jsonString.slice(7).trim()
      if (jsonString.endsWith("```")) jsonString = jsonString.slice(0, -3).trim()

      const parsedData = JSON.parse(jsonString)

      // Поиск обложки книги
      const coverUrl = await findBookCover(parsedData)

      // Заполнение полей формы данными из API
      fillFormWithApiData(parsedData, coverUrl)

      setFormSuccess("Данные книги успешно получены из изображения (Google Gemini 2.5 Flash)")
      toast({
        title: "Данные получены",
        description: "Информация о книге успешно извлечена из изображения с помощью Google Gemini 2.5 Flash",
      })

      // Проверяем валидность полей после заполнения
      await trigger()
    } catch (error) {
      console.error("Ошибка при обработке изображения через Google Gemini:", error)
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"
      
      setFormError(`Ошибка при обработке изображения через Google Gemini: ${errorMessage}`)
      toast({
        title: "Ошибка",
        description: "Ошибка при вызове Google Gemini API.",
        variant: "destructive",
      })
    }
  }

  // Функция для поиска обложки книги в MinIO
  const findBookCoverInMinIO = async (bookId?: string, isbn?: string): Promise<string | null> => {
    try {
      if (bookId || isbn) {
        const coverUrl = await minioCovers.findAvailableCover(bookId || 'temp', isbn)
        if (coverUrl) {
          console.log('Найдена обложка:', coverUrl)
          return coverUrl
        }
      }
    } catch (error) {
      console.error("Ошибка при поиске обложки:", error)
    }
    return null
  }

  // Функция для поиска обложки книги (сначала MinIO, затем внешние API)
  const findBookCover = async (bookData: any): Promise<string | null> => {
    let coverUrl = null

    // 1. Сначала ищем в MinIO
    if (bookData.id || bookData.isbn) {
      coverUrl = await findBookCoverInMinIO(bookData.id, bookData.isbn)
      if (coverUrl) {
        console.log('Обложка найдена в хранилище:', coverUrl)
        return coverUrl
      }
    }

    // 2. Поиск по ISBN в внешних API
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

    // 3. Поиск по названию и автору
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

    // 4. Поиск через Google Books API
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

    // 5. Если обложка не найдена, открываем поиск в Google
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
    // Гарантируем, что обязательные поля всегда будут заполнены хотя бы пустой строкой
    setValue("title", data.title || "");
    setValue("authors", data.authors || "");
    setValue("genre", data.genre || "");
    setValue("categorization", data.categorization || "");
    setValue("udk", data.udk || "");
    setValue("bbk", data.bbk || "");
    setValue("isbn", data.isbn || "");
    if (coverUrl) {
      setValue("cover", coverUrl);
      setPreviewUrl(coverUrl);
    }
    setValue("description", data.description || "");
    setValue("summary", data.summary || "");
    setValue("publicationYear", data.publicationYear || new Date().getFullYear());
    setValue("publisher", data.publisher || "");
    setValue("pageCount", data.pageCount || 0);
    setValue("language", data.language || "");
    setValue("availableCopies", data.availableCopies || 0);
    setValue("edition", data.edition || "");
    setValue("price", data.price || 0);
    setValue("format", data.format || "");
    setValue("originalTitle", data.originalTitle || "");
    setValue("originalLanguage", data.originalLanguage || "");
    setValue("isEbook", data.isEbook !== undefined ? data.isEbook : false);
    setValue("condition", data.condition || "");
  }

  const fillFormFromJson = (data: any) => {
    try {
      setValue("title", data.Title || "");
      setValue("authors", data.Authors || "");
      setValue("genre", data.Genre || "");
      setValue("categorization", data.Categorization || "");
      setValue("udk", data.UDK || "");
      setValue("bbk", data.BBK || "");
      setValue("isbn", data.ISBN || "");
      if (data.Cover) {
        setValue("cover", data.Cover);
        setPreviewUrl(data.Cover);
      }
      setValue("description", data.Description || "");
      setValue("summary", data.Summary || "");
      setValue("publicationYear", data.PublicationYear || new Date().getFullYear());
      setValue("publisher", data.Publisher || "");
      setValue("pageCount", data.PageCount || 0);
      setValue("language", data.Language || "");
      setValue("availableCopies", data.AvailableCopies !== undefined ? data.AvailableCopies : 0);
      setValue("edition", data.Edition || "");
      setValue("price", data.Price !== undefined ? data.Price : 0);
      setValue("format", data.Format || "");
      setValue("originalTitle", data.OriginalTitle || "");
      setValue("originalLanguage", data.OriginalLanguage || "");
      setValue("isEbook", data.IsEbook !== undefined ? data.IsEbook : false);
      setValue("condition", data.Condition || "");

      setFormSuccess("Информация из JSON успешно импортирована");
      toast({
        title: "Данные загружены",
        description: "Информация из JSON успешно импортирована",
      });

      // Проверяем валидность полей после заполнения
      trigger();
    } catch (error) {
      console.error("Ошибка при заполнении формы из JSON:", error);
      setFormError("Ошибка при импорте данных из JSON");
      toast({
        title: "Ошибка",
        description: "Не удалось импортировать данные из JSON",
        variant: "destructive",
      });
    }
  }

  const onFormSubmit = async (values: z.infer<typeof bookSchema>) => {
    setFormError(null);
    try {
      // Приводим к BookInput с обязательными полями
      const bookInput: BookInput = {
        ...values,
        title: values.title || "",
        authors: values.authors || "",
        genre: values.genre || "",
        categorization: values.categorization || "",
        udk: values.udk || "",
        bbk: values.bbk || "",
        isbn: values.isbn || "",
        description: values.description || "",
        publicationYear: values.publicationYear || new Date().getFullYear(),
        publisher: values.publisher || "",
        pageCount: values.pageCount || 0,
        language: values.language || "",
        availableCopies: values.availableCopies || 0,
        edition: values.edition || "",
        price: values.price || 0,
        format: values.format || "",
        originalTitle: values.originalTitle || "",
        originalLanguage: values.originalLanguage || "",
        isEbook: values.isEbook !== undefined ? values.isEbook : false,
        condition: values.condition || "",
      };
      await onSubmit(bookInput);
      setFormSuccess(mode === "create" ? "Книга успешно добавлена" : "Книга успешно обновлена");
      if (mode === "create") {
        // Сбрасываем форму после успешного создания
        reset();
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Ошибка при отправке формы:", error);
      setFormError("Ошибка при сохранении книги. Пожалуйста, попробуйте еще раз.");
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить книгу",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-gray-200">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <FadeInView>
          <motion.div
            className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 rounded-xl shadow-lg mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-800">
                  {mode === "create" ? "Добавление новой книги" : "Редактирование книги"}
                </h1>
              </div>
              {/* Переключатель режима */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-800 select-none">Расширенный режим</span>
                <Switch checked={isAdvancedMode} onCheckedChange={setIsAdvancedMode} />
              </div>
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
              <Alert variant="destructive" className="border-red-500 bg-red-100">
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
              <Alert className="border-green-500 bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-800" />
                <AlertTitle className="text-green-800">Успех</AlertTitle>
                <AlertDescription className="text-green-800">
                  {formSuccess}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            whileHover={{
              y: -5,
              boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Gemini AI Block */}
            <FadeInView delay={0.3}>
              <FormSection
                title="Сканирование титульного листа"
                icon={<Camera className="h-5 w-5 text-gray-800" />}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-800">
                    Загрузите изображение титульного листа для автоматического заполнения информации
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 select-none">
                      {aiModel === 'openrouter' ? 'OpenRouter' : 'Google Gemini'}
                    </span>
                    <Switch
                      checked={aiModel === 'gemini'}
                      onCheckedChange={(checked) => setAiModel(checked ? 'gemini' : 'openrouter')}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded-lg border">
                  <strong>Выбранная модель:</strong> {aiModel === 'openrouter' ? 'OpenRouter (Gemini 2.0 Flash)' : 'Google Gemini 2.5 Flash'}
                </div>
                <GeminiFileUpload />
                {geminiLoading && (
                  <div className="flex items-center justify-center mt-4">
                    <Loader />
                  </div>
                )}
                {geminiImage && !geminiLoading && (
                  <motion.button
                    onClick={() => handleGeminiUpload()}
                    className="mt-2 bg-blue-500 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm"
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
                <div className="flex items-center justify-between w-full">
                  <TabsList className="bg-blue-300 p-1 rounded-xl border border-gray-200 shadow-md">
                    <AnimatedTabsTrigger
                      value="basic-info"
                      icon={<BookmarkIcon className="w-4 h-4" />}
                      label="Основная информация"
                      isActive={activeTab === "basic-info"}
                    />
                    {isAdvancedMode && (
                      <>
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
                      </>
                    )}
                  </TabsList>
                  {/* Электронная книга компактно справа от табов */}
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm font-medium text-gray-700 select-none">Электронная книга</span>
                    <Switch
                      id="isEbook-tabs"
                      checked={isEbook}
                      onCheckedChange={(checked) => setValue("isEbook", checked === true)}
                    />
                  </div>
                </div>

                {/* Основная информация */}
                <TabsContent value="basic-info" className="space-y-6 mt-6">
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Название книги" error={errors.title?.message} required>
                          <Input
                            placeholder="Введите название книги"
                            {...register("title")}
                            className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                          />
                        </FormField>

                        <FormField label="Авторы" error={errors.authors?.message} required>
                          <Input
                            placeholder="Введите имена авторов через запятую"
                            {...register("authors")}
                            className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                          />
                        </FormField>

                        <FormField label="ISBN" error={errors.isbn?.message}>
                          <div className="relative flex items-center gap-2">
                            <Input
                              id="isbn"
                              placeholder="000-0000000000"
                              className={cn(
                                "bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pr-16 px-4 text-gray-800 shadow-sm w-full h-12 placeholder:text-gray-500",
                                errors.isbn && "focus-visible:ring-red-500",
                              )}
                              {...register("isbn")}
                              value={formValues.isbn}
                              onChange={e => setValue("isbn", e.target.value)}
                            />
                            <motion.button
                              type="button"
                              onClick={handleFetchByISBN}
                              disabled={isSearchLoading}
                              className="bg-blue-500 hover:bg-blue-700 text-white rounded-md px-3 py-1 flex items-center gap-1 transition-all"
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
                            className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                          />
                        </FormField>

                        <FormField label="Год публикации" error={errors.publicationYear?.message}>
                          <Input
                            type="number"
                            placeholder="Введите год публикации"
                            min={1000}
                            max={new Date().getFullYear()}
                            {...register("publicationYear", { valueAsNumber: true })}
                            className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                          />
                        </FormField>

                        <FormField label="Издательство" error={errors.publisher?.message}>
                          <Input
                            placeholder="Введите название издательства"
                            {...register("publisher")}
                            className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                          />
                        </FormField>

                        {!isEbook && (
                          <FormField label="Доступные экземпляры" error={errors.availableCopies?.message}>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold border border-gray-300"
                                onClick={() => setValue("availableCopies", Math.max(0, (formValues.availableCopies || 0) - 1))}
                                tabIndex={-1}
                              >
                                -
                              </button>
                              <Input
                                type="number"
                                placeholder="Количество"
                                min={0}
                                {...register("availableCopies", { valueAsNumber: true })}
                                value={formValues.availableCopies}
                                className="w-20 text-center bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-2 text-gray-800 shadow-sm h-10 placeholder:text-gray-500"
                                onChange={e => setValue("availableCopies", Math.max(0, Number(e.target.value)))}
                              />
                              <button
                                type="button"
                                className="bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold border border-gray-300"
                                onClick={() => setValue("availableCopies", (formValues.availableCopies || 0) + 1)}
                                tabIndex={-1}
                              >
                                +
                              </button>
                            </div>
                          </FormField>
                        )}

                        {/* Добавляю выпадающий список для выбора полки, если есть shelves */}
                        {shelves && shelves.length > 0 && (
                          <FormField label="Полка" error={errors.shelfId?.message}>
                            <Select
                              onValueChange={value => setValue("shelfId", Number(value))}
                              defaultValue={initialData?.shelfId ? String(initialData.shelfId) : undefined}
                            >
                              <SelectTrigger className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12">
                                <SelectValue placeholder="Выберите полку" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200">
                                {shelves.map(shelf => (
                                  <SelectItem key={shelf.id} value={String(shelf.id)}>
                                    {shelf.category} (№{shelf.shelfNumber})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>
                        )}

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-800 mb-2 text-center">
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
                                  {/* Индикатор источника обложки */}
                                  {previewUrl?.includes(process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'localhost') && (
                                    <div className="absolute top-2 left-2 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-medium">
                                      MinIO
                                    </div>
                                  )}
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
                                  className="w-48 h-64 mb-4 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 shadow-md text-gray-500"
                                  whileHover={{ scale: 1.02 }}
                                >
                                  {isUploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                      <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                                      <span className="text-xs text-green-600">Загрузка в хранилище...</span>
                                    </div>
                                  ) : (
                                    <BookOpen className="h-12 w-12" />
                                  )}
                                </motion.div>
                              )}
                              <div className="flex gap-2 flex-wrap">
                                <motion.button
                                  type="button"
                                  onClick={() => document.getElementById('minioFileInput')?.click()}
                                  disabled={isUploading}
                                  className="bg-green-600 hover:bg-green-800 text-white font-medium rounded-lg px-3 py-2 flex items-center gap-2 shadow-md text-sm"
                                  whileHover={{ y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  {isUploading ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Upload className="h-3 w-3" />
                                  )}
                                  Загрузить обложку
                                </motion.button>
                                <input
                                  id="minioFileInput"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCoverChange}
                                  className="hidden"
                                />
                                <motion.button
                                  type="button"
                                  onClick={() => {
                                    setShowManualCoverInput(true)
                                    setTimeout(() => document.getElementById("manualCoverInput")?.focus(), 0)
                                  }}
                                  className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-3 py-2 flex items-center gap-2 shadow-md text-sm"
                                  whileHover={{ y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Upload className="h-3 w-3" />
                                  URL
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
                                  }}
                                  className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-3 py-2 flex items-center gap-2 shadow-md text-sm"
                                  whileHover={{ y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Search className="h-3 w-3" />
                                  Найти
                                </motion.button>
                              </div>
                            </div>
                            {showManualCoverInput && (
                              <div className="flex flex-col w-full max-w-xs">
                                <div className="mt-3">
                                  <label className="block text-xs font-medium text-gray-800 mb-1">
                                    Вставьте ссылку на обложку
                                  </label>
                                  <Input
                                    id="manualCoverInput"
                                    placeholder="Ссылка на обложку"
                                    value={manualCoverUrl}
                                    onChange={(e) => {
                                      setManualCoverUrl(e.target.value)
                                      setValue("cover", e.target.value)
                                      setPreviewUrl(e.target.value)
                                    }}
                                    className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm text-xs h-12 placeholder:text-gray-500"
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
                {isAdvancedMode && (
                  <TabsContent value="details" className="space-y-6 mt-6">
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <FormField label="Описание книги" error={errors.description?.message}>
                              <Textarea
                                placeholder="Введите описание книги"
                                {...register("description")}
                                rows={7}
                                className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-gray-800 shadow-sm resize-none placeholder:text-gray-500"
                              />
                            </FormField>
                          </div>

                          <FormField label="Количество страниц" error={errors.pageCount?.message}>
                            <Input
                              type="number"
                              placeholder="Введите количество страниц"
                              min={1}
                              {...register("pageCount", { valueAsNumber: true })}
                              className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                            />
                          </FormField>

                          <FormField label="Язык" error={errors.language?.message}>
                            <Input
                              placeholder="Введите язык книги"
                              {...register("language")}
                              className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                            />
                          </FormField>

                          <FormField label="Формат книги" error={errors.format?.message}>
                            <Select
                              onValueChange={(value) => setValue("format", value)}
                              defaultValue={initialData?.format || ""}
                            >
                              <SelectTrigger className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12">
                                <SelectValue placeholder="Выберите формат" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200">
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
                              className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                            />
                          </FormField>

                          {/* Accordion для классификации */}
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="classification">
                              <AccordionTrigger className="text-base font-medium text-gray-800">Классификация</AccordionTrigger>
                              <AccordionContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                  <FormField label="УДК" error={errors.udk?.message}>
                                    <Input
                                      placeholder="Введите УДК"
                                      {...register("udk")}
                                      className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                                    />
                                  </FormField>
                                  <FormField label="ББК" error={errors.bbk?.message}>
                                    <Input
                                      placeholder="Введите ББК"
                                      {...register("bbk")}
                                      className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                                    />
                                  </FormField>
                                  <FormField label="Категоризация" error={errors.categorization?.message}>
                                    <Input
                                      placeholder="Введите категоризацию"
                                      {...register("categorization")}
                                      className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                                    />
                                  </FormField>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          {/* Состояние книги теперь в деталях */}
                          {!isEbook && (
                            <FormField label="Состояние книги" error={errors.condition?.message}>
                              <Select
                                onValueChange={(value) => setValue("condition", value)}
                                defaultValue={initialData?.condition || ""}
                              >
                                <SelectTrigger className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12">
                                  <SelectValue placeholder="Выберите состояние" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200">
                                  <SelectItem value="Новое">Новое</SelectItem>
                                  <SelectItem value="Б/У">Б/У</SelectItem>
                                  <SelectItem value="Не определено">Не определено</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                            
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* Дополнительные поля */}
                {isAdvancedMode && (
                  <TabsContent value="rare-fields" className="space-y-6 mt-6">
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField label="Оригинальное название" error={errors.originalTitle?.message}>
                            <Input
                              placeholder="Введите оригинальное название книги"
                              {...register("originalTitle")}
                              className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                            />
                          </FormField>

                          <FormField label="Оригинальный язык" error={errors.originalLanguage?.message}>
                            <Input
                              placeholder="Введите оригинальный язык книги"
                              {...register("originalLanguage")}
                              className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                            />
                          </FormField>

                          <FormField label="Издание" error={errors.edition?.message}>
                            <Input
                              placeholder="Введите информацию об издании"
                              {...register("edition")}
                              className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 text-gray-800 shadow-sm h-12 placeholder:text-gray-500"
                            />
                          </FormField>

                          <FormField label="Резюме книги" error={errors.summary?.message}>
                            <Textarea
                              placeholder="Введите резюме книги"
                              {...register("summary")}
                              rows={5}
                              className="bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-gray-800 shadow-sm resize-none placeholder:text-gray-500"
                            />
                          </FormField>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>

              <div className="pt-4 border-t border-gray-200 flex flex-col md:flex-row gap-4">
                <motion.button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg px-4 py-2 w-full md:w-1/3 flex items-center justify-center gap-2 shadow-md"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="h-5 w-5" />
                  Отмена
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 w-full md:w-2/3 flex items-center justify-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
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
