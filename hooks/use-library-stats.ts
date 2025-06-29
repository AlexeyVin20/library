import { useState, useEffect } from 'react';
import api, { LibraryStats } from '@/lib/api';

export function useLibraryStats() {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.statistics.getLibraryStats();
      setStats(data);
    } catch (err) {
      console.error('Ошибка при загрузке статистики:', err);
      setError('Не удалось загрузить статистику');
      // Устанавливаем заглушечные данные при ошибке
      setStats({
        totalBooks: 0,
        totalUsers: 0,
        totalJournals: 0,
        activeUsers: 0,
        totalBorrowedBooks: 0,
        totalAvailableBooks: 0,
        categories: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
} 