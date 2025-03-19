"use client";

import * as React from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface MyChartStatsProps {
  totalBooks: number;
  recentBorrowed: number;
  totalBorrowed: number;
}

export default function MyChartStats({
  totalBooks = 0,
  recentBorrowed = 0,
  totalBorrowed = 0,
}: MyChartStatsProps) {
  const chartData = [
    { name: "Доступно", value: totalBooks - totalBorrowed },
    { name: "Недавно взято", value: recentBorrowed },
    { name: "Всего взято", value: totalBorrowed - recentBorrowed },
  ].filter(item => item.value > 0); // Убираем нулевые значения для чистоты графика

  const COLORS = ["#4F46E5", "#10B981", "#F59E0B"];

  return (
    <Link href="/admin/statistics" className="block cursor-pointer transition-transform hover:scale-[1.01]">
      <Card className="col-span-1 md:col-span-2 p-6 rounded-xl shadow-lg border-l-4 border-blue-600 hover:shadow-xl transition-shadow">
        <CardHeader className="pb-2 pt-0">
          <CardTitle className="text-lg font-medium">Статистика библиотеки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={130}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#999", strokeWidth: 1 }}
                  animationDuration={1000}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} книг`, ""]}
                  labelFormatter={() => ""}
                  contentStyle={{
                    backgroundColor: "rgb(255, 255, 255)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    border: "1px solid #e5e7eb",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ color: "#374151", fontWeight: "500" }}
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: "10px",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}