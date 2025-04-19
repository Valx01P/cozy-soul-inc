"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isBefore, 
  addDays, 
  startOfDay,
  isValid,
  parseISO
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  X, 
  AlertTriangle, 
  ArrowRight, 
  Trash, 
  Edit 
} from 'lucide-react';
import usePropertyFormStore from "@/app/stores/propertyFormStore";

// Helper function to safely parse dates from the store
const safeParseDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = parseISO(dateString); // Assumes 'yyyy-MM-dd' format from store
    return isValid(date) ? startOfDay(date) : null;
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return null;
  }
};

export function PricingFormStep() {
  const { priceRanges, updatePriceRanges, addPriceRange, deletePriceRange } = usePropertyFormStore(state => state);

  // Calendar view state
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date())); // Use start of day for consistency
  const [secondMonth, setSecondMonth] = useState(addMonths(currentDate, 1));

  // Date selection state (inclusive start and end)
  const [selectionStart, setSelectionStart] = useState(null); // Date object or null
  const [selectionEnd, setSelectionEnd] = useState(null);     // Date object or null
  const [selectionMode, setSelectionMode] = useState('start'); // 'start' or 'end'

  // Editing state
  const [editingRangeId, setEditingRangeId] = useState(null); // ID of the range being edited

  // Message states
  const [errorMessage, setErrorMessage] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form state for current selection/edit
  const [availability, setAvailability] = useState(true);
  const [customPrice, setCustomPrice] = useState('');

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Today's date (start of day) for disabling past dates
  const today = useMemo(() => startOfDay(new Date()), []);

  // Mobile detection effect
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionStart, selectionEnd, selectionMode, editingRangeId]); // Add editingRangeId to dependencies

  // Clears messages after a delay
  const clearStatusMessageAfterDelay = (delay = 3000) => {
      setTimeout(() => setStatusMessage(null), delay);
  };

  // Update status message based on current selection state
  const updateStatusMessage = () => {
    if (editingRangeId) {
      const rangeBeingEdited = priceRanges.find(r => r.id === editingRangeId);
      if (rangeBeingEdited && selectionStart && selectionEnd) {
          setStatusMessage(`Editing range: ${format(selectionStart, 'MMM d, yyyy')} to ${format(selectionEnd, 'MMM d, yyyy')}. Adjust availability/price below.`);
      }
      return; // Don't show default selection messages when editing
    }

    // Default selection messages
    if (!selectionStart && !selectionEnd) {
      setStatusMessage("Select a start date.");
    } else if (selectionStart && !selectionEnd) {
      setStatusMessage(`Start date selected: ${format(selectionStart, 'MMM d, yyyy')}. Now select an end date.`);
    } else if (!selectionStart && selectionEnd) {
      // This state shouldn't ideally happen with the current flow, but handle defensively
      setStatusMessage(`End date selected: ${format(selectionEnd, 'MMM d, yyyy')}. Now select a start date.`);
    } else if (selectionStart && selectionEnd) {
      setStatusMessage(`Selected range: ${format(selectionStart, 'MMM d, yyyy')} to ${format(selectionEnd, 'MMM d, yyyy')} inclusive. Set availability and price below.`);
    }
  };

  // Navigation functions (ensure they are button type to prevent form submission)
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  // Memoize parsed price ranges for performance
  const parsedPriceRanges = useMemo(() => {
    return priceRanges.map(range => ({
      ...range,
      startDate: safeParseDate(range.startDate),
      endDate: safeParseDate(range.endDate),
    })).filter(range => range.startDate && range.endDate); // Filter out invalid ranges
  }, [priceRanges]);

  // Check if a date is within any saved range (inclusive start and end)
  const getDateStatus = (date) => {
    const normalizedDate = startOfDay(date); // Ensure comparison is at the start of the day
    for (const range of parsedPriceRanges) {
      if (normalizedDate >= range.startDate && normalizedDate <= range.endDate) {
        return {
          inRange: true,
          isAvailable: range.isAvailable,
          price: range.price,
          rangeId: range.id,
          isStart: isSameDay(normalizedDate, range.startDate),
          isEnd: isSameDay(normalizedDate, range.endDate) // Check against inclusive end date
        };
      }
    }
    return { inRange: false };
  };

  // Check if a potential new date range overlaps with existing ranges (excluding the one being edited)
  const checkRangeOverlap = (start, end) => {
    const potentialStart = startOfDay(start);
    const potentialEnd = startOfDay(end);

    for (const range of parsedPriceRanges) {
      // Skip the range we might be currently editing
      if (editingRangeId === range.id) continue;

      // Check for overlap: !(potentialEnd < range.startDate || potentialStart > range.endDate)
      if (!(potentialEnd < range.startDate || potentialStart > range.endDate)) {
        // Overlap detected
        const displayRangeStart = format(range.startDate, 'MMM d, yyyy');
        const displayRangeEnd = format(range.endDate, 'MMM d, yyyy');
        setErrorMessage(`Selection overlaps with existing range: ${displayRangeStart} - ${displayRangeEnd}`);
        return true;
      }
    }
    setErrorMessage(null); // Clear error if no overlap found
    return false; // No overlap
  };

  // Get the details of the range a specific date belongs to
  const getRangeForDate = (date) => {
    const normalizedDate = startOfDay(date);
    return parsedPriceRanges.find(range => 
        normalizedDate >= range.startDate && normalizedDate <= range.endDate
    );
  };

  // Toggle selection mode between start and end
  const toggleSelectionMode = (mode) => {
    setSelectionMode(mode);
    setErrorMessage(null); // Clear errors when toggling mode
  };

  // Handle click on a date cell
  const handleDateClick = (date) => {
    const normalizedDate = startOfDay(date);

    // 1. Check if date is in the past
    if (isBefore(normalizedDate, today)) {
      setErrorMessage("Cannot select dates in the past.");
      return;
    }

    // 2. Check if date is already within a saved range
    const clickedRange = getRangeForDate(normalizedDate);
    if (clickedRange && clickedRange.id !== editingRangeId) {
        // If clicked date is in a range *not* currently being edited, start editing it
        editRangeDetails(clickedRange.id);
        setErrorMessage(null); // Clear any previous error
        return;
    } else if (clickedRange && clickedRange.id === editingRangeId) {
        // If clicked within the range already being edited, do nothing (or potentially clear selection?)
        // For now, do nothing to avoid accidentally clearing the edit state.
         setErrorMessage(null); // Ensure no error shows
        return;
    }

    // 3. Handle new selection logic
    setErrorMessage(null); // Clear any previous error
    setEditingRangeId(null); // Stop editing if selecting a new range

    if (selectionMode === 'start') {
      setSelectionStart(normalizedDate);
      setSelectionEnd(null); // Clear end date when setting a new start
      setSelectionMode('end'); // Automatically switch to end mode
      // Overlap check will happen when end date is selected
    } else { // selectionMode === 'end'
      if (!selectionStart) {
        // If no start date is set, treat this click as a start date selection
        setSelectionStart(normalizedDate);
        setSelectionMode('end'); // Stay in end mode
      } else {
        // We have a start date, now set the end date
        if (isBefore(normalizedDate, selectionStart)) {
          // If the selected end date is before the start date, reset start date and keep end date selection
          setSelectionStart(normalizedDate);
          setSelectionEnd(null);
          setSelectionMode('end'); // Ready to select end date again
           setStatusMessage(`Start date selected: ${format(normalizedDate, 'MMM d, yyyy')}. Now select an end date.`);
        } else {
           // Valid end date selected (same day or after start date)
           if (checkRangeOverlap(selectionStart, normalizedDate)) {
             // Overlap detected, error message is set within checkRangeOverlap
             return;
           }
           setSelectionEnd(normalizedDate);
           // Selection complete, maybe switch back to 'start' or stay 'end' - keeping 'start' for easier new selections
           setSelectionMode('start');
         }
      }
    }
  };

  // Clear current selection and editing state
  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectionMode('start');
    setAvailability(true);
    setCustomPrice('');
    setEditingRangeId(null);
    setErrorMessage(null);
    setStatusMessage("Select a start date."); // Reset status message
  };

  // Prepare to edit an existing range
  const editRangeDetails = (rangeId) => {
    const rangeToEdit = parsedPriceRanges.find(range => range.id === rangeId);
    if (rangeToEdit) {
      setEditingRangeId(rangeId);
      setSelectionStart(rangeToEdit.startDate); // Set selection to visualize
      setSelectionEnd(rangeToEdit.endDate);     // Set selection to visualize
      setAvailability(rangeToEdit.isAvailable);
      setCustomPrice(rangeToEdit.price ? rangeToEdit.price.toString() : '');
      setErrorMessage(null); // Clear any previous errors
      setSelectionMode('start'); // Reset selection mode potentially
      // Status message updated via useEffect
    }
  };

  // Delete a range
  const handleDeleteRange = (rangeId) => {
    if (editingRangeId === rangeId) {
        clearSelection(); // Clear editing state if deleting the range being edited
    }
    deletePriceRange(rangeId);
    setStatusMessage("Range successfully deleted.");
    clearStatusMessageAfterDelay();
  };

  // Validate price input
  const isPriceValid = useMemo(() => {
    if (!availability) return true; // No price needed if unavailable
    return customPrice && !isNaN(parseFloat(customPrice)) && parseFloat(customPrice) >= 0; // Allow 0 price
  }, [availability, customPrice]);


  // Update existing range in the store
  const updateExistingRange = () => {
    if (!editingRangeId || !selectionStart || !selectionEnd) return;

    if (!isPriceValid) {
      setErrorMessage("Please enter a valid price (0 or greater) for available dates.");
      return;
    }

    const updatedRangeData = {
        id: editingRangeId,
        startDate: format(selectionStart, 'yyyy-MM-dd'),
        endDate: format(selectionEnd, 'yyyy-MM-dd'), // Store inclusive end date
        isAvailable: availability,
        price: availability ? parseFloat(customPrice) : 0,
        availability_type: availability ? 'default' : 'blocked'
    };

    // Find the index and update (Zustand handles immutability)
    const currentRanges = usePropertyFormStore.getState().priceRanges;
    const updatedRanges = currentRanges.map(range =>
        range.id === editingRangeId ? { ...range, ...updatedRangeData } : range
    );

    updatePriceRanges(updatedRanges);

    clearSelection();
    setStatusMessage("Price range successfully updated.");
    clearStatusMessageAfterDelay();
  };

  // Add current selection as a new range to the store
  const saveCurrentRange = () => {
    if (!selectionStart || !selectionEnd) {
        setErrorMessage("Please select both a start and an end date.");
        return;
    }

    // Final validation checks before saving
    if (isBefore(selectionEnd, selectionStart)) {
      // This shouldn't happen with the current logic, but double-check
      setErrorMessage("End date cannot be before start date.");
      return;
    }
    if (checkRangeOverlap(selectionStart, selectionEnd)) {
      // Error message is set within checkRangeOverlap
      return;
    }
    if (!isPriceValid) {
      setErrorMessage("Please enter a valid price (0 or greater) for available dates.");
      return;
    }

    const newRange = {
      id: `range-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More robust unique ID
      startDate: format(selectionStart, 'yyyy-MM-dd'),
      endDate: format(selectionEnd, 'yyyy-MM-dd'), // Store inclusive end date
      isAvailable: availability,
      price: availability ? parseFloat(customPrice) : 0,
      availability_type: availability ? 'default' : 'blocked'
    };

    addPriceRange(newRange);

    clearSelection();
    setStatusMessage("New price range successfully added.");
    clearStatusMessageAfterDelay();
  };

  // Check if a date is within the currently selected range (for styling)
  const isInCurrentSelection = (date) => {
    if (!selectionStart) return false;
    const normalizedDate = startOfDay(date);

    if (selectionStart && !selectionEnd) {
      // Only start date is selected
      return isSameDay(normalizedDate, selectionStart);
    }
    if (selectionStart && selectionEnd) {
      // Both start and end are selected
      return normalizedDate >= selectionStart && normalizedDate <= selectionEnd;
    }
    return false;
  };

  // Render the calendar grid for a specific month
  const renderMonth = (monthDate, showMonthTitle = true) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calculate leading empty cells
    const startingDayOfWeek = monthStart.getDay(); // 0 = Sunday, 6 = Saturday
    const emptyCells = Array(startingDayOfWeek).fill(null);

    const allCells = [...emptyCells, ...daysInMonth];

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
              return <div key={`empty-${index}`} className="h-12 rounded-md" />;
            }

            const normalizedDay = startOfDay(day);
            const dateStatus = getDateStatus(normalizedDay);
            const isInSelection = isInCurrentSelection(normalizedDay);
            const isSelectionStartDay = selectionStart && isSameDay(normalizedDay, selectionStart);
            const isSelectionEndDay = selectionEnd && isSameDay(normalizedDay, selectionEnd); // Use inclusive end
            const isTodayDate = isSameDay(normalizedDay, startOfDay(new Date()));
            const isPast = isBefore(normalizedDay, today);
            const isEditingThisRange = editingRangeId === dateStatus.rangeId;

            let cellClass = "h-12 flex flex-col items-center justify-center rounded-md relative transition-all duration-150 text-sm";
            let title = format(normalizedDay, 'MMM d, yyyy');

            // Base styling & Past date handling
            if (isPast) {
              cellClass += " bg-gray-100 text-gray-400 cursor-not-allowed opacity-60";
              title += ' (Past date)';
            } else {
              cellClass += " cursor-pointer";
              // Default background for clickable dates
              cellClass += " bg-white hover:bg-gray-100";
            }
            if (isTodayDate && !isPast) {
                cellClass += " ring-1 ring-blue-400"; // Subtle ring for today
            }

            // Styling for dates within saved ranges
            if (dateStatus.inRange) {
              if (dateStatus.isAvailable) {
                cellClass = cellClass.replace("bg-white hover:bg-gray-100", "bg-green-50 hover:bg-green-100");
              } else {
                cellClass = cellClass.replace("bg-white hover:bg-gray-100", "bg-red-50 hover:bg-red-100 text-gray-600");
                 // Add line-through for unavailable dates
                 cellClass += " line-through";
              }
              // Highlight if part of the range being edited
              if (isEditingThisRange) {
                 cellClass += " ring-2 ring-offset-1 ring-blue-500 z-10";
              }
            }

             // Styling for the currently selected range (overrides saved range background if applicable)
             if (isInSelection && !isPast) {
                if (isSelectionStartDay && isSelectionEndDay) { // Single day selection
                    cellClass = cellClass.replace(/bg-\w+-\d+/g, "bg-blue-200"); // Use a distinct color for single day
                    cellClass += " ring-2 ring-blue-500 z-10";
                } else if (isSelectionStartDay) {
                    cellClass = cellClass.replace(/bg-\w+-\d+/g, "bg-blue-100");
                    cellClass += " rounded-r-none font-semibold"; // Visual cue for start
                } else if (isSelectionEndDay) {
                    cellClass = cellClass.replace(/bg-\w+-\d+/g, "bg-blue-100");
                    cellClass += " rounded-l-none font-semibold"; // Visual cue for end
                } else { // In between selection
                    cellClass = cellClass.replace(/bg-\w+-\d+/g, "bg-blue-50");
                    cellClass += " rounded-none"; // Make inner dates square
                }
             }


            return (
              <div
                key={format(normalizedDay, 'yyyy-MM-dd')}
                className={cellClass}
                onClick={() => !isPast && handleDateClick(normalizedDay)}
                title={title}
              >
                {/* Date number */}
                <span className={`${isSelectionStartDay || isSelectionEndDay ? 'font-bold' : ''} ${isTodayDate ? 'text-blue-600 font-semibold' : ''}`}>
                  {format(normalizedDay, 'd')}
                </span>

                {/* Price indicator for saved available ranges */}
                {dateStatus.inRange && dateStatus.isAvailable && dateStatus.price > 0 && !isInSelection && (
                  <div className="text-xs absolute bottom-0.5 flex items-center justify-center text-gray-600">
                    <DollarSign size={10} className="mr-0.5" />
                    <span>{dateStatus.price}</span>
                  </div>
                )}
                {/* Indicator for $0 price */}
                 {dateStatus.inRange && dateStatus.isAvailable && dateStatus.price === 0 && !isInSelection && (
                  <div className="text-xs absolute bottom-0.5 flex items-center justify-center text-gray-500" title="Available (Free)">
                    <DollarSign size={10} className="mr-0.5 text-green-600" />
                     <span>0</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Sort price ranges by start date for display
  const sortedPriceRanges = useMemo(() => {
    return [...parsedPriceRanges].sort((a, b) => a.startDate - b.startDate);
  }, [parsedPriceRanges]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold leading-7 text-gray-900">Pricing and Availability Calendar</h2>
      <p className="mt-1 text-sm leading-6 text-gray-600">
        Click dates on the calendar to define periods. Set a price per night for available periods or mark them as unavailable. Click an existing range to modify it.
      </p>

      {/* Instructions & Legend Combined */}
      <div className="p-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-md text-sm mb-4 space-y-3">
         <p><strong>How to use:</strong></p>
         <ol className="list-decimal pl-5 space-y-1">
             <li>Use the buttons below to choose if you're selecting a 'Start Date' or 'End Date'.</li>
             <li>Click a date on the calendar for your chosen mode. The calendar will guide you.</li>
             <li>Once a range (start and end) is selected, use the form below the calendar to set availability and price.</li>
             <li>Click 'Save Range' to add it, or 'Update Range' if modifying an existing one.</li>
             <li>Click directly on a colored range on the calendar to load it for editing.</li>
         </ol>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-gray-200 mt-3">
            <span className="font-medium text-xs uppercase text-gray-500 self-center">Legend:</span>
            <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-green-50 mr-1.5 border border-green-200"></div><span className="text-sm">Available</span></div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-red-50 mr-1.5 border border-red-200"></div><span className="text-sm">Unavailable</span></div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-blue-100 mr-1.5 border border-blue-200"></div><span className="text-sm">Selected</span></div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-sm ring-1 ring-blue-400 mr-1.5"></div><span className="text-sm">Today</span></div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-gray-100 mr-1.5 opacity-60"></div><span className="text-sm">Past Date</span></div>
          </div>
      </div>


      {/* Selection mode toggle */}
      <div className="bg-white border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center mb-4 gap-4">
        <span className="font-medium mr-4 text-sm shrink-0">Selection Mode:</span>
        <div className="flex space-x-3">
          <button
            type="button" // Ensure not type="submit"
            onClick={() => toggleSelectionMode('start')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center border transition-colors ${
              selectionMode === 'start'
                ? 'bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-400'
                : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
            }`}
          >
            Select Start Date
          </button>
          <button
            type="button" // Ensure not type="submit"
            onClick={() => toggleSelectionMode('end')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center border transition-colors ${
              selectionMode === 'end'
                ? 'bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-400'
                : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
            }`}
          >
            Select End Date
          </button>
        </div>
      </div>

      {/* Status and Error Messages */}
      {statusMessage && !errorMessage && ( // Only show status if no error
        <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm mb-4 transition-opacity duration-300">
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center mb-4 transition-opacity duration-300">
          <AlertTriangle size={16} className="mr-2 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mb-4">
        <button
          type="button" // Explicitly set type
          onClick={goToPreviousMonth}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
          aria-label="Previous Month"
        >
          <ChevronLeft size={20} />
        </button>
        {/* Display current month(s) */}
        <div className="text-center font-medium text-gray-800">
           {format(currentDate, 'MMMM yyyy')}
           {!isMobile && ` - ${format(secondMonth, 'MMMM yyyy')}`}
        </div>
        <button
          type="button" // Explicitly set type
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
        {renderMonth(currentDate, isMobile)} {/* Show title only if mobile */}

        {/* Render second month only if not mobile */}
        {!isMobile && renderMonth(secondMonth, true)}
      </div>

      {/* Current selection visualization */}
      {(selectionStart || selectionEnd) && (
        <div className="p-4 bg-white border rounded-lg shadow-sm overflow-x-auto mb-6">
          <h4 className="text-base font-medium mb-3 text-gray-700">
            {editingRangeId ? "Editing Range:" : "Selected Range:"}
          </h4>
          <div className="flex items-center justify-center bg-gray-50 p-3 rounded-md min-w-fit space-x-3">
            {/* Start Date Display */}
            <div className={`flex items-center justify-center p-2 rounded-md border text-sm ${
                selectionStart ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}>
              <span className="font-medium">
                {selectionStart ? format(selectionStart, 'MMM d, yyyy') : 'No start date'}
              </span>
            </div>

            <ArrowRight size={16} className="text-gray-400 shrink-0" />

            {/* End Date Display */}
             <div className={`flex items-center justify-center p-2 rounded-md border text-sm ${
                selectionEnd ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}>
              <span className="font-medium">
                {selectionEnd ? format(selectionEnd, 'MMM d, yyyy') : 'No end date'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selection/Editing Form (Only shown when a full range is selected) */}
      {(selectionStart && selectionEnd) && (
        <div className="p-5 border rounded-lg bg-white shadow-sm overflow-visible mb-6 relative">
          {/* Close/Clear button */}
          <button
            type="button"
            onClick={clearSelection}
            className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Clear Selection or Cancel Edit"
            title="Clear Selection or Cancel Edit"
          >
            <X size={20} />
          </button>

          <h4 className="text-lg font-medium text-gray-800 mb-5">
            {editingRangeId ? "Edit Range Details" : "Set Range Details"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Availability Radio Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability for this period
              </label>
              <div className="flex space-x-4">
                <label className={`inline-flex items-center px-3 py-2 rounded-md border cursor-pointer transition-colors ${availability ? 'bg-green-100 border-green-300 ring-1 ring-green-400' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="availability"
                    checked={availability}
                    onChange={() => setAvailability(true)}
                    className="form-radio h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-green-800 font-medium">Available</span>
                </label>
                <label className={`inline-flex items-center px-3 py-2 rounded-md border cursor-pointer transition-colors ${!availability ? 'bg-red-100 border-red-300 ring-1 ring-red-400' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="availability"
                    checked={!availability}
                    onChange={() => setAvailability(false)}
                    className="form-radio h-4 w-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-red-800 font-medium">Unavailable</span>
                </label>
              </div>
            </div>

            {/* Price Input (Conditional) */}
            {availability && (
              <div>
                <label htmlFor="customPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Night
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <DollarSign size={16} className="text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="number"
                    id="customPrice"
                    name="customPrice"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="e.g., 150"
                    min="0" // Allow 0 price
                    step="0.01" // Allow cents if needed
                    className={`block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ${
                      isPriceValid ? 'ring-gray-300 focus:ring-blue-500' : 'ring-red-500 focus:ring-red-600'
                    } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                    aria-describedby="price-description"
                    required={availability} // Required only if available
                  />
                </div>
                 <p className="mt-1 text-xs text-gray-500" id="price-description">
                   Enter 0 for free booking during this period.
                 </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={clearSelection}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>

            {editingRangeId ? (
              <button
                type="button"
                onClick={updateExistingRange}
                disabled={!isPriceValid}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isPriceValid
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Update Range
              </button>
            ) : (
              <button
                type="button"
                onClick={saveCurrentRange}
                 disabled={!isPriceValid}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                   isPriceValid
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Save Range
              </button>
            )}
          </div>
        </div>
      )}


      {/* Saved Price Ranges Table */}
      {sortedPriceRanges.length > 0 && (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
             <h4 className="text-lg font-medium leading-6 text-gray-900">Saved Price Ranges ({sortedPriceRanges.length})</h4>
             <p className="mt-1 max-w-2xl text-sm text-gray-500">Click on a range in the calendar to edit.</p>
          </div>
          <div className="border-t border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Range (Inclusive)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price / Night
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPriceRanges.map(range => (
                  <tr key={range.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {format(range.startDate, 'MMM d, yyyy')} - {format(range.endDate, 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        range.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {range.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {range.isAvailable
                        ? <span className="font-medium text-gray-900 flex items-center"><DollarSign size={14} className="mr-0.5 text-gray-500" />{range.price}</span>
                        : <span className="text-gray-400">-</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       {/* Remove Edit Button - Edit via calendar click */}
                      <button
                        type="button"
                        onClick={() => handleDeleteRange(range.id)}
                        className="text-red-600 hover:text-red-800 inline-flex items-center"
                        title="Delete this range"
                      >
                        <Trash size={14} className="mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {sortedPriceRanges.length === 0 && (
           <div className="text-center py-6 px-4 border border-dashed rounded-md">
               <p className="text-sm text-gray-500">No price ranges defined yet. Select dates on the calendar to create one.</p>
           </div>
       )}

    </div>
  );
}