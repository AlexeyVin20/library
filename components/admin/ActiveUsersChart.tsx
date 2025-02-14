"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ActiveUsersChartProps {
  totalUsers: number;
  activeUsers: number;
}

export default function ActiveUsersChart({
  totalUsers = 0,
  activeUsers = 0,
}: ActiveUsersChartProps) {
  const data = [
    { label: "Всего пользователей", value: totalUsers },
    { label: "Активных пользователей", value: activeUsers },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" stroke="currentColor" />
          <YAxis stroke="currentColor" />
          <Tooltip />
          <Bar dataKey="value" fill="#4F46E5" radius={3} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
