"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, UserMinus, AlertCircle, CheckCircle2, Users, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserRoles } from '@/hooks/use-user-roles';
import { USER_ROLES, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface UserRoleManagerProps {
  userId: string;
  initialRoles?: string[];
  onRoleChanged?: () => void;
}

interface AvailableRole extends UserRole {
  isAssigned: boolean;
}

export default function UserRoleManager({ userId, initialRoles = [], onRoleChanged }: UserRoleManagerProps) {
  const { toast } = useToast();
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  
  const {
    userRoles,
    loading,
    error,
    getCurrentLimits,
    assignRole,
    removeRole,
    clearError
  } = useUserRoles({ userId, initialRoles });

  // Получаем список доступных ролей
  const availableRoles: AvailableRole[] = Object.values(USER_ROLES).map(role => ({
    ...role,
    description: getRoleDescription(role.name),
    isAssigned: userRoles.some(userRole => userRole.id === role.id)
  }));

  const filteredAvailableRoles = availableRoles.filter(role => !role.isAssigned);

  function getRoleDescription(roleName: string): string {
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
  }

  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      toast({
        title: "Ошибка",
        description: "Выберите роль для назначения",
        variant: "destructive",
      });
      return;
    }

    const success = await assignRole(selectedRoleId as number);
    if (success) {
      toast({
        title: "Успешно",
        description: "Роль назначена пользователю",
      });
      setSelectedRoleId('');
      setIsAssigningRole(false);
      onRoleChanged?.();
    } else {
      toast({
        title: "Ошибка",
        description: error || "Не удалось назначить роль",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRole = async (roleId: number) => {
    const roleToRemove = userRoles.find(role => role.id === roleId);
    if (!roleToRemove) return;

    const confirmed = window.confirm(`Вы уверены, что хотите удалить роль "${roleToRemove.name}" у пользователя?`);
    if (!confirmed) return;

    const success = await removeRole(roleId);
    if (success) {
      toast({
        title: "Успешно",
        description: "Роль удалена у пользователя",
      });
      onRoleChanged?.();
    } else {
      toast({
        title: "Ошибка",
        description: error || "Не удалось удалить роль",
        variant: "destructive",
      });
    }
  };

  const currentLimits = getCurrentLimits();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Управление ролями
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
              <Button 
                variant="link" 
                className="h-auto p-0 ml-2 text-red-800 underline"
                onClick={clearError}
              >
                Скрыть
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Текущие ограничения */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Текущие ограничения
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Макс. книг</span>
              </div>
              <span className="text-lg font-semibold text-gray-800">{currentLimits.maxBooksAllowed}</span>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Срок займа</span>
              </div>
              <span className="text-lg font-semibold text-gray-800">{currentLimits.loanPeriodDays} дней</span>
            </div>
          </div>
        </div>

        {/* Назначенные роли */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Назначенные роли
            </h3>
            <Button
              onClick={() => setIsAssigningRole(!isAssigningRole)}
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Добавить роль
            </Button>
          </div>

          <AnimatePresence>
            {isAssigningRole && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-blue-100 rounded-lg border border-blue-200"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-gray-800 text-sm">Выберите роль:</label>
                    <select
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(Number(e.target.value) || "")}
                      className="w-full p-2 rounded-lg bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Выберите роль</option>
                      {filteredAvailableRoles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name} (до {role.maxBooksAllowed} книг на {role.loanPeriodDays} дней)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAssigningRole(false)}
                    >
                      Отмена
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAssignRole}
                      disabled={loading || !selectedRoleId}
                    >
                      {loading ? "Назначение..." : "Назначить"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {userRoles.length > 0 ? (
              userRoles.map(role => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-gray-100 rounded-lg border border-gray-200 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                      {role.name}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{role.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>Макс. книг: {role.maxBooksAllowed}</span>
                        <span>Срок: {role.loanPeriodDays} дней</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveRole(role.id)}
                    disabled={loading}
                    className="ml-2"
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>У пользователя нет назначенных ролей</p>
                <p className="text-sm">Применяются ограничения роли "Гость"</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 