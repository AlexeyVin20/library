"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, CheckCircle, XCircle, Clock, ArrowRight, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expirationDate: string;
  status: string;
  notes?: string;
  user?: {
    fullName: string;
    email?: string;
    phone?: string;
  };
  book?: {
    title: string;
    authors?: string;
  };
}

// Компонент для анимированного появления
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5,
}: { children: React.ReactNode; delay?: number; duration?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

// Компонент для вкладок
const AnimatedTabsTrigger = ({
  value,
  icon,
  label,
  isActive,
}: { value: string; icon: React.ReactNode; label: string; isActive: boolean }) => {
  return (
    <TabsTrigger
      value={value}
      className={`relative transition-colors
        ${isActive ? 'bg-emerald-900/80 text-white shadow-md' : ''}
        rounded-lg px-3 py-2
      `}
    >
      <div className="flex items-center gap-2">
        <span className={isActive ? "text-emerald-300" : "text-gray-300 dark:text-gray-400"}>{icon}</span>
        <span>{label}</span>
      </div>
      {isActive && (
        <motion.div
          layoutId="activeReservationTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </TabsTrigger>
  );
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Reservation`);
      if (!response.ok) throw new Error("Ошибка при загрузке резервирований");
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке резервирований");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const reservation = reservations.find(r => r.id === id);
      if (!reservation) throw new Error("Резервирование не найдено");

      const updatedReservation = {
        ...reservation,
        reservationDate: new Date(reservation.reservationDate).toISOString(),
        expirationDate: new Date(reservation.expirationDate).toISOString(),
        status: newStatus,
      };

      const response = await fetch(`${baseUrl}/api/Reservation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReservation),
      });

      if (!response.ok) throw new Error("Ошибка при обновлении статуса");
      
      setReservations(reservations.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ));
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err);
      alert(err instanceof Error ? err.message : "Ошибка при обновлении статуса");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Выполнена": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "Отменена": return <XCircle className="w-5 h-5 text-red-500" />;
      case "Обрабатывается": return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCardGradient = (status: string) => {
    switch(status) {
      case "Выполнена": return "border-l-4 border-emerald-500";
      case "Отменена": return "border-l-4 border-red-500";
      case "Обрабатывается": return "border-l-4 border-amber-500";
      default: return "border-l-4 border-gray-500";
    }
  };

  const filteredReservations = activeTab === "all" 
    ? reservations 
    : reservations.filter(r => r.status === activeTab);

  return (
    <div className="min-h-screen relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-green/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto p-6 relative z-10">
        {/* Header */}
        <FadeInView>
          <div className="mb-8 flex items-center gap-4">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
              <Link
                href="/admin"
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium text-white">Назад</span>
              </Link>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-bold text-white"
            >
              Резервирования
            </motion.h1>
          </div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-emerald-500" />
              <h2 className="text-xl font-semibold text-white">Фильтр</h2>
            </div>
            <Link href="/admin/reservations/create">
              <motion.button
                className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="h-4 w-4" />
                Создать резервирование
              </motion.button>
            </Link>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-red-500/20 border border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="bg-green/30 dark:bg-green-800/30 backdrop-blur-md p-1 rounded-xl border border-white/20 dark:border-gray-700/30 shadow-md text-white">
              <AnimatedTabsTrigger
                value="all"
                icon={<Filter className="w-4 h-4" />}
                label="Все"
                isActive={activeTab === "all"}
              />
              <AnimatedTabsTrigger
                value="Обрабатывается"
                icon={<Clock className="w-4 h-4" />}
                label="В обработке"
                isActive={activeTab === "Обрабатывается"}
              />
              <AnimatedTabsTrigger
                value="Выполнена"
                icon={<CheckCircle className="w-4 h-4" />}
                label="Выполнены"
                isActive={activeTab === "Выполнена"}
              />
              <AnimatedTabsTrigger
                value="Отменена"
                icon={<XCircle className="w-4 h-4" />}
                label="Отменены"
                isActive={activeTab === "Отменена"}
              />
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <AnimatePresence>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full"
                    />
                  </div>
                ) : filteredReservations.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-xl bg-yellow-500/20 border border-yellow-200/50 dark:border-yellow-800/30 text-white px-4 py-3 rounded-lg"
                  >
                    Резервирования не найдены
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReservations.map((reservation) => (
                      <motion.div
                        key={reservation.id}
                        className={`backdrop-blur-xl bg-green-500/20 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/30 ${getCardGradient(reservation.status)}`}
                        whileHover={{
                          y: -5,
                          boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.05)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                        layout
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(reservation.status)}
                            <span className="font-medium text-white">{reservation.status}</span>
                          </div>
                          <span className="text-sm text-white">
                            {reservation.id.split('-')[0].toUpperCase()}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold mb-2 text-white line-clamp-2">
                          {reservation.book?.title || "Книга не указана"}
                        </h3>
                        <p className="text-sm text-white mb-3 line-clamp-1">
                          {reservation.book?.authors || "Автор не указан"}
                        </p>

                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-300">Читатель:</span>
                            <span className="text-white line-clamp-1">
                              {reservation.user?.fullName || "Не указан"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-300">Дата:</span>
                            <span className="text-white">
                              {formatDate(reservation.reservationDate)}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 gap-2">
                          <div className="flex gap-2">
                            {reservation.status !== "Выполнена" && (
                              <motion.button
                                onClick={() => handleStatusChange(reservation.id, "Выполнена")}
                                className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white p-2 rounded-md"
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </motion.button>
                            )}
                            {reservation.status !== "Отменена" && (
                              <motion.button
                                onClick={() => handleStatusChange(reservation.id, "Отменена")}
                                className="bg-red-500/90 hover:bg-red-600/90 text-white p-2 rounded-md"
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <XCircle className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                          <Link href={`/admin/reservations/${reservation.id}`}>
                            <motion.button
                              className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white px-3 py-2 rounded-md flex items-center gap-2"
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span className="text-sm font-medium text-white">Подробнее</span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </FadeInView>
      </div>
    </div>
  );
}
