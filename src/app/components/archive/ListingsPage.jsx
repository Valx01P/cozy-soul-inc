'use client'

import react from 'react'
import ListingCard from './ListingCard'

export default function ListingsPage() {
  const [properties, setProperties] = react.useState([])
  const [loading, setLoading] = react.useState(true)

  react.useEffect(() => {
    async function fetchProperties() {
      setLoading(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/listings`)
        console.log(response)
        const data = await response.json()
        console.log(data)
        setProperties(data.properties)

      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProperties()
  }, [])

  return (
      <div>
        {properties && !loading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {properties.map((property) => (
              <ListingCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
  )
}