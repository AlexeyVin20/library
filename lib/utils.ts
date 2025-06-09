import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  return name
    .split(" ") // Разделить по пробелу
    .map((word) => word[0]?.toUpperCase()) // Взять первую букву каждого слова
    .join(""); // Соединить буквы
}

// Функция для форматирования больших чисел
export function formatNumber(num: number): string {
  if (num === 0) return "0";
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'М';
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'К';
  }
  
  return num.toLocaleString('ru-RU');
}
