"use client";

import * as React from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CalendarIcon, Layers, Users, Shield, PieChart, Bookmark, Activity, ChevronRight } from "lucide-react";
const TRANSITION = {
  type: "spring",
  bounce: 0.1,
  duration: 0.4
};
interface QuickActionsMenuContextType {
  isOpen: boolean;
  openMenu: (rect: DOMRect) => void;
  closeMenu: () => void;
  uniqueId: string;
  triggerRect: DOMRect | null;
}
const QuickActionsMenuContext = React.createContext<QuickActionsMenuContextType | undefined>(undefined);
function useQuickActionsMenuLogic() {
  const uniqueId = React.useId();
  const [isOpen, setIsOpen] = React.useState(false);
  const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null);
  const openMenu = (rect: DOMRect) => {
    setTriggerRect(rect);
    setIsOpen(true);
  };
  const closeMenu = () => {
    setIsOpen(false);
  };
  return {
    isOpen,
    openMenu,
    closeMenu,
    uniqueId,
    triggerRect
  };
}
interface QuickActionsMenuRootProps {
  children: (context: QuickActionsMenuContextType) => React.ReactNode;
  className?: string;
}
export function QuickActionsMenuRoot({
  children,
  className
}: QuickActionsMenuRootProps) {
  const menuLogic = useQuickActionsMenuLogic();
  return <QuickActionsMenuContext.Provider value={menuLogic}>
      <MotionConfig transition={TRANSITION}>
        <div className={cn("relative", className)}>{children(menuLogic)}</div>
      </MotionConfig>
    </QuickActionsMenuContext.Provider>;
}
interface QuickActionsMenuTriggerProps {
  className?: string;
}
export function QuickActionsMenuTrigger({
  className
}: QuickActionsMenuTriggerProps) {
  const {
    openMenu,
    uniqueId
  } = React.useContext(QuickActionsMenuContext)!;
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const handleClick = () => {
    if (triggerRef.current) {
      openMenu(triggerRef.current.getBoundingClientRect());
    }
  };
  return <motion.button ref={triggerRef} layoutId={`quick-actions-trigger-${uniqueId}`} className={cn("fixed z-50 bottom-8 right-8 p-4 rounded-full bg-blue-500 hover:bg-blue-700 shadow-lg border-2 border-blue-500 flex items-center justify-center text-white transition-colors", className)} onClick={handleClick} whileHover={{
    scale: 1.08
  }} whileTap={{
    scale: 0.95
  }} aria-label="Быстрые действия">
      <Activity className="w-7 h-7 text-white" />
    </motion.button>;
}
interface QuickActionsMenuContentProps {
  className?: string;
}
export function QuickActionsMenuContent({
  className
}: QuickActionsMenuContentProps) {
  const {
    isOpen,
    closeMenu,
    uniqueId,
    triggerRect
  } = React.useContext(QuickActionsMenuContext)!;
  const contentRef = React.useRef<HTMLDivElement>(null);
  const quickActions = [{
    href: "/admin/reservations",
    label: "Резервирования",
    icon: <CalendarIcon className="w-5 h-5" />,
    color: "blue-light" as const
  }, {
    href: "/admin/books",
    label: "Все книги",
    icon: <Layers className="w-5 h-5" />,
    color: "blue" as const
  }, {
    href: "/admin/users",
    label: "Пользователи",
    icon: <Users className="w-5 h-5" />,
    color: "blue-light" as const
  }, {
    href: "/admin/roles",
    label: "Управление ролями",
    icon: <Shield className="w-5 h-5" />,
    color: "blue" as const
  }, {
    href: "/admin/statistics",
    label: "Статистика",
    icon: <PieChart className="w-5 h-5" />,
    color: "blue-light" as const
  }, {
    href: "/admin/shelfs",
    label: "Полки",
    icon: <Bookmark className="w-5 h-5" />,
    color: "blue" as const
  }];
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeMenu]);
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu]);
  const getMenuPosition = () => {
    if (!triggerRect) return {
      right: 32,
      bottom: 80
    }; // запасные значения
    // Открываем меню над кнопкой, немного смещая влево
    return {
      left: triggerRect.left - 220 + triggerRect.width / 2,
      top: triggerRect.top - 16 - 320 // 320px — примерная высота меню
    };
  };
  return <AnimatePresence>
      {isOpen && <>
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 0.5
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-40 bg-gray-800" />
          <motion.div ref={contentRef} layoutId={`quick-actions-menu-${uniqueId}`} className={cn("fixed z-50 min-w-[280px] max-w-[320px] overflow-hidden rounded-xl border-2 border-blue-500 bg-white shadow-lg outline-none text-gray-800", className)} style={getMenuPosition()} initial={{
        opacity: 0,
        scale: 0.9,
        x: -20
      }} animate={{
        opacity: 1,
        scale: 1,
        x: 0
      }} exit={{
        opacity: 0,
        scale: 0.9,
        x: -20
      }}>
            <div className="px-6 py-4 border-b-2 border-blue-500">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Быстрые действия
              </h3>
            </div>
            <div className="p-2">
              {quickActions.map((action, index) => <motion.div key={action.href} initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: index * 0.05
          }}>
                  <Link href={action.href} onClick={closeMenu} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-800 hover:bg-gray-100 transition-all duration-200 group">
                    <div className={`p-2 rounded-lg ${action.color === "blue" ? "bg-blue-500 text-white" : "bg-blue-300 text-gray-800"} group-hover:scale-110 transition-transform duration-200`}>
                      {action.icon}
                    </div>
                    <span className="font-medium flex-1">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-800 group-hover:translate-x-1 transition-all duration-200" />
                  </Link>
                </motion.div>)}
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}

// Основной компонент для использования
export function QuickActionsMenu() {
  return <QuickActionsMenuRoot>
      {context => <>
          <QuickActionsMenuTrigger />
          <QuickActionsMenuContent />
        </>}
    </QuickActionsMenuRoot>;
}