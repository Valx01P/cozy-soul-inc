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
  isAfter,
  startOfDay,
  parseISO,
  isValid,
  differenceInDays,
  isWithinInterval
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  X,
  CalendarDays,
  CheckCircle,
  AlertCircle
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

// Function to format the price with commas
const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export default function AvailabilityCalendar({
  property,
  isOpen,
  onClose,
  onDateSelect,
  selectedCheckIn,
  selectedCheckOut
}) {
  // Calendar view state
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date())) 
  const [secondMonth, setSecondMonth] = useState(addMonths(currentDate, 1))
  const [dateSelectionMode, setDateSelectionMode] = useState(null) // 'check-in' or 'check-out'
  
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

  // Calculate price for a given date range
  const calculatePriceForDateRange = useMemo(() => {
    return (checkInDate, checkOutDate) => {
      if (!checkInDate || !checkOutDate || !availabilityRanges.length) return null
      
      // Normalize dates to start of day
      const startDate = startOfDay(checkInDate)
      const endDate = startOfDay(checkOutDate)
      
      if (isSameDay(startDate, endDate) || isBefore(endDate, startDate)) return null
      
      let totalPrice = 0
      let validRange = true
      
      // Get all days in the range (excluding end date as checkout day is not charged)
      const daysInRange = eachDayOfInterval({ start: startDate, end: endDate })
      daysInRange.pop() // Remove last day (checkout day)
      
      // Loop through each day and get its price
      for (const day of daysInRange) {
        let found = false
        for (const range of availabilityRanges) {
          // Check if this day is within this range and available
          if (
            isWithinInterval(day, { start: range.startDate, end: range.endDate }) &&
            range.isAvailable
          ) {
            totalPrice += range.price
            found = true
            break
          }
        }
        
        // If a day wasn't available, the whole range is invalid
        if (!found) {
          validRange = false
          break
        }
      }
      
      const nights = daysInRange.length;
      return validRange ? { 
        totalPrice, 
        nights,
        perNight: nights > 0 ? Math.round(totalPrice / nights) : 0
      } : null
    }
  }, [availabilityRanges])

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

  // When opening the calendar, set the current month to show either the check-in date or today
  useEffect(() => {
    if (isOpen) {
      if (selectedCheckIn) {
        setCurrentDate(startOfMonth(selectedCheckIn))
      } else {
        setCurrentDate(startOfMonth(new Date()))
      }
    }
  }, [isOpen, selectedCheckIn])

  // Set initial selection mode based on what dates are already selected
  useEffect(() => {
    if (selectedCheckIn && !selectedCheckOut) {
      setDateSelectionMode('check-out')
    } else if (!selectedCheckIn) {
      setDateSelectionMode('check-in')
    } else {
      setDateSelectionMode(null) // Both dates selected or none
    }
  }, [selectedCheckIn, selectedCheckOut])

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  // Check if a date is available
  const isDateAvailable = (date) => {
    const normalizedDate = startOfDay(date)
    
    // Past dates are not available
    if (isBefore(normalizedDate, today)) {
      return false
    }
    
    // Check if date is in any available range
    for (const range of availabilityRanges) {
      if (
        isWithinInterval(normalizedDate, { start: range.startDate, end: range.endDate }) &&
        range.isAvailable
      ) {
        return true
      }
    }
    
    return false
  }

  // Handle date click in the calendar
  const handleDateClick = (date) => {
    const normalizedDate = startOfDay(date)
    
    // Don't allow selecting past dates
    if (isBefore(normalizedDate, today)) {
      return
    }
    
    // Don't allow selecting unavailable dates
    if (!isDateAvailable(normalizedDate)) {
      return
    }
    
    // UPDATED LOGIC FOR DATE SELECTION:
    // Case 1: If we're selecting the check-in date (or no mode is set), or
    // Case 2: If we're selecting check-out but choose a date before the current check-in
    if (
      dateSelectionMode === 'check-in' || 
      !dateSelectionMode ||
      (dateSelectionMode === 'check-out' && selectedCheckIn && isBefore(normalizedDate, selectedCheckIn))
    ) {
      // Set the selected date as check-in
      onDateSelect('check-in', normalizedDate)
      // Clear check-out if it exists (in case of re-selection)
      if (selectedCheckOut) {
        onDateSelect('check-out', null)
      }
      // Switch to check-out mode
      setDateSelectionMode('check-out')
    } 
    // Case 3: If we're in check-out mode and selected date is after check-in
    else if (
      dateSelectionMode === 'check-out' && 
      selectedCheckIn && 
      isAfter(normalizedDate, selectedCheckIn)
    ) {
      // Set check-out date
      onDateSelect('check-out', normalizedDate)
      // Reset mode after both dates are selected
      setDateSelectionMode(null)
    }
  }

  // Check if a date is within any available range and get its price
  const getDateStatus = (date) => {
    const normalizedDate = startOfDay(date)
    for (const range of availabilityRanges) {
      if (isWithinInterval(normalizedDate, { start: range.startDate, end: range.endDate })) {
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

  // Check if a date is in the selected range
  const isInSelectedRange = (date) => {
    if (!selectedCheckIn || !selectedCheckOut) return false
    
    return isWithinInterval(date, {
      start: selectedCheckIn,
      end: selectedCheckOut
    })
  }

  // Reset date selection
  const resetDateSelection = () => {
    onDateSelect('reset')
    setDateSelectionMode('check-in')
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
              return <div key={`empty-${index}`} className="h-10 rounded-md" />;
            }

            const normalizedDay = startOfDay(day)
            const dateStatus = getDateStatus(normalizedDay)
            const isCheckInDate = selectedCheckIn && isSameDay(normalizedDay, selectedCheckIn)
            const isCheckOutDate = selectedCheckOut && isSameDay(normalizedDay, selectedCheckOut)
            const isInSelection = isInSelectedRange(normalizedDay) && !isCheckInDate && !isCheckOutDate
            const isTodayDate = isSameDay(normalizedDay, startOfDay(new Date()))
            const isPast = isBefore(normalizedDay, today)
            const isAvailable = dateStatus.inRange && dateStatus.isAvailable

            let cellClass = "h-10 flex flex-col items-center justify-center rounded-md relative transition-all duration-150 text-sm"
            let title = format(normalizedDay, 'MMM d, yyyy')

            // Base styling & Past date handling
            if (isPast) {
              cellClass += " bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed"
              title += ' (Past date)'
            } else if (!isAvailable) {
              cellClass += " bg-red-200 text-gray-700 line-through cursor-not-allowed"
              title += ' (Unavailable)'
            } else {
              cellClass += " cursor-pointer"
              // Default background for available dates
              cellClass += " bg-green-200 hover:bg-green-300"
              title += ` (Available: $${dateStatus.price})`
            }
            
            if (isTodayDate && !isPast) {
                cellClass += " ring-1 ring-blue-400" // Subtle ring for today
            }

            // Styling for selected dates
            if (isCheckInDate) {
              cellClass = cellClass.replace(/bg-\w+-\d+/g, "bg-amber-400")
              title = "Check-in: " + format(normalizedDay, 'MMM d, yyyy')
              cellClass += " font-bold ring-2 ring-amber-500"
            } else if (isCheckOutDate) {
              cellClass = cellClass.replace(/bg-\w+-\d+/g, "bg-amber-400")
              title = "Check-out: " + format(normalizedDay, 'MMM d, yyyy')
              cellClass += " font-bold ring-2 ring-amber-500"
            } else if (isInSelection) {
              cellClass = cellClass.replace(/bg-\w+-\d+/g, "bg-amber-200")
              title += " (Selected stay date)"
            }

            return (
              <div
                key={format(normalizedDay, 'yyyy-MM-dd')}
                className={cellClass}
                onClick={() => !isPast && isAvailable && handleDateClick(normalizedDay)}
                title={title}
              >
                {/* Date number */}
                <span className={`${isCheckInDate || isCheckOutDate ? 'font-bold' : ''} ${isTodayDate ? 'text-blue-600 font-semibold' : ''}`}>
                  {format(normalizedDay, 'd')}
                </span>

                {/* Price indicator for available dates */}
                {dateStatus.inRange && dateStatus.isAvailable && dateStatus.price > 0 && (
                  <div className="text-xs absolute bottom-0.5 flex items-center justify-center text-gray-700">
                    <DollarSign size={10} className="mr-0.5" />
                    <span>{dateStatus.price}</span>
                  </div>
                )}

                {/* Check-in/out indicators */}
                {isCheckInDate && (
                  <div className="absolute top-0 right-0 -mt-1 -mr-1">
                    <CheckCircle size={16} className="text-amber-600 fill-amber-200" />
                  </div>
                )}
                {isCheckOutDate && (
                  <div className="absolute top-0 right-0 -mt-1 -mr-1">
                    <CheckCircle size={16} className="text-amber-600 fill-amber-200" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Calculate total price for the selected stay
  const selectedStayPrice = useMemo(() => {
    if (selectedCheckIn && selectedCheckOut) {
      return calculatePriceForDateRange(selectedCheckIn, selectedCheckOut)
    }
    return null
  }, [selectedCheckIn, selectedCheckOut, calculatePriceForDateRange])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Availability & Pricing Calendar</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {/* Date selection status */}
          <div className="bg-blue-50 p-3 mb-4 rounded-md border border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="font-medium">Check-in:</span>
                <span className={selectedCheckIn ? "text-black" : "text-gray-500 italic"}>
                  {selectedCheckIn ? format(selectedCheckIn, 'MMM d, yyyy') : 'Select a date'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Check-out:</span>
                <span className={selectedCheckOut ? "text-black" : "text-gray-500 italic"}>
                  {selectedCheckOut ? format(selectedCheckOut, 'MMM d, yyyy') : 'Select a date'}
                </span>
              </div>
              {selectedCheckIn && (
                <button 
                  className="text-sm text-red-600 hover:text-red-800 ml-auto"
                  onClick={resetDateSelection}
                >
                  Clear dates
                </button>
              )}
            </div>
            
            {/* Show pricing calculation if both dates are selected */}
            {selectedStayPrice && (
              <div className="mt-3 pt-3 border-t border-blue-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedStayPrice.nights > 10 ? (
                        // For longer stays, show the average per night
                        `${selectedStayPrice.nights} nights (avg. $${formatPrice(selectedStayPrice.perNight)}/night)`
                      ) : (
                        // For shorter stays, show simple count
                        `${selectedStayPrice.nights} ${selectedStayPrice.nights === 1 ? 'night' : 'nights'} stay`
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(selectedCheckIn, 'MMM d')} - {format(selectedCheckOut, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <p className="text-lg font-bold text-green-700">
                      ${formatPrice(selectedStayPrice.totalPrice)}
                    </p>
                    <p className="text-sm text-gray-600">estimated total</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-5 border-b pb-3">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-green-200 mr-2 border border-green-300"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-red-200 mr-2 border border-red-300"></div>
              <span>Unavailable</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-amber-400 mr-2 border border-amber-500"></div>
              <span>Selected Dates</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-amber-200 mr-2 border border-amber-300"></div>
              <span>Stay Dates</span>
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

          {/* Selection mode instructions */}
          <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm">
            {!selectedCheckIn && !selectedCheckOut ? (
              <p>Select a check-in date to start.</p>
            ) : !selectedCheckOut ? (
              <p>Now select a check-out date. <span className="text-gray-500">(If you select a date before your check-in date, it will become your new check-in date.)</span></p>
            ) : (
              <p>Your stay dates are selected. You can modify by selecting new dates.</p>
            )}
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
            <div className="bg-yellow-50 p-3 rounded-md text-yellow-800 mt-4 text-sm flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
              <p>This property requires a minimum stay of {property.minimum_stay} night{property.minimum_stay !== 1 ? 's' : ''}.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 transition-colors"
          >
            Close
          </button>
          
          {selectedStayPrice && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white transition-colors"
            >
              Confirm Dates
            </button>
          )}
        </div>
      </div>
    </div>
  )
}