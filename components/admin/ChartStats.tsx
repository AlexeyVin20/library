"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import Chart from "chart.js/auto"
import { PieChart, Info } from "lucide-react"

// Интерфейс для пропсов компонента
interface ChartStatsProps {
  totalBooks: number // Общее количество книг
  recentBorrowed: number // Недавно добавленные книги
  totalBorrowed: number // Общее количество выданных книг
}

export default function ChartStats({ totalBooks, recentBorrowed, totalBorrowed }: ChartStatsProps) {
  // Реф для доступа к HTML-элементу canvas
  const chartRef = useRef<HTMLCanvasElement>(null)
  // Реф для хранения экземпляра графика Chart.js
  const chartInstance = useRef<Chart | null>(null)
  // Состояние для отображения подсказки
  const [showTooltip, setShowTooltip] = useState(false)

  // Вычисляем доступные книги
  const availableBooks = totalBooks - totalBorrowed

  // Вычисляем проценты для отображения в подсказке
  const availablePercentage = totalBooks > 0 ? Math.round((availableBooks / totalBooks) * 100) : 0
  const borrowedPercentage = totalBooks > 0 ? Math.round((totalBorrowed / totalBooks) * 100) : 0
  const recentPercentage = totalBooks > 0 ? Math.round((recentBorrowed / totalBooks) * 100) : 0

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
        // Выбираем цвета текста в зависимости от темы
        const textColor = isDarkMode ? "#e5e7eb" : "#4b5563"

        // Создаем новый график типа "пончик"
        chartInstance.current = new Chart(ctx, {
          type: "doughnut",
          data: {
            // Метки для сегментов
            labels: ["Доступно", "Выдано", "Недавно добавлено"],
            datasets: [
              {
                // Данные для сегментов
                data: [availableBooks, totalBorrowed, recentBorrowed],
                // Цвета фона сегментов с прозрачностью
                backgroundColor: [
                  isDarkMode ? "rgba(16, 185, 129, 0.6)" : "rgba(16, 185, 129, 0.7)", // Зеленый для доступных
                  isDarkMode ? "rgba(245, 158, 11, 0.6)" : "rgba(245, 158, 11, 0.7)", // Оранжевый для выданных
                  isDarkMode ? "rgba(59, 130, 246, 0.6)" : "rgba(59, 130, 246, 0.7)", // Синий для новых
                ],
                // Цвета границ сегментов
                borderColor: [
                  isDarkMode ? "rgba(16, 185, 129, 0.8)" : "rgba(16, 185, 129, 0.9)",
                  isDarkMode ? "rgba(245, 158, 11, 0.8)" : "rgba(245, 158, 11, 0.9)",
                  isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.9)",
                ],
                borderWidth: 1,
                hoverOffset: 15, // Смещение при наведении
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%", // Размер отверстия в "пончике"
            plugins: {
              // Настройки легенды
              legend: {
                position: "bottom",
                labels: {
                  padding: 20,
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
                  label: (context) => {
                    const value = context.raw as number
                    const total = context.chart.data.datasets[0].data.reduce((sum: number, val: any) => sum + val, 0)
                    const percentage = Math.round((value / total) * 100)
                    return `${context.label}: ${value} книг (${percentage}%)`
                  },
                },
              },
            },
            // Настройки анимации
            animation: {
              duration: 2000,
              easing: "easeOutQuart",
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
  }, [totalBooks, recentBorrowed, totalBorrowed, availableBooks]) // Зависимости эффекта

  return (
    <div className="relative w-full h-full">
      {/* Заголовок графика */}
      <div className="absolute top-0 left-0 p-4 z-10 flex items-center justify-between w-full">
        <div className="flex items-center">
          <PieChart className="w-5 h-5 text-emerald-500 mr-2" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Статистика книг</h3>
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
              className="absolute right-0 top-full mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 w-64 z-20"
            >
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                График показывает распределение книг в библиотеке.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
                  <p>
                    Доступно:{" "}
                    <span className="font-medium">
                      {availableBooks} книг ({availablePercentage}%)
                    </span>
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                  <p>
                    Выдано:{" "}
                    <span className="font-medium">
                      {totalBorrowed} книг ({borrowedPercentage}%)
                    </span>
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  <p>
                    Недавно добавлено:{" "}
                    <span className="font-medium">
                      {recentBorrowed} книг ({recentPercentage}%)
                    </span>
                  </p>
                </div>
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

