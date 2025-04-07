// src/app/api/amenities/route.js
import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'

/**
 * GET all amenities organized by categories
 * Returns a structured object of categories and their amenities
 */
export async function GET() {
  try {
    // Get all categories
    const { data: categories, error: acError } = await supabase.from('amenitiescategories').select('id, name')

    if (acError) {
      throw new Error(`Error fetching categories, ${acError.message}`)
    } else if (!categories || categories.length === 0) {
      return NextResponse.json({ message: 'No categories found' }, { status: 404 })
    }

    const { data: amenities, error: aError } = await supabase.from('amenities').select('id, name, svg, amenitiescategories(id, name)')

    if (aError) {
      throw new Error(`Error fetching amenities, ${aError.message}`)
    } else if (!amenities || amenities.length === 0) {
      return NextResponse.json({ message: 'No amenities found' }, { status: 404 })
    }

    const response = {}

    categories.forEach(category => {
      response[category.name] = []
    })

    amenities.forEach(amenity => {
      const categoryName = amenity.amenitiescategories.name
      response[categoryName].push({
        name: amenity.name,
        svg: amenity.svg
      })
    })


    return NextResponse.json(response, {status: 200})

  } catch (error) {
    return NextResponse.json(error.message, { status: 500 })
  }
}