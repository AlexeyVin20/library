'use client';

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, PlusCircle, Edit, Trash2, ShieldCheck, BookOpen, Clock, Info } from "lucide-react";
import { USER_ROLES, getRoleDescription } from "@/lib/types";
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
    <motion.div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200" whileHover={{
    y: -5,
    boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)"
  }}>
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">{title}</h2>
      <div>{children}</div>
    </motion.div>
  </FadeInView>;
const LoadingSpinner = () => <div className="flex flex-col justify-center items-center h-screen bg-gray-200">
    <motion.div animate={{
    rotate: 360
  }} transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: "linear"
  }} className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full" />
    <motion.p initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    delay: 0.5
  }} className="mt-4 text-blue-500 font-medium">
      Загрузка данных...
    </motion.p>
  </div>;

function UsersRolesTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, rolesRes] = await Promise.all([
          fetch(`${baseUrl}/api/User/users-with-roles`),
          fetch(`${baseUrl}/api/User/roles`)
        ]);
        if (!usersRes.ok) throw new Error("Ошибка при загрузке пользователей");
        if (!rolesRes.ok) throw new Error("Ошибка при загрузке ролей");
        const usersData = await usersRes.json();
        const rolesData = await rolesRes.json();
        setUsers(usersData);
        setRoles(rolesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [baseUrl]);

  const handleUserSelect = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId || selectedUserIds.length === 0) return;
    try {
      const response = await fetch(`${baseUrl}/api/User/assign-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds, roleId: Number(selectedRoleId) })
      });
      if (!response.ok) throw new Error("Ошибка при присвоении роли");
      // обновить пользователей
      const usersRes = await fetch(`${baseUrl}/api/User/users-with-roles`);
      if (!usersRes.ok) throw new Error("Ошибка при обновлении пользователей");
      const usersData = await usersRes.json();
      setUsers(usersData);
      setSelectedUserIds([]);
      setSelectedRoleId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при присвоении роли");
    }
  };

  const handleRemoveRole = async () => {
    if (!selectedRoleId || selectedUserIds.length === 0) return;
    try {
      const response = await fetch(`${baseUrl}/api/User/remove-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds, roleId: Number(selectedRoleId) })
      });
      if (!response.ok) throw new Error("Ошибка при удалении роли");
      // обновить пользователей
      const usersRes = await fetch(`${baseUrl}/api/User/users-with-roles`);
      if (!usersRes.ok) throw new Error("Ошибка при обновлении пользователей");
      const usersData = await usersRes.json();
      setUsers(usersData);
      setSelectedUserIds([]);
      setSelectedRoleId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при удалении роли");
    }
  };

  if (loading) return <div className="py-8 text-center text-black">Загрузка пользователей...</div>;
  if (error) return <div className="py-8 text-center text-red-500 text-black">{error}</div>;

  return (
    <div className="mt-8">
      <div className="flex gap-2 mb-2 items-center">
        <select
          value={selectedRoleId}
          onChange={e => setSelectedRoleId(e.target.value)}
          className="border rounded p-2 text-black"
        >
          <option value="">Выберите роль</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
        <button
          onClick={handleAssignRole}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!selectedRoleId || selectedUserIds.length === 0}
        >
          Присвоить роль выбранным
        </button>
        <button
          onClick={handleRemoveRole}
          className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!selectedRoleId || selectedUserIds.length === 0}
        >
          Удалить роль у выбранных
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow text-black">
          <thead>
            <tr>
              <th></th>
              <th className="px-4 py-2 text-black">ФИО</th>
              <th className="px-4 py-2 text-black">Никнейм</th>
              <th className="px-4 py-2 text-black">Почта</th>
              <th className="px-4 py-2 text-black">Роли</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleUserSelect(user.id)}
                  />
                </td>
                <td className="px-4 py-2 text-black">{user.fullName}</td>
                <td className="px-4 py-2 text-black">{user.username}</td>
                <td className="px-4 py-2 text-black">{user.email}</td>
                <td className="px-4 py-2 text-black">{user.roles && user.roles.map((r: any) => r.name).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
  return <div className="min-h-screen bg-gray-200">
      <main className="max-w-7xl mx-auto space-y-8 p-6">
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
              <Link href="/admin" className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors">
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
          }} className="text-3xl font-bold text-gray-800">
              Управление ролями
            </motion.h1>

            <div className="ml-auto">
              <motion.button className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" whileHover={{
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

        {/* Информация о системных ролях */}
        <FadeInView delay={0.15}>
          <motion.div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Системные роли пользователей
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(USER_ROLES).map(role => (
                <div key={role.id} className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{role.name}</h4>
                    <span className="text-xs text-gray-500">ID: {role.id}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {getRoleDescription(role.name)}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-blue-500" />
                      <span>{role.maxBooksAllowed} книг</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>{role.loanPeriodDays} дней</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Примечание:</strong> При самостоятельной регистрации пользователи получают роль "Гость". 
                При создании через админ-панель - роль "Сотрудник". Роли автоматически определяют ограничения по количеству книг и срокам займа.
              </p>
            </div>
          </motion.div>
        </FadeInView>

        {error && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="p-4 bg-red-100 border border-red-200 rounded-lg text-red-800 mb-4">
            {error}
            <button className="ml-2 text-red-800 font-bold" onClick={() => setError(null)}>
              ×
            </button>
          </motion.div>}

        {isAddingRole && <Section title="Добавление новой роли" delay={0.2}>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-800">Название</label>
                <input type="text" value={newRole.name} onChange={e => setNewRole({
              ...newRole,
              name: e.target.value
            })} className="w-full p-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block mb-1 text-gray-800">Описание</label>
                <textarea value={newRole.description} onChange={e => setNewRole({
              ...newRole,
              description: e.target.value
            })} className="w-full p-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
              </div>
              <div className="flex gap-2 justify-end">
                <motion.button whileHover={{
              y: -2
            }} whileTap={{
              scale: 0.95
            }} onClick={handleCancelAdd} className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 font-medium rounded-lg px-4 py-2 shadow-md">
                  Отмена
                </motion.button>
                <motion.button whileHover={{
              y: -2
            }} whileTap={{
              scale: 0.95
            }} onClick={handleAddRole} className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 shadow-md">
                  Сохранить
                </motion.button>
              </div>
            </div>
          </Section>}

        {isEditingRole && editingRole && <Section title="Редактирование роли" delay={0.2}>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-800">Название</label>
                <input type="text" value={editingRole.name} onChange={e => setEditingRole({
              ...editingRole,
              name: e.target.value
            })} className="w-full p-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block mb-1 text-gray-800">Описание</label>
                <textarea value={editingRole.description} onChange={e => setEditingRole({
              ...editingRole,
              description: e.target.value
            })} className="w-full p-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
              </div>
              <div className="flex gap-2 justify-end">
                <motion.button whileHover={{
              y: -2
            }} whileTap={{
              scale: 0.95
            }} onClick={handleCancelEdit} className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 font-medium rounded-lg px-4 py-2 shadow-md">
                  Отмена
                </motion.button>
                <motion.button whileHover={{
              y: -2
            }} whileTap={{
              scale: 0.95
            }} onClick={handleUpdateRole} className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 shadow-md">
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
            }} className="p-4 bg-gray-100 rounded-lg border border-gray-200 shadow-md">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                        {role.name}
                      </h3>
                      <div className="flex gap-2">
                        <motion.button whileHover={{
                    y: -2
                  }} whileTap={{
                    scale: 0.95
                  }} onClick={() => handleEditClick(role)} className="bg-blue-500 hover:bg-blue-700 text-white rounded-lg p-1 shadow-md">
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button whileHover={{
                    y: -2
                  }} whileTap={{
                    scale: 0.95
                  }} onClick={() => handleDeleteRole(role.id)} className="bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 rounded-lg p-1 shadow-md">
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-gray-500 mt-2">{role.description}</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Пользователей с этой ролью: {role.usersCount}
                    </p>
                  </motion.div>)}
              </div> : <p className="text-gray-500 text-center py-4">Роли не найдены</p>}
          </div>
        </Section>

        <Section title="Пользователи и роли" delay={0.4}>
          <UsersRolesTable />
        </Section>
      </main>
    </div>;
}