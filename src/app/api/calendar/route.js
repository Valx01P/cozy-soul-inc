// app/api/calendar/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get the URL from the query parameters
    const { searchParams } = new URL(request.url);
    const icalUrl = searchParams.get('url') || 'https://www.airbnb.com.ar/calendar/ical/1396351896197741899.ics?s=c57a55f8e6eee491de25039ddc758b5f';
    
    // Fetch the iCal data
    const response = await fetch(icalUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.text();
    
    // Parse the iCal data
    const events = parseIcal(data);
    
    // Return both raw data and parsed events
    return NextResponse.json({ 
      events,
      rawData: data.slice(0, 1000) + (data.length > 1000 ? '...' : '') // First 1000 chars for preview
    });
  } catch (error) {
    console.error('Error fetching iCal data:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Parse iCal data
function parseIcal(icalData) {
  const events = [];
  const lines = icalData.split(/\r\n|\n|\r/);
  
  let currentEvent = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      events.push(currentEvent);
      currentEvent = null;
    } else if (currentEvent) {
      // Handle line continuation (lines starting with space or tab)
      let completeLine = line;
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        completeLine += lines[i + 1].substring(1);
        i++;
      }
      
      const colonIndex = completeLine.indexOf(':');
      if (colonIndex > 0) {
        const key = completeLine.substring(0, colonIndex);
        const value = completeLine.substring(colonIndex + 1);
        
        // Check for parameters
        const semiIndex = key.indexOf(';');
        const realKey = semiIndex > 0 ? key.substring(0, semiIndex) : key;
        
        // Handle date-time properties
        if (realKey === 'DTSTART' || realKey === 'DTEND') {
          currentEvent[realKey.toLowerCase()] = parseIcalDate(value);
        } else if (realKey === 'SUMMARY') {
          currentEvent.summary = value;
        } else if (realKey === 'DESCRIPTION') {
          currentEvent.description = value;
        } else if (realKey === 'UID') {
          currentEvent.uid = value;
        }
      }
    }
  }
  
  return events;
}

// Parse iCal date format
function parseIcalDate(dateString) {
  // Handle date format: YYYYMMDD or YYYYMMDDTHHMMSSZ
  if (dateString.includes('T')) {
    // Date with time
    const year = parseInt(dateString.substr(0, 4));
    const month = parseInt(dateString.substr(4, 2)) - 1; // JS months are 0-based
    const day = parseInt(dateString.substr(6, 2));
    const hour = parseInt(dateString.substr(9, 2));
    const minute = parseInt(dateString.substr(11, 2));
    const second = parseInt(dateString.substr(13, 2));
    
    if (dateString.endsWith('Z')) {
      // UTC time
      return new Date(Date.UTC(year, month, day, hour, minute, second)).toISOString();
    } else {
      // Local time
      return new Date(year, month, day, hour, minute, second).toISOString();
    }
  } else {
    // Date only
    const year = parseInt(dateString.substr(0, 4));
    const month = parseInt(dateString.substr(4, 2)) - 1; // JS months are 0-based
    const day = parseInt(dateString.substr(6, 2));
    return new Date(year, month, day).toISOString();
  }
}