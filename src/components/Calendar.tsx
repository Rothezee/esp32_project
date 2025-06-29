import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface CalendarProps {
  onDateSelect: (date: Date) => void
  onRangeSelect?: (start: Date, end: Date) => void
  selectedDate?: Date
  highlightedDates?: Date[]
  mode?: 'single' | 'range'
}

export default function CustomCalendar({
  onDateSelect,
  onRangeSelect,
  selectedDate,
  highlightedDates = [],
  mode = 'single'
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [selectedRange, setSelectedRange] = useState<Date[]>([])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get first day of week for the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay()

  // Create array of days including empty cells for proper calendar layout
  const calendarDays = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add all days of the month
  calendarDays.push(...daysInMonth)

  const handleDateClick = (date: Date) => {
    if (mode === 'single') {
      onDateSelect(date)
    } else if (mode === 'range') {
      if (selectedRange.length === 0 || selectedRange.length === 2) {
        setSelectedRange([date])
      } else {
        const newRange = [selectedRange[0], date].sort((a, b) => a.getTime() - b.getTime())
        setSelectedRange(newRange)
        onRangeSelect?.(newRange[0], newRange[1])
      }
    }
  }

  const isDateSelected = (date: Date) => {
    if (mode === 'single') {
      return selectedDate?.toDateString() === date.toDateString()
    } else {
      return selectedRange.some(d => d.toDateString() === date.toDateString())
    }
  }

  const isDateInRange = (date: Date) => {
    if (mode === 'range' && selectedRange.length === 2) {
      return date >= selectedRange[0] && date <= selectedRange[1]
    }
    return false
  }

  const isDateHighlighted = (date: Date) => {
    return highlightedDates.some(d => d.toDateString() === date.toDateString())
  }

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-6 max-w-md mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => (
          <div key={index} className="aspect-square">
            {date ? (
              <button
                onClick={() => handleDateClick(date)}
                className={`
                  w-full h-full flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200
                  ${isDateSelected(date) 
                    ? 'bg-primary-600 text-white' 
                    : isDateInRange(date)
                    ? 'bg-primary-100 text-primary-700'
                    : isToday(date)
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : isDateHighlighted(date)
                    ? 'bg-success-100 text-success-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${date.getMonth() !== currentDate.getMonth() ? 'text-gray-400' : ''}
                `}
              >
                {date.getDate()}
                {isDateHighlighted(date) && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-success-500 rounded-full" />
                )}
              </button>
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
        ))}
      </div>
      
      {/* Quick date selection */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">Accesos rápidos:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Hoy', date: new Date() },
            { label: 'Ayer', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            { label: 'Esta semana', date: new Date() },
            { label: 'Este mes', date: startOfMonth(new Date()) },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => handleDateClick(item.date)}
              className="btn btn-ghost text-xs py-1 px-3"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}