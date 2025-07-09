'use client';

import React from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Library, 
  Bell, 
  UserPlus, 
  FileText, 
  Shield, 
  Upload, 
  Mail,
  Search,
  Settings,
  Clock,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

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

// Компонент для карточки процесса
const ProcessCard = ({
  title,
  description,
  icon,
  steps,
  tips,
  relatedLinks,
  delay = 0
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: Array<{ title: string; description: string; fields?: string[] }>;
  tips?: string[];
  relatedLinks?: Array<{ label: string; href: string }>;
  delay?: number;
}) => {
  return (
    <FadeInView delay={delay}>
      <motion.div 
        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col border-2 border-blue-500"
        whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
      >
        {/* Заголовок карточки */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-500 text-xl">{icon}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>

        {/* Шаги процесса */}
        <div className="mb-6 flex-1">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Пошаговый процесс:</h4>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-800 mb-1">{step.title}</h5>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  {step.fields && (
                    <div className="ml-4">
                      <p className="text-xs font-medium text-gray-700 mb-1">Основные поля:</p>
                      <div className="flex flex-wrap gap-1">
                        {step.fields.map((field, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Советы */}
        {tips && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Полезные советы:
            </h4>
            <ul className="space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Связанные ссылки */}
        {relatedLinks && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Связанные разделы:</h4>
            <div className="flex flex-wrap gap-2">
              {relatedLinks.map((link, index) => (
                <Link key={index} href={link.href}>
                  <span className="text-xs text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </FadeInView>
  );
};

export default function HelpPage() {
  const processes = [
    {
      title: "Добавление книг",
      description: "Процесс добавления новых книг в библиотечную систему",
      icon: <BookOpen />,
      steps: [
        {
          title: "Переход к форме создания",
          description: "Перейдите в раздел 'Книги' → 'Создать книгу' для открытия формы добавления, или нажмите на кнопку 'Создать книгу' в меню",
        },
        {
          title: "Книгу можно добавить автоматически по фотографии листа с информацией",
          description: "Для этого необходимо загрузить фотографию листа с информацией и загрузить в форму сканирования сверху страницы",
          fields: ["Добавить книгу по фотографии"]
        },
        {
          title: "Вручную: заполните базовую информацию",
          description: "Заполните основные данные о книге",
          fields: ["Название", "Автор", "ISBN", "Издательство и город", "Год издания"]
        },
        {
          title: "Дополнительная информация",
          description: "Укажите категории, жанры, количество страниц и тд.",
          fields: ["Жанры", "Категоризация", "УДК и ББК", "Количество страниц", "Описание"]
        },
        {
          title: "Обложка и медиа",
          description: "Загрузите обложку книги из файла или укажите URL. Обложка автоматически ищется по названию книги и ISBN",
          fields: ["Обложка", "Предварительный просмотр", "Автоматический поиск обложки"]
        },
        {
          title: "Рядом с полем категоризации есть кнопка 'Рубрикатор'",
          description: "Выберите рубрику и нажмите на кнопку 'Добавить рубрику'",
          fields: ["Рубрикатор", "Добавить рубрику"]
        }
      ],
      tips: [
        "Используйте поиск по ISBN для автоматического заполнения данных",
        "Обложки автоматически ищутся на основе названия книги и ISBN",
        "Можно создать несколько экземпляров одной книги",
        "ИИ может помочь в заполнении полей по фотографии обложки",
        "Можно использовать рубрикатор для добавления рубрик к книге"
      ],
      relatedLinks: [
        { label: "Создать книгу", href: "/admin/books/create" },
        { label: "Управление полками", href: "/admin/shelfs" },
        { label: "Список книг", href: "/admin/books" }
      ]
    },
    {
      title: "Добавление пользователей",
      description: "Регистрация новых пользователей в системе библиотеки",
      icon: <UserPlus />,
      steps: [
        {
          title: "Создание учетной записи",
          description: "Заполните основную информацию о пользователе",
          fields: ["Имя пользователя", "Пароль", "ФИО", "Email", "Телефон"]
        },
        {
          title: "Назначение роли",
          description: "По умолчанию назначается роль 'Сотрудник' с правами на 30 книг на 60 дней",
          fields: ["Роль", "Максимум книг", "Период займа"]
        },
        {
            title: "Вы можете назначить пользователю дополнительные права",
            description: "Для этого необходимо выбрать роль из списка и нажать на кнопку 'Назначить роль'",
            fields: ["Роль", "Назначить роль"]
        },
        {
            title: "Просмотр пользователя",
            description: "Для просмотра пользователя необходимо нажать на кнопку 'Просмотр' в меню. Вы можете изменить данные пользователя, назначить новые права, сбросить пароль и посмотреть резервирования.",
            fields: ["Просмотр пользователя"]
        }
    
      ],
      tips: [
        "Пароль должен быть достаточно сложным для безопасности",
        "Email используется для отправки уведомлений",
        "Роли можно изменить позже через управление ролями",
        "Новые пользователи автоматически активны",
        "Пользоваетели, добавленные администратором, автоматически получают роль 'Сотрудник'", 
        "Пользователи, которые зарегистрировались самостоятельно, получают роль 'Гость'"
      ],
      relatedLinks: [
        { label: "Создать пользователя", href: "/admin/users/create" },
        { label: "Управление ролями", href: "/admin/roles" },
        { label: "Список пользователей", href: "/admin/users" }
      ]
    },
    {
      title: "Создание резервирований",
      description: "Бронирование книг для пользователей библиотеки",
      icon: <Calendar />,
      steps: [
        {
          title: "Выбор пользователя",
          description: "Найдите и выберите пользователя для резервирования",
          fields: ["Поиск пользователя", "ФИО", "Email"]
        },
        {
            title: "Резервирование можно создать со страницы книги",
            description: "Для этого необходимо нажать на кнопку 'Быстрое резервирование' в меню книги.",
            fields: ["Быстрое резервирование", "Пользователь", "Книга", "Дата резервирования"]
        },
        {
          title: "Выбор книги",
          description: "Найдите доступную книгу для резервирования",
          fields: ["Поиск книги", "Название", "Автор", "Доступность"]
        },
        {
          title: "Настройка резервирования",
          description: "Установите даты и дополнительные параметры",
          fields: ["Дата резервирования", "Срок действия", "Приоритет", "Заметки"]
        },
        {
          title: "Подтверждение",
          description: "Проверьте данные и создайте резервирование",
          fields: ["Статус", "Уведомления"]
        },
        {
            title: "Статусы резервирований можно изменить",
            description: "Для этого необходимо нажать на кнопку 'Изменить статус' в меню резервирования. Вы можете изменить статус на 'Одобрена', 'Выдана', 'Возвращена', 'Отменена', 'Истекла', 'Просрочена'.",
            fields: ["Изменить статус", "Статус"]
        }
      ],
      tips: [
        "Резервирование автоматически истекает через установленный срок",
        "Если доступной книги нет, то резервирование будет в очереди",
        "Можно добавить заметки для библиотекарей",
        "Можно посмотреть резервирования на странице пользователя"
      ],
      relatedLinks: [
        { label: "Создать резервирование", href: "/admin/reservations/create" },
        { label: "Список резервирований", href: "/admin/reservations" },
        { label: "Календарь", href: "/admin" }
      ]
    },
    {
      title: "Управление полками",
      description: "Организация и размещение книг на полках библиотеки",
      icon: <Library />,
      steps: [
        {
          title: "Создание полок",
          description: "Добавьте новую полку с указанием категории и вместимости",
          fields: ["Номер полки", "Категория", "Вместимость", "Позиция"]
        },
        {
          title: "Визуальное размещение",
          description: "Используйте визуальный редактор для размещения полок",
          fields: ["Координаты X/Y", "Размеры", "Проверка пересечений"]
        },
        {
          title: "Размещение книг",
          description: "Добавляйте книги и журналы на полки. Можно перетащить книгу на полку или нажать на полку и выбрать книгу.",
          fields: ["Поиск изданий", "Перетаскивание", "Позиции слотов"]
        },
        {
          title: "ИИ-организация",
          description: "Используйте автоматическую расстановку книг по категориям, либо рекомендации огранизации новых полок",
          fields: ["Автоматическая сортировка", "Предложения ИИ", "Оптимизация", "Рекомендации ИИ"]
        }
      ],
      tips: [
        "Используйте режим редактирования для перемещения полок",
        "ИИ может предложить оптимальное размещение книг",
        "Проверяйте пересечения полок при размещении",
        "Книги можно перемещать между полками простым перетаскиванием"
      ],
      relatedLinks: [
        { label: "Управление полками", href: "/admin/shelfs" },
        { label: "Добавить книгу", href: "/admin/books/create" },
        { label: "Статистика", href: "/admin/statistics" }
      ]
    },
    {
      title: "Отправка уведомлений",
      description: "Система уведомлений для пользователей библиотеки",
      icon: <Bell />,
      steps: [
        {
          title: "Выбор типа уведомления",
          description: "Определите тип сообщения и его приоритет. Вы можете выбрать тип уведомления из списка: 'Напоминание о возврате', 'Штрафы', 'Готовность резерва'.",
          fields: ["Тип уведомления", "Приоритет", "Категория"]
        },
        {
          title: "Выбор получателей",
          description: "Укажите пользователей или группы для отправки",
          fields: ["Отдельные пользователи", "Массовая рассылка", "Фильтры"]
        },
        {
          title: "Создание сообщения",
          description: "Напишите заголовок и текст уведомления",
          fields: ["Заголовок", "Сообщение", "Шаблоны"]
        },
      ],
      tips: [
        "Используйте шаблоны для типичных уведомлений",
        "Можно отправлять email и внутрисистемные сообщения",
        "Можно посмотреть отправленные уведомления на странице уведомлений"
      ],
      relatedLinks: [
        { label: "Центр уведомлений", href: "/admin/notifications" },
        { label: "Настройки", href: "/admin/settings" },
        { label: "Пользователи", href: "/admin/users" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-200 p-6">
      {/* Заголовок страницы */}
      <FadeInView>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Справка по работе с библиотечной системой
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Подробное руководство по основным бизнес-процессам библиотеки. 
            Здесь вы найдете пошаговые инструкции для работы с системой.
          </p>
        </div>
      </FadeInView>

      {/* Быстрая навигация */}
      <FadeInView delay={0.1}>
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-500 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Быстрая навигация
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {processes.map((process, index) => (
              <button
                key={index}
                onClick={() => document.getElementById(`process-${index}`)?.scrollIntoView({ behavior: 'smooth' })}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors text-center"
              >
                <span className="text-blue-500">{process.icon}</span>
                <span className="text-sm font-medium text-gray-800">{process.title}</span>
              </button>
            ))}
          </div>
        </div>
      </FadeInView>

      {/* Карточки процессов */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {processes.map((process, index) => (
          <div key={index} id={`process-${index}`}>
            <ProcessCard
              {...process}
              delay={0.2 + index * 0.1}
            />
          </div>
        ))}
      </div>

      {/* Дополнительная информация */}
      <FadeInView delay={0.8}>
        <div className="mt-12 bg-white rounded-xl p-6 shadow-lg border-2 border-green-500">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Дополнительная информация
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Права доступа</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• <strong>Администратор:</strong> Полный доступ ко всем функциям</li>
                <li>• <strong>Библиотекарь:</strong> Управление книгами, пользователями, резервированиями</li>
                <li>• <strong>Сотрудник:</strong> Просмотр книг, создание резервирований</li>
                <li>• <strong>Гость:</strong> Просмотр книг, создание резервирований</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Техническая поддержка</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• При возникновении ошибок проверьте подключение к интернету</li>
                <li>• Обращайтесь к системному администратору при технических проблемах</li>
              </ul>
            </div>
          </div>
        </div>
      </FadeInView>
    </div>
  );
} 