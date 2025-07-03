import { useState, useCallback } from 'react'
import { minioCovers } from '@/lib/minio-client'
import { toast } from './use-toast'

export interface UseMinIOUploadOptions {
  maxFileSize?: number // в байтах, по умолчанию 5MB
  allowedTypes?: string[] // массив MIME типов
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
}

export interface UseMinIOUploadReturn {
  uploadFile: (file: File, bookId?: string, isbn?: string) => Promise<string | null>
  findCover: (bookId: string, isbn?: string) => Promise<string | null>
  isUploading: boolean
  isSearching: boolean
  error: string | null
}

export const useMinIOUpload = (options: UseMinIOUploadOptions = {}): UseMinIOUploadReturn => {
  const {
    maxFileSize = 5 * 1024 * 1024, // 5MB по умолчанию
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    onSuccess,
    onError
  } = options

  const [isUploading, setIsUploading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (
    file: File, 
    bookId?: string, 
    isbn?: string
  ): Promise<string | null> => {
    setIsUploading(true)
    setError(null)

    try {
      // Валидация файла
      if (file.size > maxFileSize) {
        throw new Error(`Размер файла не должен превышать ${Math.round(maxFileSize / 1024 / 1024)} МБ`)
      }

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Неподдерживаемый тип файла. Загружайте изображения (JPG, PNG, WebP)')
      }

      if (!bookId && !isbn) {
        throw new Error('Необходимо предоставить ID книги или ISBN')
      }

      const url = await minioCovers.uploadCover(file, bookId, isbn)
      
      onSuccess?.(url)
      toast({
        title: "Успех",
        description: "Обложка успешно загружена",
      })

      return url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки файла'
      setError(errorMessage)
      onError?.(errorMessage)
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      })

      return null
    } finally {
      setIsUploading(false)
    }
  }, [maxFileSize, allowedTypes, onSuccess, onError])

  const findCover = useCallback(async (
    bookId: string, 
    isbn?: string
  ): Promise<string | null> => {
    setIsSearching(true)
    setError(null)

    try {
      const url = await minioCovers.findAvailableCover(bookId, isbn)
      
      if (url) {
        toast({
          title: "Найдено",
          description: "Обложка найдена в MinIO",
        })
      }

      return url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка поиска обложки'
      setError(errorMessage)
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      })

      return null
    } finally {
      setIsSearching(false)
    }
  }, [])

  return {
    uploadFile,
    findCover,
    isUploading,
    isSearching,
    error
  }
} 