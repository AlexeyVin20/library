import axios from "axios";

// Базовый URL для API. В будущем может быть взят из переменных окружения
const API_BASE_URL = "/api";

// Интерфейсы моделей данных

// Книги
export interface Book {
  id: number;
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  publicationYear: number;
  pageCount: number;
  coverImage?: string;
  description?: string;
}

export interface BookCreateDto extends Omit<Book, "id"> {}
export interface BookUpdateDto extends Partial<BookCreateDto> {}

// Журналы
export interface Journal {
  id: number;
  title: string;
  issn: string;
  publisher: string;
  startYear: number;
  endYear?: number;
  frequency?: string;
  description?: string;
  coverImage?: string;
  website?: string;
  issues?: IssueShort[];
}

export interface JournalCreateDto extends Omit<Journal, "id" | "issues"> {}
export interface JournalUpdateDto extends Partial<JournalCreateDto> {}

// Выпуски журналов
export interface Issue {
  id: number;
  journalId: number;
  volumeNumber: number;
  issueNumber: number;
  publicationDate: string; // ISO-строка даты
  pageCount: number;
  cover?: string;
  circulation?: number;
  specialTheme?: string;
  shelfId?: string;
  position?: string;
  articles?: ArticleShort[];
}

export interface IssueShort {
  id: number;
  volumeNumber: number;
  issueNumber: number;
  publicationDate: string;
}

export interface IssueCreateDto extends Omit<Issue, "id" | "articles"> {}
export interface IssueUpdateDto extends Partial<IssueCreateDto> {}

// Статьи
export interface Article {
  id: number;
  issueId: number;
  title: string;
  authors: string[];
  abstract: string;
  startPage: number;
  endPage: number;
  keywords: string[];
  DOI?: string;
  type?: string;
  fullText?: string;
}

export interface ArticleShort {
  id: number;
  title: string;
  authors: string[];
  startPage: number;
  endPage: number;
  DOI?: string;
}

export interface ArticleCreateDto extends Omit<Article, "id"> {}
export interface ArticleUpdateDto extends Partial<ArticleCreateDto> {}

// Клиент API для книг
const books = {
  // Получить все книги
  getAll: async (): Promise<Book[]> => {
    const response = await axios.get(`${API_BASE_URL}/books`);
    return response.data;
  },

  // Получить книгу по ID
  getById: async (id: number): Promise<Book> => {
    const response = await axios.get(`${API_BASE_URL}/books/${id}`);
    return response.data;
  },

  // Создать новую книгу
  create: async (data: BookCreateDto): Promise<Book> => {
    const response = await axios.post(`${API_BASE_URL}/books`, data);
    return response.data;
  },

  // Обновить книгу
  update: async (id: number, data: BookUpdateDto): Promise<Book> => {
    const response = await axios.put(`${API_BASE_URL}/books/${id}`, data);
    return response.data;
  },

  // Удалить книгу
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/books/${id}`);
  },

  // Поиск книг
  search: async (query: string): Promise<Book[]> => {
    const response = await axios.get(`${API_BASE_URL}/books/search`, {
      params: { query },
    });
    return response.data;
  },
};

// Клиент API для журналов
const journals = {
  // Получить все журналы
  getAll: async (): Promise<Journal[]> => {
    const response = await axios.get(`${API_BASE_URL}/journals`);
    return response.data;
  },

  // Получить журнал по ID
  getById: async (id: number): Promise<Journal> => {
    const response = await axios.get(`${API_BASE_URL}/journals/${id}`);
    return response.data;
  },

  // Создать новый журнал
  create: async (data: JournalCreateDto): Promise<Journal> => {
    const response = await axios.post(`${API_BASE_URL}/journals`, data);
    return response.data;
  },

  // Обновить журнал
  update: async (id: number, data: JournalUpdateDto): Promise<Journal> => {
    const response = await axios.put(`${API_BASE_URL}/journals/${id}`, data);
    return response.data;
  },

  // Удалить журнал
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/journals/${id}`);
  },

  // Поиск журналов
  search: async (query: string): Promise<Journal[]> => {
    const response = await axios.get(`${API_BASE_URL}/journals/search`, {
      params: { query },
    });
    return response.data;
  },
};

// Клиент API для выпусков журналов
const issues = {
  // Получить все выпуски журнала
  getAll: async (journalId: number): Promise<Issue[]> => {
    const response = await axios.get(`${API_BASE_URL}/journals/${journalId}/issues`);
    return response.data;
  },

  // Получить выпуск по ID
  getById: async (id: number): Promise<Issue> => {
    const response = await axios.get(`${API_BASE_URL}/issues/${id}`);
    return response.data;
  },

  // Создать новый выпуск
  create: async (data: IssueCreateDto): Promise<Issue> => {
    const response = await axios.post(`${API_BASE_URL}/issues`, data);
    return response.data;
  },

  // Обновить выпуск
  update: async (id: number, data: IssueUpdateDto): Promise<Issue> => {
    const response = await axios.put(`${API_BASE_URL}/issues/${id}`, data);
    return response.data;
  },

  // Удалить выпуск
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/issues/${id}`);
  },
};

// Клиент API для статей
const articles = {
  // Получить все статьи выпуска
  getAll: async (issueId: number): Promise<Article[]> => {
    const response = await axios.get(`${API_BASE_URL}/issues/${issueId}/articles`);
    return response.data;
  },

  // Получить статью по ID
  getById: async (id: number): Promise<Article> => {
    const response = await axios.get(`${API_BASE_URL}/articles/${id}`);
    return response.data;
  },

  // Создать новую статью
  create: async (data: ArticleCreateDto): Promise<Article> => {
    const response = await axios.post(`${API_BASE_URL}/articles`, data);
    return response.data;
  },

  // Обновить статью
  update: async (id: number, data: ArticleUpdateDto): Promise<Article> => {
    const response = await axios.put(`${API_BASE_URL}/articles/${id}`, data);
    return response.data;
  },

  // Удалить статью
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/articles/${id}`);
  },

  // Поиск статей
  search: async (query: string): Promise<Article[]> => {
    const response = await axios.get(`${API_BASE_URL}/articles/search`, {
      params: { query },
    });
    return response.data;
  },
};

// Объединенный клиент API
const api = {
  books,
  journals,
  issues,
  articles,
};

export default api;