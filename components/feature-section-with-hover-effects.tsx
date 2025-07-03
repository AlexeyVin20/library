'use client';
import { cn } from "@/lib/utils";
import {
  Search,
  Sparkles,
  Smartphone,
  BarChart3,
  BookOpen,
  Users,
  Shield,
  Bell,
} from "lucide-react";

export function LibraryFeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Умный поиск",
      description:
        "Находите нужные книги мгновенно с продвинутыми фильтрами и алгоритмами машинного обучения.",
      icon: <Search className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      textColor: "text-white",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      title: "Персонализация",
      description:
        "Получайте персональные рекомендации на основе ваших предпочтений и истории чтения.",
      icon: <Sparkles className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
      textColor: "text-white",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
    },
    {
      title: "Мобильность",
      description:
        "Доступ к каталогу с любого устройства, в любое время. Полная синхронизация данных.",
      icon: <Smartphone className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-green-500 to-green-600",
      textColor: "text-white",
      hoverColor: "hover:from-green-600 hover:to-green-700",
    },
    {
      title: "Аналитика",
      description: 
        "Детальная статистика и отчеты для эффективного управления библиотечными ресурсами.",
      icon: <BarChart3 className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-orange-500 to-orange-600",
      textColor: "text-white",
      hoverColor: "hover:from-orange-600 hover:to-orange-700",
    },
    {
      title: "Управление каталогом",
      description: 
        "Автоматизированное управление коллекцией книг с поддержкой множественных форматов.",
      icon: <BookOpen className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      textColor: "text-white",
      hoverColor: "hover:from-indigo-600 hover:to-indigo-700",
    },
    {
      title: "Контроль пользователей",
      description:
        "Гибкая система ролей и прав доступа для безопасного управления пользователями.",
      icon: <Users className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-teal-500 to-teal-600",
      textColor: "text-white",
      hoverColor: "hover:from-teal-600 hover:to-teal-700",
    },
    {
      title: "Безопасность",
      description:
        "Современные методы защиты данных и соответствие стандартам информационной безопасности.",
      icon: <Shield className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-red-500 to-red-600",
      textColor: "text-white",
      hoverColor: "hover:from-red-600 hover:to-red-700",
    },
    {
      title: "Уведомления",
      description: 
        "Система уведомлений в реальном времени о статусе книг, задолженностях и новинках.",
      icon: <Bell className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-pink-500 to-pink-600",
      textColor: "text-white",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <LibraryFeature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const LibraryFeature = ({
  title,
  description,
  icon,
  bgColor,
  textColor,
  hoverColor,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  hoverColor: string;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "relative group/feature rounded-2xl p-6 shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl",
        bgColor,
        hoverColor,
        textColor
      )}
    >
      {/* Декоративный градиент при hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/feature:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
      
      {/* Иконка */}
      <div className="mb-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover/feature:bg-white/30 transition-colors duration-300">
          {icon}
        </div>
      </div>
      
      {/* Заголовок */}
      <div className="text-xl font-bold mb-3 relative z-10">
        <span className="group-hover/feature:translate-x-1 transition-transform duration-300 inline-block">
          {title}
        </span>
      </div>
      
      {/* Описание */}
      <p className="text-sm opacity-90 leading-relaxed relative z-10 group-hover/feature:opacity-100 transition-opacity duration-300">
        {description}
      </p>
      
      {/* Декоративная полоса снизу */}
      <div className="absolute bottom-0 left-0 h-1 w-0 group-hover/feature:w-full bg-white/30 rounded-b-2xl transition-all duration-500 ease-out" />
    </div>
  );
};

// Экспортируем также оригинальный компонент для совместимости
export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Built for developers",
      description:
        "Built for engineers, developers, dreamers, thinkers and doers.",
      icon: <Search className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-slate-500 to-slate-600",
      textColor: "text-white",
      hoverColor: "hover:from-slate-600 hover:to-slate-700",
    },
    {
      title: "Ease of use",
      description:
        "It's as easy as using an Apple, and as expensive as buying one.",
      icon: <Sparkles className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-gray-500 to-gray-600",
      textColor: "text-white",
      hoverColor: "hover:from-gray-600 hover:to-gray-700",
    },
    {
      title: "Pricing like no other",
      description:
        "Our prices are best in the market. No cap, no lock, no credit card required.",
      icon: <BarChart3 className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      textColor: "text-white",
      hoverColor: "hover:from-emerald-600 hover:to-emerald-700",
    },
    {
      title: "100% Uptime guarantee",
      description: "We just cannot be taken down by anyone.",
      icon: <BookOpen className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      textColor: "text-white",
      hoverColor: "hover:from-cyan-600 hover:to-cyan-700",
    },
    {
      title: "Multi-tenant Architecture",
      description: "You can simply share passwords instead of buying new seats",
      icon: <Users className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-amber-500 to-amber-600",
      textColor: "text-white",
      hoverColor: "hover:from-amber-600 hover:to-amber-700",
    },
    {
      title: "24/7 Customer Support",
      description:
        "We are available a 100% of the time. Atleast our AI Agents are.",
      icon: <Shield className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-violet-500 to-violet-600",
      textColor: "text-white",
      hoverColor: "hover:from-violet-600 hover:to-violet-700",
    },
    {
      title: "Money back guarantee",
      description:
        "If you donot like EveryAI, we will convince you to like us.",
      icon: <Bell className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-rose-500 to-rose-600",
      textColor: "text-white",
      hoverColor: "hover:from-rose-600 hover:to-rose-700",
    },
    {
      title: "And everything else",
      description: "I just ran out of copy ideas. Accept my sincere apologies",
      icon: <Smartphone className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-lime-500 to-lime-600",
      textColor: "text-white",
      hoverColor: "hover:from-lime-600 hover:to-lime-700",
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <LibraryFeature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}
