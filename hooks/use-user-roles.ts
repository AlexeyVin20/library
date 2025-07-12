import { useAuth } from "@/lib/auth"
import { useMemo } from "react"

// Интерфейс для проверки ролей
interface UserRoleCheck {
  hasShelfAccess: boolean
  isAdmin: boolean
  isLibrarian: boolean
  isEmployee: boolean
  allowedRoles: string[]
}

// Константы для ролей
const SHELF_ACCESS_ROLES = ['Библиотекарь', 'Сотрудник', 'Администратор']
const ADMIN_ROLES = ['Администратор']
const LIBRARIAN_ROLES = ['Библиотекарь']
const EMPLOYEE_ROLES = ['Сотрудник']

export const useUserRoles = (): UserRoleCheck => {
  const { user } = useAuth()
  
  const roleCheck = useMemo(() => {
    if (!user || !user.roles) {
      return {
        hasShelfAccess: false,
        isAdmin: false,
        isLibrarian: false,
        isEmployee: false,
        allowedRoles: []
      }
    }

    const userRoles = user.roles
    
    return {
      hasShelfAccess: userRoles.some(role => SHELF_ACCESS_ROLES.includes(role)),
      isAdmin: userRoles.some(role => ADMIN_ROLES.includes(role)),
      isLibrarian: userRoles.some(role => LIBRARIAN_ROLES.includes(role)),
      isEmployee: userRoles.some(role => EMPLOYEE_ROLES.includes(role)),
      allowedRoles: userRoles
    }
  }, [user])

  return roleCheck
}

// Вспомогательная функция для проверки конкретной роли
export const checkUserRole = (userRoles: string[], requiredRoles: string[]): boolean => {
  return userRoles.some(role => requiredRoles.includes(role))
}

// Вспомогательная функция для проверки доступа к полкам
export const hasShelfAccess = (userRoles: string[]): boolean => {
  return checkUserRole(userRoles, SHELF_ACCESS_ROLES)
} 