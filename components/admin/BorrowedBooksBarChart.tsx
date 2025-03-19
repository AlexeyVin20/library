"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BorrowedBooksBarChartProps {
  users: { name: string; value: number }[];
}

export function BorrowedBooksBarChart({ users }: BorrowedBooksBarChartProps) {
  // Сокращаем имена для отображения на графике
  const data = users.map(user => ({
    name: user.name.split(' ')[0], // Берем только имя
    fullName: user.name,
    value: user.value
  }));
  
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" domain={[0, 'dataMax']} />
          <YAxis 
            dataKey="name" 
            type="category" 
            scale="band" 
            tick={{ fontSize: 12 }}
            width={50}
          />
          <Tooltip
            formatter={(value) => [`${value} книг`, "Книг на руках"]}
            labelFormatter={(label, payload) => payload[0]?.payload.fullName || label}
            contentStyle={{
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)'
            }}
          />
          <Bar 
            dataKey="value" 
            fill="#4F46E5"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
