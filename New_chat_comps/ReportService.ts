// ReportService.ts
// Сервис для создания отчетов на основе статистических данных

import { ReportDataBuilder, ChartData, TableData, MetricsData } from './ReportGenerator'
import { APIUtils, DataFormatter } from './AIAssistantUtils'

export interface StatisticsData {
  users?: any
  books?: any
  reservations?: any
  topBooks?: any[]
}

export class ReportService {
  
  // Создание отчета по пользователям
  static async createUserReport(data: StatisticsData): Promise<string> {
    const builder = new ReportDataBuilder(
      'Отчет по пользователям библиотеки',
      'Анализ активности и статистики пользователей'
    ).setPeriod('Текущий период')

    // Метрики пользователей
    if (data.users) {
      const userMetrics: MetricsData = {
        metrics: [
          {
            label: 'Всего пользователей',
            value: data.users.totalUsers || 0,
            icon: '👥',
            change: data.users.userGrowth ? {
              value: data.users.userGrowth,
              type: data.users.userGrowth > 0 ? 'increase' : 'decrease',
              period: 'месяц'
            } : undefined
          },
          {
            label: 'Активных пользователей',
            value: data.users.activeUsers || 0,
            icon: '✅',
            change: data.users.activeGrowth ? {
              value: data.users.activeGrowth,
              type: data.users.activeGrowth > 0 ? 'increase' : 'decrease',
              period: 'месяц'
            } : undefined
          },
          {
            label: 'Новых регистраций',
            value: data.users.newRegistrations || 0,
            icon: '🆕'
          },
          {
            label: 'Средняя активность',
            value: `${data.users.averageActivity || 0}%`,
            icon: '📊'
          }
        ]
      }

      builder.addMetricsSection(
        'Основные показатели',
        userMetrics,
        'Ключевые метрики по пользователям библиотеки'
      )
    }

    // График активности по дням
    if (data.users?.dailyActivity) {
      const activityChart: ChartData = {
        type: 'line',
        data: data.users.dailyActivity,
        xAxis: 'date',
        yAxis: 'activity',
        title: 'Активность пользователей по дням',
        colors: ['#8B4513', '#4682B4']
      }

      builder.addChartSection(
        'Динамика активности',
        activityChart,
        'График показывает изменение активности пользователей за период'
      )
    }

    // Таблица топ пользователей
    if (data.users?.topUsers) {
      const usersTable: TableData = {
        headers: ['Пользователь', 'Книг взято', 'Активность', 'Последний визит'],
        rows: data.users.topUsers.map((user: any) => [
          user.fullName || user.username,
          user.booksCount || 0,
          `${user.activityScore || 0}%`,
          DataFormatter.formatDate(user.lastVisit)
        ]),
        summary: {
          totalRows: data.users.topUsers.length,
          highlights: [`Самый активный: ${data.users.topUsers[0]?.fullName || 'N/A'}`]
        }
      }

      builder.addTableSection(
        'Топ активных пользователей',
        usersTable,
        'Пользователи с наибольшей активностью в библиотеке'
      )
    }

    // Инсайты
    const insights = this.generateUserInsights(data.users)
    if (insights.length > 0) {
      builder.addInsightsSection(
        'Ключевые выводы',
        insights,
        'Автоматически сгенерированные выводы на основе данных'
      )
    }

    return builder.generateHTML()
  }

  // Создание отчета по книгам
  static async createBookReport(data: StatisticsData): Promise<string> {
    const builder = new ReportDataBuilder(
      'Отчет по книжному фонду',
      'Анализ каталога и популярности книг'
    ).setPeriod('Текущий период')

    // Метрики книг
    if (data.books) {
      const bookMetrics: MetricsData = {
        metrics: [
          {
            label: 'Всего книг',
            value: data.books.totalBooks || 0,
            icon: '📚'
          },
          {
            label: 'Доступно для выдачи',
            value: data.books.availableBooks || 0,
            icon: '✅',
            change: data.books.availabilityChange ? {
              value: data.books.availabilityChange,
              type: data.books.availabilityChange > 0 ? 'increase' : 'decrease',
              period: 'неделя'
            } : undefined
          },
          {
            label: 'Выдано сейчас',
            value: data.books.issuedBooks || 0,
            icon: '📖'
          },
          {
            label: 'Популярность',
            value: `${data.books.popularityIndex || 0}%`,
            icon: '⭐'
          }
        ]
      }

      builder.addMetricsSection(
        'Состояние фонда',
        bookMetrics,
        'Текущее состояние книжного фонда библиотеки'
      )
    }

    // График по жанрам
    if (data.books?.genreDistribution) {
      const genreChart: ChartData = {
        type: 'pie',
        data: data.books.genreDistribution,
        xAxis: 'genre',
        yAxis: 'count',
        title: 'Распределение книг по жанрам'
      }

      builder.addChartSection(
        'Распределение по жанрам',
        genreChart,
        'Процентное соотношение книг различных жанров в фонде'
      )
    }

    // Топ популярных книг
    if (data.topBooks && data.topBooks.length > 0) {
      const topBooksTable: TableData = {
        headers: ['Название', 'Автор', 'Жанр', 'Выдач', 'Рейтинг'],
        rows: data.topBooks.map((book: any) => [
          book.title,
          book.authors || 'Неизвестен',
          book.genre || 'Не указан',
          book.issueCount || 0,
          `${book.rating || 0}/5`
        ]),
        summary: {
          totalRows: data.topBooks.length,
          highlights: [`Самая популярная: "${data.topBooks[0]?.title || 'N/A'}"`]
        }
      }

      builder.addTableSection(
        'Топ популярных книг',
        topBooksTable,
        'Книги с наибольшим количеством выдач'
      )
    }

    // Инсайты
    const insights = this.generateBookInsights(data.books, data.topBooks)
    if (insights.length > 0) {
      builder.addInsightsSection(
        'Рекомендации',
        insights,
        'Рекомендации по управлению книжным фондом'
      )
    }

    return builder.generateHTML()
  }

