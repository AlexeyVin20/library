"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import Chart from "chart.js/auto"
import { BarChart3, Info } from 'lucide-react'

// Тип данных для ежемесячной статистики выдачи книг
interface MonthlyBorrowedData {
  month: string  // Название месяца
  borrowed: number  // Количество выданных книг
}

interface BorrowedBooksChartProps {
  data: MonthlyBorrowedData[]  // Массив данных по месяцам
}

export default function BorrowedBooksChart({ data }: BorrowedBooksChartProps) {
  // Реф для доступа к HTML-элементу canvas
  const chartRef = useRef<HTMLCanvasElement>(null)
  // Реф для хранения экземпляра графика Chart.js
  const chartInstance = useRef<Chart | null>(null)
  // Состояние для отображения подсказки
  const [showTooltip, setShowTooltip] = useState(false)

  // Вычисляем общее количество выданных книг
  const totalBorrowed = data.reduce((sum, item) => sum + item.borrowed, 0)
  // Находим месяц с максимальным количеством выдач
  const maxMonth = data.reduce((max, item) => item.borrowed > max.borrowed ? item : max, { month: '', borrowed: 0 })

  useEffect(() => {
    // Проверяем, что элемент canvas существует
    if (chartRef.current) {
      // Уничтожаем существующий график, если он есть
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      // Получаем контекст для рисования
      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        // Определяем, включен ли темный режим
        const isDarkMode = document.documentElement.classList.contains("dark")
        // Выбираем цвета в зависимости от темы
        const textColor = isDarkMode ? "#e5e7eb" : "#4b5563"
        const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.07)"
        const backgroundColor = isDarkMode ? "rgba(16, 185, 129, 0.6)" : "rgba(16, 185, 129, 0.7)"
        const borderColor = isDarkMode ? "rgba(16, 185, 129, 0.8)" : "rgba(16, 185, 129, 0.9)"
        const hoverColor = isDarkMode ? "rgba(16, 185, 129, 0.8)" : "rgba(16, 185, 129, 0.9)"

        // Создаем новый график
        chartInstance.current = new Chart(ctx, {
          // Тип графика - столбчатый
          type: "bar",
          data: {
            // Метки по оси X - названия месяцев
            labels: data.map((item) => item.month),
            datasets: [
              {
                label: "Выданные книги",
                // Данные по оси Y - количество выданных книг
                data: data.map((item) => item.borrowed),
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1,
                borderRadius: 8,
                hoverBackgroundColor: hoverColor,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              // Настройки легенды
              legend: {
                display: true,
                position: "top",
                labels: {
                  font: {
                    size: 12,
                    family: "'Inter', sans-serif",
                  },
                  color: textColor,
                },
              },
              // Настройки всплывающих подсказок
              tooltip: {
                backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.8)" : "rgba(17, 24, 39, 0.7)",
                titleFont: {
                  size: 14,
                  family: "'Inter', sans-serif",
                },
                bodyFont: {
                  size: 12,
                  family: "'Inter', sans-serif",
                },
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                  // Настраиваем текст подсказки
                  label: function(context) {
                    const value = context.raw as number;
                    return `Выдано книг: ${value}`;
                  },
                  // Добавляем процент от общего количества
                  afterLabel: function(context) {
                    const value = context.raw as number;
                    const percentage = totalBorrowed > 0 ? Math.round((value / totalBorrowed) * 100) : 0;
                    return `${percentage}% от общего числа`;
                  }
                }
              },
            },
            scales: {
              // Настройки оси X
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  color: textColor,
                  font: {
                    family: "'Inter', sans-serif",
                  },
                },
              },
              // Настройки оси Y
              y: {
                beginAtZero: true,
                grid: {
                  color: gridColor,
                },
                ticks: {
                  color: textColor,
                  font: {
                    family: "'Inter', sans-serif",
                  },
                  // Шаг делений на оси Y
                  stepSize: 1,
                  // Добавляем единицы измерения
                  callback: function(value) {
                    return value + ' шт.';
                  }
                },
              },
            },
            // Настройки анимации
            animation: {
              duration: 2000,
              easing: "easeOutQuart",
              // Задержка анимации для каждого столбца
              delay: (context) => {
                return context.dataIndex * 100
              },
            },
          },
        })
      }
    }

    // Функция очистки при размонтировании компонента
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, totalBorrowed]) // Зависимости эффекта

  return (
    <div className="relative w-full h-full">
      {/* Заголовок графика */}
      <div className="absolute top-0 left-0 p-4 z-10 flex items-center justify-between w-full">
        <div className="flex items-center">
          <BarChart3 className="w-5 h-5 text-emerald-500 mr-2" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Динамика выдачи книг</h3>
        </div>
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-gray-400 hover:text-emerald-500 transition-colors"
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <Info className="w-5 h-5" />
          </motion.button>
          
          {/* Информационная подсказка */}
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 top-full mt-2 p-3 bg-green dark:bg-green-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 w-64 z-20"
            >
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                График показывает количество выданных книг по месяцам.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>• Всего выдано: <span className="font-medium">{totalBorrowed} книг</span></p>
                {maxMonth.borrowed > 0 && (
                  <p>• Пик выдач: <span className="font-medium">{maxMonth.month} ({maxMonth.borrowed} книг)</span></p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Контейнер для графика с анимацией появления */}
      <motion.div
        className="w-full h-full flex items-center justify-center backdrop-blur-sm bg-green-500/10 dark:bg-green-800/10 p-4 pt-14 rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <canvas ref={chartRef} />
      </motion.div>
    </div>
  )
}
