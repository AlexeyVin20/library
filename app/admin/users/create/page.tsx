"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, User } from "lucide-react";

interface UserCreateDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportNumber: string;
  passportIssuedBy: string;
  passportIssuedDate: string;
  address: string;
  dateRegistered: string;
  borrowedBooksCount: number;
  fineAmount: number;
  isActive: boolean;
  lastLoginDate: string;
  loanPeriodDays: number;
  maxBooksAllowed: number;
  passwordHash: string;
  username: string;
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
    dateOfBirth: "",
    passportNumber: "",
    passportIssuedBy: "",
    passportIssuedDate: "",
    address: "",
    dateRegistered: new Date().toISOString().split("T")[0],
    borrowedBooksCount: 0,
    fineAmount: 0,
    isActive: true,
    lastLoginDate: new Date().toISOString().split("T")[0],
    loanPeriodDays: 14,
    maxBooksAllowed: 5,
    passwordHash: "",
    username: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? (value ? Number(value) : 0) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
      const response = await fetch(`${baseUrl}/api/User`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Ошибка при создании пользователя");
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
                { label: "ФИО", name: "fullName", type: "text", required: true },
                { label: "Email", name: "email", type: "email", required: true },
                { label: "Телефон", name: "phone", type: "tel", required: true },
                { label: "Дата рождения", name: "dateOfBirth", type: "date", required: true },
                { label: "Номер паспорта", name: "passportNumber", type: "text" },
                { label: "Кем выдан паспорт", name: "passportIssuedBy", type: "text" },
                { label: "Дата выдачи паспорта", name: "passportIssuedDate", type: "date" },
                { label: "Адрес", name: "address", type: "text" },
                { label: "Дата регистрации", name: "dateRegistered", type: "date", required: true },
                { label: "Срок выдачи (дней)", name: "loanPeriodDays", type: "number", min: 1 },
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
              <div className="flex items-center gap-2">
                <motion.input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 border-white/30 dark:border-gray-700/30 rounded"
                  whileHover={{ scale: 1.1 }}
                />
                <label htmlFor="isActive" className="text-sm font-medium text-black-600 dark:text-black-300">
                  Активный пользователь
                </label>
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