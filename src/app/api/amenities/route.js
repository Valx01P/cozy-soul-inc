// src/app/api/amenities/route.js (FIXED)
import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds (since amenities rarely change)
let amenitiesCache = {
  data: null,
  timestamp: null
};

/**
 * GET all amenities organized by categories
 * Returns a structured object of categories and their amenities
 */
export async function GET() {
  try {
    // Check if we have a valid cached response
    if (amenitiesCache.timestamp && Date.now() - amenitiesCache.timestamp < CACHE_DURATION) {
      if (amenitiesCache.data) {
        return NextResponse.json(amenitiesCache.data, { status: 200 });
      }
    }

    // More efficient query that gets categories with their amenities in a single query
    const { data: categories, error: categoriesError } = await supabase
      .from('amenitiescategories')
      .select(`
        id,
        name,
        amenities (
          id,
          name,
          svg
        )
      `)
      .order('name');

    if (categoriesError) {
      console.error('Error fetching amenity categories:', categoriesError);
      return NextResponse.json({ error: `Error fetching amenity categories: ${categoriesError.message}` }, { status: 500 });
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json({ error: 'No amenity categories found' }, { status: 404 });
    }

    // Process the data more efficiently
    const response = {};

    // Organize amenities by category in a single pass
    categories.forEach(category => {
      if (!category) return;
      
      const categoryName = category.name;
      if (!categoryName) return;
      
      response[categoryName] = [];

      // Add all amenities for this category
      if (category.amenities && Array.isArray(category.amenities)) {
        category.amenities.forEach(amenity => {
          if (!amenity) return;
          
          response[categoryName].push({
            name: amenity.name,
            svg: amenity.svg
          });
        });
      }
    });

    // Update the cache
    amenitiesCache.data = response;
    amenitiesCache.timestamp = Date.now();

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/amenities:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Function to invalidate the amenities cache
 * (Call this when amenities are updated in the database)
 */
export function invalidateAmenitiesCache() {
  amenitiesCache.data = null;
  amenitiesCache.timestamp = null;
}