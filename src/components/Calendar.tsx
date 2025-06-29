import { useState } from 'react'
import Calendar from 'react-calendar'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
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
  const [value, setValue] = useState<Date | Date[]>(selectedDate || new Date())
  const [activeStartDate, setActiveStartDate] = useState(new Date())

  const handleDateChange = (date: Date | Date[]) => {
    setValue(date)
    
    if (mode === 'single' && date instanceof Date) {
      onDateSelect(date)
    } else if (mode === 'range' && Array.isArray(date) && date.length === 2) {
      onRangeSelect?.(date[0], date[1])
    }
  }

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return ''
    
    const classes = []
    
    // Highlight specific dates
    if (highlightedDates.some(d => d.toDateString() === date.toDateString())) {
      classes.push('bg-primary-100 text-primary-700')
    }
    
    // Today
    if (date.toDateString() === new Date().toDateString()) {
      classes.push('bg-primary-600 text-white font-semibold')
    }
    
    return classes.join(' ')
  }

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    
    const hasData = highlightedDates.some(d => d.toDateString() === date.toDateString())
    
    return hasData ? (
      <div className="absolute top-1 right-1 w-2 h-2 bg-success-500 rounded-full" />
    ) : null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-6"
    >
      <Calendar
        onChange={handleDateChange}
        value={value}
        activeStartDate={activeStartDate}
        onActiveStartDateChange={({ activeStartDate }) => 
          setActiveStartDate(activeStartDate || new Date())
        }
        selectRange={mode === 'range'}
        tileClassName={tileClassName}
        tileContent={tileContent}
        navigationLabel={({ date }) => (
          <span className="text-lg font-semibold text-gray-900">
            {format(date, 'MMMM yyyy')}
          </span>
        )}
        prevLabel={<ChevronLeft className="w-4 h-4" />}
        nextLabel={<ChevronRight className="w-4 h-4" />}
        prev2Label={null}
        next2Label={null}
        showNeighboringMonth={false}
        className="w-full"
      />
      
      {/* Quick date selection */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">Accesos rápidos:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Hoy', date: new Date() },
            { label: 'Ayer', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            { label: 'Esta semana', date: new Date() },
            { label: 'Este mes', date: startOfMonth(new Date()) },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => handleDateChange(item.date)}
              className="btn btn-ghost text-xs py-1 px-2"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}