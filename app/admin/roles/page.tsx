"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, PlusCircle, Edit, Trash2, ShieldCheck } from "lucide-react";
interface Role {
  id: number;
  name: string;
  description: string;
  userRoles: any[];
  usersCount: number;
}
const FadeInView = ({
  children,
  delay = 0
}: {
  children: React.ReactNode;
  delay?: number;
}) => <motion.div initial={{
  opacity: 0,
  y: 20
}} animate={{
  opacity: 1,
  y: 0
}} transition={{
  duration: 0.5,
  delay,
  ease: [0.22, 1, 0.36, 1]
}}>
    {children}
  </motion.div>;
const Section = ({
  title,
  children,
  delay = 0
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) => <FadeInView delay={delay}>
    <motion.div className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/30" whileHover={{
    y: -5,
    boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)"
  }}>
      <h2 className="text-lg font-bold text-white dark:text-white mb-4 flex items-center gap-2">{title}</h2>
      <div>{children}</div>
    </motion.div>
  </FadeInView>;
const LoadingSpinner = () => <div className="flex flex-col justify-center items-center h-screen">
    <motion.div animate={{
    rotate: 360
  }} transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: "linear"
  }} className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full" />
    <motion.p initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    delay: 0.5
  }} className="mt-4 text-emerald-600 dark:text-emerald-400 font-medium">
      Загрузка данных...
    </motion.p>
  </div>;
