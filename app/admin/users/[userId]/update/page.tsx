"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import GlassMorphismContainer from '@/components/admin/GlassMorphismContainer';

interface UserUpdateDto {
  Id: string;
  FullName: string;
  Email: string;
  Phone: string;
  DateOfBirth: string;
  PassportNumber: string;
  PassportIssuedBy: string;
  PassportIssuedDate: string;
  Address: string;
  DateRegistered: string;
  BorrowedBooksCount: number;
  FineAmount: number;
  IsActive: boolean;
  LastLoginDate: string;
  LoanPeriodDays: number;
  MaxBooksAllowed: number;
  PasswordHash: string;
  Username: string;
  UserRoles?: string[];
  BorrowedBooks?: any[];
}

export default function UpdateUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserUpdateDto | null>(null);

  // Загрузка данных пользователя при монтировании
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
        const response = await fetch(`${baseUrl}/api/User/${userId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Ошибка ответа сервера:", errorText);
          throw new Error(`Ошибка загрузки данных: ${response.status}`);
        }
        
        const userData = await response.json();
        console.log("Данные пользователя для формы:", userData);
        
        // Функция для форматирования даты в формат yyyy-MM-dd для input type="date"
        const formatDateForInput = (dateString: string | null | undefined): string => {
          if (!dateString) return "";
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
          } catch (error) {
            console.error("Ошибка форматирования даты:", error);
            return "";
          }
        };
        
        setFormData({
          Id: userData.Id,
          FullName: userData.FullName ?? "",
          Email: userData.Email ?? "",
          Phone: userData.Phone ?? "",
          DateOfBirth: formatDateForInput(userData.DateOfBirth),
          PassportNumber: userData.PassportNumber ?? "",
          PassportIssuedBy: userData.PassportIssuedBy ?? "",
          PassportIssuedDate: formatDateForInput(userData.PassportIssuedDate) ?? "",
          Address: userData.Address ?? "",
          DateRegistered: formatDateForInput(userData.DateRegistered),
          BorrowedBooksCount: userData.BorrowedBooksCount ?? 0,
          FineAmount: userData.FineAmount ?? 0,
          IsActive: userData.IsActive ?? true,
          LoanPeriodDays: userData.LoanPeriodDays ?? 14,
          MaxBooksAllowed: userData.MaxBooksAllowed ?? 5,
          PasswordHash: userData.PasswordHash ?? "",
          Username: userData.Username ?? "",
          UserRoles: userData.UserRoles || [],
          BorrowedBooks: userData.BorrowedBooks || [],
          LastLoginDate: formatDateForInput(userData.LastLoginDate) ?? ""
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
        console.error("Ошибка загрузки данных:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) fetchUserData();
  }, [userId]);

  // Обработка изменений в форме
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const { checked } = e.target;
      setFormData((prev) => (prev ? { ...prev, [name]: checked } : null));
    } else if (type === "number") {
      setFormData((prev) => (prev ? { ...prev, [name]: value ? Number(value) : 0 } : null));
    } else {
      setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
    }
  };

  // Отправка формы для обновления данных
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
      const response = await fetch(`${baseUrl}/api/User/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          DateOfBirth: formData.DateOfBirth ? new Date(formData.DateOfBirth).toISOString() : null,
          DateRegistered: formData.DateRegistered ? new Date(formData.DateRegistered).toISOString() : null,
          PassportIssuedDate: formData.PassportIssuedDate ? new Date(formData.PassportIssuedDate).toISOString() : null,
          UserRoles: formData.UserRoles || [],
          BorrowedBooks: formData.BorrowedBooks || []
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ошибка ответа сервера при обновлении:", errorText);
        throw new Error(`Ошибка: ${response.status}`);
      }
      
      router.push(`/admin/users/${userId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при обновлении пользователя");
      console.error("Ошибка обновления:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center">Загрузка...</div>;
  if (error && !formData) return <div className="p-8 text-red-500">Ошибка: {error}</div>;
  if (!formData) return <div className="p-8 text-red-500">Пользователь не найден</div>;

  return (
    <GlassMorphismContainer>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-500 dark:text-neutral-200">
            Редактирование пользователя
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
                  value={formData.FullName}
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
                  value={formData.Email}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/50 dark:bg-neutral-700/50 backdrop-blur-xl border border-white/30 dark:border-neutral-600/30 rounded-lg px-4 py-2 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-neutral-500 dark:text-neutral-200 mb-1">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.Username}
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
                  value={formData.Phone}
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
                  value={formData.DateOfBirth}
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
                  value={formData.PassportNumber}
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
                  value={formData.PassportIssuedBy}
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
                  value={formData.PassportIssuedDate}
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
                  value={formData.Address}
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
                  value={formData.DateRegistered}
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
                  value={formData.LoanPeriodDays}
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
                  value={formData.MaxBooksAllowed}
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
                  value={formData.BorrowedBooksCount}
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
                  value={formData.FineAmount}
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
                  checked={formData.IsActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => (prev ? { ...prev, IsActive: !!checked } : null))
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
              disabled={submitting}
              className="bg-gradient-to-r from-green-600/90 to-green-700/70 dark:from-green-700/80 dark:to-green-800/60 backdrop-blur-xl text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </div>
        </form>
      </div>
    </GlassMorphismContainer>
  );
}
