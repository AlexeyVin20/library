'use client';

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, CheckCircle, XCircle, Clock, Book, User, Calendar, FileText, Printer, Mail, Phone, BookOpen, ArrowRight, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Book as BookComponent } from "@/components/ui/book";

interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  bookInstanceId?: string; // Новое поле для связи с экземпляром книги
  reservationDate: string;
  expirationDate: string;
  actualReturnDate?: string; // Новое поле для фактической даты возврата
  status: string;
  originalStatus?: string; // Оригинальный статус для операций
  notes?: string;
  user?: {
    fullName: string;
    email?: string;
    phone?: string;
    address?: string;
    registrationDate?: string;
  };
  book?: {
    title: string;
    authors?: string;
    isbn?: string;
    publishYear?: number;
    category?: string;
    cover?: string;
    availableCopies?: number;
  };
  bookInstance?: { // Новое поле для информации об экземпляре
    id: string;
    instanceCode: string;
    status: string;
    condition: string;
    location?: string;
    shelf?: {
      id: number;
      category: string;
      shelfNumber: number;
    };
    position?: number;
    notes?: string;
  };
}

// Компонент для анимированного появления
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) => {
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration,
    delay,
    ease: [0.22, 1, 0.36, 1]
  }}>
      {children}
    </motion.div>;
};

// Компонент для информационного поля
const InfoField = ({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) => {
  return <motion.div className="bg-gray-100 rounded-xl p-3 border border-gray-300 shadow-sm" whileHover={{
    y: -3,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
  }} transition={{
    duration: 0.2
  }}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="font-medium text-gray-800">{label}</span>
      </div>
      <span className="text-gray-800">{value}</span>
    </motion.div>;
};

// Компонент для вкладок (анимированный, как на главной)
const AnimatedTabsTrigger = ({
  value,
  icon,
  label,
  isActive
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}) => {
  return <TabsTrigger value={value} className={`relative transition-colors
        ${isActive ? 'bg-transparent text-gray-800 shadow-md' : ''}
        rounded-lg px-3 py-2
      `}>
      <div className="flex items-center gap-2">
        <span className={isActive ? "text-blue-700" : "text-gray-500"}>{icon}</span>
        <span>{label}</span>
      </div>
      {isActive && <motion.div layoutId="activeReservationTabDetails" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.3
    }} />}
    </TabsTrigger>;
};

// Вспомогательные функции для статусов
const getStatusIcon = (status: string) => {
  switch (status) {
    case "Обрабатывается":
      return <Clock className="w-5 h-5 text-blue-500" />;
    case "Одобрена":
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case "Отменена":
      return <XCircle className="w-5 h-5 text-red-600" />;
    case "Истекла":
      return <Clock className="w-5 h-5 text-orange-500" />;
    case "Выдана":
      return <ArrowRight className="w-5 h-5 text-blue-700" />;
    case "Возвращена":
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case "Просрочена":
      return <XCircle className="w-5 h-5 text-red-600" />;
    case "Отменена_пользователем":
      return <XCircle className="w-5 h-5 text-gray-600" />;
    default:
      return <Clock className="w-5 h-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Обрабатывается":
      return "bg-blue-500 hover:bg-blue-600";
    case "Одобрена":
      return "bg-green-500 hover:bg-green-600";
    case "Отменена":
      return "bg-red-500 hover:bg-red-600";
    case "Истекла":
      return "bg-orange-500 hover:bg-orange-600";
    case "Выдана":
      return "bg-blue-700 hover:bg-blue-800";
    case "Возвращена":
      return "bg-green-600 hover:bg-green-700";
    case "Просрочена":
      return "bg-red-600 hover:bg-red-700";
    case "Отменена_пользователем":
      return "bg-gray-600 hover:bg-gray-700";
    default:
      return "bg-gray-500 hover:bg-gray-600";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "Обрабатывается":
      return "В обработке";
    case "Одобрена":
      return "Одобрена";
    case "Отменена":
      return "Отменена";
    case "Истекла":
      return "Истекла";
    case "Выдана":
      return "Выдана";
    case "Возвращена":
      return "Возвращена";
    case "Просрочена":
      return "Просрочена";
    case "Отменена_пользователем":
      return "Отменена пользователем";
    default:
      return "Неизвестно";
  }
};