export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: ""
  });
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/User/roles`);
      if (!response.ok) throw new Error("Ошибка при загрузке ролей");
      const rolesData = await response.json();
      setRoles(rolesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке ролей");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);
  const handleAddRole = async () => {
    if (!newRole.name.trim()) {
      setError("Название роли не может быть пустым");
      return;
    }
    try {
      const response = await fetch(`${baseUrl}/api/User/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newRole)
      });
      if (!response.ok) throw new Error("Ошибка при создании роли");

      // Обновляем список ролей
      fetchRoles();

      // Сбрасываем форму
      setNewRole({
        name: "",
        description: ""
      });
      setIsAddingRole(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при создании роли");
    }
  };
  const handleUpdateRole = async () => {
    if (!editingRole || !editingRole.name.trim()) {
      setError("Название роли не может быть пустым");
      return;
    }
    try {
      const response = await fetch(`${baseUrl}/api/User/roles/${editingRole.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editingRole)
      });
      if (!response.ok) throw new Error("Ошибка при обновлении роли");

      // Обновляем список ролей
      fetchRoles();

      // Сбрасываем форму
      setEditingRole(null);
      setIsEditingRole(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при обновлении роли");
    }
  };
  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту роль?")) return;
    try {
      const response = await fetch(`${baseUrl}/api/User/roles/${roleId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Ошибка при удалении роли");

      // Обновляем список ролей
      fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при удалении роли");
    }
  };
  const handleEditClick = (role: Role) => {
    setEditingRole(role);
    setIsEditingRole(true);
    setIsAddingRole(false);
  };
  const handleAddClick = () => {
    setIsAddingRole(true);
    setIsEditingRole(false);
    setEditingRole(null);
  };
  const handleCancelEdit = () => {
    setIsEditingRole(false);
    setEditingRole(null);
  };
  const handleCancelAdd = () => {
    setIsAddingRole(false);
    setNewRole({
      name: "",
      description: ""
    });
  };
  if (loading) return <LoadingSpinner />;
  return <div className="min-h-screen relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      <main className="max-w-7xl mx-auto space-y-8 relative z-10 p-6">
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
              <Link href="/admin" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Назад</span>
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
          }} className="text-3xl font-bold text-white dark:text-white">
              Управление ролями
            </motion.h1>

            <div className="ml-auto">
              <motion.button className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md" whileHover={{
              y: -3,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
            }} whileTap={{
              scale: 0.98
            }} onClick={handleAddClick}>
                <PlusCircle className="h-4 w-4" />
                Добавить роль
              </motion.button>
            </div>
          </div>
        </FadeInView>

        {error && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-white mb-4">
            {error}
            <button className="ml-2 text-white font-bold" onClick={() => setError(null)}>
              ×
            </button>
          </motion.div>}

        {isAddingRole && <Section title="Добавление новой роли" delay={0.2}>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-white">Название</label>
                <input type="text" value={newRole.name} onChange={e => setNewRole({
              ...newRole,
              name: e.target.value
            })} className="w-full p-2 rounded-lg bg-green/20 dark:bg-green-800/40 backdrop-blur-md border border-white/30 dark:border-gray-700/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div>
                <label className="block mb-1 text-white">Описание</label>
                <textarea value={newRole.description} onChange={e => setNewRole({
              ...newRole,
              description: e.target.value
            })} className="w-full p-2 rounded-lg bg-green/20 dark:bg-green-800/40 backdrop-blur-md border border-white/30 dark:border-gray-700/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" rows={3} />
              </div>
              <div className="flex gap-2 justify-end">
                <motion.button whileHover={{
              y: -2
            }} whileTap={{
              scale: 0.95
            }} onClick={handleCancelAdd} className="bg-gray-500/90 hover:bg-gray-600/90 text-white font-medium rounded-lg px-4 py-2 shadow-md backdrop-blur-md">
                  Отмена
                </motion.button>
                <motion.button whileHover={{
              y: -2
            }} whileTap={{
              scale: 0.95
            }} onClick={handleAddRole} className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 shadow-md backdrop-blur-md">
                  Сохранить
                </motion.button>
              </div>
            </div>
          </Section>}

        {isEditingRole && editingRole && <Section title="Редактирование роли" delay={0.2}>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-white">Название</label>
                <input type="text" value={editingRole.name} onChange={e => setEditingRole({
              ...editingRole,
              name: e.target.value
            })} className="w-full p-2 rounded-lg bg-green/20 dark:bg-green-800/40 backdrop-blur-md border border-white/30 dark:border-gray-700/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div>
                <label className="block mb-1 text-white">Описание</label>
                <textarea value={editingRole.description} onChange={e => setEditingRole({
              ...editingRole,
              description: e.target.value
            })} className="w-full p-2 rounded-lg bg-green/20 dark:bg-green-800/40 backdrop-blur-md border border-white/30 dark:border-gray-700/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" rows={3} />
              </div>
              <div className="flex gap-2 justify-end">
                <motion.button whileHover={{
              y: -2
            }} whileTap={{
              scale: 0.95
            }} onClick={handleCancelEdit} className="bg-gray-500/90 hover:bg-gray-600/90 text-white font-medium rounded-lg px-4 py-2 shadow-md backdrop-blur-md">
                  Отмена
                </motion.button>
                <motion.button whileHover={{
              y: -2
            }} whileTap={{
              scale: 0.95
            }} onClick={handleUpdateRole} className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 shadow-md backdrop-blur-md">
                  Обновить
                </motion.button>
              </div>
            </div>
          </Section>}

        <Section title="Список ролей" delay={0.3}>
          <div className="space-y-4">
            {roles.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map(role => <motion.div key={role.id} initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.1 * role.id
            }} className="p-4 bg-green/10 dark:bg-green-800/70 backdrop-blur-md rounded-lg border border-white/30 dark:border-gray-700/30">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        {role.name}
                      </h3>
                      <div className="flex gap-2">
                        <motion.button whileHover={{
                    y: -2
                  }} whileTap={{
                    scale: 0.95
                  }} onClick={() => handleEditClick(role)} className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white rounded-lg p-1 shadow-md backdrop-blur-md">
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button whileHover={{
                    y: -2
                  }} whileTap={{
                    scale: 0.95
                  }} onClick={() => handleDeleteRole(role.id)} className="bg-red-500/90 hover:bg-red-600/90 text-white rounded-lg p-1 shadow-md backdrop-blur-md">
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-white mt-2">{role.description}</p>
                    <p className="text-white text-sm mt-2">
                      Пользователей с этой ролью: {role.usersCount}
                    </p>
                  </motion.div>)}
              </div> : <p className="text-white text-center py-4">Роли не найдены</p>}
          </div>
        </Section>
      </main>
    </div>;
}