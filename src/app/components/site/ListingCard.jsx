import Image from "next/image"

/**
 * @typedef {Object} listing
 * @property {Id} id
 * @property {String} title
 * @property {String} description
 * @property {Number} price
 * @property {String} price_description
 * @property {String} location
 * @property {String} main_image
 * @property {Array[Strings]} images
 */

export default function ListingCard({ listing }) {
  if (!listing) {
    return (
      <h1>Error</h1>
    )
  }

  return (
    <div className="cursor-pointer p-2 border rounded my-2 bg-white shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">

      {/* images top of card */}
      <div id="listing-images" className="flex flex-row">
        <div>
          <Image src={listing.main_image} width={800} height={800} alt="main" />
        </div>
        <div className="flex flex-col">
          <div>
            <Image src={listing.images[0]} width={400} height={400} alt="side-image-1" />
          </div>
          <div>
            <Image src={listing.images[1]} width={400} height={400} alt="side-image-2" />
          </div>
        </div>
      </div>

      {/* details bottom of card */}
      <div id="listing-details" className="flex flex-col">
        <h1>{listing.title}</h1>
        <h2>{listing.description}</h2>
        <p>{listing.location}</p>
        <div className="flex flex-row">
          <p>${listing.price} • <span className="text-gray-500">{listing.price_description}</span></p>
        </div>

        {/* <h2 className="text-lg font-bold">Listing Title</h2>
        <p className="text-gray-600">Location or miles away</p>
        <p>Beds or benefit or duration of stay</p>
        <p className="text-gray-500">$100,000</p>
        <p>Time for price or number of days in stay</p> */}
      </div>
    </div>
  );
}