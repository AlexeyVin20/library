"use client"

import * as React from "react"
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

interface MyChartStatsProps {
  totalBooks?: number
  recentBorrowed?: number
  totalUsers?: number
  totalBorrowed?: number
}

const chartConfig = {
    value: {
      label: "Value",
      color: "hsl(var(--chart-1))",
    },
  }

export default function MyChartStats({
  totalBooks = 0,
  recentBorrowed = 0,
  totalBorrowed = 0,
}: MyChartStatsProps) {
  const chartData = [
    { label: "Всего книг", value: totalBooks },
    { label: "Недавно взяли", value: recentBorrowed },
    { label: "Взято книг", value: totalBorrowed },
  ]

  const COLORS = [
    "var(--color-primary)",
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
  ]

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">Круговая диаграмма</CardTitle>
        <CardDescription className="text-xs">
          Статистика по библиотеке
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-4 sm:pt-4">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={60}
                innerRadius={30}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
