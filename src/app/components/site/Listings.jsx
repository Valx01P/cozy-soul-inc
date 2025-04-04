import Listing from "./ListingCard"

export default function Listings() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen p-4">
      <div>
        <h1 className="text-4xl font-bold text-center">Listings</h1>
        <p className="mt-4 text-lg text-gray-600">
          This is the listings section built with Next.js and Tailwind CSS.
        </p>
      </div>

      <div id="listings-grid">
        <Listing />
        <Listing />
        <Listing />
        <Listing />
        <Listing />
        <Listing />
        <Listing />
        <Listing />
      </div>
    </section>
  )
}