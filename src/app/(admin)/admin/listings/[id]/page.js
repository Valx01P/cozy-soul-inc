export default async function ListingDetail({ params }) {
  const { id } = await params

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <h1 className="text-2xl font-bold mb-4">Listing Details</h1>
      <p className="text-lg">Viewing listing with ID: {id}</p>
    </div>
  )
}
