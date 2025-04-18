'use client';
import react from 'react'
import listingService from '@/app/services/api/listingService';

export default function Listings() {
  const [listings, setListings] = react.useState([]);

  const fetchListings = async () => {
    const fetchedListings = await listingService.getAllListings();
    setListings(fetchedListings);
    console.log(fetchedListings);
  };


  react.useEffect(() => {
    fetchListings();
  }, []);

  return (
    <div>
      <h1>Listings</h1>
      <ul>
        {listings.map((listing) => (
          <li key={listing.id}>{listing.title}</li>
        ))}
      </ul>
    </div>
  )
}