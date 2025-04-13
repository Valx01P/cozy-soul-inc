'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, startOfDay } from 'date-fns';

const AvailabilityCalendar = () => {
  // State to track calendar view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [secondMonth, setSecondMonth] = useState(addMonths(new Date(), 1));
  
  // State for date selection
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);
  
  // State for all saved date ranges
  const [dateRanges, setDateRanges] = useState([]);
  
  // Form state for current selection
  const [availability, setAvailability] = useState(true);
  const [customPrice, setCustomPrice] = useState('');
  const [note, setNote] = useState('');
  
  // JSON display
  const [showJSON, setShowJSON] = useState(false);
  
  // Update second month when first month changes
  useEffect(() => {
    setSecondMonth(addMonths(currentDate, 1));
  }, [currentDate]);
  
  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };
  
  // Handle click on a date cell
  const handleDateClick = (date) => {
    if (!isSelecting) {
      setSelectionStart(date);
      setSelectionEnd(null);
      setIsSelecting(true);
    } else {
      // If clicking on the same date or a date before start, reset start
      if (isSameDay(date, selectionStart) || date < selectionStart) {
        setSelectionStart(date);
        setSelectionEnd(null);
      } else {
        setSelectionEnd(date);
        setIsSelecting(false);
      }
    }
  };
  
  // Handle mouse hover for range preview
  const handleDateHover = (date) => {
    if (isSelecting && selectionStart) {
      setHoverDate(date);
    }
  };
  
  // Clear current selection
  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
    setHoverDate(null);
    setAvailability(true);
    setCustomPrice('');
    setNote('');
  };
  
  // Add current selection to saved ranges
  const saveCurrentRange = () => {
    if (selectionStart && selectionEnd) {
      const newRange = {
        id: Date.now(), // unique ID
        startDate: format(selectionStart, 'yyyy-MM-dd'),
        endDate: format(selectionEnd, 'yyyy-MM-dd'),
        isAvailable: availability,
        price: customPrice ? parseFloat(customPrice) : null,
        note: note || null,
      };
      
      setDateRanges(prev => [...prev, newRange]);
      
      // Log the data
      console.log('Added new date range:', newRange);
      console.log('All date ranges:', [...dateRanges, newRange]);
      
      // Clear form
      clearSelection();
      setShowJSON(true);
    }
  };
  
  // Check if a date is within any saved range
  const getDateStatus = (date) => {
    for (const range of dateRanges) {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      
      if (isWithinInterval(date, { start, end })) {
        return {
          inRange: true,
          isAvailable: range.isAvailable,
          price: range.price,
          rangeId: range.id
        };
      }
    }
    
    return { inRange: false };
  };
  
  // Check if a date is within current selection
  const isInCurrentSelection = (date) => {
    if (!selectionStart) return false;
    if (selectionEnd) {
      return isWithinInterval(date, { 
        start: startOfDay(selectionStart), 
        end: startOfDay(selectionEnd) 
      });
    }
    if (isSelecting && hoverDate) {
      const start = selectionStart < hoverDate ? selectionStart : hoverDate;
      const end = selectionStart < hoverDate ? hoverDate : selectionStart;
      return isWithinInterval(date, { start: startOfDay(start), end: startOfDay(end) });
    }
    return isSameDay(date, selectionStart);
  };
  
  // Render the calendar for a specific month
  const renderMonth = (month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Create week rows
    const weeks = [];
    let week = [];
    
    // Add empty cells for days of the week before the first of the month
    const firstDayOfWeek = monthStart.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      week.push(null);
    }
    
    // Add days of the month
    days.forEach(day => {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    });
    
    // Add empty cells for the remaining days of the last week
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      weeks.push(week);
    }
    
    return (
      <div className="month-container">
        <h3 className="text-lg font-medium text-center mb-4">
          {format(month, 'MMMM yyyy')}
        </h3>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar cells */}
          {weeks.flat().map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-10 bg-white/50" />;
            }
            
            const dateStatus = getDateStatus(day);
            const isInSelection = isInCurrentSelection(day);
            const isSelectionStart = selectionStart && isSameDay(day, selectionStart);
            const isSelectionEnd = selectionEnd && isSameDay(day, selectionEnd);
            
            // Determine classes based on selection and availability
            let cellClass = "h-10 flex flex-col items-center justify-center rounded-full cursor-pointer relative";
            
            if (isInSelection) {
              cellClass += isSelectionStart || isSelectionEnd 
                ? " bg-black text-white"
                : " bg-gray-200";
            } else if (dateStatus.inRange) {
              cellClass += dateStatus.isAvailable
                ? " bg-green-100 hover:bg-green-200" 
                : " bg-red-100 hover:bg-red-200";
            } else {
              cellClass += " hover:bg-gray-100";
            }
            
            return (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className={cellClass}
                onClick={() => handleDateClick(day)}
                onMouseEnter={() => handleDateHover(day)}
              >
                {format(day, 'd')}
                {dateStatus.inRange && dateStatus.price && (
                  <span className="text-xs absolute bottom-0 text-gray-600">
                    ${dateStatus.price}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Set Property Availability</h2>
      
      {/* Calendar navigation */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={goToPreviousMonth}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          &lt;
        </button>
        <div className="flex-1" />
        <button 
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          &gt;
        </button>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {renderMonth(currentDate)}
        {renderMonth(secondMonth)}
      </div>
      
      {/* Selection form */}
      {selectionStart && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">
            {selectionEnd 
              ? `Selected: ${format(selectionStart, 'MMM d, yyyy')} to ${format(selectionEnd, 'MMM d, yyyy')}` 
              : `Start date: ${format(selectionStart, 'MMM d, yyyy')}`}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={availability}
                    onChange={() => setAvailability(true)}
                    className="form-radio h-4 w-4 text-black"
                  />
                  <span className="ml-2">Available</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={!availability}
                    onChange={() => setAvailability(false)}
                    className="form-radio h-4 w-4 text-black"
                  />
                  <span className="ml-2">Unavailable</span>
                </label>
              </div>
            </div>
            
            {availability && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Price (optional)
                </label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Enter price per night"
                  className="border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black block w-full p-2"
                />
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for this date range"
              className="border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black block w-full p-2"
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={clearSelection}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveCurrentRange}
              disabled={!selectionEnd}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                selectionEnd ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-100 mr-2"></div>
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-red-100 mr-2"></div>
          <span className="text-sm">Unavailable</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-black mr-2"></div>
          <span className="text-sm">Selection</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-gray-200 mr-2"></div>
          <span className="text-sm">Selection range</span>
        </div>
      </div>
      
      {/* JSON output */}
      {showJSON && dateRanges.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">Saved Date Ranges:</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
            <code>{JSON.stringify(dateRanges, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;