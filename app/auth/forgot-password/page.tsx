"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  identifier: z.string().min(3, "Введите email или имя пользователя"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const FadeInView = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: "" },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: data.identifier }),
      });

      if (!response.ok) {
        let errorMessage = "Ошибка при отправке запроса";
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) { /* ignore */ }
        throw new Error(errorMessage);
      }

      setIsSuccess(true);
      toast({
        title: "Запрос отправлен",
        description: "Если аккаунт с таким email существует, на него будет отправлена ссылка для сброса пароля.",
      });

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
            Восстановление пароля
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Введите ваш email для сброса пароля
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
             <Alert className="bg-green-100 border-l-4 border-green-500 rounded-lg text-center">
                <AlertDescription className="text-green-800">
                    Проверьте вашу почту. Мы отправили вам ссылку для восстановления пароля.
                </AlertDescription>
             </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert className="bg-red-100 border-l-4 border-red-500 rounded-lg">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email или логин</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Input 
                            placeholder="username или user@example.com" 
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
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg h-11 mt-6 shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    "Сбросить пароль"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter>
          <Link href="/auth/login" className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4"/>
            Вернуться ко входу
          </Link>
        </CardFooter>
      </Card>
    </FadeInView>
  );
} 