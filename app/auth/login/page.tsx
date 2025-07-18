'use client';

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
import { Loader2, BookOpen, User, Lock } from 'lucide-react';
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// Схема валидации для формы логина
const loginSchema = z.object({
  username: z.string().min(1, "Имя пользователя обязательно"),
  password: z.string().min(1, "Пароль обязателен"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.username, data.password);
      
      toast({
        title: "Успешный вход",
        description: "Вы успешно вошли в систему",
        variant: "default",
      });
    } catch (err) {
      console.error("Ошибка входа:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при входе");
      
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Произошла ошибка при входе",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <FadeInView>
      <Card className="w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/80">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Вход в систему
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Введите ваши учетные данные для входа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert className="bg-red-100 border-l-4 border-red-500 rounded-lg">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Имя пользователя</FormLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <FormControl>
                        <Input 
                          placeholder="username" 
                          {...field} 
                          disabled={isLoading} 
                          className="pl-10 bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Пароль</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="********" 
                          {...field} 
                          disabled={isLoading} 
                          className="pl-10 bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-lg h-11"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </div>
                    <div className="text-right">
                        <Link href="/auth/forgot-password"
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                          Забыли пароль?
                        </Link>
                    </div>
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg h-11 mt-6 shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Вход...
                  </>
                ) : (
                  "Войти"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-gray-500">
            Ещё нет аккаунта?{" "}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Зарегистрироваться
            </Link>
          </div>
        </CardFooter>
      </Card>
    </FadeInView>
  );
}