// Функции для определения типа статуса
const isSystemStatus = (status: string): boolean => {
  const systemStatuses = [
    "Обрабатывается",    // Устанавливается при создании резервирования
    "Истекла",           // Устанавливается автоматически при истечении срока бронирования
    "Просрочена",        // Устанавливается автоматически при просрочке возврата
    "Отменена_пользователем" // Устанавливается пользователем через интерфейс
  ];
  return systemStatuses.includes(status);
};

const isAdministrativeStatus = (status: string): boolean => {
  const administrativeStatuses = [
    "Одобрена",          // Библиотекарь одобряет резервирование
    "Отменена",          // Библиотекарь отменяет резервирование
    "Выдана",            // Библиотекарь выдает книгу
    "Возвращена"         // Библиотекарь принимает возврат
  ];
  return administrativeStatuses.includes(status);
};

// Компонент кнопки помощи для статусов
const StatusHelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Закрытие при клике вне элемента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-help-button')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative status-help-button mb-8">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm border border-blue-300"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Справка по статусам</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 min-w-[500px] max-w-[600px]"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-lg font-semibold text-gray-800">Типы статусов резервирования</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Административные статусы
                  </h5>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-green-700">Одобрена</strong>
                        <p className="text-xs text-gray-600">Библиотекарь одобряет резервирование</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-red-700">Отменена</strong>
                        <p className="text-xs text-gray-600">Библиотекарь отменяет резервирование</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-blue-700">Выдана</strong>
                        <p className="text-xs text-gray-600">Библиотекарь выдает книгу</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-green-700">Возвращена</strong>
                        <p className="text-xs text-gray-600">Библиотекарь принимает возврат</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-orange-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Системные статусы
                  </h5>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-blue-700">В обработке</strong>
                        <p className="text-xs text-gray-600">При создании резервирования</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-orange-700">Истекла</strong>
                        <p className="text-xs text-gray-600">Автоматически при истечении срока</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-red-700">Просрочена</strong>
                        <p className="text-xs text-gray-600">Автоматически при просрочке возврата</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-700">Отменена пользователем</strong>
                        <p className="text-xs text-gray-600">Пользователь отменил резервирование</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-600">
                    <strong>Важно:</strong> Системные статусы устанавливаются автоматически и не могут быть изменены вручную. 
                    Только административные статусы доступны для ручного изменения библиотекарем.
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <p className="text-xs text-red-600">
                    <strong>Штрафы:</strong> За просроченные резервирования начисляется штраф 10 рублей за каждый день просрочки. 
                    Начисление штрафа НЕ означает автоматический возврат книги - это отдельные операции.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Компонент для переключения статусов
