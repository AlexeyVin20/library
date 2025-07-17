// ReportGenerator.ts
// Система генерации HTML отчетов в стиле Anthropic

export interface ReportData {
  title: string
  subtitle?: string
  sections: ReportSection[]
  metadata: {
    generatedAt: string
    generatedBy: string
    dataSource: string
    period?: string
  }
}

export interface ReportSection {
  id: string
  title: string
  type: 'text' | 'chart' | 'table' | 'metrics' | 'insights'
  content: any
  description?: string
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter'
  data: any[]
  xAxis?: string
  yAxis?: string
  title?: string
  colors?: string[]
}

export interface TableData {
  headers: string[]
  rows: any[][]
  summary?: {
    totalRows: number
    highlights?: string[]
  }
}

export interface MetricsData {
  metrics: {
    label: string
    value: string | number
    change?: {
      value: number
      type: 'increase' | 'decrease' | 'neutral'
      period: string
    }
    icon?: string
  }[]
}

export class ReportGenerator {
  private static readonly ANTHROPIC_COLORS = {
    primary: '#8B4513', // Коричневый
    secondary: '#D2B48C', // Песочный
    accent: '#4682B4', // Стальной синий
    background: '#FFFFFF', // Белый
    surface: '#F8F9FA', // Светло-серый
    text: '#2C3E50', // Темно-серый
    textLight: '#6C757D', // Серый
    border: '#E9ECEF', // Светлая граница
    success: '#28A745',
    warning: '#FFC107',
    danger: '#DC3545',
    info: '#17A2B8'
  }

  private static getBaseStyles(): string {
    return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: ${this.ANTHROPIC_COLORS.text};
          background: ${this.ANTHROPIC_COLORS.background};
        }
        
