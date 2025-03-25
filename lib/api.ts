/**
 * API client для работы с backend сервером
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

/**
 * Базовая функция для выполнения fetch запросов
 */
async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Ошибка API: ${response.status} ${response.statusText}`
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка API запроса:', error);
    throw error;
  }
}

/**
 * API методы
 */
export const api = {
  // Книги
  books: {
    getAll: () => fetchWithErrorHandling(`${API_BASE_URL}/api/Books`),
    getById: (id: string) => fetchWithErrorHandling(`${API_BASE_URL}/api/Books/${id}`),
    create: (data: any) => fetchWithErrorHandling(`${API_BASE_URL}/api/Books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchWithErrorHandling(`${API_BASE_URL}/api/Books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchWithErrorHandling(`${API_BASE_URL}/api/Books/${id}`, {
      method: 'DELETE',
    }),
  },
  
  // Журналы
  journals: {
    getAll: () => fetchWithErrorHandling(`${API_BASE_URL}/api/Journals`),
    getById: (id: number) => fetchWithErrorHandling(`${API_BASE_URL}/api/Journals/${id}`),
    create: (data: any) => fetchWithErrorHandling(`${API_BASE_URL}/api/Journals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => fetchWithErrorHandling(`${API_BASE_URL}/api/Journals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchWithErrorHandling(`${API_BASE_URL}/api/Journals/${id}`, {
      method: 'DELETE',
    }),
  },
};

export default api; 