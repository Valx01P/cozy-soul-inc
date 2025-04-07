
export default function ListingEmail({
  name,
  email,
  phone,
  message,
  propertyDetails
}) {
  return (
    <div>
      <h2>Inquiry Details</h2>
      <p><strong>Name:</strong> {name}</p>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Phone:</strong> {phone}</p>
      <p><strong>Message:</strong> {message}</p>

      <h3>Listing Details</h3>
      <p><strong>Title:</strong> {propertyDetails.title}</p>
      <img src={propertyDetails.main_image_url} alt={propertyDetails.title} />

      <p><strong>Price:</strong> ${propertyDetails.price}</p>
      <p><strong>Location:</strong> {propertyDetails.location}</p>
      <a href={`${process.env.NEXT_PUBLIC_BASE_URL}/listings/${propertyDetails.id}`}>View Listing</a>
    </div>
  )
}
