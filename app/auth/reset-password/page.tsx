"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Key } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const passwordSchema = z.object({
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
  confirmPassword: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const FadeInView = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

function ResetPasswordFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (!tokenParam) {
      setError("Неверная или истекшая ссылка для сброса пароля.");
      toast({ title: "Ошибка", description: "Ссылка недействительна. Попробуйте запросить сброс пароля еще раз.", variant: "destructive" });
      router.push("/auth/forgot-password");
    } else {
      setToken(tokenParam);
      if (emailParam) setEmail(emailParam);
    }
  }, [searchParams, router, toast]);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: PasswordFormValues) {
    if (!token) {
      setError("Отсутствует токен для сброса пароля.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          ...(email ? { email } : {}),
          newPassword: data.password,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Ошибка при смене пароля";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) { /* ignore */ }
        throw new Error(errorMessage);
      }

      toast({
        title: "Пароль успешно изменен",
        description: "Теперь вы можете войти в систему с новым паролем.",
      });
      
      router.push("/auth/login");

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Произошла неизвестная ошибка";
      setError(errorMessage);
      toast({
        title: "Ошибка",
        description: errorMessage,
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
            Установить новый пароль
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Пожалуйста, введите ваш новый пароль.
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Новый пароль</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} disabled={isLoading || !token} />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Подтвердите пароль</FormLabel>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} disabled={isLoading || !token} />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </div>
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg h-11 mt-6" 
                disabled={isLoading || !token}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Установить пароль"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FadeInView>
  );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Загрузка...</div>}>
            <ResetPasswordFormComponent />
        </Suspense>
    )
} 