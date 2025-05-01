"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, User } from "lucide-react";

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
  dateOfBirth: string;
  passportNumber: string | null;
  passportIssuedBy: string | null;
  passportIssuedDate: string | null;
  address: string | null;
  dateRegistered: string;
  borrowedBooksCount: number | null;
  fineAmount: number;
  isActive: boolean;
  loanPeriodDays: number;
  maxBooksAllowed: number | null;
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
    id: crypto.randomUUID(),
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: new Date().toISOString().slice(0, 10),
    passportNumber: "",
    passportIssuedBy: "",
    passportIssuedDate: new Date().toISOString().slice(0, 10),
    address: "",
    dateRegistered: new Date().toISOString().slice(0, 10),
    borrowedBooksCount: 0,
    fineAmount: 0,
    isActive: true,
    loanPeriodDays: 0,
    maxBooksAllowed: 0,
    password: "",
    username: "",
    userRoles: null,
    borrowedBooks: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === "userRoles") {
      const roleId = parseInt(value, 10);
      setFormData((prev) => {
        const exists = prev.userRoles?.some((r) => r.roleId === roleId);
        if (exists) {
          const filtered = prev.userRoles!.filter((r) => r.roleId !== roleId);
          return {
            ...prev,
            userRoles: filtered.length > 0 ? filtered : null,
          };
        } else {
          return {
            ...prev,
            userRoles: prev.userRoles ? [...prev.userRoles, { roleId }] : [{ roleId }],
          };
        }
      });
    } else if (["dateOfBirth", "passportIssuedDate", "dateRegistered"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value, // YYYY-MM-DD
      }));
    } else if (["borrowedBooksCount", "maxBooksAllowed", "loanPeriodDays", "fineAmount"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value),
      }));
    } else if (["phone", "passportNumber", "passportIssuedBy", "address"].includes(name)) {
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
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
      // Приводим даты к ISO-строке
      const dataToSend = {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : new Date().toISOString(),
        passportIssuedDate: formData.passportIssuedDate ? new Date(formData.passportIssuedDate).toISOString() : new Date().toISOString(),
        dateRegistered: formData.dateRegistered ? new Date(formData.dateRegistered).toISOString() : new Date().toISOString(),
        phone: formData.phone ?? "",
        passportNumber: formData.passportNumber ?? "",
        passportIssuedBy: formData.passportIssuedBy ?? "",
        address: formData.address ?? "",
        borrowedBooksCount: formData.borrowedBooksCount ?? 0,
        maxBooksAllowed: formData.maxBooksAllowed ?? 0,
        loanPeriodDays: formData.loanPeriodDays ?? 0,
        fineAmount: formData.fineAmount ?? 0,
        userRoles: formData.userRoles && formData.userRoles.length > 0 ? formData.userRoles : null,
        borrowedBooks: null,
      };
      const response = await fetch(`${baseUrl}/api/User`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при создании пользователя");
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
    <div className="min-h-screen relative p-6 max-w-2xl mx-auto">
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>

      <FadeInView>
        <motion.div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black-800 dark:text-black-100">Создание пользователя</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="bg-gray-500/80 hover:bg-gray-600/80 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
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
          className="mb-6 p-4 bg-red-100/80 dark:bg-red-900/80 backdrop-blur-xl border border-red-400 text-red-700 dark:text-red-200 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      <FadeInView delay={0.2}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
            whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="space-y-4">
              {[
                { label: "Имя пользователя", name: "username", type: "text", required: true },
                { label: "Пароль", name: "password", type: "password", required: true },
                { label: "ФИО", name: "fullName", type: "text", required: true },
                { label: "Email", name: "email", type: "email", required: true },
                { label: "Телефон", name: "phone", type: "tel" },
                { label: "Дата рождения", name: "dateOfBirth", type: "date", required: true },
                { label: "Номер паспорта", name: "passportNumber", type: "text" },
                { label: "Кем выдан паспорт", name: "passportIssuedBy", type: "text" },
                { label: "Дата выдачи паспорта", name: "passportIssuedDate", type: "date" },
                { label: "Адрес", name: "address", type: "text" },
                { label: "Дата регистрации", name: "dateRegistered", type: "date"},
                { label: "Срок выдачи (дней)", name: "loanPeriodDays", type: "number", min: 1},
                { label: "Максимальное количество книг", name: "maxBooksAllowed", type: "number", min: 1 },
                { label: "Текущее количество книг", name: "borrowedBooksCount", type: "number", min: 0 },
                { label: "Штраф (руб.)", name: "fineAmount", type: "number", min: 0, step: 0.01 },
              ].map((field, index) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-black-600 dark:text-black-300 mb-1">
                    {field.label}
                  </label>
                  <motion.input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={formData[field.name as keyof UserCreateDto] as string | number}
                    onChange={handleChange}
                    required={field.required}
                    min={field.min}
                    step={field.step}
                    className="w-full p-3 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/30 dark:border-gray-700/30 text-black-800 dark:text-black-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-black-600 dark:text-black-300 mb-1">Роли пользователя</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      name="userRoles"
                      value="1"
                      checked={formData.userRoles?.some((r) => r.roleId === 1)}
                      onChange={handleChange}
                    />
                    Администратор
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      name="userRoles"
                      value="2"
                      checked={formData.userRoles?.some((r) => r.roleId === 2)}
                      onChange={handleChange}
                    />
                    Библиотекарь
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      name="userRoles"
                      value="3"
                      checked={formData.userRoles?.some((r) => r.roleId === 3)}
                      onChange={handleChange}
                    />
                    Читатель
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
          <div className="flex justify-end gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => router.back()}
              className="bg-gray-500/80 hover:bg-gray-600/80 text-white font-medium rounded-lg px-4 py-2 shadow-md backdrop-blur-md"
            >
              Отмена
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading}
              className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md disabled:opacity-50"
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