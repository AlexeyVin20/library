"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  password: string;
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
    dateRegistered: new Date().toISOString().split('T')[0],
    borrowedBooksCount: 0,
    fineAmount: 0,
    isActive: true,
    lastLoginDate: new Date().toISOString().split('T')[0],
    loanPeriodDays: 14,
    maxBooksAllowed: 5,
    password: "",
    username: ""
  });

  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Обработка чекбоксов
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    // Обработка числовых полей
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? Number(value) : null }));
      return;
    }
    
    // Обработка остальных полей
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/User`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Ошибка: ${response.status}`);
      }
      
      // Успешное создание - перенаправляем на список пользователей
      router.push('/users');
      router.refresh(); // Обновляем кэш маршрутизатора
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании пользователя');
      console.error('Ошибка создания пользователя:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/admin/users" className="text-blue-500 hover:underline mb-4 block">
        &lt; Назад к списку пользователей
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">Создание нового пользователя</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Основная информация */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold mb-2">Основная информация</h2>
          </div>
          
          <div>
            <label className="block mb-1">ФИО *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Имя пользователя *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Телефон *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Дата рождения *</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Адрес</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Пароль *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          {/* Паспортные данные */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-lg font-semibold mb-2">Паспортные данные</h2>
          </div>
          
          <div>
            <label className="block mb-1">Номер паспорта</label>
            <input
              type="text"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Кем выдан паспорт</label>
            <input
              type="text"
              name="passportIssuedBy"
              value={formData.passportIssuedBy}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Дата выдачи паспорта</label>
            <input
              type="date"
              name="passportIssuedDate"
              value={formData.passportIssuedDate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          {/* Настройки библиотеки */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-lg font-semibold mb-2">Настройки библиотеки</h2>
          </div>
          
          <div>
            <label className="block mb-1">Срок выдачи (дней)</label>
            <input
              type="number"
              name="loanPeriodDays"
              value={formData.loanPeriodDays}
              onChange={handleChange}
              min="1"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Максимальное количество книг</label>
            <input
              type="number"
              name="maxBooksAllowed"
              value={formData.maxBooksAllowed}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Текущее количество книг</label>
            <input
              type="number"
              name="borrowedBooksCount"
              value={formData.borrowedBooksCount}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1">Штраф (руб.)</label>
            <input
              type="number"
              name="fineAmount"
              value={formData.fineAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              id="isActive"
              className="mr-2"
            />
            <label htmlFor="isActive">Активный пользователь</label>
          </div>
        </div>
        
        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Создание..." : "Создать пользователя"}
          </button>
          
          <Link href="/admin/users">
            <button type="button" className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">
              Отмена
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
