"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Label } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface BorrowedBooksChartProps {
  data: { month: string; borrowed: number }[];
}

export default function BorrowedBooksChart({ data }: BorrowedBooksChartProps) {
  // Градиент для баров
  const renderGradient = () => (
    <defs>
      <linearGradient id="borrowedGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.9} />
        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.7} />
      </linearGradient>
    </defs>
  );

  return (
    <Link href="/admin/statistics" className="block cursor-pointer transition-transform hover:scale-[1.01]">
      <Card className="p-6 rounded-xl shadow-lg border-l-4 border-blue-600 hover:shadow-xl transition-shadow">
        <CardHeader className="pb-2 pt-0">
          <CardTitle className="text-lg font-medium">Взятые книги по месяцам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                {renderGradient()}
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  height={60}
                  interval={0}
                >
                  <Label 
                    value="Месяцы" 
                    position="insideBottom" 
                    offset={-10} 
                    fill="#6b7280" 
                    fontSize={14}
                    fontWeight={500}
                  />
                </XAxis>
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={{ stroke: "#e5e7eb" }}
                >
                  <Label
                    value="Количество книг"
                    angle={-90}
                    position="insideLeft"
                    style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 14, fontWeight: 500 }}
                    offset={-15}
                  />
                </YAxis>
                <Tooltip
                  formatter={(value: number) => [`${value} книг`, "Взято"]}
                  labelFormatter={(label) => `Месяц: ${label}`}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    border: "1px solid #e5e7eb",
                    padding: "10px 14px",
                  }}
                  itemStyle={{ color: "#374151", fontWeight: "500" }}
                  cursor={{ fill: "rgba(79, 70, 229, 0.1)" }}
                  wrapperStyle={{ zIndex: 1000 }}
                  animationDuration={300}
                />
                <Legend 
                  verticalAlign="top" 
                  height={30} 
                  iconType="circle"
                  formatter={() => "Взятые книги по месяцам"}
                  wrapperStyle={{ fontSize: 14, fontWeight: 600, color: "#4a5568" }}
                />
                <Bar
                  name="Взято книг"
                  dataKey="borrowed"
                  fill="url(#borrowedGradient)"
                  radius={[6, 6, 0, 0]}
                  barSize={35}
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}