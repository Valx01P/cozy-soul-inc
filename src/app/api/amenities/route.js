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

    if (amenityCategoryError) {
      if (amenityCategoryError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Categories not found' }, { status: 404 })
      }
      return NextResponse.json({ error: `Categories retrieval failed: ${amenityCategoryError.message}` }, { status: 500 })
    }

    const { data: amenities, error: amenityError } = await supabase
      .from('amenities')
      .select('id, name, svg, amenitiescategories(id, name)')

    if (amenityError) {
      if (amenityError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Amenities not found' }, { status: 404 })
      }
      return NextResponse.json({ error: `Amenities retrieval failed: ${amenityError.message}` }, { status: 500 })
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