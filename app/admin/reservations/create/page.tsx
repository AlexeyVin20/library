"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { CreateReservationDialog } from "@/components/ui/reservation-creation-modal";

// Компонент для анимированного появления
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) => {
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration,
    delay,
    ease: [0.22, 1, 0.36, 1]
  }}>
      {children}
    </motion.div>;
};

export default function CreateReservationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  // Получаем bookId из query
  const selectedBookId = searchParams.get("bookId") || undefined;

  const handleCreateReservation = async (reservationData: any) => {
    try {
      const response = await fetch(`${baseUrl}/api/Reservation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reservationData)
      });
      
      if (!response.ok) throw new Error("Ошибка при создании резервирования");
      
      // Перенаправляем на страницу резервирований после успешного создания
      router.push("/admin/reservations");
    } catch (error) {
      console.error("Ошибка при создании резервирования:", error);
      throw error; // Пробрасываем ошибку для обработки в модальном окне
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      // Если модальное окно закрыто, возвращаемся к списку резервирований
      router.push("/admin/reservations");
    }
    setShowCreateModal(open);
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="container mx-auto p-6">
        {/* Header */}
        <FadeInView>
          <div className="mb-8 flex items-center gap-4">
            <motion.div initial={{
              x: -20,
              opacity: 0
            }} animate={{
              x: 0,
              opacity: 1
            }} transition={{
              duration: 0.5
            }}>
              <Link href="/admin/reservations" className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors">
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium text-gray-800">Назад к резервированиям</span>
              </Link>
            </motion.div>

            <motion.h1 initial={{
              opacity: 0,
              y: -20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.1
            }} className="text-3xl font-bold text-gray-800">
              Создание резервирования
            </motion.h1>
          </div>
        </FadeInView>

        {/* Основной контент - только заголовок, модальное окно откроется автоматически */}
        <FadeInView delay={0.2}>
          <div className="text-center py-12">
            <p className="text-gray-600">
              Модальное окно создания резервирования откроется автоматически...
            </p>
          </div>
        </FadeInView>
      </div>

      {/* Модальное окно создания резервирования */}
      <CreateReservationDialog
        open={showCreateModal}
        onOpenChange={handleModalClose}
        onCreateReservation={handleCreateReservation}
        selectedBookId={selectedBookId}
      />
    </div>
  );
}