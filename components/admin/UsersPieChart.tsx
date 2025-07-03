'use client';

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface UsersPieChartProps {
  activeUsers: number;
  inactiveUsers: number;
}

export function UsersPieChart({ activeUsers, inactiveUsers }: UsersPieChartProps) {
  const data = [
    { name: "Активные", value: activeUsers },
    { name: "Неактивные", value: inactiveUsers }
  ];
  
  const COLORS = ["#10B981", "#EF4444"];
  
  return (
    <div className="h-[250px] w-full bg-transparent">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={60}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} пользователей`, ""]}
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
