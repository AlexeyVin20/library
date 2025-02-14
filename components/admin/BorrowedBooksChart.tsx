// components/admin/BorrowedBooksChart.tsx
"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
    value: {
      label: "Value",
      color: "hsl(var(--chart-1))",
    },
  }

const borrowedBooksData = [
  { month: "Январь", borrowed: 10 },
  { month: "Февраль", borrowed: 15 },
  { month: "Март", borrowed: 12 },
  { month: "Апрель", borrowed: 20 },
  { month: "Май", borrowed: 25 },
  { month: "Июнь", borrowed: 18 },
]

export default function BorrowedBooksChart() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">Книги по месяцам</CardTitle>
        <CardDescription className="text-xs">
          Количество взятых книг по месяцам
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-4 sm:pt-4">
        <ChartContainer config={chartConfig} className="h-[150px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={borrowedBooksData}>
              <XAxis dataKey="month" stroke="currentColor" />
              <YAxis stroke="currentColor" />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="borrowed" fill="var(--color-primary)" radius={3} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-xs">
        <div className="leading-none text-muted-foreground">
          Данные по месяцам
        </div>
      </CardFooter>
    </Card>
  )
}
