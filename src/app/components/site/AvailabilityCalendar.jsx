'use client'
import { useState, useEffect, useMemo } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  startOfDay,
  parseISO,
  isValid
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  X,
  CalendarDays
} from 'lucide-react'

// Helper function to safely parse dates
const safeParseDate = (dateString) => {
  if (!dateString) return null
  try {
    const date = parseISO(dateString) // Assumes 'yyyy-MM-dd' format
    return isValid(date) ? startOfDay(date) : null
  } catch (error) {
    console.error("Error parsing date:", dateString, error)
    return null
  }
}

export default function AvailabilityCalendar({ property, isOpen, onClose }) {
  // Calendar view state
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date())) 
  const [secondMonth, setSecondMonth] = useState(addMonths(currentDate, 1))
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)

  // Today's date for disabling past dates
  const today = useMemo(() => startOfDay(new Date()), [])

  // Parse availability ranges from property data
  const availabilityRanges = useMemo(() => {
    if (!property?.availability || !Array.isArray(property.availability)) {
      return []
    }
    
    return property.availability.map(range => ({
      ...range,
      startDate: safeParseDate(range.start_date),
      endDate: safeParseDate(range.end_date),
      isAvailable: range.is_available,
      price: range.price,
      type: range.availability_type
    })).filter(range => range.startDate && range.endDate) // Filter out invalid ranges
  }, [property?.availability])

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update second month when first month changes
  useEffect(() => {
    setSecondMonth(addMonths(currentDate, 1))
  }, [currentDate])

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  // Check if a date is within any available range
  const getDateStatus = (date) => {
    const normalizedDate = startOfDay(date)
    for (const range of availabilityRanges) {
      if (normalizedDate >= range.startDate && normalizedDate <= range.endDate) {
        return {
          inRange: true,
          isAvailable: range.isAvailable,
          price: range.price,
          type: range.type,
          isStart: isSameDay(normalizedDate, range.startDate),
          isEnd: isSameDay(normalizedDate, range.endDate)
        }
      }
    }
    return { inRange: false }
  }

  // Render the calendar grid for a specific month
  const renderMonth = (monthDate, showMonthTitle = true) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Calculate leading empty cells
    const startingDayOfWeek = monthStart.getDay() // 0 = Sunday, 6 = Saturday
    const emptyCells = Array(startingDayOfWeek).fill(null)

    const allCells = [...emptyCells, ...daysInMonth]

    return (
      <div className="month-container">
        {showMonthTitle && (
          <h3 className="text-lg font-medium text-center mb-4">
            {format(monthDate, 'MMMM yyyy')}
          </h3>
        )}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Day headers */}
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}

          {/* Calendar cells */}
          {allCells.map((day, index) => {
            if (!day) {
              // Render empty cell placeholder
              return <div key={`empty-${index}`} className="h-10 rounded-md" />
            }

            const normalizedDay = startOfDay(day)
            const dateStatus = getDateStatus(normalizedDay)
            const isTodayDate = isSameDay(normalizedDay, startOfDay(new Date()))
            const isPast = isBefore(normalizedDay, today)

            let cellClass = "h-10 flex flex-col items-center justify-center rounded-md relative transition-all duration-150 text-sm"
            let title = format(normalizedDay, 'MMM d, yyyy')

            // Base styling & Past date handling
            if (isPast) {
              cellClass += " bg-gray-100 text-gray-400 opacity-60"
              title += ' (Past date)'
            } else {
              // Default background for dates
              cellClass += " bg-white"
            }
            
            if (isTodayDate && !isPast) {
              cellClass += " ring-1 ring-blue-400" // Subtle ring for today
            }

            // Styling for dates within ranges
            if (dateStatus.inRange) {
              if (dateStatus.isAvailable) {
                cellClass = cellClass.replace("bg-white", "bg-green-200")
              } else {
                cellClass = cellClass.replace("bg-white", "bg-red-200 text-gray-900")
                // Add line-through for unavailable dates
                cellClass += " line-through"
              }
            }

            return (
              <div
                key={format(normalizedDay, 'yyyy-MM-dd')}
                className={cellClass}
                title={title}
              >
                {/* Date number */}
                <span className={isTodayDate ? 'text-blue-600 font-semibold' : ''}>
                  {format(normalizedDay, 'd')}
                </span>

                {/* Price indicator for available dates */}
                {dateStatus.inRange && dateStatus.isAvailable && dateStatus.price > 0 && (
                  <div className="text-xs absolute bottom-0.5 flex items-center justify-center text-gray-600">
                    <DollarSign size={10} className="mr-0.5" />
                    <span>{dateStatus.price}</span>
                  </div>
                )}
                {/* Indicator for $0 price (free) */}
                {dateStatus.inRange && dateStatus.isAvailable && dateStatus.price === 0 && (
                  <div className="text-xs absolute bottom-0.5 flex items-center justify-center text-gray-500" title="Available (Free)">
                    <DollarSign size={10} className="mr-0.5 text-green-600" />
                    <span>0</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Availability Calendar</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-5 border-b pb-5">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-green-300 mr-2 border border-green-400"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-red-300 mr-2 border border-red-400"></div>
              <span>Unavailable</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm ring-1 ring-blue-400 mr-2"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-gray-200 mr-2 opacity-60"></div>
              <span>Past</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center font-medium text-gray-800">
              {format(currentDate, 'MMMM yyyy')}
              {!isMobile && ` - ${format(secondMonth, 'MMMM yyyy')}`}
            </div>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6">
            {/* Render first month */}
            {renderMonth(currentDate, isMobile)}

            {/* Render second month only if not mobile */}
            {!isMobile && renderMonth(secondMonth, true)}
          </div>

          {/* Property minimum stay info */}
          {property?.minimum_stay > 1 && (
            <div className="bg-blue-50 p-3 rounded-md text-blue-800 mt-4 text-sm">
              <strong>Note:</strong> This property requires a minimum stay of {property.minimum_stay} night{property.minimum_stay !== 1 ? 's' : ''}.
            </div>
          )}
        </div>

        <div className="p-5 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}