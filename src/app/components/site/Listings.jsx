'use client'
import react from "react"
import ListingCard from "./ListingCard"
import LoadingSpinner from "./LoadingSpinner"

export default function Listings() {
  const [listings, setListings] = react.useState([])
  const [isLoading, setIsLoading] = react.useState(true)

  react.useEffect(() => {
    async function fetchListings() {
      try {
        const response = await fetch("/json/listingDetails.json")
        const data = await response.json()
        setListings(data.listings)
      } catch (error) {
        console.error("Error fetching listings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchListings()
  }, [])

  return (
    <section className="flex flex-1 flex-col min-h-screen">
      <div className="flex flex-1 flex-col items-center bg-white my-24">
        <div className="flex flex-col-center mb-8 w-full text-center p-4">
          <h1 className="text-4xl font-bold text-center">Listings</h1>
          <p className="mt-4 text-lg text-gray-600">
            This is the listings section built with Next.js and Tailwind CSS.
          </p>
        </div>

        {isLoading ? (
          <div>
            <LoadingSpinner/>
          </div>
        ) : (
          <div id="listings-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full p-4 px-24">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing}/>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}