        .report-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: ${this.ANTHROPIC_COLORS.background};
        }
        
        .report-header {
          text-align: center;
          margin-bottom: 3rem;
          padding: 2rem;
          background: linear-gradient(135deg, ${this.ANTHROPIC_COLORS.primary}15, ${this.ANTHROPIC_COLORS.accent}15);
          border-radius: 12px;
          border: 1px solid ${this.ANTHROPIC_COLORS.border};
        }
        
        .report-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: ${this.ANTHROPIC_COLORS.primary};
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }
        
        .report-subtitle {
          font-size: 1.2rem;
          color: ${this.ANTHROPIC_COLORS.textLight};
          font-weight: 400;
        }
        
        .report-metadata {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
          padding: 1.5rem;
          background: ${this.ANTHROPIC_COLORS.surface};
          border-radius: 8px;
          border: 1px solid ${this.ANTHROPIC_COLORS.border};
        }
        
        .metadata-item {
          text-align: center;
        }
        
        .metadata-label {
          font-size: 0.875rem;
          color: ${this.ANTHROPIC_COLORS.textLight};
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        
        .metadata-value {
          font-size: 1rem;
          font-weight: 600;
          color: ${this.ANTHROPIC_COLORS.text};
        }
        
        .report-section {
          margin-bottom: 3rem;
          background: ${this.ANTHROPIC_COLORS.background};
          border-radius: 12px;
          border: 1px solid ${this.ANTHROPIC_COLORS.border};
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        
        .section-header {
          padding: 1.5rem 2rem;
          background: ${this.ANTHROPIC_COLORS.surface};
          border-bottom: 1px solid ${this.ANTHROPIC_COLORS.border};
        }
        
        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: ${this.ANTHROPIC_COLORS.primary};
          margin-bottom: 0.5rem;
        }
        
        .section-description {
          color: ${this.ANTHROPIC_COLORS.textLight};
          font-size: 0.95rem;
        }
        
        .section-content {
          padding: 2rem;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        .metric-card {
          padding: 1.5rem;
          background: ${this.ANTHROPIC_COLORS.surface};
          border-radius: 8px;
          border: 1px solid ${this.ANTHROPIC_COLORS.border};
          text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .metric-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        
        .metric-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: ${this.ANTHROPIC_COLORS.primary};
          margin-bottom: 0.25rem;
        }
        
        .metric-label {
          font-size: 0.95rem;
          color: ${this.ANTHROPIC_COLORS.textLight};
          margin-bottom: 0.5rem;
        }
        
        .metric-change {
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }
        
        .metric-change.increase {
          color: ${this.ANTHROPIC_COLORS.success};
          background: ${this.ANTHROPIC_COLORS.success}15;
        }
        
        .metric-change.decrease {
          color: ${this.ANTHROPIC_COLORS.danger};
          background: ${this.ANTHROPIC_COLORS.danger}15;
        }
        
        .metric-change.neutral {
          color: ${this.ANTHROPIC_COLORS.textLight};
          background: ${this.ANTHROPIC_COLORS.border};
        }
        
        .chart-container {
          background: ${this.ANTHROPIC_COLORS.surface};
          border-radius: 8px;
          padding: 1.5rem;
          margin: 1rem 0;
        }
        
        .table-container {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid ${this.ANTHROPIC_COLORS.border};
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: ${this.ANTHROPIC_COLORS.background};
        }
        
        .data-table th {
          background: ${this.ANTHROPIC_COLORS.primary};
          color: white;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .data-table td {
          padding: 0.875rem 1rem;
          border-bottom: 1px solid ${this.ANTHROPIC_COLORS.border};
          font-size: 0.95rem;
        }
        
        .data-table tbody tr:hover {
          background: ${this.ANTHROPIC_COLORS.surface};
        }
        
        .data-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .insights-list {
          list-style: none;
          padding: 0;
        }
        
        .insight-item {
          padding: 1rem;
          margin-bottom: 1rem;
          background: ${this.ANTHROPIC_COLORS.surface};
          border-radius: 8px;
          border-left: 4px solid ${this.ANTHROPIC_COLORS.accent};
          font-size: 0.95rem;
          line-height: 1.6;
        }
        
        .insight-item:last-child {
          margin-bottom: 0;
        }
        
        .text-content {
          font-size: 1rem;
          line-height: 1.7;
          color: ${this.ANTHROPIC_COLORS.text};
        }
        
        .text-content p {
          margin-bottom: 1rem;
        }
        
        .text-content p:last-child {
          margin-bottom: 0;
        }
        
        @media (max-width: 768px) {
          .report-container {
            padding: 1rem;
          }
          
          .report-title {
            font-size: 2rem;
          }
          
          .section-content {
            padding: 1.5rem;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media print {
          .report-container {
            max-width: none;
            padding: 0;
          }
          
          .report-section {
            break-inside: avoid;
            margin-bottom: 2rem;
          }
        }
      </style>
    `
  }

  static generateReport(data: ReportData): string {
    const html = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        ${this.getBaseStyles()}
      </head>
      <body>
        <div class="report-container">
          ${this.generateHeader(data)}
          ${data.sections.map(section => this.generateSection(section)).join('')}
        </div>
        <script>
          ${this.generateChartScripts(data.sections)}
        </script>
      </body>
      </html>
    `
    return html
  }

  private static generateHeader(data: ReportData): string {
    return `
      <div class="report-header">
        <h1 class="report-title">${data.title}</h1>
        ${data.subtitle ? `<p class="report-subtitle">${data.subtitle}</p>` : ''}
        <div class="report-metadata">
          <div class="metadata-item">
            <div class="metadata-label">Создан</div>
            <div class="metadata-value">${new Date(data.metadata.generatedAt).toLocaleDateString('ru-RU')}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Автор</div>
            <div class="metadata-value">${data.metadata.generatedBy}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Источник данных</div>
            <div class="metadata-value">${data.metadata.dataSource}</div>
          </div>
          ${data.metadata.period ? `
            <div class="metadata-item">
              <div class="metadata-label">Период</div>
              <div class="metadata-value">${data.metadata.period}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `
  }

  private static generateSection(section: ReportSection): string {
    return `
      <div class="report-section">
        <div class="section-header">
          <h2 class="section-title">${section.title}</h2>
          ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
        </div>
        <div class="section-content">
          ${this.generateSectionContent(section)}
        </div>
      </div>
    `
  }

  private static generateSectionContent(section: ReportSection): string {
    switch (section.type) {
      case 'metrics':
        return this.generateMetrics(section.content as MetricsData)
      case 'chart':
        return this.generateChart(section.content as ChartData, section.id)
      case 'table':
        return this.generateTable(section.content as TableData)
      case 'insights':
        return this.generateInsights(section.content as string[])
      case 'text':
        return this.generateText(section.content as string)
      default:
        return '<p>Неподдерживаемый тип секции</p>'
    }
  }

  private static generateMetrics(data: MetricsData): string {
    return `
      <div class="metrics-grid">
        ${data.metrics.map(metric => `
          <div class="metric-card">
            ${metric.icon ? `<div class="metric-icon">${metric.icon}</div>` : ''}
            <div class="metric-value">${metric.value}</div>
            <div class="metric-label">${metric.label}</div>
            ${metric.change ? `
              <div class="metric-change ${metric.change.type}">
                ${metric.change.type === 'increase' ? '↗' : metric.change.type === 'decrease' ? '↘' : '→'} 
                ${Math.abs(metric.change.value)}% за ${metric.change.period}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `
  }

  private static generateChart(data: ChartData, sectionId: string): string {
    const canvasId = `chart-${sectionId}`
    return `
      <div class="chart-container">
        ${data.title ? `<h3 style="margin-bottom: 1rem; color: ${this.ANTHROPIC_COLORS.primary};">${data.title}</h3>` : ''}
        <canvas id="${canvasId}" width="400" height="200"></canvas>
      </div>
    `
  }

  private static generateTable(data: TableData): string {
    return `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              ${data.headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${data.summary ? `
          <div style="padding: 1rem; background: ${this.ANTHROPIC_COLORS.surface}; border-top: 1px solid ${this.ANTHROPIC_COLORS.border};">
            <small style="color: ${this.ANTHROPIC_COLORS.textLight};">
              Всего записей: ${data.summary.totalRows}
              ${data.summary.highlights ? ` | ${data.summary.highlights.join(' | ')}` : ''}
            </small>
          </div>
        ` : ''}
      </div>
    `
  }

  private static generateInsights(insights: string[]): string {
    return `
      <ul class="insights-list">
        ${insights.map(insight => `<li class="insight-item">${insight}</li>`).join('')}
      </ul>
    `
  }

  private static generateText(content: string): string {
    return `<div class="text-content">${content.split('\n').map(p => `<p>${p}</p>`).join('')}</div>`
  }

  private static generateChartScripts(sections: ReportSection[]): string {
    const chartSections = sections.filter(s => s.type === 'chart')
    
    return chartSections.map(section => {
      const data = section.content as ChartData
      const canvasId = `chart-${section.id}`
      
      return `
        {
          const ctx = document.getElementById('${canvasId}').getContext('2d');
          new Chart(ctx, {
            type: '${data.type}',
            data: {
              labels: ${JSON.stringify(data.data.map((item: any) => item[data.xAxis || 'label']))},
              datasets: [{
                label: '${data.title || 'Данные'}',
                data: ${JSON.stringify(data.data.map((item: any) => item[data.yAxis || 'value']))},
                backgroundColor: ${JSON.stringify(data.colors || [
                  this.ANTHROPIC_COLORS.primary + '80',
                  this.ANTHROPIC_COLORS.accent + '80',
                  this.ANTHROPIC_COLORS.secondary + '80'
                ])},
                borderColor: ${JSON.stringify(data.colors || [
                  this.ANTHROPIC_COLORS.primary,
                  this.ANTHROPIC_COLORS.accent,
                  this.ANTHROPIC_COLORS.secondary
                ])},
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: ${data.type === 'pie'},
                  position: 'bottom'
                }
              },
              scales: ${data.type !== 'pie' ? `{
                y: {
                  beginAtZero: true,
                  grid: {
                    color: '${this.ANTHROPIC_COLORS.border}'
                  }
                },
                x: {
                  grid: {
                    color: '${this.ANTHROPIC_COLORS.border}'
                  }
                }
              }` : 'undefined'}
            }
          });
        }
      `
    }).join('\n')
  }
}

// Утилиты для создания данных отчета
export class ReportDataBuilder {
  private data: ReportData

  constructor(title: string, subtitle?: string) {
    this.data = {
      title,
      subtitle,
      sections: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'WiseOwl AI Assistant',
        dataSource: 'Библиотечная система'
      }
    }
  }

  setPeriod(period: string): this {
    this.data.metadata.period = period
    return this
  }

  addMetricsSection(title: string, metrics: MetricsData, description?: string): this {
    this.data.sections.push({
      id: `metrics-${this.data.sections.length}`,
      title,
      type: 'metrics',
      content: metrics,
      description
    })
    return this
  }

  addChartSection(title: string, chart: ChartData, description?: string): this {
    this.data.sections.push({
      id: `chart-${this.data.sections.length}`,
      title,
      type: 'chart',
      content: chart,
      description
    })
    return this
  }

  addTableSection(title: string, table: TableData, description?: string): this {
    this.data.sections.push({
      id: `table-${this.data.sections.length}`,
      title,
      type: 'table',
      content: table,
      description
    })
    return this
  }

  addInsightsSection(title: string, insights: string[], description?: string): this {
    this.data.sections.push({
      id: `insights-${this.data.sections.length}`,
      title,
      type: 'insights',
      content: insights,
      description
    })
    return this
  }

  addTextSection(title: string, content: string, description?: string): this {
    this.data.sections.push({
      id: `text-${this.data.sections.length}`,
      title,
      type: 'text',
      content,
      description
    })
    return this
  }

  build(): ReportData {
    return this.data
  }

  generateHTML(): string {
    return ReportGenerator.generateReport(this.data)
  }
}

