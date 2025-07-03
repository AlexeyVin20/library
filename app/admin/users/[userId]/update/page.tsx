"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, User, Key, X } from "lucide-react";

interface UserRole {
  roleId: number;
}

interface Book {
  // Можно оставить пустым, если не требуется при обновлении
}

interface UserUpdateDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateRegistered: string;
  username: string;
  password: string;
  isActive: boolean;
  borrowedBooksCount: number;
  maxBooksAllowed: number;
  loanPeriodDays: number;
  fineAmount: number;
  userRoles: UserRole[] | null;
  borrowedBooks: Book[] | null;
}

const FadeInView = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

// Функция для преобразования даты из ISO формата в формат yyyy-MM-dd для HTML input type="date"
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    // Проверяем на валидность даты
    if (isNaN(date.getTime())) return "";
    
    // Форматируем в yyyy-MM-dd
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error("Ошибка форматирования даты:", e);
    return "";
  }
};

export default function UpdateUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserUpdateDto>({
    id: "",
    fullName: "",
    email: "",
    phone: "",
    dateRegistered: "",
    username: "",
    password: "",
    isActive: true,
    borrowedBooksCount: 0,
    maxBooksAllowed: 0,
    loanPeriodDays: 0,
    fineAmount: 0,
    userRoles: null,
    borrowedBooks: null,
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/api/User/${userId}`);
        if (!response.ok) throw new Error("Ошибка загрузки данных пользователя");
        
        const userData = await response.json();
        
        // Преобразуем роли в соответствии с нашим новым интерфейсом
        let userRoles: UserRole[] | null = null;
        if (userData.userRoles && userData.userRoles.length > 0) {
          userRoles = userData.userRoles.map((role: any) => ({
            roleId: role.roleId || role.id // поддерживаем возможные форматы API
          }));
        }
        
        const formattedUser: UserUpdateDto = {
          ...userData,
          userRoles,
          // Убедимся, что все строковые поля имеют значения (не null)
          phone: userData.phone || "",
          // Корректно форматируем даты для input type="date"
          dateRegistered: formatDateForInput(userData.dateRegistered),
          // И числовые поля тоже
          borrowedBooksCount: userData.borrowedBooksCount || 0,
          maxBooksAllowed: userData.maxBooksAllowed || 0,
          loanPeriodDays: userData.loanPeriodDays || 0,
          fineAmount: userData.fineAmount || 0,
        };
        
        setFormData(formattedUser);
      } catch (error) {
        console.error("Ошибка при загрузке пользователя:", error);
        setError("Не удалось загрузить данные пользователя");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUserData();
  }, [userId, baseUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (["dateRegistered"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value, // YYYY-MM-DD
      }));
    } else if (["borrowedBooksCount", "maxBooksAllowed", "loanPeriodDays", "fineAmount"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value),
      }));
    } else if (["phone"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const dataToSend = {
        ...formData,
        // Преобразуем даты в ISO строки для API
        dateRegistered: formData.dateRegistered ? new Date(formData.dateRegistered).toISOString() : new Date().toISOString(),
        phone: formData.phone || null,
        borrowedBooksCount: formData.borrowedBooksCount,
        maxBooksAllowed: formData.maxBooksAllowed,
        loanPeriodDays: formData.loanPeriodDays,
        fineAmount: formData.fineAmount,
        // Сохраняем существующие роли, но не даем их изменять
        userRoles: formData.userRoles,
        borrowedBooks: null,
        password: formData.password,
      };
      const response = await fetch(`${baseUrl}/api/User/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (!response.ok) throw new Error("Ошибка при обновлении пользователя");
      router.push(`/admin/users/${userId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при обновлении пользователя");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Новые пароли не совпадают");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Новый пароль должен содержать минимум 6 символов");
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/api/User/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id: userId,
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Ошибка при смене пароля");
      }
      
      // Успешная смена пароля
      setIsPasswordModalOpen(false);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      alert("Пароль успешно изменен");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Произошла ошибка при смене пароля");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setPasswordError(null);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-blue-500">Загрузка...</span>
      </div>
    );
  }

  if (loading && !formData.id) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-blue-500">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6 max-w-2xl mx-auto">
      <FadeInView>
        <motion.div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Редактирование пользователя</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </motion.button>
        </motion.div>
      </FadeInView>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      <FadeInView delay={0.2}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="space-y-4">
              {[
                { label: "Имя пользователя", name: "username", type: "text", required: true },
                { label: "Пароль", name: "password", type: "password", required: true },
                { label: "ФИО", name: "fullName", type: "text", required: true },
                { label: "Email", name: "email", type: "email", required: true },
                { label: "Телефон", name: "phone", type: "tel" },
                { label: "Дата регистрации", name: "dateRegistered", type: "date"},
                { label: "Количество взятых книг", name: "borrowedBooksCount", type: "number"},
                { label: "Максимум книг", name: "maxBooksAllowed", type: "number"},
                { label: "Период займа (дни)", name: "loanPeriodDays", type: "number"},
                { label: "Штраф", name: "fineAmount", type: "number", step: "0.01"},
              ].map((field, index) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-800 mb-1">
                    {field.label}
                  </label>
                  <motion.input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    step={field.step}
                    value={
                      typeof formData[field.name as keyof UserUpdateDto] === "number" 
                        ? String(formData[field.name as keyof UserUpdateDto]) 
                        : (formData[field.name as keyof UserUpdateDto] as string) || ""
                    }
                    onChange={handleChange}
                    required={field.required}
                    className="w-full p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>
              ))}
              
              <div className="flex items-center space-x-2">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-800">
                  Активный аккаунт
                </label>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-between gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md"
            >
              <Key className="w-4 h-4" />
              Сменить пароль
            </motion.button>
            
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => router.back()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 font-medium rounded-lg px-4 py-2 shadow-md"
              >
                Отмена
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={submitting}
                className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Обновить пользователя
              </motion.button>
            </div>
          </div>
        </form>
      </FadeInView>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Смена пароля</h3>
              <button
                onClick={closePasswordModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg text-sm">
                {passwordError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Старый пароль
                </label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordFormChange}
                  className="w-full p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Новый пароль
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordFormChange}
                  className="w-full p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Подтверждение пароля
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordFormChange}
                  className="w-full p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg px-4 py-2 shadow-md"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                  className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  Изменить
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}