// Простая клиентская утилита для получения URL обложек
export class MinIOBookCovers {
  private endpoint: string;
  private port: string;
  private bucketName: string;
  private useSSL: boolean;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'localhost';
    this.port = process.env.NEXT_PUBLIC_MINIO_PORT || '9000';
    this.bucketName = process.env.NEXT_PUBLIC_MINIO_BUCKET || 'book-covers';
    this.useSSL = process.env.NEXT_PUBLIC_MINIO_USE_SSL === 'true';
  }

  /**
   * Получить URL обложки книги по ID
   */
  getCoverUrl(bookId: string, extension: string = 'jpg'): string {
    const protocol = this.useSSL ? 'https' : 'http';
    const port = this.port ? `:${this.port}` : '';
    return `${protocol}://${this.endpoint}${port}/${this.bucketName}/book-${bookId}.${extension}`;
  }

  /**
   * Получить URL обложки книги по ISBN
   */
  getCoverByIsbn(isbn: string, extension: string = 'jpg'): string {
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    const protocol = this.useSSL ? 'https' : 'http';
    const port = this.port ? `:${this.port}` : '';
    return `${protocol}://${this.endpoint}${port}/${this.bucketName}/isbn-${cleanIsbn}.${extension}`;
  }

  /**
   * Проверить существование изображения
   */
  async checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Найти доступную обложку для книги
   */
  async findAvailableCover(bookId: string, isbn?: string): Promise<string | null> {
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    // Проверяем по ID книги
    for (const ext of extensions) {
      const url = this.getCoverUrl(bookId, ext);
      if (await this.checkImageExists(url)) {
        return url;
      }
    }
    
    // Проверяем по ISBN
    if (isbn) {
      for (const ext of extensions) {
        const url = this.getCoverByIsbn(isbn, ext);
        if (await this.checkImageExists(url)) {
          return url;
        }
      }
    }
    
    return null;
  }

  /**
   * Загрузить файл обложки в MinIO через Next.js API
   */
  async uploadCover(file: File, bookId?: string, isbn?: string): Promise<string> {
    if (!bookId && !isbn) {
      throw new Error('Необходимо предоставить ID книги или ISBN');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (bookId) formData.append('bookId', bookId);
    if (isbn) formData.append('isbn', isbn);

    const response = await fetch('/api/upload/book-cover', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка загрузки файла');
    }

    const result = await response.json();
    return result.url;
  }
}

// Экспортируем экземпляр для использования
export const minioCovers = new MinIOBookCovers(); 