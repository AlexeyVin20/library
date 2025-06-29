"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface UserBorrowingChartProps {
  data: {
    borrowed: number;
    available: number;
    reservations: number;
  };
}

export function UserBorrowingChart({ data }: UserBorrowingChartProps) {
  const chartData = [
    { name: "Взято", value: data.borrowed },
    { name: "Доступно", value: data.available },
    { name: "В обработке", value: data.reservations },
  ];
  
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];
  
  return (
    <div className="h-[200px] w-full bg-transparent">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={60}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => 
              percent > 0.1 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
            }
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} книг`, ""]}
            contentStyle={{
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
