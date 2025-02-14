import { clsx, type ClassValue } from "clsx"
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
