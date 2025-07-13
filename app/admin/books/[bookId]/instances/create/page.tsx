'use client';

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Package, 
  Save,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Barcode
} from "lucide-react";
import { BookInstanceCreateDto } from "@/lib/types";

interface Book {
  id: string;
  title: string;
  authors: string;
  isbn: string;
  cover?: string;
}

interface Shelf {
  id: number;
  category: string;
  shelfNumber: number;
}

const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

export default function CreateInstancePage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const [book, setBook] = useState<Book | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const resolvedParams = use(params);
  const bookId = resolvedParams.bookId;

  // Form state
  const [formData, setFormData] = useState<BookInstanceCreateDto>({
    bookId: bookId,
    instanceCode: '',
    status: 'Доступна',
    condition: 'Хорошее',
    purchasePrice: undefined,
    dateAcquired: new Date().toISOString().split('T')[0],
    notes: '',
    shelfId: undefined,
    position: undefined,
    location: 'Основной фонд',
    isActive: true
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему заново.');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        // Загружаем информацию о книге и полках
        const [bookResponse, shelvesResponse] = await Promise.all([
          fetch(`${baseUrl}/api/books/${bookId}`, { headers }),
          fetch(`${baseUrl}/api/shelfs`, { headers })
        ]);

        if (!bookResponse.ok) {
          throw new Error('Ошибка при получении информации о книге');
        }

        const bookData = await bookResponse.json();
        setBook({
          id: bookData.id,
          title: bookData.title,
          authors: bookData.authors,
          isbn: bookData.isbn,
          cover: bookData.cover
        });

        if (shelvesResponse.ok) {
          const shelvesData = await shelvesResponse.json();
          setShelves(shelvesData);
        }

        // Генерируем автоматический код экземпляра
        const instanceCode = `${bookData.isbn || bookId.slice(-6)}-${Date.now().toString().slice(-6)}`;
        setFormData(prev => ({ ...prev, instanceCode }));
      } catch (error) {
        console.error("Ошибка загрузки данных", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookId]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.instanceCode.trim()) {
      newErrors.instanceCode = 'Код экземпляра обязателен';
    }

    if (!formData.status.trim()) {
      newErrors.status = 'Статус обязателен';
    }

    if (!formData.condition.trim()) {
      newErrors.condition = 'Состояние обязательно';
    }

    if (!formData.dateAcquired) {
      newErrors.dateAcquired = 'Дата поступления обязательна';
    }

    if (formData.purchasePrice !== undefined && formData.purchasePrice < 0) {
      newErrors.purchasePrice = 'Цена не может быть отрицательной';
    }

    if (formData.position !== undefined && formData.position < 0) {
      newErrors.position = 'Позиция не может быть отрицательной';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему заново.');
      }

      const response = await fetch(`${baseUrl}/api/BookInstance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Ошибка при создании экземпляра');
      }

      // Уведомляем другие компоненты об изменении экземпляров
      window.dispatchEvent(new CustomEvent('bookInstancesUpdated', { 
        detail: { bookId, action: 'create', count: 1 } 
      }));

      toast({
        title: "Успешно",
        description: "Экземпляр книги успешно создан"
      });

      router.push(`/admin/books/${bookId}/instances`);
    } catch (error) {
      console.error("Ошибка создания экземпляра", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать экземпляр книги",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BookInstanceCreateDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">Книга не найдена</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="container mx-auto p-6">
        {/* Header */}
        <FadeInView>
          <motion.div 
            className="sticky top-0 z-10 bg-white border border-gray-100 p-6 rounded-xl shadow-md mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/admin/books/${bookId}/instances`}>
                  <motion.button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md border"
                    whileHover={{
                      y: -3,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Назад к экземплярам
                  </motion.button>
                </Link>
                
                <div className="flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-500" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Создать экземпляр</h1>
                    <p className="text-gray-600">{book.title}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </FadeInView>

        {/* Book Info */}
        <FadeInView delay={0.1}>
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-4">
              {book.cover && (
                <div className="w-16 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={book.cover} 
                    alt={book.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-800">{book.title}</h2>
                <p className="text-gray-600">{book.authors}</p>
                <p className="text-sm text-gray-500">ISBN: {book.isbn}</p>
              </div>
            </div>
          </motion.div>
        </FadeInView>

        {/* Create Form */}
        <FadeInView delay={0.2}>
          <motion.div 
            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Основная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Barcode className="w-4 h-4 inline mr-1" />
                    Код экземпляра *
                  </label>
                  <input
                    type="text"
                    value={formData.instanceCode}
                    onChange={(e) => handleInputChange('instanceCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 ${
                      errors.instanceCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Введите код экземпляра"
                  />
                  {errors.instanceCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.instanceCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Статус *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 ${
                      errors.status ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="Доступна">Доступна</option>
                    <option value="Выдана">Выдана</option>
                    <option value="Зарезервирована">Зарезервирована</option>
                    <option value="На обслуживании">На обслуживании</option>
                    <option value="Утеряна">Утеряна</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Состояние *
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => handleInputChange('condition', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 ${
                      errors.condition ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="Отличное">Отличное</option>
                    <option value="Хорошее">Хорошее</option>
                    <option value="Удовлетворительное">Удовлетворительное</option>
                    <option value="Плохое">Плохое</option>
                    <option value="Требует ремонта">Требует ремонта</option>
                  </select>
                  {errors.condition && (
                    <p className="mt-1 text-sm text-red-600">{errors.condition}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Дата поступления *
                  </label>
                  <input
                    type="date"
                    value={formData.dateAcquired ? formData.dateAcquired.split('T')[0] : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const isoString = value ? new Date(value + 'T00:00:00Z').toISOString() : undefined;
                      handleInputChange('dateAcquired', isoString);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 ${
                      errors.dateAcquired ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateAcquired && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateAcquired}</p>
                  )}
                </div>
              </div>

              {/* Дополнительная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Цена покупки (₽)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 ${
                      errors.purchasePrice ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Введите цену покупки"
                  />
                  {errors.purchasePrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Местоположение
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500"
                    placeholder="Укажите местоположение"
                  />
                </div>

                {shelves.length > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Полка
                      </label>
                      <select
                        value={formData.shelfId || ''}
                        onChange={(e) => handleInputChange('shelfId', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                      >
                        <option value="">Выберите полку</option>
                        {shelves.map(shelf => (
                          <option key={shelf.id} value={shelf.id}>
                            {shelf.category} - Полка #{shelf.shelfNumber}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Позиция на полке
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.position || ''}
                        onChange={(e) => handleInputChange('position', e.target.value ? parseInt(e.target.value) : undefined)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 ${
                          errors.position ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Позиция на полке"
                      />
                      {errors.position && (
                        <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Примечания */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Примечания
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500"
                  placeholder="Дополнительные примечания к экземпляру"
                />
              </div>

              {/* Активность */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Экземпляр активен
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <motion.button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg px-6 py-3 flex items-center gap-2 shadow-md"
                  whileHover={!submitting ? {
                    y: -2,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                  } : {}}
                  whileTap={!submitting ? { scale: 0.98 } : {}}
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {submitting ? 'Создание...' : 'Создать экземпляр'}
                </motion.button>

                <Link href={`/admin/books/${bookId}/instances`}>
                  <motion.button
                    type="button"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg px-6 py-3 border shadow-md"
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Отмена
                  </motion.button>
                </Link>
              </div>
            </form>
          </motion.div>
        </FadeInView>
      </div>
    </div>
  );
} 