const StatusSwitcher = ({ 
  currentStatus, 
  onStatusChange,
  availableCopies = 1 // По умолчанию считаем что книга доступна
}: { 
  currentStatus: string; 
  onStatusChange: (status: string) => void;
  availableCopies?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Закрытие при клике вне элемента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-switcher')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Только административные статусы доступны для ручного изменения
  const administrativeStatusOptions = [
    { value: "Одобрена", label: "Одобрена", icon: <CheckCircle className="w-4 h-4" />, color: "bg-green-500" },
    { value: "Отменена", label: "Отменена", icon: <XCircle className="w-4 h-4" />, color: "bg-red-500" },
    { value: "Выдана", label: "Выдана", icon: <ArrowRight className="w-4 h-4" />, color: "bg-blue-700" },
    { value: "Возвращена", label: "Возвращена", icon: <CheckCircle className="w-4 h-4" />, color: "bg-green-600" }
  ];

  // Все статусы для отображения информации
  const allStatusOptions = [
    { value: "Обрабатывается", label: "В обработке", icon: <Clock className="w-4 h-4" />, color: "bg-blue-500", type: "system" },
    { value: "Одобрена", label: "Одобрена", icon: <CheckCircle className="w-4 h-4" />, color: "bg-green-500", type: "admin" },
    { value: "Отменена", label: "Отменена", icon: <XCircle className="w-4 h-4" />, color: "bg-red-500", type: "admin" },
    { value: "Истекла", label: "Истекла", icon: <Clock className="w-4 h-4" />, color: "bg-orange-500", type: "system" },
    { value: "Выдана", label: "Выдана", icon: <ArrowRight className="w-4 h-4" />, color: "bg-blue-700", type: "admin" },
    { value: "Возвращена", label: "Возвращена", icon: <CheckCircle className="w-4 h-4" />, color: "bg-green-600", type: "admin" },
    { value: "Просрочена", label: "Просрочена", icon: <XCircle className="w-4 h-4" />, color: "bg-red-600", type: "system" },
    { value: "Отменена_пользователем", label: "Отменена пользователем", icon: <XCircle className="w-4 h-4" />, color: "bg-gray-600", type: "system" }
  ];

  return (
    <div className="relative status-switcher">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`${getStatusColor(currentStatus)} text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md`}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
      >
        {getStatusIcon(currentStatus)}
        <span>{getStatusLabel(currentStatus)}</span>
        {isSystemStatus(currentStatus) && (
          <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full ml-1">
            Системный
          </span>
        )}
        <Settings className="w-4 h-4 ml-1" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 min-w-[280px]"
          >
          <div className="p-2">
            <div className="text-sm font-medium text-gray-600 px-3 py-2 border-b border-gray-200">
              Изменить статус
            </div>
            
            {/* Административные статусы */}
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Административные статусы
              </div>
              {administrativeStatusOptions.map((option) => {
                // Проверяем, заблокирован ли статус "Выдана" из-за отсутствия экземпляров
                const isBlocked = option.value === "Выдана" && availableCopies === 0;
                
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => {
                      if (!isBlocked) {
                        onStatusChange(option.value);
                        setIsOpen(false);
                      }
                    }}
                    disabled={isBlocked}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                      isBlocked 
                        ? 'cursor-not-allowed opacity-50 bg-gray-50' 
                        : option.value === currentStatus 
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    whileHover={!isBlocked ? { x: 5 } : {}}
                  >
                    <span className={
                      isBlocked 
                        ? "text-gray-400" 
                        : option.value === currentStatus 
                          ? "text-blue-700" 
                          : "text-gray-500"
                    }>
                      {option.icon}
                    </span>
                    <span className="text-sm flex-1">{option.label}</span>
                    {isBlocked && (
                      <span className="text-xs text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                        Нет экземпляров
                      </span>
                    )}
                    {option.value === currentStatus && !isBlocked && (
                      <CheckCircle className="w-4 h-4 text-blue-700 ml-auto" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Разделитель */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Системные статусы (только для информации) */}
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-orange-600 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Системные статусы (автоматические)
              </div>
              {allStatusOptions
                .filter(option => option.type === "system")
                .map((option) => (
                  <div
                    key={option.value}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${
                      option.value === currentStatus ? 'bg-orange-50 text-orange-700' : 'text-gray-500'
                    } cursor-not-allowed opacity-75`}
                  >
                    <span className={option.value === currentStatus ? "text-orange-700" : "text-gray-400"}>
                      {option.icon}
                    </span>
                    <span className="text-sm">{option.label}</span>
                    {option.value === currentStatus && (
                      <CheckCircle className="w-4 h-4 text-orange-700 ml-auto" />
                    )}
                  </div>
                ))}
              <div className="text-xs text-gray-500 mt-2 px-3">
                💡 Системные статусы устанавливаются автоматически
              </div>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ReservationDetailsPage({
  params
}: {
  params: Promise<{
    reservationId: string;
  }>;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null); // Отдельное состояние для данных пользователя
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  // Получаем params через React.use
  const actualParams = React.use(params);
  const reservationId = actualParams.reservationId;

  useEffect(() => {
    if (reservationId) {
      fetchReservation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Получаем базовое резервирование
      const response = await fetch(`${baseUrl}/api/Reservation/${reservationId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Резервирование не найдено");
        }
        throw new Error("Ошибка при загрузке резервирования");
      }
      const baseReservation: Reservation = await response.json();
      let finalReservation = {
        ...baseReservation
      };
      let bookDetails = null;
      let fullUserDetails = null;
      
      try {
        // 2. Запрашиваем полные детали книги
        if (baseReservation.bookId) {
          const bookRes = await fetch(`${baseUrl}/api/books/${baseReservation.bookId}`);
          if (bookRes.ok) {
            bookDetails = await bookRes.json();
          } else {
            console.warn(`Не удалось загрузить книгу ${baseReservation.bookId}`);
          }
        }

        // 3. Запрашиваем полные детали пользователя
        if (baseReservation.userId) {
          const userRes = await fetch(`${baseUrl}/api/User/${baseReservation.userId}`);
          if (userRes.ok) {
            fullUserDetails = await userRes.json();
            setUserDetails(fullUserDetails); // Сохраняем отдельно для гарантированного доступа
          } else {
            console.warn(`Не удалось загрузить пользователя ${baseReservation.userId}`);
          }
        }

        // 4. Объединяем все данные
        finalReservation = {
          ...baseReservation,
          originalStatus: baseReservation.status, // Сохраняем оригинальный статус
          book: bookDetails ? {
            ...baseReservation.book,
            ...bookDetails
          } : baseReservation.book,
          user: fullUserDetails ? {
            ...baseReservation.user,
            ...fullUserDetails
          } : baseReservation.user
        };
      } catch (err) {
        console.error(`Ошибка при дозагрузке данных для резервирования ${reservationId}:`, err);
        // Если дозагрузка не удалась, показываем хотя бы базовые данные
      }
      
      // Устанавливаем резервирование с правильным отображаемым статусом
      setReservation({
        ...finalReservation,
        status: getDisplayStatus(finalReservation)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке резервирования");
      setReservation(null);
    } finally {
      setLoading(false);
    }
  };

  // Функция для правильного форматирования дат для PostgreSQL
  const formatDateForPostgres = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!reservation) return;
    
    // Проверяем, что новый статус является административным
    if (isSystemStatus(newStatus)) {
      toast({
        title: "Ошибка",
        description: "Нельзя вручную установить системный статус. Системные статусы устанавливаются автоматически",
        variant: "destructive",
      });
      return;
    }
    
    // Проверяем доступность экземпляров для статуса "Выдана"
    if (newStatus === "Выдана" && (reservation.book?.availableCopies || 0) === 0) {
      toast({
        title: "Ошибка",
        description: "Нельзя выдать книгу: все экземпляры заняты. Дождитесь возврата хотя бы одного экземпляра",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Получаем токен авторизации
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Токен авторизации не найден. Пожалуйста, войдите в систему заново.");
      }

      // Упрощенный подход - backend теперь сам управляет экземплярами
      const updatedReservation = {
        ...reservation,
        reservationDate: new Date(reservation.reservationDate).toISOString(),
        expirationDate: new Date(reservation.expirationDate).toISOString(),
        actualReturnDate: reservation.actualReturnDate ? new Date(reservation.actualReturnDate).toISOString() : null,
        status: newStatus
      };
      
      // Удаляем поля, которые не нужны для API
      delete updatedReservation.originalStatus;
      delete updatedReservation.user;
      delete updatedReservation.book;
      delete updatedReservation.bookInstance;
      
      const response = await fetch(`${baseUrl}/api/Reservation/${reservation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedReservation)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Ошибка при обновлении статуса");
      }
      
      // Перезагружаем данные резервирования чтобы получить обновленную информацию об экземпляре
      await fetchReservation();
      
      // Отправляем событие для обновления других компонентов
      window.dispatchEvent(new CustomEvent('instanceStatusUpdate'));
      
      console.log(`Статус изменен с ${reservation.status} на ${newStatus}`);
      
      // Показываем уведомление об успехе
      toast({
        title: "Статус обновлен",
        description: `Статус резервирования изменен на "${newStatus}"`,
        variant: "default",
      });
      
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err);
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при обновлении статуса",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Функция для генерации и скачивания HTML документа
  const generateFormular = async () => {
    if (!reservation) return;

    // Используем уже загруженные данные пользователя или загружаем заново если нужно
    let userData = userDetails;
    if (!userData) {
      try {
        const userResponse = await fetch(`${baseUrl}/api/User/${reservation.userId}`);
        if (userResponse.ok) {
          userData = await userResponse.json();
        } else {
          console.warn(`Не удалось загрузить данные пользователя для формуляра: ${reservation.userId}`);
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
      }
    }

    // Используем полученные данные или данные из резервирования
    const user = userData || reservation.user || {};

    // Стилизация в соответствии с новой цветовой схемой
    const styles = `
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #1F2937;
          background-color: #E5E7EB;
          padding: 20px;
          max-width: 550px;
          margin: 0 auto;
          border: 1px solid #3B82F6;
          border-radius: 8px;
          font-size: 12px;
        }
        h1, h2, h3 {
          color: #2563EB;
        }
        h1 {
          text-align: center;
          border-bottom: 2px solid #3B82F6;
          padding-bottom: 5px;
          margin-bottom: 10px;
          font-size: 16px;
        }
        h2 {
          background-color: #93C5FD;
          padding: 3px 8px;
          border-radius: 5px;
          display: inline-block;
          font-size: 14px;
        }
        h3 {
          margin-top: 10px;
          margin-bottom: 5px;
          border-bottom: 1px solid #3B82F6;
          padding-bottom: 3px;
          font-size: 13px;
        }
        p {
          margin: 3px 0;
          line-height: 1.3;
        }
        strong {
          color: #2563EB;
        }
        .section {
          margin-bottom: 10px;
          padding: 8px;
          background-color: #FFFFFF;
          border: 1px solid #93C5FD;
          border-radius: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .signature-section {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #3B82F6;
          display: flex;
          justify-content: space-between;
        }
        .signature-block {
          width: 45%;
        }
        .signature-line {
          margin-top: 30px;
          border-top: 1px solid #aaa;
          padding-top: 3px;
        }
        .header-info {
          text-align: right;
          font-size: 10px;
          margin-bottom: 10px;
          color: #6B7280;
        }
        @media print {
          @page {
            size: A5;
            margin: 10mm;
          }
          body {
            background-color: white;
            border: none;
            padding: 10px;
            width: 100%;
            height: 100%;
          }
          .no-print {
            display: none;
          }
          .section {
            border: 1px solid #eee;
            box-shadow: none;
          }
          .header-info {
            display: none;
          }
          button {
            display: none;
          }
        }
      </style>
    `;

    // HTML содержимое
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <title>Формуляр книги #${reservation.id}</title>
        ${styles}
      </head>
      <body>
        <div class="header-info no-print">
          <p>Дата формирования: ${new Date().toLocaleString("ru-RU")}</p>
        </div>

        <h1>Формуляр книги</h1>

        <div class="section">
          <h3>Информация о книге</h3>
          <p><strong>Название:</strong> ${reservation.book?.title || "Не указано"}</p>
          <p><strong>Автор:</strong> ${reservation.book?.authors || "Не указан"}</p>
          ${reservation.book?.isbn ? `<p><strong>ISBN:</strong> ${reservation.book.isbn}</p>` : ''}
          ${reservation.book?.publishYear ? `<p><strong>Год издания:</strong> ${reservation.book.publishYear}</p>` : ''}
          ${reservation.book?.category ? `<p><strong>Категория:</strong> ${reservation.book.category}</p>` : ''}
        </div>

        <div class="section">
          <h3>Информация о читателе</h3>
          <p><strong>ФИО:</strong> ${user.fullName || "Не указано"}</p>
          <p><strong>Email:</strong> ${user.email || "Не указано"}</p>
          <p><strong>Телефон:</strong> ${user.phone || "Не указано"}</p>
        </div>

        <div class="section">
          <h3>Детали выдачи</h3>
          <p><strong>Дата выдачи:</strong> ${formatDate(reservation.reservationDate)}</p>
          <p><strong>Дата возврата:</strong> ${formatDate(reservation.expirationDate)}</p>
        </div>

        <div class="section no-print">
          <h3>Примечания</h3>
          <p>${reservation.notes || "Нет дополнительных примечаний"}</p>
        </div>

        <div class="signature-section">
          <div class="signature-block">
            <p>Библиотекарь:</p>
            <div class="signature-line"></div>
            <p>______________________</p>
          </div>
          <div class="signature-block">
            <p>Читатель:</p>
            <div class="signature-line"></div>
            <p>${user.fullName || "______________________"}</p>
          </div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="background-color: #3B82F6; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
            Распечатать формуляр
          </button>
        </div>
      </body>
      </html>
    `;

    // Создаем Blob с HTML содержимым
    const blob = new Blob([htmlContent], {
      type: 'text/html;charset=utf-8'
    });

    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Формуляр_книги_${reservation.id}.html`;

    // Имитируем клик для запуска скачивания
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Автоматическое изменение статуса на "Выдана" после печати, если текущий статус "Одобрена"
    if (reservation.status === "Одобрена") {
      handleStatusChange("Выдана");
    }
  };

  // Функция для определения приоритетного статуса с учетом просрочки
  const getDisplayStatus = (reservation: Reservation) => {
    const now = new Date();
    const expirationDate = new Date(reservation.expirationDate);
    const actualStatus = reservation.originalStatus || reservation.status;
    
    // Если срок истек, приоритет у просроченных статусов
    if (expirationDate < now) {
      // Если книга была выдана и просрочена
      if (actualStatus === 'Выдана') {
        return 'Просрочена';
      }
      // Если резервирование не было выдано и срок истек
      if (actualStatus === 'Обрабатывается' || actualStatus === 'Одобрена') {
        return 'Истекла';
      }
      // Для уже завершенных статусов (Возвращена, Отменена и т.д.) оставляем как есть
    }
    
    return actualStatus;
  };

  // Отображаемый статус с учетом логики статусов
  const displayStatus = reservation ? getDisplayStatus(reservation) : null;

  // Функция начисления штрафа
  const handleFineCalculation = async () => {
    if (!reservation) return;
    
    const now = new Date();
    const expirationDate = new Date(reservation.expirationDate);
    
    // Проверяем, что книга действительно просрочена
    if (expirationDate >= now) {
      toast({
        title: "Ошибка",
        description: "Штраф можно начислить только за просроченные резервирования",
        variant: "destructive",
      });
      return;
    }
    
    // Вычисляем количество дней просрочки
    const overdueDays = Math.ceil((now.getTime() - expirationDate.getTime()) / (1000 * 60 * 60 * 24));
    const fineAmount = overdueDays * 10; // 10 рублей за день
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Токен авторизации не найден. Пожалуйста, войдите в систему заново.");
      }

      // Отправляем запрос на начисление штрафа согласно новой API документации
      const response = await fetch(`${baseUrl}/api/User/${reservation.userId}/fine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          amount: fineAmount,
          reason: `Просрочка возврата книги "${reservation.book?.title}" на ${overdueDays} дней`,
          overdueDays: overdueDays,
          fineType: "Overdue",
          notes: "Начислено автоматически через интерфейс администратора"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Ошибка при начислении штрафа");
      }

      const result = await response.json();
      toast({
        title: "Штраф начислен",
        description: `Сумма: ${result.amount}₽. Общая задолженность: ${result.totalFineAmount}₽`,
        variant: "default",
      });
      
    } catch (err) {
      console.error("Ошибка при начислении штрафа:", err);
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Ошибка при начислении штрафа",
        variant: "destructive",
      });
    }
  };

  return <div className="min-h-screen bg-gray-200">
      <div className="container mx-auto p-6">
        {/* Header */}
        <FadeInView>
          <div className="mb-8 flex items-center gap-4">
            <motion.div initial={{
            x: -20,
            opacity: 0
          }} animate={{
            x: 0,
            opacity: 1
          }} transition={{
            duration: 0.5
          }}>
              <Link href="/admin/reservations" className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors">
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium text-gray-800">Назад к резервированиям</span>
              </Link>
            </motion.div>

            <motion.h1 initial={{
            opacity: 0,
            y: -20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.1
          }} className="text-3xl font-bold text-gray-800">
              Детали резервирования
            </motion.h1>
          </div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          {error && <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </motion.div>}

          {loading ? <div className="flex justify-center items-center py-12">
              <motion.div animate={{
            rotate: 360
          }} transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear"
          }} className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
            </div> : !reservation ? <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg">
              Резервирование не найдено
            </motion.div> : <motion.div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-300" whileHover={{
          boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)"
        }}>
                            {/* Предупреждение о недоступности книги для выдачи */}
              {reservation.book?.availableCopies === 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-medium text-orange-800 mb-1">Книга недоступна для физической выдачи</h4>
                      <p className="text-sm text-orange-700">
                        Все экземпляры книги "{reservation.book?.title}" в настоящее время заняты. 
                        Статус "Выдана" нельзя установить до возврата хотя бы одного экземпляра.
                      </p>
                      <p className="text-xs text-orange-600 mt-2">
                        💡 Резервирование можно одобрить, но выдать книгу физически пока нельзя.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusSwitcher 
                    currentStatus={reservation.originalStatus || reservation.status} 
                    onStatusChange={handleStatusChange}
                    availableCopies={reservation.book?.availableCopies || 0}
                  />
                  {displayStatus !== reservation.status && (
                    <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      Отображается как: {getStatusLabel(displayStatus || '')}
                    </span>
                  )}
                  {(displayStatus === 'Просрочена' || displayStatus === 'Истекла') && (
                    <motion.div 
                      className="bg-red-100 border border-red-300 px-3 py-2 rounded-lg flex items-center gap-2"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Clock className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        Просрочено на {Math.ceil((new Date().getTime() - new Date(reservation.expirationDate).getTime()) / (1000 * 60 * 60 * 24))} дней
                      </span>
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Кнопка начисления штрафа - показывается только для просроченных резервирований */}
                  {(displayStatus === 'Просрочена' || displayStatus === 'Истекла') && (
                    <motion.button 
                      onClick={handleFineCalculation} 
                      className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" 
                      whileHover={{ y: -3 }} 
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span>Начислить штраф</span>
                    </motion.button>
                  )}
                  
                  <motion.button onClick={generateFormular} className="bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" whileHover={{
                y: -3
              }} whileTap={{
                scale: 0.98
              }}>
                    <Printer className="h-4 w-4" />
                    <span>Печать формуляра бронирования</span>
                  </motion.button>
                </div>
              </div>

              {/* Кнопка помощи для информации о статусах */}
              <StatusHelpButton />

              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
                <TabsList className="bg-white p-1 rounded-xl border border-gray-300 shadow-md text-gray-800">
                  <AnimatedTabsTrigger value="details" icon={<Book className="w-4 h-4" />} label="Детали книги" isActive={activeTab === "details"} />
                  <AnimatedTabsTrigger value="user" icon={<User className="w-4 h-4" />} label="Пользователь" isActive={activeTab === "user"} />
                </TabsList>

                <TabsContent value="details" className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="grid grid-cols-1 gap-4">
                        <InfoField label="Дата резервирования" value={formatDate(reservation.reservationDate)} icon={<Calendar className="h-4 w-4 text-blue-500" />} />
                        <InfoField label="Дата окончания" value={formatDate(reservation.expirationDate)} icon={<Calendar className="h-4 w-4 text-blue-500" />} />
                        {(displayStatus === 'Просрочена' || displayStatus === 'Истекла') && (
                          <motion.div 
                            className="bg-red-50 rounded-xl p-3 border border-red-200 shadow-sm" 
                            whileHover={{
                              y: -3,
                              boxShadow: "0 10px 25px -5px rgba(220, 38, 38, 0.1), 0 8px 10px -6px rgba(220, 38, 38, 0.05)"
                            }} 
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-red-500" />
                              <span className="font-medium text-red-800">Просрочено</span>
                            </div>
                            <span className="text-red-700 font-semibold">
                              {Math.ceil((new Date().getTime() - new Date(reservation.expirationDate).getTime()) / (1000 * 60 * 60 * 24))} дней
                            </span>
                          </motion.div>
                        )}
                        {reservation.book?.publishYear && <InfoField label="Год издания" value={reservation.book.publishYear.toString()} icon={<Calendar className="h-4 w-4 text-blue-500" />} />}
                        {reservation.book?.category && <InfoField label="Категория" value={reservation.book.category} icon={<Book className="h-4 w-4 text-blue-500" />} />}
                        {reservation.actualReturnDate && (
                          <InfoField 
                            label="Дата возврата" 
                            value={formatDate(reservation.actualReturnDate)} 
                            icon={<CheckCircle className="h-4 w-4 text-green-500" />} 
                          />
                        )}
                      </div>

                      {/* Информация об экземпляре книги */}
                      {reservation.bookInstance && (
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 mt-4">
                          <h3 className="text-lg font-medium mb-3 text-purple-800 flex items-center gap-2">
                            <Book className="h-5 w-5" />
                            Назначенный экземпляр
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InfoField 
                              label="Код экземпляра" 
                              value={reservation.bookInstance.instanceCode} 
                              icon={<FileText className="h-4 w-4 text-purple-500" />} 
                            />
                            <InfoField 
                              label="Состояние" 
                              value={reservation.bookInstance.condition} 
                              icon={<Settings className="h-4 w-4 text-purple-500" />} 
                            />
                            {reservation.bookInstance.location && (
                              <InfoField 
                                label="Расположение" 
                                value={reservation.bookInstance.location} 
                                icon={<FileText className="h-4 w-4 text-purple-500" />} 
                              />
                            )}
                            {reservation.bookInstance.shelf && (
                              <InfoField 
                                label="Полка" 
                                value={`${reservation.bookInstance.shelf.category} - ${reservation.bookInstance.shelf.shelfNumber}${reservation.bookInstance.position ? ` (поз. ${reservation.bookInstance.position})` : ''}`} 
                                icon={<Book className="h-4 w-4 text-purple-500" />} 
                              />
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-100 rounded-xl p-4 border border-gray-300 h-auto mt-4">
                        <h3 className="text-lg font-medium mb-3 text-gray-800">Примечания к резервированию</h3>
                        <p className="text-gray-800 text-sm">
                          {reservation.notes || "Нет дополнительных примечаний"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <motion.div 
                        className="mb-4 cursor-pointer"
                        onClick={() => router.push(`/admin/books/${reservation.bookId}`)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <BookComponent
                          color={reservation.book?.category === "Художественная литература" ? "#d97706" : 
                                reservation.book?.category === "Научная литература" ? "#2563eb" :
                                reservation.book?.category === "Техническая литература" ? "#059669" :
                                reservation.book?.category === "Образовательная литература" ? "#dc2626" :
                                "#6366f1"}
                          width={380}
                          depth={6}
                          texture={true}
                          // Растягиваем обложку на весь размер компонента
                          illustration={
                            reservation.book?.cover ? (
                              <div style={{ width: "100%", height: "100%" }}>
                                <Image 
                                  src={reservation.book.cover} 
                                  alt={reservation.book.title || "Обложка книги"} 
                                  fill
                                  className="object-cover w-full h-full"
                                  style={{ objectFit: "cover" }}
                                  sizes="380px"
                                  priority
                                />
                              </div>
                            ) : (
                              // Если нет обложки, показываем заглушку
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-lg font-semibold">
                                Нет обложки
                              </div>
                            )
                          }
                        >
                          {/* Добавим отображение названия и автора, если нет обложки */}
                          {!reservation.book?.cover && (
                            <div className="absolute bottom-0 left-0 w-full bg-white/80 px-3 py-2 text-center">
                              <div className="font-bold text-gray-800 truncate">{reservation.book?.title || "Без названия"}</div>
                              {reservation.book?.authors && (
                                <div className="text-xs text-gray-500 truncate">{reservation.book.authors}</div>
                              )}
                            </div>
                          )}
                        </BookComponent>
                      </motion.div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="user" className="pt-6">
                  <div className="bg-gray-100 rounded-xl p-6 border border-gray-300 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold mb-2 text-gray-800">
                          Информация о читателе
                        </h2>
                      </div>
                      <motion.button 
                        onClick={() => router.push(`/admin/users/${reservation.userId}`)} 
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" 
                        whileHover={{ y: -3 }} 
                        whileTap={{ scale: 0.98 }}
                      >
                        <User className="h-4 w-4" />
                        <span>Открыть профиль</span>
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoField 
                        label="Полное имя" 
                        value={userDetails?.fullName || reservation.user?.fullName || "Не указано"} 
                        icon={<User className="h-4 w-4 text-blue-500" />} 
                      />
                      <InfoField 
                        label="Email" 
                        value={userDetails?.email || reservation.user?.email || "Не указано"} 
                        icon={<Mail className="h-4 w-4 text-blue-500" />} 
                      />
                      <InfoField 
                        label="Телефон" 
                        value={userDetails?.phone || reservation.user?.phone || "Не указано"} 
                        icon={<Phone className="h-4 w-4 text-blue-500" />} 
                      />
                      {(userDetails?.registrationDate || reservation.user?.registrationDate) && (
                        <InfoField 
                          label="Дата регистрации" 
                          value={formatDate(userDetails?.registrationDate || reservation.user?.registrationDate || "")} 
                          icon={<Calendar className="h-4 w-4 text-blue-500" />} 
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>}
        </FadeInView>
      </div>
    </div>;
}