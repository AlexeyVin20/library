"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ru } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];
const WEEKDAYS_SHORT_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const WEEKDAYS_LONG_RU = [
  "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"
];

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  locale,
  ...props
}: CalendarProps) {
  // Заменяем цвета на синие в соответствии с новой схемой
  const defaultClassNames = {
    months: "relative flex flex-col sm:flex-row gap-4",
    month: "w-full",
    month_caption: "relative mx-10 mb-1 flex h-9 items-center justify-center z-20",
    caption_label: "text-gray-800 font-bold",
    nav: "absolute top-0 flex w-full justify-between z-10",
    button_previous: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-white bg-blue-500 hover:bg-blue-700 border-2 border-blue-500 rounded-full font-bold shadow-lg transition-all duration-200 p-0"
    ),
    button_next: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-white bg-blue-500 hover:bg-blue-700 border-2 border-blue-500 rounded-full font-bold shadow-lg transition-all duration-200 p-0"
    ),
    weekday: "size-9 p-0 text-gray-800 font-semibold uppercase",
    day_button:
      // Основные стили + синий фон для выбранных дат
      "relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg p-0 text-gray-800 outline-offset-2 group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not(.range-middle)]:duration-150 focus:outline-none group-data-[disabled]:pointer-events-none focus-visible:z-10 hover:bg-gray-100 group-data-[selected]:bg-blue-500 hover:text-gray-800 group-data-[selected]:text-white group-data-[disabled]:text-gray-500 group-data-[disabled]:line-through group-data-[outside]:text-gray-500 group-data-[outside]:group-data-[selected]:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-data-[selected]:group-[.range-middle]:bg-blue-300 group-data-[selected]:group-[.range-middle]:text-gray-800",
    day: "group size-9 px-0 text-sm",
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today:
      "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-blue-500 [&[data-selected]:not(.range-middle)>*]:after:bg-white [&[data-disabled]>*]:after:bg-gray-500 *:after:transition-colors",
    outside: "text-gray-500 data-selected:bg-blue-300 data-selected:text-gray-800",
    hidden: "invisible",
    week_number: "size-9 p-0 text-xs font-medium text-gray-500",
  };

  // Исправлено: убраны ошибки типов, теперь ключи приводятся к строке и используется индекс сигнатуры
  const mergedClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]:
        classNames && classNames[key as keyof typeof classNames]
          ? cn(
              defaultClassNames[key as keyof typeof defaultClassNames],
              classNames[key as keyof typeof classNames]
            )
          : defaultClassNames[key as keyof typeof defaultClassNames],
    }),
    {} as Record<string, string>
  );

  const defaultComponents = {
    Chevron: (props: any) => {
      if (props.orientation === "left") {
        return <ChevronLeft size={32} strokeWidth={2.5} {...props} aria-hidden="true" />;
      }
      return <ChevronRight size={32} strokeWidth={2.5} {...props} aria-hidden="true" />;
    },
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      locale={locale || ru}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };