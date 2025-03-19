"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import GlassMorphismContainer from '@/components/admin/GlassMorphismContainer';

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
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const { checked } = e.target;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ошибка ответа сервера при создании:", errorText);
        throw new Error(`Ошибка: ${response.status}`);
      }

      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при создании пользователя");
      console.error("Ошибка создания пользователя:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassMorphismContainer>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-500 dark:text-neutral-200">
            Создание пользователя
          </h1>
          <button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-blue-600/90 to-blue-700/70 dark:from-blue-700/80 dark:to-blue-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
          >
            Назад
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100/80 dark:bg-red-900/80 backdrop-blur-xl border border-red-400 text-red-700 dark:text-red-200 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-neutral-700/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  ФИО
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Телефон
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Дата рождения
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="passportNumber" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Номер паспорта
                </label>
                <input
                  type="text"
                  id="passportNumber"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleChange}
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="passportIssuedBy" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Кем выдан паспорт
                </label>
                <input
                  type="text"
                  id="passportIssuedBy"
                  name="passportIssuedBy"
                  value={formData.passportIssuedBy}
                  onChange={handleChange}
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="passportIssuedDate" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Дата выдачи паспорта
                </label>
                <input
                  type="date"
                  id="passportIssuedDate"
                  name="passportIssuedDate"
                  value={formData.passportIssuedDate}
                  onChange={handleChange}
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Адрес
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="dateRegistered" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Дата регистрации
                </label>
                <input
                  type="date"
                  id="dateRegistered"
                  name="dateRegistered"
                  value={formData.dateRegistered}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="loanPeriodDays" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Срок выдачи (дней)
                </label>
                <input
                  type="number"
                  id="loanPeriodDays"
                  name="loanPeriodDays"
                  value={formData.loanPeriodDays}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="maxBooksAllowed" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Максимальное количество книг
                </label>
                <input
                  type="number"
                  id="maxBooksAllowed"
                  name="maxBooksAllowed"
                  value={formData.maxBooksAllowed}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="borrowedBooksCount" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Текущее количество книг
                </label>
                <input
                  type="number"
                  id="borrowedBooksCount"
                  name="borrowedBooksCount"
                  value={formData.borrowedBooksCount}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="fineAmount" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Штраф (руб.)
                </label>
                <input
                  type="number"
                  id="fineAmount"
                  name="fineAmount"
                  value={formData.fineAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: !!checked }))
                  }
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Активный пользователь
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gradient-to-r from-gray-600/90 to-gray-700/70 dark:from-gray-700/80 dark:to-gray-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Создание..." : "Создать пользователя"}
            </button>
          </div>
        </form>
      </div>
    </GlassMorphismContainer>
  );
}
