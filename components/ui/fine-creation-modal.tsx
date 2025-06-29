"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  User,
  DollarSign,
  FileText,
  Calendar,
  Book,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// TYPES ----------------------------------------------------------------------
interface UserType {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface ReservationType {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  book?: {
    title: string;
    authors?: string;
  };
}

interface CreateFineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFine: (fine: any) => Promise<void>;
  selectedUserId?: string;
}

// COMPONENT ------------------------------------------------------------------
export function CreateFineDialog({
  open,
  onOpenChange,
  onCreateFine,
  selectedUserId,
}: CreateFineDialogProps) {
  // ───────────────────────── state ─────────────────────────
  const [formData, setFormData] = useState({
    userId: "",
    amount: "",
    reason: "",
    fineType: "Overdue",
    notes: "",
    reservationId: "",
    overdueDays: "",
  });

  const [users, setUsers] = useState<UserType[]>([]);
  const [reservations, setReservations] = useState<ReservationType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const userSearchInputRef = useRef<HTMLInputElement>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  // ───────────────────────── effects ─────────────────────────
  useEffect(() => {
    if (open) {
      fetchUsers();
      setShowUserPicker(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (showUserPicker && userSearchInputRef.current) {
      userSearchInputRef.current.focus();
    }
  }, [showUserPicker]);

  // Автовыбор пользователя по selectedUserId
  useEffect(() => {
    if (open && selectedUserId && users.length > 0) {
      const found = users.find(u => u.id === selectedUserId);
      if (found) {
        setSelectedUser(found);
        setFormData((p) => ({ ...p, userId: found.id }));
        fetchUserReservations(found.id);
        setShowUserPicker(false); // Убеждаемся, что пикер пользователей закрыт
      }
    }
  }, [open, selectedUserId, users]);

  // Сброс состояния при закрытии модального окна
  useEffect(() => {
    if (!open) {
      setFormData({
        userId: "",
        amount: "",
        reason: "",
        fineType: "Overdue",
        notes: "",
        reservationId: "",
        overdueDays: "",
      });
      setSelectedUser(null);
      setReservations([]);
      setShowUserPicker(false);
      setUserSearch("");
      setError(null);
    }
  }, [open]);

  // При выборе пользователя загружаем его резервирования
  useEffect(() => {
    if (selectedUser) {
      fetchUserReservations(selectedUser.id);
    } else {
      setReservations([]);
      setFormData((p) => ({ ...p, reservationId: "" }));
    }
  }, [selectedUser]);

  // Автоматический расчет дней просрочки при выборе резервирования
  useEffect(() => {
    if (formData.reservationId && formData.reservationId !== "none" && reservations.length > 0) {
      const selectedReservation = reservations.find(r => r.id === formData.reservationId);
      if (selectedReservation && formData.fineType === "Overdue") {
        const expirationDate = new Date(selectedReservation.expirationDate);
        const currentDate = new Date();
        const diffTime = currentDate.getTime() - expirationDate.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        if (diffDays > 0) {
          setFormData((p) => ({ ...p, overdueDays: diffDays.toString() }));
        }
      }
    }
  }, [formData.reservationId, formData.fineType, reservations]);

  // Автоматический расчет суммы для просрочки
  useEffect(() => {
    if (formData.fineType === "Overdue" && formData.overdueDays && !isNaN(Number(formData.overdueDays))) {
      const calculatedAmount = Number(formData.overdueDays) * 10;
      setFormData((p) => ({ ...p, amount: calculatedAmount.toString() }));
    }
  }, [formData.fineType, formData.overdueDays]);

  // ───────────────────────── helpers ─────────────────────────
  const fetchUsers = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`${baseUrl}/api/User`);
      if (!response.ok) throw new Error("Ошибка при загрузке пользователей");
      
      const data = await response.json();
      setUsers(data);
    } catch (e) {
      console.error("Ошибка при загрузке пользователей:", e);
      setError("Не удалось загрузить список пользователей");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchUserReservations = async (userId: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/User/${userId}/reservations`);
      if (!response.ok) throw new Error("Ошибка при загрузке резервирований");
      
      const data = await response.json();
      setReservations(data);
    } catch (e) {
      console.error("Ошибка при загрузке резервирований:", e);
    }
  };

  const handleChange = (field: string, value: any) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError("Выберите пользователя");
      return;
    }
    
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError("Введите корректную сумму штрафа");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fineData = {
        userId: formData.userId,
        amount: Number(formData.amount),
        reason: formData.reason.trim(),
        fineType: formData.fineType,
        notes: formData.notes.trim() || undefined,
        reservationId: formData.reservationId || undefined,
        overdueDays: formData.overdueDays ? Number(formData.overdueDays) : undefined,
      };

      await onCreateFine(fineData);
      
      // Закрываем модальное окно - сброс произойдет автоматически через useEffect
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при начислении штрафа");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user: UserType) => {
    setSelectedUser(user);
    setFormData((p) => ({ ...p, userId: user.id }));
    setShowUserPicker(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  const getReservationStatusColor = (status: string) => {
    switch (status) {
      case "Просрочена": return "text-red-600 bg-red-100";
      case "Выдана": return "text-blue-600 bg-blue-100";
      case "Возвращена": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  // ───────────────────────── render ─────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-red-500" />
            Начислить штраф
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Выбор пользователя */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Пользователь *
              </Label>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUserPicker(!showUserPicker)}
                className="w-full justify-start text-left font-normal"
                disabled={!!selectedUserId && !!selectedUser}
              >
                {selectedUser ? selectedUser.fullName : "Выберите пользователя..."}
              </Button>

              {selectedUser && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Выбран: {selectedUser.fullName}</span>
                    </div>
                    {!selectedUserId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(null);
                          setFormData((p) => ({ ...p, userId: "" }));
                          setShowUserPicker(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Изменить
                      </Button>
                    )}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">{selectedUser.email}</div>
                </div>
              )}

              {showUserPicker && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      ref={userSearchInputRef}
                      placeholder="Поиск пользователя по имени или email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.slice(0, 10).map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full text-left px-3 py-2 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        {userSearch ? "Пользователи не найдены" : "Введите имя или email для поиска"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Тип штрафа */}
            <div className="space-y-2">
              <Label>Тип штрафа *</Label>
              <Select value={formData.fineType} onValueChange={(value) => handleChange("fineType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Overdue">Просрочка</SelectItem>
                  <SelectItem value="Damage">Повреждение</SelectItem>
                  <SelectItem value="Lost">Утеря</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Связанное резервирование */}
            {reservations.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  Связанное резервирование (необязательно)
                </Label>
                <Select value={formData.reservationId || "none"} onValueChange={(value) => handleChange("reservationId", value === "none" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Не связано с резервированием" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не связано с резервированием</SelectItem>
                    {reservations.map((reservation) => {
                      const expirationDate = new Date(reservation.expirationDate);
                      const currentDate = new Date();
                      const isOverdue = currentDate > expirationDate;
                      const diffTime = currentDate.getTime() - expirationDate.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      return (
                        <SelectItem key={reservation.id} value={reservation.id}>
                          {reservation.book?.title} - {formatDate(reservation.expirationDate)} 
                          {isOverdue && ` (просрочено на ${diffDays} дней)`} ({reservation.status})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Количество дней просрочки (только для типа "Просрочка") */}
            {formData.fineType === "Overdue" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Количество дней просрочки
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.overdueDays}
                  onChange={(e) => handleChange("overdueDays", e.target.value)}
                  placeholder="Введите количество дней"
                />
                {formData.reservationId && formData.reservationId !== "none" && formData.overdueDays && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
                    ✓ Автоматически рассчитано на основе выбранного резервирования: {formData.overdueDays} дней
                  </div>
                )}
                {formData.overdueDays && !isNaN(Number(formData.overdueDays)) && (
                  <div className="text-sm text-blue-600">
                    Автоматический расчет: {Number(formData.overdueDays)} дней × 10₽ = {Number(formData.overdueDays) * 10}₽
                  </div>
                )}
              </div>
            )}

            {/* Сумма штрафа */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Сумма штрафа (₽) *
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="Введите сумму штрафа"
                required
              />
            </div>

            {/* Причина штрафа */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Причина штрафа
              </Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="Опишите причину начисления штрафа"
                rows={3}
              />
            </div>

            {/* Дополнительные примечания */}
            <div className="space-y-2">
              <Label>Дополнительные примечания</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Дополнительная информация (необязательно)"
                rows={2}
              />
            </div>

            {/* Информация о штрафах */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-800">Информация о штрафах</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <h5 className="font-medium text-orange-800 text-sm">Просрочка</h5>
                  <p className="text-xs text-orange-700 mt-1">
                    10₽ за день просрочки
                  </p>
                </div>
                
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h5 className="font-medium text-red-800 text-sm">Повреждение</h5>
                  <p className="text-xs text-red-700 mt-1">
                    Индивидуально по степени повреждения
                  </p>
                </div>
                
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h5 className="font-medium text-purple-800 text-sm">Утеря</h5>
                  <p className="text-xs text-purple-700 mt-1">
                    Равен стоимости книги
                  </p>
                </div>
              </div>
            </div>

            {/* Резервирования пользователя */}
            {selectedUser && reservations.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Резервирования пользователя</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {reservations.map((reservation) => {
                    const expirationDate = new Date(reservation.expirationDate);
                    const currentDate = new Date();
                    const isOverdue = currentDate > expirationDate;
                    const diffTime = currentDate.getTime() - expirationDate.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={reservation.id} className="p-2 bg-white border border-gray-200 rounded text-sm">
                        <div className="font-medium text-gray-900">
                          {reservation.book?.title}
                        </div>
                        <div className="text-gray-600">
                          {reservation.book?.authors}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex flex-col">
                            <span className="text-gray-500">
                              Срок: {formatDate(reservation.expirationDate)}
                            </span>
                            {isOverdue && (
                              <span className="text-red-600 text-xs font-medium">
                                Просрочено на {diffDays} дней
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getReservationStatusColor(reservation.status)}`}>
                            {reservation.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ошибка */}
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading || !selectedUser}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                {isLoading ? "Начисление..." : "Начислить штраф"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Отмена
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 