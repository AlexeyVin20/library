"use client";

import { useState } from "react";

export const dynamic = 'force-dynamic';
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, BookOpen, User, Mail, Phone, Lock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { USER_ROLES } from "@/lib/types";

// Схема валидации для формы регистрации
const registerSchema = z.object({
  fullName: z.string().min(2, "Полное имя должно содержать не менее 2 символов"),
  email: z.string().email("Введите корректный email"),
  phone: z.string().min(10, "Введите корректный номер телефона"),
  username: z.string().min(3, "Имя пользователя должно содержать не менее 3 символов"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
  confirmPassword: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Компонент для анимированного появления
const FadeInView = ({ children, delay = 0, duration = 0.5 }: { children: React.ReactNode; delay?: number; duration?: number }) => {
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

// Компонент для группировки полей формы
const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-blue-500">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const nextStep = () => {
    const fieldsToValidate = currentStep === 1 
      ? ["fullName", "email", "phone"] 
      : ["username", "password", "confirmPassword"];
    
    form.trigger(fieldsToValidate as any).then(isValid => {
      if (isValid) {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      }
    });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    setError(null);

    // Удаляем confirmPassword из данных отправки
    const { confirmPassword, ...registerData } = data;

    // Формируем данные для API
    const formattedData = {
      ...registerData,
      // Автоматически устанавливаем ограничения для роли "Гость"
      maxBooksAllowed: USER_ROLES.GUEST.maxBooksAllowed,
      loanPeriodDays: USER_ROLES.GUEST.loanPeriodDays,
      fineAmount: 0,
      borrowedBooksCount: 0,
      dateRegistered: new Date().toISOString(),
      isActive: true,
      borrowedBooks: null,
    };

    try {
      // Создаём пользователя без ролей через /api/User
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/User`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        let errorMessage = "Ошибка при регистрации";
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

      const newUser = await response.json();

      // Назначаем роль "Гость" после создания пользователя
      if (newUser.id) {
        try {
          const assignRoleResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/User/assign-role`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: newUser.id,
              roleId: USER_ROLES.GUEST.id // ID: 4
            }),
          });

          if (!assignRoleResponse.ok) {
            console.warn("Не удалось назначить роль 'Гость' пользователю, но регистрация прошла успешно");
          }
        } catch (roleError) {
          console.warn("Ошибка при назначении роли 'Гость':", roleError);
        }
      }

      // Теперь нужно авторизовать пользователя
      // Попробуем войти с созданными учетными данными
      try {
        const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/Auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: registerData.username,
            password: registerData.password,
          }),
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          
          // Сохраняем токен в localStorage
          localStorage.setItem("token", loginData.token);
          localStorage.setItem("user", JSON.stringify({
            id: loginData.userId || newUser.id,
            username: loginData.username || registerData.username,
            roles: loginData.roles || ["Гость"],
          }));

          toast({
            title: "Успешная регистрация",
            description: "Вы успешно зарегистрировались и вошли в систему как гость",
          });

          // Перезагружаем страницу после успешного входа
          window.location.reload();
        } else {
          // Если автоматический вход не удался, просто уведомляем о успешной регистрации
          toast({
            title: "Регистрация завершена",
            description: "Аккаунт создан. Пожалуйста, войдите в систему.",
          });
          
          router.push("/auth/login");
        }
      } catch (loginError) {
        console.warn("Не удалось автоматически войти после регистрации:", loginError);
        toast({
          title: "Регистрация завершена",
          description: "Аккаунт создан. Пожалуйста, войдите в систему.",
        });
        
        router.push("/auth/login");
      }
    } catch (err) {
      console.error("Ошибка регистрации:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при регистрации");
      
      toast({
        title: "Ошибка регистрации",
        description: err instanceof Error ? err.message : "Произошла ошибка при регистрации",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const renderStepIndicator = () => {
    return (
      <div className="flex justify-center mb-6">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center">
            <motion.div 
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                currentStep > index + 1 
                  ? "bg-blue-500 text-white" 
                  : currentStep === index + 1 
                    ? "bg-blue-200 border-2 border-blue-500 text-blue-800" 
                    : "bg-gray-200 border border-gray-300 text-gray-500"
              }`}
              animate={{ scale: currentStep === index + 1 ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {currentStep > index + 1 ? "✓" : index + 1}
            </motion.div>
            {index < totalSteps - 1 && (
              <motion.div 
                className="w-16 h-1"
                initial={{ width: 0 }}
                animate={{ width: currentStep > index + 1 ? 64 : 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <div className={`h-full w-full ${currentStep > index + 1 ? "bg-blue-500" : "bg-gray-200"}`} />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <FadeInView>
      <Card className="w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/80">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Создание аккаунта
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Заполните форму для регистрации нового пользователя
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert className="bg-red-100 border-l-4 border-red-500 rounded-lg">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 1 && (
                    <div className="space-y-4">
                       <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Полное имя</FormLabel>
                              <FormControl>
                                <Input placeholder="Иванов Иван Иванович" {...field} className="bg-gray-100 border-gray-300 text-gray-800 focus:bg-white" />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Email</FormLabel>
                              <FormControl>
                                <Input placeholder="example@mail.com" {...field} className="bg-gray-100 border-gray-300 text-gray-800 focus:bg-white" />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Телефон</FormLabel>
                              <FormControl>
                                <Input placeholder="+7 (999) 999-99-99" {...field} className="bg-gray-100 border-gray-300 text-gray-800 focus:bg-white" />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Имя пользователя</FormLabel>
                              <FormControl>
                                <Input placeholder="username" {...field} className="bg-gray-100 border-gray-300 text-gray-800 focus:bg-white" />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Пароль</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="********" {...field} className="bg-gray-100 border-gray-300 text-gray-800 focus:bg-white" />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Подтвердите пароль</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="********" {...field} className="bg-gray-100 border-gray-300 text-gray-800 focus:bg-white" />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between pt-4">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep} className="bg-transparent border-gray-400 text-gray-700 hover:bg-gray-200">
                    Назад
                  </Button>
                )}
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white ml-auto">
                    Далее
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {isLoading ? <Loader2 className="animate-spin" /> : "Зарегистрироваться"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-gray-500">
            Уже есть аккаунт?{" "}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Войти
            </Link>
          </div>
        </CardFooter>
      </Card>
    </FadeInView>
  );
}
