"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LegacyResetPasswordRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Собираем строку запроса
    const qs = searchParams.toString();
    router.replace(`/auth/reset-password${qs ? `?${qs}` : ""}`);
  }, [router, searchParams]);

  return null;
} 