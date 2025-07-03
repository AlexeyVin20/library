import { useState, useEffect } from 'react';
import { USER_ROLES, UserRole, getRoleById } from '@/lib/types';

interface UseUserRolesProps {
  userId: string;
  initialRoles?: string[];
}

interface UserRoleWithLimits extends UserRole {
  isActive: boolean;
}

export function useUserRoles({ userId, initialRoles = [] }: UseUserRolesProps) {
  const [userRoles, setUserRoles] = useState<UserRoleWithLimits[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Получить текущие ограничения пользователя на основе его ролей
  const getCurrentLimits = () => {
    if (userRoles.length === 0) {
      return {
        maxBooksAllowed: USER_ROLES.GUEST.maxBooksAllowed,
        loanPeriodDays: USER_ROLES.GUEST.loanPeriodDays
      };
    }

    // Если у пользователя несколько ролей, берем максимальные значения
    const maxBooks = Math.max(...userRoles.map(role => role.maxBooksAllowed));
    const maxDays = Math.max(...userRoles.map(role => role.loanPeriodDays));

    return {
      maxBooksAllowed: maxBooks,
      loanPeriodDays: maxDays
    };
  };

  // Преобразовать названия ролей в объекты с ограничениями
  const processRoles = (roleNames: string[]) => {
    return roleNames
      .map(roleName => {
        const roleEntry = Object.values(USER_ROLES).find(role => role.name === roleName);
        if (roleEntry) {
          return {
            ...roleEntry,
            description: getRoleDescription(roleEntry.name),
            isActive: true
          } as UserRoleWithLimits;
        }
        return null;
      })
      .filter(Boolean) as UserRoleWithLimits[];
  };

  // Получить описание роли
  const getRoleDescription = (roleName: string): string => {
    switch (roleName) {
      case 'Администратор':
        return 'Полный доступ к системе, управление пользователями и настройками';
      case 'Библиотекарь':
        return 'Профессиональный работник библиотеки';
      case 'Сотрудник':
        return 'Расширенные права на библиотечные операции';
      case 'Гость':
        return 'Базовые права пользователя библиотеки';
      default:
        return 'Пользователь системы';
    }
  };

  // Обновить роли пользователя на сервере
  const updateUserLimits = async (limits: { maxBooksAllowed: number; loanPeriodDays: number }) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/User/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(limits),
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении ограничений пользователя');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Назначить роль пользователю
  const assignRole = async (roleId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/User/assign-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, roleId }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при назначении роли');
      }

      // Обновляем локальное состояние
      const role = getRoleById(roleId);
      if (role) {
        const newRole: UserRoleWithLimits = {
          ...role,
          description: getRoleDescription(role.name),
          isActive: true,
        };
        setUserRoles(prev => [...prev, newRole]);
        
        // Автоматически обновляем ограничения
        const newLimits = getCurrentLimits();
        await updateUserLimits(newLimits);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Удалить роль у пользователя
  const removeRole = async (roleId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/User/remove-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, roleId }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при удалении роли');
      }

      // Обновляем локальное состояние
      setUserRoles(prev => prev.filter(role => role.id !== roleId));
      
      // Автоматически обновляем ограничения
      const newLimits = getCurrentLimits();
      await updateUserLimits(newLimits);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Инициализация ролей
  useEffect(() => {
    if (initialRoles.length > 0) {
      const processedRoles = processRoles(initialRoles);
      setUserRoles(processedRoles);
    }
  }, [initialRoles]);

  return {
    userRoles,
    loading,
    error,
    getCurrentLimits,
    assignRole,
    removeRole,
    updateUserLimits,
    clearError: () => setError(null),
  };
} 