  // Создание отчета по резервированиям
  static async createReservationReport(data: StatisticsData): Promise<string> {
    const builder = new ReportDataBuilder(
      'Отчет по резервированиям',
      'Анализ бронирований и выдач книг'
    ).setPeriod('Текущий период')

    // Метрики резервирований
    if (data.reservations) {
      const reservationMetrics: MetricsData = {
        metrics: [
          {
            label: 'Всего резервирований',
            value: data.reservations.totalReservations || 0,
            icon: '📅'
          },
          {
            label: 'Активных',
            value: data.reservations.activeReservations || 0,
            icon: '🔄',
            change: data.reservations.activeChange ? {
              value: data.reservations.activeChange,
              type: data.reservations.activeChange > 0 ? 'increase' : 'decrease',
              period: 'день'
            } : undefined
          },
          {
            label: 'Просроченных',
            value: data.reservations.overdueReservations || 0,
            icon: '⚠️'
          },
          {
            label: 'Процент выполнения',
            value: `${data.reservations.completionRate || 0}%`,
            icon: '✅'
          }
        ]
      }

      builder.addMetricsSection(
        'Статистика резервирований',
        reservationMetrics,
        'Основные показатели по резервированиям книг'
      )
    }

    // График статусов резервирований
    if (data.reservations?.statusDistribution) {
      const statusChart: ChartData = {
        type: 'bar',
        data: data.reservations.statusDistribution,
        xAxis: 'status',
        yAxis: 'count',
        title: 'Распределение по статусам',
        colors: ['#28A745', '#FFC107', '#DC3545', '#17A2B8']
      }

      builder.addChartSection(
        'Статусы резервирований',
        statusChart,
        'Количество резервирований по различным статусам'
      )
    }

    // График динамики по дням
    if (data.reservations?.dailyStats) {
      const dailyChart: ChartData = {
        type: 'line',
        data: data.reservations.dailyStats,
        xAxis: 'date',
        yAxis: 'count',
        title: 'Динамика резервирований по дням'
      }

      builder.addChartSection(
        'Динамика по дням',
        dailyChart,
        'Изменение количества резервирований за период'
      )
    }

    // Инсайты
    const insights = this.generateReservationInsights(data.reservations)
    if (insights.length > 0) {
      builder.addInsightsSection(
        'Анализ и рекомендации',
        insights,
        'Выводы на основе анализа данных по резервированиям'
      )
    }

    return builder.generateHTML()
  }

  // Создание комплексного отчета
  static async createComprehensiveReport(data: StatisticsData): Promise<string> {
    const builder = new ReportDataBuilder(
      'Комплексный отчет библиотеки WiseOwl',
      'Полный анализ деятельности библиотеки'
    ).setPeriod('Текущий период')

    // Общие метрики
    const overallMetrics: MetricsData = {
      metrics: [
        {
          label: 'Всего пользователей',
          value: data.users?.totalUsers || 0,
          icon: '👥'
        },
        {
          label: 'Книг в фонде',
          value: data.books?.totalBooks || 0,
          icon: '📚'
        },
        {
          label: 'Активных резервирований',
          value: data.reservations?.activeReservations || 0,
          icon: '📅'
        },
        {
          label: 'Общая активность',
          value: `${this.calculateOverallActivity(data)}%`,
          icon: '📊'
        }
      ]
    }

    builder.addMetricsSection(
      'Общие показатели',
      overallMetrics,
      'Ключевые метрики деятельности библиотеки'
    )

    // Топ книги
    if (data.topBooks && data.topBooks.length > 0) {
      const topBooksChart: ChartData = {
        type: 'bar',
        data: data.topBooks.slice(0, 10).map(book => ({
          title: book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title,
          count: book.issueCount || 0
        })),
        xAxis: 'title',
        yAxis: 'count',
        title: 'Топ-10 популярных книг'
      }

      builder.addChartSection(
        'Популярные книги',
        topBooksChart,
        'Самые востребованные книги в библиотеке'
      )
    }

    // Комплексные инсайты
    const insights = this.generateComprehensiveInsights(data)
    if (insights.length > 0) {
      builder.addInsightsSection(
        'Стратегические выводы',
        insights,
        'Комплексный анализ и рекомендации для развития библиотеки'
      )
    }

    return builder.generateHTML()
  }

