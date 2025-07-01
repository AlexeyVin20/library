"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, BookOpen, User, Mail, Phone, Calendar, FileText, MapPin, Lock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { USER_ROLES } from "@/lib/types";

// Схема валидации для формы регистрации
const registerSchema = z.object({
  fullName: z.string().min(2, "Полное имя должно содержать не менее 2 символов"),
  email: z.string().email("Введите корректный email"),
  phone: z.string().min(10, "Введите корректный номер телефона"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата рождения должна быть в формате YYYY-MM-DD"),
  passportNumber: z.string().min(10, "Номер паспорта должен содержать не менее 10 символов"),
  passportIssuedBy: z.string().min(2, "Кем выдан паспорт должно содержать не менее 2 символов"),
  passportIssuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата выдачи паспорта должна быть в формате YYYY-MM-DD"),
  address: z.string().min(5, "Адрес должен содержать не менее 5 символов"),
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
  const totalSteps = 3;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      passportNumber: "",
      passportIssuedBy: "",
      passportIssuedDate: "",
      address: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const nextStep = () => {
    const fieldsToValidate = currentStep === 1 
      ? ["fullName", "email", "phone", "dateOfBirth"] 
      : currentStep === 2 
        ? ["passportNumber", "passportIssuedBy", "passportIssuedDate", "address"] 
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

    // Преобразуем даты в формат ISO для API
    const formattedData = {
      ...registerData,
      dateOfBirth: new Date(registerData.dateOfBirth).toISOString(),
      passportIssuedDate: new Date(registerData.passportIssuedDate).toISOString(),
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

          // Редирект на главную страницу
          router.push("/");
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
            <div 
              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                currentStep > index + 1 
                  ? "bg-blue-500 text-white" 
                  : currentStep === index + 1 
                    ? "bg-blue-300 border border-blue-500 text-blue-700" 
                    : "bg-gray-100 border border-gray-200 text-gray-500"
              }`}
            >
              {currentStep > index + 1 ? "✓" : index + 1}
            </div>
            {index < totalSteps - 1 && (
              <div 
                className={`w-12 h-1 ${
                  currentStep > index + 1 
                    ? "bg-blue-500" 
                    : "bg-gray-100"
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <FadeInView>
      <Card className="w-full max-w-2xl bg-white rounded-xl shadow-lg border-0">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Регистрация нового пользователя
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Заполните форму для создания новой учетной записи
          </CardDescription>
          {renderStepIndicator()}
        </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert className="bg-red-100 border-l-4 border-red-500 rounded-lg">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <FadeInView>
                    <FormSection title="Личная информация">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-800 font-medium">Полное имя</FormLabel>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <FormControl>
                                <Input 
                                  placeholder="Иванов Иван Иванович" 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11 text-gray-800"
                                />
                              </FormControl>
                              <FormMessage className="text-red-800" />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-800 font-medium">Email</FormLabel>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="example@mail.ru" 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11 text-gray-800"
                                />
                              </FormControl>
                              <FormMessage className="text-red-800" />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-800 font-medium">Телефон</FormLabel>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <FormControl>
                                <Input 
                                  placeholder="+7 (999) 123-45-67" 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11 text-gray-800"
                                />
                              </FormControl>
                              <FormMessage className="text-red-800" />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-800 font-medium">Дата рождения</FormLabel>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11 text-gray-800"
                                />
                              </FormControl>
                              <FormMessage className="text-red-800" />
                            </div>
                          </FormItem>
                        )}
                      />
                    </FormSection>
                  </FadeInView>
                )}
                
                {/* Step 2: Document Information */}
                {currentStep === 2 && (
                  <FadeInView>
                    <FormSection title="Документы">
                      <FormField
                        control={form.control}
                        name="passportNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-800 font-medium">Номер паспорта</FormLabel>
                            <div className="relative">
                              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <FormControl>
                                <Input 
                                  placeholder="1234 567890" 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11 text-gray-800"
                                />
                              </FormControl>
                              <FormMessage className="text-red-800" />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="passportIssuedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-800 font-medium">Кем выдан</FormLabel>
                            <div className="relative">
                              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <FormControl>
                                <Input 
                                  placeholder="УМВД России по..." 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11 text-gray-800"
                                />
                              </FormControl>
                              <FormMessage className="text-red-800" />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="passportIssuedDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-800 font-medium">Дата выдачи паспорта</FormLabel>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11 text-gray-800"
                                />
                              </FormControl>
                              <FormMessage className="text-red-800" />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-gray-800 font-medium">Адрес</FormLabel>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <FormControl>
                                <Input 
                                  placeholder="г. Москва, ул. Ленина, д. 1, кв. 1" 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11 text-gray-800"
                                />
                              </FormControl>
                              <FormMessage className="text-red-800" />
                            </div>
                          </FormItem>
                        )}
                      />
                    </FormSection>
                  </FadeInView>
                )}
                
                {/* Step 3: Account Information */}
                {currentStep === 3 && (
                  <FadeInView>
                    <FormSection title="Данные учетной записи">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-800 font-medium">Имя пользователя</FormLabel>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <FormControl>
                                <Input 
                                  placeholder="user123" 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11 text-gray-800"
                                />
                              </FormControl>
                              <FormMessage className="text-red-800" />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <div className="hidden md:block"></div>
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-800 font-medium">Пароль</FormLabel>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="********" 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11 text-gray-800"
                                />
                              </FormControl>
                              <FormMessage className="text-red-800" />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-800 font-medium">Подтверждение пароля</FormLabel>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="********" 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11 text-gray-800"
                                />
                              </FormControl>
                              <FormMessage className="text-red-800" />
                            </div>
                          </FormItem>
                        )}
                      />
                    </FormSection>
                  </FadeInView>
                )}
                
                <div className="flex justify-between pt-6 border-t border-gray-100">
                  {currentStep > 1 && (
                    <motion.button
                      type="button"
                      onClick={prevStep}
                      className="bg-white border-2 border-blue-500 text-blue-500 hover:bg-gray-100 font-medium rounded-lg px-6 py-2 flex items-center gap-2"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                    >
                      Назад
                    </motion.button>
                  )}
                  
                  {currentStep < totalSteps ? (
                    <motion.button
                      type="button"
                      onClick={nextStep}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-6 py-2 flex items-center gap-2 ml-auto"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                    >
                      Далее
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-6 py-2 flex items-center gap-2 ml-auto"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Регистрация...
                        </>
                      ) : (
                        "Зарегистрироваться"
                      )}
                    </motion.button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-gray-500">
              Уже есть аккаунт?{" "}
              <Link href="/auth/login" className="font-medium text-blue-500 hover:text-blue-700 transition-colors">
                Войти
              </Link>
            </div>
          </CardFooter>
        </Card>
      </FadeInView>
    );
  }
