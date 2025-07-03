'use client';

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface FinesChartProps {
  data: { name: string; value: number }[];
}

export function FinesChart({ data }: FinesChartProps) {
  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
  
  // Преобразуем данные, если их слишком много
  const processedData = data.length > 5 
    ? [
        ...data.slice(0, 4),
        { 
          name: "Другие", 
          value: data.slice(4).reduce((sum, item) => sum + item.value, 0) 
        }
      ]
    : data;
  
  return (
    <div className="h-[200px] w-full bg-transparent">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={60}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${typeof value === 'number' ? value.toFixed(2) : value} ₽`, ""]}
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
