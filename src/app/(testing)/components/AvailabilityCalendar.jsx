'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, startOfDay, addDays, subDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, DollarSign, X, Info, Trash, AlertTriangle, ArrowRight } from 'lucide-react';

const AvailabilityCalendar = () => {
  // State to track calendar view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [secondMonth, setSecondMonth] = useState(addMonths(new Date(), 1));
  
  // State for date selection
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [selectionMode, setSelectionMode] = useState('start'); // 'start' or 'end'
  
  // State for all saved date ranges
  const [dateRanges, setDateRanges] = useState([]);
  
  // State for viewing details of a range
  const [viewingRangeId, setViewingRangeId] = useState(null);
  
  // Error state
  const [errorMessage, setErrorMessage] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  
  // Form state for current selection
  const [availability, setAvailability] = useState(true);
  const [customPrice, setCustomPrice] = useState('');
  const [note, setNote] = useState('');
  
  // JSON display
  const [showJSON, setShowJSON] = useState(false);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Update second month when first month changes
  useEffect(() => {
    setSecondMonth(addMonths(currentDate, 1));
  }, [currentDate]);
  
  // Update status message when selection changes
  useEffect(() => {
    updateStatusMessage();
  }, [selectionStart, selectionEnd, selectionMode]);
  
  // Update status message based on current selection state
  const updateStatusMessage = () => {
    if (viewingRangeId) {
      return; // Don't update status when viewing a range
    }
    
    if (!selectionStart && !selectionEnd) {
      setStatusMessage(null);
      return;
    }
    
    if (selectionStart && !selectionEnd) {
      setStatusMessage(`Start date selected: ${format(selectionStart, 'MMM d, yyyy')}. Now select an end date.`);
    } else if (!selectionStart && selectionEnd) {
      // End date is exclusive, so we display the day before as the inclusive range
      const displayEndDate = subDays(selectionEnd, 1);
      setStatusMessage(`End date selected: ${format(displayEndDate, 'MMM d, yyyy')}. Now select a start date.`);
    } else if (selectionStart && selectionEnd) {
      // End date is exclusive, so we display the day before as the inclusive range
      const displayEndDate = subDays(selectionEnd, 1);
      setStatusMessage(`Selected range: ${format(selectionStart, 'MMM d, yyyy')} to ${format(displayEndDate, 'MMM d, yyyy')} inclusive.`);
    }
  };
  
  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };
  
  // Check if a date is within any saved range
  // Note: For saved ranges, startDate is inclusive, endDate is exclusive
  const getDateStatus = (date) => {
    for (const range of dateRanges) {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      
      // Check if date is >= start and < end (exclusive end)
      if (date >= start && date < end) {
        return {
          inRange: true,
          isAvailable: range.isAvailable,
          price: range.price,
          note: range.note,
          rangeId: range.id,
          isStart: isSameDay(date, start),
          isEnd: isSameDay(date, subDays(end, 1)) // The displayed "end" is the day before the exclusive end
        };
      }
    }
    
    return { inRange: false };
  };
  
  // Check if a date range overlaps with existing ranges
  const checkRangeOverlap = (start, end) => {
    // Note: 'end' is exclusive, so we need to check dates from start up to but not including end
    const daysToCheck = eachDayOfInterval({ 
      start, 
      end: subDays(end, 1) // Only check up to the day before the exclusive end
    });
    
    for (const day of daysToCheck) {
      for (const range of dateRanges) {
        const rangeStart = new Date(range.startDate);
        const rangeEnd = new Date(range.endDate);
        
        // Check if the day is within the range (inclusive start, exclusive end)
        if (day >= rangeStart && day < rangeEnd) {
          return true; // Overlap found
        }
      }
    }
    
    return false; // No overlap
  };
  
  // Get the date range a date belongs to
  const getRangeForDate = (date) => {
    return dateRanges.find(range => {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      return date >= start && date < end;
    });
  };
  
  // Toggle selection mode between start and end
  const toggleSelectionMode = (mode) => {
    setSelectionMode(mode);
    setErrorMessage(null);
  };
  
  // Handle click on a date cell
  const handleDateClick = (date) => {
    // Clear any error messages
    setErrorMessage(null);
    
    // Check if date is within any saved range
    const dateStatus = getDateStatus(date);
    
    if (dateStatus.inRange) {
      // If clicking on an existing range, view its details
      const range = getRangeForDate(date);
      if (range) {
        viewRangeDetails(range.id);
      }
      return;
    }
    
    // Handle date selection based on current mode
    if (selectionMode === 'start') {
      // Set the start date
      setSelectionStart(date);
      
      // If we already have an end date, check if this would create a valid range
      if (selectionEnd) {
        if (date >= selectionEnd) {
          setErrorMessage("Start date must be before end date.");
          return;
        }
        
        // Check for overlap with existing ranges
        if (checkRangeOverlap(date, selectionEnd)) {
          setErrorMessage("Selection overlaps with an existing range.");
          return;
        }
      }
      
      // Auto-switch to end mode after selecting start
      setSelectionMode('end');
    } else {
      // End date is exclusive, so we store the day after what the user selected
      const exclusiveEndDate = addDays(date, 1);
      
      // If we have a start date, make sure the end date comes after it
      if (selectionStart) {
        if (date < selectionStart) {
          setErrorMessage("End date must be after start date.");
          return;
        }
        
        // Check for overlap with existing ranges
        if (checkRangeOverlap(selectionStart, exclusiveEndDate)) {
          setErrorMessage("Selection overlaps with an existing range.");
          return;
        }
      }
      
      setSelectionEnd(exclusiveEndDate);
      // Auto-switch to start mode after selecting end
      setSelectionMode('start');
    }
  };
  
  // Clear current selection
  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectionMode('start');
    setAvailability(true);
    setCustomPrice('');
    setNote('');
    setViewingRangeId(null);
    setErrorMessage(null);
    setStatusMessage(null);
  };
  
  // View range details
  const viewRangeDetails = (rangeId) => {
    const rangeToView = dateRanges.find(range => range.id === rangeId);
    
    if (rangeToView) {
      setViewingRangeId(rangeId);
      setAvailability(rangeToView.isAvailable);
      setCustomPrice(rangeToView.price ? rangeToView.price.toString() : '');
      setNote(rangeToView.note || '');
      
      // Display the range dates (for info only)
      const displayEndDate = subDays(new Date(rangeToView.endDate), 1);
      setStatusMessage(`Range details: ${format(new Date(rangeToView.startDate), 'MMM d, yyyy')} to ${format(displayEndDate, 'MMM d, yyyy')}`);
    }
  };
  
  // Delete a range
  const deleteRange = (rangeId) => {
    setDateRanges(prev => prev.filter(range => range.id !== rangeId));
    clearSelection();
    setStatusMessage("Range successfully deleted.");
    setTimeout(() => setStatusMessage(null), 3000);
  };
  
  // Add current selection to saved ranges
  const saveCurrentRange = () => {
    if (selectionStart && selectionEnd) {
      // Validate the range
      if (selectionStart >= selectionEnd) {
        setErrorMessage("Start date must be before end date.");
        return;
      }
      
      // Check for overlap one more time before saving
      if (checkRangeOverlap(selectionStart, selectionEnd)) {
        setErrorMessage("Selection overlaps with an existing range.");
        return;
      }
      
      const newRange = {
        id: Date.now(), // unique ID
        startDate: format(selectionStart, 'yyyy-MM-dd'),
        endDate: format(selectionEnd, 'yyyy-MM-dd'), // Store exclusive end date
        isAvailable: availability,
        price: customPrice ? parseFloat(customPrice) : null,
        note: note || null,
      };
      
      setDateRanges(prev => [...prev, newRange]);
      
      // Clear form
      clearSelection();
      setShowJSON(true);
      setStatusMessage("New range successfully added.");
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };
  
  // Check if a date is within current selection
  const isInCurrentSelection = (date) => {
    if (!selectionStart && !selectionEnd) return false;
    
    // If we only have a start date or only an end date
    if (selectionStart && !selectionEnd) {
      return isSameDay(date, selectionStart);
    }
    
    if (!selectionStart && selectionEnd) {
      // The displayed "end" is actually the day before our exclusive end
      return isSameDay(date, subDays(selectionEnd, 1));
    }
    
    // If we have both start and end dates, check if date is within range
    // Remember: end date is exclusive
    return date >= selectionStart && date < selectionEnd;
  };
  
  // Render the calendar for a specific month
  const renderMonth = (month, showTitle = true) => {
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
        {showTitle && (
          <h3 className="text-lg font-medium text-center mb-4">
            {format(month, 'MMMM yyyy')}
          </h3>
        )}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar cells */}
          {weeks.flat().map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-12 rounded-md bg-gray-50" />;
            }
            
            const dateStatus = getDateStatus(day);
            const isInSelection = isInCurrentSelection(day);
            const isSelectionStart = selectionStart && isSameDay(day, selectionStart);
            const isSelectionEnd = selectionEnd && isSameDay(day, subDays(selectionEnd, 1)); // Check against display end date
            const isToday = isSameDay(day, new Date());
            
            // Determine classes based on selection and availability
            let cellClass = "h-12 flex flex-col items-center justify-center rounded-md relative transition-all duration-150";
            
            // Make all dates clickable
            cellClass += " cursor-pointer";
            
            // Base style with border for today
            if (isToday) {
              cellClass += " ring-1 ring-blue-400";
            }
            
            // Selection and availability styling - using more visible colors
            if (isInSelection) {
              if (isSelectionStart) {
                cellClass += " bg-green-100 text-gray-800 font-medium z-10"; // Slightly darker green
              } else if (isSelectionEnd) {
                cellClass += " bg-red-100 text-gray-800 font-medium z-10"; // Slightly darker red
              } else {
                cellClass += " bg-blue-100"; // Regular blue for selection range
              }
            } else if (dateStatus.inRange) {
              cellClass += dateStatus.isAvailable
                ? " bg-green-100 hover:bg-green-200" // Visible green
                : " bg-red-100 hover:bg-red-200"; // Visible red
                
              // If we're viewing this range, add a highlight
              if (viewingRangeId === dateStatus.rangeId) {
                cellClass += " ring-2 ring-yellow-400";
              }
            } else {
              cellClass += " bg-white hover:bg-gray-100";
            }
            
            return (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className={cellClass}
                onClick={() => handleDateClick(day)}
                title={`${format(day, 'MMM d, yyyy')}${dateStatus.note ? ` - ${dateStatus.note}` : ''}`}
              >
                <span className={isToday ? 'font-bold' : ''}>
                  {format(day, 'd')}
                </span>
                
                {/* Indicators for the current selection - keep the circles vibrant */}
                {isSelectionStart && (
                  <div className="absolute top-0 left-0 w-3 h-3 bg-green-600 rounded-full" title="Start date (inclusive)" />
                )}
                
                {isSelectionEnd && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-600 rounded-full" title="End date (inclusive)" />
                )}
                
                {/* Price indicator */}
                {dateStatus.inRange && dateStatus.price && (
                  <div className="text-xs absolute bottom-1 flex items-center justify-center">
                    <DollarSign size={10} className="mr-0.5" />
                    <span>{dateStatus.price}</span>
                  </div>
                )}
                
                {/* Note indicator */}
                {dateStatus.inRange && dateStatus.note && (
                  <div className="absolute top-1 right-1">
                    <Info size={10} className="text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg overflow-y-auto max-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Set Property Availability</h2>
      
      {/* Selection mode toggle */}
      <div className="mb-4 bg-white border rounded-lg p-3 flex flex-col md:flex-row md:items-center">
        <span className="font-medium mr-4 mb-2 md:mb-0">Selection Mode:</span>
        <div className="flex space-x-4">
          <button
            onClick={() => toggleSelectionMode('start')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              selectionMode === 'start' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}
            disabled={!!viewingRangeId}
          >
            <div className="w-3 h-3 bg-green-600 rounded-full mr-2" />
            Start Date (Inclusive)
          </button>
          <button
            onClick={() => toggleSelectionMode('end')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              selectionMode === 'end' 
                ? 'bg-red-100 text-red-800 border border-red-300' 
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}
            disabled={!!viewingRangeId}
          >
            <div className="w-3 h-3 bg-red-600 rounded-full mr-2" />
            End Date (Inclusive)
          </button>
        </div>
      </div>
      
      {/* Status message */}
      {statusMessage && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
          {statusMessage}
        </div>
      )}
      
      {/* Error message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center">
          <AlertTriangle size={16} className="mr-2" />
          <p>{errorMessage}</p>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mb-4 p-3 bg-gray-50 text-gray-700 rounded-md text-sm">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Select "Start Date" or "End Date" mode from the toggle buttons above</li>
          <li>Click on dates to set your range (green = start, red = end)</li>
          <li>The start date is inclusive, the end date is inclusive</li>
          <li>Click on an existing range to view or delete it</li>
          <li>Overlapping ranges are not allowed</li>
        </ul>
      </div>
      
      {/* Calendar navigation - moved directly above calendar */}
      <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-lg p-2">
        <button 
          onClick={goToPreviousMonth}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Previous Month"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-lg font-medium">
          {format(currentDate, 'MMMM yyyy')}
        </span>
        <button 
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Next Month"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {isMobile ? renderMonth(currentDate, false) : renderMonth(currentDate, true)}
        {!isMobile && renderMonth(secondMonth, true)}
      </div>
      
      {/* Current selection visualization - with better overflow handling */}
      {(!viewingRangeId && (selectionStart || selectionEnd)) && (
        <div className="mb-6 p-4 bg-white border rounded-lg shadow-sm overflow-x-auto">
          <h3 className="text-lg font-medium mb-3">Current Selection</h3>
          <div className="flex items-center justify-center bg-gray-50 p-4 rounded-md min-w-fit">
            {selectionStart ? (
              <div className="flex items-center justify-center bg-green-100 p-2 rounded-md border border-green-200">
                <div className="w-3 h-3 bg-green-600 rounded-full mr-2" />
                <span className="font-medium">{format(selectionStart, 'MMM d, yyyy')}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center bg-gray-100 p-2 rounded-md border border-gray-200 text-gray-500">
                <span>No start date selected</span>
              </div>
            )}
            
            <ArrowRight className="mx-4 text-gray-400" />
            
            {selectionEnd ? (
              <div className="flex items-center justify-center bg-red-100 p-2 rounded-md border border-red-200">
                <div className="w-3 h-3 bg-red-600 rounded-full mr-2" />
                <span className="font-medium">{format(subDays(selectionEnd, 1), 'MMM d, yyyy')}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center bg-gray-100 p-2 rounded-md border border-gray-200 text-gray-500">
                <span>No end date selected</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Selection form with better overflow handling */}
      {(!viewingRangeId && (selectionStart || selectionEnd)) && (
        <div className="mb-6 p-5 border rounded-lg bg-white shadow-sm overflow-visible">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              Range Details
            </h3>
            <button
              onClick={clearSelection}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Clear Selection"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center bg-green-100 px-3 py-2 rounded-md border border-green-200 cursor-pointer hover:bg-green-200 transition-colors">
                  <input
                    type="radio"
                    checked={availability}
                    onChange={() => setAvailability(true)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Available</span>
                </label>
                <label className="inline-flex items-center bg-red-100 px-3 py-2 rounded-md border border-red-200 cursor-pointer hover:bg-red-200 transition-colors">
                  <input
                    type="radio"
                    checked={!availability}
                    onChange={() => setAvailability(false)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Unavailable</span>
                </label>
              </div>
            </div>
            
            {availability && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Price (optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="Enter price per night"
                    className="border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for this date range"
              className="border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={clearSelection}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveCurrentRange}
              disabled={!selectionStart || !selectionEnd}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                selectionStart && selectionEnd ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Save Range
            </button>
          </div>
        </div>
      )}
      
      {/* Range details view (when viewing an existing range) */}
      {viewingRangeId && (
        <div className="mb-6 p-5 border rounded-lg bg-white shadow-sm overflow-visible">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              Range Details (View Only)
            </h3>
            <button
              onClick={clearSelection}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close Range Details"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <div className="text-sm bg-gray-50 p-2 rounded-md">
                {availability ? 'Available' : 'Unavailable'}
              </div>
            </div>
            
            {availability && customPrice && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Price
                </label>
                <div className="text-sm bg-gray-50 p-2 rounded-md flex items-center">
                  <DollarSign size={14} className="mr-1" />
                  {customPrice}
                </div>
              </div>
            )}
          </div>
          
          {note && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note
              </label>
              <div className="text-sm bg-gray-50 p-2 rounded-md">
                {note}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => deleteRange(viewingRangeId)}
              className="px-4 py-2 border border-red-300 bg-red-100 rounded-md text-sm font-medium text-red-700 hover:bg-red-200 transition-colors flex items-center"
            >
              <Trash size={16} className="mr-1" />
              Delete Range
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Legend - updated with more visible colors */}
      <div className="mt-6 flex flex-wrap gap-4 bg-gray-50 p-3 rounded-md">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-md bg-green-100 mr-2 border border-green-200"></div>
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-md bg-red-100 mr-2 border border-red-200"></div>
          <span className="text-sm">Unavailable</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-md bg-blue-100 mr-2"></div>
          <span className="text-sm">Selected days</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-md bg-green-100 mr-2 relative">
            <div className="absolute top-0 left-0 w-3 h-3 bg-green-600 rounded-full"></div>
          </div>
          <span className="text-sm">Start date</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-md bg-red-100 mr-2 relative">
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-600 rounded-full"></div>
          </div>
          <span className="text-sm">End date</span>
        </div>
      </div>
      
      {/* JSON output with better overflow handling */}
      {dateRanges.length > 0 && (
        <div className="mt-8">
          <details open={showJSON}>
            <summary className="text-lg font-medium mb-2 cursor-pointer text-blue-600 hover:text-blue-800">
              Saved Date Ranges ({dateRanges.length})
            </summary>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-64 mt-2">
              <code>{JSON.stringify(dateRanges, null, 2)}</code>
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;


// 'use client';

// import { useState, useEffect } from 'react';
// import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, startOfDay } from 'date-fns';

// const AvailabilityCalendar = () => {
//   // State to track calendar view
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [secondMonth, setSecondMonth] = useState(addMonths(new Date(), 1));
  
//   // State for date selection
//   const [selectionStart, setSelectionStart] = useState(null);
//   const [selectionEnd, setSelectionEnd] = useState(null);
//   const [isSelecting, setIsSelecting] = useState(false);
//   const [hoverDate, setHoverDate] = useState(null);
  
//   // State for all saved date ranges
//   const [dateRanges, setDateRanges] = useState([]);
  
//   // Form state for current selection
//   const [availability, setAvailability] = useState(true);
//   const [customPrice, setCustomPrice] = useState('');
//   const [note, setNote] = useState('');
  
//   // JSON display
//   const [showJSON, setShowJSON] = useState(false);
  
//   // Update second month when first month changes
//   useEffect(() => {
//     setSecondMonth(addMonths(currentDate, 1));
//   }, [currentDate]);
  
//   // Navigation functions
//   const goToPreviousMonth = () => {
//     setCurrentDate(prev => subMonths(prev, 1));
//   };
  
//   const goToNextMonth = () => {
//     setCurrentDate(prev => addMonths(prev, 1));
//   };
  
//   // Handle click on a date cell
//   const handleDateClick = (date) => {
//     if (!isSelecting) {
//       setSelectionStart(date);
//       setSelectionEnd(null);
//       setIsSelecting(true);
//     } else {
//       // If clicking on the same date or a date before start, reset start
//       if (isSameDay(date, selectionStart) || date < selectionStart) {
//         setSelectionStart(date);
//         setSelectionEnd(null);
//       } else {
//         setSelectionEnd(date);
//         setIsSelecting(false);
//       }
//     }
//   };
  
//   // Handle mouse hover for range preview
//   const handleDateHover = (date) => {
//     if (isSelecting && selectionStart) {
//       setHoverDate(date);
//     }
//   };
  
//   // Clear current selection
//   const clearSelection = () => {
//     setSelectionStart(null);
//     setSelectionEnd(null);
//     setIsSelecting(false);
//     setHoverDate(null);
//     setAvailability(true);
//     setCustomPrice('');
//     setNote('');
//   };
  
//   // Add current selection to saved ranges
//   const saveCurrentRange = () => {
//     if (selectionStart && selectionEnd) {
//       const newRange = {
//         id: Date.now(), // unique ID
//         startDate: format(selectionStart, 'yyyy-MM-dd'),
//         endDate: format(selectionEnd, 'yyyy-MM-dd'),
//         isAvailable: availability,
//         price: customPrice ? parseFloat(customPrice) : null,
//         note: note || null,
//       };
      
//       setDateRanges(prev => [...prev, newRange]);
      
//       // Log the data
//       console.log('Added new date range:', newRange);
//       console.log('All date ranges:', [...dateRanges, newRange]);
      
//       // Clear form
//       clearSelection();
//       setShowJSON(true);
//     }
//   };
  
//   // Check if a date is within any saved range
//   const getDateStatus = (date) => {
//     for (const range of dateRanges) {
//       const start = new Date(range.startDate);
//       const end = new Date(range.endDate);
      
//       if (isWithinInterval(date, { start, end })) {
//         return {
//           inRange: true,
//           isAvailable: range.isAvailable,
//           price: range.price,
//           rangeId: range.id
//         };
//       }
//     }
    
//     return { inRange: false };
//   };
  
//   // Check if a date is within current selection
//   const isInCurrentSelection = (date) => {
//     if (!selectionStart) return false;
//     if (selectionEnd) {
//       return isWithinInterval(date, { 
//         start: startOfDay(selectionStart), 
//         end: startOfDay(selectionEnd) 
//       });
//     }
//     if (isSelecting && hoverDate) {
//       const start = selectionStart < hoverDate ? selectionStart : hoverDate;
//       const end = selectionStart < hoverDate ? hoverDate : selectionStart;
//       return isWithinInterval(date, { start: startOfDay(start), end: startOfDay(end) });
//     }
//     return isSameDay(date, selectionStart);
//   };
  
//   // Render the calendar for a specific month
//   const renderMonth = (month) => {
//     const monthStart = startOfMonth(month);
//     const monthEnd = endOfMonth(month);
//     const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
//     // Create week rows
//     const weeks = [];
//     let week = [];
    
//     // Add empty cells for days of the week before the first of the month
//     const firstDayOfWeek = monthStart.getDay();
//     for (let i = 0; i < firstDayOfWeek; i++) {
//       week.push(null);
//     }
    
//     // Add days of the month
//     days.forEach(day => {
//       week.push(day);
//       if (week.length === 7) {
//         weeks.push(week);
//         week = [];
//       }
//     });
    
//     // Add empty cells for the remaining days of the last week
//     if (week.length > 0) {
//       while (week.length < 7) {
//         week.push(null);
//       }
//       weeks.push(week);
//     }
    
//     return (
//       <div className="month-container">
//         <h3 className="text-lg font-medium text-center mb-4">
//           {format(month, 'MMMM yyyy')}
//         </h3>
//         <div className="grid grid-cols-7 gap-1">
//           {/* Day headers */}
//           {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
//             <div key={day} className="text-center text-sm font-medium text-gray-500">
//               {day}
//             </div>
//           ))}
          
//           {/* Calendar cells */}
//           {weeks.flat().map((day, index) => {
//             if (!day) {
//               return <div key={`empty-${index}`} className="h-10 bg-white/50" />;
//             }
            
//             const dateStatus = getDateStatus(day);
//             const isInSelection = isInCurrentSelection(day);
//             const isSelectionStart = selectionStart && isSameDay(day, selectionStart);
//             const isSelectionEnd = selectionEnd && isSameDay(day, selectionEnd);
            
//             // Determine classes based on selection and availability
//             let cellClass = "h-10 flex flex-col items-center justify-center rounded-full cursor-pointer relative";
            
//             if (isInSelection) {
//               cellClass += isSelectionStart || isSelectionEnd 
//                 ? " bg-black text-white"
//                 : " bg-gray-200";
//             } else if (dateStatus.inRange) {
//               cellClass += dateStatus.isAvailable
//                 ? " bg-green-100 hover:bg-green-200" 
//                 : " bg-red-100 hover:bg-red-200";
//             } else {
//               cellClass += " hover:bg-gray-100";
//             }
            
//             return (
//               <div
//                 key={format(day, 'yyyy-MM-dd')}
//                 className={cellClass}
//                 onClick={() => handleDateClick(day)}
//                 onMouseEnter={() => handleDateHover(day)}
//               >
//                 {format(day, 'd')}
//                 {dateStatus.inRange && dateStatus.price && (
//                   <span className="text-xs absolute bottom-0 text-gray-600">
//                     ${dateStatus.price}
//                   </span>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     );
//   };
  
//   return (
//     <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold mb-6">Set Property Availability</h2>
      
//       {/* Calendar navigation */}
//       <div className="flex items-center justify-between mb-6">
//         <button 
//           onClick={goToPreviousMonth}
//           className="p-2 rounded-full hover:bg-gray-200"
//         >
//           &lt;
//         </button>
//         <div className="flex-1" />
//         <button 
//           onClick={goToNextMonth}
//           className="p-2 rounded-full hover:bg-gray-200"
//         >
//           &gt;
//         </button>
//       </div>
      
//       {/* Calendar grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
//         {renderMonth(currentDate)}
//         {renderMonth(secondMonth)}
//       </div>
      
//       {/* Selection form */}
//       {selectionStart && (
//         <div className="mt-6 p-4 border rounded-lg bg-gray-50">
//           <h3 className="text-lg font-medium mb-4">
//             {selectionEnd 
//               ? `Selected: ${format(selectionStart, 'MMM d, yyyy')} to ${format(selectionEnd, 'MMM d, yyyy')}` 
//               : `Start date: ${format(selectionStart, 'MMM d, yyyy')}`}
//           </h3>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Availability
//               </label>
//               <div className="flex space-x-4">
//                 <label className="inline-flex items-center">
//                   <input
//                     type="radio"
//                     checked={availability}
//                     onChange={() => setAvailability(true)}
//                     className="form-radio h-4 w-4 text-black"
//                   />
//                   <span className="ml-2">Available</span>
//                 </label>
//                 <label className="inline-flex items-center">
//                   <input
//                     type="radio"
//                     checked={!availability}
//                     onChange={() => setAvailability(false)}
//                     className="form-radio h-4 w-4 text-black"
//                   />
//                   <span className="ml-2">Unavailable</span>
//                 </label>
//               </div>
//             </div>
            
//             {availability && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Custom Price (optional)
//                 </label>
//                 <input
//                   type="number"
//                   value={customPrice}
//                   onChange={(e) => setCustomPrice(e.target.value)}
//                   placeholder="Enter price per night"
//                   className="border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black block w-full p-2"
//                 />
//               </div>
//             )}
//           </div>
          
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Note (optional)
//             </label>
//             <input
//               type="text"
//               value={note}
//               onChange={(e) => setNote(e.target.value)}
//               placeholder="Add a note for this date range"
//               className="border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black block w-full p-2"
//             />
//           </div>
          
//           <div className="flex justify-end space-x-4">
//             <button
//               onClick={clearSelection}
//               className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={saveCurrentRange}
//               disabled={!selectionEnd}
//               className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
//                 selectionEnd ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'
//               }`}
//             >
//               Save
//             </button>
//           </div>
//         </div>
//       )}
      
//       {/* Legend */}
//       <div className="mt-6 flex flex-wrap gap-4">
//         <div className="flex items-center">
//           <div className="w-4 h-4 rounded-full bg-green-100 mr-2"></div>
//           <span className="text-sm">Available</span>
//         </div>
//         <div className="flex items-center">
//           <div className="w-4 h-4 rounded-full bg-red-100 mr-2"></div>
//           <span className="text-sm">Unavailable</span>
//         </div>
//         <div className="flex items-center">
//           <div className="w-4 h-4 rounded-full bg-black mr-2"></div>
//           <span className="text-sm">Selection</span>
//         </div>
//         <div className="flex items-center">
//           <div className="w-4 h-4 rounded-full bg-gray-200 mr-2"></div>
//           <span className="text-sm">Selection range</span>
//         </div>
//       </div>
      
//       {/* JSON output */}
//       {showJSON && dateRanges.length > 0 && (
//         <div className="mt-8">
//           <h3 className="text-lg font-medium mb-2">Saved Date Ranges:</h3>
//           <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
//             <code>{JSON.stringify(dateRanges, null, 2)}</code>
//           </pre>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AvailabilityCalendar;