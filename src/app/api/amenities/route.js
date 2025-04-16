import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'

/**
 * GET all amenities organized by categories
 * Returns a structured object of categories and their amenities
 */
export async function GET() {
  try {
    // Get all categories
    const { data: categories, error: amenityCategoryError } = await supabase
      .from('amenitiescategories')
      .select('id, name')

    if (amenityCategoryError || !categories) {
      return NextResponse.json({ message: `Error retrieving categories, ${amenityCategoryError.message}` }, { status: 500 })
    }

    const { data: amenities, error: amenityError } = await supabase.from('amenities').select('id, name, svg, amenitiescategories(id, name)')

    if (amenityError || !amenities) {
      return NextResponse.json({ message: `Error retrieving amenities, ${amenityError.message}` }, { status: 500 })
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}