  // Генерация инсайтов для пользователей
  private static generateUserInsights(userData: any): string[] {
    const insights: string[] = []

    if (!userData) return insights

    if (userData.userGrowth > 10) {
      insights.push('Наблюдается значительный рост числа пользователей (+' + userData.userGrowth + '%). Рекомендуется расширить книжный фонд.')
    }

    if (userData.activeUsers / userData.totalUsers < 0.3) {
      insights.push('Низкая активность пользователей (менее 30%). Стоит рассмотреть программы стимулирования чтения.')
    }

    if (userData.newRegistrations > userData.totalUsers * 0.1) {
      insights.push('Высокий приток новых пользователей. Необходимо обеспечить качественное обслуживание новичков.')
    }

    return insights
  }

  // Генерация инсайтов для книг
  private static generateBookInsights(bookData: any, topBooks: any[]): string[] {
    const insights: string[] = []

    if (!bookData) return insights

    if (bookData.availableBooks / bookData.totalBooks < 0.7) {
      insights.push('Низкая доступность книг (менее 70%). Рекомендуется увеличить количество экземпляров популярных изданий.')
    }

    if (topBooks && topBooks.length > 0) {
      const topGenres = this.getTopGenres(topBooks)
      if (topGenres.length > 0) {
        insights.push(`Самые популярные жанры: ${topGenres.join(', ')}. Стоит пополнить фонд книгами этих жанров.`)
      }
    }

    if (bookData.popularityIndex < 50) {
      insights.push('Общая популярность фонда ниже среднего. Рекомендуется провести анализ потребностей читателей.')
    }

    return insights
  }

  // Генерация инсайтов для резервирований
  private static generateReservationInsights(reservationData: any): string[] {
    const insights: string[] = []

    if (!reservationData) return insights

    if (reservationData.overdueReservations > reservationData.totalReservations * 0.1) {
      insights.push('Высокий процент просроченных резервирований (более 10%). Необходимо улучшить систему напоминаний.')
    }

    if (reservationData.completionRate < 80) {
      insights.push('Низкий процент выполнения резервирований. Стоит проанализировать причины отмен.')
    }

    if (reservationData.activeChange > 20) {
      insights.push('Резкий рост активных резервирований. Убедитесь в достаточности персонала для обработки.')
    }

    return insights
  }

  // Генерация комплексных инсайтов
  private static generateComprehensiveInsights(data: StatisticsData): string[] {
    const insights: string[] = []

    const activity = this.calculateOverallActivity(data)
    
    if (activity > 80) {
      insights.push('Библиотека показывает отличные результаты активности. Продолжайте текущую стратегию развития.')
    } else if (activity > 60) {
      insights.push('Хорошие показатели активности, но есть потенциал для роста. Рассмотрите новые программы привлечения читателей.')
    } else {
      insights.push('Активность библиотеки требует внимания. Необходим комплексный план по повышению вовлеченности пользователей.')
    }

    // Анализ соотношения пользователей и книг
    if (data.users?.totalUsers && data.books?.totalBooks) {
      const ratio = data.books.totalBooks / data.users.totalUsers
      if (ratio < 10) {
        insights.push('Низкое соотношение книг к пользователям. Рекомендуется пополнение фонда.')
      } else if (ratio > 50) {
        insights.push('Очень высокое соотношение книг к пользователям. Возможно, стоит активнее привлекать новых читателей.')
      }
    }

    return insights
  }

  // Вспомогательные методы
  private static calculateOverallActivity(data: StatisticsData): number {
    let score = 0
    let factors = 0

    if (data.users?.activeUsers && data.users?.totalUsers) {
      score += (data.users.activeUsers / data.users.totalUsers) * 100
      factors++
    }

    if (data.books?.issuedBooks && data.books?.totalBooks) {
      score += (data.books.issuedBooks / data.books.totalBooks) * 100
      factors++
    }

    if (data.reservations?.completionRate) {
      score += data.reservations.completionRate
      factors++
    }

    return factors > 0 ? Math.round(score / factors) : 0
  }

  private static getTopGenres(books: any[]): string[] {
    const genreCount: { [key: string]: number } = {}
    
    books.forEach(book => {
      if (book.genre) {
        genreCount[book.genre] = (genreCount[book.genre] || 0) + 1
      }
    })

    return Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre)
  }

  // Метод для создания отчета на основе команды ИИ
  static async createReportFromAICommand(
    reportType: 'users' | 'books' | 'reservations' | 'comprehensive',
    statisticsData: StatisticsData
  ): Promise<string> {
    switch (reportType) {
      case 'users':
        return this.createUserReport(statisticsData)
      case 'books':
        return this.createBookReport(statisticsData)
      case 'reservations':
        return this.createReservationReport(statisticsData)
      case 'comprehensive':
        return this.createComprehensiveReport(statisticsData)
      default:
        throw new Error(`Неподдерживаемый тип отчета: ${reportType}`)
    }
  }
}

