'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { USER_ROLES } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

interface UserRole {
  roleId: number;
}

interface Book {
  // Можно оставить пустым, если не требуется при создании
}

interface UserCreateDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  dateRegistered: string;
  borrowedBooksCount: number | null;
  password: string;
  username: string;
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

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserCreateDto>({
    id: uuidv4(),
    fullName: "",
    email: "",
    phone: "",
    dateRegistered: new Date().toISOString().slice(0, 10),
    borrowedBooksCount: 0,
    password: "",
    username: "",
    userRoles: [{ roleId: USER_ROLES.EMPLOYEE.id }], // ID: 3
    borrowedBooks: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (["dateRegistered"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value, // YYYY-MM-DD
      }));
    } else if (["borrowedBooksCount"].includes(name)) {
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
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
      // Подготавливаем данные для отправки
      const dataToSend = {
        ...formData,
        dateRegistered: formData.dateRegistered ? new Date(formData.dateRegistered).toISOString() : new Date().toISOString(),
        phone: formData.phone ?? "",
        borrowedBooksCount: formData.borrowedBooksCount ?? 0,
        fineAmount: 0, // Штраф всегда 0 при создании
        isActive: true, // Аккаунт всегда активен при создании
        maxBooksAllowed: USER_ROLES.EMPLOYEE.maxBooksAllowed, // Из роли сотрудника
        loanPeriodDays: USER_ROLES.EMPLOYEE.loanPeriodDays, // Из роли сотрудника
        borrowedBooks: null,
      };
      
      // Создаём пользователя без ролей
      const response = await fetch(`${baseUrl}/api/User`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при создании пользователя");
      }

      const newUser = await response.json();
      
      // Назначаем роль "Сотрудник" после создания пользователя
      const assignRoleResponse = await fetch(`${baseUrl}/api/User/assign-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: newUser.id,
          roleId: USER_ROLES.EMPLOYEE.id
        }),
      });

      if (!assignRoleResponse.ok) {
        console.warn("Не удалось назначить роль пользователю, но пользователь создан");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при создании пользователя");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 max-w-2xl mx-auto">
      <FadeInView>
        <motion.div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Создание пользователя</h1>
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
          {/* Информационное сообщение о роли */}
          <motion.div 
            className="bg-blue-50 border border-blue-200 rounded-xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-medium text-blue-800">Роль сотрудника</h3>
                <p className="text-sm text-blue-600">
                  Пользователь будет создан с ролью "{USER_ROLES.EMPLOYEE.name}" и сможет брать до {USER_ROLES.EMPLOYEE.maxBooksAllowed} книг на срок до {USER_ROLES.EMPLOYEE.loanPeriodDays} дней.
                </p>
              </div>
            </div>
          </motion.div>

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
              ].map((field, index) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-800 mb-1">
                    {field.label}
                  </label>
                  <motion.input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={formData[field.name as keyof UserCreateDto] as string | number}
                    onChange={handleChange}
                    required={field.required}
                    className="w-full p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
          <div className="flex justify-end gap-4">
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
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Создать пользователя
            </motion.button>
          </div>
        </form>
      </FadeInView>
    </div>
  );
}