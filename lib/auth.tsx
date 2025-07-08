"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Определение типа пользователя
export type User = {
  id: string;
  username: string;
  roles: string[]; // Названия ролей пользователя (например, "Администратор", "Пользователь")
  passwordResetRequired?: boolean;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      // Проверяем наличие токена в localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Проверяем валидность токена через API запрос
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Auth/session`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        try {
          const userData = await response.json(); // userData теперь типа AuthUserDto

          // Получаем роли напрямую из userData.roles
          const roles = Array.isArray(userData.roles) ? userData.roles : [];

          // Добавляем passwordResetRequired, если пришел с сервера
          const passwordResetRequiredFromApi = typeof userData.passwordResetRequired !== "undefined" ? userData.passwordResetRequired : false;

          // Обновляем данные пользователя из запроса
          const userInfo: User = {
            id: userData.id,
            username: userData.username,
            // Добавляем другие поля из AuthUserDto, если они нужны в стейте user
            // fullName: userData.fullName,
            // email: userData.email,
            // ... и т.д.
            roles: roles, // Используем напрямую полученные роли
            passwordResetRequired: passwordResetRequiredFromApi,
          };

          setUser(userInfo);
          
          // Сохраняем данные пользователя в localStorage для доступа в других компонентах
          localStorage.setItem("user", JSON.stringify(userInfo));

          // Если требуется смена пароля и пользователь не находится на нужной странице, перенаправляем
          if (userInfo.passwordResetRequired && typeof window !== "undefined" && window.location.pathname !== "/auth/force-password-change") {
            router.push("/auth/force-password-change");
          }

          // Убираем автоматический редирект, позволяя пользователям оставаться на текущей странице
          // Если нужен редирект для администратора, он будет обрабатываться через соответствующий layout
        } catch (parseError) {
          console.error("Ошибка при парсинге ответа /Auth/session:", parseError);
          localStorage.removeItem("token");
          localStorage.removeItem("user"); // Удаляем также данные пользователя
          setUser(null);
        }
      } else {
        // Если токен недействителен, очищаем localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    } catch (error) {
      console.error("Ошибка при проверке аутентификации:", error);
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let errorMessage = "Ошибка при входе";
        try {
          if (response.headers.get("Content-Type")?.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            errorMessage = (await response.text()) || errorMessage;
          }
        } catch (parseError) {
          console.error("Ошибка при парсинге ответа:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json(); // data теперь типа AuthResponse
      localStorage.setItem("token", data.token);

      // Доступ к данным пользователя через data.user
      if (data.user) {
        const roles = Array.isArray(data.user.roles) ? data.user.roles : [];

        const passwordResetRequiredFromApi =
          typeof data.user.passwordResetRequired !== "undefined"
            ? data.user.passwordResetRequired
            : data.passwordResetRequired || false;

        const userData: User = {
          id: data.user.id,
          username: data.user.username,
          roles: roles,
          passwordResetRequired: passwordResetRequiredFromApi,
        };

        // Сохраняем данные пользователя в localStorage
        localStorage.setItem("user", JSON.stringify(userData));

        setUser(userData);

        // Если пользователь должен сменить пароль, направляем его на страницу смены и прекращаем дальнейшие редиректы
        if (userData.passwordResetRequired) {
          router.push("/auth/force-password-change");
          return; // прерываем дальнейшую логику
        }

        // Перенаправление после входа
        if (roles.includes("Администратор")) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
         // Обработка случая, если бэкенд не вернул user в ответе login
         console.error("Данные пользователя не были получены при входе.");
         logout(); // Разлогинить пользователя, так как данные неполные
         throw new Error("Не удалось получить данные пользователя при входе.");
      }
    } catch (error) {
      console.error("Ошибка при входе:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 