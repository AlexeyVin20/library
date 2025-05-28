"use client";

import React from "react";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
type ActionColor = "emerald" | "emerald-light" | "gray";
interface ActionProps {
  href: string;
  label: string;
  icon: React.ReactElement;
  color: ActionColor;
}
interface QuickActionsProps {
  actions: ActionProps[];
  title?: string;
}
const colorVariants: Record<ActionColor, string> = {
  emerald: "bg-emerald-300/40 hover:bg-emerald-400 border-emerald-400/30",
  "emerald-light": "bg-emerald-200/30 hover:bg-emerald-400/90 border-emerald-300/30",
  gray: "bg-slate-600/80 hover:bg-slate-500/90 border-slate-400/30"
};
const ActionCard = ({
  href,
  label,
  icon,
  color
}: ActionProps) => {
  return <Link href={href} className="block">
      <motion.div className={cn("rounded-xl p-4 backdrop-blur-md shadow-lg border border-white/10", "transition-all duration-300 h-full", "flex items-center gap-3", colorVariants[color])} whileHover={{
      scale: 1.03,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
    }} whileTap={{
      scale: 0.98
    }}>
        <div className="bg-white/10 rounded-lg p-2.5 flex-shrink-0">
          {React.cloneElement(icon, {
          className: "w-5 h-5 text-white"
        })}
        </div>
        <span className="font-medium text-white">{label}</span>
      </motion.div>
    </Link>;
};
export function QuickActions({
  actions,
  title = "Быстрые действия"
}: QuickActionsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerVariants = {
    expanded: {
      borderRadius: "1rem",
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.1
      }
    },
    collapsed: {
      borderRadius: "0.75rem",
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };
  const childVariants = {
    expanded: {
      opacity: 1,
      y: 0,
      height: "auto",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    collapsed: {
      opacity: 0,
      y: 20,
      height: 0,
      transition: {
        duration: 0.2
      }
    }
  };
  return <motion.div layout initial="expanded" animate={isCollapsed ? "collapsed" : "expanded"} variants={containerVariants} className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 backdrop-blur-xl rounded-xl p-5 shadow-lg border border-emerald-400/20">
      <div className="flex justify-between items-center mb-4">
        <motion.h2 className="text-lg font-bold text-white flex items-center gap-2" layout>
          <Sparkles className="w-5 h-5 text-emerald-300" />
          {title}
        </motion.h2>

        <motion.button onClick={() => setIsCollapsed(!isCollapsed)} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors" whileTap={{
        scale: 0.9
      }} aria-label={isCollapsed ? "Развернуть" : "Свернуть"}>
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </motion.button>
      </div>
      <AnimatePresence>
        {!isCollapsed && <motion.div variants={childVariants} initial="collapsed" animate="expanded" exit="collapsed" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-hidden">
            {actions.map((action, index) => <ActionCard key={index} href={action.href} label={action.label} color={action.color} icon={action.icon} />)}
          </motion.div>}
      </AnimatePresence>
      {isCollapsed && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} className="flex flex-wrap gap-3 justify-center">
          <TooltipProvider delayDuration={300}>
            {actions.map((action, index) => <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link href={action.href}>
                    <motion.div className={cn("rounded-full w-12 h-12 flex items-center justify-center", "shadow-md border border-white/10 backdrop-blur-md", colorVariants[action.color])} whileHover={{
                scale: 1.1,
                y: -2
              }} whileTap={{
                scale: 0.95
              }}>
                      {React.cloneElement(action.icon, {
                  className: "w-5 h-5 text-white"
                })}
                    </motion.div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-slate-900/90 backdrop-blur-md text-white border-emerald-500/30">
                  {action.label}
                </TooltipContent>
              </Tooltip>)}
          </TooltipProvider>
        </motion.div>}
    </motion.div>;
}

// Example usage component
export default function QuickActionsExample() {
  const quickActions = [{
    href: "/admin/reservations",
    label: "Резервирования",
    icon: <CalendarIcon />,
    color: "emerald-light" as const
  }, {
    href: "/admin/books",
    label: "Все книги",
    icon: <Layers />,
    color: "emerald" as const
  }, {
    href: "/admin/users",
    label: "Пользователи",
    icon: <Users />,
    color: "emerald-light" as const
  }, {
    href: "/admin/roles",
    label: "Управление ролями",
    icon: <Shield />,
    color: "emerald" as const
  }, {
    href: "/admin/statistics",
    label: "Статистика",
    icon: <PieChart />,
    color: "emerald-light" as const
  }, {
    href: "/admin/shelfs",
    label: "Полки",
    icon: <Bookmark />,
    color: "emerald" as const
  }];
  return <div className="p-4 max-w-4xl mx-auto">
      <QuickActions actions={quickActions} />
    </div>;
}

// Import these from lucide-react in your actual implementation
import { CalendarIcon, Layers, Users, Shield, PieChart, Bookmark } from "lucide-react";