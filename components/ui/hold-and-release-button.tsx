"use client";

import * as React from "react"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";
import { Trash2Icon } from "lucide-react";
import { useState, useRef, useCallback } from "react";

interface ButtonHoldAndReleaseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    holdDuration?: number;
    onAction?: () => void;
    children?: React.ReactNode;
}

function ButtonHoldAndRelease({
    className,
    holdDuration = 3000,
    onAction,
    children,
    ...props
}: ButtonHoldAndReleaseProps) {
    const [isHolding, setIsHolding] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const controls = useAnimation();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleHoldStart = useCallback(async () => {
        setIsHolding(true);
        setIsCompleted(false);
        
        // Сначала сбрасываем анимацию
        controls.set({ width: "0%" });
        
        // Запускаем анимацию заполнения
        controls.start({
            width: "100%",
            transition: {
                duration: holdDuration / 1000,
                ease: "linear",
            },
        });

        // Устанавливаем таймер для вызова действия
        timeoutRef.current = setTimeout(() => {
            setIsCompleted(true);
            setIsHolding(false);
            if (onAction) {
                onAction();
            }
        }, holdDuration);
    }, [controls, holdDuration, onAction]);

    const handleHoldEnd = useCallback(() => {
        if (isCompleted) return; // Если уже завершено, не прерываем
        
        setIsHolding(false);
        setIsCompleted(false);
        
        // Очищаем таймер
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Быстро сбрасываем анимацию
        controls.stop();
        controls.start({
            width: "0%",
            transition: { duration: 0.1 },
        });
    }, [controls, isCompleted]);

    // Очищаем таймер при размонтировании компонента
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <Button
            className={cn(
                "min-w-40 relative overflow-hidden touch-none",
                "bg-red-100 dark:bg-red-200",
                "hover:bg-red-100 dark:hover:bg-red-200",
                "text-red-500 dark:text-red-600",
                "border border-red-200 dark:border-red-300",
                isCompleted && "bg-red-500 text-white border-red-500",
                className
            )}
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
            onTouchCancel={handleHoldEnd}
            disabled={isCompleted}
            {...props}
        >
            <motion.div
                initial={{ width: "0%" }}
                animate={controls}
                className={cn(
                    "absolute left-0 top-0 h-full",
                    "bg-red-400/60 dark:bg-red-500/60",
                    "border-r border-red-500/30"
                )}
            />
            <span className="relative z-10 w-full flex items-center justify-center gap-2">
                {children || (
                    <>
                        <Trash2Icon className="w-4 h-4" />
                        {isCompleted ? "Удалено" : isHolding ? "Удаление..." : "Удалить"}
                    </>
                )}
            </span>
        </Button>
    );
}

export { ButtonHoldAndRelease }