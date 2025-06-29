import { useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  ChartData,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

interface ChartProps {
  type: 'line' | 'bar' | 'doughnut'
  data: ChartData<any>
  options?: ChartOptions<any>
  height?: number
}

export default function Chart({ type, data, options, height = 300 }: ChartProps) {
  const defaultOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter',
          },
          color: '#6b7280',
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter',
          },
          color: '#6b7280',
        },
      },
    } : undefined,
    ...options,
  }

  const chartProps = {
    data,
    options: defaultOptions,
  }

  return (
    <div className="chart-container" style={{ height }}>
      {type === 'line' && <Line {...chartProps} />}
      {type === 'bar' && <Bar {...chartProps} />}
      {type === 'doughnut' && <Doughnut {...chartProps} />}
    </div>
  )
}